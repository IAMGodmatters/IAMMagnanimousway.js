import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLocalGameIntegrationToken,
  verifyLocalGameIntegrationToken,
  normalizeLocalGameEvent
} from './game-event-integration.mjs';

test('game integration token is high entropy and URL safe', () => {
  const token = createLocalGameIntegrationToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(token, createLocalGameIntegrationToken());
});

test('game integration token accepts only its exact bearer credential', () => {
  const token = createLocalGameIntegrationToken();
  assert.equal(verifyLocalGameIntegrationToken(token, 'Bearer ' + token), true);
  assert.equal(verifyLocalGameIntegrationToken(token, 'Bearer ' + createLocalGameIntegrationToken()), false);
  assert.equal(verifyLocalGameIntegrationToken(token, token), false);
  assert.equal(verifyLocalGameIntegrationToken(token, 'Basic ' + token), false);
});

test('game integration token rejects malformed and missing credentials', () => {
  assert.equal(verifyLocalGameIntegrationToken(null, 'Bearer abc'), false);
  assert.equal(verifyLocalGameIntegrationToken('bad', 'Bearer bad'), false);
  assert.equal(verifyLocalGameIntegrationToken(createLocalGameIntegrationToken(), undefined), false);
});

test('normalizes only bounded game events and strips control characters', () => {
  const event = normalizeLocalGameEvent({
    protocolVersion: 1,
    eventId: 'game-round-1',
    occurredAt: new Date().toISOString(),
    gameName: 'Minecraft',
    actorName: '<player>\u0000',
    text: 'Round started\u0000'
  });
  assert.equal(event.provider, 'game');
  assert.equal(event.type, 'game.event');
  assert.equal(event.gameName, undefined);
  assert.equal(event.tags.gameName, 'Minecraft');
  assert.equal(event.actorName, 'player');
  assert.equal(event.text, 'Round started');
});

test('rejects wrong protocol, provider spoofing fields and malformed event IDs', () => {
  const base = { protocolVersion: 1, eventId: 'ok', occurredAt: new Date().toISOString(), text: 'A game event' };
  assert.equal(normalizeLocalGameEvent({ ...base, protocolVersion: 2 }), null);
  assert.equal(normalizeLocalGameEvent({ ...base, eventId: 'bad event id' }), null);
});

test('rejects empty, stale and missing event text', () => {
  const base = { protocolVersion: 1, eventId: 'ok', occurredAt: new Date().toISOString() };
  assert.equal(normalizeLocalGameEvent({ ...base, text: '   ' }), null);
  assert.equal(normalizeLocalGameEvent({ ...base, text: 'old', occurredAt: new Date(Date.now() - 8 * 86400000).toISOString() }), null);
  assert.equal(normalizeLocalGameEvent({ ...base }), null);
});

test('caps game name, actor and event text lengths', () => {
  const event = normalizeLocalGameEvent({
    protocolVersion: 1,
    eventId: 'bounded',
    occurredAt: new Date().toISOString(),
    gameName: 'G'.repeat(200),
    actorName: 'A'.repeat(100),
    text: 'T'.repeat(900)
  });
  assert.equal(event.tags.gameName.length, 80);
  assert.equal(event.actorName.length, 48);
  assert.equal(event.text.length, 500);
});

test('does not forward credential-shaped or arbitrary caller fields', () => {
  const event = normalizeLocalGameEvent({
    protocolVersion: 1,
    eventId: 'minimal',
    occurredAt: new Date().toISOString(),
    text: 'Level complete',
    password: 'should-not-appear',
    accessToken: 'should-not-appear',
    action: 'run-shell'
  });
  assert.deepEqual(Object.keys(event).sort(), ['actorName','eventId','occurredAt','protocolVersion','provider','tags','text','type'].sort());
  assert.equal(JSON.stringify(event).includes('should-not-appear'), false);
});
