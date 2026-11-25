import { currentUser } from './integrations.js';
import { platformOwnerDeveloperIdentity } from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const MAX_SESSION_SECONDS=120;
const MAX_IDLE_SECONDS=30;
const MAX_MONTHLY_SESSIONS=20;
const MAX_PENDING_AGE_SECONDS=180;
const SIMLI_SESSION_URL='https://api.simli.ai/compose/token';

function monthKey(date=new Date()){return date.toISOString().slice(0,7)}
function now(){return Math.floor(Date.now()/1000)}
function ready(env){return env?.SIMLI_AVATAR_ENABLED==='true'&&Boolean(String(env?.SIMLI_API_KEY||'').trim())&&Boolean(String(env?.SIMLI_FACE_ID||'').trim())}

async function providerRequest(url,apiKey,{method='POST',body=null}={}){
 const headers={'x-simli-api-key':apiKey,accept:'application/json'};
 const options={method,headers,signal:AbortSignal.timeout(15000)};
 if(body!==null){headers['content-type']='application/json';options.body=JSON.stringify(body);}
 const response=await fetch(url,options);
 const data=await response.json().catch(()=>null);
 return{ok:response.ok,status:response.status,data};
}

async function authorizedOwner(request,env){
 const user=await currentUser(request,env);
 if(!user)return{response:json({detail:'Sign in to Magnanimous before using the live avatar.'},401)};
 const identity=await platformOwnerDeveloperIdentity(user,env);
 if(!identity.authorized)return{response:json({detail:'Only the platform owner can use the initial Simli avatar trial.'},403)};
 return{user};
}

async function usage(env,tenantId,month){
 const stamp=now();
 // An issued session is provider-limited to 120 seconds plus a 30-second idle
 // window. Reclaim its live slot after that bound, but keep it counted in the
 // monthly reservation total so repeated start/stop calls cannot bypass quotas.
 await env.DB.prepare(
  "UPDATE tiktok_live_avatar_sessions SET state='expired',updated_at=? WHERE tenant_id=? AND usage_month=? AND state IN ('pending','issued') AND updated_at<?"
 ).bind(stamp,tenantId,month,stamp-MAX_SESSION_SECONDS-MAX_IDLE_SECONDS-30).run();
 const row=await env.DB.prepare(
  "SELECT COUNT(*) AS issued FROM tiktok_live_avatar_sessions WHERE tenant_id=? AND usage_month=? AND state IN ('pending','issued','ended','expired','failed')"
 ).bind(tenantId,month).first();
 const used=Number(row?.issued||0);
 return{
  provider:'simli',
  enabled:env.SIMLI_AVATAR_ENABLED==='true',
  configured:Boolean(String(env.SIMLI_API_KEY||'').trim()&&String(env.SIMLI_FACE_ID||'').trim()),
  usage_month:month,
  reserved_sessions:used,
  remaining_sessions:Math.max(0,MAX_MONTHLY_SESSIONS-used),
  session_limit_seconds:MAX_SESSION_SECONDS,
  monthly_reserved_limit_minutes:MAX_MONTHLY_SESSIONS*MAX_SESSION_SECONDS/60,
  status:ready(env)?'ready':'not_configured'
 };
}

export async function handleTikTokLiveAvatar(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/tiktok-live/avatar/'))return null;
 if(!['/api/tiktok-live/avatar/usage','/api/tiktok-live/avatar/session','/api/tiktok-live/avatar/end'].includes(path))return json({detail:'Unknown live-avatar endpoint.'},404);
 if((path.endsWith('/usage')&&request.method!=='GET')||((path.endsWith('/session')||path.endsWith('/end'))&&request.method!=='POST'))return json({detail:'Method not allowed.'},405);
 if(!env?.DB)return json({detail:'The Magnanimous usage ledger is unavailable.'},503);
 const access=await authorizedOwner(request,env);
 if(access.response)return access.response;
 const user=access.user;
 const month=monthKey();
 const stamp=now();

 if(path.endsWith('/usage')){
  return json(await usage(env,user.tenant_id,month));
 }

 if(path.endsWith('/end')){
  let body;
  try{body=await request.json()}catch{return json({detail:'A valid JSON reservation_id is required.'},400)}
  const reservationId=String(body?.reservation_id||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(reservationId))return json({detail:'Invalid avatar reservation ID.'},400);
  const result=await env.DB.prepare(
   "UPDATE tiktok_live_avatar_sessions SET state='ended',updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND state='issued' RETURNING id"
  ).bind(stamp,reservationId,user.tenant_id,user.id).first();
  if(!result?.id)return json({code:'SIMLI_RESERVATION_NOT_ACTIVE',detail:'This avatar reservation is not active or does not belong to this account.'},404);
  return json({ok:true,usage:await usage(env,user.tenant_id,month)});
 }

 if(!ready(env)){
  return json({code:'SIMLI_AVATAR_NOT_CONFIGURED',detail:'The avatar gateway is safely disabled. The owner must configure SIMLI_AVATAR_ENABLED, SIMLI_API_KEY, and SIMLI_FACE_ID as server-side Worker settings before a session can start.'},503);
 }

 try{
  await env.DB.prepare(
   "UPDATE tiktok_live_avatar_sessions SET state='expired',updated_at=? WHERE tenant_id=? AND usage_month=? AND state='pending' AND created_at<?"
  ).bind(stamp,user.tenant_id,month,stamp-MAX_PENDING_AGE_SECONDS).run();

  const reservationId=crypto.randomUUID();
  const reservation=await env.DB.prepare(`
   INSERT INTO tiktok_live_avatar_sessions
    (id,tenant_id,user_id,usage_month,session_seconds,state,created_at,updated_at)
   SELECT ?,?,?,?,?, 'pending',?,?
   WHERE (
    SELECT COUNT(*) FROM tiktok_live_avatar_sessions
    WHERE tenant_id=? AND usage_month=? AND state IN ('pending','issued','ended','expired')
   ) < ?
   RETURNING id
  `).bind(
   reservationId,user.tenant_id,user.id,month,MAX_SESSION_SECONDS,stamp,stamp,
   user.tenant_id,month,MAX_MONTHLY_SESSIONS
  ).first();

  if(!reservation?.id){
   return json({code:'SIMLI_MONTHLY_TRIAL_LIMIT',detail:'The conservative monthly avatar trial allowance has been reached. This gateway reserves up to 40 minutes per month, leaving a safety margin below Simli’s 50-minute free tier.'},429);
  }

  let session;
  try{
   // The installed browser SDK is SimliClient's WebRTC P2P path. Its current
   // backend-auth contract requires a short-lived Compose token plus ICE config.
   // The account API key never leaves this Worker.
   const apiKey=String(env.SIMLI_API_KEY);
   // Official simli-client 3.2.0 uses LiveKit by default. Its documented
   // /compose/token API takes a flat SimliSessionRequest; no P2P ICE lookup.
   session=await providerRequest(SIMLI_SESSION_URL,apiKey,{body:{
    faceId:String(env.SIMLI_FACE_ID),
    handleSilence:false,
    maxSessionLength:MAX_SESSION_SECONDS,
    maxIdleTime:MAX_IDLE_SECONDS,
    audioInputFormat:'pcm16'
   }});
   if(!session.ok||!session.data?.session_token){
    await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='failed',updated_at=? WHERE id=?").bind(now(),reservationId).run();
    return json({code:'SIMLI_SESSION_UNAVAILABLE',detail:'Simli did not issue a valid short-lived session. No avatar session was returned to the browser.'},502);
   }

   await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='issued',updated_at=? WHERE id=?").bind(now(),reservationId).run();
   return json({
    provider:'simli',
    transport_mode:'livekit',
    session_token:session.data.session_token,
    warnings:Array.isArray(session.data.warnings)?session.data.warnings:[],
    max_session_length_seconds:MAX_SESSION_SECONDS,
    max_idle_time_seconds:MAX_IDLE_SECONDS,
    reservation_id:reservationId,
    audio_input_format:'pcm16',
    audio_sample_rate_hz:16000,
    disclosure:'AI-generated avatar. Magnanimous AI controls the response; Simli renders the approved voice and face.'
   });
  }catch(error){
   await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='failed',updated_at=? WHERE id=?").bind(now(),reservationId).run().catch(()=>null);
   return json({code:'SIMLI_GATEWAY_ERROR',detail:'The secure avatar session could not be prepared. No provider credentials were sent to the browser.'},502);
  }
 }catch(error){
  return json({code:'SIMLI_USAGE_LEDGER_ERROR',detail:'The usage reservation could not be recorded. The avatar session was not started.'},503);
 }
}
