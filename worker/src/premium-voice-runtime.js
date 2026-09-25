import { currentUserFromRequest,canUsePremium,recordUsage } from './usage-guard.js';
import { PREMIUM_VOICE_PRODUCT,quotePremiumVoice } from './magnanimous-metered-catalog.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function enabled(env){return String(env?.ENABLE_METERED_PROVIDERS||'').toLowerCase()==='true'}
function cleanText(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,5000)}

export async function handleMagnanimousPremiumVoice(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/magnanimous/voice/premium')return null;
 if(request.method!=='POST')return json({detail:'Method not allowed.'},405);
 const user=await currentUserFromRequest(request,env);
 if(!user)return json({detail:'Sign in to use Magnanimous HQ Voice.',code:'SIGN_IN_REQUIRED'},401);
 if(!enabled(env))return json({detail:'Magnanimous HQ Voice is not enabled for metered use yet. Free browser voice remains available.',code:'PREMIUM_RUNTIME_DISABLED',free_voice_available:true},409);
 const key=String(env?.ELEVENLABS_API_KEY||'').trim(),voiceId=String(env?.ELEVENLABS_VOICE_ID||'').trim();
 if(!key||!voiceId)return json({detail:'Magnanimous HQ Voice is not configured yet. Free browser voice remains available.',code:'PREMIUM_VOICE_NOT_CONFIGURED',free_voice_available:true},503);
 const body=await request.json().catch(()=>({})),text=cleanText(body.text);
 if(!text)return json({detail:'Text is required.'},400);
 const quote=quotePremiumVoice(text.length);
 const gate=await canUsePremium(env,user.tenant_id,{category:'Magnanimous HQ Voice',estimated_cost_usd:quote.customer_charge_usd,required_plan:'business'});
 if(!gate.ok)return json({detail:gate.detail,code:gate.code,plan:gate.plan,prepaid_balance_usd:gate.prepaid_balance_usd,free_voice_available:true},402);
 const model=String(env?.ELEVENLABS_TTS_MODEL||PREMIUM_VOICE_PRODUCT.origin_model).trim();
 const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voiceId),{
  method:'POST',
  headers:{'content-type':'application/json','accept':'audio/mpeg','xi-api-key':key},
  body:JSON.stringify({text,model_id:model,voice_settings:{stability:.55,similarity_boost:.75,speed:.98}})
 });
 if(!response.ok){
  const detail=await response.text().catch(()=>'');
  console.error('Magnanimous HQ voice execution failed',response.status,detail.slice(0,240));
  return json({detail:'Magnanimous HQ Voice is temporarily unavailable. Free browser voice remains available.',code:'MAGNANIMOUS_PREMIUM_VOICE_FAILED',free_voice_available:true},502);
 }
 await recordUsage(env,user.tenant_id,{
  category:'premium-voice',
  provider:'premium-voice-origin',
  units:text.length,
  direct_cost_usd:quote.origin_cost_usd,
  customer_charge_usd:quote.customer_charge_usd,
  markup_percent:quote.markup_percent,
  origin_ref:PREMIUM_VOICE_PRODUCT.origin_model,
  reference_id:crypto.randomUUID()
 });
 const headers=new Headers(response.headers);
 headers.set('content-type',response.headers.get('content-type')||'audio/mpeg');
 headers.set('cache-control','no-store');
 headers.set('x-magnanimous-product','hq-voice');
 headers.set('x-magnanimous-charge-usd',quote.customer_charge_usd.toFixed(6));
 headers.delete('server');headers.delete('via');
 return new Response(response.body,{status:200,headers});
}
