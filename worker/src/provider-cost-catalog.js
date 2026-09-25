export const ORIGIN_PRICE_VERIFIED_AT='2026-09-25';
export const CUSTOMER_UPSELL_PERCENT=20;
export const CUSTOMER_UPSELL_MULTIPLIER=1+(CUSTOMER_UPSELL_PERCENT/100);

const text=(provider,model,name,inputPerM,outputPerM,source,extra={})=>Object.freeze({
  kind:'text',provider,model,name,input_usd_per_million:inputPerM,output_usd_per_million:outputPerM,source,verified_at:ORIGIN_PRICE_VERIFIED_AT,...extra
});
const voice=(provider,model,name,unit,originUsd,source,extra={})=>Object.freeze({
  kind:'voice',provider,model,name,unit,origin_usd:originUsd,source,verified_at:ORIGIN_PRICE_VERIFIED_AT,...extra
});

export const TEXT_MODEL_PRICING=Object.freeze({
  'cloudflare-ai:@cf/zai-org/glm-4.7-flash':text('cloudflare-ai','@cf/zai-org/glm-4.7-flash','Cloudflare GLM 4.7 Flash',0.0605,0.40,'https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/',{free_plan_eligible:true}),
  'cloudflare-ai:@cf/google/gemma-4-26b-a4b-it':text('cloudflare-ai','@cf/google/gemma-4-26b-a4b-it','Cloudflare Gemma 4 26B A4B',0.10,0.30,'https://developers.cloudflare.com/workers-ai/platform/pricing/',{free_plan_eligible:true}),
  'cloudflare-ai:@cf/qwen/qwen3-30b-a3b-fp8':text('cloudflare-ai','@cf/qwen/qwen3-30b-a3b-fp8','Cloudflare Qwen3 30B A3B',0.051,0.335,'https://developers.cloudflare.com/workers-ai/platform/pricing/',{free_plan_eligible:true}),
  'cloudflare-ai:@cf/nvidia/nemotron-3-120b-a12b':text('cloudflare-ai','@cf/nvidia/nemotron-3-120b-a12b','Cloudflare Nemotron 3 120B A12B',0.50,1.50,'https://developers.cloudflare.com/workers-ai/platform/pricing/',{free_plan_eligible:true}),
  'cloudflare-ai:@cf/openai/gpt-oss-20b':text('cloudflare-ai','@cf/openai/gpt-oss-20b','Cloudflare GPT OSS 20B',0.20,0.30,'https://developers.cloudflare.com/workers-ai/platform/pricing/',{free_plan_eligible:true}),
  'google:gemini-3.7-flash':text('google','gemini-3.7-flash','Google Gemini 3.7 Flash',0.75,3.75,'https://ai.google.dev/gemini-api/docs/pricing',{free_tier_available:true,paid_price_valid_through:'2026-12-31'}),
  'google:gemini-3.1-flash-lite':text('google','gemini-3.1-flash-lite','Google Gemini 3.1 Flash-Lite',0.25,1.50,'https://ai.google.dev/gemini-api/docs/pricing',{free_tier_available:true}),
  'groq:openai/gpt-oss-20b':text('groq','openai/gpt-oss-20b','Groq GPT OSS 20B',0.075,0.30,'https://console.groq.com/docs/model/openai/gpt-oss-20b',{free_plan_limits_available:true}),
  'groq:openai/gpt-oss-120b':text('groq','openai/gpt-oss-120b','Groq GPT OSS 120B',0.15,0.60,'https://console.groq.com/docs/models',{free_plan_limits_available:true}),
  'mistral:mistral-small-latest':text('mistral','mistral-small-latest','Mistral Small 4',0.15,0.60,'https://mistral.ai/pricing/api/'),
  'mistral:mistral-medium-latest':text('mistral','mistral-medium-latest','Mistral Medium 3.5',1.50,7.50,'https://mistral.ai/pricing/api/'),
  'openai:gpt-6-luna':text('openai','gpt-6-luna','OpenAI GPT-6 Luna',0.10,0.50,'https://developers.openai.com/api/docs/pricing'),
  'openai:gpt-6-sol':text('openai','gpt-6-sol','OpenAI GPT-6 Sol',2.00,10.00,'https://developers.openai.com/api/docs/pricing'),
  'anthropic:claude-haiku-4-5':text('anthropic','claude-haiku-4-5','Anthropic Claude Haiku 4.5',1.00,5.00,'https://www.anthropic.com/news/claude-haiku-4-5'),
  'anthropic:claude-sonnet-4-6':text('anthropic','claude-sonnet-4-6','Anthropic Claude Sonnet 4.6',3.00,15.00,'https://www.anthropic.com/news/claude-sonnet-4-6')
});

export const VOICE_MODEL_PRICING=Object.freeze({
  'browser:native-speech':voice('browser','native-speech','Device/browser speech','audio',0,'browser-native',{free:true}),
  'cloudflare-ai:@cf/myshell-ai/melotts':voice('cloudflare-ai','@cf/myshell-ai/melotts','Cloudflare MeloTTS','audio_minute',0.000205,'https://developers.cloudflare.com/workers-ai/platform/pricing/',{free_allocation_eligible:true}),
  'groq:whisper-large-v3-turbo':voice('groq','whisper-large-v3-turbo','Groq Whisper Large V3 Turbo','audio_hour',0.04,'https://console.groq.com/docs/models',{free_plan_limits_available:true}),
  'elevenlabs:flash-turbo':voice('elevenlabs','flash-turbo','ElevenLabs Flash / Turbo','1000_characters',0.05,'https://elevenlabs.io/pricing/api'),
  'elevenlabs:speech-engine':voice('elevenlabs','speech-engine','ElevenLabs Speech Engine','audio_minute',0.08,'https://elevenlabs.io/pricing/api')
});

const PROVIDER_DEFAULTS=Object.freeze({
  'cloudflare-ai':{budget:'@cf/zai-org/glm-4.7-flash',quality:'@cf/nvidia/nemotron-3-120b-a12b'},
  google:{budget:'gemini-3.1-flash-lite',quality:'gemini-3.7-flash'},
  groq:{budget:'openai/gpt-oss-20b',quality:'openai/gpt-oss-120b'},
  mistral:{budget:'mistral-small-latest',quality:'mistral-medium-latest'},
  openai:{budget:'gpt-6-luna',quality:'gpt-6-sol'},
  anthropic:{budget:'claude-haiku-4-5',quality:'claude-sonnet-4-6'}
});

function key(provider,model){return `${String(provider||'').toLowerCase()}:${String(model||'')}`}
function money(value){return Number(Math.max(0,Number(value||0)).toFixed(9))}
export function customerPriceFromOrigin(originUsd){return money(Number(originUsd||0)*CUSTOMER_UPSELL_MULTIPLIER)}
export function estimateTextTokens(textValue){const text=String(textValue||'');return Math.max(text?1:0,Math.ceil(text.length/4))}
export function defaultModelForProvider(provider,quality='budget'){
  const row=PROVIDER_DEFAULTS[String(provider||'').toLowerCase()];
  if(!row)return'';
  return /^(?:max|maximum|quality|premium)$/.test(String(quality||'').toLowerCase())?row.quality:row.budget;
}
export function textModelPrice(provider,model=''){
  const p=String(provider||'').toLowerCase(),resolved=String(model||defaultModelForProvider(p,'budget'));
  return TEXT_MODEL_PRICING[key(p,resolved)]||null;
}
export function estimateTextOriginCostUsd({provider,model='',inputText='',outputText='',inputTokens,outputTokens,maxOutputTokens=0}={}){
  const price=textModelPrice(provider,model);if(!price)return 0;
  const inTokens=Number.isFinite(Number(inputTokens))?Math.max(0,Number(inputTokens)):estimateTextTokens(inputText);
  let outTokens=Number.isFinite(Number(outputTokens))?Math.max(0,Number(outputTokens)):estimateTextTokens(outputText);
  if(!outTokens&&Number(maxOutputTokens)>0)outTokens=Math.max(0,Number(maxOutputTokens));
  return money((inTokens/1_000_000)*price.input_usd_per_million+(outTokens/1_000_000)*price.output_usd_per_million);
}
export function quoteTextUsage(args={}){
  const origin=estimateTextOriginCostUsd(args);
  return{origin_cost_usd:origin,customer_cost_usd:customerPriceFromOrigin(origin),markup_percent:CUSTOMER_UPSELL_PERCENT,price:textModelPrice(args.provider,args.model)};
}
function publicLabel(row){
  if(row.kind==='voice'){
    if(row.provider==='browser')return'Device Voice';
    if(row.provider==='cloudflare-ai')return'Magnanimous Standard Voice';
    return'Premium Neural Voice';
  }
  if(row.provider==='cloudflare-ai')return'Magnanimous Free-First AI';
  if(row.provider==='openrouter-free'||row.provider.startsWith('nvidia-'))return'Magnanimous Free Compute';
  return /haiku|lite|small|20b/i.test(String(row.model||''))?'Premium Efficient AI':'Premium Advanced AI';
}
export function publicProviderPricing(){
  const rows=[...Object.values(TEXT_MODEL_PRICING),...Object.values(VOICE_MODEL_PRICING)];
  return rows.map(row=>({
    kind:row.kind,
    public_name:publicLabel(row),
    public_model_class:row.kind==='voice'?'voice':(/haiku|lite|small|20b|flash/i.test(String(row.model||''))?'efficient':'advanced'),
    unit:row.unit,
    input_usd_per_million:row.kind==='text'?row.input_usd_per_million:undefined,
    output_usd_per_million:row.kind==='text'?row.output_usd_per_million:undefined,
    origin_usd:row.kind==='voice'?row.origin_usd:undefined,
    customer_input_usd_per_million:row.kind==='text'?money(row.input_usd_per_million*CUSTOMER_UPSELL_MULTIPLIER):undefined,
    customer_output_usd_per_million:row.kind==='text'?money(row.output_usd_per_million*CUSTOMER_UPSELL_MULTIPLIER):undefined,
    customer_usd:row.kind==='voice'?customerPriceFromOrigin(row.origin_usd):undefined,
    markup_percent:CUSTOMER_UPSELL_PERCENT,
    verified_at:row.verified_at,
    free:Boolean(row.free),
    free_plan_eligible:Boolean(row.free_plan_eligible),
    free_tier_available:Boolean(row.free_tier_available),
    free_plan_limits_available:Boolean(row.free_plan_limits_available),
    origin_verified:true
  }));
}
export function providerPricingMeta(){
  return{
    verified_at:ORIGIN_PRICE_VERIFIED_AT,
    markup_percent:CUSTOMER_UPSELL_PERCENT,
    pricing_policy:'origin-cost-plus-20-percent',
    free_first_default:true,
    prepaid_required_for_metered_overage:true,
    catalog:publicProviderPricing()
  };
}
