-- Secure, bounded Simli LIVE avatar session reservations.
-- API keys and provider session tokens are never stored in this table.
CREATE TABLE IF NOT EXISTS tiktok_live_avatar_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  usage_month TEXT NOT NULL,
  session_seconds INTEGER NOT NULL DEFAULT 120,
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','issued','failed','expired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tiktok_live_avatar_tenant_month_state
  ON tiktok_live_avatar_sessions(tenant_id, usage_month, state, created_at);

CREATE INDEX IF NOT EXISTS idx_tiktok_live_avatar_user
  ON tiktok_live_avatar_sessions(user_id, created_at);
