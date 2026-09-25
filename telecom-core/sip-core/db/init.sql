CREATE TABLE IF NOT EXISTS subscriber (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    domain VARCHAR(128) NOT NULL,
    password VARCHAR(128) NOT NULL DEFAULT '',
    ha1 VARCHAR(128) NOT NULL,
    ha1b VARCHAR(128) NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriber_active_idx ON subscriber(active);
CREATE INDEX IF NOT EXISTS subscriber_domain_idx ON subscriber(domain);

COMMENT ON TABLE subscriber IS 'Magnanimous-owned SIP subscriber authentication records. Cleartext SIP passwords are not stored; HA1 digest material is stored for SIP Digest authentication.';

CREATE TABLE IF NOT EXISTS stasis_managed_bridges (
    bridge_id VARCHAR(180) PRIMARY KEY,
    call_id VARCHAR(180) NOT NULL,
    channel_ids JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    ended_at BIGINT
);
CREATE INDEX IF NOT EXISTS stasis_managed_bridges_status_idx ON stasis_managed_bridges(status);

CREATE TABLE IF NOT EXISTS stasis_supervisor_sessions (
    session_id VARCHAR(180) PRIMARY KEY,
    call_bridge_id VARCHAR(180) NOT NULL,
    supervisor_bridge_id VARCHAR(180) NOT NULL,
    snoop_channel_id VARCHAR(180) NOT NULL,
    target_channel_id VARCHAR(180) NOT NULL,
    supervisor_channel_id VARCHAR(180) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    requested_by VARCHAR(200) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    ended_at BIGINT
);
CREATE INDEX IF NOT EXISTS stasis_supervisor_sessions_status_idx ON stasis_supervisor_sessions(status);
CREATE INDEX IF NOT EXISTS stasis_supervisor_sessions_call_bridge_idx ON stasis_supervisor_sessions(call_bridge_id);

CREATE TABLE IF NOT EXISTS stasis_recordings (
    recording_name VARCHAR(180) PRIMARY KEY,
    bridge_id VARCHAR(180) NOT NULL,
    requested_by VARCHAR(200) NOT NULL,
    consent_basis VARCHAR(500) NOT NULL,
    consent_confirmed BOOLEAN NOT NULL,
    beep BOOLEAN NOT NULL DEFAULT TRUE,
    max_duration_seconds INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL,
    ended_at BIGINT
);
CREATE INDEX IF NOT EXISTS stasis_recordings_status_idx ON stasis_recordings(status);
CREATE INDEX IF NOT EXISTS stasis_recordings_bridge_idx ON stasis_recordings(bridge_id);

COMMENT ON TABLE stasis_recordings IS 'Magnanimous Stasis bridge recording lifecycle and consent audit evidence. Recording media remains in Asterisk-managed recording storage.';
