const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const xml = (body, status = 200) => new Response(body, {
  status,
  headers: { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' }
});

const TWILIO_DEFAULT_REPLICA = 'r90bbd427f71';
const TWILIO_DEFAULT_PERSONA = 'pcb7a34da5fe';
const TERMINAL_CALL_STATES = new Set(['completed', 'busy', 'failed', 'no-answer', 'canceled']);

function normPhone(value) {
  return String(value || '').trim().replace(/[\s().-]/g, '');
}
function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const out = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(out)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function hmacSha1Base64(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const out = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  let binary = '';
  for (const byte of out) binary += String.fromCharCode(byte);
  return btoa(binary);
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
  if (!secret || !safeEqual(sig, await hmacHex(secret, `${userId}|${tenantId}|${role}|${exp}`))) return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1')
    .bind(userId, tenantId).first();
}

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_agents (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL,
    instructions TEXT NOT NULL DEFAULT '', opening_message TEXT NOT NULL DEFAULT '',
    twilio_voice TEXT NOT NULL DEFAULT '', tavus_replica_id TEXT NOT NULL DEFAULT '',
    tavus_persona_id TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_voice_agents_tenant ON voice_agents(tenant_id,active)').run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_agent_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, call_id INTEGER,
    provider_call_id TEXT, speaker TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_voice_agent_turns_call ON voice_agent_turns(call_id,id)').run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS voice_do_not_call (
    tenant_id TEXT NOT NULL, phone TEXT NOT NULL, reason TEXT NOT NULL DEFAULT 'opt-out',
    created_at INTEGER NOT NULL, PRIMARY KEY(tenant_id,phone)
  )`).run();
}

async function tenantAccess(env, user) {
  const row = await env.DB.prepare('SELECT id,slug,plan FROM tenants WHERE id=?').bind(user.tenant_id).first();
  const platformOwner = Boolean(row?.slug === 'owner' || (env.ADMIN_EMAIL && String(user.email || '').toLowerCase() === String(env.ADMIN_EMAIL).toLowerCase()));
  return { row, business: String(row?.plan || 'free') === 'business', platformOwner };
}

async function ensureDefaultAgent(env, tenantId) {
  let agent = await env.DB.prepare('SELECT * FROM voice_agents WHERE tenant_id=? AND active=1 ORDER BY created_at ASC LIMIT 1').bind(tenantId).first();
  if (agent) return agent;
  const id = crypto.randomUUID();
  const ts = now();
  const opening = 'Hello. This is an automated AI assistant with I AM Magnanimous Way. I am not a human. How may I help you today?';
  const instructions = 'You are a helpful AI receptionist. Be concise, respectful, and practical. Never claim to be human. Never ask for full payment card numbers, banking passwords, Social Security numbers, or other high-risk secrets. If the caller asks to stop calls, confirm the opt-out and end the call.';
  await env.DB.prepare(`INSERT INTO voice_agents(
    id,tenant_id,name,instructions,opening_message,twilio_voice,tavus_replica_id,tavus_persona_id,active,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,1,?,?)`).bind(
    id, tenantId, 'AI Receptionist', instructions, opening, '',
    String(env.TAVUS_DEFAULT_REPLICA_ID || TWILIO_DEFAULT_REPLICA),
    String(env.TAVUS_DEFAULT_PERSONA_ID || TWILIO_DEFAULT_PERSONA), ts, ts
  ).run();
  return env.DB.prepare('SELECT * FROM voice_agents WHERE id=?').bind(id).first();
}

function twilioReady(env) {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}
function tavusReady(env) {
  return Boolean(env.TAVUS_API_KEY);
}

async function validateTwilioRequest(request, env) {
  if (!env.TWILIO_AUTH_TOKEN) return false;
  const supplied = request.headers.get('x-twilio-signature') || '';
  if (!supplied) return false;
  let form;
  try { form = await request.clone().formData(); } catch { return false; }
  const grouped = new Map();
  for (const [key, raw] of form.entries()) {
    const value = typeof raw === 'string' ? raw : '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(value);
  }
  let payload = request.url;
  for (const key of [...grouped.keys()].sort()) {
    for (const value of grouped.get(key).slice().sort()) payload += `${key}${value}`;
  }
  const expected = await hmacSha1Base64(String(env.TWILIO_AUTH_TOKEN), payload);
  return safeEqual(supplied, expected);
}

function gatherTwiml(actionUrl, prompt, voice = '') {
  const voiceAttr = voice ? ` voice="${escapeXml(voice)}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" action="${escapeXml(actionUrl)}" method="POST" speechTimeout="auto" timeout="5" actionOnEmptyResult="true"><Say${voiceAttr}>${escapeXml(prompt)}</Say></Gather><Say${voiceAttr}>I did not receive a response. Goodbye.</Say></Response>`;
}
function goodbyeTwiml(message = 'Thank you. Goodbye.', voice = '') {
  const voiceAttr = voice ? ` voice="${escapeXml(voice)}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say${voiceAttr}>${escapeXml(message)}</Say><Hangup/></Response>`;
}

async function aiReply(env, agent, history, callerText) {
  if (!env.AI) return 'I can hear you, but my AI service is temporarily unavailable. Please try again later.';
  const messages = [
    {
      role: 'system',
      content: `${agent?.instructions || ''}\nYou are speaking on a live telephone call. Keep each response under 70 words. Do not use markdown. Be natural but clearly remain an AI assistant. If there is an emergency or immediate danger, tell the caller to contact local emergency services. Do not take payment card, bank-password, government-ID, or authentication-secret information over the call.`
    },
    ...history.map(turn => ({ role: turn.speaker === 'assistant' ? 'assistant' : 'user', content: String(turn.text || '') })),
    { role: 'user', content: callerText }
  ];
  const models = [...new Set([
    String(env.CLOUDFLARE_AI_MODEL || '').trim(),
    '@cf/meta/llama-3.1-8b-instruct-fast',
    '@cf/meta/llama-3.2-1b-instruct'
  ].filter(Boolean))];
  for (const model of models) {
    try {
      const result = await env.AI.run(model, { messages, max_tokens: 220 });
      const text = String(result?.response || result?.result?.response || result?.result || '').trim();
      if (text) return text.replace(/[*#`]/g, '').slice(0, 1200);
    } catch (_) {}
  }
  return 'I am having trouble reaching my AI service right now. Please try again later.';
}

async function createTwilioCall(request, env, user, body) {
  if (!twilioReady(env)) return json({ detail: 'Twilio is not configured yet.', code: 'TWILIO_NOT_CONFIGURED' }, 503);
  const access = await tenantAccess(env, user);
  if (!access.business && !access.platformOwner) return json({ detail: 'AI telephone calling is included with Full Business.', code: 'BUSINESS_PLAN_REQUIRED' }, 402);
  if (body.consent_confirmed !== true || body.ai_disclosure_accepted !== true) {
    return json({ detail: 'Confirm that the recipient may be contacted and that the call will disclose it is automated AI before placing the call.', code: 'CALL_CONSENT_REQUIRED' }, 400);
  }
  const to = normPhone(body.to);
  if (!/^\+[1-9]\d{7,14}$/.test(to)) return json({ detail: 'Use a valid E.164 phone number such as +14155551212.' }, 400);
  const dnc = await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(user.tenant_id, to).first();
  if (dnc) return json({ detail: 'This number has opted out of automated calls.', code: 'DO_NOT_CALL' }, 409);

  const agent = body.agent_id
    ? await env.DB.prepare('SELECT * FROM voice_agents WHERE id=? AND tenant_id=? AND active=1').bind(String(body.agent_id), user.tenant_id).first()
    : await ensureDefaultAgent(env, user.tenant_id);
  if (!agent) return json({ detail: 'Voice agent not found.' }, 404);

  const ts = now();
  const created = await env.DB.prepare(`INSERT INTO phone_calls(
    tenant_id,contact_id,direction,caller,callee,status,created_at,provider,queue_id,agent_id,metadata_json,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    user.tenant_id, body.contact_id || null, 'outbound', String(env.TWILIO_PHONE_NUMBER), to,
    'queued', ts, 'twilio-ai', body.queue_id || null, body.agent_id || null,
    JSON.stringify({ requested_by: user.id, voice_agent_id: agent.id, ai_disclosure: true, consent_confirmed: true }), ts
  ).run();
  const callId = Number(created.meta.last_row_id);
  const origin = new URL(request.url).origin;
  const turnUrl = `${origin}/api/voice-agent/twilio/turn?call_id=${callId}`;
  const statusUrl = `${origin}/api/voice-agent/twilio/status?call_id=${callId}`;
  const opening = String(body.opening_message || agent.opening_message || 'Hello. This is an automated AI assistant. I am not a human. How may I help you?').slice(0, 1200);
  const twimlBody = gatherTwiml(turnUrl, opening, agent.twilio_voice);

  const form = new URLSearchParams();
  form.set('To', to);
  form.set('From', String(env.TWILIO_PHONE_NUMBER));
  form.set('Twiml', twimlBody);
  form.set('StatusCallback', statusUrl);
  form.set('StatusCallbackMethod', 'POST');
  for (const event of ['initiated', 'ringing', 'answered', 'completed']) form.append('StatusCallbackEvent', event);
  form.set('TimeLimit', String(Math.min(Math.max(Number(body.time_limit_seconds || 900), 60), 3600)));

  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))}/Calls.json`, {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.sid) {
    await env.DB.prepare("UPDATE phone_calls SET status='failed',updated_at=? WHERE id=? AND tenant_id=?").bind(now(), callId, user.tenant_id).run();
    return json({ detail: data?.message || 'Twilio could not place the call.', code: data?.code || 'TWILIO_CALL_FAILED', call_id: callId }, 502);
  }
  await env.DB.prepare('UPDATE phone_calls SET provider_call_id=?,status=?,updated_at=? WHERE id=? AND tenant_id=?')
    .bind(String(data.sid), String(data.status || 'queued'), now(), callId, user.tenant_id).run();
  await env.DB.prepare('INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)')
    .bind(user.tenant_id, callId, String(data.sid), 'assistant', opening, now()).run();
  return json({ call_id: callId, provider_call_id: data.sid, status: data.status || 'queued', provider: 'twilio-ai', agent: { id: agent.id, name: agent.name } }, 201);
}

async function twilioTurn(request, env, url) {
  if (!await validateTwilioRequest(request, env)) return xml(goodbyeTwiml('This call could not be authenticated.'), 403);
  const callId = Number(url.searchParams.get('call_id') || 0);
  const call = callId ? await env.DB.prepare('SELECT * FROM phone_calls WHERE id=?').bind(callId).first() : null;
  if (!call) return xml(goodbyeTwiml('This call session is unavailable.'), 404);
  const form = await request.formData();
  const speech = String(form.get('SpeechResult') || '').trim().slice(0, 3000);
  const providerCallId = String(form.get('CallSid') || call.provider_call_id || '');
  const metadata = (() => { try { return JSON.parse(call.metadata_json || '{}'); } catch { return {}; } })();
  const agent = metadata.voice_agent_id
    ? await env.DB.prepare('SELECT * FROM voice_agents WHERE id=? AND tenant_id=?').bind(String(metadata.voice_agent_id), call.tenant_id).first()
    : await ensureDefaultAgent(env, call.tenant_id);
  const voice = String(agent?.twilio_voice || '');
  if (!speech) return xml(gatherTwiml(request.url, 'I did not catch that. Please say that again.', voice));

  await env.DB.prepare('INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)')
    .bind(call.tenant_id, call.id, providerCallId, 'caller', speech, now()).run();

  const lower = speech.toLowerCase();
  if (/\b(stop calling|do not call|don't call|remove me|opt out|unsubscribe)\b/.test(lower)) {
    const phone = normPhone(call.direction === 'outbound' ? call.callee : call.caller);
    if (phone) await env.DB.prepare("INSERT OR REPLACE INTO voice_do_not_call(tenant_id,phone,reason,created_at) VALUES(?,?,?,?)")
      .bind(call.tenant_id, phone, 'caller opt-out', now()).run();
    const message = 'Understood. This number has been placed on the do-not-call list. Goodbye.';
    await env.DB.prepare('INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)')
      .bind(call.tenant_id, call.id, providerCallId, 'assistant', message, now()).run();
    return xml(goodbyeTwiml(message, voice));
  }
  if (/\b(goodbye|bye|hang up|end call)\b/.test(lower)) return xml(goodbyeTwiml('Thank you for speaking with me. Goodbye.', voice));

  const { results } = await env.DB.prepare('SELECT speaker,text FROM voice_agent_turns WHERE call_id=? ORDER BY id DESC LIMIT 12').bind(call.id).all();
  const history = (results || []).reverse().slice(0, -1);
  const reply = await aiReply(env, agent, history, speech);
  await env.DB.prepare('INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)')
    .bind(call.tenant_id, call.id, providerCallId, 'assistant', reply, now()).run();
  return xml(gatherTwiml(request.url, reply, voice));
}

async function twilioStatus(request, env, url) {
  if (!await validateTwilioRequest(request, env)) return json({ detail: 'Invalid Twilio signature.' }, 403);
  const callId = Number(url.searchParams.get('call_id') || 0);
  if (!callId) return json({ detail: 'call_id is required.' }, 400);
  const form = await request.formData();
  const status = String(form.get('CallStatus') || '').toLowerCase();
  const sid = String(form.get('CallSid') || '');
  const duration = Number(form.get('CallDuration') || 0) || 0;
  const call = await env.DB.prepare('SELECT * FROM phone_calls WHERE id=?').bind(callId).first();
  if (!call) return json({ detail: 'Call not found.' }, 404);
  const started = status === 'in-progress' && !call.started_at ? now() : call.started_at;
  const ended = TERMINAL_CALL_STATES.has(status) ? now() : call.ended_at;
  await env.DB.prepare('UPDATE phone_calls SET provider_call_id=COALESCE(NULLIF(?,\'\'),provider_call_id),status=?,started_at=?,ended_at=?,duration_seconds=?,updated_at=? WHERE id=?')
    .bind(sid, status || call.status, started || null, ended || null, duration || call.duration_seconds || 0, now(), callId).run();
  return json({ ok: true });
}

async function twilioIncoming(request, env) {
  if (!twilioReady(env)) return xml(goodbyeTwiml('This number is not configured yet.'), 503);
  if (!await validateTwilioRequest(request, env)) return xml(goodbyeTwiml('This call could not be authenticated.'), 403);
  const form = await request.formData();
  const sid = String(form.get('CallSid') || '');
  const from = normPhone(form.get('From'));
  const to = normPhone(form.get('To'));
  let tenantId = String(env.TWILIO_DEFAULT_TENANT_ID || '').trim();
  if (!tenantId) {
    const owner = await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' LIMIT 1").first();
    tenantId = String(owner?.id || '');
  }
  if (!tenantId) return xml(goodbyeTwiml('The AI receptionist is not assigned yet.'), 503);
  const blocked = from ? await env.DB.prepare('SELECT phone FROM voice_do_not_call WHERE tenant_id=? AND phone=?').bind(tenantId, from).first() : null;
  if (blocked) return xml(goodbyeTwiml('This number is on our do-not-call list. Goodbye.'));
  const agent = await ensureDefaultAgent(env, tenantId);
  let call = sid ? await env.DB.prepare('SELECT * FROM phone_calls WHERE provider_call_id=? ORDER BY id DESC LIMIT 1').bind(sid).first() : null;
  if (!call) {
    const ts = now();
    const created = await env.DB.prepare(`INSERT INTO phone_calls(
      tenant_id,direction,caller,callee,status,created_at,provider,provider_call_id,metadata_json,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(
      tenantId, 'inbound', from, to, 'in-progress', ts, 'twilio-ai', sid,
      JSON.stringify({ voice_agent_id: agent.id, inbound: true, ai_disclosure: true }), ts
    ).run();
    call = await env.DB.prepare('SELECT * FROM phone_calls WHERE id=?').bind(created.meta.last_row_id).first();
  }
  const origin = new URL(request.url).origin;
  const action = `${origin}/api/voice-agent/twilio/turn?call_id=${call.id}`;
  const opening = String(agent.opening_message || 'Hello. This is an automated AI assistant. I am not a human. How may I help you?');
  await env.DB.prepare('INSERT INTO voice_agent_turns(tenant_id,call_id,provider_call_id,speaker,text,created_at) VALUES(?,?,?,?,?,?)')
    .bind(tenantId, call.id, sid, 'assistant', opening, now()).run();
  return xml(gatherTwiml(action, opening, agent.twilio_voice));
}

async function createAvatarConversation(request, env, user, body) {
  if (!tavusReady(env)) return json({ detail: 'Real-time human avatar video is ready for a Tavus API key.', code: 'TAVUS_NOT_CONFIGURED' }, 503);
  const access = await tenantAccess(env, user);
  if (!access.business && !access.platformOwner) return json({ detail: 'Real-time human avatar video is included with Full Business.', code: 'BUSINESS_PLAN_REQUIRED' }, 402);
  const agent = body.agent_id
    ? await env.DB.prepare('SELECT * FROM voice_agents WHERE id=? AND tenant_id=? AND active=1').bind(String(body.agent_id), user.tenant_id).first()
    : await ensureDefaultAgent(env, user.tenant_id);
  if (!agent) return json({ detail: 'Voice agent not found.' }, 404);
  const replicaId = String(agent.tavus_replica_id || env.TAVUS_DEFAULT_REPLICA_ID || TWILIO_DEFAULT_REPLICA);
  const personaId = String(agent.tavus_persona_id || env.TAVUS_DEFAULT_PERSONA_ID || TWILIO_DEFAULT_PERSONA);
  const response = await fetch('https://tavusapi.com/v2/conversations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': String(env.TAVUS_API_KEY) },
    body: JSON.stringify({
      replica_id: replicaId,
      persona_id: personaId,
      conversation_name: String(body.name || `${agent.name} conversation`).slice(0, 120),
      conversational_context: String(body.context || agent.instructions || '').slice(0, 6000),
      custom_greeting: String(body.greeting || agent.opening_message || '').slice(0, 1200),
      max_participants: 2
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.conversation_url) return json({ detail: data?.message || data?.detail || 'Tavus could not start the avatar conversation.' }, 502);
  return json({ provider: 'tavus', conversation_id: data.conversation_id, conversation_url: data.conversation_url, status: data.status || 'active', agent: { id: agent.id, name: agent.name } }, 201);
}

async function agentRoutes(request, env, user, path) {
  await ensureSchema(env);
  if (path === '/api/voice-agent/config' && request.method === 'GET') {
    const access = await tenantAccess(env, user);
    await ensureDefaultAgent(env, user.tenant_id);
    return json({
      free_browser_calling: true,
      ai_engine: Boolean(env.AI),
      twilio_configured: twilioReady(env),
      tavus_configured: tavusReady(env),
      full_business: access.business,
      platform_owner: access.platformOwner,
      inbound_twilio_webhook: `${new URL(request.url).origin}/api/voice-agent/twilio/incoming`,
      note: 'PSTN carrier and real-time avatar usage can incur third-party provider charges.'
    });
  }
  if (path === '/api/voice-agent/agents' && request.method === 'GET') {
    await ensureDefaultAgent(env, user.tenant_id);
    const { results } = await env.DB.prepare('SELECT * FROM voice_agents WHERE tenant_id=? ORDER BY active DESC,created_at ASC').bind(user.tenant_id).all();
    return json({ agents: results || [] });
  }
  if (path === '/api/voice-agent/agents' && request.method === 'POST') {
    if (user.role !== 'owner') return json({ detail: 'Workspace owner access required.' }, 403);
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    if (!name) return json({ detail: 'Agent name is required.' }, 400);
    const id = crypto.randomUUID(), ts = now();
    await env.DB.prepare(`INSERT INTO voice_agents(
      id,tenant_id,name,instructions,opening_message,twilio_voice,tavus_replica_id,tavus_persona_id,active,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,1,?,?)`).bind(
      id, user.tenant_id, name, String(body.instructions || '').slice(0, 10000),
      String(body.opening_message || '').slice(0, 1500), String(body.twilio_voice || '').slice(0, 100),
      String(body.tavus_replica_id || '').slice(0, 100), String(body.tavus_persona_id || '').slice(0, 100), ts, ts
    ).run();
    return json({ id }, 201);
  }
  const agentMatch = path.match(/^\/api\/voice-agent\/agents\/([^/]+)$/);
  if (agentMatch && request.method === 'PUT') {
    if (user.role !== 'owner') return json({ detail: 'Workspace owner access required.' }, 403);
    const body = await request.json().catch(() => ({}));
    const agent = await env.DB.prepare('SELECT * FROM voice_agents WHERE id=? AND tenant_id=?').bind(agentMatch[1], user.tenant_id).first();
    if (!agent) return json({ detail: 'Agent not found.' }, 404);
    await env.DB.prepare(`UPDATE voice_agents SET name=?,instructions=?,opening_message=?,twilio_voice=?,tavus_replica_id=?,tavus_persona_id=?,active=?,updated_at=? WHERE id=? AND tenant_id=?`)
      .bind(
        String(body.name ?? agent.name).slice(0, 120), String(body.instructions ?? agent.instructions).slice(0, 10000),
        String(body.opening_message ?? agent.opening_message).slice(0, 1500), String(body.twilio_voice ?? agent.twilio_voice).slice(0, 100),
        String(body.tavus_replica_id ?? agent.tavus_replica_id).slice(0, 100), String(body.tavus_persona_id ?? agent.tavus_persona_id).slice(0, 100),
        body.active === false ? 0 : 1, now(), agent.id, user.tenant_id
      ).run();
    return json({ ok: true });
  }
  if (path === '/api/voice-agent/call' && request.method === 'POST') return createTwilioCall(request, env, user, await request.json().catch(() => ({})));
  if (path === '/api/voice-agent/avatar' && request.method === 'POST') return createAvatarConversation(request, env, user, await request.json().catch(() => ({})));
  if (path === '/api/voice-agent/do-not-call' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT phone,reason,created_at FROM voice_do_not_call WHERE tenant_id=? ORDER BY created_at DESC').bind(user.tenant_id).all();
    return json({ numbers: results || [] });
  }
  return json({ detail: 'Voice agent route not found.' }, 404);
}

export async function handleVoiceAgent(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/voice-agent')) return null;
  await ensureSchema(env);
  if (path === '/api/voice-agent/twilio/turn' && request.method === 'POST') return twilioTurn(request, env, url);
  if (path === '/api/voice-agent/twilio/status' && request.method === 'POST') return twilioStatus(request, env, url);
  if (path === '/api/voice-agent/twilio/incoming' && request.method === 'POST') return twilioIncoming(request, env);
  const user = await currentUser(request, env);
  if (!user) return json({ detail: 'Sign in required.' }, 401);
  return agentRoutes(request, env, user, path);
}
