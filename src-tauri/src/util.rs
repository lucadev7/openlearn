use chrono::{Duration, Local, Utc};

pub fn now_epoch() -> i64 {
    Utc::now().timestamp()
}

pub fn today_local() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

pub fn yesterday_local() -> String {
    (Local::now() - Duration::days(1))
        .format("%Y-%m-%d")
        .to_string()
}

pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}
