const inActions = process.env.GITHUB_ACTIONS === 'true';
const branch = process.env.GITHUB_REF_NAME || '';
const workflow = process.env.GITHUB_WORKFLOW || '';
const repo = process.env.GITHUB_REPOSITORY || 'IAMGodmatters/IAMMagnanimousway.js';

// Reliability first: all ordinary CI and Full Platform QA builds must remain
// runnable so defects are visible. The fail-closed protection gate is enforced
// only inside the production deployment workflow executing from main.
if (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM') {
  console.log('Main branch protection gate: skipped outside the production deployment workflow.');
  process.exit(0);
}

const endpoint = `https://api.github.com/repos/${repo}/branches/main`;
let response;
try {
  response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'iam-magnanimous-way-branch-protection-gate',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
} catch (error) {
  console.error('::error::Unable to verify GitHub main-branch protection. Production deployment is blocked closed for safety.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (!response.ok) {
  console.error(`::error::GitHub branch-protection verification returned HTTP ${response.status}. Production deployment is blocked closed for safety.`);
  process.exit(1);
}

const data = await response.json();
if (data?.protected !== true) {
  console.error('::error::PRODUCTION DEPLOYMENT BLOCKED: GitHub main branch is not protected.');
  console.error('Enable a branch protection rule or ruleset for main before deploying again.');
  console.error('Require a pull request before merging and require the Full Platform QA and Magnanimous Command Lock status checks.');
  console.error('Do not allow bypass for routine changes.');
  process.exit(1);
}

console.log('Main branch protection gate: PASS — GitHub reports main as protected.');
