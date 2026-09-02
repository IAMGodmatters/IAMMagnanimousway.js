import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';

const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const TYPES = new Set(['cancel', 'payment_method', 'billing_question']);
const STATUSES = new Set(['pending', 'in_progress', 'completed', 'rejected']);

async function ensureTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_management_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    request_type TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
}

export async function handleBillingSupport(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const customerPath = path === '/api/billing/management-request';
  const adminPath = path === '/api/admin/billing-requests' || /^\/api\/admin\/billing-requests\/\d+$/.test(path);
  if (!customerPath && !adminPath) return null;
  if (!env?.DB) return json({ detail: 'Database binding is not configured.' }, 503);
  await ensureTable(env);

  if (adminPath) {
    const denied = await requirePlatformOwner(request, env);
    if (denied) return denied;
    if (path === '/api/admin/billing-requests' && request.method === 'GET') {
      const status = String(url.searchParams.get('status') || '').trim();
      const filter = STATUSES.has(status) ? ' WHERE r.status=?' : '';
      const args = STATUSES.has(status) ? [status] : [];
      const { results } = await env.DB.prepare(`SELECT r.*,t.name workspace_name
        FROM billing_management_requests r
        LEFT JOIN tenants t ON t.id=r.tenant_id${filter}
        ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,r.created_at DESC LIMIT 500`)
        .bind(...args).all();
      return json({ requests: results || [] });
    }
    const match = path.match(/^\/api\/admin\/billing-requests\/(\d+)$/);
    if (match && request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const status = String(body.status || '').trim();
      if (!STATUSES.has(status)) return json({ detail: 'Invalid billing request status.' }, 400);
      await env.DB.prepare('UPDATE billing_management_requests SET status=?,updated_at=? WHERE id=?')
        .bind(status, now(), Number(match[1])).run();
      return json({ ok: true, status });
    }
    return json({ detail: 'Unsupported billing-management operation.' }, 405);
  }

  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT id,request_type,message,status,created_at,updated_at
      FROM billing_management_requests WHERE tenant_id=? ORDER BY created_at DESC LIMIT 20`)
      .bind(String(user.tenant_id)).all();
    return json({ requests: results || [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const requestType = String(body.request_type || '').trim();
    const message = String(body.message || '').trim().slice(0, 2000);
    if (!TYPES.has(requestType)) return json({ detail: 'Choose a valid billing request type.' }, 400);
    const existing = await env.DB.prepare(`SELECT id FROM billing_management_requests
      WHERE tenant_id=? AND request_type=? AND status IN ('pending','in_progress') ORDER BY created_at DESC LIMIT 1`)
      .bind(String(user.tenant_id), requestType).first();
    if (existing) return json({ detail: 'A matching billing request is already open.', request_id: existing.id }, 409);
    const ts = now();
    const result = await env.DB.prepare(`INSERT INTO billing_management_requests(
      tenant_id,user_id,email,request_type,message,status,created_at,updated_at
    ) VALUES(?,?,?,?,?,'pending',?,?)`).bind(
      String(user.tenant_id), String(user.id), String(user.email || ''), requestType, message, ts, ts
    ).run();
    return json({ id: result.meta.last_row_id, status: 'pending', detail: 'Your billing request was submitted to the platform owner.' }, 201);
  }

  return json({ detail: 'Unsupported billing-management operation.' }, 405);
}
