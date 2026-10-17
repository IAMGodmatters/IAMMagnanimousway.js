import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

function walk(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

// Re-run the established protections so this master lock cannot drift away from them.
for (const script of [
  'qa/scripts/anti-clone-hardening-lock.mjs',
  'qa/scripts/private-repo-readiness-lock.mjs',
]) {
  execFileSync(process.execPath, [path.join(ROOT, script)], { stdio: 'inherit' });
}

const alwaysOnWorkflows = [
  '.github/workflows/anti-clone-hardening-lock.yml',
  '.github/workflows/private-repo-readiness-lock.yml',
  '.github/workflows/clone-exposure-watch.yml',
  '.github/workflows/proprietary-security-invariants-lock.yml',
];

for (const workflow of alwaysOnWorkflows) {
  assert(exists(workflow), `${workflow} must exist.`);
  const text = read(workflow);
  assert(/pull_request:\s*\n\s*branches:\s*\[main\]/m.test(text), `${workflow} must run for every pull request to main.`);
  assert(/push:\s*\n\s*branches:\s*\[main\]/m.test(text), `${workflow} must run for every push to main.`);
  assert(!/^\s*paths(?:-ignore)?:/m.test(text), `${workflow} must not use path filters; proprietary protection applies to every change.`);
  assert(!/contents:\s*write/i.test(text), `${workflow} must stay read-only to repository contents.`);
}

const cloneWatch = read('.github/workflows/clone-exposure-watch.yml');
assert(cloneWatch.includes('schedule:'), 'Clone exposure watch must keep its scheduled scan.');
assert(cloneWatch.includes('workflow_dispatch:'), 'Clone exposure watch must remain manually runnable.');

const approvedDistribution = new Set([
  'NOTICE.txt',
  'bootstrap.ps1',
  'install-core.ps1',
  'bridge_agent.py',
  'ncs2_edge.py',
  'uninstall.ps1',
]);
const distributionDir = 'frontend/public/downloads/local-bridge';
const distributionFiles = walk(distributionDir).map(rel => path.posix.basename(rel));
for (const name of distributionFiles) {
  assert(approvedDistribution.has(name), `Unreviewed Local Bridge public payload detected: ${name}. Add it to the explicit approved distribution boundary only after security review.`);
}
for (const name of approvedDistribution) {
  assert(distributionFiles.includes(name), `Approved Local Bridge distribution file is missing: ${name}.`);
}

const dangerousPublicExtensions = new Set([
  '.map', '.env', '.pem', '.key', '.p12', '.pfx',
  '.py', '.ps1', '.sh', '.bash', '.zsh', '.bat', '.cmd',
  '.ts', '.tsx', '.mjs', '.cjs', '.java', '.go', '.rs', '.cs', '.php', '.rb',
]);
for (const rel of walk('frontend/public')) {
  const normalized = rel.replaceAll('\\', '/');
  const ext = path.extname(normalized).toLowerCase();
  if (!dangerousPublicExtensions.has(ext)) continue;
  const allowed = normalized.startsWith(`${distributionDir}/`) && approvedDistribution.has(path.posix.basename(normalized));
  assert(allowed, `Source-like or sensitive file must not be published from frontend/public without explicit approval: ${normalized}`);
}

const ownRawRepo = 'raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js';
const frontendRuntimeFiles = [
  ...walk('frontend/app'),
  ...walk('frontend/components'),
  ...walk('frontend/lib'),
].filter(rel => /\.(?:js|jsx|ts|tsx|mjs|cjs)$/i.test(rel));
for (const rel of frontendRuntimeFiles) {
  const text = read(rel);
  assert(!text.includes(ownRawRepo), `Frontend runtime must not depend on public GitHub repository content: ${rel}`);
}

const notice = read(`${distributionDir}/NOTICE.txt`);
assert(/All Rights Reserved/i.test(notice), 'Client distribution must keep the All Rights Reserved notice.');
assert(/does not grant permission/i.test(notice), 'Client distribution notice must keep the no-license grant boundary.');

console.log('Proprietary Security Invariants Lock PASS: anti-clone, provenance, private-repo readiness, and public-source boundaries are intact.');
