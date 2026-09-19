-- Materialization support for the Magnanimous full capability brain.
-- Creates the global Tool Foundry tables at migration time so deployment can persist
-- every connector/plugin/skill specification before serving the new release.
-- This migration stores provider-neutral workflow specifications only.

CREATE TABLE IF NOT EXISTS magnanimous_tool_gaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  example_task TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'observed',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,capability)
);

CREATE TABLE IF NOT EXISTS magnanimous_native_tool_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  family TEXT NOT NULL DEFAULT 'general',
  inputs_json TEXT NOT NULL DEFAULT '{}',
  outputs_json TEXT NOT NULL DEFAULT '{}',
  steps_json TEXT NOT NULL DEFAULT '[]',
  risk TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'draft',
  uses INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,name)
);

CREATE TABLE IF NOT EXISTS magnanimous_capability_materialization_state (
  id TEXT PRIMARY KEY,
  manifest_count INTEGER NOT NULL DEFAULT 0,
  ledger_count INTEGER NOT NULL DEFAULT 0,
  tool_spec_count INTEGER NOT NULL DEFAULT 0,
  source_digest TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_native_tool_specs_global_status
  ON magnanimous_native_tool_specs(tenant_id,user_id,status,risk,updated_at DESC);
