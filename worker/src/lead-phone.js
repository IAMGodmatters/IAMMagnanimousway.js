const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret || 'change-me'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
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
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
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

export async function handleLeadPhone(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/leads') && !path.startsWith('/api/phone')) return null;
  const user = await auth(request, env);
  if (!user) return json({ detail: 'Sign in required' }, 401);
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
      const x = `%${q}%`; args.push(x, x, x, x, x);
    }
    if (filter) { sql += ' AND status=?'; args.push(filter); }
    sql += ' ORDER BY score DESC, id DESC LIMIT 500';
    const { results } = await env.DB.prepare(sql).bind(...args).all();
    return json({ leads: results });
  }

  if (path === '/api/leads' && request.method === 'POST') {
    const b = await request.json();
    const scored = scoreLead(b);
    const duplicate = await env.DB.prepare('SELECT id FROM leads WHERE tenant_id=? AND ((email<>\'\' AND email=?) OR (phone<>\'\' AND phone=?)) LIMIT 1').bind(tenantId, String(b.email || '').trim().toLowerCase(), String(b.phone || '').trim()).first();
    if (duplicate) return json({ duplicate: true, id: duplicate.id, detail: 'A matching lead already exists.' }, 409);
    const t = now();
    const r = await env.DB.prepare('INSERT INTO leads(tenant_id,first_name,last_name,email,phone,company,website,source,status,score,fit_score,engagement_score,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(tenantId, b.first_name || '', b.last_name || '', String(b.email || '').trim().toLowerCase(), b.phone || '', b.company || '', b.website || '', b.source || 'manual', scored.status, scored.score, scored.fit, scored.engagement, b.notes || '', t, t).run();
    return json({ id: r.meta.last_row_id, ...scored }, 201);
  }

  if (path === '/api/leads/generate' && request.method === 'POST') {
    const b = await request.json();
    const count = Math.min(Math.max(Number(b.count || 5), 1), 50);
    const seed = String(b.seed || b.industry || 'prospect').trim();
    const leads = [];
    for (let i = 1; i <= count; i++) {
      const first = `Prospect ${i}`;
      const lead = { first_name: first, last_name: '', company: `${seed} Prospect ${i}`, email: '', phone: '', website: '', source: 'lead-generator', notes: `Generated prospect placeholder for ${seed}. Enrich with an approved data provider or import verified contact data before outreach.` };
      const scored = scoreLead(lead);
      const t = now();
      const r = await env.DB.prepare('INSERT INTO leads(tenant_id,first_name,last_name,email,phone,company,website,source,status,score,fit_score,engagement_score,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(tenantId, lead.first_name, lead.last_name, '', '', lead.company, '', lead.source, scored.status, scored.score, scored.fit, scored.engagement, lead.notes, t, t).run();
      leads.push({ id: r.meta.last_row_id, ...lead, ...scored });
    }
    return json({ generated: leads.length, leads }, 201);
  }

  if (path === '/api/phone/calls' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM phone_calls WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200').bind(tenantId).all();
    return json({ calls: results });
  }

  if (path === '/api/phone/calls' && request.method === 'POST') {
    const b = await request.json();
    const t = now();
    const r = await env.DB.prepare('INSERT INTO phone_calls(tenant_id,contact_id,direction,caller,callee,status,started_at,created_at) VALUES(?,?,?,?,?,?,?,?)')
      .bind(tenantId, b.contact_id || null, b.direction || 'outbound', b.caller || '', b.callee || '', b.status || 'created', t, t).run();
    return json({ id: r.meta.last_row_id, created_at: t }, 201);
  }

  if (path === '/api/phone/config' && request.method === 'GET') {
    return json({
      browserCalling: true,
      pstnConfigured: Boolean(env.VOIP_PROVIDER_URL && env.VOIP_PROVIDER_TOKEN),
      provider: env.VOIP_PROVIDER_NAME || null,
      message: env.VOIP_PROVIDER_URL ? 'Carrier integration is configured for this deployment.' : 'Browser-to-browser Internet calling is available. A PSTN carrier is required for ordinary telephone numbers.'
    });
  }

  return json({ detail: 'Not found' }, 404);
}
