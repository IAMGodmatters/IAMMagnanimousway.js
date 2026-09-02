CREATE TABLE IF NOT EXISTS voice_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  opening_message TEXT NOT NULL DEFAULT '',
  twilio_voice TEXT NOT NULL DEFAULT '',
  tavus_replica_id TEXT NOT NULL DEFAULT '',
  tavus_persona_id TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_agents_tenant ON voice_agents(tenant_id, active);

CREATE TABLE IF NOT EXISTS voice_agent_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  call_id INTEGER,
  provider_call_id TEXT,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_turns_call ON voice_agent_turns(call_id, id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_turns_provider ON voice_agent_turns(provider_call_id, id);

CREATE TABLE IF NOT EXISTS voice_do_not_call (
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'opt-out',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, phone)
);
