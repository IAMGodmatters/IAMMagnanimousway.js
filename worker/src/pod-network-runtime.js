import {getProviderRuntimeEnv} from './provider-runtime-env.js';
import {requirePlatformOwner} from './platform-owner-guard.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const THEMES=['scripture','inspirational','sarcastic','cute-meme'];
const PROVIDERS=[
 {id:'printful',keys:['PRINTFUL_API_TOKEN'],api:'https://api.printful.com/',freeEntry:true},
 {id:'printify',keys:['PRINTIFY_API_TOKEN','PRINTIFY_SHOP_ID'],api:'https://api.printify.com/v2/',freeEntry:true},
 {id:'gelato',keys:['GELATO_API_KEY'],api:'https://order.gelatoapis.com/v4/',freeEntry:true},
 {id:'prodigi',keys:['PRODIGI_API_KEY'],api:'https://api.prodigi.com/v4.0/',freeEntry:true},
 {id:'gooten',keys:['GOOTEN_RECIPE_ID','GOOTEN_PARTNER_BILLING_KEY'],api:'https://api.print.io/api/v/5/source/api/',freeEntry:true}
];
function cleanText(value,max=120){return String(value||'').replace(/[<>]/g,'').trim().slice(0,max)}
function esc(value){return cleanText(value,240).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}
function dayKey(date=new Date()){return date.toISOString().slice(0,10)}
function ordinalDay(date=new Date()){const start=Date.UTC(date.getUTCFullYear(),0,1);return Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-start)/86400000)+1}
async function runtime(env){return getProviderRuntimeEnv(env)}
function parseJson(value,fallback={}){try{const parsed=JSON.parse(String(value||''));return parsed&&typeof parsed==='object'?parsed:fallback}catch{return fallback}}
function publicOrigin(rt){try{return new URL(String(rt.PUBLIC_SITE_URL||'https://iammagnanimousway.com')).origin}catch{return'https://iammagnanimousway.com'}}
export async function podProviderStatus(env){
 const rt=await runtime(env),requested=String(rt.POD_PROVIDER_PRIORITY||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),rank=new Map(requested.map((id,i)=>[id,i]));
 const providers=PROVIDERS.map((p,index)=>({...p,connected:p.keys.every(k=>Boolean(String(rt[k]||'').trim())),priority:rank.has(p.id)?rank.get(p.id):requested.length+index})).sort((a,b)=>a.priority-b.priority);
 return{providers,connected:providers.filter(p=>p.connected).map(p=>p.id),autoFulfill:String(rt.STORE_POD_AUTO_FULFILL||'true').toLowerCase()==='true',maxUsd:Math.max(0,Number(rt.STORE_POD_AUTO_FULFILL_MAX_USD||100))};
}
async function templateForDay(env,theme,index){
 const {results=[]}=await env.DB.prepare('SELECT * FROM store_pod_design_templates WHERE active=1 AND theme=? ORDER BY id').bind(theme).all();
 if(!results.length)return null;return results[index%results.length];
}
async function reconcilePodJobs(env,designIds=[]){
 const ts=now();let jobs=0;
 let designs=designIds;
 if(!designs.length){const rows=await env.DB.prepare("SELECT id FROM store_pod_designs WHERE status IN ('ready','published') ORDER BY created_at DESC LIMIT 80").all();designs=(rows.results||[]).map(x=>String(x.id))}
 const {results:types=[]}=await env.DB.prepare('SELECT id FROM store_pod_product_types WHERE active=1 ORDER BY sort_order,id').all();
 for(const designId of designs)for(const type of types){
  const result=await env.DB.prepare("INSERT OR IGNORE INTO store_pod_jobs(id,design_id,product_type_id,status,created_at,updated_at,attempt_count,next_attempt_at) VALUES(?,?,?,?,?,?,0,0)").bind(crypto.randomUUID(),designId,type.id,'design_ready',ts,ts).run();
  if(Number(result?.meta?.changes||0)>0)jobs++;
 }
 return jobs;
}
export async function scheduledPodCreative(env){
 const today=dayKey(),index=ordinalDay()-1,ts=now();let created=0;const createdIds=[];
 for(let i=0;i<THEMES.length;i++){
  const theme=THEMES[i],existing=await env.DB.prepare('SELECT id FROM store_pod_designs WHERE day_key=? AND theme=?').bind(today,theme).first();
  if(existing){createdIds.push(String(existing.id));continue}
  const tpl=await templateForDay(env,theme,index+i);if(!tpl)continue;const id=`pod_${today.replaceAll('-','')}_${theme.replaceAll('-','_')}`;
  await env.DB.prepare('INSERT INTO store_pod_designs(id,template_id,day_key,theme,title,text_primary,text_secondary,scripture_ref,art_motif,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,\'ready\',?)').bind(id,tpl.id,today,theme,tpl.title,tpl.text_primary,tpl.text_secondary,tpl.scripture_ref,tpl.art_motif,ts).run();created++;createdIds.push(id);
 }
 const jobs=await reconcilePodJobs(env,createdIds);
 return{created,jobs,day:today};
}
function motifSvg(motif,theme){
 const m=String(motif||'').toLowerCase();
 if(m==='heart')return'<path d="M400 655C190 520 110 400 145 300c43-122 193-119 255-22 62-97 212-100 255 22 35 100-45 220-255 355Z" fill="none" stroke="currentColor" stroke-width="22"/>';
 if(m==='paw')return'<g fill="currentColor"><circle cx="400" cy="420" r="92"/><circle cx="270" cy="310" r="44"/><circle cx="360" cy="255" r="44"/><circle cx="455" cy="255" r="44"/><circle cx="540" cy="315" r="44"/></g>';
 if(['star','stars','spark'].includes(m))return'<path d="m400 205 45 113 121 8-93 78 30 118-103-64-103 64 30-118-93-78 121-8Z" fill="none" stroke="currentColor" stroke-width="20"/>';
 if(['sun','sunrise','sunburst'].includes(m))return'<g fill="none" stroke="currentColor" stroke-width="18"><circle cx="400" cy="360" r="90"/><path d="M400 190v75M400 455v75M230 360h75M495 360h75M280 240l53 53M467 427l53 53M520 240l-53 53M333 427l-53 53"/></g>';
 if(m==='mountain')return'<path d="M185 545 350 285l70 105 70-80 135 235H185Z" fill="none" stroke="currentColor" stroke-width="20"/><path d="m318 335 32-50 34 51" fill="none" stroke="currentColor" stroke-width="14"/>';
 if(m==='steps')return'<path d="M210 545h95v-85h95v-85h95v-85h95" fill="none" stroke="currentColor" stroke-width="22"/>';
 if(['waves','dove'].includes(m))return m==='waves'?'<path d="M190 330q70-70 140 0t140 0t140 0M190 425q70-70 140 0t140 0t140 0" fill="none" stroke="currentColor" stroke-width="18"/>':'<path d="M220 430q115-170 220-55 80-105 175-65-62 54-105 132-92 108-290-12Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(['prayer','hands'].includes(m))return'<path d="M330 520q-55-115-15-245 35-60 67 15l18 90 18-90q32-75 67-15 40 130-15 245M330 520h140" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='book')return'<path d="M205 285q105-45 195 20v250q-90-65-195-20V285Zm390 0q-105-45-195 20v250q90-65 195-20V285Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='shield')return'<path d="M400 210 575 275v120q0 135-175 220-175-85-175-220V275l175-65Z" fill="none" stroke="currentColor" stroke-width="20"/>';
 if(['arrow','refresh'].includes(m))return m==='arrow'?'<path d="M225 500 525 255m0 0-8 120m8-120-120 8" fill="none" stroke="currentColor" stroke-width="22"/>':'<path d="M545 300a170 170 0 1 0 18 150M545 300h-95m95 0v-95" fill="none" stroke="currentColor" stroke-width="20"/>';
 if(['calendar','clock'].includes(m))return m==='calendar'?'<g fill="none" stroke="currentColor" stroke-width="18"><rect x="235" y="255" width="330" height="300" rx="28"/><path d="M235 340h330M315 225v70M485 225v70"/></g>':'<g fill="none" stroke="currentColor" stroke-width="18"><circle cx="400" cy="380" r="160"/><path d="M400 275v115l80 50"/></g>';
 if(['leaf','sprout'].includes(m))return'<path d="M400 560q-15-185 135-260-5 160-135 190-130-30-135-150 130 30 135 145" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(['lamp','light'].includes(m))return'<g fill="none" stroke="currentColor" stroke-width="18"><path d="M310 420q0-160 90-160t90 160l-40 45H350l-40-45Z"/><path d="M350 500h100M365 540h70"/></g>';
 if(['check','list'].includes(m))return'<g fill="none" stroke="currentColor" stroke-width="18"><rect x="235" y="240" width="330" height="330" rx="25"/><path d="m295 350 45 45 80-90M295 470h200"/></g>';
 if(['box','folder'].includes(m))return m==='box'?'<path d="m250 300 150-75 150 75v210l-150 75-150-75V300Zm0 0 150 80 150-80M400 380v205" fill="none" stroke="currentColor" stroke-width="18"/>':'<path d="M220 300h160l45 55h155v205H220V300Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(['snack','cookie','bean'].includes(m))return'<g fill="none" stroke="currentColor" stroke-width="18"><circle cx="400" cy="380" r="150"/><circle cx="350" cy="330" r="12" fill="currentColor"/><circle cx="455" cy="355" r="12" fill="currentColor"/><circle cx="390" cy="440" r="12" fill="currentColor"/></g>';
 if(m==='brain')return'<path d="M315 520q-95-50-55-135-40-90 45-125 25-85 95-35 70-50 95 35 85 35 45 125 40 85-55 135-45 35-85-5-40 40-85 5Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='battery')return'<g fill="none" stroke="currentColor" stroke-width="18"><rect x="235" y="300" width="310" height="170" rx="25"/><path d="M545 345h35v80h-35M275 385h100"/></g>';
 if(m==='loader')return'<g fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round"><path d="M400 225v55M400 480v55M245 380h55M500 380h55M290 270l40 40M470 450l40 40M510 270l-40 40M330 450l-40 40"/></g>';
 if(m==='mug')return'<path d="M250 300h260v210q0 65-65 65H315q-65 0-65-65V300Zm260 55h55q65 0 65 70t-65 70h-55" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='moon')return'<path d="M470 220q-135 55-100 190t175 105q-75 100-205 45-135-58-120-205 15-145 160-175 45-9 90 40Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='crown')return'<path d="m230 490-35-190 115 90 90-145 90 145 115-90-35 190H230Zm10 55h320" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='cloud')return'<path d="M250 505q-75 0-75-75 0-70 70-75 25-115 135-90 75-80 155-15 95-5 105 90 70 20 55 95-12 70-90 70H250Z" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(m==='shepherd')return'<path d="M420 225q120 0 85 110-18 55-85 65v160M300 520q100-95 200 0" fill="none" stroke="currentColor" stroke-width="18"/>';
 if(theme==='cute-meme')return'<g fill="none" stroke="currentColor" stroke-width="18"><circle cx="400" cy="365" r="125"/><circle cx="355" cy="340" r="8" fill="currentColor"/><circle cx="445" cy="340" r="8" fill="currentColor"/><path d="M350 405q50 45 100 0"/></g>';
 return'<circle cx="400" cy="360" r="135" fill="none" stroke="currentColor" stroke-width="18" opacity=".55"/><path d="M265 360h270M400 225v270" stroke="currentColor" stroke-width="8" opacity=".35"/>';
}
async function renderArt(env,id){
 const row=await env.DB.prepare("SELECT * FROM store_pod_designs WHERE id=? AND status IN ('ready','published')").bind(String(id||'')).first();if(!row)return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 const primary=esc(row.text_primary),secondary=esc(row.scripture_ref||row.text_secondary),theme=String(row.theme||'');
 const accent=theme==='scripture'?'#F6D77A':theme==='inspirational'?'#7DE8FF':theme==='sarcastic'?'#FFB3D1':'#B9F4C8';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="3000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#071429"/><g color="${accent}">${motifSvg(String(row.art_motif||''),theme)}</g><text x="400" y="665" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="48" font-weight="800"><tspan x="400" dy="0">${primary.slice(0,34)}</tspan>${primary.length>34?`<tspan x="400" dy="58">${primary.slice(34,68)}</tspan>`:''}${primary.length>68?`<tspan x="400" dy="58">${primary.slice(68,102)}</tspan>`:''}</text><text x="400" y="865" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="28" font-weight="700">${secondary}</text><text x="400" y="935" text-anchor="middle" fill="#98BBD0" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">I AM MAGNANIMOUS WAY™</text></svg>`;
 return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=300, must-revalidate'}});
}
function mockupBody(typeId){
 const id=String(typeId||'');
 if(id==='pod_tee')return'<path d="M210 245 315 190h170l105 55 82 120-95 58-44-68v375H267V355l-44 68-95-58 82-120Z" fill="#f7f7f5" stroke="#d7dce2" stroke-width="5"/>';
 if(id==='pod_hoodie')return'<path d="M246 270 325 215q75-75 150 0l79 55 72 128-94 48-42-73v360H310V373l-42 73-94-48 72-128Z" fill="#f4f4f2" stroke="#d7dce2" stroke-width="5"/><path d="M325 215q75 125 150 0M360 315h80" fill="none" stroke="#d7dce2" stroke-width="5"/>';
 if(id==='pod_sweatshirt')return'<path d="M235 275 325 215h150l90 60 82 155-88 45-58-105v360H299V370l-58 105-88-45 82-155Z" fill="#f6f6f4" stroke="#d7dce2" stroke-width="5"/>';
 if(id==='pod_mug')return'<path d="M235 320h310v300q0 80-80 80H315q-80 0-80-80V320Z" fill="#fbfbf8" stroke="#d7dce2" stroke-width="6"/><path d="M545 375h70q95 0 95 105t-95 105h-70" fill="none" stroke="#d7dce2" stroke-width="24"/>';
 if(id==='pod_tumbler')return'<path d="M300 200h200l-24 530H324L300 200Z" fill="#f9faf8" stroke="#d7dce2" stroke-width="6"/><path d="M320 200h160l-18-55H338l-18 55Z" fill="#e8edf0"/><path d="M400 145v-45" stroke="#d7dce2" stroke-width="10"/>';
 if(id==='pod_travel_cup')return'<path d="M285 245h230l-28 475H313L285 245Z" fill="#fafaf7" stroke="#d7dce2" stroke-width="6"/><path d="M300 245h200l-15-70H315l-15 70Z" fill="#e8edf0"/>';
 if(id==='pod_water_bottle')return'<path d="M330 240h140l22 80v380q0 48-48 48h-88q-48 0-48-48V320l22-80Z" fill="#f9faf8" stroke="#d7dce2" stroke-width="6"/><path d="M355 160h90v80h-90z" fill="#e8edf0" stroke="#d7dce2" stroke-width="5"/>';
 if(id==='pod_tote')return'<path d="M220 315h360l-35 420H255l-35-420Z" fill="#f4ead6" stroke="#d0c4ad" stroke-width="6"/><path d="M305 315q0-150 95-150t95 150" fill="none" stroke="#d0c4ad" stroke-width="18"/>';
 return'<rect x="190" y="155" width="420" height="585" rx="10" fill="#fff" stroke="#d7dce2" stroke-width="12"/><rect x="220" y="185" width="360" height="525" fill="#f7f7f5"/>';
}
async function renderMockup(env,id,typeId){
 const [row,type]=await Promise.all([env.DB.prepare("SELECT * FROM store_pod_designs WHERE id=? AND status IN ('ready','published')").bind(String(id||'')).first(),env.DB.prepare('SELECT id,name FROM store_pod_product_types WHERE id=? AND active=1').bind(String(typeId||'')).first()]);
 if(!row||!type)return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 const primary=esc(row.text_primary),secondary=esc(row.scripture_ref||row.text_secondary),theme=String(row.theme||''),accent=theme==='scripture'?'#8b6415':theme==='inspirational'?'#176c85':theme==='sarcastic'?'#9a315d':'#2f7550';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 800 900"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f7f8fa"/><stop offset="1" stop-color="#e8edf2"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".2"/></filter></defs><rect width="800" height="900" fill="url(#bg)"/><g filter="url(#shadow)">${mockupBody(type.id)}</g><g transform="translate(285 350)"><rect width="230" height="230" rx="16" fill="#071429" opacity=".96"/><text x="115" y="72" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="24" font-weight="800"><tspan x="115">${primary.slice(0,20)}</tspan>${primary.length>20?`<tspan x="115" dy="32">${primary.slice(20,40)}</tspan>`:''}${primary.length>40?`<tspan x="115" dy="32">${primary.slice(40,60)}</tspan>`:''}</text><text x="115" y="188" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="14" font-weight="700">${secondary.slice(0,28)}</text></g><text x="400" y="835" text-anchor="middle" fill="#253345" font-family="Arial,sans-serif" font-size="20" font-weight="800">${esc(type.name)}</text><text x="400" y="865" text-anchor="middle" fill="#687789" font-family="Arial,sans-serif" font-size="13">Preview mockup • I AM MAGNANIMOUS WAY™</text></svg>`;
 return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=300, must-revalidate'}});
}
function printfulHeaders(rt){const h={'authorization':`Bearer ${String(rt.PRINTFUL_API_TOKEN||'').trim()}`,'content-type':'application/json'};const store=String(rt.PRINTFUL_STORE_ID||'').trim();if(store)h['x-pf-store-id']=store;return h}
function nextRetry(attempt){return now()+Math.min(21600,300*(2**Math.min(6,Math.max(0,attempt-1))))}
const RETRYABLE_POD_STATES=new Set(['retry','provider_setup_required','provider_mapping_required','printfile_review_required','provider_adapter_required','processing']);
async function updateJob(env,job,status,error='',extra={}){
 const ts=now(),attempt=Number(job.attempt_count||0)+1,nextAttempt=RETRYABLE_POD_STATES.has(status)?nextRetry(attempt):0;
 await env.DB.prepare('UPDATE store_pod_jobs SET status=?,provider=?,provider_product_id=?,provider_variant_id=?,last_error=?,attempt_count=?,next_attempt_at=?,updated_at=? WHERE id=?').bind(status,String(extra.provider??job.provider??''),String(extra.providerProductId??job.provider_product_id??''),String(extra.providerVariantId??job.provider_variant_id??''),cleanText(error,500),attempt,nextAttempt,ts,job.id).run();
}
async function publishPrintfulJob(env,rt,job){
 const variantMap=parseJson(rt.PRINTFUL_VARIANT_MAP_JSON,{}),mapping=variantMap[String(job.product_type_id||'')];
 if(!mapping||!Number(mapping.variant_id))return updateJob(env,job,'provider_mapping_required',`No verified Printful catalog variant is mapped for ${job.product_type_id}.`,{provider:'printful'});
 const template=String(rt.POD_PRINTFILE_URL_TEMPLATE||'').trim();
 if(!template||!template.includes('{design_id}'))return updateJob(env,job,'printfile_review_required','A reviewed printable PNG/JPEG URL template is required before provider publishing.',{provider:'printful'});
 const fileUrl=template.replaceAll('{design_id}',encodeURIComponent(String(job.design_id))).replaceAll('{product_type_id}',encodeURIComponent(String(job.product_type_id)));
 if(!/^https:\/\//i.test(fileUrl)||!/(?:\.png|\.jpe?g)(?:\?|$)/i.test(fileUrl))return updateJob(env,job,'printfile_review_required','POD print-file URLs must be HTTPS PNG/JPEG files reviewed for the mapped product.',{provider:'printful'});
 const externalId=`magnanimous-${job.design_id}-${job.product_type_id}`.slice(0,180),retail=Number(mapping.retail_price||0);
 const payload={sync_product:{external_id:externalId,name:cleanText(`${job.title} — ${job.product_type_name}`,180)},sync_variants:[{external_id:`${externalId}-1`,variant_id:Number(mapping.variant_id),files:[{type:String(mapping.file_type||'default'),url:fileUrl}]}]};
 if(retail>0)payload.sync_variants[0].retail_price=retail.toFixed(2);
 let response,data;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{response=await fetch('https://api.printful.com/store/products',{method:'POST',headers:printfulHeaders(rt),body:JSON.stringify(payload),signal:controller.signal});data=await response.json().catch(()=>({}))}catch(error){return updateJob(env,job,'retry',`Printful request failed: ${String(error?.name==='AbortError'?'request timed out':error?.message||error)}`,{provider:'printful'})}finally{clearTimeout(timer)}
 if(response.ok&&data?.result?.id){return updateJob(env,job,'provider_ready','',{provider:'printful',providerProductId:String(data.result.id),providerVariantId:String(mapping.variant_id)})}
 if(response.status===429||response.status>=500)return updateJob(env,job,'retry',String(data?.error?.message||data?.result||`Printful HTTP ${response.status}`),{provider:'printful'});
 return updateJob(env,job,'provider_review_required',String(data?.error?.message||data?.result||`Printful rejected product setup (HTTP ${response.status}).`),{provider:'printful'});
}
export async function processPodJobs(env){
 const rt=await runtime(env),status=await podProviderStatus(rt),connected=status.providers.find(p=>p.connected),ts=now();
 if(!connected)return{processed:0,provider:'',queued:0,reason:'provider_not_connected'};
 const {results:jobs=[]}=await env.DB.prepare(`SELECT j.*,d.title,t.name AS product_type_name FROM store_pod_jobs j JOIN store_pod_designs d ON d.id=j.design_id JOIN store_pod_product_types t ON t.id=j.product_type_id WHERE d.status IN ('ready','published') AND j.status IN ('design_ready','retry','provider_setup_required','provider_mapping_required','printfile_review_required','provider_adapter_required','processing') AND COALESCE(j.next_attempt_at,0)<=? ORDER BY j.updated_at,j.id LIMIT 2`).bind(ts).all();
 let processed=0;
 for(const job of jobs){
  const claimUntil=ts+300,claim=await env.DB.prepare("UPDATE store_pod_jobs SET status='processing',next_attempt_at=?,updated_at=? WHERE id=? AND status=? AND updated_at=?").bind(claimUntil,ts,job.id,job.status,job.updated_at).run();
  if(Number(claim?.meta?.changes||0)!==1)continue;
  const claimed={...job,status:'processing',next_attempt_at:claimUntil,updated_at:ts};
  if(connected.id==='printful'){await publishPrintfulJob(env,rt,claimed);processed++;continue}
  await updateJob(env,claimed,'provider_adapter_required',`${connected.id} is connected, but its safe native product-publishing adapter has not been enabled.`,{provider:connected.id});processed++;
 }
 return{processed,provider:connected.id,queued:jobs.length};
}
async function publicDesigns(request,env){
 const origin=new URL(request.url).origin,[designRows,typeRows]=await Promise.all([env.DB.prepare("SELECT id,day_key,theme,title,text_primary,text_secondary,scripture_ref,status FROM store_pod_designs WHERE status IN ('ready','published') ORDER BY day_key DESC,theme LIMIT 20").all(),env.DB.prepare('SELECT id,name,category_slug,sort_order FROM store_pod_product_types WHERE active=1 ORDER BY sort_order,id').all()]);
 const types=(typeRows.results||[]).map(type=>({id:String(type.id),name:String(type.name),category:String(type.category_slug||'')}));
 const designs=(designRows.results||[]).map(row=>({...row,art_url:`${origin}/store-api/pod/art/${encodeURIComponent(row.id)}.svg`,mockups:types.map(type=>({...type,url:`${origin}/store-api/pod/mockup/${encodeURIComponent(row.id)}/${encodeURIComponent(type.id)}.svg`}))}));
 return json({collection:'Daily Originals',daily:true,designs,product_types:types});
}
async function ownerStatus(request,env){const guard=await requirePlatformOwner(request,env);if(guard)return guard;const status=await podProviderStatus(env),{results:jobs=[]}=await env.DB.prepare('SELECT status,COUNT(*) AS count FROM store_pod_jobs GROUP BY status ORDER BY status').all(),{results:days=[]}=await env.DB.prepare('SELECT day_key,COUNT(*) AS designs FROM store_pod_designs GROUP BY day_key ORDER BY day_key DESC LIMIT 14').all();return json({providers:status.providers.map(({id,connected,priority,freeEntry})=>({id,connected,priority,free_entry:freeEntry})),auto_fulfill:status.autoFulfill,max_auto_usd:status.maxUsd,jobs,days,truth_boundary:'Provider-ready means product setup is verified; customer checkout remains disabled until live cost and fulfillment billing are safely funded.'})}
export async function handlePodNetwork(request,env){const url=new URL(request.url);if(url.pathname==='/api/store/pod/designs'&&request.method==='GET')return publicDesigns(request,env);const art=url.pathname.match(/^\/api\/store\/pod\/art\/([^/]+)\.svg$/);if(art&&request.method==='GET')return renderArt(env,decodeURIComponent(art[1]));const mockup=url.pathname.match(/^\/api\/store\/pod\/mockup\/([^/]+)\/([^/]+)\.svg$/);if(mockup&&request.method==='GET')return renderMockup(env,decodeURIComponent(mockup[1]),decodeURIComponent(mockup[2]));if(url.pathname==='/api/store/owner/pod'&&request.method==='GET')return ownerStatus(request,env);return null}
