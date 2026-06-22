# Changelog

Alle nennenswerten Änderungen an OpenLearn. Format orientiert sich an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [0.2.0] – 2026-06-22

### Hinzugefügt
- **Shop** mit kosmetischen **Themes** und **Avataren**. Coins verdienst du beim
  Lernen (und als Bonus bei Level-Ups) — rein optisch, kein Pay-to-Win.
- **Tests & Prüfungen**: zeitgesteuerte Test-Simulation aus deinem Fragenpool
  mit Auswertung; ohne Einfluss auf die Wiederholungsplanung.
- **Kurzantwort-Karten** (`short_text`), die beim Lernen von der KI bewertet
  werden (Feedback + Punktzahl).
- **Mündliche Prüfung** (KI-Prüfer) und **KI-Lernpfade** (Plan aus Ziel,
  Datum und Schwächen).
- **Startbildschirm** beim Laden und **In-App-Changelog** („Was ist neu").
- Coins-Anzeige und Avatar in der Oberfläche.

### Behoben
- Anlegen von Decks sowie weitere Aktionen schlugen fehl, weil die IPC-Argumente
  in `snake_case` statt `camelCase` übergeben wurden (Tauri-v2-Konvention).

### Geändert
- Coins werden jetzt fürs Lernen vergeben (vorher ungenutzt).
- Mehrere UI-Verbesserungen; Versionsanzeige zentral gepflegt.

## [0.1.0] – 2026-06-22

### Hinzugefügt
- Lernkern: Decks/Karten, Spaced Repetition (SM-2), XP/Level/Streak.
- Statistiken (Heatmap, Verlauf, Trefferquote) und Achievements.
- Content-Packs (Import/Export) inklusive Beispiel-Pack.
- Backup & Wiederherstellung der lokalen Datenbank.
- KI mit eigenem API-Key: Tutor-Chat und Material → Karten.

[0.2.0]: https://github.com/lucadev7/openlearn/releases/tag/v0.2.0
[0.1.0]: https://github.com/lucadev7/openlearn/releases/tag/v0.1.0
