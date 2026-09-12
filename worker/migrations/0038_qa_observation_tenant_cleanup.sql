-- Keep owner QA observation storage free of deleted/smoke-test tenant data.
-- This runs before a tenant row is deleted, including deployment smoke cleanup.
CREATE TRIGGER IF NOT EXISTS cleanup_qa_observations_before_tenant_delete
BEFORE DELETE ON tenants
FOR EACH ROW
BEGIN
  DELETE FROM qa_observations WHERE tenant_id = OLD.id;
END;
