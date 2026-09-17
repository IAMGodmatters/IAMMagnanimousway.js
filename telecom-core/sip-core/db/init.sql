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
