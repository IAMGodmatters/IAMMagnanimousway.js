-- Exact integer-micro partial-commit release ledger.
-- Replaces the 0047 REAL-backed trigger after micro columns exist.
-- One trigger body in this migration for Cloudflare D1 parser compatibility.

DROP TRIGGER IF EXISTS trg_telecom_partial_commit_release_ledger;

CREATE TRIGGER trg_telecom_partial_commit_release_ledger
AFTER UPDATE OF state, committed_units_micros ON telecom_balance_reservations
WHEN OLD.state = 'reserved'
 AND NEW.state = 'committed'
 AND NEW.reserved_units_micros > NEW.committed_units_micros
BEGIN
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
    'partial-release:' || NEW.charging_session_id || ':' || NEW.id,
    'release',
    (NEW.reserved_units_micros - NEW.committed_units_micros) / 1000000.0,
    COALESCE(s.unit_name, 'unit'),
    b.remaining_units_micros / 1000000.0,
    '',
    '{"reason":"unused_reservation","source":"integer_micros_partial_commit_trigger"}',
    CAST(strftime('%s','now') AS INTEGER),
    NEW.reserved_units_micros - NEW.committed_units_micros,
    b.remaining_units_micros
  FROM telecom_balance_buckets b
  LEFT JOIN telecom_charging_sessions s
    ON s.tenant_id = NEW.tenant_id
   AND s.id = NEW.charging_session_id
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id = NEW.bucket_id;
END;
