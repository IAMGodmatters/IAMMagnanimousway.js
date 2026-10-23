// Native Magnanimous TV companion relay. No remote browsing credentials or media
// are sent through this service: only an allowlisted set of remote-control commands.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PAIR_SECONDS = 5 * 60;
const SESSION_SECONDS = 12 * 60 * 60;
const MAX_BODY_BYTES = 2048;
const COMMANDS = new Set(['navigate', 'back', 'forward', 'reload', 'home',
  'up', 'down', 'left', 'right', 'select', 'playpause', 'fullscreen',
  'seek-back', 'seek-forward', 'volume-up', 'volume-down']);

const clock = () => Math.floor(Date.now() / 1000);
const response = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

function randomBytes(count) {
  const bytes = new Uint8Array(count);
  crypto.getRandomValues(bytes);
  return bytes;
}
function randomToken() {
  return Array.from(randomBytes(32), byte => byte.toString(16).padStart(2, '0')).join('');
}
function randomCode() {
  return Array.from(randomBytes(10), byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
function bearer(request) {
  const value = request.headers.get('Authorization') || '';
  return /^Bearer [a-f0-9]{64}$/.test(value) ? value.slice(7) : null;
}
async function body(request) {
  const value = await request.text();
  if (value.length > MAX_BODY_BYTES) throw new Error('too_large');
  try { return JSON.parse(value); } catch { throw new Error('invalid_json'); }
}
function normalizeCode(input) {
  const code = String(input || '').toUpperCase().replace(/[-\s]/g, '');
  return /^[A-HJ-NP-Z2-9]{10}$/.test(code) ? code : null;
}
function localHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g,'');
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') || host.endsWith('.internal')) return true;
  // Avoid remotely navigating a paired TV to LAN devices or IP-literal endpoints.
  if (host.includes(':') || /^\d+(?:\.\d+){3}$/.test(host)) return true;
  return false;
}
export function validateTvCommand(input) {
  const action = String(input?.action || '');
  if (!COMMANDS.has(action)) return null;
  if (action !== 'navigate') return { action, value: '' };
  const address = String(input?.value || '').trim();
  if (address.length > 1024) return null;
  try {
    const url = new URL(address);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    if (localHost(url.hostname)) return null;
    // No credentials or authentication data ever enter the command queue.
    for (const key of url.searchParams.keys()) {
      if (/token|passw|secret|auth|api_key|client_secret|^code$/i.test(key)) return null;
    }
    return { action, value: url.href };
  } catch { return null; }
}

async function limited(env, request, scope, maximum) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const key = await hash(`${scope}:${ip}`);
  const bucket = Math.floor(clock() / 60);
  await env.DB.prepare(`INSERT INTO tv_companion_limits(key,window_minute,attempts)
    VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET
    attempts=CASE WHEN window_minute=excluded.window_minute THEN attempts+1 ELSE 1 END,
    window_minute=excluded.window_minute`).bind(key, bucket).run();
  const record = await env.DB.prepare('SELECT attempts FROM tv_companion_limits WHERE key=?').bind(key).first();
  return Number(record?.attempts || 0) <= maximum;
}
async function session(env, id, token, column) {
  if (!id || !token || !/^[a-f0-9-]{36}$/.test(id)) return null;
  return env.DB.prepare(`SELECT * FROM tv_companion_sessions WHERE id=? AND ${column}=? AND expires_at>?`)
    .bind(id, await hash(token), clock()).first();
}

export async function handleTvCompanion(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/tv-companion/')) return null;
  if (!env.DB) return response({ detail: 'TV pairing storage is not configured.' }, 503);
  if (request.method !== 'GET' && request.method !== 'POST') return response({ detail: 'Method not allowed.' }, 405);
  try {
    if (path === '/api/tv-companion/session' && request.method === 'POST') {
      if (!await limited(env, request, 'create', 12)) return response({ detail: 'Please wait before creating another TV session.' }, 429);
      // Pruning on creation keeps the free D1 allocation bounded without a new cron.
      await env.DB.prepare('DELETE FROM tv_companion_sessions WHERE expires_at<?').bind(clock()).run();
      await env.DB.prepare('DELETE FROM tv_companion_limits WHERE window_minute<?').bind(Math.floor(clock()/60)-60).run();
      const id = crypto.randomUUID();
      const tvToken = randomToken();
      const code = randomCode();
      const at = clock();
      await env.DB.prepare(`INSERT INTO tv_companion_sessions
        (id,pair_code_hash,tv_token_hash,created_at,pair_expires_at,expires_at)
        VALUES(?,?,?,?,?,?)`).bind(id, await hash(code), await hash(tvToken), at, at + PAIR_SECONDS, at + SESSION_SECONDS).run();
      return response({ session_id: id, tv_token: tvToken, pairing_code: code, pair_expires_at: at + PAIR_SECONDS, expires_at: at + SESSION_SECONDS }, 201);
    }
    if (path === '/api/tv-companion/pair' && request.method === 'POST') {
      if (!await limited(env, request, 'pair', 6)) return response({ detail: 'Too many attempts. Try again in a minute.' }, 429);
      const data = await body(request);
      const code = normalizeCode(data?.code);
      if (!code) return response({ detail: 'Enter the ten-character code shown on your TV.' }, 400);
      const codeHash = await hash(code);
      const record = await env.DB.prepare(`SELECT id,expires_at FROM tv_companion_sessions WHERE pair_code_hash=?
        AND paired_at IS NULL AND pair_expires_at>? AND expires_at>?`).bind(codeHash, clock(), clock()).first();
      if (!record) return response({ detail: 'Code expired or unavailable. Generate a new code on the TV.' }, 404);
      const remoteToken = randomToken();
      const accepted = await env.DB.prepare(`UPDATE tv_companion_sessions SET remote_token_hash=?,paired_at=?
        WHERE id=? AND paired_at IS NULL AND pair_expires_at>?`).bind(await hash(remoteToken), clock(), record.id, clock()).run();
      if (Number(accepted.meta?.changes || 0) !== 1) return response({ detail: 'TV was already paired.' }, 409);
      return response({ session_id: record.id, remote_token: remoteToken, expires_at: record.expires_at });
    }
    if (path === '/api/tv-companion/poll' && request.method === 'GET') {
      const id = url.searchParams.get('session_id');
      const record = await session(env, id, bearer(request), 'tv_token_hash');
      if (!record) return response({ detail: 'TV session expired. Restart pairing.' }, 401);
      const after = Math.max(0, Number.parseInt(url.searchParams.get('after') || '0', 10) || 0);
      const command = record.paired_at ? await env.DB.prepare(`SELECT id,action,value FROM tv_companion_commands
        WHERE session_id=? AND id>? ORDER BY id ASC LIMIT 1`).bind(id, after).first() : null;
      return response({ paired: Boolean(record.paired_at), command: command || null, expires_at: record.expires_at });
    }
    if (path === '/api/tv-companion/command' && request.method === 'POST') {
      if (!await limited(env, request, 'command', 120)) return response({ detail: 'Remote is sending too many commands. Try again shortly.' }, 429);
      const data = await body(request);
      const record = await session(env, String(data?.session_id || ''), bearer(request), 'remote_token_hash');
      if (!record || !record.paired_at) return response({ detail: 'Pair this phone to the TV again.' }, 401);
      const command = validateTvCommand(data);
      if (!command) return response({ detail: 'Unsupported or unsafe remote command.' }, 400);
      const existing = await env.DB.prepare('SELECT COUNT(*) AS count FROM tv_companion_commands WHERE session_id=?').bind(record.id).first();
      if (Number(existing?.count||0)>5000) return response({ detail: 'TV session command limit reached. Start a new session.' }, 429);
      const result = await env.DB.prepare(`INSERT INTO tv_companion_commands(session_id,action,value,created_at)
        VALUES(?,?,?,?)`).bind(record.id, command.action, command.value, clock()).run();
      return response({ queued: true, command_id: result.meta?.last_row_id }, 201);
    }
    if (path === '/api/tv-companion/disconnect' && request.method === 'POST') {
      const data = await body(request);
      const token = bearer(request);
      const id = String(data?.session_id || '');
      const record = await session(env, id, token, 'tv_token_hash') || await session(env, id, token, 'remote_token_hash');
      if (!record) return response({ detail: 'Session not found.' }, 401);
      await env.DB.prepare('DELETE FROM tv_companion_sessions WHERE id=?').bind(id).run();
      return response({ disconnected: true });
    }
    return response({ detail: 'TV companion route not found.' }, 404);
  } catch (error) {
    if (error?.message === 'too_large') return response({ detail: 'Request too large.' }, 413);
    if (error?.message === 'invalid_json') return response({ detail: 'Invalid request.' }, 400);
    return response({ detail: 'TV companion temporarily unavailable.' }, 503);
  }
}
