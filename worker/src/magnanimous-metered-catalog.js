export const MAGNANIMOUS_RETAIL_MARKUP_PERCENT=20;
const MULTIPLIER=1+MAGNANIMOUS_RETAIL_MARKUP_PERCENT/100;

export const PREMIUM_AI_PRODUCTS={
  'premium-fast':{
    public_name:'Magnanimous Premium AI',
    model:'@cf/zai-org/glm-5.3-flash',
    origin_provider:'Cloudflare Workers AI',
    origin_input_per_million_usd:0.15,
    origin_cached_input_per_million_usd:0.03,
    origin_output_per_million_usd:0.50,
    source_url:'https://developers.cloudflare.com/workers-ai/models/glm-5.3-flash/',
    source_checked_at:'2026-09-25'
  },
  'premium-max':{
    public_name:'Magnanimous Premium AI Max',
    model:'@cf/zai-org/glm-5.3',
    origin_provider:'Cloudflare Workers AI',
    origin_input_per_million_usd:1.40,
    origin_cached_input_per_million_usd:0.26,
    origin_output_per_million_usd:4.40,
    source_url:'https://developers.cloudflare.com/workers-ai/models/glm-5.3/',
    source_checked_at:'2026-09-25'
  }
};

export const PREMIUM_VOICE_PRODUCT={
 id:'hq-voice',
 public_name:'Magnanimous HQ Voice',
 origin_provider:'ElevenLabs API',
 origin_model:'eleven_flash_v2_5',
 origin_per_1000_characters_usd:0.05,
 source_url:'https://elevenlabs.io/pricing/api',
 source_checked_at:'2026-09-25'
};

const money=value=>Math.max(0,Number(value||0));
export function retailFromOrigin(originUsd){return money(originUsd)*MULTIPLIER}
export function markupFromOrigin(originUsd){return retailFromOrigin(originUsd)-money(originUsd)}
export function estimateTokens(text){return Math.max(1,Math.ceil(String(text||'').length/4))}

export function aiProductForQuality(quality=''){
 const q=String(quality||'').toLowerCase();
 return ['max','maximum','quality','premium-max'].includes(q)?PREMIUM_AI_PRODUCTS['premium-max']:PREMIUM_AI_PRODUCTS['premium-fast'];
}
export function aiProductForModel(model=''){
 return Object.entries(PREMIUM_AI_PRODUCTS).find(([,value])=>value.model===String(model||''))||null;
}
export function quotePremiumAi(productOrId,{input_tokens=0,cached_input_tokens=0,output_tokens=0}={}){
 const product=typeof productOrId==='string'?PREMIUM_AI_PRODUCTS[productOrId]:productOrId;
 if(!product)return null;
 const input=Math.max(0,Number(input_tokens||0)),cached=Math.min(input,Math.max(0,Number(cached_input_tokens||0))),fresh=Math.max(0,input-cached),output=Math.max(0,Number(output_tokens||0));
 const origin=(fresh/1_000_000)*product.origin_input_per_million_usd+(cached/1_000_000)*product.origin_cached_input_per_million_usd+(output/1_000_000)*product.origin_output_per_million_usd;
 const charge=retailFromOrigin(origin);
 return{origin_cost_usd:origin,markup_percent:MAGNANIMOUS_RETAIL_MARKUP_PERCENT,markup_usd:charge-origin,customer_charge_usd:charge,input_tokens:input,cached_input_tokens:cached,output_tokens:output};
}
export function quotePremiumVoice(characters=0){
 const units=Math.max(0,Number(characters||0))/1000,origin=units*PREMIUM_VOICE_PRODUCT.origin_per_1000_characters_usd,charge=retailFromOrigin(origin);
 return{origin_cost_usd:origin,markup_percent:MAGNANIMOUS_RETAIL_MARKUP_PERCENT,markup_usd:charge-origin,customer_charge_usd:charge,characters:Math.max(0,Number(characters||0))};
}
function retailRate(origin){return Number(retailFromOrigin(origin).toFixed(6))}
export function publicPremiumCatalog(env={}){
 const enabled=String(env?.ENABLE_METERED_PROVIDERS||'').toLowerCase()==='true';
 return{
  identity:'Magnanimous AI',
  free_first_default:true,
  premium_opt_in:true,
  prepaid_required:true,
  hard_cap:true,
  markup_percent:MAGNANIMOUS_RETAIL_MARKUP_PERCENT,
  premium_ai:Object.fromEntries(Object.entries(PREMIUM_AI_PRODUCTS).map(([id,p])=>[id,{
   id,name:p.public_name,available:enabled,
   retail_input_per_million_usd:retailRate(p.origin_input_per_million_usd),
   retail_cached_input_per_million_usd:retailRate(p.origin_cached_input_per_million_usd),
   retail_output_per_million_usd:retailRate(p.origin_output_per_million_usd)
  }])),
  premium_voice:{
   id:PREMIUM_VOICE_PRODUCT.id,name:PREMIUM_VOICE_PRODUCT.public_name,
   available:enabled&&Boolean(String(env?.ELEVENLABS_API_KEY||'').trim()&&String(env?.ELEVENLABS_VOICE_ID||'').trim()),
   retail_per_1000_characters_usd:retailRate(PREMIUM_VOICE_PRODUCT.origin_per_1000_characters_usd)
  },
  disclosure:'Premium usage is optional, prepaid/capped, and billed as verified infrastructure cost plus a fixed 20% Magnanimous service markup. Free-first AI and browser speech remain the default.'
 };
}
export function ownerPremiumCatalog(env={}){
 return{
  ...publicPremiumCatalog(env),
  origin_details_owner_only:true,
  premium_ai_origin:PREMIUM_AI_PRODUCTS,
  premium_voice_origin:PREMIUM_VOICE_PRODUCT
 };
}
