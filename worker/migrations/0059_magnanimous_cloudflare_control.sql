-- Magnanimous Cloudflare Control Plane.
-- External Cloudflare provider actions remain subordinate to Magnanimous AI.
-- Mutations are staged and separately confirmed; hard spend/security/network locks are enforced in runtime.

CREATE TABLE IF NOT EXISTS magnanimous_cloudflare_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  method TEXT NOT NULL,
  api_path TEXT NOT NULL,
  request_body_json TEXT NOT NULL DEFAULT '{}',
  risk_class TEXT NOT NULL DEFAULT 'mutation',
  status TEXT NOT NULL DEFAULT 'needs_confirmation',
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  completed_at INTEGER,
  response_status INTEGER,
  response_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_cloudflare_actions_tenant_created
ON magnanimous_cloudflare_actions(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_magnanimous_cloudflare_actions_status_created
ON magnanimous_cloudflare_actions(status, created_at);

CREATE TABLE IF NOT EXISTS magnanimous_cloudflare_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action_id TEXT,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  request_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_cloudflare_audit_tenant_created
ON magnanimous_cloudflare_audit(tenant_id, created_at DESC);
