/**
 * Magnanimous security-review evidence inventory.
 *
 * Thirteen offline regression checks are executed against the checked-out
 * source. A PASS confirms only that the named local lock passed for this
 * revision. It is not a penetration test, certification, or proof of a
 * production control's effectiveness.
 *
 * No credentials, network calls, paid services, or production state are used.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const layers = [
  ['01', 'Password storage', 'qa/scripts/password-security-lock.mjs'],
  ['02', 'Multi-factor authentication', 'qa/scripts/totp-auth-lock.mjs'],
  ['03', 'Session verification', 'qa/scripts/opaque-session-downstream-auth-lock.mjs'],
  ['04', 'Tenant and owner separation', 'qa/scripts/white-label-brain-lock.mjs'],
  ['05', 'Consequential action authorization', 'qa/scripts/consequential-actions-lock.mjs'],
  ['06', 'Webhook signature and replay defenses', 'qa/scripts/webhook-security-lock.mjs'],
  ['07', 'Provider credential boundaries', 'qa/scripts/provider-runtime-env-auth-lock.mjs'],
  ['08', 'Variable-cost protections', 'qa/scripts/billing-cost-shield-lock.mjs'],
  ['09', 'Customer data privacy', 'qa/scripts/business-ai-history-privacy-lock.mjs'],
  ['10', 'Untrusted tool execution controls', 'qa/scripts/magnanimous-orca-execution-security-lock.mjs'],
  ['11', 'Frontend dependency security baseline', 'qa/scripts/next-security-baseline-lock.mjs'],
  ['12', 'Repository and CI protection invariants', 'qa/scripts/proprietary-security-invariants-lock.mjs'],
  ['13', 'Central security entrypoint and release hardening', 'qa/scripts/full-platform-hardening-lock.mjs'],
];

const results = layers.map(([id, name, script]) => {
  const child = spawnSync(process.execPath, [path.join(root, script)], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env, CI: 'true' },
  });
  const passed = !child.error && child.status === 0;
  const error = passed ? null : [child.error?.message, child.stderr, child.stdout]
    .filter(Boolean).join('\n').trim().slice(0, 700) || `Exit code ${child.status}`;
  return { id, name, script, result: passed ? 'PASS' : 'FAIL', ...(error ? { error } : {}) };
});

const evidence = {
  schema: 'magnanimous-security-evidence-v1',
  commit: process.env.GITHUB_SHA || 'local-checkout',
  type: 'source-regression-checks-only',
  limitation: 'Not a penetration test, audit opinion, independent attestation, production verification, or certification.',
  independent_pentest_status: 'NOT_VERIFIED',
  production_runtime_status: 'NOT_VERIFIED',
  total: results.length,
  passed: results.filter(result => result.result === 'PASS').length,
  results,
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} else {
  for (const item of results) {
    console.log(`${item.result} ${item.id} ${item.name} (${item.script})`);
    if (item.error) console.error(`  ${item.error.replaceAll('\n', ' ').slice(0, 280)}`);
  }
  console.log(`Local security regression evidence: ${evidence.passed}/${evidence.total} passed.`);
  console.log(evidence.limitation);
}

if (evidence.passed !== evidence.total) process.exitCode = 1;
