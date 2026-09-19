-- Make admin/account compatibility schema deployment-owned.
-- Runtime requests verify these tables instead of issuing DDL.

CREATE TABLE IF NOT EXISTS auth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  tenant_id TEXT,
  email TEXT NOT NULL,
  event TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user
  ON auth_events(user_id,created_at);

CREATE TABLE IF NOT EXISTS auth_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
