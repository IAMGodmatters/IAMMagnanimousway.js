import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePlivoCarrier, plivoReady } from './plivo-carrier-runtime.js';
import { handleMagnanimousCarrierPhoneAlias } from './magnanimous-carrier-phone-alias.js';
import { currentUser } from './integrations.js';
import { planCarrierRoute } from './magnanimous-carrier-core.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function twilioReady(env) {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}

function genericBridgeReady(env) {
  return Boolean(env.VOIP_PROVIDER_URL && env.VOIP_PROVIDER_TOKEN);
}

const NATIVE_ROUTE_TYPES = new Set(['sip-trunk','byoc-bridge','direct-pstn']);

async function fetchJsonWithTimeout(url, init = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

async function twilioAccountHealth(env) {
  if (!twilioReady(env)) return { ok: false, state: 'not-configured' };
  try {
    const auth = btoa(`${String(env.TWILIO_ACCOUNT_SID)}:${String(env.TWILIO_AUTH_TOKEN)}`);
    const { response, data } = await fetchJsonWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))}.json`,
      { headers: { authorization: `Basic ${auth}` } }
    );
    const state = String(data?.status || (response.ok ? 'unknown' : 'unavailable')).toLowerCase();
    return { ok: response.ok && state === 'active', state };
  } catch (error) {
    return { ok: false, state: error?.name === 'AbortError' ? 'timeout' : 'unavailable' };
  }
}

async function plivoAccountHealth(env) {
  if (!plivoReady(env)) return { ok: false, state: 'not-configured' };
  try {
    const auth = btoa(`${String(env.PLIVO_AUTH_ID)}:${String(env.PLIVO_AUTH_TOKEN)}`);
    const { response, data } = await fetchJsonWithTimeout(
      `https://api.plivo.com/v1/Account/${encodeURIComponent(String(env.PLIVO_AUTH_ID))}/`,
      { headers: { authorization: `Basic ${auth}` } }
    );
    if (!response.ok) return { ok: false, state: 'unavailable' };
    const billingMode = String(data?.billing_mode || '').toLowerCase();
    const credits = Number(data?.cash_credits);
    if (billingMode === 'prepaid' && (!Number.isFinite(credits) || credits <= 0)) {
      return { ok: false, state: 'unfunded' };
    }
    return { ok: true, state: billingMode || 'authenticated' };
  } catch (error) {
    return { ok: false, state: error?.name === 'AbortError' ? 'timeout' : 'unavailable' };
  }
}

async function outboundRouting(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/phone/calls/outbound' || request.method !== 'POST') return null;
  const user = await currentUser(request, env).catch(() => null);
  if (!user) return { response: json({ detail: 'Sign in required.' }, 401) };
  const body = await request.clone().json().catch(() => ({}));
  let plan = null;
  try {
    plan = await planCarrierRoute(env, user, body.to, String(body.route_mode || 'balanced'));
  } catch (error) {
    console.error('Compatibility carrier route planning failed; preserving no-route legacy fallback', error);
  }
  const matches = Array.isArray(plan?.matches) ? plan.matches : [];
  if (!matches.length) return { explicit: false, user, body, plan };
  if (!plan?.selected) {
    return { response: json({ detail: 'No healthy carrier route is currently eligible for this destination.', code: 'NO_ELIGIBLE_CARRIER_ROUTE' }, 503) };
  }
  return { explicit: true, user, body, plan, selected: plan.selected };
}

function billingMode(env) {
  const value = String(env.VOIP_BILLING_MODE || 'metered').trim().toLowerCase();
  if (['flat-rate', 'unlimited', 'channel', 'metered', 'wholesale'].includes(value)) return value;
  return 'metered';
}

function isFlatRate(mode) {
  return mode === 'flat-rate' || mode === 'unlimited' || mode === 'channel';
}

function translatedRequest(request, pathname, body) {
  const source = new URL(request.url);
  const target = new URL(pathname, source.origin);
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(target.toString(), {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export async function handlePhoneCarrier(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/phone')) return null;

  const carrierCore = await handleMagnanimousCarrierPhoneAlias(request, env);
  if (carrierCore) return carrierCore;

  const publicCarrierWebhook = path === '/api/phone/plivo/answer' || path === '/api/phone/webhook';
  if (!publicCarrierWebhook && !await currentUser(request, env).catch(() => null)) {
    return json({ detail: 'Sign in required.' }, 401);
  }

  const routing = await outboundRouting(request, env);
  if (routing?.response) return routing.response;
  const selectedType = String(routing?.selected?.type || '');
  const routeContext = routing?.explicit ? { selectedRoute: routing.selected, selectionMode: routing.plan?.selection_mode || 'balanced' } : {};

  // A workspace-supplied carrier bridge is intentionally first. This lets an
  // owner use a self-hosted Asterisk/FreeSWITCH gateway plus a flat-rate or
  // wholesale SIP trunk instead of forcing the platform through a premium
  // per-minute carrier. Existing direct carriers remain fallbacks.
  if (genericBridgeReady(env)) {
    if (path === '/api/phone/config' && request.method === 'GET') {
      const mode = billingMode(env);
      return json({
        browserCalling: true,
        pstnConfigured: true,
        inboundConfigured: Boolean(env.VOIP_WEBHOOK_SECRET),
        provider: 'Magnanimous Carrier',
        carrierMode: 'byoc-bridge',
        billing_mode: mode,
        flatRateConfigured: isFlatRate(mode),
        leastCostRouting: true,
        routeOrder: ['free-browser', 'workspace-byoc', 'metered-fallback', 'premium-fallback'],
        callerId: String(env.VOIP_CALLER_ID || ''),
        accessGranted: true,
        carrierCore: '/api/phone/carrier-core/status',
        message: isFlatRate(mode)
          ? 'Workspace flat-rate/BYOC calling is the primary ordinary-number route. Metered carrier calling remains a fallback when configured.'
          : 'Workspace BYOC calling is connected. Free browser calls remain first choice and the carrier bridge can use wholesale or metered routing.'
      });
    }
    if (!routing?.explicit || NATIVE_ROUTE_TYPES.has(selectedType)) return null;
  }

  if (routing?.explicit && NATIVE_ROUTE_TYPES.has(selectedType)) {
    return json({ detail: 'The selected native carrier route is not connected to the protected Telecom Core.', code: 'SELECTED_ROUTE_NOT_CONNECTED' }, 503);
  }

  if (routing?.explicit && selectedType === 'plivo') {
    if (!plivoReady(env)) return json({ detail: 'The selected carrier route is not configured.', code: 'SELECTED_ROUTE_NOT_CONFIGURED' }, 503);
    const health = await plivoAccountHealth(env);
    if (!health.ok) return json({ detail: 'The selected carrier route is unavailable or unfunded.', code: 'SELECTED_ROUTE_UNHEALTHY' }, 503);
    const response = await handlePlivoCarrier(request, env, routeContext);
    if (response) return response;
    return json({ detail: 'The selected carrier route could not execute this request.', code: 'SELECTED_ROUTE_EXECUTION_FAILED' }, 503);
  }

  if (routing?.explicit && selectedType === 'twilio') {
    if (!twilioReady(env)) return json({ detail: 'The selected carrier route is not configured.', code: 'SELECTED_ROUTE_NOT_CONFIGURED' }, 503);
    const health = await twilioAccountHealth(env);
    if (!health.ok) return json({ detail: 'The selected carrier route is unavailable.', code: 'SELECTED_ROUTE_UNHEALTHY' }, 503);
  } else if (routing?.explicit) {
    return json({ detail: 'The selected carrier route does not have an active execution adapter.', code: 'SELECTED_ROUTE_ADAPTER_UNAVAILABLE' }, 503);
  }

  if (!routing?.explicit && plivoReady(env)) {
    const response = await handlePlivoCarrier(request, env);
    if (response) return response;
  }
  if (!twilioReady(env)) return null;

  if (path === '/api/phone/config' && request.method === 'GET') {
    const voiceResponse = await handleVoiceAgent(
      translatedRequest(request, '/api/voice-agent/config'),
      env
    );
    if (!voiceResponse) return null;
    const data = await voiceResponse.clone().json().catch(() => ({}));
    if (!voiceResponse.ok) return voiceResponse;
    const access = Boolean(data.full_business || data.platform_owner);
    return json({
      browserCalling: true,
      pstnConfigured: Boolean(data.twilio_configured),
      inboundConfigured: false,
      provider: 'Magnanimous Carrier',
      carrierMode: 'premium-fallback',
      billing_mode: 'metered',
      flatRateConfigured: false,
      leastCostRouting: true,
      routeOrder: ['free-browser', 'workspace-byoc', 'metered-fallback', 'premium-fallback'],
      aiCarrier: true,
      carrierCore: '/api/phone/carrier-core/status',
      callerId: String(env.TWILIO_PHONE_NUMBER || ''),
      accessGranted: access,
      inboundWebhook: `${url.origin}/api/voice-agent/twilio/incoming`,
      message: access
        ? 'Ordinary-number carrier calling is connected as a fallback. Free browser and workspace BYOC routes should be preferred when available.'
        : 'Ordinary-number carrier calling is connected. Premium carrier calling requires Full Business; free browser calling remains available.'
    });
  }

  if (path === '/api/phone/calls/outbound' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (body.consent_confirmed !== true || body.ai_disclosure_accepted !== true) {
      return json({
        detail: 'Confirm contact permission and AI disclosure before placing an automated carrier call.',
        code: 'CALL_CONSENT_REQUIRED'
      }, 400);
    }
    const voiceResponse = await handleVoiceAgent(
      translatedRequest(request, '/api/voice-agent/call', {
        to: body.to,
        contact_id: body.contact_id || null,
        queue_id: body.queue_id || null,
        opening_message: body.opening_message || undefined,
        consent_confirmed: true,
        ai_disclosure_accepted: true,
        time_limit_seconds: body.time_limit_seconds || 900
      }),
      env,
      routeContext
    );
    if (!voiceResponse) return json({ detail: 'The configured carrier route is unavailable.' }, 503);
    const data = await voiceResponse.clone().json().catch(() => ({}));
    if (!voiceResponse.ok) return voiceResponse;
    return json({
      id: data.call_id,
      call_id: data.call_id,
      provider_call_id: data.provider_call_id,
      status: data.status,
      provider: 'magnanimous-carrier',
      agent: data.agent || null,
      route_id: data.route_id || null,
      interconnect_id: data.interconnect_id || null,
      selected_route_applied: data.selected_route_applied === true
    }, voiceResponse.status || 201);
  }

  return null;
}
