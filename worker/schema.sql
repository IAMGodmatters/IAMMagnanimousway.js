CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Sponsored',
  placement TEXT NOT NULL DEFAULT 'home',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO settings(key,value) VALUES ('site_name','I AM Magnanimous AI Platform');
INSERT OR IGNORE INTO settings(key,value) VALUES ('tagline','Free AI tools, Odin orchestration, and creator tools in one place.');
INSERT OR IGNORE INTO settings(key,value) VALUES ('canva_url','');
