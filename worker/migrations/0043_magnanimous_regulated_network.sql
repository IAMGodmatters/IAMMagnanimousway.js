-- Magnanimous Telecom regulated-network integration foundation.
-- Additive metadata only. Provider/API secrets must live in encrypted runtime bindings.

CREATE TABLE IF NOT EXISTS telecom_network_providers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'wholesale',
  status TEXT NOT NULL DEFAULT 'planned',
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  secret_binding_name TEXT NOT NULL DEFAULT '',
  account_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, provider_key, role)
);

CREATE TABLE IF NOT EXISTS telecom_regulatory_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  authority_key TEXT NOT NULL,
  authority_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  application_reference TEXT NOT NULL DEFAULT '',
  evidence_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, jurisdiction, authority_key)
);

CREATE TABLE IF NOT EXISTS telecom_network_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  provider_key TEXT NOT NULL DEFAULT '',
  jurisdiction TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_network_provider_status ON telecom_network_providers(tenant_id,status,provider_key);
CREATE INDEX IF NOT EXISTS idx_telecom_regulatory_case_status ON telecom_regulatory_cases(tenant_id,jurisdiction,status);
CREATE INDEX IF NOT EXISTS idx_telecom_network_events_time ON telecom_network_events(tenant_id,created_at);
