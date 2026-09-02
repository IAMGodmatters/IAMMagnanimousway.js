-- Ensure the creator of each workspace receives owner permissions.
-- Existing rows are corrected and future signup inserts are protected by a trigger.

UPDATE users
SET role='owner'
WHERE id IN (
  SELECT owner_user_id
  FROM tenants
  WHERE owner_user_id IS NOT NULL AND owner_user_id <> ''
);

DROP TRIGGER IF EXISTS trg_workspace_owner_role;
CREATE TRIGGER trg_workspace_owner_role
AFTER INSERT ON users
WHEN EXISTS (
  SELECT 1
  FROM tenants
  WHERE tenants.id = NEW.tenant_id
    AND tenants.owner_user_id = NEW.id
)
BEGIN
  UPDATE users SET role='owner' WHERE id=NEW.id;
END;
