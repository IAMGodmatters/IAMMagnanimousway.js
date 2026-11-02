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

if (!token) {
  console.error('::error::GitHub ruleset verification token is unavailable. Production deployment is blocked closed for safety.');
  process.exit(1);
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
  console.error('::error::Unable to inspect repository metadata and active rulesets. Production deployment is blocked closed for safety.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (repository?.default_branch !== 'main' || repository?.protected !== true) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: main is not the protected default branch.');
  process.exit(1);
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
  console.error('::error::Unable to read the full ruleset definitions. Production deployment is blocked closed for safety.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const allRules = applicable.flatMap(item => Array.isArray(item.rules) ? item.rules : []);
const pullRequest = allRules.find(rule => rule.type === 'pull_request');
const reviewCount = Number(pullRequest?.parameters?.required_approving_review_count || 0);
if (!pullRequest || reviewCount < 1) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: no active main ruleset requires at least one pull-request approval.');
  console.error('Update GitHub Settings > Rules > Rulesets > Protect main to require a reviewed pull request.');
  process.exit(1);
}

const statusRule = allRules.find(rule => rule.type === 'required_status_checks');
const requiredChecks = new Set((statusRule?.parameters?.required_status_checks || [])
  .map(item => String(item?.context || '').trim())
  .filter(Boolean));
const required = ['Code health and builds', 'verify-command-architecture'];
const missing = required.filter(context => !requiredChecks.has(context));
if (!statusRule || missing.length) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: main does not require the exact Full Platform QA build and Magnanimous Command Lock checks.');
  console.error(`Missing required check contexts: ${missing.join(', ') || required.join(', ')}`);
  console.error('Required contexts: ' + required.join(', '));
  process.exit(1);
}
if (statusRule.parameters?.strict_required_status_checks_policy !== true) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: required checks are not configured for the latest target-branch commit.');
  process.exit(1);
}

const visibleBypassPolicies = applicable.filter(item => Array.isArray(item.bypass_actors));
const integrationBypasses = visibleBypassPolicies.flatMap(item => item.bypass_actors)
  .filter(actor => actor.actor_type === 'Integration' && actor.bypass_mode === 'always');
if (integrationBypasses.length) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: an integration can bypass main branch protections.');
  console.error('Remove always-bypass integration actors; retain only a documented emergency owner/admin path if necessary.');
  process.exit(1);
}
if (visibleBypassPolicies.length !== applicable.length) {
  console.warn('::warning::Main ruleset review, approval and status-check rules are verified. GitHub hides bypass-actor details from this read-only token; a repository administrator must verify that no integration has always-bypass access.');
}

console.log('Main branch protection gate: PASS — active rulesets require a reviewed pull request and exact Full Platform QA and Magnanimous Command Lock checks with strict latest-head validation. Bypass actors are checked only when GitHub exposes their definitions to this token.');
