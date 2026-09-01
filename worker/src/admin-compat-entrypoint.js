import providerApp from './provider-entrypoint.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const normEmail = (e) => String(e || '').trim().toLowerCase();
async function digest(value) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function hmac(secret, value) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const b = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(value)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function passwordHash(password, salt) { return digest(`${salt}:${password}`); }
async function makeSession(user, env) { const exp = now() + 604800; const payload = `${user.id}|${user.tenant_id}|${user.role}|${exp}`; return `${payload}|${await hmac(env.SESSION_SECRET || 'change-me', payload)}`; }
async function auth(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const p = raw.slice(7).split('|');
  if (p.length !== 5 || Number(p[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = p;
  if (sig !== await hmac(env.SESSION_SECRET || 'change-me', `${userId}|${tenantId}|${role}|${exp}`)) return null;
  return await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
}
async function ensureTables(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,url TEXT NOT NULL,label TEXT NOT NULL DEFAULT 'Sponsored',placement TEXT NOT NULL DEFAULT 'home',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL)").run();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/admin/')) {
        await ensureTables(env);
        if (url.pathname === '/api/admin/login' && request.method === 'POST') {
          const b = await request.json();
          const email = normEmail(b.email);
          const user = await env.DB.prepare("SELECT * FROM users WHERE email=? AND role='owner' AND active=1 ORDER BY created_at ASC LIMIT 1").bind(email).first();
          if (!user || (await passwordHash(String(b.password || ''), user.password_salt)) !== user.password_hash) return json({ detail: 'Invalid owner email or password' }, 401);
          return json({ token: await makeSession(user, env), user: { id: user.id, tenant_id: user.tenant_id, name: user.name, email: user.email, role: user.role } });
        }
        const user = await auth(request, env);
        if (!user || user.role !== 'owner') return json({ detail: 'Owner access required' }, 401);
        if (url.pathname === '/api/admin/settings' && request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT key,value FROM settings').all();
          const data = Object.fromEntries(results.map(r => [r.key, r.value]));
          return json({ site_name: data.site_name || 'I AM Magnanimous AI Platform', tagline: data.tagline || 'Free AI tools, Odin orchestration, and creator tools in one place.', canva_url: data.canva_url || '' });
        }
        if (url.pathname === '/api/admin/settings' && request.method === 'PUT') {
          const b = await request.json();
          const entries = [['site_name', b.site_name || 'I AM Magnanimous AI Platform'], ['tagline', b.tagline || ''], ['canva_url', b.canva_url || '']];
          for (const [k, v] of entries) await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, String(v)).run();
          return json({ ok: true });
        }
        if (url.pathname === '/api/admin/ads' && request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads ORDER BY id DESC').all();
          return json({ ads: results });
        }
        if (url.pathname === '/api/admin/ads' && request.method === 'POST') {
          const b = await request.json();
          const r = await env.DB.prepare('INSERT INTO ads(title,url,label,placement,active,created_at) VALUES(?,?,?,?,?,?)').bind(String(b.title || ''), String(b.url || ''), String(b.label || 'Sponsored'), String(b.placement || 'home'), b.active ? 1 : 0, now()).run();
          return json({ id: r.meta.last_row_id }, 201);
        }
        const m = url.pathname.match(/^\/api\/admin\/ads\/(\d+)$/);
        if (m && request.method === 'DELETE') { await env.DB.prepare('DELETE FROM ads WHERE id=?').bind(Number(m[1])).run(); return json({ ok: true }); }
      }
      return providerApp.fetch(request, env, ctx);
    } catch (e) {
      return json({ detail: e?.message || 'Server error' }, 500);
    }
  }
};
