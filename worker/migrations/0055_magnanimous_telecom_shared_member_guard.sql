-- Magnanimous Telecom shared-balance member hard stop.
-- One trigger per migration for Cloudflare D1 migration-parser compatibility.
-- Keep the trigger body free of nested CASE ... END; statements because Wrangler
-- can split on the inner END; before the trigger is complete.
CREATE TRIGGER IF NOT EXISTS trg_telecom_shared_member_limit
BEFORE INSERT ON telecom_balance_reservations
WHEN EXISTS(
  SELECT 1
  FROM telecom_charging_sessions ns
  JOIN telecom_balance_buckets nb
    ON nb.tenant_id=NEW.tenant_id AND nb.id=NEW.bucket_id
  JOIN telecom_balance_groups g
    ON g.tenant_id=NEW.tenant_id
   AND g.balance_account_id=nb.balance_account_id
   AND g.status='active'
  JOIN telecom_balance_group_members m
    ON m.tenant_id=NEW.tenant_id
   AND m.group_id=g.id
   AND m.line_id=ns.line_id
   AND m.status='active'
  WHERE ns.tenant_id=NEW.tenant_id
    AND ns.id=NEW.charging_session_id
    AND m.spend_limit_units>0
    AND (
      COALESCE((
        SELECT SUM(r2.reserved_units)
        FROM telecom_balance_reservations r2
        JOIN telecom_charging_sessions s2
          ON s2.tenant_id=r2.tenant_id AND s2.id=r2.charging_session_id
        JOIN telecom_balance_buckets b2
          ON b2.tenant_id=r2.tenant_id AND b2.id=r2.bucket_id
        WHERE r2.tenant_id=NEW.tenant_id
          AND s2.line_id=m.line_id
          AND b2.balance_account_id=g.balance_account_id
          AND b2.bucket_kind=nb.bucket_kind
          AND r2.state IN ('reserved','committed')
          AND r2.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400
      ),0)+NEW.reserved_units
    )>m.spend_limit_units
)
BEGIN
  SELECT RAISE(ABORT,'telecom_shared_member_limit');
END;
