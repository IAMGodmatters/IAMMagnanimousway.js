import { INTEGRATIONS, currentUser, decrypt } from './integrations.js';
import { handleAssistantIntegrations as baseHandleAssistantIntegrations } from './assistant-integrations.js';

const ALIASES = {
  facebook: { publish_posts: 'publish_post' },
  whatsapp: { send_messages: 'send_message' },
  x: { publish_posts: 'publish_post' }
};

for (const integration of INTEGRATIONS) {
  const aliases = ALIASES[integration.id] || {};
  integration.capabilities = [...new Set((integration.capabilities || []).flatMap(cap => aliases[cap] ? [cap, aliases[cap]] : [cap]))];
}

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const encoder = new TextEncoder();

function parseJson(value, fallback = {}) {
  try { return JSON.parse(value || '{}'); } catch { return fallback; }
}

function bytesToB64(bytes) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function b64url(bytes) {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function cleanHeader(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function mimeWord(value) {
  const text = cleanHeader(value);
  if (!text) return '';
  return `=?UTF-8?B?${bytesToB64(encoder.encode(text))}?=`;
}

function recipientList(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[;,]/g);
  return raw.map(x => String(x || '').trim()).filter(Boolean).filter(x => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x));
}

function clampLimit(value) {
  const n = Number(value || 10);
  return Math.max(1, Math.min(20, Number.isFinite(n) ? Math.floor(n) : 10));
}

async function sessionSecret(env) {
  const direct = String(env?.SESSION_SECRET || '').trim();
  if (direct) return direct;
  const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
  return String(row?.value || '');
}

async function credentialKey(env) {
  const source = String(env?.INTEGRATION_CREDENTIALS_KEY || await sessionSecret(env) || '').trim();
  if (!source) throw new Error('Integration credential encryption is not available.');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`iam-integrations-v1:${source}`));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt']);
}

async function encrypt(value, env) {
  if (!value) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await credentialKey(env);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(String(value)));
  return `enc1.${bytesToB64(iv)}.${bytesToB64(new Uint8Array(cipher))}`;
}

async function ensureEmailActionTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_permissions (
    tenant_id TEXT NOT NULL, provider TEXT NOT NULL, can_read INTEGER NOT NULL DEFAULT 1, can_write INTEGER NOT NULL DEFAULT 1,
    require_confirmation INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
    PRIMARY KEY(tenant_id,provider)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_actions (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, provider TEXT NOT NULL, external_account_id TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL, status TEXT NOT NULL, requires_confirmation INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL DEFAULT '{}', result_json TEXT NOT NULL DEFAULT '{}', error_text TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, provider TEXT NOT NULL,
    action TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
  )`).run();
}

async function emailPermission(env, tenantId, provider) {
  const row = await env.DB.prepare('SELECT can_read,can_write FROM assistant_permissions WHERE tenant_id=? AND provider=?').bind(tenantId, provider).first();
  return row ? { can_read: !!row.can_read, can_write: !!row.can_write } : { can_read: true, can_write: true };
}

async function emailConnection(env, tenantId, provider, external = '') {
  const row = external
    ? await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? AND external_account_id=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId, provider, external).first()
    : await env.DB.prepare('SELECT * FROM integrations WHERE tenant_id=? AND provider=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId, provider).first();
  if (!row) return null;
  return {
    ...row,
    access_token: await decrypt(row.access_token, env),
    refresh_token: await decrypt(row.refresh_token, env),
    metadata: parseJson(row.metadata_json)
  };
}

async function tokenRequest(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error_description: text }; }
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || `OAuth token refresh failed (${response.status}).`);
  return data;
}

async function freshEmailConnection(env, conn, provider) {
  const expiry = Number(conn.token_expires_at || 0);
  if (!expiry || expiry > now() + 90) return conn;
  if (!conn.refresh_token) throw new Error(`${provider === 'google' ? 'Google / Gmail' : 'Microsoft Outlook'} authorization expired. Reconnect the mailbox to continue.`);

  let token;
  if (provider === 'google') {
    token = await tokenRequest('https://oauth2.googleapis.com/token', new URLSearchParams({
      client_id: String(env.GOOGLE_CLIENT_ID || ''),
      client_secret: String(env.GOOGLE_CLIENT_SECRET || ''),
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token'
    }));
  } else {
    token = await tokenRequest('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
      client_id: String(env.MICROSOFT_CLIENT_ID || ''),
      client_secret: String(env.MICROSOFT_CLIENT_SECRET || ''),
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token'
    }));
  }

  const access = String(token.access_token || '').trim();
  if (!access) throw new Error('The email provider did not return a refreshed access token. Reconnect the mailbox.');
  const refresh = String(token.refresh_token || conn.refresh_token || '').trim();
  const expiresAt = now() + Number(token.expires_in || 3600);
  await env.DB.prepare('UPDATE integrations SET access_token=?,refresh_token=?,token_expires_at=?,updated_at=? WHERE id=? AND tenant_id=?')
    .bind(await encrypt(access, env), await encrypt(refresh, env), expiresAt, now(), conn.id, conn.tenant_id).run();
  return { ...conn, access_token: access, refresh_token: refresh, token_expires_at: expiresAt };
}

async function providerFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok || data?.error) throw new Error(data?.error?.message || data?.error_description || data?.message || `Provider request failed (${response.status}).`);
  return data;
}

function gmailHeaders(message) {
  const headers = message?.payload?.headers || [];
  const map = {};
  for (const item of headers) map[String(item?.name || '').toLowerCase()] = String(item?.value || '');
  return map;
}

async function gmailRead(conn, payload) {
  const limit = clampLimit(payload?.limit);
  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', String(limit));
  const query = String(payload?.query || 'in:inbox').trim();
  if (query) listUrl.searchParams.set('q', query);
  const list = await providerFetch(listUrl.toString(), { headers: { Authorization: `Bearer ${conn.access_token}` } });
  const ids = (list.messages || []).slice(0, limit);
  const messages = (await Promise.all(ids.map(async row => {
    try {
      const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(row.id)}`);
      detailUrl.searchParams.set('format', 'metadata');
      for (const name of ['From', 'To', 'Subject', 'Date']) detailUrl.searchParams.append('metadataHeaders', name);
      const message = await providerFetch(detailUrl.toString(), { headers: { Authorization: `Bearer ${conn.access_token}` } });
      const headers = gmailHeaders(message);
      return {
        id: message.id,
        thread_id: message.threadId,
        from: headers.from || '',
        to: headers.to || '',
        subject: headers.subject || '(no subject)',
        date: headers.date || '',
        snippet: String(message.snippet || '')
      };
    } catch { return null; }
  }))).filter(Boolean);
  return { provider: 'google', mailbox: conn.display_name || 'Gmail', count: messages.length, query, messages };
}

async function gmailSend(conn, payload) {
  const to = recipientList(payload?.to);
  const cc = recipientList(payload?.cc);
  const bcc = recipientList(payload?.bcc);
  const subject = cleanHeader(payload?.subject);
  const body = String(payload?.body || payload?.text || '').trim();
  if (!to.length) throw new Error('Enter at least one valid email recipient.');
  if (!body) throw new Error('Email message text is required.');
  const lines = [
    `To: ${to.join(', ')}`,
    ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []),
    ...(bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
    `Subject: ${mimeWord(subject || '(no subject)')}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body
  ];
  const raw = b64url(encoder.encode(lines.join('\r\n')));
  const result = await providerFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw })
  });
  return { provider: 'google', sent: true, id: result.id || '', thread_id: result.threadId || '', to, subject };
}

async function outlookRead(conn, payload) {
  const limit = clampLimit(payload?.limit);
  const url = new URL('https://graph.microsoft.com/v1.0/me/messages');
  url.searchParams.set('$top', String(limit));
  url.searchParams.set('$select', 'id,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,webLink');
  url.searchParams.set('$orderby', 'receivedDateTime desc');
  const result = await providerFetch(url.toString(), { headers: { Authorization: `Bearer ${conn.access_token}` } });
  const messages = (result.value || []).map(message => ({
    id: message.id,
    from: message.from?.emailAddress?.address || message.from?.emailAddress?.name || '',
    to: (message.toRecipients || []).map(x => x?.emailAddress?.address || '').filter(Boolean),
    subject: message.subject || '(no subject)',
    date: message.receivedDateTime || '',
    is_read: !!message.isRead,
    snippet: String(message.bodyPreview || ''),
    web_link: message.webLink || ''
  }));
  return { provider: 'outlook', mailbox: conn.display_name || 'Outlook', count: messages.length, messages };
}

async function outlookSend(conn, payload) {
  const to = recipientList(payload?.to);
  const cc = recipientList(payload?.cc);
  const bcc = recipientList(payload?.bcc);
  const subject = cleanHeader(payload?.subject);
  const body = String(payload?.body || payload?.text || '').trim();
  if (!to.length) throw new Error('Enter at least one valid email recipient.');
  if (!body) throw new Error('Email message text is required.');
  const recipientObjects = values => values.map(address => ({ emailAddress: { address } }));
  await providerFetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: subject || '(no subject)',
        body: { contentType: 'Text', content: body },
        toRecipients: recipientObjects(to),
        ccRecipients: recipientObjects(cc),
        bccRecipients: recipientObjects(bcc)
      }
    })
  });
  return { provider: 'outlook', sent: true, to, subject };
}

async function logEmailActivity(env, user, provider, action, status, detail = '') {
  await env.DB.prepare('INSERT INTO assistant_activity(tenant_id,user_id,provider,action,status,detail,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(user.tenant_id, user.id, provider, action, status, String(detail || '').slice(0, 1000), now()).run();
}

async function handleEmailAction(request, env, body) {
  await ensureEmailActionTables(env);
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Sign in to use connected email assistance.' }, 401);
  const provider = String(body?.provider || '');
  const action = String(body?.action || '');
  if (!['google', 'outlook'].includes(provider) || !['read_mail', 'send_mail'].includes(action)) return null;
  const def = INTEGRATIONS.find(x => x.id === provider);
  const conn0 = await emailConnection(env, user.tenant_id, provider, String(body?.external_account_id || ''));
  if (!conn0) return json({ error: `Connect ${def?.name || provider} first.` }, 409);
  const permission = await emailPermission(env, user.tenant_id, provider);
  if (action === 'read_mail' && !permission.can_read) return json({ error: `AI read access is disabled for ${def?.name || provider}.` }, 403);
  if (action === 'send_mail' && !permission.can_write) return json({ error: `AI write access is disabled for ${def?.name || provider}.` }, 403);

  const id = crypto.randomUUID();
  const ts = now();
  await env.DB.prepare('INSERT INTO assistant_actions(id,tenant_id,user_id,provider,external_account_id,action,status,requires_confirmation,payload_json,result_json,error_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, user.tenant_id, user.id, provider, conn0.external_account_id, action, 'running', 0, JSON.stringify(body?.payload || {}), '{}', '', ts, ts).run();
  await logEmailActivity(env, user, provider, action, 'running', 'Email assistant action started.');

  try {
    const conn = await freshEmailConnection(env, conn0, provider);
    const result = provider === 'google'
      ? (action === 'read_mail' ? await gmailRead(conn, body?.payload || {}) : await gmailSend(conn, body?.payload || {}))
      : (action === 'read_mail' ? await outlookRead(conn, body?.payload || {}) : await outlookSend(conn, body?.payload || {}));
    await env.DB.prepare("UPDATE assistant_actions SET status='completed',result_json=?,error_text='',updated_at=? WHERE id=? AND tenant_id=?")
      .bind(JSON.stringify(result || {}).slice(0, 100000), now(), id, user.tenant_id).run();
    await logEmailActivity(env, user, provider, action, 'completed', action === 'send_mail' ? 'Email sent through the connected provider.' : 'Mailbox read completed.');
    return json({ id, ok: true, status: 'completed', result });
  } catch (error) {
    const message = String(error?.message || error || 'Email provider action failed.');
    await env.DB.prepare("UPDATE assistant_actions SET status='failed',error_text=?,updated_at=? WHERE id=? AND tenant_id=?")
      .bind(message.slice(0, 1000), now(), id, user.tenant_id).run();
    await logEmailActivity(env, user, provider, action, 'failed', message);
    return json({ error: message, id, status: 'failed' }, 502);
  }
}

async function planFor(env, user) {
  if (!user) return 'free';
  try {
    const tenant = await env.DB.prepare('SELECT plan FROM tenants WHERE id=?').bind(user.tenant_id).first();
    if (String(tenant?.plan || '').toLowerCase() === 'business') return 'business';
  } catch (_) {}
  try {
    const billing = await env.DB.prepare('SELECT plan,status FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
    if (String(billing?.plan || '').toLowerCase() === 'business' && ['active','trialing','past_due'].includes(String(billing?.status || '').toLowerCase())) return 'business';
  } catch (_) {}
  return 'free';
}

function tierInfo(plan) {
  const free = [
    'Self-service account connections with provider authorization',
    'Connected-assistant read access when the user grants it',
    'Immediate execution of explicit post/send/publish commands when write access is granted',
    'Gmail and Outlook read/send assistance when connected',
    'Official business-email provider center',
    'Core browser and AI tools'
  ];
  if (plan === 'business') return {
    id: 'business',
    name: 'Full Business',
    owner_approval_required: false,
    features: [...free, 'Advanced business workflows', 'Phone-agent access when configured', 'Avatar/video-agent access when configured', 'Expanded business automation']
  };
  return { id: 'free', name: 'Free', owner_approval_required: false, features: free };
}

async function withAutomaticWriteConsent(request) {
  const body = await request.clone().json().catch(() => ({}));
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify({ ...body, confirm: true }),
    redirect: request.redirect
  });
}

async function withAutopilotPermission(request) {
  const body = await request.clone().json().catch(() => ({}));
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify({ ...body, require_confirmation: false }),
    redirect: request.redirect
  });
}

export async function handleAssistantIntegrations(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/assistant-integrations')) return null;

  if (request.method === 'POST' && url.pathname === '/api/assistant-integrations/actions') {
    const body = await request.clone().json().catch(() => ({}));
    if (['google', 'outlook'].includes(String(body?.provider || '')) && ['read_mail', 'send_mail'].includes(String(body?.action || ''))) {
      return handleEmailAction(request, env, body);
    }
    request = await withAutomaticWriteConsent(request);
  }

  if (request.method === 'PUT' && /^\/api\/assistant-integrations\/permissions\/[^/]+$/.test(url.pathname)) {
    request = await withAutopilotPermission(request);
  }

  const response = await baseHandleAssistantIntegrations(request, env);
  if (!response) return response;

  if (request.method === 'GET' && url.pathname === '/api/assistant-integrations/context' && response.ok) {
    const user = await currentUser(request, env);
    const plan = await planFor(env, user);
    const data = await response.json().catch(() => ({}));
    const providers = (data.providers || []).map(provider => ({
      ...provider,
      permission: {
        ...(provider.permission || {}),
        require_confirmation: false
      }
    }));
    return json({
      ...data,
      providers,
      plan,
      tier: tierInfo(plan),
      automation: {
        mode: 'self_service',
        owner_approval_required: false,
        provider_authorization_required: true,
        user_can_disable_read_or_write: true,
        per_action_owner_approval_required: false,
        per_action_user_confirmation_required: false,
        email_read_send_supported: true,
        email_token_refresh_supported: true
      }
    });
  }

  return response;
}
