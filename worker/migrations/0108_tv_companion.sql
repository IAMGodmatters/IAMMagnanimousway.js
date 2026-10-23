-- Independent, token-scoped TV pairing. Neither Google credentials nor media are stored.
CREATE TABLE IF NOT EXISTS tv_companion_sessions (
  id TEXT PRIMARY KEY,
  pair_code_hash TEXT NOT NULL UNIQUE,
  tv_token_hash TEXT NOT NULL,
  remote_token_hash TEXT,
  created_at INTEGER NOT NULL,
  pair_expires_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  paired_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tv_companion_expiry ON tv_companion_sessions(expires_at);
CREATE TABLE IF NOT EXISTS tv_companion_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES tv_companion_sessions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tv_companion_pending ON tv_companion_commands(session_id,id);
CREATE TABLE IF NOT EXISTS tv_companion_limits (
  key TEXT PRIMARY KEY,
  window_minute INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
