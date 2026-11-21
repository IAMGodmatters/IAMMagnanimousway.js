import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};
const has=(text,value,message)=>must(text.includes(value),message);

const stripe=read('worker/src/stripe-webhook-hardened.js');
const claims=read('worker/src/stripe-webhook-idempotency.js');
const businessPlan=read('worker/src/business-plan-subscription-runtime.js');
const music=read('worker/src/stripe-webhook.js');
const agency=read('worker/src/agency-billing-extension.js');
const operations=read('worker/src/operations-entrypoint.js');
const claimMigration=read('worker/migrations/0112_stripe_webhook_event_claims.sql');
const carrier=read('worker/src/carrier-webhook-security.js');
const carrierMigration=read('worker/migrations/0058_carrier_webhook_replay_guard.sql');
const voice=read('worker/src/voice-agent-runtime.js');
const entry=read('worker/src/security-entrypoint.js');

has(stripe,"Math.abs(now()-stamp)>300",'Stripe signature freshness window must remain enforced.');
has(stripe,'billing_webhook_events','Stripe webhook event ledger must remain present.');
has(stripe,'claimStripeWebhookEvent','Central Stripe webhook must atomically claim an event before processing.');
has(stripe,'completeStripeWebhookEvent','Central Stripe webhook must mark only the owned claim processed.');
has(stripe,'failStripeWebhookEvent','Failed Stripe processing must release the claim for provider retry.');
has(stripe,'fetchStripeSubscription','Paid plan checkout must retrieve the authoritative Stripe subscription.');
has(stripe,"String(object?.mode||'')!=='subscription'",'One-time checkouts must not grant recurring plan entitlements.');
has(stripe,'ACTIVE.has(subscriptionStatus)','Paid plan activation must require an active provider subscription.');
has(stripe,"if(!PLANS.has(canonical))return;",'Subscription update events must not invent a default plan when metadata and price mapping are absent.');
if(stripe.includes("||old?.plan||'business'"))throw new Error('Subscription update still defaults an unresolved plan to Business.');
has(stripe,"return json({received:true,duplicate:true})",'Processed Stripe duplicates must be acknowledged without reprocessing.');
if(stripe.includes("SELECT event_id FROM billing_webhook_events WHERE event_id=?"))throw new Error('Stripe webhook still uses a check-then-act duplicate guard.');
has(claims,'RETURNING event_id','Stripe event reservation must use an atomic SQLite RETURNING claim.');
has(claims,"status!='processing' OR stripe_webhook_event_claims.claimed_at<=?",'Abandoned processing claims must expire safely.');
has(claims,'claim_token=?','Claim completion and failure must be bound to the owning token.');
has(businessPlan,'claimStripeWebhookEvent','Business-plan webhooks must use the shared atomic event ledger.');
has(businessPlan,'return null;','Non-Business-Plan webhook events must fall through to the central handler.');
has(stripe,"if(!await verify(raw,signature,secret))return json({detail:'Invalid Stripe webhook signature.'},401);",'Central webhook must verify the signature before opening the claim ledger.');
has(music,"if(!(await verify(raw,request.headers.get('stripe-signature'),secret)))return json({detail:'Invalid or expired Stripe signature.'},401);",'Music webhook must verify signatures before opening the claim ledger.');
has(businessPlan,"object.mode==='subscription'",'Business-plan checkout must verify subscription mode before activation.');
has(music,'Math.abs(now()-stamp)>300','Music Stripe signatures must enforce a five-minute replay window.');
has(music,'claimStripeWebhookEvent','Music webhooks must use the shared atomic event ledger.');
has(agency,"String(object.mode||'')!=='subscription'",'Agency checkout must reject non-subscription sessions.');
has(agency,"String(sub.status||'')!=='active'",'Agency entitlements must wait for an active provider subscription.');
has(operations,'const tasks=[recordStripeGrowthEvent(env,eventData,response)]','Agency activation must finish synchronously in the verified webhook path.');
if(operations.includes('applyAgencyWebhook(env,eventData,response)'))throw new Error('Agency activation is still deferred after the webhook response.');
has(claimMigration,'INSERT OR IGNORE INTO stripe_webhook_event_claims','Migration must backfill previously processed Stripe event IDs.');

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
