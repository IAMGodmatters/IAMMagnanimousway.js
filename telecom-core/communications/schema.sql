CREATE TABLE IF NOT EXISTS comm_conversations (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('direct','group','community')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS comm_members (
  conversation_id UUID NOT NULL REFERENCES comm_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS comm_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES comm_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  attachment_key TEXT,
  reply_to_id UUID REFERENCES comm_messages(id),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comm_messages_conversation_created_idx ON comm_messages(conversation_id,created_at DESC);
CREATE TABLE IF NOT EXISTS comm_receipts (
  message_id UUID NOT NULL REFERENCES comm_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('delivered','read')),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(message_id,user_id,state)
);
CREATE TABLE IF NOT EXISTS comm_reactions (
  message_id UUID NOT NULL REFERENCES comm_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(message_id,user_id,emoji)
);
CREATE TABLE IF NOT EXISTS comm_blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(blocker_id,blocked_id)
);
CREATE TABLE IF NOT EXISTS comm_reports (
  id UUID PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  subject_user_id TEXT NOT NULL,
  message_id UUID REFERENCES comm_messages(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS comm_devices (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  push_adapter TEXT,
  push_token_ciphertext TEXT,
  sync_sequence BIGINT NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comm_devices_user_idx ON comm_devices(user_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS comm_calls (
  id UUID PRIMARY KEY,
  caller_id TEXT NOT NULL,
  callee_id TEXT,
  destination_e164 TEXT,
  media TEXT NOT NULL CHECK(media IN ('audio','video','pstn')),
  state TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
