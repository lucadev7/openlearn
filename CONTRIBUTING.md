# Mitmachen

Danke für dein Interesse! Beiträge sind auf zwei Wegen willkommen: **Code** und **Lerninhalte**.

## Inhalte beitragen

Am einfachsten direkt in der App: Decks und Karten anlegen, als Content-Pack exportieren und den
Export per Pull Request zu `content/` hinzufügen. Das Pack-Format ist in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) beschrieben.

**Bitte nur Inhalte beitragen, an denen du die Rechte hast.** Kein urheberrechtlich geschütztes
Material (Lehrbücher, kostenpflichtige Kurse, geschützte Prüfungsaufgaben o. Ä.). Eigene
Formulierungen sind willkommen, gern mit kurzer Quellenangabe in der Erklärung.

Qualität:
- eindeutige Lösung (bzw. bei offenen Fragen eine faire Musterlösung)
- eine knappe Erklärung pro Karte — das ist der eigentliche Lerneffekt
- passende Tags; bei Bildern Alt-Text (Barrierefreiheit)

## Code beitragen

- Frontend: React + TypeScript + Tailwind (`src/`)
- Backend: Rust + Tauri (`src-tauri/`) — die Zustandslogik gehört ins Backend
- Vor dem PR: `npm run lint` / `npm run fmt`, `cargo fmt` / `cargo clippy`
- kleine, thematische Commits; im PR kurz das „Warum" beschreiben

Nicht verhandelbar:
- API-Keys ausschließlich über den Keychain — nie in DB, Datei oder Log
- KI-Ausgaben gegen ihr Schema validieren, bevor sie gespeichert werden
- keine Telemetrie, keine Netzwerkaufrufe außer zum vom Nutzer konfigurierten KI-Anbieter

## Entwicklung

Siehe [README](README.md#aus-dem-quellcode-bauen).
