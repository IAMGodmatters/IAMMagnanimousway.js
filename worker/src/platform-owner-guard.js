import { currentUser } from './integrations.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const normEmail=value=>String(value||'').trim().toLowerCase();

export function configuredOwnerDeveloperEmail(env){
  return normEmail(env?.MAGNANIMOUS_DEVELOPER_EMAIL||env?.ADMIN_EMAIL||'');
}

export async function platformOwnerDeveloperIdentity(user,env){
  if(!env?.DB||!user)return{authorized:false,owner:false,developer:false};
  const configured=configuredOwnerDeveloperEmail(env);
  if(!configured||normEmail(user.email)!==configured)return{authorized:false,owner:false,developer:false};
  if(String(user.role||'').toLowerCase()!=='owner')return{authorized:false,owner:false,developer:false};
  const tenant=await env.DB.prepare("SELECT slug,owner_user_id FROM tenants WHERE id=? LIMIT 1").bind(String(user.tenant_id||'')).first().catch(()=>null);
  const authorized=String(tenant?.slug||'')==='owner'&&String(tenant?.owner_user_id||'')===String(user.id||'');
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
