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

function eventBlock(text, eventName) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^  ${eventName}:\\s*$`).test(line));
  if (start < 0) return '';
  const block = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^  [A-Za-z0-9_-]+:\s*/.test(lines[i])) break;
    block.push(lines[i]);
  }
  return block.join('\n');
}

for (const script of [
  'qa/scripts/anti-clone-hardening-lock.mjs',
  'qa/scripts/private-repo-readiness-lock.mjs',
]) {
  execFileSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, stdio: 'inherit' });
}

const alwaysOnWorkflows = new Map([
  ['.github/workflows/anti-clone-hardening-lock.yml', 'node qa/scripts/anti-clone-hardening-lock.mjs'],
  ['.github/workflows/private-repo-readiness-lock.yml', 'node qa/scripts/private-repo-readiness-lock.mjs'],
  ['.github/workflows/clone-exposure-watch.yml', 'node qa/scripts/clone-exposure-watch.mjs'],
  ['.github/workflows/proprietary-security-invariants-lock.yml', 'node qa/scripts/proprietary-security-invariants-lock.mjs'],
]);

for (const [workflow, requiredCommand] of alwaysOnWorkflows) {
  assert(exists(workflow), `${workflow} must exist.`);
  const text = read(workflow);
  assert(/pull_request:\s*\n\s*branches:\s*\[main\]/m.test(text), `${workflow} must run for every pull request to main.`);
  assert(/push:\s*\n\s*branches:\s*\[main\]/m.test(text), `${workflow} must run for every push to main.`);
  assert(!/^\s*paths(?:-ignore)?:/m.test(text), `${workflow} must not use path filters; proprietary protection applies to every change.`);
  assert(!/^\s*permissions:\s*(?:write-all|read-all)\s*$/mi.test(text), `${workflow} must not use blanket token permissions.`);
  const permissions = text.match(/^permissions:\s*\n((?:[ \t]+[^\n]+\n?)*)/m);
  assert(permissions, `${workflow} must declare explicit workflow permissions.`);
  const permissionLines = permissions[1].split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  assert.deepEqual(permissionLines, ['contents: read'], `${workflow} must grant only contents: read at workflow scope.`);
  const prBlock = eventBlock(text, 'pull_request');
  assert(prBlock && !/^\s+types\s*:/m.test(prBlock), `${workflow} must not narrow pull_request with a types filter.`);
  assert(text.includes(requiredCommand), `${workflow} must continue invoking its security guard: ${requiredCommand}`);
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
const distributionFiles = walk(distributionDir).map(rel => path.posix.relative(distributionDir, rel.replaceAll('\\', '/')));
for (const rel of distributionFiles) {
  assert(!rel.includes('/'), `Nested Local Bridge public payloads are not allowed: ${rel}.`);
  assert(approvedDistribution.has(rel), `Unreviewed Local Bridge public payload detected: ${rel}. Add it to the explicit approved distribution boundary only after security review.`);
}
for (const name of approvedDistribution) assert(distributionFiles.includes(name), `Approved Local Bridge distribution file is missing: ${name}.`);

const dangerousPublicExtensions = new Set([
  '.map', '.pem', '.key', '.p12', '.pfx',
  '.py', '.ps1', '.sh', '.bash', '.zsh', '.bat', '.cmd',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.java', '.go', '.rs', '.cs', '.php', '.rb',
]);
const explicitlyApprovedPublicSource = new Set([]);
for (const rel of walk('frontend/public')) {
  const normalized = rel.replaceAll('\\', '/');
  const basename = path.posix.basename(normalized).toLowerCase();
  const ext = path.extname(normalized).toLowerCase();
  const envLike = basename === '.env' || basename.startsWith('.env.');
  const sensitive = envLike || dangerousPublicExtensions.has(ext);
  if (!sensitive) continue;
  const relativeToDistribution = normalized.startsWith(`${distributionDir}/`) ? path.posix.relative(distributionDir, normalized) : null;
  const distributionAllowed = Boolean(relativeToDistribution && !relativeToDistribution.includes('/') && approvedDistribution.has(relativeToDistribution));
  const sourceAllowed = explicitlyApprovedPublicSource.has(normalized);
  assert(distributionAllowed || sourceAllowed, `Source-like or sensitive file must not be published from frontend/public without explicit approval: ${normalized}`);
}

const repositoryRawPatterns = [
  /raw\.githubusercontent\.com\/IAMGodmatters\/IAMMagnanimousway\.js/i,
  /github\.com\/IAMGodmatters\/IAMMagnanimousway\.js\/(?:raw|blob)\//i,
];
const frontendRuntimeFiles = walk('frontend').filter(rel => {
  const normalized = rel.replaceAll('\\', '/');
  if (normalized.startsWith('frontend/public/') || normalized.includes('/node_modules/') || normalized.includes('/.next/') || normalized.includes('/coverage/')) return false;
  return /\.(?:js|jsx|ts|tsx|mjs|cjs)$/i.test(normalized);
});
for (const rel of frontendRuntimeFiles) {
  const text = read(rel);
  for (const pattern of repositoryRawPatterns) assert(!pattern.test(text), `Frontend runtime must not depend on public GitHub repository content: ${rel}`);
}

const notice = read(`${distributionDir}/NOTICE.txt`);
assert(/All Rights Reserved/i.test(notice), 'Client distribution must keep the All Rights Reserved notice.');
assert(/does not grant permission/i.test(notice), 'Client distribution notice must keep the no-license grant boundary.');

console.log('Proprietary Security Invariants Lock PASS: anti-clone, provenance, workflow permissions, public-source boundaries, and guard execution are intact.');
