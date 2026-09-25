import {VARIABLE_USAGE_MARKUP_PERCENT} from './magnanimous-billing-policy.js';
export const PROVIDER_PRICING_VERIFIED_AT='2026-09-25';
export const PROVIDER_PRICE_MARKUP_PERCENT=VARIABLE_USAGE_MARKUP_PERCENT;

const SOURCES=Object.freeze({
 openai:'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
 anthropic:'https://www.anthropic.com/news/claude-sonnet-5',
 google:'https://ai.google.dev/gemini-api/docs/pricing',
 groq:'https://console.groq.com/docs/model/openai/gpt-oss-120b',
 mistral:'https://mistral.ai/pricing/api/',
 elevenlabs:'https://elevenlabs.io/pricing/api'
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
  'gpt-5.6':price(4,20,{cachedInput:.4,cacheWrite:4,effectiveUntil:'2026-11-21T23:59:59Z',next:price(5,30,{cachedInput:.5,cacheWrite:5,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
  'gpt-5.6-sol':price(4,20,{cachedInput:.4,cacheWrite:4,effectiveUntil:'2026-11-21T23:59:59Z',next:price(5,30,{cachedInput:.5,cacheWrite:5,longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),longContext:{threshold_input_tokens:272000,input_multiplier:2,output_multiplier:1.5}}),
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
 const perThousand=p==='elevenlabs-v3'?0.10:p==='elevenlabs-v3-conversational'?0.05:null;
 if(perThousand==null)return{ok:false,code:'VOICE_PRICING_NOT_VERIFIED',detail:'No verified current origin price is registered for this voice model.'};
 const origin=round(chars/1000*perThousand),customer=variableCustomerCharge(origin);
 return{ok:true,provider:p,characters:chars,origin_usd_per_1000_characters:perThousand,provider_origin_cost_usd:origin,customer_charge_usd:customer.customer_charge_usd,markup_usd:customer.markup_usd,markup_percent:customer.markup_percent,pricing_source:SOURCES.elevenlabs,pricing_verified_at:PROVIDER_PRICING_VERIFIED_AT};
}
