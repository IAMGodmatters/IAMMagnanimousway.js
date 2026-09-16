import { pbkdf2 as nodePbkdf2, scrypt as nodeScrypt } from 'node:crypto';

const encoder = new TextEncoder();
const SCRYPT_PREFIX = 'scrypt-v1';
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 2;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;
const MIN_SCRYPT_N = 16384;
const MAX_SCRYPT_N = 32768;
const MAX_SCRYPT_R = 16;
const MAX_SCRYPT_P = 4;

// Compatibility only. Cloudflare Workers reject PBKDF2 requests above 100,000
// iterations, so new records use scrypt. The previous PBKDF2 code never
// completed a production signup at its 600,000-round setting, but hashes at or
// below the Worker ceiling remain verifiable and are upgraded to scrypt.
const PBKDF2_PREFIX = 'pbkdf2-sha256';
const PBKDF2_RUNTIME_MAX = 100000;
const PBKDF2_STORED_MAX = 1200000;

const SALT_BYTES = 16;
const HASH_BYTES = 32;
const MAX_PASSWORD_BYTES = 1024;

function bytesToB64Url(bytes) {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64UrlToBytes(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, ch => ch.charCodeAt(0));
}

function passwordBytes(password) {
  const bytes = encoder.encode(String(password || ''));
  if (bytes.byteLength > MAX_PASSWORD_BYTES) throw new Error('Password is too long.');
  return bytes;
}

function isPowerOfTwo(value) {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

function validScryptParams(n, r, p) {
  return isPowerOfTwo(n)
    && n >= MIN_SCRYPT_N
    && n <= MAX_SCRYPT_N
    && Number.isInteger(r)
    && r >= 1
    && r <= MAX_SCRYPT_R
    && Number.isInteger(p)
    && p >= 1
    && p <= MAX_SCRYPT_P;
}

async function deriveScrypt(password, salt, n = SCRYPT_N, r = SCRYPT_R, p = SCRYPT_P) {
  if (!validScryptParams(n, r, p)) throw new Error('Unsupported scrypt parameters.');
  const input = passwordBytes(password);
  const derived = await new Promise((resolve, reject) => {
    nodeScrypt(input, salt, HASH_BYTES, { N: n, r, p, maxmem: SCRYPT_MAXMEM }, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
  return new Uint8Array(derived);
}

async function derivePbkdf2(password, salt, iterations) {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_RUNTIME_MAX) {
    throw new Error('Unsupported PBKDF2 work factor in this runtime.');
  }
  const input = passwordBytes(password);
  const derived = await new Promise((resolve, reject) => {
    nodePbkdf2(input, salt, iterations, HASH_BYTES, 'sha256', (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
  return new Uint8Array(derived);
}

async function legacyDigest(password, salt) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${password}`));
  return new Uint8Array(bytes);
}

function hexToBytes(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(text)) return new Uint8Array();
  const bytes = new Uint8Array(text.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(text.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.byteLength !== right.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < left.byteLength; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

export function isModernPasswordHash(value) {
  const text = String(value || '');
  return text.startsWith(`${SCRYPT_PREFIX}$`) || text.startsWith(`${PBKDF2_PREFIX}$`);
}

export async function createPasswordRecord(password, _env) {
  passwordBytes(password);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await deriveScrypt(password, salt);
  const saltText = bytesToB64Url(salt);
  return {
    password_hash: `${SCRYPT_PREFIX}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${saltText}$${bytesToB64Url(derived)}`,
    password_salt: saltText,
    algorithm: SCRYPT_PREFIX,
    n: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  };
}

export async function verifyPassword(password, storedHash, storedSalt, _env) {
  passwordBytes(password);
  const hash = String(storedHash || '').trim();

  if (hash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const parts = hash.split('$');
    if (parts.length !== 6) return { valid: false, needs_upgrade: false, algorithm: SCRYPT_PREFIX };
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (!validScryptParams(n, r, p)) return { valid: false, needs_upgrade: false, algorithm: SCRYPT_PREFIX };
    let salt;
    let expected;
    try {
      salt = b64UrlToBytes(parts[4]);
      expected = b64UrlToBytes(parts[5]);
    } catch (_) {
      return { valid: false, needs_upgrade: false, algorithm: SCRYPT_PREFIX };
    }
    const actual = await deriveScrypt(password, salt, n, r, p);
    const valid = constantTimeEqual(actual, expected);
    return {
      valid,
      needs_upgrade: valid && (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P),
      algorithm: SCRYPT_PREFIX,
      n,
      r,
      p
    };
  }

  if (hash.startsWith(`${PBKDF2_PREFIX}$`)) {
    const parts = hash.split('$');
    if (parts.length !== 4) return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_STORED_MAX) {
      return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    }
    if (iterations > PBKDF2_RUNTIME_MAX) {
      return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX, iterations, unsupported_runtime: true };
    }
    let salt;
    let expected;
    try {
      salt = b64UrlToBytes(parts[2]);
      expected = b64UrlToBytes(parts[3]);
    } catch (_) {
      return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    }
    const actual = await derivePbkdf2(password, salt, iterations);
    const valid = constantTimeEqual(actual, expected);
    return {
      valid,
      needs_upgrade: valid,
      algorithm: PBKDF2_PREFIX,
      iterations
    };
  }

  // Backward compatibility for the original salted SHA-256 records. A successful
  // legacy login immediately replaces this fast hash with the current scrypt record.
  const expected = hexToBytes(hash);
  if (!expected.byteLength || !storedSalt) return { valid: false, needs_upgrade: false, algorithm: 'unknown' };
  const actual = await legacyDigest(password, String(storedSalt));
  return {
    valid: constantTimeEqual(actual, expected),
    needs_upgrade: true,
    algorithm: 'legacy-sha256'
  };
}

export async function upgradePasswordIfNeeded(env, user, password, verification) {
  if (!verification?.valid || !verification?.needs_upgrade || !env?.DB || !user?.id) return false;
  const next = await createPasswordRecord(password, env);
  await env.DB.prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=?')
    .bind(next.password_hash, next.password_salt, user.id).run();
  return true;
}

export const PASSWORD_SECURITY_POLICY = Object.freeze({
  algorithm: SCRYPT_PREFIX,
  n: SCRYPT_N,
  r: SCRYPT_R,
  p: SCRYPT_P,
  maxmem_bytes: SCRYPT_MAXMEM,
  maximum_password_bytes: MAX_PASSWORD_BYTES,
  pbkdf2_runtime_compatibility_max: PBKDF2_RUNTIME_MAX,
  legacy_upgrade_on_login: true
});
