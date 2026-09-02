CREATE TABLE IF NOT EXISTS call_center_kpi_targets (
  tenant_id TEXT PRIMARY KEY,
  service_level_target REAL NOT NULL DEFAULT 80,
  asa_target_seconds INTEGER NOT NULL DEFAULT 30,
  abandon_target_pct REAL NOT NULL DEFAULT 5,
  qa_target REAL NOT NULL DEFAULT 90,
  csat_target REAL NOT NULL DEFAULT 4.5,
  adherence_target REAL NOT NULL DEFAULT 90,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS call_center_forecasts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_id TEXT,
  forecast_date INTEGER NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 30,
  forecast_contacts INTEGER NOT NULL DEFAULT 0,
  forecast_aht_seconds INTEGER NOT NULL DEFAULT 0,
  required_agents REAL NOT NULL DEFAULT 0,
  actual_contacts INTEGER,
  actual_aht_seconds INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_call_center_forecasts_date ON call_center_forecasts(tenant_id,forecast_date,queue_id);

CREATE TABLE IF NOT EXISTS call_center_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  worker_id TEXT,
  queue_id TEXT,
  shift_start INTEGER NOT NULL,
  shift_end INTEGER NOT NULL,
  scheduled_seconds INTEGER NOT NULL DEFAULT 0,
  actual_logged_seconds INTEGER NOT NULL DEFAULT 0,
  adherence_pct REAL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_call_center_schedules_shift ON call_center_schedules(tenant_id,shift_start,agent_id);

CREATE TABLE IF NOT EXISTS call_center_quality_reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  call_id INTEGER,
  agent_id TEXT,
  qa_score REAL,
  csat_score REAL,
  first_contact_resolved INTEGER,
  coaching_needed INTEGER NOT NULL DEFAULT 0,
  review_notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_call_center_quality_tenant ON call_center_quality_reviews(tenant_id,created_at,agent_id);
