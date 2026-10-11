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
export async function podProviderStatus(env){
 const rt=await runtime(env),requested=String(rt.POD_PROVIDER_PRIORITY||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),rank=new Map(requested.map((id,i)=>[id,i]));
 const providers=PROVIDERS.map((p,index)=>({...p,connected:p.keys.every(k=>Boolean(String(rt[k]||'').trim())),priority:rank.has(p.id)?rank.get(p.id):requested.length+index})).sort((a,b)=>a.priority-b.priority);
 return{providers,connected:providers.filter(p=>p.connected).map(p=>p.id),autoFulfill:String(rt.STORE_POD_AUTO_FULFILL||'true').toLowerCase()==='true',maxUsd:Math.max(0,Number(rt.STORE_POD_AUTO_FULFILL_MAX_USD||100))};
}
async function templateForDay(env,theme,index){
 const {results=[]}=await env.DB.prepare('SELECT * FROM store_pod_design_templates WHERE active=1 AND theme=? ORDER BY id').bind(theme).all();
 if(!results.length)return null;return results[index%results.length];
}
export async function scheduledPodCreative(env){
 const today=dayKey(),index=ordinalDay()-1,ts=now();let created=0,jobs=0;
 const {results:types=[]}=await env.DB.prepare('SELECT id FROM store_pod_product_types WHERE active=1 ORDER BY sort_order,id').all();
 for(let i=0;i<THEMES.length;i++){
  const theme=THEMES[i],existing=await env.DB.prepare('SELECT id FROM store_pod_designs WHERE day_key=? AND theme=?').bind(today,theme).first();if(existing)continue;
  const tpl=await templateForDay(env,theme,index+i);if(!tpl)continue;const id=`pod_${today.replaceAll('-','')}_${theme.replaceAll('-','_')}`;
  await env.DB.prepare('INSERT INTO store_pod_designs(id,template_id,day_key,theme,title,text_primary,text_secondary,scripture_ref,art_motif,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,\'ready\',?)').bind(id,tpl.id,today,theme,tpl.title,tpl.text_primary,tpl.text_secondary,tpl.scripture_ref,tpl.art_motif,ts).run();created++;
  for(const type of types){await env.DB.prepare('INSERT OR IGNORE INTO store_pod_jobs(id,design_id,product_type_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,type.id,'design_ready',ts,ts).run();jobs++}
 }
 return{created,jobs,day:today};
}
function motifSvg(motif,theme){
 if(motif==='heart')return'<path d="M400 655C190 520 110 400 145 300c43-122 193-119 255-22 62-97 212-100 255 22 35 100-45 220-255 355Z" fill="none" stroke="currentColor" stroke-width="22"/>';
 if(motif==='paw')return'<g fill="currentColor"><circle cx="400" cy="420" r="92"/><circle cx="270" cy="310" r="44"/><circle cx="360" cy="255" r="44"/><circle cx="455" cy="255" r="44"/><circle cx="540" cy="315" r="44"/></g>';
 if(motif==='star'||motif==='stars'||motif==='spark')return'<path d="m400 205 45 113 121 8-93 78 30 118-103-64-103 64 30-118-93-78 121-8Z" fill="none" stroke="currentColor" stroke-width="20"/>';
 if(theme==='cute-meme')return'<g fill="none" stroke="currentColor" stroke-width="18"><circle cx="400" cy="365" r="125"/><circle cx="355" cy="340" r="8" fill="currentColor"/><circle cx="445" cy="340" r="8" fill="currentColor"/><path d="M350 405q50 45 100 0"/></g>';
 return'<circle cx="400" cy="360" r="135" fill="none" stroke="currentColor" stroke-width="18" opacity=".55"/><path d="M265 360h270M400 225v270" stroke="currentColor" stroke-width="8" opacity=".35"/>';
}
async function renderArt(env,id){
 const row=await env.DB.prepare('SELECT * FROM store_pod_designs WHERE id=?').bind(String(id||'')).first();if(!row)return new Response('Not found',{status:404});
 const primary=esc(row.text_primary),secondary=esc(row.scripture_ref||row.text_secondary),theme=String(row.theme||'');
 const accent=theme==='scripture'?'#F6D77A':theme==='inspirational'?'#7DE8FF':theme==='sarcastic'?'#FFB3D1':'#B9F4C8';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="3000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#071429"/><g color="${accent}">${motifSvg(String(row.art_motif||''),theme)}</g><text x="400" y="665" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="48" font-weight="800"><tspan x="400" dy="0">${primary.slice(0,34)}</tspan>${primary.length>34?`<tspan x="400" dy="58">${primary.slice(34,68)}</tspan>`:''}${primary.length>68?`<tspan x="400" dy="58">${primary.slice(68,102)}</tspan>`:''}</text><text x="400" y="865" text-anchor="middle" fill="${accent}" font-family="Arial,sans-serif" font-size="28" font-weight="700">${secondary}</text><text x="400" y="935" text-anchor="middle" fill="#98BBD0" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">I AM MAGNANIMOUS WAY™</text></svg>`;
 return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=86400'}});
}
async function publicDesigns(request,env){
 await scheduledPodCreative(env).catch(()=>null);const origin=new URL(request.url).origin,{results=[]}=await env.DB.prepare("SELECT id,day_key,theme,title,text_primary,text_secondary,scripture_ref,status FROM store_pod_designs WHERE status IN ('ready','published') ORDER BY day_key DESC,theme LIMIT 40").all();
 return json({collection:'Magnanimous Print-on-Demand',daily:true,designs:results.map(row=>({...row,art_url:`${origin}/store-api/pod/art/${encodeURIComponent(row.id)}.svg`}))});
}
async function ownerStatus(request,env){const guard=await requirePlatformOwner(request,env);if(guard)return guard;const status=await podProviderStatus(env),{results:jobs=[]}=await env.DB.prepare('SELECT status,COUNT(*) AS count FROM store_pod_jobs GROUP BY status ORDER BY status').all(),{results:days=[]}=await env.DB.prepare('SELECT day_key,COUNT(*) AS designs FROM store_pod_designs GROUP BY day_key ORDER BY day_key DESC LIMIT 14').all();return json({providers:status.providers.map(({id,connected,priority,freeEntry})=>({id,connected,priority,free_entry:freeEntry})),auto_fulfill:status.autoFulfill,max_auto_usd:status.maxUsd,jobs,days})}
export async function handlePodNetwork(request,env){const url=new URL(request.url);if(url.pathname==='/api/store/pod/designs'&&request.method==='GET')return publicDesigns(request,env);const art=url.pathname.match(/^\/api\/store\/pod\/art\/([^/]+)\.svg$/);if(art&&request.method==='GET')return renderArt(env,decodeURIComponent(art[1]));if(url.pathname==='/api/store/owner/pod'&&request.method==='GET')return ownerStatus(request,env);return null}
