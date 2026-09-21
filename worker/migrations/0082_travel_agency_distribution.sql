-- Magnanimous-owned travel agency pricing, reseller distribution and API-key state.
-- Raw reseller API secrets are never stored; only SHA-256 hashes are persisted.

CREATE TABLE IF NOT EXISTS travel_agency_pricing_policy (
  tenant_id TEXT PRIMARY KEY,
  owner_margin_bps INTEGER NOT NULL DEFAULT 150,
  direct_retail_extra_bps INTEGER NOT NULL DEFAULT 0,
  reseller_default_markup_bps INTEGER NOT NULL DEFAULT 500,
  reseller_max_markup_bps INTEGER NOT NULL DEFAULT 5000,
  quote_ttl_seconds INTEGER NOT NULL DEFAULT 900,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS travel_reseller_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  markup_bps INTEGER NOT NULL DEFAULT 500,
  company_ref TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_travel_reseller_tenant
  ON travel_reseller_accounts(tenant_id,status,updated_at);

CREATE TABLE IF NOT EXISTS travel_source_api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reseller_id TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  created_by TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(reseller_id) REFERENCES travel_reseller_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_travel_source_key_reseller
  ON travel_source_api_keys(tenant_id,reseller_id,status);

CREATE TABLE IF NOT EXISTS travel_quote_evidence (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reseller_id TEXT NOT NULL DEFAULT '',
  request_fingerprint TEXT NOT NULL,
  product TEXT NOT NULL,
  currency TEXT NOT NULL,
  compared_sources INTEGER NOT NULL DEFAULT 0,
  best_supplier TEXT NOT NULL DEFAULT '',
  supplier_offer_ref TEXT NOT NULL DEFAULT '',
  wholesale_minor INTEGER NOT NULL DEFAULT 0,
  sell_minor INTEGER NOT NULL DEFAULT 0,
  owner_margin_minor INTEGER NOT NULL DEFAULT 0,
  reseller_margin_minor INTEGER NOT NULL DEFAULT 0,
  proof_label TEXT NOT NULL DEFAULT '',
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_travel_quote_evidence_tenant
  ON travel_quote_evidence(tenant_id,created_at);

CREATE INDEX IF NOT EXISTS idx_travel_quote_evidence_fingerprint
  ON travel_quote_evidence(tenant_id,request_fingerprint,created_at);
