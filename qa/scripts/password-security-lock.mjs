import assert from 'node:assert/strict';
import { createHash, pbkdf2Sync } from 'node:crypto';
import {
  createPasswordRecord,
  verifyPassword,
  PASSWORD_SECURITY_POLICY,
} from '../../worker/src/password-security.js';

const password = 'Magnanimous-Smoke-Password-2026!';
const b64url = value => Buffer.from(value).toString('base64url');

assert.equal(PASSWORD_SECURITY_POLICY.algorithm, 'scrypt-v1');
assert.equal(PASSWORD_SECURITY_POLICY.n, 32768);
assert.equal(PASSWORD_SECURITY_POLICY.r, 8);
assert.equal(PASSWORD_SECURITY_POLICY.p, 2);
assert.ok(PASSWORD_SECURITY_POLICY.maxmem_bytes >= 64 * 1024 * 1024);

const record = await createPasswordRecord(password, {});
assert.equal(record.algorithm, 'scrypt-v1');
assert.equal(record.n, 32768);
assert.equal(record.r, 8);
assert.equal(record.p, 2);
assert.ok(record.password_hash.startsWith('scrypt-v1$32768$8$2$'));
assert.ok(record.password_salt.length >= 16);

const verified = await verifyPassword(password, record.password_hash, record.password_salt, {});
assert.equal(verified.valid, true);
assert.equal(verified.needs_upgrade, false);
assert.equal(verified.algorithm, 'scrypt-v1');

const rejected = await verifyPassword(`${password}-wrong`, record.password_hash, record.password_salt, {});
assert.equal(rejected.valid, false);

// Preserve any PBKDF2 record that is within the Cloudflare Worker runtime limit,
// then upgrade it to scrypt on successful login.
const pbkdf2Salt = Buffer.from('pbkdf2-compat-salt');
const pbkdf2Iterations = 100000;
const pbkdf2Derived = pbkdf2Sync(password, pbkdf2Salt, pbkdf2Iterations, 32, 'sha256');
const pbkdf2Hash = `pbkdf2-sha256$${pbkdf2Iterations}$${b64url(pbkdf2Salt)}$${b64url(pbkdf2Derived)}`;
const pbkdf2 = await verifyPassword(password, pbkdf2Hash, b64url(pbkdf2Salt), {});
assert.equal(pbkdf2.valid, true);
assert.equal(pbkdf2.needs_upgrade, true);
assert.equal(pbkdf2.algorithm, 'pbkdf2-sha256');

// The superseded 600k configuration never completed a production signup in
// Workers. Detect it explicitly instead of attempting an unsupported KDF call.
const unsupportedPbkdf2 = await verifyPassword(password, 'pbkdf2-sha256$600000$AA$AA', 'AA', {});
assert.equal(unsupportedPbkdf2.valid, false);
assert.equal(unsupportedPbkdf2.unsupported_runtime, true);

// Preserve login compatibility with the platform's original salted SHA-256
// records so a successful legacy login can upgrade the password in place.
const legacySalt = 'legacy-smoke-salt';
const legacyHash = createHash('sha256').update(`${legacySalt}:${password}`).digest('hex');
const legacy = await verifyPassword(password, legacyHash, legacySalt, {});
assert.equal(legacy.valid, true);
assert.equal(legacy.needs_upgrade, true);
assert.equal(legacy.algorithm, 'legacy-sha256');

console.log('Password security lock passed: scrypt create/verify, PBKDF2 compatibility, and legacy upgrade verification are intact.');
