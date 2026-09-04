import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const enc=new TextEncoder();
const dec=new TextDecoder();
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);
const MCP_CURRENT='2026-07-28';
const MCP_LEGACY='2025-06-18';

const BUILTIN_FAMILIES=[
 'web-search','deep-research','calculator','weather','currency','unit-conversion','time','maps-local-search',
 'files-documents','spreadsheets','slides','pdf','image-generation','image-editing','voice','text-to-speech','speech-to-text',
 'video-generation','cinema','avatars','lipsync','translation','coding','github','email','calendar','contacts','cloud-drive',
 'crm','sales','payments','commerce','social-media','music','database','communications','telephony','automation','knowledge-memory'
];

function isManager(user){return ['owner','admin'].includes(String(user?.role||'').toLowerCase())}
function safeUrl(value){
 try{
  const u=new URL(String(value||''));
  if(u.protocol!=='https:'||u.username||u.password)return null;
  const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,'');
  if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h==='127.0.0.1'||h==='0.0.0.0'||h==='::1'||h==='::'||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return null;
  return u;
 }catch{return null}
}
async function key(env){
 const source=clip(env?.INTEGRATION_CREDENTIALS_KEY,500);
 if(!source)throw new Error('INTEGRATION_CREDENTIALS_KEY is required for tool credentials.');
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(`magnanimous-mcp-v2:${source}`));
 return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(v){const raw=atob(v);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function seal(value,env){if(!value)return'';const iv=crypto.getRandomValues(new Uint8Array(12));const k=await key(env);const out=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(String(value)));return`mcp2.${b64(iv)}.${b64(new Uint8Array(out))}`}
async function open(value,env){const raw=String(value||'');if(!raw)return'';if(!raw.startsWith('mcp2.'))throw new Error('Stored tool credential uses an unsupported legacy format; re-save this connection.');const[,a,b]=raw.split('.');const k=await key(env);const out=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(a)},k,unb64(b));return dec.decode(out)}

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tool_servers (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,name TEXT NOT NULL,server_url TEXT NOT NULL,auth_type TEXT NOT NULL DEFAULT 'none',auth_secret TEXT NOT NULL DEFAULT '',enabled INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'unknown',tool_count INTEGER NOT NULL DEFAULT 0,last_error TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,server_url))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_discovered_tools (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,server_id INTEGER NOT NULL,tool_name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',input_schema_json TEXT NOT NULL DEFAULT '{}',enabled INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,server_id,tool_name))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tool_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,action TEXT NOT NULL,server_id INTEGER,tool_name TEXT NOT NULL DEFAULT '',success INTEGER NOT NULL DEFAULT 0,detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
}
async function audit(env,user,action,{serverId=null,tool='',success=false,detail=''}={}){try{await env.DB.prepare('INSERT INTO magnanimous_tool_audit(tenant_id,user_id,action,server_id,tool_name,success,detail,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),clip(action,100),serverId,clip(tool,200),success?1:0,clip(detail,1000),now()).run()}catch{}}

async function postMcp(server,body,env,headersExtra={}){
 let target=safeUrl(server.server_url);if(!target)throw new Error('MCP server URL is no longer allowed.');
 const headers={'content-type':'application/json','accept':'application/json, text/event-stream',...headersExtra};
 const secret=await open(server.auth_secret,env);if(server.auth_type==='bearer'&&secret)headers.authorization=`Bearer ${secret}`;
 for(let redirects=0;redirects<4;redirects++){
  const r=await fetch(target.toString(),{method:'POST',headers,body:JSON.stringify(body),redirect:'manual'});
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');if(!location)throw new Error('MCP server returned an invalid redirect.');
   const next=safeUrl(new URL(location,target).toString());if(!next)throw new Error('MCP server redirected to a blocked address.');target=next;continue;
  }
  const text=await r.text();if(!r.ok)throw new Error(`MCP server returned ${r.status}: ${text.slice(0,400)}`);
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);let payload=null;
  for(const line of lines){const candidate=line.startsWith('data:')?line.slice(5).trim():line;if(!candidate||candidate==='[DONE]')continue;try{const parsed=JSON.parse(candidate);if(parsed?.result||parsed?.error)payload=parsed}catch{}}
  if(!payload){try{payload=JSON.parse(text)}catch{}}
  if(!payload)throw new Error('MCP server returned an unreadable response.');if(payload.error)throw new Error(payload.error.message||'MCP request failed.');return payload.result;
 }
 throw new Error('MCP server exceeded the redirect limit.');
}
function meta(){return{'io.modelcontextprotocol/clientInfo':{name:'Magnanimous AI',version:'1.0'},'io.modelcontextprotocol/clientCapabilities':{}}}
async function rpcModern(server,method,params,env){
 const name=method==='tools/call'?clip(params?.name,200):'';
 const headers={'MCP-Protocol-Version':MCP_CURRENT,'Mcp-Method':method};if(name)headers['Mcp-Name']=name;
 return postMcp(server,{jsonrpc:'2.0',id:crypto.randomUUID(),method,params:{...(params||{}),_meta:meta()}},env,headers);
}
async function rpcLegacy(server,method,params,env){
 return postMcp(server,{jsonrpc:'2.0',id:crypto.randomUUID(),method,params:params||{}},env,{'MCP-Protocol-Version':MCP_LEGACY});
}
async function listTools(server,env){
 try{await rpcModern(server,'server/discover',{},env).catch(()=>null);return{result:await rpcModern(server,'tools/list',{},env),protocol:MCP_CURRENT}}
 catch(modernError){
  try{await rpcLegacy(server,'initialize',{protocolVersion:MCP_LEGACY,capabilities:{},clientInfo:{name:'Magnanimous AI',version:'1.0'}},env);return{result:await rpcLegacy(server,'tools/list',{},env),protocol:MCP_LEGACY}}
  catch{throw modernError}
 }
}
async function callTool(server,name,args,env){try{return await rpcModern(server,'tools/call',{name,arguments:args||{}},env)}catch(modernError){try{await rpcLegacy(server,'initialize',{protocolVersion:MCP_LEGACY,capabilities:{},clientInfo:{name:'Magnanimous AI',version:'1.0'}},env);return await rpcLegacy(server,'tools/call',{name,arguments:args||{}},env)}catch{throw modernError}}}
async function listServers(env,user){await schema(env);const{results=[]}=await env.DB.prepare('SELECT id,name,server_url,auth_type,enabled,status,tool_count,last_error,created_at,updated_at FROM magnanimous_tool_servers WHERE tenant_id=? ORDER BY name').bind(String(user.tenant_id)).all();return results}
async function discoverOne(env,user,server){
 try{
  const {result,protocol}=await listTools(server,env),tools=Array.isArray(result?.tools)?result.tools:[];
  await env.DB.prepare('DELETE FROM magnanimous_discovered_tools WHERE tenant_id=? AND server_id=?').bind(String(user.tenant_id),server.id).run();
  for(const t of tools.slice(0,500))await env.DB.prepare('INSERT INTO magnanimous_discovered_tools(tenant_id,server_id,tool_name,description,input_schema_json,enabled,updated_at) VALUES(?,?,?,?,?,1,?) ON CONFLICT(tenant_id,server_id,tool_name) DO UPDATE SET description=excluded.description,input_schema_json=excluded.input_schema_json,enabled=1,updated_at=excluded.updated_at').bind(String(user.tenant_id),server.id,clip(t.name,200),clip(t.description,3000),JSON.stringify(t.inputSchema||{}).slice(0,30000),now()).run();
  await env.DB.prepare("UPDATE magnanimous_tool_servers SET status='ready',tool_count=?,last_error='',updated_at=? WHERE id=? AND tenant_id=?").bind(tools.length,now(),server.id,String(user.tenant_id)).run();
  await audit(env,user,'discover',{serverId:server.id,success:true,detail:`${tools.length} tools via MCP ${protocol}`});
  return{server_id:server.id,name:server.name,ok:true,protocol,tools:tools.map(t=>({name:t.name,description:t.description||'',inputSchema:t.inputSchema||{}}))};
 }catch(e){
  const message=clip(e?.message||e,1000);await env.DB.prepare("UPDATE magnanimous_tool_servers SET status='error',last_error=?,updated_at=? WHERE id=? AND tenant_id=?").bind(message,now(),server.id,String(user.tenant_id)).run();await audit(env,user,'discover',{serverId:server.id,success:false,detail:message});return{server_id:server.id,name:server.name,ok:false,error:message,tools:[]};
 }
}

export async function handleMagnanimousToolGateway(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/magnanimous/tools'))return null;if(!env?.DB)return json({detail:'Tool gateway requires D1.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await schema(env);
 if(request.method==='GET'&&url.pathname==='/api/magnanimous/tools'){
  const servers=await listServers(env,user),{results=[]}=await env.DB.prepare('SELECT t.server_id,t.tool_name,t.description,t.input_schema_json,t.enabled,s.name AS server_name FROM magnanimous_discovered_tools t JOIN magnanimous_tool_servers s ON s.id=t.server_id WHERE t.tenant_id=? AND t.enabled=1 AND s.enabled=1 ORDER BY s.name,t.tool_name LIMIT 2000').bind(String(user.tenant_id)).all();
  return json({identity:'Magnanimous AI',architecture:'central-brain-with-tool-gateway',mcp_protocol:MCP_CURRENT,legacy_fallback:MCP_LEGACY,builtin_families:BUILTIN_FAMILIES,servers,tools:results.map(x=>({...x,input_schema:JSON.parse(x.input_schema_json||'{}')})),note:'External tools extend Magnanimous. Account authorization and provider permissions still apply.'});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tools/register'){
  if(!isManager(user))return json({detail:'Owner or admin role required to register tool servers.'},403);
  const b=await request.json().catch(()=>({})),target=safeUrl(b.url);if(!target)return json({detail:'A public HTTPS MCP server URL is required.'},400);
  const name=clip(b.name||target.hostname,120),authType=['none','bearer'].includes(String(b.auth_type))?String(b.auth_type):'none';let secret='';try{secret=authType==='bearer'?await seal(clip(b.token,12000),env):''}catch(e){return json({detail:clip(e?.message||e,500)},503)}
  const ts=now();await env.DB.prepare(`INSERT INTO magnanimous_tool_servers(tenant_id,name,server_url,auth_type,auth_secret,enabled,status,tool_count,last_error,created_at,updated_at) VALUES(?,?,?,?,?,1,'unknown',0,'',?,?) ON CONFLICT(tenant_id,server_url) DO UPDATE SET name=excluded.name,auth_type=excluded.auth_type,auth_secret=CASE WHEN excluded.auth_secret<>'' THEN excluded.auth_secret ELSE magnanimous_tool_servers.auth_secret END,enabled=1,updated_at=excluded.updated_at`).bind(String(user.tenant_id),name,target.toString(),authType,secret,ts,ts).run();
  const server=await env.DB.prepare('SELECT * FROM magnanimous_tool_servers WHERE tenant_id=? AND server_url=?').bind(String(user.tenant_id),target.toString()).first();await audit(env,user,'register',{serverId:server?.id,success:true,detail:target.hostname});return json({ok:true,registered:true,discovery:await discoverOne(env,user,server)});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tools/discover'){
  if(!isManager(user))return json({detail:'Owner or admin role required to refresh tool servers.'},403);
  const servers=await env.DB.prepare('SELECT * FROM magnanimous_tool_servers WHERE tenant_id=? AND enabled=1 ORDER BY id').bind(String(user.tenant_id)).all(),out=[];for(const s of servers.results||[])out.push(await discoverOne(env,user,s));return json({ok:true,servers:out,total_tools:out.reduce((n,x)=>n+(x.tools?.length||0),0)});
 }
 if(request.method==='POST'&&url.pathname==='/api/magnanimous/tools/call'){
  const b=await request.json().catch(()=>({})),tool=clip(b.tool,200),serverId=Number(b.server_id||0);if(!tool||!serverId)return json({detail:'server_id and tool are required.'},400);
  const server=await env.DB.prepare('SELECT * FROM magnanimous_tool_servers WHERE tenant_id=? AND id=? AND enabled=1').bind(String(user.tenant_id),serverId).first();if(!server)return json({detail:'Tool server not found or disabled.'},404);
  const known=await env.DB.prepare('SELECT enabled FROM magnanimous_discovered_tools WHERE tenant_id=? AND server_id=? AND tool_name=?').bind(String(user.tenant_id),serverId,tool).first();if(!known?.enabled)return json({detail:'Tool is not enabled in Magnanimous registry.'},403);
  try{const result=await callTool(server,tool,b.arguments||{},env);await audit(env,user,'call',{serverId,tool,success:true});return json({ok:true,server:server.name,tool,result})}catch(e){const message=clip(e?.message||e,1200);await audit(env,user,'call',{serverId,tool,success:false,detail:message});return json({detail:message,code:'MCP_TOOL_CALL_FAILED'},502)}
 }
 if(request.method==='GET'&&url.pathname==='/api/magnanimous/tools/audit'){
  if(!isManager(user))return json({detail:'Owner or admin role required.'},403);const{results=[]}=await env.DB.prepare('SELECT id,user_id,action,server_id,tool_name,success,detail,created_at FROM magnanimous_tool_audit WHERE tenant_id=? ORDER BY id DESC LIMIT 250').bind(String(user.tenant_id)).all();return json({ok:true,audit:results});
 }
 return json({detail:'Unsupported Magnanimous tool gateway operation.'},405);
}
