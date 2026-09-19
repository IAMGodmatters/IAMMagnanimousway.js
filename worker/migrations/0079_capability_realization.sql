-- Evidence-gated realization ledger for absorbed connector/plugin/skill capabilities.
-- A capability is only marked native-ready when a Magnanimous-owned runtime surface is proven.
-- External account/data/network/payment/repository boundaries remain explicit.

CREATE TABLE IF NOT EXISTS magnanimous_capability_realizations (
  connector_id TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  native_target TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'specified',
  status TEXT NOT NULL DEFAULT 'specified-only',
  native_route TEXT NOT NULL DEFAULT '',
  evidence_module TEXT NOT NULL DEFAULT '',
  boundary TEXT NOT NULL DEFAULT 'none',
  requires_external INTEGER NOT NULL DEFAULT 0,
  proof_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(connector_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_capability_realizations_status
  ON magnanimous_capability_realizations(status,native_target,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_capability_realizations_tool
  ON magnanimous_capability_realizations(tool_name);

CREATE TABLE IF NOT EXISTS magnanimous_capability_realization_state (
  id TEXT PRIMARY KEY,
  manifest_count INTEGER NOT NULL DEFAULT 0,
  native_ready_count INTEGER NOT NULL DEFAULT 0,
  hybrid_ready_count INTEGER NOT NULL DEFAULT 0,
  bridge_required_count INTEGER NOT NULL DEFAULT 0,
  specified_only_count INTEGER NOT NULL DEFAULT 0,
  source_digest TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at INTEGER NOT NULL
);
