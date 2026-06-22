use zeroize::Zeroize;

use tauri::State;

use crate::ai;
use crate::error::{AppError, AppResult};
use crate::models::{AiStatus, ChatMessage, ChatReply, GeneratedCard, GradeResult};
use crate::secret;
use crate::services::settings;
use crate::state::AppState;

fn load_settings(state: &State<AppState>) -> AppResult<crate::models::Settings> {
    let conn = state.db.lock().unwrap();
    settings::get(&conn)
}

#[tauri::command]
pub fn ai_get_status() -> AiStatus {
    ai::status()
}

#[tauri::command]
pub async fn ai_test_connection(state: State<'_, AppState>, provider: String) -> AppResult<()> {
    if !secret::PROVIDERS.iter().any(|(id, _)| *id == provider) {
        return Err(AppError::Invalid(format!("Unbekannter Provider: {provider}")));
    }
    let settings = load_settings(&state)?;
    ai::test_connection(settings, provider).await
}

#[tauri::command]
pub async fn ai_chat(
    state: State<'_, AppState>,
    messages: Vec<ChatMessage>,
    provider: Option<String>,
    model: Option<String>,
) -> AppResult<ChatReply> {
    let settings = load_settings(&state)?;
    ai::chat(settings, provider, model, messages).await
}

#[tauri::command]
pub async fn ai_generate_cards(
    state: State<'_, AppState>,
    source: String,
    count: i64,
    provider: Option<String>,
    model: Option<String>,
) -> AppResult<Vec<GeneratedCard>> {
    let settings = load_settings(&state)?;
    ai::generate_cards(settings, provider, model, source, count).await
}

#[tauri::command]
pub async fn ai_grade_answer(
    state: State<'_, AppState>,
    question: String,
    expected: Option<String>,
    answer: String,
    provider: Option<String>,
    model: Option<String>,
) -> AppResult<GradeResult> {
    let settings = load_settings(&state)?;
    ai::grade_answer(settings, provider, model, question, expected, answer).await
}

#[tauri::command]
pub fn secret_set_api_key(provider: String, mut key: String) -> AppResult<()> {
    let result = secret::set_key(&provider, &key);
    key.zeroize();
    result
}

#[tauri::command]
pub fn secret_has_api_key(provider: String) -> bool {
    secret::has_key(&provider)
}

#[tauri::command]
pub fn secret_delete_api_key(provider: String) -> AppResult<()> {
    secret::delete_key(&provider)
}
