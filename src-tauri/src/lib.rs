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
        .plugin(tauri_plugin_dialog::init())
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
            commands::content::content_export_pack,
            commands::content::content_import_pack,
            commands::content::content_import_example,
            commands::study::study_get_queue,
            commands::study::study_submit_review,
            commands::gamification::gam_get_profile,
            commands::stats::stats_get,
            commands::achievements::achievements_list,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::data::data_backup,
            commands::data::data_restore,
            commands::ai::ai_get_status,
            commands::ai::ai_test_connection,
            commands::ai::ai_chat,
            commands::ai::ai_generate_cards,
            commands::ai::ai_grade_answer,
            commands::ai::secret_set_api_key,
            commands::ai::secret_has_api_key,
            commands::ai::secret_delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenLearn");
}
