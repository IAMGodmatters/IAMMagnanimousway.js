const MILLION=1_000_000;
const THOUSAND=1_000;
const usd=(value)=>Math.max(0,Number(value)||0);

export const PROVIDER_COST_SNAPSHOT=Object.freeze({
  updated_on:'2026-09-25',
  markup_percent:20,
  sources:{
    cloudflare:'https://developers.cloudflare.com/workers-ai/platform/pricing/',
    openai:'https://developers.openai.com/api/docs/pricing',
    anthropic:'https://www.anthropic.com/news/claude-sonnet-5',
    google:'https://ai.google.dev/gemini-api/docs/pricing',
    groq:'https://console.groq.com/docs/model/openai/gpt-oss-120b',
    mistral:'https://mistral.ai/pricing/api/',
    elevenlabs:'https://elevenlabs.io/pricing/api',
    nvidia:'https://docs.api.nvidia.com/nim/docs/product'
  },
  cloudflare:{
    free_neurons_per_day:10000,
    overage_usd_per_1000_neurons:0.011,
    free_models:['@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b']
  },
  nvidia:{
    hosted_developer_api_production_allowed:false,
    production_license_required:true,
    enterprise_starting_usd_per_gpu_year:4500
  },
  voice:{
    browser_native:{origin_cost_usd:0,commercial_provider_required:false},
    elevenlabs_v3_conversational:{usd_per_1000_characters:0.05},
    elevenlabs_v3:{usd_per_1000_characters:0.10}
  }
});

function openAiRates(model,at=new Date()){
  const id=String(model||'').toLowerCase();
  if(id==='gpt-5.6-luna')return{input:0.20,cached_input:0.02,output:1.20,source:'openai'};
  if(id==='gpt-5.6-terra')return{input:2.00,cached_input:0.20,output:12.00,source:'openai'};
  if(id==='gpt-5.6-sol'){
    const promo=at.getTime()<Date.UTC(2026,10,22);
    return promo
      ?{input:4.00,cached_input:0.40,output:20.00,source:'openai',price_window:'promo-through-2026-11-21'}
      :{input:5.00,cached_input:0.50,output:30.00,source:'openai',price_window:'standard'};
  }
  return null;
}

function anthropicRates(model){
  const id=String(model||'').toLowerCase();
  if(id==='claude-sonnet-5')return{input:2.00,cached_input:2.00,output:10.00,source:'anthropic'};
  return null;
}

function googleRates(model,at=new Date()){
  const id=String(model||'').toLowerCase();
  if(id==='gemini-2.5-flash')return{input:0.30,cached_input:0.03,output:2.50,source:'google'};
  if(id==='gemini-2.5-flash-lite')return{input:0.10,cached_input:0.01,output:0.40,source:'google'};
  if(id==='gemini-3.8-flash'){
    const intro=at.getTime()<Date.UTC(2027,0,1);
    return intro
      ?{input:0.75,cached_input:0.75,output:3.75,source:'google',price_window:'intro-through-2026-12-31'}
      :{input:1.50,cached_input:1.50,output:7.50,source:'google',price_window:'standard'};
  }
  return null;
}

function groqRates(model){
  const id=String(model||'').toLowerCase();
  if(id==='openai/gpt-oss-120b')return{input:0.15,cached_input:0.075,output:0.60,source:'groq'};
  if(id==='openai/gpt-oss-20b')return{input:0.075,cached_input:0.075,output:0.30,source:'groq'};
  return null;
}

function mistralRates(model){
  const id=String(model||'').toLowerCase();
  if(id==='mistral-large-latest'||id==='mistral-large-3')return{input:0.50,cached_input:0.05,output:1.50,source:'mistral'};
  if(id==='mistral-medium-latest'||id==='mistral-medium-3.5')return{input:1.50,cached_input:0.15,output:7.50,source:'mistral'};
  if(id==='mistral-small-latest'||id==='mistral-small-4')return{input:0.15,cached_input:0.015,output:0.60,source:'mistral'};
  return null;
}

export function providerTokenRates(provider,model,at=new Date()){
  const p=String(provider||'').toLowerCase();
  if(p==='openai')return openAiRates(model,at);
  if(p==='anthropic')return anthropicRates(model);
  if(p==='google')return googleRates(model,at);
  if(p==='groq')return groqRates(model);
  if(p==='mistral')return mistralRates(model);
  return null;
}

export function normalizedTokenUsage(usage={}){
  const input=Math.max(0,Number(
    usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount ?? usage.inputTokenCount ?? 0
  )||0);
  const output=Math.max(0,Number(
    usage.output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount ?? usage.outputTokenCount ?? 0
  )||0);
  const cached=Math.max(0,Math.min(input,Number(
    usage.cached_input_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? usage.cachedContentTokenCount ?? 0
  )||0));
  return{input_tokens:input,output_tokens:output,cached_input_tokens:cached};
}

export function providerOriginCostUsd(provider,model,usage={},at=new Date()){
  const rates=providerTokenRates(provider,model,at);
  if(!rates)return null;
  const u=normalizedTokenUsage(usage);
  const uncached=Math.max(0,u.input_tokens-u.cached_input_tokens);
  const cost=(uncached*rates.input+u.cached_input_tokens*rates.cached_input+u.output_tokens*rates.output)/MILLION;
  return{
    provider:String(provider||'').toLowerCase(),
    model:String(model||''),
    input_tokens:u.input_tokens,
    cached_input_tokens:u.cached_input_tokens,
    output_tokens:u.output_tokens,
    provider_origin_cost_usd:Number(cost.toFixed(9)),
    source_key:rates.source,
    source_url:PROVIDER_COST_SNAPSHOT.sources[rates.source],
    price_window:rates.price_window||'current',
    rates_usd_per_million:{input:rates.input,cached_input:rates.cached_input,output:rates.output}
  };
}

export function estimateMaxProviderOriginCostUsd(provider,model,{input_tokens=0,max_output_tokens=4096}={},at=new Date()){
  return providerOriginCostUsd(provider,model,{input_tokens:Math.max(0,Number(input_tokens)||0),output_tokens:Math.max(0,Number(max_output_tokens)||0),cached_input_tokens:0},at);
}

export function voiceOriginCostUsd(provider,{characters=0}={}){
  const p=String(provider||'').toLowerCase();
  const chars=Math.max(0,Number(characters)||0);
  if(p==='browser-native')return{provider_origin_cost_usd:0,unit:'characters',units:chars,source_url:null};
  const rate=p==='elevenlabs-v3-conversational'?0.05:p==='elevenlabs-v3'?0.10:null;
  if(rate==null)return null;
  return{
    provider_origin_cost_usd:Number((chars/THOUSAND*rate).toFixed(9)),
    unit:'characters',
    units:chars,
    usd_per_1000_characters:rate,
    source_url:PROVIDER_COST_SNAPSHOT.sources.elevenlabs
  };
}
