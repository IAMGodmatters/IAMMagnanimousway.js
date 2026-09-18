-- Magnanimous CRM configurable scoring + consent-aware sequence cadence runtime.
CREATE TABLE IF NOT EXISTS crm_scoring_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  rules_json TEXT NOT NULL DEFAULT '{}',
  thresholds_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  step_index INTEGER NOT NULL DEFAULT 0,
  next_step_at INTEGER,
  goal TEXT NOT NULL DEFAULT 'reply',
  timezone TEXT NOT NULL DEFAULT '',
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS crm_sequence_step_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  step_index INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  status TEXT NOT NULL,
  artifact_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_scoring_active ON crm_scoring_profiles(tenant_id,active,updated_at);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_due ON crm_sequence_enrollments(tenant_id,status,next_step_at);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_contact ON crm_sequence_enrollments(tenant_id,contact_id,status);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_step_runs_enrollment ON crm_sequence_step_runs(tenant_id,enrollment_id,step_index);
