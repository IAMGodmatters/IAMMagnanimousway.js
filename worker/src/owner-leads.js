const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const now = () => Math.floor(Date.now() / 1000);

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function sessionSecret(env) {
  const configured = String(env.SESSION_SECRET || '').trim();
  if (configured) return configured;
  const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
  return String(row?.value || '');
}

async function ownerFromRequest(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const parts = raw.slice(7).split('|');
  if (parts.length !== 5 || Number(parts[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = parts;
  if (role !== 'owner') return null;
  const secret = await sessionSecret(env);
  if (!secret) return null;
  const payload = `${userId}|${tenantId}|${role}|${exp}`;
  if (sig !== await hmac(secret, payload)) return null;
  const user = await env.DB.prepare('SELECT id,tenant_id,name,email,role,active,created_at FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
  return user?.role === 'owner' ? user : null;
}

async function ensureConsentTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS consent_records (
    user_id TEXT PRIMARY KEY,email TEXT NOT NULL,account_processing_consent INTEGER NOT NULL DEFAULT 0,
    account_processing_version TEXT NOT NULL,terms_accepted INTEGER NOT NULL DEFAULT 0,terms_version TEXT NOT NULL,
    marketing_consent INTEGER NOT NULL DEFAULT 0,consented_at INTEGER NOT NULL,marketing_updated_at INTEGER,
    source TEXT NOT NULL DEFAULT 'signup'
  )`).run();
}

export async function handleOwnerLeads(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/leads' || request.method !== 'GET') return null;

  const owner = await ownerFromRequest(request, env);
  if (!owner) return json({ detail: 'Owner access required.' }, 401);
  await ensureConsentTable(env);

  const q = String(url.searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 500), 1), 1000);
  const like = `%${q}%`;

  const query = `
    SELECT
      u.id,u.name,u.email,u.role,u.active,u.created_at,u.tenant_id,
      t.name AS workspace,t.slug AS workspace_slug,
      c.account_processing_consent,c.account_processing_version,c.terms_accepted,c.terms_version,
      c.marketing_consent,c.consented_at,c.marketing_updated_at,
      (SELECT MAX(a.created_at) FROM auth_events a WHERE a.user_id=u.id AND a.success=1 AND a.event IN ('login','signup')) AS last_activity,
      (SELECT COUNT(*) FROM auth_events a WHERE a.user_id=u.id AND a.success=1 AND a.event='login') AS login_count
    FROM users u
    LEFT JOIN tenants t ON t.id=u.tenant_id
    LEFT JOIN consent_records c ON c.user_id=u.id
    WHERE u.role <> 'owner'
      AND (? = '' OR u.name LIKE ? OR u.email LIKE ? OR t.name LIKE ?)
    ORDER BY u.created_at DESC
    LIMIT ?
  `;

  const { results } = await env.DB.prepare(query).bind(q, like, like, like, limit).all();
  const totalRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE role <> 'owner'").first();
  const activeRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE role <> 'owner' AND active=1").first();
  const recentRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE role <> 'owner' AND created_at>=?").bind(now()-86400).first();
  const marketingRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM consent_records WHERE marketing_consent=1').first();

  return json({
    leads: results || [],
    summary: {
      total: Number(totalRow?.total || 0),
      active: Number(activeRow?.total || 0),
      new_last_24h: Number(recentRow?.total || 0),
      marketing_opted_in: Number(marketingRow?.total || 0)
    }
  });
}
