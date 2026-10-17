import fs from 'node:fs';

const OFFICIAL_REPO = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const OFFICIAL_REPO_ID = 946120273;
const TOKEN = process.env.GITHUB_TOKEN || '';
const fingerprints = [
  'IAMW-PROVENANCE-2026-10-17-4AB60E4D',
  'durable rate limiter unavailable; using bounded local fallback',
];

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'magnanimous-clone-exposure-watch',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { message: text }; }
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status} ${body?.message || text.slice(0, 240)}`);
  }
  return body;
}

function codeQuery(fingerprint) {
  return encodeURIComponent(`"${fingerprint}" in:file`);
}

const findings = [];
const warnings = [];
const repo = await github(`/repos/${OFFICIAL_REPO}`);
const visibility = String(repo.visibility || (repo.private ? 'private' : 'public'));
const forkCount = Number(repo.forks_count || 0);
const networkCount = Number(repo.network_count || 0);

if (visibility !== 'private') {
  warnings.push(`Repository visibility is ${visibility}; direct cloning remains technically possible until the repository is private.`);
}
if (forkCount > 0 || networkCount > 0) {
  findings.push({
    type: 'github-fork-or-network-copy',
    forks: forkCount,
    network_count: networkCount,
  });
}

for (const fingerprint of fingerprints) {
  try {
    const result = await github(`/search/code?q=${codeQuery(fingerprint)}&per_page=100`);
    for (const item of result.items || []) {
      const fullName = String(item.repository?.full_name || '');
      const repositoryId = Number(item.repository?.id || 0);
      if (fullName !== OFFICIAL_REPO && repositoryId !== OFFICIAL_REPO_ID) {
        findings.push({
          type: 'external-exact-code-fingerprint',
          fingerprint,
          repository: fullName || 'unknown',
          url: item.html_url || '',
        });
      }
    }
  } catch (error) {
    warnings.push(`GitHub code-search check could not complete for fingerprint ${JSON.stringify(fingerprint)}: ${error.message}`);
  }
}

const lines = [
  '## Magnanimous clone exposure watch',
  '',
  `- Official repository: ${OFFICIAL_REPO}`,
  `- Visibility: ${visibility}`,
  `- GitHub forks: ${forkCount}`,
  `- GitHub network count: ${networkCount}`,
  `- External exact-fingerprint findings: ${findings.length}`,
];

for (const warning of warnings) lines.push(`- ⚠️ ${warning}`);
for (const finding of findings) lines.push(`- 🚨 ${JSON.stringify(finding)}`);
const summary = `${lines.join('\n')}\n`;

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
for (const warning of warnings) console.log(`::warning::${warning}`);

if (findings.length > 0) {
  console.error(`::error::Potential public clone/reuse evidence found (${findings.length} finding(s)). Review the job summary before taking action.`);
  process.exit(2);
}

console.log('Clone exposure watch PASS: no external exact-match evidence found.');
