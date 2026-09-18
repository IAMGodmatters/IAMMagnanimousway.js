-- Magnanimous platform-issued credentials and assessment engine
CREATE TABLE IF NOT EXISTS credential_programs(
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 owner_user_id TEXT NOT NULL,
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 issuer_name TEXT NOT NULL DEFAULT 'I AM MAGNANIMOUS WAY',
 questions_json TEXT NOT NULL DEFAULT '[]',
 passing_score REAL NOT NULL DEFAULT 80,
 visibility TEXT NOT NULL DEFAULT 'workspace',
 status TEXT NOT NULL DEFAULT 'draft',
 accreditation_status TEXT NOT NULL DEFAULT 'platform-issued',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_credential_programs_owner ON credential_programs(tenant_id,owner_user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS credential_attempts(
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 program_id TEXT NOT NULL,
 score REAL NOT NULL DEFAULT 0,
 passed INTEGER NOT NULL DEFAULT 0,
 answers_json TEXT NOT NULL DEFAULT '[]',
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_credential_attempts_user ON credential_attempts(tenant_id,user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS credential_awards(
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 program_id TEXT NOT NULL,
 attempt_id TEXT NOT NULL,
 award_code TEXT NOT NULL UNIQUE,
 recipient_name TEXT NOT NULL,
 issuer_name TEXT NOT NULL,
 credential_title TEXT NOT NULL,
 score REAL NOT NULL DEFAULT 0,
 issued_at INTEGER NOT NULL,
 expires_at INTEGER,
 public_share INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'active',
 accreditation_status TEXT NOT NULL DEFAULT 'platform-issued',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_credential_awards_user ON credential_awards(tenant_id,user_id,issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_credential_awards_code ON credential_awards(award_code);
