import routerApp from './router-entrypoint.js';

const PRIVACY_VERSION = '1.0-2026-09-01';
const TERMS_VERSION = '1.0-2026-09-01';
const cors = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization'
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });
const now = () => Math.floor(Date.now() / 1000);

async function ensureConsentTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS consent_records (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    account_processing_consent INTEGER NOT NULL DEFAULT 0,
    account_processing_version TEXT NOT NULL,
    terms_accepted INTEGER NOT NULL DEFAULT 0,
    terms_version TEXT NOT NULL,
    marketing_consent INTEGER NOT NULL DEFAULT 0,
    consented_at INTEGER NOT NULL,
    marketing_updated_at INTEGER,
    source TEXT NOT NULL DEFAULT 'signup'
  )`).run();
}

async function recordConsent(env, user, body) {
  await ensureConsentTable(env);
  const ts = now();
  await env.DB.prepare(`
    INSERT INTO consent_records(
      user_id,email,account_processing_consent,account_processing_version,
      terms_accepted,terms_version,marketing_consent,consented_at,marketing_updated_at,source
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      email=excluded.email,
      account_processing_consent=excluded.account_processing_consent,
      account_processing_version=excluded.account_processing_version,
      terms_accepted=excluded.terms_accepted,
      terms_version=excluded.terms_version,
      marketing_consent=excluded.marketing_consent,
      consented_at=excluded.consented_at,
      marketing_updated_at=excluded.marketing_updated_at,
      source=excluded.source
  `).bind(
    String(user.id), String(user.email || body.email || '').toLowerCase(), 1, PRIVACY_VERSION,
    1, TERMS_VERSION, body.marketingConsent === true ? 1 : 0, ts, ts, 'signup'
  ).run();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return routerApp.fetch(request, env, ctx);

    if (url.pathname === '/api/auth/signup' && request.method === 'POST') {
      let body;
      try { body = await request.clone().json(); }
      catch { return json({ detail: 'Invalid signup request.' }, 400); }

      if (body.accountProcessingConsent !== true) {
        return json({ detail: 'You must acknowledge the Privacy Notice and agree to the required account data processing before creating an account.', code: 'PRIVACY_CONSENT_REQUIRED' }, 400);
      }
      if (body.termsAccepted !== true) {
        return json({ detail: 'You must accept the Terms of Service before creating an account.', code: 'TERMS_REQUIRED' }, 400);
      }

      const response = await routerApp.fetch(request, env, ctx);
      if (!response.ok) return response;

      let data = null;
      try { data = await response.clone().json(); } catch {}
      if (data?.user?.id) {
        try {
          await recordConsent(env, data.user, body);
          // The D1 owner-role trigger runs during signup. Return the effective
          // database role rather than the legacy pre-trigger "member" value so
          // the client immediately sees the permissions it actually has.
          const effective = await env.DB.prepare('SELECT role,tenant_id,active FROM users WHERE id=?').bind(String(data.user.id)).first();
          if (effective) {
            data.user.role = String(effective.role || data.user.role || 'member');
            data.user.tenant_id = String(effective.tenant_id || data.user.tenant_id || '');
            data.user.active = Number(effective.active ?? data.user.active ?? 1);
          }
        } catch (error) {
          return json({ detail: 'Your account was created, but the consent record could not be saved. Please contact support before using the account.', code: 'CONSENT_RECORD_FAILED' }, 500);
        }
      }
      return data ? json(data, response.status) : response;
    }

    return routerApp.fetch(request, env, ctx);
  }
};
