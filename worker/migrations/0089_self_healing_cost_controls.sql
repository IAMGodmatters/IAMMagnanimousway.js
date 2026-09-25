CREATE TABLE IF NOT EXISTS magnanimous_provider_health (
 provider TEXT PRIMARY KEY,
 status TEXT NOT NULL DEFAULT 'healthy',
 consecutive_failures INTEGER NOT NULL DEFAULT 0,
 last_failure_class TEXT NOT NULL DEFAULT '',
 cooldown_until INTEGER NOT NULL DEFAULT 0,
 last_failure_at INTEGER,
 last_success_at INTEGER,
 last_latency_ms INTEGER NOT NULL DEFAULT 0,
 last_model TEXT NOT NULL DEFAULT '',
 updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magnanimous_self_heal_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 component TEXT NOT NULL,
 target TEXT NOT NULL DEFAULT '',
 action TEXT NOT NULL,
 status TEXT NOT NULL,
 detail TEXT NOT NULL DEFAULT '',
 created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_self_heal_events_time
 ON magnanimous_self_heal_events(created_at DESC);

ALTER TABLE billing_usage_events ADD COLUMN markup_percent REAL NOT NULL DEFAULT 20;
ALTER TABLE billing_usage_events ADD COLUMN customer_charge_usd REAL NOT NULL DEFAULT 0;
