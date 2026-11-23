import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateMainRulesets,
  REQUIRED_MAIN_CHECK_CONTEXTS,
  REQUIRED_MAIN_CHECK_APP_ID
} from '../lib/main-ruleset-audit.mjs';

const repository = 'IAMGodmatters/IAMMagnanimousway.js';
const active = [{
  id: 1,
  name: 'Protect main',
  target: 'branch',
  source: repository,
  source_type: 'Repository',
  enforcement: 'active'
}];
const healthy = {
  1: {
    rules: [
      { type: 'pull_request', parameters: { required_approving_review_count: 1 } },
      {
        type: 'required_status_checks',
        parameters: {
          required_status_checks: REQUIRED_MAIN_CHECK_CONTEXTS.map(context => ({
            context,
            integration_id: REQUIRED_MAIN_CHECK_APP_ID
          })),
          strict_required_status_checks_policy: true
        }
      }
    ],
    bypass_actors: []
  }
};
const healthyBranchRules = [
  { type: 'pull_request', ruleset_id: 1, parameters: { required_approving_review_count: 1 } },
  {
    type: 'required_status_checks',
    ruleset_id: 1,
    parameters: {
      required_status_checks: REQUIRED_MAIN_CHECK_CONTEXTS.map(context => ({
        context,
        integration_id: REQUIRED_MAIN_CHECK_APP_ID
      })),
      strict_required_status_checks_policy: true
    }
  }
];

const pass = evaluateMainRulesets(active, healthy, healthyBranchRules);
assert.equal(pass.status, 'pass');
assert.equal(pass.requiredApprovals, 1);
assert.equal(pass.requiredChecks, 2);
assert.deepEqual(pass.requiredCheckContexts, [...REQUIRED_MAIN_CHECK_CONTEXTS].sort());
assert.deepEqual(pass.missingRequiredChecks, []);
assert.deepEqual(pass.wrongSourceRequiredChecks, []);
assert.equal(pass.requiredCheckAppId, REQUIRED_MAIN_CHECK_APP_ID);
assert.equal(pass.strictRequiredStatusChecksPolicy, true);
assert.equal(pass.unrestrictedBypassActors, 0);

const weakRules = [
  { type: 'deletion', ruleset_id: 1, parameters: {} },
  { type: 'non_fast_forward', ruleset_id: 1, parameters: {} }
];
const weak = evaluateMainRulesets(active, {
  1: {
    rules: weakRules,
    bypass_actors: [
      { actor_type: 'RepositoryRole', bypass_mode: 'always' },
      { actor_type: 'Integration', bypass_mode: 'always' }
    ]
  }
}, weakRules);
assert.equal(weak.status, 'warning');
assert.ok(weak.gaps.some(item => item.includes('pull_request')));
assert.ok(weak.gaps.some(item => item.includes('required_status_checks')));
assert.ok(weak.gaps.some(item => item.includes('mode other than pull_request')));

const misleadingRules = [
  { type: 'pull_request', ruleset_id: 1, parameters: { required_approving_review_count: 1 } },
  {
    type: 'required_status_checks',
    ruleset_id: 1,
    parameters: {
      required_status_checks: [
        { context: 'Full Platform QA', integration_id: REQUIRED_MAIN_CHECK_APP_ID },
        { context: 'Magnanimous Command Lock', integration_id: REQUIRED_MAIN_CHECK_APP_ID }
      ],
      strict_required_status_checks_policy: true
    }
  }
];
const misleading = evaluateMainRulesets(active, {
  1: { ...healthy[1], rules: misleadingRules }
}, misleadingRules);
assert.equal(misleading.status, 'warning');
assert.deepEqual(misleading.missingRequiredChecks, [...REQUIRED_MAIN_CHECK_CONTEXTS].sort());
assert.deepEqual(misleading.wrongSourceRequiredChecks, []);
assert.ok(misleading.gaps.some(item => item.includes('Code health and builds')));
assert.ok(misleading.gaps.some(item => item.includes('verify-command-architecture')));

// Correct context names without a trusted app binding must fail closed.
const unboundRules = [
  healthyBranchRules[0],
  {
    type: 'required_status_checks',
    ruleset_id: 1,
    parameters: {
      required_status_checks: REQUIRED_MAIN_CHECK_CONTEXTS.map(context => ({ context })),
      strict_required_status_checks_policy: true
    }
  }
];
const unbound = evaluateMainRulesets(active, healthy, unboundRules);
assert.equal(unbound.status, 'warning');
assert.deepEqual(unbound.missingRequiredChecks, []);
assert.deepEqual(unbound.wrongSourceRequiredChecks, [...REQUIRED_MAIN_CHECK_CONTEXTS].sort());
assert.ok(unbound.gaps.some(item => item.includes('GitHub Actions app')));

// A different integration cannot impersonate the trusted GitHub Actions check.
const wrongAppRules = unboundRules.map(rule =>
  rule.type === 'required_status_checks'
    ? {
        ...rule,
        parameters: {
          ...rule.parameters,
          required_status_checks: REQUIRED_MAIN_CHECK_CONTEXTS.map(context => ({
            context,
            integration_id: 123456
          }))
        }
      }
    : rule
);
const wrongApp = evaluateMainRulesets(active, healthy, wrongAppRules);
assert.equal(wrongApp.status, 'warning');
assert.deepEqual(wrongApp.wrongSourceRequiredChecks, [...REQUIRED_MAIN_CHECK_CONTEXTS].sort());

const missingOneRules = [
  healthyBranchRules[0],
  {
    type: 'required_status_checks',
    ruleset_id: 1,
    parameters: {
      required_status_checks: [{
        context: 'Code health and builds',
        integration_id: REQUIRED_MAIN_CHECK_APP_ID
      }],
      strict_required_status_checks_policy: true
    }
  }
];
const incomplete = evaluateMainRulesets(active, {
  1: { ...healthy[1], rules: missingOneRules }
}, missingOneRules);
assert.equal(incomplete.status, 'warning');
assert.deepEqual(incomplete.missingRequiredChecks, ['verify-command-architecture']);

const notStrictRules = healthyBranchRules.map(rule =>
  rule.type === 'required_status_checks'
    ? { ...rule, parameters: { ...rule.parameters, strict_required_status_checks_policy: false } }
    : rule
);
const staleHead = evaluateMainRulesets(active, {
  1: { ...healthy[1], rules: notStrictRules }
}, notStrictRules);
assert.equal(staleHead.status, 'warning');
assert.equal(staleHead.strictRequiredStatusChecksPolicy, false);
assert.ok(staleHead.gaps.some(item => item.includes('up to date')));

const exempt = evaluateMainRulesets(active, {
  1: { ...healthy[1], bypass_actors: [{ actor_type: 'RepositoryRole', bypass_mode: 'exempt' }] }
}, healthyBranchRules);
assert.equal(exempt.status, 'warning');
assert.equal(exempt.unrestrictedBypassActors, 1);
assert.ok(exempt.gaps.some(item => item.includes('mode other than pull_request')));

// The effective branch endpoint can combine rules from separate rulesets.
const splitRulesets = [
  active[0],
  {
    id: 2,
    name: 'Organization main checks',
    target: 'branch',
    source: 'IAMGodmatters',
    source_type: 'Organization',
    enforcement: 'active'
  }
];
const splitDetails = {
  1: {
    rules: [healthyBranchRules[0]],
    bypass_actors: []
  },
  2: {
    rules: [healthyBranchRules[1]],
    bypass_actors: []
  }
};
const splitRules = [
  { ...healthyBranchRules[0], ruleset_id: 1 },
  { ...healthyBranchRules[1], ruleset_id: 2 }
];
const combined = evaluateMainRulesets(splitRulesets, splitDetails, splitRules);
assert.equal(combined.status, 'pass');
assert.equal(combined.activeRulesets, 2);
assert.equal(combined.requiredApprovals, 1);
assert.equal(combined.requiredChecks, 2);

const inheritedBypass = evaluateMainRulesets(
  [splitRulesets[1]],
  {
    2: {
      rules: [healthyBranchRules[0], healthyBranchRules[1]],
      bypass_actors: [{ actor_type: 'RepositoryRole', bypass_mode: 'always' }]
    }
  },
  [
    { ...healthyBranchRules[0], ruleset_id: 2 },
    { ...healthyBranchRules[1], ruleset_id: 2 }
  ]
);
assert.equal(inheritedBypass.status, 'warning');
assert.equal(inheritedBypass.unrestrictedBypassActors, 1);

// Missing or incomplete API data must never be treated as a clean result.
const absent = evaluateMainRulesets([], {}, []);
assert.equal(absent.status, 'warning');
const unreadable = evaluateMainRulesets(active, {}, healthyBranchRules);
assert.equal(unreadable.status, 'manual');
const missingBypassActors = { 1: { rules: healthy[1].rules } };
const hiddenBypass = evaluateMainRulesets(active, missingBypassActors, healthyBranchRules);
assert.equal(hiddenBypass.status, 'manual');
assert.ok(hiddenBypass.gaps.some(item => item.includes('bypass_actors')));
assert.ok(hiddenBypass.gaps.some(item => item.includes('write access to the ruleset')));
const missingRuleset = evaluateMainRulesets(active, healthy, [
  { type: 'pull_request', ruleset_id: 999, parameters: { required_approving_review_count: 1 } }
]);
assert.equal(missingRuleset.status, 'manual');
assert.ok(missingRuleset.gaps.some(item => item.includes('missing from the complete')));
const missingRuleId = evaluateMainRulesets(active, healthy, [
  { type: 'pull_request', parameters: { required_approving_review_count: 1 } }
]);
assert.equal(missingRuleId.status, 'manual');
assert.ok(missingRuleId.gaps.some(item => item.includes('without a ruleset ID')));
const unavailable = evaluateMainRulesets(active, healthy, null);
assert.equal(unavailable.status, 'manual');

// Keep the ruleset credential isolated from npm lifecycle scripts and dependencies.
const deployWorkflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const frontendPackage = JSON.parse(readFileSync(new URL('../../frontend/package.json', import.meta.url), 'utf8'));
const gateScript = readFileSync(new URL('../../frontend/scripts/verify-main-protection.mjs', import.meta.url), 'utf8');
const auditJob = deployWorkflow.split('  ruleset-audit:')[1]?.split('\n  deploy:')[0] || '';
const deployJob = deployWorkflow.split('  deploy:')[1] || '';
const buildStep = deployWorkflow.split('- name: Build frontend')[1]?.split('\n      - name:')[0] || '';
assert.ok(auditJob.includes('actions/create-github-app-token@v3'), 'Production audit must mint a short-lived GitHub App installation token.');
assert.ok(auditJob.includes('permission-administration: write'), 'Audit app token must request only the ruleset administration permission required to read bypass actors.');
assert.ok(auditJob.includes('repositories: ${{ github.event.repository.name }}'), 'Audit installation token must be scoped to this repository only.');
assert.ok(auditJob.includes('GITHUB_TOKEN: ${{ steps.ruleset-token.outputs.token }}'), 'Only the isolated audit job may receive the short-lived ruleset token.');
assert.ok(auditJob.includes('node scripts/verify-main-protection.mjs'), 'Dedicated audit job must execute the effective ruleset verifier.');
assert.ok(deployJob.includes('needs: [runtime-impact, ruleset-audit]'), 'Production deploy must depend on successful ruleset verification.');
assert.ok(!deployWorkflow.includes('RULESET_AUDIT_TOKEN'), 'No long-lived ruleset audit token secret may be passed into the production workflow.');
assert.ok(!buildStep.includes('ruleset-token'), 'High-privilege ruleset token must not enter npm build or dependency scripts.');
assert.ok(!frontendPackage.scripts.prebuild.includes('verify-main-protection.mjs'), 'npm prebuild lifecycle must not receive the ruleset audit credential.');
assert.ok(deployWorkflow.includes('Manual production deployments must be dispatched from main'), 'Manual production deployments must reject non-main refs.');
assert.ok(deployWorkflow.includes('GITHUB_REF_NAME: ${{ github.ref_name }}'), 'Production gate must inspect the actual dispatch ref, not a hard-coded main value.');
assert.ok(gateScript.includes("if (branch !== 'main')"), 'The production gate must fail closed for non-main deployment refs.');

console.log('Main ruleset audit assessment: 16 cases passed, including audit-token isolation.');
