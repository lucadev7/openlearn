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
    /// Base URL for the OpenAI-compatible provider (e.g. Ollama / LM Studio /
    /// OpenRouter). Ignored for the first-party providers.
    pub openai_base_url: Option<String>,
    /// Equipped avatar cosmetic id (see the shop catalog).
    pub avatar: String,
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
            openai_base_url: None,
            avatar: "ol".into(),
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

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DayStat {
    pub day: String,
    pub reviews: i64,
    pub correct: i64,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RatingCount {
    pub again: i64,
    pub hard: i64,
    pub good: i64,
    pub easy: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeckAccuracy {
    pub deck_id: String,
    pub name: String,
    pub reviews: i64,
    pub correct: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    pub total_reviews: i64,
    pub total_correct: i64,
    pub reviews_today: i64,
    pub active_days: i64,
    pub total_cards: i64,
    pub total_decks: i64,
    pub new_cards: i64,
    pub young_cards: i64,
    pub mature_cards: i64,
    pub suspended_cards: i64,
    pub xp_total: i64,
    pub daily: Vec<DayStat>,
    pub ratings: RatingCount,
    pub by_deck: Vec<DeckAccuracy>,
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Achievement {
    pub id: String,
    pub title: String,
    pub description: String,
    pub icon: String,
    pub tier: String,
    pub progress: i64,
    pub target: i64,
    pub unlocked: bool,
}

// ---------------------------------------------------------------------------
// Content packs (shareable .olpack files)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackManifest {
    #[serde(default = "one")]
    pub format_version: i64,
    pub name: String,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub license: Option<String>,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

fn one() -> i64 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackDeck {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackCard {
    pub deck_id: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub prompt_md: String,
    #[serde(default)]
    pub explanation_md: Option<String>,
    #[serde(default = "default_payload")]
    pub payload: Value,
    #[serde(default)]
    pub difficulty: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pack {
    #[serde(default)]
    pub manifest: Option<PackManifest>,
    #[serde(default)]
    pub decks: Vec<PackDeck>,
    #[serde(default)]
    pub cards: Vec<PackCard>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub decks: i64,
    pub cards: i64,
    pub pack_name: Option<String>,
}

// ---------------------------------------------------------------------------
// AI chat / generation
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatReply {
    pub content: String,
    pub provider: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedCard {
    #[serde(rename = "type")]
    pub card_type: String,
    pub prompt_md: String,
    pub explanation_md: Option<String>,
    pub payload: Value,
    pub difficulty: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GradeResult {
    pub correct: bool,
    pub score: i64,
    pub feedback: String,
}

// ---------------------------------------------------------------------------
// Cosmetic shop
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShopItemView {
    pub id: String,
    pub kind: String,
    pub name: String,
    pub description: String,
    pub price: i64,
    pub free: bool,
    pub owned: bool,
    pub equipped: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShopView {
    pub coins: i64,
    pub equipped_theme: String,
    pub equipped_avatar: String,
    pub items: Vec<ShopItemView>,
}
