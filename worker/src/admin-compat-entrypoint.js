import providerApp from './provider-entrypoint.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const normEmail = (e) => String(e || '').trim().toLowerCase();
const makeId = () => crypto.randomUUID();
async function digest(value) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function hmac(secret, value) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const b = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(value)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function passwordHash(password, salt) { return digest(`${salt}:${password}`); }
function authSecret(env) { return String(env.SESSION_SECRET || '').trim(); }
async function makeSession(user, env) { const secret = authSecret(env); if (!secret) throw new Error('Authentication is not configured. Add SESSION_SECRET in Cloudflare Worker secrets.'); const exp = now() + 604800; const payload = `${user.id}|${user.tenant_id}|${user.role}|${exp}`; return `${payload}|${await hmac(secret, payload)}`; }
async function auth(request, env) {
  const secret = authSecret(env); if (!secret) return null;
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const p = raw.slice(7).split('|'); if (p.length !== 5 || Number(p[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = p;
  if (sig !== await hmac(secret, `${userId}|${tenantId}|${role}|${exp}`)) return null;
  return await env.DB.prepare('SELECT id,tenant_id,name,email,role,active,created_at FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
}
async function ensureTables(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,owner_user_id TEXT,created_at INTEGER NOT NULL)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,UNIQUE(tenant_id,email))").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS auth_events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,tenant_id TEXT,email TEXT NOT NULL,event TEXT NOT NULL,success INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_auth_events_user ON auth_events(user_id,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,url TEXT NOT NULL,label TEXT NOT NULL DEFAULT 'Sponsored',placement TEXT NOT NULL DEFAULT 'home',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL)").run();
}
async function logAuth(env, user, event, success = 1, email = '') {
  try { await env.DB.prepare('INSERT INTO auth_events(user_id,tenant_id,email,event,success,created_at) VALUES(?,?,?,?,?,?)').bind(user?.id || null, user?.tenant_id || null, email || user?.email || '', event, success ? 1 : 0, now()).run(); } catch (_) {}
}
async function signup(request, env) {
  const b = await request.json();
  const email = normEmail(b.email), name = String(b.name || '').trim(), password = String(b.password || '');
  if (!name || !email || password.length < 8) return json({ detail: 'Name, email, and a password of at least 8 characters are required.' }, 400);
  if (!authSecret(env)) return json({ detail: 'Authentication is not configured. Add SESSION_SECRET to the Worker secrets.' }, 503);
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email=? AND active=1 LIMIT 1').bind(email).first();
  if (existing) return json({ detail: 'An account with that email already exists. Please sign in instead.' }, 409);
  let slug = String(b.workspace || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace';
  if (await env.DB.prepare('SELECT id FROM tenants WHERE slug=?').bind(slug).first()) slug = `${slug}-${Math.floor(Math.random() * 9999)}`;
  const tid = makeId(), uid = makeId(), salt = makeId(), ph = await passwordHash(password, salt), created = now();
  await env.DB.prepare('INSERT INTO tenants(id,name,slug,owner_user_id,created_at) VALUES(?,?,?,?,?)').bind(tid, String(b.workspace || name), slug, uid, created).run();
  await env.DB.prepare('INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(uid, tid, name, email, 'member', ph, salt, 1, created).run();
  await logAuth(env, { id: uid, tenant_id: tid, email }, 'signup', 1, email);
  const user = { id: uid, tenant_id: tid, name, email, role: 'member', active: 1, created_at: created };
  return json({ token: await makeSession(user, env), user }, 201);
}
async function login(request, env) {
  const b = await request.json(), email = normEmail(b.email), password = String(b.password || '');
  if (!email || !password) return json({ detail: 'Email and password are required.' }, 400);
  if (!authSecret(env)) return json({ detail: 'Authentication is not configured. Add SESSION_SECRET to the Worker secrets.' }, 503);
  const user = await env.DB.prepare('SELECT * FROM users WHERE email=? AND active=1 ORDER BY created_at ASC LIMIT 1').bind(email).first();
  if (!user) { await logAuth(env, null, 'login', 0, email); return json({ detail: 'Invalid email or password.' }, 401); }
  if ((await passwordHash(password, user.password_salt)) !== user.password_hash) { await logAuth(env, user, 'login', 0, email); return json({ detail: 'Invalid email or password.' }, 401); }
  await logAuth(env, user, 'login', 1, email);
  return json({ token: await makeSession(user, env), user: { id: user.id, tenant_id: user.tenant_id, name: user.name, email: user.email, role: user.role, active: user.active } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      await ensureTables(env);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type, Authorization' } });

      // Public account API lives here, before the provider/static fallback. This
      // guarantees the browser receives JSON rather than frontend HTML for auth.
      if (url.pathname === '/api/auth/signup' && request.method === 'POST') return await signup(request, env);
      if (url.pathname === '/api/auth/login' && request.method === 'POST') return await login(request, env);
      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        const user = await auth(request, env);
        return user ? json({ user }) : json({ detail: 'Not authenticated.' }, 401);
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') return json({ ok: true });

      if (url.pathname === '/api/auth/audit' && request.method === 'GET') {
        const owner = await auth(request, env);
        if (!owner || owner.role !== 'owner') return json({ detail: 'Owner access required.' }, 401);
        const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 500);
        const { results } = await env.DB.prepare('SELECT id,user_id,tenant_id,email,event,success,created_at FROM auth_events ORDER BY id DESC LIMIT ?').bind(limit).all();
        return json({ events: results || [] });
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (url.pathname === '/api/admin/login' && request.method === 'POST') return await login(request, env);
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
