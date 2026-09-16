-- Durable Magnanimous DNS/provider action ledger.
-- Consequential registrar DNS changes are dry-run first, staged, and separately confirmed.
CREATE TABLE IF NOT EXISTS magnanimous_dns_provider_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  preview_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_dns_provider_actions_tenant
ON magnanimous_dns_provider_actions(tenant_id,created_at DESC);
