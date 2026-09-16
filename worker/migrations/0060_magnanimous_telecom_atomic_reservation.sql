-- Magnanimous Telecom atomic balance reservation boundary.
-- A reservation insert, balance decrement and reserve-ledger record now succeed or roll back together.
-- Existing daily limits, shared-member limits, expiry reconciliation and fraud/policy controls remain additive.
-- This migration performs no carrier/PSTN purchase, SIM/eSIM activation or regulated network action.
-- Keep the trigger body free of nested CASE ... END; statements for Cloudflare D1 migration-parser compatibility.

CREATE TRIGGER IF NOT EXISTS trg_telecom_atomic_balance_reservation
BEFORE INSERT ON telecom_balance_reservations
WHEN NEW.state = 'reserved'
BEGIN
  SELECT RAISE(ABORT, 'telecom_invalid_reservation_units')
  WHERE NEW.reserved_units <= 0;

  SELECT RAISE(ABORT, 'telecom_insufficient_balance')
  WHERE NOT EXISTS (
    SELECT 1
    FROM telecom_balance_buckets b
    WHERE b.tenant_id = NEW.tenant_id
      AND b.id = NEW.bucket_id
      AND b.status = 'active'
      AND b.remaining_units >= NEW.reserved_units
      AND (b.starts_at IS NULL OR b.starts_at <= CAST(strftime('%s','now') AS INTEGER))
      AND (b.expires_at IS NULL OR b.expires_at > CAST(strftime('%s','now') AS INTEGER))
  );

  UPDATE telecom_balance_buckets
  SET remaining_units = remaining_units - NEW.reserved_units,
      updated_at = CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id = NEW.tenant_id
    AND id = NEW.bucket_id;

  UPDATE telecom_balance_buckets
  SET status = 'exhausted',
      updated_at = CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id = NEW.tenant_id
    AND id = NEW.bucket_id
    AND remaining_units <= 0;

  INSERT OR IGNORE INTO telecom_balance_transactions(
    id,
    tenant_id,
    balance_account_id,
    bucket_id,
    charging_session_id,
    idempotency_key,
    transaction_type,
    units,
    unit_name,
    balance_after,
    source_ref,
    metadata_json,
    created_at
  )
  SELECT
    'btx_' || lower(hex(randomblob(16))),
    NEW.tenant_id,
    b.balance_account_id,
    NEW.bucket_id,
    NEW.charging_session_id,
    'reserve:' || NEW.charging_session_id || ':' || NEW.bucket_id,
    'reserve',
    NEW.reserved_units,
    COALESCE(s.unit_name, 'unit'),
    b.remaining_units,
    '',
    '{"source":"atomic_reservation_trigger"}',
    CAST(strftime('%s','now') AS INTEGER)
  FROM telecom_balance_buckets b
  LEFT JOIN telecom_charging_sessions s
    ON s.tenant_id = NEW.tenant_id
   AND s.id = NEW.charging_session_id
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id = NEW.bucket_id;
END;
