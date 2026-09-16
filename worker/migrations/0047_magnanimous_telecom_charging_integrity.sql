-- Magnanimous Telecom charging integrity guard.
-- Ensures any unused portion of a committed reservation is represented in the immutable balance ledger.
-- This is a BSS accounting integrity rule only; it performs no carrier, PSTN, SIM/eSIM or paid-provider action.

CREATE TRIGGER IF NOT EXISTS trg_telecom_partial_commit_release_ledger
AFTER UPDATE OF state, committed_units ON telecom_balance_reservations
WHEN OLD.state = 'reserved'
 AND NEW.state = 'committed'
 AND NEW.reserved_units > NEW.committed_units
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
    created_at
  )
  SELECT
    'btx_' || lower(hex(randomblob(16))),
    NEW.tenant_id,
    b.balance_account_id,
    NEW.bucket_id,
    NEW.charging_session_id,
    'partial-release:' || NEW.charging_session_id || ':' || NEW.id,
    'release',
    NEW.reserved_units - NEW.committed_units,
    COALESCE(s.unit_name, 'unit'),
    b.remaining_units,
    '',
    '{"reason":"unused_reservation","source":"charging_integrity_trigger"}',
    CAST(strftime('%s','now') AS INTEGER)
  FROM telecom_balance_buckets b
  LEFT JOIN telecom_charging_sessions s
    ON s.tenant_id = NEW.tenant_id
   AND s.id = NEW.charging_session_id
  WHERE b.tenant_id = NEW.tenant_id
    AND b.id = NEW.bucket_id;
END;
