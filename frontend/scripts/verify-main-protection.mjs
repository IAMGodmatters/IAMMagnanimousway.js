const inActions = process.env.GITHUB_ACTIONS === 'true';
const branch = process.env.GITHUB_REF_NAME || '';
const workflow = process.env.GITHUB_WORKFLOW || '';
const repo = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';
const token = process.env.GITHUB_TOKEN || '';

if (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM') {
  console.log('Main branch protection gate: skipped outside the production deployment workflow.');
  process.exit(0);
}

if (!token) {
  console.error('::error::GitHub read-only repository administration token is unavailable. Production deployment is blocked.');
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'iam-magnanimous-way-branch-protection-gate',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}: ${body?.message || 'request failed'}`);
  }
  return body;
}

try {
  const branchInfo = await github(`/repos/${repo}/branches/main`);
  if (branchInfo?.protected !== true) {
    throw new Error('GitHub does not report main as protected.');
  }

  const rulesets = await github(`/repos/${repo}/rulesets`);
  const candidate = Array.isArray(rulesets)
    ? rulesets.find(item => item?.name === 'Protect main' && item?.target === 'branch' && item?.enforcement === 'active')
    : null;
  if (!candidate?.id) throw new Error('No active Protect main branch ruleset was found.');

  const ruleset = await github(`/repos/${repo}/rulesets/${candidate.id}`);
  const rules = Array.isArray(ruleset?.rules) ? ruleset.rules : [];
  const byType = new Map(rules.map(rule => [rule.type, rule]));
  if (!byType.has('deletion') || !byType.has('non_fast_forward')) {
    throw new Error('The main ruleset must block branch deletion and force-pushes.');
  }

  const pullRequestRule = byType.get('pull_request');
  if (!pullRequestRule) {
    throw new Error('Direct pushes are still possible: require a pull request before merging to main.');
  }

  const checksRule = byType.get('required_status_checks');
  if (!checksRule) {
    throw new Error('Main does not require CI status checks.');
  }
  const checkParameters = checksRule.parameters || {};
  if (checkParameters.strict_required_status_checks_policy !== true) {
    throw new Error('Required CI checks must be up to date with the base branch.');
  }

  const requiredChecks = new Set((checkParameters.required_status_checks || [])
    .map(item => String(item?.context || '').trim()).filter(Boolean));
  const required = [
    'Code health and builds',
    'proprietary-security-invariants-lock',
    'anti-clone-hardening-lock',
    'private-repo-readiness-lock',
    'branch-protection-gate-verification',
  ];
  const missing = required.filter(name => !requiredChecks.has(name));
  if (missing.length) {
    throw new Error('Main is missing required CI checks: ' + missing.join(', '));
  }

  const bypass = Array.isArray(ruleset.bypass_actors) ? ruleset.bypass_actors : [];
  const alwaysBypass = bypass.filter(actor => actor?.bypass_mode === 'always');
  if (alwaysBypass.length) {
    throw new Error('The main ruleset still grants always-on bypass access to ' + alwaysBypass.map(actor => actor.actor_type + ':' + actor.actor_id).join(', ') + '. Remove routine bypass actors.');
  }

  const conditions = ruleset.conditions?.ref_name?.include || [];
  if (!conditions.includes('~DEFAULT_BRANCH') && !conditions.includes('refs/heads/main')) {
    throw new Error('The active ruleset does not explicitly target the default main branch.');
  }

  console.log('Main branch protection gate PASS: pull requests, current required CI checks, deletion/force-push protection and no always-on bypass are enforced.');
} catch (error) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: main branch protection is incomplete.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error('Update GitHub Settings → Rules → Protect main to require pull requests and the named security checks, then remove always-on admin/integration bypass.');
  process.exit(1);
}
