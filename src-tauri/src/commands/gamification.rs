use tauri::State;

use crate::error::AppResult;
use crate::models::ProfileView;
use crate::services::gamification;
use crate::state::AppState;
use crate::util::now_epoch;

#[tauri::command]
pub fn gam_get_profile(state: State<AppState>) -> AppResult<ProfileView> {
    let conn = state.db.lock().unwrap();
    gamification::get_profile(&conn, now_epoch())
}
