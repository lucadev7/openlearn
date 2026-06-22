use tauri::State;

use crate::error::{AppError, AppResult};
use crate::models::{Card, CardInput, Deck, DeckWithCounts, ImportSummary};
use crate::services::content;
use crate::state::AppState;

#[tauri::command]
pub fn content_list_decks(state: State<AppState>) -> AppResult<Vec<DeckWithCounts>> {
    let conn = state.db.lock().unwrap();
    content::list_decks(&conn)
}

#[tauri::command]
pub fn content_get_deck(state: State<AppState>, id: String) -> AppResult<Deck> {
    let conn = state.db.lock().unwrap();
    content::get_deck(&conn, &id)
}

#[tauri::command]
pub fn content_create_deck(
    state: State<AppState>,
    name: String,
    parent_id: Option<String>,
) -> AppResult<Deck> {
    let conn = state.db.lock().unwrap();
    content::create_deck(&conn, &name, parent_id)
}

#[tauri::command]
pub fn content_rename_deck(state: State<AppState>, id: String, name: String) -> AppResult<Deck> {
    let conn = state.db.lock().unwrap();
    content::rename_deck(&conn, &id, &name)
}

#[tauri::command]
pub fn content_delete_deck(state: State<AppState>, id: String) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    content::delete_deck(&conn, &id)
}

#[tauri::command]
pub fn content_list_cards(state: State<AppState>, deck_id: String) -> AppResult<Vec<Card>> {
    let conn = state.db.lock().unwrap();
    content::list_cards(&conn, &deck_id)
}

#[tauri::command]
pub fn content_get_card(state: State<AppState>, id: String) -> AppResult<Card> {
    let conn = state.db.lock().unwrap();
    content::get_card(&conn, &id)
}

#[tauri::command]
pub fn content_upsert_card(state: State<AppState>, input: CardInput) -> AppResult<Card> {
    let conn = state.db.lock().unwrap();
    content::upsert_card(&conn, input)
}

#[tauri::command]
pub fn content_set_suspended(
    state: State<AppState>,
    id: String,
    suspended: bool,
) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    content::set_suspended(&conn, &id, suspended)
}

#[tauri::command]
pub fn content_delete_card(state: State<AppState>, id: String) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    content::delete_card(&conn, &id)
}

#[tauri::command]
pub fn content_export_pack(
    state: State<AppState>,
    deck_ids: Option<Vec<String>>,
    path: String,
) -> AppResult<()> {
    let pack = {
        let conn = state.db.lock().unwrap();
        content::export_pack(&conn, deck_ids)?
    };
    let json = serde_json::to_string_pretty(&pack)?;
    std::fs::write(&path, json)
        .map_err(|e| AppError::Other(format!("Datei konnte nicht geschrieben werden: {e}")))
}

#[tauri::command]
pub fn content_import_pack(state: State<AppState>, path: String) -> AppResult<ImportSummary> {
    let data = std::fs::read_to_string(&path)
        .map_err(|e| AppError::Other(format!("Datei konnte nicht gelesen werden: {e}")))?;
    let pack = content::parse_pack(&data)?;
    let mut conn = state.db.lock().unwrap();
    content::import_pack(&mut conn, pack)
}

#[tauri::command]
pub fn content_import_example(state: State<AppState>) -> AppResult<ImportSummary> {
    let mut conn = state.db.lock().unwrap();
    content::import_example(&mut conn)
}

#[tauri::command]
pub fn content_exam_cards(
    state: State<AppState>,
    deck_id: Option<String>,
    count: i64,
) -> AppResult<Vec<Card>> {
    let conn = state.db.lock().unwrap();
    content::random_exam(&conn, deck_id, count)
}
