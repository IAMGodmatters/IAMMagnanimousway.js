import { decrypt } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const QUERY='in:inbox newer_than:2d -category:promotions -category:social -category:forums';
const CONTROL=new Set(['start','stop','help','unstop','yes','no','subscribe','unsubscribe']);
const NEED=/\b(action required|urgent|deadline|due|please|need|reply|respond|confirm|provide|send|review|verify|security|payment|invoice|legal|contract|agreement|application|quote|proposal|failed|declined|bounced|contact number|phone number|document|signature|approval)\b/i;
const AUTO=/\b(automated message|automatic reply|auto[- ]?reply|do not reply|we have received your|we received your|ticket has been created|case has been created)\b/i;
const MISSED=new Set(['missed','no-answer','no_answer','failed','busy','canceled','cancelled','rejected']);
const clip=(v,n=1000)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);
const parse=(v,f={})=>{try{return JSON.parse(String(v||''))}catch{return f}};

async function ensure(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS magnanimous_attention_watch_state(tenant_id TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 1,last_run_at INTEGER,last_action TEXT NOT NULL DEFAULT '',last_error TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS magnanimous_attention_watch_events(event_key TEXT NOT NULL,tenant_id TEXT NOT NULL,source TEXT NOT NULL,source_id TEXT NOT NULL DEFAULT '',classification TEXT NOT NULL DEFAULT 'observed',attention INTEGER NOT NULL DEFAULT 0,alert_thread_id TEXT NOT NULL DEFAULT '',summary TEXT NOT NULL DEFAULT '',processed_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,event_key))").run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_attention_watch_tenant ON magnanimous_attention_watch_events(tenant_id,processed_at DESC)").run();
}
async function ensureInbox(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS unified_inbox_threads(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT,channel TEXT NOT NULL DEFAULT 'task',source TEXT NOT NULL DEFAULT 'manual',external_ref TEXT NOT NULL DEFAULT '',customer_name TEXT NOT NULL DEFAULT '',customer_ref TEXT NOT NULL DEFAULT '',subject TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',priority INTEGER NOT NULL DEFAULT 50,assigned_ai_agent_id TEXT,assigned_user_id TEXT,last_message_at INTEGER NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS unified_inbox_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,thread_id TEXT NOT NULL,tenant_id TEXT NOT NULL,direction TEXT NOT NULL DEFAULT 'inbound',author_type TEXT NOT NULL DEFAULT 'customer',author_name TEXT NOT NULL DEFAULT '',content TEXT NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)").run();
}
async function owner(env){
 try{return await env.DB.prepare("SELECT id,tenant_id,name,email,role FROM users WHERE active=1 AND lower(role) IN ('owner','super_admin','superadmin','admin') ORDER BY CASE WHEN lower(role)='owner' THEN 0 ELSE 1 END,id LIMIT 1").first()}catch{return null}
}
async function seen(env,tenant,key){return Boolean(await env.DB.prepare('SELECT event_key FROM magnanimous_attention_watch_events WHERE tenant_id=? AND event_key=?').bind(tenant,key).first())}
async function record(env,user,key,source,sourceId,classification,attention,alertThread,summary){
 await env.DB.prepare('INSERT OR IGNORE INTO magnanimous_attention_watch_events(event_key,tenant_id,source,source_id,classification,attention,alert_thread_id,summary,processed_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(key,user.tenant_id,source,clip(sourceId,300),classification,attention?1:0,alertThread||'',clip(summary,1800),now()).run();
}
async function alert(env,user,key,source,sourceId,subject,summary,priority=80,metadata={}){
 await ensureInbox(env);
 const ref='native-attention:'+key;
 const old=await env.DB.prepare("SELECT id FROM unified_inbox_threads WHERE tenant_id=? AND source='native-attention-watch' AND external_ref=? LIMIT 1").bind(user.tenant_id,ref).first();
 if(old?.id)return String(old.id);
 const id=crypto.randomUUID(),ts=now();
 await env.DB.prepare('INSERT INTO unified_inbox_threads(id,tenant_id,client_id,channel,source,external_ref,customer_name,customer_ref,subject,status,priority,assigned_ai_agent_id,assigned_user_id,last_message_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.tenant_id,null,'task','native-attention-watch',ref,'Magnanimous Attention Watch',clip(sourceId,200),clip(subject,300),'open',priority,'magnanimous-ai',String(user.id),ts,ts,ts).run();
 await env.DB.prepare('INSERT INTO unified_inbox_messages(thread_id,tenant_id,direction,author_type,author_name,content,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,user.tenant_id,'inbound','system','Magnanimous AI',clip(summary,12000),JSON.stringify({source,source_id:sourceId,...metadata}).slice(0,12000),ts).run();
 return id;
}
function control(v){return CONTROL.has(clip(v,80).toLowerCase().replace(/[^a-z]+/g,' ').trim())}
function address(v){return (String(v||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[''])[0].toLowerCase()}
function automatic(from,subject,snippet){return AUTO.test(String(subject||'')+' '+String(snippet||''))||/(^|[.@_-])(no-?reply|donotreply|do-not-reply)([.@_-]|$)/i.test(address(from))}
async function threadHasLaterSent(token,threadId,inboundMs){
 if(!threadId)return false;const u=new URL('https://gmail.googleapis.com/gmail/v1/users/me/threads/'+encodeURIComponent(threadId));u.searchParams.set('format','metadata');
 const r=await fetch(u,{headers:{Authorization:'Bearer '+token}});if(!r.ok)return false;const d=await r.json().catch(()=>({}));
 return (d.messages||[]).some(x=>(x.labelIds||[]).includes('SENT')&&Number(x.internalDate||0)>Number(inboundMs||0));
}
async function googleConnection(env,tenant){
 const row=await env.DB.prepare("SELECT * FROM integrations WHERE tenant_id=? AND provider='google' ORDER BY updated_at DESC LIMIT 1").bind(tenant).first();
 if(!row)return null;
 return {...row,access_token:await decrypt(String(row.access_token||''),env),refresh_token:await decrypt(String(row.refresh_token||''),env)};
}
async function googleToken(env,conn){
 if(conn.access_token&&(!Number(conn.token_expires_at)||Number(conn.token_expires_at)>now()+90))return conn.access_token;
 if(!conn.refresh_token||!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return'';
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:String(env.GOOGLE_CLIENT_ID),client_secret:String(env.GOOGLE_CLIENT_SECRET),refresh_token:String(conn.refresh_token),grant_type:'refresh_token'})});
 const d=await r.json().catch(()=>({}));return r.ok?String(d.access_token||''):'';
}
async function gmail(env,user){
 const conn=await googleConnection(env,user.tenant_id);if(!conn)return{processed:0,attention:0,error:'Connect Gmail in Magnanimous Connections to activate native email attention monitoring.'};
 const token=await googleToken(env,conn);if(!token)return{processed:0,attention:0,error:'Connected Gmail needs reauthorization.'};
 const list=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q='+encodeURIComponent(QUERY),{headers:{Authorization:'Bearer '+token}});
 if(!list.ok)return{processed:0,attention:0,error:'Gmail attention scan returned HTTP '+list.status+'.'};
 const ids=(await list.json().catch(()=>({}))).messages||[];let processed=0,attention=0;
 for(const row of ids){
  const key='email:'+row.id;if(await seen(env,user.tenant_id,key))continue;
  const u=new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+encodeURIComponent(row.id));u.searchParams.set('format','metadata');for(const h of ['From','Subject','Date'])u.searchParams.append('metadataHeaders',h);
  const r=await fetch(u,{headers:{Authorization:'Bearer '+token}});if(!r.ok)continue;const m=await r.json().catch(()=>({})),headers={};for(const h of m?.payload?.headers||[])headers[String(h.name||'').toLowerCase()]=String(h.value||'');
  const snippet=clip(m.snippet,900),subject=clip(headers.subject||'(no subject)',300),from=clip(headers.from,240),isControl=control(snippet||subject),isAuto=automatic(from,subject,snippet);let needs=!isControl&&!isAuto&&(NEED.test(subject+' '+snippet)||(subject+' '+snippet).includes('?'));
  if(needs&&await threadHasLaterSent(token,m.threadId,Number(m.internalDate||0)))needs=false;
  const summary='Email from '+(from||'unknown sender')+' — '+subject+(snippet?' — '+snippet:'');let alertId='';
  if(needs){alertId=await alert(env,user,key,'email',row.id,'Email needs attention: '+subject,summary,NEED.test(subject+' '+snippet)?85:70,{message_id:row.id,thread_id:m.threadId||''});attention++}
  await record(env,user,key,'email',row.id,isControl?'consent_control':isAuto?'automatic':needs?'attention':'observed',needs,alertId,summary);processed++;
 }
 return{processed,attention,error:''};
}
async function messages(env,user){
 let rows=[];try{({results:rows=[]}=await env.DB.prepare("SELECT t.id,t.channel,t.subject,t.customer_name,t.customer_ref,t.updated_at,(SELECT MAX(created_at) FROM unified_inbox_messages m WHERE m.tenant_id=t.tenant_id AND m.thread_id=t.id AND m.direction='inbound') last_inbound,(SELECT MAX(created_at) FROM unified_inbox_messages m WHERE m.tenant_id=t.tenant_id AND m.thread_id=t.id AND m.direction='outbound') last_outbound,(SELECT content FROM unified_inbox_messages m WHERE m.tenant_id=t.tenant_id AND m.thread_id=t.id AND m.direction='inbound' ORDER BY m.id DESC LIMIT 1) last_content FROM unified_inbox_threads t WHERE t.tenant_id=? AND t.channel IN ('sms','imessage') AND t.source<>'native-attention-watch' AND t.status IN ('open','waiting') ORDER BY t.updated_at DESC LIMIT 100").bind(user.tenant_id).all())}catch{return{processed:0,attention:0,error:''}}
 let processed=0,attention=0;
 for(const x of rows){if(!Number(x.last_inbound||0)||Number(x.last_outbound||0)>=Number(x.last_inbound||0))continue;const key=x.channel+':'+x.id+':'+x.last_inbound;if(await seen(env,user.tenant_id,key))continue;const body=clip(x.last_content,1000),isControl=control(body),summary=(x.channel==='imessage'?'iMessage':'SMS')+' from '+(clip(x.customer_name||x.customer_ref,180)||'unknown sender')+(body?' — '+body:'');let alertId='';
  if(!isControl){alertId=await alert(env,user,key,x.channel,x.id,(x.channel==='imessage'?'iMessage':'SMS')+' needs attention',summary,80,{thread_id:x.id});attention++}
  await record(env,user,key,x.channel,x.id,isControl?'consent_control':'attention',!isControl,alertId,summary);processed++;
 }
 return{processed,attention,error:''};
}
async function calls(env,user){
 let rows=[],vm=[];try{({results:rows=[]}=await env.DB.prepare("SELECT id,caller,status,disposition,notes,created_at,updated_at,provider_call_id FROM phone_calls WHERE tenant_id=? AND direction='inbound' AND created_at>=? ORDER BY created_at DESC LIMIT 100").bind(user.tenant_id,now()-172800).all())}catch{}
 try{({results:vm=[]}=await env.DB.prepare("SELECT id,phone,provider_call_id,transcription,status,created_at,updated_at FROM cc_voicemails WHERE tenant_id=? AND status='new' ORDER BY created_at DESC LIMIT 100").bind(user.tenant_id).all())}catch{}
 let processed=0,attention=0;
 for(const x of rows){if(!MISSED.has(String(x.status||'').toLowerCase()))continue;const key='call:'+x.id+':'+(x.updated_at||x.created_at);if(await seen(env,user.tenant_id,key))continue;let intel=null;try{intel=await env.DB.prepare('SELECT summary,action_items_json FROM cc_call_intelligence WHERE tenant_id=? AND call_id=?').bind(user.tenant_id,x.id).first()}catch{}const callContext=clip(intel?.summary||'',700),actions=parse(intel?.action_items_json,[]);const summary='Missed/recent inbound call from '+(clip(x.caller,160)||'unknown caller')+' — '+clip(x.status,80)+(x.notes?' — '+clip(x.notes,500):'')+(callContext?' — '+callContext:'')+(actions.length?' — Actions: '+clip(actions.join('; '),700):'');const a=await alert(env,user,key,'call',x.id,'Missed/recent call needs attention',summary,80,{call_id:x.id,provider_call_id:x.provider_call_id||'',action_items:actions});await record(env,user,key,'call',x.id,'missed_call',true,a,summary);processed++;attention++}
 for(const x of vm){const key='voicemail:'+x.id+':'+(x.updated_at||x.created_at);if(await seen(env,user.tenant_id,key))continue;const summary='New voicemail from '+(clip(x.phone,160)||'unknown caller')+(x.transcription?' — '+clip(x.transcription,1000):'');const a=await alert(env,user,key,'voicemail',x.id,'New voicemail needs attention',summary,80,{voicemail_id:x.id});await record(env,user,key,'voicemail',x.id,'voicemail',true,a,summary);processed++;attention++}
 return{processed,attention,error:''};
}
async function a2a(env,user){
 let rows=[];try{({results:rows=[]}=await env.DB.prepare("SELECT id,title,goal,status,stage,metadata,updated_at FROM magnanimous_work_items WHERE tenant_id=? AND user_id=? AND status IN ('planned','waiting','failed') ORDER BY updated_at DESC LIMIT 100").bind(user.tenant_id,user.id).all())}catch{return{processed:0,attention:0,error:''}}
 let processed=0,attention=0;
 for(const x of rows){const meta=parse(x.metadata,{});if(meta.channel!=='a2a'&&meta.input_required!==true)continue;const key='a2a:'+x.id+':'+x.updated_at;if(await seen(env,user.tenant_id,key))continue;const summary='A2A task '+(x.status==='failed'?'failed':x.status==='planned'?'is new':'needs input')+' — '+clip(x.title,240)+(x.goal?' — '+clip(x.goal,900):'');const a=await alert(env,user,key,'a2a',x.id,'A2A task '+(x.status==='failed'?'failed':x.status==='planned'?'is new':'needs your input'),summary,x.status==='failed'?90:80,{work_id:x.id,status:x.status,stage:x.stage});await record(env,user,key,'a2a',x.id,x.status==='failed'?'failed':x.status==='planned'?'new':'input_required',true,a,summary);processed++;attention++}
 return{processed,attention,error:''};
}
async function saveState(env,user,action,error=''){const ts=now();await env.DB.prepare("INSERT INTO magnanimous_attention_watch_state(tenant_id,enabled,last_run_at,last_action,last_error,updated_at) VALUES(?,1,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET enabled=excluded.enabled,last_run_at=excluded.last_run_at,last_action=excluded.last_action,last_error=excluded.last_error,updated_at=excluded.updated_at").bind(user.tenant_id,ts,clip(action,600),clip(error,1200),ts).run()}
export async function scheduledMagnanimousAttentionWatch(env){
 if(String(env?.MAGNANIMOUS_ATTENTION_WATCH_ENABLED||'true').toLowerCase()==='false'||!env?.DB)return{enabled:false,native_only:true,inkbox_used:false};
 await ensure(env);const user=await owner(env);if(!user)return{enabled:true,status:'no-owner',native_only:true,inkbox_used:false};
 const state=await env.DB.prepare('SELECT enabled FROM magnanimous_attention_watch_state WHERE tenant_id=?').bind(user.tenant_id).first();if(state&&Number(state.enabled)===0)return{enabled:false,status:'disabled',native_only:true,inkbox_used:false};
 try{const [mail,msg,voice,tasks]=await Promise.all([gmail(env,user),messages(env,user),calls(env,user),a2a(env,user)]);const processed=mail.processed+msg.processed+voice.processed+tasks.processed,attention=mail.attention+msg.attention+voice.attention+tasks.attention,errors=[mail.error,msg.error,voice.error,tasks.error].filter(Boolean);const action='processed:'+processed+';attention:'+attention+';email:'+mail.processed+';messages:'+msg.processed+';calls:'+voice.processed+';a2a:'+tasks.processed;await saveState(env,user,action,errors.join(' | '));return{enabled:true,status:errors.length?'partial':'ok',native_only:true,inkbox_used:false,processed,attention,replied:0,channels:{email:mail,messages:msg,calls:voice,a2a:tasks},note:'General triage never fabricates replies. Authorized specialized Magnanimous workflows may reply separately.'}}catch(error){const message=String(error?.message||error||'Native attention watch failed.');await saveState(env,user,'failed',message);throw error}
}
export async function magnanimousAttentionWatchStatus(env,tenantId){
 await ensure(env);const state=await env.DB.prepare('SELECT * FROM magnanimous_attention_watch_state WHERE tenant_id=?').bind(tenantId).first();const{results=[]}=await env.DB.prepare('SELECT event_key,source,source_id,classification,attention,alert_thread_id,summary,processed_at FROM magnanimous_attention_watch_events WHERE tenant_id=? ORDER BY processed_at DESC LIMIT 100').bind(tenantId).all();return{native_only:true,inkbox_used:false,state:state||{tenant_id:tenantId,enabled:1},events:results};
}
