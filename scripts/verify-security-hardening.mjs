import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const wrangler = read('worker/wrangler.jsonc');
const entry = read('worker/src/security-entrypoint.js');
const guard = read('worker/src/security-hardening.js');

must(wrangler.includes('"main": "src/security-entrypoint.js"'), 'Production Worker must enter through security-entrypoint.js');
must(entry.includes("import app from './operations-entrypoint.js'"), 'Security entrypoint must wrap operations-entrypoint.js');
must(entry.includes('securityPreflight') && entry.includes('securityPostflight'), 'Security entrypoint must run preflight and postflight controls');
must(guard.includes('SECURE_SESSION_REQUIRED'), 'Strong-session fail-closed guard is missing');
must(guard.includes('AGENCY_ENTITLEMENT_REQUIRED'), 'Server-side Agency entitlement guard is missing');
must(guard.includes('PROTECTED_INTERNALS'), 'Prompt/internal extraction guard is missing');
must(guard.includes('security_rate_limits'), 'Rate-limit persistence is missing');
must(guard.includes("content-security-policy"), 'Security response headers are missing');
must(guard.includes("provider_name") && guard.includes("execution_engine"), 'Execution metadata redaction is missing');
must(guard.includes("billing_subscriptions"), 'Paid entitlement must be checked server-side');

console.log('I AM Magnanimous Way security boundary verified.');
