import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deepgramVoiceReadiness,
  deepgramVoiceRuntimeReadiness,
  deepgramVoiceEnabled,
  buildDeepgramConsentTwiml,
  buildDeepgramStreamTwiml,
  buildDeepgramSettings,
  createDeepgramVoiceStreamToken,
  openAIStreamFromWorkersAI
} from '../../worker/src/deepgram-voice-agent-runtime.js';

const read = path => fs.readFileSync(path, 'utf8');
const runtime = read('worker/src/voice-agent-runtime.js');
const bridge = read('worker/src/deepgram-voice-agent-runtime.js');
const security = read('worker/src/security-entrypoint.js');
const router = read('worker/src/router-entrypoint.js');
const ui = read('frontend/app/ai-receptionist/page.tsx');
const wrangler = read('worker/wrangler.jsonc');
const docs = read('docs/call-center.md');
const knowledge = read('worker/src/magnanimous-voice-engine-knowledge.js');

const noKey = deepgramVoiceReadiness({
  DEEPGRAM_VOICE_AGENT_ENABLED: 'true',
  DEEPGRAM_VOICE_LANGUAGE: 'multi',
  DEEPGRAM_TTS_PROVIDER: 'cartesia',
  DEEPGRAM_CARTESIA_VOICE_ID: 'a167e0f3-df7e-4d52-a9c3-f949145efdab',
  AI: { run() {} }
});
assert.equal(noKey.ready, false, 'the streaming provider must fail closed without its server API key');
assert.ok(noKey.missing.includes('DEEPGRAM_API_KEY secret'));

const env = {
  DEEPGRAM_VOICE_AGENT_ENABLED: 'true',
  DEEPGRAM_API_KEY: 'test-only-not-a-real-key',
  DEEPGRAM_VOICE_LANGUAGE: 'multi',
  DEEPGRAM_TTS_PROVIDER: 'cartesia',
  DEEPGRAM_CARTESIA_MODEL: 'sonic-3.5',
  DEEPGRAM_CARTESIA_VOICE_ID: 'a167e0f3-df7e-4d52-a9c3-f949145efdab',
  AI: { run() {} },
  SESSION_SECRET: 'test-only-session-signing-secret'
};
assert.equal(deepgramVoiceReadiness(env).ready, true);
assert.equal(await deepgramVoiceEnabled(env), true);
assert.equal((await deepgramVoiceRuntimeReadiness(env)).ready, true);
const incompleteRuntime = await deepgramVoiceRuntimeReadiness(noKey);
assert.equal(incompleteRuntime.ready, false);
assert.ok(incompleteRuntime.missing.includes('SESSION_SECRET or auth_config.session_secret'));

const consent = buildDeepgramConsentTwiml('https://example.test/api/voice-agent/twilio/consent?call_id=42');
assert.match(consent, /Press 1 to agree and continue/);
assert.match(consent, /text transcript may be created/);
assert.doesNotMatch(consent, /<Connect>|<Stream>/, 'no audio stream starts before affirmative consent');

const streamTwiml = buildDeepgramStreamTwiml('wss://example.test/api/voice-agent/twilio/stream', 'signed-call-token');
assert.match(streamTwiml, /<Connect><Stream/);
assert.match(streamTwiml, /name="voice_token"/);
assert.doesNotMatch(streamTwiml, /<Dial>/, 'provider failure must not silently create a paid transfer');

const settings = buildDeepgramSettings({
  env,
  agent: {
    id: 'agent-1',
    instructions: 'Answer customer questions using the approved business knowledge.',
    opening_message: 'Hello, how can I help?',
    handoff_phone: '+639171234567'
  },
  origin: 'https://iammagnanimousway.com',
  thinkToken: 'short-lived-call-scoped-token'
});
assert.equal(settings.type, 'Settings');
assert.equal(settings.mip_opt_out, true);
assert.deepEqual(settings.audio.input, { encoding: 'mulaw', sample_rate: 8000 });
assert.equal(settings.audio.output.encoding, 'mulaw');
assert.equal(settings.audio.output.sample_rate, 8000);
assert.equal(settings.agent.listen.provider.model, 'nova-3');
assert.equal(settings.agent.listen.provider.language, 'multi');
assert.equal(settings.agent.speak.provider.type, 'cartesia');
assert.equal(settings.agent.speak.provider.model_id, 'sonic-3.5');
assert.equal(settings.agent.speak.provider.language, 'multi');
assert.equal(settings.agent.speak.provider.model_id, 'sonic-3.5');
assert.equal(settings.agent.think.provider.type, 'open_ai');
assert.equal(settings.agent.think.provider.model, 'magnanimous-voice-v1');
assert.equal(settings.agent.think.endpoint.url, 'https://iammagnanimousway.com/api/voice-agent/think');
assert.equal(settings.agent.think.endpoint.headers.authorization, 'Bearer short-lived-call-scoped-token');
assert.match(settings.agent.think.prompt, /Magnanimous AI is the reasoning and decision-making authority/);
assert.match(settings.agent.think.prompt, /press zero/);

const token = await createDeepgramVoiceStreamToken(env, { id: 42, tenant_id: 'tenant-1' }, { id: 'agent-1' });
const [payload, signature] = token.split('.');
assert.ok(payload && signature);
const claims = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
assert.equal(claims.scope, 'stream');
assert.equal(claims.call_id, 42);
assert.equal(claims.tenant_id, 'tenant-1');
assert.equal(claims.agent_id, 'agent-1');
assert.ok(claims.exp > Math.floor(Date.now() / 1000));

const encoder = new TextEncoder();
const fakeWorkersAiStream = new ReadableStream({
  start(controller) {
    controller.enqueue(encoder.encode('data: {"response":"Hello"}\n\n'));
    controller.enqueue(encoder.encode('data: {"response":" there."}\n\n'));
    controller.close();
  }
});
const openAiStreamResponse = openAIStreamFromWorkersAI(fakeWorkersAiStream, 42, 'test-model');
assert.equal(openAiStreamResponse.headers.get('content-type')?.startsWith('text/event-stream'), true);
const openAiStreamText = await openAiStreamResponse.text();
assert.match(openAiStreamText, /"role":"assistant"/);
assert.match(openAiStreamText, /Hello/);
assert.match(openAiStreamText, /there/);
assert.match(openAiStreamText, /"finish_reason":"stop"/);
assert.match(openAiStreamText, /data: \[DONE\]/);

assert.match(runtime, /deepgramVoiceEnabled\(env\)/);
assert.match(runtime, /twilio\/consent/);
assert.match(runtime, /ai_voice_consent/);
assert.match(runtime, /createDeepgramVoiceStreamToken/);
assert.match(runtime, /handoff_phone/);
assert.match(runtime, /expires_at/);
assert.match(bridge, /sec-websocket-protocol/);
assert.match(bridge, /rateLimitStreamHandshake/);
assert.match(bridge, /rateLimitThink/);
assert.match(bridge, /voice_stream_handshake_limits/);
assert.match(bridge, /voice_think_request_limits/);
assert.match(bridge, /audioBytes>=1600/);
assert.match(bridge, /setTimeout\(flushAudioBuffer,200\)/);
assert.match(bridge, /media\.track/);
assert.match(bridge, /behavior:"interrupt"/);
assert.match(bridge, /voice_provider_sessions/);
assert.match(bridge, /DEEPGRAM_VOICE_MONTHLY_MINUTES_CAP/);
assert.match(bridge, /AgentAudioDone/);
assert.match(bridge, /voice_do_not_call/);
assert.match(bridge, /humanHandoffTwiml/);
assert.match(bridge, /InjectAgentMessage/);
assert.match(bridge, /openAIStreamFromWorkersAI/);
assert.match(security, /api\/voice-agent\/twilio\/stream/);
assert.match(security, /api\/voice-agent\/think/);
assert.match(router, /response\?\.webSocket/);
assert.match(ui, /handoff_phone/);
assert.match(ui, /deepgram_voice_agent/);
assert.match(wrangler, /DEEPGRAM_VOICE_DAILY_MINUTES_CAP": "30"/);
assert.match(wrangler, /DEEPGRAM_VOICE_MONTHLY_MINUTES_CAP": "300"/);
assert.match(docs, /press 1/i);
assert.match(docs, /300 minutes per calendar month/);
assert.match(docs, /30 days/);
assert.match(knowledge, /Deepgram Voice Agent API/);

console.log('Deepgram streaming call-center lock PASS');
