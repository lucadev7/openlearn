<div align="center">

# OpenLearn

**Lokale, gamifizierte Lern-App mit optionaler KI — du bringst deinen eigenen API-Key mit.**

Lerne mit Karteikarten und intelligenter Wiederholung (Spaced Repetition). Erstelle eigene Themen,
oder lass dir von einer KI beim Lernen helfen. Alles bleibt auf deinem Gerät.

[Download](../../releases) · [Aus dem Quellcode bauen](#aus-dem-quellcode-bauen) · [Mitmachen](CONTRIBUTING.md)

</div>

---

OpenLearn ist eine Desktop-App für Windows (Tauri + React + Rust). Der Lernkern funktioniert
vollständig **offline und ohne Konto**: Decks anlegen, Karten lernen, Fortschritt sehen. Wer will,
schaltet KI-Funktionen frei, indem er in den Einstellungen einen eigenen API-Key hinterlegt.

Eignet sich für alles, was man wiederholend lernt — Sprachen, Vokabeln, Zertifikate, Prüfungen,
Fachwissen oder einfach eigene Themen.

## Funktionen

**Lernen**
- Spaced Repetition (intelligente Wiederholungsabstände), damit du das Richtige zum richtigen Zeitpunkt übst
- Fragetypen: Single/Multiple Choice, Wahr/Falsch, Lückentext, numerische Aufgaben
- Vollständig per Tastatur bedienbar (Ziffern wählen, Leertaste deckt auf, 1–4 bewerten)

**Eigene Inhalte**
- Decks und Karten direkt in der App anlegen und bearbeiten (mit Live-Vorschau, Markdown, Code)
- Inhalte als Datei teilen und importieren (Content-Packs) — inklusive mitgeliefertem Beispiel-Pack

**Fortschritt & Motivation**
- Statistiken: Aktivitäts-Heatmap, Verlauf, Trefferquote je Deck, Karten-Reife
- Achievements mit Fortschrittsanzeige
- Tests & Prüfungen: zeitgesteuerte Simulation aus deinem Fragenpool, mit Auswertung
- Shop: verdiene Coins beim Lernen und schalte Themes & Avatare frei (rein kosmetisch)
- Backup & Wiederherstellung der gesamten lokalen Datenbank in eine Datei

**KI (optional, du bringst den Key mit)**
- Tutor-Chat, der erklärt und nachfragt
- Karten automatisch aus eigenem Material erzeugen (mit Review-Queue)
- Bewertung offener Antworten (Kurzantwort-Karten) mit Feedback
- Adaptive Lernpfade aus deinem Ziel, Zieldatum und deinen Schwächen
- Mündliche Prüfung mit einem KI-Prüfer, inkl. Bewertung am Ende

> KI ist nie Voraussetzung. Ohne Key bleibt der Lernkern voll nutzbar.

**Privatsphäre**
- Keine Telemetrie, kein Konto, kein Server. Deine Daten liegen lokal (SQLite).
- API-Keys werden im Windows Credential Manager gespeichert — nie im Klartext, nie in einer Datei.

## Bring deinen eigenen Key mit

OpenLearn betreibt keinen eigenen Dienst. KI-Anfragen gehen direkt an den Anbieter, den du wählst:

| Anbieter | Hinweis |
| --- | --- |
| Google Gemini | großzügiges kostenloses Kontingent — guter Einstieg |
| OpenAI | `gpt`-Modelle |
| Anthropic | Modelle von Anthropic |
| OpenAI-kompatibel | OpenRouter sowie lokal via Ollama / LM Studio — kostenlos und vollständig offline |

## Download

Fertige Builds (Installer und portable `.exe`) findest du unter
[Releases](../../releases) — kein Build nötig.

> Die Builds sind noch nicht signiert. Beim ersten Start zeigt Windows SmartScreen ggf. eine
> Warnung — über *Weitere Informationen → Trotzdem ausführen* startet die App.

## Aus dem Quellcode bauen

Voraussetzungen (einmalig): [Node.js](https://nodejs.org), die
[Rust-Toolchain](https://rustup.rs) und die Visual Studio Build Tools mit „Desktop development
with C++".

```bash
npm install
npm run tauri dev      # Entwicklungsmodus mit Hot-Reload
npm run tauri build    # erzeugt Installer + portable .exe
```

App-Icons lassen sich aus einem einzelnen Bild generieren:

```bash
npm run tauri icon pfad/zum/logo.png
```

## Wie es aufgebaut ist

Das Rust-Backend hält den gesamten Zustand (Inhalte, Wiederholungsplanung, Fortschritt, Schlüssel).
Das React-Frontend kümmert sich nur um Darstellung und Eingabe. So bleiben Logik und Geheimnisse
außerhalb des Browser-Kontexts.

```
React (Vite · TypeScript · Tailwind · Framer Motion)
   ↕ Tauri-IPC
Rust-Backend
   ├─ SQLite (rusqlite)        Inhalte, Planung, Fortschritt
   ├─ Keychain (keyring)       API-Keys
   └─ KI-Anbindung             nur an den von dir gewählten Anbieter
```

Mehr Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status

Aktiv nutzbar. Lernkern, Statistiken, Achievements, Content-Packs, Backup/Restore, Shop und Tests
sowie die KI-Funktionen (mit eigenem API-Key) sind enthalten.

- [x] Lernkern: Decks/Karten, Spaced Repetition, XP/Level/Streak
- [x] KI: Tutor, Material → Karten, Antwort-Bewertung, Lernpfade, mündliche Prüfung (eigener API-Key)
- [x] Content-Packs: Import/Export, Beispiel-Inhalte
- [x] Statistiken & Achievements
- [x] Tests & Prüfungen
- [x] Shop: Themes & Avatare (Coins fürs Lernen)
- [x] Backup/Restore
- [ ] Signierte Builds, Mehrsprachigkeit, FSRS-Scheduler, gestreamte KI-Antworten

## Mitmachen

Beiträge sind willkommen — Code wie Inhalte. Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

[MIT](LICENSE). Inhalte in `content/` können eine eigene Lizenz tragen (siehe jeweiliges `manifest.json`).
