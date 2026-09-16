-- Magnanimous Telecom charging and financial integrity hardening.
-- Additive only: existing REAL fields remain API-compatible while exact integer micro-unit mirrors,
-- policy hard stops, shared-pool limits and reservation cleanup strengthen the ledger beneath them.
-- This migration performs no PSTN/carrier purchase, network activation or regulated action.

-- Exact six-decimal unit/money audit mirrors. Runtime compatibility fields remain unchanged.
ALTER TABLE telecom_balance_buckets ADD COLUMN initial_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(initial_units_micros>=0);
ALTER TABLE telecom_balance_buckets ADD COLUMN remaining_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(remaining_units_micros>=0);
ALTER TABLE telecom_balance_reservations ADD COLUMN reserved_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(reserved_units_micros>=0);
ALTER TABLE telecom_balance_reservations ADD COLUMN committed_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(committed_units_micros>=0);
ALTER TABLE telecom_balance_transactions ADD COLUMN units_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_charging_sessions ADD COLUMN requested_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(requested_units_micros>=0);
ALTER TABLE telecom_charging_sessions ADD COLUMN reserved_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(reserved_units_micros>=0);
ALTER TABLE telecom_charging_sessions ADD COLUMN committed_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(committed_units_micros>=0);
ALTER TABLE telecom_charging_sessions ADD COLUMN estimated_charge_micros INTEGER NOT NULL DEFAULT 0 CHECK(estimated_charge_micros>=0);
ALTER TABLE telecom_charging_sessions ADD COLUMN final_charge_micros INTEGER NOT NULL DEFAULT 0 CHECK(final_charge_micros>=0);
ALTER TABLE telecom_rating_entries ADD COLUMN rated_units_micros INTEGER NOT NULL DEFAULT 0 CHECK(rated_units_micros>=0);
ALTER TABLE telecom_rating_entries ADD COLUMN included_units_used_micros INTEGER NOT NULL DEFAULT 0 CHECK(included_units_used_micros>=0);
ALTER TABLE telecom_rating_entries ADD COLUMN charge_micros INTEGER NOT NULL DEFAULT 0 CHECK(charge_micros>=0);
ALTER TABLE telecom_rate_rules ADD COLUMN unit_size_micros INTEGER NOT NULL DEFAULT 1000000 CHECK(unit_size_micros>0);
ALTER TABLE telecom_rate_rules ADD COLUMN unit_rate_micros INTEGER NOT NULL DEFAULT 0 CHECK(unit_rate_micros>=0);
ALTER TABLE telecom_rate_rules ADD COLUMN connection_charge_micros INTEGER NOT NULL DEFAULT 0 CHECK(connection_charge_micros>=0);
ALTER TABLE telecom_rate_rules ADD COLUMN minimum_charge_micros INTEGER NOT NULL DEFAULT 0 CHECK(minimum_charge_micros>=0);
ALTER TABLE telecom_invoices ADD COLUMN subtotal_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_invoices ADD COLUMN tax_total_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_invoices ADD COLUMN credit_total_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_invoices ADD COLUMN total_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_invoice_items ADD COLUMN quantity_micros INTEGER NOT NULL DEFAULT 1000000;
ALTER TABLE telecom_invoice_items ADD COLUMN unit_price_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_invoice_items ADD COLUMN amount_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telecom_payment_events ADD COLUMN amount_micros INTEGER NOT NULL DEFAULT 0 CHECK(amount_micros>=0);
ALTER TABLE telecom_settlement_ledger ADD COLUMN charge_micros INTEGER NOT NULL DEFAULT 0;

UPDATE telecom_balance_buckets SET initial_units_micros=CAST(ROUND(initial_units*1000000.0) AS INTEGER),remaining_units_micros=CAST(ROUND(remaining_units*1000000.0) AS INTEGER);
UPDATE telecom_balance_reservations SET reserved_units_micros=CAST(ROUND(reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(committed_units*1000000.0) AS INTEGER);
UPDATE telecom_balance_transactions SET units_micros=CAST(ROUND(units*1000000.0) AS INTEGER);
UPDATE telecom_charging_sessions SET requested_units_micros=CAST(ROUND(requested_units*1000000.0) AS INTEGER),reserved_units_micros=CAST(ROUND(reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(committed_units*1000000.0) AS INTEGER),estimated_charge_micros=CAST(ROUND(estimated_charge*1000000.0) AS INTEGER),final_charge_micros=CAST(ROUND(final_charge*1000000.0) AS INTEGER);
UPDATE telecom_rating_entries SET rated_units_micros=CAST(ROUND(rated_units*1000000.0) AS INTEGER),included_units_used_micros=CAST(ROUND(included_units_used*1000000.0) AS INTEGER),charge_micros=CAST(ROUND(charge*1000000.0) AS INTEGER);
UPDATE telecom_rate_rules SET unit_size_micros=CAST(ROUND(unit_size*1000000.0) AS INTEGER),unit_rate_micros=CAST(ROUND(unit_rate*1000000.0) AS INTEGER),connection_charge_micros=CAST(ROUND(connection_charge*1000000.0) AS INTEGER),minimum_charge_micros=CAST(ROUND(minimum_charge*1000000.0) AS INTEGER);
UPDATE telecom_invoices SET subtotal_micros=CAST(ROUND(subtotal*1000000.0) AS INTEGER),tax_total_micros=CAST(ROUND(tax_total*1000000.0) AS INTEGER),credit_total_micros=CAST(ROUND(credit_total*1000000.0) AS INTEGER),total_micros=CAST(ROUND(total*1000000.0) AS INTEGER);
UPDATE telecom_invoice_items SET quantity_micros=CAST(ROUND(quantity*1000000.0) AS INTEGER),unit_price_micros=CAST(ROUND(unit_price*1000000.0) AS INTEGER),amount_micros=CAST(ROUND(amount*1000000.0) AS INTEGER);
UPDATE telecom_payment_events SET amount_micros=CAST(ROUND(amount*1000000.0) AS INTEGER);
UPDATE telecom_settlement_ledger SET charge_micros=CAST(ROUND(charge*1000000.0) AS INTEGER);

CREATE TRIGGER IF NOT EXISTS trg_telecom_bucket_exact_insert AFTER INSERT ON telecom_balance_buckets BEGIN
  UPDATE telecom_balance_buckets SET initial_units_micros=CAST(ROUND(NEW.initial_units*1000000.0) AS INTEGER),remaining_units_micros=CAST(ROUND(NEW.remaining_units*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_bucket_exact_update AFTER UPDATE OF initial_units,remaining_units ON telecom_balance_buckets BEGIN
  UPDATE telecom_balance_buckets SET initial_units_micros=CAST(ROUND(NEW.initial_units*1000000.0) AS INTEGER),remaining_units_micros=CAST(ROUND(NEW.remaining_units*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_reservation_exact_insert AFTER INSERT ON telecom_balance_reservations BEGIN
  UPDATE telecom_balance_reservations SET reserved_units_micros=CAST(ROUND(NEW.reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(NEW.committed_units*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_reservation_exact_update AFTER UPDATE OF reserved_units,committed_units ON telecom_balance_reservations BEGIN
  UPDATE telecom_balance_reservations SET reserved_units_micros=CAST(ROUND(NEW.reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(NEW.committed_units*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_transaction_exact_insert AFTER INSERT ON telecom_balance_transactions BEGIN
  UPDATE telecom_balance_transactions SET units_micros=CAST(ROUND(NEW.units*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_session_exact_insert AFTER INSERT ON telecom_charging_sessions BEGIN
  UPDATE telecom_charging_sessions SET requested_units_micros=CAST(ROUND(NEW.requested_units*1000000.0) AS INTEGER),reserved_units_micros=CAST(ROUND(NEW.reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(NEW.committed_units*1000000.0) AS INTEGER),estimated_charge_micros=CAST(ROUND(NEW.estimated_charge*1000000.0) AS INTEGER),final_charge_micros=CAST(ROUND(NEW.final_charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_session_exact_update AFTER UPDATE OF requested_units,reserved_units,committed_units,estimated_charge,final_charge ON telecom_charging_sessions BEGIN
  UPDATE telecom_charging_sessions SET requested_units_micros=CAST(ROUND(NEW.requested_units*1000000.0) AS INTEGER),reserved_units_micros=CAST(ROUND(NEW.reserved_units*1000000.0) AS INTEGER),committed_units_micros=CAST(ROUND(NEW.committed_units*1000000.0) AS INTEGER),estimated_charge_micros=CAST(ROUND(NEW.estimated_charge*1000000.0) AS INTEGER),final_charge_micros=CAST(ROUND(NEW.final_charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_rating_exact_insert AFTER INSERT ON telecom_rating_entries BEGIN
  UPDATE telecom_rating_entries SET rated_units_micros=CAST(ROUND(NEW.rated_units*1000000.0) AS INTEGER),included_units_used_micros=CAST(ROUND(NEW.included_units_used*1000000.0) AS INTEGER),charge_micros=CAST(ROUND(NEW.charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_rating_exact_update AFTER UPDATE OF rated_units,included_units_used,charge ON telecom_rating_entries BEGIN
  UPDATE telecom_rating_entries SET rated_units_micros=CAST(ROUND(NEW.rated_units*1000000.0) AS INTEGER),included_units_used_micros=CAST(ROUND(NEW.included_units_used*1000000.0) AS INTEGER),charge_micros=CAST(ROUND(NEW.charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_rate_exact_insert AFTER INSERT ON telecom_rate_rules BEGIN
  UPDATE telecom_rate_rules SET unit_size_micros=CAST(ROUND(NEW.unit_size*1000000.0) AS INTEGER),unit_rate_micros=CAST(ROUND(NEW.unit_rate*1000000.0) AS INTEGER),connection_charge_micros=CAST(ROUND(NEW.connection_charge*1000000.0) AS INTEGER),minimum_charge_micros=CAST(ROUND(NEW.minimum_charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_rate_exact_update AFTER UPDATE OF unit_size,unit_rate,connection_charge,minimum_charge ON telecom_rate_rules BEGIN
  UPDATE telecom_rate_rules SET unit_size_micros=CAST(ROUND(NEW.unit_size*1000000.0) AS INTEGER),unit_rate_micros=CAST(ROUND(NEW.unit_rate*1000000.0) AS INTEGER),connection_charge_micros=CAST(ROUND(NEW.connection_charge*1000000.0) AS INTEGER),minimum_charge_micros=CAST(ROUND(NEW.minimum_charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_invoice_exact_insert AFTER INSERT ON telecom_invoices BEGIN
  UPDATE telecom_invoices SET subtotal_micros=CAST(ROUND(NEW.subtotal*1000000.0) AS INTEGER),tax_total_micros=CAST(ROUND(NEW.tax_total*1000000.0) AS INTEGER),credit_total_micros=CAST(ROUND(NEW.credit_total*1000000.0) AS INTEGER),total_micros=CAST(ROUND(NEW.total*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_invoice_exact_update AFTER UPDATE OF subtotal,tax_total,credit_total,total ON telecom_invoices BEGIN
  UPDATE telecom_invoices SET subtotal_micros=CAST(ROUND(NEW.subtotal*1000000.0) AS INTEGER),tax_total_micros=CAST(ROUND(NEW.tax_total*1000000.0) AS INTEGER),credit_total_micros=CAST(ROUND(NEW.credit_total*1000000.0) AS INTEGER),total_micros=CAST(ROUND(NEW.total*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_invoice_item_exact_insert AFTER INSERT ON telecom_invoice_items BEGIN
  UPDATE telecom_invoice_items SET quantity_micros=CAST(ROUND(NEW.quantity*1000000.0) AS INTEGER),unit_price_micros=CAST(ROUND(NEW.unit_price*1000000.0) AS INTEGER),amount_micros=CAST(ROUND(NEW.amount*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_payment_exact_insert AFTER INSERT ON telecom_payment_events BEGIN
  UPDATE telecom_payment_events SET amount_micros=CAST(ROUND(NEW.amount*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_payment_exact_update AFTER UPDATE OF amount ON telecom_payment_events BEGIN
  UPDATE telecom_payment_events SET amount_micros=CAST(ROUND(NEW.amount*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_settlement_exact_insert AFTER INSERT ON telecom_settlement_ledger BEGIN
  UPDATE telecom_settlement_ledger SET charge_micros=CAST(ROUND(NEW.charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_telecom_settlement_exact_update AFTER UPDATE OF charge ON telecom_settlement_ledger BEGIN
  UPDATE telecom_settlement_ledger SET charge_micros=CAST(ROUND(NEW.charge*1000000.0) AS INTEGER) WHERE id=NEW.id AND tenant_id=NEW.tenant_id;
END;

-- Hard-stop configured daily unit limits before a session enters reserved state.
CREATE TRIGGER IF NOT EXISTS trg_telecom_daily_unit_limit
BEFORE UPDATE OF state ON telecom_charging_sessions
WHEN NEW.state='reserved' AND OLD.state<>'reserved'
BEGIN
  SELECT CASE WHEN
    COALESCE((
      SELECT p.max_daily_units
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id AND p.service_type=NEW.service_type AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC LIMIT 1
    ),0)>0
    AND (
      COALESCE((SELECT SUM(s.committed_units) FROM telecom_charging_sessions s WHERE s.tenant_id=NEW.tenant_id AND s.line_id=NEW.line_id AND s.service_type=NEW.service_type AND s.state='committed' AND s.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400),0)
      + NEW.requested_units
    ) > COALESCE((
      SELECT p.max_daily_units
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id AND p.service_type=NEW.service_type AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC LIMIT 1
    ),0)
  THEN RAISE(ABORT,'telecom_daily_unit_limit') END;
END;

-- Hard-stop configured daily spend limits before a session enters reserved state.
CREATE TRIGGER IF NOT EXISTS trg_telecom_daily_spend_limit
BEFORE UPDATE OF state ON telecom_charging_sessions
WHEN NEW.state='reserved' AND OLD.state<>'reserved'
BEGIN
  SELECT CASE WHEN
    COALESCE((
      SELECT p.max_daily_spend
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id AND p.service_type=NEW.service_type AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC LIMIT 1
    ),0)>0
    AND (
      COALESCE((SELECT SUM(s.final_charge) FROM telecom_charging_sessions s WHERE s.tenant_id=NEW.tenant_id AND s.line_id=NEW.line_id AND s.state='committed' AND s.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400),0)
      + NEW.estimated_charge
    ) > COALESCE((
      SELECT p.max_daily_spend
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id AND p.service_type=NEW.service_type AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC LIMIT 1
    ),0)
  THEN RAISE(ABORT,'telecom_daily_spend_limit') END;
END;

-- Enforce a shared-pool member's configured limit per bucket kind across the rolling day.
CREATE TRIGGER IF NOT EXISTS trg_telecom_shared_member_limit
BEFORE INSERT ON telecom_balance_reservations
BEGIN
  SELECT CASE WHEN EXISTS(
    SELECT 1
    FROM telecom_charging_sessions ns
    JOIN telecom_balance_buckets nb ON nb.tenant_id=NEW.tenant_id AND nb.id=NEW.bucket_id
    JOIN telecom_balance_groups g ON g.tenant_id=NEW.tenant_id AND g.balance_account_id=nb.balance_account_id AND g.status='active'
    JOIN telecom_balance_group_members m ON m.tenant_id=NEW.tenant_id AND m.group_id=g.id AND m.line_id=ns.line_id AND m.status='active'
    WHERE ns.tenant_id=NEW.tenant_id AND ns.id=NEW.charging_session_id AND m.spend_limit_units>0
      AND (
        COALESCE((
          SELECT SUM(r2.reserved_units)
          FROM telecom_balance_reservations r2
          JOIN telecom_charging_sessions s2 ON s2.tenant_id=r2.tenant_id AND s2.id=r2.charging_session_id
          JOIN telecom_balance_buckets b2 ON b2.tenant_id=r2.tenant_id AND b2.id=r2.bucket_id
          WHERE r2.tenant_id=NEW.tenant_id AND s2.line_id=m.line_id AND b2.balance_account_id=g.balance_account_id
            AND b2.bucket_kind=nb.bucket_kind AND r2.state IN ('reserved','committed')
            AND r2.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400
        ),0)+NEW.reserved_units
      )>m.spend_limit_units
  ) THEN RAISE(ABORT,'telecom_shared_member_limit') END;
END;

-- Reconcile stale reservations atomically whenever a new charging session starts for the tenant.
CREATE TRIGGER IF NOT EXISTS trg_telecom_reconcile_expired_before_session
BEFORE INSERT ON telecom_charging_sessions
BEGIN
  INSERT OR IGNORE INTO telecom_balance_transactions(
    id,tenant_id,balance_account_id,bucket_id,charging_session_id,idempotency_key,
    transaction_type,units,unit_name,balance_after,source_ref,metadata_json,created_at
  )
  SELECT
    'btx_' || lower(hex(randomblob(16))),r.tenant_id,b.balance_account_id,r.bucket_id,r.charging_session_id,
    'expire-release:' || r.charging_session_id || ':' || r.id,'release',r.reserved_units,
    COALESCE(s.unit_name,'unit'),NULL,'',
    '{"reason":"session_expired","source":"financial_integrity_trigger"}',CAST(strftime('%s','now') AS INTEGER)
  FROM telecom_balance_reservations r
  JOIN telecom_charging_sessions s ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
  JOIN telecom_balance_buckets b ON b.tenant_id=r.tenant_id AND b.id=r.bucket_id
  WHERE r.tenant_id=NEW.tenant_id AND r.state='reserved' AND s.state='reserved'
    AND s.expires_at IS NOT NULL AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER);

  UPDATE telecom_balance_buckets
  SET remaining_units=remaining_units+COALESCE((
      SELECT SUM(r.reserved_units)
      FROM telecom_balance_reservations r
      JOIN telecom_charging_sessions s ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
      WHERE r.tenant_id=telecom_balance_buckets.tenant_id AND r.bucket_id=telecom_balance_buckets.id
        AND r.state='reserved' AND s.state='reserved' AND s.expires_at IS NOT NULL
        AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER)
    ),0),
    status=CASE WHEN expires_at IS NOT NULL AND expires_at<=CAST(strftime('%s','now') AS INTEGER) THEN 'expired' ELSE 'active' END,
    updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id AND EXISTS(
    SELECT 1 FROM telecom_balance_reservations r
    JOIN telecom_charging_sessions s ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
    WHERE r.tenant_id=telecom_balance_buckets.tenant_id AND r.bucket_id=telecom_balance_buckets.id
      AND r.state='reserved' AND s.state='reserved' AND s.expires_at IS NOT NULL
      AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER)
  );

  UPDATE telecom_balance_reservations
  SET state='expired',updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id AND state='reserved' AND charging_session_id IN(
    SELECT id FROM telecom_charging_sessions WHERE tenant_id=NEW.tenant_id AND state='reserved'
      AND expires_at IS NOT NULL AND expires_at<=CAST(strftime('%s','now') AS INTEGER)
  );

  UPDATE telecom_charging_sessions
  SET state='expired',reserved_units=0,updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id AND state='reserved' AND expires_at IS NOT NULL
    AND expires_at<=CAST(strftime('%s','now') AS INTEGER);
END;

CREATE INDEX IF NOT EXISTS idx_telecom_charging_expiry ON telecom_charging_sessions(tenant_id,state,expires_at);
CREATE INDEX IF NOT EXISTS idx_telecom_charging_daily_guard ON telecom_charging_sessions(tenant_id,line_id,service_type,state,created_at);
CREATE INDEX IF NOT EXISTS idx_telecom_reservation_daily_guard ON telecom_balance_reservations(tenant_id,state,created_at);
