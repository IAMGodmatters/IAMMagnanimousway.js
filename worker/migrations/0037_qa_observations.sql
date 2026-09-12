CREATE TABLE IF NOT EXISTS qa_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  http_status INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  agent_id TEXT NOT NULL DEFAULT '',
  question_excerpt TEXT NOT NULL DEFAULT '',
  answer_excerpt TEXT NOT NULL DEFAULT '',
  error_excerpt TEXT NOT NULL DEFAULT '',
  resolved INTEGER NOT NULL DEFAULT 0,
  owner_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qa_observations_time ON qa_observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_observations_kind_time ON qa_observations(kind,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_observations_unresolved ON qa_observations(resolved,http_status,created_at DESC);
