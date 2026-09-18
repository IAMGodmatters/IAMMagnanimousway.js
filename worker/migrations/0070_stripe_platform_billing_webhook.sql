-- Rotate/install the live Stripe platform-billing webhook signing secret without storing plaintext.
-- Ciphertext was encrypted with the production D1 bootstrap RSA-OAEP public key.
CREATE TABLE IF NOT EXISTS bootstrap_secrets (
  credential_key TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO bootstrap_secrets(credential_key,ciphertext_b64,created_at)
VALUES(
  'STRIPE_WEBHOOK_SECRET',
  'paePGvOM8o8txs3U4nBPWQIiXF+vQAqT4TzsjisV887PIT1QTuW2HgV7CAQhU6IleeqfwnmiDYSbeox6L/I9hr9SQIfXKXGA6trhoVlW1mG7w4zVRk3bPDvOaT9HrGTjiczz95pW6d4HWo54E+JqKZxsSX1GGOyKa9eTPZzB5Xfe2SEXVce+bvNW1SMwMOHW7TXtmsJgu4cQLuFtliDeqNMKzuyF9aHo6uaRX5wNz+kNRXf4GieW2S7ZWu/nPWzlMCpzh2NCCs+BC9Q9vTyG14MYSlbgI/fcvbQX/2u5a0ndqIR0uRaveJ8toWQRyCBxPZaI1ovt8keCQEVvXVQgRg==',
  1789749815
)
ON CONFLICT(credential_key) DO UPDATE SET
  ciphertext_b64=excluded.ciphertext_b64,
  created_at=excluded.created_at;
