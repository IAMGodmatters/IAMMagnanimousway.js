CREATE TABLE IF NOT EXISTS magnanimous_web_monitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  request_json TEXT NOT NULL DEFAULT '{}',
  interval_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'active',
  last_task_id TEXT,
  last_run_at INTEGER NOT NULL DEFAULT 0,
  next_run_at INTEGER NOT NULL DEFAULT 0,
  last_result_hash TEXT NOT NULL DEFAULT '',
  last_changed_at INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_native_web_monitors_due
  ON magnanimous_web_monitors(status, next_run_at);

CREATE INDEX IF NOT EXISTS idx_native_web_monitors_tenant
  ON magnanimous_web_monitors(tenant_id, created_at DESC);
