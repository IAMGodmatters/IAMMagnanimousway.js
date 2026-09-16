import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handleMagnanimousPorkbunDns } from './magnanimous-porkbun-dns-runtime.js';
import { MAGNANIMOUS_REGISTRAR_ADAPTERS, REGISTRAR_GUARDRAILS, getRegistrarAdapter } from './magnanimous-registrar-capability-registry.js';
import { registrarStandardsCapabilities, rdapDomainIntelligence, lookupIanaRegistrar, interpretEppStatuses, getIanaDnsBootstrap, resolveRdapBase } from './magnanimous-domain-standards.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(value,n=8000)=>String(value??'').trim().slice(0,n);
const CF_BASE='https://api.cloudflare.com/client/v4';

function isPlatformOwner(user,env){
 const configured=clip(env?.ADMIN_EMAIL,320).toLowerCase();
 const email=clip(user?.email,320).toLowerCase();
 const role=String(user?.role||'').toLowerCase();
 return Boolean(configured&&email===configured&&['owner','admin'].includes(role));
}
function normalizeDomain(value){
 const name=clip(value,253).toLowerCase().replace(/\.$/,'');
 if(!name||name.includes('://')||name.includes('/')||name.includes('\\')||name.includes('@')||name.includes(' ')||!name.includes('.'))return'';
 const labels=name.split('.');
 if(labels.some(label=>!label||label.length>63||!/^[a-z0-9-]+$/.test(label)||label.startsWith('-')||label.endsWith('-')))return'';
 return name;
}
function timeoutSignal(ms=15000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort('timeout'),ms);return{signal:controller.signal,done:()=>clearTimeout(timer)};}
function safeAdapter(adapter){return{id:adapter.id,name:adapter.name,state:adapter.state,live_via:adapter.live_via,docs:adapter.docs,auth:adapter.auth,sandbox:adapter.sandbox,mcp:adapter.mcp,openapi:adapter.openapi,webhooks:adapter.webhooks,connection_keys:adapter.connection_keys,capabilities:adapter.capabilities,notes:adapter.notes||[]};}
function connectionState(adapter,runtime){
 const present=adapter.connection_keys.filter(key=>clip(runtime?.[key],2000));
 return{configured:adapter.connection_keys.length>0&&present.length===adapter.connection_keys.length,configured_fields:present.length,required_fields:adapter.connection_keys.length};
}
async function cfRequest(path,{env,method='GET',body=null}={}){
 const runtime=await getProviderRuntimeEnv(env),token=clip(runtime?.CLOUDFLARE_PLATFORM_API_TOKEN,2000),account=clip(runtime?.CLOUDFLARE_PLATFORM_ACCOUNT_ID,64);
 if(!token||!account)throw Object.assign(new Error('Cloudflare registrar connection requires the dedicated platform API token and account ID.'),{httpStatus:409,code:'REGISTRAR_CONNECTION_REQUIRED'});
 const expectedPrefix=`/accounts/${account}/registrar/`;
 if(!String(path||'').startsWith(expectedPrefix))throw Object.assign(new Error('Blocked registrar path.'),{httpStatus:400,code:'REGISTRAR_PATH_BLOCKED'});
 const url=new URL(path,CF_BASE+'/');
 if(url.origin!==new URL(CF_BASE).origin)throw Object.assign(new Error('Blocked registrar host.'),{httpStatus:400,code:'REGISTRAR_HOST_BLOCKED'});
 const headers={authorization:`Bearer ${token}`,accept:'application/json'};if(body!==null)headers['content-type']='application/json';
 const t=timeoutSignal();
 try{
  const response=await fetch(url.toString(),{method,headers,body:body===null?undefined:JSON.stringify(body),signal:t.signal,redirect:'error'});
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{};}catch{throw Object.assign(new Error('Registrar returned an unreadable response.'),{httpStatus:502,code:'REGISTRAR_BAD_RESPONSE'});}
  if(!response.ok||data?.success===false){const message=clip(data?.errors?.[0]?.message||`Registrar returned HTTP ${response.status}.`,1000);throw Object.assign(new Error(message),{httpStatus:response.status>=400&&response.status<500?response.status:502,code:'REGISTRAR_REQUEST_FAILED'});}
  return data?.result??data;
 }finally{t.done();}
}
function cfAccountPath(runtime,suffix=''){const account=clip(runtime?.CLOUDFLARE_PLATFORM_ACCOUNT_ID,64);return`/accounts/${account}/registrar/${suffix}`;}
function safeError(error){return{detail:clip(error?.message||error,1000),code:clip(error?.code||'REGISTRAR_ERROR',100)};}
function rewrite(request,path){const url=new URL(request.url);url.pathname=path;return new Request(url.toString(),{method:request.method,headers:request.headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,duplex:request.body?'half':undefined});}

async function delegatePorkbun(request,env,user,suffix){
 const target=`/api/magnanimous/dns/porkbun/${suffix}`.replace(/\/$/,'');
 return handleMagnanimousPorkbunDns(rewrite(request,target),env,user);
}

export async function handleMagnanimousRegistrar(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/magnanimous/registrar'))return null;
 if(!env?.DB)return json({detail:'Registrar control requires D1-backed Magnanimous authentication.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 if(!isPlatformOwner(user,env))return json({detail:'Platform owner access required for registrar account operations.'},403);
 const runtime=await getProviderRuntimeEnv(env);

 if(request.method==='GET'&&(path==='/api/magnanimous/registrar'||path==='/api/magnanimous/registrar/adapters')){
  return json({identity:'Magnanimous AI',provider_identity_public:false,guardrails:REGISTRAR_GUARDRAILS,standards:registrarStandardsCapabilities(),adapters:MAGNANIMOUS_REGISTRAR_ADAPTERS.map(adapter=>({...safeAdapter(adapter),connection:connectionState(adapter,runtime)})),billable_execution_enabled:false});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/registrar/status'){
  return json({identity:'Magnanimous AI',provider_identity_public:false,connections:MAGNANIMOUS_REGISTRAR_ADAPTERS.map(adapter=>({id:adapter.id,state:adapter.state,...connectionState(adapter,runtime)})),live_paths:{porkbun:'/api/magnanimous/registrar/porkbun/*',cloudflare_registrar:'/api/magnanimous/registrar/cloudflare/*',standards:'/api/magnanimous/registrar/intelligence/*'},billable_execution_enabled:false});
 }

 if(path.startsWith('/api/magnanimous/registrar/intelligence')){
  const base='/api/magnanimous/registrar/intelligence';
  try{
   if(request.method==='GET'&&path===`${base}/capabilities`)return json(registrarStandardsCapabilities());
   if(request.method==='GET'&&path===`${base}/domain`){const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);const result=await rdapDomainIntelligence(domain);return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,domain,result});}
   if(request.method==='GET'&&path===`${base}/tld`){const tld=clip(url.searchParams.get('tld'),63).toLowerCase().replace(/^\./,'');if(!/^[a-z0-9-]+$/.test(tld))return json({detail:'A valid TLD is required.'},400);const bootstrap=await getIanaDnsBootstrap();const result=resolveRdapBase(`example.${tld}`,bootstrap);return json({ok:true,identity:'Magnanimous AI',source:'IANA RDAP Bootstrap Registry',tld,rdap_base:result?.base||'',published:Boolean(result?.base)});}
   if(request.method==='GET'&&path===`${base}/registrar`){const id=clip(url.searchParams.get('id'),20);const result=await lookupIanaRegistrar(id);return result?json({ok:true,identity:'Magnanimous AI',result}):json({detail:'IANA registrar ID was not found.'},404);}
   if(request.method==='GET'&&path===`${base}/epp`){const values=url.searchParams.getAll('status').flatMap(v=>v.split(',')).map(v=>v.trim()).filter(Boolean);return json({ok:true,identity:'Magnanimous AI',statuses:interpretEppStatuses(values)});}
   return json({detail:'Unknown registrar intelligence route.'},404);
  }catch(error){return json(safeError(error),error.httpStatus||error.status||502);}
 }

 if(path.startsWith('/api/magnanimous/registrar/porkbun')){
  const suffix=path.slice('/api/magnanimous/registrar/porkbun'.length).replace(/^\//,'')||'status';
  return delegatePorkbun(request,env,user,suffix);
 }

 if(path.startsWith('/api/magnanimous/registrar/cloudflare')){
  const adapter=getRegistrarAdapter('cloudflare-registrar');
  const base='/api/magnanimous/registrar/cloudflare';
  try{
   if(request.method==='GET'&&path===`${base}/status`)return json({identity:'Magnanimous AI',provider_identity_public:false,adapter:safeAdapter(adapter),connection:connectionState(adapter,runtime),billable_execution_enabled:false});
   if(request.method==='GET'&&path===`${base}/search`){
    const q=clip(url.searchParams.get('q'),200);if(!q)return json({detail:'q is required.'},400);const params=new URLSearchParams({q});const extensions=clip(url.searchParams.get('extensions'),300);if(extensions)params.set('extensions',extensions);const limit=Math.min(50,Math.max(1,Number(url.searchParams.get('limit')||10)||10));params.set('limit',String(limit));
    const result=await cfRequest(`${cfAccountPath(runtime,'domain-search')}?${params.toString()}`,{env});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,discovery_advisory:true,result});
   }
   if(request.method==='POST'&&path===`${base}/check`){
    const body=await request.json().catch(()=>({}));const raw=Array.isArray(body?.domains)?body.domains:[];const domains=[...new Set(raw.map(normalizeDomain).filter(Boolean))].slice(0,20);if(!domains.length)return json({detail:'Provide 1 to 20 valid domains.'},400);
    const result=await cfRequest(cfAccountPath(runtime,'domain-check'),{env,method:'POST',body:{domains}});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,authoritative_check:true,result});
   }
   if(request.method==='GET'&&path===`${base}/registrations`){const result=await cfRequest(cfAccountPath(runtime,'registrations'),{env});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,result});}
   if(request.method==='GET'&&path===`${base}/registration`){const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);const result=await cfRequest(cfAccountPath(runtime,`registrations/${encodeURIComponent(domain)}`),{env});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,domain,result});}
   if(request.method==='GET'&&path===`${base}/registration-status`){const domain=normalizeDomain(url.searchParams.get('domain'));if(!domain)return json({detail:'A valid domain is required.'},400);const result=await cfRequest(cfAccountPath(runtime,`registrations/${encodeURIComponent(domain)}/registration-status`),{env});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,domain,result});}
   if(request.method==='GET'&&path===`${base}/extensions`){const extension=clip(url.searchParams.get('extension'),100).toLowerCase().replace(/^\./,'');const suffix=extension?`extensions/${encodeURIComponent(extension)}`:'extensions';const result=await cfRequest(cfAccountPath(runtime,suffix),{env});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,result});}
   if(request.method==='POST'&&path===`${base}/plan-registration`){
    const body=await request.json().catch(()=>({}));const domain=normalizeDomain(body?.domain);if(!domain)return json({detail:'A valid domain is required.'},400);const result=await cfRequest(cfAccountPath(runtime,'domain-check'),{env,method:'POST',body:{domains:[domain]}});return json({ok:true,identity:'Magnanimous AI',provider_identity_public:false,domain,check:result,execution_enabled:false,requires_paid_action_authorization:true,reason:'Domain registration is non-refundable and billable. Magnanimous will not execute it from the research/registrar adapter without a separately confirmed paid action.'});
   }
   if(request.method!=='GET'&&request.method!=='POST')return json({detail:'Method not allowed.'},405);
   return json({detail:'Unknown Cloudflare registrar route.'},404);
  }catch(error){return json(safeError(error),error.httpStatus||502);}
 }
 return json({detail:'Unknown registrar route.'},404);
}
