const MARKUP_PERCENT=20;
const round=(value,places=6)=>{
  const factor=10**places;
  return Math.round((Number(value||0)+Number.EPSILON)*factor)/factor;
};
export const PREMIUM_MARKUP_PERCENT=MARKUP_PERCENT;
export const ORIGIN_COSTS_VERIFIED_AT='2026-09-25';

export const PREMIUM_ORIGIN_COSTS=Object.freeze({
  premium_compute:{
    public_name:'Magnanimous Premium Compute',
    unit:'1,000 compute units',
    origin_provider:'Cloudflare Workers AI',
    origin_unit_cost_usd:0.011,
    source_url:'https://developers.cloudflare.com/workers-ai/platform/pricing/',
    source_note:'Workers AI paid overflow is $0.011 per 1,000 Neurons after the daily free allocation.'
  },
  premium_voice_fast:{
    public_name:'Magnanimous Premium Voice — Fast',
    unit:'1,000 characters',
    origin_provider:'ElevenLabs',
    origin_unit_cost_usd:0.05,
    source_url:'https://elevenlabs.io/pricing/api',
    source_note:'Flash/Turbo text-to-speech pay-as-you-go rate.'
  },
  premium_voice_quality:{
    public_name:'Magnanimous Premium Voice — Quality',
    unit:'1,000 characters',
    origin_provider:'ElevenLabs',
    origin_unit_cost_usd:0.10,
    source_url:'https://elevenlabs.io/pricing/api',
    source_note:'v3 / multilingual text-to-speech pay-as-you-go rate.'
  },
  premium_transcription:{
    public_name:'Magnanimous Premium Transcription',
    unit:'hour',
    origin_provider:'ElevenLabs',
    origin_unit_cost_usd:0.22,
    source_url:'https://elevenlabs.io/pricing/api',
    source_note:'Scribe v2 speech-to-text pay-as-you-go rate.'
  },
  premium_transcription_realtime:{
    public_name:'Magnanimous Premium Live Transcription',
    unit:'hour',
    origin_provider:'ElevenLabs',
    origin_unit_cost_usd:0.39,
    source_url:'https://elevenlabs.io/pricing/api',
    source_note:'Scribe v2 Realtime pay-as-you-go rate.'
  }
});

export function retailFromOriginUsd(originUsd,markupPercent=MARKUP_PERCENT){
  const origin=Math.max(0,Number(originUsd||0));
  const markup=Math.max(0,Number(markupPercent||0));
  return round(origin*(1+markup/100));
}

export function cloudflarePremiumTokenCostUsd(model,usage={}){
  const rates={
    '@cf/zai-org/glm-5.3-flash':{input:0.15,output:0.50}
  };
  const rate=rates[String(model||'')];
  if(!rate)return null;
  const input=Math.max(0,Number(usage?.prompt_tokens??usage?.input_tokens??0));
  const output=Math.max(0,Number(usage?.completion_tokens??usage?.output_tokens??0));
  if(!Number.isFinite(input)||!Number.isFinite(output))return null;
  return round((input/1_000_000)*rate.input+(output/1_000_000)*rate.output);
}

export function premiumCostQuote(id,units=1){
  const row=PREMIUM_ORIGIN_COSTS[id];
  if(!row)return null;
  const quantity=Math.max(0,Number(units||0));
  const origin=round(row.origin_unit_cost_usd*quantity);
  const retail=retailFromOriginUsd(origin);
  return{
    id,
    public_name:row.public_name,
    unit:row.unit,
    units:quantity,
    origin_cost_usd:origin,
    customer_charge_usd:retail,
    markup_percent:MARKUP_PERCENT,
    verified_at:ORIGIN_COSTS_VERIFIED_AT,
    source_url:row.source_url,
    origin_provider:row.origin_provider,
    source_note:row.source_note
  };
}

export function publicPremiumCatalog(){
  return Object.keys(PREMIUM_ORIGIN_COSTS).map(id=>{
    const quote=premiumCostQuote(id,1);
    return{
      id,
      name:quote.public_name,
      unit:quote.unit,
      price_usd:quote.customer_charge_usd,
      markup_percent:MARKUP_PERCENT,
      free_first_fallback:true,
      prepaid_required:true
    };
  });
}

export function ownerPremiumCostCatalog(){
  return Object.keys(PREMIUM_ORIGIN_COSTS).map(id=>premiumCostQuote(id,1));
}
