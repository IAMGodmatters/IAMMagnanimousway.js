import { evaluateMainRulesets } from '../../qa/lib/main-ruleset-audit.mjs';

const inActions = process.env.GITHUB_ACTIONS === 'true';
const branch = process.env.GITHUB_REF_NAME || '';
const workflow = process.env.GITHUB_WORKFLOW || '';
const repo = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const token = process.env.RULESET_AUDIT_TOKEN || process.env.GITHUB_TOKEN || '';

// Local builds and diagnostic workflows remain runnable. A real production
// deployment workflow must originate from main; a manual dispatch from another
// ref is a release attempt against a non-authoritative branch and fails closed.
if (!inActions || workflow !== 'Build and Deploy I AM') {
  console.log('Main branch protection gate: skipped outside the production deployment workflow.');
  process.exit(0);
}
if (branch !== 'main') {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: production deployments must run from the authoritative main branch.');
  process.exit(1);
}

if (!token) {
  console.error('::error::GitHub ruleset verification token is unavailable. Production deployment is blocked closed for safety.');
  process.exit(1);
}

const apiRoot = 'https://api.github.com/repos/' + repo;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: 'Bearer ' + token,
  'User-Agent': 'iam-magnanimous-way-main-ruleset-deploy-gate',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function readJson(url, label) {
  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  } catch (error) {
    console.error('::error::Unable to read ' + label + '. Production deployment is blocked closed for safety.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  if (!response.ok) {
    console.error('::error::' + label + ' returned HTTP ' + response.status + '. Production deployment is blocked closed for safety.');
    process.exit(1);
  }
  try {
    return await response.json();
  } catch (error) {
    console.error('::error::' + label + ' returned invalid JSON. Production deployment is blocked closed for safety.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function readAllRulesets() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const rows = await readJson(
      apiRoot + '/rulesets?includes_parents=true&targets=branch&per_page=100&page=' + page,
      'GitHub repository and parent ruleset list'
    );
    if (!Array.isArray(rows)) {
      console.error('::error::GitHub returned a non-array ruleset response. Production deployment is blocked closed for safety.');
      process.exit(1);
    }
    all.push(...rows);
    if (rows.length < 100) return all;
  }
  console.error('::error::Ruleset pagination exceeded 10 pages. Production deployment is blocked closed for safety.');
  process.exit(1);
}

const branchData = await readJson(apiRoot + '/branches/main', 'GitHub main branch protection check');
if (branchData?.protected !== true) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: GitHub does not report main as protected.');
  console.error('Configure a main-branch ruleset with required pull-request review and required status checks.');
  process.exit(1);
}

const branchRules = await readJson(apiRoot + '/rules/branches/main', 'GitHub effective main-branch rules');
if (!Array.isArray(branchRules)) {
  console.error('::error::GitHub returned a non-array effective branch-rules response. Production deployment is blocked closed for safety.');
  process.exit(1);
}

const rulesets = await readAllRulesets();
const active = rulesets.filter(item =>
  item && item.target === 'branch' && item.enforcement === 'active'
);
const applicableIds = new Set(
  branchRules
    .filter(rule => rule && rule.ruleset_id !== undefined && rule.ruleset_id !== null)
    .map(rule => String(rule.ruleset_id))
);
const detailsById = {};
for (const item of active) {
  if (!applicableIds.has(String(item.id))) continue;
  detailsById[String(item.id)] = await readJson(
    apiRoot + '/rulesets/' + encodeURIComponent(item.id) + '?includes_parents=true',
    'GitHub ruleset ' + String(item.name || item.id)
  );
}

const assessment = evaluateMainRulesets(active, detailsById, branchRules);
if (assessment.status !== 'pass') {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: GitHub main ruleset requirements are not satisfied.');
  for (const gap of assessment.gaps || ['The main ruleset could not be verified.']) {
    console.error('::error::' + gap);
  }
  console.error(
    'Required: at least one PR approval; exact checks "Code health and builds" and ' +
    '"verify-command-architecture", both restricted to GitHub Actions app ID 15368; ' +
    'strict up-to-date checks; and no unrestricted bypass actors.'
  );
  process.exit(1);
}

console.log(
  'Main branch protection gate: PASS — ' +
  assessment.requiredApprovals + ' required PR approval(s); exact checks ' +
  assessment.requiredCheckContexts.join('; ') +
  ' from GitHub Actions app ID ' + assessment.requiredCheckAppId +
  '; strict up-to-date policy enabled; no unrestricted bypass actors.'
);
