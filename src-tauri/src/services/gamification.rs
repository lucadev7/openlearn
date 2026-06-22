use rusqlite::{params, Connection};

use crate::error::AppResult;
use crate::models::ProfileView;
use crate::scheduler::Rating;
use crate::services::settings;
use crate::util::{today_local, yesterday_local};

pub fn xp_to_reach(level: i64) -> i64 {
    (100.0 * ((level - 1).max(0) as f64).powf(1.5)).floor() as i64
}

pub fn level_for_xp(xp: i64) -> i64 {
    let mut level = 1;
    while xp_to_reach(level + 1) <= xp {
        level += 1;
    }
    level
}

pub fn level_title(level: i64) -> String {
    match level {
        1..=2 => "Azubi",
        3..=5 => "Junior",
        6..=9 => "Entwickler:in",
        10..=14 => "Senior",
        15..=19 => "Lead",
        _ => "Profi",
    }
    .to_string()
}

pub fn award_for_review(
    conn: &Connection,
    rating: Rating,
    difficulty: i64,
    now: i64,
) -> AppResult<(i64, bool)> {
    let base = match rating {
        Rating::Again => 2,
        Rating::Hard => 6,
        Rating::Good => 10,
        Rating::Easy => 8,
    };
    let xp = base + difficulty.clamp(0, 4);

    let (old_xp, last_day, reviews_today, reviews_day, streak_cur, streak_long, old_coins): (
        i64,
        Option<String>,
        i64,
        Option<String>,
        i64,
        i64,
        i64,
    ) = conn.query_row(
        "SELECT xp, last_active_day, reviews_today, reviews_day, streak_current, streak_longest, coins
         FROM profile WHERE id = 1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?)),
    )?;

    let today = today_local();
    let yesterday = yesterday_local();
    let new_xp = old_xp + xp;

    // Coins mirror earned XP, with a bonus on level-up. Cosmetic spending only.
    let leveled_up = level_for_xp(new_xp) > level_for_xp(old_xp);
    let coins_earned = xp + if leveled_up { 50 * level_for_xp(new_xp) } else { 0 };
    let new_coins = old_coins + coins_earned;

    let reviews_today_new = if reviews_day.as_deref() == Some(today.as_str()) {
        reviews_today + 1
    } else {
        1
    };

    let streak_cur_new = if last_day.as_deref() == Some(today.as_str()) {
        streak_cur.max(1)
    } else if last_day.as_deref() == Some(yesterday.as_str()) {
        streak_cur + 1
    } else {
        1
    };
    let streak_long_new = streak_long.max(streak_cur_new);

    conn.execute(
        "UPDATE profile SET xp = ?1, last_active_day = ?2, reviews_today = ?3, reviews_day = ?4,
            streak_current = ?5, streak_longest = ?6, coins = ?7
         WHERE id = 1",
        params![new_xp, today, reviews_today_new, today, streak_cur_new, streak_long_new, new_coins],
    )?;
    conn.execute(
        "INSERT INTO xp_ledger (ts, source, amount) VALUES (?1, 'review', ?2)",
        params![now, xp],
    )?;

    Ok((xp, leveled_up))
}

pub fn get_profile(conn: &Connection, now: i64) -> AppResult<ProfileView> {
    let (xp, coins, streak_cur, streak_long, reviews_today, reviews_day): (
        i64,
        i64,
        i64,
        i64,
        i64,
        Option<String>,
    ) = conn.query_row(
        "SELECT xp, coins, streak_current, streak_longest, reviews_today, reviews_day
         FROM profile WHERE id = 1",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?)),
    )?;

    let today = today_local();
    let reviews_today = if reviews_day.as_deref() == Some(today.as_str()) {
        reviews_today
    } else {
        0
    };

    let level = level_for_xp(xp);
    let xp_into_level = xp - xp_to_reach(level);
    let xp_for_next_level = xp_to_reach(level + 1) - xp_to_reach(level);

    let due_today: i64 = conn.query_row(
        "SELECT COUNT(*) FROM schedule s JOIN card c ON c.id = s.card_id
         WHERE c.suspended = 0 AND ((s.state != 'new' AND s.due <= ?1) OR s.state = 'new')",
        params![now],
        |r| r.get(0),
    )?;

    let daily_goal = settings::get(conn)?.daily_goal;

    Ok(ProfileView {
        xp,
        level,
        level_title: level_title(level),
        xp_into_level,
        xp_for_next_level,
        coins,
        streak_current: streak_cur,
        streak_longest: streak_long,
        reviews_today,
        daily_goal,
        due_today,
    })
}
