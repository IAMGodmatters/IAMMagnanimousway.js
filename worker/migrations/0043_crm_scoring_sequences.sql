-- Magnanimous CRM configurable scoring + consent-aware sequence execution.
CREATE TABLE IF NOT EXISTS crm_scoring_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  score_type TEXT NOT NULL DEFAULT 'combined',
  enabled INTEGER NOT NULL DEFAULT 1,
  rules_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  next_due_at INTEGER,
  goal TEXT NOT NULL DEFAULT 'reply',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_sequence_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  step_index INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

ALTER TABLE crm_activities ADD COLUMN sequence_enrollment_id TEXT;
ALTER TABLE crm_activities ADD COLUMN sequence_step_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_crm_scoring_profiles_tenant ON crm_scoring_profiles(tenant_id,enabled);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_contact ON crm_sequence_enrollments(tenant_id,contact_id,status);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_sequence ON crm_sequence_enrollments(tenant_id,sequence_id,status);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_events_enrollment ON crm_sequence_events(tenant_id,enrollment_id,id);
