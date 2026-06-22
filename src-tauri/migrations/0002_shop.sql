-- OpenLearn schema v2: cosmetic shop ownership.
-- Forward-only. Equipped cosmetics live in settings (theme, avatar); coins live
-- in the profile table. This only tracks which paid items the user owns.

CREATE TABLE IF NOT EXISTS shop_owned (
  item_id     TEXT PRIMARY KEY,
  acquired_at INTEGER NOT NULL
);
