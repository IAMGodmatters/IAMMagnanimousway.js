import { currentUser } from './integrations.js';
import { variableCustomerCharge } from './provider-origin-pricing.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=value=>String(value??'').trim();
const runtimeTrue=value=>['1','true','yes','on'].includes(clean(value).toLowerCase());
const now=()=>Math.floor(Date.now()/1000);
const micros=value=>Math.max(0,Math.round((Number(value)||0)*1_000_000));
const dollars=value=>Math.round((Math.max(0,Number(value)||0)+Number.EPSILON)*1e9)/1e9;
const ownerLike=user=>['owner','admin','super_admin','superadmin'].includes(clean(user?.role).toLowerCase());

export const TELECOM_FALLBACK_VERSION='2026-10-17.2';

const PROVIDERS=Object.freeze({
 magnanimous_native:Object.freeze({key:'magnanimous_native',kind:'native',customer_label:'Magnanimous Telecom',free_license:true,max_users:null,programmatic_control:true,automation:true,requires_external_license:false,note:'Primary Magnanimous-controlled path when a native or directly contracted carrier route is available.'}),
 threecx_smb_free:Object.freeze({key:'threecx_smb_free',kind:'pbx_fallback',customer_label:'Magnanimous Telecom',free_license:true,max_users:10,programmatic_control:false,automation:false,requires_external_license:true,note:'3CX SMB Free can serve up to 10 users at $0 license cost, but the free shared edition is not the official API-controlled backend path. SIP trunk/telephone charges remain separate.'}),
 threecx_basic_free:Object.freeze({key:'threecx_basic_free',kind:'pbx_fallback',customer_label:'Magnanimous Telecom',free_license:true,max_users:10,programmatic_control:false,automation:false,requires_external_license:true,note:'3CX 4SC Basic Free supports up to 10 users and core telephony, but official 3CX material states CRM/API/automation integrations are not included.'}),
 threecx_ai_api:Object.freeze({key:'threecx_ai_api',kind:'pbx_api_fallback',customer_label:'Magnanimous Telecom',free_license:false,max_users:null,programmatic_control:true,automation:true,requires_external_license:true,note:'Official 3CX Call Control currently requires an 8SC+ AI license. Use only with a valid upstream license, service-principal/API binding, and applicable 3CX terms.'}),
 sip_direct:Object.freeze({key:'sip_direct',kind:'carrier_fallback',customer_label:'Magnanimous Telecom',free_license:false,max_users:null,programmatic_control:true,automation:true,requires_external_license:true,note:'Direct contracted SIP/carrier fallback. Usage can be customer-funded through Magnanimous charging and provider-cost markup controls.'})
});

const CUSTOMER_PROVIDER_POLICY=Object.freeze({frontend_identity:'Magnanimous Telecom',brain_identity:'Magnanimous AI',provider_abstraction:true,provider_selection_internal:true,vendor_attribution_policy:'Magnanimous may keep provider selection out of ordinary customer UI, but it must preserve any upstream branding, notices, disclosures, or attribution required by license, client software, law, or contract.',deception_policy:'Do not falsely claim upstream software is owned or authored by Magnanimous and do not remove required vendor branding.',pricing_policy:'Free/included upstream capacity is charged at $0 direct provider cost. Verified paid direct provider cost is customer-funded at origin cost x 1.20.'});

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_provider_quotes (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,created_by TEXT NOT NULL,provider_key TEXT NOT NULL,mode TEXT NOT NULL,seats INTEGER NOT NULL DEFAULT 0,requires_programmatic_control INTEGER NOT NULL DEFAULT 0,provider_origin_cost_micros INTEGER NOT NULL DEFAULT 0,customer_charge_micros INTEGER NOT NULL DEFAULT 0,markup_percent INTEGER NOT NULL DEFAULT 20,currency TEXT NOT NULL DEFAULT 'USD',status TEXT NOT NULL DEFAULT 'quoted',expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}')`,
  `CREATE TABLE IF NOT EXISTS telecom_provider_payment_events (event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,tenant_id TEXT NOT NULL DEFAULT '',quote_id TEXT NOT NULL DEFAULT '',provider_key TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'received',upstream_payment_ref TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_execution_leases (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,campaign_policy_id TEXT NOT NULL DEFAULT '',conditions_hash TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom fallback schema repair failed',error)}}
}

async function hmacHex(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(secret||'')),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(String(value||'')));return[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}

function publicProvider(provider,user){const base={customer_label:provider.customer_label,kind:provider.kind,free_license:provider.free_license,max_users:provider.max_users,programmatic_control:provider.programmatic_control,automation:provider.automation,note:provider.note};return ownerLike(user)?{...base,provider_key:provider.key}:base}

function providerEligibility(provider,env,body={}){
 if(!provider)return{eligible:false,reason:'UNKNOWN_PROVIDER'};
 const nativeReady=runtimeTrue(env?.TELECOM_NATIVE_WEBRTC_LIVE)&&Boolean(clean(env?.TELECOM_CORE_URL)&&clean(env?.TELECOM_CORE_TOKEN));
 const sipReady=Boolean((clean(env?.VOIP_PROVIDER_URL)&&clean(env?.VOIP_PROVIDER_TOKEN))||(clean(env?.TWILIO_ACCOUNT_SID)&&clean(env?.TWILIO_AUTH_TOKEN)&&clean(env?.TWILIO_PHONE_NUMBER))||(clean(env?.PLIVO_AUTH_ID)&&clean(env?.PLIVO_AUTH_TOKEN)&&clean(env?.PLIVO_PHONE_NUMBER)));
 const aiLicensed=runtimeTrue(env?.THREECX_AI_LICENSED),apiReady=runtimeTrue(env?.THREECX_API_BINDING_READY)||Boolean(clean(env?.THREECX_API_URL)&&clean(env?.THREECX_API_TOKEN));
 const freeSmbReady=runtimeTrue(env?.THREECX_SMB_FREE_READY),freeBasicReady=runtimeTrue(env?.THREECX_BASIC_FREE_READY);
 const seats=Math.max(1,Math.min(100000,Number(body.seats)||1));
 if(provider.max_users&&seats>provider.max_users)return{eligible:false,reason:'PROVIDER_USER_LIMIT'};
 if(provider.key==='magnanimous_native')return{eligible:nativeReady,reason:nativeReady?'READY':'NATIVE_NOT_VERIFIED'};
 if(provider.key==='sip_direct')return{eligible:sipReady,reason:sipReady?'READY':'SIP_ROUTE_NOT_CONFIGURED'};
 if(provider.key==='threecx_ai_api')return{eligible:aiLicensed&&apiReady,reason:aiLicensed&&apiReady?'READY':'THREECX_API_NOT_VERIFIED'};
 if(provider.key==='threecx_smb_free')return{eligible:freeSmbReady,reason:freeSmbReady?'READY':'THREECX_SMB_FREE_NOT_VERIFIED'};
 if(provider.key==='threecx_basic_free')return{eligible:freeBasicReady,reason:freeBasicReady?'READY':'THREECX_BASIC_FREE_NOT_VERIFIED'};
 return{eligible:false,reason:'PROVIDER_NOT_ELIGIBLE'};
}

function chooseProvider(env,body={}){
 const seats=Math.max(1,Math.min(100000,Number(body.seats)||1)),requiresProgrammatic=body.requires_programmatic_control===true,preferFree=body.prefer_free!==false;
 const candidates=requiresProgrammatic
  ? [PROVIDERS.magnanimous_native,PROVIDERS.threecx_ai_api,PROVIDERS.sip_direct]
  : preferFree&&seats<=10
    ? [body.prefer_self_hosted_free===true?PROVIDERS.threecx_basic_free:PROVIDERS.threecx_smb_free,PROVIDERS.magnanimous_native,PROVIDERS.threecx_ai_api,PROVIDERS.sip_direct]
    : [PROVIDERS.magnanimous_native,PROVIDERS.threecx_ai_api,PROVIDERS.sip_direct];
 return candidates.find(provider=>providerEligibility(provider,env,body).eligible)||null;
}

function executionFailClosed(){return{ok:true,execution_authorized:false,blocked_by:['SERVER_DERIVED_EXECUTION_POLICY_REQUIRED'],note:'Telecom execution leasing is fail-closed until campaign consent, DNC, holiday, jurisdiction, caller-identity, carrier and billing state are derived from trusted server records at dial time. Request-supplied compliance booleans cannot authorize a call.'}}
async function authorizeExecution(){return executionFailClosed()}
async function verifyLease(){return{ok:false,execution_authorized:false,reason:'EXECUTION_LEASES_TEMPORARILY_FAIL_CLOSED',blocked_by:['SERVER_DERIVED_EXECUTION_POLICY_REQUIRED']}}

async function createProviderQuote(env,user,body={}){
 if(!ownerLike(user))return{error:'Owner or admin access required.',status:403};
 const requestedKey=clean(body.provider_key),requested=requestedKey?PROVIDERS[requestedKey]:null;
 if(requestedKey&&!requested)return{error:'Unknown fallback provider.',status:400};
 const provider=requested||chooseProvider(env,body);if(!provider)return{error:'No eligible fallback provider is ready for the requested mode.',status:409};
 const eligibility=providerEligibility(provider,env,body);if(!eligibility.eligible)return{error:`Selected provider is not server-verified as ready (${eligibility.reason}).`,status:409};
 const seats=Math.max(1,Math.min(100000,Number(body.seats)||1));if(provider.max_users&&seats>provider.max_users)return{error:`This fallback is limited to ${provider.max_users} users.`,status:409};if(body.requires_programmatic_control===true&&!provider.programmatic_control)return{error:'The selected free fallback does not provide the official programmatic control required for this request.',status:409};
 let origin=dollars(body.provider_origin_cost_usd);if(provider.free_license)origin=0;if(!provider.free_license&&body.pricing_verified!==true)return{error:'Paid upstream origin cost must be verified before a customer quote can be created.',status:409};
 const charge=variableCustomerCharge(origin),quoteId=`tq_${crypto.randomUUID()}`,created=now(),expires=created+Math.max(300,Math.min(86400,Number(body.quote_ttl_seconds)||3600));await ensureSchema(env);
 await env.DB.prepare(`INSERT INTO telecom_provider_quotes(id,tenant_id,created_by,provider_key,mode,seats,requires_programmatic_control,provider_origin_cost_micros,customer_charge_micros,markup_percent,currency,status,expires_at,created_at,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,20,'USD','quoted',?,?,?)`).bind(quoteId,String(user.tenant_id||''),String(user.id||''),provider.key,provider.kind,seats,body.requires_programmatic_control===true?1:0,micros(charge.provider_origin_cost_usd),micros(charge.customer_charge_usd),expires,created,JSON.stringify({source:clean(body.pricing_source).slice(0,500),note:clean(body.note).slice(0,1000)})).run();
 return{quote_id:quoteId,provider:publicProvider(provider,user),customer_charge_usd:charge.customer_charge_usd,owner_pricing:{provider_origin_cost_usd:charge.provider_origin_cost_usd,markup_percent:20,markup_usd:charge.markup_usd},payment_required:charge.customer_charge_usd>0,expires_at:new Date(expires*1000).toISOString()};
}

async function createStripeCheckout(request,env,user,body={}){
 const quoteId=clean(body.quote_id);if(!quoteId)return{error:'quote_id is required.',status:400};await ensureSchema(env);
 const row=await env.DB.prepare('SELECT * FROM telecom_provider_quotes WHERE id=? AND tenant_id=?').bind(quoteId,String(user.tenant_id||'')).first();if(!row||row.status!=='quoted'||Number(row.expires_at)<=now())return{error:'Telecom provider quote is missing, expired, or already used.',status:409};
 const provider=PROVIDERS[row.provider_key],eligibility=providerEligibility(provider,env,{seats:row.seats,requires_programmatic_control:Number(row.requires_programmatic_control)===1});if(!eligibility.eligible)return{error:`Provider readiness changed before checkout (${eligibility.reason}).`,status:409};
 const cents=Math.round(Number(row.customer_charge_micros||0)/10000);if(cents<=0){const changed=await env.DB.prepare("UPDATE telecom_provider_quotes SET status='funded' WHERE id=? AND tenant_id=? AND status='quoted'").bind(quoteId,String(user.tenant_id||'')).run();if(Number(changed?.meta?.changes||0)!==1)return{error:'Quote state changed before funding.',status:409};return{free:true,paid:true,quote_id:quoteId,detail:'No upstream license payment is required for this free fallback. SIP trunk or carrier usage may still require separate funding.'}}
 if(cents<50)return{error:'Stripe requires a larger minimum charge for this currency. Combine this amount with a prepaid telecom top-up.',status:409};if(!env.STRIPE_SECRET_KEY)return{error:'Stripe is not configured.',status:503};
 const reserved=await env.DB.prepare("UPDATE telecom_provider_quotes SET status='checkout_reserving' WHERE id=? AND tenant_id=? AND status='quoted' AND expires_at>?").bind(quoteId,String(user.tenant_id||''),now()).run();if(Number(reserved?.meta?.changes||0)!==1)return{error:'Quote is already being used or has expired.',status:409};
 const origin=clean(env.PUBLIC_SITE_URL||new URL(request.url).origin).replace(/\/$/,'');const form=new URLSearchParams();form.set('mode','payment');form.set('line_items[0][price_data][currency]','usd');form.set('line_items[0][price_data][unit_amount]',String(cents));form.set('line_items[0][price_data][product_data][name]','Magnanimous Telecom provider funding');form.set('line_items[0][quantity]','1');form.set('client_reference_id',String(user.tenant_id||''));form.set('customer_email',String(user.email||''));form.set('metadata[tenant_id]',String(user.tenant_id||''));form.set('metadata[product_type]','telecom_provider_fallback');form.set('metadata[telecom_quote_id]',quoteId);form.set('metadata[provider_key]',String(row.provider_key||''));form.set('success_url',`${origin}/pricing?telecom=success&session_id={CHECKOUT_SESSION_ID}`);form.set('cancel_url',`${origin}/pricing?telecom=cancelled`);
 const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'content-type':'application/x-www-form-urlencoded'},body:form.toString()}),data=await response.json().catch(()=>({}));
 if(!response.ok||!data?.url){await env.DB.prepare("UPDATE telecom_provider_quotes SET status='quoted' WHERE id=? AND tenant_id=? AND status='checkout_reserving'").bind(quoteId,String(user.tenant_id||'')).run();return{error:data?.error?.message||'Stripe could not create telecom provider checkout.',status:502}}
 const committed=await env.DB.prepare("UPDATE telecom_provider_quotes SET status='checkout_created' WHERE id=? AND tenant_id=? AND status='checkout_reserving'").bind(quoteId,String(user.tenant_id||'')).run();if(Number(committed?.meta?.changes||0)!==1)return{error:'Checkout was created but quote state could not be safely committed. Do not retry payment until support reviews the quote.',status:409};
 return{url:data.url,session_id:data.id,quote_id:quoteId,customer_charge_usd:Number(row.customer_charge_micros||0)/1_000_000};
}

function parseStripeSignature(header){const out={t:'',v1:[]};for(const part of String(header||'').split(',')){const[k,...rest]=part.trim().split('='),v=rest.join('=');if(k==='t')out.t=v;if(k==='v1'&&v)out.v1.push(v)}return out}
async function verifyStripe(raw,header,secret){const parsed=parseStripeSignature(header);if(!parsed.t||!parsed.v1.length)return false;const ts=Number(parsed.t);if(!Number.isFinite(ts)||Math.abs(now()-ts)>300)return false;const expected=await hmacHex(secret,`${parsed.t}.${raw}`);return parsed.v1.some(sig=>safeEqual(sig,expected))}

async function payUpstreamIfConfigured(env,quote,eventId){
 const originMicros=Number(quote.provider_origin_cost_micros||0);if(originMicros<=0)return{status:'funded_free',reference:''};if(clean(env.TELECOM_UPSTREAM_AUTO_PAY_ENABLED).toLowerCase()!=='true')return{status:'customer_paid_upstream_pending',reference:''};
 const endpoint=clean(env.TELECOM_UPSTREAM_BILLING_URL),token=clean(env.TELECOM_UPSTREAM_BILLING_TOKEN);if(!endpoint||!token)return{status:'customer_paid_upstream_pending',reference:''};
 let parsed;try{parsed=new URL(endpoint)}catch{return{status:'customer_paid_upstream_manual_review',reference:'',detail:'Invalid upstream billing URL'}}if(parsed.protocol!=='https:')return{status:'customer_paid_upstream_manual_review',reference:'',detail:'Upstream billing URL must use HTTPS'};
 const maxUsd=Math.max(0,Number(env.TELECOM_UPSTREAM_MAX_AUTO_PAY_USD||0)),amountUsd=originMicros/1_000_000;if(!maxUsd||amountUsd>maxUsd)return{status:'customer_paid_upstream_manual_review',reference:''};
 const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','idempotency-key':`magnanimous:${eventId}:${quote.id}`},body:JSON.stringify({quote_id:quote.id,provider_key:quote.provider_key,amount_usd:amountUsd,currency:'USD',tenant_id:quote.tenant_id})}),data=await response.json().catch(()=>({}));if(!response.ok)return{status:'customer_paid_upstream_failed',reference:clean(data?.id||data?.reference),detail:clean(data?.error||data?.detail||`HTTP ${response.status}`)};return{status:'upstream_paid',reference:clean(data?.id||data?.reference||data?.payment_id)};
}

async function recordFailedPayment(env,event,type,object,metadata){const eventId=clean(event?.id),quoteId=clean(metadata.telecom_quote_id),tenantId=clean(metadata.tenant_id||object.client_reference_id);if(!eventId||!quoteId||!tenantId)return;await ensureSchema(env);const seen=await env.DB.prepare('SELECT event_id FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first();if(seen)return;await env.DB.prepare(`INSERT INTO telecom_provider_payment_events(event_id,event_type,tenant_id,quote_id,provider_key,status,detail_json,created_at,updated_at) VALUES(?,?,?,?,?,'payment_failed','{}',?,?)`).bind(eventId,type,tenantId,quoteId,clean(metadata.provider_key),now(),now()).run();await env.DB.prepare("UPDATE telecom_provider_quotes SET status='payment_failed' WHERE id=? AND tenant_id=? AND status IN ('checkout_created','checkout_reserving')").bind(quoteId,tenantId).run()}

async function processStripeProviderEvent(env,event){
 const type=clean(event?.type),object=event?.data?.object||{},metadata=object?.metadata||{};if(clean(metadata.product_type)!=='telecom_provider_fallback')return;if(type==='checkout.session.async_payment_failed'){await recordFailedPayment(env,event,type,object,metadata);return}if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(type))return;if(!['paid','no_payment_required'].includes(clean(object.payment_status)))return;
 const eventId=clean(event?.id),quoteId=clean(metadata.telecom_quote_id),tenantId=clean(metadata.tenant_id||object.client_reference_id);if(!eventId||!quoteId||!tenantId)return;await ensureSchema(env);const seen=await env.DB.prepare('SELECT event_id FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first();if(seen)return;
 const quote=await env.DB.prepare('SELECT * FROM telecom_provider_quotes WHERE id=? AND tenant_id=?').bind(quoteId,tenantId).first();if(!quote){await env.DB.prepare(`INSERT INTO telecom_provider_payment_events(event_id,event_type,tenant_id,quote_id,status,detail_json,created_at,updated_at) VALUES(?,?,?,?,?,'{}',?,?)`).bind(eventId,type,tenantId,quoteId,'quote_missing',now(),now()).run();return}if(Number(quote.expires_at)<=now()){await env.DB.prepare(`INSERT INTO telecom_provider_payment_events(event_id,event_type,tenant_id,quote_id,provider_key,status,detail_json,created_at,updated_at) VALUES(?,?,?,?,?,'customer_paid_expired_quote','{}',?,?)`).bind(eventId,type,tenantId,quoteId,quote.provider_key,now(),now()).run();await env.DB.prepare("UPDATE telecom_provider_quotes SET status='customer_paid_review_required' WHERE id=? AND tenant_id=?").bind(quoteId,tenantId).run();return}
 await env.DB.prepare(`INSERT INTO telecom_provider_payment_events(event_id,event_type,tenant_id,quote_id,provider_key,status,detail_json,created_at,updated_at) VALUES(?,?,?,?,?,'customer_paid','{}',?,?)`).bind(eventId,type,tenantId,quoteId,quote.provider_key,now(),now()).run();const upstream=await payUpstreamIfConfigured(env,quote,eventId);await env.DB.prepare('UPDATE telecom_provider_payment_events SET status=?,upstream_payment_ref=?,detail_json=?,updated_at=? WHERE event_id=?').bind(upstream.status,upstream.reference||'',JSON.stringify({detail:upstream.detail||''}),now(),eventId).run();await env.DB.prepare('UPDATE telecom_provider_quotes SET status=? WHERE id=? AND tenant_id=?').bind(upstream.status==='upstream_paid'||upstream.status==='funded_free'?'funded':'customer_paid',quoteId,tenantId).run();
}

export async function observeMagnanimousTelecomProviderPayment(request,env,ctx){const url=new URL(request.url);if(url.pathname!=='/api/billing/webhook'||request.method!=='POST')return;const secret=clean(env?.STRIPE_WEBHOOK_SECRET);if(!secret)return;const clone=request.clone(),raw=await clone.text(),signature=clone.headers.get('stripe-signature')||'';if(!await verifyStripe(raw,signature,secret))return;let event;try{event=JSON.parse(raw)}catch{return}const task=processStripeProviderEvent(env,event).catch(error=>console.error('telecom provider payment observer failed',error));if(ctx?.waitUntil)ctx.waitUntil(task);else await task}

export async function handleMagnanimousTelecomProviderFallback(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/telecom/provider-fallback')&&!path.startsWith('/api/telecom/execution'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);await ensureSchema(env);
 if(path==='/api/telecom/provider-fallback/capabilities'&&request.method==='GET')return json({version:TELECOM_FALLBACK_VERSION,identity:CUSTOMER_PROVIDER_POLICY,providers:ownerLike(user)?Object.values(PROVIDERS).map(p=>publicProvider(p,user)):[],customer_view:{service:'Magnanimous Telecom',provider_selection:'internal'},threecx_free_limit_users:10,threecx_free_programmatic_api:false,threecx_call_control_requirement:'8SC+ AI license',payment_bridge:{stripe_checkout:true,origin_cost_markup_percent:20,automatic_upstream_payment:'available only when a contracted upstream billing endpoint, token, and owner auto-pay limit are configured'},execution_lease:{state:'fail_closed',reason:'server-derived campaign compliance integration required'}});
 if(path==='/api/telecom/provider-fallback/plan'&&request.method==='POST'){const body=await request.json().catch(()=>({})),provider=chooseProvider(env,body);if(!provider)return json({ok:false,route_ready:false,reason:'NO_ELIGIBLE_FALLBACK',detail:'No server-verified fallback matching the requested automation level is configured.'},409);return json({ok:true,route_ready:true,provider:publicProvider(provider,user),customer_presentation:{service:'Magnanimous Telecom'},constraints:{preserve_required_vendor_attribution:true,no_false_ownership_claims:true}})}
 if(path==='/api/telecom/provider-fallback/quote'&&request.method==='POST'){const result=await createProviderQuote(env,user,await request.json().catch(()=>({})));return result?.error?json({detail:result.error},result.status||400):json(result)}
 if(path==='/api/telecom/provider-fallback/checkout'&&request.method==='POST'){const result=await createStripeCheckout(request,env,user,await request.json().catch(()=>({})));return result?.error?json({detail:result.error},result.status||400):json(result)}
 if(path==='/api/telecom/provider-fallback/payment-status'&&request.method==='GET'){const quoteId=clean(url.searchParams.get('quote_id'));if(!quoteId)return json({detail:'quote_id is required.'},400);const quote=await env.DB.prepare('SELECT id,provider_key,status,customer_charge_micros,expires_at FROM telecom_provider_quotes WHERE id=? AND tenant_id=?').bind(quoteId,String(user.tenant_id||'')).first();if(!quote)return json({detail:'Quote not found.'},404);const payment=await env.DB.prepare('SELECT status,upstream_payment_ref,updated_at FROM telecom_provider_payment_events WHERE quote_id=? AND tenant_id=? ORDER BY updated_at DESC LIMIT 1').bind(quoteId,String(user.tenant_id||'')).first();const out={quote_id:quote.id,status:quote.status,customer_charge_usd:Number(quote.customer_charge_micros||0)/1_000_000,payment:payment?{status:payment.status,updated_at:payment.updated_at}:null};if(ownerLike(user))out.owner_provider_key=quote.provider_key;return json(out)}
 if(path==='/api/telecom/execution/authorize'&&request.method==='POST')return json(await authorizeExecution(env,user,await request.json().catch(()=>({}))));
 if(path==='/api/telecom/execution/verify'&&request.method==='POST')return json(await verifyLease(env,user,await request.json().catch(()=>({}))),403);
 return json({detail:'Not found.'},404);
}
