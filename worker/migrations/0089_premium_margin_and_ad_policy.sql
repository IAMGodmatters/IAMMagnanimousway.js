-- Track customer-facing premium charge separately from direct variable origin cost.
ALTER TABLE billing_usage_events ADD COLUMN customer_charge_usd REAL NOT NULL DEFAULT 0;

-- Public advertising may render only when Magnanimous-owned or explicitly revenue-approved.
ALTER TABLE ads ADD COLUMN owner_owned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ads ADD COLUMN revenue_approved INTEGER NOT NULL DEFAULT 0;
