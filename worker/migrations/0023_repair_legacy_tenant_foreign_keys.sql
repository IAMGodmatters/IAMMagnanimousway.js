-- Repair foreign keys that SQLite rewrote to tenants_legacy_0008 when migration 0008
-- renamed the original tenants table. D1 keeps foreign keys enabled during
-- migrations, so defer validation while the two affected child tables are rebuilt.
-- Existing billing subscriptions and public reviews are preserved.

PRAGMA defer_foreign_keys = ON;

CREATE TABLE billing_subscriptions_fk_repair_0023 (
  tenant_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

INSERT INTO billing_subscriptions_fk_repair_0023 (
  tenant_id,
  plan,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  current_period_end,
  created_at,
  updated_at
)
SELECT
  tenant_id,
  plan,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  current_period_end,
  created_at,
  updated_at
FROM billing_subscriptions;

DROP TABLE billing_subscriptions;
ALTER TABLE billing_subscriptions_fk_repair_0023 RENAME TO billing_subscriptions;

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_stripe_subscription
  ON billing_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE public_reviews_fk_repair_0023 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  moderated_at INTEGER,
  moderated_by TEXT,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

INSERT INTO public_reviews_fk_repair_0023 (
  id,
  tenant_id,
  user_id,
  display_name,
  rating,
  body,
  status,
  created_at,
  moderated_at,
  moderated_by
)
SELECT
  id,
  tenant_id,
  user_id,
  display_name,
  rating,
  body,
  status,
  created_at,
  moderated_at,
  moderated_by
FROM public_reviews;

DROP TABLE public_reviews;
ALTER TABLE public_reviews_fk_repair_0023 RENAME TO public_reviews;

CREATE INDEX IF NOT EXISTS idx_public_reviews_status_created
  ON public_reviews(status, created_at DESC);

PRAGMA defer_foreign_keys = OFF;
