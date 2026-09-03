const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'change-me'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function auth(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const parts = raw.slice(7).split('|');
  if (parts.length !== 5 || Number(parts[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = parts;
  if (sig !== await hmac(env.SESSION_SECRET, `${userId}|${tenantId}|${role}|${exp}`)) return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1')
    .bind(userId, tenantId).first();
}

const validAgentStatuses = new Set(['offline', 'available', 'busy', 'break']);
const validStrategies = new Set(['longest_idle', 'round_robin', 'priority']);
const endedCallStatuses = new Set(['ended', 'completed', 'failed', 'busy', 'no-answer', 'canceled']);

function cleanPhone(value) {
  return String(value || '').trim().replace(/[\s().-]/g, '');
}

function parseJson(value, fallback = {}) {
  try { return JSON.parse(value || '{}'); } catch { return fallback; }
}

function scoreLead(lead) {
  let fit = 0;
  let engagement = 0;
  if (lead.company) fit += 20;
  if (lead.website) fit += 15;
  if (lead.email) engagement += 20;
  if (lead.phone) engagement += 20;
  if (lead.notes) engagement += 10;
  if (lead.source) fit += 10;
  const score = Math.min(100, fit + engagement);
  return { fit, engagement, score, status: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold' };
}

function carrierConfig(env) {
  const configured = Boolean(env.VOIP_PROVIDER_URL && env.VOIP_PROVIDER_TOKEN);
  return {
    browserCalling: true,
    pstnConfigured: configured,
    provider: configured ? String(env.VOIP_PROVIDER_NAME || 'carrier-bridge') : null,
    inboundConfigured: configured && Boolean(env.VOIP_WEBHOOK_SECRET),
    callerId: configured ? String(env.VOIP_CALLER_ID || '') : '',
    stun: 'stun:stun.l.google.com:19302',
    message: configured
      ? 'The carrier bridge is ready for ordinary telephone numbers.'
      : 'Free browser calling is ready. Add a compatible carrier bridge to call mobile and landline numbers.'
  };
}

async function logEvent(env, tenantId, callId, eventType, status = '', detail = '', payload = {}) {
  await env.DB.prepare(
    'INSERT INTO call_events(tenant_id,call_id,event_type,status,detail,payload_json,created_at) VALUES(?,?,?,?,?,?,?)'
  ).bind(
    tenantId,
    callId,
    eventType,
    status,
    String(detail || '').slice(0, 1000),
    JSON.stringify(payload || {}).slice(0, 20000),
    now()
  ).run();
}

async function placeCarrierCall(env, payload) {
  if (!carrierConfig(env).pstnConfigured) {
    const error = new Error('Connect a carrier bridge before calling an ordinary phone number.');
    error.code = 'CARRIER_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch(env.VOIP_PROVIDER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.VOIP_PROVIDER_TOKEN}`,
      'x-iam-platform': 'I-AM-Magnanimous-Way'
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { detail: text }; }
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Carrier rejected the call (${response.status}).`);
  }
  return data || {};
}

async function handleCarrierWebhook(request, env) {
  if (!env.VOIP_WEBHOOK_SECRET) return json({ detail: 'Carrier webhooks are not configured.' }, 503);
  const supplied = request.headers.get('x-iam-webhook-secret') || '';
  if (supplied !== env.VOIP_WEBHOOK_SECRET) return json({ detail: 'Invalid webhook signature.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ detail: 'Invalid webhook payload.' }, 400); }
  const providerCallId = String(body.provider_call_id || body.call_id || body.id || '').trim();
  const status = String(body.status || body.event_type || '').toLowerCase();
  if (!providerCallId || !status) return json({ detail: 'provider_call_id and status are required.' }, 400);
  const call = await env.DB.prepare('SELECT * FROM phone_calls WHERE provider_call_id=? ORDER BY id DESC LIMIT 1')
    .bind(providerCallId).first();
  if (!call) return json({ detail: 'Call not found.' }, 404);
  const connected = ['connected', 'answered', 'in-progress'].includes(status);
  const ended = endedCallStatuses.has(status);
  const startedAt = connected && !call.started_at ? now() : call.started_at;
  const endedAt = ended ? now() : call.ended_at;
  const duration = endedAt && startedAt ? Math.max(0, endedAt - startedAt) : Number(call.duration_seconds || 0);
  await env.DB.prepare(
    "UPDATE phone_calls SET status=?,started_at=?,ended_at=?,duration_seconds=?,recording_url=COALESCE(NULLIF(?,''),recording_url),updated_at=? WHERE id=?"
  ).bind(status, startedAt || null, endedAt || null, duration, String(body.recording_url || ''), now(), call.id).run();
  await logEvent(env, call.tenant_id, call.id, String(body.event_type || 'carrier-status'), status, body.detail || '', body);
  return json({ ok: true, call_id: call.id });
}

async function leadRoutes(request, env, user, path, url) {
  const tenantId = user.tenant_id;
  if (path === '/api/leads/summary' && request.method === 'GET') {
    const [total, hot, warm, cold] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) count FROM leads WHERE tenant_id=?').bind(tenantId).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM leads WHERE tenant_id=? AND status='hot'").bind(tenantId).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM leads WHERE tenant_id=? AND status='warm'").bind(tenantId).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM leads WHERE tenant_id=? AND status='cold'").bind(tenantId).first()
    ]);
    return json({ total: total?.count || 0, hot: hot?.count || 0, warm: warm?.count || 0, cold: cold?.count || 0 });
  }

  if (path === '/api/leads' && request.method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const filter = url.searchParams.get('filter') || '';
    let sql = 'SELECT * FROM leads WHERE tenant_id=?';
    const args = [tenantId];
    if (q) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
      const x = `%${q}%`;
      args.push(x, x, x, x, x);
    }
    if (filter) { sql += ' AND status=?'; args.push(filter); }
    sql += ' ORDER BY score DESC,id DESC LIMIT 500';
    const { results } = await env.DB.prepare(sql).bind(...args).all();
    return json({ leads: results || [] });
  }

  if (path === '/api/leads' && request.method === 'POST') {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const duplicate = await env.DB.prepare(
      "SELECT id FROM leads WHERE tenant_id=? AND ((email<>'' AND email=?) OR (phone<>'' AND phone=?)) LIMIT 1"
    ).bind(tenantId, email, phone).first();
    if (duplicate) return json({ duplicate: true, id: duplicate.id, detail: 'A matching lead already exists.' }, 409);
    const scored = scoreLead(body);
    const timestamp = now();
    const result = await env.DB.prepare(
      'INSERT INTO leads(tenant_id,first_name,last_name,email,phone,company,website,source,status,score,fit_score,engagement_score,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(
      tenantId, body.first_name || '', body.last_name || '', email, phone, body.company || '',
      body.website || '', body.source || 'manual', scored.status, scored.score, scored.fit,
      scored.engagement, body.notes || '', timestamp, timestamp
    ).run();
    return json({ id: result.meta.last_row_id, ...scored }, 201);
  }

  if (path === '/api/leads/generate' && request.method === 'POST') {
    const body = await request.json();
    const count = Math.min(Math.max(Number(body.count || 5), 1), 50);
    const seed = String(body.seed || body.industry || 'prospect').trim();
    const leads = [];
    for (let index = 1; index <= count; index += 1) {
      const lead = {
        first_name: `Prospect ${index}`,
        last_name: '',
        company: `${seed} Prospect ${index}`,
        email: '',
        phone: '',
        website: '',
        source: 'lead-generator',
        notes: `Generated prospect placeholder for ${seed}. Enrich with an approved data provider or import verified contact data before outreach.`
      };
      const scored = scoreLead(lead);
      const timestamp = now();
      const result = await env.DB.prepare(
        'INSERT INTO leads(tenant_id,first_name,last_name,email,phone,company,website,source,status,score,fit_score,engagement_score,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(
        tenantId, lead.first_name, '', '', '', lead.company, '', lead.source, scored.status,
        scored.score, scored.fit, scored.engagement, lead.notes, timestamp, timestamp
      ).run();
      leads.push({ id: result.meta.last_row_id, ...lead, ...scored });
    }
    return json({ generated: leads.length, leads }, 201);
  }
  return json({ detail: 'Lead route not found.' }, 404);
}

async function phoneRoutes(request, env, user, path, url) {
  const tenantId = user.tenant_id;

  if (path === '/api/phone/config' && request.method === 'GET') return json(carrierConfig(env));

  if (path === '/api/phone/summary' && request.method === 'GET') {
    const startOfDay = now() - (now() % 86400);
    const [agents, available, active, today, queues] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) count FROM call_center_agents WHERE tenant_id=? AND active=1').bind(tenantId).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM call_center_agents WHERE tenant_id=? AND active=1 AND status='available'").bind(tenantId).first(),
      env.DB.prepare("SELECT COUNT(*) count FROM phone_calls WHERE tenant_id=? AND status IN ('created','queued','dialing','ringing','connected')").bind(tenantId).first(),
      env.DB.prepare('SELECT COUNT(*) count FROM phone_calls WHERE tenant_id=? AND created_at>=?').bind(tenantId, startOfDay).first(),
      env.DB.prepare('SELECT COUNT(*) count FROM call_queues WHERE tenant_id=? AND active=1').bind(tenantId).first()
    ]);
    return json({
      agents: agents?.count || 0,
      available: available?.count || 0,
      active_calls: active?.count || 0,
      calls_today: today?.count || 0,
      queues: queues?.count || 0
    });
  }

  if (path === '/api/phone/agents' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM call_center_agents WHERE tenant_id=? ORDER BY active DESC,name ASC'
    ).bind(tenantId).all();
    return json({
      agents: (results || []).map(agent => ({
        ...agent,
        skills: String(agent.skills || '').split(',').map(x => x.trim()).filter(Boolean)
      }))
    });
  }

  if (path === '/api/phone/agents/me' && request.method === 'PUT') {
    const body = await request.json();
    const status = validAgentStatuses.has(String(body.status)) ? String(body.status) : 'available';
    const skills = Array.isArray(body.skills) ? body.skills.join(',') : String(body.skills || '');
    const timestamp = now();
    const existing = await env.DB.prepare(
      'SELECT id FROM call_center_agents WHERE tenant_id=? AND user_id=?'
    ).bind(tenantId, user.id).first();
    const id = existing?.id || crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO call_center_agents(
      id,tenant_id,user_id,name,extension,status,skills,active,last_seen_at,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,extension=excluded.extension,status=excluded.status,skills=excluded.skills,
      active=1,last_seen_at=excluded.last_seen_at,updated_at=excluded.updated_at`)
      .bind(
        id, tenantId, user.id, user.name || user.email, String(body.extension || ''), status,
        skills, 1, timestamp, timestamp, timestamp
      ).run();
    return json({ ok: true, id, status });
  }

  if (path === '/api/phone/agents' && request.method === 'POST') {
    if (user.role !== 'owner') return json({ detail: 'Owner access required.' }, 403);
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return json({ detail: 'Agent name is required.' }, 400);
    const id = crypto.randomUUID();
    const timestamp = now();
    await env.DB.prepare(
      'INSERT INTO call_center_agents(id,tenant_id,user_id,name,extension,status,skills,active,last_seen_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(
      id, tenantId, body.user_id || null, name, String(body.extension || ''),
      validAgentStatuses.has(String(body.status)) ? String(body.status) : 'offline',
      Array.isArray(body.skills) ? body.skills.join(',') : String(body.skills || ''),
      1, null, timestamp, timestamp
    ).run();
    return json({ id }, 201);
  }

  if (path === '/api/phone/queues' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT q.*,
      (SELECT COUNT(*) FROM call_queue_members member WHERE member.queue_id=q.id) member_count
      FROM call_queues q WHERE q.tenant_id=? ORDER BY q.active DESC,q.name ASC`)
      .bind(tenantId).all();
    return json({ queues: results || [] });
  }

  if (path === '/api/phone/queues' && request.method === 'POST') {
    if (user.role !== 'owner') return json({ detail: 'Owner access required.' }, 403);
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return json({ detail: 'Queue name is required.' }, 400);
    const strategy = validStrategies.has(String(body.strategy)) ? String(body.strategy) : 'longest_idle';
    const id = crypto.randomUUID();
    const timestamp = now();
    await env.DB.prepare(
      'INSERT INTO call_queues(id,tenant_id,name,strategy,greeting,max_wait_seconds,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)'
    ).bind(
      id, tenantId, name, strategy, String(body.greeting || ''),
      Math.min(Math.max(Number(body.max_wait_seconds || 300), 30), 3600), 1, timestamp, timestamp
    ).run();
    for (const agentId of Array.isArray(body.agent_ids) ? body.agent_ids : []) {
      const agent = await env.DB.prepare('SELECT id FROM call_center_agents WHERE id=? AND tenant_id=?')
        .bind(String(agentId), tenantId).first();
      if (agent) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO call_queue_members(queue_id,agent_id,priority,created_at) VALUES(?,?,?,?)'
        ).bind(id, agent.id, 100, timestamp).run();
      }
    }
    return json({ id }, 201);
  }

  if (path === '/api/phone/calls' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT call.*,agent.name agent_name,queue.name queue_name
      FROM phone_calls call
      LEFT JOIN call_center_agents agent ON agent.id=call.agent_id AND agent.tenant_id=call.tenant_id
      LEFT JOIN call_queues queue ON queue.id=call.queue_id AND queue.tenant_id=call.tenant_id
      WHERE call.tenant_id=? ORDER BY call.created_at DESC LIMIT 200`)
      .bind(tenantId).all();
    return json({ calls: (results || []).map(call => ({ ...call, metadata: parseJson(call.metadata_json) })) });
  }

  if (path === '/api/phone/calls' && request.method === 'POST') {
    const body = await request.json();
    const timestamp = now();
    const result = await env.DB.prepare(`INSERT INTO phone_calls(
      tenant_id,contact_id,direction,caller,callee,status,started_at,created_at,
      provider,queue_id,agent_id,metadata_json,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      tenantId, body.contact_id || null, body.direction || 'outbound', body.caller || '',
      body.callee || '', body.status || 'created', body.started_at || timestamp, timestamp,
      body.provider || 'manual', body.queue_id || null, body.agent_id || null,
      JSON.stringify(body.metadata || {}), timestamp
    ).run();
    await logEvent(env, tenantId, result.meta.last_row_id, 'created', body.status || 'created');
    return json({ id: result.meta.last_row_id, created_at: timestamp }, 201);
  }

  if (path === '/api/phone/calls/outbound' && request.method === 'POST') {
    const body = await request.json();
    const to = cleanPhone(body.to);
    const from = cleanPhone(body.from || env.VOIP_CALLER_ID);
    if (!/^\+?[1-9]\d{6,14}$/.test(to)) return json({ detail: 'Enter a valid international phone number.' }, 400);
    if (!carrierConfig(env).pstnConfigured) {
      return json({
        detail: 'Connect a carrier bridge before calling an ordinary phone number.',
        code: 'CARRIER_NOT_CONFIGURED'
      }, 409);
    }
    const timestamp = now();
    const created = await env.DB.prepare(`INSERT INTO phone_calls(
      tenant_id,contact_id,direction,caller,callee,status,created_at,provider,
      queue_id,agent_id,metadata_json,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      tenantId, body.contact_id || null, 'outbound', from, to, 'dialing', timestamp,
      String(env.VOIP_PROVIDER_NAME || 'carrier-bridge'), body.queue_id || null,
      body.agent_id || null, JSON.stringify({ requested_by: user.id }), timestamp
    ).run();
    const callId = created.meta.last_row_id;
    try {
      const provider = await placeCarrierCall(env, {
        call_id: callId,
        tenant_id: tenantId,
        to,
        from,
        agent_id: body.agent_id || null,
        queue_id: body.queue_id || null,
        webhook_url: `${url.origin}/api/phone/webhook`
      });
      const providerCallId = String(provider.provider_call_id || provider.call_id || provider.id || '');
      const status = String(provider.status || 'dialing');
      await env.DB.prepare(
        'UPDATE phone_calls SET provider_call_id=?,status=?,metadata_json=?,updated_at=? WHERE id=? AND tenant_id=?'
      ).bind(providerCallId, status, JSON.stringify(provider).slice(0, 20000), now(), callId, tenantId).run();
      await logEvent(env, tenantId, callId, 'outbound-requested', status, '', provider);
      return json({ id: callId, provider_call_id: providerCallId, status }, 201);
    } catch (error) {
      await env.DB.prepare("UPDATE phone_calls SET status='failed',updated_at=? WHERE id=? AND tenant_id=?")
        .bind(now(), callId, tenantId).run();
      await logEvent(env, tenantId, callId, 'outbound-failed', 'failed', error?.message || 'Carrier call failed');
      return json({
        detail: error?.message || 'Carrier call failed.',
        code: error?.code || 'CARRIER_CALL_FAILED',
        call_id: callId
      }, error?.code === 'CARRIER_NOT_CONFIGURED' ? 409 : 502);
    }
  }

  const callMatch = path.match(/^\/api\/phone\/calls\/(\d+)$/);
  if (callMatch && request.method === 'PUT') {
    const callId = Number(callMatch[1]);
    const call = await env.DB.prepare('SELECT * FROM phone_calls WHERE id=? AND tenant_id=?')
      .bind(callId, tenantId).first();
    if (!call) return json({ detail: 'Call not found.' }, 404);
    const body = await request.json();
    const status = String(body.status || call.status);
    const endedAt = endedCallStatuses.has(status) ? (call.ended_at || now()) : call.ended_at;
    const duration = endedAt && call.started_at ? Math.max(0, endedAt - call.started_at) : Number(call.duration_seconds || 0);
    await env.DB.prepare(`UPDATE phone_calls SET
      status=?,agent_id=?,queue_id=?,disposition=?,notes=?,ended_at=?,duration_seconds=?,updated_at=?
      WHERE id=? AND tenant_id=?`).bind(
      status,
      body.agent_id ?? call.agent_id,
      body.queue_id ?? call.queue_id,
      String(body.disposition ?? call.disposition ?? ''),
      String(body.notes ?? call.notes ?? ''),
      endedAt || null,
      duration,
      now(),
      callId,
      tenantId
    ).run();
    await logEvent(env, tenantId, callId, 'updated', status, body.disposition || body.notes || '');
    return json({ ok: true });
  }

  if (path === '/api/phone/session' && request.method === 'POST') {
    const body = await request.json();
    const sessionId = crypto.randomUUID();
    const timestamp = now();
    await env.DB.prepare(
      'INSERT INTO phone_sessions(id,tenant_id,caller_user_id,callee_user_id,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?)'
    ).bind(sessionId, tenantId, user.id, body.callee_user_id || null, 'waiting', timestamp, timestamp + 900).run();
    const created = await env.DB.prepare(`INSERT INTO phone_calls(
      tenant_id,contact_id,direction,caller,callee,status,created_at,provider,
      provider_call_id,agent_id,metadata_json,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      tenantId, body.contact_id || null, 'outbound', user.name || user.email,
      String(body.callee_user_id || 'I AM user'), 'ringing', timestamp, 'browser',
      sessionId, body.agent_id || null, JSON.stringify({ session_id: sessionId }), timestamp
    ).run();
    await logEvent(env, tenantId, created.meta.last_row_id, 'browser-session-created', 'ringing');
    return json({ session_id: sessionId, call_id: created.meta.last_row_id, expires_at: timestamp + 900 }, 201);
  }

  const sessionMatch = path.match(/^\/api\/phone\/session\/([^/]+)$/);
  if (sessionMatch && request.method === 'GET') {
    const sessionId = sessionMatch[1];
    const session = await env.DB.prepare(
      'SELECT * FROM phone_sessions WHERE id=? AND tenant_id=? AND expires_at>?'
    ).bind(sessionId, tenantId, now()).first();
    if (!session) return json({ detail: 'Call session not found or expired' }, 404);
    const { results } = await env.DB.prepare(
      'SELECT id,sender_user_id,kind,payload,created_at FROM phone_signals WHERE session_id=? AND sender_user_id<>? ORDER BY id ASC'
    ).bind(sessionId, user.id).all();
    return json({ session, signals: results || [] });
  }

  if (sessionMatch && request.method === 'POST') {
    const sessionId = sessionMatch[1];
    const session = await env.DB.prepare(
      'SELECT * FROM phone_sessions WHERE id=? AND tenant_id=? AND expires_at>?'
    ).bind(sessionId, tenantId, now()).first();
    if (!session) return json({ detail: 'Call session not found or expired' }, 404);
    const body = await request.json();
    const kind = String(body.kind || 'candidate');
    if (!['offer', 'answer', 'candidate', 'hangup', 'ready'].includes(kind)) {
      return json({ detail: 'Invalid signal type' }, 400);
    }
    await env.DB.prepare(
      'INSERT INTO phone_signals(session_id,sender_user_id,kind,payload,created_at) VALUES(?,?,?,?,?)'
    ).bind(sessionId, user.id, kind, JSON.stringify(body.payload ?? null), now()).run();
    const call = await env.DB.prepare(
      'SELECT * FROM phone_calls WHERE tenant_id=? AND provider_call_id=? ORDER BY id DESC LIMIT 1'
    ).bind(tenantId, sessionId).first();
    if (kind === 'answer') {
      await env.DB.prepare(
        "UPDATE phone_sessions SET status='connected',callee_user_id=COALESCE(callee_user_id,?) WHERE id=? AND tenant_id=?"
      ).bind(user.id, sessionId, tenantId).run();
      if (call) {
        await env.DB.prepare(
          "UPDATE phone_calls SET status='connected',started_at=COALESCE(started_at,?),updated_at=? WHERE id=?"
        ).bind(now(), now(), call.id).run();
        await logEvent(env, tenantId, call.id, 'browser-connected', 'connected');
      }
    }
    if (kind === 'hangup') {
      await env.DB.prepare("UPDATE phone_sessions SET status='ended' WHERE id=? AND tenant_id=?")
        .bind(sessionId, tenantId).run();
      if (call) {
        const endedAt = now();
        const duration = call.started_at ? Math.max(0, endedAt - call.started_at) : 0;
        await env.DB.prepare(
          "UPDATE phone_calls SET status='ended',ended_at=?,duration_seconds=?,updated_at=? WHERE id=?"
        ).bind(endedAt, duration, endedAt, call.id).run();
        await logEvent(env, tenantId, call.id, 'browser-ended', 'ended');
      }
    }
    return json({ ok: true });
  }

  return json({ detail: 'Phone route not found.' }, 404);
}

export async function handleLeadPhone(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/leads') && !path.startsWith('/api/phone')) return null;
  if (path === '/api/phone/webhook' && request.method === 'POST') return handleCarrierWebhook(request, env);
  const user = await auth(request, env);
  if (!user) return json({ detail: 'Sign in required' }, 401);
  if (path.startsWith('/api/leads')) return leadRoutes(request, env, user, path, url);
  return phoneRoutes(request, env, user, path, url);
}
