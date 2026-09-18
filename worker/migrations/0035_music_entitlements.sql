CREATE TABLE IF NOT EXISTS music_entitlements (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL DEFAULT '',
  stripe_subscription_id TEXT NOT NULL DEFAULT '',
  stripe_event_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id,user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_music_entitlement_subscription ON music_entitlements(stripe_subscription_id) WHERE stripe_subscription_id <> '';
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
