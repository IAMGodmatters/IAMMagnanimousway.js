-- Repair older D1 databases whose users table predates multi-tenant support.
-- Safe to run after 0003; existing rows are retained.
ALTER TABLE users ADD COLUMN tenant_id TEXT;
ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE users ADD COLUMN password_salt TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- The application bootstrap attaches legacy records to the owner tenant.
