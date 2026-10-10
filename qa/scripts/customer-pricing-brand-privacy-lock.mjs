import fs from 'node:fs';
import {customerUsageStatus} from '../../worker/src/usage-guard.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const tiers=read('worker/src/billing-tiers-runtime.js');
const agencyBilling=read('worker/src/agency-billing-extension.js');
const agency=read('worker/src/agency-growth-runtime.js');
const enterprise=read('worker/src/enterprise-commercialization-runtime.js');
const pricing=read('frontend/app/pricing/page.tsx');
const account=read('frontend/app/account/page.tsx');
const login=read('frontend/app/login/page.tsx');
const recovery=read('frontend/app/account/recovery-contacts.tsx');
const advertise=read('frontend/app/advertise/page.tsx');
const billingSupport=read('frontend/app/billing-support/page.tsx');
const agentVideo=read('frontend/app/agent-video/page.tsx');
const aiVideo=read('frontend/app/ai-video/page.tsx');
const dialer=read('frontend/app/auto-dialer/page.tsx');
const whiteLabel=read('frontend/app/white-label/page.tsx');
const whiteLabelApps=read('frontend/app/white-label/client-apps/page.tsx');
const whiteLabelMessaging=read('frontend/app/white-label/whatsapp/page.tsx');
const whiteLabelOs=read('frontend/app/white-label-os/page.tsx');
const forgotPassword=read('frontend/app/forgot-password/page.tsx');
const securityPage=read('frontend/app/security/page.tsx');
const videoAgents=read('frontend/app/video-agents/page.tsx');
const businessPlan=read('frontend/app/business-plan/business-plan-client.tsx');
const launchPlan=read('frontend/app/launchplan/launchplan-client.tsx');
const businessEmail=read('frontend/app/business-email/email-center-client.tsx');


const sample=customerUsageStatus({
 plan:'business',limits:{metered_ai:true,cost_ceiling_usd:160},direct_variable_cost_usd:12,cost_ceiling_usd:160,
 remaining_cost_usd:148,prepaid_balance_usd:25,prepaid_provider_origin_capacity_usd:20.83,
 prepaid_total_funded_usd:50,prepaid_total_consumed_usd:25,premium_spendable_usd:168.83,
 provider_origin_spendable_usd:168.83,variable_markup_percent:20,premium_usage_allowed:true
});
const forbiddenUsage=['direct_variable_cost_usd','cost_ceiling_usd','remaining_cost_usd','prepaid_provider_origin_capacity_usd','provider_origin_spendable_usd','variable_markup_percent','premium_spendable_usd'];
const sampleJson=JSON.stringify(sample);

const checks=[
 ['business email customer copy hides outside mailbox brands', !/Google Workspace|Microsoft 365|Zoho Mail|Proton for Business|dash\.cloudflare\.com/.test(businessEmail)],
 ['public plan projection strips pricing basis', tiers.includes('pricing_basis: _ownerPricingBasis')&&tiers.includes('customerEntitlements(entitlements)')],
 ['public plan catalog omits public target markup fields', /tier_checkout_configured:[\s\S]*\}\);/.test(tiers)&&!tiers.match(/tier_checkout_configured:[\s\S]{0,250}target_markup_percent/)],
 ['billing status exposes internal cost math only in owner_pricing', tiers.includes('platformOwnerDeveloperIdentity(user,env)')&&tiers.includes('if(identity.authorized) response.owner_pricing=')],
 ['customer usage projection strips origin cost and markup math', forbiddenUsage.every(k=>!sampleJson.includes(k))&&sample.customer_usage_balance_usd===25&&sample.customer_usage_charged_usd===25],
 ['agency plan catalog strips internal cost ceiling', agencyBilling.includes('cost_ceiling_usd:_internalCostCeiling')&&!agencyBilling.includes('target_gross_margin_percent:Number(env.TARGET_GROSS_MARGIN_PERCENT||20)}))')],
 ['agency billing status owner-gates internal pricing', agencyBilling.includes('if(identity.authorized)payload.owner_pricing=')],
 ['agency usage API strips cost markup and private note for non-owner', agency.includes('platformOwner?results:results.map(({cost_usd:_ownerCost,markup_percent:_ownerMarkup,note:_ownerNote,...row})=>row)')],
 ['enterprise API uses customer-safe usage and pricing snapshots', enterprise.includes('customerUsageStatus(data.usage)')&&enterprise.includes('customerMagnanimousPluginPricingSnapshot()')],
 ['enterprise provider display is Magnanimous-branded for non-owner', enterprise.includes("name:`Magnanimous ${p.category} route ${index+1}`")],
 ['enterprise top-up keeps 20 percent detail owner-only', enterprise.includes('platformOwner?{url:link.toString()')&&enterprise.includes('owner_pricing:{markup_percent:20')&&enterprise.includes("charge_rule:'Prepaid credits are deducted only at the final Magnanimous customer charge.'")],
 ['pricing page has no customer-facing markup formula', !pricing.includes('20%')&&!pricing.includes('1.20')&&!pricing.includes('cost + exactly')],
 ['pricing page uses generic secure checkout wording', !pricing.includes('Opening Stripe')&&!pricing.includes('received by Stripe')&&!pricing.includes('Stripe did not return')],
 ['pricing page renders owner-only internal diagnostics conditionally', pricing.includes('ownerPricing&&<section className="ownerAudit"')&&pricing.includes('PRIVATE PRICING DIAGNOSTICS')],
 ['login/account recovery do not advertise a specific authenticator or mail product', !login.includes('Google Authenticator')&&!login.includes('GOOGLE AUTHENTICATOR')&&!account.includes('Google Authenticator')&&!account.includes('GOOGLE AUTHENTICATOR')&&!account.includes('Inkbox')&&!account.includes('Gmail')&&!recovery.includes('Google Authenticator')],
 ['advertising and billing support do not display payment processor branding', !advertise.includes('Stripe handles')&&!advertise.includes('Stripe confirmation')&&!billingSupport.includes('Stripe Customer Portal')&&!billingSupport.includes('Stripe subscription')],
 ['video surfaces do not display renderer/provider branding', !agentVideo.includes('LivePortrait')&&!agentVideo.includes('Wav2Lip')&&!aiVideo.includes("s.provider||'Magnanimous visual engine'")],
 ['dialer customer status does not display carrier/provider identity', !dialer.includes("call.provider||'configured carrier'")],
 ['white label cards do not render provider identities', !whiteLabel.includes('Provider:')&&!whiteLabel.includes('optional Twilio')&&!whiteLabel.includes('Meta WhatsApp')&&!whiteLabel.includes('WhatsApp Product Inbox')],
 ['white label client apps and OS do not render provider identities', !whiteLabelApps.includes('Provider: {x.provider')&&!whiteLabelApps.includes('external_transport.name')&&!whiteLabelOs.includes('Provider: {m.provider')],
 ['white label messaging copy is provider neutral', !whiteLabelMessaging.includes('WhatsApp Product Inbox')&&!whiteLabelMessaging.includes('Connected WhatsApp account')&&!whiteLabelMessaging.includes('WhatsApp confirmed')&&!whiteLabelMessaging.includes('Meta WhatsApp')&&!whiteLabelMessaging.includes('In Meta,')&&!whiteLabelMessaging.includes('from Meta')&&!whiteLabelMessaging.includes('official Meta')],
 ['recovery copy uses generic authenticator wording', !forgotPassword.includes('Google Authenticator')],
 ['security boundary does not advertise infrastructure vendors', !securityPage.includes('Cloudflare')&&!securityPage.includes('Stripe')],
 ['video agents do not advertise renderer vendors', !videoAgents.includes('Cloudflare FLUX')&&!videoAgents.includes('HEYGEN')&&!videoAgents.includes('TAVUS')],
 ['business checkout copy is payment-provider neutral', !businessPlan.includes('Stripe did not return')&&!businessPlan.includes('with Stripe')&&!launchPlan.includes('Stripe entitlement')&&!launchPlan.includes('account, Stripe')],
 ['business email customer copy is domain-provider neutral', !businessEmail.includes('Cloudflare setup')&&!businessEmail.includes('Cloudflare Email Routing')&&!businessEmail.includes('OPEN CLOUDFLARE')&&!businessEmail.includes('Why does Cloudflare')],
];

let failed=0;
for(const[name,ok]of checks){console.log(`${ok?'PASS':'FAIL'} - ${name}`);if(!ok)failed++}
if(failed){console.error(`Customer pricing/brand privacy lock failed: ${failed} check(s).`);process.exit(1)}
console.log(`Customer pricing/brand privacy lock: ${checks.length} checks passed.`);
