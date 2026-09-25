// Published-origin pricing snapshot used only for guarded metered upgrades.
// Magnanimous remains the customer-facing identity. Provider details are owner/internal accounting data.
export const CUSTOMER_MARKUP_PERCENT=20;
export const PRICING_EFFECTIVE_DATE='2026-09-25';

const perMillion=(input,output)=>({unit:'tokens',input_per_million_usd:input,output_per_million_usd:output});
export const ORIGIN_PRICING=Object.freeze({
  'cloudflare:glm-4.7-flash':{...perMillion(0.0605,0.40),tier:'free-first',source:'https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/'},
  'cloudflare:gemma-4-26b-a4b-it':{...perMillion(0.10,0.30),tier:'free-first',source:'https://developers.cloudflare.com/workers-ai/models/gemma-3-12b-it/'},
  'cloudflare:llama-3.1-8b-instruct-fast':{...perMillion(0.045,0.384),tier:'free-first',source:'https://developers.cloudflare.com/workers-ai/platform/pricing/'},
  'cloudflare:llama-3.3-70b-instruct-fp8-fast':{...perMillion(0.293,2.253),tier:'free-first',source:'https://developers.cloudflare.com/workers-ai/platform/pricing/'},
  'cloudflare:nemotron-3-120b-a12b':{...perMillion(0.50,1.50),tier:'free-first',source:'https://developers.cloudflare.com/workers-ai/models/nemotron-3-120b-a12b/'},
  'openai:gpt-6-luna':{...perMillion(0.10,0.50),tier:'metered',source:'https://openai.com/api/pricing/'},
  'openai:gpt-6-sol':{...perMillion(2.00,10.00),tier:'metered',source:'https://openai.com/api/pricing/'},
  'openai:gpt-6-astra':{...perMillion(10.00,50.00),tier:'metered',source:'https://openai.com/api/pricing/'},
  'groq:gpt-oss-20b':{...perMillion(0.075,0.30),tier:'metered',source:'https://groq.com/pricing'},
  'groq:gpt-oss-120b':{...perMillion(0.15,0.60),tier:'metered',source:'https://groq.com/pricing'},
  'elevenlabs:flash-turbo':{unit:'characters',per_thousand_usd:0.05,tier:'metered',source:'https://elevenlabs.io/pricing/api'},
  'elevenlabs:v3':{unit:'characters',per_thousand_usd:0.10,tier:'metered',source:'https://elevenlabs.io/pricing/api'},
  'elevenlabs:speech-engine':{unit:'minutes',per_unit_usd:0.08,tier:'metered',source:'https://elevenlabs.io/pricing/api'}
});

export const FREE_FIRST_LIMITS=Object.freeze({
  cloudflare_neurons_per_day:10000,
  cloudflare_paid_overage_per_1000_neurons_usd:0.011,
  source:'https://developers.cloudflare.com/workers-ai/platform/pricing/'
});

export function markedUp(originUsd){
  const origin=Math.max(0,Number(originUsd||0));
  return Number((origin*(1+CUSTOMER_MARKUP_PERCENT/100)).toFixed(6));
}
export function tokenQuote(key,{input_tokens=0,output_tokens=0}={}){
  const p=ORIGIN_PRICING[key];
  if(!p||p.unit!=='tokens')throw new Error('Unknown token pricing key.');
  const input=Math.max(0,Number(input_tokens||0)),output=Math.max(0,Number(output_tokens||0));
  const origin=(input/1e6)*p.input_per_million_usd+(output/1e6)*p.output_per_million_usd;
  return{origin_cost_usd:Number(origin.toFixed(6)),customer_charge_usd:markedUp(origin),markup_percent:CUSTOMER_MARKUP_PERCENT,pricing_effective_date:PRICING_EFFECTIVE_DATE,source:p.source};
}
export function characterQuote(key,characters=0){
  const p=ORIGIN_PRICING[key];
  if(!p||p.unit!=='characters')throw new Error('Unknown character pricing key.');
  const units=Math.max(0,Number(characters||0));
  const origin=(units/1000)*p.per_thousand_usd;
  return{origin_cost_usd:Number(origin.toFixed(6)),customer_charge_usd:markedUp(origin),markup_percent:CUSTOMER_MARKUP_PERCENT,pricing_effective_date:PRICING_EFFECTIVE_DATE,source:p.source};
}
export function publicMeteredCatalog(){
  return[
    {id:'premium-ai-economy',name:'Magnanimous Premium AI Economy',billing_unit:'1M tokens',input_usd:markedUp(0.10),output_usd:markedUp(0.50),prepaid:true,hard_cap_usd_per_request:0.50},
    {id:'premium-ai-quality',name:'Magnanimous Premium AI Quality',billing_unit:'1M tokens',input_usd:markedUp(2),output_usd:markedUp(10),prepaid:true,hard_cap_usd_per_request:2.00},
    {id:'premium-ai-maximum',name:'Magnanimous Premium AI Maximum',billing_unit:'1M tokens',input_usd:markedUp(10),output_usd:markedUp(50),prepaid:true,hard_cap_usd_per_request:5.00},
    {id:'premium-voice-fast',name:'Magnanimous Premium Voice',billing_unit:'1K characters',price_usd:markedUp(0.05),prepaid:true,hard_cap_characters_per_request:5000}
  ];
}
