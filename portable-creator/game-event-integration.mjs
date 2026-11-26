import crypto from 'node:crypto';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Create a per-unlock secret for trusted local game/app event producers. */
export function createLocalGameIntegrationToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/** Compare bearer credentials without leaking a byte-by-byte timing signal. */
export function verifyLocalGameIntegrationToken(expected, authorization) {
  if (typeof expected !== 'string' || !TOKEN_PATTERN.test(expected)) return false;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return false;
  const supplied = authorization.slice(7);
  if (!TOKEN_PATTERN.test(supplied)) return false;
  const a = Buffer.from(expected, 'ascii');
  const b = Buffer.from(supplied, 'ascii');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Only the minimal, bounded game event shape crosses into the live event queue. */
export function normalizeLocalGameEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const eventId = typeof input.eventId === 'string' ? input.eventId.trim() : '';
  const occurredAt = typeof input.occurredAt === 'string' ? input.occurredAt : '';
  const text = typeof input.text === 'string'
    ? input.text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500)
    : '';
  const gameName = typeof input.gameName === 'string'
    ? input.gameName.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 80)
    : '';
  const actorName = typeof input.actorName === 'string'
    ? input.actorName.replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 48)
    : 'Game integration';
  if (input.protocolVersion !== 1 || !/^[A-Za-z0-9._:-]{1,160}$/.test(eventId)) return null;
  if (!occurredAt || !Number.isFinite(Date.parse(occurredAt)) || !text) return null;
  if (Math.abs(Date.now() - Date.parse(occurredAt)) > 7 * 86400000) return null;
  return {
    protocolVersion: 1,
    eventId,
    provider: 'game',
    type: 'game.event',
    occurredAt,
    actorName: actorName || 'Game integration',
    text,
    ...(gameName ? { tags: { gameName, source: 'local-game-integration' } } : { tags: { source: 'local-game-integration' } })
  };
}
