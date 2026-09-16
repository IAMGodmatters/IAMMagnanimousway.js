import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { magnanimousCloudflareSummary, CLOUDFLARE_MANAGED_MCP_SERVERS, CLOUDFLARE_AGENT_SKILLS } from './magnanimous-cloudflare-capability-registry.js';

const API='https://api.cloudflare.com/client/v4';
const now=()=>Math.floor(Date.now()/1000);
const CONFIRM_TTL=900;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const mutationMethods=new Set(['POST','PUT','PATCH','DELETE']);

function truthy(value){return String(value||'').trim().toLowerCase()==='true';}
function token(env){return String(env.CLOUDFLARE_PLATFORM_API_TOKEN||'').trim();}
function requestId(request){return String(request.headers.get('x-request-id')||request.headers.get('cf-ray')||'').slice(0,160);}

function normalizeApiPath(value){
 let raw=String(value||'').trim();
 if(raw.startsWith('/client/v4/'))raw=raw.slice('/client/v4'.length);
 if(!raw.startsWith('/')||raw.startsWith('//')||raw.includes('\\')||/^[a-z][a-z0-9+.-]*:/i.test(raw))return'';
 try{
  const url=new URL(`${API}${raw}`);
  if(url.origin!=='https://api.cloudflare.com'||!url.pathname.startsWith('/client/v4/'))return'';
  return `${url.pathname.slice('/client/v4'.length)}${url.search}`;
 }catch{return'';}
}

function riskClass(method,path){
 const p=String(path||'').toLowerCase();
 if(method==='DELETE')return'destructive';
 if(/\/registrar\/|\/subscriptions?(?:\/|$)|\/billing(?:\/|$)/.test(p))return'billing-spend';
 if(/\/tokens?(?:\/|$)|\/members?(?:\/|$)|\/roles?(?:\/|$)|\/identity_providers?(?:\/|$)/.test(p))return'identity-secret';
 if(/magic[_/-]?(?:transit|wan|firewall)|network[_/-]?(?:interconnect|firewall)|\/bgp(?:\/|$)|\/prefixes?(?:\/|$)|\/gre(?:\/|$)|\/ipsec(?:\/|$)/.test(p))return'network-control';
 if(method==='POST'&&/\/r2\/buckets|\/d1\/database|\/vectorize|\/workers\/scripts|\/stream|\/images|\/load_balancers|\/queues|\/workflows/.test(p))return'resource-create';
 return'mutation';
}

function lockReason(env,risk){
 if(!truthy(env.CLOUDFLARE_MUTATIONS_ENABLED))return'CLOUDFLARE_MUTATIONS_ENABLED is not enabled.';
 if(risk==='destructive'&&!truthy(env.CLOUDFLARE_DESTRUCTIVE_ACTIONS_ENABLED))return'CLOUDFLARE_DESTRUCTIVE_ACTIONS_ENABLED is not enabled.';
 if(risk==='billing-spend'&&!truthy(env.CLOUDFLARE_SPEND_ACTIONS_ENABLED))return'CLOUDFLARE_SPEND_ACTIONS_ENABLED is not enabled.';
 if(risk==='identity-secret'&&!truthy(env.CLOUDFLARE_IDENTITY_SECRET_ACTIONS_ENABLED))return'CLOUDFLARE_IDENTITY_SECRET_ACTIONS_ENABLED is not enabled.';
 if(risk==='network-control'&&!truthy(env.CLOUDFLARE_NETWORK_CONTROL_ENABLED))return'CLOUDFLARE_NETWORK_CONTROL_ENABLED is not enabled.';
 if(risk==='resource-create'&&!truthy(env.CLOUDFLARE_RESOURCE_CREATION_ENABLED))return'CLOUDFLARE_RESOURCE_CREATION_ENABLED is not enabled.';
 return'';
}

async function apiRequest(env,method,path,body){
 const auth=token(env);
 if(!auth)return{ok:false,status:503,data:{detail:'A dedicated least-privilege Cloudflare platform API token is not configured.',code:'CLOUDFLARE_TOKEN_REQUIRED'}};
 const headers={Authorization:`Bearer ${auth}`,Accept:'application/json'};
 const options={method,headers};
 if(!['GET','HEAD'].includes(method)){
  headers['content-type']='application/json';
  options.body=JSON.stringify(body??{});
 }
 try{
  const response=await fetch(`${API}${path}`,options);
  const text=await response.text();let data={};
  try{data=text?JSON.parse(text):{};}catch{data={raw:text.slice(0,20000)};}
  return{ok:response.ok,status:response.status,data};
 }catch(error){return{ok:false,status:502,data:{detail:'Cloudflare API request failed.',error:String(error?.message||error).slice(0,500)}};}
}

async function audit(env,user,eventType,detail='',actionId=null,reqId=''){
 try{await env.DB.prepare('INSERT INTO magnanimous_cloudflare_audit(tenant_id,user_id,action_id,event_type,detail,request_id,created_at) VALUES(?,?,?,?,?,?,?)')
  .bind(String(user.tenant_id),String(user.id),actionId,String(eventType),String(detail).slice(0,1500),String(reqId).slice(0,160),now()).run();}catch(_){}
}

async function ownerContext(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}

async function stageAction(request,env,user){
 const body=await request.json().catch(()=>({}));
 const method=String(body.method||'').trim().toUpperCase(),path=normalizeApiPath(body.path);
 if(!mutationMethods.has(method))return json({detail:'Cloudflare mutation method must be POST, PUT, PATCH, or DELETE.'},400);
 if(!path)return json({detail:'A valid relative Cloudflare API path is required.'},400);
 const risk=riskClass(method,path),id=crypto.randomUUID(),ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_cloudflare_actions(id,tenant_id,user_id,method,api_path,request_body_json,risk_class,status,created_at)
  VALUES(?,?,?,?,?,?,?,'needs_confirmation',?)`).bind(id,user.tenant_id,user.id,method,path,JSON.stringify(body.body??{}).slice(0,200000),risk,ts).run();
 await audit(env,user,'action_staged',`${method} ${path} [${risk}]`,id,requestId(request));
 return json({id,status:'needs_confirmation',risk_class:risk,method,path,expires_at:ts+CONFIRM_TTL,confirmation_endpoint:`/api/cloudflare/actions/${id}/confirm`,note:'No Cloudflare mutation has executed yet.'},202);
}

async function confirmAction(request,env,user,id){
 const body=await request.json().catch(()=>({}));
 if(body.confirm!==true)return json({detail:'Set confirm=true in this separate approval request after reviewing the pending Cloudflare action.',code:'CLOUDFLARE_CONFIRMATION_REQUIRED'},409);
 const row=await env.DB.prepare('SELECT * FROM magnanimous_cloudflare_actions WHERE id=? AND tenant_id=? LIMIT 1').bind(id,user.tenant_id).first();
 if(!row)return json({detail:'Cloudflare action not found.'},404);
 if(String(row.status)!=='needs_confirmation')return json({detail:`Cloudflare action is already ${row.status}.`,status:row.status},409);
 if(Number(row.created_at||0)<now()-CONFIRM_TTL){
  await env.DB.prepare("UPDATE magnanimous_cloudflare_actions SET status='expired',error_text='confirmation expired' WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(id,user.tenant_id).run();
  await audit(env,user,'action_expired',`${row.method} ${row.api_path}`,id,requestId(request));
  return json({detail:'This Cloudflare approval expired. Stage a fresh action and review its current payload.',code:'CLOUDFLARE_CONFIRMATION_EXPIRED'},410);
 }
 const blocked=lockReason(env,String(row.risk_class||'mutation'));
 if(blocked){
  await audit(env,user,'action_blocked',blocked,id,requestId(request));
  return json({detail:'Cloudflare mutation remains hard-locked.',code:'CLOUDFLARE_ACTION_LOCKED',risk_class:row.risk_class,required_configuration:blocked},409);
 }
 const claimed=await env.DB.prepare("UPDATE magnanimous_cloudflare_actions SET status='running',confirmed_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(now(),id,user.tenant_id).run();
 if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'Cloudflare action could not be claimed safely.'},409);
 let payload={};try{payload=JSON.parse(row.request_body_json||'{}');}catch{}
 const result=await apiRequest(env,String(row.method),String(row.api_path),payload),done=now();
 if(result.ok){
  await env.DB.prepare("UPDATE magnanimous_cloudflare_actions SET status='completed',completed_at=?,response_status=?,response_json=?,error_text='' WHERE id=? AND tenant_id=?")
   .bind(done,result.status,JSON.stringify(result.data??{}).slice(0,200000),id,user.tenant_id).run();
  await audit(env,user,'action_completed',`${row.method} ${row.api_path}`,id,requestId(request));
  return json({id,status:'completed',risk_class:row.risk_class,provider_response:result.data});
 }
 await env.DB.prepare("UPDATE magnanimous_cloudflare_actions SET status='failed',completed_at=?,response_status=?,response_json=?,error_text=? WHERE id=? AND tenant_id=?")
  .bind(done,result.status,JSON.stringify(result.data??{}).slice(0,200000),String(result.data?.detail||'Cloudflare API action failed.').slice(0,1000),id,user.tenant_id).run();
 await audit(env,user,'action_failed',`${row.method} ${row.api_path} -> ${result.status}`,id,requestId(request));
 return json({id,status:'failed',risk_class:row.risk_class,provider_response:result.data},result.status>=400&&result.status<600?result.status:502);
}

export async function handleMagnanimousCloudflare(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/cloudflare'))return null;
 const {denied,user}=await ownerContext(request,env);if(denied)return denied;

 if(request.method==='GET'&&(path==='/api/cloudflare'||path==='/api/cloudflare/overview'||path==='/api/cloudflare/capabilities')){
  return json({...magnanimousCloudflareSummary(env),credential_names:['CLOUDFLARE_PLATFORM_API_TOKEN','CLOUDFLARE_PLATFORM_ACCOUNT_ID','CLOUDFLARE_PLATFORM_ZONE_ID'],credential_values_exposed:false});
 }
 if(request.method==='GET'&&path==='/api/cloudflare/mcp')return json({recommended:'https://mcp.cloudflare.com/mcp',servers:CLOUDFLARE_MANAGED_MCP_SERVERS,provider_tokens_exposed:false});
 if(request.method==='GET'&&path==='/api/cloudflare/skills')return json({skills:CLOUDFLARE_AGENT_SKILLS,source:'official Cloudflare Skills catalog',provider_internal_only:true});
 if(request.method==='GET'&&path==='/api/cloudflare/actions'){
  const {results=[]}=await env.DB.prepare('SELECT id,method,api_path,risk_class,status,created_at,confirmed_at,completed_at,response_status,error_text FROM magnanimous_cloudflare_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(user.tenant_id).all();
  return json({actions:results});
 }
 if(request.method==='POST'&&path==='/api/cloudflare/read'){
  const body=await request.json().catch(()=>({})),apiPath=normalizeApiPath(body.path);
  if(!apiPath)return json({detail:'A valid relative Cloudflare API path is required.'},400);
  const result=await apiRequest(env,'GET',apiPath);
  await audit(env,user,result.ok?'read_completed':'read_failed',`GET ${apiPath} -> ${result.status}`,null,requestId(request));
  return json({path:apiPath,provider_response:result.data,secrets_exposed:false},result.status);
 }
 if(request.method==='GET'&&path==='/api/cloudflare/token-verify'){
  const result=await apiRequest(env,'GET','/user/tokens/verify');
  return json({configured:Boolean(token(env)),verification:result.data,secrets_exposed:false},result.status);
 }
 if(request.method==='GET'&&path==='/api/cloudflare/account'){
  const id=String(env.CLOUDFLARE_PLATFORM_ACCOUNT_ID||'').trim();if(!id)return json({detail:'CLOUDFLARE_PLATFORM_ACCOUNT_ID is not configured.'},409);
  const result=await apiRequest(env,'GET',`/accounts/${encodeURIComponent(id)}`);return json({provider_response:result.data,secrets_exposed:false},result.status);
 }
 if(request.method==='GET'&&path==='/api/cloudflare/zones'){
  const account=String(env.CLOUDFLARE_PLATFORM_ACCOUNT_ID||'').trim();
  const result=await apiRequest(env,'GET',account?`/zones?account.id=${encodeURIComponent(account)}`:'/zones');return json({provider_response:result.data,secrets_exposed:false},result.status);
 }
 if(request.method==='POST'&&path==='/api/cloudflare/actions')return stageAction(request,env,user);
 const confirm=path.match(/^\/api\/cloudflare\/actions\/([^/]+)\/confirm$/);
 if(confirm&&request.method==='POST')return confirmAction(request,env,user,confirm[1]);
 return json({detail:'Cloudflare control-plane route not found.'},404);
}
