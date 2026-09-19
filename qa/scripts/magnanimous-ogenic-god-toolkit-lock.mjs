import assert from 'node:assert/strict';
import {
  OGENIC_SKILL_SNAPSHOT,
  OGENIC_CAPABILITY_GROUPS,
  GOD_MODE_TOOL_FAMILIES,
  OGENIC_STATUS,
  OGENIC_INITIATIVE_POLICY,
  NETWALK_NATIVE_CONTRACT,
  buildMagnanimousOgenicPlan,
  getMagnanimousOgenicPrompt
} from '../../worker/src/magnanimous-ogenic-god-toolkit.js';

assert.equal(OGENIC_SKILL_SNAPSHOT.skills.length,8,'all eight installed OGENIC skills must be represented');
assert.equal(OGENIC_CAPABILITY_GROUPS.length,4,'the four OGENIC auto-routing groups must remain intact');
assert.equal(GOD_MODE_TOOL_FAMILIES.length,9,'GOD MODE tool-family registry must remain intact');
for(const status of ['READY_CLOUD','READY_LOCAL','READY_HYBRID','CONNECTOR_REQUIRED','LOCAL_BRIDGE_REQUIRED','EXECUTION_SURFACE_REQUIRED','CONFIGURATION_REQUIRED','REVERSIBLE_ALTERNATIVE_REQUIRED']){
  assert(OGENIC_STATUS.includes(status),`missing status ${status}`);
}
assert.equal(OGENIC_INITIATIVE_POLICY.default,'suggest-and-initiate-safe-actions');
assert.equal(OGENIC_INITIATIVE_POLICY.never_inline_secrets,true);
assert.equal(NETWALK_NATIVE_CONTRACT.mode,'read-only-network-survey');
assert(NETWALK_NATIVE_CONTRACT.guarantees.some(x=>x.includes('Credentials must never enter Magnanimous chat')));
assert(NETWALK_NATIVE_CONTRACT.guarantees.some(x=>x.includes('Address-range sweeps require recorded owner authorization')));

const coding=buildMagnanimousOgenicPlan('Inspect the repository, fix the frontend, run tests, and prepare deployment for the website',{GITHUB_PLATFORM_TOKEN:'configured'});
assert.equal(coding.classification,'CLOUD');
assert(coding.groups.some(x=>x.id==='code-system'));
assert(coding.groups.some(x=>x.id==='code-delivery'));
assert(coding.groups.some(x=>x.id==='code-website'));
assert.equal(coding.initiative,'stage-not-execute');
assert.equal(coding.status,'READY_CLOUD');

const payment=buildMagnanimousOgenicPlan('Charge the customer card for the subscription',{GITHUB_PLATFORM_TOKEN:'configured'});
assert.equal(payment.initiative,'approval-gated');

const credential=buildMagnanimousOgenicPlan('Update the API key secret for production',{GITHUB_PLATFORM_TOKEN:'configured'});
assert.equal(credential.initiative,'credential-ui-required');

const survey=buildMagnanimousOgenicPlan('Use netwalk to survey this LAN and diagnose the switches',{});
assert.equal(survey.classification,'LOCAL');
assert.equal(survey.status,'LOCAL_BRIDGE_REQUIRED');
assert.equal(survey.netwalk?.mode,'read-only-network-survey');

const localReady=buildMagnanimousOgenicPlan('Check my local computer health',{MAGNANIMOUS_LOCAL_BRIDGE_URL:'https://bridge.invalid'});
assert.equal(localReady.status,'READY_LOCAL');

const inbound=buildMagnanimousOgenicPlan('Configure an authenticated webhook callback for deployment events',{GITHUB_PLATFORM_TOKEN:'configured'});
assert.equal(inbound.network_direction,'INBOUND_OR_HYBRID');
assert.deepEqual(inbound.inbound_controls,['HTTPS','authentication-or-signature','replay-protection','rate-limit','audit-log','disable-switch']);

const prompt=getMagnanimousOgenicPrompt('debug and deploy my website');
for(const phrase of ['Be suggestive and initiative-driven','CONNECTOR_REQUIRED','LOCAL_BRIDGE_REQUIRED','Netwalk-style network work is read-only']){
  assert(prompt.includes(phrase),`prompt contract missing: ${phrase}`);
}
console.log('Magnanimous OGENIC GOD TOOLKIT lock passed.');
