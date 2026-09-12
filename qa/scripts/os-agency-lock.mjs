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
const navigationTests=read('qa/tests/navigation.spec.ts');
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
const growthRuntime=read('worker/src/growth-recovery-runtime.js');
const growthUI=read('frontend/app/growth-funnel/page.tsx');
const agencyBilling=read('worker/src/agency-billing-extension.js');
const wrangler=read('worker/wrangler.jsonc');
const notFound=read('frontend/app/not-found.tsx');
const notFoundRecovery=read('frontend/app/not-found-recovery.tsx');
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
includes(notFound,"NotFoundRecovery",'reliability: missing browser pages use automatic recovery instead of a dead-end screen');
includes(notFoundRecovery,'window.location.replace(destination)','reliability: missing routes automatically move to a working surface');
includes(notFoundRecovery,"'/persistent':'/work-engine'",'reliability: stale persistent link recovers to Work Engine');
notMatches(notFoundRecovery,/404\s*[•-]|continue a persistent Magnanimous job/i,'reliability: recurring dead-end 404/persistent wording stays removed');
includes(navigationTests,'legacy persistent route redirects to Work Engine instead of a dead end','reliability: browser QA covers stale persistent links');
includes(navigationTests,'unknown browser routes recover automatically instead of stranding the user','reliability: browser QA covers unknown-route recovery');

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

// Growth Funnel + lead memory + abandoned-checkout recovery.
includes(growthRuntime,"'Magnanimous Revenue Recovery'",'growth: one canonical revenue-recovery funnel remains installed');
includes(growthRuntime,"'all-platform'",'growth: funnel source scope covers the full platform');
includes(growthRuntime,'ON CONFLICT(scope_tenant_id,email) DO UPDATE SET','growth: lead memory is durable and deduplicated by scope + email');
includes(growthRuntime,"Number(lead.marketing_consent)!==1",'growth: commercial recovery refuses to send without stored marketing consent');
includes(growthRuntime,"'abandoned-checkout'",'growth: abandoned checkout sequence remains enabled');
includes(growthRuntime,"source:'magnanimous-pricing'",'growth: Magnanimous subscription checkout enters the funnel');
includes(growthRuntime,"provider='shopify'",'growth: connected Shopify stores are included in recovery sync');
includes(growthRuntime,"stage:complete?'customer':'abandoned_checkout'",'growth: Shopify checkout state maps into recovery/customer stages');
includes(growthRuntime,"cancelRecovery(env,lead.id,'Shopify checkout recovered')",'growth: Shopify recovery stops follow-up after conversion');
includes(growthRuntime,"waiting-compliance",'growth: automation blocks mail until compliance prerequisites are present');
includes(growthUI,'Magnanimous Revenue Recovery','growth: owner funnel surface exposes the canonical recovery funnel');
includes(operations,'recordSignupLead','growth: signup events feed lead memory');
includes(operations,'recordPlatformCheckout','growth: platform checkout events feed lead recovery');
includes(operations,'recordStripeGrowthEvent','growth: Stripe payment events close recovered leads');
includes(operations,'scheduledGrowth','growth: recurring automation worker remains wired');

// White-label pricing + real billing enforcement.
includes(agencyBilling,"price_usd:299",'billing: Agency remains $299/month');
includes(agencyBilling,"price_usd:499",'billing: Agency Pro remains $499/month');
includes(agencyBilling,'white_label:true','billing: agency entitlements include white labeling');
includes(agencyBilling,'client_subaccounts:25','billing: Agency includes 25 client subaccounts');
includes(agencyBilling,'client_subaccounts:100','billing: Agency Pro includes 100 client subaccounts');
includes(agencyBilling,'usage_rebilling:true','billing: agency plans retain usage rebilling entitlement');
includes(agencyBilling,"env[p==='agency'?'STRIPE_PRICE_AGENCY':'STRIPE_PRICE_AGENCY_PRO']",'billing: Agency checkout uses dedicated Stripe price configuration');
includes(agencyBilling,'ordinary_user_max_usd:199','billing: ordinary customer plans remain capped at $199 positioning');
includes(wrangler,'"STRIPE_PRICE_AGENCY"','billing: production Worker has Agency Stripe price binding');
includes(wrangler,'"STRIPE_PRICE_AGENCY_PRO"','billing: production Worker has Agency Pro Stripe price binding');

// Non-regression boundaries.
notMatches(agencyRuntime,/CREATE TABLE IF NOT EXISTS\s+(?:crm_|bpo_clients)/i,'non-regression: Agency Command must not create a duplicate CRM/BPO client table');
notMatches(inboxRuntime,/CREATE TABLE IF NOT EXISTS\s+(?:crm_|bpo_clients)/i,'non-regression: Unified Inbox must not create a duplicate CRM/BPO client table');
includes(packageJson,'verify-main-protection.mjs','reliability: production branch-protection safety gate remains installed');

console.log(`Magnanimous OS + Agency locks: ${passes.length} checks passed.`);
if(failures.length){console.error(`\nMAGNANIMOUS OS / AGENCY CONTRACT FAILURE (${failures.length})`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Reliability First lock: PASS');
console.log('Magnanimous OS lock: PASS');
console.log('Agency powerhouse lock: PASS');
console.log('Growth + recovery lock: PASS');
console.log('White-label pricing lock: PASS');
