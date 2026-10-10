import { currentUser } from './integrations.js';
import { getMagnanimousRenderingCapabilitySummary } from './magnanimous-hcti-capability-registry.js';
import { platformOwnerDeveloperIdentity } from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=1000000)=>String(v??'').slice(0,n);
const formats=new Set(['png','jpg','jpeg','webp','pdf']);

function normalizeFormat(v){
 const f=String(v||'png').toLowerCase();
 if(!formats.has(f))throw new Error('format must be png, jpg, jpeg, webp, or pdf.');
 return f==='jpeg'?'jpg':f;
}
function contentType(format){
 return format==='pdf'?'application/pdf':format==='jpg'?'image/jpeg':'image/'+format;
}
function b64bytes(value){
 const s=String(value||'');
 if(!s)return new Uint8Array();
 const raw=atob(s),out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out;
}
function safeTenant(value){return String(value||'tenant').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,120)||'tenant'}
function parseJson(value,fallback={}){try{return JSON.parse(String(value||''))}catch{return fallback}}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getPath(obj,path){
 return String(path||'').split('.').reduce((v,k)=>v&&typeof v==='object'?v[k]:undefined,obj);
}
function applyTemplate(value,vars){
 return String(value||'').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,(m,key)=>{
  const v=getPath(vars,key);
  return v===undefined?m:escapeHtml(v);
 });
}
function renderServices(env){
 return{
  browser:env?.MAGNANIMOUS_BROWSER||env?.BROWSER||null,
  images:env?.MAGNANIMOUS_IMAGES||env?.IMAGES||null,
  objects:env?.MAGNANIMOUS_OBJECT_STORE||env?.OBJECT_STORE||null
 };
}
function readiness(env){
 const s=renderServices(env);
 return{
  browser_configured:Boolean(s.browser?.configured??s.browser),
  image_transform_configured:Boolean(s.images?.configured??s.images),
  object_store_configured:Boolean(s.objects),
  native_runtime_ready:Boolean((s.browser?.configured??s.browser)&&s.objects),
  third_party_renderer_required:false
 };
}
async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_render_templates(
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  version INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL,
  css TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,id,version)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_render_events(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'html',
  format TEXT NOT NULL DEFAULT 'png',
  content_type TEXT NOT NULL DEFAULT 'image/png',
  bytes INTEGER NOT NULL DEFAULT 0,
  object_key TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
 )`).run();
}
async function authUser(request,env){
 return await currentUser(request,env).catch(()=>null);
}
async function ownerCapabilityAccess(request,env){
 const user=await authUser(request,env);
 if(!user)return false;
 return Boolean((await platformOwnerDeveloperIdentity(user,env)).authorized);
}
function publicCapabilitySummary(){
 return{
  identity:'Magnanimous Native Rendering',
  brain:'Magnanimous AI',
  native_first:true,
  free_first:true,
  third_party_renderer_required:false,
  capabilities:['html-css-to-image','url-to-image','png-output','jpeg-output','webp-output','pdf-output','batch-rendering','templates','stored-render-artifacts'],
  note:'Magnanimous-owned rendering is the customer-facing capability. External implementation details remain private and replaceable.'
 };
}
function fileUrl(request,id,format){
 return new URL('/api/magnanimous/native-rendering/files/'+encodeURIComponent(id)+'.'+format,request.url).toString();
}
async function recordRender(env,user,meta){
 if(!env?.DB)return;
 await ensureSchema(env);
 await env.DB.prepare(`INSERT INTO magnanimous_render_events
  (id,tenant_id,kind,format,content_type,bytes,object_key,source_url,created_at)
  VALUES(?,?,?,?,?,?,?,?,?)`).bind(
   meta.id,user.tenant_id,meta.kind,meta.format,meta.content_type,meta.bytes,meta.object_key||'',meta.source_url||'',now()
  ).run();
}
async function convertIfNeeded(env,result,format,spec){
 if(format==='pdf')return result;
 if(format==='png')return result;
 const images=renderServices(env).images;
 if(!images?.transform)throw new Error('Requested raster conversion requires Magnanimous Media Transform.');
 return await images.transform(result.base64,{
  format,
  quality:Math.max(1,Math.min(100,Number(spec.quality||90))),
  width:spec.output_width?Number(spec.output_width):0,
  height:spec.output_height?Number(spec.output_height):0,
  fit:String(spec.fit||'contain'),
  watermark_text:clip(spec.watermark_text,240),
  watermark_position:String(spec.watermark_position||'bottom-right')
 });
}
async function storeResult(request,env,user,result,format,kind,sourceUrl=''){
 const id='mri_'+crypto.randomUUID();
 const type=contentType(format),bytes=b64bytes(result.base64);
 if(!bytes.length)throw new Error('Magnanimous renderer returned no file bytes.');
 const services=renderServices(env);
 const key='renders/'+safeTenant(user.tenant_id)+'/'+id+'.'+format;
 if(!services.objects?.put)throw new Error('Magnanimous Object Store is required for hosted render delivery.');
 await services.objects.put(key,bytes,{httpMetadata:{contentType:type},customMetadata:{tenant_id:String(user.tenant_id),render_id:id,format}});
 await recordRender(env,user,{id,kind,format,content_type:type,bytes:bytes.length,object_key:key,source_url:sourceUrl});
 return{id,url:fileUrl(request,id,format),format,content_type:type,bytes:bytes.length,stored:true,provider_dependency:false,third_party_renderer_required:false};
}
async function renderOne(request,env,user,input={}){
 const services=renderServices(env);
 if(!services.browser?.render)throw new Error('Magnanimous Browser renderer is not configured.');
 const html=clip(input.html,1000000),css=clip(input.css,500000),url=clip(input.url,4000).trim();
 if(Boolean(html)===Boolean(url))throw new Error('Provide exactly one of html or url.');
 const format=normalizeFormat(input.format);
 const width=Math.max(320,Math.min(3840,Number(input.viewport_width||input.width||1200)));
 const height=Math.max(240,Math.min(4000,Number(input.viewport_height||input.height||630)));
 const options={
  mode:format==='pdf'?'pdf':'screenshot',
  width,height,
  device_scale:Math.max(1,Math.min(3,Number(input.device_scale||2))),
  ms_delay:Math.max(0,Math.min(15000,Number(input.ms_delay||0))),
  timeout_ms:Math.max(1000,Math.min(90000,Number(input.timeout_ms||45000))),
  color_scheme:['light','dark'].includes(String(input.color_scheme||''))?String(input.color_scheme):'light',
  media:String(input.media||'screen')==='print'?'print':'screen',
  selector:clip(input.selector,500),
  full_page:Boolean(input.full_page)
 };
 let rendered;
 if(url){
  rendered=await services.browser.render(url,options);
 }else{
  if(!services.browser.renderContent)throw new Error('Magnanimous Browser content renderer is not installed on this runtime.');
  rendered=await services.browser.renderContent(html,{...options,css});
 }
 rendered=await convertIfNeeded(env,rendered,format,input);
 const stored=await storeResult(request,env,user,rendered,format,url?'url':'html',url);
 return{
  ...stored,
  viewport_width:width,
  viewport_height:height,
  device_scale:options.device_scale,
  selector_requested:Boolean(options.selector),
  full_page_requested:options.full_page,
  native_engine:'Magnanimous Chromium + Media Transform + Object Store',
  limitations:[
   ...(options.selector?['Selector cropping is routed through Magnanimous Native Web/Playwright when exact element capture is required; the standalone Chromium file renderer does not claim selector cropping.']:[]),
   ...(options.full_page?['Exact dynamic full-page height capture is handled by Magnanimous Native Web/Playwright; the standalone renderer uses the bounded configured viewport.']:[])
  ]
 };
}
async function latestTemplate(env,tenant,id,version=null){
 await ensureSchema(env);
 if(version){
  return await env.DB.prepare('SELECT * FROM magnanimous_render_templates WHERE tenant_id=? AND id=? AND version=? LIMIT 1').bind(tenant,id,version).first();
 }
 return await env.DB.prepare('SELECT * FROM magnanimous_render_templates WHERE tenant_id=? AND id=? ORDER BY version DESC LIMIT 1').bind(tenant,id).first();
}
async function createTemplate(env,user,body){
 await ensureSchema(env);
 const id='mrt_'+crypto.randomUUID(),html=clip(body.html,1000000);
 if(!html.trim())throw new Error('html is required.');
 const row={
  id,version:1,name:clip(body.name,64),description:clip(body.description,1024),
  html,css:clip(body.css,500000),options:body.options&&typeof body.options==='object'?body.options:{}
 };
 await env.DB.prepare(`INSERT INTO magnanimous_render_templates
  (tenant_id,id,version,name,description,html,css,options_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
  .bind(user.tenant_id,row.id,row.version,row.name,row.description,row.html,row.css,JSON.stringify(row.options),now()).run();
 return row;
}
async function updateTemplate(env,user,id,body){
 const previous=await latestTemplate(env,user.tenant_id,id);
 if(!previous)throw new Error('Template not found.');
 const html=body.html===undefined?previous.html:clip(body.html,1000000);
 if(!String(html).trim())throw new Error('html is required.');
 const version=Number(previous.version)+1;
 const options=body.options===undefined?parseJson(previous.options_json,{}):(body.options&&typeof body.options==='object'?body.options:{});
 await env.DB.prepare(`INSERT INTO magnanimous_render_templates
  (tenant_id,id,version,name,description,html,css,options_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
  .bind(user.tenant_id,id,version,
   body.name===undefined?previous.name:clip(body.name,64),
   body.description===undefined?previous.description:clip(body.description,1024),
   html,body.css===undefined?previous.css:clip(body.css,500000),JSON.stringify(options),now()).run();
 return await latestTemplate(env,user.tenant_id,id,version);
}
function templatePublic(row){
 return row?{id:row.id,version:Number(row.version),name:row.name,description:row.description,html:row.html,css:row.css,options:parseJson(row.options_json,{}),created_at:Number(row.created_at)}:null;
}
async function handleTemplates(request,env,user,path){
 const base='/api/magnanimous/native-rendering/templates';
 const rest=path.slice(base.length).replace(/^\//,'');
 if(!rest){
  if(request.method==='POST')return json({ok:true,template:templatePublic(await createTemplate(env,user,await request.json().catch(()=>({}))))});
  if(request.method==='GET'){
   await ensureSchema(env);
   const {results=[]}=await env.DB.prepare(`SELECT t.* FROM magnanimous_render_templates t
    JOIN (SELECT id,MAX(version) version FROM magnanimous_render_templates WHERE tenant_id=? GROUP BY id) latest
    ON latest.id=t.id AND latest.version=t.version WHERE t.tenant_id=? ORDER BY t.created_at DESC LIMIT 100`)
    .bind(user.tenant_id,user.tenant_id).all();
   return json({templates:results.map(templatePublic)});
  }
 }
 const parts=rest.split('/').filter(Boolean),id=decodeURIComponent(parts[0]||'');
 if(!id)return null;
 if(parts[1]==='versions'&&request.method==='GET'){
  await ensureSchema(env);
  const {results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_render_templates WHERE tenant_id=? AND id=? ORDER BY version DESC LIMIT 100').bind(user.tenant_id,id).all();
  return json({templates:results.map(templatePublic)});
 }
 if(parts[1]==='render'&&request.method==='POST'){
  const body=await request.json().catch(()=>({})),row=await latestTemplate(env,user.tenant_id,id,body.version?Number(body.version):null);
  if(!row)return json({detail:'Template not found.'},404);
  const vars=body.template_values&&typeof body.template_values==='object'?body.template_values:{};
  const options={...parseJson(row.options_json,{}),...body,html:applyTemplate(row.html,vars),css:applyTemplate(row.css,vars)};
  delete options.template_values;delete options.version;
  return json({ok:true,template_id:id,template_version:Number(row.version),image:await renderOne(request,env,user,options)});
 }
 if(request.method==='GET'){
  const row=await latestTemplate(env,user.tenant_id,id);
  return row?json({template:templatePublic(row)}):json({detail:'Template not found.'},404);
 }
 if(['POST','PATCH','PUT'].includes(request.method)){
  try{return json({ok:true,template:templatePublic(await updateTemplate(env,user,id,await request.json().catch(()=>({}))))})}
  catch(error){return json({detail:String(error?.message||error)},String(error?.message||'').includes('not found')?404:400)}
 }
 return null;
}
async function renderEvent(env,tenant,id){
 await ensureSchema(env);
 return await env.DB.prepare('SELECT * FROM magnanimous_render_events WHERE tenant_id=? AND id=? LIMIT 1').bind(tenant,id).first();
}
async function deleteImage(env,user,id){
 const row=await renderEvent(env,user.tenant_id,id);
 if(!row)return false;
 const store=renderServices(env).objects;
 if(row.object_key&&store?.delete)await store.delete(row.object_key);
 await env.DB.prepare('DELETE FROM magnanimous_render_events WHERE tenant_id=? AND id=?').bind(user.tenant_id,id).run();
 return true;
}
async function handleFiles(request,env,user,path){
 const m=path.match(/^\/api\/magnanimous\/native-rendering\/files\/([^/.]+)\.(png|jpg|webp|pdf)$/);
 if(!m||request.method!=='GET')return null;
 const id=decodeURIComponent(m[1]),row=await renderEvent(env,user.tenant_id,id);
 if(!row)return new Response('Not found',{status:404});
 const store=renderServices(env).objects,obj=store?.get?await store.get(row.object_key):null;
 if(!obj)return new Response('Not found',{status:404});
 const headers={'content-type':row.content_type||contentType(row.format),'cache-control':'private, max-age=300','x-content-type-options':'nosniff'};
 if(obj.body!==undefined)return new Response(obj.body,{status:200,headers});
 if(typeof obj.arrayBuffer==='function')return new Response(await obj.arrayBuffer(),{status:200,headers});
 return new Response('Not found',{status:404});
}

export async function handleMagnanimousNativeRendering(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-rendering'))return null;

 if(request.method==='GET'&&(path==='/api/magnanimous/native-rendering'||path==='/api/magnanimous/native-rendering/capabilities')){
  const owner=await ownerCapabilityAccess(request,env);
  return json({ok:true,...(owner?getMagnanimousRenderingCapabilitySummary():publicCapabilitySummary()),readiness:readiness(env),owner_diagnostics:owner});
 }

 const user=await authUser(request,env);
 if(!user)return json({detail:'Sign in to use Magnanimous Native Rendering.'},401);
 await ensureSchema(env);

 const fileResponse=await handleFiles(request,env,user,path);
 if(fileResponse)return fileResponse;

 if(path.startsWith('/api/magnanimous/native-rendering/templates')){
  const response=await handleTemplates(request,env,user,path);
  if(response)return response;
 }

 if(request.method==='POST'&&path==='/api/magnanimous/native-rendering/render'){
  try{return json({ok:true,image:await renderOne(request,env,user,await request.json().catch(()=>({})))})}
  catch(error){return json({detail:String(error?.message||error),code:'MAGNANIMOUS_RENDER_ERROR'},400)}
 }

 if(request.method==='POST'&&path==='/api/magnanimous/native-rendering/batch'){
  const body=await request.json().catch(()=>({})),defaults=body.default_options&&typeof body.default_options==='object'?body.default_options:{};
  const variations=Array.isArray(body.variations)?body.variations:[];
  if(!variations.length||variations.length>25)return json({detail:'variations must contain 1 to 25 items.'},400);
  const images=[];
  for(let i=0;i<variations.length;i++){
   try{images.push({index:i,ok:true,...await renderOne(request,env,user,{...defaults,...(variations[i]||{})})})}
   catch(error){images.push({index:i,ok:false,error:String(error?.message||error)})}
  }
  return json({ok:images.every(x=>x.ok),images,max_batch_size:25});
 }

 if(request.method==='GET'&&path==='/api/magnanimous/native-rendering/images'){
  const limit=Math.max(1,Math.min(100,Number(url.searchParams.get('count')||50)));
  const {results=[]}=await env.DB.prepare('SELECT id,kind,format,content_type,bytes,source_url,created_at FROM magnanimous_render_events WHERE tenant_id=? ORDER BY created_at DESC LIMIT ?').bind(user.tenant_id,limit).all();
  return json({images:results.map(row=>({...row,url:fileUrl(request,row.id,row.format)}))});
 }

 const imageMatch=path.match(/^\/api\/magnanimous\/native-rendering\/images\/([^/]+)$/);
 if(imageMatch){
  const id=decodeURIComponent(imageMatch[1]);
  if(request.method==='GET'){
   const row=await renderEvent(env,user.tenant_id,id);
   return row?json({image:{...row,url:fileUrl(request,row.id,row.format)}}):json({detail:'Image not found.'},404);
  }
  if(request.method==='DELETE')return json({accepted:await deleteImage(env,user,id)},202);
 }

 if(request.method==='POST'&&path==='/api/magnanimous/native-rendering/images/batch-delete'){
  const body=await request.json().catch(()=>({})),ids=Array.isArray(body.ids)?body.ids.slice(0,100):[];
  const deleted=[];
  for(const id of ids)if(await deleteImage(env,user,String(id)))deleted.push(String(id));
  return json({accepted:true,deleted},202);
 }

 if(request.method==='GET'&&path==='/api/magnanimous/native-rendering/usage'){
  const total=await env.DB.prepare('SELECT COUNT(*) count,COALESCE(SUM(bytes),0) bytes FROM magnanimous_render_events WHERE tenant_id=?').bind(user.tenant_id).first();
  const month=await env.DB.prepare("SELECT COUNT(*) count,COALESCE(SUM(bytes),0) bytes FROM magnanimous_render_events WHERE tenant_id=? AND created_at>=strftime('%s','now','start of month')").bind(user.tenant_id).first();
  return json({images_used_total:Number(total?.count||0),bytes_total:Number(total?.bytes||0),images_used_this_month:Number(month?.count||0),bytes_this_month:Number(month?.bytes||0),max_batch_size:25,overages_enabled:false,native_free_first:true});
 }

 return json({detail:'Magnanimous Native Rendering route not found.'},404);
}
