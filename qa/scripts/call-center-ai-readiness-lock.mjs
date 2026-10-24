import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const mesh = source('worker/src/agent-mesh-runtime.js');
const voice = source('worker/src/voice-agent-runtime.js');
const workspace = source('frontend/app/agents/page.tsx');
const receptionist = source('frontend/app/ai-receptionist/page.tsx');
const center = source('frontend/app/contact-center/page.tsx');

for (const id of ['captain','quality','scriptor','queue','closer','supportline','trainer']) {
  assert.match(mesh, new RegExp(`\\['${id}','`), `Native ${id} department must remain available`);
}
for (const competency of ['Call-center operating playbook','Sales/follow-up','Quality:','Workforce/queues','Escalations:','Coaching/training','Execution truth']) {
  assert.ok(mesh.includes(competency), `Call Center playbook missing ${competency}`);
}
assert.ok(mesh.includes('tenant-scoped working memory') && mesh.includes('branchContext'), 'Specialists must retain shared tenant-scoped memory and approved knowledge');
assert.ok(mesh.includes('/assistant-actions'), 'Connected work requires real guarded platform actions');

assert.match(voice, /tenantPlan\(env,user\.tenant_id\)/, 'Carrier eligibility must read verified billing subscriptions');
assert.match(voice, /subscription\.status === 'active'/, 'Inactive or unverified billing must not activate carrier entitlements');
assert.match(voice, /PLAN_LIMITS\.business\.rank/, 'Business Annual and authorized higher tiers must be honored');
assert.match(receptionist, /config\?\.twilio_configured && config\?\.full_business/, 'Phone readiness must require paid entitlement');
assert.doesNotMatch(receptionist, /config\?\.twilio_configured && \(config\?\.full_business \|\| config\?\.platform_owner\)/, 'Owner role alone must not enable paid calls');
assert.match(center, /Phone entitlement: \{voiceConfig\.full_business\?/, 'Call Center must show paid voice readiness truthfully');

for (const content of [workspace,receptionist]) {
  assert.ok(content.includes('availablePersonaVoices('), 'Voice UI must show device voice choices');
  assert.ok(content.includes('setPreferredPersonaVoiceId('), 'User choice must persist across AI surfaces');
  assert.ok(content.includes('speakTextNaturally('), 'Voice preview must use natural prosody engine');
}
assert.match(workspace, /Test this voice/, 'Specialists must let users test audible voices');
console.log('PASS: call-center skill, tenant memory, billing, and natural-device-voice readiness contracts.');
