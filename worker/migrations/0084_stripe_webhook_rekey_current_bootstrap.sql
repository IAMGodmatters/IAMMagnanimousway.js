-- Re-encrypt the live Stripe platform-billing webhook signing secret to the
-- current production bootstrap RSA-OAEP public key created at 1790032874.
-- Plaintext is intentionally absent. This ciphertext corresponds to Stripe
-- webhook endpoint we_1UIOl6Bqx3ebIzujOOvYM5Xl.
CREATE TABLE IF NOT EXISTS bootstrap_secrets (
  credential_key TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO bootstrap_secrets(credential_key,ciphertext_b64,created_at)
VALUES(
  'STRIPE_WEBHOOK_SECRET',
  'h8lG1xb25H5hByYTzxAo8pO8s324sn2lVOvp045rY0cVshs5N0i5glsPJ8fo9+6pYxlY0IiJGQifnOyJJIInm1CArrZKvHOk1Pi2TgBSc0sbSBsIcZbvTlvQGJ2WH1nPj4yW3L4mE17tDz22zINEk/cUYLyF+eWq23t4oiNtfUu26q56w1bdhR8gO5ljancyC9pzlHfSErjduQHEzMRDrrQ9rY0GJg3TpJBuQ8GIiBjBv7LsW03qtyJC3wLg31d99xkafmW1EHE1IXSMtXxTrw9L2uoaJgIbuh0Kz4giqnHTBGDgR3fbqqAbLPFly0TGBlq5864ND2uuyAgMO6hiWw==',
  1790064540
)
ON CONFLICT(credential_key) DO UPDATE SET
  ciphertext_b64=excluded.ciphertext_b64,
  created_at=excluded.created_at;
