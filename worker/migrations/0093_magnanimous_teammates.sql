-- Original Magnanimous implementation; no third-party model or application data.
CREATE TABLE IF NOT EXISTS magnanimous_teammates (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  name TEXT NOT NULL, role TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', busy_run_id TEXT NOT NULL DEFAULT '', busy_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_teammates_owner ON magnanimous_teammates(tenant_id,user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS magnanimous_teammate_memories (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, teammate_id TEXT NOT NULL,
  memory_key TEXT NOT NULL, memory_value TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,teammate_id,memory_key)
);
CREATE TABLE IF NOT EXISTS magnanimous_teammate_turns (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, teammate_id TEXT NOT NULL,
  request_key TEXT NOT NULL, payload_hash TEXT NOT NULL, message TEXT NOT NULL, output TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'running', source_turn_id TEXT NOT NULL DEFAULT '', sources_json TEXT NOT NULL DEFAULT '[]',
  error_code TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, completed_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tenant_id,user_id,teammate_id,request_key)
);
CREATE INDEX IF NOT EXISTS idx_teammate_turns_owner ON magnanimous_teammate_turns(tenant_id,user_id,teammate_id,created_at DESC);
