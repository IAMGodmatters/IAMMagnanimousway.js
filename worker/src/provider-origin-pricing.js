export const PROVIDER_PRICING_VERIFIED_AT='2026-09-25';
export const PROVIDER_PRICE_MARKUP_PERCENT=20;

const SOURCES=Object.freeze({
 openai:'https://developers.openai.com/api/docs/pricing',
 anthropic:'https://www.anthropic.com/news/claude-sonnet-5',
 google:'https://ai.google.dev/gemini-api/docs/pricing',
 groq:'https://console.groq.com/docs/model/openai/gpt-oss-120b',
 mistral:'https://mistral.ai/pricing/api/',
 elevenlabs:'https://elevenlabs.io/pricing/api',
 google_media:'https://ai.google.dev/gemini-api/docs/pricing'
});

const price=(input,output,{cachedInput=null,cacheWrite=null,effectiveUntil='',next=null,longContext=null}={})=>({
 input_per_million_usd:input,
 output_per_million_usd:output,
 cached_input_per_million_usd:cachedInput,
 cache_write_per_million_usd:cacheWrite,
 effective_until:effectiveUntil,
 next,
 long_context:longContext
});

const CATALOG=Object.freeze({
 openai:Object.freeze({
  'gpt-6-sol':price(2,10,{cachedInput:.2,cacheWrite:2.5,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-6-luna':price(.1,.5,{cachedInput:.01,cacheWrite:.125,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-5.6':price(4,20,{cachedInput:.4,cacheWrite:5,effectiveUntil:'2026-11-21T23:59:59Z',next:price(5,30,{cachedInput:.5,cacheWrite:6.25,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-5.6-sol':price(4,20,{cachedInput:.4,cacheWrite:5,effectiveUntil:'2026-11-21T23:59:59Z',next:price(5,30,{cachedInput:.5,cacheWrite:6.25,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-5.6-terra':price(2,12,{cachedInput:.2,cacheWrite:2.5,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-5.6-luna':price(.2,1.2,{cachedInput:.02,cacheWrite:.25,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}})
 }),
 anthropic:Object.freeze({
  'claude-sonnet-5':price(2,10)
 }),
 google:Object.freeze({
  'gemini-3.8-flash':price(.75,3.75,{effectiveUntil:'2026-12-31T23:59:59Z',next:price(1.5,7.5)})
 }),
 groq:Object.freeze({
  'openai/gpt-oss-120b':price(.15,.60,{cachedInput:.075})
 }),
 mistral:Object.freeze({
  'mistral-large-latest':price(.5,1.5,{cachedInput:.05}),
  'mistral-medium-latest':price(1.5,7.5,{cachedInput:.15})
 })
});

const n=value=>Math.max(0,Number(value)||0);
const round=value=>Math.round((n(value)+Number.EPSILON)*1e9)/1e9;
const mode=value=>String(value||'paid').trim().toLowerCase();

export function providerBillingMode(env,provider){
 const p=String(provider||'').toLowerCase();
 if(p==='cloudflare-ai'||p==='openrouter-free'||p.startsWith('nvidia-'))return'free';
 if(p==='google')return mode(env?.GOOGLE_API_BILLING_MODE||'unverified');
 if(p==='groq')return mode(env?.GROQ_API_BILLING_MODE||'unverified');
 if(p==='mistral')return mode(env?.MISTRAL_API_BILLING_MODE||'unverified');
 return'paid';
}

export function pricingFor(provider,model,at=new Date()){
 const p=String(provider||'').toLowerCase(),m=String(model||'').trim();
 const base=CATALOG[p]?.[m];
 if(!base)return null;
 if(base.effective_until&&base.next&&at.getTime()>new Date(base.effective_until).getTime())return{...base.next,source:SOURCES[p],verified_at:PROVIDER_PRICING_VERIFIED_AT};
 return{...base,source:SOURCES[p],verified_at:PROVIDER_PRICING_VERIFIED_AT};
}

export function normalizedTokenUsage(usage={}){
 const input=n(usage.input_tokens??usage.prompt_tokens??usage.promptTokenCount);
 const directOutput=usage.output_tokens??usage.completion_tokens;
 const output=directOutput==null?n(usage.candidatesTokenCount)+n(usage.thoughtsTokenCount):n(directOutput);
 const details=usage.input_tokens_details||usage.prompt_tokens_details||usage.promptTokensDetails||{};
 const cached=Math.min(input,n(details.cached_tokens??details.cachedTokens??usage.cached_input_tokens));
 const cacheWrite=Math.min(input-cached,n(details.cache_write_tokens??details.cacheWriteTokens??usage.cache_write_tokens));
 return{input_tokens:input,output_tokens:output,cached_input_tokens:cached,cache_write_tokens:cacheWrite,uncached_input_tokens:Math.max(0,input-cached-cacheWrite)};
}

function chargeFromRate(tokens,rate){return n(tokens)*n(rate)/1_000_000}

export function providerOriginCost({provider,model,usage,billing_mode='paid',at=new Date()}={}){
 const billing=mode(billing_mode);
 if(billing==='free')return{
  ok:true,provider:String(provider||''),model:String(model||''),billing_mode:'free',
  provider_origin_cost_usd:0,pricing_source:SOURCES[String(provider||'').toLowerCase()]||'free-provider-contract',
  pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,usage:normalizedTokenUsage(usage)
 };
 if(billing!=='paid')return{ok:false,code:'BILLING_MODE_UNVERIFIED',detail:'Provider billing mode must be explicitly free or paid before variable usage is allowed.'};
 const rate=pricingFor(provider,model,at);
 if(!rate)return{ok:false,code:'PRICING_NOT_VERIFIED',detail:'No verified current origin price is registered for this provider/model.'};
 const u=normalizedTokenUsage(usage);
 if((u.input_tokens+u.output_tokens)<=0)return{ok:false,code:'USAGE_MISSING',detail:'Provider token usage was not returned, so origin cost cannot be billed accurately.'};
 let inputRate=rate.input_per_million_usd,outputRate=rate.output_per_million_usd,cachedRate=rate.cached_input_per_million_usd??inputRate,writeRate=rate.cache_write_per_million_usd??inputRate;
 if(rate.long_context&&u.input_tokens>rate.long_context.threshold_input_tokens){
  inputRate*=rate.long_context.input_multiplier;
  cachedRate*=rate.long_context.input_multiplier;
  writeRate*=rate.long_context.input_multiplier;
  outputRate*=rate.long_context.output_multiplier;
 }
 const origin=chargeFromRate(u.uncached_input_tokens,inputRate)+chargeFromRate(u.cached_input_tokens,cachedRate)+chargeFromRate(u.cache_write_tokens,writeRate)+chargeFromRate(u.output_tokens,outputRate);
 return{
  ok:true,provider:String(provider||''),model:String(model||''),billing_mode:'paid',
  provider_origin_cost_usd:round(origin),pricing_source:rate.source,pricing_verified_at:rate.verified_at,usage:u,
  rates:{input_per_million_usd:inputRate,cached_input_per_million_usd:cachedRate,cache_write_per_million_usd:writeRate,output_per_million_usd:outputRate}
 };
}

export function conservativeProviderReserve({provider,model,input_text='',max_output_tokens=4096,billing_mode='paid',at=new Date()}={}){
 const billing=mode(billing_mode);
 if(billing==='free')return{ok:true,provider_origin_cost_usd:0,customer_variable_reserve_usd:0,billing_mode:'free'};
 if(billing!=='paid')return{ok:false,code:'BILLING_MODE_UNVERIFIED'};
 const rate=pricingFor(provider,model,at);
 if(!rate)return{ok:false,code:'PRICING_NOT_VERIFIED'};
 const inputUpperBound=new TextEncoder().encode(String(input_text||'')).length;
 let inRate=Math.max(rate.input_per_million_usd,rate.cache_write_per_million_usd||0),outRate=rate.output_per_million_usd;
 if(rate.long_context&&inputUpperBound>rate.long_context.threshold_input_tokens){
  inRate*=rate.long_context.input_multiplier;outRate*=rate.long_context.output_multiplier;
 }
 const origin=chargeFromRate(inputUpperBound,inRate)+chargeFromRate(Math.max(1,Number(max_output_tokens)||4096),outRate);
 return{
  ok:true,billing_mode:'paid',
  provider_origin_cost_usd:round(origin),
  customer_variable_reserve_usd:round(origin*1.2),
  pricing_source:rate.source,
  pricing_verified_at:rate.verified_at
 };
}

export function variableCustomerCharge(providerOriginCostUsd){
 const origin=round(providerOriginCostUsd),customer=round(origin*1.2);
 return{provider_origin_cost_usd:origin,markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,markup_usd:round(customer-origin),customer_charge_usd:customer};
}

export function verifiedPricingCatalog(){
 return{verified_at:PROVIDER_PRICING_VERIFIED_AT,sources:SOURCES,providers:Object.keys(CATALOG)};
}


export function voiceOriginCost({provider='elevenlabs-v3',characters=0}={}){
 const chars=Math.max(0,Number(characters)||0),p=String(provider||'').toLowerCase();
 if(p==='browser-native')return{ok:true,provider:'browser-native',provider_origin_cost_usd:0,customer_charge_usd:0,markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,pricing_source:'browser-native',pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,characters:chars};
 const perThousand=p==='elevenlabs-v3'?0.10:p==='elevenlabs-v3-conversational'?0.05:p==='elevenlabs-flash-v2.5'||p==='elevenlabs-turbo'?0.05:null;
 if(perThousand==null)return{ok:false,code:'VOICE_PRICING_NOT_VERIFIED',detail:'No verified current origin price is registered for this voice model.'};
 const origin=round(chars/1000*perThousand),customer=variableCustomerCharge(origin);
 return{ok:true,provider:p,characters:chars,origin_usd_per_1000_characters:perThousand,provider_origin_cost_usd:origin,customer_charge_usd:customer.customer_charge_usd,markup_usd:customer.markup_usd,markup_percent:customer.markup_percent,pricing_source:SOURCES.elevenlabs,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT};
}


const GOOGLE_IMAGE_PRICING=Object.freeze({
 'gemini-3.1-flash-lite-image':Object.freeze({
  input_per_million_usd:.25,text_thought_output_per_million_usd:1.5,image_output_per_million_usd:30,
  fixed:Object.freeze({'1K':.0336})
 }),
 'gemini-3.1-flash-image':Object.freeze({
  input_per_million_usd:.50,text_thought_output_per_million_usd:3,image_output_per_million_usd:60,
  fixed:Object.freeze({'0.5K':.045,'1K':.067,'2K':.101,'4K':.151})
 }),
 'gemini-3-pro-image':Object.freeze({
  input_per_million_usd:2,text_thought_output_per_million_usd:12,image_output_per_million_usd:120,
  fixed:Object.freeze({'1K':.134,'2K':.134,'4K':.24})
 })
});
const modalityTokens=(usage={},field,modality)=>{
 const rows=Array.isArray(usage?.[field])?usage[field]:Array.isArray(usage?.[field?.replace(/_([a-z])/g,(_,x)=>x.toUpperCase())])?usage[field.replace(/_([a-z])/g,(_,x)=>x.toUpperCase())]:[];
 return n(rows.find(x=>String(x?.modality||x?.type||'').toLowerCase()===String(modality||'').toLowerCase())?.tokens);
};
const usageNumber=(usage,...keys)=>{
 for(const key of keys){const value=usage?.[key];if(value!=null&&Number.isFinite(Number(value)))return n(value)}
 return 0;
};

export function googleImageOriginCost({model='gemini-3.1-flash-image',image_size='2K',usage={}}={}){
 const modelId=String(model||'gemini-3.1-flash-image'),rate=GOOGLE_IMAGE_PRICING[modelId];
 if(!rate)return{ok:false,code:'IMAGE_MODEL_PRICING_NOT_VERIFIED'};
 const requested=String(image_size||'2K').toUpperCase()==='0.5K'?'0.5K':String(image_size||'2K').toUpperCase();
 const size=modelId==='gemini-3.1-flash-lite-image'?'1K':requested;
 const fixed=rate.fixed[size];
 if(fixed==null)return{ok:false,code:'IMAGE_SIZE_PRICING_NOT_VERIFIED'};
 const input=usageNumber(usage,'total_input_tokens','input_tokens','totalInputTokens','inputTokens');
 const thought=usageNumber(usage,'total_thought_tokens','thought_tokens','totalThoughtTokens','thoughtTokens');
 const imageTokens=modalityTokens(usage,'output_tokens_by_modality','image');
 const totalOut=usageNumber(usage,'total_output_tokens','output_tokens','totalOutputTokens','outputTokens');
 const nonImage=Math.max(0,totalOut-imageTokens);
 const imageCost=imageTokens>0?imageTokens*rate.image_output_per_million_usd/1_000_000:fixed;
 const origin=round(input*rate.input_per_million_usd/1_000_000+(nonImage+thought)*rate.text_thought_output_per_million_usd/1_000_000+imageCost);
 return{ok:true,model:modelId,provider_origin_cost_usd:origin,image_size:size,pricing_source:SOURCES.google_media,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,usage:{input_tokens:input,output_tokens:totalOut,thought_tokens:thought,image_tokens:imageTokens},rates:{...rate,fixed_image_output_usd:imageCost}};
}

export function googleImageReserveUsd(image_size='2K',model='gemini-3.1-flash-image'){
 const modelId=String(model||'gemini-3.1-flash-image'),rate=GOOGLE_IMAGE_PRICING[modelId];
 if(!rate)return null;
 const requested=String(image_size||'2K').toUpperCase()==='0.5K'?'0.5K':String(image_size||'2K').toUpperCase();
 const size=modelId==='gemini-3.1-flash-lite-image'?'1K':requested;
 const fixed=rate.fixed[size];
 return fixed==null?null:round(fixed+.03);
}

export function googleOmniVideoOriginCost({seconds=0,resolution='720p',usage={}}={}){
 const input=usageNumber(usage,'total_input_tokens','input_tokens','totalInputTokens','inputTokens');
 const thought=usageNumber(usage,'total_thought_tokens','thought_tokens','totalThoughtTokens','thoughtTokens');
 const totalOut=usageNumber(usage,'total_output_tokens','output_tokens','totalOutputTokens','outputTokens');
 const videoTokens=modalityTokens(usage,'output_tokens_by_modality','video');
 const textTokens=Math.max(0,totalOut-videoTokens);
 let videoCost=0;
 if(videoTokens>0)videoCost=videoTokens*17.50/1_000_000;
 else if(String(resolution||'720p').toLowerCase()==='720p'&&n(seconds)>0)videoCost=n(seconds)*5792*17.50/1_000_000;
 else return{ok:false,code:'VIDEO_USAGE_EVIDENCE_REQUIRED',detail:'Exact non-720p video pricing requires provider-reported video output token usage.'};
 const origin=round(input*1.50/1_000_000+(textTokens+thought)*9/1_000_000+videoCost);
 return{ok:true,provider_origin_cost_usd:origin,resolution:String(resolution||'720p'),seconds:n(seconds),pricing_source:SOURCES.google_media,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,usage:{input_tokens:input,output_tokens:totalOut,thought_tokens:thought,video_tokens:videoTokens},rates:{input_per_million_usd:1.50,text_thought_output_per_million_usd:9,video_output_per_million_usd:17.50,video_tokens_per_second_720p:5792}};
}

export function googleOmniVideoReserveUsd({seconds=10,resolution='720p'}={}){
 const s=Math.max(3,Math.min(10,n(seconds)||10));
 const base=String(resolution||'720p').toLowerCase()==='720p'?s*5792*17.50/1_000_000:3;
 return round(base+.05);
}

const VEO_VIDEO_RATES=Object.freeze({
 'veo-3.1-lite-generate-preview':Object.freeze({'720p':.05,'1080p':.08}),
 'veo-3.1-fast-generate-preview':Object.freeze({'720p':.10,'1080p':.12,'4k':.30}),
 'veo-3.1-generate-preview':Object.freeze({'720p':.40,'1080p':.40,'4k':.60})
});

export function googleVeoOriginCost({model='veo-3.1-lite-generate-preview',seconds=8,resolution='720p'}={}){
 const modelId=String(model||'veo-3.1-lite-generate-preview'),res=String(resolution||'720p').toLowerCase(),rate=VEO_VIDEO_RATES[modelId]?.[res];
 if(rate==null)return{ok:false,code:'VEO_PRICING_NOT_VERIFIED'};
 const duration=[4,6,8].includes(Number(seconds))?Number(seconds):8;
 const origin=round(duration*rate);
 return{ok:true,model:modelId,resolution:res,seconds:duration,provider_origin_cost_usd:origin,pricing_source:SOURCES.google_media,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,rate_per_second_usd:rate};
}
export function googleVeoReserveUsd(options={}){
 const priced=googleVeoOriginCost(options);return priced.ok?round(priced.provider_origin_cost_usd+.05):null;
}


const GOOGLE_TTS_RATE=Object.freeze({
 'gemini-3.8-flash-tts':Object.freeze({input_per_million_usd:.50,audio_output_per_million_usd:9,audio_usd_per_10_seconds:.00225}),
 'gemini-3.8-flash-lite-tts':Object.freeze({input_per_million_usd:.50,audio_output_per_million_usd:6,audio_usd_per_10_seconds:.0015})
});
export function googleTtsOriginCost({model='gemini-3.8-flash-tts',usage={},audio_seconds=0,billing_mode='paid'}={}){
 const billing=mode(billing_mode),modelId=String(model||'gemini-3.8-flash-tts'),rate=GOOGLE_TTS_RATE[modelId];
 if(!rate)return{ok:false,code:'TTS_PRICING_NOT_VERIFIED'};
 if(billing==='free')return{ok:true,model:modelId,billing_mode:'free',provider_origin_cost_usd:0,pricing_source:SOURCES.google_media,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT};
 if(billing!=='paid')return{ok:false,code:'BILLING_MODE_UNVERIFIED',detail:'Google media billing mode must be explicitly free or paid before metered speech is allowed.'};
 const input=usageNumber(usage,'promptTokenCount','prompt_token_count','input_tokens','total_input_tokens','inputTokens','totalInputTokens');
 const output=usageNumber(usage,'candidatesTokenCount','candidates_token_count','output_tokens','total_output_tokens','outputTokens','totalOutputTokens');
 let origin=0;
 if(output>0)origin=input*rate.input_per_million_usd/1_000_000+output*rate.audio_output_per_million_usd/1_000_000;
 else if(n(audio_seconds)>0)origin=input*rate.input_per_million_usd/1_000_000+(n(audio_seconds)/10)*rate.audio_usd_per_10_seconds;
 else return{ok:false,code:'TTS_USAGE_MISSING',detail:'Speech usage evidence was not returned.'};
 return{ok:true,model:modelId,billing_mode:'paid',provider_origin_cost_usd:round(origin),pricing_source:SOURCES.google_media,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT,usage:{input_tokens:input,output_audio_tokens:output,audio_seconds:n(audio_seconds)},rates:rate};
}
export function googleTtsReserveUsd({model='gemini-3.8-flash-tts',characters=0,estimated_seconds=0}={}){
 const rate=GOOGLE_TTS_RATE[String(model||'gemini-3.8-flash-tts')];if(!rate)return null;
 const seconds=Math.max(n(estimated_seconds),Math.max(1,n(characters)/14));
 return round((seconds/10)*rate.audio_usd_per_10_seconds+.01);
}
