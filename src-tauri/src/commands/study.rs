use tauri::State;

use crate::error::AppResult;
use crate::models::{ReviewOutcome, StudyCard};
use crate::scheduler::Rating;
use crate::services::{settings, study};
use crate::state::AppState;

#[tauri::command]
pub fn study_get_queue(
    state: State<AppState>,
    deck_id: Option<String>,
    new_limit: Option<i64>,
) -> AppResult<Vec<StudyCard>> {
    let conn = state.db.lock().unwrap();
    let limit = match new_limit {
        Some(n) => n,
        None => settings::get(&conn)?.new_cards_per_day,
    };
    study::get_queue(&conn, deck_id, limit)
}

#[tauri::command]
pub fn study_submit_review(
    state: State<AppState>,
    card_id: String,
    rating: Rating,
) -> AppResult<ReviewOutcome> {
    let mut conn = state.db.lock().unwrap();
    study::submit_review(&mut conn, &card_id, rating)
}
