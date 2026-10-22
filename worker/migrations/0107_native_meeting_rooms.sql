-- Native, tenant-isolated, two-person browser meeting signaling and room chat.
-- Media flows peer-to-peer; no recordings or media are stored here.
CREATE TABLE IF NOT EXISTS mag_meeting_rooms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  host_user_id TEXT NOT NULL,
  guest_user_id TEXT,
  title TEXT NOT NULL,
  invite_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS mag_meeting_rooms_host ON mag_meeting_rooms(tenant_id,host_user_id,expires_at);
CREATE TABLE IF NOT EXISTS mag_meeting_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS mag_meeting_events_room ON mag_meeting_events(room_id,id);
