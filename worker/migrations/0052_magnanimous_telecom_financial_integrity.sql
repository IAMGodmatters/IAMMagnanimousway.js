-- Magnanimous Telecom financial precision foundation.
-- D1-safe additive migration: exact integer micro-unit/money projections are exposed through
-- read-only views so existing REAL/API fields stay compatible and no synchronization trigger is needed.
-- Consequential policy guards are intentionally split into migrations 0053-0056 so each D1
-- migration contains at most one trigger body.
-- This migration performs no PSTN/carrier purchase, network activation or regulated action.

CREATE VIEW IF NOT EXISTS telecom_balance_precision_v AS
SELECT
  b.*,
  CAST(ROUND(b.initial_units * 1000000.0) AS INTEGER) AS initial_units_micros,
  CAST(ROUND(b.remaining_units * 1000000.0) AS INTEGER) AS remaining_units_micros
FROM telecom_balance_buckets b;

CREATE VIEW IF NOT EXISTS telecom_reservation_precision_v AS
SELECT
  r.*,
  CAST(ROUND(r.reserved_units * 1000000.0) AS INTEGER) AS reserved_units_micros,
  CAST(ROUND(r.committed_units * 1000000.0) AS INTEGER) AS committed_units_micros
FROM telecom_balance_reservations r;

CREATE VIEW IF NOT EXISTS telecom_charging_precision_v AS
SELECT
  s.*,
  CAST(ROUND(s.requested_units * 1000000.0) AS INTEGER) AS requested_units_micros,
  CAST(ROUND(s.reserved_units * 1000000.0) AS INTEGER) AS reserved_units_micros,
  CAST(ROUND(s.committed_units * 1000000.0) AS INTEGER) AS committed_units_micros,
  CAST(ROUND(s.estimated_charge * 1000000.0) AS INTEGER) AS estimated_charge_micros,
  CAST(ROUND(s.final_charge * 1000000.0) AS INTEGER) AS final_charge_micros
FROM telecom_charging_sessions s;

CREATE VIEW IF NOT EXISTS telecom_rating_precision_v AS
SELECT
  e.*,
  CAST(ROUND(e.rated_units * 1000000.0) AS INTEGER) AS rated_units_micros,
  CAST(ROUND(e.included_units_used * 1000000.0) AS INTEGER) AS included_units_used_micros,
  CAST(ROUND(e.charge * 1000000.0) AS INTEGER) AS charge_micros
FROM telecom_rating_entries e;

CREATE VIEW IF NOT EXISTS telecom_rate_rule_precision_v AS
SELECT
  r.*,
  CAST(ROUND(r.unit_size * 1000000.0) AS INTEGER) AS unit_size_micros,
  CAST(ROUND(r.unit_rate * 1000000.0) AS INTEGER) AS unit_rate_micros,
  CAST(ROUND(r.connection_charge * 1000000.0) AS INTEGER) AS connection_charge_micros,
  CAST(ROUND(r.minimum_charge * 1000000.0) AS INTEGER) AS minimum_charge_micros
FROM telecom_rate_rules r;

CREATE VIEW IF NOT EXISTS telecom_invoice_precision_v AS
SELECT
  i.*,
  CAST(ROUND(i.subtotal * 1000000.0) AS INTEGER) AS subtotal_micros,
  CAST(ROUND(i.tax_total * 1000000.0) AS INTEGER) AS tax_total_micros,
  CAST(ROUND(i.credit_total * 1000000.0) AS INTEGER) AS credit_total_micros,
  CAST(ROUND(i.total * 1000000.0) AS INTEGER) AS total_micros
FROM telecom_invoices i;

CREATE VIEW IF NOT EXISTS telecom_invoice_item_precision_v AS
SELECT
  i.*,
  CAST(ROUND(i.quantity * 1000000.0) AS INTEGER) AS quantity_micros,
  CAST(ROUND(i.unit_price * 1000000.0) AS INTEGER) AS unit_price_micros,
  CAST(ROUND(i.amount * 1000000.0) AS INTEGER) AS amount_micros
FROM telecom_invoice_items i;

CREATE VIEW IF NOT EXISTS telecom_payment_precision_v AS
SELECT
  p.*,
  CAST(ROUND(p.amount * 1000000.0) AS INTEGER) AS amount_micros
FROM telecom_payment_events p;

CREATE VIEW IF NOT EXISTS telecom_settlement_precision_v AS
SELECT
  s.*,
  CAST(ROUND(s.charge * 1000000.0) AS INTEGER) AS charge_micros
FROM telecom_settlement_ledger s;

CREATE INDEX IF NOT EXISTS idx_telecom_charging_expiry
  ON telecom_charging_sessions(tenant_id,state,expires_at);
CREATE INDEX IF NOT EXISTS idx_telecom_charging_daily_guard
  ON telecom_charging_sessions(tenant_id,line_id,service_type,state,created_at);
CREATE INDEX IF NOT EXISTS idx_telecom_reservation_daily_guard
  ON telecom_balance_reservations(tenant_id,state,created_at);
