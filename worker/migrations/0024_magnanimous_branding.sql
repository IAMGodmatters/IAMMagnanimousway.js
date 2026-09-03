-- Make Magnanimous AI the canonical public orchestration identity without
-- touching authentication/session compatibility data.
INSERT INTO settings(key,value)
VALUES ('site_name','I AM Magnanimous AI Platform')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;

INSERT INTO settings(key,value)
VALUES ('tagline','Free AI tools, Magnanimous AI orchestration, and creator tools in one place.')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;
