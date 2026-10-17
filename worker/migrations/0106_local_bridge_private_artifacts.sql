CREATE TABLE IF NOT EXISTS magnanimous_local_bridge_artifacts (
  name TEXT PRIMARY KEY,
  content_base64 TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
