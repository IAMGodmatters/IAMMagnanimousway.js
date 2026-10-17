import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const runtime=read('worker/src/magnanimous-telecom-provider-fallback.js');
const guard=read('worker/src/magnanimous-telecom-charging-safety-guard.js');
const payment=read('worker/src/magnanimous-telecom-provider-payment.js');
const phone=read('worker/src/phone-carrier-runtime.js');
const stripe=read('worker/src/stripe-webhook-hardened.js');
const wrangler=read('worker/wrangler.jsonc');

must(runtime.includes("threecx_smb_free"),'3CX SMB Free fallback must remain declared');
must(runtime.includes('max_users:10'),'free fallback must remain bounded to 10 users');
must(runtime.includes('programmatic_control:false'),'free fallback must never be misrepresented as an API-controlled backend');
must(runtime.includes("threecx_ai_api"),'paid 3CX API fallback must remain separately modeled');
must(runtime.includes("programmatic_control:true"),'API-controlled fallback path must remain explicit');
must(runtime.includes("variableCustomerCharge(origin)"),'paid fallback must use the established provider origin-cost pricing function');
must(runtime.includes("metadata[product_type]','telecom_provider_fallback'"),'Stripe telecom checkout metadata must remain scoped');
must(runtime.includes('providerEligibility(provider,env'),'provider selection must be derived from server-side readiness');
must(runtime.includes('SERVER_DERIVED_EXECUTION_POLICY_REQUIRED'),'execution lease API must fail closed until trusted campaign policy derivation is complete');
must(!runtime.includes('campaign_enabled:bool(body.campaign_enabled)'),'execution authorization must not bind caller-supplied campaign state');
must(!runtime.includes('dnc_clear:bool(body.dnc_clear)'),'execution authorization must not bind caller-supplied DNC state');
must(!runtime.includes('billing_reserved:bool(body.billing_reserved)'),'execution authorization must not bind caller-supplied billing state');
must(runtime.includes("status='checkout_reserving'"),'paid checkout must reserve quote state atomically before Stripe session creation');
must(runtime.includes('Provider readiness changed before checkout'),'provider readiness must be rechecked before customer payment');
must(runtime.includes('customer_paid_review_required'),'payments arriving after quote expiry must require review rather than auto-fund upstream');
must(runtime.includes('checkout.session.async_payment_failed'),'failed asynchronous Stripe payments must be tracked');
must(runtime.includes('vendor_attribution_policy'),'provider abstraction must preserve legally/contractually required attribution');
must(runtime.includes('Do not falsely claim upstream software is owned or authored by Magnanimous'),'provider abstraction must not become false ownership attribution');

must(phone.includes("SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?"),'every outbound carrier call must recheck tenant DNC state server-side');
must(phone.includes('TELECOM_AUTOMATED_CAMPAIGN_COMPLIANCE_READY'),'automated campaign dialing must remain fail-closed until server compliance policy is verified');
must(phone.includes('TELECOM_AUTOMATED_HOLIDAY_POLICY_VERIFIED'),'automated campaign dialing must require verified holiday policy');
must(phone.includes('TELECOM_AUTOMATED_JURISDICTION_POLICY_VERIFIED'),'automated campaign dialing must require verified jurisdiction policy');
must(phone.includes('TELECOM_AUTOMATED_BILLING_GUARD_VERIFIED'),'automated campaign dialing must require a verified billing guard');
must(phone.includes("m.consent_confirmed"),'automated campaign consent must come from server campaign-member state');
must(phone.includes("c.status='active'"),'automated campaign must remain active at dial time');
must(phone.includes('OUTSIDE_CALLING_WINDOW'),'automated campaign calling window must be rechecked at dial time');
must(phone.includes('CALLER_IDENTITY_NOT_VERIFIED'),'automated campaign caller identity must fail closed when not server configured');

must(guard.includes("import { handleMagnanimousTelecomProviderFallback } from './magnanimous-telecom-provider-fallback.js'"),'fallback must be mounted inside the existing secured telecom chain');
must(guard.includes("path.startsWith('/api/telecom/provider-fallback')||path.startsWith('/api/telecom/execution')"),'API fallback and execution routes must stay mounted');
must(guard.includes("/__magnanimous_runtime/telecom/provider-fallback"),'internal fallback alias must remain available outside the standalone API proxy');
must(guard.includes("/__magnanimous_runtime/telecom/execution"),'internal execution alias must remain available outside the standalone API proxy');
must(guard.includes("providerControl&&!ownerLike(user)"),'provider-selection control plane must remain owner/admin only');
must(wrangler.includes('"main": "src/security-entrypoint.js"'),'production Worker must retain the established security entrypoint');

must(payment.includes('TELECOM_UPSTREAM_AUTO_PAY_ENABLED'),'upstream payment must remain explicitly opt-in');
must(payment.includes('TELECOM_UPSTREAM_MAX_AUTO_PAY_USD'),'upstream payment must remain capped');
must(payment.includes("'idempotency-key':`magnanimous:${eventId}:${quote.id}`"),'upstream payment must remain idempotent');
must(payment.includes("parsed.protocol!=='https:'"),'upstream settlement endpoint must remain HTTPS-only');
must(payment.includes("redirect:'error'"),'upstream settlement must not follow redirects to an unvalidated destination');
must(payment.includes('checkout.session.async_payment_failed'),'settlement observer must account for failed async payments');
must(payment.includes('checkout.session.expired'),'settlement observer must account for expired checkouts');
must(stripe.includes("processMagnanimousTelecomProviderStripeEvent(env,event)"),'verified Stripe webhook must dispatch telecom settlement before generic plan checkout processing');

console.log('Telecom fallback execution lock PASS');
