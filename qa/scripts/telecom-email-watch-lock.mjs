import fs from 'node:fs';

const runtime=fs.readFileSync('worker/src/magnanimous-telecom-email-watch.js','utf8');
const operations=fs.readFileSync('worker/src/operations-entrypoint.js','utf8');
const migration=fs.readFileSync('worker/migrations/0091_telecom_email_watch.sql','utf8');
const ui=fs.readFileSync('frontend/app/telecom/network/page.tsx','utf8');

function must(value,message){if(!value)throw new Error(message)}

must(runtime.includes("WATCH_QUERY='in:inbox newer_than:7d"),'Telecom email watch must be bounded to relevant recent inbox mail.');
for(const domain of ['gigs.com','telna.com','1global.com','fonusmobile.com','fonus.me','ntc.gov.ph','pldt.com.ph','smart.com.ph','dito.ph','prudentialguarantee.com','pioneer.com.ph','strongholdinsurance.com.ph','sterling-insurance.com.ph','gsis.gov.ph','peza.gov.ph','privacy.gov.ph','dole.gov.ph','boi.gov.ph'])
 must(runtime.includes(domain),`Missing watched telecom domain: ${domain}`);
must(runtime.includes('telecom_email_watch_events'),'Durable email-event ledger is required.');
must(runtime.includes('await seen(env,row.id)'),'Message-id dedupe is required before processing.');
must(runtime.includes('recentThreadReply'),'Thread-level cooldown is required.');
must(runtime.includes('latestSegment'),'Newest-message segmentation is required before auto-ack/consequential classification.');
must(runtime.includes("automaticAcknowledgement(from,h.subject,latest)"),'Auto-ack classification must ignore quoted thread history.');
must(runtime.includes("consequentialRequest(latest)"),'Consequential classification must ignore quoted thread history.');
must(runtime.includes('(6*60*60)'),'Thread reply cooldown must remain six hours.');
must(runtime.includes("auto?'recorded_no_reply':cooldown?'recorded_thread_cooldown'"),'Auto acknowledgements and thread cooldowns must not send replies.');
must(runtime.includes("consequential?'acknowledged_without_acceptance':'replied'"),'Consequential inbound mail must only be acknowledged without acceptance.');
for(const phrase of ['does not accept a contract','authorize a payment/deposit','regulated service as live'])
 must(runtime.includes(phrase),`Missing consequential truth boundary: ${phrase}`);
must(runtime.includes("action IN ('replied','acknowledged_without_acceptance')"),'Reply-loop guard must only count actual prior replies.');
must(runtime.includes("SELECT can_read,can_write FROM assistant_permissions"),'Existing Gmail read/write permissions must be honored.');
must(runtime.includes("provider='google'"),'Watcher must use an already-authorized Magnanimous Gmail connection.');
must(runtime.includes("Gmail needs reauthorization"),'Expired/invalid mail authorization must fail truthfully.');
must(runtime.includes('updatePartnerEvidence'),'Carrier acquisition ledger must absorb inbound email evidence.');
must(runtime.includes("'pldt-smart'"),'PLDT/Smart reply handling must remain wired.');
must(runtime.includes("'dito'"),'DITO reply handling must remain wired.');
for(const key of ['surety-prudential','surety-pioneer','surety-stronghold','surety-sterling','surety-gsis'])
 must(runtime.includes(key),`Surety quote reply handling missing: ${key}`);
must(runtime.includes('₱1,000,000 NTC VoIP Reseller performance/surety bond'),'Surety reply templates must stay scoped to the NTC fallback bond.');
for(const key of ['peza','npc','dole','boi']) must(runtime.includes(` ${key}:`)||runtime.includes(`'${key}'`),`BPO/compliance reply handling missing: ${key}`);
must(runtime.includes('IT Enterprise/BPO registration path'),'PEZA reply handling must remain scoped to BPO/IT-enterprise compliance.');
must(runtime.includes('NPCRS/DPO/DPS compliance path'),'NPC reply handling must remain scoped to privacy compliance.');
must(runtime.includes('threadId:message.threadId'),'Gmail replies must remain in the provider thread.');
must(runtime.includes("In-Reply-To"),'Gmail replies must carry reply threading headers.');
must(operations.includes('scheduledTelecomEmailWatch(env)'),'Native scheduler must run the Telecom email watch.');
must(operations.includes("'/api/telecom/email-watch/status'"),'Owner-only Telecom email-watch status endpoint is required.');
must(operations.includes("'/api/telecom/email-watch/run'"),'Owner-only manual Telecom email-watch run endpoint is required.');
must(migration.includes('telecom_email_watch_events')&&migration.includes('telecom_email_watch_state'),'Durable Telecom email-watch migration is required.');
must(ui.includes('Call Center + Telecom move together'),'Owner UI must preserve the unified Call Center + Telecom operating contract.');
must(ui.includes('PHASE 1 · OWN CALL CENTER / BPO'),'Owner UI must preserve Phase 1 Call Center gate.');
must(ui.includes('PHASE 2 · OTHER CALL CENTERS'),'Owner UI must preserve Phase 2 B2B telecom gate.');
must(ui.includes('PHASE 3 · PUBLIC / GLOBAL'),'Owner UI must preserve Phase 3 public/global gate.');
must(ui.includes('CALL CENTER + TELECOM COMPLIANCE WATCH'),'Owner Telecom UI must expose unified compliance-watch status.');
must(ui.includes('RUN WATCH NOW'),'Owner Telecom UI must expose a manual safe watcher run.');
must(ui.includes('/api/telecom/email-watch/status'),'Owner UI must read native watcher state.');
must(ui.includes('/api/telecom/email-watch/run'),'Owner UI manual run must call the native watcher endpoint.');
must(ui.includes('never accepts contracts or authorizes payments'),'Owner UI must preserve the consequential-action boundary.');

console.log('Magnanimous Telecom native email watch lock passed.');
