CREATE TABLE IF NOT EXISTS voice_agent_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  elevenlabs_agent_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_agent_calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT '',
  to_number TEXT NOT NULL,
  from_number TEXT NOT NULL,
  twilio_call_sid TEXT NOT NULL DEFAULT '',
  conversation_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_tenant
  ON voice_agent_calls(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS voice_agent_tokens (
  token TEXT PRIMARY KEY,
  call_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
