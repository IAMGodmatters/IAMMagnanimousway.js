CREATE TABLE IF NOT EXISTS telecom_global_mobile_profiles (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  assistant_mode TEXT NOT NULL DEFAULT 'missed_only',
  ring_mode TEXT NOT NULL DEFAULT 'always',
  spam_action TEXT NOT NULL DEFAULT 'screen',
  assistant_voice TEXT NOT NULL DEFAULT 'neutral',
  assistant_tone TEXT NOT NULL DEFAULT 'helpful',
  summary_enabled INTEGER NOT NULL DEFAULT 1,
  transcript_enabled INTEGER NOT NULL DEFAULT 1,
  recording_enabled INTEGER NOT NULL DEFAULT 0,
  recording_jurisdiction TEXT NOT NULL DEFAULT '',
  forwarding_mode TEXT NOT NULL DEFAULT 'off',
  forwarding_target_ref TEXT NOT NULL DEFAULT '',
  network_selection_mode TEXT NOT NULL DEFAULT 'automatic',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,user_id)
);

CREATE TABLE IF NOT EXISTS telecom_global_mobile_lines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  manager_user_id TEXT NOT NULL,
  member_label TEXT NOT NULL,
  line_role TEXT NOT NULL DEFAULT 'additional',
  existing_number_id TEXT NOT NULL DEFAULT '',
  plan_id TEXT NOT NULL DEFAULT '',
  device_ref TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_global_mobile_lines_tenant
  ON telecom_global_mobile_lines(tenant_id,updated_at);

CREATE TABLE IF NOT EXISTS telecom_global_mobile_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  manager_user_id TEXT NOT NULL,
  line_id TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'other',
  device_model TEXT NOT NULL DEFAULT '',
  esim_capable INTEGER NOT NULL DEFAULT 0,
  unlocked_confirmed INTEGER NOT NULL DEFAULT 0,
  preferred_access TEXT NOT NULL DEFAULT 'auto',
  backup_enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'needs_review',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telecom_global_mobile_devices_tenant
  ON telecom_global_mobile_devices(tenant_id,updated_at);

CREATE TABLE IF NOT EXISTS telecom_global_mobile_blocklist (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT 'spam',
  created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_telecom_global_mobile_blocklist_lookup
  ON telecom_global_mobile_blocklist(tenant_id,user_id,phone_e164);
