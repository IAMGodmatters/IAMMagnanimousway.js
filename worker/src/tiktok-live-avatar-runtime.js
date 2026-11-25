import { currentUser } from './integrations.js';
import { platformOwnerDeveloperIdentity } from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const MAX_SESSION_SECONDS=120;
const MAX_IDLE_SECONDS=30;
const MAX_MONTHLY_SESSIONS=20;
const MAX_PENDING_AGE_SECONDS=180;
const SIMLI_SESSION_URL='https://api.simli.ai/startAudioToVideoSession';
const SIMLI_ICE_URL='https://api.simli.ai/getIceServer';

function monthKey(date=new Date()){return date.toISOString().slice(0,7)}
function now(){return Math.floor(Date.now()/1000)}
function ready(env){return env?.SIMLI_AVATAR_ENABLED==='true'&&Boolean(String(env?.SIMLI_API_KEY||'').trim())&&Boolean(String(env?.SIMLI_FACE_ID||'').trim())}

async function providerPost(url,body){
 const response=await fetch(url,{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify(body),
  signal:AbortSignal.timeout(15000)
 });
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
 const row=await env.DB.prepare(
  "SELECT COUNT(*) AS issued FROM tiktok_live_avatar_sessions WHERE tenant_id=? AND usage_month=? AND state IN ('pending','issued')"
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
 if(path!=='/api/tiktok-live/avatar/usage'&&path!=='/api/tiktok-live/avatar/session')return json({detail:'Unknown live-avatar endpoint.'},404);
 if((path.endsWith('/usage')&&request.method!=='GET')||(path.endsWith('/session')&&request.method!=='POST'))return json({detail:'Method not allowed.'},405);
 if(!env?.DB)return json({detail:'The Magnanimous usage ledger is unavailable.'},503);
 const access=await authorizedOwner(request,env);
 if(access.response)return access.response;
 const user=access.user;
 const month=monthKey();
 const stamp=now();

 if(path.endsWith('/usage')){
  return json(await usage(env,user.tenant_id,month));
 }

 if(!ready(env)){
  return json({code:'SIMLI_AVATAR_NOT_CONFIGURED',detail:'The avatar gateway is safely disabled. The owner must configure SIMLI_AVATAR_ENABLED, SIMLI_API_KEY, and SIMLI_FACE_ID as server-side Worker settings before a session can start.'},503);
 }

 try{
  await env.DB.prepare(
   "UPDATE tiktok_live_avatar_sessions SET state='expired',updated_at=? WHERE state='pending' AND created_at<?"
  ).bind(stamp,stamp-MAX_PENDING_AGE_SECONDS).run();

  const reservationId=crypto.randomUUID();
  const reservation=await env.DB.prepare(`
   INSERT INTO tiktok_live_avatar_sessions
    (id,tenant_id,user_id,usage_month,session_seconds,state,created_at,updated_at)
   SELECT ?,?,?,?,?, 'pending',?,?
   WHERE (
    SELECT COUNT(*) FROM tiktok_live_avatar_sessions
    WHERE tenant_id=? AND usage_month=? AND state IN ('pending','issued')
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
   session=await providerPost(SIMLI_SESSION_URL,{
    apiKey:String(env.SIMLI_API_KEY),
    faceId:String(env.SIMLI_FACE_ID),
    handleSilence:false,
    maxSessionLength:MAX_SESSION_SECONDS,
    maxIdleTime:MAX_IDLE_SECONDS
   });
   if(!session.ok||!session.data?.session_token){
    await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='failed',updated_at=? WHERE id=?").bind(now(),reservationId).run();
    return json({code:'SIMLI_SESSION_UNAVAILABLE',detail:'Simli did not issue a valid short-lived session. No avatar session was returned to the browser.'},502);
   }

   const ice=await providerPost(SIMLI_ICE_URL,{apiKey:String(env.SIMLI_API_KEY)});
   if(!ice.ok||!ice.data){
    await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='failed',updated_at=? WHERE id=?").bind(now(),reservationId).run();
    return json({code:'SIMLI_ICE_UNAVAILABLE',detail:'Simli did not return ICE configuration. The browser connection was not started.'},502);
   }

   await env.DB.prepare("UPDATE tiktok_live_avatar_sessions SET state='issued',updated_at=? WHERE id=?").bind(now(),reservationId).run();
   return json({
    provider:'simli',
    session_token:session.data.session_token,
    ice_config:ice.data,
    max_session_length_seconds:MAX_SESSION_SECONDS,
    max_idle_time_seconds:MAX_IDLE_SECONDS,
    reservation_id:reservationId,
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
