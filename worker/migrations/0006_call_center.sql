CREATE TABLE IF NOT EXISTS call_center_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  extension TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  skills TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_call_center_agent_user
  ON call_center_agents(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_call_center_agent_status
  ON call_center_agents(tenant_id, status, active);

CREATE TABLE IF NOT EXISTS call_queues (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'longest_idle',
  greeting TEXT NOT NULL DEFAULT '',
  max_wait_seconds INTEGER NOT NULL DEFAULT 300,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_queues_tenant
  ON call_queues(tenant_id, active);

CREATE TABLE IF NOT EXISTS call_queue_members (
  queue_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(queue_id, agent_id)
);

CREATE TABLE IF NOT EXISTS call_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  call_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_events_call
  ON call_events(tenant_id, call_id, created_at);

ALTER TABLE phone_calls ADD COLUMN provider TEXT NOT NULL DEFAULT 'browser';
ALTER TABLE phone_calls ADD COLUMN provider_call_id TEXT NOT NULL DEFAULT '';
ALTER TABLE phone_calls ADD COLUMN queue_id TEXT;
ALTER TABLE phone_calls ADD COLUMN agent_id TEXT;
ALTER TABLE phone_calls ADD COLUMN disposition TEXT NOT NULL DEFAULT '';
ALTER TABLE phone_calls ADD COLUMN recording_url TEXT NOT NULL DEFAULT '';
ALTER TABLE phone_calls ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE phone_calls ADD COLUMN updated_at INTEGER;
