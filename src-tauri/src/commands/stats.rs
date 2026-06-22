use tauri::State;

use crate::error::AppResult;
use crate::models::Stats;
use crate::services::stats;
use crate::state::AppState;

#[tauri::command]
pub fn stats_get(state: State<AppState>) -> AppResult<Stats> {
    let conn = state.db.lock().unwrap();
    stats::get_stats(&conn)
}
