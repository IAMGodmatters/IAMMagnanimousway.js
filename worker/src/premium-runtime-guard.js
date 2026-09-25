import { canUsePremium,currentUserFromRequest,estimateAiCostUsd,estimatePstnReserveUsd,recordUsage } from './usage-guard.js';
import { CUSTOMER_MARKUP_PERCENT, markedUp, tokenQuote } from './magnanimous-provider-economics.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(message,status=200)=>new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${String(message).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</Say><Hangup/></Response>`,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
// Treat every outside AI account that can accrue usage charges as metered at
// the I AM boundary, even when the provider also offers a free/trial allowance.
const METERED_AI=new Set(['openai','anthropic','google','groq','mistral','cerebras']);

async function bodyJson(request){try{return await request.clone().json()}catch{return{}}}
function rewriteJsonRequest(request,body,{premium=false}={}){const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');headers.delete('x-magnanimous-premium-authorized');if(premium)headers.set('x-magnanimous-premium-authorized','1');return new Request(request.url,{method:request.method,headers,body:JSON.stringify(body)})}
function premiumEstimate(body,provider){
 const quality=String(body.quality||body.route_policy||'').toLowerCase();
 const input_tokens=Math.min(50000,Math.max(4000,Math.ceil(String(body.message||'').length/3)+8000)),output_tokens=1400;
 if(provider==='openai'||(provider==='auto'&&['economy','premium-economy','quality','premium-quality','max','maximum','premium-maximum'].includes(quality))){
  const model=['max','maximum','premium-maximum'].includes(quality)?'gpt-6-astra':['quality','premium-quality'].includes(quality)?'gpt-6-sol':'gpt-6-luna';
  return tokenQuote(`openai:${model}`,{input_tokens,output_tokens});
 }
 if(provider==='google')return tokenQuote('google:gemini-3.8-flash',{input_tokens,output_tokens});
 const origin=Math.max(.01,estimateAiCostUsd(provider));return{origin_cost_usd:origin,customer_charge_usd:markedUp(origin),markup_percent:CUSTOMER_MARKUP_PERCENT};
}
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
  const explicitlyMetered=METERED_AI.has(provider),asksPremium=['economy','premium-economy','quality','premium-quality','max','maximum','premium-maximum'].includes(quality);
  const cleanRequest=rewriteJsonRequest(request,body);

  // Default Free requests are pinned to I AM's own free-first Cloudflare path.
  // This prevents a third-party free quota from silently rolling into charges.
  if(!explicitlyMetered&&!asksPremium){
   if(provider==='auto'||!provider){
    const rewritten=rewriteJsonRequest(request,{...body,provider:'auto',quality:'free-first',route_policy:'free-first'});
    return{request:rewritten,context:user?{kind:'chat',user,free_first:true}:null};
   }
   return{request:cleanRequest,context:user?{kind:'chat',user}:null};
  }

  if(!user){
   if(explicitlyMetered)return{response:json({detail:'Sign in and purchase an eligible I AM plan before using premium AI. Free-first Magnanimous AI remains available.',code:'I_AM_PURCHASE_REQUIRED',provider_checkout_required:false},401)};
   const rewritten=rewriteJsonRequest(request,{...body,provider:'auto',quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:null};
  }

  const quote=premiumEstimate(body,explicitlyMetered?provider:'auto');
  const gate=await canUsePremium(env,user.tenant_id,{category:'premium AI',estimated_cost_usd:quote.origin_cost_usd,estimated_customer_charge_usd:quote.customer_charge_usd,required_plan:'plus',entitlement:'metered_ai'});
  if(!gate.ok){
   if(explicitlyMetered)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,prepaid_balance_usd:gate.prepaid_balance_usd,free_first_available:true,provider_checkout_required:false,billing_owner:'I AM Magnanimous Way'},402)};
   const rewritten=rewriteJsonRequest(request,{...body,provider:'auto',quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:{kind:'chat',user,downgraded_to_free_first:true}};
  }
  return{request:rewriteJsonRequest(request,body,{premium:true}),context:{kind:'chat',user,premium_allowed:true,estimated_cost_usd:quote.origin_cost_usd,estimated_customer_charge_usd:quote.customer_charge_usd,markup_percent:CUSTOMER_MARKUP_PERCENT}};
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
   const provider=String(data?.provider||'').toLowerCase(),origin=Number(data?.origin_cost_usd||estimateAiCostUsd(provider)||0),charge=Number(data?.customer_charge_usd||markedUp(origin)),markup=Number(data?.markup_percent||CUSTOMER_MARKUP_PERCENT);
   if(origin>0)await recordUsage(env,context.user.tenant_id,{category:'premium-ai',provider:'private-premium-ai',units:1,direct_cost_usd:origin,customer_charge_usd:charge,markup_percent:markup,reference_id:String(data?.model||'')});
  }else if(context.kind==='pstn'){
   await recordUsage(env,context.user.tenant_id,{category:'pstn-call-reserve',provider:String(data?.provider||'twilio-ai'),units:Number(context.seconds||0)/60,direct_cost_usd:Number(context.reserve||0),reference_id:String(data?.provider_call_id||data?.call_id||'')});
  }else if(context.kind==='pstn-inbound'){
   await recordUsage(env,context.user.tenant_id,{category:'pstn-inbound-reserve',provider:'twilio-contact-center',units:1,direct_cost_usd:Number(context.reserve||0),reference_id:''});
  }else if(context.kind==='avatar'){
   await recordUsage(env,context.user.tenant_id,{category:'avatar-video-reserve',provider:String(data?.provider||'tavus'),units:1,direct_cost_usd:Number(context.reserve||0),reference_id:String(data?.conversation_id||'')});
  }
 }catch(error){console.error('premium usage recording failed',error)}
 return response;
}
