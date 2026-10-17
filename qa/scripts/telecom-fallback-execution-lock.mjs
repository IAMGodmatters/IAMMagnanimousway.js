import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const runtime=read('worker/src/magnanimous-telecom-provider-fallback.js');
const guard=read('worker/src/magnanimous-telecom-charging-safety-guard.js');
const payment=read('worker/src/magnanimous-telecom-provider-payment.js');
const stripe=read('worker/src/stripe-webhook-hardened.js');
const wrangler=read('worker/wrangler.jsonc');

must(runtime.includes("threecx_smb_free"),'3CX SMB Free fallback must remain declared');
must(runtime.includes('max_users:10'),'free fallback must remain bounded to 10 users');
must(runtime.includes('programmatic_control:false'),'free fallback must never be misrepresented as an API-controlled backend');
must(runtime.includes("threecx_ai_api"),'paid 3CX API fallback must remain separately modeled');
must(runtime.includes("programmatic_control:true"),'API-controlled fallback path must remain explicit');
must(runtime.includes("variableCustomerCharge(origin)"),'paid fallback must use the established provider origin-cost pricing function');
must(runtime.includes("metadata[product_type]','telecom_provider_fallback'"),'Stripe telecom checkout metadata must remain scoped');
must(runtime.includes('campaign_preapproved'),'campaign preapproval lease mode must remain supported');
must(runtime.includes('execution_authorized:true'),'execution lease must be able to authorize only after gates pass');
must(runtime.includes("CONSENT_NOT_VERIFIED"),'consent gate must remain enforced');
must(runtime.includes("DNC_NOT_CLEARED"),'DNC gate must remain enforced');
must(runtime.includes("OUTSIDE_CALLING_WINDOW"),'calling-window gate must remain enforced');
must(runtime.includes("HOLIDAY_BLOCK"),'holiday gate must remain enforced');
must(runtime.includes("CARRIER_NOT_READY"),'carrier readiness gate must remain enforced');
must(runtime.includes("BILLING_NOT_RESERVED"),'billing reserve gate must remain enforced');
must(runtime.includes("JURISDICTION_POLICY_NOT_VERIFIED"),'jurisdiction policy gate must remain enforced');
must(runtime.includes("CALLER_IDENTITY_NOT_VERIFIED"),'caller identity truth gate must remain enforced');
must(runtime.includes('recording_policy_pass'),'recording-policy gate must remain enforced when recording is enabled');
must(runtime.includes('recheck_required_at_dial:true'),'execution leases must require live re-check at dial time');
must(runtime.includes('vendor_attribution_policy'),'provider abstraction must preserve legally/contractually required attribution');
must(runtime.includes('Do not falsely claim upstream software is owned or authored by Magnanimous'),'provider abstraction must not become false ownership attribution');

must(guard.includes("import { handleMagnanimousTelecomProviderFallback } from './magnanimous-telecom-provider-fallback.js'"),'fallback must be mounted inside the existing secured telecom chain');
must(guard.includes("path.startsWith('/api/telecom/provider-fallback')||path.startsWith('/api/telecom/execution')"),'fallback and execution routes must stay mounted');
must(wrangler.includes('"main": "src/security-entrypoint.js"'),'production Worker must retain the established security entrypoint');

must(payment.includes('TELECOM_UPSTREAM_AUTO_PAY_ENABLED'),'upstream payment must remain explicitly opt-in');
must(payment.includes('TELECOM_UPSTREAM_MAX_AUTO_PAY_USD'),'upstream payment must remain capped');
must(payment.includes("'idempotency-key':`magnanimous:${eventId}:${quote.id}`"),'upstream payment must remain idempotent');
must(payment.includes("parsed.protocol!=='https:'"),'upstream settlement endpoint must remain HTTPS-only');
must(stripe.includes("processMagnanimousTelecomProviderStripeEvent(env,event)"),'verified Stripe webhook must dispatch telecom settlement before generic plan checkout processing');

console.log('Telecom fallback execution lock PASS');
