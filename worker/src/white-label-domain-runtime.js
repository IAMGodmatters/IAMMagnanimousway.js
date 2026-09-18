import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=v=>String(v??'').trim();
const hostname=v=>clean(v).toLowerCase().replace(/^https?:\/\//,'').split('/')[0].replace(/\.$/,'');
const validHostname=v=>/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(v);
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());

async function agencyAccess(env,user){
 if(await isPlatformOwnerUser(env,user))return true;
 try{const row=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();return ['agency','agency_pro'].includes(String(row?.plan||'').toLowerCase())}catch{return false}
}
async function client(env,tenant,id){return env.DB.prepare('SELECT id,name,status FROM bpo_clients WHERE id=? AND tenant_id=? LIMIT 1').bind(id,tenant).first()}
function ready(env){return Boolean(env.CLOUDFLARE_SAAS_API_TOKEN&&env.CLOUDFLARE_SAAS_ZONE_ID&&env.CLOUDFLARE_SAAS_CNAME_TARGET)}
function cfHeaders(env){return{authorization:`Bearer ${env.CLOUDFLARE_SAAS_API_TOKEN}`,'content-type':'application/json'}}
async function cf(env,path,options={}){
 if(!ready(env))return{ok:false,status:503,data:{errors:[{message:'Managed custom domains are not configured.'}]}};
 const r=await fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(env.CLOUDFLARE_SAAS_ZONE_ID)}${path}`,{...options,headers:{...cfHeaders(env),...(options.headers||{})}});
 const d=await r.json().catch(()=>({}));return{ok:r.ok&&d?.success!==false,status:r.status,data:d};
}
function details(result={}){
 const own=result.ownership_verification||{},records=Array.isArray(result?.ssl?.validation_records)?result.ssl.validation_records:[],txt=records.find(x=>String(x?.txt_name||x?.name||''));
 return{
  provider_hostname_id:clean(result.id),status:clean(result.status||'pending'),ssl_status:clean(result?.ssl?.status||'pending'),
  ownership_name:clean(own.name),ownership_value:clean(own.value),ssl_txt_name:clean(txt?.txt_name||txt?.name),ssl_txt_value:clean(txt?.txt_value||txt?.value)
 };
}
async function save(env,tenant,clientId,host,result,error=''){
 const d=details(result),id=crypto.randomUUID(),ts=now(),target=clean(env.CLOUDFLARE_SAAS_CNAME_TARGET);
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
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);
 const tenant=String(user.tenant_id);
 if(url.pathname==='/api/white-label/domains/readiness'&&request.method==='GET')return json({configured:ready(env),managed_custom_domains:true,requires_customer_dns:true,activation_requires_hostname_and_certificate_validation:true,cname_target:ready(env)?String(env.CLOUDFLARE_SAAS_CNAME_TARGET):'',setup_missing:ready(env)?[]:['CLOUDFLARE_SAAS_API_TOKEN','CLOUDFLARE_SAAS_ZONE_ID','CLOUDFLARE_SAAS_CNAME_TARGET']});
 if(url.pathname==='/api/white-label/domains'&&request.method==='GET'){
  const cid=clean(url.searchParams.get('client_id'));let sql='SELECT * FROM agency_custom_domains WHERE tenant_id=?',args=[tenant];if(cid){sql+=' AND client_id=?';args.push(cid)}sql+=' ORDER BY updated_at DESC LIMIT 100';
  const{results=[]}=await env.DB.prepare(sql).bind(...args).all();const refresh=url.searchParams.get('refresh')==='1',rows=[];for(const row of results)rows.push(publicRow(refresh?await refreshRow(env,row):row));return json({domains:rows,configured:ready(env)});
 }
 if(url.pathname==='/api/white-label/domains'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);if(!ready(env))return json({detail:'Managed custom domains are not configured yet. Add the scoped domain-service credentials first.',code:'DOMAIN_PROVIDER_NOT_CONFIGURED'},503);
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
