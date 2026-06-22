-- OpenLearn schema v1. Forward-only; add a new file, never edit a shipped one.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS deck (
  id            TEXT PRIMARY KEY,
  parent_id     TEXT REFERENCES deck(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  taxonomy_code TEXT,
  area          INTEGER,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deck_parent ON deck(parent_id);

CREATE TABLE IF NOT EXISTS card (
  id             TEXT PRIMARY KEY,
  deck_id        TEXT NOT NULL REFERENCES deck(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  prompt_md      TEXT NOT NULL,
  explanation_md TEXT,
  payload_json   TEXT NOT NULL DEFAULT '{}',
  difficulty     INTEGER NOT NULL DEFAULT 2,
  content_hash   TEXT,
  origin         TEXT NOT NULL DEFAULT 'user',
  suspended      INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_card_deck ON card(deck_id);
CREATE INDEX IF NOT EXISTS idx_card_hash ON card(content_hash);

CREATE TABLE IF NOT EXISTS tag (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS card_tag (
  card_id TEXT NOT NULL REFERENCES card(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

CREATE TABLE IF NOT EXISTS schedule (
  card_id       TEXT PRIMARY KEY REFERENCES card(id) ON DELETE CASCADE,
  due           INTEGER NOT NULL,
  state         TEXT NOT NULL DEFAULT 'new',
  reps          INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  ease          REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  last_review   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_schedule_due ON schedule(due);
CREATE INDEX IF NOT EXISTS idx_schedule_state ON schedule(state);

CREATE TABLE IF NOT EXISTS review_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id       TEXT NOT NULL REFERENCES card(id) ON DELETE CASCADE,
  ts            INTEGER NOT NULL,
  rating        TEXT NOT NULL,
  correct       INTEGER NOT NULL,
  interval_days REAL NOT NULL,
  ease          REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviewlog_card ON review_log(card_id);
CREATE INDEX IF NOT EXISTS idx_reviewlog_ts ON review_log(ts);

CREATE TABLE IF NOT EXISTS profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  xp              INTEGER NOT NULL DEFAULT 0,
  coins           INTEGER NOT NULL DEFAULT 0,
  streak_current  INTEGER NOT NULL DEFAULT 0,
  streak_longest  INTEGER NOT NULL DEFAULT 0,
  last_active_day TEXT,
  reviews_today   INTEGER NOT NULL DEFAULT 0,
  reviews_day     TEXT
);
INSERT OR IGNORE INTO profile (id) VALUES (1);

CREATE TABLE IF NOT EXISTS xp_ledger (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     INTEGER NOT NULL,
  source TEXT NOT NULL,
  amount INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xpledger_ts ON xp_ledger(ts);
