-- Rotate the live I AM Magnanimous Way Stripe platform-billing webhook secret
-- to the bootstrap RSA-OAEP key currently active in production.
--
-- Plaintext is intentionally absent. The ciphertext below was encrypted to the
-- public key reported by /api/bootstrap/public-key with created_at=1788341075.
-- It corresponds to the current live platform-billing webhook endpoint created
-- during the 2026-10-07 production recovery.
CREATE TABLE IF NOT EXISTS bootstrap_secrets (
  credential_key TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO bootstrap_secrets(credential_key,ciphertext_b64,created_at)
VALUES(
  'STRIPE_WEBHOOK_SECRET',
  'VzFlOqcJhRPaFT8cocG6UoVSb/iCmvw5Cd/0NSjxXe+Hvb6UveF3amqamElfhh8DydUrRIINn26NRB5HndnXEBfrsMYRHCKZ2JdW3Xe1U2RGfulrb9hq/vx4B5iCiw1C4rXzEgy/4Kd7zDTbqjZLzPSEmsqKswPni1rM3RJOUXFh6QT+ue0vku0u2iwznNc296vSTdGv71pyf5mTf0oLDsIiz5JBd2eTiqIzPtCc0GWeY7gHwpw/riZj4JEOglw+zeEW9QuLdEp4DulMW7aPHCQ0Duheq4e8QTrDKXTH1JxJLzQommPuOOQAMxryaXWRGWnQTAxdSBbxkdwR/ZHwxQ==',
  1791374048
)
ON CONFLICT(credential_key) DO UPDATE SET
  ciphertext_b64=excluded.ciphertext_b64,
  created_at=excluded.created_at;
