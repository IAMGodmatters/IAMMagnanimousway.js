CREATE TABLE IF NOT EXISTS magnanimous_training_settings (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  minimum_samples INTEGER NOT NULL DEFAULT 4,
  minimum_success_rate REAL NOT NULL DEFAULT 0.75,
  minimum_quality REAL NOT NULL DEFAULT 0.60,
  lookback_days INTEGER NOT NULL DEFAULT 30,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS magnanimous_training_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  ideal_response TEXT NOT NULL,
  lesson_key TEXT NOT NULL DEFAULT '',
  lesson_value TEXT NOT NULL DEFAULT '',
  approved INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'explicit-user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_training_examples_user
  ON magnanimous_training_examples(tenant_id, user_id, approved, updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_training_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL DEFAULT 'general',
  provider TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0,
  correction TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_training_feedback_user
  ON magnanimous_training_feedback(tenant_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_learning_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  provider TEXT NOT NULL,
  samples INTEGER NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 0,
  average_quality REAL NOT NULL DEFAULT 0,
  average_latency_ms REAL NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'observing',
  last_evidence_at INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, user_id, capability, provider)
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_learning_candidates_user
  ON magnanimous_learning_candidates(tenant_id, user_id, status, score DESC);

CREATE TABLE IF NOT EXISTS magnanimous_training_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'cron',
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  outcome_groups_scanned INTEGER NOT NULL DEFAULT 0,
  candidates_promoted INTEGER NOT NULL DEFAULT 0,
  lessons_updated INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_magnanimous_training_runs_started
  ON magnanimous_training_runs(started_at DESC);
