import { currentUser } from './integrations.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const normEmail=value=>String(value||'').trim().toLowerCase();
const DEFAULT_OWNER_DEVELOPER_EMAIL_SHA256='07957f2ea6887b3a4c605e931cded58fa57bf20acda074181d005bd6bc255327';

async function sha256Hex(value){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export function configuredOwnerDeveloperEmail(env){
  return normEmail(env?.MAGNANIMOUS_DEVELOPER_EMAIL||env?.ADMIN_EMAIL||'');
}

export function configuredOwnerDeveloperEmailHash(env){
  return String(env?.MAGNANIMOUS_OWNER_DEVELOPER_EMAIL_SHA256||DEFAULT_OWNER_DEVELOPER_EMAIL_SHA256).trim().toLowerCase();
}

export async function matchesOwnerDeveloperEmail(email,env){
  const normalized=normEmail(email);
  if(!normalized)return false;
  const configured=configuredOwnerDeveloperEmail(env);
  if(configured)return normalized===configured;
  const expected=configuredOwnerDeveloperEmailHash(env);
  if(!/^[a-f0-9]{64}$/.test(expected))return false;
  return (await sha256Hex(normalized))===expected;
}

export async function platformOwnerDeveloperIdentity(user,env){
  if(!env?.DB||!user)return{authorized:false,owner:false,developer:false};
  if(!(await matchesOwnerDeveloperEmail(user.email,env)))return{authorized:false,owner:false,developer:false};
  if(String(user.role||'').toLowerCase()!=='owner')return{authorized:false,owner:false,developer:false};
  const tenant=await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' AND owner_user_id=? LIMIT 1").bind(String(user.id||'')).first().catch(()=>null);
  const authorized=Boolean(tenant?.id);
  return{authorized,owner:authorized,developer:authorized};
}

export async function requirePlatformOwner(request, env) {
  if (!env?.DB) return json({ detail: 'Database binding is not configured.' }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Platform owner sign-in required.' }, 401);
  const identity=await platformOwnerDeveloperIdentity(user,env);
  if (!identity.authorized) return json({ detail: 'Platform owner/developer access required.' }, 403);
  return null;
}
