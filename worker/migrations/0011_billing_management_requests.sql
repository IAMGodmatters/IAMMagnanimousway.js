CREATE TABLE IF NOT EXISTS billing_management_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  request_type TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_management_requests_tenant
  ON billing_management_requests(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_management_requests_status
  ON billing_management_requests(status, created_at DESC);
