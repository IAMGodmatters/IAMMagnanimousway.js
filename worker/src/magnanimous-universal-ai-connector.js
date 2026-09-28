import { currentUser } from './integrations.js';
import { handleMagnanimousNativeMail } from './magnanimous-native-mail-runtime.js';
import { handleMagnanimousCommunications } from './magnanimous-communications-router.js';
import { handleMagnanimousNativeWeb } from './magnanimous-native-web-runtime.js';
import { authorizeMagnanimousOAuthToken, handleMagnanimousPluginOAuth, magnanimousOAuthChallenge } from './magnanimous-plugin-oauth.js';

const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{'cache-control':'no-store',...extra}});
const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
const MODERN_PROTOCOL='2026-07-28';
const LEGACY_PROTOCOL='2025-11-25';
const DEFAULT_SCOPES=['capabilities.read','brain.ask','web.read','mail.read','communications.read'];
const ALL_SCOPES=new Set(['capabilities.read','brain.ask','web.read','web.write','mail.read','mail.write','communications.read','communications.write']);
const SKILLS_EXTENSION='io.modelcontextprotocol/skills';
const NATIVE_WEB_SKILL_URI='skill://i-am-magnanimous-way/magnanimous-native-web/SKILL.md';
const READ_ONLY_OPEN_WEB=Object.freeze({readOnlyHint:true,destructiveHint:false,openWorldHint:true});
const READ_ONLY_LOCAL=Object.freeze({readOnlyHint:true,destructiveHint:false,openWorldHint:false});
const GUARDED_OPEN_WEB=Object.freeze({readOnlyHint:false,destructiveHint:false,openWorldHint:true});
const GUARDED_LOCAL=Object.freeze({readOnlyHint:false,destructiveHint:false,openWorldHint:false});
const DESTRUCTIVE_LOCAL=Object.freeze({readOnlyHint:false,destructiveHint:true,openWorldHint:false});

export const MAGNANIMOUS_AI_PLATFORMS=[
 {id:'openai-chatgpt',name:'ChatGPT / OpenAI',protocol:'MCP',transport:'Streamable HTTP',install:'Use the Magnanimous remote MCP URL. ChatGPT authenticates through Magnanimous OAuth 2.1 + PKCE; public directory distribution still requires OpenAI review.'},
 {id:'anthropic-claude',name:'Claude / Anthropic',protocol:'MCP',transport:'Remote HTTP',install:'Use the Magnanimous remote MCP URL with the Claude MCP connector/API and a scoped connector token.'},
 {id:'google-gemini',name:'Gemini / Google AI',protocol:'MCP + OpenAPI fallback',transport:'Streamable HTTP',install:'Use remote MCP on compatible Gemini API models; use the OpenAPI invocation endpoint where remote MCP is unavailable.'},
 {id:'microsoft-copilot',name:'Microsoft Copilot',protocol:'MCP',transport:'Streamable HTTP',install:'Add the Magnanimous MCP server in Copilot Studio. Public gallery distribution can require Microsoft certification/admin approval.'},
 {id:'generic-mcp',name:'Any MCP-compatible AI',protocol:'MCP',transport:'Streamable HTTP',install:'Point the client at the Magnanimous MCP URL and authenticate with a scoped connector token.'},
 {id:'generic-openapi',name:'Any OpenAPI/function-calling AI',protocol:'OpenAPI',transport:'HTTPS JSON',install:'Import the Magnanimous OpenAPI schema and authenticate with a scoped connector token.'}
];

const TOOL_DEFS=[
 {name:'magnanimous_capabilities',title:'Magnanimous capabilities',scope:'capabilities.read',description:'Read Magnanimous AI capabilities, routing identity and connector information.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_ask',title:'Ask Magnanimous AI',scope:'brain.ask',description:'Delegate a reasoning or planning request to Magnanimous AI, which remains the command, memory and verification layer.',inputSchema:{type:'object',properties:{message:{type:'string',description:'The task or question for Magnanimous AI.'}},required:['message'],additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'get_profile',title:'Magnanimous profile',scope:'capabilities.read',description:'Return the stable Magnanimous connector profile for the currently authorized workspace without exposing login credentials.',inputSchema:{type:'object',properties:{},additionalProperties:false},outputSchema:{type:'object',properties:{id:{type:'string'},nickname:{type:'string'}},required:['id'],additionalProperties:false},annotations:READ_ONLY_LOCAL,_meta:{'openai/profile':true}},

 // Standard names make the connector compatible with ChatGPT deep research / company-knowledge style MCP discovery.
 {name:'search',title:'Search the web with Magnanimous',scope:'web.read',description:'Search the live public web with Magnanimous Native Web. Returns stable URL ids that can be passed to fetch. No TinyFish wallet or runtime is required.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},outputSchema:{type:'object',properties:{results:{type:'array',items:{type:'object',properties:{id:{type:'string'},title:{type:'string'},url:{type:'string'},text:{type:'string'}},required:['id','title','url','text'],additionalProperties:true}},run_id:{type:'string'},status:{type:'string'}},required:['results'],additionalProperties:true},annotations:READ_ONLY_OPEN_WEB},
 {name:'fetch',title:'Fetch a web page with Magnanimous',scope:'web.read',description:'Fetch and render a public web URL returned by search. Returns page title, text and links using Magnanimous Native Web.',inputSchema:{type:'object',properties:{id:{type:'string',description:'Absolute public http(s) URL returned by search.'}},required:['id'],additionalProperties:false},outputSchema:{type:'object',properties:{id:{type:'string'},url:{type:'string'},title:{type:'string'},text:{type:'string'},links:{type:'array'},structured:{type:'object'},run_id:{type:'string'},status:{type:'string'}},required:['id','url','title','text'],additionalProperties:true},annotations:READ_ONLY_OPEN_WEB},
 {name:'magnanimous_web_capabilities',title:'Native web capabilities',scope:'web.read',description:'Read live Magnanimous Native Web readiness and the clean-room TinyFish-parity boundary.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_parity',title:'Native web parity map',scope:'web.read',description:'Read the public capability replacement map and truth boundaries for Magnanimous Native Web.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_usage',title:'Native web usage',scope:'web.read',description:'Read native browser run counts. Native execution does not require a TinyFish wallet.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_research',title:'Research with Magnanimous Native Web',scope:'web.read',description:'Run source-backed multi-page public-web research with Magnanimous Native Web and return a synthesized report when available.',inputSchema:{type:'object',properties:{query:{type:'string'},limit:{type:'integer',minimum:1,maximum:8},max_chars:{type:'integer'},output_schema:{type:['object','null']},locale:{type:'string'},profile:{type:'string'}},required:['query'],additionalProperties:false},annotations:READ_ONLY_OPEN_WEB},
 {name:'magnanimous_web_fetch_batch',title:'Batch fetch with Magnanimous',scope:'web.read',description:'Render and extract 1-10 public web URLs with per-URL results and errors.',inputSchema:{type:'object',properties:{urls:{type:'array',items:{type:'string'},minItems:1,maxItems:10},selector:{type:'string'},max_chars:{type:'integer'},include_html:{type:'boolean'},fields:{type:'object'},locale:{type:'string'},profile:{type:'string'}},required:['urls'],additionalProperties:false},annotations:READ_ONLY_OPEN_WEB},
 {name:'magnanimous_web_read_flow',title:'Native browser read flow',scope:'web.read',description:'Queue a bounded read-only browser workflow using goto, waits, extraction, snapshots, scrolling and screenshots.',inputSchema:{type:'object',properties:{steps:{type:'array',items:{type:'object'},minItems:1,maxItems:60},profile:{type:'string'},locale:{type:'string'},timeout_ms:{type:'integer'}},required:['steps'],additionalProperties:false},annotations:READ_ONLY_OPEN_WEB},
 {name:'magnanimous_web_runs',title:'List native web runs',scope:'web.read',description:'List recent Magnanimous native browser runs and statuses.',inputSchema:{type:'object',properties:{limit:{type:'integer',minimum:1,maximum:200},status:{type:'string'}},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_run_get',title:'Get native web run',scope:'web.read',description:'Read one native browser run, including its result when completed.',inputSchema:{type:'object',properties:{run_id:{type:'string'}},required:['run_id'],additionalProperties:false},annotations:READ_ONLY_LOCAL},

 {name:'magnanimous_web_goal',title:'Plan or run a browser goal',scope:'web.write',description:'Turn a plain-English browser goal into a bounded Magnanimous Native Web plan. Read-only goals can execute directly; interactive goals remain approval-gated.',inputSchema:{type:'object',properties:{goal:{type:'string'},start_url:{type:'string'},mode:{type:'string',enum:['read','action']},profile:{type:'string'},locale:{type:'string'},timeout_ms:{type:'integer'}},required:['goal'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_action_flow',title:'Queue guarded browser actions',scope:'web.write',description:'Queue page-scoped click/fill/select/press browser steps. Magnanimous keeps confirmation gates and rejects remote secret/password values.',inputSchema:{type:'object',properties:{steps:{type:'array',items:{type:'object'},minItems:1,maxItems:60},profile:{type:'string'},locale:{type:'string'},timeout_ms:{type:'integer'}},required:['steps'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_run_confirm',title:'Confirm a queued browser action',scope:'web.write',description:'Confirm the exact Magnanimous browser run that is waiting for approval.',inputSchema:{type:'object',properties:{run_id:{type:'string'}},required:['run_id'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_run_cancel',title:'Cancel a native browser run',scope:'web.write',description:'Cancel a queued or confirmation-waiting Magnanimous browser run.',inputSchema:{type:'object',properties:{run_id:{type:'string'}},required:['run_id'],additionalProperties:false},annotations:GUARDED_LOCAL},

 {name:'magnanimous_web_profiles',title:'List browser profiles',scope:'web.read',description:'List persistent Magnanimous local Chromium profiles without exposing cookies or credentials.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_profile_create',title:'Create browser profile',scope:'web.write',description:'Create a persistent local browser profile. Credentials stay on the paired owner computer.',inputSchema:{type:'object',properties:{profile:{type:'string'}},required:['profile'],additionalProperties:false},annotations:GUARDED_LOCAL},
 {name:'magnanimous_web_profile_setup',title:'Open local profile sign-in',scope:'web.write',description:'Open a visible local browser for manual sign-in. Passwords and secret values are never sent through the MCP connector.',inputSchema:{type:'object',properties:{profile:{type:'string'},url:{type:'string'},seconds:{type:'integer',minimum:10,maximum:900}},required:['profile','url'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_profile_delete',title:'Delete browser profile',scope:'web.write',description:'Delete a non-default local browser profile after Magnanimous confirmation.',inputSchema:{type:'object',properties:{profile:{type:'string'}},required:['profile'],additionalProperties:false},annotations:DESTRUCTIVE_LOCAL},

 {name:'magnanimous_web_session_start',title:'Start persistent browser session',scope:'web.write',description:'Start a persistent Magnanimous browser session on the paired Local Bridge.',inputSchema:{type:'object',properties:{url:{type:'string'},profile:{type:'string'},locale:{type:'string'}},additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_session_read',title:'Read persistent browser session',scope:'web.read',description:'Run read-only commands against a persistent browser session.',inputSchema:{type:'object',properties:{session_id:{type:'string'},steps:{type:'array',items:{type:'object'},minItems:1,maxItems:60}},required:['session_id','steps'],additionalProperties:false},annotations:READ_ONLY_OPEN_WEB},
 {name:'magnanimous_web_session_action',title:'Act in persistent browser session',scope:'web.write',description:'Queue guarded click/fill/select/press commands against a persistent browser session.',inputSchema:{type:'object',properties:{session_id:{type:'string'},steps:{type:'array',items:{type:'object'},minItems:1,maxItems:60}},required:['session_id','steps'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_session_end',title:'End persistent browser session',scope:'web.write',description:'End a persistent Magnanimous browser session.',inputSchema:{type:'object',properties:{session_id:{type:'string'}},required:['session_id'],additionalProperties:false},annotations:GUARDED_LOCAL},

 {name:'magnanimous_web_monitors',title:'List native web monitors',scope:'web.read',description:'List recurring read-only Magnanimous web monitors.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_monitor_get',title:'Get native web monitor',scope:'web.read',description:'Read one Magnanimous web monitor and its latest state.',inputSchema:{type:'object',properties:{monitor_id:{type:'string'}},required:['monitor_id'],additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_web_monitor_create',title:'Create native web monitor',scope:'web.write',description:'Create a recurring read-only search/fetch monitor. Minimum interval is enforced by Magnanimous.',inputSchema:{type:'object',properties:{name:{type:'string'},kind:{type:'string',enum:['search','fetch']},query:{type:'string'},url:{type:'string'},interval_minutes:{type:'integer',minimum:15,maximum:10080},profile:{type:'string'},locale:{type:'string'}},required:['kind'],additionalProperties:true},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_monitor_update',title:'Update native web monitor',scope:'web.write',description:'Pause, resume, or change the interval of an existing Magnanimous web monitor.',inputSchema:{type:'object',properties:{monitor_id:{type:'string'},status:{type:'string',enum:['active','paused']},interval_minutes:{type:'integer',minimum:15,maximum:10080}},required:['monitor_id'],additionalProperties:false},annotations:GUARDED_LOCAL},
 {name:'magnanimous_web_monitor_run',title:'Run native web monitor now',scope:'web.write',description:'Start one immediate read-only run for an existing monitor.',inputSchema:{type:'object',properties:{monitor_id:{type:'string'}},required:['monitor_id'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_web_monitor_delete',title:'Delete native web monitor',scope:'web.write',description:'Delete one Magnanimous web monitor.',inputSchema:{type:'object',properties:{monitor_id:{type:'string'}},required:['monitor_id'],additionalProperties:false},annotations:DESTRUCTIVE_LOCAL},

 {name:'magnanimous_mail_accounts',title:'Mail accounts',scope:'mail.read',description:'List Gmail and Outlook accounts already authorized inside Magnanimous. Does not expose OAuth credentials.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_mail_search',title:'Search mail',scope:'mail.read',description:'Search all authorized Gmail and Outlook accounts through Magnanimous native multi-account mail.',inputSchema:{type:'object',properties:{query:{type:'string'},terms:{type:'array',items:{type:'string'}},limit_per_account:{type:'integer',minimum:1,maximum:20}},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_mail_inbox',title:'Read unified inbox',scope:'mail.read',description:'Read a unified inbox view from all authorized Gmail and Outlook accounts.',inputSchema:{type:'object',properties:{query:{type:'string'},limit_per_account:{type:'integer',minimum:1,maximum:20}},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_mail_send',title:'Send mail',scope:'mail.write',description:'Send email through one specifically selected authorized Gmail or Outlook account. Requires connector write scope and confirm=true.',inputSchema:{type:'object',properties:{provider:{type:'string',enum:['google','outlook']},external_account_id:{type:'string'},to:{type:'string'},cc:{type:'string'},bcc:{type:'string'},subject:{type:'string'},body:{type:'string'},confirm:{type:'boolean'}},required:['provider','external_account_id','to','body','confirm'],additionalProperties:false},annotations:GUARDED_OPEN_WEB},
 {name:'magnanimous_communications_catalog',title:'Communications catalog',scope:'communications.read',description:'Read the Magnanimous communications tool catalog and readiness without exposing provider secrets.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:READ_ONLY_LOCAL},
 {name:'magnanimous_communications_execute',title:'Execute communications action',scope:'communications.write',description:'Execute an authorized Magnanimous communications action. Underlying router still enforces destructive and sensitive confirmation gates.',inputSchema:{type:'object',properties:{action:{type:'string'},tool:{type:'string'},method:{type:'string'},path:{type:'string'},query:{type:'object'},body:{type:'object'},arguments:{type:'object'},approved:{type:'boolean'},confirm_destructive:{type:'boolean'},confirm_sensitive:{type:'boolean'}},additionalProperties:true},annotations:GUARDED_OPEN_WEB}
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
 if(!env?.DB)return null;await ensureSchema(env);
 const oauth=await authorizeMagnanimousOAuthToken(request,env);if(oauth)return oauth;
 const token=connectorToken(request);if(!token||!token.startsWith('mgc_'))return null;const hash=await sha256Hex(token);
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
function visibleTools(connector){return TOOL_DEFS.filter(t=>hasScope(connector,t.scope)).map(({scope,...tool})=>({...tool,securitySchemes:[{type:'oauth2',scopes:[scope]}]}))}

const NATIVE_WEB_SKILL=`---
name: magnanimous-native-web
description: Use Magnanimous AI's native search, fetch, research, browser-run, profile, session, screenshot, webhook, and monitor capabilities when live web work is needed without relying on TinyFish.
---

# Magnanimous Native Web

Magnanimous AI is the planner, memory, policy, routing, and verification layer. Use the first-party Native Web tools instead of TinyFish for supported browser work.

## Preferred workflow
1. Use \`search\` for current public-web discovery.
2. Use \`fetch\` on result ids/URLs for rendered page content.
3. Use \`magnanimous_web_research\` for source-backed multi-page research.
4. Use \`magnanimous_web_read_flow\` for deterministic multi-step read/navigation work.
5. Use browser goals or action/session tools only when interaction is required; preserve Magnanimous confirmation gates.
6. Use \`magnanimous_web_run_get\` when a run returns before completion.
7. Use monitor tools for recurring read-only search/fetch checks.

## Credentials and safety
- Never place passwords, API keys, payment-card data, security codes, or other secret values in browser tool arguments.
- Authenticated accounts use a local persistent Chromium profile; credentials and cookies stay on the paired owner computer.
- Public HTTP(S) targets only. Private-network, localhost, link-local, reserved, file, javascript and browser-extension targets remain blocked.
- Interactive or destructive operations retain exact confirmation gates.
- Do not claim TinyFish proprietary source code, hidden prompts, model weights, managed residential proxy fleet, anti-bot infrastructure, or remote CDP infrastructure. Magnanimous implements clean-room equivalents from public/observable capability contracts.
- The native path has no TinyFish wallet/per-run payment dependency; owner compute, Internet access, and any separately chosen infrastructure still have their own real costs/limits.
`;

async function nativeWebCall(request,env,session,path,method='GET',body){
 const response=await handleMagnanimousNativeWeb(internalRequest(request,path,method,body,session),env);
 if(!response)return{status:404,error:'Magnanimous Native Web route is unavailable.'};
 const out=await responseData(response);
 return response.ok?{status:response.status,data:out.data}:{status:response.status,error:out.data?.detail||out.data?.error||out.text,data:out.data};
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function nativeWebRunAndWait(request,env,session,kind,args,maxWaitMs=12000){
 const queued=await nativeWebCall(request,env,session,'/api/magnanimous/native-web/runs','POST',{...args,kind});
 if(queued.error)return queued;
 const runId=String(queued.data?.id||queued.data?.run_id||'');
 if(!runId)return queued;
 if(queued.data?.requires_confirmation)return{status:202,data:{...queued.data,run_id:runId,status:queued.data.status||'awaiting_confirmation'}};
 const deadline=Date.now()+Math.max(500,Math.min(15000,maxWaitMs));
 let latest=queued.data;
 while(Date.now()<deadline){
  await sleep(350);
  const polled=await nativeWebCall(request,env,session,'/api/magnanimous/native-web/runs/'+encodeURIComponent(runId),'GET');
  if(polled.error)return polled;
  latest=polled.data||latest;
  const status=String(latest?.status||'');
  if(status==='completed')return{status:200,data:{run_id:runId,status,result:latest.result??{}}};
  if(status==='failed'||status==='cancelled')return{status:409,error:latest?.error||('Native web run '+status+'.'),data:{run_id:runId,status}};
 }
 return{status:202,data:{run_id:runId,status:String(latest?.status||'queued'),async:true,note:'Run is still executing. Use magnanimous_web_run_get to continue.'}};
}
function webRunResultData(run){
 const result=run?.data?.result??run?.data??{};
 return{run_id:run?.data?.run_id||run?.data?.id||'',status:run?.data?.status||'completed',result};
}
async function skillEntry(){
 return{uri:NATIVE_WEB_SKILL_URI,frontmatter:{name:'magnanimous-native-web',description:"Use Magnanimous AI's native search, fetch, research, browser-run, profile, session, screenshot, webhook, and monitor capabilities when live web work is needed without relying on TinyFish."},resources:[{uri:NATIVE_WEB_SKILL_URI,digest:'sha256:'+await sha256Hex(NATIVE_WEB_SKILL)}]};
}

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
 if(name==='get_profile'){
  const opaque='prf_'+(await sha256Hex(String(connector.tenant_id)+'|'+String(connector.user_id))).slice(0,32);
  return{status:200,data:{id:opaque,nickname:'Magnanimous owner'}};
 }
 if(name==='search'){
  const query=String(args?.query||'').trim();if(!query)return{status:400,error:'query is required.'};
  const run=await nativeWebRunAndWait(request,env,session,'search',args);if(run.error)return run;
  const result=run?.data?.result||{};const rows=Array.isArray(result.results)?result.results:[];
  return{status:run.status,data:{results:rows.map(row=>({id:String(row.url||''),title:String(row.title||''),url:String(row.url||''),text:String(row.snippet||'')})),run_id:String(run?.data?.run_id||''),status:String(run?.data?.status||'completed'),async:Boolean(run?.data?.async)}};
 }
 if(name==='fetch'){
  const target=String(args?.id||'').trim();if(!/^https?:\/\//i.test(target))return{status:400,error:'fetch id must be an absolute public http(s) URL returned by search.'};
  const run=await nativeWebRunAndWait(request,env,session,'fetch',{...args,url:target});if(run.error)return run;
  const result=run?.data?.result||{};
  if(run?.data?.async)return{status:run.status,data:{id:target,url:target,title:'',text:'',run_id:String(run.data.run_id||''),status:String(run.data.status||'queued'),async:true}};
  return{status:run.status,data:{id:String(result.url||target),url:String(result.url||target),title:String(result.title||''),text:String(result.text||''),links:Array.isArray(result.links)?result.links:[],structured:result.structured||{},run_id:String(run?.data?.run_id||''),status:String(run?.data?.status||'completed')}};
 }
 if(name==='magnanimous_web_capabilities')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/capabilities','GET');
 if(name==='magnanimous_web_parity')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/parity','GET');
 if(name==='magnanimous_web_usage')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/usage','GET');
 if(name==='magnanimous_web_research')return nativeWebRunAndWait(request,env,session,'research',args,15000);
 if(name==='magnanimous_web_fetch_batch')return nativeWebRunAndWait(request,env,session,'fetch_batch',args,15000);
 if(name==='magnanimous_web_read_flow')return nativeWebRunAndWait(request,env,session,'read_flow',args,15000);
 if(name==='magnanimous_web_action_flow')return nativeWebRunAndWait(request,env,session,'action_flow',args,1500);
 if(name==='magnanimous_web_runs'){
  const qs=new URLSearchParams();if(args?.limit)qs.set('limit',String(args.limit));if(args?.status)qs.set('status',String(args.status));
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/runs'+(qs.size?'?'+qs.toString():''),'GET');
 }
 if(name==='magnanimous_web_run_get'){
  const runId=String(args?.run_id||'').trim();if(!runId)return{status:400,error:'run_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/runs/'+encodeURIComponent(runId),'GET');
 }
 if(name==='magnanimous_web_run_confirm'||name==='magnanimous_web_run_cancel'){
  const runId=String(args?.run_id||'').trim();if(!runId)return{status:400,error:'run_id is required.'};
  const operation=name.endsWith('_confirm')?'confirm':'cancel';
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/runs/'+encodeURIComponent(runId)+'/'+operation,'POST',{confirm:operation==='confirm'});
 }
 if(name==='magnanimous_web_goal')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/goals','POST',args);
 if(name==='magnanimous_web_profiles')return nativeWebRunAndWait(request,env,session,'profiles',args,8000);
 if(name==='magnanimous_web_profile_create')return nativeWebRunAndWait(request,env,session,'profile_create',args,8000);
 if(name==='magnanimous_web_profile_setup')return nativeWebRunAndWait(request,env,session,'profile_setup',args,1500);
 if(name==='magnanimous_web_profile_delete')return nativeWebRunAndWait(request,env,session,'profile_delete',args,1500);
 if(name==='magnanimous_web_session_start')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/sessions','POST',args);
 if(name==='magnanimous_web_session_read'){
  const id=String(args?.session_id||'').trim();if(!id)return{status:400,error:'session_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/sessions/'+encodeURIComponent(id)+'/read','POST',args);
 }
 if(name==='magnanimous_web_session_action'){
  const id=String(args?.session_id||'').trim();if(!id)return{status:400,error:'session_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/sessions/'+encodeURIComponent(id)+'/actions','POST',args);
 }
 if(name==='magnanimous_web_session_end'){
  const id=String(args?.session_id||'').trim();if(!id)return{status:400,error:'session_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/sessions/'+encodeURIComponent(id),'DELETE');
 }
 if(name==='magnanimous_web_monitors')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors','GET');
 if(name==='magnanimous_web_monitor_get'){
  const id=String(args?.monitor_id||'').trim();if(!id)return{status:400,error:'monitor_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors/'+encodeURIComponent(id),'GET');
 }
 if(name==='magnanimous_web_monitor_create')return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors','POST',args);
 if(name==='magnanimous_web_monitor_update'){
  const id=String(args?.monitor_id||'').trim();if(!id)return{status:400,error:'monitor_id is required.'};
  const body={...args};delete body.monitor_id;return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors/'+encodeURIComponent(id),'PATCH',body);
 }
 if(name==='magnanimous_web_monitor_run'){
  const id=String(args?.monitor_id||'').trim();if(!id)return{status:400,error:'monitor_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors/'+encodeURIComponent(id)+'/runs','POST',{});
 }
 if(name==='magnanimous_web_monitor_delete'){
  const id=String(args?.monitor_id||'').trim();if(!id)return{status:400,error:'monitor_id is required.'};
  return nativeWebCall(request,env,session,'/api/magnanimous/native-web/monitors/'+encodeURIComponent(id),'DELETE');
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
function modernDiscover(){return{protocolVersion:MODERN_PROTOCOL,serverInfo:{name:'Magnanimous AI',version:'1.1.0'},capabilities:{tools:{listChanged:false},resources:{},prompts:{},extensions:{[SKILLS_EXTENSION]:{}}},instructions:'Magnanimous AI is the command, memory, routing and verification layer. Native web tools use first-party Magnanimous browser execution and do not require TinyFish.'}}
async function handleMcp(request,env){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type,mcp-protocol-version,mcp-method,mcp-name,x-magnanimous-connector-key','access-control-allow-methods':'POST,OPTIONS'}});
 if(request.method!=='POST')return json({detail:'Magnanimous MCP uses POST Streamable HTTP.'},405);
 const connector=await authorizeConnector(request,env);if(!connector)return json({jsonrpc:'2.0',id:null,error:{code:-32001,message:'Magnanimous OAuth authorization is required.'}},401,{'content-type':'application/json','www-authenticate':magnanimousOAuthChallenge(request,'web.read')});
 const body=await request.json().catch(()=>null);if(!body||body.jsonrpc!=='2.0'||!body.method)return rpcError(body?.id,-32600,'Invalid JSON-RPC request.',400);
 const method=String(body.method),id=body.id??null,headerMethod=request.headers.get('mcp-method');if(headerMethod&&headerMethod!==method)return rpcError(id,-32020,'Mcp-Method header does not match the JSON-RPC method.',400);
 if(method==='server/discover')return rpcResult(id,modernDiscover());
 if(method==='initialize')return rpcResult(id,{protocolVersion:LEGACY_PROTOCOL,serverInfo:{name:'Magnanimous AI',version:'1.1.0'},capabilities:{tools:{listChanged:false},resources:{},extensions:{[SKILLS_EXTENSION]:{}}},instructions:'Magnanimous AI universal connector with native web/browser tools and Skills support.'});
 if(method==='notifications/initialized')return new Response(null,{status:202});
 if(method==='ping')return rpcResult(id,{});
 if(method==='skills/list'){
  if(!hasScope(connector,'web.read'))return rpcResult(id,{skills:[]});
  return rpcResult(id,{skills:[await skillEntry()]});
 }
 if(method==='skills/get'){
  if(!hasScope(connector,'web.read'))return rpcError(id,-32003,'web.read scope is required.',403);
  const wanted=String(body.params?.uri||body.params?.name||'');
  if(wanted&&wanted!==NATIVE_WEB_SKILL_URI&&wanted!=='magnanimous-native-web')return rpcError(id,-32004,'Skill not found.',404);
  return rpcResult(id,{skill:await skillEntry()});
 }
 if(method==='resources/list'){
  if(!hasScope(connector,'web.read'))return rpcResult(id,{resources:[]});
  return rpcResult(id,{resources:[{uri:NATIVE_WEB_SKILL_URI,name:'Magnanimous Native Web skill',description:"Instructions for using Magnanimous AI's TinyFish-independent native browser tools.",mimeType:'text/markdown'}]});
 }
 if(method==='resources/read'){
  if(!hasScope(connector,'web.read'))return rpcError(id,-32003,'web.read scope is required.',403);
  const uri=String(body.params?.uri||'');if(uri!==NATIVE_WEB_SKILL_URI)return rpcError(id,-32004,'Resource not found.',404);
  return rpcResult(id,{contents:[{uri:NATIVE_WEB_SKILL_URI,mimeType:'text/markdown',text:NATIVE_WEB_SKILL}]});
 }
 if(method==='tools/list')return rpcResult(id,{tools:visibleTools(connector),ttlMs:300000,cacheScope:'private'});
 if(method==='tools/call'){
  const name=String(body.params?.name||'');const headerName=request.headers.get('mcp-name');if(headerName&&headerName!==name)return rpcError(id,-32020,'Mcp-Name header does not match params.name.',400);
  const result=await executeTool(request,env,connector,name,body.params?.arguments||{});await audit(env,connector,name,!result.error,result.status);return rpcResult(id,toolPayload(result));
 }
 return rpcError(id,-32601,'Method not found.');
}

function manifest(request){const origin=new URL(request.url).origin;return{name:'Magnanimous AI',publisher:'I AM MAGNANIMOUS WAY™',identity:'Magnanimous AI',mcp:{url:`${origin}/mcp`,protocols:[MODERN_PROTOCOL,LEGACY_PROTOCOL],transport:'streamable-http',authentication:'OAuth 2.1 authorization-code + PKCE for ChatGPT; legacy scoped bearer connector tokens for other clients',skills_extension:SKILLS_EXTENSION},openapi:`${origin}/api/magnanimous/ai-connectors/openapi.json`,management:`${origin}/api/magnanimous/ai-connectors`,native_web:{tinyfish_required:false,third_party_wallet_required:false,standard_tools:['search','fetch'],skill:NATIVE_WEB_SKILL_URI},platforms:MAGNANIMOUS_AI_PLATFORMS,principle:'External AI platforms are clients or execution environments. Magnanimous remains the command, memory, routing and verification layer.'}}
function openApi(request){const origin=new URL(request.url).origin;return{openapi:'3.1.0',info:{title:'Magnanimous AI Universal Connector',version:'1.0.0',description:'Provider-neutral connector for Magnanimous AI. Use a scoped connector token.'},servers:[{url:origin}],components:{securitySchemes:{ConnectorBearer:{type:'http',scheme:'bearer'}}},security:[{ConnectorBearer:[]}],paths:{'/api/magnanimous/ai-connectors/invoke':{post:{summary:'Invoke one authorized Magnanimous connector tool',requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{tool:{type:'string'},arguments:{type:'object'}},required:['tool']}}}},responses:{'200':{description:'Tool result'},'401':{description:'Invalid connector token'},'403':{description:'Insufficient scope'}}}}}}}

export async function handleMagnanimousUniversalAIConnector(request,env){
 const oauth=await handleMagnanimousPluginOAuth(request,env);if(oauth)return oauth;
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
