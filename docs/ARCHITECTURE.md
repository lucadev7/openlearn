# OpenLearn — Architektur

## Überblick

```
React (Vite + TS + Tailwind + Framer Motion)
   │   Tauri IPC (invoke / events)
   ▼
Rust-Backend  =  Source of Truth
   ├─ commands/   dünne IPC-Schicht (#[tauri::command])
   ├─ services/   Domänenlogik: content, study, gamification, settings, stats, achievements, data
   ├─ scheduler   Spaced-Repetition (Trait + SM-2; FSRS als Upgrade geplant)
   ├─ db/         SQLite (rusqlite, bundled) + Migrationsrunner
   ├─ secret      API-Keys im OS-Keychain (keyring)
   └─ ai/         KI-Provider-Schicht (Gemini / OpenAI / Anthropic / OpenAI-kompatibel)
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

Drei pragmatische Verfeinerungen gegenüber dem ursprünglichen Plan (jeweils sauber gekapselt,
später austauschbar):

| Plan | Umsetzung jetzt | Grund |
|---|---|---|
| `tauri-plugin-sql` | **`rusqlite` (bundled)** direkt im Backend | Passt besser zu „Backend = Source of Truth"; keine SQL-Ausführung im Frontend; SQLite fest einkompiliert (portable .exe). |
| FSRS-Crate | **SM-2 hinter `Scheduler`-Trait** | FSRS-Crate-API nicht ohne Build verifizierbar; SM-2 ist korrekt & dependency-frei. FSRS wird als zweite `Scheduler`-Impl ergänzt. |
| `ts-rs` Typgenerierung | **Handgepflegte TS-Typen** (`src/lib/types.ts`) | Vermeidet einen fragilen Build-Schritt ohne Compiler; ts-rs kann später nachgezogen werden. |

## Datenfluss Study-Loop

1. `study_get_queue` → fällige Reviews (SM-2 `due ≤ now`) + bis zu `new_cards_per_day` neue Karten.
2. UI: Karte → Antwort → `Aufdecken` (lokales Auto-Grading für single/multi/truefalse/cloze/numeric;
   Kurzantwort-Karten werden per KI bewertet, wenn ein Key hinterlegt ist).
3. `study_submit_review(card_id, rating)` → in **einer Transaktion**: Schedule neu berechnen,
   `review_log` schreiben, XP/Streak/Tageszähler aktualisieren → `ReviewOutcome` zurück.
4. UI aktualisiert Profil (Level/XP/Streak) sofort aus der Antwort.

## KI-Schicht

`ai/` kapselt die Provider-Anbindung. `ai/mod.rs` löst Provider/Modell/Key aus den Settings + dem
Keychain auf und ruft `ai/providers.rs` (reqwest, asynchron) auf. Tauri-Commands sind `async` und
halten nie die DB-Sperre über ein `await`.

- **Provider:** Gemini, OpenAI, Anthropic, OpenAI-kompatibel (OpenRouter/Ollama/LM Studio, eigene
  `base_url` in den Settings). Anfragen laufen ausschließlich über das Rust-Backend — nie aus dem
  Webview (die CSP erlaubt dem Frontend keine externen Hosts).
- **Aktive Features:** `ai_test_connection`, Tutor-Chat (`ai_chat`), Material→Karten
  (`ai_generate_cards`, mit Review-Queue) und Antwort-Bewertung (`ai_grade_answer`).
- **Robuste Outputs:** Generierung/Bewertung extrahieren den JSON-Block aus der Antwort und
  validieren ihn (erlaubte Kartentypen, payload-Form), bevor etwas vorgeschlagen wird.
- **Sicherheit:** Keys im Keychain, `zeroize` nach Schreiben, nie ans Frontend, nie geloggt.
- **Degradation:** ohne Key sind KI-Seiten gesperrt mit Hinweis auf die Einstellungen; nie Sackgasse.
- **Geplant:** Streaming, Lernpfade, mündliche Prüfung.

## Phasen-Roadmap

Siehe `README.md` → „Status". Enthalten sind der Core-Study-Loop, Statistiken, Achievements,
Content-Packs, Backup/Restore und die KI-Funktionen (Tutor, Material→Karten, Bewertung). Offen
bleiben u. a. Lernpfade, mündliche Prüfung, Tests-Simulation und der Shop.

## Migrationsstrategie

Vorwärts-nur, nummerierte SQL-Dateien in `src-tauri/migrations/`, eingebettet via `include_str!`,
Versionsstand in der `meta`-Tabelle. **Niemals** eine ausgelieferte Migration ändern — immer eine
neue Datei + Eintrag in `db::MIGRATIONS` ergänzen. Nutzer-Inhalte bleiben über Updates erhalten.
