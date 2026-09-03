import { canUsePremium,currentUserFromRequest,estimateAiCostUsd,estimatePstnReserveUsd,recordUsage } from './usage-guard.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(message,status=200)=>new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${String(message).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</Say><Hangup/></Response>`,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
const METERED_AI=new Set(['openai','anthropic']);

async function bodyJson(request){try{return await request.clone().json()}catch{return{}}}
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
  if(!explicitlyMetered&&!asksMaximum)return{request,context:user?{kind:'chat',user}:null};
  if(!user){
   if(explicitlyMetered)return{response:json({detail:'Sign in to use metered premium AI. Free-first Magnanimous AI remains available without premium inference.',code:'SIGN_IN_REQUIRED'},401)};
   const rewritten=new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify({...body,quality:'free-first',route_policy:'free-first'})});
   return{request:rewritten,context:null};
  }
  const estimate=explicitlyMetered?estimateAiCostUsd(provider):0.04;
  const gate=await canUsePremium(env,user.tenant_id,{category:'premium AI',estimated_cost_usd:estimate,required_plan:'business',entitlement:'metered_ai'});
  if(!gate.ok){
   if(explicitlyMetered)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,free_first_available:true},402)};
   const rewritten=new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify({...body,quality:'free-first',route_policy:'free-first'})});
   return{request:rewritten,context:{kind:'chat',user,downgraded_to_free_first:true}};
  }
  return{request,context:{kind:'chat',user,premium_allowed:true}};
 }
 if((path==='/api/phone/calls/outbound'||path==='/api/voice-agent/call')&&request.method==='POST'){
  if(!user)return{response:json({detail:'Sign in required.',code:'SIGN_IN_REQUIRED'},401)};
  const body=await bodyJson(request),seconds=Math.min(Math.max(Number(body.time_limit_seconds||900),60),3600),reserve=estimatePstnReserveUsd(seconds);
  const gate=await canUsePremium(env,user.tenant_id,{category:'carrier calling',estimated_cost_usd:reserve,required_plan:'business',entitlement:'pstn_minutes'});
  if(!gate.ok)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,free_browser_calling:true},402)};
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
  if(!gate.ok)return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,free_browser_avatar:true},402)};
  return{request,context:{kind:'avatar',user,reserve}};
 }
 return{request,context:null};
}

export async function premiumPostprocess(response,env,context){
 if(!context?.user||!response?.ok)return response;
 try{
  const data=await response.clone().json().catch(()=>({}));
  if(context.kind==='chat'){
   const provider=String(data?.provider||'').toLowerCase(),cost=estimateAiCostUsd(provider);
   if(cost>0)await recordUsage(env,context.user.tenant_id,{category:'premium-ai',provider,units:1,direct_cost_usd:cost,reference_id:String(data?.model||'')});
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