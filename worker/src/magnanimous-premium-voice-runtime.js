import { currentUser } from './integrations.js';
import { recordPrepaidPassThroughUsage,walletStatus } from './usage-guard.js';
import { CUSTOMER_UPSELL_PERCENT,customerPriceFromOrigin } from './provider-cost-catalog.js';
import { providerAttemptAllowed,recordProviderFailure,recordProviderSuccess } from './magnanimous-self-heal-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const ORIGIN_PER_1000_CHARS_USD=0.05;
const INTERNAL_PROVIDER='premium-neural-voice';
const DEFAULT_MODEL='eleven_flash_v2_5';

function configured(env){
 return Boolean(
  String(env?.MAGNANIMOUS_PREMIUM_VOICE_API_KEY||'').trim()&&
  String(env?.MAGNANIMOUS_PREMIUM_VOICE_ID||'').trim()&&
  String(env?.MAGNANIMOUS_PREMIUM_VOICE_COMMERCIAL_OK||'').toLowerCase()==='true'
 );
}
function cleanForSpeech(value){
 return String(value||'')
  .replace(/```[\s\S]*?```/g,' ')
  .replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1')
  .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]+\)/g,'$1')
  .replace(/https?:\/\/\S+/gi,' ')
  .replace(/`([^`]+)`/g,'$1')
  .replace(/^\s{0,3}#{1,6}\s*/gm,'')
  .replace(/^\s*>\s?/gm,'')
  .replace(/^\s*[-+*•◦▪►▶]\s+/gm,'')
  .replace(/\[(?:\d+|source|citation)\]/gi,'')
  .replace(/[\*_~#`]/g,'')
  .replace(/[•◦▪◆◇■□►▶]/g,', ')
  .replace(/\|/g,', ')
  .replace(/&/g,' and ')
  .replace(/\s*\n+\s*/g,'. ')
  .replace(/([.!?])\1+/g,'$1')
  .replace(/\s+([,.;:!?])/g,'$1')
  .replace(/([,.;:!?])([^\s])/g,'$1 $2')
  .replace(/\s+/g,' ')
  .trim();
}
function quote(text){
 const chars=String(text||'').length;
 const origin=Number(((chars/1000)*ORIGIN_PER_1000_CHARS_USD).toFixed(9));
 return{characters:chars,origin_cost_usd:origin,customer_cost_usd:customerPriceFromOrigin(origin),markup_percent:CUSTOMER_UPSELL_PERCENT};
}

export async function handleMagnanimousPremiumVoice(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/voice/'))return null;

 if(request.method==='GET'&&path==='/api/magnanimous/voice/options'){
  return json({
   public_identity:'Magnanimous AI',
   free_default:{id:'device',name:'Magnanimous Device Voice',configured:true,cost_usd:0,automatic_self_heal:true},
   premium:{id:'premium',name:'Premium Neural Voice',configured:configured(env),commercial_use_guard:true,prepaid_only:true,origin_cost_per_1000_characters_usd:ORIGIN_PER_1000_CHARS_USD,customer_cost_per_1000_characters_usd:customerPriceFromOrigin(ORIGIN_PER_1000_CHARS_USD),markup_percent:CUSTOMER_UPSELL_PERCENT},
   outside_provider_branding:false
  });
 }

 if(request.method!=='POST'||path!=='/api/magnanimous/voice/synthesize')return json({detail:'Voice endpoint not found.'},404);
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in required for Premium Neural Voice.',code:'SIGN_IN_REQUIRED'},401);
 if(!configured(env))return json({detail:'Premium Neural Voice is not configured for commercial use yet. Magnanimous Device Voice remains available for free.',code:'PREMIUM_VOICE_NOT_CONFIGURED',free_voice_available:true},503);

 const body=await request.json().catch(()=>({}));
 const text=cleanForSpeech(body.text).slice(0,4000);
 if(!text)return json({detail:'Text is required.'},400);
 const pricing=quote(text),wallet=await walletStatus(env,user.tenant_id);
 if(pricing.customer_cost_usd>wallet.balance_usd+1e-9){
  return json({
   detail:'Premium Neural Voice needs prepaid usage credit. Free Magnanimous Device Voice remains available.',
   code:'PREPAID_USAGE_BALANCE_EXHAUSTED',
   prepaid_balance_usd:wallet.balance_usd,
   required_usd:pricing.customer_cost_usd,
   quote:pricing,
   free_voice_available:true
  },402);
 }

 const model=String(env.MAGNANIMOUS_PREMIUM_VOICE_MODEL||DEFAULT_MODEL).trim()||DEFAULT_MODEL;
 const circuit=providerAttemptAllowed(INTERNAL_PROVIDER,model);
 if(!circuit.allowed)return json({detail:'Premium Neural Voice is temporarily in automatic recovery mode. Free Magnanimous Device Voice remains available.',code:'PREMIUM_VOICE_RECOVERING',retry_after_ms:circuit.retry_after_ms,free_voice_available:true},503);

 const voiceId=encodeURIComponent(String(env.MAGNANIMOUS_PREMIUM_VOICE_ID).trim());
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort('premium-voice-timeout'),20000);
 try{
  const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,{
   method:'POST',
   headers:{'content-type':'application/json','xi-api-key':String(env.MAGNANIMOUS_PREMIUM_VOICE_API_KEY)},
   body:JSON.stringify({
    text,
    model_id:model,
    voice_settings:{stability:.55,similarity_boost:.75,style:0,use_speaker_boost:true}
   }),
   signal:controller.signal
  });
  if(!response.ok){
   const detail=await response.text().catch(()=>'');
   recordProviderFailure(INTERNAL_PROVIDER,model,`HTTP ${response.status} ${detail.slice(0,180)}`);
   return json({detail:'Premium Neural Voice is temporarily unavailable. Magnanimous switched back to free voice instead of charging you.',code:'PREMIUM_VOICE_UPSTREAM_ERROR',free_voice_available:true},502);
  }
  const audio=await response.arrayBuffer();
  if(!audio.byteLength){
   recordProviderFailure(INTERNAL_PROVIDER,model,'empty audio response');
   return json({detail:'Premium Neural Voice returned empty audio. Free voice remains available.',code:'PREMIUM_VOICE_EMPTY',free_voice_available:true},502);
  }
  const reference=String(response.headers.get('request-id')||response.headers.get('x-request-id')||crypto.randomUUID());
  await recordPrepaidPassThroughUsage(env,user.tenant_id,{category:'premium-neural-voice',provider:INTERNAL_PROVIDER,units:pricing.characters,direct_cost_usd:pricing.origin_cost_usd,reference_id:reference});
  recordProviderSuccess(INTERNAL_PROVIDER,model);
  return new Response(audio,{status:200,headers:{
   'content-type':response.headers.get('content-type')||'audio/mpeg',
   'cache-control':'no-store',
   'x-magnanimous-voice-tier':'premium',
   'x-magnanimous-origin-cost-usd':String(pricing.origin_cost_usd),
   'x-magnanimous-customer-cost-usd':String(pricing.customer_cost_usd),
   'x-magnanimous-markup-percent':String(CUSTOMER_UPSELL_PERCENT)
  }});
 }catch(error){
  recordProviderFailure(INTERNAL_PROVIDER,model,error?.message||String(error));
  return json({detail:'Premium Neural Voice is temporarily unavailable. Magnanimous kept the request on the free voice path.',code:'PREMIUM_VOICE_RECOVERY',free_voice_available:true},502);
 }finally{clearTimeout(timer)}
}
