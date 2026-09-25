import fs from 'node:fs';

const write=process.argv.includes('--write');
const registryPath='worker/src/premium-origin-costs.js';

async function text(url){
 const r=await fetch(url,{headers:{'user-agent':'Magnanimous-Pricing-Verification/1.0'}});
 if(!r.ok)throw new Error(`Official pricing source returned HTTP ${r.status}: ${url}`);
 return (await r.text()).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');
}
function near(body,label,pattern,span=4000){
 const i=body.toLowerCase().indexOf(label.toLowerCase());
 if(i<0)throw new Error(`Could not find official pricing label: ${label}`);
 const m=body.slice(i,i+span).match(pattern);
 if(!m)throw new Error(`Could not parse official rate near ${label}`);
 return Number(m[1]);
}
function replaceEntry(source,id,value){
 const re=new RegExp(`(${id}:[\\s\\S]*?origin_unit_cost_usd:)\\s*[0-9.]+`);
 if(!re.test(source))throw new Error(`Registry entry missing: ${id}`);
 return source.replace(re,`$1${value}`);
}

const [cf,eleven]=await Promise.all([
 text('https://developers.cloudflare.com/workers-ai/platform/pricing/'),
 text('https://elevenlabs.io/pricing/api')
]);

const cfMatch=cf.match(/\$([0-9.]+)\s*\/\s*1,?000\s*Neurons/i);
if(!cfMatch)throw new Error('Could not parse Workers AI neuron price.');
const rates={
 premium_compute:Number(cfMatch[1]),
 premium_voice_fast:near(eleven,'Flash / Turbo',/\$([0-9.]+)/),
 premium_voice_quality:near(eleven,'v3 Text to Speech',/\$([0-9.]+)/),
 premium_transcription:near(eleven,'Scribe v2 Speech to Text',/\$([0-9.]+)/),
 premium_transcription_realtime:near(eleven,'Scribe v2 Realtime',/\$([0-9.]+)/)
};
for(const [id,value] of Object.entries(rates)){
 if(!Number.isFinite(value)||value<=0||value>10)throw new Error(`Implausible official rate for ${id}: ${value}`);
}
for(const model of ['@cf/zai-org/glm-4.7-flash','@cf/google/gemma-4-26b-a4b-it','@cf/nvidia/nemotron-3-120b-a12b']){
 if(!cf.includes(model))throw new Error(`Approved free-first model no longer appears in official Workers AI pricing: ${model}`);
}

let source=fs.readFileSync(registryPath,'utf8');
for(const [id,value] of Object.entries(rates))source=replaceEntry(source,id,value);
source=source.replace(/export const ORIGIN_COSTS_VERIFIED_AT='[^']+';/,`export const ORIGIN_COSTS_VERIFIED_AT='${new Date().toISOString().slice(0,10)}';`);

if(write)fs.writeFileSync(registryPath,source);
else{
 const current=fs.readFileSync(registryPath,'utf8');
 for(const [id,value] of Object.entries(rates)){
  const re=new RegExp(`${id}:[\\s\\S]*?origin_unit_cost_usd:\\s*${String(value).replace('.','\\.')}`);
  if(!re.test(current))throw new Error(`Origin rate drift detected for ${id}; run with --write.`);
 }
}
console.log(JSON.stringify({ok:true,rates,write},null,2));
