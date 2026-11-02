import fs from 'node:fs';
import assert from 'node:assert/strict';

const verifier=fs.readFileSync('frontend/scripts/verify-main-protection.mjs','utf8');
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
 "Production deployment is blocked closed for safety."
])assert.ok(verifier.includes(text),`main protection gate missing actual ruleset check: ${text}`);
assert.ok(!verifier.includes("Main branch protection gate: PASS — GitHub reports main as protected."),'Gate must not treat protected:true as full governance proof.');
console.log('Main ruleset gate lock passed: reviewed PR, exact checks, strict latest-head policy and no integration bypass are inspected.');
