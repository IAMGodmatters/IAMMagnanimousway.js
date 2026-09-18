import {getProviderRuntimeEnv} from './provider-runtime-env.js';
import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=v=>String(v??'').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const hostname=v=>clean(v).toLowerCase().replace(/^https?:\/\//,'').split('/')[0].replace(/\.$/,'');
const validHostname=v=>/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(v);
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());

async function agencyAccess(env,user){
 if(await isPlatformOwnerUser(env,user))return true;
 try{const row=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();return ['agency','agency_pro'].includes(String(row?.plan||'').toLowerCase())}catch{return false}
}
async function client(env,tenant,id){return env.DB.prepare('SELECT id,name,status FROM bpo_clients WHERE id=? AND tenant_id=? LIMIT 1').bind(id,tenant).first()}
function tokenFor(env){return String(env.CLOUDFLARE_SAAS_API_TOKEN||env.CLOUDFLARE_PLATFORM_API_TOKEN||'').trim()}
function zoneFor(env){return String(env.CLOUDFLARE_SAAS_ZONE_ID||env.CLOUDFLARE_PLATFORM_ZONE_ID||'').trim()}
function cnameFor(env){return String(env.CLOUDFLARE_SAAS_CNAME_TARGET||'').trim()}
function ready(env){return Boolean(tokenFor(env)&&zoneFor(env))}
function cfHeaders(env){return{authorization:`Bearer ${tokenFor(env)}`,'content-type':'application/json'}}
async function cf(env,path,options={}){
 if(!ready(env))return{ok:false,status:503,data:{errors:[{message:'Managed custom domains are not configured.'}]}};
 const r=await fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneFor(env))}${path}`,{...options,headers:{...cfHeaders(env),...(options.headers||{})}});
 const d=await r.json().catch(()=>({}));return{ok:r.ok&&d?.success!==false,status:r.status,data:d};
}
function details(result={}){
 const own=result.ownership_verification||{},records=Array.isArray(result?.ssl?.validation_records)?result.ssl.validation_records:[],txt=records.find(x=>String(x?.txt_name||x?.name||''));
 return{
  provider_hostname_id:clean(result.id),status:clean(result.status||'pending'),ssl_status:clean(result?.ssl?.status||'pending'),
  ownership_name:clean(own.name),ownership_value:clean(own.value),ssl_txt_name:clean(txt?.txt_name||txt?.name),ssl_txt_value:clean(txt?.txt_value||txt?.value)
 };
}
async function fallbackState(env){
 if(!ready(env))return{ok:false,active:false,status:'not_configured',origin:'',error:'Cloudflare API token or zone ID is missing.'};
 const r=await cf(env,'/custom_hostnames/fallback_origin',{method:'GET'}),result=r.data?.result||{};
 if(!r.ok)return{ok:false,active:false,status:'unavailable',origin:'',error:clean(r.data?.errors?.[0]?.message||r.data?.detail||`Fallback-origin check failed (${r.status})`)};
 return{ok:true,active:String(result.status||'').toLowerCase()==='active',status:clean(result.status||'unknown'),origin:clean(result.origin||''),error:''};
}
async function resolveCnameTarget(env){
 const explicit=cnameFor(env);if(explicit)return explicit;
 const fallback=await fallbackState(env);return fallback.active?fallback.origin:'';
}
async function save(env,tenant,clientId,host,result,error=''){
 const d=details(result),id=crypto.randomUUID(),ts=now(),target=await resolveCnameTarget(env);
 await env.DB.prepare(`INSERT INTO agency_custom_domains(id,tenant_id,client_id,hostname,provider,provider_hostname_id,status,ssl_status,cname_target,ownership_name,ownership_value,ssl_txt_name,ssl_txt_value,last_error,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(tenant_id,hostname) DO UPDATE SET client_id=excluded.client_id,provider_hostname_id=excluded.provider_hostname_id,status=excluded.status,ssl_status=excluded.ssl_status,cname_target=excluded.cname_target,ownership_name=excluded.ownership_name,ownership_value=excluded.ownership_value,ssl_txt_name=excluded.ssl_txt_name,ssl_txt_value=excluded.ssl_txt_value,last_error=excluded.last_error,updated_at=excluded.updated_at`)
 .bind(id,tenant,clientId,host,'managed-domain-service',d.provider_hostname_id,d.status,d.ssl_status,target,d.ownership_name,d.ownership_value,d.ssl_txt_name,d.ssl_txt_value,clean(error).slice(0,1000),ts,ts).run();
 return env.DB.prepare('SELECT * FROM agency_custom_domains WHERE tenant_id=? AND hostname=? LIMIT 1').bind(tenant,host).first();
}
async function refreshRow(env,row){
 if(!row?.provider_hostname_id||!ready(env))return row;
 const r=await cf(env,`/custom_hostnames/${encodeURIComponent(row.provider_hostname_id)}`,{method:'GET'});
 if(!r.ok){await env.DB.prepare('UPDATE agency_custom_domains SET last_error=?,updated_at=? WHERE id=?').bind(clean(r.data?.errors?.[0]?.message||`Domain status check failed (${r.status})`).slice(0,1000),now(),row.id).run();return row}
 return save(env,row.tenant_id,row.client_id,row.hostname,r.data?.result||{});
}
function publicRow(row){
 return{
  id:row.id,client_id:row.client_id,hostname:row.hostname,status:row.status,ssl_status:row.ssl_status,cname_target:row.cname_target,
  dns:{
   cname:{name:row.hostname,target:row.cname_target},
   ownership:row.ownership_name&&row.ownership_value?{type:'TXT',name:row.ownership_name,value:row.ownership_value}:null,
   certificate:row.ssl_txt_name&&row.ssl_txt_value?{type:'TXT',name:row.ssl_txt_name,value:row.ssl_txt_value}:null
  },
  live:row.status==='active'&&row.ssl_status==='active',last_error:row.last_error||''
 };
}
export async function handleWhiteLabelDomains(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/white-label/domains'))return null;
 if(!env?.DB)return json({detail:'Domain storage is unavailable.'},503);
 env=await getProviderRuntimeEnv(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);
 const tenant=String(user.tenant_id);
 if(url.pathname==='/api/white-label/domains/readiness'&&request.method==='GET'){
  const credentials=ready(env),fallback=credentials?await fallbackState(env):{ok:false,active:false,status:'not_configured',origin:'',error:'Cloudflare API token or zone ID is missing.'},target=credentials?(cnameFor(env)||fallback.origin):'';
  return json({configured:credentials&&fallback.active&&Boolean(target),credentials_configured:credentials,managed_custom_domains:true,managed_service_ready:Boolean(fallback.active&&target),requires_customer_dns:true,activation_requires_hostname_and_certificate_validation:true,cname_target:target,fallback_origin:{status:fallback.status,origin:fallback.origin,active:fallback.active},credential_source:env.CLOUDFLARE_SAAS_API_TOKEN?'dedicated-saas-token':'platform-cloudflare-token',setup_missing:!credentials?['Cloudflare API token','Cloudflare zone ID']:!fallback.active?['Cloudflare for SaaS fallback origin must be Active']:!target?['Managed CNAME target or active fallback origin']:[]});
 }
 if(url.pathname==='/api/white-label/domains'&&request.method==='GET'){
  const cid=clean(url.searchParams.get('client_id'));let sql='SELECT * FROM agency_custom_domains WHERE tenant_id=?',args=[tenant];if(cid){sql+=' AND client_id=?';args.push(cid)}sql+=' ORDER BY updated_at DESC LIMIT 100';
  const{results=[]}=await env.DB.prepare(sql).bind(...args).all();const refresh=url.searchParams.get('refresh')==='1',rows=[];for(const row of results)rows.push(publicRow(refresh?await refreshRow(env,row):row));return json({domains:rows,configured:ready(env)});
 }
 if(url.pathname==='/api/white-label/domains'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);if(!ready(env))return json({detail:'Managed custom domains are not configured yet. Add a scoped Cloudflare token and zone ID first.',code:'DOMAIN_PROVIDER_NOT_CONFIGURED'},503);const fallback=await fallbackState(env),target=await resolveCnameTarget(env);if(!fallback.active||!target)return json({detail:'Cloudflare for SaaS is not traffic-ready. Configure an Active fallback origin before registering client domains.',code:'DOMAIN_FALLBACK_NOT_READY',fallback_origin:fallback},409);
  const b=await request.json().catch(()=>({})),cid=clean(b.client_id),host=hostname(b.hostname);if(!cid||!host||!validHostname(host))return json({detail:'Choose a client and enter a valid hostname such as app.customer.com.'},400);
  if(['iammagnanimousway.com','www.iammagnanimousway.com'].includes(host))return json({detail:'The platform production domain cannot be assigned to a client.'},400);
  if(!await client(env,tenant,cid))return json({detail:'That client does not belong to this White Label workspace.'},404);
  const existing=await env.DB.prepare('SELECT * FROM agency_custom_domains WHERE tenant_id=? AND hostname=? LIMIT 1').bind(tenant,host).first();if(existing?.provider_hostname_id)return json({detail:'That hostname is already registered in this workspace.',domain:publicRow(existing)},409);
  const body={hostname:host,ssl:{method:'txt',type:'dv',settings:{min_tls_version:'1.2'}},custom_metadata:{tenant_id:tenant.slice(0,120),client_id:cid.slice(0,120)}};
  const r=await cf(env,'/custom_hostnames',{method:'POST',body:JSON.stringify(body)});if(!r.ok){const message=clean(r.data?.errors?.[0]?.message||`Custom domain request failed (${r.status})`);await save(env,tenant,cid,host,{},message);return json({detail:message,code:'DOMAIN_PROVIDER_REJECTED'},r.status>=400&&r.status<500?r.status:502)}
  const row=await save(env,tenant,cid,host,r.data?.result||{});return json({ok:true,domain:publicRow(row),next:'Add the returned CNAME/TXT records at the customer DNS provider, then press Refresh status.'},201);
 }
 let m=url.pathname.match(/^\/api\/white-label\/domains\/([^/]+)\/refresh$/);
 if(m&&request.method==='POST'){
  const row=await env.DB.prepare('SELECT * FROM agency_custom_domains WHERE id=? AND tenant_id=? LIMIT 1').bind(m[1],tenant).first();if(!row)return json({detail:'Custom domain not found.'},404);return json({ok:true,domain:publicRow(await refreshRow(env,row))});
 }
 m=url.pathname.match(/^\/api\/white-label\/domains\/([^/]+)$/);
 if(m&&request.method==='DELETE'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const row=await env.DB.prepare('SELECT * FROM agency_custom_domains WHERE id=? AND tenant_id=? LIMIT 1').bind(m[1],tenant).first();if(!row)return json({detail:'Custom domain not found.'},404);
  if(row.provider_hostname_id&&ready(env)){const r=await cf(env,`/custom_hostnames/${encodeURIComponent(row.provider_hostname_id)}`,{method:'DELETE'});if(!r.ok&&r.status!==404)return json({detail:clean(r.data?.errors?.[0]?.message||'The domain provider could not remove this hostname.')},502)}
  await env.DB.prepare('DELETE FROM agency_custom_domains WHERE id=? AND tenant_id=?').bind(m[1],tenant).run();return json({ok:true,deleted:true});
 }
 return json({detail:'Custom domain endpoint not found.'},404);
}

export async function handlePublicWhiteLabelDomain(request,env){
 const url=new URL(request.url);if(request.method!=='GET'||url.pathname!=='/')return null;const host=hostname(url.hostname);
 if(!host||['iammagnanimousway.com','www.iammagnanimousway.com'].includes(host))return null;
 let row=null;try{row=await env.DB.prepare(`SELECT d.client_id,d.hostname,s.brand_name,s.logo_url,s.accent_color,c.name client_name
  FROM agency_custom_domains d JOIN bpo_clients c ON c.id=d.client_id AND c.tenant_id=d.tenant_id
  LEFT JOIN agency_client_settings s ON s.client_id=d.client_id AND s.tenant_id=d.tenant_id
  WHERE d.hostname=? AND d.status='active' AND d.ssl_status='active' LIMIT 1`).bind(host).first()}catch{return null}
 if(!row)return null;
 try{
  const funnel=await env.DB.prepare("SELECT client_id,slug FROM agency_funnels WHERE client_id=? AND status='active' ORDER BY updated_at DESC LIMIT 1").bind(row.client_id).first();
  if(funnel?.slug)return Response.redirect(`https://${host}/funnels/${encodeURIComponent(funnel.client_id)}/${encodeURIComponent(funnel.slug)}`,302);
 }catch{}
 let portal=null;try{portal=await env.DB.prepare("SELECT title,content FROM agency_portal_pages WHERE client_id=? AND status='active' ORDER BY updated_at DESC LIMIT 1").bind(row.client_id).first()}catch{}
 const brand=esc(row.brand_name||row.client_name||'Welcome'),title=esc(portal?.title||brand),body=esc(portal?.content||'Welcome.').replace(/\n/g,'<br>'),logo=String(row.logo_url||'').startsWith('https://')?String(row.logo_url):'',accent=/^#[0-9a-f]{3,8}$/i.test(String(row.accent_color||''))?String(row.accent_color):'#71e1ff';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="robots" content="index,follow"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071018;color:#eff9ff;font-family:Inter,system-ui,sans-serif;padding:24px;background-image:radial-gradient(circle at 75% 0,${accent}22,transparent 32%)}main{width:min(820px,100%);border:1px solid #294654;border-radius:24px;background:#09141c;padding:clamp(24px,6vw,54px);box-shadow:0 28px 80px #0008}.brand{display:flex;align-items:center;gap:12px;color:${accent};font-weight:900;letter-spacing:.08em;font-size:11px}.brand img{width:58px;height:58px;object-fit:contain;background:#fff;border-radius:13px;padding:5px}h1{font-size:clamp(38px,7vw,70px);line-height:.98;margin:22px 0}.body{color:#adbec7;line-height:1.75;font-size:16px}</style></head><body><main><div class="brand">${logo?`<img src="${esc(logo)}" alt="">`:''}<span>${brand}</span></div><h1>${title}</h1><div class="body">${body}</div></main></body></html>`;
 return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60','x-frame-options':'SAMEORIGIN'}});
}
