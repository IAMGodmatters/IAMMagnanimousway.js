-- Magnanimous Telecom exact atomic reservation using integer micros as the accounting source of truth.
-- Legacy REAL values remain synchronized compatibility mirrors for current APIs/UI.
-- Replaces the 0060 REAL-backed reservation trigger after 0061 adds/backfills micro columns.
-- Keep the trigger body free of nested CASE ... END; expressions because Wrangler can split them early.

DROP TRIGGER IF EXISTS trg_telecom_atomic_balance_reservation;

CREATE TRIGGER trg_telecom_atomic_balance_reservation
BEFORE INSERT ON telecom_balance_reservations
WHEN NEW.state = 'reserved'
BEGIN
  SELECT RAISE(ABORT, 'telecom_invalid_reservation_units')
  WHERE NEW.reserved_units_micros <= 0;

  SELECT RAISE(ABORT, 'telecom_insufficient_balance')
  WHERE NOT EXISTS (
    SELECT 1
    FROM telecom_balance_buckets b
    WHERE b.tenant_id = NEW.tenant_id
      AND b.id = NEW.bucket_id
      AND b.status = 'active'
      AND b.remaining_units_micros >= NEW.reserved_units_micros
      AND (b.starts_at IS NULL OR b.starts_at <= CAST(strftime('%s','now') AS INTEGER))
      AND (b.expires_at IS NULL OR b.expires_at > CAST(strftime('%s','now') AS INTEGER))
  );

  UPDATE telecom_balance_buckets
  SET remaining_units_micros = remaining_units_micros - NEW.reserved_units_micros,
      remaining_units = (remaining_units_micros - NEW.reserved_units_micros) / 1000000.0,
      updated_at = CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id = NEW.tenant_id
    AND id = NEW.bucket_id;

  UPDATE telecom_balance_buckets
  SET status = 'exhausted',
      updated_at = CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id = NEW.tenant_id
    AND id = NEW.bucket_id
    AND remaining_units_micros <= 0;

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
    created_at,
    units_micros,
    balance_after_micros
  )
  SELECT
    'btx_' || lower(hex(randomblob(16))),
    NEW.tenant_id,
    b.balance_account_id,
    NEW.bucket_id,
    NEW.charging_session_id,
    'reserve:' || NEW.charging_session_id || ':' || NEW.bucket_id,
    'reserve',
    NEW.reserved_units_micros / 1000000.0,
    COALESCE(s.unit_name, 'unit'),
    b.remaining_units_micros / 1000000.0,
    '',
    '{"source":"atomic_micros_reservation_trigger"}',
    CAST(strftime('%s','now') AS INTEGER),
    NEW.reserved_units_micros,
    b.remaining_units_micros
  FROM telecom_balance_buckets b
  LEFT JOIN telecom_charging_sessions s
    ON s.tenant_id = NEW.tenant_id
   AND s.id = NEW.charging_session_id
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id = NEW.bucket_id;
END;
