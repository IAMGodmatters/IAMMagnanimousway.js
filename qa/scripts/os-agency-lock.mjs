import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const failures=[];const passes=[];
function read(rel){const p=path.join(root,rel);if(!fs.existsSync(p)){failures.push(`${rel}: required file is missing`);return''}return fs.readFileSync(p,'utf8')}
function must(ok,msg){(ok?passes:failures).push(msg)}
function includes(source,needle,msg){must(source.includes(needle),msg)}
function notMatches(source,re,msg){must(!re.test(source),msg)}

const standaloneLayout=read('frontend/app/magnanimous/layout.tsx');
const voice=read('frontend/app/voice-orchestrator.tsx');
const productTests=read('qa/tests/product-boundaries.spec.ts');
const globalTools=read('frontend/app/global-tools.tsx');
const workUI=read('frontend/app/work-engine/page.tsx');
const activityUI=read('frontend/app/activity/page.tsx');
const researchUI=read('frontend/app/research-notebook/page.tsx');
const connectionsUI=read('frontend/app/connections/page.tsx');
const operations=read('worker/src/operations-entrypoint.js');
const inboxRuntime=read('worker/src/unified-inbox-runtime.js');
const inboxUI=read('frontend/app/inbox/page.tsx');
const agencyRuntime=read('worker/src/agency-growth-runtime.js');
const agencyUI=read('frontend/app/agency-command/page.tsx');
const automationRuntime=read('worker/src/agency-automation-runtime.js');
const automationUI=read('frontend/app/agency-automations/page.tsx');
const bpoRuntime=read('worker/src/bpo-operations-runtime.js');
const packageJson=read('frontend/package.json');

// Option A — Reliability First.
includes(standaloneLayout,"iam_standalone_voice_hidden",'reliability: standalone voice controls retain persistent hide/show state');
includes(standaloneLayout,"document.querySelector('.mag-compose')",'reliability: voice dock measures the standalone composer');
includes(standaloneLayout,"p.style.setProperty('bottom'",'reliability: voice panel is repositioned above the composer instead of covering controls');
includes(standaloneLayout,"data-iam-voice-hidden",'reliability: standalone voice panel can be hidden without removing voice capability');
includes(voice,"className={`iam-voice-panel",'reliability: existing voice orchestrator remains mounted');
includes(productTests,"voice controls must never cover the standalone Send button",'reliability: browser QA permanently checks voice/send collision');
includes(productTests,"iam-voice-dock-toggle",'reliability: browser QA checks the hide/show control');
includes(activityUI,'ACTIVITY • RESTORE • CONTINUE','reliability: Activity & Restore remains exposed');
includes(activityUI,"filter==='failed'",'reliability: failed checkpoints remain inspectable');
includes(workUI,'Resume','reliability: persistent work retains Resume behavior');
includes(workUI,'Retry','reliability: persistent work retains Retry behavior');

// Option B — Magnanimous OS.
includes(workUI,'MAGNANIMOUS WORK ENGINE','os: Work Engine remains a first-class surface');
includes(researchUI,'MAGNANIMOUS DEEP-RESEARCH','os: source/evidence research notebook remains present');
includes(connectionsUI,'SELF-SERVICE CONNECTIONS','os: universal Connections surface remains present');
includes(operations,"lifecycle:['connect','permissions','health','read','write','approval','receipt','disconnect']",'os: integration lifecycle remains connect→permission→health→action→receipt→disconnect');
includes(inboxRuntime,'CREATE TABLE IF NOT EXISTS unified_inbox_threads','os: Unified Inbox has persistent thread storage');
includes(inboxRuntime,'CREATE TABLE IF NOT EXISTS unified_inbox_messages','os: Unified Inbox has persistent message storage');
includes(inboxRuntime,"'/api/inbox/capture'",'os: connected adapters retain a common Inbox capture endpoint');
includes(inboxRuntime,"SELECT id FROM bpo_clients",'os: Inbox links to existing BPO clients rather than duplicating client identity');
includes(inboxUI,'MAGNANIMOUS UNIFIED INBOX','os: Unified Inbox customer surface remains present');
for(const route of ['/work-engine','/activity','/research-notebook','/inbox'])includes(globalTools,`href=\"${route}\"`,`os: platform drawer links ${route}`);

// Option C — Business/Agency powerhouse.
includes(bpoRuntime,'CREATE TABLE IF NOT EXISTS bpo_clients','agency: existing BPO client workspace remains the canonical client identity');
includes(agencyRuntime,"client_identity_source:'bpo_clients'",'agency: Agency Command explicitly reuses BPO client identity');
includes(agencyRuntime,'CREATE TABLE IF NOT EXISTS agency_bookings','agency: booking storage exists');
includes(agencyRuntime,'CREATE TABLE IF NOT EXISTS agency_funnels','agency: funnel storage exists');
includes(agencyRuntime,'CREATE TABLE IF NOT EXISTS agency_reputation_items','agency: reputation queue storage exists');
includes(agencyRuntime,'CREATE TABLE IF NOT EXISTS agency_client_settings','agency: white-label client settings exist');
includes(agencyRuntime,'CREATE TABLE IF NOT EXISTS agency_usage_rebill','agency: usage rebilling ledger exists');
includes(agencyRuntime,"pricing_position:{agency:299,agency_pro:499,ordinary_max:199}",'agency: agency pricing targets stay separate from ordinary $0–$199 plans');
includes(agencyUI,'BUSINESS / AGENCY POWERHOUSE','agency: Agency Command UI remains present');
includes(agencyUI,'Existing $0–$199 customer plans are unchanged','agency: UI states ordinary customer pricing boundary is preserved');
includes(automationRuntime,'CREATE TABLE IF NOT EXISTS agency_automations','agency: persistent automation rules exist');
includes(automationRuntime,'CREATE TABLE IF NOT EXISTS agency_automation_runs','agency: automation execution receipts exist');
includes(automationRuntime,"'booking.created'",'agency: booking events can trigger automations');
includes(automationRuntime,"'inbox.received'",'agency: Inbox events can trigger automations');
includes(automationRuntime,"rule.action_type==='create-work'",'agency: automations can create durable Work Engine jobs');
includes(automationRuntime,"rule.action_type==='create-inbox'",'agency: automations can create Unified Inbox follow-ups');
includes(operations,'dispatchAgencyAutomationEvent','agency: event automation dispatcher is wired into the production operations layer');
includes(automationUI,'EVENT → RULE → ACTION → RECEIPT','agency: automation builder UI remains present');
for(const route of ['/agency-command','/agency-automations'])includes(globalTools,`href=\"${route}\"`,`agency: platform drawer links ${route}`);

// Non-regression boundaries.
notMatches(agencyRuntime,/CREATE TABLE IF NOT EXISTS\s+(?:crm_|bpo_clients)/i,'non-regression: Agency Command must not create a duplicate CRM/BPO client table');
notMatches(inboxRuntime,/CREATE TABLE IF NOT EXISTS\s+(?:crm_|bpo_clients)/i,'non-regression: Unified Inbox must not create a duplicate CRM/BPO client table');
includes(packageJson,'verify-main-protection.mjs','reliability: production branch-protection safety gate remains installed');

console.log(`Magnanimous OS + Agency locks: ${passes.length} checks passed.`);
if(failures.length){console.error(`\nMAGNANIMOUS OS / AGENCY CONTRACT FAILURE (${failures.length})`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Reliability First lock: PASS');
console.log('Magnanimous OS lock: PASS');
console.log('Agency powerhouse lock: PASS');
