-- Secure outbound Magnanimous Local Bridge.
-- Bridge tokens and pairing codes are stored only as SHA-256 hashes.

CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_pairings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hostname TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_seen_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  risk_class TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'queued',
  result_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  claimed_at INTEGER,
  completed_at INTEGER,
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_local_bridge_devices_tenant
  ON magnanimous_local_bridge_devices(tenant_id,last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_local_bridge_tasks_device
  ON magnanimous_local_bridge_tasks(device_id,status,created_at);
