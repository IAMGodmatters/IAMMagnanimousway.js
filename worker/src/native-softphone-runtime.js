import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=v=>String(v||'').trim();
const runtimeTrue=v=>['1','true','yes','on'].includes(clean(v).toLowerCase());

export function nativeSoftphoneReady(env){
  return runtimeTrue(env.TELECOM_NATIVE_WEBRTC_LIVE)&&Boolean(clean(env.TELECOM_CORE_URL)&&clean(env.TELECOM_API_TOKEN));
}

function coreBase(env){
  const raw=clean(env.TELECOM_CORE_URL);
  if(!raw)return null;
  let url;
  try{url=new URL(raw)}catch{return null}
  const local=['localhost','127.0.0.1','::1'].includes(url.hostname);
  if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))return null;
  url.pathname=url.pathname.replace(/\/+$/,'');
  url.search='';url.hash='';
  return url;
}

async function ensure(env){
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS cc_native_softphone_sessions(
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(tenant_id,user_id)
    )
  `).run();
  await env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_native_softphone_session_id ON cc_native_softphone_sessions(session_id)').run();
}

async function coreRequest(env,path,options={}){
  const base=coreBase(env),token=clean(env.TELECOM_API_TOKEN);
  if(!base||!token)throw new Error('Native Telecom Core is not configured.');
  const url=new URL(path,base.toString().replace(/\/?$/,'/'));
  const headers=new Headers(options.headers||{});
  headers.set('Authorization',`Bearer ${token}`);
  headers.set('Accept','application/json');
  if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const response=await fetch(url.toString(),{...options,headers,redirect:'error'});
  const text=await response.text();
  let data={};
  try{data=text?JSON.parse(text):{}}catch{data={detail:text||`Telecom Core returned HTTP ${response.status}`}}
  if(!response.ok){
    const detail=clean(data?.detail)||`Telecom Core returned HTTP ${response.status}`;
    const error=new Error(detail);error.status=response.status;throw error;
  }
  return data;
}

function validSession(data){
  return Boolean(
    data&&
    /^web_\d+_[a-f0-9]+$/i.test(clean(data.session_id))&&
    clean(data.username)===clean(data.session_id)&&
    clean(data.password)&&
    clean(data.domain)&&
    /^wss:\/\//i.test(clean(data.wss_url))&&
    Number(data.expires_at)>Math.floor(Date.now()/1000)&&
    data.pstn_direct===false
  );
}

async function revokeCore(env,sessionId){
  if(!/^web_\d+_[a-f0-9]+$/i.test(clean(sessionId)))throw new Error('Invalid native WebRTC session identifier.');
  return coreRequest(env,`v1/webrtc/sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'});
}

async function issue(env,user){
  await ensure(env);
  if(!nativeSoftphoneReady(env))return json({detail:'Native Asterisk WebRTC is not production-live yet.',code:'NATIVE_WEBRTC_NOT_LIVE'},503);

  const existing=await env.DB.prepare(
    'SELECT session_id,expires_at FROM cc_native_softphone_sessions WHERE tenant_id=? AND user_id=?'
  ).bind(user.tenant_id,user.id).first().catch(()=>null);

  if(existing?.session_id){
    try{await revokeCore(env,existing.session_id)}
    catch(error){
      if(Number(existing.expires_at||0)>Math.floor(Date.now()/1000)){
        return json({detail:'The previous native browser session could not be revoked safely.',code:'NATIVE_SESSION_REVOKE_FAILED'},502);
      }
    }
    await env.DB.prepare('DELETE FROM cc_native_softphone_sessions WHERE tenant_id=? AND user_id=?')
      .bind(user.tenant_id,user.id).run();
  }

  let data;
  try{data=await coreRequest(env,'v1/webrtc/sessions',{method:'POST'})}
  catch(error){return json({detail:error?.message||'Unable to issue native WebRTC session.',code:'NATIVE_SESSION_ISSUE_FAILED'},502)}
  if(!validSession(data))return json({detail:'Telecom Core returned an invalid native WebRTC session contract.',code:'NATIVE_SESSION_INVALID'},502);

  const ts=Math.floor(Date.now()/1000);
  await env.DB.prepare(
    `INSERT INTO cc_native_softphone_sessions(tenant_id,user_id,session_id,expires_at,created_at,updated_at)
     VALUES(?,?,?,?,?,?)
     ON CONFLICT(tenant_id,user_id) DO UPDATE SET session_id=excluded.session_id,expires_at=excluded.expires_at,updated_at=excluded.updated_at`
  ).bind(user.tenant_id,user.id,data.session_id,Number(data.expires_at),ts,ts).run();

  return json({
    configured:true,
    provider:'Magnanimous Carrier',
    native_pbx:'Asterisk WebRTC',
    session_id:data.session_id,
    username:data.username,
    password:data.password,
    password_returned_once:true,
    domain:data.domain,
    wss_url:data.wss_url,
    expires_at:Number(data.expires_at),
    expires_in:Number(data.expires_in||0),
    allowed_call_scope:Array.isArray(data.allowed_call_scope)?data.allowed_call_scope:['internal-magnanimous','diagnostic-echo'],
    pstn_direct:false,
    transport_preference:'native-asterisk-webrtc',
    note:'Temporary native browser credential. Ordinary-number dialing remains behind Magnanimous carrier policy controls.'
  },201);
}

async function revoke(env,user,request){
  await ensure(env);
  const body=await request.json().catch(()=>({}));
  const requested=clean(body?.session_id);
  const existing=await env.DB.prepare(
    'SELECT session_id FROM cc_native_softphone_sessions WHERE tenant_id=? AND user_id=?'
  ).bind(user.tenant_id,user.id).first().catch(()=>null);
  if(!existing?.session_id)return json({ok:true,deleted:false});
  if(requested&&requested!==existing.session_id)return json({detail:'Native browser session does not belong to this signed-in user.'},403);
  try{await revokeCore(env,existing.session_id)}
  catch(error){return json({detail:error?.message||'Unable to revoke native WebRTC session.',code:'NATIVE_SESSION_REVOKE_FAILED'},502)}
  await env.DB.prepare('DELETE FROM cc_native_softphone_sessions WHERE tenant_id=? AND user_id=?')
    .bind(user.tenant_id,user.id).run();
  return json({ok:true,deleted:true,session_id:existing.session_id});
}

export async function handleNativeSoftphone(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/contact-center/softphone/native-session')return null;
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to use the native Magnanimous softphone.'},401);
  if(request.method==='POST')return issue(env,user);
  if(request.method==='DELETE')return revoke(env,user,request);
  return json({detail:'Method not allowed.'},405);
}
