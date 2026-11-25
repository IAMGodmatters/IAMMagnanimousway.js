import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const host = fs.readFileSync(new URL('frontend/app/tiktok-live/page.tsx', root), 'utf8');
const social = fs.readFileSync(new URL('frontend/app/social-hub/page.tsx', root), 'utf8');

const eventContract = fs.readFileSync(new URL('frontend/lib/live-studio/event-contract.ts', root), 'utf8');
const bridgeClient = fs.readFileSync(new URL('frontend/lib/live-studio/bridge-client.ts', root), 'utf8');
const bridgeDocs = fs.readFileSync(new URL('docs/live-studio/bridge-protocol.md', root), 'utf8');
const bridgeUi = fs.readFileSync(new URL('frontend/app/tiktok-live/bridge/page.tsx', root), 'utf8');

const checks = [
  ['host uses Magnanimous native chat transport', host.includes('postMagnanimousChat') && host.includes('${api}/api/chat')],
  ['host retains Magnanimous knowledge context', host.includes('use_knowledge: true')],
  ['host does not grant autonomous tool execution from viewer comments', host.includes('use_tools: false')],
  ['host uses native browser speech', host.includes('speakTextNaturally') && host.includes('configurePersonaVoice')],
  ['host primes speech from an explicit user interaction', host.includes('primeNaturalSpeech(true)')],
  ['host provides a stop-voice control', host.includes('function stop()') && host.includes('onClick={stop}')],
  ['host clearly discloses AI identity', host.includes('AI-GENERATED HOST') && host.includes('Do not pretend to be a human')],
  ['host truthfully discloses that this is not a TikTok broadcast', host.includes('It is not a TikTok broadcast')],
  ['viewer comments are manually entered by the operator', host.includes('paste or type a question into this control room') && host.includes('LIVE HUMAN MODERATION')],
  ['AI co-host supports structured game/app cues without pretending to have a live feed', host.includes('GAME &amp; APP CO-HOST CONTEXT') && host.includes('gameEventType') && host.includes('gameContext') && host.includes('Treat this as unverified operator context, not a live game feed')],
  ['TikTok Shop AI-narration restriction is visible in the host guidance', host.includes('Do not use this AI-voice host to sell products on TikTok Shop LIVE')],
  ['Social Hub links to the host control room', social.includes('href="/tiktok-live"')],
  ['live event contract supports TikTok, YouTube, Twitch, OBS and games', ['tiktok', 'youtube', 'twitch', 'obs', 'game'].every(provider => eventContract.includes("'" + provider + "'"))],
  ['untrusted provider events are normalized and bounded', eventContract.includes('normalizeLiveEvent') && eventContract.includes('cleanText(v.text,500)') && eventContract.includes('slice(0,max)') && eventContract.includes('7*86400000')],
  ['sensitive credentials are excluded from event tags', eventContract.includes('token|secret|password|cookie|authorization|credential')],
  ['browser pairing tokens can only reach the official Magnanimous WSS host and pairing path', bridgeClient.includes("url.protocol!=='wss:'") && bridgeClient.includes("url.hostname!=='iammagnanimousway.com'") && bridgeClient.includes('pairPath.test(url.pathname)') && bridgeClient.includes("url.port&&url.port!=='443'")],
  ['pairing credentials are sent in the message body, not URL parameters', bridgeClient.includes("kind:'auth'") && bridgeClient.includes('token')],
  ['bridge reconnect attempts are bounded', bridgeClient.includes('retryCount>=5')],
  ['bridge commands are allowlisted and do not expose destructive controls', eventContract.includes('normalizeLiveBridgeCommand') && !eventContract.includes("'broadcast.start'")],
  ['bridge protocol documents provider consent and tenant isolation', bridgeDocs.includes('tenant authorization') && bridgeDocs.includes('official OAuth')],
  ['LIVE Host links to the event bridge control room', host.includes('href="/tiktok-live/bridge"')],
  ['bridge UI uses the provider-neutral client', bridgeUi.includes('createLiveBridgeClient') && bridgeUi.includes('LiveEvent')],
  ['bridge UI truthfully discloses that the companion and adapters are not deployed', bridgeUi.includes('Provider account adapters and public broadcasting are not yet connected.')],
  ['bridge UI rejects provider passwords and uses temporary revocable pairing credentials', bridgeUi.includes('Do not enter TikTok, Google, Meta, Twitch, Zoom, OBS or game-account passwords') && bridgeUi.includes('temporary pairing credentials') && bridgeUi.includes('Revoke pairing')],
  ['bridge UI never persists pairing tokens', bridgeUi.includes('never saved in browser storage') && !bridgeUi.includes('localStorage')],
  ['bridge UI has exactly one revoke handler and revocation invalidates the tracked pair', (bridgeUi.match(/async function revokePair\(\)/g)||[]).length===1 && bridgeUi.includes('await revokePairId(pairId)') && bridgeUi.includes('setPairId(\'\')')],
  ['bridge UI bounds the event feed', bridgeUi.includes('.slice(0,50)')],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) {
  console.error(`Magnanimous TikTok LIVE host lock failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log('Magnanimous TikTok LIVE host contract passed.');
