import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const xml=(body,status=200)=>new Response(body,{status,headers:{'content-type':'text/xml; charset=utf-8','cache-control':'no-store'}});
const clean=v=>String(v||'').trim();
const phone=v=>clean(v).replace(/[\s().-]/g,'');
const esc=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const MODES=new Set(['preview','progressive','power']);
const CAMPAIGN_STATES=new Set(['draft','active','paused','completed','archived']);
const CALLBACK_STATES=new Set(['pending','scheduled','assigned','completed','canceled']);
const INTERACTION_STATES=new Set(['open','pending','resolved','closed']);

function validE164(v){return /^\+[1-9]\d{7,14}$/.test(phone(v))}
function safeJson(value,fallback={}){try{return JSON.parse(value||'')}catch{return fallback}}
function owner(user){return user?.role==='owner'||user?.role==='admin'}
function runtimeTrue(v){return ['1','true','yes','on'].includes(String(v||'').trim().toLowerCase())}
function twilioReady(env){return Boolean(env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_PHONE_NUMBER)}
function twilioSoftphoneReady(env){return Boolean(twilioReady(env)&&env.TWILIO_API_KEY_SID&&env.TWILIO_API_KEY_SECRET&&env.TWILIO_TWIML_APP_SID)}
function telecomCoreConfig(env){
 if(!runtimeTrue(env.TELECOM_NATIVE_WEBRTC_LIVE))return null;
 const raw=clean(env.TELECOM_CORE_URL),token=clean(env.TELECOM_CORE_TOKEN);if(!raw||!token)return null;
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)return null;return{base:raw.replace(/\/+$/,''),token}}catch{return null}
}
function nativeSoftphoneReady(env){return Boolean(telecomCoreConfig(env))}
async function telecomCoreRequest(env,path,options={}){
 const cfg=telecomCoreConfig(env);if(!cfg)return null;
 const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${cfg.token}`);if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
 try{return await fetch(`${cfg.base}${path}`,{...options,headers})}catch{return null}
}
function genericReady(env){return Boolean(env.VOIP_PROVIDER_URL&&env.VOIP_PROVIDER_TOKEN)}
function telnyxReady(env){return Boolean(env.TELNYX_API_KEY&&env.TELNYX_CONNECTION_ID&&env.TELNYX_PHONE_NUMBER)}
function plivoReady(env){return Boolean(env.PLIVO_AUTH_ID&&env.PLIVO_AUTH_TOKEN&&env.PLIVO_PHONE_NUMBER)}
function providerSnapshot(env){
 const byoc=genericReady(env),telnyx=telnyxReady(env),plivo=plivoReady(env),twilio=twilioReady(env),softphone=twilioSoftphoneReady(env),nativeWebrtcLive=runtimeTrue(env.TELECOM_NATIVE_WEBRTC_LIVE),nativeSession=nativeSoftphoneReady(env);
 const livePstn=byoc||twilio;
 const upstreamAccounts=[telnyx,plivo,twilio].filter(Boolean).length;
 const mode=String(env.VOIP_BILLING_MODE||'metered').trim().toLowerCase();
 return {
  provider_details_private:true,
  browser_calling:{configured:true,free_first:true,inbound:true,outbound:true,note:'Peer-to-peer browser calling for signed-in users.'},
  magnanimous_carrier:{configured:livePstn,inbound:byoc||twilio,outbound:livePstn,byoc,flat_rate:['flat-rate','unlimited','channel'].includes(mode),billing_mode:byoc?mode:'metered',least_cost_routing:true,live_route_count:[byoc,twilio].filter(Boolean).length,upstream_accounts_configured:upstreamAccounts,truth_boundary:'An upstream account is not counted as a live call route until it is attached to the Magnanimous carrier bridge or an authenticated compatibility transport.'},
  agent_softphone:{configured:softphone||nativeSession,provider_identity:'Magnanimous Carrier',native_pbx_target:'Asterisk WebRTC',native_pbx_live:nativeWebrtcLive,native_session_ready:nativeSession,compatibility_transport:softphone,transport_preference:nativeSession?'native-asterisk-webrtc-with-compatibility-pstn':'compatibility-until-native-verification'},
  ai_assist:{configured:Boolean(env.AI),free_first:Boolean(env.AI)},
  optional_video:{configured:Boolean(env.TAVUS_API_KEY||env.HEYGEN_API_KEY),premium:true}
 };
}

async function ensure(env){
 const qs=[
  `CREATE TABLE IF NOT EXISTS cc_campaigns(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'preview',status TEXT NOT NULL DEFAULT 'draft',queue_id TEXT,agent_id TEXT,caller_id TEXT NOT NULL DEFAULT '',timezone TEXT NOT NULL DEFAULT 'UTC',daily_cap INTEGER NOT NULL DEFAULT 100,hourly_cap INTEGER NOT NULL DEFAULT 20,max_attempts INTEGER NOT NULL DEFAULT 3,retry_seconds INTEGER NOT NULL DEFAULT 86400,consent_required INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_campaign_members(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,campaign_id TEXT NOT NULL,lead_id INTEGER,phone TEXT NOT NULL,display_name TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,last_attempt_at INTEGER,next_attempt_at INTEGER,disposition TEXT NOT NULL DEFAULT '',consent_confirmed INTEGER NOT NULL DEFAULT 0,timezone TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(campaign_id,phone))`,
  `CREATE TABLE IF NOT EXISTS cc_ivr_flows(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 0,greeting TEXT NOT NULL DEFAULT '',invalid_message TEXT NOT NULL DEFAULT 'That selection was not recognized.',timeout_message TEXT NOT NULL DEFAULT 'I did not receive a selection.',after_hours_message TEXT NOT NULL DEFAULT 'We are currently closed. Please leave a message or request a callback.',business_hours_json TEXT NOT NULL DEFAULT '{}',nodes_json TEXT NOT NULL DEFAULT '{}',default_queue_id TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_callbacks(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,queue_id TEXT,phone TEXT NOT NULL,display_name TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending',requested_at INTEGER NOT NULL,scheduled_at INTEGER,assigned_agent_id TEXT,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_voicemails(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,queue_id TEXT,phone TEXT NOT NULL DEFAULT '',provider_call_id TEXT NOT NULL DEFAULT '',recording_url TEXT NOT NULL DEFAULT '',transcription TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'new',assigned_agent_id TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_dispositions(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,code TEXT NOT NULL,label TEXT NOT NULL,outcome TEXT NOT NULL DEFAULT 'neutral',retryable INTEGER NOT NULL DEFAULT 0,retry_seconds INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,sort_order INTEGER NOT NULL DEFAULT 100,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,code))`,
  `CREATE TABLE IF NOT EXISTS cc_agent_assist_rules(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,trigger_phrase TEXT NOT NULL,guidance TEXT NOT NULL,queue_id TEXT,priority INTEGER NOT NULL DEFAULT 100,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_call_intelligence(call_id INTEGER NOT NULL,tenant_id TEXT NOT NULL,summary TEXT NOT NULL DEFAULT '',sentiment TEXT NOT NULL DEFAULT 'unknown',topics_json TEXT NOT NULL DEFAULT '[]',action_items_json TEXT NOT NULL DEFAULT '[]',qa_flags_json TEXT NOT NULL DEFAULT '[]',compliance_risk TEXT NOT NULL DEFAULT 'none',generated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,call_id))`,
  `CREATE TABLE IF NOT EXISTS cc_interactions(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,channel TEXT NOT NULL,direction TEXT NOT NULL DEFAULT 'inbound',customer_key TEXT NOT NULL DEFAULT '',customer_name TEXT NOT NULL DEFAULT '',subject TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',priority INTEGER NOT NULL DEFAULT 50,queue_id TEXT,assigned_agent_id TEXT,sentiment TEXT NOT NULL DEFAULT 'unknown',metadata_json TEXT NOT NULL DEFAULT '{}',last_message_at INTEGER NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_interaction_messages(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,interaction_id TEXT NOT NULL,sender_type TEXT NOT NULL,sender_key TEXT NOT NULL DEFAULT '',body TEXT NOT NULL,provider_message_id TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cc_native_webrtc_sessions(session_id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)`
 ];
 for(const q of qs)await env.DB.prepare(q).run();
}

async function seed(env,tenant){
 const count=await env.DB.prepare('SELECT COUNT(*) n FROM cc_dispositions WHERE tenant_id=?').bind(tenant).first();
 if(Number(count?.n||0)===0){
  const ts=now();
  const rows=[['connected','Connected','positive',0,0],['sale','Sale / Converted','positive',0,0],['follow-up','Follow up','neutral',1,86400],['no-answer','No answer','neutral',1,14400],['busy','Busy','neutral',1,3600],['voicemail','Voicemail','neutral',1,86400],['not-interested','Not interested','negative',0,0],['dnc','Do not call','negative',0,0]];
  for(let i=0;i<rows.length;i++){const r=rows[i];await env.DB.prepare('INSERT INTO cc_dispositions(id,tenant_id,code,label,outcome,retryable,retry_seconds,active,sort_order,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,r[0],r[1],r[2],r[3],r[4],1,(i+1)*10,ts,ts).run()}
 }
 const ivr=await env.DB.prepare('SELECT id FROM cc_ivr_flows WHERE tenant_id=? LIMIT 1').bind(tenant).first();
 if(!ivr){
  const ts=now();
  const nodes={
   '1':{type:'ai',label:'AI Receptionist'},
   '2':{type:'callback',label:'Request a callback'},
   '3':{type:'voicemail',label:'Leave a voicemail'}
  };
  await env.DB.prepare('INSERT INTO cc_ivr_flows(id,tenant_id,name,active,greeting,nodes_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,'Main Line',1,'Welcome to I AM Magnanimous Way. Press 1 for the AI receptionist, 2 to request a callback, or 3 to leave a voicemail.',JSON.stringify(nodes),ts,ts).run();
 }
}

async function sessionSecret(env){
 const direct=clean(env.SESSION_SECRET);if(direct)return direct;
 try{const r=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return clean(r?.value)}catch{return''}
}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function hmacSha1(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);const out=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));let s='';for(const b of out)s+=String.fromCharCode(b);return btoa(s)}
async function validTwilio(request,env){
 if(!env.TWILIO_AUTH_TOKEN)return false;const supplied=request.headers.get('x-twilio-signature')||'';if(!supplied)return false;
 let form;try{form=await request.clone().formData()}catch{return false}
 const grouped=new Map();for(const [k,raw] of form.entries()){const v=typeof raw==='string'?raw:'';if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(v)}
 let payload=request.url;for(const k of [...grouped.keys()].sort())for(const v of grouped.get(k).slice().sort())payload+=`${k}${v}`;
 return safeEqual(supplied,await hmacSha1(String(env.TWILIO_AUTH_TOKEN),payload));
}

function b64urlBytes(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
function b64urlText(value){return b64urlBytes(new TextEncoder().encode(String(value)))}
function decodeB64urlText(value){try{let s=String(value||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const raw=atob(s),bytes=Uint8Array.from(raw,ch=>ch.charCodeAt(0));return new TextDecoder().decode(bytes)}catch{return''}}
function softphoneIdentity(user){return `iam_${b64urlText(String(user?.id||'')).slice(0,100)}`}
function softphoneUserId(identity){const cleanIdentity=String(identity||'').replace(/^client:/,'');return cleanIdentity.startsWith('iam_')?decodeB64urlText(cleanIdentity.slice(4)):''}
async function hmacSha256(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))}
async function twilioVoiceToken(env,user){
 if(!twilioSoftphoneReady(env))return null;
 const iat=now(),exp=iat+3600,identity=softphoneIdentity(user);
 const header=b64urlText(JSON.stringify({typ:'JWT',alg:'HS256',cty:'twilio-fpa;v=1'}));
 const payload=b64urlText(JSON.stringify({jti:`${env.TWILIO_API_KEY_SID}-${iat}`,grants:{identity,voice:{incoming:{allow:true},outgoing:{application_sid:String(env.TWILIO_TWIML_APP_SID)}}},iat,exp,iss:String(env.TWILIO_API_KEY_SID),sub:String(env.TWILIO_ACCOUNT_SID)}));
 const sig=b64urlBytes(await hmacSha256(env.TWILIO_API_KEY_SECRET,`${header}.${payload}`));
 return {token:`${header}.${payload}.${sig}`,identity,expires_at:exp};
}
async function ensureSoftphoneAgent(env,user){
 let agent=await env.DB.prepare('SELECT * FROM call_center_agents WHERE tenant_id=? AND user_id=? AND active=1 LIMIT 1').bind(user.tenant_id,user.id).first().catch(()=>null);
 if(agent)return agent;
 const id=crypto.randomUUID(),ts=now();
 await env.DB.prepare("INSERT INTO call_center_agents(id,tenant_id,user_id,name,extension,status,skills,active,last_seen_at,created_at,updated_at) VALUES(?,?,?,?,?,'offline','',1,NULL,?,?)").bind(id,user.tenant_id,user.id,clean(user.name||user.email||'Agent'),'',ts,ts).run();
 return env.DB.prepare('SELECT * FROM call_center_agents WHERE id=? AND tenant_id=?').bind(id,user.tenant_id).first();
}
async function softphoneConfig(env,user,request){
 const agent=await env.DB.prepare('SELECT id FROM call_center_agents WHERE tenant_id=? AND user_id=? AND active=1 LIMIT 1').bind(user.tenant_id,user.id).first().catch(()=>null);
 const access=await twilioVoiceToken(env,user),nativeLive=runtimeTrue(env.TELECOM_NATIVE_WEBRTC_LIVE),nativeSessionReady=nativeSoftphoneReady(env),origin=new URL(request.url).origin;
 return json({
  configured:Boolean(access||nativeSessionReady),
  provider:'Magnanimous Carrier',
  identity:access?.identity||softphoneIdentity(user),
  ...(access?{token:access.token,expires_at:access.expires_at}:{}),
  caller_id:String(env.TWILIO_PHONE_NUMBER||''),
  twiml_app_voice_url:`${origin}/api/contact-center/softphone/outgoing`,
  queue_voice_url:`${origin}/api/contact-center/carrier/incoming`,
  native_session_url:`${origin}/api/contact-center/softphone/native-session`,
  free_browser_phone:'/phone',
  agent_id:agent?.id||null,
  native_pbx_target:'Asterisk WebRTC',
  native_pbx_live:nativeLive,
  native_session_ready:nativeSessionReady,
  compatibility_transport_ready:Boolean(access),
  transport_preference:nativeSessionReady?'native-asterisk-webrtc-with-compatibility-pstn':'compatibility-until-native-verification',
  required:access?[]:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_PHONE_NUMBER','TWILIO_API_KEY_SID','TWILIO_API_KEY_SECRET','TWILIO_TWIML_APP_SID'],
  note:nativeSessionReady?'Owned Asterisk WebRTC can register a short-lived browser identity. Ordinary-number dialing remains on the compatibility transport until the native PSTN bridge is separately policy-controlled.':'The agent desk remains available; native browser media stays gated until the public PBX is verified, with the compatibility transport preserved.'
 });
}
async function createNativeSoftphoneSession(env,user){
 const core=telecomCoreConfig(env);if(!core)return json({detail:'Native Magnanimous PBX sessions are not live and configured yet.',fallback:'compatibility'},503);
 await env.DB.prepare('DELETE FROM cc_native_webrtc_sessions WHERE expires_at<=?').bind(now()).run().catch(()=>{});
 const response=await telecomCoreRequest(env,'/v1/webrtc/sessions',{method:'POST'});if(!response)return json({detail:'Magnanimous Telecom Core is unavailable.',fallback:'compatibility'},502);
 const data=await response.json().catch(()=>null);if(!response.ok)return json({detail:'Magnanimous Telecom Core rejected the native browser session.',status:response.status,fallback:'compatibility'},502);
 const sessionId=clean(data?.session_id),username=clean(data?.username),password=clean(data?.password),domain=clean(data?.domain),wssUrl=clean(data?.wss_url),expiresAt=Number(data?.expires_at||0);
 let wss;try{wss=new URL(wssUrl)}catch{}
 if(!/^web_\d+_[a-f0-9]{16}$/i.test(sessionId)||username!==sessionId||!password||!domain||!wss||wss.protocol!=='wss:'||!Number.isFinite(expiresAt)||expiresAt<=now()||data?.pstn_direct!==false){
  if(sessionId)await telecomCoreRequest(env,`/v1/webrtc/sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'}).catch(()=>null);
  return json({detail:'Magnanimous Telecom Core returned an invalid native browser session.',fallback:'compatibility'},502);
 }
 const agent=await ensureSoftphoneAgent(env,user);
 await env.DB.prepare('INSERT OR REPLACE INTO cc_native_webrtc_sessions(session_id,tenant_id,user_id,expires_at,created_at) VALUES(?,?,?,?,?)').bind(sessionId,String(user.tenant_id),String(user.id),expiresAt,now()).run();
 return json({ok:true,provider:'Magnanimous Carrier',transport:'native-asterisk-webrtc',session_id:sessionId,username,password,domain,wss_url:wssUrl,expires_at:expiresAt,expires_in:Number(data?.expires_in||0),agent_id:agent.id,pstn_direct:false,allowed_call_scope:Array.isArray(data?.allowed_call_scope)?data.allowed_call_scope:[],compatibility_fallback:twilioSoftphoneReady(env)},201);
}
async function revokeNativeSoftphoneSession(env,user,sessionId){
 sessionId=clean(sessionId);if(!/^web_\d+_[a-f0-9]{16}$/i.test(sessionId))return json({detail:'Invalid native WebRTC session identifier.'},400);
 const owned=await env.DB.prepare('SELECT session_id FROM cc_native_webrtc_sessions WHERE session_id=? AND tenant_id=? AND user_id=?').bind(sessionId,String(user.tenant_id),String(user.id)).first().catch(()=>null);
 if(!owned)return json({detail:'Native WebRTC session not found.'},404);
 const response=await telecomCoreRequest(env,`/v1/webrtc/sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'});
 if(response&&response.status!==404&&!response.ok)return json({detail:'Magnanimous Telecom Core could not revoke the native browser session.',fallback:'compatibility'},502);
 await env.DB.prepare('DELETE FROM cc_native_webrtc_sessions WHERE session_id=? AND tenant_id=? AND user_id=?').bind(sessionId,String(user.tenant_id),String(user.id)).run();
 return json({ok:true,session_id:sessionId,deleted:true});
}
async function softphoneOutgoing(request,env){
 if(!twilioSoftphoneReady(env))return xml(sayHangup('The carrier softphone is not configured.'),503);
 if(!await validTwilio(request,env))return xml(sayHangup('This call could not be authenticated.'),403);
 const form=await request.formData(),to=phone(form.get('To')),userId=softphoneUserId(form.get('From'));
 if(!validE164(to)||!userId)return xml(sayHangup('This call request is invalid.'),422);
 const user=await env.DB.prepare('SELECT id,tenant_id,name,email,role FROM users WHERE id=? AND active=1 LIMIT 1').bind(userId).first();
 if(!user)return xml(sayHangup('This agent is not authorized.'),403);
 const dnc=await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(user.tenant_id,to).first().catch(()=>null);
 if(dnc)return xml(sayHangup('This destination is on the do-not-call list.'),409);
 const agent=await ensureSoftphoneAgent(env,user),ts=now();
 const created=await env.DB.prepare("INSERT INTO phone_calls(tenant_id,direction,caller,callee,status,created_at,provider,agent_id,metadata_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(user.tenant_id,'outbound',String(env.TWILIO_PHONE_NUMBER),to,'dialing',ts,'magnanimous-carrier',agent.id,JSON.stringify({softphone:true,requested_by:user.id}),ts).run();
 const callId=Number(created.meta.last_row_id),statusUrl=new URL('/api/contact-center/softphone/status',request.url);statusUrl.searchParams.set('call_id',String(callId));
 return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${esc(env.TWILIO_PHONE_NUMBER)}" answerOnBridge="true"><Number statusCallback="${esc(statusUrl.toString())}" statusCallbackMethod="POST" statusCallbackEvent="initiated ringing answered completed">${esc(to)}</Number></Dial></Response>`);
}
async function softphoneStatus(request,env,url){
 if(!await validTwilio(request,env))return json({detail:'Invalid carrier signature.'},403);
 const callId=Number(url.searchParams.get('call_id')||0);if(!callId)return json({detail:'call_id is required.'},400);
 const form=await request.formData(),sid=clean(form.get('CallSid')||form.get('DialCallSid')),status=clean(form.get('CallStatus')||form.get('DialCallStatus')).toLowerCase(),duration=Number(form.get('CallDuration')||form.get('DialCallDuration')||0)||0,terminal=new Set(['completed','busy','failed','no-answer','canceled']);
 const call=await env.DB.prepare('SELECT * FROM phone_calls WHERE id=?').bind(callId).first();if(!call)return json({detail:'Call not found.'},404);
 const started=(status==='in-progress'||status==='answered')&&!call.started_at?now():call.started_at,ended=terminal.has(status)?now():call.ended_at;
 await env.DB.prepare("UPDATE phone_calls SET provider_call_id=COALESCE(NULLIF(?,''),provider_call_id),status=?,started_at=?,ended_at=?,duration_seconds=?,updated_at=? WHERE id=?").bind(sid,status||call.status,started||null,ended||null,duration||call.duration_seconds||0,now(),callId).run();
 return json({ok:true});
}
async function softphoneClaim(env,user,body){
 const sid=clean(body?.call_sid);if(!sid)return json({detail:'call_sid is required.'},400);
 const agent=await ensureSoftphoneAgent(env,user),existing=await env.DB.prepare('SELECT * FROM phone_calls WHERE tenant_id=? AND provider_call_id=? ORDER BY id DESC LIMIT 1').bind(user.tenant_id,sid).first().catch(()=>null);
 if(existing){await env.DB.prepare("UPDATE phone_calls SET agent_id=?,status=CASE WHEN status IN ('ringing','queued','dialing') THEN 'connected' ELSE status END,started_at=COALESCE(started_at,?),updated_at=? WHERE id=? AND tenant_id=?").bind(agent.id,now(),now(),existing.id,user.tenant_id).run();return json({ok:true,call_id:existing.id,agent_id:agent.id})}
 const ts=now(),created=await env.DB.prepare("INSERT INTO phone_calls(tenant_id,direction,caller,callee,status,started_at,created_at,provider,provider_call_id,agent_id,metadata_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(user.tenant_id,'inbound','',softphoneIdentity(user),'connected',ts,ts,'magnanimous-carrier',sid,agent.id,JSON.stringify({softphone_claim:true}),ts).run();
 return json({ok:true,call_id:Number(created.meta.last_row_id),agent_id:agent.id},201);
}

function localHour(timezone){
 try{return Number(new Intl.DateTimeFormat('en-US',{timeZone:timezone||'UTC',hour:'2-digit',hour12:false}).format(new Date()))}catch{return new Date().getUTCHours()}
}
function insideCallingWindow(campaign){const h=localHour(campaign?.timezone||'UTC');return h>=8&&h<20}
async function outboundCount(env,tenant,campaignId,since){const r=await env.DB.prepare('SELECT COUNT(*) n FROM cc_campaign_members WHERE tenant_id=? AND campaign_id=? AND last_attempt_at>=?').bind(tenant,campaignId,since).first();return Number(r?.n||0)}

async function overview(env,tenant){
 const day=now()-86400;
 const [agents,available,queues,activeCalls,todayCalls,campaigns,callbacks,voicemails,openInteractions]=await Promise.all([
  env.DB.prepare('SELECT COUNT(*) n FROM call_center_agents WHERE tenant_id=? AND active=1').bind(tenant).first().catch(()=>({n:0})),
  env.DB.prepare("SELECT COUNT(*) n FROM call_center_agents WHERE tenant_id=? AND active=1 AND status='available'").bind(tenant).first().catch(()=>({n:0})),
  env.DB.prepare('SELECT COUNT(*) n FROM call_queues WHERE tenant_id=? AND active=1').bind(tenant).first().catch(()=>({n:0})),
  env.DB.prepare("SELECT COUNT(*) n FROM phone_calls WHERE tenant_id=? AND status IN ('created','queued','dialing','ringing','connected','in-progress')").bind(tenant).first().catch(()=>({n:0})),
  env.DB.prepare('SELECT COUNT(*) n FROM phone_calls WHERE tenant_id=? AND created_at>=?').bind(tenant,day).first().catch(()=>({n:0})),
  env.DB.prepare("SELECT COUNT(*) n FROM cc_campaigns WHERE tenant_id=? AND status IN ('draft','active','paused')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM cc_callbacks WHERE tenant_id=? AND status IN ('pending','scheduled','assigned')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM cc_voicemails WHERE tenant_id=? AND status IN ('new','assigned')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n FROM cc_interactions WHERE tenant_id=? AND status IN ('open','pending')").bind(tenant).first()
 ]);
 return {agents:Number(agents?.n||0),available_agents:Number(available?.n||0),queues:Number(queues?.n||0),active_calls:Number(activeCalls?.n||0),calls_24h:Number(todayCalls?.n||0),campaigns:Number(campaigns?.n||0),callbacks:Number(callbacks?.n||0),voicemails:Number(voicemails?.n||0),open_interactions:Number(openInteractions?.n||0)};
}

async function campaignRoutes(request,env,user,url){
 const tenant=String(user.tenant_id),path=url.pathname;
 if(path==='/api/contact-center/campaigns'&&request.method==='GET'){
  const {results=[]}=await env.DB.prepare(`SELECT c.*,(SELECT COUNT(*) FROM cc_campaign_members m WHERE m.campaign_id=c.id) member_count,(SELECT COUNT(*) FROM cc_campaign_members m WHERE m.campaign_id=c.id AND m.status='completed') completed_count FROM cc_campaigns c WHERE c.tenant_id=? ORDER BY c.updated_at DESC LIMIT 200`).bind(tenant).all();
  return json({campaigns:results});
 }
 if(path==='/api/contact-center/campaigns'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner access required.'},403);const b=await request.json().catch(()=>({})),name=clean(b.name);if(!name)return json({detail:'Campaign name is required.'},400);const id=crypto.randomUUID(),ts=now(),mode=MODES.has(String(b.mode))?String(b.mode):'preview';
  await env.DB.prepare('INSERT INTO cc_campaigns(id,tenant_id,name,mode,status,queue_id,agent_id,caller_id,timezone,daily_cap,hourly_cap,max_attempts,retry_seconds,consent_required,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,name,mode,'draft',b.queue_id||null,b.agent_id||null,clean(b.caller_id),clean(b.timezone)||'UTC',Math.min(Math.max(Number(b.daily_cap||100),1),5000),Math.min(Math.max(Number(b.hourly_cap||20),1),1000),Math.min(Math.max(Number(b.max_attempts||3),1),10),Math.min(Math.max(Number(b.retry_seconds||86400),900),2592000),1,ts,ts).run();
  return json({id},201);
 }
 const item=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)$/);
 if(item&&request.method==='PUT'){
  if(!owner(user))return json({detail:'Workspace owner access required.'},403);const old=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(item[1],tenant).first();if(!old)return json({detail:'Campaign not found.'},404);const b=await request.json().catch(()=>({})),mode=MODES.has(String(b.mode))?String(b.mode):old.mode,state=CAMPAIGN_STATES.has(String(b.status))?String(b.status):old.status;
  await env.DB.prepare('UPDATE cc_campaigns SET name=?,mode=?,status=?,queue_id=?,agent_id=?,caller_id=?,timezone=?,daily_cap=?,hourly_cap=?,max_attempts=?,retry_seconds=?,updated_at=? WHERE id=? AND tenant_id=?').bind(clean(b.name)||old.name,mode,state,b.queue_id??old.queue_id,b.agent_id??old.agent_id,clean(b.caller_id??old.caller_id),clean(b.timezone??old.timezone)||'UTC',Number(b.daily_cap??old.daily_cap),Number(b.hourly_cap??old.hourly_cap),Number(b.max_attempts??old.max_attempts),Number(b.retry_seconds??old.retry_seconds),now(),item[1],tenant).run();return json({ok:true});
 }
 const enroll=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/enroll$/);
 if(enroll&&request.method==='POST'){
  const campaign=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(enroll[1],tenant).first();if(!campaign)return json({detail:'Campaign not found.'},404);const b=await request.json().catch(()=>({})),ts=now();let added=0,skipped=0;
  const leads=Array.isArray(b.lead_ids)&&b.lead_ids.length?(await env.DB.prepare(`SELECT id,first_name,last_name,phone FROM leads WHERE tenant_id=? AND id IN (${b.lead_ids.map(()=>'?').join(',')})`).bind(tenant,...b.lead_ids.map(Number)).all()).results||[]:[];
  const contacts=[...leads.map(x=>({lead_id:x.id,phone:x.phone,display_name:`${x.first_name||''} ${x.last_name||''}`.trim()})),...(Array.isArray(b.contacts)?b.contacts:[])];
  for(const c of contacts){const p=phone(c.phone);if(!validE164(p)){skipped++;continue}try{await env.DB.prepare('INSERT INTO cc_campaign_members(id,tenant_id,campaign_id,lead_id,phone,display_name,status,attempts,next_attempt_at,consent_confirmed,timezone,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,campaign.id,c.lead_id||null,p,clean(c.display_name||c.name),'pending',0,ts,c.consent_confirmed===true||b.consent_confirmed===true?1:0,clean(c.timezone),ts,ts).run();added++}catch{skipped++}}
  return json({added,skipped,consent_required:true},201);
 }
 const next=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/next$/);
 if(next&&request.method==='POST'){
  const campaign=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(next[1],tenant).first();if(!campaign)return json({detail:'Campaign not found.'},404);if(campaign.status!=='active')return json({detail:'Campaign must be active before dialing.',code:'CAMPAIGN_NOT_ACTIVE'},409);if(!insideCallingWindow(campaign))return json({detail:`Campaign calling is limited to 08:00–20:00 in ${campaign.timezone}.`,code:'QUIET_HOURS'},409);
  const dayCount=await outboundCount(env,tenant,campaign.id,now()-86400),hourCount=await outboundCount(env,tenant,campaign.id,now()-3600);if(dayCount>=Number(campaign.daily_cap))return json({detail:'Campaign daily call cap reached.',code:'DAILY_CAP'},429);if(hourCount>=Number(campaign.hourly_cap))return json({detail:'Campaign hourly call cap reached.',code:'HOURLY_CAP'},429);
  const member=await env.DB.prepare(`SELECT m.* FROM cc_campaign_members m WHERE m.tenant_id=? AND m.campaign_id=? AND m.status IN ('pending','retry','ready') AND m.attempts<? AND (m.next_attempt_at IS NULL OR m.next_attempt_at<=?) AND (?=0 OR m.consent_confirmed=1) AND NOT EXISTS(SELECT 1 FROM voice_do_not_call d WHERE d.tenant_id=m.tenant_id AND d.phone=m.phone) ORDER BY COALESCE(m.next_attempt_at,0),m.created_at LIMIT 1`).bind(tenant,campaign.id,Number(campaign.max_attempts),now(),Number(campaign.consent_required)).first();
  if(!member)return json({detail:'No eligible, consented contacts are ready to dial.',code:'NO_ELIGIBLE_CONTACT'},404);await env.DB.prepare("UPDATE cc_campaign_members SET status='ready',updated_at=? WHERE id=? AND tenant_id=?").bind(now(),member.id,tenant).run();return json({campaign,member:{...member,status:'ready'},dial_endpoint:'/api/phone/calls/outbound',required_payload:{to:member.phone,contact_id:member.lead_id||null,queue_id:campaign.queue_id||null,agent_id:campaign.agent_id||null,consent_confirmed:true,ai_disclosure_accepted:true},compliance:{dnc_checked:true,quiet_hours_checked:true,hourly_cap:Number(campaign.hourly_cap),daily_cap:Number(campaign.daily_cap)}});
 }
 const dialStart=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/dial-start$/);
 if(dialStart&&request.method==='POST'){
  const b=await request.json().catch(()=>({})),member=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND campaign_id=? AND tenant_id=?').bind(String(b.member_id||''),dialStart[1],tenant).first();
  if(!member)return json({detail:'Campaign contact not found.'},404);
  if(!['ready','pending','retry'].includes(String(member.status)))return json({detail:'Campaign contact is not ready to dial.',code:'MEMBER_NOT_READY'},409);
  await env.DB.prepare("UPDATE cc_campaign_members SET status='dialing',last_attempt_at=?,updated_at=? WHERE id=? AND tenant_id=?").bind(now(),now(),member.id,tenant).run();
  return json({ok:true,member_id:member.id,status:'dialing'});
 }
 const dialCancel=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/dial-cancel$/);
 if(dialCancel&&request.method==='POST'){
  const b=await request.json().catch(()=>({})),member=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND campaign_id=? AND tenant_id=?').bind(String(b.member_id||''),dialCancel[1],tenant).first();
  if(!member)return json({detail:'Campaign contact not found.'},404);
  if(member.status==='dialing')await env.DB.prepare("UPDATE cc_campaign_members SET status='ready',last_attempt_at=NULL,updated_at=? WHERE id=? AND tenant_id=?").bind(now(),member.id,tenant).run();
  return json({ok:true,member_id:member.id,status:member.status==='dialing'?'ready':member.status});
 }
 const result=path.match(/^\/api\/contact-center\/campaigns\/([^/]+)\/result$/);
 if(result&&request.method==='POST'){
  const campaign=await env.DB.prepare('SELECT * FROM cc_campaigns WHERE id=? AND tenant_id=?').bind(result[1],tenant).first();if(!campaign)return json({detail:'Campaign not found.'},404);const b=await request.json().catch(()=>({})),member=await env.DB.prepare('SELECT * FROM cc_campaign_members WHERE id=? AND campaign_id=? AND tenant_id=?').bind(String(b.member_id||''),campaign.id,tenant).first();if(!member)return json({detail:'Campaign contact not found.'},404);const code=clean(b.disposition)||'connected',disp=await env.DB.prepare('SELECT * FROM cc_dispositions WHERE tenant_id=? AND code=?').bind(tenant,code).first(),attempts=Number(member.attempts||0)+1,retry=disp?.retryable&&attempts<Number(campaign.max_attempts),state=code==='dnc'?'completed':retry?'retry':'completed',nextAt=retry?now()+Number(disp?.retry_seconds||campaign.retry_seconds):null;
  await env.DB.prepare('UPDATE cc_campaign_members SET status=?,attempts=?,last_attempt_at=?,next_attempt_at=?,disposition=?,updated_at=? WHERE id=? AND tenant_id=?').bind(state,attempts,now(),nextAt,code,now(),member.id,tenant).run();if(code==='dnc')await env.DB.prepare("INSERT OR REPLACE INTO voice_do_not_call(tenant_id,phone,reason,created_at) VALUES(?,?,?,?)").bind(tenant,member.phone,'campaign disposition',now()).run();return json({ok:true,status:state,next_attempt_at:nextAt});
 }
 return null;
}

function gatherTwiml(action,greeting){return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="dtmf speech" numDigits="1" timeout="6" speechTimeout="auto" action="${esc(action)}" method="POST"><Say>${esc(greeting)}</Say></Gather><Redirect method="POST">${esc(action)}</Redirect></Response>`}
function sayHangup(text){return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(text)}</Say><Hangup/></Response>`}

async function queueBrowserAgents(env,tenant,queueId,message='Please hold while I connect you to an available agent.'){
 let agents=[];
 try{
  if(queueId){
   const q=await env.DB.prepare("SELECT a.user_id,a.id FROM call_center_agents a JOIN call_queue_members m ON m.agent_id=a.id WHERE a.tenant_id=? AND a.active=1 AND a.status='available' AND m.queue_id=? ORDER BY COALESCE(a.last_assigned_at,0),a.updated_at LIMIT 10").bind(tenant,queueId).all();
   agents=q.results||[];
  }
  if(!agents.length){
   const q=await env.DB.prepare("SELECT user_id,id FROM call_center_agents WHERE tenant_id=? AND active=1 AND status='available' ORDER BY COALESCE(last_assigned_at,0),updated_at LIMIT 10").bind(tenant).all();
   agents=q.results||[];
  }
 }catch(_){agents=[]}
 const clients=agents.filter(a=>a.user_id).map(a=>softphoneIdentity({id:a.user_id}));
 if(!clients.length)return null;
 return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(message)}</Say><Dial answerOnBridge="true" timeout="25">${clients.map(identity=>`<Client>${esc(identity)}</Client>`).join('')}</Dial><Say>No agent answered. Please request a callback or leave a voicemail.</Say></Response>`;
}

async function twilioIncoming(request,env){
 if(!twilioReady(env))return xml(sayHangup('Telephone service is not configured.'),503);if(!await validTwilio(request,env))return xml(sayHangup('This call could not be authenticated.'),403);const form=await request.formData(),sid=clean(form.get('CallSid')),from=phone(form.get('From')),to=phone(form.get('To'));let tenant=clean(env.TWILIO_DEFAULT_TENANT_ID);if(!tenant){const r=await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' LIMIT 1").first();tenant=clean(r?.id)}if(!tenant)return xml(sayHangup('This line has not been assigned yet.'),503);await ensure(env);await seed(env,tenant);
 const blocked=from?await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(tenant,from).first():null;if(blocked)return xml(sayHangup('This number is on our do-not-call list. Goodbye.'));
 let call=sid?await env.DB.prepare('SELECT * FROM phone_calls WHERE provider_call_id=? ORDER BY id DESC LIMIT 1').bind(sid).first():null;if(!call){const ts=now(),r=await env.DB.prepare(`INSERT INTO phone_calls(tenant_id,direction,caller,callee,status,created_at,provider,provider_call_id,metadata_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(tenant,'inbound',from,to,'in-progress',ts,'twilio-contact-center',sid,JSON.stringify({inbound:true,contact_center:true}),ts).run();call=await env.DB.prepare('SELECT * FROM phone_calls WHERE id=?').bind(r.meta.last_row_id).first()}
 const flow=await env.DB.prepare('SELECT * FROM cc_ivr_flows WHERE tenant_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1').bind(tenant).first();if(!flow)return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${esc(new URL('/api/voice-agent/twilio/incoming',request.url).toString())}</Redirect></Response>`);
 const action=new URL('/api/contact-center/ivr/step',request.url);action.searchParams.set('tenant_id',tenant);action.searchParams.set('flow_id',flow.id);action.searchParams.set('call_id',String(call.id));return xml(gatherTwiml(action.toString(),flow.greeting||'Please choose an option.'));
}

async function ivrStep(request,env,url){
 if(!await validTwilio(request,env))return xml(sayHangup('This call could not be authenticated.'),403);const tenant=clean(url.searchParams.get('tenant_id')),flowId=clean(url.searchParams.get('flow_id')),callId=Number(url.searchParams.get('call_id')||0),flow=await env.DB.prepare('SELECT * FROM cc_ivr_flows WHERE id=? AND tenant_id=?').bind(flowId,tenant).first();if(!flow)return xml(sayHangup('The call menu is unavailable.'),404);const form=await request.formData(),digits=clean(form.get('Digits')),speech=clean(form.get('SpeechResult')).toLowerCase(),choice=digits||(/\bone\b/.test(speech)?'1':/\btwo\b/.test(speech)?'2':/\bthree\b/.test(speech)?'3':'');const nodes=safeJson(flow.nodes_json,{}),node=nodes[choice];if(!node){const retry=new URL('/api/contact-center/ivr/step',request.url);retry.search=url.search;return xml(gatherTwiml(retry.toString(),flow.invalid_message||'That selection was not recognized. Please try again.'))}
 const call=callId?await env.DB.prepare('SELECT * FROM phone_calls WHERE id=? AND tenant_id=?').bind(callId,tenant).first():null;const from=phone(call?.caller||form.get('From'));
 if(node.type==='ai')return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${esc(new URL('/api/voice-agent/twilio/incoming',request.url).toString())}</Redirect></Response>`);
 if(node.type==='forward'&&validE164(node.number))return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(node.message||'Please hold while I connect you.')}</Say><Dial>${esc(phone(node.number))}</Dial></Response>`);
 if(node.type==='queue'){
  const queueId=node.queue_id||flow.default_queue_id||null,twiml=await queueBrowserAgents(env,tenant,queueId,node.message||'Please hold while I connect you to an available agent.');
  if(twiml)return xml(twiml);
  const id=crypto.randomUUID(),ts=now();if(from)await env.DB.prepare('INSERT INTO cc_callbacks(id,tenant_id,queue_id,phone,display_name,status,requested_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,queueId,from,'','pending',ts,ts,ts).run();return xml(sayHangup('No agent is available right now. Your callback request has been saved.'));
 }
 if(node.type==='callback'){
  const id=crypto.randomUUID(),ts=now();if(from)await env.DB.prepare('INSERT INTO cc_callbacks(id,tenant_id,queue_id,phone,display_name,status,requested_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,node.queue_id||flow.default_queue_id||null,from,'','pending',ts,ts,ts).run();return xml(sayHangup(node.message||'Your callback request has been saved. We will contact you as soon as possible.'));
 }
 if(node.type==='voicemail'){
  const action=new URL('/api/contact-center/voicemail/recording',request.url);action.searchParams.set('tenant_id',tenant);action.searchParams.set('call_id',String(callId||0));action.searchParams.set('queue_id',node.queue_id||flow.default_queue_id||'');return xml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${esc(node.message||'Please leave your message after the tone. Press pound when finished.')}</Say><Record action="${esc(action.toString())}" method="POST" finishOnKey="#" maxLength="180" playBeep="true"/><Say>No recording was received. Goodbye.</Say></Response>`);
 }
 return xml(sayHangup(node.message||'Thank you for calling. Goodbye.'));
}

async function voicemailRecording(request,env,url){
 if(!await validTwilio(request,env))return xml(sayHangup('This recording could not be authenticated.'),403);const tenant=clean(url.searchParams.get('tenant_id')),callId=Number(url.searchParams.get('call_id')||0),queueId=clean(url.searchParams.get('queue_id'))||null,form=await request.formData(),recording=clean(form.get('RecordingUrl')),sid=clean(form.get('CallSid')),call=callId?await env.DB.prepare('SELECT * FROM phone_calls WHERE id=? AND tenant_id=?').bind(callId,tenant).first():null,from=phone(call?.caller||form.get('From')),id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO cc_voicemails(id,tenant_id,queue_id,phone,provider_call_id,recording_url,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,queueId,from,sid,recording,'new',ts,ts).run();if(callId)await env.DB.prepare("UPDATE phone_calls SET recording_url=?,status='completed',updated_at=? WHERE id=? AND tenant_id=?").bind(recording,ts,callId,tenant).run();return xml(sayHangup('Thank you. Your voicemail has been saved. Goodbye.'));
}

async function analyzeCall(env,tenant,callId){
 const existing=await env.DB.prepare('SELECT * FROM cc_call_intelligence WHERE tenant_id=? AND call_id=?').bind(tenant,callId).first();if(existing)return {...existing,topics:safeJson(existing.topics_json,[]),action_items:safeJson(existing.action_items_json,[]),qa_flags:safeJson(existing.qa_flags_json,[])};
 const call=await env.DB.prepare('SELECT * FROM phone_calls WHERE id=? AND tenant_id=?').bind(callId,tenant).first();if(!call)throw new Error('Call not found.');const turns=(await env.DB.prepare('SELECT speaker,text FROM voice_agent_turns WHERE tenant_id=? AND call_id=? ORDER BY id ASC LIMIT 100').bind(tenant,callId).all().catch(()=>({results:[]}))).results||[];const transcript=turns.map(x=>`${x.speaker}: ${x.text}`).join('\n').slice(0,16000)||`Call from ${call.caller||''} to ${call.callee||''}. Disposition: ${call.disposition||'unknown'}. Notes: ${call.notes||''}`;
 let result={summary:'Call intelligence is available after a transcript or call notes are captured.',sentiment:'unknown',topics:[],action_items:[],qa_flags:[],compliance_risk:'none'};
 if(env.AI){const prompt=`Analyze this contact-center interaction. Return ONLY JSON with keys summary (string), sentiment (positive|neutral|negative|mixed), topics (array of short strings), action_items (array of short strings), qa_flags (array of short coaching/compliance observations), compliance_risk (none|low|medium|high). Do not invent facts.\n\n${transcript}`;for(const model of [clean(env.CLOUDFLARE_AI_MODEL),'@cf/meta/llama-3.1-8b-instruct-fast','@cf/meta/llama-3.2-1b-instruct'].filter(Boolean)){try{const out=await env.AI.run(model,{messages:[{role:'user',content:prompt}],max_tokens:600}),raw=clean(out?.response||out?.result?.response||out?.result);const match=raw.match(/\{[\s\S]*\}/);if(match){const parsed=JSON.parse(match[0]);result={summary:clean(parsed.summary).slice(0,3000),sentiment:clean(parsed.sentiment)||'unknown',topics:Array.isArray(parsed.topics)?parsed.topics.slice(0,20):[],action_items:Array.isArray(parsed.action_items)?parsed.action_items.slice(0,20):[],qa_flags:Array.isArray(parsed.qa_flags)?parsed.qa_flags.slice(0,20):[],compliance_risk:clean(parsed.compliance_risk)||'none'};break}}catch{}}}
 await env.DB.prepare('INSERT OR REPLACE INTO cc_call_intelligence(call_id,tenant_id,summary,sentiment,topics_json,action_items_json,qa_flags_json,compliance_risk,generated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(callId,tenant,result.summary,result.sentiment,JSON.stringify(result.topics),JSON.stringify(result.action_items),JSON.stringify(result.qa_flags),result.compliance_risk,now()).run();return {call_id:callId,...result,generated_at:now()};
}

export async function handleContactCenter(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/contact-center'))return null;if(!env?.DB)return json({detail:'Contact center database is not configured.'},503);
 try{
  if((path==='/api/contact-center/carrier/incoming'||path==='/api/contact-center/twilio/incoming')&&request.method==='POST')return twilioIncoming(request,env);
  if(path==='/api/contact-center/ivr/step'&&request.method==='POST')return ivrStep(request,env,url);
  if(path==='/api/contact-center/voicemail/recording'&&request.method==='POST')return voicemailRecording(request,env,url);
  if(path==='/api/contact-center/softphone/outgoing'&&request.method==='POST')return softphoneOutgoing(request,env);
  if(path==='/api/contact-center/softphone/status'&&request.method==='POST')return softphoneStatus(request,env,url);
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use the contact center.'},401);const tenant=String(user.tenant_id);await seed(env,tenant);
  if(path==='/api/contact-center/softphone/config'&&request.method==='GET')return softphoneConfig(env,user,request);
  if(path==='/api/contact-center/softphone/native-session'&&request.method==='POST')return createNativeSoftphoneSession(env,user);
  const nativeSessionPath=path.match(/^\/api\/contact-center\/softphone\/native-session\/([^/]+)$/);if(nativeSessionPath&&request.method==='DELETE')return revokeNativeSoftphoneSession(env,user,decodeURIComponent(nativeSessionPath[1]));
  if(path==='/api/contact-center/softphone/claim'&&request.method==='POST')return softphoneClaim(env,user,await request.json().catch(()=>({})));
  if(path==='/api/contact-center/capabilities'&&request.method==='GET')return json({ok:true,providers:providerSnapshot(env),features:{acd:true,skills_routing:true,ivr:true,callbacks:true,voicemail:true,dnc:true,outbound_campaigns:true,dialer_modes:['preview','progressive','power'],predictive_mass_dialing:false,reason:'High-volume predictive automation is intentionally not enabled without carrier/compliance controls.',agent_presence:true,crm_screen_pop:true,recording:true,ai_call_intelligence:Boolean(env.AI),agent_assist:true,workforce_management:true,quality_management:true,analytics:true,omnichannel_inbox:true,free_browser_calling:true},inbound_webhook:`${url.origin}/api/contact-center/carrier/incoming`});
  if(path==='/api/contact-center/overview'&&request.method==='GET')return json({ok:true,...await overview(env,tenant)});
  const campaign=await campaignRoutes(request,env,user,url);if(campaign)return campaign;
  if(path==='/api/contact-center/ivr'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_ivr_flows WHERE tenant_id=? ORDER BY active DESC,updated_at DESC').bind(tenant).all();return json({flows:results.map(x=>({...x,nodes:safeJson(x.nodes_json,{}),business_hours:safeJson(x.business_hours_json,{})}))})}
  if(path==='/api/contact-center/ivr'&&request.method==='POST'){if(!owner(user))return json({detail:'Workspace owner access required.'},403);const b=await request.json().catch(()=>({})),id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO cc_ivr_flows(id,tenant_id,name,active,greeting,invalid_message,timeout_message,after_hours_message,business_hours_json,nodes_json,default_queue_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,clean(b.name)||'IVR Flow',b.active?1:0,clean(b.greeting),clean(b.invalid_message)||'That selection was not recognized.',clean(b.timeout_message)||'I did not receive a selection.',clean(b.after_hours_message)||'We are currently closed.',JSON.stringify(b.business_hours||{}),JSON.stringify(b.nodes||{}),b.default_queue_id||null,ts,ts).run();if(b.active)await env.DB.prepare('UPDATE cc_ivr_flows SET active=0 WHERE tenant_id=? AND id<>?').bind(tenant,id).run();return json({id},201)}
  const ivrItem=path.match(/^\/api\/contact-center\/ivr\/([^/]+)$/);if(ivrItem&&request.method==='PUT'){if(!owner(user))return json({detail:'Workspace owner access required.'},403);const old=await env.DB.prepare('SELECT * FROM cc_ivr_flows WHERE id=? AND tenant_id=?').bind(ivrItem[1],tenant).first();if(!old)return json({detail:'IVR flow not found.'},404);const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE cc_ivr_flows SET name=?,active=?,greeting=?,invalid_message=?,timeout_message=?,after_hours_message=?,business_hours_json=?,nodes_json=?,default_queue_id=?,updated_at=? WHERE id=? AND tenant_id=?').bind(clean(b.name??old.name)||old.name,b.active==null?old.active:(b.active?1:0),clean(b.greeting??old.greeting),clean(b.invalid_message??old.invalid_message),clean(b.timeout_message??old.timeout_message),clean(b.after_hours_message??old.after_hours_message),JSON.stringify(b.business_hours??safeJson(old.business_hours_json,{})),JSON.stringify(b.nodes??safeJson(old.nodes_json,{})),b.default_queue_id??old.default_queue_id,now(),ivrItem[1],tenant).run();if(b.active===true)await env.DB.prepare('UPDATE cc_ivr_flows SET active=0 WHERE tenant_id=? AND id<>?').bind(tenant,ivrItem[1]).run();return json({ok:true})}
  if(path==='/api/contact-center/callbacks'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_callbacks WHERE tenant_id=? ORDER BY CASE status WHEN \'pending\' THEN 0 WHEN \'scheduled\' THEN 1 ELSE 2 END,COALESCE(scheduled_at,requested_at) ASC LIMIT 500').bind(tenant).all();return json({callbacks:results})}
  if(path==='/api/contact-center/callbacks'&&request.method==='POST'){const b=await request.json().catch(()=>({})),p=phone(b.phone);if(!validE164(p))return json({detail:'A valid E.164 callback number is required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO cc_callbacks(id,tenant_id,queue_id,phone,display_name,status,requested_at,scheduled_at,assigned_agent_id,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,b.queue_id||null,p,clean(b.display_name),CALLBACK_STATES.has(String(b.status))?String(b.status):'pending',ts,b.scheduled_at?Number(b.scheduled_at):null,b.assigned_agent_id||null,clean(b.notes).slice(0,3000),ts,ts).run();return json({id},201)}
  const cb=path.match(/^\/api\/contact-center\/callbacks\/([^/]+)$/);if(cb&&request.method==='PUT'){const b=await request.json().catch(()=>({})),old=await env.DB.prepare('SELECT * FROM cc_callbacks WHERE id=? AND tenant_id=?').bind(cb[1],tenant).first();if(!old)return json({detail:'Callback not found.'},404);await env.DB.prepare('UPDATE cc_callbacks SET status=?,scheduled_at=?,assigned_agent_id=?,notes=?,updated_at=? WHERE id=? AND tenant_id=?').bind(CALLBACK_STATES.has(String(b.status))?String(b.status):old.status,b.scheduled_at??old.scheduled_at,b.assigned_agent_id??old.assigned_agent_id,clean(b.notes??old.notes).slice(0,3000),now(),cb[1],tenant).run();return json({ok:true})}
  if(path==='/api/contact-center/voicemails'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_voicemails WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500').bind(tenant).all();return json({voicemails:results})}
  const vm=path.match(/^\/api\/contact-center\/voicemails\/([^/]+)$/);if(vm&&request.method==='PUT'){const b=await request.json().catch(()=>({}));await env.DB.prepare('UPDATE cc_voicemails SET status=?,assigned_agent_id=?,transcription=?,updated_at=? WHERE id=? AND tenant_id=?').bind(clean(b.status)||'assigned',b.assigned_agent_id||null,clean(b.transcription).slice(0,12000),now(),vm[1],tenant).run();return json({ok:true})}
  if(path==='/api/contact-center/dispositions'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_dispositions WHERE tenant_id=? AND active=1 ORDER BY sort_order,label').bind(tenant).all();return json({dispositions:results})}
  if(path==='/api/contact-center/agent-assist'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_agent_assist_rules WHERE tenant_id=? AND active=1 ORDER BY priority,name').bind(tenant).all();return json({rules:results})}
  if(path==='/api/contact-center/agent-assist'&&request.method==='POST'){if(!owner(user))return json({detail:'Workspace owner access required.'},403);const b=await request.json().catch(()=>({})),phrase=clean(b.trigger_phrase),guidance=clean(b.guidance);if(!phrase||!guidance)return json({detail:'Trigger phrase and guidance are required.'},400);const id=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO cc_agent_assist_rules(id,tenant_id,name,trigger_phrase,guidance,queue_id,priority,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,clean(b.name)||phrase,phrase,guidance.slice(0,5000),b.queue_id||null,Number(b.priority||100),1,ts,ts).run();return json({id},201)}
  if(path==='/api/contact-center/agent-assist/match'&&request.method==='POST'){const b=await request.json().catch(()=>({})),text=clean(b.text).toLowerCase(),{results=[]}=await env.DB.prepare('SELECT * FROM cc_agent_assist_rules WHERE tenant_id=? AND active=1 ORDER BY priority LIMIT 100').bind(tenant).all();return json({matches:results.filter(r=>text.includes(String(r.trigger_phrase||'').toLowerCase())).slice(0,8)})}
  const intel=path.match(/^\/api\/contact-center\/calls\/(\d+)\/intelligence$/);if(intel&&request.method==='GET'){const row=await env.DB.prepare('SELECT * FROM cc_call_intelligence WHERE tenant_id=? AND call_id=?').bind(tenant,Number(intel[1])).first();return row?json({...row,topics:safeJson(row.topics_json,[]),action_items:safeJson(row.action_items_json,[]),qa_flags:safeJson(row.qa_flags_json,[])}):json({detail:'No analysis has been generated yet.'},404)}
  if(intel&&request.method==='POST')return json(await analyzeCall(env,tenant,Number(intel[1])));
  if(path==='/api/contact-center/supervisor/live'&&request.method==='GET'){const [calls,agents,rules]=await Promise.all([env.DB.prepare(`SELECT p.*,a.name agent_name,q.name queue_name FROM phone_calls p LEFT JOIN call_center_agents a ON a.id=p.agent_id LEFT JOIN call_queues q ON q.id=p.queue_id WHERE p.tenant_id=? AND p.status IN ('created','queued','dialing','ringing','connected','in-progress') ORDER BY p.created_at DESC LIMIT 100`).bind(tenant).all().catch(()=>({results:[]})),env.DB.prepare('SELECT * FROM call_center_agents WHERE tenant_id=? AND active=1 ORDER BY status,name').bind(tenant).all().catch(()=>({results:[]})),env.DB.prepare('SELECT * FROM cc_agent_assist_rules WHERE tenant_id=? AND active=1 ORDER BY priority').bind(tenant).all()]);return json({calls:calls.results||[],agents:agents.results||[],assist_rules:rules.results||[],supervisor_audio:{monitor:false,whisper:false,barge:false,note:'Audio monitor/whisper/barge requires a conference-capable carrier bridge or Twilio Voice SDK worker setup; live status and AI coaching are available now.'}})}
  if(path==='/api/contact-center/inbox'&&request.method==='GET'){const {results=[]}=await env.DB.prepare('SELECT * FROM cc_interactions WHERE tenant_id=? ORDER BY CASE status WHEN \'open\' THEN 0 WHEN \'pending\' THEN 1 ELSE 2 END,priority DESC,last_message_at DESC LIMIT 500').bind(tenant).all();const callbacks=(await env.DB.prepare("SELECT * FROM cc_callbacks WHERE tenant_id=? AND status IN ('pending','scheduled','assigned') ORDER BY requested_at DESC LIMIT 100").bind(tenant).all()).results||[],voicemails=(await env.DB.prepare("SELECT * FROM cc_voicemails WHERE tenant_id=? AND status IN ('new','assigned') ORDER BY created_at DESC LIMIT 100").bind(tenant).all()).results||[];return json({interactions:results,callbacks,voicemails})}
  if(path==='/api/contact-center/inbox'&&request.method==='POST'){const b=await request.json().catch(()=>({})),body=clean(b.body);if(!body)return json({detail:'Message body is required.'},400);const id=crypto.randomUUID(),mid=crypto.randomUUID(),ts=now(),channel=clean(b.channel)||'internal';await env.DB.prepare('INSERT INTO cc_interactions(id,tenant_id,channel,direction,customer_key,customer_name,subject,status,priority,queue_id,assigned_agent_id,sentiment,metadata_json,last_message_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,channel,clean(b.direction)||'inbound',clean(b.customer_key),clean(b.customer_name),clean(b.subject),INTERACTION_STATES.has(String(b.status))?String(b.status):'open',Math.min(Math.max(Number(b.priority||50),0),100),b.queue_id||null,b.assigned_agent_id||null,'unknown',JSON.stringify(b.metadata||{}),ts,ts,ts).run();await env.DB.prepare('INSERT INTO cc_interaction_messages(id,tenant_id,interaction_id,sender_type,sender_key,body,provider_message_id,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(mid,tenant,id,clean(b.sender_type)||'customer',clean(b.sender_key),body.slice(0,12000),clean(b.provider_message_id),ts).run();return json({id,message_id:mid},201)}
  return json({detail:'Contact center endpoint not found.'},404);
 }catch(error){return json({detail:error?.message||'Contact center runtime error.',code:'CONTACT_CENTER_ERROR'},500)}
}
