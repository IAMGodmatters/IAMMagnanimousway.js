-- Emergency encrypted Stripe platform-billing webhook fallback.
--
-- This file is intentionally kept aligned with the currently active production
-- bootstrap RSA-OAEP public key because deploy.yml executes it directly only when
-- the protected Actions secret is absent AND the D1 bootstrap row is missing.
-- It is not a plaintext secret source. The ciphertext below is encrypted to the
-- production bootstrap key created at 1788341075 and corresponds to the current
-- live platform-billing webhook endpoint created during the 2026-10-07 recovery.
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
