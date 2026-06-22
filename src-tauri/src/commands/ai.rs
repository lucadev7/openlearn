use zeroize::Zeroize;

use crate::ai;
use crate::error::{AppError, AppResult};
use crate::models::AiStatus;
use crate::secret;

#[tauri::command]
pub fn ai_get_status() -> AiStatus {
    ai::status()
}

#[tauri::command]
pub fn ai_test_connection(provider: String) -> AppResult<()> {
    if !secret::PROVIDERS.iter().any(|(id, _)| *id == provider) {
        return Err(AppError::Invalid(format!("Unbekannter Provider: {provider}")));
    }
    Err(AppError::NotImplemented(
        "Der KI-Verbindungstest und die KI-Funktionen folgen in einer späteren Version.".into(),
    ))
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
