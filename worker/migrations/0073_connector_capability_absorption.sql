-- Durable per-connector, per-capability absorption ledger for Magnanimous AI.
-- This stores provider-neutral capability specifications and research provenance.
-- It never stores provider secrets, proprietary source code, hidden prompts, or model weights.

CREATE TABLE IF NOT EXISTS magnanimous_connector_capability_absorption (
  connector_id TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  connector_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  native_target TEXT NOT NULL DEFAULT '',
  boundary TEXT NOT NULL DEFAULT 'none',
  source_kind TEXT NOT NULL DEFAULT 'benchmark-contract',
  status TEXT NOT NULL DEFAULT 'brain-spec-absorbed',
  research_json TEXT NOT NULL DEFAULT '{}',
  spec_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(connector_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_connector_absorption_target
  ON magnanimous_connector_capability_absorption(native_target, status, updated_at DESC);
