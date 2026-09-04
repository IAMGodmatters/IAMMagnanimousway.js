-- Repair installations where the original combined leads/phone migration was
-- recorded but the browser-call signaling tables were not created.
CREATE TABLE IF NOT EXISTS phone_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  caller_user_id TEXT NOT NULL,
  callee_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phone_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_phone_sessions_tenant
  ON phone_sessions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_phone_signals_session
  ON phone_signals(session_id, id);
