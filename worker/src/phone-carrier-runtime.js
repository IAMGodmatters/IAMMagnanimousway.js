import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePlivoCarrier, plivoReady } from './plivo-carrier-runtime.js';

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

  // Plivo is the preferred direct carrier when configured. Twilio remains a
  // compatible fallback, and a user-supplied bridge still takes precedence.
  if (genericBridgeReady(env)) return null;
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
      provider: 'Twilio AI carrier',
      carrierMode: 'twilio-ai',
      aiCarrier: true,
      callerId: String(env.TWILIO_PHONE_NUMBER || ''),
      accessGranted: access,
      inboundWebhook: `${url.origin}/api/voice-agent/twilio/incoming`,
      message: access
        ? 'Twilio is connected. Carrier calls from this dialer are handled by your automated MAGNANIMOUS AI receptionist and are recorded in call history.'
        : 'Twilio is connected. AI carrier calling requires Full Business; free browser calling remains available.'
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
    if (!voiceResponse) return json({ detail: 'The Twilio carrier route is unavailable.' }, 503);
    const data = await voiceResponse.clone().json().catch(() => ({}));
    if (!voiceResponse.ok) return voiceResponse;
    return json({
      id: data.call_id,
      call_id: data.call_id,
      provider_call_id: data.provider_call_id,
      status: data.status,
      provider: data.provider || 'twilio-ai',
      agent: data.agent || null
    }, voiceResponse.status || 201);
  }

  return null;
}
