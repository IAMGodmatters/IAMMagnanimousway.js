import fs from 'node:fs';

const source = 'qa-results.json';
const destination = 'qa-summary.md';

if (!fs.existsSync(source)) {
  const text = '# I AM MAGNANIMOUS WAY™ QA Summary\n\nNo Playwright JSON report was produced. The test runner may have failed before tests started.\n';
  fs.writeFileSync(destination, text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(source, 'utf8'));
const tests = [];

function visitSuite(suite, parents = []) {
  const nextParents = suite.title ? [...parents, suite.title] : parents;
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const last = (test.results || []).at(-1) || {};
      const status = test.status || last.status || (test.results?.length ? 'unknown' : 'skipped');
      tests.push({
        title: [...nextParents, spec.title, test.projectName].filter(Boolean).join(' › '),
        status,
      });
    }
  }
  for (const child of suite.suites || []) visitSuite(child, nextParents);
}

for (const suite of data.suites || []) visitSuite(suite);

const failed = tests.filter((t) => ['unexpected', 'failed', 'timedOut', 'interrupted'].includes(t.status));
const skipped = tests.filter((t) => ['skipped', 'disabled'].includes(t.status));
const passed = tests.filter((t) => ['expected', 'passed'].includes(t.status));
const other = tests.length - failed.length - skipped.length - passed.length;

const lines = [
  '# I AM MAGNANIMOUS WAY™ QA Summary',
  '',
  `- Total checks: **${tests.length}**`,
  `- Passed: **${passed.length}**`,
  `- Failed: **${failed.length}**`,
  `- Skipped/blocked: **${skipped.length}**`,
  `- Other: **${other}**`,
  '',
];

if (failed.length) {
  lines.push('## Failures', '');
  for (const item of failed.slice(0, 100)) lines.push(`- ❌ ${item.title}`);
  if (failed.length > 100) lines.push(`- …and ${failed.length - 100} more failures. See the HTML report artifact.`);
  lines.push('');
} else {
  lines.push('## Result', '', '✅ No automated Playwright failures were reported.', '');
}

lines.push('## Interpretation', '', 'Automated PASS means the tested route/control worked in the test environment. Protected actions such as real PSTN calls, live payment approvals, identity verification, ownership transfers, and third-party account authorization still require the manual QA checklist.', '');

const text = lines.join('\n');
fs.writeFileSync(destination, text);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
console.log(text);
