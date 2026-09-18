import fs from 'node:fs';
const root=p=>new URL('../../'+p,import.meta.url);
const read=p=>fs.readFileSync(root(p),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

const domains=read('worker/src/white-label-domain-runtime.js');
const esign=read('worker/src/white-label-esign-runtime.js');
const payments=read('worker/src/white-label-payments-runtime.js');
const transport=read('worker/src/white-label-message-transport.js');
const inbox=read('worker/src/unified-inbox-runtime.js');
const growthMail=read('worker/src/growth-email-transport.js');
const operations=read('worker/src/operations-entrypoint.js');
const stripeWebhook=read('worker/src/stripe-webhook-hardened.js');
const wrangler=read('worker/wrangler.jsonc');
const deploy=read('.github/workflows/deploy.yml');
const providerEnv=read('worker/src/provider-runtime-env.js');
const credentials=read('worker/src/platform-credentials.js');
const migration=read('worker/migrations/0071_white_label_external_integrations.sql');
const page=read('frontend/app/white-label/integrations/page.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const home=read('frontend/app/white-label/page.tsx');
const agency=read('frontend/app/agency-command/page.tsx');
const studio=read('frontend/app/white-label-studio/page.tsx');

must(domains.includes('getProviderRuntimeEnv'),'Custom domains must reuse the protected provider credential layer.');
must(domains.includes("CLOUDFLARE_PLATFORM_API_TOKEN")&&domains.includes("CLOUDFLARE_PLATFORM_ZONE_ID"),'Custom domains must support the protected Cloudflare control-plane credentials.');
must(domains.includes('/custom_hostnames')&&domains.includes('ownership_verification')&&domains.includes('validation_records'),'Custom domains must use managed hostname verification and TLS validation.');
must(!domains.includes('custom_metadata:'),'Default custom-hostname creation must stay compatible with non-Enterprise Cloudflare plans and not require Enterprise-only custom metadata.');
must(domains.includes('/custom_hostnames/fallback_origin')&&domains.includes("fallback.active"),'Custom domains must verify an Active SaaS fallback origin before registration.');
must(domains.includes("row.status==='active'&&row.ssl_status==='active'"),'Custom domain may be called live only after hostname and TLS are active.');
must(domains.includes('handlePublicWhiteLabelDomain')&&domains.includes("d.status='active' AND d.ssl_status='active'"),'Verified custom-domain root routing must require live hostname and TLS status.');
must(domains.includes("That client does not belong to this White Label workspace."),'Custom-domain ownership must be tenant/client scoped.');
must(wrangler.includes('"/"')&&operations.includes('handlePublicWhiteLabelDomain'),'Custom host root requests must run through the White Label host router.');

for(const x of ['document_title','document_body','document_hash','consent_text','signature_text','signer_ip_hash','expires_at'])must(esign.includes(x),'Native e-sign audit missing '+x);
must(esign.includes("status='signed'")&&esign.includes("Type your full name as your signature"),'E-sign must require affirmative signer action and store signed status.');
must(esign.includes('token_hash')&&!esign.includes('INSERT INTO agency_esign_requests(id,tenant_id,client_id,contract_id,signer_name,signer_email,token,'),'Public e-sign token must be stored only as a hash.');
must(esign.includes("tenantOnly:true"),'E-sign email must require the agency tenant’s own mailbox.');
must(esign.includes("30*86400"),'Public e-sign links must expire.');
must(esign.includes("existing?.document_hash||await sha")&&esign.includes("existing?.document_body||c.body"),'Resending an unsigned e-sign request must preserve its original immutable document snapshot while rotating the secure link.');
must(esign.includes("Signed audit records cannot be deleted"),'Signed electronic-signature audit records must not be deletable from the standard UI.');
must(wrangler.includes('"/sign/*"')&&operations.includes('handlePublicEsign'),'Public signing links must route through the Worker.');

must(payments.includes("type','standard'")&&payments.includes('/v1/account_links'),'Stripe Connect must support Stripe-hosted Standard connected-account onboarding.');
must(payments.includes("/v1/accounts?limit=1")&&payments.includes('connectCapability'),'Client-payment readiness must verify the live Stripe Connect account API instead of trusting key presence alone.');
must(payments.includes('https://connect.stripe.com/oauth/authorize')&&payments.includes('STRIPE_CONNECT_CLIENT_ID'),'Stripe Connect may also attach an existing Standard account through owner-authorized OAuth when configured.');
must(payments.includes('agency_payment_states')&&payments.includes('state=crypto.randomUUID()'),'Existing-account OAuth must use tenant-scoped expiring state.');
must(payments.includes("'Stripe-Account'"),'End-client checkout must run as a direct charge on the connected agency account.');
must(payments.includes("platform_application_fee_cents:0"),'Default client payment path must not silently take an application fee.');
must(payments.includes("payment_status||'')==='paid'"),'Usage ledger may be marked paid only after Stripe reports paid.');
must(payments.includes('agency_usage_rebill')&&payments.includes('customer_charge_usd'),'Client payment amount must come from the server-side rebilling ledger.');
must(payments.includes('applyWhiteLabelClientPaymentWebhook')&&operations.includes('applyWhiteLabelClientPaymentWebhook'),'Connected-account checkout events must be able to synchronize the rebilling ledger.');
must(stripeWebhook.includes("if(event?.account)return")&&stripeWebhook.includes("clientRef.startsWith('usage:')"),'Connected-account/usage client payments must never be fulfilled as platform subscriptions.');
must(operations.includes("if(!eventData?.account)tasks.push(applyAgencyWebhook")&&operations.includes('recordStripeGrowthEvent(env,eventData)'),'Connected-account client sales must stay out of platform subscription and growth post-processing.');
must(providerEnv.includes("'STRIPE_CONNECT_CLIENT_ID'")&&credentials.includes("STRIPE_CONNECT_CLIENT_ID"),'Optional Stripe Connect OAuth configuration must remain in the protected credential layer.');

must(transport.includes("messagingReadiness(env,tenant")||transport.includes("messagingReadiness(env,tenant=''"),'Messaging readiness must be tenant-aware.');
must(transport.includes("provider IN ('google','outlook')"),'Email readiness must require the tenant’s connected Gmail/Outlook sender.');
must(transport.includes("consentConfirmed!==true")&&transport.includes('voice_do_not_call'),'SMS delivery must require consent and respect do-not-contact.');
must(transport.includes('TWILIO_ACCOUNT_SID')&&transport.includes('PLIVO_AUTH_ID'),'SMS must use configured carrier transports instead of fake delivery.');
must(transport.includes("tenantOnly:true")&&growthMail.includes('tenantOnly=false'),'White Label email must never fall back to the platform owner mailbox.');
must(inbox.includes('message.delivered')&&inbox.includes('delivery.receipt'),'Unified Inbox must store a real delivery receipt for external sends.');
must(inbox.includes('await messagingReadiness(env,tenant)'),'Unified Inbox readiness must be tenant-specific.');
must(inbox.indexOf('deliverUnifiedInboxMessage')<inbox.indexOf("INSERT INTO unified_inbox_messages",inbox.indexOf("if(m&&request.method==='POST')")),'External transport must be attempted before an outbound message is recorded as delivered.');

for(const x of ['agency_custom_domains','agency_payment_connections','connection_mode','agency_payment_states','agency_client_charge_sessions','agency_esign_requests'])must(migration.includes(x),'External integration migration missing '+x);
must(deploy.includes('STRIPE_CONNECT_CLIENT_ID')&&deploy.includes('CLOUDFLARE_SAAS_API_TOKEN')&&deploy.includes('PLIVO_AUTH_TOKEN'),'Deployment must sync optional protected integration configuration when supplied.');
must(page.includes('/api/white-label/domains/readiness')&&page.includes('/api/white-label/esign/readiness')&&page.includes('/api/white-label/payments/status'),'Integration Center must read live readiness instead of hard-coding success.');
must(page.includes('Cloudflare for SaaS is not traffic-ready')&&page.includes('existing_account_oauth_available'),'Integration Center must show truthful domain status and both Stripe connection choices.');
must(shell.includes("integrations:{name:'Connections + Payments'"),'White Label app shell must expose the Integration Center.');
must(home.includes("key:'integrations'"),'White Label home must expose the Integration Center.');
must(agency.includes('/api/white-label/payments/onboard')&&agency.includes('/api/white-label/payments/usage-checkout')&&agency.includes('/api/white-label/payments/confirm'),'Agency billing UI must create and verify connected-account client payments.');
must(studio.includes('Request signature')&&!studio.includes("projects:['Projects + Tasks'"),'White Label Studio must link contracts to real e-sign and avoid overstating task support.');

console.log('White Label real integrations lock passed.');