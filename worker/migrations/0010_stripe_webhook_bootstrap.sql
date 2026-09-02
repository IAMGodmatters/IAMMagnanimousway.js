-- Production-scoped encrypted bootstrap credential.
-- The ciphertext below was encrypted with this deployment's D1-resident RSA-OAEP
-- public key. The plaintext Stripe webhook secret is never stored in source.
CREATE TABLE IF NOT EXISTS bootstrap_secrets (
  credential_key TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO bootstrap_secrets(credential_key,ciphertext_b64,created_at)
VALUES(
  'STRIPE_WEBHOOK_SECRET',
  'ZTsX9GD3czcxgPhk83/CfAASXIc2FE39HxToRXoQYQmTtmGMZrniUoUhFp0df2u+engeUjJNdAHhyVxw7hz3RzChyGKF1kn58MbkkxR6PxJzPux3g+3yMsGB3bAUN7i66OBOO1qutyzZEYFL90FOTI6d/UyJjpivB02Fz9vc7dKi7cxTTPej2Pl7T7nXjy1roY65L13AhVnAVgLKC0ZNI2I6/FYQhxG0LnknZ8aSCSCMbNYfgOgVd2yGrWKkqd77xO9x9xHLUWqtgiwCHhsTAkVsVlWYbR6S6u2ExwQcmOpo9FNVaaiV7EJMNnVerOAkjPtpO4CBzbnHxScvKke9cg==',
  1788341088
)
ON CONFLICT(credential_key) DO UPDATE SET
  ciphertext_b64=excluded.ciphertext_b64,
  created_at=excluded.created_at;
