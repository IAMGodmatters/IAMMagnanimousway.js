import { canUsePremium,currentUserFromRequest,estimatePstnReserveUsd,recordUsage } from './usage-guard.js';
import {conservativeProviderReserve,providerBillingMode} from './provider-origin-pricing.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(message,status=200)=>new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${String(message).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</Say><Hangup/></Response>`,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
// Treat every outside AI account that can accrue usage charges as metered at
// the I AM boundary, even when the provider also offers a free/trial allowance.
const METERED_AI=new Set(['openai','anthropic','google','groq','mistral']);

async function bodyJson(request){try{return await request.clone().json()}catch{return{}}}
function rewriteJsonRequest(request,body){return new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify(body)})}
async function inboundTenant(env){
 let tenantId=String(env.TWILIO_DEFAULT_TENANT_ID||'').trim();
 if(!tenantId){try{const owner=await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' LIMIT 1").first();tenantId=String(owner?.id||'')}catch(_){}}
 return tenantId;
}

export async function premiumPreflight(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!env?.DB)return{request,context:null};
 const user=await currentUserFromRequest(request,env);
 if(path==='/api/chat'&&request.method==='POST'){
  const body=await bodyJson(request),provider=String(body.provider||'auto').toLowerCase(),quality=String(body.quality||body.route_policy||'').toLowerCase();
  const explicitlyMetered=METERED_AI.has(provider),asksMaximum=['max','maximum','quality'].includes(quality);

  // Default Free requests are pinned to I AM's own free-first Cloudflare path.
  // This prevents a third-party free quota from silently rolling into charges.
  if(!explicitlyMetered&&!asksMaximum){
   if(provider==='auto'||!provider){
    const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',quality:'free-first',route_policy:'free-first'});
    return{request:rewritten,context:user?{kind:'chat',user,free_first:true}:null};
   }
   return{request,context:user?{kind:'chat',user}:null};
  }

  if(!user){
   if(explicitlyMetered)return{response:json({detail:'Sign in and purchase an eligible I AM plan before using premium AI. Free-first Magnanimous AI remains available.',code:'I_AM_PURCHASE_REQUIRED',provider_checkout_required:false},401)};
   const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:null};
  }

  const model=String(body.model||(
   provider==='openai'?env.OPENAI_MODEL||'gpt-5.6':
   provider==='anthropic'?env.ANTHROPIC_MODEL||'claude-sonnet-5':
   provider==='google'?env.GOOGLE_MODEL||'gemini-3.8-flash':
   provider==='groq'?env.GROQ_MODEL||'openai/gpt-oss-120b':
   provider==='mistral'?env.MISTRAL_MODEL||'mistral-large-latest':''
  ));
  const reserve=explicitlyMetered?conservativeProviderReserve({provider,model,input_text:String(body.message||''),max_output_tokens:4096,billing_mode:providerBillingMode(env,provider)}):{ok:true,provider_origin_cost_usd:0};
  if(explicitlyMetered&&!reserve.ok)return{response:json({detail:'Premium provider pricing is not verified for this request. Free-first Magnanimous AI remains available.',code:reserve.code||'PRICING_NOT_VERIFIED',free_first_available:true,provider_checkout_required:false},402)};
  const estimate=Number(reserve.provider_origin_cost_usd||0);
  const gate=await canUsePremium(env,user.tenant_id,{category:'premium AI',estimated_cost_usd:estimate,required_plan:'business',entitlement:'metered_ai'});
  if(!gate.ok){
   if(explicitlyMetered)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,prepaid_balance_usd:gate.prepaid_balance_usd,free_first_available:true,provider_checkout_required:false,billing_owner:'I AM Magnanimous Way'},402)};
   const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:{kind:'chat',user,downgraded_to_free_first:true}};
  }
  return{request,context:{kind:'chat',user,premium_allowed:true,estimated_cost_usd:estimate}};
 }
 if((path==='/api/phone/calls/outbound'||path==='/api/voice-agent/call')&&request.method==='POST'){
  if(!user)return{response:json({detail:'Sign in required.',code:'SIGN_IN_REQUIRED'},401)};
  const body=await bodyJson(request),seconds=Math.min(Math.max(Number(body.time_limit_seconds||900),60),3600),reserve=estimatePstnReserveUsd(seconds);
  const gate=await canUsePremium(env,user.tenant_id,{category:'carrier calling',estimated_cost_usd:reserve,required_plan:'business',entitlement:'pstn_minutes'});
  if(!gate.ok)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,free_browser_calling:true,provider_checkout_required:false,billing_owner:'I AM Magnanimous Way'},402)};
  return{request,context:{kind:'pstn',user,reserve,seconds}};
 }
 if((path==='/api/voice-agent/twilio/incoming'||path==='/api/contact-center/twilio/incoming')&&request.method==='POST'){
  const tenantId=await inboundTenant(env);
  if(!tenantId)return{response:xml('The AI receptionist is not assigned yet.',503)};
  const reserve=0.5;
  const gate=await canUsePremium(env,tenantId,{category:'inbound carrier calling',estimated_cost_usd:reserve,required_plan:'business',entitlement:'pstn_minutes'});
  if(!gate.ok)return{response:xml('This carrier contact center is not enabled for this workspace. Please use the free browser calling option or contact the business another way.')};
  return{request,context:{kind:'pstn-inbound',user:{tenant_id:tenantId},reserve,seconds:60}};
 }
 if(path==='/api/voice-agent/avatar'&&request.method==='POST'){
  if(!user)return{response:json({detail:'Sign in required.',code:'SIGN_IN_REQUIRED'},401)};
  const reserve=0.5;
  const gate=await canUsePremium(env,user.tenant_id,{category:'real-time avatar video',estimated_cost_usd:reserve,required_plan:'business',entitlement:'avatar_minutes'});
  if(!gate.ok)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,free_browser_avatar:true,provider_checkout_required:false,billing_owner:'I AM Magnanimous Way'},402)};
  return{request,context:{kind:'avatar',user,reserve}};
 }
 return{request,context:null};
}

export async function premiumPostprocess(response,env,context){
 if(!context?.user||!response?.ok)return response;
 try{
  const data=await response.clone().json().catch(()=>({}));
  if(context.kind==='chat'){
   // AI origin-cost accounting is owned by the provider runtime, which has the
   // provider's exact token-usage response. Do not double-charge here.
   return response;
  }
  const origin=Math.max(0,Number(data?.provider_origin_cost_usd||0));
  const pricingSource=String(data?.pricing_source||''),pricingVerifiedAt=String(data?.pricing_verified_at||'');
  if(origin<=0||!pricingSource||!pricingVerifiedAt){
   console.warn('Premium provider completed without auditable origin-cost evidence; reserve was not posted as actual usage.',{kind:context.kind});
   return response;
  }
  const provider=String(data?.provider||data?.provider_id||'managed-provider');
  const reference=String(data?.provider_call_id||data?.call_id||data?.conversation_id||crypto.randomUUID());
  const units=context.kind==='pstn'?Number(context.seconds||0)/60:1;
  await recordUsage(env,context.user.tenant_id,{
   category:context.kind==='pstn'?'pstn-call':context.kind==='pstn-inbound'?'pstn-inbound':'avatar-video',
   provider,units,direct_cost_usd:origin,reference_id:reference,
   pricing_source:pricingSource,pricing_verified_at:pricingVerifiedAt
  });
 }catch(error){console.error('premium usage reconciliation failed',error)}
 return response;
}
