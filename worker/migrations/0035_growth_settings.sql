CREATE TABLE IF NOT EXISTS growth_settings (
  scope_tenant_id TEXT PRIMARY KEY,
  automation_enabled INTEGER NOT NULL DEFAULT 1,
  sender_name TEXT NOT NULL DEFAULT 'I AM MAGNANIMOUS WAY™',
  reply_to_email TEXT NOT NULL DEFAULT '',
  postal_address TEXT NOT NULL DEFAULT '',
  first_followup_minutes INTEGER NOT NULL DEFAULT 60,
  second_followup_minutes INTEGER NOT NULL DEFAULT 1440,
  updated_at INTEGER NOT NULL
);
