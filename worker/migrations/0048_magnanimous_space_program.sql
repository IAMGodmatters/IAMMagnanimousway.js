CREATE TABLE IF NOT EXISTS space_programs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_identity TEXT NOT NULL DEFAULT 'God Matters',
  affiliation_identity TEXT NOT NULL DEFAULT 'I AM MAGNANIMOUS WAY™',
  brain_identity TEXT NOT NULL DEFAULT 'Magnanimous AI',
  mission_type TEXT NOT NULL DEFAULT 'technology_demonstration',
  stage TEXT NOT NULL DEFAULT 'concept',
  target_orbit TEXT NOT NULL DEFAULT 'LEO',
  target_launch_at INTEGER,
  hosted_payload_preferred INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS space_mission_requirements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_key TEXT NOT NULL,
  requirement_value TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, program_id, requirement_type, requirement_key)
);

CREATE TABLE IF NOT EXISTS space_regulatory_gates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  authority_name TEXT NOT NULL,
  gate_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  evidence_ref TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, program_id, jurisdiction, gate_key)
);

CREATE TABLE IF NOT EXISTS space_ground_adapters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'managed_ground_station',
  endpoint_ref TEXT NOT NULL DEFAULT '',
  secret_binding_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  transmit_authorized INTEGER NOT NULL DEFAULT 0,
  receive_authorized INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS space_launch_options (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  launch_mode TEXT NOT NULL DEFAULT 'rideshare',
  orbit_offer TEXT NOT NULL DEFAULT '',
  mass_limit_kg REAL,
  public_price_note TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'research',
  purchase_authorized INTEGER NOT NULL DEFAULT 0 CHECK(purchase_authorized=0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS space_spacecraft_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  spacecraft_name TEXT NOT NULL,
  ownership_status TEXT NOT NULL DEFAULT 'planned',
  norad_id TEXT NOT NULL DEFAULT '',
  cospar_id TEXT NOT NULL DEFAULT '',
  operational_status TEXT NOT NULL DEFAULT 'planned',
  flight_command_enabled INTEGER NOT NULL DEFAULT 0 CHECK(flight_command_enabled=0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_space_programs_tenant ON space_programs(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_space_requirements_program ON space_mission_requirements(tenant_id, program_id, status);
CREATE INDEX IF NOT EXISTS idx_space_regulatory_program ON space_regulatory_gates(tenant_id, program_id, status);
CREATE INDEX IF NOT EXISTS idx_space_ground_program ON space_ground_adapters(tenant_id, program_id, status);
CREATE INDEX IF NOT EXISTS idx_space_launch_program ON space_launch_options(tenant_id, program_id, status);
