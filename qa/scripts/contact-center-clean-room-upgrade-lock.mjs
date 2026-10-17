import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ADVANCED_CONTACT_CENTER_CAPABILITIES,
  ADVANCED_QUEUE_STRATEGIES,
  evaluateAIToolPolicy,
  planAdvancedQueueRoute,
  transcriptKnowledgeDraft
} from '../../worker/src/magnanimous-contact-center-advanced.js';

const read=path=>fs.readFileSync(path,'utf8');
const entry=read('worker/src/entrypoint.js');
const knowledge=read('worker/src/magnanimous-telecom-knowledge.js');
const research=read('docs/3CX-CLEAN-ROOM-CAPABILITY-STUDY-2026-10-17.md');
const runtime=read('worker/src/magnanimous-contact-center-advanced.js');

assert(entry.includes("import { handleMagnanimousAdvancedContactCenter } from './magnanimous-contact-center-advanced.js';"),'advanced contact-center runtime must stay imported by the live Worker entrypoint');
assert(entry.includes('const advancedContactCenter=await handleMagnanimousAdvancedContactCenter(request,env);'),'advanced contact-center runtime must stay mounted in the live dispatch chain');
assert(entry.indexOf('handleMagnanimousAdvancedContactCenter')<entry.lastIndexOf('handleContactCenter'),'advanced contact-center handler must remain before the compatibility contact-center fallback');

const requiredStrategies=[
 'ring_all','prioritized_hunt','random_start','round_robin','longest_idle','least_talk_time','fewest_answered','hunt_three_random','hunt_three_priority',
 'skills_ring_all','skills_random_start','skills_round_robin','skills_fewest_answered'
];
for(const strategy of requiredStrategies)assert(ADVANCED_QUEUE_STRATEGIES.includes(strategy),`missing advanced queue strategy ${strategy}`);
assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.identity.brain==='Magnanimous AI','Magnanimous AI must remain the brain');
assert(/replaceable adapters/i.test(ADVANCED_CONTACT_CENTER_CAPABILITIES.identity.provider_policy),'outside providers must remain replaceable adapters');

const agents=[
 {id:'a',status:'available',active:1,logged_in:1,priority:20,skill_level:2,last_assigned_at:300,talk_seconds:900,answered_count:7},
 {id:'b',status:'available',active:1,logged_in:1,priority:10,skill_level:1,last_assigned_at:100,talk_seconds:120,answered_count:2},
 {id:'c',status:'available',active:1,logged_in:1,priority:30,skill_level:1,last_assigned_at:200,talk_seconds:300,answered_count:1},
 {id:'d',status:'break',active:1,logged_in:1,priority:1,skill_level:1,last_assigned_at:1,talk_seconds:1,answered_count:0}
];
for(const strategy of requiredStrategies){
 const plan=planAdvancedQueueRoute({strategy,agents,call_key:'qa-call',skill_escalation:'cumulative'});
 assert.equal(plan.ok,true,`${strategy} plan must succeed`);
 assert(plan.eligible===3,`${strategy} must exclude non-available agents`);
 assert(plan.candidates.length>0,`${strategy} must produce at least one candidate when agents are available`);
}
assert.deepEqual(planAdvancedQueueRoute({strategy:'longest_idle',agents}).candidates.map(x=>x.id),['b','c','a'],'longest-idle order must be deterministic');
assert.deepEqual(planAdvancedQueueRoute({strategy:'least_talk_time',agents}).candidates.map(x=>x.id),['b','c','a'],'least-talk-time order must be deterministic');
assert.deepEqual(planAdvancedQueueRoute({strategy:'fewest_answered',agents}).candidates.map(x=>x.id),['c','b','a'],'fewest-answered order must be deterministic');
const skillPlan=planAdvancedQueueRoute({strategy:'skills_round_robin',agents,skill_escalation:'cumulative'});
assert(skillPlan.tiers.length>=2,'skills routing must expose escalation tiers');
assert(skillPlan.tiers[0].candidates.every(x=>x.skill_level===1),'first skills tier must start with highest skill group');

assert.equal(evaluateAIToolPolicy({tool:'list_queue',risk:'read',allowlist:['list_queue'],approval:'always_allow'}, {role:'member'}).allowed,true,'allowlisted read-only AI tool should be allowed');
assert.equal(evaluateAIToolPolicy({tool:'delete_recording',risk:'delete',allowlist:['delete_recording'],approval:'always_allow'}, {role:'owner'}).allowed,false,'consequential tool must still require explicit approval');
assert.equal(evaluateAIToolPolicy({tool:'delete_recording',risk:'delete',allowlist:['delete_recording'],approval:'always_allow',user_approved:true}, {role:'owner'}).allowed,true,'approved owner consequential tool may pass policy evaluation');
assert.equal(evaluateAIToolPolicy({tool:'place_paid_call',risk:'paid',allowlist:['place_paid_call'],user_approved:true}, {role:'member'}).allowed,false,'paid actions require owner/admin authority');
assert.equal(evaluateAIToolPolicy({tool:'hidden_tool',risk:'read',allowlist:['list_queue'],approval:'always_allow'}, {role:'owner'}).allowed,false,'unlisted AI tools must fail closed');

const draft=transcriptKnowledgeDraft({transcript:'Customer Jane: email me at jane@example.com or call +1 (555) 123-4567. API key: secret-value. Our approved return window is 30 days.'});
assert.equal(draft.ok,true,'transcript review draft should be created');
assert.equal(draft.publish_allowed,false,'transcript knowledge must never auto-publish');
assert.equal(draft.status,'needs_review','transcript knowledge must require human review');
assert(!draft.sanitized_transcript.includes('jane@example.com'),'email should be reduced from transcript review draft');
assert(!draft.sanitized_transcript.includes('555'),'phone should be reduced from transcript review draft');
assert(!draft.sanitized_transcript.includes('secret-value'),'secret should be reduced from transcript review draft');

for(const token of ['clean_room_policy','contact_center_blueprint','ai_telephony_blueprint','api_control_blueprint','crm_blueprint','site_edge_blueprint','security_blueprint','human_review_required','deny_unlisted']){
 assert(knowledge.includes(token),`telecom knowledge missing ${token}`);
}
for(const token of ['Release Candidate','behavioral/reference sources only','No proprietary 3CX source code is copied','human review','provider-neutral']){
 assert(research.includes(token),`clean-room research document missing boundary/evidence token: ${token}`);
}

assert(!/from\s+['"]@3cx\//.test(runtime),'Magnanimous advanced runtime must not import a 3CX package');
assert(!/require\(\s*['"]@3cx\//.test(runtime),'Magnanimous advanced runtime must not require a 3CX package');
for(const path of ['worker/package.json','frontend/package.json']){
 const pkg=JSON.parse(read(path));
 for(const section of ['dependencies','devDependencies','optionalDependencies','peerDependencies']){
  for(const name of Object.keys(pkg[section]||{}))assert(!name.startsWith('@3cx/'),`${path} must not add a 3CX runtime dependency (${name})`);
 }
}

for(const endpoint of ['/api/contact-center/advanced/capabilities','/api/contact-center/advanced/route-plan','/api/contact-center/advanced/tool-policy','/api/contact-center/advanced/knowledge-draft']){
 assert(runtime.includes(endpoint),`advanced runtime missing ${endpoint}`);
}
assert(runtime.includes("if(!user)return json({detail:'Sign in required.'},401);"),'advanced contact-center routes must remain authenticated');
assert(runtime.includes('publish_allowed:false'),'transcript learning must remain review-only');

console.log('Contact-center clean-room upgrade lock PASS');
