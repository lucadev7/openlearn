use std::path::Path;

use rusqlite::{params, Connection, OptionalExtension};

use crate::error::AppResult;

const MIGRATIONS: &[(i64, &str)] = &[
    (1, include_str!("../../migrations/0001_init.sql")),
    (2, include_str!("../../migrations/0002_shop.sql")),
];

pub fn open(path: &Path) -> AppResult<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);")?;

    let current: i64 = conn
        .query_row("SELECT value FROM meta WHERE key='schema_version'", [], |r| {
            r.get::<_, String>(0)
        })
        .optional()?
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    for (version, sql) in MIGRATIONS {
        if *version > current {
            conn.execute_batch(sql)?;
            conn.execute(
                "INSERT INTO meta(key, value) VALUES('schema_version', ?1)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![version.to_string()],
            )?;
        }
    }
    Ok(())
}

pub fn meta_get(conn: &Connection, key: &str) -> AppResult<Option<String>> {
    Ok(conn
        .query_row("SELECT value FROM meta WHERE key=?1", params![key], |r| {
            r.get::<_, String>(0)
        })
        .optional()?)
}

pub fn meta_set(conn: &Connection, key: &str, value: &str) -> AppResult<()> {
    conn.execute(
        "INSERT INTO meta(key, value) VALUES(?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}
