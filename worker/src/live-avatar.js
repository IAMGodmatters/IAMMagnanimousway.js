import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

function apiKey(env){return String(env.LIVEAVATAR_API_KEY||env.HEYGEN_API_KEY||'').trim()}
function avatarId(env){return String(env.LIVEAVATAR_AVATAR_ID||env.HEYGEN_AVATAR_ID||'').trim()}
function configured(env){return Boolean(apiKey(env)&&avatarId(env))}

async function premiumAccess(user,env){
 if(user?.role==='owner')return true;
 try{
  const row=await env.DB.prepare("SELECT status FROM subscriptions WHERE tenant_id=? AND status IN ('active','trialing') LIMIT 1").bind(String(user.tenant_id)).first();
  return Boolean(row);
 }catch{return false}
}

async function createToken(env){
 const response=await fetch('https://api.liveavatar.com/v1/sessions/token',{
  method:'POST',
  headers:{'X-API-KEY':apiKey(env),'Content-Type':'application/json'},
  body:JSON.stringify({
   mode:'LITE',
   avatar_id:avatarId(env),
   is_sandbox:String(env.LIVEAVATAR_SANDBOX||'').toLowerCase()==='true'
  })
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  const detail=Array.isArray(data?.data)?data.data?.[0]?.message:data?.data?.message;
  const error=new Error(detail||data?.error||data?.message||`LiveAvatar rejected the session (${response.status}).`);
  error.status=response.status>=500?502:400;
  throw error;
 }
 const token=String(data?.data?.session_token||'');
 if(!token)throw new Error('LiveAvatar did not return a session token.');
 return {session_token:token,session_id:String(data?.data?.session_id||''),mode:'LITE'};
}

export async function handleLiveAvatar(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/live-avatar'))return null;
 if(!env?.DB)return json({error:'Video-assistant database binding is not configured.'},503);
 try{
  const user=await currentUser(request,env);
  if(!user)return json({error:'Sign in to use the video assistant.'},401);
  const premium=await premiumAccess(user,env);
  if(path==='/api/live-avatar/status'&&request.method==='GET')return json({configured:configured(env),premium,provider:'LiveAvatar',mode:'LITE',avatar_configured:Boolean(avatarId(env))});
  if(path==='/api/live-avatar/token'&&request.method==='POST'){
   if(!premium)return json({error:'Premium is required for the live human-like video assistant.'},402);
   if(!configured(env))return json({error:'The owner must connect a LiveAvatar API key and avatar ID first.'},503);
   return json(await createToken(env));
  }
  return json({error:'Video-assistant route not found.'},404);
 }catch(error){
  console.error('live avatar error',error);
  return json({error:error?.message||'LiveAvatar error.'},Number(error?.status||500));
 }
}
