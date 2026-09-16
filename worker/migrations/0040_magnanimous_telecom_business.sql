-- Magnanimous Telecom business foundation.
-- Additive only: preserves the existing phone/call-center schema.
-- Public PSTN, emergency calling and direct-carrier capabilities remain gated
-- until the required external interconnects and legal authorizations exist.

CREATE TABLE IF NOT EXISTS telecom_numbers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  e164 TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'wholesale',
  upstream_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'reserved',
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  emergency_status TEXT NOT NULL DEFAULT 'disabled',
  stir_shaken_status TEXT NOT NULL DEFAULT 'not_configured',
  assigned_user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,e164)
);

CREATE TABLE IF NOT EXISTS telecom_interconnects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'sip_trunk',
  endpoint_ref TEXT NOT NULL DEFAULT '',
  secret_binding_name TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_port_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number_e164 TEXT NOT NULL,
  losing_carrier TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  foc_at INTEGER,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_emergency_locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  number_id TEXT,
  country TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'unverified',
  provider_reference TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_rating_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  call_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  units REAL NOT NULL DEFAULT 0,
  unit_name TEXT NOT NULL DEFAULT 'minute',
  rate REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  rated_at INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS telecom_compliance_controls (
  tenant_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'global',
  control_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  evidence_ref TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,jurisdiction,control_key)
);

CREATE INDEX IF NOT EXISTS idx_telecom_numbers_tenant_status ON telecom_numbers(tenant_id,status);
CREATE INDEX IF NOT EXISTS idx_telecom_interconnects_tenant_active ON telecom_interconnects(tenant_id,active,priority);
CREATE INDEX IF NOT EXISTS idx_telecom_ports_tenant_status ON telecom_port_requests(tenant_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_telecom_emergency_tenant_enabled ON telecom_emergency_locations(tenant_id,enabled);
CREATE INDEX IF NOT EXISTS idx_telecom_rating_tenant_time ON telecom_rating_ledger(tenant_id,rated_at);
CREATE INDEX IF NOT EXISTS idx_telecom_compliance_tenant ON telecom_compliance_controls(tenant_id,jurisdiction,status);
