use std::path::Path;

use rusqlite::backup::Progress;
use rusqlite::{Connection, DatabaseName};

use crate::error::{AppError, AppResult};

/// Write a consistent snapshot of the live database to `path` using SQLite's
/// online backup API (safe while the WAL connection stays open).
pub fn backup(conn: &Connection, path: &str) -> AppResult<()> {
    if Path::new(path).exists() {
        std::fs::remove_file(path)
            .map_err(|e| AppError::Other(format!("Zieldatei ist nicht überschreibbar: {e}")))?;
    }
    conn.backup(DatabaseName::Main, path, None)?;
    Ok(())
}

/// Replace the live database with the contents of a backup file. The file is
/// validated to look like an OpenLearn database before anything is overwritten.
pub fn restore(conn: &mut Connection, path: &str) -> AppResult<()> {
    validate(path)?;
    conn.restore(DatabaseName::Main, path, None::<fn(Progress)>)?;
    Ok(())
}

fn validate(path: &str) -> AppResult<()> {
    if !Path::new(path).exists() {
        return Err(AppError::Invalid("Backup-Datei wurde nicht gefunden.".into()));
    }
    let src = Connection::open(path)
        .map_err(|e| AppError::Invalid(format!("Keine gültige Datenbank: {e}")))?;
    let tables: i64 = src
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master
             WHERE type = 'table' AND name IN ('profile', 'card', 'deck', 'schedule')",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);
    if tables < 4 {
        return Err(AppError::Invalid(
            "Die Datei ist kein gültiges OpenLearn-Backup.".into(),
        ));
    }
    Ok(())
}
