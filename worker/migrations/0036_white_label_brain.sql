CREATE TABLE IF NOT EXISTS white_label_brain_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  lesson_key TEXT NOT NULL,
  lesson_value TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0.75,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,client_id,app,lesson_key)
);

CREATE INDEX IF NOT EXISTS idx_white_label_brain_memory
  ON white_label_brain_memory(tenant_id,user_id,client_id,app,updated_at DESC);

CREATE TABLE IF NOT EXISTS white_label_brain_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  event_type TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  success INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_white_label_brain_signals
  ON white_label_brain_signals(tenant_id,user_id,app,created_at DESC);
