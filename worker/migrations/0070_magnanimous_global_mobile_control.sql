-- Magnanimous Telecom global mobile wholesale/roaming control plane.
-- Additive metadata only. This does NOT create an MVNO contract, roaming agreement,
-- spectrum authority, HNI assignment, radio access, or regulator authorization.
-- Provider credentials and SIM authentication secrets remain outside D1.

CREATE TABLE IF NOT EXISTS telecom_mobile_home_identities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Magnanimous Home Network',
  country_code TEXT NOT NULL DEFAULT '',
  mcc TEXT NOT NULL DEFAULT '',
  mnc TEXT NOT NULL DEFAULT '',
  hni TEXT NOT NULL DEFAULT '',
  identity_type TEXT NOT NULL DEFAULT 'mvno',
  assignment_status TEXT NOT NULL DEFAULT 'planned',
  authority_reference TEXT NOT NULL DEFAULT '',
  evidence_reference TEXT NOT NULL DEFAULT '',
  provider_contract_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,hni)
);

CREATE TABLE IF NOT EXISTS telecom_mobile_wholesale_agreements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'host_mno',
  status TEXT NOT NULL DEFAULT 'planned',
  home_identity_id TEXT,
  services_json TEXT NOT NULL DEFAULT '[]',
  countries_json TEXT NOT NULL DEFAULT '[]',
  effective_from INTEGER,
  effective_to INTEGER,
  evidence_reference TEXT NOT NULL DEFAULT '',
  pricing_reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_mobile_roaming_coverage (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agreement_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  network_code TEXT NOT NULL DEFAULT '',
  network_label TEXT NOT NULL DEFAULT '',
  services_json TEXT NOT NULL DEFAULT '[]',
  access_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'planned',
  breakout_region TEXT NOT NULL DEFAULT '',
  quality_score REAL NOT NULL DEFAULT 50,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  data_cost_micros_per_mb INTEGER NOT NULL DEFAULT 0,
  voice_cost_micros_per_minute INTEGER NOT NULL DEFAULT 0,
  sms_cost_micros INTEGER NOT NULL DEFAULT 0,
  origin_currency TEXT NOT NULL DEFAULT 'USD',
  origin_cost_reference TEXT NOT NULL DEFAULT '',
  origin_cost_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,agreement_id,country_code,network_code)
);

CREATE TABLE IF NOT EXISTS telecom_mobile_access_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Global mobile default',
  primary_sim_id TEXT NOT NULL DEFAULT '',
  backup_sim_id TEXT NOT NULL DEFAULT '',
  selection_mode TEXT NOT NULL DEFAULT 'balanced',
  manual_network_selection INTEGER NOT NULL DEFAULT 1,
  max_data_cost_micros_per_mb INTEGER NOT NULL DEFAULT 0,
  max_voice_cost_micros_per_minute INTEGER NOT NULL DEFAULT 0,
  max_sms_cost_micros INTEGER NOT NULL DEFAULT 0,
  max_latency_ms INTEGER NOT NULL DEFAULT 0,
  min_quality_score REAL NOT NULL DEFAULT 0,
  preferred_breakout_regions_json TEXT NOT NULL DEFAULT '[]',
  fallback_order_json TEXT NOT NULL DEFAULT '["primary","backup","app_dialer"]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mobile_hni_status ON telecom_mobile_home_identities(tenant_id,assignment_status,hni);
CREATE INDEX IF NOT EXISTS idx_mobile_wholesale_status ON telecom_mobile_wholesale_agreements(tenant_id,status,provider_key);
CREATE INDEX IF NOT EXISTS idx_mobile_roaming_country ON telecom_mobile_roaming_coverage(tenant_id,country_code,status,quality_score);
CREATE INDEX IF NOT EXISTS idx_mobile_access_policy_status ON telecom_mobile_access_policies(tenant_id,status,updated_at);
