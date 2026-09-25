import assert from 'node:assert/strict';
import { handlePhoneCarrier } from '../../worker/src/phone-carrier-runtime.js';

const encoder = new TextEncoder();

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function fakeDb(user) {
  return {
    prepare() {
      const statement = {
        bind() { return statement; },
        async first() { return user; },
        async all() { return { results: [] }; },
        async run() { return { meta: { last_row_id: 1 } }; }
      };
      return statement;
    }
  };
}

async function bearer(secret, user) {
  const exp = Math.floor(Date.now() / 1000) + 600;
  const sig = await hmacHex(secret, `${user.id}|${user.tenant_id}|${user.role}|${exp}`);
  return `Bearer ${user.id}|${user.tenant_id}|${user.role}|${exp}|${sig}`;
}

const user = { id: 'u1', tenant_id: 't1', role: 'owner', name: 'Owner', email: 'owner@example.test', active: 1 };
const secret = 'router-lock-secret';
const env = {
  SESSION_SECRET: secret,
  DB: fakeDb(user),
  PLIVO_AUTH_ID: 'MA00000000000000000000',
  PLIVO_AUTH_TOKEN: 'plivo-test-token',
  PLIVO_PHONE_NUMBER: '+15551234567'
};

{
  const request = new Request('https://iammagnanimousway.com/api/phone/config', { method: 'GET' });
  const response = await handlePhoneCarrier(request, env);
  assert.equal(response?.status, 401, 'unsigned browser phone config must be rejected');
  const body = await response.json();
  assert.match(String(body.detail || ''), /sign in required/i);
}

{
  const authorization = await bearer(secret, user);
  const request = new Request('https://iammagnanimousway.com/api/phone/calls/outbound', {
    method: 'POST',
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify({ to: '+15559876543' })
  });
  const response = await handlePhoneCarrier(request, env);
  assert.equal(response?.status, 400, 'outbound carrier call without consent must fail before routing');
  const body = await response.json();
  assert.equal(body.code, 'CALL_CONSENT_REQUIRED');
}

{
  const request = new Request('https://iammagnanimousway.com/api/phone/plivo/answer?message=hello', { method: 'GET' });
  const response = await handlePhoneCarrier(request, env);
  assert.equal(response?.status, 403, 'public Plivo answer route must reach signature validation, not browser auth/generic fallback');
  const body = await response.text();
  assert.match(body, /Unauthorized call request/i);
}

console.log('Magnanimous Telecom compatibility router executable lock passed.');
