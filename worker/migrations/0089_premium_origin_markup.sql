-- Auditable pass-through premium billing: retain true origin cost separately from
-- the Magnanimous customer charge and fixed markup.
ALTER TABLE billing_usage_events ADD COLUMN origin_cost_usd REAL NOT NULL DEFAULT 0;
ALTER TABLE billing_usage_events ADD COLUMN customer_charge_usd REAL NOT NULL DEFAULT 0;
ALTER TABLE billing_usage_events ADD COLUMN markup_percent REAL NOT NULL DEFAULT 0;
ALTER TABLE billing_usage_events ADD COLUMN origin_ref TEXT NOT NULL DEFAULT '';

UPDATE billing_usage_events
SET origin_cost_usd=direct_cost_usd,
    customer_charge_usd=direct_cost_usd
WHERE origin_cost_usd=0 AND customer_charge_usd=0 AND direct_cost_usd>0;

CREATE INDEX IF NOT EXISTS idx_billing_usage_events_origin
ON billing_usage_events(tenant_id,created_at DESC,category);
