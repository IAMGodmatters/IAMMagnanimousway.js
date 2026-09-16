import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createPasswordRecord,
  verifyPassword,
  PASSWORD_SECURITY_POLICY,
} from '../../worker/src/password-security.js';

const password = 'Magnanimous-Smoke-Password-2026!';

assert.equal(PASSWORD_SECURITY_POLICY.algorithm, 'pbkdf2-sha256');
assert.equal(PASSWORD_SECURITY_POLICY.default_iterations, 600000);
assert.ok(PASSWORD_SECURITY_POLICY.minimum_iterations >= 210000);

const record = await createPasswordRecord(password, {});
assert.equal(record.iterations, 600000);
assert.ok(record.password_hash.startsWith('pbkdf2-sha256$600000$'));
assert.ok(record.password_salt.length >= 16);

const verified = await verifyPassword(password, record.password_hash, record.password_salt, {});
assert.equal(verified.valid, true);
assert.equal(verified.needs_upgrade, false);
assert.equal(verified.iterations, 600000);

const rejected = await verifyPassword(`${password}-wrong`, record.password_hash, record.password_salt, {});
assert.equal(rejected.valid, false);

// Preserve login compatibility with the platform's original salted SHA-256
// records so a successful legacy login can upgrade the password in place.
const legacySalt = 'legacy-smoke-salt';
const legacyHash = createHash('sha256').update(`${legacySalt}:${password}`).digest('hex');
const legacy = await verifyPassword(password, legacyHash, legacySalt, {});
assert.equal(legacy.valid, true);
assert.equal(legacy.needs_upgrade, true);
assert.equal(legacy.algorithm, 'legacy-sha256');

console.log('Password security lock passed: Worker-compatible 600k PBKDF2 and legacy upgrade verification are intact.');
