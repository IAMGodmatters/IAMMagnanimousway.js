import { evaluateMainRulesets } from '../../qa/lib/main-ruleset-audit.mjs';

const inActions = process.env.GITHUB_ACTIONS === 'true';
const branch = process.env.GITHUB_REF_NAME || '';
const workflow = process.env.GITHUB_WORKFLOW || '';
const repo = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const token = process.env.RULESET_AUDIT_TOKEN || process.env.GITHUB_TOKEN || '';

// Local builds, feature branches, and diagnostic workflows remain runnable.
// Only the actual production deployment build is subject to this fail-closed gate.
if (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM') {
  console.log('Main branch protection gate: skipped outside the production deployment workflow.');
  process.exit(0);
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

const branchData = await readJson(apiRoot + '/branches/main', 'GitHub main branch protection check');
if (branchData?.protected !== true) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: GitHub does not report main as protected.');
  console.error('Configure a main-branch ruleset with required pull-request review and required status checks.');
  process.exit(1);
}

const rulesets = await readJson(apiRoot + '/rulesets', 'GitHub main ruleset list');
const active = (Array.isArray(rulesets) ? rulesets : []).filter(item =>
  item && item.target === 'branch' && item.enforcement === 'active' &&
  (item.source === repo || item.source_type === 'Repository')
);
const detailsById = {};
for (const item of active) {
  detailsById[String(item.id)] = await readJson(
    apiRoot + '/rulesets/' + encodeURIComponent(item.id),
    'GitHub ruleset ' + String(item.name || item.id)
  );
}

const assessment = evaluateMainRulesets(active, detailsById, repo);
if (assessment.status !== 'pass') {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: GitHub main ruleset requirements are not satisfied.');
  for (const gap of assessment.gaps || ['The main ruleset could not be verified.']) {
    console.error('::error::' + gap);
  }
  console.error('Required: at least one PR approval, exact checks "Code health and builds" and "verify-command-architecture", strict up-to-date checks, and no unrestricted bypass actors.');
  process.exit(1);
}

console.log(
  'Main branch protection gate: PASS — ' +
  assessment.requiredApprovals + ' required PR approval(s); exact checks ' +
  assessment.requiredCheckContexts.join('; ') +
  '; strict up-to-date policy enabled; no always-bypass actors.'
);
