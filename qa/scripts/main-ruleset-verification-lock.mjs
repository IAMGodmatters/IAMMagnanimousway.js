import fs from 'node:fs';
import assert from 'node:assert/strict';

const verifier=fs.readFileSync('frontend/scripts/verify-main-protection.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/branch-protection-gate-check.yml','utf8');

for(const required of [
  '/rulesets?per_page=100',
  "item?.target === 'branch' && item?.enforcement === 'active'",
  "rule.type === 'pull_request'",
  'required_approving_review_count',
  "rule.type === 'required_status_checks'",
  "'Code health and builds', 'verify-command-architecture'",
  'strict_required_status_checks_policy !== true',
  "actor.actor_type === 'Integration' && actor.bypass_mode === 'always'",
  'GitHub hides bypass-actor details from this read-only token',
  "repository?.default_branch !== 'main'",
  'Read-only ruleset audit completed with findings.',
  'process.exit(1);',
  'PRODUCTION DEPLOYMENT BLOCKED'
]) {
  assert.ok(verifier.includes(required),`main protection gate missing actual ruleset control: ${required}`);
}

assert.ok(verifier.includes("const explicitAudit = process.env.MAGNANIMOUS_VERIFY_PROTECTION === 'true';"),
  'PR diagnostic mode must be explicit and named separately from the production gate.');
assert.ok(verifier.includes("if (!explicitAudit && (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM'))"),
  'Normal invocation must remain limited to the production deploy workflow.');
assert.ok(workflow.includes("MAGNANIMOUS_VERIFY_PROTECTION: 'true'"),
  'PR ruleset audit must explicitly exercise live ruleset checks rather than a reserved GITHUB_* skip path.');
assert.ok(!verifier.includes('repository?.protected'),
  'Do not read a nonexistent repository-level protected flag; use active branch rulesets.');
assert.ok(verifier.includes('bypass-actor details were hidden from this read-only token'), 'Never claim bypass actors were verified when GitHub did not expose them.');
assert.ok(!verifier.includes('Main branch protection gate: PASS — GitHub reports main as protected.'),
  'The verifier must never equate protected:true with required review and status-check policy.');

console.log('Main ruleset verifier lock passed: live ruleset audit, explicit PR diagnostics, and fail-closed production checks are in place.');
