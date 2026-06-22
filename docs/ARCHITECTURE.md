# OpenLearn — Architektur

## Überblick

```
React (Vite + TS + Tailwind + Framer Motion)
   │   Tauri IPC (invoke / events)
   ▼
Rust-Backend  =  Source of Truth
   ├─ commands/   dünne IPC-Schicht (#[tauri::command])
   ├─ services/   Domänenlogik: content, study, gamification, settings
   ├─ scheduler   Spaced-Repetition (Trait + SM-2; FSRS als Upgrade geplant)
   ├─ db/         SQLite (rusqlite, bundled) + Migrationsrunner
   ├─ secret      API-Keys im OS-Keychain (keyring)
   └─ ai/         KI-Provider-Schicht (Status heute; Calls ab Phase 2)
   ▼
SQLite (openlearn.db)  ·  OS-Keychain  ·  HTTPS → KI-Provider (nur konfigurierte)
```

**Leitprinzipien**

1. **Backend = Source of Truth.** Scheduling, XP/Streaks, Bewertung und Key-Handling
   passieren in Rust. Das Frontend rendert und nimmt Eingaben entgegen. Damit sind Ökonomie
   und Planung nicht aus dem Webview manipulierbar, und Secrets verlassen den Backend-Prozess
   nicht.
2. **KI-nativ, aber nicht KI-abhängig.** Der Lern-Kern (Karten, SM-2/FSRS, Tests aus dem Pool)
   läuft offline und ohne API-Key. KI-Funktionen sind additiv und klar als optional
   gekennzeichnet.
3. **Privacy-first.** Keine Telemetrie. Daten lokal. KI-Calls nur an den vom Nutzer
   konfigurierten Provider (BYOK).

## Bewusste Abweichungen vom ursprünglichen Plan

Damit das Projekt **ohne verfügbaren Compiler** als grün baubares Fundament entsteht, wurden
drei pragmatische Verfeinerungen getroffen (jeweils sauber gekapselt, später austauschbar):

| Plan | Umsetzung jetzt | Grund |
|---|---|---|
| `tauri-plugin-sql` | **`rusqlite` (bundled)** direkt im Backend | Passt besser zu „Backend = Source of Truth"; keine SQL-Ausführung im Frontend; SQLite fest einkompiliert (portable .exe). |
| FSRS-Crate | **SM-2 hinter `Scheduler`-Trait** | FSRS-Crate-API nicht ohne Build verifizierbar; SM-2 ist korrekt & dependency-frei. FSRS wird als zweite `Scheduler`-Impl ergänzt. |
| `ts-rs` Typgenerierung | **Handgepflegte TS-Typen** (`src/lib/types.ts`) | Vermeidet einen fragilen Build-Schritt ohne Compiler; ts-rs kann später nachgezogen werden. |

## Datenfluss Study-Loop

1. `study_get_queue` → fällige Reviews (SM-2 `due ≤ now`) + bis zu `new_cards_per_day` neue Karten.
2. UI: Karte → Antwort → `Aufdecken` (lokales Auto-Grading für single/multi/truefalse/cloze/numeric).
3. `study_submit_review(card_id, rating)` → in **einer Transaktion**: Schedule neu berechnen,
   `review_log` schreiben, XP/Streak/Tageszähler aktualisieren → `ReviewOutcome` zurück.
4. UI aktualisiert Profil (Level/XP/Streak) sofort aus der Antwort.

## KI-Schicht (Phase 2+)

`ai/` definiert heute nur die Status-/Registry-Oberfläche; die eigentlichen Provider-Adapter
kommen als `AiProvider`-Trait:

- **Provider:** Gemini, OpenAI, Anthropic, OpenAI-kompatibel (OpenRouter/Ollama/LM Studio, custom `base_url`).
- **Strukturierte Outputs** je Provider (json_schema / responseSchema / tool_use), serverseitig
  gegen JSON-Schema validiert, bevor etwas in die DB gelangt.
- **Features (in dieser Reihenfolge):** Tutor (gestreamt) → Fragengenerierung (Review-Queue) →
  Material→Karten → Bewertung (Freitext/SQL/Essay) → Lernpfade → mündliche Prüfung.
- **Sicherheit:** Keys im Keychain, `zeroize` nach Schreiben, nie ans Frontend, nie geloggt.
- **Degradation:** ohne Key sind KI-Buttons deaktiviert mit Hinweis; nie Sackgasse.

## Phasen-Roadmap

Siehe `README.md` → „Status / Roadmap". Phase 0 (Skeleton/Pipeline) und Phase 1 (Core-Study-Loop)
sind in diesem Stand enthalten.

## Migrationsstrategie

Vorwärts-nur, nummerierte SQL-Dateien in `src-tauri/migrations/`, eingebettet via `include_str!`,
Versionsstand in der `meta`-Tabelle. **Niemals** eine ausgelieferte Migration ändern — immer eine
neue Datei + Eintrag in `db::MIGRATIONS` ergänzen. Nutzer-Inhalte bleiben über Updates erhalten.
