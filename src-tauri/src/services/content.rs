use std::collections::{HashMap, HashSet};

use rusqlite::{params, Connection, OptionalExtension, Row};
use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::models::{
    Card, CardInput, CardRaw, Deck, DeckWithCounts, ImportSummary, Pack, PackCard, PackDeck,
    PackManifest,
};
use crate::util::{new_id, now_epoch};

fn map_card_raw(r: &Row) -> rusqlite::Result<CardRaw> {
    Ok(CardRaw {
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
    })
}

const CARD_COLS: &str =
    "id, deck_id, type, prompt_md, explanation_md, payload_json, difficulty, origin, suspended, created_at, updated_at";

pub fn list_decks(conn: &Connection) -> AppResult<Vec<DeckWithCounts>> {
    let now = now_epoch();
    let mut stmt = conn.prepare(
        "SELECT d.id, d.parent_id, d.name, d.taxonomy_code, d.area, d.position,
            (SELECT COUNT(*) FROM card c WHERE c.deck_id = d.id AND c.suspended = 0) AS total,
            (SELECT COUNT(*) FROM card c JOIN schedule s ON s.card_id = c.id
                WHERE c.deck_id = d.id AND c.suspended = 0 AND s.state != 'new' AND s.due <= ?1) AS due,
            (SELECT COUNT(*) FROM card c JOIN schedule s ON s.card_id = c.id
                WHERE c.deck_id = d.id AND c.suspended = 0 AND s.state = 'new') AS new_count
         FROM deck d
         ORDER BY d.position, d.name",
    )?;
    let rows = stmt.query_map(params![now], |r| {
        Ok(DeckWithCounts {
            id: r.get(0)?,
            parent_id: r.get(1)?,
            name: r.get(2)?,
            taxonomy_code: r.get(3)?,
            area: r.get(4)?,
            position: r.get(5)?,
            total: r.get(6)?,
            due: r.get(7)?,
            new_count: r.get(8)?,
        })
    })?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

pub fn get_deck(conn: &Connection, id: &str) -> AppResult<Deck> {
    conn.query_row(
        "SELECT id, parent_id, name, taxonomy_code, area, position, created_at, updated_at
         FROM deck WHERE id = ?1",
        params![id],
        |r| {
            Ok(Deck {
                id: r.get(0)?,
                parent_id: r.get(1)?,
                name: r.get(2)?,
                taxonomy_code: r.get(3)?,
                area: r.get(4)?,
                position: r.get(5)?,
                created_at: r.get(6)?,
                updated_at: r.get(7)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("Deck {id}")))
}

pub fn create_deck(conn: &Connection, name: &str, parent_id: Option<String>) -> AppResult<Deck> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::Invalid("Deck-Name darf nicht leer sein.".into()));
    }
    if let Some(p) = &parent_id {
        get_deck(conn, p)?;
    }
    let id = new_id();
    let t = now_epoch();
    let position: i64 = conn.query_row(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM deck WHERE parent_id IS ?1",
        params![parent_id],
        |r| r.get(0),
    )?;
    conn.execute(
        "INSERT INTO deck (id, parent_id, name, taxonomy_code, area, position, created_at, updated_at)
         VALUES (?1, ?2, ?3, NULL, NULL, ?4, ?5, ?5)",
        params![id, parent_id, name, position, t],
    )?;
    get_deck(conn, &id)
}

pub fn rename_deck(conn: &Connection, id: &str, name: &str) -> AppResult<Deck> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::Invalid("Deck-Name darf nicht leer sein.".into()));
    }
    let n = conn.execute(
        "UPDATE deck SET name = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, name, now_epoch()],
    )?;
    if n == 0 {
        return Err(AppError::NotFound(format!("Deck {id}")));
    }
    get_deck(conn, id)
}

pub fn delete_deck(conn: &Connection, id: &str) -> AppResult<()> {
    let n = conn.execute("DELETE FROM deck WHERE id = ?1", params![id])?;
    if n == 0 {
        return Err(AppError::NotFound(format!("Deck {id}")));
    }
    Ok(())
}

pub fn list_cards(conn: &Connection, deck_id: &str) -> AppResult<Vec<Card>> {
    let sql = format!("SELECT {CARD_COLS} FROM card WHERE deck_id = ?1 ORDER BY created_at");
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params![deck_id], map_card_raw)?;
    let mut out = Vec::new();
    for raw in rows {
        out.push(raw?.into_card()?);
    }
    Ok(out)
}

pub fn get_card(conn: &Connection, id: &str) -> AppResult<Card> {
    let sql = format!("SELECT {CARD_COLS} FROM card WHERE id = ?1");
    let raw = conn
        .query_row(&sql, params![id], map_card_raw)
        .optional()?
        .ok_or_else(|| AppError::NotFound(format!("Card {id}")))?;
    raw.into_card()
}

/// A random sample of auto-gradable cards for a timed test. Does not touch the
/// spaced-repetition schedule — tests are a standalone snapshot of knowledge.
pub fn random_exam(conn: &Connection, deck_id: Option<String>, count: i64) -> AppResult<Vec<Card>> {
    let count = count.clamp(1, 100);
    let sql = format!(
        "SELECT {CARD_COLS} FROM card
         WHERE suspended = 0
           AND type IN ('single', 'multi', 'truefalse', 'cloze', 'numeric')
           AND (?1 IS NULL OR deck_id = ?1)
         ORDER BY RANDOM() LIMIT ?2"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params![deck_id, count], map_card_raw)?;
    let mut out = Vec::new();
    for raw in rows {
        out.push(raw?.into_card()?);
    }
    Ok(out)
}

pub fn upsert_card(conn: &Connection, input: CardInput) -> AppResult<Card> {
    if input.prompt_md.trim().is_empty() {
        return Err(AppError::Invalid("Der Fragetext darf nicht leer sein.".into()));
    }
    get_deck(conn, &input.deck_id)?;

    let t = now_epoch();
    let payload_str = serde_json::to_string(&input.payload)?;
    let difficulty = input.difficulty.unwrap_or(2).clamp(0, 4);

    let id = match input.id {
        Some(existing) => {
            let n = conn.execute(
                "UPDATE card SET deck_id = ?2, type = ?3, prompt_md = ?4, explanation_md = ?5,
                    payload_json = ?6, difficulty = ?7, updated_at = ?8
                 WHERE id = ?1",
                params![
                    existing,
                    input.deck_id,
                    input.card_type,
                    input.prompt_md,
                    input.explanation_md,
                    payload_str,
                    difficulty,
                    t
                ],
            )?;
            if n == 0 {
                return Err(AppError::NotFound(format!("Card {existing}")));
            }
            existing
        }
        None => {
            let id = new_id();
            conn.execute(
                "INSERT INTO card (id, deck_id, type, prompt_md, explanation_md, payload_json,
                    difficulty, origin, suspended, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'user', 0, ?8, ?8)",
                params![
                    id,
                    input.deck_id,
                    input.card_type,
                    input.prompt_md,
                    input.explanation_md,
                    payload_str,
                    difficulty,
                    t
                ],
            )?;
            conn.execute(
                "INSERT INTO schedule (card_id, due, state, reps, lapses, ease, interval_days, last_review)
                 VALUES (?1, ?2, 'new', 0, 0, 2.5, 0, NULL)",
                params![id, t],
            )?;
            id
        }
    };
    get_card(conn, &id)
}

pub fn set_suspended(conn: &Connection, id: &str, suspended: bool) -> AppResult<()> {
    let n = conn.execute(
        "UPDATE card SET suspended = ?2, updated_at = ?3 WHERE id = ?1",
        params![id, suspended as i64, now_epoch()],
    )?;
    if n == 0 {
        return Err(AppError::NotFound(format!("Card {id}")));
    }
    Ok(())
}

pub fn delete_card(conn: &Connection, id: &str) -> AppResult<()> {
    let n = conn.execute("DELETE FROM card WHERE id = ?1", params![id])?;
    if n == 0 {
        return Err(AppError::NotFound(format!("Card {id}")));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Content packs: export / import shareable decks.
// ---------------------------------------------------------------------------

/// Bundled example pack, embedded at compile time so users can try the app
/// immediately without writing any cards first.
const EXAMPLE_CONTENT: &str = include_str!("../../../content/example/content.json");
const EXAMPLE_MANIFEST: &str = include_str!("../../../content/example/manifest.json");

fn all_decks_flat(conn: &Connection) -> AppResult<Vec<(String, Option<String>, String)>> {
    let mut stmt = conn.prepare("SELECT id, parent_id, name FROM deck ORDER BY position, name")?;
    let rows = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

/// The selected root decks plus all of their descendants.
fn with_descendants(
    all: &[(String, Option<String>, String)],
    roots: &[String],
) -> Vec<(String, Option<String>, String)> {
    let mut keep: HashSet<String> = roots.iter().cloned().collect();
    loop {
        let mut added = false;
        for (id, parent, _) in all {
            if let Some(p) = parent {
                if keep.contains(p) && !keep.contains(id) {
                    keep.insert(id.clone());
                    added = true;
                }
            }
        }
        if !added {
            break;
        }
    }
    all.iter()
        .filter(|(id, _, _)| keep.contains(id))
        .cloned()
        .collect()
}

/// Build a shareable pack from the given decks (and their descendants), or all
/// decks when `deck_ids` is `None`/empty.
pub fn export_pack(conn: &Connection, deck_ids: Option<Vec<String>>) -> AppResult<Pack> {
    let all = all_decks_flat(conn)?;
    let selected = match deck_ids {
        Some(ids) if !ids.is_empty() => with_descendants(&all, &ids),
        _ => all,
    };
    if selected.is_empty() {
        return Err(AppError::Invalid("Keine Decks zum Exportieren gefunden.".into()));
    }
    let keep: HashSet<String> = selected.iter().map(|(id, _, _)| id.clone()).collect();

    let decks: Vec<PackDeck> = selected
        .iter()
        .map(|(id, parent, name)| PackDeck {
            id: id.clone(),
            name: name.clone(),
            // Drop parent links that point outside the exported set.
            parent_id: parent.as_ref().filter(|p| keep.contains(*p)).cloned(),
        })
        .collect();

    let mut cards = Vec::new();
    {
        let mut stmt = conn.prepare(
            "SELECT deck_id, type, prompt_md, explanation_md, payload_json, difficulty
             FROM card WHERE deck_id = ?1 ORDER BY created_at",
        )?;
        for (id, _, _) in &selected {
            let rows = stmt.query_map(params![id], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, Option<String>>(3)?,
                    r.get::<_, String>(4)?,
                    r.get::<_, i64>(5)?,
                ))
            })?;
            for row in rows {
                let (deck_id, card_type, prompt_md, explanation_md, payload_json, difficulty) =
                    row?;
                let payload: Value = serde_json::from_str(&payload_json).unwrap_or(Value::Null);
                cards.push(PackCard {
                    deck_id,
                    card_type,
                    prompt_md,
                    explanation_md,
                    payload,
                    difficulty: Some(difficulty),
                });
            }
        }
    }

    Ok(Pack {
        manifest: Some(PackManifest {
            format_version: 1,
            name: "OpenLearn-Export".into(),
            author: None,
            license: None,
            language: None,
            version: Some("1.0.0".into()),
            description: None,
        }),
        decks,
        cards,
    })
}

/// Import a pack: decks get fresh ids (parent links remapped), cards are added
/// as new "import"-origin cards with a fresh schedule. Runs in one transaction.
pub fn import_pack(conn: &mut Connection, pack: Pack) -> AppResult<ImportSummary> {
    if pack.decks.is_empty() && pack.cards.is_empty() {
        return Err(AppError::Invalid("Die Datei enthält keine Inhalte.".into()));
    }
    let pack_name = pack.manifest.as_ref().map(|m| m.name.clone());
    let t = now_epoch();
    let tx = conn.transaction()?;

    let base_pos: i64 =
        tx.query_row("SELECT COALESCE(MAX(position), -1) + 1 FROM deck", [], |r| r.get(0))?;

    let mut id_map: HashMap<String, String> = HashMap::new();
    for (i, d) in pack.decks.iter().enumerate() {
        let name = d.name.trim();
        if name.is_empty() {
            continue;
        }
        let new = new_id();
        tx.execute(
            "INSERT INTO deck (id, parent_id, name, taxonomy_code, area, position, created_at, updated_at)
             VALUES (?1, NULL, ?2, NULL, NULL, ?3, ?4, ?4)",
            params![new, name, base_pos + i as i64, t],
        )?;
        id_map.insert(d.id.clone(), new);
    }

    for d in &pack.decks {
        if let (Some(parent_old), Some(child_new)) = (d.parent_id.as_ref(), id_map.get(&d.id)) {
            if let Some(parent_new) = id_map.get(parent_old) {
                tx.execute(
                    "UPDATE deck SET parent_id = ?2 WHERE id = ?1",
                    params![child_new, parent_new],
                )?;
            }
        }
    }

    let mut card_count = 0i64;
    for c in &pack.cards {
        let Some(deck_new) = id_map.get(&c.deck_id) else {
            continue;
        };
        if c.prompt_md.trim().is_empty() || c.card_type.trim().is_empty() {
            continue;
        }
        let payload_str = serde_json::to_string(&c.payload)?;
        let difficulty = c.difficulty.unwrap_or(2).clamp(0, 4);
        let card_id = new_id();
        tx.execute(
            "INSERT INTO card (id, deck_id, type, prompt_md, explanation_md, payload_json,
                difficulty, origin, suspended, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'import', 0, ?8, ?8)",
            params![
                card_id,
                deck_new,
                c.card_type,
                c.prompt_md,
                c.explanation_md,
                payload_str,
                difficulty,
                t
            ],
        )?;
        tx.execute(
            "INSERT INTO schedule (card_id, due, state, reps, lapses, ease, interval_days, last_review)
             VALUES (?1, ?2, 'new', 0, 0, 2.5, 0, NULL)",
            params![card_id, t],
        )?;
        card_count += 1;
    }

    tx.commit()?;
    Ok(ImportSummary {
        decks: id_map.len() as i64,
        cards: card_count,
        pack_name,
    })
}

/// Parse pack JSON (either the combined `.olpack` format or a bare
/// `{ "decks": [...], "cards": [...] }`).
pub fn parse_pack(data: &str) -> AppResult<Pack> {
    serde_json::from_str(data)
        .map_err(|e| AppError::Invalid(format!("Pack-Datei konnte nicht gelesen werden: {e}")))
}

/// Import the bundled example pack.
pub fn import_example(conn: &mut Connection) -> AppResult<ImportSummary> {
    let mut pack = parse_pack(EXAMPLE_CONTENT)?;
    pack.manifest = serde_json::from_str(EXAMPLE_MANIFEST).ok();
    import_pack(conn, pack)
}
