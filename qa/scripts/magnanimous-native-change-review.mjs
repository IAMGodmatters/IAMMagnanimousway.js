import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const AREAS = [
  ['identity / authorization', /(?:^|\/)(?:auth|sessions?|identity|permissions?|rbac|tenant)(?:[/. -]|$)/i],
  ['billing / payments', /(?:stripe|billing|payments?|subscriptions?|checkout|invoic)/i],
  ['telecom / communications', /(?:telecom|voice|sms|imessage|voicemail|carrier|twilio)/i],
  ['runtime / API', /^(?:worker\/|backend\/|cloudflare-core\/|frontend\/app\/api\/)/i],
  ['deployment / secrets', /(?:^\.github\/workflows\/|wrangler|\.env|secrets?|deploy|migration)/i],
];
const CRITICAL = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['GitHub access token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,})/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{16,}\b/],
];
const REVIEW = [
  ['dynamic execution', /\b(?:eval\s*\(|new\s+Function\s*\()/],
  ['shell execution', /\bexec(?:Sync|File|FileSync)?\s*\(/],
  ['HTML injection surface', /\bdangerouslySetInnerHTML\b|\binnerHTML\s*=/],
  ['potentially unsafe TLS', /\bNODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0\b|\brejectUnauthorized\s*:\s*false\b/],
];
const clean = value => String(value).replace(/[^\w./@-]/g, '_').slice(0, 220);

export function examineChanges(paths, patch) {
  const changed = [...new Set(paths)].sort();
  const areas = AREAS.filter(([, regex]) => changed.some(path => regex.test(path))).map(([label]) => label);
  const hasTests = changed.some(path => /(?:^|\/)(?:__tests__|tests?|qa)(?:\/|$)|(?:test|spec)\.[cm]?[jt]sx?$/i.test(path));
  const findings = [];
  const lines = patch.split('\n');
  for (const line of lines) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const added = line.slice(1);
    for (const [name, regex] of CRITICAL) {
      if (regex.test(added)) findings.push({ level: 'critical', reason: 'Potential committed ' + name + ' in added code; do not print the value.' });
    }
    for (const [name, regex] of REVIEW) {
      if (regex.test(added)) findings.push({ level: 'review', reason: 'Review changed ' + name + ' for authorization, injection, and misuse.' });
    }
  }
  const uniqueFindings = [...new Map(findings.map(item => [item.level + ':' + item.reason, item])).values()];
  if (areas.length && !hasTests) uniqueFindings.push({ level: 'review', reason: 'Sensitive area changed without a corresponding test/QA file in this diff.' });
  return { changedCount: changed.length, areas, hasTests, findings: uniqueFindings, critical: uniqueFindings.some(item => item.level === 'critical') };
}

export function summaryMarkdown(report) {
  const out = ['## Magnanimous native change review', '',
    'Read-only, free-first diff triage. Independent evidence review is still required before production release.',
    '',
    '- Changed files: ' + report.changedCount,
    '- Sensitive areas: ' + (report.areas.join(', ') || 'none matched'),
    '- Test/QA file changed: ' + (report.hasTests ? 'yes' : 'no'),
    '- Decision: ' + (report.critical ? 'BLOCK: suspected credential or key' : 'ADVISORY: review findings and existing checks'),
    ''];
  for (const item of report.findings) out.push('- **' + item.level.toUpperCase() + '**: ' + clean(item.reason).replaceAll('_', ' '));
  if (!report.findings.length) out.push('No rules triggered. This is not proof the change is safe.');
  out.push('', 'Never auto-apply suggested fixes, bypass authorization, or activate billable providers.');
  return out.join('\n') + '\n';
}

function selfTest() {
  const innocent = examineChanges(['docs/README.md'], '+hello world\n');
  assert.equal(innocent.critical, false);
  assert.equal(innocent.areas.length, 0);
  const risk = examineChanges(['worker/src/auth.js'], '+const result = eval(userInput);\n');
  assert(risk.areas.includes('identity / authorization'));
  assert(risk.findings.some(x => x.reason.includes('dynamic execution')));
  assert(risk.findings.some(x => x.reason.includes('without a corresponding test')));
  const withTest = examineChanges(['worker/src/auth.js', 'qa/tests/auth.test.js'], '+const a = 1;\n');
  assert.equal(withTest.hasTests, true);
  assert(!withTest.findings.some(x => x.reason.includes('without a corresponding test')));
  const key = examineChanges(['backend/config.js'], '+const key = "AKIA' + 'ABCDEFGHIJKLMNOP";\n');
  assert.equal(key.critical, true);
  const oldSecretOnly = examineChanges(['backend/config.js'], '-const key = "AKIA' + 'ABCDEFGHIJKLMNOP";\n+const key = "";');
  assert.equal(oldSecretOnly.critical, false);
  const output = summaryMarkdown(key);
  assert(!output.includes('AKIA'));
  console.log('Native independent change-review self-test PASS');
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const base = process.env.MAGNANIMOUS_DIFF_BASE || 'HEAD^1';
  const head = process.env.MAGNANIMOUS_DIFF_HEAD || 'HEAD';
  const runGit = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const changedPaths = runGit(['diff', '--name-only', '-z', '--diff-filter=ACMR', base, head]).split('\0').filter(Boolean);
  const patch = runGit(['diff', '--unified=0', '--no-ext-diff', base, head]);
  const result = examineChanges(changedPaths, patch);
  const output = summaryMarkdown(result);
  console.log(output);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
  if (result.critical) {
    console.error('Potential credential exposure detected in added lines. Remove it and rotate any real exposed credential.');
    process.exitCode = 1;
  }
}
