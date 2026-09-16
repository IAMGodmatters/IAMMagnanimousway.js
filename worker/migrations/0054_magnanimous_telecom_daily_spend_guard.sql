-- Magnanimous Telecom daily spend policy hard stop.
-- One trigger per migration for Cloudflare D1 migration-parser compatibility.
-- Keep the trigger body free of nested CASE ... END; statements because Wrangler
-- can split on the inner END; before the trigger is complete.
CREATE TRIGGER IF NOT EXISTS trg_telecom_daily_spend_limit
BEFORE UPDATE OF state ON telecom_charging_sessions
WHEN NEW.state='reserved'
  AND OLD.state<>'reserved'
  AND COALESCE((
    SELECT p.max_daily_spend
    FROM telecom_policy_profiles p
    LEFT JOIN telecom_customer_lines l
      ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
    WHERE p.tenant_id=NEW.tenant_id
      AND p.service_type=NEW.service_type
      AND p.status='active'
      AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
    ORDER BY (p.plan_id=l.plan_id) DESC,p.updated_at DESC
    LIMIT 1
  ),0)>0
  AND (
    COALESCE((
      SELECT SUM(s.final_charge)
      FROM telecom_charging_sessions s
      WHERE s.tenant_id=NEW.tenant_id
        AND s.line_id=NEW.line_id
        AND s.state='committed'
        AND s.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400
    ),0)+NEW.estimated_charge
  )>COALESCE((
    SELECT p.max_daily_spend
    FROM telecom_policy_profiles p
    LEFT JOIN telecom_customer_lines l
      ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
    WHERE p.tenant_id=NEW.tenant_id
      AND p.service_type=NEW.service_type
      AND p.status='active'
      AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
    ORDER BY (p.plan_id=l.plan_id) DESC,p.updated_at DESC
    LIMIT 1
  ),0)
BEGIN
  SELECT RAISE(ABORT,'telecom_daily_spend_limit');
END;
