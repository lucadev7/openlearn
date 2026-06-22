use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::ChatMessage;

/// A single chat completion request, resolved to a concrete provider + key.
pub struct ChatReq<'a> {
    pub provider: &'a str,
    pub base_url: Option<&'a str>,
    pub model: &'a str,
    pub key: &'a str,
    pub messages: &'a [ChatMessage],
    pub max_tokens: u32,
    pub temperature: f32,
}

/// Sensible default model per provider when the user hasn't picked one.
pub fn default_model(provider: &str) -> &'static str {
    match provider {
        "gemini" => "gemini-2.0-flash",
        "openai" => "gpt-4o-mini",
        "anthropic" => "claude-3-5-haiku-latest",
        _ => "",
    }
}

pub async fn chat(req: ChatReq<'_>) -> AppResult<String> {
    let client = reqwest::Client::new();
    match req.provider {
        "gemini" => gemini(&client, &req).await,
        "openai" => openai(&client, "https://api.openai.com/v1", &req).await,
        "anthropic" => anthropic(&client, &req).await,
        "openai_compatible" => {
            let base = req.base_url.map(|b| b.trim()).filter(|b| !b.is_empty()).ok_or_else(|| {
                AppError::Invalid(
                    "Für den OpenAI-kompatiblen Anbieter fehlt die Basis-URL (Einstellungen → KI)."
                        .into(),
                )
            })?;
            openai(&client, base.trim_end_matches('/'), &req).await
        }
        other => Err(AppError::Invalid(format!("Unbekannter Provider: {other}"))),
    }
}

async fn openai(client: &reqwest::Client, base: &str, req: &ChatReq<'_>) -> AppResult<String> {
    let msgs: Vec<Value> = req
        .messages
        .iter()
        .map(|m| json!({ "role": m.role, "content": m.content }))
        .collect();
    let url = format!("{base}/chat/completions");
    let resp = client
        .post(&url)
        .bearer_auth(req.key)
        .json(&json!({
            "model": req.model,
            "messages": msgs,
            "temperature": req.temperature,
            "max_tokens": req.max_tokens,
        }))
        .send()
        .await
        .map_err(net_err)?;
    let body = read_body(resp).await?;
    body.pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| AppError::Ai("Leere Antwort vom Modell.".into()))
}

async fn gemini(client: &reqwest::Client, req: &ChatReq<'_>) -> AppResult<String> {
    let mut contents = Vec::new();
    let mut system = String::new();
    for m in req.messages {
        match m.role.as_str() {
            "system" => {
                if !system.is_empty() {
                    system.push('\n');
                }
                system.push_str(&m.content);
            }
            "assistant" | "model" => {
                contents.push(json!({ "role": "model", "parts": [{ "text": m.content }] }))
            }
            _ => contents.push(json!({ "role": "user", "parts": [{ "text": m.content }] })),
        }
    }
    let mut body = json!({
        "contents": contents,
        "generationConfig": {
            "temperature": req.temperature,
            "maxOutputTokens": req.max_tokens,
        },
    });
    if !system.is_empty() {
        body["systemInstruction"] = json!({ "parts": [{ "text": system }] });
    }
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        req.model
    );
    let resp = client
        .post(&url)
        .query(&[("key", req.key)])
        .json(&body)
        .send()
        .await
        .map_err(net_err)?;
    let body = read_body(resp).await?;
    body.pointer("/candidates/0/content/parts/0/text")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| AppError::Ai("Leere Antwort vom Modell.".into()))
}

async fn anthropic(client: &reqwest::Client, req: &ChatReq<'_>) -> AppResult<String> {
    let mut system = String::new();
    let mut msgs = Vec::new();
    for m in req.messages {
        match m.role.as_str() {
            "system" => {
                if !system.is_empty() {
                    system.push('\n');
                }
                system.push_str(&m.content);
            }
            "assistant" | "model" => {
                msgs.push(json!({ "role": "assistant", "content": m.content }))
            }
            _ => msgs.push(json!({ "role": "user", "content": m.content })),
        }
    }
    let mut body = json!({
        "model": req.model,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "messages": msgs,
    });
    if !system.is_empty() {
        body["system"] = json!(system);
    }
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", req.key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(net_err)?;
    let body = read_body(resp).await?;
    body.pointer("/content/0/text")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| AppError::Ai("Leere Antwort vom Modell.".into()))
}

/// Read a response, turning non-2xx into a friendly `Ai` error and parsing the
/// success body as JSON.
async fn read_body(resp: reqwest::Response) -> AppResult<Value> {
    let status = resp.status();
    let text = resp.text().await.map_err(net_err)?;
    if !status.is_success() {
        let detail = extract_error(&text).unwrap_or_else(|| truncate(&text));
        return Err(AppError::Ai(format!("{} – {}", status.as_u16(), detail)));
    }
    serde_json::from_str(&text).map_err(|e| AppError::Ai(format!("Antwort nicht lesbar: {e}")))
}

fn extract_error(body: &str) -> Option<String> {
    let v: Value = serde_json::from_str(body).ok()?;
    if let Some(m) = v.pointer("/error/message").and_then(Value::as_str) {
        return Some(m.to_string());
    }
    if let Some(m) = v.get("error").and_then(Value::as_str) {
        return Some(m.to_string());
    }
    v.get("message").and_then(Value::as_str).map(str::to_string)
}

fn net_err(e: reqwest::Error) -> AppError {
    AppError::Network(e.to_string())
}

fn truncate(s: &str) -> String {
    let trimmed = s.trim();
    if trimmed.chars().count() > 300 {
        format!("{}…", trimmed.chars().take(300).collect::<String>())
    } else {
        trimmed.to_string()
    }
}
