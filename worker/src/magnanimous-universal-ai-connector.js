import { currentUser } from './integrations.js';
import { handleMagnanimousNativeMail } from './magnanimous-native-mail-runtime.js';
import { handleMagnanimousCommunications } from './magnanimous-communications-router.js';

const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{'cache-control':'no-store',...extra}});
const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
const MODERN_PROTOCOL='2026-07-28';
const LEGACY_PROTOCOL='2025-11-25';
const DEFAULT_SCOPES=['capabilities.read','brain.ask','mail.read','communications.read'];
const ALL_SCOPES=new Set(['capabilities.read','brain.ask','mail.read','mail.write','communications.read','communications.write']);

export const MAGNANIMOUS_AI_PLATFORMS=[
 {id:'openai-chatgpt',name:'ChatGPT / OpenAI',protocol:'MCP',transport:'Streamable HTTP',install:'Use the Magnanimous remote MCP URL and a scoped connector token. Public directory/plugin distribution may require OpenAI review.'},
 {id:'anthropic-claude',name:'Claude / Anthropic',protocol:'MCP',transport:'Remote HTTP',install:'Use the Magnanimous remote MCP URL with the Claude MCP connector/API and a scoped connector token.'},
 {id:'google-gemini',name:'Gemini / Google AI',protocol:'MCP + OpenAPI fallback',transport:'Streamable HTTP',install:'Use remote MCP on compatible Gemini API models; use the OpenAPI invocation endpoint where remote MCP is unavailable.'},
 {id:'microsoft-copilot',name:'Microsoft Copilot',protocol:'MCP',transport:'Streamable HTTP',install:'Add the Magnanimous MCP server in Copilot Studio. Public gallery distribution can require Microsoft certification/admin approval.'},
 {id:'generic-mcp',name:'Any MCP-compatible AI',protocol:'MCP',transport:'Streamable HTTP',install:'Point the client at the Magnanimous MCP URL and authenticate with a scoped connector token.'},
 {id:'generic-openapi',name:'Any OpenAPI/function-calling AI',protocol:'OpenAPI',transport:'HTTPS JSON',install:'Import the Magnanimous OpenAPI schema and authenticate with a scoped connector token.'}
];

const TOOL_DEFS=[
 {name:'magnanimous_capabilities',scope:'capabilities.read',description:'Read Magnanimous AI capabilities, routing identity and connector information.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'magnanimous_ask',scope:'brain.ask',description:'Delegate a reasoning or planning request to Magnanimous AI, which remains the command, memory and verification layer.',inputSchema:{type:'object',properties:{message:{type:'string',description:'The task or question for Magnanimous AI.'}},required:['message'],additionalProperties:false}},
 {name:'magnanimous_mail_accounts',scope:'mail.read',description:'List Gmail and Outlook accounts already authorized inside Magnanimous. Does not expose OAuth credentials.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'magnanimous_mail_search',scope:'mail.read',description:'Search all authorized Gmail and Outlook accounts through Magnanimous native multi-account mail.',inputSchema:{type:'object',properties:{query:{type:'string'},terms:{type:'array',items:{type:'string'}},limit_per_account:{type:'integer',minimum:1,maximum:20}},additionalProperties:false}},
 {name:'magnanimous_mail_inbox',scope:'mail.read',description:'Read a unified inbox view from all authorized Gmail and Outlook accounts.',inputSchema:{type:'object',properties:{query:{type:'string'},limit_per_account:{type:'integer',minimum:1,maximum:20}},additionalProperties:false}},
 {name:'magnanimous_mail_send',scope:'mail.write',description:'Send email through one specifically selected authorized Gmail or Outlook account. Requires connector write scope and confirm=true.',inputSchema:{type:'object',properties:{provider:{type:'string',enum:['google','outlook']},external_account_id:{type:'string'},to:{type:'string'},cc:{type:'string'},bcc:{type:'string'},subject:{type:'string'},body:{type:'string'},confirm:{type:'boolean'}},required:['provider','external_account_id','to','body','confirm'],additionalProperties:false}},
 {name:'magnanimous_communications_catalog',scope:'communications.read',description:'Read the Magnanimous communications tool catalog and readiness without exposing provider secrets.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'magnanimous_communications_execute',scope:'communications.write',description:'Execute an authorized Magnanimous communications action. Underlying router still enforces destructive and sensitive confirmation gates.',inputSchema:{type:'object',properties:{action:{type:'string'},tool:{type:'string'},method:{type:'string'},path:{type:'string'},query:{type:'object'},body:{type:'object'},arguments:{type:'object'},approved:{type:'boolean'},confirm_destructive:{type:'boolean'},confirm_sensitive:{type:'boolean'}},additionalProperties:true}}
];

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_ai_connector_tokens(
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'generic-mcp',
  token_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_ai_connector_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connector_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  tool_name TEXT NOT NULL DEFAULT '',
  success INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
 )`).run();
}
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomSecret(){const bytes=crypto.getRandomValues(new Uint8Array(32));return`mgc_${b64url(bytes)}`}
async function sha256Hex(value){const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(String(value)));return[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sessionSecret(env){const direct=String(env?.SESSION_SECRET||'').trim();if(direct)return direct;if(!env?.DB)return'';const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}
async function hmacHex(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(String(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,encoder.encode(String(value)));return[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function safeScopes(value){const input=Array.isArray(value)?value:[];return[...new Set(input.map(x=>String(x||'').trim()).filter(x=>ALL_SCOPES.has(x)))]}
function parseScopes(row){try{return new Set(JSON.parse(row?.scopes_json||'[]'))}catch{return new Set()}}
function connectorToken(request){const auth=String(request.headers.get('authorization')||'').trim();if(/^Bearer\s+/i.test(auth))return auth.replace(/^Bearer\s+/i,'').trim();return String(request.headers.get('x-magnanimous-connector-key')||'').trim()}
async function authorizeConnector(request,env){
 if(!env?.DB)return null;await ensureSchema(env);const token=connectorToken(request);if(!token||!token.startsWith('mgc_'))return null;const hash=await sha256Hex(token);
 const row=await env.DB.prepare(`SELECT id,tenant_id,user_id,name,platform,scopes_json,active FROM magnanimous_ai_connector_tokens WHERE token_hash=? AND active=1`).bind(hash).first();
 if(!row)return null;await env.DB.prepare('UPDATE magnanimous_ai_connector_tokens SET last_used_at=? WHERE id=?').bind(now(),row.id).run().catch(()=>{});return{...row,scopes:parseScopes(row)};
}
async function audit(env,connector,tool,success,status){try{if(!env?.DB||!connector)return;await env.DB.prepare('INSERT INTO magnanimous_ai_connector_audit(connector_id,tenant_id,platform,tool_name,success,status,created_at) VALUES(?,?,?,?,?,?,?)').bind(connector.id,connector.tenant_id,connector.platform,String(tool||'').slice(0,160),success?1:0,Number(status||0),now()).run()}catch{}}
async function shortSession(env,connector){
 const user=await env.DB.prepare('SELECT id,tenant_id,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(connector.user_id,connector.tenant_id).first();if(!user)return'';
 const secret=await sessionSecret(env);if(!secret)return'';const exp=now()+300;const base=`${user.id}|${user.tenant_id}|${user.role}|${exp}`;return`${base}|${await hmacHex(secret,base)}`;
}
function internalRequest(request,path,method='GET',body,session=''){const headers=new Headers();if(session)headers.set('authorization',`Bearer ${session}`);if(body!==undefined)headers.set('content-type','application/json');return new Request(new URL(path,request.url),{method,headers,body:body===undefined?undefined:JSON.stringify(body)})}
async function responseData(response){const text=await response.text();try{return{text,data:text?JSON.parse(text):{}}}catch{return{text,data:{raw:text}}}}
function hasScope(connector,scope){return connector?.scopes?.has(scope)}
function visibleTools(connector){return TOOL_DEFS.filter(t=>hasScope(connector,t.scope)).map(({scope,...tool})=>tool)}

async function executeTool(request,env,connector,name,args={}){
 const def=TOOL_DEFS.find(x=>x.name===name);if(!def)return{status:404,error:'Unknown Magnanimous connector tool.'};if(!hasScope(connector,def.scope))return{status:403,error:`Connector scope ${def.scope} is required.`};
 const session=await shortSession(env,connector);if(!session)return{status:401,error:'Connector owner session could not be established.'};
 if(name==='magnanimous_capabilities'){
  const response=await fetch(new URL('/api/operator/capabilities',request.url),{headers:{authorization:`Bearer ${session}`}});const out=await responseData(response);return{status:response.status,data:out.data};
 }
 if(name==='magnanimous_ask'){
  const message=String(args?.message||'').trim();if(!message)return{status:400,error:'message is required.'};
  const response=await fetch(new URL('/api/chat',request.url),{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session}`},body:JSON.stringify({message,tool:'magnanimous'})});const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.data?.error||out.text};
 }
 if(name==='magnanimous_mail_accounts'){
  const response=await handleMagnanimousNativeMail(internalRequest(request,'/api/magnanimous/mail/accounts','GET',undefined,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.text};
 }
 if(name==='magnanimous_mail_search'){
  const response=await handleMagnanimousNativeMail(internalRequest(request,'/api/magnanimous/mail/search','POST',args,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.text};
 }
 if(name==='magnanimous_mail_inbox'){
  const response=await handleMagnanimousNativeMail(internalRequest(request,'/api/magnanimous/mail/inbox','POST',args,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.text};
 }
 if(name==='magnanimous_mail_send'){
  if(args?.confirm!==true)return{status:409,error:'confirm=true is required before sending email.'};
  const response=await handleMagnanimousNativeMail(internalRequest(request,'/api/magnanimous/mail/send','POST',args,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.text};
 }
 if(name==='magnanimous_communications_catalog'){
  const response=await handleMagnanimousCommunications(internalRequest(request,'/api/magnanimous/communications/catalog','GET',undefined,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.text};
 }
 if(name==='magnanimous_communications_execute'){
  const response=await handleMagnanimousCommunications(internalRequest(request,'/api/magnanimous/communications/execute','POST',args,session),env);const out=await responseData(response);return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.data?.error||out.text};
 }
 return{status:404,error:'Tool handler is not implemented.'};
}

function rpcResult(id,result){return json({jsonrpc:'2.0',id,result},200,{'content-type':'application/json'})}
function rpcError(id,code,message,status=200,data){return json({jsonrpc:'2.0',id:id??null,error:{code,message,...(data===undefined?{}:{data})}},status,{'content-type':'application/json'})}
function toolPayload(result){if(result.error)return{isError:true,content:[{type:'text',text:String(result.error)}]};const data=result.data??{};return{isError:false,structuredContent:data,content:[{type:'text',text:JSON.stringify(data)}]}}
function modernDiscover(){return{protocolVersion:MODERN_PROTOCOL,serverInfo:{name:'Magnanimous AI',version:'1.0.0'},capabilities:{tools:{listChanged:false},resources:{},prompts:{}},instructions:'Magnanimous AI is the command, memory, routing and verification layer. Use only tools exposed by the connector token scopes.'}}
async function handleMcp(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type,mcp-protocol-version,mcp-method,mcp-name,x-magnanimous-connector-key','access-control-allow-methods':'POST,OPTIONS'}});
 if(request.method!=='POST')return json({detail:'Magnanimous MCP uses POST Streamable HTTP.'},405);
 const connector=await authorizeConnector(request,env);if(!connector)return rpcError(null,-32001,'Valid Magnanimous connector authentication is required.',401);
 const body=await request.json().catch(()=>null);if(!body||body.jsonrpc!=='2.0'||!body.method)return rpcError(body?.id,-32600,'Invalid JSON-RPC request.',400);
 const method=String(body.method),id=body.id??null,headerMethod=request.headers.get('mcp-method');if(headerMethod&&headerMethod!==method)return rpcError(id,-32020,'Mcp-Method header does not match the JSON-RPC method.',400);
 if(method==='server/discover')return rpcResult(id,modernDiscover());
 if(method==='initialize')return rpcResult(id,{protocolVersion:LEGACY_PROTOCOL,serverInfo:{name:'Magnanimous AI',version:'1.0.0'},capabilities:{tools:{listChanged:false}},instructions:'Magnanimous AI universal connector.'});
 if(method==='notifications/initialized')return new Response(null,{status:202});
 if(method==='ping')return rpcResult(id,{});
 if(method==='tools/list')return rpcResult(id,{tools:visibleTools(connector),ttlMs:300000,cacheScope:'private'});
 if(method==='tools/call'){
  const name=String(body.params?.name||'');const headerName=request.headers.get('mcp-name');if(headerName&&headerName!==name)return rpcError(id,-32020,'Mcp-Name header does not match params.name.',400);
  const result=await executeTool(request,env,connector,name,body.params?.arguments||{});await audit(env,connector,name,!result.error,result.status);return rpcResult(id,toolPayload(result));
 }
 return rpcError(id,-32601,'Method not found.');
}

function manifest(request){const origin=new URL(request.url).origin;return{name:'Magnanimous AI',publisher:'I AM MAGNANIMOUS WAY™',identity:'Magnanimous AI',mcp:{url:`${origin}/mcp`,protocols:[MODERN_PROTOCOL,LEGACY_PROTOCOL],transport:'streamable-http',authentication:'Bearer connector token'},openapi:`${origin}/api/magnanimous/ai-connectors/openapi.json`,management:`${origin}/api/magnanimous/ai-connectors`,platforms:MAGNANIMOUS_AI_PLATFORMS,principle:'External AI platforms are clients or execution environments. Magnanimous remains the command, memory, routing and verification layer.'}}
function openApi(request){const origin=new URL(request.url).origin;return{openapi:'3.1.0',info:{title:'Magnanimous AI Universal Connector',version:'1.0.0',description:'Provider-neutral connector for Magnanimous AI. Use a scoped connector token.'},servers:[{url:origin}],components:{securitySchemes:{ConnectorBearer:{type:'http',scheme:'bearer'}}},security:[{ConnectorBearer:[]}],paths:{'/api/magnanimous/ai-connectors/invoke':{post:{summary:'Invoke one authorized Magnanimous connector tool',requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{tool:{type:'string'},arguments:{type:'object'}},required:['tool']}}}},responses:{'200':{description:'Tool result'},'401':{description:'Invalid connector token'},'403':{description:'Insufficient scope'}}}}}}}

export async function handleMagnanimousUniversalAIConnector(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/.well-known/magnanimous-ai-connector.json'&&request.method==='GET')return json(manifest(request));
 if(path==='/api/magnanimous/ai-connectors/openapi.json'&&request.method==='GET')return json(openApi(request));
 if(path==='/mcp'||path==='/api/magnanimous/mcp')return handleMcp(request,env);
 if(path==='/api/magnanimous/ai-connectors/invoke'&&request.method==='POST'){
  const connector=await authorizeConnector(request,env);if(!connector)return json({detail:'Valid Magnanimous connector token required.'},401);const body=await request.json().catch(()=>({}));const tool=String(body.tool||'');const result=await executeTool(request,env,connector,tool,body.arguments||{});await audit(env,connector,tool,!result.error,result.status);return result.error?json({detail:result.error,tool},result.status||400):json({ok:true,tool,result:result.data});
 }
 if(!path.startsWith('/api/magnanimous/ai-connectors'))return null;
 const user=await currentUser(request,env);if(!user||!['owner','admin'].includes(String(user.role||'').toLowerCase()))return json({detail:'Owner or admin access required.'},403);await ensureSchema(env);
 if(request.method==='GET'&&path==='/api/magnanimous/ai-connectors'){
  const {results=[]}=await env.DB.prepare('SELECT id,name,platform,scopes_json,active,created_at,last_used_at FROM magnanimous_ai_connector_tokens WHERE tenant_id=? ORDER BY created_at DESC').bind(user.tenant_id).all();return json({...manifest(request),available_scopes:[...ALL_SCOPES],default_scopes:DEFAULT_SCOPES,tokens:results.map(x=>({...x,scopes:[...parseScopes(x)]}))});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/ai-connectors/token'){
  const body=await request.json().catch(()=>({}));const scopes=safeScopes(body.scopes);const effective=scopes.length?scopes:DEFAULT_SCOPES;const platform=String(body.platform||'generic-mcp').slice(0,80);const name=String(body.name||`${platform} connector`).slice(0,120);const token=randomSecret(),hash=await sha256Hex(token),id=crypto.randomUUID(),ts=now();
  await env.DB.prepare('INSERT INTO magnanimous_ai_connector_tokens(id,tenant_id,user_id,name,platform,token_hash,scopes_json,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,user.tenant_id,user.id,name,platform,hash,JSON.stringify(effective),1,ts).run();return json({ok:true,id,name,platform,scopes:effective,token,mcp_url:`${url.origin}/mcp`,openapi_url:`${url.origin}/api/magnanimous/ai-connectors/openapi.json`,warning:'This connector token is shown once. Store it in the destination AI platform secret/authorization field, not in source code.'},201);
 }
 const revoke=path.match(/^\/api\/magnanimous\/ai-connectors\/token\/([^/]+)$/);
 if(request.method==='DELETE'&&revoke){const id=decodeURIComponent(revoke[1]);await env.DB.prepare('UPDATE magnanimous_ai_connector_tokens SET active=0 WHERE id=? AND tenant_id=?').bind(id,user.tenant_id).run();return json({ok:true,id,revoked:true});}
 return json({detail:'Magnanimous AI connector endpoint not found.'},404);
}
