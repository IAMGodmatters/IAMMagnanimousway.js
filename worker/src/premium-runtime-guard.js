import { canUsePremium,currentUserFromRequest,estimatePstnReserveUsd,recordUsage } from './usage-guard.js';
import { aiProductForQuality,aiProductForModel,estimateTokens,quotePremiumAi } from './magnanimous-metered-catalog.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const xml=(message,status=200)=>new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${String(message).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</Say><Hangup/></Response>`,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
// Treat every outside AI account that can accrue usage charges as metered at
// the I AM boundary, even when the provider also offers a free/trial allowance.
const METERED_AI=new Set(['openai','anthropic','google','groq','mistral','cerebras']);

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
  const body=await bodyJson(request),quality=String(body.quality||body.route_policy||'').toLowerCase();
  const asksPremium=['premium','premium-fast','premium-max','hq','max','maximum','quality'].includes(quality);
  const freeModel=String(env?.CLOUDFLARE_AI_MODEL||'@cf/zai-org/glm-4.7-flash').trim();

  if(!asksPremium){
   const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',model:freeModel,quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:user?{kind:'chat',user,free_first:true}:null};
  }

  if(!user){
   const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',model:freeModel,quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:null};
  }

  if(String(env?.ENABLE_METERED_PROVIDERS||'').toLowerCase()!=='true'){
   const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',model:freeModel,quality:'free-first',route_policy:'free-first'});
   return{request:rewritten,context:{kind:'chat',user,downgraded_to_free_first:true,premium_runtime_disabled:true}};
  }

  const product=aiProductForQuality(quality),inputTokens=estimateTokens(body.message||''),outputTokens=Math.max(64,Math.min(4096,Number(body.max_output_tokens||body.max_tokens||1400)||1400));
  const quote=quotePremiumAi(product,{input_tokens:inputTokens,output_tokens:outputTokens});
  const gate=await canUsePremium(env,user.tenant_id,{category:product.public_name,estimated_cost_usd:quote.customer_charge_usd,required_plan:'business',entitlement:'metered_ai'});
  if(!gate.ok){
   return{response:json({detail:gate.detail,code:gate.code,plan:gate.plan,remaining_cost_usd:gate.remaining_cost_usd,prepaid_balance_usd:gate.prepaid_balance_usd,free_first_available:true,billing_owner:'I AM Magnanimous Way'},402)};
  }

  const rewritten=rewriteJsonRequest(request,{...body,provider:'cloudflare-ai',model:product.model,quality:'premium-capped',route_policy:'premium-capped'});
  return{request:rewritten,context:{kind:'chat',user,premium_allowed:true,premium_product:product,input_token_estimate:inputTokens,output_token_reserve:outputTokens,estimated_customer_charge_usd:quote.customer_charge_usd}};
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
   const matched=aiProductForModel(data?.model||'');
   if(context.premium_allowed&&matched){
    const [,product]=matched,usage=data?.usage||{};
    const inputTokens=Math.max(1,Number(usage.input_tokens||usage.prompt_tokens||context.input_token_estimate||1));
    const cachedTokens=Math.max(0,Number(usage.cached_input_tokens||usage.cached_tokens||0));
    const outputTokens=Math.max(1,Number(usage.output_tokens||usage.completion_tokens||estimateTokens(data?.output||'')));
    const quote=quotePremiumAi(product,{input_tokens:inputTokens,cached_input_tokens:cachedTokens,output_tokens:outputTokens});
    await recordUsage(env,context.user.tenant_id,{category:'premium-ai',provider:product.origin_provider,units:inputTokens+outputTokens,direct_cost_usd:quote.origin_cost_usd,customer_charge_usd:quote.customer_charge_usd,markup_percent:quote.markup_percent,origin_ref:product.model,reference_id:crypto.randomUUID()});
    const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
    return new Response(JSON.stringify({...data,premium_usage:{product:product.public_name,base_infrastructure_cost_usd:Number(quote.origin_cost_usd.toFixed(6)),markup_percent:quote.markup_percent,markup_usd:Number(quote.markup_usd.toFixed(6)),customer_charge_usd:Number(quote.customer_charge_usd.toFixed(6)),prepaid_and_capped:true}}),{status:response.status,statusText:response.statusText,headers});
   }
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
