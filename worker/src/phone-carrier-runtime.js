import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePlivoCarrier, plivoReady } from './plivo-carrier-runtime.js';
import { handleMagnanimousCarrierPhoneAlias } from './magnanimous-carrier-phone-alias.js';

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
