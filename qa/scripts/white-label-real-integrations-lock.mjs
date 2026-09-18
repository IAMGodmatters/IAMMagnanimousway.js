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
const wrangler=read('worker/wrangler.jsonc');
const deploy=read('.github/workflows/deploy.yml');
const migration=read('worker/migrations/0071_white_label_external_integrations.sql');
const page=read('frontend/app/white-label/integrations/page.tsx');
const shell=read('frontend/app/white-label/app/page.tsx');
const home=read('frontend/app/white-label/page.tsx');
const agency=read('frontend/app/agency-command/page.tsx');

for(const x of ['CLOUDFLARE_SAAS_API_TOKEN','CLOUDFLARE_SAAS_ZONE_ID','CLOUDFLARE_SAAS_CNAME_TARGET'])must(domains.includes(x),'Custom-domain runtime missing protected setup key '+x);
must(domains.includes('/custom_hostnames')&&domains.includes('ownership_verification')&&domains.includes('validation_records'),'Custom-domain runtime must use managed hostname verification and TLS validation.');
must(domains.includes("row.status==='active'&&row.ssl_status==='active'"),'Custom domain may be called live only after hostname and TLS are active.');
must(domains.includes("That client does not belong to this White Label workspace."),'Custom-domain ownership must be client/tenant scoped.');

for(const x of ['document_title','document_body','document_hash','consent_text','signature_text','signer_ip_hash','expires_at'])must(esign.includes(x),'Native e-sign audit missing '+x);
must(esign.includes("status='signed'")&&esign.includes("Type your full name as your signature"),'E-sign flow must require affirmative signer action and store signed status.');
must(esign.includes('token_hash')&&!esign.includes('INSERT INTO agency_esign_requests(id,tenant_id,client_id,contract_id,signer_name,signer_email,token,'),'Public signing token must be stored only as a hash.');
must(esign.includes("tenantOnly:true"),'White Label e-sign email must require the agency tenant’s own mailbox.');
must(esign.includes("30*86400"),'Public e-sign links must expire.');
must(wrangler.includes('"/sign/*"')&&operations.includes('handlePublicEsign'),'Public signing links must route through the Worker.');

must(payments.includes('https://connect.stripe.com/oauth/authorize'),'Agency payments must use Stripe-hosted owner authorization.');
must(payments.includes('agency_payment_states')&&payments.includes("state=crypto.randomUUID()"),'Stripe Connect must use tenant-scoped expiring OAuth state.');
must(payments.includes("'Stripe-Account'"),'End-client checkout must run as a direct charge on the connected agency account.');
must(payments.includes("platform_application_fee_cents:0"),'Default client payment path must not silently take an application fee.');
must(payments.includes("payment_status||'')==='paid'"),'Usage ledger may be marked paid only after Stripe reports paid.');
must(payments.includes('agency_usage_rebill')&&payments.includes('customer_charge_usd'),'Client payment amount must come from the server-side rebilling ledger.');
must(payments.includes('/oauth/deauthorize'),'Agency owners must be able to disconnect their Stripe account.');

must(transport.includes("consentConfirmed!==true")&&transport.includes('voice_do_not_call'),'SMS delivery must require consent and respect do-not-contact.');
must(transport.includes('TWILIO_ACCOUNT_SID')&&transport.includes('PLIVO_AUTH_ID'),'SMS must use configured carrier transports rather than fake delivery.');
must(transport.includes("tenantOnly:true")&&growthMail.includes('tenantOnly=false'),'White Label email must not fall back to the platform owner mailbox.');
must(inbox.includes('message.delivered')&&inbox.includes('delivery.receipt'),'Unified Inbox must store a real delivery receipt for external sends.');
must(inbox.includes('await messagingReadiness(env,tenant)'),'Messaging readiness must be tenant-specific.');

for(const x of ['agency_custom_domains','agency_payment_connections','agency_payment_states','agency_client_charge_sessions','agency_esign_requests'])must(migration.includes(x),'External integration migration missing '+x);
must(deploy.includes('STRIPE_CONNECT_CLIENT_ID')&&deploy.includes('CLOUDFLARE_SAAS_API_TOKEN'),'Deployment must sync optional protected integration configuration.');
must(page.includes('/api/white-label/domains/readiness')&&page.includes('/api/white-label/esign/readiness')&&page.includes('/api/white-label/payments/status'),'Integration Center must read live readiness, not hard-code status.');
must(shell.includes("integrations:{name:'Connections + Payments'"),'White Label app shell must expose the Integration Center.');
must(home.includes("key:'integrations'"),'White Label storefront must expose the Integration Center.');
must(agency.includes('/api/white-label/payments/onboard')&&agency.includes('/api/white-label/payments/usage-checkout'),'Agency billing UI must use the real connected-account payment flow.');

console.log('White Label real integrations lock passed.');