import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const xml=(body,status=200)=>new Response(body,{status,headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});

async function ensureTables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_agent_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  elevenlabs_agent_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_agent_calls (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT '',
  to_number TEXT NOT NULL,
  from_number TEXT NOT NULL,
  twilio_call_sid TEXT NOT NULL DEFAULT '',
  conversation_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_agent_tokens (
  token TEXT PRIMARY KEY,
  call_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_tenant ON voice_agent_calls(tenant_id,created_at DESC)').run();
}

function cleanPhone(value){return String(value||'').trim().replace(/[\s().-]/g,'')}
function validE164(value){return /^\+[1-9]\d{7,14}$/.test(String(value||''))}
function configured(env){return Boolean(String(env.TWILIO_ACCOUNT_SID||'').trim()&&String(env.TWILIO_AUTH_TOKEN||'').trim()&&String(env.TWILIO_FROM_NUMBER||'').trim()&&String(env.ELEVENLABS_API_KEY||'').trim())}

async function premiumAccess(user,env){
 if(user?.role==='owner')return true;
 try{
  const row=await env.DB.prepare("SELECT status FROM subscriptions WHERE tenant_id=? AND status IN ('active','trialing') LIMIT 1").bind(String(user.tenant_id)).first();
  return Boolean(row);
 }catch{return false}
}

async function listProfiles(env){
 const {results}=await env.DB.prepare("SELECT id,name,active,created_at,updated_at FROM voice_agent_profiles WHERE active=1 ORDER BY created_at ASC").all();
 const profiles=results||[];
 if(String(env.ELEVENLABS_AGENT_ID||'').trim()&&!profiles.some(p=>p.id==='default'))profiles.unshift({id:'default',name:'Default Voice Assistant',active:1,created_at:0,updated_at:0});
 return profiles;
}

async function agentIdForProfile(env,profileId){
 if(!profileId||profileId==='default')return String(env.ELEVENLABS_AGENT_ID||'').trim();
 const row=await env.DB.prepare('SELECT elevenlabs_agent_id FROM voice_agent_profiles WHERE id=? AND active=1').bind(profileId).first();
 return String(row?.elevenlabs_agent_id||'').trim();
}

async function createProfile(request,env,user){
 if(user.role!=='owner')return json({error:'Owner access is required to configure platform voice agents.'},403);
 const body=await request.json().catch(()=>({}));
 const name=String(body.name||'').trim().slice(0,100);
 const agentId=String(body.agent_id||'').trim().slice(0,200);
 if(!name||!agentId)return json({error:'Agent name and ElevenLabs agent ID are required.'},400);
 const id=crypto.randomUUID(),ts=now();
 await env.DB.prepare('INSERT INTO voice_agent_profiles(id,name,elevenlabs_agent_id,active,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,name,agentId,1,String(user.id),ts,ts).run();
 return json({id,name,active:true},201);
}

async function removeProfile(env,user,id){
 if(user.role!=='owner')return json({error:'Owner access is required to configure platform voice agents.'},403);
 await env.DB.prepare('UPDATE voice_agent_profiles SET active=0,updated_at=? WHERE id=?').bind(now(),id).run();
 return json({ok:true});
}

async function twilioCreateCall(env,{to,twimlUrl,statusUrl}){
 const sid=String(env.TWILIO_ACCOUNT_SID||'').trim(),token=String(env.TWILIO_AUTH_TOKEN||'').trim(),from=cleanPhone(env.TWILIO_FROM_NUMBER);
 const form=new URLSearchParams();
 form.set('To',to);form.set('From',from);form.set('Url',twimlUrl);form.set('Method','POST');form.set('StatusCallback',statusUrl);form.set('StatusCallbackMethod','POST');
 for(const event of ['initiated','ringing','answered','completed'])form.append('StatusCallbackEvent',event);
 const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Calls.json`,{method:'POST',headers:{authorization:`Basic ${btoa(`${sid}:${token}`)}`,'content-type':'application/x-www-form-urlencoded'},body:form});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data?.message||`Twilio rejected the call (${response.status}).`);
 return data;
}

async function registerElevenLabsCall(env,{agentId,from,to,callId,tenantId}){
 const response=await fetch('https://api.elevenlabs.io/v1/convai/twilio/register-call',{method:'POST',headers:{'xi-api-key':String(env.ELEVENLABS_API_KEY||''),'content-type':'application/json'},body:JSON.stringify({agent_id:agentId,from_number:from,to_number:to,direction:'outbound',conversation_initiation_client_data:{dynamic_variables:{iam_call_id:callId,iam_tenant_id:String(tenantId)}}})});
 const text=await response.text();
 if(!response.ok){let message=text;try{const parsed=JSON.parse(text);message=parsed?.detail?.message||parsed?.detail||parsed?.message||text}catch{}throw new Error(String(message||`ElevenLabs rejected the call (${response.status}).`))}
 let twiml=text;try{const parsed=JSON.parse(text);if(typeof parsed==='string')twiml=parsed;else if(typeof parsed?.twiml==='string')twiml=parsed.twiml}catch{}
 if(!String(twiml).includes('<Response'))throw new Error('ElevenLabs did not return valid TwiML for the voice agent.');
 return String(twiml);
}

async function outbound(request,env,user){
 if(!(await premiumAccess(user,env)))return json({error:'Premium is required for automated telephone voice agents. Free browser calling remains available.'},402);
 if(!configured(env))return json({error:'Twilio and ElevenLabs voice-agent service credentials are not fully configured.'},503);
 const body=await request.json().catch(()=>({}));
 const to=cleanPhone(body.to_number||body.phone);
 if(!validE164(to))return json({error:'Enter the destination in E.164 format, for example +15551234567.'},400);
 const profileId=String(body.profile_id||'default');
 const agentId=await agentIdForProfile(env,profileId);
 if(!agentId)return json({error:'The selected voice agent is not configured.'},400);
 const from=cleanPhone(env.TWILIO_FROM_NUMBER);
 if(!validE164(from))return json({error:'The configured Twilio caller ID must be an E.164 phone number.'},503);
 const id=crypto.randomUUID(),token=crypto.randomUUID().replaceAll('-',''),ts=now(),origin=new URL(request.url).origin;
 await env.DB.prepare('INSERT INTO voice_agent_calls(id,tenant_id,user_id,profile_id,agent_id,to_number,from_number,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),profileId,agentId,to,from,'queued',ts,ts).run();
 await env.DB.prepare('INSERT INTO voice_agent_tokens(token,call_id,expires_at,created_at) VALUES(?,?,?,?)').bind(token,id,ts+1800,ts).run();
 try{
  const result=await twilioCreateCall(env,{to,twimlUrl:`${origin}/api/voice-agents/twiml?token=${encodeURIComponent(token)}`,statusUrl:`${origin}/api/voice-agents/status-webhook?token=${encodeURIComponent(token)}`});
  await env.DB.prepare('UPDATE voice_agent_calls SET twilio_call_sid=?,status=?,detail=?,updated_at=? WHERE id=?').bind(String(result.sid||''),String(result.status||'queued'),'',now(),id).run();
  return json({ok:true,call_id:id,status:String(result.status||'queued'),provider_call_id:String(result.sid||'')},201);
 }catch(error){await env.DB.prepare('UPDATE voice_agent_calls SET status=?,detail=?,updated_at=? WHERE id=?').bind('failed',String(error?.message||'Unable to place call').slice(0,1000),now(),id).run();throw error}
}

async function twimlRoute(request,env,url){
 const token=String(url.searchParams.get('token')||'');
 const link=token?await env.DB.prepare('SELECT token,call_id,expires_at FROM voice_agent_tokens WHERE token=?').bind(token).first():null;
 if(!link||Number(link.expires_at)<now())return xml('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice assistant session expired.</Say></Response>',403);
 const call=await env.DB.prepare('SELECT * FROM voice_agent_calls WHERE id=?').bind(link.call_id).first();
 if(!call)return xml('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',404);
 try{
  const twiml=await registerElevenLabsCall(env,{agentId:String(call.agent_id),from:String(call.from_number),to:String(call.to_number),callId:String(call.id),tenantId:String(call.tenant_id)});
  return xml(twiml);
 }catch(error){await env.DB.prepare('UPDATE voice_agent_calls SET status=?,detail=?,updated_at=? WHERE id=?').bind('failed',String(error?.message||'Voice agent connection failed').slice(0,1000),now(),call.id).run();return xml('<?xml version="1.0" encoding="UTF-8"?><Response><Say>The AI voice assistant is unavailable right now.</Say><Hangup/></Response>',200)}
}

async function statusWebhook(request,env,url){
 const token=String(url.searchParams.get('token')||'');
 const link=token?await env.DB.prepare('SELECT token,call_id,expires_at FROM voice_agent_tokens WHERE token=?').bind(token).first():null;
 if(!link||Number(link.expires_at)<now())return json({ok:false},403);
 const form=await request.formData().catch(()=>new FormData());
 const status=String(form.get('CallStatus')||'').toLowerCase()||'unknown';
 const sid=String(form.get('CallSid')||'');
 const duration=Math.max(0,Number(form.get('CallDuration')||0)||0);
 await env.DB.prepare('UPDATE voice_agent_calls SET twilio_call_sid=CASE WHEN ?<>\'\' THEN ? ELSE twilio_call_sid END,status=?,duration_seconds=CASE WHEN ?>0 THEN ? ELSE duration_seconds END,updated_at=? WHERE id=?').bind(sid,sid,status,duration,duration,now(),link.call_id).run();
 if(['completed','busy','failed','no-answer','canceled'].includes(status))await env.DB.prepare('DELETE FROM voice_agent_tokens WHERE token=?').bind(token).run();
 return json({ok:true});
}

export async function handleVoiceAgents(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/voice-agents'))return null;
 if(!env?.DB)return json({error:'Voice-agent database is not configured.'},503);
 try{
  await ensureTables(env);
  if(path==='/api/voice-agents/twiml'&&request.method==='POST')return twimlRoute(request,env,url);
  if(path==='/api/voice-agents/status-webhook'&&request.method==='POST')return statusWebhook(request,env,url);
  const user=await currentUser(request,env);
  if(!user)return json({error:'Sign in to use voice agents.'},401);
  if(path==='/api/voice-agents/status'&&request.method==='GET')return json({configured:configured(env),premium:await premiumAccess(user,env),twilio:Boolean(env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_FROM_NUMBER),elevenlabs:Boolean(env.ELEVENLABS_API_KEY),default_agent:Boolean(env.ELEVENLABS_AGENT_ID),profiles:await listProfiles(env)});
  if(path==='/api/voice-agents/profiles'&&request.method==='GET')return json({profiles:await listProfiles(env)});
  if(path==='/api/voice-agents/profiles'&&request.method==='POST')return createProfile(request,env,user);
  if(path.startsWith('/api/voice-agents/profiles/')&&request.method==='DELETE')return removeProfile(env,user,decodeURIComponent(path.split('/').pop()||''));
  if(path==='/api/voice-agents/outbound'&&request.method==='POST')return outbound(request,env,user);
  if(path==='/api/voice-agents/calls'&&request.method==='GET'){const {results}=await env.DB.prepare('SELECT id,profile_id,to_number,from_number,twilio_call_sid,conversation_id,status,duration_seconds,detail,created_at,updated_at FROM voice_agent_calls WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(String(user.tenant_id)).all();return json({calls:results||[]})}
  return json({error:'Voice-agent route not found.'},404);
 }catch(error){console.error('voice agent error',error);return json({error:error?.message||'Voice-agent error.'},500)}
}
