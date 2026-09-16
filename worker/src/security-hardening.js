import { currentUser } from './integrations.js';
import { isRequestSessionRevoked } from './session-revocation.js';

const now = () => Math.floor(Date.now() / 1000);
const encoder = new TextEncoder();
const json = (data, status = 200, headers = {}) => Response.json(data, {
  status,
  headers: { 'cache-control': 'no-store', ...headers }
});

const DEFAULT_ORIGINS = new Set([
  'https://iammagnanimousway.com',
  'https://www.iammagnanimousway.com'
]);

let rateSchemaReady = false;

function normEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function sessionSecret(env) {
  const configured = String(env?.SESSION_SECRET || '').trim();
  if (configured) return configured;
  if (!env?.DB) return '';
  try {
    const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
    return String(row?.value || '').trim();
  } catch {
    return '';
  }
}

function strongSecret(value) {
  const secret = String(value || '').trim();
  if (secret.length < 32) return false;
  return !/^(?:change[-_ ]?me|change-this-session-secret|development|dev-secret)$/i.test(secret);
}

function allowedOrigins(env) {
  const origins = new Set(DEFAULT_ORIGINS);
  const site = String(env?.PUBLIC_SITE_URL || '').trim();
  if (site) {
    try { origins.add(new URL(site).origin); } catch {}
  }
  for (const item of String(env?.ALLOWED_ORIGINS || '').split(',')) {
    const candidate = item.trim();
    if (!candidate) continue;
    try { origins.add(new URL(candidate).origin); } catch {}
  }
  return origins;
}

function corsHeaders(request, env) {
  const origin = String(request.headers.get('origin') || '').trim();
  if (!origin || !allowedOrigins(env).has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-max-age': '600',
    'vary': 'Origin'
  };
}

function isProtectedAiPath(path) {
  return path === '/api/chat' ||
    path === '/api/agents/chat' ||
    path === '/api/white-label/brain/chat' ||
    (path.startsWith('/api/agents/') && path.endsWith('/chat'));
}

function isAgencyPath(path) {
  return path.startsWith('/api/agency') || path.startsWith('/api/white-label/brain');
}

function requiresStrongSession(request, path) {
  return Boolean(request.headers.get('authorization')) ||
    path === '/api/auth/login' ||
    path === '/api/auth/signup' ||
    path === '/api/admin/login';
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function ensureRateSchema(env) {
  if (rateSchemaReady || !env?.DB) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS security_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`).run();
  rateSchemaReady = true;
}

async function rateLimit(request, env, bucket, max, windowSeconds) {
  if (!env?.DB) return null;
  await ensureRateSchema(env);
  const rawIp = String(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const key = `${bucket}:${await sha256(`${bucket}:${rawIp}`)}`;
  const t = now();
  const row = await env.DB.prepare('SELECT window_start,count FROM security_rate_limits WHERE bucket_key=?').bind(key).first();
  if (!row || Number(row.window_start || 0) <= t - windowSeconds) {
    await env.DB.prepare(`INSERT INTO security_rate_limits(bucket_key,window_start,count,updated_at) VALUES(?,?,1,?)
      ON CONFLICT(bucket_key) DO UPDATE SET window_start=excluded.window_start,count=1,updated_at=excluded.updated_at`).bind(key, t, t).run();
    return null;
  }
  const count = Number(row.count || 0) + 1;
  await env.DB.prepare('UPDATE security_rate_limits SET count=?,updated_at=? WHERE bucket_key=?').bind(count, t, key).run();
  if (count <= max) return null;
  return json({ detail: 'Too many requests. Please wait and try again.', code: 'RATE_LIMITED' }, 429, { 'retry-after': String(windowSeconds) });
}

async function platformOwner(request, env) {
  const user = await currentUser(request, env).catch(() => null);
  if (!user) return false;
  const ownerEmail = normEmail(env?.ADMIN_EMAIL);
  return Boolean(ownerEmail && normEmail(user.email) === ownerEmail && ['owner', 'admin'].includes(String(user.role || '').toLowerCase()));
}

async function enforceAgencyEntitlement(request, env, path) {
  if (!isAgencyPath(path)) return null;
  const user = await currentUser(request, env).catch(() => null);
  if (!user) return json({ detail: 'Sign in to use this paid workspace.' }, 401);
  if (await platformOwner(request, env)) return null;
  try {
    const row = await env.DB.prepare('SELECT plan,status,current_period_end FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
    const active = ['active', 'trialing'].includes(String(row?.status || '').toLowerCase());
    const plan = String(row?.plan || '').toLowerCase();
    const entitled = plan === 'agency' || plan === 'agency_pro';
    const expires = Number(row?.current_period_end || 0);
    if (active && entitled && (!expires || expires >= now())) return null;
  } catch {}
  return json({
    detail: 'Agency or Agency Pro access is required for this workspace.',
    code: 'AGENCY_ENTITLEMENT_REQUIRED',
    upgrade_path: '/white-label'
  }, 402);
}

function collectText(value, depth = 0) {
  if (depth > 4 || value == null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(item => collectText(item, depth + 1));
  if (typeof value !== 'object') return [];
  const out = [];
  for (const [key, item] of Object.entries(value)) {
    if (/message|prompt|instruction|query|content|text|question/i.test(key)) out.push(...collectText(item, depth + 1));
  }
  return out;
}

function extractionAttempt(value) {
  const text = String(value || '').slice(0, 50000);
  const bypass = /\b(?:ignore|disregard|override|bypass|forget)\b[\s\S]{0,100}\b(?:previous|system|developer|instructions?|rules?|guardrails?)\b/i;
  const action = /\b(?:reveal|show|print|dump|export|list|repeat|quote|display|expose|return|extract|copy)\b/i;
  const target = /\b(?:system prompt|developer message|hidden instructions?|internal instructions?|api keys?|access tokens?|session secret|admin password|environment variables?|database dump|all users?|another tenant|other tenant|private source code|internal source code|credential vault|secret keys?)\b/i;
  return bypass.test(text) || (action.test(text) && target.test(text));
}

export async function securityPreflight(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/') && url.pathname !== '/health') return null;

  const origin = String(request.headers.get('origin') || '').trim();
  if (origin && !allowedOrigins(env).has(origin)) return json({ detail: 'This origin is not allowed.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });

  const size = Number(request.headers.get('content-length') || 0);
  if (size > 1_000_000) return json({ detail: 'Request body is too large.' }, 413);
  if (isProtectedAiPath(url.pathname) && size > 160_000) return json({ detail: 'AI request is too large.' }, 413);

  if (requiresStrongSession(request, url.pathname) && !strongSecret(await sessionSecret(env))) {
    return json({ detail: 'Authentication is temporarily unavailable because secure session configuration is incomplete.', code: 'SECURE_SESSION_REQUIRED' }, 503);
  }
  if (request.headers.get('authorization') && await isRequestSessionRevoked(request, env)) {
    return json({ detail: 'This session has been signed out. Sign in again to continue.', code: 'SESSION_REVOKED' }, 401);
  }

  const entitlement = await enforceAgencyEntitlement(request, env, url.pathname);
  if (entitlement) return entitlement;

  if (url.pathname === '/api/auth/login' || url.pathname === '/api/admin/login') {
    const limited = await rateLimit(request, env, 'login', Number(env?.SECURITY_LOGIN_LIMIT || 12), 300);
    if (limited) return limited;
  }
  if (url.pathname === '/api/auth/signup') {
    const limited = await rateLimit(request, env, 'signup', Number(env?.SECURITY_SIGNUP_LIMIT || 6), 600);
    if (limited) return limited;
  }
  if (isProtectedAiPath(url.pathname)) {
    const limited = await rateLimit(request, env, 'ai', Number(env?.SECURITY_AI_LIMIT || 45), 60);
    if (limited) return limited;
    if (!(await platformOwner(request, env))) {
      const body = await request.clone().json().catch(() => ({}));
      if (extractionAttempt(collectText(body).join('\n'))) {
        return json({
          detail: 'Magnanimous can help with the user-facing task, but it cannot reveal private prompts, credentials, internal configuration, another workspace, or proprietary backend material.',
          code: 'PROTECTED_INTERNALS'
        }, 400);
      }
    }
  }
  return null;
}

const EXECUTION_NAME_RE = /\b(?:OpenAI|ChatGPT|Anthropic|Claude|Google Gemini|Gemini|Groq|Mistral AI|Mistral|OpenRouter|Cerebras|Hugging Face|Cloudflare Workers AI|Workers AI)\b/gi;
const MODEL_ID_RE = /\b(?:gpt-[\w.-]+|claude-[\w.-]+|gemini-[\w.-]+|llama-[\w.-]+|mistral-[\w.-]+)\b|@cf\/[\w./-]+/gi;
const INTERNAL_MARKER_RE = /AUTOMATIC SPECIALIST HANDOFF|Native I AM workspace snapshot|Shared team memory follows|SYSTEM PROMPT|DEVELOPER MESSAGE/i;

function redactString(value) {
  return String(value || '').replace(EXECUTION_NAME_RE, 'Magnanimous AI').replace(MODEL_ID_RE, 'private routing');
}

function sanitize(value, depth = 0) {
  if (depth > 10 || value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(item => sanitize(item, depth + 1));
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (/^(?:provider|provider_name|model|model_id|engine|execution_engine|openai_used)$/i.test(key)) continue;
    out[key] = sanitize(item, depth + 1);
  }
  return out;
}

function sanitizeAiPayload(data) {
  const cleaned = sanitize(data);
  for (const key of ['output', 'answer', 'message', 'detail']) {
    if (typeof cleaned?.[key] === 'string' && INTERNAL_MARKER_RE.test(cleaned[key])) {
      cleaned[key] = 'I can help with the user-facing task, but I cannot provide private system instructions, internal configuration, or proprietary backend material.';
    }
  }
  return cleaned;
}

export async function securityPostflight(request, response, env) {
  if (!response) return response;
  const url = new URL(request.url);
  let secured = response;
  const type = String(response.headers.get('content-type') || '').toLowerCase();
  if (isProtectedAiPath(url.pathname) && type.includes('application/json')) {
    const data = await response.clone().json().catch(() => null);
    if (data) {
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.set('content-type', 'application/json; charset=utf-8');
      headers.set('cache-control', 'no-store');
      secured = new Response(JSON.stringify(sanitizeAiPayload(data)), { status: response.status, statusText: response.statusText, headers });
    }
  }

  const headers = new Headers(secured.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) headers.set(key, value);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(), payment=(self)');
  headers.set('cross-origin-opener-policy', 'same-origin');
  headers.set('content-security-policy', "frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') headers.set('cache-control', 'no-store');
  headers.delete('server');
  return new Response(secured.body, { status: secured.status, statusText: secured.statusText, headers });
}
