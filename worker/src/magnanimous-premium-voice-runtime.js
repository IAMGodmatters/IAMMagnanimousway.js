import { canUsePremium, currentUserFromRequest, recordUsage } from './usage-guard.js';
import { characterQuote, CUSTOMER_MARKUP_PERCENT } from './magnanimous-provider-economics.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const MAX_CHARS=5000;
const PUBLIC_RATE_USD_PER_1000=0.06;

function ready(env){
  return Boolean(String(env?.ELEVENLABS_API_KEY||'').trim()&&String(env?.ELEVENLABS_VOICE_ID||'').trim());
}
function cleanSpeechText(value){
  return String(value||'')
    .replace(/\`\`\`[\s\S]*?\`\`\`/g,' ')
    .replace(/https?:\/\/\S+/gi,' ')
    .replace(/[\*_~#\`]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function publicStatus(env){
  return{
    identity:'Magnanimous Voice',
    free_first:true,
    browser_voice_default:true,
    premium_available:ready(env),
    premium_brand:'Magnanimous Voice',
    billing:{unit:'1K characters',price_usd:PUBLIC_RATE_USD_PER_1000,markup_percent:CUSTOMER_MARKUP_PERCENT,prepaid:true,hard_cap_characters_per_request:MAX_CHARS},
    outside_branding:false,
    requires_plan:'plus'
  };
}

export async function handleMagnanimousPremiumVoice(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/magnanimous/voice'))return null;

  if(request.method==='GET'&&url.pathname==='/api/magnanimous/voice/status')return json(publicStatus(env));
  if(request.method!=='POST'||url.pathname!=='/api/magnanimous/voice/synthesize')return json({detail:'Magnanimous Voice route not found.'},404);

  const user=await currentUserFromRequest(request,env);
  if(!user)return json({detail:'Sign in to use premium Magnanimous Voice.',code:'SIGN_IN_REQUIRED'},401);
  if(!ready(env))return json({detail:'Premium Magnanimous Voice is not configured yet. The free browser voice remains available.',code:'MAGNANIMOUS_PREMIUM_VOICE_NOT_READY',free_browser_voice:true},503);

  const body=await request.json().catch(()=>({}));
  const text=cleanSpeechText(body.text).slice(0,MAX_CHARS);
  if(!text)return json({detail:'Text is required.'},400);
  const quote=characterQuote('elevenlabs:flash-turbo',text.length);
  const gate=await canUsePremium(env,user.tenant_id,{
    category:'premium Magnanimous Voice',
    estimated_cost_usd:quote.origin_cost_usd,
    estimated_customer_charge_usd:quote.customer_charge_usd,
    required_plan:'plus'
  });
  if(!gate.ok)return json({
    detail:gate.detail,
    code:gate.code,
    free_browser_voice:true,
    estimated_charge_usd:quote.customer_charge_usd,
    prepaid_balance_usd:gate.prepaid_balance_usd||0
  },402);

  const voiceId=String(env.ELEVENLABS_VOICE_ID).trim();
  const modelId=String(env.ELEVENLABS_MODEL_ID||'eleven_flash_v2_5').trim();
  let upstream;
  try{
    upstream=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,{
      method:'POST',
      headers:{'content-type':'application/json','xi-api-key':String(env.ELEVENLABS_API_KEY)},
      body:JSON.stringify({
        text,
        model_id:modelId,
        voice_settings:{stability:0.58,similarity_boost:0.78,style:0,use_speaker_boost:true,speed:0.96}
      })
    });
  }catch(error){
    console.error('Magnanimous premium voice transport failed',String(error?.message||error));
    return json({detail:'Magnanimous Voice could not generate premium audio. The free browser voice remains available.',code:'MAGNANIMOUS_PREMIUM_VOICE_UNAVAILABLE',free_browser_voice:true},502);
  }
  if(!upstream.ok){
    const internal=await upstream.text().catch(()=>'');
    console.error('Magnanimous premium voice upstream failed',upstream.status,internal.slice(0,500));
    return json({detail:'Magnanimous Voice could not generate premium audio. The free browser voice remains available.',code:'MAGNANIMOUS_PREMIUM_VOICE_UNAVAILABLE',free_browser_voice:true},502);
  }

  const reference=upstream.headers.get('request-id')||upstream.headers.get('x-request-id')||crypto.randomUUID();
  await recordUsage(env,user.tenant_id,{
    category:'premium-voice',
    provider:'private-premium-voice',
    units:text.length,
    direct_cost_usd:quote.origin_cost_usd,
    customer_charge_usd:quote.customer_charge_usd,
    markup_percent:CUSTOMER_MARKUP_PERCENT,
    reference_id:reference
  });

  const headers=new Headers({
    'content-type':upstream.headers.get('content-type')||'audio/mpeg',
    'cache-control':'no-store',
    'x-magnanimous-voice':'premium',
    'x-magnanimous-charge-usd':String(quote.customer_charge_usd),
    'x-magnanimous-markup-percent':String(CUSTOMER_MARKUP_PERCENT)
  });
  return new Response(upstream.body,{status:200,headers});
}

export const MAGNANIMOUS_PREMIUM_VOICE_MAX_CHARS=MAX_CHARS;
