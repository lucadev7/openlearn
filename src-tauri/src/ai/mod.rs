use crate::models::{AiStatus, ProviderStatus};
use crate::secret;

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
