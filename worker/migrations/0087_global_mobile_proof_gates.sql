-- Magnanimous Telecom global-mobile proof gates.
-- Additive metadata only. No raw eSIM activation secrets or carrier authentication material.

CREATE TABLE IF NOT EXISTS telecom_country_capabilities (
  tenant_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  capability TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'unavailable' CHECK(state IN ('unavailable','researching','provider_ready','compliance_pending','authorized','production_verified')),
  evidence_reference TEXT NOT NULL DEFAULT '',
  provider_ref TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  production_verified INTEGER NOT NULL DEFAULT 0 CHECK(production_verified IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,country_code,capability)
);

CREATE TABLE IF NOT EXISTS telecom_mobile_wholesale_offers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  adapter_key TEXT NOT NULL,
  network_group TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  origin_reference TEXT NOT NULL,
  origin_cost_verified INTEGER NOT NULL DEFAULT 0 CHECK(origin_cost_verified IN (0,1)),
  commercial_authorized INTEGER NOT NULL DEFAULT 0 CHECK(commercial_authorized IN (0,1)),
  country_verified INTEGER NOT NULL DEFAULT 0 CHECK(country_verified IN (0,1)),
  data_supported INTEGER NOT NULL DEFAULT 0 CHECK(data_supported IN (0,1)),
  voice_supported INTEGER NOT NULL DEFAULT 0 CHECK(voice_supported IN (0,1)),
  sms_supported INTEGER NOT NULL DEFAULT 0 CHECK(sms_supported IN (0,1)),
  local_breakout INTEGER NOT NULL DEFAULT 0 CHECK(local_breakout IN (0,1)),
  backup_eligible INTEGER NOT NULL DEFAULT 0 CHECK(backup_eligible IN (0,1)),
  origin_monthly_cost REAL NOT NULL DEFAULT 0 CHECK(origin_monthly_cost>=0),
  included_high_speed_gb REAL NOT NULL DEFAULT 0 CHECK(included_high_speed_gb>=0),
  origin_variable_cost_per_gb REAL NOT NULL DEFAULT 0 CHECK(origin_variable_cost_per_gb>=0),
  funded_variable_cost_cap REAL NOT NULL DEFAULT 0 CHECK(funded_variable_cost_cap>=0),
  mandatory_taxes_and_fees REAL NOT NULL DEFAULT 0 CHECK(mandatory_taxes_and_fees>=0),
  observed_latency_ms REAL NOT NULL DEFAULT 0 CHECK(observed_latency_ms>=0),
  quality_score REAL NOT NULL DEFAULT 0.5 CHECK(quality_score>=0 AND quality_score<=1),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','verified','active','retired')),
  valid_from INTEGER,
  valid_to INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_mobile_access_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  line_id TEXT,
  sim_id TEXT,
  adapter_key TEXT NOT NULL,
  provider_profile_ref TEXT NOT NULL DEFAULT '',
  network_group TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  profile_role TEXT NOT NULL DEFAULT 'primary' CHECK(profile_role IN ('primary','backup')),
  apn_profile_id TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','provisioning','active','degraded','suspended','retired')),
  last_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_mobile_connectivity_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  line_id TEXT,
  country_code TEXT NOT NULL DEFAULT '',
  serving_network_ref TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL CHECK(event_type IN ('attach','detach','quality','failover','recovery')),
  latency_ms REAL NOT NULL DEFAULT 0 CHECK(latency_ms>=0),
  packet_loss_percent REAL NOT NULL DEFAULT 0 CHECK(packet_loss_percent>=0 AND packet_loss_percent<=100),
  downlink_mbps REAL NOT NULL DEFAULT 0 CHECK(downlink_mbps>=0),
  uplink_mbps REAL NOT NULL DEFAULT 0 CHECK(uplink_mbps>=0),
  failover_reason TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_country_capability_state ON telecom_country_capabilities(tenant_id,country_code,state,capability);
CREATE INDEX IF NOT EXISTS idx_telecom_mobile_offer_country ON telecom_mobile_wholesale_offers(tenant_id,country_code,status,adapter_key);
CREATE INDEX IF NOT EXISTS idx_telecom_mobile_profile_line ON telecom_mobile_access_profiles(tenant_id,line_id,status,profile_role);
CREATE INDEX IF NOT EXISTS idx_telecom_mobile_connectivity_profile ON telecom_mobile_connectivity_events(tenant_id,profile_id,created_at);
