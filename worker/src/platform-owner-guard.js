import { currentUser } from './integrations.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

export async function requirePlatformOwner(request, env) {
  if (!env?.DB) return json({ detail: 'Database binding is not configured.' }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Platform owner sign-in required.' }, 401);
  if (String(user.role || '') !== 'owner') return json({ detail: 'Platform owner access required.' }, 403);
  const tenant = await env.DB.prepare('SELECT slug FROM tenants WHERE id=? LIMIT 1').bind(String(user.tenant_id || '')).first();
  if (String(tenant?.slug || '') !== 'owner') return json({ detail: 'Platform owner access required.' }, 403);
  return null;
}
