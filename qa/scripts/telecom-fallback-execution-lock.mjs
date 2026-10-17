import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const runtime=read('worker/src/magnanimous-telecom-provider-fallback.js');
const wrapper=read('worker/src/telecom-fallback-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');

must(runtime.includes("threecx_smb_free"),'3CX SMB Free fallback must remain declared');
must(runtime.includes('max_users:10'),'free fallback must remain bounded to 10 users');
must(runtime.includes('programmatic_control:false'),'free fallback must never be misrepresented as an API-controlled backend');
must(runtime.includes("threecx_ai_api"),'paid 3CX API fallback must remain separately modeled');
must(runtime.includes("programmatic_control:true"),'API-controlled fallback path must remain explicit');
must(runtime.includes("variableCustomerCharge(origin)"),'paid fallback must use the established provider origin-cost pricing function');
must(runtime.includes("metadata[product_type]','telecom_provider_fallback'"),'Stripe telecom checkout metadata must remain scoped');
must(runtime.includes('TELECOM_UPSTREAM_AUTO_PAY_ENABLED'),'upstream payment must remain explicitly opt-in');
must(runtime.includes('TELECOM_UPSTREAM_MAX_AUTO_PAY_USD'),'upstream payment must remain capped');
must(runtime.includes("'idempotency-key':`magnanimous:${eventId}:${quote.id}`"),'upstream payment must remain idempotent');
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

must(wrapper.includes("import app from './security-entrypoint.js'"),'fallback wrapper must preserve the established security entrypoint');
must(wrapper.includes('securityPreflight'),'fallback endpoints must remain behind security preflight');
must(wrapper.includes('securityPostflight'),'fallback responses must remain behind security postflight');
must(wrapper.includes('resolveSessionRequest'),'fallback endpoints must preserve opaque-session resolution');
must(wrapper.includes("path.startsWith('/api/telecom/provider-fallback')&&!ownerLike(user)"),'provider identity and source selection must remain owner/admin only');
must(wrapper.includes('observeMagnanimousTelecomProviderPayment'),'Stripe payment observer must stay mounted');
must(wrangler.includes('"main": "src/telecom-fallback-entrypoint.js"'),'Worker must stay mounted through the secured telecom fallback entrypoint');

console.log('Telecom fallback execution lock PASS');
