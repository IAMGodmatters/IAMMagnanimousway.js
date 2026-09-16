-- Exact integer-micro expired-reservation reconciliation.
-- Replaces the 0056 REAL-backed trigger after micro columns exist.
-- One trigger body in this migration for Cloudflare D1 parser compatibility.

DROP TRIGGER IF EXISTS trg_telecom_reconcile_expired_before_session;

CREATE TRIGGER trg_telecom_reconcile_expired_before_session
BEFORE INSERT ON telecom_charging_sessions
BEGIN
  INSERT OR IGNORE INTO telecom_balance_transactions(
    id,tenant_id,balance_account_id,bucket_id,charging_session_id,idempotency_key,
    transaction_type,units,unit_name,balance_after,source_ref,metadata_json,created_at,
    units_micros,balance_after_micros
  )
  SELECT
    'btx_' || lower(hex(randomblob(16))),
    r.tenant_id,
    b.balance_account_id,
    r.bucket_id,
    r.charging_session_id,
    'expire-release:' || r.charging_session_id || ':' || r.id,
    'release',
    r.reserved_units_micros / 1000000.0,
    COALESCE(s.unit_name,'unit'),
    (b.remaining_units_micros + r.reserved_units_micros) / 1000000.0,
    '',
    '{"reason":"session_expired","source":"integer_micros_expiry_trigger"}',
    CAST(strftime('%s','now') AS INTEGER),
    r.reserved_units_micros,
    b.remaining_units_micros + r.reserved_units_micros
  FROM telecom_balance_reservations r
  JOIN telecom_charging_sessions s
    ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
  JOIN telecom_balance_buckets b
    ON b.tenant_id=r.tenant_id AND b.id=r.bucket_id
  WHERE r.tenant_id=NEW.tenant_id
    AND r.state='reserved'
    AND s.state='reserved'
    AND s.expires_at IS NOT NULL
    AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER);

  UPDATE telecom_balance_buckets
  SET remaining_units_micros=remaining_units_micros+COALESCE((
      SELECT SUM(r.reserved_units_micros)
      FROM telecom_balance_reservations r
      JOIN telecom_charging_sessions s
        ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
      WHERE r.tenant_id=telecom_balance_buckets.tenant_id
        AND r.bucket_id=telecom_balance_buckets.id
        AND r.state='reserved'
        AND s.state='reserved'
        AND s.expires_at IS NOT NULL
        AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER)
    ),0),
    remaining_units=(remaining_units_micros+COALESCE((
      SELECT SUM(r.reserved_units_micros)
      FROM telecom_balance_reservations r
      JOIN telecom_charging_sessions s
        ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
      WHERE r.tenant_id=telecom_balance_buckets.tenant_id
        AND r.bucket_id=telecom_balance_buckets.id
        AND r.state='reserved'
        AND s.state='reserved'
        AND s.expires_at IS NOT NULL
        AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER)
    ),0))/1000000.0,
    status='active',
    updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id
    AND EXISTS(
      SELECT 1
      FROM telecom_balance_reservations r
      JOIN telecom_charging_sessions s
        ON s.tenant_id=r.tenant_id AND s.id=r.charging_session_id
      WHERE r.tenant_id=telecom_balance_buckets.tenant_id
        AND r.bucket_id=telecom_balance_buckets.id
        AND r.state='reserved'
        AND s.state='reserved'
        AND s.expires_at IS NOT NULL
        AND s.expires_at<=CAST(strftime('%s','now') AS INTEGER)
    );

  UPDATE telecom_balance_reservations
  SET state='expired',updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id
    AND state='reserved'
    AND charging_session_id IN(
      SELECT id
      FROM telecom_charging_sessions
      WHERE tenant_id=NEW.tenant_id
        AND state='reserved'
        AND expires_at IS NOT NULL
        AND expires_at<=CAST(strftime('%s','now') AS INTEGER)
    );

  UPDATE telecom_charging_sessions
  SET state='expired',reserved_units_micros=0,reserved_units=0,updated_at=CAST(strftime('%s','now') AS INTEGER)
  WHERE tenant_id=NEW.tenant_id
    AND state='reserved'
    AND expires_at IS NOT NULL
    AND expires_at<=CAST(strftime('%s','now') AS INTEGER);
END;
