pub mod providers;

use serde::Deserialize;
use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::models::{
    AiStatus, ChatMessage, ChatReply, GeneratedCard, GradeResult, ProviderStatus, Settings,
};
use crate::secret;
use providers::{default_model, ChatReq};

const TUTOR_SYSTEM: &str = "Du bist ein geduldiger, motivierender Lern-Tutor in der App OpenLearn. \
Antworte auf Deutsch, klar und prägnant. Erkläre Konzepte Schritt für Schritt, nutze kurze \
Beispiele und stelle gelegentlich eine sokratische Rückfrage, um das Verständnis zu prüfen. \
Wenn passend, schlage konkrete Lernkarten vor. Bleib ehrlich, wenn du etwas nicht weißt.";

const GENERATE_SYSTEM: &str = "Du erstellst Lernkarten für eine Spaced-Repetition-App. \
Gib AUSSCHLIESSLICH ein gültiges JSON-Array zurück – keine Erklärungen, kein Markdown, keine \
Code-Fences. Jede Karte ist ein Objekt mit den Feldern: \"type\", \"promptMd\", \"payload\", \
\"explanationMd\" (optional) und \"difficulty\" (1–4). \
Erlaubte type-Werte und ihr payload-Format: \
single = {\"options\":[\"...\"],\"correct\": <Index ab 0>}; \
multi = {\"options\":[\"...\"],\"correct\":[<Indizes>]}; \
truefalse = {\"answer\": true|false}; \
cloze = promptMd enthält Lücken als {{Wort}}, payload = {\"answers\":[\"Wort\", ...]}; \
numeric = {\"value\": <Zahl>,\"tolerance\": <Zahl>,\"unit\":\"optional\"}. \
Schreibe promptMd und Erklärungen in der Sprache des Materials.";

const GRADE_SYSTEM: &str = "Du bewertest die freie Antwort eines Lernenden fair und wohlwollend. \
Gib AUSSCHLIESSLICH ein gültiges JSON-Objekt zurück mit den Feldern: \
\"correct\" (true/false), \"score\" (0–100) und \"feedback\" (kurzes, hilfreiches Feedback auf \
Deutsch, das den Fehler benennt und einen Tipp gibt).";

const ALLOWED_TYPES: &[&str] = &["single", "multi", "truefalse", "cloze", "numeric"];
const MAX_SOURCE_CHARS: usize = 12_000;

pub fn status() -> AiStatus {
    let providers: Vec<ProviderStatus> = secret::PROVIDERS
        .iter()
        .map(|(id, label)| ProviderStatus {
            id: (*id).to_string(),
            label: (*label).to_string(),
            configured: secret::has_key(id),
        })
        .collect();
    let any_configured = providers.iter().any(|p| p.configured);
    AiStatus {
        providers,
        any_configured,
    }
}

struct Resolved {
    provider: String,
    model: String,
    key: String,
    base_url: Option<String>,
}

fn resolve(
    settings: &Settings,
    provider: Option<String>,
    model: Option<String>,
) -> AppResult<Resolved> {
    let provider = provider
        .filter(|p| !p.trim().is_empty())
        .or_else(|| settings.default_provider.clone())
        .ok_or_else(|| {
            AppError::Invalid("Kein KI-Anbieter gewählt (Einstellungen → KI).".into())
        })?;
    if !secret::PROVIDERS.iter().any(|(id, _)| *id == provider) {
        return Err(AppError::Invalid(format!("Unbekannter Provider: {provider}")));
    }
    let key = secret::get_key(&provider)?;
    let model = model
        .filter(|m| !m.trim().is_empty())
        .or_else(|| settings.default_model.clone().filter(|m| !m.trim().is_empty()))
        .unwrap_or_else(|| default_model(&provider).to_string());
    if model.trim().is_empty() {
        return Err(AppError::Invalid(
            "Kein Modell angegeben (Einstellungen → KI).".into(),
        ));
    }
    Ok(Resolved {
        provider,
        model,
        key,
        base_url: settings.openai_base_url.clone(),
    })
}

fn req<'a>(r: &'a Resolved, messages: &'a [ChatMessage], max_tokens: u32, temp: f32) -> ChatReq<'a> {
    ChatReq {
        provider: &r.provider,
        base_url: r.base_url.as_deref(),
        model: &r.model,
        key: &r.key,
        messages,
        max_tokens,
        temperature: temp,
    }
}

pub async fn test_connection(settings: Settings, provider: String) -> AppResult<()> {
    let r = resolve(&settings, Some(provider), None)?;
    let messages = vec![ChatMessage {
        role: "user".into(),
        content: "Antworte nur mit: OK".into(),
    }];
    providers::chat(req(&r, &messages, 16, 0.0)).await?;
    Ok(())
}

pub async fn chat(
    settings: Settings,
    provider: Option<String>,
    model: Option<String>,
    mut messages: Vec<ChatMessage>,
) -> AppResult<ChatReply> {
    let r = resolve(&settings, provider, model)?;
    if !messages.iter().any(|m| m.role == "system") {
        messages.insert(
            0,
            ChatMessage {
                role: "system".into(),
                content: TUTOR_SYSTEM.into(),
            },
        );
    }
    let content = providers::chat(req(&r, &messages, 1024, 0.7)).await?;
    Ok(ChatReply {
        content,
        provider: r.provider,
        model: r.model,
    })
}

pub async fn generate_cards(
    settings: Settings,
    provider: Option<String>,
    model: Option<String>,
    source: String,
    count: i64,
) -> AppResult<Vec<GeneratedCard>> {
    let r = resolve(&settings, provider, model)?;
    let count = count.clamp(1, 20);
    let source: String = source.chars().take(MAX_SOURCE_CHARS).collect();
    if source.trim().is_empty() {
        return Err(AppError::Invalid("Kein Material angegeben.".into()));
    }
    let messages = vec![
        ChatMessage {
            role: "system".into(),
            content: GENERATE_SYSTEM.into(),
        },
        ChatMessage {
            role: "user".into(),
            content: format!(
                "Erstelle genau {count} abwechslungsreiche Lernkarten aus diesem Material:\n\n{source}"
            ),
        },
    ];
    let raw = providers::chat(req(&r, &messages, 2048, 0.4)).await?;
    let cards = parse_generated(&raw);
    if cards.is_empty() {
        return Err(AppError::Ai(
            "Es konnten keine gültigen Karten erzeugt werden. Versuch es noch einmal oder mit anderem Material.".into(),
        ));
    }
    Ok(cards)
}

pub async fn grade_answer(
    settings: Settings,
    provider: Option<String>,
    model: Option<String>,
    question: String,
    expected: Option<String>,
    answer: String,
) -> AppResult<GradeResult> {
    let r = resolve(&settings, provider, model)?;
    let expected = expected.unwrap_or_default();
    let user = format!(
        "Frage:\n{question}\n\nMusterlösung/Hinweis:\n{expected}\n\nAntwort des Lernenden:\n{answer}"
    );
    let messages = vec![
        ChatMessage {
            role: "system".into(),
            content: GRADE_SYSTEM.into(),
        },
        ChatMessage {
            role: "user".into(),
            content: user,
        },
    ];
    let raw = providers::chat(req(&r, &messages, 512, 0.2)).await?;
    Ok(parse_grade(&raw))
}

/// Pull the outermost `open`..`close` delimited block out of a model response
/// that may be wrapped in prose or code fences.
fn json_block(s: &str, open: char, close: char) -> Option<&str> {
    let start = s.find(open)?;
    let end = s.rfind(close)?;
    (end > start).then(|| &s[start..=end])
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenCardJson {
    #[serde(rename = "type", default)]
    card_type: Option<String>,
    #[serde(default)]
    prompt_md: Option<String>,
    #[serde(default)]
    explanation_md: Option<String>,
    #[serde(default)]
    payload: Value,
    #[serde(default)]
    difficulty: Option<i64>,
}

fn parse_generated(raw: &str) -> Vec<GeneratedCard> {
    let Some(block) = json_block(raw, '[', ']') else {
        return Vec::new();
    };
    let parsed: Vec<GenCardJson> = serde_json::from_str(block).unwrap_or_default();
    parsed
        .into_iter()
        .filter_map(|j| {
            let card_type = j.card_type.unwrap_or_default();
            let prompt = j.prompt_md.unwrap_or_default();
            if !ALLOWED_TYPES.contains(&card_type.as_str())
                || prompt.trim().is_empty()
                || !payload_ok(&card_type, &j.payload)
            {
                return None;
            }
            Some(GeneratedCard {
                card_type,
                prompt_md: prompt,
                explanation_md: j.explanation_md.filter(|e| !e.trim().is_empty()),
                payload: j.payload,
                difficulty: j.difficulty.unwrap_or(2).clamp(0, 4),
            })
        })
        .collect()
}

fn payload_ok(card_type: &str, payload: &Value) -> bool {
    match card_type {
        "single" => {
            payload
                .get("options")
                .and_then(Value::as_array)
                .is_some_and(|a| !a.is_empty())
                && payload.get("correct").is_some_and(Value::is_number)
        }
        "multi" => {
            payload
                .get("options")
                .and_then(Value::as_array)
                .is_some_and(|a| !a.is_empty())
                && payload.get("correct").and_then(Value::as_array).is_some()
        }
        "truefalse" => payload.get("answer").is_some_and(Value::is_boolean),
        "cloze" => payload
            .get("answers")
            .and_then(Value::as_array)
            .is_some_and(|a| !a.is_empty()),
        "numeric" => payload.get("value").is_some_and(Value::is_number),
        _ => false,
    }
}

#[derive(Deserialize)]
struct GradeJson {
    #[serde(default)]
    correct: bool,
    #[serde(default)]
    score: i64,
    #[serde(default)]
    feedback: String,
}

fn parse_grade(raw: &str) -> GradeResult {
    if let Some(block) = json_block(raw, '{', '}') {
        if let Ok(g) = serde_json::from_str::<GradeJson>(block) {
            return GradeResult {
                correct: g.correct,
                score: g.score.clamp(0, 100),
                feedback: if g.feedback.trim().is_empty() {
                    "Kein Feedback erhalten.".into()
                } else {
                    g.feedback
                },
            };
        }
    }
    // Fall back to showing the raw text so the user still gets something useful.
    GradeResult {
        correct: false,
        score: 0,
        feedback: raw.trim().to_string(),
    }
}
