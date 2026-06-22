use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Datenbankfehler: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("Serialisierungsfehler: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Nicht gefunden: {0}")]
    NotFound(String),

    #[error("Ungültige Eingabe: {0}")]
    Invalid(String),

    #[error("Schlüsselspeicher-Fehler: {0}")]
    Keyring(String),

    #[error("Netzwerkfehler: {0}")]
    Network(String),

    #[error("KI-Fehler: {0}")]
    Ai(String),

    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
