const inActions = process.env.GITHUB_ACTIONS === 'true';
const branch = process.env.GITHUB_REF_NAME || '';
const workflow = process.env.GITHUB_WORKFLOW || '';
const repo = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const token = process.env.GITHUB_TOKEN || '';
const explicitAudit = process.env.MAGNANIMOUS_VERIFY_PROTECTION === 'true';

if (!explicitAudit && (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM')) {
  console.log('Main branch protection gate: skipped outside the production deployment workflow.');
  process.exit(0);
}

function policyFailure(message, details = '') {
  if (explicitAudit) {
    console.warn('::warning::RULESET AUDIT FINDING: ' + message);
    if (details) console.warn(details);
    return;
  }
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: ' + message);
  if (details) console.error(details);
  process.exit(1);
}

if (!token) {
  policyFailure('GitHub ruleset verification token is unavailable.');
  if (explicitAudit) {
    console.log('Read-only ruleset audit incomplete: add a GitHub token with repository Metadata read access.');
    process.exit(0);
  }
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'iam-magnanimous-way-branch-protection-gate',
  'X-GitHub-Api-Version': '2022-11-28',
};
async function githubJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`GitHub API ${response.status} for ${url}: ${detail.slice(0, 500)}`);
  }
  return response.json();
}
function appliesToMain(ruleset) {
  const include = ruleset?.conditions?.ref_name?.include;
  const exclude = ruleset?.conditions?.ref_name?.exclude || [];
  if (Array.isArray(exclude) && exclude.some(pattern => pattern === 'refs/heads/main')) return false;
  if (!Array.isArray(include) || include.length === 0) return true;
  return include.some(pattern => pattern === '~DEFAULT_BRANCH' || pattern === 'refs/heads/main' || pattern === 'refs/heads/*');
}

let repository;
let rulesets;
try {
  repository = await githubJson(`https://api.github.com/repos/${repo}`);
  rulesets = await githubJson(`https://api.github.com/repos/${repo}/rulesets?per_page=100`);
} catch (error) {
  policyFailure('Unable to inspect repository metadata and active rulesets.', error instanceof Error ? error.message : String(error));
  if (explicitAudit) {
    console.log('Read-only ruleset audit incomplete; no governance pass is claimed.');
    process.exit(0);
  }
}

if (repository?.default_branch !== 'main') {
  policyFailure('Repository default branch is not main.');
}

const activeBranchRules = (Array.isArray(rulesets) ? rulesets : [])
  .filter(item => item?.target === 'branch' && item?.enforcement === 'active');
let applicable = [];
try {
  const details = await Promise.all(activeBranchRules.map(item =>
    githubJson(`https://api.github.com/repos/${repo}/rulesets/${item.id}`)
  ));
  applicable = details.filter(appliesToMain);
} catch (error) {
  policyFailure('Unable to read the full ruleset definitions.', error instanceof Error ? error.message : String(error));
  if (explicitAudit) {
    console.log('Read-only ruleset audit incomplete; no governance pass is claimed.');
    process.exit(0);
  }
}

const allRules = applicable.flatMap(item => Array.isArray(item.rules) ? item.rules : []);
const pullRequest = allRules.find(rule => rule.type === 'pull_request');
const reviewCount = Number(pullRequest?.parameters?.required_approving_review_count || 0);
if (!pullRequest || reviewCount < 1) {
  policyFailure(
    'No active main ruleset requires at least one pull-request approval.',
    'Update GitHub Settings > Rules > Rulesets > Protect main to require a reviewed pull request.'
  );
}

const statusRule = allRules.find(rule => rule.type === 'required_status_checks');
const requiredChecks = new Set((statusRule?.parameters?.required_status_checks || [])
  .map(item => String(item?.context || '').trim())
  .filter(Boolean));
const required = ['Code health and builds', 'verify-command-architecture'];
const missing = required.filter(context => !requiredChecks.has(context));
if (!statusRule || missing.length) {
  policyFailure(
    'Main does not require the exact Full Platform QA build and Magnanimous Command Lock checks.',
    `Missing required check contexts: ${missing.join(', ') || required.join(', ')}. Required contexts: ${required.join(', ')}.`
  );
}
if (statusRule?.parameters?.strict_required_status_checks_policy !== true) {
  policyFailure('Required checks are not configured for the latest target-branch commit.');
}

const visibleBypassPolicies = applicable.filter(item => Array.isArray(item.bypass_actors));
const integrationBypasses = visibleBypassPolicies.flatMap(item => item.bypass_actors)
  .filter(actor => actor.actor_type === 'Integration' && actor.bypass_mode === 'always');
if (integrationBypasses.length) {
  policyFailure(
    'An integration can bypass main branch protections.',
    'Restrict integration bypass to pull requests only, after verifying the integration identity and deployment impact.'
  );
}
if (visibleBypassPolicies.length !== applicable.length) {
  console.warn('::warning::GitHub hides bypass-actor details from this read-only token; a repository administrator must verify all bypass actors.');
}

const findingsPresent =
  !pullRequest || reviewCount < 1 ||
  !statusRule || missing.length > 0 ||
  statusRule?.parameters?.strict_required_status_checks_policy !== true ||
  integrationBypasses.length > 0 ||
  visibleBypassPolicies.length !== applicable.length ||
  repository?.default_branch !== 'main';

if (explicitAudit) {
  console.log(findingsPresent
    ? 'Read-only ruleset audit completed with findings. This PR check is diagnostic only; production deployment remains fail-closed.'
    : 'Read-only ruleset audit completed: main has pull-request review, exact required checks and strict latest-head validation.');
  process.exit(0);
}

if (visibleBypassPolicies.length === applicable.length) {
  console.log('Main branch protection gate: PASS — active rulesets require a reviewed pull request and exact Full Platform QA and Magnanimous Command Lock checks with strict latest-head validation; bypass actors were visible and checked.');
} else {
  console.log('Main branch protection gate: PASS — reviewed pull request and exact required checks are configured. WARNING: bypass-actor details were hidden from this read-only token and must be checked by a repository administrator.');
}
