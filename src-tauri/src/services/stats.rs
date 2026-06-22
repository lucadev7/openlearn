use std::collections::HashMap;

use chrono::{Duration, Local};
use rusqlite::{params, Connection};

use crate::error::AppResult;
use crate::models::{DayStat, DeckAccuracy, RatingCount, Stats};
use crate::util::{now_epoch, today_local};

/// How many days of daily history to return for the activity chart / heatmap.
const DAILY_WINDOW_DAYS: i64 = 120;
/// Cards with an interval at or above this many days count as "mature".
const MATURE_INTERVAL_DAYS: f64 = 21.0;

pub fn get_stats(conn: &Connection) -> AppResult<Stats> {
    let (total_reviews, total_correct): (i64, i64) = conn.query_row(
        "SELECT COUNT(*), COALESCE(SUM(correct), 0) FROM review_log",
        [],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;

    let active_days: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT date(ts, 'unixepoch', 'localtime')) FROM review_log",
        [],
        |r| r.get(0),
    )?;

    let today = today_local();
    let reviews_today: i64 = conn.query_row(
        "SELECT COUNT(*) FROM review_log WHERE date(ts, 'unixepoch', 'localtime') = ?1",
        params![today],
        |r| r.get(0),
    )?;

    let total_cards: i64 = conn.query_row("SELECT COUNT(*) FROM card", [], |r| r.get(0))?;
    let suspended_cards: i64 =
        conn.query_row("SELECT COUNT(*) FROM card WHERE suspended = 1", [], |r| r.get(0))?;
    let total_decks: i64 = conn.query_row("SELECT COUNT(*) FROM deck", [], |r| r.get(0))?;

    let new_cards: i64 =
        conn.query_row("SELECT COUNT(*) FROM schedule WHERE state = 'new'", [], |r| {
            r.get(0)
        })?;
    let mature_cards: i64 = conn.query_row(
        "SELECT COUNT(*) FROM schedule WHERE state != 'new' AND interval_days >= ?1",
        params![MATURE_INTERVAL_DAYS],
        |r| r.get(0),
    )?;
    let young_cards: i64 = conn.query_row(
        "SELECT COUNT(*) FROM schedule WHERE state != 'new' AND interval_days < ?1",
        params![MATURE_INTERVAL_DAYS],
        |r| r.get(0),
    )?;

    let xp_total: i64 =
        conn.query_row("SELECT COALESCE(SUM(amount), 0) FROM xp_ledger", [], |r| r.get(0))?;

    let mut ratings = RatingCount::default();
    {
        let mut stmt = conn.prepare("SELECT rating, COUNT(*) FROM review_log GROUP BY rating")?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        for row in rows {
            let (rating, count) = row?;
            match rating.as_str() {
                "again" => ratings.again = count,
                "hard" => ratings.hard = count,
                "good" => ratings.good = count,
                "easy" => ratings.easy = count,
                _ => {}
            }
        }
    }

    // Daily activity: collect days that have data, then emit a continuous
    // series ending today so the frontend can render gaps as empty cells.
    let cutoff = now_epoch() - DAILY_WINDOW_DAYS * 86_400;
    let mut by_day: HashMap<String, (i64, i64)> = HashMap::new();
    {
        let mut stmt = conn.prepare(
            "SELECT date(ts, 'unixepoch', 'localtime') AS d, COUNT(*), COALESCE(SUM(correct), 0)
             FROM review_log WHERE ts >= ?1 GROUP BY d",
        )?;
        let rows = stmt.query_map(params![cutoff], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?, r.get::<_, i64>(2)?))
        })?;
        for row in rows {
            let (d, reviews, correct) = row?;
            by_day.insert(d, (reviews, correct));
        }
    }
    let mut daily = Vec::with_capacity(DAILY_WINDOW_DAYS as usize);
    let start = Local::now().date_naive() - Duration::days(DAILY_WINDOW_DAYS - 1);
    for i in 0..DAILY_WINDOW_DAYS {
        let key = (start + Duration::days(i)).format("%Y-%m-%d").to_string();
        let (reviews, correct) = by_day.get(&key).copied().unwrap_or((0, 0));
        daily.push(DayStat { day: key, reviews, correct });
    }

    let mut by_deck = Vec::new();
    {
        let mut stmt = conn.prepare(
            "SELECT d.id, d.name, COUNT(rl.id), COALESCE(SUM(rl.correct), 0)
             FROM review_log rl
             JOIN card c ON c.id = rl.card_id
             JOIN deck d ON d.id = c.deck_id
             GROUP BY d.id
             HAVING COUNT(rl.id) > 0
             ORDER BY COUNT(rl.id) DESC
             LIMIT 12",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok(DeckAccuracy {
                deck_id: r.get(0)?,
                name: r.get(1)?,
                reviews: r.get(2)?,
                correct: r.get(3)?,
            })
        })?;
        for row in rows {
            by_deck.push(row?);
        }
    }

    Ok(Stats {
        total_reviews,
        total_correct,
        reviews_today,
        active_days,
        total_cards,
        total_decks,
        new_cards,
        young_cards,
        mature_cards,
        suspended_cards,
        xp_total,
        daily,
        ratings,
        by_deck,
    })
}
