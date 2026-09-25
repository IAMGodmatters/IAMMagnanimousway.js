import {currentUserFromRequest,canUsePremium,recordUsage} from './usage-guard.js';
import {PROVIDER_PRICE_MARKUP_PERCENT,voiceOriginCost} from './provider-origin-pricing.js';

const MAX_CHARS=4000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const enabled=env=>String(env?.ENABLE_PREMIUM_VOICE||'').toLowerCase()==='true';
const commercial=env=>String(env?.ELEVENLABS_COMMERCIAL_PLAN_CONFIRMED||'').toLowerCase()==='true';
const configured=env=>enabled(env)&&commercial(env)&&Boolean(String(env?.ELEVENLABS_API_KEY||'').trim())&&Boolean(String(env?.ELEVENLABS_VOICE_ID||'').trim());
const codePoints=value=>Array.from(String(value||'')).length;

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS premium_voice_requests(
  idempotency_key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  provider_request_id TEXT NOT NULL DEFAULT '',
  provider_origin_cost_usd REAL NOT NULL DEFAULT 0,
  customer_charge_usd REAL NOT NULL DEFAULT 0,
  characters INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,idempotency_key)
 )`).run();
}

function config(env){
 const price=voiceOriginCost({provider:'elevenlabs-v3',characters:1000});
 return{
  identity:'Magnanimous AI',
  free_default:{mode:'browser-native',available:true,provider_origin_cost_usd:0,customer_charge_usd:0},
  premium:{
   available:configured(env),
   enabled:enabled(env),
   commercial_rights_confirmed:commercial(env),
   provider_details_private:true,
   max_characters:MAX_CHARS,
   customer_variable_rate_usd_per_1000_characters:price.ok?price.customer_charge_usd:null,
   markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,
   requires_funded_usage:true
  }
 };
}

async function generate(request,env){
 if(!configured(env))return json({detail:'Premium voice is not enabled for commercial use. Browser-native Magnanimous voice remains available at no provider cost.',code:'PREMIUM_VOICE_NOT_CONFIGURED',free_browser_voice:true},503);
 if(!env?.DB)return json({detail:'Premium usage accounting is unavailable. Browser-native Magnanimous voice remains available.',code:'BILLING_LEDGER_UNAVAILABLE',free_browser_voice:true},503);
 const user=await currentUserFromRequest(request,env);
 if(!user)return json({detail:'Sign in to use optional premium voice. Browser-native Magnanimous voice remains available.',code:'SIGN_IN_REQUIRED',free_browser_voice:true},401);
 const body=await request.clone().json().catch(()=>({}));
 const text=String(body.text||'').trim(),characters=codePoints(text);
 if(!text)return json({detail:'Text is required.',code:'TEXT_REQUIRED'},400);
 if(characters>MAX_CHARS)return json({detail:`Premium voice is limited to ${MAX_CHARS} characters per request so usage stays predictable.`,code:'VOICE_TEXT_TOO_LONG',max_characters:MAX_CHARS},413);

 const priced=voiceOriginCost({provider:'elevenlabs-v3',characters});
 if(!priced.ok)return json({detail:'Current premium voice pricing is not verified. Browser-native Magnanimous voice remains available.',code:priced.code||'VOICE_PRICING_NOT_VERIFIED',free_browser_voice:true},503);
 const gate=await canUsePremium(env,user.tenant_id,{category:'premium voice',estimated_provider_origin_cost_usd:priced.provider_origin_cost_usd,required_plan:'business',entitlement:'metered_ai'});
 if(!gate.ok)return json({detail:gate.detail,code:gate.code,prepaid_balance_usd:gate.prepaid_balance_usd,estimated_customer_charge_usd:gate.estimated_variable_customer_charge_usd,free_browser_voice:true},402);

 const idempotencyKey=String(request.headers.get('idempotency-key')||body.idempotency_key||crypto.randomUUID()).trim().slice(0,160);
 await ensureSchema(env);
 const ts=Math.floor(Date.now()/1000);
 try{
  await env.DB.prepare('INSERT INTO premium_voice_requests(idempotency_key,tenant_id,user_id,status,provider_origin_cost_usd,customer_charge_usd,characters,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
   .bind(idempotencyKey,String(user.tenant_id),String(user.id),'started',priced.provider_origin_cost_usd,priced.customer_charge_usd,characters,ts,ts).run();
 }catch(error){
  const duplicate=await env.DB.prepare('SELECT status FROM premium_voice_requests WHERE tenant_id=? AND idempotency_key=?').bind(String(user.tenant_id),idempotencyKey).first().catch(()=>null);
  if(duplicate)return json({detail:'This premium voice request was already submitted. Use a new request id for new speech.',code:'DUPLICATE_VOICE_REQUEST',status:duplicate.status,free_browser_voice:true},409);
  throw error;
 }

 const voiceId=encodeURIComponent(String(env.ELEVENLABS_VOICE_ID).trim());
 let response;
 try{
  response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,{
   method:'POST',
   headers:{'content-type':'application/json','xi-api-key':String(env.ELEVENLABS_API_KEY)},
   body:JSON.stringify({text,model_id:'eleven_v3'})
  });
 }catch(error){
  await env.DB.prepare('UPDATE premium_voice_requests SET status=?,updated_at=? WHERE tenant_id=? AND idempotency_key=?').bind('transport_failed',Math.floor(Date.now()/1000),String(user.tenant_id),idempotencyKey).run().catch(()=>null);
  return json({detail:'Premium voice transport failed. Browser-native Magnanimous voice remains available.',code:'PREMIUM_VOICE_TRANSPORT_FAILED',free_browser_voice:true},502);
 }

 if(!response.ok){
  const detail=String((await response.clone().text().catch(()=>''))||'').slice(0,300);
  await env.DB.prepare('UPDATE premium_voice_requests SET status=?,updated_at=? WHERE tenant_id=? AND idempotency_key=?').bind('provider_failed',Math.floor(Date.now()/1000),String(user.tenant_id),idempotencyKey).run().catch(()=>null);
  return json({detail:'Premium voice could not synthesize this request. Browser-native Magnanimous voice remains available.',code:'PREMIUM_VOICE_FAILED',provider_status:response.status,diagnostic:detail?undefined:undefined,free_browser_voice:true},502);
 }

 const providerRequestId=String(response.headers.get('request-id')||response.headers.get('x-request-id')||'').slice(0,160);
 try{
  await recordUsage(env,user.tenant_id,{
   category:'premium-voice',
   provider:'managed-premium-voice',
   units:characters,
   provider_origin_cost_usd:priced.provider_origin_cost_usd,
   reference_id:`voice:${idempotencyKey}`,
   pricing_source:priced.pricing_source,
   pricing_verified_at:priced.pricing_verified_at
  });
  await env.DB.prepare('UPDATE premium_voice_requests SET status=?,provider_request_id=?,updated_at=? WHERE tenant_id=? AND idempotency_key=?')
   .bind('completed',providerRequestId,Math.floor(Date.now()/1000),String(user.tenant_id),idempotencyKey).run();
 }catch(error){
  await env.DB.prepare('UPDATE premium_voice_requests SET status=?,provider_request_id=?,updated_at=? WHERE tenant_id=? AND idempotency_key=?')
   .bind('billing_reconciliation_failed',providerRequestId,Math.floor(Date.now()/1000),String(user.tenant_id),idempotencyKey).run().catch(()=>null);
  console.error('premium voice billing reconciliation failed',error);
  return json({detail:'Premium voice was generated but billing verification did not complete, so the audio was withheld and owner attention is required.',code:'PREMIUM_VOICE_BILLING_RECONCILIATION_FAILED',free_browser_voice:true},502);
 }

 const headers=new Headers({
  'content-type':response.headers.get('content-type')||'audio/mpeg',
  'cache-control':'no-store',
  'x-magnanimous-voice':'premium',
  'x-magnanimous-origin-cost-usd':String(priced.provider_origin_cost_usd),
  'x-magnanimous-customer-charge-usd':String(priced.customer_charge_usd),
  'x-magnanimous-markup-percent':String(PROVIDER_PRICE_MARKUP_PERCENT),
  'x-magnanimous-request-id':idempotencyKey
 });
 return new Response(response.body,{status:200,headers});
}

export async function handlePremiumVoice(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/voice/premium-tts/config'&&request.method==='GET')return json(config(env));
 if(path==='/api/voice/premium-tts'&&request.method==='POST')return generate(request,env);
 if(path.startsWith('/api/voice/premium-tts'))return json({detail:'Method not allowed.'},405);
 return null;
}

export function premiumVoiceHealth(env){
 const cfg=config(env);
 return{
  status:cfg.premium.available?'optional-premium-ready':'browser-native-default',
  free_default:true,
  server_synthesis_required:false,
  premium_available:cfg.premium.available,
  commercial_rights_confirmed:cfg.premium.commercial_rights_confirmed,
  premium_customer_rate_usd_per_1000_characters:cfg.premium.customer_variable_rate_usd_per_1000_characters,
  markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,
  provider_details_private:true
 };
}
