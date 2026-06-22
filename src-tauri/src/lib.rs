mod ai;
mod commands;
mod db;
mod error;
mod models;
mod scheduler;
mod secret;
mod services;
mod state;
mod util;

use std::fs;

use tauri::Manager;

use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("openlearn.db");
            let conn = db::open(&db_path)?;
            app.manage(AppState::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::content::content_list_decks,
            commands::content::content_get_deck,
            commands::content::content_create_deck,
            commands::content::content_rename_deck,
            commands::content::content_delete_deck,
            commands::content::content_list_cards,
            commands::content::content_get_card,
            commands::content::content_upsert_card,
            commands::content::content_set_suspended,
            commands::content::content_delete_card,
            commands::study::study_get_queue,
            commands::study::study_submit_review,
            commands::gamification::gam_get_profile,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::ai::ai_get_status,
            commands::ai::ai_test_connection,
            commands::ai::secret_set_api_key,
            commands::ai::secret_has_api_key,
            commands::ai::secret_delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenLearn");
}
