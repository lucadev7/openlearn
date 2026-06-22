export const APP_VERSION = "0.2.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.2.0",
    date: "2026-06-22",
    title: "Shop, Tests & Politur",
    changes: [
      "Neu: Shop mit Themes & Avataren — Coins verdienst du beim Lernen (rein kosmetisch).",
      "Neu: Tests & Prüfungen — zeitgesteuerte Simulation aus deinem Fragenpool mit Auswertung.",
      "Neu: Kurzantwort-Karten, die beim Lernen von der KI bewertet werden.",
      "Neu: Startbildschirm beim Laden und ein In-App-Changelog (Was ist neu).",
      "Fix: Deck-Anlegen und weitere Aktionen (Tauri-Argumentnamen korrigiert).",
      "Verbesserte Oberfläche an mehreren Stellen.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-22",
    title: "Erste Version",
    changes: [
      "Lernkern: Decks/Karten, Spaced Repetition, XP/Level/Streak.",
      "Statistiken & Achievements.",
      "Content-Packs (Import/Export) inklusive Beispiel-Pack.",
      "Backup & Wiederherstellung.",
      "KI mit eigenem API-Key: Tutor und Material → Karten.",
    ],
  },
];
