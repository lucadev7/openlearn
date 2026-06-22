use rusqlite::Connection;

use crate::db;
use crate::error::AppResult;
use crate::models::Settings;

pub fn get(conn: &Connection) -> AppResult<Settings> {
    match db::meta_get(conn, "app_settings")? {
        Some(json) => Ok(serde_json::from_str(&json).unwrap_or_default()),
        None => Ok(Settings::default()),
    }
}

pub fn set(conn: &Connection, settings: &Settings) -> AppResult<()> {
    db::meta_set(conn, "app_settings", &serde_json::to_string(settings)?)
}
