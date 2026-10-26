-- First-party, owner-only Magnanimous Cloud desired-state control on the existing D1 rail.
-- These records NEVER provision provider compute, DNS authority, or paid capacity.
CREATE TABLE IF NOT EXISTS magnanimous_cloud_edge_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magnanimous_cloud_edge_resources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES magnanimous_cloud_edge_projects(id),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  state TEXT NOT NULL,
  desired_state TEXT NOT NULL,
  capacity_class TEXT NOT NULL,
  spec_json TEXT NOT NULL DEFAULT '{}',
  status_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mcloud_edge_resource_scope
  ON magnanimous_cloud_edge_resources(project_id,kind,updated_at DESC);

CREATE TABLE IF NOT EXISTS magnanimous_cloud_edge_actions (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES magnanimous_cloud_edge_resources(id),
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mcloud_edge_action_resource
  ON magnanimous_cloud_edge_actions(resource_id,created_at DESC);

INSERT OR IGNORE INTO magnanimous_cloud_edge_projects
  (id,name,slug,description,created_at,updated_at)
VALUES
  ('mcloud-edge-project-core','Magnanimous Core','magnanimous-core','Owner-scoped native desired-state control plane; does not provision paid capacity.',unixepoch(),unixepoch());
