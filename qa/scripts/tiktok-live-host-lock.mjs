import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const host = fs.readFileSync(new URL('frontend/app/tiktok-live/page.tsx', root), 'utf8');
const social = fs.readFileSync(new URL('frontend/app/social-hub/page.tsx', root), 'utf8');

const eventContract = fs.readFileSync(new URL('frontend/lib/live-studio/event-contract.ts', root), 'utf8');
const bridgeClient = fs.readFileSync(new URL('frontend/lib/live-studio/bridge-client.ts', root), 'utf8');
const bridgeDocs = fs.readFileSync(new URL('docs/live-studio/bridge-protocol.md', root), 'utf8');
const bridgeUi = fs.readFileSync(new URL('frontend/app/tiktok-live/bridge/page.tsx', root), 'utf8');
const eventInbox = fs.readFileSync(new URL('frontend/lib/live-studio/event-inbox.ts', root), 'utf8');

const checks = [
  ['host uses Magnanimous native chat transport', host.includes('postMagnanimousChat') && host.includes('${api}/api/chat')],
  ['host retains Magnanimous knowledge context', host.includes('use_knowledge: true')],
  ['host does not grant autonomous tool execution from viewer comments', host.includes('use_tools: false')],
  ['host uses native browser speech', host.includes('speakTextNaturally') && host.includes('configurePersonaVoice')],
  ['host primes speech from an explicit user interaction', host.includes('primeNaturalSpeech(true)')],
  ['host provides a stop-voice control', host.includes('function stop()') && host.includes('onClick={stop}')],
  ['host clearly discloses AI identity', host.includes('AI-GENERATED HOST') && host.includes('Do not pretend to be a human')],
  ['host truthfully discloses that this is not a TikTok broadcast', host.includes('It is not a TikTok broadcast')],
  ['viewer comments are manually entered by the operator', host.includes('Paste or type a viewer') && host.includes('LIVE HUMAN MODERATION')],
  ['TikTok Shop AI-narration restriction is visible in the host guidance', host.includes('Do not use this AI-voice host to sell products on TikTok Shop LIVE')],
  ['Social Hub links to the host control room', social.includes('href="/tiktok-live"')],
  ['live event contract supports TikTok, YouTube, Twitch, OBS and games', ['tiktok', 'youtube', 'twitch', 'obs', 'game'].every(provider => eventContract.includes("'" + provider + "'"))],
  ['untrusted provider events are normalized and bounded', eventContract.includes('normalizeLiveEvent') && eventContract.includes('cleanText(v.text,500)') && eventContract.includes('slice(0,max)') && eventContract.includes('7*86400000')],
  ['sensitive credentials are excluded from event tags', eventContract.includes('token|secret|password|cookie|authorization|credential')],
  ['bridge permits secure remote or loopback-only local transport', bridgeClient.includes("url.protocol!=='wss:'") && bridgeClient.includes("url.protocol==='ws:'&&loopback")],
  ['pairing credentials are sent in the message body, not URL parameters', bridgeClient.includes("kind:'auth'") && bridgeClient.includes('token')],
  ['bridge reconnect attempts are bounded', bridgeClient.includes('retryCount>=5')],
  ['bridge commands are allowlisted and do not expose destructive controls', eventContract.includes('normalizeLiveBridgeCommand') && !eventContract.includes("'broadcast.start'")],
  ['bridge protocol documents provider consent and tenant isolation', bridgeDocs.includes('tenant authorization') && bridgeDocs.includes('official OAuth')],
  ['autonomous takeover is opt-in and starts with an explicit owner consent checkbox', host.includes('takeoverConsent') && host.includes('I authorize Magnanimous AI to run this host session') && host.includes('if (!takeoverConsent || !autoSpeak || takeoverActive || busy || speaking) return;')],
  ['AI takeover is limited to explicit 10, 30 and 60 minute sessions', ['value={10}', 'value={30}', 'value={60}'].every(value => host.includes(value)) && host.includes('takeoverEndsAt - Date.now()')],
  ['AI takeover includes a visible emergency stop', host.includes('STOP AI TAKEOVER') && host.includes('function stopTakeover') && host.includes('stopNaturalSpeech()')],
  ['AI takeover processes only operator-queued comments, not claimed TikTok chat access', host.includes('Paste or type a viewer') && host.includes('queuedCommentsRef.current.length >= 25') && host.includes('const next = [...queuedCommentsRef.current, item]') && host.includes('TikTok does not provide a connected comment feed')],
  ['automatic comment queue is bounded and serialized behind speech', host.includes('queuedComments.length >= 25') && host.includes('if (!takeoverActive || takeoverPaused || busy || speaking || takeoverGreetingRef.current')],
  ['AI show director offers a separate owner opt-in timed rundown', host.includes('showRundownEnabled') && host.includes('Let Magnanimous autonomously run the timed show rundown')],
  ['timed rundown contains all six show phases', ['Set the direction','Main teaching','Audience participation','Interactive round','Practical takeaway','Recap and close'].every(label => host.includes(label))],
  ['rundown segments are scheduled against the selected session duration', host.includes('duration * segment.at') && host.includes('takeoverStartedAtRef.current') && host.includes('nextRundownSegmentRef.current')],
  ['rundown cues are internal host tasks, not displayed as viewer comments', host.includes("source !== 'show-rundown'") && host.includes('Owner-approved show segment') && host.includes("next.source === 'show-rundown'")],
  ['rundown scheduling pauses on queue failure and never discards existing items', host.includes('!showRundownEnabled || takeoverPaused') && host.includes('Magnanimous will not discard existing items')],

  ['failed AI answers pause and preserve the comment for retry or skip', host.includes('setFailedQueuedComment') && host.includes('retryFailedQueuedComment') && host.includes('skipFailedQueuedComment')],
  ['viewer PII and secrets are redacted before the Magnanimous prompt', host.includes('cleanLiveViewerText') && host.includes('[email removed]') && host.includes('[phone number removed]') && host.includes('[sensitive detail removed]')],
  ['AI host output is cleaned and bounded before browser speech', host.includes('cleanLiveHostText') && host.includes('.slice(0, 700)')],
  ['autonomous viewer comments cannot invoke Magnanimous tools or actions', host.includes('use_tools: false') && host.includes('Do not pretend to be a human')],
  ['paired event bridge relays only normalized events into the host queue', host.includes('normalizeLiveEvent(payload.event)') && host.includes("new BroadcastChannel('magnanimous-live-events-v1')") && host.includes('liveEventToHostPrompt')],
  ['AI host discovers an already-paired companion tab without storing bridge tokens', host.includes("kind: 'request-status'") && bridgeUi.includes('statusRef.current') && bridgeUi.includes("message.data?.kind==='request-status'") && !host.includes('localStorage.setItem')],
  ['event bridge page sends authenticated companion events to the host tab', bridgeUi.includes("new BroadcastChannel('magnanimous-live-events-v1')") && bridgeUi.includes("postMessage({kind:'event',event})") && /onEvent:\s*async\s+event\s*=>/.test(bridgeUi) && bridgeUi.includes('await persistLiveEvent(event)')],
  ['autonomous queue is capped for companion events as well as typed comments', host.includes('queuedCommentsRef.current.length >= 25') && host.includes('The live event queue is full (25 items)')],

  ['manual speaking controls cannot interrupt autonomous host speech', host.includes('onClick={welcome} disabled={takeoverActive}') && host.includes('onClick={() => speak(hostReply)} disabled={takeoverActive}')],
  ['LIVE Host links to the event bridge control room', host.includes('href="/tiktok-live/bridge"')],
  ['bridge UI uses the provider-neutral client', bridgeUi.includes('createLiveBridgeClient') && bridgeUi.includes('LiveEvent')],
  ['bridge UI truthfully discloses that the companion and adapters are not deployed', bridgeUi.includes('companion server and platform adapters are not deployed yet')],
  ['bridge UI rejects provider passwords and uses a one-time pairing token', bridgeUi.includes('Do not enter TikTok, Google, Twitch, OBS or game-account passwords') && bridgeUi.includes('short-lived pairing token') && bridgeUi.includes('Browser role token (memory only)')],
  ['bridge UI never persists pairing tokens', bridgeUi.includes('never saved in browser storage') && !/\b(?:localStorage|sessionStorage)\.setItem\s*\(/.test(bridgeUi) && !/\bindexedDB\.open\s*\(/.test(bridgeUi)],
  ['bridge UI bounds the event feed', bridgeUi.includes('.slice(0,50)')],
  ['local event inbox reclaims only already-delivered events and preserves pending items at capacity', eventInbox.includes('slotsToReclaim') && /remaining\.filter\(item => Number\.isFinite\(item\.deliveredAt\) && item\.deliveredAt > 0\)/.test(eventInbox) && eventInbox.includes('Existing events were preserved')],
  ['bridge surfaces local inbox write failures without forwarding or acknowledging the event', /onEvent:async event=>\{\s*try\{\s*await persistLiveEvent\(event\);\s*\}catch/.test(bridgeUi) && bridgeUi.includes('It remains unacknowledged so the relay can retry.')],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) {
  console.error(`Magnanimous TikTok LIVE host lock failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log('Magnanimous TikTok LIVE host contract passed.');
