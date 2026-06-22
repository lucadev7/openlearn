use rusqlite::Connection;

use crate::error::AppResult;
use crate::models::Achievement;
use crate::services::gamification::level_for_xp;

/// Minimum number of reviews before the accuracy badge can be earned, so a
/// single lucky answer can't unlock it.
const ACCURACY_MIN_REVIEWS: i64 = 50;

struct Metrics {
    total_reviews: i64,
    accuracy_value: i64,
    streak_longest: i64,
    level: i64,
    total_decks: i64,
    total_cards: i64,
    mature_cards: i64,
    best_day: i64,
    active_days: i64,
}

fn gather(conn: &Connection) -> AppResult<Metrics> {
    let (total_reviews, total_correct): (i64, i64) = conn.query_row(
        "SELECT COUNT(*), COALESCE(SUM(correct), 0) FROM review_log",
        [],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;

    let accuracy_pct = if total_reviews > 0 {
        ((total_correct as f64 / total_reviews as f64) * 100.0).round() as i64
    } else {
        0
    };
    // Only count accuracy once there is a meaningful sample.
    let accuracy_value = if total_reviews >= ACCURACY_MIN_REVIEWS {
        accuracy_pct
    } else {
        0
    };

    let (xp, streak_longest): (i64, i64) = conn.query_row(
        "SELECT xp, streak_longest FROM profile WHERE id = 1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;

    let total_decks: i64 = conn.query_row("SELECT COUNT(*) FROM deck", [], |r| r.get(0))?;
    let total_cards: i64 = conn.query_row("SELECT COUNT(*) FROM card", [], |r| r.get(0))?;
    let mature_cards: i64 = conn.query_row(
        "SELECT COUNT(*) FROM schedule WHERE state != 'new' AND interval_days >= 21",
        [],
        |r| r.get(0),
    )?;
    let best_day: i64 = conn.query_row(
        "SELECT COALESCE(MAX(c), 0) FROM
            (SELECT COUNT(*) AS c FROM review_log
             GROUP BY date(ts, 'unixepoch', 'localtime'))",
        [],
        |r| r.get(0),
    )?;
    let active_days: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT date(ts, 'unixepoch', 'localtime')) FROM review_log",
        [],
        |r| r.get(0),
    )?;

    Ok(Metrics {
        total_reviews,
        accuracy_value,
        streak_longest,
        level: level_for_xp(xp),
        total_decks,
        total_cards,
        mature_cards,
        best_day,
        active_days,
    })
}

fn ach(
    id: &str,
    title: &str,
    description: &str,
    icon: &str,
    tier: &str,
    value: i64,
    target: i64,
) -> Achievement {
    Achievement {
        id: id.to_string(),
        title: title.to_string(),
        description: description.to_string(),
        icon: icon.to_string(),
        tier: tier.to_string(),
        progress: value.min(target).max(0),
        target,
        unlocked: value >= target,
    }
}

pub fn list(conn: &Connection) -> AppResult<Vec<Achievement>> {
    let m = gather(conn)?;
    Ok(vec![
        ach("first-review", "Erste Karte", "Wiederhole deine erste Karte.", "Footprints", "bronze", m.total_reviews, 1),
        ach("reviews-100", "Hundert Wiederholungen", "100 Karten wiederholt.", "Dumbbell", "bronze", m.total_reviews, 100),
        ach("reviews-1000", "Im Flow", "1.000 Karten wiederholt.", "Flame", "silver", m.total_reviews, 1000),
        ach("reviews-5000", "Lern-Maschine", "5.000 Karten wiederholt.", "Rocket", "gold", m.total_reviews, 5000),
        ach("streak-3", "Dranbleiber", "3 Tage Streak am Stück.", "CalendarClock", "bronze", m.streak_longest, 3),
        ach("streak-7", "Wochenstreak", "7 Tage Streak am Stück.", "CalendarCheck", "silver", m.streak_longest, 7),
        ach("streak-30", "Monatsstreak", "30 Tage Streak am Stück.", "CalendarHeart", "gold", m.streak_longest, 30),
        ach("accuracy-90", "Scharfschütze", "≥ 90 % Trefferquote (ab 50 Wdh.).", "Target", "silver", m.accuracy_value, 90),
        ach("level-5", "Aufgestiegen", "Erreiche Level 5.", "TrendingUp", "bronze", m.level, 5),
        ach("level-10", "Profi", "Erreiche Level 10.", "Crown", "gold", m.level, 10),
        ach("decks-5", "Sammler", "Lege 5 Decks an.", "Library", "bronze", m.total_decks, 5),
        ach("cards-100", "Wissensbasis", "100 Karten angelegt oder importiert.", "Layers", "silver", m.total_cards, 100),
        ach("mature-50", "Langzeitgedächtnis", "50 Karten gereift (Intervall ≥ 21 Tage).", "Brain", "gold", m.mature_cards, 50),
        ach("bestday-50", "Power-Session", "50 Wiederholungen an einem Tag.", "Zap", "silver", m.best_day, 50),
        ach("active-30", "Gewohnheit", "An 30 verschiedenen Tagen gelernt.", "CalendarDays", "silver", m.active_days, 30),
    ])
}
