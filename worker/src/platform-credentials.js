import { currentUser } from './integrations.js';

const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

export const PLATFORM_CREDENTIAL_GROUPS = [
  {
    id: 'stripe',
    name: 'Stripe Advanced Billing',
    providers: ['stripe'],
    fields: [
      { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret API Key (optional)', secret: true, required: false },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Signing Secret', secret: true, required: false }
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio Voice',
    providers: ['twilio'],
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Twilio Account SID', secret: false, required: true },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Twilio Auth Token', secret: true, required: true },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Twilio Phone Number (E.164)', secret: false, required: true }
    ]
  },
  {
    id: 'tavus',
    name: 'Tavus Human Video',
    providers: ['tavus'],
    fields: [
      { key: 'TAVUS_API_KEY', label: 'Tavus API Key', secret: true, required: true }
    ]
  },
  {
    id: 'agent-brains',
    name: 'Agent Mesh AI Brains',
    providers: ['google-ai', 'groq', 'openrouter-free', 'huggingface', 'mistral'],
    fields: [
      { key: 'GOOGLE_API_KEY', label: 'Google Gemini API Key (free tier supported)', secret: true, required: false },
      { key: 'GROQ_API_KEY', label: 'Groq API Key (free tier supported)', secret: true, required: false },
      { key: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key (Free Models Router supported)', secret: true, required: false },
      { key: 'HF_TOKEN', label: 'Hugging Face Token (free credits supported)', secret: true, required: false },
      { key: 'MISTRAL_API_KEY', label: 'Mistral API Key (optional)', secret: true, required: false }
    ]
  },
  {
    id: 'adsense',
    name: 'Google AdSense / Auto Ads',
    providers: ['adsense'],
    fields: [
      { key: 'ADSENSE_CLIENT_ID', label: 'AdSense Publisher ID (ca-pub-...)', secret: false, required: true },
      { key: 'ADSENSE_SLOT_HOME', label: 'Homepage Ad Unit Slot ID (optional for Auto Ads)', secret: false, required: false }
    ]
  },
  {
    id: 'meta',
    name: 'Meta',
    providers: ['facebook', 'instagram', 'whatsapp'],
    fields: [
      { key: 'META_APP_ID', label: 'Meta App ID', secret: false, required: true },
      { key: 'META_APP_SECRET', label: 'Meta App Secret', secret: true, required: true },
      { key: 'WHATSAPP_CONFIG_ID', label: 'WhatsApp Configuration ID', secret: false, required: false }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    providers: ['google', 'google-calendar'],
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Google OAuth Client ID', secret: false, required: true },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth Client Secret', secret: true, required: true }
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    providers: ['shopify'],
    fields: [
      { key: 'SHOPIFY_API_KEY', label: 'Shopify Client ID / API Key', secret: false, required: true },
      { key: 'SHOPIFY_API_SECRET', label: 'Shopify Client Secret / API Secret', secret: true, required: true }
    ]
  },
  {
    id: 'shopee',
    name: 'Shopee',
    providers: ['shopee'],
    fields: [
      { key: 'SHOPEE_PARTNER_ID', label: 'Shopee Partner ID', secret: false, required: true },
      { key: 'SHOPEE_PARTNER_KEY', label: 'Shopee Partner Key', secret: true, required: true }
    ]
  },
  {
    id: 'x',
    name: 'X',
    providers: ['x'],
    fields: [
      { key: 'X_CLIENT_ID', label: 'X OAuth Client ID', secret: false, required: true },
      { key: 'X_CLIENT_SECRET', label: 'X OAuth Client Secret', secret: true, required: true }
    ]
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    providers: ['snapchat'],
    fields: [
      { key: 'SNAPCHAT_CLIENT_ID', label: 'Snapchat Client ID', secret: false, required: true },
      { key: 'SNAPCHAT_CLIENT_SECRET', label: 'Snapchat Client Secret', secret: true, required: true }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    providers: ['outlook'],
    fields: [
      { key: 'MICROSOFT_CLIENT_ID', label: 'Microsoft Application (Client) ID', secret: false, required: true },
      { key: 'MICROSOFT_CLIENT_SECRET', label: 'Microsoft Client Secret', secret: true, required: true }
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    providers: ['slack'],
    fields: [
      { key: 'SLACK_CLIENT_ID', label: 'Slack Client ID', secret: false, required: true },
      { key: 'SLACK_CLIENT_SECRET', label: 'Slack Client Secret', secret: true, required: true }
    ]
  },
  {
    id: 'discord',
    name: 'Discord',
    providers: ['discord'],
    fields: [
      { key: 'DISCORD_CLIENT_ID', label: 'Discord Application / Client ID', secret: false, required: true },
      { key: 'DISCORD_CLIENT_SECRET', label: 'Discord Client Secret', secret: true, required: true }
    ]
  }
];

const ALLOWED_KEYS = new Set(PLATFORM_CREDENTIAL_GROUPS.flatMap(group => group.fields.map(field => field.key)));

function b64(bytes) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromB64(value) {
  const raw = atob(value);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function sessionSecret(env) {
  const direct = String(env?.SESSION_SECRET || '').trim();
  if (direct) return direct;
  if (!env?.DB) return '';
  const row = await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
  return String(row?.value || '');
}

async function vaultKey(env) {
  const source = String(env?.INTEGRATION_CREDENTIALS_KEY || await sessionSecret(env) || '').trim();
  if (!source) throw new Error('Platform credential encryption is not available.');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`iam-platform-credentials-v1:${source}`));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(value, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await vaultKey(env);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(String(value)));
  return `enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}

async function decrypt(value, env) {
  const raw = String(value || '');
  if (!raw.startsWith('enc1.')) return raw;
  const [, ivPart, cipherPart] = raw.split('.');
  const key = await vaultKey(env);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(ivPart) }, key, fromB64(cipherPart));
  return new TextDecoder().decode(plain);
}

async function ensureTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credentials (
    credential_key TEXT PRIMARY KEY,
    encrypted_value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL DEFAULT ''
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credential_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id TEXT NOT NULL,
    credential_key TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
}

async function vaultRows(env) {
  await ensureTables(env);
  const { results } = await env.DB.prepare('SELECT credential_key, encrypted_value, updated_at FROM platform_credentials').all();
  return results || [];
}

export async function getIntegrationRuntimeEnv(env) {
  if (!env?.DB) return env;
  try {
    const rows = await vaultRows(env);
    if (!rows.length) return env;
    const merged = { ...env };
    for (const row of rows) {
      if (!ALLOWED_KEYS.has(row.credential_key)) continue;
      // Cloudflare secrets remain the highest-priority source. Vault values fill
      // only keys that are not already configured in the deployment environment.
      if (typeof merged[row.credential_key] === 'string' && merged[row.credential_key].trim()) continue;
      merged[row.credential_key] = await decrypt(row.encrypted_value, env);
    }
    return merged;
  } catch (error) {
    console.error('platform credential runtime load failed', error);
    return env;
  }
}

function callbackMap(request) {
  const origin = new URL(request.url).origin;
  const providers = [...new Set(PLATFORM_CREDENTIAL_GROUPS.flatMap(group => group.providers))];
  return Object.fromEntries(providers.map(provider => [provider, `${origin}/api/integrations/${provider}/callback`]));
}

async function statusPayload(request, env) {
  const rows = await vaultRows(env);
  const saved = new Map(rows.map(row => [row.credential_key, row]));
  const isSet = field => {
    const direct = typeof env?.[field.key] === 'string' && env[field.key].trim();
    return Boolean(direct || saved.has(field.key));
  };
  const groups = PLATFORM_CREDENTIAL_GROUPS.map(group => {
    const requiredFields = group.fields.filter(field => field.required);
    const configured = requiredFields.length
      ? requiredFields.every(isSet)
      : group.fields.some(isSet);
    return {
      id: group.id,
      name: group.name,
      providers: group.providers,
      configured,
      fields: group.fields.map(field => {
        const direct = typeof env?.[field.key] === 'string' && env[field.key].trim();
        const row = saved.get(field.key);
        return {
          key: field.key,
          label: field.label,
          secret: field.secret,
          required: field.required,
          set: Boolean(direct || row),
          source: direct ? 'cloudflare' : row ? 'vault' : 'missing',
          updated_at: row?.updated_at || null
        };
      })
    };
  });
  return { groups, callbacks: callbackMap(request) };
}

export async function handlePlatformCredentials(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/integrations/platform-credentials')) return null;
  if (!env?.DB) return json({ error: 'Database binding is not configured.' }, 503);

  try {
    await ensureTables(env);
    const user = await currentUser(request, env);
    if (!user) return json({ error: 'Sign in as the owner to manage platform credentials.' }, 401);
    if (user.role !== 'owner') return json({ error: 'Owner access is required.' }, 403);

    if (request.method === 'GET' && url.pathname === '/api/integrations/platform-credentials') {
      return json(await statusPayload(request, env));
    }

    if (request.method === 'POST' && url.pathname === '/api/integrations/platform-credentials') {
      const body = await request.json().catch(() => ({}));
      const values = body?.values && typeof body.values === 'object' ? body.values : {};
      const entries = Object.entries(values)
        .filter(([key, value]) => ALLOWED_KEYS.has(key) && typeof value === 'string' && value.trim())
        .map(([key, value]) => [key, value.trim()]);
      if (!entries.length) return json({ error: 'Enter at least one platform credential to save.' }, 400);

      const ts = now();
      for (const [key, value] of entries) {
        await env.DB.prepare(`INSERT INTO platform_credentials(credential_key,encrypted_value,updated_at,updated_by)
          VALUES(?,?,?,?) ON CONFLICT(credential_key) DO UPDATE SET encrypted_value=excluded.encrypted_value,updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
          .bind(key, await encrypt(value, env), ts, String(user.id)).run();
        await env.DB.prepare('INSERT INTO platform_credential_audit(actor_user_id,credential_key,action,created_at) VALUES(?,?,?,?)')
          .bind(String(user.id), key, 'updated', ts).run();
      }
      return json({ ok: true, ...(await statusPayload(request, env)) });
    }

    if (request.method === 'DELETE' && url.pathname === '/api/integrations/platform-credentials') {
      const body = await request.json().catch(() => ({}));
      const keys = Array.isArray(body?.keys) ? body.keys.filter(key => ALLOWED_KEYS.has(key)) : [];
      if (!keys.length) return json({ error: 'Choose at least one saved credential to remove.' }, 400);
      const ts = now();
      for (const key of keys) {
        await env.DB.prepare('DELETE FROM platform_credentials WHERE credential_key=?').bind(key).run();
        await env.DB.prepare('INSERT INTO platform_credential_audit(actor_user_id,credential_key,action,created_at) VALUES(?,?,?,?)')
          .bind(String(user.id), key, 'removed', ts).run();
      }
      return json({ ok: true, ...(await statusPayload(request, env)) });
    }

    return json({ error: 'Unsupported platform credential operation.' }, 405);
  } catch (error) {
    console.error('platform credential vault error', error);
    return json({ error: error?.message || 'Platform credential vault error.' }, 500);
  }
}
