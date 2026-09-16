const encoder = new TextEncoder();
const PBKDF2_PREFIX = 'pbkdf2-sha256';
const DEFAULT_ITERATIONS = 600000;
const MIN_ITERATIONS = 210000;
const MAX_ITERATIONS = 1200000;
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

function boundedIterations(env) {
  const configured = Number(env?.PASSWORD_PBKDF2_ITERATIONS || DEFAULT_ITERATIONS);
  if (!Number.isFinite(configured)) return DEFAULT_ITERATIONS;
  return Math.max(MIN_ITERATIONS, Math.min(MAX_ITERATIONS, Math.floor(configured)));
}

function passwordBytes(password) {
  const bytes = encoder.encode(String(password || ''));
  if (bytes.byteLength > MAX_PASSWORD_BYTES) throw new Error('Password is too long.');
  return bytes;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', passwordBytes(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations
  }, key, HASH_BYTES * 8);
  return new Uint8Array(bits);
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
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    try { return crypto.subtle.timingSafeEqual(left, right); } catch (_) {}
  }
  let diff = 0;
  for (let i = 0; i < left.byteLength; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

export function isModernPasswordHash(value) {
  return String(value || '').startsWith(`${PBKDF2_PREFIX}$`);
}

export async function createPasswordRecord(password, env) {
  passwordBytes(password);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iterations = boundedIterations(env);
  const derived = await derive(password, salt, iterations);
  const saltText = bytesToB64Url(salt);
  return {
    password_hash: `${PBKDF2_PREFIX}$${iterations}$${saltText}$${bytesToB64Url(derived)}`,
    password_salt: saltText,
    algorithm: PBKDF2_PREFIX,
    iterations
  };
}

export async function verifyPassword(password, storedHash, storedSalt, env) {
  passwordBytes(password);
  const hash = String(storedHash || '').trim();
  if (isModernPasswordHash(hash)) {
    const parts = hash.split('$');
    if (parts.length !== 4) return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    const iterations = Number(parts[1]);
    if (!Number.isFinite(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    let salt;
    let expected;
    try {
      salt = b64UrlToBytes(parts[2]);
      expected = b64UrlToBytes(parts[3]);
    } catch (_) {
      return { valid: false, needs_upgrade: false, algorithm: PBKDF2_PREFIX };
    }
    const actual = await derive(password, salt, iterations);
    return {
      valid: constantTimeEqual(actual, expected),
      needs_upgrade: iterations < boundedIterations(env),
      algorithm: PBKDF2_PREFIX,
      iterations
    };
  }

  // Backward compatibility for the original salted SHA-256 records. A successful
  // legacy login should immediately replace this fast hash with PBKDF2.
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
  algorithm: PBKDF2_PREFIX,
  default_iterations: DEFAULT_ITERATIONS,
  minimum_iterations: MIN_ITERATIONS,
  maximum_password_bytes: MAX_PASSWORD_BYTES,
  legacy_upgrade_on_login: true
});
