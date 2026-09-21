import fs from 'node:fs';
import assert from 'node:assert/strict';
import { getCapabilityAbsorptionManifest, ABSORPTION_POLICY } from '../../worker/src/magnanimous-connector-absorption.js';
import { getGrokCapabilityManifest, getGrokAbsorptionSummary } from '../../worker/src/magnanimous-grok-capability-registry.js';
import { MAGNANIMOUS_IMPROVEMENT_GOVERNANCE, getImprovementGovernanceManifest, getImprovementGovernanceSummary } from '../../worker/src/magnanimous-improvement-governance.js';
import { classifyCapabilityRealization } from '../../worker/src/magnanimous-capability-realization.js';

const full=getCapabilityAbsorptionManifest();
const grok=getGrokCapabilityManifest();
const governance=getImprovementGovernanceManifest();
const grokSummary=getGrokAbsorptionSummary();
const governanceSummary=getImprovementGovernanceSummary();

assert.ok(grok.length>=40,'Grok public capability absorption must cover the full observed agent/tool/skill surface.');
for(const id of [
  'grok-persistent-agent-identity','grok-role-scoped-memory','grok-scheduled-event-routines',
  'grok-dedicated-computer-sessions','grok-multi-agent-group-chat','grok-agent-to-agent-handoff',
  'grok-skills-persistent-expertise','grok-skill-creator','grok-web-search','grok-x-search',
  'grok-code-execution','grok-collections-search','grok-remote-mcp','grok-function-calling',
  'grok-deep-research','grok-voice-agent','grok-image-generation-editing','grok-video-generation-editing',
  'grok-app-build-mode','grok-human-final-decision-boundary'
])assert.ok(grok.some(x=>x.capability===id),'Missing Grok benchmark capability: '+id);

for(const row of grok){
  assert.ok(row.native_target,'Every Grok benchmark capability needs a Magnanimous native target.');
  assert.ok(row.boundary!==undefined,'Every Grok benchmark capability needs an explicit boundary.');
  assert.ok(Array.isArray(row.magnanimous_owned)&&row.magnanimous_owned.includes('workflow-orchestration'),'Magnanimous must own Grok-benchmarked workflow orchestration.');
  assert.equal(row.authorization_state,'not-assumed');
  assert.equal(row.research?.proprietary_implementation_copied,false);
  const realized=classifyCapabilityRealization(row);
  assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to an existing Magnanimous execution surface.');
}
assert.equal(grokSummary.provider_required_for_identity,false);
assert.equal(grokSummary.provider_required_for_memory,false);
assert.equal(grokSummary.provider_required_for_reasoning,false);
assert.equal(grokSummary.provider_required_for_orchestration,false);
assert.equal(grokSummary.provider_required_for_verification,false);

assert.ok(governance.length>=12,'Improvement governance must cover preservation, authority, provenance, utilization, workers, gates and evidence honesty.');
assert.equal(governanceSummary.domain_specific_content_excluded,true);
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.preserve_working_state,true);
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.additive_change_default,true);
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.current_main_is_authoritative,true);
assert.deepEqual(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.evidence_states,['observed','candidate','tested','reviewed','deployed','canary-verified']);
assert.ok(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.capability_lifecycle.includes('consumer-used'));
assert.ok(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.capability_lifecycle.includes('published'));
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.worker_policy.one_writer_per_shared_source,true);
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.verification_policy.helper_test_is_not_full_acceptance,true);
assert.equal(MAGNANIMOUS_IMPROVEMENT_GOVERNANCE.source_rights_policy.unknown_is_not_approved,true);

for(const row of governance){
  assert.ok(row.native_target);
  assert.ok(!/horse|wager|track|racing|thoroughbred|harness/i.test(row.capability),'Domain-specific racing content must not enter Magnanimous governance capability IDs.');
  const realized=classifyCapabilityRealization(row);
  assert.ok(['native-ready','hybrid-ready'].includes(realized.status),row.capability+' must resolve to an existing Magnanimous execution surface.');
}

const ids=new Set(full.map(x=>x.id));
for(const row of [...grok,...governance])assert.ok(ids.has(row.id),'Full brain must contain '+row.id);
assert.ok(full.every(x=>String(x.native_target||'').trim()),'Every full-brain capability must name a native target.');
assert.ok(full.every(x=>x.boundary!==undefined),'Every full-brain capability must state an external/native boundary.');
assert.equal(ABSORPTION_POLICY.identity_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.memory_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.reasoning_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.orchestration_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.learning_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.verification_owner,'Magnanimous AI');
assert.equal(ABSORPTION_POLICY.proprietary_copying,false);

const agent=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');
assert.ok(agent.includes("{id:'xai',name:'xAI Grok',tier:'metered-optional'"),'xAI must be optional and explicitly metered.');
assert.ok(agent.includes("priority:8"),'xAI must remain behind the existing free-first provider chain.');
assert.ok(agent.includes("https://api.x.ai/v1"),'xAI adapter must use the documented API base.');
assert.ok(agent.includes("'grok-4.6'"),'xAI adapter must have an explicit current model default.');
assert.ok(agent.includes('Magnanimous owns memory, tools, policy and orchestration'),'xAI adapter must not become Magnanimous identity or brain.');

const credentials=fs.readFileSync('worker/src/platform-credentials.js','utf8');
assert.ok(credentials.includes('XAI_API_KEY'));
assert.ok(credentials.includes('optional metered Grok compute adapter'));

console.log('Magnanimous Grok + improvement governance lock PASS:', {
  grok:grok.length,
  governance:governance.length,
  full_brain:full.length
});
