use keyring::Entry;

use crate::error::{AppError, AppResult};

const SERVICE: &str = "OpenLearn";

pub const PROVIDERS: &[(&str, &str)] = &[
    ("gemini", "Google Gemini"),
    ("openai", "OpenAI"),
    ("anthropic", "Anthropic"),
    (
        "openai_compatible",
        "OpenAI-kompatibel (OpenRouter / Ollama / LM Studio)",
    ),
];

fn validate_provider(provider: &str) -> AppResult<()> {
    if PROVIDERS.iter().any(|(id, _)| *id == provider) {
        Ok(())
    } else {
        Err(AppError::Invalid(format!("Unbekannter Provider: {provider}")))
    }
}

fn entry(provider: &str) -> AppResult<Entry> {
    Entry::new(SERVICE, provider).map_err(|e| AppError::Keyring(e.to_string()))
}

pub fn set_key(provider: &str, key: &str) -> AppResult<()> {
    validate_provider(provider)?;
    if key.trim().is_empty() {
        return Err(AppError::Invalid("API-Key darf nicht leer sein.".into()));
    }
    entry(provider)?
        .set_password(key)
        .map_err(|e| AppError::Keyring(e.to_string()))
}

pub fn has_key(provider: &str) -> bool {
    match entry(provider) {
        Ok(e) => e.get_password().is_ok(),
        Err(_) => false,
    }
}

pub fn delete_key(provider: &str) -> AppResult<()> {
    validate_provider(provider)?;
    match entry(provider)?.delete_password() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Keyring(e.to_string())),
    }
}
