import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePlivoCarrier, plivoReady } from './plivo-carrier-runtime.js';
import { handleMagnanimousCarrierPhoneAlias } from './magnanimous-carrier-phone-alias.js';
import { currentUser } from './integrations.js';
import { routePlan, recordCarrierExecution } from './magnanimous-carrier-core.js';
import { handleLeadPhone } from './lead-phone.js';

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

function billingMode(env) {
  const value = String(env.VOIP_BILLING_MODE || 'metered').trim().toLowerCase();
  if (['flat-rate', 'unlimited', 'channel', 'metered', 'wholesale'].includes(value)) return value;
  return 'metered';
}

function isFlatRate(mode) {
  return mode === 'flat-rate' || mode === 'unlimited' || mode === 'channel';
}

function routeMode(value) {
  const mode = String(value || 'balanced').trim().toLowerCase();
  return ['balanced', 'least-cost', 'priority'].includes(mode) ? mode : 'balanced';
}

function genericBridgeHealthUrl(env) {
  const explicit = String(env.VOIP_PROVIDER_HEALTH_URL || '').trim();
  if (explicit) return explicit;
  try {
    const url = new URL(String(env.VOIP_PROVIDER_URL || ''));
    if (/\/v1\/calls\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/v1\/calls\/?$/, '/v1/carrier/health');
      url.search = '';
      return url.toString();
    }
  } catch (_) {}
  return '';
}

async function fetchHealth(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: {}, error: error?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function executionAdapter(route, env) {
  const policyAdapter = String(route?.policy?.execution_adapter || '').trim().toLowerCase();
  if (policyAdapter === 'byoc-bridge') return genericBridgeReady(env) ? 'byoc-bridge' : '';
  if (policyAdapter === 'plivo') return plivoReady(env) ? 'plivo' : '';
  if (policyAdapter === 'twilio') return twilioReady(env) ? 'twilio' : '';
  const type = String(route?.type || '').trim().toLowerCase();
  if (['sip-trunk', 'byoc-bridge', 'direct-pstn', 'peer'].includes(type)) return genericBridgeReady(env) ? 'byoc-bridge' : '';
  if (type === 'plivo') return plivoReady(env) ? 'plivo' : '';
  if (type === 'twilio') return twilioReady(env) ? 'twilio' : '';
  return '';
}

async function genericBridgeRouteHealth(env, route) {
  if (!genericBridgeReady(env)) return { ok: false, reason: 'bridge-not-configured' };
  const healthUrl = genericBridgeHealthUrl(env);
  if (!healthUrl) return { ok: false, reason: 'authenticated-health-url-not-configured' };
  const health = await fetchHealth(healthUrl, {
    headers: {
      authorization: `Bearer ${String(env.VOIP_PROVIDER_TOKEN)}`,
      accept: 'application/json',
      'x-iam-platform': 'I-AM-Magnanimous-Way'
    }
  });
  if (!health.ok) return { ok: false, reason: 'authenticated-health-failed', status: health.status };
  const routes = health.data?.health?.routes || health.data?.routes || {};
  const primary = routes.primary || {};
  const secondary = routes.secondary || {};
  const policyKey = String(route?.policy?.execution_route || '').trim().toLowerCase();
  const endpoint = String(route?.endpoint || '').trim();
  let key = ['primary', 'secondary'].includes(policyKey) ? policyKey : '';
  if (!key && endpoint && endpoint === String(primary.endpoint || '')) key = 'primary';
  if (!key && endpoint && endpoint === String(secondary.endpoint || '')) key = 'secondary';
  if (!key && primary.configured === true && secondary.configured !== true) key = 'primary';
  if (!key) return { ok: false, reason: 'route-key-not-mapped' };
  const selected = routes[key] || {};
  return {
    ok: selected.ready === true,
    reason: selected.ready === true ? 'ready' : String(selected.state || 'route-unavailable'),
    route_key: key,
    authenticated: true
  };
}

async function plivoAccountHealth(env) {
  if (!plivoReady(env)) return { ok: false, reason: 'adapter-not-configured' };
  const auth = btoa(`${String(env.PLIVO_AUTH_ID)}:${String(env.PLIVO_AUTH_TOKEN)}`);
  const result = await fetchHealth(`https://api.plivo.com/v1/Account/${encodeURIComponent(String(env.PLIVO_AUTH_ID))}/`, {
    headers: { authorization: `Basic ${auth}`, accept: 'application/json' }
  });
  return { ok: result.ok, reason: result.ok ? 'ready' : 'authenticated-health-failed', authenticated: true, status: result.status };
}

async function twilioAccountHealth(env) {
  if (!twilioReady(env)) return { ok: false, reason: 'adapter-not-configured' };
  const auth = btoa(`${String(env.TWILIO_ACCOUNT_SID)}:${String(env.TWILIO_AUTH_TOKEN)}`);
  const result = await fetchHealth(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(String(env.TWILIO_ACCOUNT_SID))}.json`, {
    headers: { authorization: `Basic ${auth}`, accept: 'application/json' }
  });
  return { ok: result.ok, reason: result.ok ? 'ready' : 'authenticated-health-failed', authenticated: true, status: result.status };
}

async function selectedRouteExecution(env, user, body) {
  const plan = await routePlan(env, user, body.to, routeMode(body.route_mode));
  if (plan?.error) return { controlled: true, error: plan.error, code: 'CARRIER_ROUTE_INVALID', status: 400, plan };
  if (!Number(plan?.configured_route_count || 0)) return { controlled: false, plan };
  const ranked = Array.isArray(plan?.ranked_routes) ? plan.ranked_routes : [];
  if (!ranked.length) {
    return { controlled: true, error: 'No configured carrier route is eligible for this destination and policy.', code: 'CARRIER_ROUTE_POLICY_BLOCKED', status: 503, plan };
  }
  const attempts = [];
  for (const route of ranked) {
    const adapter = executionAdapter(route, env);
    if (!adapter) {
      attempts.push({ route_id: route.route_id, ready: false, reason: 'execution-adapter-not-configured' });
      continue;
    }
    const health = adapter === 'byoc-bridge'
      ? await genericBridgeRouteHealth(env, route)
      : adapter === 'plivo'
        ? await plivoAccountHealth(env)
        : await twilioAccountHealth(env);
    attempts.push({ route_id: route.route_id, ready: health.ok === true, reason: health.reason || 'unavailable' });
    if (health.ok === true) return { controlled: true, plan, route, adapter, health, attempts };
  }
  return {
    controlled: true,
    error: 'Configured carrier routes did not pass authenticated health verification.',
    code: 'CARRIER_ROUTE_HEALTH_UNAVAILABLE',
    status: 503,
    plan,
    attempts
  };
}

async function dispatchSelectedRoute(request, env, body, selection) {
  const routeBody = {
    ...body,
    route_id: selection.route.route_id,
    interconnect_id: selection.route.interconnect_id,
    route_key: selection.health?.route_key || undefined
  };
  if (selection.adapter === 'byoc-bridge') {
    return handleLeadPhone(translatedRequest(request, '/api/phone/calls/outbound', routeBody), env);
  }
  if (selection.adapter === 'plivo') {
    return handlePlivoCarrier(translatedRequest(request, '/api/phone/calls/outbound', routeBody), env);
  }
  return handleVoiceAgent(
    translatedRequest(request, '/api/voice-agent/call', {
      to: body.to,
      contact_id: body.contact_id || null,
      queue_id: body.queue_id || null,
      opening_message: body.opening_message || undefined,
      consent_confirmed: true,
      ai_disclosure_accepted: true,
      time_limit_seconds: body.time_limit_seconds || 900
    }),
    env
  );
}

async function executePlannedCarrierCall(request, env, body) {
  const user = await currentUser(request, env);
  if (!user) return null;
  const selection = await selectedRouteExecution(env, user, body);
  if (!selection.controlled) return null;
  if (selection.error) {
    return json({
      detail: selection.error,
      code: selection.code,
      provider: 'magnanimous-carrier',
      route_policy_enforced: true,
      eligible_routes: Number(selection.plan?.eligible_routes || 0)
    }, selection.status || 503);
  }
  const attemptId = crypto.randomUUID();
  const startedAt = Math.floor(Date.now() / 1000);
  const response = await dispatchSelectedRoute(request, env, body, selection);
  if (!response) {
    await recordCarrierExecution(env, user, {
      call_id: attemptId,
      to_number: body.to,
      route_id: selection.route.route_id,
      interconnect_id: selection.route.interconnect_id,
      status: 'failed',
      started_at: startedAt,
      ended_at: Math.floor(Date.now() / 1000),
      metadata: { selection_mode: selection.plan.selection_mode, failure: 'adapter-returned-no-response' }
    });
    return json({ detail: 'The selected carrier route could not execute.', code: 'CARRIER_ROUTE_EXECUTION_FAILED', provider: 'magnanimous-carrier' }, 503);
  }
  const data = await response.clone().json().catch(() => ({}));
  const publicCallId = data.call_id ?? data.id ?? null;
  const providerCallId = String(data.provider_call_id || data.call_id || data.id || '');
  const status = response.ok ? String(data.status || 'queued') : (response.status >= 500 ? 'failed' : 'rejected');
  await recordCarrierExecution(env, user, {
    call_id: attemptId,
    provider_call_id: providerCallId,
    direction: 'outbound',
    from_number: body.from || '',
    to_number: body.to,
    interconnect_id: selection.route.interconnect_id,
    route_id: selection.route.route_id,
    status,
    started_at: startedAt,
    ended_at: response.ok ? null : Math.floor(Date.now() / 1000),
    metadata: {
      application_call_id: publicCallId,
      selection_mode: selection.plan.selection_mode,
      route_health_verified: true,
      execution_adapter: selection.adapter,
      estimated_rate: selection.route.estimated_rate
    }
  });
  if (!response.ok) {
    return json({
      detail: data.detail || data.message || 'The selected carrier route rejected the call.',
      code: data.code || 'CARRIER_ROUTE_EXECUTION_FAILED',
      provider: 'magnanimous-carrier',
      route: { route_id: selection.route.route_id, selection_mode: selection.plan.selection_mode, health_verified: true }
    }, response.status);
  }
  return json({
    id: data.id ?? data.call_id,
    call_id: data.call_id ?? data.id,
    provider_call_id: data.provider_call_id,
    status: data.status || 'queued',
    provider: 'magnanimous-carrier',
    agent: data.agent || null,
    route: { route_id: selection.route.route_id, selection_mode: selection.plan.selection_mode, health_verified: true }
  }, response.status || 201);
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

  if (path === '/api/phone/calls/outbound' && request.method === 'POST') {
    const body = await request.clone().json().catch(() => ({}));
    if (body.consent_confirmed !== true || body.ai_disclosure_accepted !== true) {
      return json({
        detail: 'Confirm contact permission and AI disclosure before placing an automated carrier call.',
        code: 'CALL_CONSENT_REQUIRED'
      }, 400);
    }
    const planned = await executePlannedCarrierCall(request, env, body);
    if (planned) return planned;
  }

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
        routePlannerLiveExecution: true,
        authenticatedRouteHealth: true,
        routeOrder: ['free-browser', 'workspace-byoc', 'metered-fallback', 'premium-fallback'],
        callerId: String(env.VOIP_CALLER_ID || ''),
        accessGranted: true,
        carrierCore: '/api/phone/carrier-core/status',
        message: isFlatRate(mode)
          ? 'Workspace flat-rate/BYOC calling is the primary ordinary-number route. Metered carrier calling remains a fallback when configured.'
          : 'Workspace BYOC calling is connected. Free browser calls remain first choice and the carrier bridge can use wholesale or metered routing.'
      });
    }
    return null;
  }

  if (plivoReady(env)) {
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
      routePlannerLiveExecution: true,
      authenticatedRouteHealth: true,
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
      env
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
      agent: data.agent || null
    }, voiceResponse.status || 201);
  }

  return null;
}
