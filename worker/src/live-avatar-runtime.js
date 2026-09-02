const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sessionSecret(env) {
  const configured = String(env.SESSION_SECRET || '').trim();
  if (configured) return configured;
  try {
    const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
    return String(row?.value || '');
  } catch (_) { return ''; }
}

async function currentUser(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const parts = raw.slice(7).split('|');
  if (parts.length !== 5 || Number(parts[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = parts;
  const secret = await sessionSecret(env);
  if (!secret || !safeEqual(sig, await hmac(secret, `${userId}|${tenantId}|${role}|${exp}`))) return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1')
    .bind(userId, tenantId).first();
}

async function tenantPlan(env, user) {
  if (user?.role === 'owner') return 'owner';
  try {
    const row = await env.DB.prepare("SELECT COALESCE(plan,'free') plan FROM tenants WHERE id=?").bind(user.tenant_id).first();
    return String(row?.plan || 'free');
  } catch (_) { return 'free'; }
}

function profiles(env) {
  const out = [];
  const raw = String(env.LIVEAVATAR_PROFILES_JSON || '').trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const avatarId = String(item?.avatar_id || '').trim();
          const contextId = String(item?.context_id || '').trim();
          if (!avatarId || !contextId) continue;
          out.push({
            id: String(item?.id || `assistant-${out.length + 1}`).trim(),
            name: String(item?.name || `Assistant ${out.length + 1}`).trim(),
            avatar_id: avatarId,
            context_id: contextId
          });
        }
      }
    } catch (_) {}
  }
  const avatarId = String(env.LIVEAVATAR_AVATAR_ID || '').trim();
  const contextId = String(env.LIVEAVATAR_CONTEXT_ID || '').trim();
  if (!out.length && avatarId && contextId) {
    out.push({ id: 'primary', name: String(env.LIVEAVATAR_NAME || 'I AM Virtual Assistant'), avatar_id: avatarId, context_id: contextId });
  }
  return out;
}

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS avatar_sessions (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
    profile_id TEXT NOT NULL, mode TEXT NOT NULL, created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_avatar_sessions_tenant_day ON avatar_sessions(tenant_id,created_at)').run();
}

async function config(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  const plan = await tenantPlan(env, user);
  const items = profiles(env);
  return json({
    configured: Boolean(env.LIVEAVATAR_API_KEY && items.length),
    plan,
    sandbox: plan === 'free',
    profiles: items.map(p => ({ id: p.id, name: p.name })),
    daily_limit: plan === 'owner' ? null : Number(plan === 'business' ? (env.LIVEAVATAR_BUSINESS_DAILY_LIMIT || 10) : (env.LIVEAVATAR_FREE_DAILY_LIMIT || 20)),
    provider: 'LiveAvatar'
  });
}

async function createSession(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  const items = profiles(env);
  if (!env.LIVEAVATAR_API_KEY || !items.length) {
    return json({ detail: 'LiveAvatar is not configured yet.', code: 'LIVEAVATAR_NOT_CONFIGURED' }, 503);
  }
  const body = await request.json().catch(() => ({}));
  const requestedId = String(body.profile_id || items[0].id);
  const profile = items.find(p => p.id === requestedId) || items[0];
  const plan = await tenantPlan(env, user);
  const production = plan !== 'free' && body.sandbox !== true;
  const mode = production ? 'production' : 'sandbox';

  await ensureSchema(env);
  if (plan !== 'owner') {
    const startOfDay = now() - (now() % 86400);
    const limit = Math.max(1, Number(production ? (env.LIVEAVATAR_BUSINESS_DAILY_LIMIT || 10) : (env.LIVEAVATAR_FREE_DAILY_LIMIT || 20)));
    const used = await env.DB.prepare('SELECT COUNT(*) count FROM avatar_sessions WHERE tenant_id=? AND mode=? AND created_at>=?')
      .bind(user.tenant_id, mode, startOfDay).first();
    if (Number(used?.count || 0) >= limit) {
      return json({ detail: `Daily ${mode} avatar session limit reached. Try again after the daily reset.`, code: 'AVATAR_DAILY_LIMIT', limit }, 429);
    }
  }

  const response = await fetch('https://api.liveavatar.com/v2/embeddings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-API-KEY': String(env.LIVEAVATAR_API_KEY) },
    body: JSON.stringify({ avatar_id: profile.avatar_id, context_id: profile.context_id, is_sandbox: !production })
  });
  const data = await response.json().catch(() => ({}));
  const embedUrl = String(data?.data?.url || data?.url || '').trim();
  if (!response.ok || !embedUrl) {
    return json({ detail: data?.message || data?.error?.message || 'LiveAvatar could not start the assistant.', code: 'LIVEAVATAR_PROVIDER_ERROR' }, 502);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO avatar_sessions(id,tenant_id,user_id,profile_id,mode,created_at) VALUES(?,?,?,?,?,?)')
    .bind(id, user.tenant_id, user.id, profile.id, mode, now()).run();
  return json({ session_id: id, url: embedUrl, profile: { id: profile.id, name: profile.name }, mode, plan });
}

export async function handleLiveAvatar(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/api/avatar/config' && request.method === 'GET') return config(request, env);
  if (path === '/api/avatar/session' && request.method === 'POST') return createSession(request, env);
  return null;
}
