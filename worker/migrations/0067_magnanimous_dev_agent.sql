CREATE TABLE IF NOT EXISTS magnanimous_dev_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  repo TEXT NOT NULL,
  action TEXT NOT NULL,
  risk_class TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'needs_confirmation',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  completed_at INTEGER,
  response_status INTEGER,
  response_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_dev_actions_tenant_created
  ON magnanimous_dev_actions(tenant_id, created_at DESC);
