-- Magnanimous Telecom daily unit policy hard stop.
-- One trigger per migration for Cloudflare D1 migration-parser compatibility.
CREATE TRIGGER IF NOT EXISTS trg_telecom_daily_unit_limit
BEFORE UPDATE OF state ON telecom_charging_sessions
WHEN NEW.state='reserved' AND OLD.state<>'reserved'
BEGIN
  SELECT CASE WHEN
    COALESCE((
      SELECT p.max_daily_units
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l
        ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id
        AND p.service_type=NEW.service_type
        AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC
      LIMIT 1
    ),0)>0
    AND (
      COALESCE((
        SELECT SUM(s.committed_units)
        FROM telecom_charging_sessions s
        WHERE s.tenant_id=NEW.tenant_id
          AND s.line_id=NEW.line_id
          AND s.service_type=NEW.service_type
          AND s.state='committed'
          AND s.created_at>=CAST(strftime('%s','now') AS INTEGER)-86400
      ),0)+NEW.requested_units
    )>COALESCE((
      SELECT p.max_daily_units
      FROM telecom_policy_profiles p
      LEFT JOIN telecom_customer_lines l
        ON l.tenant_id=NEW.tenant_id AND l.id=NEW.line_id
      WHERE p.tenant_id=NEW.tenant_id
        AND p.service_type=NEW.service_type
        AND p.status='active'
        AND (p.plan_id=l.plan_id OR p.plan_id IS NULL OR p.plan_id='')
      ORDER BY CASE WHEN p.plan_id=l.plan_id THEN 0 ELSE 1 END,p.updated_at DESC
      LIMIT 1
    ),0)
  THEN RAISE(ABORT,'telecom_daily_unit_limit') END;
END;
