import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const has=(text,value,message)=>must(text.includes(value),message);

const stripe=read('worker/src/stripe-webhook-hardened.js');
const carrier=read('worker/src/carrier-webhook-security.js');
const carrierMigration=read('worker/migrations/0058_carrier_webhook_replay_guard.sql');
const voice=read('worker/src/voice-agent-runtime.js');
const entry=read('worker/src/security-entrypoint.js');

has(stripe,"Math.abs(now()-stamp)>300",'Stripe signature freshness window must remain enforced.');
has(stripe,'billing_webhook_events','Stripe webhook event ledger must remain present.');
has(stripe,"SELECT event_id FROM billing_webhook_events WHERE event_id=?",'Stripe duplicate events must be detected before fulfillment.');
has(stripe,"return json({received:true,duplicate:true})",'Stripe duplicate events must be acknowledged without reprocessing.');

has(carrier,"x-iam-webhook-timestamp",'Carrier webhook v1 must require a signed timestamp.');
has(carrier,"x-iam-webhook-signature",'Carrier webhook v1 signature header is missing.');
has(carrier,"Math.abs(now()-stamp)>300",'Carrier webhook signatures must expire after the replay window.');
has(carrier,"x-iam-webhook-id",'Carrier webhook v1 must accept a stable event id.');
has(carrier,"INSERT OR IGNORE INTO carrier_webhook_events",'Carrier webhook event IDs must be reserved atomically before processing.');
has(carrier,"duplicate:true",'Duplicate carrier webhook events must be acknowledged without reprocessing.');
has(carrier,"DELETE FROM carrier_webhook_events WHERE event_id=? AND status='processing'",'Failed carrier events must release their reservation for safe provider retry.');
has(carrier,"VOIP_WEBHOOK_LEGACY_COMPAT",'Existing carrier bridges need an explicit compatibility switch during migration.');
has(carrier,"headers.set('deprecation','true')",'Legacy carrier webhook responses must advertise deprecation.');
has(carrierMigration,'event_id TEXT PRIMARY KEY','Carrier replay ledger must enforce event-id uniqueness.');
has(carrierMigration,'payload_hash TEXT NOT NULL','Carrier replay ledger must retain a payload fingerprint for audit.');

has(voice,"x-twilio-signature",'Twilio callbacks must require the provider signature.');
has(voice,"hmacSha1Base64",'Twilio request validation must compute the documented HMAC signature.');
has(voice,"if (!await validateTwilioRequest(request, env))",'Twilio callback routes must reject invalid signatures.');

has(entry,"from './carrier-webhook-security.js'",'Central security entrypoint must mount the carrier webhook guard.');
has(entry,'prepareCarrierWebhook(request,env,requestId)','Carrier callback verification must happen before application routing.');
has(entry,'completeCarrierWebhook(carrierContext','Carrier callback idempotency must commit only after application processing.');

console.log('Webhook signature, replay, and idempotency contracts verified.');
