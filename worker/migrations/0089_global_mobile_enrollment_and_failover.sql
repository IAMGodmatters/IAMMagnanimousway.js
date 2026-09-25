-- Magnanimous-owned mobile enrollment and independent-backup evidence.
-- These are control-plane credentials/evidence only. They are not carrier SIM/eSIM
-- authentication secrets and cannot replace provider-issued activation material.

CREATE TABLE IF NOT EXISTS telecom_mobile_enrollment_tokens (
  token_hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  line_id TEXT,
  purpose TEXT NOT NULL DEFAULT 'profile_enrollment' CHECK(purpose IN ('profile_enrollment','backup_enrollment')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','redeemed','expired','revoked')),
  expires_at INTEGER NOT NULL,
  redeemed_at INTEGER,
  redeemed_by TEXT NOT NULL DEFAULT '',
  device_ref TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telecom_mobile_failover_proofs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  line_id TEXT,
  primary_profile_id TEXT NOT NULL,
  backup_profile_id TEXT NOT NULL,
  primary_network_group TEXT NOT NULL,
  backup_network_group TEXT NOT NULL,
  trigger_event_id TEXT NOT NULL,
  backup_event_id TEXT NOT NULL,
  restoration_event_id TEXT NOT NULL DEFAULT '',
  evidence_reference TEXT NOT NULL DEFAULT '',
  independent_network_verified INTEGER NOT NULL DEFAULT 0 CHECK(independent_network_verified IN (0,1)),
  observed_failover INTEGER NOT NULL DEFAULT 0 CHECK(observed_failover IN (0,1)),
  status TEXT NOT NULL DEFAULT 'verified' CHECK(status IN ('pending','verified','rejected','retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mobile_enrollment_profile ON telecom_mobile_enrollment_tokens(tenant_id,profile_id,status,expires_at);
CREATE INDEX IF NOT EXISTS idx_mobile_failover_line ON telecom_mobile_failover_proofs(tenant_id,line_id,status,created_at);
