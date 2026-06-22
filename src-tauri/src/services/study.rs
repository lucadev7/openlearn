use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::error::{AppError, AppResult};
use crate::models::{CardRaw, ReviewOutcome, Schedule, StudyCard};
use crate::scheduler::{Rating, Scheduler, Sm2};
use crate::services::gamification;
use crate::util::now_epoch;

const STUDY_COLS: &str = "c.id, c.deck_id, c.type, c.prompt_md, c.explanation_md, c.payload_json,
    c.difficulty, c.origin, c.suspended, c.created_at, c.updated_at,
    s.due, s.state, s.reps, s.lapses, s.ease, s.interval_days, s.last_review";

fn map_study(r: &Row) -> rusqlite::Result<(CardRaw, Schedule)> {
    let raw = CardRaw {
        id: r.get(0)?,
        deck_id: r.get(1)?,
        card_type: r.get(2)?,
        prompt_md: r.get(3)?,
        explanation_md: r.get(4)?,
        payload_json: r.get(5)?,
        difficulty: r.get(6)?,
        origin: r.get(7)?,
        suspended: r.get::<_, i64>(8)? != 0,
        created_at: r.get(9)?,
        updated_at: r.get(10)?,
    };
    let schedule = Schedule {
        card_id: raw.id.clone(),
        due: r.get(11)?,
        state: r.get(12)?,
        reps: r.get(13)?,
        lapses: r.get(14)?,
        ease: r.get(15)?,
        interval_days: r.get(16)?,
        last_review: r.get(17)?,
    };
    Ok((raw, schedule))
}

fn push_rows(
    out: &mut Vec<StudyCard>,
    rows: impl Iterator<Item = rusqlite::Result<(CardRaw, Schedule)>>,
) -> AppResult<()> {
    for row in rows {
        let (raw, schedule) = row?;
        let is_new = schedule.state == "new";
        out.push(StudyCard {
            card: raw.into_card()?,
            schedule,
            is_new,
        });
    }
    Ok(())
}

pub fn get_queue(
    conn: &Connection,
    deck_id: Option<String>,
    new_limit: i64,
) -> AppResult<Vec<StudyCard>> {
    let now = now_epoch();
    let mut out = Vec::new();

    let due_sql = format!(
        "SELECT {STUDY_COLS} FROM card c JOIN schedule s ON s.card_id = c.id
         WHERE c.suspended = 0 AND s.state != 'new' AND s.due <= ?1
            AND (?2 IS NULL OR c.deck_id = ?2)
         ORDER BY s.due LIMIT 300"
    );
    {
        let mut stmt = conn.prepare(&due_sql)?;
        let rows = stmt.query_map(params![now, deck_id], map_study)?;
        push_rows(&mut out, rows)?;
    }

    if new_limit > 0 {
        let new_sql = format!(
            "SELECT {STUDY_COLS} FROM card c JOIN schedule s ON s.card_id = c.id
             WHERE c.suspended = 0 AND s.state = 'new'
                AND (?1 IS NULL OR c.deck_id = ?1)
             ORDER BY c.created_at LIMIT ?2"
        );
        let mut stmt = conn.prepare(&new_sql)?;
        let rows = stmt.query_map(params![deck_id, new_limit], map_study)?;
        push_rows(&mut out, rows)?;
    }

    Ok(out)
}

fn load_schedule(conn: &Connection, card_id: &str) -> AppResult<Schedule> {
    conn.query_row(
        "SELECT card_id, due, state, reps, lapses, ease, interval_days, last_review
         FROM schedule WHERE card_id = ?1",
        params![card_id],
        |r| {
            Ok(Schedule {
                card_id: r.get(0)?,
                due: r.get(1)?,
                state: r.get(2)?,
                reps: r.get(3)?,
                lapses: r.get(4)?,
                ease: r.get(5)?,
                interval_days: r.get(6)?,
                last_review: r.get(7)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("Schedule {card_id}")))
}

pub fn submit_review(
    conn: &mut Connection,
    card_id: &str,
    rating: Rating,
) -> AppResult<ReviewOutcome> {
    let now = now_epoch();
    let tx = conn.transaction()?;

    let current = load_schedule(&tx, card_id)?;
    let next = Sm2.next(&current, rating, now);

    tx.execute(
        "UPDATE schedule SET due = ?2, state = ?3, reps = ?4, lapses = ?5, ease = ?6,
            interval_days = ?7, last_review = ?8
         WHERE card_id = ?1",
        params![
            card_id,
            next.due,
            next.state,
            next.reps,
            next.lapses,
            next.ease,
            next.interval_days,
            next.last_review
        ],
    )?;

    let difficulty: i64 =
        tx.query_row("SELECT difficulty FROM card WHERE id = ?1", params![card_id], |r| {
            r.get(0)
        })?;

    tx.execute(
        "INSERT INTO review_log (card_id, ts, rating, correct, interval_days, ease)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            card_id,
            now,
            rating.as_str(),
            rating.is_correct() as i64,
            next.interval_days,
            next.ease
        ],
    )?;

    let (xp_awarded, leveled_up) = gamification::award_for_review(&tx, rating, difficulty, now)?;
    let profile = gamification::get_profile(&tx, now)?;

    tx.commit()?;

    Ok(ReviewOutcome {
        schedule: next,
        xp_awarded,
        leveled_up,
        profile,
    })
}
