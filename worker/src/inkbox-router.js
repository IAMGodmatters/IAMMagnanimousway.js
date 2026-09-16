import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const METHODS=new Set(['GET','POST','PUT','PATCH','DELETE']);
const ALLOWED_ROOTS=['/mail','/contacts','/notes','/phone','/numbers','/calls','/imessage','/identities','/webhooks','/vault','/tunnels','/agent-signup'];
const WRITE_METHODS=new Set(['POST','PUT','PATCH','DELETE']);
const CONSEQUENTUAL_PATHS=[
 /\/messages(?:\/|$)/,
 /\/texts(?:\/|$)/,
 /\/calls(?:\/|$)/,
 /\/imessage(?:\/|$)/,
 /\/tasks(?:\/|$)/,
 /\/send(?:\/|$)/,
 /\/hangup(?:\/|$)/,
 /\/contact-rules(?:\/|$)/,
 /\/vault(?:\/|$)/,
 /\/keys(?:\/|$)/,
 /\/access(?:\/|$)/,
 /\/identities(?:\/|$)/,
 /\/webhooks(?:\/|$)/
];

// This catalog is deliberately provider-neutral in the UI. Magnanimous owns the
// public identity; the connected service is a replaceable communications arm.
export const MAGNANIMOUS_COMMUNICATION_TOOLS=[
 // Identity / readiness
 ['identity.get','identity','Read the connected communication identity and channel assignments.','read'],
 ['identity.update','identity','Update safe identity profile fields.','write'],
 ['channel.status','identity','Check email, phone, SMS and iMessage readiness.','read'],
 ['identity.select','identity','Select the configured identity for Magnanimous routing.','write'],
 // Email / mail
 ['email.list','email','List mailbox messages with cursor pagination.','read'],
 ['email.get','email','Read one message including bounded body content.','read'],
 ['email.search','email','Search mailbox messages by natural-language query.','read'],
 ['email.send','email','Send a new email.','consequential'],
 ['email.reply','email','Reply or reply-all to a message.','consequential'],
 ['email.forward','email','Forward a message with optional original attachments.','consequential'],
 ['email.flags.update','email','Change read or starred state.','write'],
 ['email.delete','email','Delete a message or thread.','destructive'],
 ['email.attachment.get','email','Download a server-issued message attachment.','read'],
 ['thread.list','email','List email threads.','read'],
 ['thread.get','email','Read an email thread.','read'],
 ['thread.folder.update','email','Move a thread among inbox, archive and spam.','write'],
 ['draft.create','email','Create a mail draft with optional recipients, body and attachments.','write'],
 ['draft.list','email','List drafts.','read'],
 ['draft.get','email','Read a draft revision.','read'],
 ['draft.update','email','Update a draft using generation concurrency.','write'],
 ['draft.duplicate','email','Duplicate a draft into a new revision.','write'],
 ['draft.delete','email','Delete a draft revision.','destructive'],
 ['draft.attachment.add','email','Add attachments to a draft.','write'],
 ['draft.attachment.remove','email','Remove a draft attachment.','destructive'],
 ['draft.attachment.get','email','Download a draft attachment.','read'],
 ['draft.send','email','Send an exact draft revision.','consequential'],
 // Contacts / memory
 ['contact.list','contacts','List or search contacts and reverse-look-up identifiers.','read'],
 ['contact.get','contacts','Read one contact.','read'],
 ['contact.create','contacts','Create a contact.','write'],
 ['contact.update','contacts','Update contact profile fields.','write'],
 ['contact.delete','contacts','Delete a contact.','destructive'],
 ['contact.memories.list','contacts','Read contact memories, including one memory by id.','read'],
 ['contact.correspondence.list','contacts','Read bounded cross-channel history for a contact.','read'],
 ['contact.permissions','contacts','Read and manage email/phone communication permission rules.','consequential'],
 // Notes
 ['note.list','notes','List or search organization notes visible to the identity.','read'],
 ['note.get','notes','Read one note.','read'],
 ['note.create','notes','Create a persistent note.','write'],
 ['note.update','notes','Update a persistent note.','write'],
 ['note.delete','notes','Delete a persistent note.','destructive'],
 // SMS / MMS
 ['sms.conversation.list','sms','List SMS/MMS conversations.','read'],
 ['sms.conversation.get','sms','Read an SMS/MMS conversation.','read'],
 ['sms.conversation.mark_read','sms','Mark a text conversation read locally.','write'],
 ['sms.consent.preflight','sms','Check recipient consent/contact rules before texting.','read'],
 ['sms.onboarding','sms','Get START opt-in information for the active number.','read'],
 ['sms.send','sms','Send SMS or group MMS, including staged media.','consequential'],
 ['media.stage','messaging','Stage bounded immutable media for SMS or iMessage.','write'],
 // iMessage
 ['imessage.onboarding','imessage','Get shared-router connection instructions and readiness.','read'],
 ['imessage.conversation.list','imessage','List iMessage conversations.','read'],
 ['imessage.conversation.get','imessage','Read an iMessage conversation.','read'],
 ['imessage.send','imessage','Send 1:1 or supported group iMessage.','consequential'],
 ['imessage.react','imessage','Send a tapback reaction.','consequential'],
 ['imessage.unreact','imessage','Undo a tapback sent by the identity.','consequential'],
 ['imessage.typing','imessage','Use supported typing-indicator behavior.','consequential'],
 ['imessage.read_receipt','imessage','Use supported read-receipt behavior.','consequential'],
 // Calls / Voice AI
 ['call.list','voice','List inbound and outbound calls.','read'],
 ['call.get','voice','Read call status, outcome, action items and optional transcript.','read'],
 ['call.place','voice','Place a hosted outbound call with a natural-language task brief.','consequential'],
 ['call.hangup','voice','Hang up a live call.','consequential'],
 ['call.transcripts.list','voice','Read ordered transcript segments for a call.','read'],
 ['call.transcripts.search','voice','Search transcripts for a phone number.','read'],
 ['call.tool_activity','voice','Read Voice AI tool invocation state.','read'],
 ['call.incoming_action.get','voice','Read inbound call handling mode.','read'],
 ['call.incoming_action.set','voice','Configure hosted-agent, WebSocket, webhook, reject or forwarding behavior.','consequential'],
 ['call.hosted_agent.get','voice','Read hosted Voice AI configuration.','read'],
 ['call.hosted_agent.set','voice','Configure voice and standing instructions.','consequential'],
 ['call.hosted_agent.authority','voice','Configure or override contact-scoped versus broad authority.','consequential'],
 ['call.hosted_agent.voices','voice','List currently selectable hosted-agent voices.','read'],
 ['call.voicemail_policy','voice','Control voicemail-detection behavior on outbound calls.','consequential'],
 ['call.media_stream','voice','Use bidirectional WebSocket audio so Magnanimous can be the live call brain.','consequential'],
 // Phone / mail rules
 ['phone.rules.list','rules','List phone rules shared by SMS, calls and iMessage.','read'],
 ['phone.rules.create','rules','Create an explicit allow/block phone rule.','consequential'],
 ['phone.rules.update','rules','Update an explicit phone rule.','consequential'],
 ['phone.rules.delete','rules','Delete an explicit phone rule.','destructive'],
 ['phone.rules.preflight','rules','Predict whether a phone recipient is allowed.','read'],
 ['mail.rules.list','rules','List email allow/block rules.','read'],
 ['mail.rules.create','rules','Create an email allow/block rule.','consequential'],
 ['mail.rules.update','rules','Update an email allow/block rule.','consequential'],
 ['mail.rules.delete','rules','Delete an email allow/block rule.','destructive'],
 // Agent-to-Agent
 ['a2a.directory.organization','a2a','Search organization-visible A2A agents.','read'],
 ['a2a.directory.public','a2a','Search the public A2A directory.','read'],
 ['a2a.settings.get','a2a','Read A2A reachability/discovery settings.','read'],
 ['a2a.settings.update','a2a','Update permitted A2A settings and advertised skills.','consequential'],
 ['a2a.rules.list','a2a','List A2A directional contact rules.','read'],
 ['a2a.rules.create','a2a','Create an A2A allow/block rule.','consequential'],
 ['a2a.rules.update','a2a','Update an A2A contact rule.','consequential'],
 ['a2a.rules.delete','a2a','Delete an A2A contact rule.','destructive'],
 ['a2a.tasks.list','a2a','List A2A task threads.','read'],
 ['a2a.task.get','a2a','Read bounded A2A task history.','read'],
 ['a2a.task.send','a2a','Start or continue an A2A task.','consequential'],
 ['a2a.task.reply','a2a','Report progress, request input, complete, fail or cancel an A2A task.','consequential'],
 ['a2a.invitations','a2a','Manage supported A2A connection invitations.','consequential'],
 ['a2a.agent_card','a2a','Serve and inspect the identity Agent Card.','read'],
 // Webhooks / tunnel
 ['webhooks.manage','events','Create, list, update or remove subscriptions for mail, phone, iMessage and A2A events.','consequential'],
 ['webhooks.lifecycle','events','Consume supported communication lifecycle events including call-ended packages.','read'],
 ['tunnel.info','tunnel','Inspect the identity-owned public tunnel.','read'],
 ['tunnel.update','tunnel','Update supported tunnel metadata/configuration.','consequential'],
 ['tunnel.connect','tunnel','Use the SDK runtime to bring the persistent HTTP/WebSocket/TCP tunnel online.','consequential'],
 // Zero-knowledge vault. Plaintext encryption/decryption remains client-side.
 ['vault.info','vault','Read vault metadata.','read'],
 ['vault.unlock_bundle','vault','Fetch encrypted vault material for client-side decryption.','sensitive-read'],
 ['vault.secrets.list','vault','List encrypted-secret metadata.','sensitive-read'],
 ['vault.secret.get','vault','Read one encrypted secret payload.','sensitive-read'],
 ['vault.secret.create','vault','Store a client-encrypted secret.','consequential'],
 ['vault.secret.update','vault','Update encrypted secret metadata/payload.','consequential'],
 ['vault.secret.delete','vault','Delete a vault secret.','destructive'],
 ['vault.access.list','vault','List identity access grants for a secret.','sensitive-read'],
 ['vault.access.grant','vault','Grant an identity access to a secret.','consequential'],
 ['vault.access.revoke','vault','Revoke an identity secret grant.','destructive'],
 ['vault.keys.list','vault','List vault-key metadata.','sensitive-read'],
 ['vault.keys.replace_primary','vault','Replace the primary wrapped vault key.','destructive'],
 ['vault.keys.revoke','vault','Revoke a vault key.','destructive'],
 // Universal escape hatch: every current/future documented REST route under approved Inkbox roots.
 ['rest.request','universal','Call any documented allowed REST path through the server-side Magnanimous router.','variable']
].map(([id,family,description,risk])=>({id,family,description,risk,public_name:`Magnanimous ${family}`,provider_role:'replaceable-execution-adapter'}));

function normalizeBase(value){
 const raw=String(value||'https://inkbox.ai/api/v1').trim();
 try{const u=new URL(raw);if(u.protocol!=='https:')return'https://inkbox.ai/api/v1';return`${u.origin}${u.pathname.replace(/\/$/,'')}`}catch{return'https://inkbox.ai/api/v1'}
}
function normalizePath(value){
 let p=String(value||'').trim();
 if(!p)return'';
 if(/^https?:\/\//i.test(p))throw new Error('Absolute URLs are not allowed.');
 if(p.startsWith('/api/v1/'))p=p.slice('/api/v1'.length);
 else if(p==='/api/v1')p='/';
 if(!p.startsWith('/'))p=`/${p}`;
 if(p.includes('..')||p.includes('\\')||/[\u0000-\u001f]/.test(p))throw new Error('Unsafe API path.');
 const root=ALLOWED_ROOTS.find(x=>p===x||p.startsWith(`${x}/`));
 if(!root)throw new Error('That API family is not enabled in the Magnanimous communications router.');
 return p;
}
function queryString(query){
 const q=new URLSearchParams();
 if(query&&typeof query==='object')for(const[k,v]of Object.entries(query)){
  if(v===undefined||v===null||v==='')continue;
  if(Array.isArray(v))for(const item of v)q.append(k,String(item));else q.set(k,String(v));
 }
 const text=q.toString();return text?`?${text}`:'';
}
function actionRisk(method,path){
 if(method==='GET')return path.startsWith('/vault')?'sensitive-read':'read';
 if(method==='DELETE')return'destructive';
 if(CONSEQUENTUAL_PATHS.some(x=>x.test(path)))return'consequential';
 return WRITE_METHODS.has(method)?'write':'read';
}
function requiresExplicitApproval(risk){return['consequential','destructive'].includes(risk)}
async function ensureAudit(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_communications_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'rest.request',
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  risk TEXT NOT NULL DEFAULT 'read',
  response_status INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
 )`).run();
}
async function audit(env,user,{action='rest.request',method,path,risk,status=0,success=false}){
 try{await ensureAudit(env);if(!env?.DB)return;await env.DB.prepare('INSERT INTO magnanimous_communications_audit(tenant_id,user_id,action,method,path,risk,response_status,success,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(user.tenant_id,user.id,String(action).slice(0,120),method,String(path).slice(0,700),risk,Number(status||0),success?1:0,now()).run()}catch(error){console.error('communications audit failed',error)}
}
function safeResponseHeaders(source){
 const h=new Headers();
 for(const name of ['content-type','content-disposition','retry-after','etag','last-modified']){const v=source.get(name);if(v)h.set(name,v)}
 h.set('cache-control','no-store');
 h.set('x-magnanimous-execution','communications-router');
 return h;
}
async function inkboxRequest(env,{method,path,query,body,idempotencyKey}){
 const runtime=await getProviderRuntimeEnv(env),key=String(runtime?.INKBOX_API_KEY||'').trim();
 if(!key)return{error:json({detail:'Magnanimous Communications is ready, but the server-side communication API credential is not configured.',code:'COMMUNICATION_PROVIDER_NOT_CONFIGURED'},503)};
 const base=normalizeBase(runtime.INKBOX_BASE_URL),target=`${base}${path}${queryString(query)}`;
 const headers=new Headers({'X-API-Key':key,'Accept':'application/json'});
 if(idempotencyKey)headers.set('Idempotency-Key',String(idempotencyKey).slice(0,200));
 const init={method,headers};
 if(!['GET','HEAD'].includes(method)&&body!==undefined){headers.set('Content-Type','application/json');init.body=JSON.stringify(body)}
 let response;
 try{response=await fetch(target,init)}catch(error){return{error:json({detail:'Magnanimous Communications could not reach its execution transport.',code:'COMMUNICATION_TRANSPORT_UNREACHABLE'},502)}}
 return{response};
}
function configuredSnapshot(runtime){
 return{
  configured:Boolean(String(runtime?.INKBOX_API_KEY||'').trim()),
  identity_id:String(runtime?.INKBOX_AGENT_IDENTITY_ID||''),
  handle:String(runtime?.INKBOX_AGENT_HANDLE||''),
  mailbox:String(runtime?.INKBOX_EMAIL_ADDRESS||''),
  phone_number:String(runtime?.INKBOX_PHONE_NUMBER||''),
  webhook_secret_configured:Boolean(String(runtime?.INKBOX_WEBHOOK_SECRET||'').trim()),
  base_url:normalizeBase(runtime?.INKBOX_BASE_URL),
  public_identity:'Magnanimous AI',
  provider_details_private:true
 };
}

export async function handleInkboxRouter(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/inkbox')&&!path.startsWith('/api/magnanimous/communications'))return null;
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 // The current connected communication identity is platform-owner infrastructure.
 // Do not expose cross-channel customer communications to arbitrary tenant members.
 if(user.role!=='owner')return json({detail:'Owner access required for the Magnanimous communications router.'},403);
 const runtime=await getProviderRuntimeEnv(env);

 if((path==='/api/magnanimous/inkbox'||path==='/api/magnanimous/inkbox/catalog'||path==='/api/magnanimous/communications'||path==='/api/magnanimous/communications/catalog')&&request.method==='GET'){
  const groups={};for(const tool of MAGNANIMOUS_COMMUNICATION_TOOLS)(groups[tool.family]??=[]).push(tool);
  return json({name:'Magnanimous Communications Router',identity:'Magnanimous AI',provider_role:'replaceable-execution-adapter',tool_count:MAGNANIMOUS_COMMUNICATION_TOOLS.length,tools:MAGNANIMOUS_COMMUNICATION_TOOLS,groups,status:configuredSnapshot(runtime),universal_rest_roots:ALLOWED_ROOTS,principle:'Magnanimous owns planning, memory, permissions, verification and learning. Connected communication services execute only authorized transport/account actions.'});
 }
 if((path==='/api/magnanimous/inkbox/status'||path==='/api/magnanimous/communications/status')&&request.method==='GET')return json(configuredSnapshot(runtime));
 if((path==='/api/magnanimous/inkbox/audit'||path==='/api/magnanimous/communications/audit')&&request.method==='GET'){
  await ensureAudit(env);const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||100),1),500);
  const{results=[]}=await env.DB.prepare('SELECT id,action,method,path,risk,response_status,success,created_at FROM magnanimous_communications_audit WHERE tenant_id=? ORDER BY id DESC LIMIT ?').bind(user.tenant_id,limit).all();
  return json({items:results,count:results.length,body_content_stored:false});
 }
 if((path==='/api/magnanimous/inkbox/execute'||path==='/api/magnanimous/communications/execute')&&request.method==='POST'){
  const input=await request.json().catch(()=>({})),method=String(input.method||'GET').toUpperCase();
  if(!METHODS.has(method))return json({detail:'Unsupported communications method.'},405);
  let remotePath;try{remotePath=normalizePath(input.path)}catch(error){return json({detail:error.message||'Invalid communications path.'},400)}
  const risk=actionRisk(method,remotePath),action=String(input.action||'rest.request').slice(0,120);
  if(requiresExplicitApproval(risk)&&input.approved!==true)return json({detail:'This communication action can send, modify, delete, call, change permissions, or alter sensitive account state. Re-submit with approved=true after explicit authorization.',code:'EXPLICIT_ACTION_APPROVAL_REQUIRED',risk,action,method,path:remotePath},409);
  const result=await inkboxRequest(env,{method,path:remotePath,query:input.query,body:input.body,idempotencyKey:input.idempotency_key});
  if(result.error){await audit(env,user,{action,method,path:remotePath,risk,status:result.error.status,success:false});return result.error}
  const response=result.response;await audit(env,user,{action,method,path:remotePath,risk,status:response.status,success:response.ok});
  return new Response(response.body,{status:response.status,headers:safeResponseHeaders(response.headers)});
 }
 return json({detail:'Magnanimous communications route not found.'},404);
}
