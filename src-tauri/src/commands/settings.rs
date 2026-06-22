use tauri::State;

use crate::error::AppResult;
use crate::models::Settings;
use crate::services::settings as settings_svc;
use crate::state::AppState;

#[tauri::command]
pub fn settings_get(state: State<AppState>) -> AppResult<Settings> {
    let conn = state.db.lock().unwrap();
    settings_svc::get(&conn)
}

#[tauri::command]
pub fn settings_set(state: State<AppState>, settings: Settings) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    settings_svc::set(&conn, &settings)
}
