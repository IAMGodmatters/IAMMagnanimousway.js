import { handleIntegrations, currentUser, ensureIntegrationTables } from './integrations.js';

const BASE = 'https://backend.composio.dev';
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);

const EMAIL_PROVIDERS = {
  google: {
    toolkit: 'gmail',
    display: 'Google / Gmail',
    readTool: 'GMAIL_FETCH_EMAILS',
    sendTool: 'GMAIL_SEND_EMAIL',
    direct: env => Boolean(String(env?.GOOGLE_CLIENT_ID || '').trim() && String(env?.GOOGLE_CLIENT_SECRET || '').trim())
  },
  outlook: {
    toolkit: 'outlook',
    display: 'Microsoft Outlook',
    readTool: 'OUTLOOK_QUERY_EMAILS',
    sendTool: 'OUTLOOK_SEND_EMAIL',
    direct: env => Boolean(String(env?.MICROSOFT_CLIENT_ID || '').trim() && String(env?.MICROSOFT_CLIENT_SECRET || '').trim())
  }
};

function managedReady(env) {
  return Boolean(String(env?.COMPOSIO_API_KEY || '').trim());
}

function safeOrigin(value, fallback) {
  try {
    const u = new URL(String(value || ''));
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.origin : fallback;
  } catch { return fallback; }
}

function parseJson(value, fallback = {}) {
  try { return JSON.parse(value || '{}'); } catch { return fallback; }
}

function limit(value) {
  const n = Number(value || 10);
  return Math.max(1, Math.min(20, Number.isFinite(n) ? Math.floor(n) : 10));
}

function recipients(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[;,]/g);
  return raw.map(x => String(x || '').trim()).filter(Boolean).filter(x => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x));
}

function composioUser(user) {
  return `iam:${user.tenant_id}:${user.id}`;
}

async function ensureManagedTables(env) {
  await ensureIntegrationTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS managed_auth_configs (
    provider TEXT PRIMARY KEY,
    toolkit TEXT NOT NULL,
    auth_config_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
}

async function composioRequest(env, path, options = {}) {
  const key = String(env?.COMPOSIO_API_KEY || '').trim();
  if (!key) throw new Error('Managed email authorization is not configured.');
  const headers = new Headers(options.headers || {});
  headers.set('x-api-key', key);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = data?.error?.message || data?.message || data?.detail || data?.error || `Managed authorization request failed (${response.status}).`;
    const e = new Error(String(error));
    e.status = response.status;
    throw e;
  }
  return data;
}

async function createAuthConfig(env, provider) {
  const def = EMAIL_PROVIDERS[provider];
  const body = {
    toolkit: { slug: def.toolkit },
    auth_config: {
      type: 'use_composio_managed_auth',
      credentials: {},
      restrict_to_following_tools: [def.readTool, def.sendTool]
    }
  };
  const created = await composioRequest(env, '/api/v3.1/auth_configs', { method: 'POST', body: JSON.stringify(body) });
  const id = String(created?.auth_config?.id || created?.id || '').trim();
  if (!id) throw new Error(`Managed authorization did not return an auth configuration for ${def.display}.`);
  const ts = now();
  await env.DB.prepare(`INSERT INTO managed_auth_configs(provider,toolkit,auth_config_id,created_at,updated_at)
    VALUES(?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET toolkit=excluded.toolkit,auth_config_id=excluded.auth_config_id,updated_at=excluded.updated_at`)
    .bind(provider, def.toolkit, id, ts, ts).run();
  return id;
}

async function authConfig(env, provider) {
  const row = await env.DB.prepare('SELECT auth_config_id FROM managed_auth_configs WHERE provider=?').bind(provider).first();
  return String(row?.auth_config_id || '').trim() || createAuthConfig(env, provider);
}

async function startManagedConnection(request, env, user, provider) {
  const def = EMAIL_PROVIDERS[provider];
  let configId = await authConfig(env, provider);
  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const metadata = {
    managed_auth: 'composio',
    user_id: String(user.id),
    composio_user_id: composioUser(user),
    return_origin: safeOrigin(request.headers.get('origin'), origin),
    toolkit: def.toolkit
  };
  await env.DB.prepare('INSERT INTO integration_states(state,tenant_id,provider,created_at,expires_at,metadata_json) VALUES(?,?,?,?,?,?)')
    .bind(state, user.tenant_id, `composio:${provider}`, now(), now() + 900, JSON.stringify(metadata)).run();

  const callback = `${origin}/api/integrations/composio/callback?state=${encodeURIComponent(state)}&provider=${encodeURIComponent(provider)}`;
  const makeLink = async id => composioRequest(env, '/api/v3.1/connected_accounts/link', {
    method: 'POST',
    body: JSON.stringify({ auth_config_id: id, user_id: metadata.composio_user_id, callback_url: callback })
  });

  let link;
  try {
    link = await makeLink(configId);
  } catch (error) {
    if (![400, 404, 410].includes(Number(error?.status || 0))) throw error;
    await env.DB.prepare('DELETE FROM managed_auth_configs WHERE provider=?').bind(provider).run();
    configId = await createAuthConfig(env, provider);
    link = await makeLink(configId);
  }

  const redirect = String(link?.redirect_url || '').trim();
  const connectedId = String(link?.connected_account_id || '').trim();
  if (!redirect || !connectedId) throw new Error(`Managed authorization could not create a secure ${def.display} connection link.`);
  metadata.expected_connected_account_id = connectedId;
  metadata.auth_config_id = configId;
  await env.DB.prepare('UPDATE integration_states SET metadata_json=? WHERE state=?').bind(JSON.stringify(metadata), state).run();
  return json({ authorization_url: redirect, authorization_mode: 'managed', managed_auth_provider: 'composio' });
}

function callbackHtml({ state, provider, connectedId, status }) {
  const values = JSON.stringify({ state, provider, connectedId, status });
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>I AM secure email connection</title></head><body style="margin:0;background:#050a10;color:#eaf8ff;font-family:system-ui;padding:36px"><main style="max-width:680px;margin:auto"><h1>Finishing your secure email connection…</h1><p id="status">I AM is verifying the provider authorization.</p></main><script>
const info=${values};
(async()=>{
 const out=document.getElementById('status');
 if(info.status&&info.status!=='success'){out.textContent='The provider authorization was not completed.';return;}
 const token=localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
 if(!token){out.textContent='Sign in to I AM again, then reconnect your mailbox.';setTimeout(()=>location.replace('/login'),900);return;}
 try{
  const r=await fetch('/api/integrations/composio/finalize',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({state:info.state,provider:info.provider,connected_account_id:info.connectedId})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||'Unable to finish the secure connection.');
  out.textContent='Connected securely. You can return to I AM.';
  if(window.opener){window.opener.postMessage({type:'iam-integration-connected',provider:info.provider,count:1},location.origin);setTimeout(()=>window.close(),450)}
  else setTimeout(()=>location.replace('/connections?integration='+encodeURIComponent(info.provider)+'&connected=1'),500);
 }catch(e){out.textContent=e&&e.message?e.message:'Unable to finish the secure connection.'}
})();
</script></body></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}

async function finalizeManaged(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in to finish the managed email connection.' }, 401);
  const body = await request.json().catch(() => ({}));
  const state = String(body?.state || '');
  const provider = String(body?.provider || '');
  const connectedId = String(body?.connected_account_id || '');
  const def = EMAIL_PROVIDERS[provider];
  if (!state || !def || !connectedId) return json({ error: 'Managed email connection data is incomplete.' }, 400);
  const row = await env.DB.prepare('SELECT tenant_id,provider,expires_at,metadata_json FROM integration_states WHERE state=?').bind(state).first();
  if (!row || row.provider !== `composio:${provider}` || Number(row.expires_at || 0) < now()) return json({ error: 'Managed authorization state expired or is invalid.' }, 400);
  if (String(row.tenant_id) !== String(user.tenant_id)) return json({ error: 'Managed authorization belongs to a different workspace.' }, 403);
  const metadata = parseJson(row.metadata_json);
  if (String(metadata.user_id || '') !== String(user.id)) return json({ error: 'Managed authorization belongs to a different signed-in user.' }, 403);
  if (String(metadata.expected_connected_account_id || '') !== connectedId) return json({ error: 'Managed authorization account mismatch.' }, 403);

  const account = await composioRequest(env, `/api/v3.1/connected_accounts/${encodeURIComponent(connectedId)}`);
  if (String(account?.status || '').toUpperCase() !== 'ACTIVE') return json({ error: 'The provider authorization has not become active yet. Finish authorization and try again.' }, 409);
  if (String(account?.user_id || '') !== String(metadata.composio_user_id || '')) return json({ error: 'Managed authorization user verification failed.' }, 403);
  if (String(account?.toolkit?.slug || '').toLowerCase() !== def.toolkit) return json({ error: 'Managed authorization toolkit verification failed.' }, 403);

  const external = `composio:${connectedId}`;
  const display = String(account?.data?.email || account?.data?.email_address || account?.data?.name || `${def.display} (managed)`);
  const storedMetadata = {
    auth_source: 'composio',
    composio_connected_account_id: connectedId,
    composio_user_id: metadata.composio_user_id,
    toolkit: def.toolkit,
    auth_config_id: account?.auth_config?.id || metadata.auth_config_id || '',
    managed_tokens: true
  };
  const ts = now();
  await env.DB.prepare(`INSERT INTO integrations(tenant_id,provider,external_account_id,display_name,access_token,refresh_token,token_expires_at,metadata_json,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider,external_account_id) DO UPDATE SET display_name=excluded.display_name,access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
    .bind(user.tenant_id, provider, external, display, 'managed:composio', '', null, JSON.stringify(storedMetadata), ts, ts).run();
  await env.DB.prepare('DELETE FROM integration_states WHERE state=?').bind(state).run();
  return json({ ok: true, provider, connected: { external_account_id: external, display_name: display }, managed_auth_provider: 'composio' });
}

async function disconnectManaged(request, env, provider) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in to manage connections.' }, 401);
  const { results } = await env.DB.prepare('SELECT external_account_id,metadata_json FROM integrations WHERE tenant_id=? AND provider=?').bind(user.tenant_id, provider).all();
  const rows = results || [];
  const managed = rows.map(row => ({ row, meta: parseJson(row.metadata_json) })).filter(x => x.meta.auth_source === 'composio' || String(x.row.external_account_id || '').startsWith('composio:'));
  if (!managed.length) return null;
  if (managedReady(env)) {
    for (const item of managed) {
      const id = String(item.meta.composio_connected_account_id || item.row.external_account_id || '').replace(/^composio:/, '');
      if (!id) continue;
      try { await composioRequest(env, `/api/v3.1/connected_accounts/${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch (error) { console.warn('Composio revoke/delete failed during local disconnect', error?.message || error); }
    }
  }
  await env.DB.prepare('DELETE FROM integrations WHERE tenant_id=? AND provider=?').bind(user.tenant_id, provider).run();
  return json({ ok: true, managed_auth_provider: 'composio' });
}

async function emailPermission(env, tenantId, provider) {
  const row = await env.DB.prepare('SELECT can_read,can_write FROM assistant_permissions WHERE tenant_id=? AND provider=?').bind(tenantId, provider).first();
  return row ? { can_read: !!row.can_read, can_write: !!row.can_write } : { can_read: true, can_write: true };
}

async function ensureActionTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_permissions (tenant_id TEXT NOT NULL,provider TEXT NOT NULL,can_read INTEGER NOT NULL DEFAULT 1,can_write INTEGER NOT NULL DEFAULT 1,require_confirmation INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,provider))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_actions (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,provider TEXT NOT NULL,external_account_id TEXT NOT NULL DEFAULT '',action TEXT NOT NULL,status TEXT NOT NULL,requires_confirmation INTEGER NOT NULL DEFAULT 0,payload_json TEXT NOT NULL DEFAULT '{}',result_json TEXT NOT NULL DEFAULT '{}',error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_activity (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,provider TEXT NOT NULL,action TEXT NOT NULL,status TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
}

async function logActivity(env, user, provider, action, status, detail = '') {
  await env.DB.prepare('INSERT INTO assistant_activity(tenant_id,user_id,provider,action,status,detail,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(user.tenant_id, user.id, provider, action, status, String(detail || '').slice(0, 1000), now()).run();
}

async function executeTool(env, { slug, connectedAccountId, userId, arguments: args, text }) {
  const body = { connected_account_id: connectedAccountId, user_id: userId, version: 'latest' };
  if (args) body.arguments = args;
  else body.text = String(text || '');
  const response = await composioRequest(env, `/api/v3.1/tools/execute/${encodeURIComponent(slug)}`, { method: 'POST', body: JSON.stringify(body) });
  if (response?.successful === false || response?.error) throw new Error(response?.error?.message || response?.error || `${slug} failed.`);
  return response?.data ?? response;
}

function normalizedMessages(provider, data) {
  const candidates = [data?.messages, data?.items, data?.value, data?.data?.messages, data?.data?.items, data?.data?.value, data?.data];
  const rows = candidates.find(Array.isArray) || [];
  const mapped = rows.slice(0, 20).map((m, i) => {
    const from = m?.from?.emailAddress?.address || m?.from?.address || m?.sender?.email || m?.sender || m?.from || '';
    const toRaw = m?.toRecipients || m?.to || m?.recipients || [];
    const to = Array.isArray(toRaw) ? toRaw.map(x => x?.emailAddress?.address || x?.address || x?.email || x).filter(Boolean) : toRaw;
    return {
      id: m?.id || m?.message_id || m?.messageId || String(i),
      from: typeof from === 'string' ? from : JSON.stringify(from),
      to,
      subject: m?.subject || m?.headers?.subject || '(no subject)',
      date: m?.receivedDateTime || m?.received_at || m?.date || m?.internalDate || '',
      snippet: m?.bodyPreview || m?.snippet || m?.preview || m?.body?.preview || m?.text_preview || '',
      is_read: typeof m?.isRead === 'boolean' ? m.isRead : undefined,
      web_link: m?.webLink || m?.web_link || ''
    };
  });
  return { provider, managed_auth_provider: 'composio', count: mapped.length, messages: mapped, raw: mapped.length ? undefined : data };
}

async function runManagedEmailAction(request, env, body) {
  const provider = String(body?.provider || '');
  const action = String(body?.action || '');
  const def = EMAIL_PROVIDERS[provider];
  if (!def || !['read_mail', 'send_mail'].includes(action)) return null;
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in to use connected email assistance.' }, 401);
  const external = String(body?.external_account_id || '');
  const row = external
    ? await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? AND external_account_id=? ORDER BY updated_at DESC LIMIT 1').bind(user.tenant_id, provider, external).first()
    : await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? ORDER BY updated_at DESC LIMIT 1').bind(user.tenant_id, provider).first();
  if (!row) return null;
  const meta = parseJson(row.metadata_json);
  if (meta.auth_source !== 'composio' && !String(row.external_account_id || '').startsWith('composio:')) return null;
  if (!managedReady(env)) return json({ error: 'This managed mailbox connection needs the platform managed-auth key restored.' }, 503);

  await ensureActionTables(env);
  const permission = await emailPermission(env, user.tenant_id, provider);
  if (action === 'read_mail' && !permission.can_read) return json({ error: `AI read access is disabled for ${def.display}.` }, 403);
  if (action === 'send_mail' && !permission.can_write) return json({ error: `AI write access is disabled for ${def.display}.` }, 403);

  const connectedAccountId = String(meta.composio_connected_account_id || row.external_account_id || '').replace(/^composio:/, '');
  const userId = String(meta.composio_user_id || composioUser(user));
  if (!connectedAccountId) return json({ error: 'Managed mailbox connection ID is missing. Reconnect the mailbox.' }, 409);

  const id = crypto.randomUUID();
  const ts = now();
  await env.DB.prepare('INSERT INTO assistant_actions(id,tenant_id,user_id,provider,external_account_id,action,status,requires_confirmation,payload_json,result_json,error_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, user.tenant_id, user.id, provider, row.external_account_id, action, 'running', 0, JSON.stringify({ managed_auth: 'composio', action }), '{}', '', ts, ts).run();
  await logActivity(env, user, provider, action, 'running', 'Managed email assistant action started.');

  try {
    const payload = body?.payload || {};
    let result;
    if (action === 'read_mail') {
      const max = limit(payload.limit);
      if (provider === 'google') {
        const data = await executeTool(env, {
          slug: def.readTool,
          connectedAccountId,
          userId,
          arguments: { user_id: 'me', query: String(payload.query || 'in:inbox'), max_results: max, include_payload: false }
        });
        result = normalizedMessages(provider, data);
      } else {
        const query = String(payload.query || '').trim();
        const data = await executeTool(env, {
          slug: def.readTool,
          connectedAccountId,
          userId,
          text: `Return the ${max} most recent Outlook mailbox messages${query ? ` matching this user search request: ${query}` : ''}. Include sender, recipients, subject, received time, read status, and a short body preview.`
        });
        result = normalizedMessages(provider, data);
      }
    } else {
      const to = recipients(payload.to);
      const cc = recipients(payload.cc);
      const bcc = recipients(payload.bcc);
      const subject = String(payload.subject || '').replace(/[\r\n]+/g, ' ').trim();
      const messageBody = String(payload.body || payload.text || '').trim();
      if (!to.length) throw new Error('Enter at least one valid email recipient.');
      if (!messageBody) throw new Error('Email message text is required.');
      let data;
      if (provider === 'google') {
        data = await executeTool(env, {
          slug: def.sendTool,
          connectedAccountId,
          userId,
          arguments: { user_id: 'me', recipient_email: to[0], extra_recipients: to.slice(1), cc, bcc, subject, body: messageBody, is_html: false }
        });
      } else {
        try {
          data = await executeTool(env, {
            slug: def.sendTool,
            connectedAccountId,
            userId,
            arguments: { user_id: 'me', to_email: to[0], cc_emails: cc, bcc_emails: bcc, subject, body: messageBody, is_html: false, save_to_sent_items: true }
          });
        } catch (firstError) {
          data = await executeTool(env, {
            slug: def.sendTool,
            connectedAccountId,
            userId,
            text: `Send one plain-text email. To: ${to.join(', ')}. CC: ${cc.join(', ') || 'none'}. BCC: ${bcc.join(', ') || 'none'}. Subject: ${subject || '(no subject)'}. Body: ${messageBody}`
          });
        }
      }
      result = { provider, managed_auth_provider: 'composio', sent: true, to, subject, provider_result: data };
    }
    await env.DB.prepare("UPDATE assistant_actions SET status='completed',result_json=?,error_text='',updated_at=? WHERE id=? AND tenant_id=?")
      .bind(JSON.stringify(result || {}).slice(0, 100000), now(), id, user.tenant_id).run();
    await logActivity(env, user, provider, action, 'completed', action === 'send_mail' ? 'Email sent through managed provider authorization.' : 'Managed mailbox read completed.');
    return json({ id, ok: true, status: 'completed', result });
  } catch (error) {
    const message = String(error?.message || error || 'Managed email action failed.');
    await env.DB.prepare("UPDATE assistant_actions SET status='failed',error_text=?,updated_at=? WHERE id=? AND tenant_id=?")
      .bind(message.slice(0, 1000), now(), id, user.tenant_id).run();
    await logActivity(env, user, provider, action, 'failed', message);
    return json({ error: message, id, status: 'failed' }, 502);
  }
}

export async function handleComposioManagedAuth(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/integrations')) return null;
  await ensureManagedTables(env);

  if (request.method === 'GET' && url.pathname === '/api/integrations') {
    const response = await handleIntegrations(request, env);
    if (!response?.ok) return response;
    const data = await response.json().catch(() => ({}));
    const integrations = (data.integrations || []).map(item => {
      const def = EMAIL_PROVIDERS[item.id];
      if (!def) return item;
      const direct = def.direct(env);
      const managed = managedReady(env);
      return {
        ...item,
        configured: Boolean(item.configured || managed),
        authorization_mode: direct ? 'direct' : managed ? 'managed' : 'setup_required',
        managed_auth_available: managed,
        managed_auth_provider: managed ? 'composio' : null
      };
    });
    return json({ ...data, integrations, managed_email_auth_available: managedReady(env) });
  }

  if (request.method === 'POST' && url.pathname === '/api/integrations/composio/finalize') return finalizeManaged(request, env);

  if (request.method === 'GET' && url.pathname === '/api/integrations/composio/callback') {
    const provider = String(url.searchParams.get('provider') || '');
    const state = String(url.searchParams.get('state') || '');
    const connectedId = String(url.searchParams.get('connected_account_id') || '');
    const status = String(url.searchParams.get('status') || '');
    if (!EMAIL_PROVIDERS[provider] || !state) return json({ error: 'Managed authorization callback is invalid.' }, 400);
    return callbackHtml({ state, provider, connectedId, status });
  }

  const connect = url.pathname.match(/^\/api\/integrations\/(google|outlook)\/connect$/);
  if (connect && request.method === 'POST') {
    const provider = connect[1];
    if (EMAIL_PROVIDERS[provider].direct(env) || !managedReady(env)) return null;
    const user = await currentUser(request, env);
    if (!user) return json({ error: 'Sign in to connect an account.' }, 401);
    return startManagedConnection(request, env, user, provider);
  }

  const disconnect = url.pathname.match(/^\/api\/integrations\/(google|outlook)\/disconnect$/);
  if (disconnect && request.method === 'DELETE') return disconnectManaged(request, env, disconnect[1]);

  return null;
}

export async function handleComposioAssistant(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.pathname !== '/api/assistant-integrations/actions') return null;
  const body = await request.clone().json().catch(() => ({}));
  if (!EMAIL_PROVIDERS[String(body?.provider || '')] || !['read_mail', 'send_mail'].includes(String(body?.action || ''))) return null;
  return runManagedEmailAction(request, env, body);
}

export function composioManagedStatus(env) {
  return { configured: managedReady(env), provider: 'composio', direct_oauth_preferred: true };
}
