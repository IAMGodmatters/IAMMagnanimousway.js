export const PROVIDER_COST_CATALOG_VERSION='2026-09-25.1';
export const PROVIDER_COSTS_REVIEW_AFTER='2026-12-31';
export const PASS_THROUGH_MARKUP_PERCENT=20;

const round=(value,places=6)=>{
 const factor=10**places;
 return Math.round((Number(value||0)+Number.EPSILON)*factor)/factor;
};
export function customerChargeUsd(originCostUsd,markupPercent=PASS_THROUGH_MARKUP_PERCENT){
 return round(Math.max(0,Number(originCostUsd||0))*(1+Math.max(0,Number(markupPercent||0))/100));
}
export function originCapacityFromCustomerFunds(customerFundsUsd,markupPercent=PASS_THROUGH_MARKUP_PERCENT){
 const multiplier=1+Math.max(0,Number(markupPercent||0))/100;
 return round(Math.max(0,Number(customerFundsUsd||0))/multiplier);
}

export const PROVIDER_COST_CATALOG=Object.freeze({
 'cloudflare-ai':{
  provider:'cloudflare-ai',name:'Cloudflare Workers AI',mode:'free-first',auto_route:true,
  free_allowance:'10,000 neurons/day on Workers Free; free-plan usage stops at the allocation rather than promising owner-funded overage.',
  paid_platform_note:'Workers Paid starts at $5/month; Workers AI above the free allocation is $0.011 per 1,000 neurons.',
  source_url:'https://developers.cloudflare.com/workers-ai/platform/pricing/',
  models:{
   '@cf/meta/llama-3.2-1b-instruct':{input_per_million_usd:.027,output_per_million_usd:.19,source_url:'https://developers.cloudflare.com/workers-ai/models/llama-3.2-1b-instruct/'},
   '@cf/myshell-ai/melotts':{audio_per_minute_usd:.000205,source_url:'https://developers.cloudflare.com/workers-ai/models/melotts/'},
   '@cf/deepgram/aura-1':{per_thousand_characters_usd:.015,source_url:'https://developers.cloudflare.com/workers-ai/models/aura-1/'},
   '@cf/deepgram/aura-2-en':{per_thousand_characters_usd:.03,source_url:'https://developers.cloudflare.com/workers-ai/models/aura-2-en/'}
  }
 },
 google:{
  provider:'google',name:'Google Gemini',mode:'optional-funded',auto_route:false,
  free_tier_note:'Gemini API Free Tier is available for supported models subject to Google quota/eligibility.',
  source_url:'https://ai.google.dev/gemini-api/docs/pricing',
  models:{
   'gemini-3.8-flash':{input_per_million_usd:.75,output_per_million_usd:3.75,pricing_through:'2026-12-31'},
   'Gemini 3.8 Flash-Lite TTS':{input_per_million_usd:.50,audio_output_per_million_tokens_usd:6,audio_tokens_per_second:25,pricing_through:'2026-12-31'}
  }
 },
 groq:{
  provider:'groq',name:'Groq',mode:'optional-funded',auto_route:false,
  free_tier_note:'Groq offers a Free plan with rate limits; paid Developer usage supports spend limits.',
  source_url:'https://groq.com/pricing',
  models:{
   'openai/gpt-oss-20b':{input_per_million_usd:.075,output_per_million_usd:.30,cached_input_per_million_usd:.037},
   'whisper-large-v3-turbo':{audio_per_hour_usd:.04},
   'canopylabs/orpheus-v1-english':{per_million_characters_usd:22}
  }
 },
 openai:{
  provider:'openai',name:'OpenAI API',mode:'optional-funded',auto_route:false,
  source_url:'https://developers.openai.com/api/docs/pricing',
  models:{
   'gpt-6-luna':{input_per_million_usd:.10,output_per_million_usd:.50,max_prompt_pricing_note:'Listed GPT-6 Luna rate applies to prompts up to 272k tokens.'},
   'gpt-6-sol':{input_per_million_usd:2,output_per_million_usd:10},
   'gpt-4o-mini-tts':{input_per_million_usd:.60,audio_output_per_million_tokens_usd:12}
  }
 },
 deepgram:{
  provider:'deepgram',name:'Deepgram',mode:'optional-funded',auto_route:false,
  source_url:'https://deepgram.com/pricing',
  models:{
   'aura-1':{per_thousand_characters_usd:.015},
   'aura-2':{per_thousand_characters_usd:.03},
   flux:{audio_per_hour_usd:.045}
  }
 },
 elevenlabs:{
  provider:'elevenlabs',name:'ElevenLabs',mode:'optional-funded',auto_route:false,
  source_url:'https://elevenlabs.io/pricing/api',
  models:{
   'v3-conversational':{per_thousand_characters_usd:.05},
   v3:{per_thousand_characters_usd:.10}
  }
 }
});

function resolveModel(provider,model=''){
 const entry=PROVIDER_COST_CATALOG[String(provider||'').toLowerCase()];
 if(!entry)return null;
 const requested=String(model||'');
 if(requested&&entry.models?.[requested])return{entry,model:requested,rates:entry.models[requested]};
 const defaults={
  google:'gemini-3.8-flash',
  groq:'openai/gpt-oss-20b',
  openai:'gpt-6-luna',
  'cloudflare-ai':'@cf/meta/llama-3.2-1b-instruct'
 };
 const selected=defaults[String(provider||'').toLowerCase()]||Object.keys(entry.models||{})[0]||'';
 return{entry,model:selected,rates:entry.models?.[selected]||{}};
}

export function quoteProviderCost({provider='',model='',input_tokens=0,output_tokens=0,characters=0,audio_minutes=0,audio_hours=0}={}){
 const resolved=resolveModel(provider,model);
 if(!resolved)return null;
 const r=resolved.rates||{};
 let origin=0,priced=false;
 if(Number(r.input_per_million_usd)>=0&&Number(input_tokens)>0){origin+=Number(input_tokens)/1_000_000*Number(r.input_per_million_usd);priced=true}
 if(Number(r.output_per_million_usd)>=0&&Number(output_tokens)>0){origin+=Number(output_tokens)/1_000_000*Number(r.output_per_million_usd);priced=true}
 if(Number(r.per_thousand_characters_usd)>=0&&Number(characters)>0){origin+=Number(characters)/1000*Number(r.per_thousand_characters_usd);priced=true}
 if(Number(r.per_million_characters_usd)>=0&&Number(characters)>0){origin+=Number(characters)/1_000_000*Number(r.per_million_characters_usd);priced=true}
 if(Number(r.audio_per_minute_usd)>=0&&Number(audio_minutes)>0){origin+=Number(audio_minutes)*Number(r.audio_per_minute_usd);priced=true}
 if(Number(r.audio_per_hour_usd)>=0&&(Number(audio_hours)>0||Number(audio_minutes)>0)){origin+=(Number(audio_hours)||Number(audio_minutes)/60)*Number(r.audio_per_hour_usd);priced=true}
 if(Number(r.audio_output_per_million_tokens_usd)>=0&&Number(audio_minutes)>0&&Number(r.audio_tokens_per_second)>0){
  origin+=Number(audio_minutes)*60*Number(r.audio_tokens_per_second)/1_000_000*Number(r.audio_output_per_million_tokens_usd);priced=true;
 }
 if(!priced)return{provider:resolved.entry.provider,model:resolved.model,priced:false,origin_cost_usd:null,markup_percent:PASS_THROUGH_MARKUP_PERCENT,customer_charge_usd:null};
 const originCost=round(origin);
 return{
  provider:resolved.entry.provider,model:resolved.model,priced:true,
  origin_cost_usd:originCost,
  markup_percent:PASS_THROUGH_MARKUP_PERCENT,
  customer_charge_usd:customerChargeUsd(originCost),
  source_url:r.source_url||resolved.entry.source_url||''
 };
}

export function standardAiRequestCost(provider,model=''){
 return quoteProviderCost({provider,model,input_tokens:2000,output_tokens:800});
}

export function publicProviderCostCatalog(){
 return{
  version:PROVIDER_COST_CATALOG_VERSION,
  researched_at:'2026-09-25',
  review_after:PROVIDER_COSTS_REVIEW_AFTER,
  free_first:true,
  pass_through_markup_percent:PASS_THROUGH_MARKUP_PERCENT,
  billing_rule:'Free/native capacity is used first. Customer-funded provider usage is charged at documented origin cost plus 20%; no unfunded variable-cost overage is allowed.',
  providers:Object.values(PROVIDER_COST_CATALOG).map(entry=>({
   provider:entry.provider,name:entry.name,mode:entry.mode,auto_route:entry.auto_route,
   free_allowance:entry.free_allowance||null,free_tier_note:entry.free_tier_note||null,
   paid_platform_note:entry.paid_platform_note||null,source_url:entry.source_url,
   models:Object.entries(entry.models||{}).map(([model,rates])=>({model,...rates}))
  }))
 };
}
