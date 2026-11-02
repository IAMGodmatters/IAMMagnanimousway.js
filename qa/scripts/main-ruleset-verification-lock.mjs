import fs from 'node:fs';
import assert from 'node:assert/strict';

const verifier=fs.readFileSync('frontend/scripts/verify-main-protection.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/branch-protection-gate-check.yml','utf8');
const workflow=fs.readFileSync('.github/workflows/branch-protection-gate-check.yml','utf8');
for(const text of [
 "https://api.github.com/repos/${repo}/rulesets?per_page=100",
 "item?.target === 'branch' && item?.enforcement === 'active'",
 "rule.type === 'pull_request'",
 "required_approving_review_count",
 "rule.type === 'required_status_checks'",
 "'Code health and builds', 'verify-command-architecture'",
 "strict_required_status_checks_policy !== true",
 "const visibleBypassPolicies = applicable.filter(item => Array.isArray(item.bypass_actors));",
 "actor.actor_type === 'Integration' && actor.bypass_mode === 'always'",
 "GitHub hides bypass-actor details from this read-only token",
 'const explicitAudit = process.env.MAGNANIMOUS_VERIFY_PROTECTION === \'true\';',
 "repository?.default_branch !== 'main'",
 "const rulesets = await githubJson",
 "const explicitAudit = process.env.MAGNANIOUS_VERIFY_PROTECTION === 'true';",
 "Read-only ruleset audit completed with findings.",
 "if (explicitAudit) {",
 "process.exit(1);",
 "PRODUCTION DEPLOYMENT BLOCKED"
])assert.ok(verifier.includes(text),`main protection gate missing actual ruleset check: ${text}`);
assert.ok(!verifier.includes("Main branch protection gate: PASS — GitHub reports main as protected."),'Gate must not treat protected:true as full governance proof.');
assert.ok(workflow.includes("MAGNANIMOUS_VERIFY_PROTECTION: 'true'"),'PR ruleset audit must explicitly run in diagnostic mode.');
assert.ok(verifier.includes("if (!explicitAudit && (!inActions || branch !== 'main' || workflow !== 'Build and Deploy I AM'))"),'Normal invocation must remain limited to the production deploy workflow.');
assert.ok(workflow.includes("MAGNANIMOUS_VERIFY_PROTECTION: 'true'"),'PR branch protection verification must explicitly exercise the live ruleset audit, not the production-only skip path.');
console.log('Main ruleset gate lock passed: reviewed PR, exact checks, strict latest-head policy and no integration bypass are inspected.');
