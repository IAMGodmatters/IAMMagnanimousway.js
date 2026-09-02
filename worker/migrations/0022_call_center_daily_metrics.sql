CREATE TABLE IF NOT EXISTS call_center_daily_metrics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  queue_id TEXT,
  metric_date INTEGER NOT NULL,
  offered INTEGER NOT NULL DEFAULT 0,
  answered INTEGER NOT NULL DEFAULT 0,
  answered_within_target INTEGER NOT NULL DEFAULT 0,
  abandoned INTEGER NOT NULL DEFAULT 0,
  answer_wait_seconds INTEGER NOT NULL DEFAULT 0,
  handle_seconds INTEGER NOT NULL DEFAULT 0,
  after_call_seconds INTEGER NOT NULL DEFAULT 0,
  first_contact_resolved INTEGER NOT NULL DEFAULT 0,
  csat_sum REAL NOT NULL DEFAULT 0,
  csat_count INTEGER NOT NULL DEFAULT 0,
  qa_sum REAL NOT NULL DEFAULT 0,
  qa_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,queue_id,metric_date)
);
CREATE INDEX IF NOT EXISTS idx_call_center_daily_metrics_date ON call_center_daily_metrics(tenant_id,metric_date,queue_id);
