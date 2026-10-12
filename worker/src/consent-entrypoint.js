import routerApp from './router-entrypoint.js';
import { handleBusinessPlanQuality } from './business-plan-quality-runtime.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handleNativeStore } from './native-store-runtime.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';

const PRIVACY_VERSION = '1.1-2026-10-01';
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

function withCors(response){
  const headers=new Headers(response.headers);
  headers.set('access-control-allow-origin','*');
  headers.set('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');
  headers.set('access-control-allow-headers','Content-Type, Authorization');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function nativeStoreRequest(request){
  const url=new URL(request.url);
  url.pathname=url.pathname.replace(/^\/store-api(?=\/|$)/,'/api/store');
  const init={method:request.method,headers:request.headers,redirect:request.redirect};
  if(!['GET','HEAD'].includes(request.method))init.body=request.body;
  return new Request(url.toString(),init);
}

async function secureStorePostflight(request,response,env){
  const explicitCache=String(response?.headers?.get('cache-control')||'');
  const secured=await securityPostflight(request,response,env);
  if(request.method!=='GET'||!/^public(?:,|\s|$)/i.test(explicitCache))return secured;
  const headers=new Headers(secured.headers);
  headers.set('cache-control',explicitCache);
  return new Response(secured.body,{status:secured.status,statusText:secured.statusText,headers});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Keep customers on the branded public domain even when an old www or
    // workers.dev link is opened. A 308 preserves path, query, and method.
    const hostname = url.hostname.toLowerCase();
    const isPublicPageRequest = request.method === 'GET' && !url.pathname.startsWith('/api/') && url.pathname !== '/health';
    if (hostname === 'www.iammagnanimousway.com' || (hostname.endsWith('.workers.dev') && isPublicPageRequest)) {
      url.hostname = 'iammagnanimousway.com';
      url.protocol = 'https:';
      url.port = '';
      return Response.redirect(url.toString(), 308);
    }

    // Native commerce deliberately uses /store-api rather than /api/store so the
    // catalog, checkout and order database stay on the Magnanimous Worker/D1 plane
    // even when the optional standalone API proxy is enabled. Apply the same API
    // origin/body-size/security contract after remapping the alias so the public
    // convenience path never bypasses the hardened /api surface.
    if(url.pathname==='/store-api'||url.pathname.startsWith('/store-api/')){
      const routedRequest=nativeStoreRequest(request);
      const blocked=await securityPreflight(routedRequest,env);
      if(blocked)return blocked;
      const storeResponse=await handleNativeStore(routedRequest,env);
      if(storeResponse)return secureStorePostflight(routedRequest,storeResponse,env);
      return secureStorePostflight(routedRequest,Response.json({detail:'Store endpoint not found.'},{status:404,headers:{'cache-control':'no-store'}}),env);
    }

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

    // The professional business-plan draft/final paths have their own quality
    // router. Free drafts use I AM's free-first reasoning. Metered outside AI is
    // eligible only after an I AM purchase/plan entitlement has been verified.
    if(url.pathname==='/api/business-plan/quality'||url.pathname==='/api/business-plan/draft'||url.pathname==='/api/business-plan/final'){
      const runtimeEnv=await getProviderRuntimeEnv(env);
      const qualityResponse=await handleBusinessPlanQuality(request,runtimeEnv);
      if(qualityResponse)return withCors(qualityResponse);
    }

    return routerApp.fetch(request, env, ctx);
  }
};
