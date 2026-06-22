use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Deck {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub taxonomy_code: Option<String>,
    pub area: Option<i64>,
    pub position: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeckWithCounts {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub taxonomy_code: Option<String>,
    pub area: Option<i64>,
    pub position: i64,
    pub total: i64,
    pub due: i64,
    pub new_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: String,
    pub deck_id: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub prompt_md: String,
    pub explanation_md: Option<String>,
    pub payload: Value,
    pub difficulty: i64,
    pub origin: String,
    pub suspended: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct CardRaw {
    pub id: String,
    pub deck_id: String,
    pub card_type: String,
    pub prompt_md: String,
    pub explanation_md: Option<String>,
    pub payload_json: String,
    pub difficulty: i64,
    pub origin: String,
    pub suspended: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl CardRaw {
    pub fn into_card(self) -> AppResult<Card> {
        let payload: Value = serde_json::from_str(&self.payload_json)
            .map_err(|e| AppError::Invalid(format!("payload_json defekt: {e}")))?;
        Ok(Card {
            id: self.id,
            deck_id: self.deck_id,
            card_type: self.card_type,
            prompt_md: self.prompt_md,
            explanation_md: self.explanation_md,
            payload,
            difficulty: self.difficulty,
            origin: self.origin,
            suspended: self.suspended,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardInput {
    pub id: Option<String>,
    pub deck_id: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub prompt_md: String,
    pub explanation_md: Option<String>,
    #[serde(default = "default_payload")]
    pub payload: Value,
    pub difficulty: Option<i64>,
}

fn default_payload() -> Value {
    Value::Object(Default::default())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub card_id: String,
    pub due: i64,
    pub state: String,
    pub reps: i64,
    pub lapses: i64,
    pub ease: f64,
    pub interval_days: f64,
    pub last_review: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudyCard {
    pub card: Card,
    pub schedule: Schedule,
    pub is_new: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewOutcome {
    pub schedule: Schedule,
    pub xp_awarded: i64,
    pub leveled_up: bool,
    pub profile: ProfileView,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileView {
    pub xp: i64,
    pub level: i64,
    pub level_title: String,
    pub xp_into_level: i64,
    pub xp_for_next_level: i64,
    pub coins: i64,
    pub streak_current: i64,
    pub streak_longest: i64,
    pub reviews_today: i64,
    pub daily_goal: i64,
    pub due_today: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub reduced_motion: bool,
    pub daily_goal: i64,
    pub new_cards_per_day: i64,
    pub language: String,
    pub default_provider: Option<String>,
    pub default_model: Option<String>,
    pub cost_confirm: bool,
    pub onboarded: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "aurora".into(),
            reduced_motion: false,
            daily_goal: 30,
            new_cards_per_day: 20,
            language: "de".into(),
            default_provider: None,
            default_model: None,
            cost_confirm: true,
            onboarded: false,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderStatus {
    pub id: String,
    pub label: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiStatus {
    pub providers: Vec<ProviderStatus>,
    pub any_configured: bool,
}
