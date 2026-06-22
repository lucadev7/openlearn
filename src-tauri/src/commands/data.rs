use tauri::State;

use crate::error::AppResult;
use crate::services::data;
use crate::state::AppState;

#[tauri::command]
pub fn data_backup(state: State<AppState>, path: String) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    data::backup(&conn, &path)
}

#[tauri::command]
pub fn data_restore(state: State<AppState>, path: String) -> AppResult<()> {
    let mut conn = state.db.lock().unwrap();
    data::restore(&mut conn, &path)
}
