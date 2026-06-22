use tauri::State;

use crate::error::AppResult;
use crate::models::Achievement;
use crate::services::achievements;
use crate::state::AppState;

#[tauri::command]
pub fn achievements_list(state: State<AppState>) -> AppResult<Vec<Achievement>> {
    let conn = state.db.lock().unwrap();
    achievements::list(&conn)
}
