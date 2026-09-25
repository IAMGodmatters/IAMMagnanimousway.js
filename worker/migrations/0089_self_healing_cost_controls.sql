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

CREATE TABLE IF NOT EXISTS billing_pass_through_charges (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 tenant_id TEXT NOT NULL,
 period_key TEXT NOT NULL,
 category TEXT NOT NULL,
 provider TEXT NOT NULL DEFAULT '',
 reference_id TEXT NOT NULL DEFAULT '',
 origin_cost_usd REAL NOT NULL DEFAULT 0,
 markup_percent REAL NOT NULL DEFAULT 20,
 customer_charge_usd REAL NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_pass_through_tenant_period
 ON billing_pass_through_charges(tenant_id,period_key,created_at DESC);
