import fs from 'node:fs';

const runtime=fs.readFileSync('worker/src/magnanimous-telecom-email-watch.js','utf8');
const operations=fs.readFileSync('worker/src/operations-entrypoint.js','utf8');
const migration=fs.readFileSync('worker/migrations/0091_telecom_email_watch.sql','utf8');

function must(value,message){if(!value)throw new Error(message)}

must(runtime.includes("WATCH_QUERY='in:inbox newer_than:7d"),'Telecom email watch must be bounded to relevant recent inbox mail.');
for(const domain of ['gigs.com','telna.com','1global.com','fonusmobile.com','fonus.me','ntc.gov.ph'])
 must(runtime.includes(domain),`Missing watched telecom domain: ${domain}`);
must(runtime.includes('telecom_email_watch_events'),'Durable email-event ledger is required.');
must(runtime.includes('await seen(env,row.id)'),'Message-id dedupe is required before processing.');
must(runtime.includes('recentThreadReply'),'Thread-level cooldown is required.');
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
must(runtime.includes('threadId:message.threadId'),'Gmail replies must remain in the provider thread.');
must(runtime.includes("In-Reply-To"),'Gmail replies must carry reply threading headers.');
must(operations.includes('scheduledTelecomEmailWatch(env)'),'Native scheduler must run the Telecom email watch.');
must(operations.includes("'/api/telecom/email-watch/status'"),'Owner-only Telecom email-watch status endpoint is required.');
must(operations.includes("'/api/telecom/email-watch/run'"),'Owner-only manual Telecom email-watch run endpoint is required.');
must(migration.includes('telecom_email_watch_events')&&migration.includes('telecom_email_watch_state'),'Durable Telecom email-watch migration is required.');

console.log('Magnanimous Telecom native email watch lock passed.');
