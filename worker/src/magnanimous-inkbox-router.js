import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const MCP_URL='https://inkbox.ai/mcp';
const MCP_CURRENT='2026-07-28';
const MCP_LEGACY='2025-06-18';
const clip=(value,max=4000)=>String(value??'').trim().slice(0,max);

// Stable Magnanimous aliases for the complete Inkbox MCP surface currently exposed
// to this project. Runtime discovery is authoritative, so newly added Inkbox tools
// can be used without changing this file once they appear in tools/list.
const BASELINE=[
 ['identity.get','inkbox_identity_get','identity',false],
 ['channels.status','inkbox_channel_status_get','identity',false],
 ['identity.switch','inkbox_identity_switch_render','identity',false],
 ['email.list','inkbox_emails_list','email',false],
 ['email.get','inkbox_email_get','email',false],
 ['email.attachment.get','inkbox_email_attachment_get','email',false],
 ['conversation.list','inkbox_conversations_list','conversations',false],
 ['conversation.get','inkbox_conversation_get','conversations',false],
 ['contacts.list','inkbox_contacts_list','contacts',false],
 ['contact.get','inkbox_contact_get','contacts',false],
 ['contacts.render','inkbox_contacts_render','contacts',false],
 ['contact.memories.list','inkbox_contact_memories_list','memory',false],
 ['contact.correspondence.list','inkbox_contact_correspondence_list','conversations',false],
 ['notes.list','inkbox_notes_list','notes',false],
 ['note.get','inkbox_note_get','notes',false],
 ['sms.consent.preflight','inkbox_sms_consent_get','sms',false],
 ['sms.onboarding','inkbox_sms_onboarding_get','sms',false],
 ['imessage.onboarding','inkbox_imessage_onboarding_get','imessage',false],
 ['calls.list','inkbox_calls_list','voice',false],
 ['call.get','inkbox_call_get','voice',false],
 ['call.settings.get','inkbox_call_settings_get','voice',false],
 ['identity.update','inkbox_identity_update','identity',true],
 ['contact.create','inkbox_contact_create','contacts',true],
 ['contact.update','inkbox_contact_update','contacts',true],
 ['contact.delete','inkbox_contact_delete','contacts',true,'destructive'],
 ['note.create','inkbox_note_create','notes',true],
 ['note.update','inkbox_note_update','notes',true],
 ['note.delete','inkbox_note_delete','notes',true,'destructive'],
 ['email.flags.update','inkbox_email_flags_update','email',true],
 ['email.thread.move','inkbox_thread_folder_update','email',true],
 ['email.delete','inkbox_email_delete','email',true,'destructive'],
 ['email.attachment.stage','inkbox_email_attachment_upload','email',true],
 ['conversation.mark-read','inkbox_conversation_mark_read','conversations',true],
 ['media.stage','inkbox_media_stage','media',true],
 ['call.settings.update','inkbox_call_settings_update','voice',true,'sensitive'],
 ['hosted-agent.config.get','inkbox_hosted_agent_config_get','voice',false],
 ['email.send','inkbox_email_send','email',true],
 ['email.reply','inkbox_email_reply','email',true],
 ['email.forward','inkbox_email_forward','email',true],
 ['sms.send','inkbox_text_send','sms',true],
 ['imessage.send','inkbox_imessage_send','imessage',true],
 ['imessage.react','inkbox_imessage_react','imessage',true],
 ['imessage.unreact','inkbox_imessage_unreact','imessage',true],
 ['call.place','inkbox_call_place','voice',true],
 ['call.hangup','inkbox_call_hangup','voice',true,'sensitive'],
 ['a2a.agents.list','inkbox_a2a_agents_list','a2a',false],
 ['a2a.agents.render','inkbox_a2a_agents_render','a2a',false],
 ['a2a.invitations.render','inkbox_a2a_invitations_render','a2a',false],
 ['a2a.tasks.list','inkbox_a2a_tasks_list','a2a',false],
 ['a2a.task.get','inkbox_a2a_task_get','a2a',false],
 ['a2a.task.send','inkbox_a2a_task_send','a2a',true],
 ['a2a.task.reply','inkbox_a2a_task_reply','a2a',true],
 ['contact-rules.render','inkbox_contact_rules_render','policy',false],
 ['contact-rules.list','inkbox_contact_rules_list','policy',false],
 ['phone.contact-rule.preflight','inkbox_phone_contact_rule_preflight','policy',false]
].map(([alias,tool,category,mutating,risk='normal'])=>({alias,tool,category,mutating:!!mutating,risk}));

const BY_ALIAS=new Map(BASELINE.map(x=>[x.alias,x]));
const BY_TOOL=new Map(BASELINE.map(x=>[x.tool,x]));
const DESTRUCTIVE=new Set(BASELINE.filter(x=>x.risk==='destructive').map(x=>x.tool));
const SENSITIVE=new Set(BASELINE.filter(x=>x.risk==='sensitive').map(x=>x.tool));

function isManager(user){return ['owner','admin'].includes(String(user?.role||'').toLowerCase())}
function categoryForTool(name){
 const n=String(name||'').toLowerCase();
 if(n.includes('email')||n.includes('mail'))return'email';
 if(n.includes('imessage'))return'imessage';
 if(n.includes('sms')||n.includes('text'))return'sms';
 if(n.includes('call')||n.includes('phone')||n.includes('hosted_agent'))return'voice';
 if(n.includes('contact'))return'contacts';
 if(n.includes('note'))return'notes';
 if(n.includes('a2a'))return'a2a';
 if(n.includes('media')||n.includes('attachment'))return'media';
 if(n.includes('conversation'))return'conversations';
 return'communications';
}

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_inkbox_tools(
  tenant_id TEXT NOT NULL, tool_name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  input_schema_json TEXT NOT NULL DEFAULT '{}', category TEXT NOT NULL DEFAULT 'communications',
  enabled INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,tool_name)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_inkbox_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL, action_alias TEXT NOT NULL DEFAULT '', success INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
 )`).run();
}
async function audit(env,user,tool,alias,success,detail=''){
 if(!env?.DB||!user)return;
 try{await ensureSchema(env);await env.DB.prepare('INSERT INTO magnanimous_inkbox_audit(tenant_id,user_id,tool_name,action_alias,success,detail,created_at) VALUES(?,?,?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),clip(tool,200),clip(alias,200),success?1:0,clip(detail,1200),now()).run()}catch{}
}

function parseMcpPayload(text){
 const lines=String(text||'').split('\n').map(x=>x.trim()).filter(Boolean);let payload=null;
 for(const line of lines){
  const candidate=line.startsWith('data:')?line.slice(5).trim():line;
  if(!candidate||candidate==='[DONE]')continue;
  try{const parsed=JSON.parse(candidate);if(parsed?.result||parsed?.error)payload=parsed}catch{}
 }
 if(!payload){try{payload=JSON.parse(text)}catch{}}
 return payload;
}
async function postMcp(env,body,headersExtra={}){
 const apiKey=clip(env?.INKBOX_API_KEY,12000);
 if(!apiKey)throw new Error('Inkbox is not connected to Magnanimous yet. Add INKBOX_API_KEY in Owner Integrations → Magnanimous Communications via Inkbox.');
 const headers={
  'content-type':'application/json',
  'accept':'application/json, text/event-stream',
  'x-api-key':apiKey,
  ...headersExtra
 };
 const response=await fetch(MCP_URL,{method:'POST',headers,body:JSON.stringify(body),redirect:'error'});
 const text=await response.text();
 if(!response.ok)throw new Error(`Inkbox communications adapter returned ${response.status}: ${clip(text,600)}`);
 const payload=parseMcpPayload(text);
 if(!payload)throw new Error('Inkbox communications adapter returned an unreadable MCP response.');
 if(payload.error)throw new Error(payload.error.message||'Inkbox MCP request failed.');
 return payload.result;
}
function meta(){return{'io.modelcontextprotocol/clientInfo':{name:'Magnanimous AI',version:'1.0'},'io.modelcontextprotocol/clientCapabilities':{}}}
async function rpc(env,method,params={},protocol=MCP_CURRENT){
 const name=method==='tools/call'?clip(params?.name,200):'';
 const headers={'MCP-Protocol-Version':protocol,'Mcp-Method':method};if(name)headers['Mcp-Name']=name;
 return postMcp(env,{jsonrpc:'2.0',id:crypto.randomUUID(),method,params:protocol===MCP_CURRENT?{...params,_meta:meta()}:params},headers);
}
async function discover(env){
 try{
  await rpc(env,'server/discover',{},MCP_CURRENT).catch(()=>null);
  return{protocol:MCP_CURRENT,result:await rpc(env,'tools/list',{},MCP_CURRENT)};
 }catch(modernError){
  try{
   await rpc(env,'initialize',{protocolVersion:MCP_LEGACY,capabilities:{},clientInfo:{name:'Magnanimous AI',version:'1.0'}},MCP_LEGACY);
   return{protocol:MCP_LEGACY,result:await rpc(env,'tools/list',{},MCP_LEGACY)};
  }catch{throw modernError}
 }
}
async function callTool(env,name,args){
 try{return await rpc(env,'tools/call',{name,arguments:args||{}},MCP_CURRENT)}catch(modernError){
  try{await rpc(env,'initialize',{protocolVersion:MCP_LEGACY,capabilities:{},clientInfo:{name:'Magnanimous AI',version:'1.0'}},MCP_LEGACY);return await rpc(env,'tools/call',{name,arguments:args||{}},MCP_LEGACY)}catch{throw modernError}
 }
}
async function cacheTools(env,user,tools){
 if(!env?.DB||!user)return;
 await ensureSchema(env);const ts=now();
 for(const tool of tools.slice(0,1000)){
  const name=clip(tool?.name,200);if(!name)continue;
  await env.DB.prepare(`INSERT INTO magnanimous_inkbox_tools(tenant_id,tool_name,description,input_schema_json,category,enabled,updated_at)
   VALUES(?,?,?,?,?,1,?) ON CONFLICT(tenant_id,tool_name) DO UPDATE SET
   description=excluded.description,input_schema_json=excluded.input_schema_json,category=excluded.category,enabled=1,updated_at=excluded.updated_at`)
   .bind(String(user.tenant_id),name,clip(tool?.description,5000),JSON.stringify(tool?.inputSchema||{}).slice(0,40000),categoryForTool(name),ts).run();
 }
}
async function cachedTools(env,user){
 if(!env?.DB||!user)return[];await ensureSchema(env);
 const{results=[]}=await env.DB.prepare('SELECT tool_name,description,input_schema_json,category,enabled,updated_at FROM magnanimous_inkbox_tools WHERE tenant_id=? AND enabled=1 ORDER BY category,tool_name').bind(String(user.tenant_id)).all();
 return results.map(x=>({...x,input_schema:(()=>{try{return JSON.parse(x.input_schema_json||'{}')}catch{return{}}})()}));
}
function baselineView(){return BASELINE.map(x=>({alias:x.alias,tool:x.tool,category:x.category,mutating:x.mutating,risk:x.risk}))}

export async function handleMagnanimousInkboxRouter(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/inkbox'))return null;
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 await ensureSchema(env);

 if(request.method==='GET'&&path==='/api/magnanimous/inkbox/capabilities'){
  const discovered=await cachedTools(env,user);
  return json({
   identity:'Magnanimous AI',
   role:'communications-command-router',
   provider_details_private:true,
   adapter_configured:Boolean(clip(env?.INKBOX_API_KEY,12000)),
   remote_mcp:MCP_URL,
   dynamic_discovery:true,
   future_capabilities:true,
   baseline_count:BASELINE.length,
   discovered_count:discovered.length,
   aliases:baselineView(),
   discovered:discovered.map(x=>({tool:x.tool_name,description:x.description,category:x.category,input_schema:x.input_schema,updated_at:x.updated_at})),
   rule:'Magnanimous owns planning, identity, memory, permission checks and verification. Inkbox is a replaceable communications execution adapter.'
  });
 }

 if(request.method==='GET'&&path==='/api/magnanimous/inkbox/status'){
  const tools=await cachedTools(env,user);
  return json({
   ok:true,
   magnanimous:true,
   adapter_configured:Boolean(clip(env?.INKBOX_API_KEY,12000)),
   identity_configured:Boolean(clip(env?.INKBOX_AGENT_IDENTITY_ID,200)),
   phone_configured:Boolean(clip(env?.INKBOX_PHONE_NUMBER,64)),
   cached_tools:tools.length,
   baseline_tools:BASELINE.length,
   mcp_url:MCP_URL,
   public_identity:'Magnanimous',
   provider_details_private:true
  });
 }

 if(request.method==='POST'&&path==='/api/magnanimous/inkbox/sync'){
  if(!isManager(user))return json({detail:'Owner or admin role required to synchronize communications tools.'},403);
  try{
   const {protocol,result}=await discover(env),tools=Array.isArray(result?.tools)?result.tools:[];
   await cacheTools(env,user,tools);await audit(env,user,'tools/list','sync',true,`${tools.length} tools via MCP ${protocol}`);
   return json({ok:true,synced:tools.length,protocol,current_baseline:BASELINE.length,new_or_future_tools:tools.filter(x=>!BY_TOOL.has(String(x?.name||''))).map(x=>x.name),provider_details_private:true});
  }catch(error){const detail=clip(error?.message||error,1200);await audit(env,user,'tools/list','sync',false,detail);return json({detail,code:'INKBOX_SYNC_FAILED'},502)}
 }

 if(request.method==='POST'&&(path==='/api/magnanimous/inkbox/execute'||path==='/api/magnanimous/inkbox/route')){
  if(!isManager(user))return json({detail:'Owner or admin role required to execute the Magnanimous communications identity.'},403);
  const body=await request.json().catch(()=>({}));
  const requested=clip(body.action||body.tool,200);
  if(!requested)return json({detail:'action or tool is required.'},400);
  const known=BY_ALIAS.get(requested)||BY_TOOL.get(requested)||null;
  const tool=known?.tool||requested;
  if(DESTRUCTIVE.has(tool)&&body.confirm_destructive!==true)return json({detail:'This operation deletes communication data. Set confirm_destructive=true after confirming the exact target.',code:'CONFIRM_DESTRUCTIVE_REQUIRED'},409);
  if(SENSITIVE.has(tool)&&body.confirm_sensitive!==true)return json({detail:'This operation changes or interrupts live communication behavior. Set confirm_sensitive=true after confirming the exact target.',code:'CONFIRM_SENSITIVE_REQUIRED'},409);
  try{
   let tools=await cachedTools(env,user);
   let available=tools.some(x=>x.tool_name===tool);
   if(!available){const found=await discover(env);const live=Array.isArray(found.result?.tools)?found.result.tools:[];await cacheTools(env,user,live);tools=await cachedTools(env,user);available=tools.some(x=>x.tool_name===tool)}
   if(!available)return json({detail:'That Inkbox capability is not currently exposed to this identity.',tool,code:'INKBOX_TOOL_UNAVAILABLE'},404);
   const result=await callTool(env,tool,body.arguments||{});await audit(env,user,tool,known?.alias||'',true);
   return json({ok:true,magnanimous:true,action:known?.alias||requested,tool,result,provider_role:'replaceable-communications-adapter',provider_details_private:true});
  }catch(error){const detail=clip(error?.message||error,1200);await audit(env,user,tool,known?.alias||'',false,detail);return json({detail,tool,code:'INKBOX_TOOL_CALL_FAILED'},502)}
 }

 if(request.method==='GET'&&path==='/api/magnanimous/inkbox/audit'){
  if(!isManager(user))return json({detail:'Owner or admin role required.'},403);
  const{results=[]}=await env.DB.prepare('SELECT id,user_id,tool_name,action_alias,success,detail,created_at FROM magnanimous_inkbox_audit WHERE tenant_id=? ORDER BY id DESC LIMIT 250').bind(String(user.tenant_id)).all();
  return json({ok:true,audit:results});
 }

 return json({detail:'Unsupported Magnanimous communications-router operation.'},405);
}
