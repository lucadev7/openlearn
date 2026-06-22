use serde::Deserialize;

use crate::models::Schedule;

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Rating {
    Again,
    Hard,
    Good,
    Easy,
}

impl Rating {
    fn quality(self) -> f64 {
        match self {
            Rating::Again => 1.0,
            Rating::Hard => 3.0,
            Rating::Good => 4.0,
            Rating::Easy => 5.0,
        }
    }

    pub fn is_correct(self) -> bool {
        !matches!(self, Rating::Again)
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Rating::Again => "again",
            Rating::Hard => "hard",
            Rating::Good => "good",
            Rating::Easy => "easy",
        }
    }
}

pub trait Scheduler {
    fn next(&self, current: &Schedule, rating: Rating, now: i64) -> Schedule;
}

const SECS_PER_DAY: f64 = 86_400.0;
const MIN_EASE: f64 = 1.3;
const RELEARN_SECS: i64 = 600;

pub struct Sm2;

impl Scheduler for Sm2 {
    fn next(&self, current: &Schedule, rating: Rating, now: i64) -> Schedule {
        let mut s = current.clone();
        s.last_review = Some(now);

        if !rating.is_correct() {
            s.reps = 0;
            s.lapses += 1;
            s.interval_days = 0.0;
            s.state = "learning".to_string();
            s.due = now + RELEARN_SECS;
            s.ease = (s.ease - 0.2).max(MIN_EASE);
            return s;
        }

        let q = rating.quality();
        s.ease = (s.ease + (0.1 - (5.0 - q) * (0.08 + (5.0 - q) * 0.02))).max(MIN_EASE);

        let next_interval = if s.reps == 0 {
            match rating {
                Rating::Easy => 4.0,
                _ => 1.0,
            }
        } else if s.reps == 1 {
            6.0
        } else {
            let base = s.interval_days.max(1.0);
            let factor = match rating {
                Rating::Hard => 1.2,
                Rating::Easy => s.ease * 1.3,
                _ => s.ease,
            };
            (base * factor).round()
        };

        s.interval_days = next_interval.max(1.0);
        s.reps += 1;
        s.state = "review".to_string();
        s.due = now + (s.interval_days * SECS_PER_DAY) as i64;
        s
    }
}
