import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE, magnanimousVoiceEngineSummary } from '../../worker/src/magnanimous-voice-engine-knowledge.js';

const read = path => fs.readFileSync(path, 'utf8');
const doc = read('docs/MAGNANIMOUS-REALTIME-VOICE-ENGINE-RESEARCH-2026-11-02.md');
const docker = read('telecom-core/asterisk/Dockerfile');
const compose = read('telecom-core/docker-compose.yml');
const voice = read('worker/src/voice-agent-runtime.js');
const callCenter = read('docs/call-center.md');

assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.identity.brain, 'Magnanimous AI');
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.status, 'design-approved-pending-runtime-and-e2e-verification');
assert.equal(magnanimousVoiceEngineSummary(), MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE);
assert.match(docker, /ARG ASTERISK_VERSION=22\.11\.0/);
assert.match(voice, /Gather input="speech"/);
assert.match(voice, /env\.AI\.run/);
assert.doesNotMatch(compose, /pipecat|voice-agent-runtime/i, 'research must not silently add an untested service');
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.adapter_contract.protocol.includes('Asterisk chan_websocket'), true);
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.selected_architecture.speech_pipeline.includes('custom Asterisk'), true);
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.evaluated_not_selected.callkit.disposition.includes('no open-source'), true);
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.evaluated_not_selected.livekit_agents.disposition.includes('add only if measured'), true);
assert.equal(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.speech_candidates.local_or_private_first, true);
assert.match(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.speech_candidates.tts[0].purpose, /not a Filipino\/Tagalog-ready claim/);
assert.match(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.cost.paid_providers, /disabled_until_explicitly_enabled_and_prepaid/);
assert.match(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.safety.transcripts, /never auto-publishes/i);
assert.match(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.safety.outbound, /DNC/);
assert.match(doc, /The supplied Facebook Reel URL could not be retrieved/);
assert.match(doc, /custom Pipecat FrameSerializer\/transport adapter/);
assert.match(doc, /Asterisk is distributed under GPLv2/);
assert.match(doc, /No Pipecat dependency, voice worker, container, deployment/);
assert.ok(callCenter.includes('Magnanimous AI remains the brain'), 'existing call-center ownership model must remain in place');
assert.ok(callCenter.includes('MAGNANIMOUS-REALTIME-VOICE-ENGINE-RESEARCH-2026-11-02.md'), 'call-center documentation must link to the realtime voice research');
assert.ok(MAGNANIMOUS_VOICE_ENGINE_KNOWLEDGE.readiness.length >= 6);

console.log('Magnanimous realtime voice-engine architecture lock PASS');
