-- Magnanimous Vibe Studio Phase 2: bounded, tenant-scoped auxiliary source files.
-- index.html remains in magnanimous_vibe_projects for backward compatibility.
CREATE TABLE IF NOT EXISTS magnanimous_vibe_files (
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (project_id, path),
  FOREIGN KEY (project_id) REFERENCES magnanimous_vibe_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_vibe_files_owner
  ON magnanimous_vibe_files(tenant_id, user_id, project_id, path);
CREATE TABLE IF NOT EXISTS magnanimous_vibe_file_versions (
  project_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  path TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  content TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (project_id, path, revision),
  FOREIGN KEY (project_id) REFERENCES magnanimous_vibe_projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_magnanimous_vibe_file_versions_owner
  ON magnanimous_vibe_file_versions(tenant_id, user_id, project_id, path, revision DESC);
