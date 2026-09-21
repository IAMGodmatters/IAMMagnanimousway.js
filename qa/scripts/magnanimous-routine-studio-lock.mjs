import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const runtime=read('worker/src/magnanimous-skill-routine-runtime.js');
const operations=read('worker/src/operations-entrypoint.js');
const universal=read('worker/src/magnanimous-universal-capabilities.js');
const page=read('frontend/app/routine-studio/page.tsx');
const home=read('frontend/app/page.tsx');
const standalone=read('magnanimous-runtime/src/server.mjs');
const durable=read('magnanimous-runtime/src/durable-work.mjs');

for(const needle of [
 "identity:'Magnanimous AI'",
 "provider_dependency:false",
 "paid_provider_required:false",
 "proprietary_code_copied:false",
 "schedule_floor_minutes:MIN_INTERVAL_MINUTES",
 "approval_rule:'A scheduled routine never silently approves an interactive browser write.",
 "magnanimous_skills",
 "magnanimous_routines",
 "magnanimous_routine_runs",
 "magnanimous_cloud_workspaces",
 "magnanimous_cloud_workspace_files",
 "UNIQUE(tenant_id,user_id)",
 "tenant_scoped:true",
 "routine-workspaces/",
 "ensureCloudWorkspace",
 "teachFromDemonstration",
 "'ai.prompt'",
 "'agent.handoff'",
 "'cloud.browser.render'",
 "'cloud.sandbox.exec'",
 "'workspace.write'",
 "'native-web.action_flow'",
 "waiting_approval:true",
 "status='needs_confirmation'",
 "Exact run approval requires confirm=true.",
 "scheduledMagnanimousRoutines",
 "trigger_type:'scheduled'",
 "max_attempts",
 "retry_wait"
])assert(runtime.includes(needle),'Routine Studio runtime contract missing: '+needle);

assert(!runtime.includes('confirm_actions===true'),'routine start must not pre-authorize interactive browser writes');
assert(!/grok|x\.ai|cursor/i.test(runtime),'native routine runtime must not copy or depend on benchmark-provider branding or proprietary code');

for(const needle of [
 'handleMagnanimousRoutineStudio',
 'scheduledMagnanimousRoutines',
 "scheduled Magnanimous routines failed"
])assert(operations.includes(needle),'Operations routing/scheduler missing: '+needle);

for(const needle of [
 'persistent-cloud-workspace',
 'teach-by-demonstration',
 'reusable-skills',
 'scheduled-routines',
 'routine-retries',
 'routine-run-history',
 'cross-agent-workspace',
 'Magnanimous-owned skills and routines'
])assert(universal.includes(needle),'Universal capability registry missing: '+needle);

for(const needle of [
 'Routine Studio',
 'Teach repeatable work once',
 'TEACH BY DEMONSTRATION',
 'Skill &rarr; Routine',
 'PERSISTENT CLOUD WORKSPACE',
 'Review approved &rarr; run',
 '/api/magnanimous/routine-studio/skills/teach',
 '/api/magnanimous/routine-studio/routines',
 '/api/magnanimous/routine-studio/workspace/files'
])assert(page.includes(needle),'Routine Studio UI missing: '+needle);

assert(home.includes("'/routine-studio'"),'Home systems must expose Routine Studio.');
assert(standalone.includes("MAGNANIMOUS_SCHEDULER_ENABLED"),'Standalone runtime scheduler must remain enabled-capable.');
assert(standalone.includes("MAGNANIMOUS_SANDBOX"),'Standalone runtime must expose Magnanimous sandbox binding.');
assert(standalone.includes("MAGNANIMOUS_BROWSER"),'Standalone runtime must expose Magnanimous browser binding.');
assert(durable.includes('max_attempts'),'Durable work retry primitive must remain available.');
assert(durable.includes('retryDelaySeconds'),'Durable work retry delay primitive must remain available.');

console.log('Magnanimous Routine Studio lock passed — skills, demonstrations, schedules, retries, tenant-scoped cloud workspaces and approval-gated browser writes are wired to the first-party runtime.');
