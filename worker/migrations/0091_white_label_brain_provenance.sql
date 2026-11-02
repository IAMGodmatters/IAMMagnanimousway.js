-- Provenance-first claims for Magnanimous White Label memory.
-- Additive only: existing lesson and signal APIs remain unchanged.

CREATE TABLE IF NOT EXISTS white_label_brain_sources (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  source_type TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT '',
  source_uri TEXT NOT NULL DEFAULT '',
  trust_tier TEXT NOT NULL DEFAULT 'unverified',
  captured_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_wlbl_brain_sources_scope
  ON white_label_brain_sources(tenant_id,client_id,app,captured_at DESC);

CREATE TABLE IF NOT EXISTS white_label_brain_claims (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  claim_key TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'fact',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','conflicted','superseded','withdrawn')),
  confidence REAL NOT NULL DEFAULT 0.75,
  supersedes_claim_id TEXT,
  observed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wlbl_brain_claims_scope
  ON white_label_brain_claims(tenant_id,client_id,app,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS white_label_brain_claim_sources (
  tenant_id TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'supports'
    CHECK(relation IN ('supports','contradicts')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,claim_id,source_id,relation)
);

CREATE INDEX IF NOT EXISTS idx_wlbl_brain_claim_sources_claim
  ON white_label_brain_claim_sources(tenant_id,claim_id);
