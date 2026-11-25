import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const host = fs.readFileSync(new URL('frontend/app/tiktok-live/page.tsx', root), 'utf8');
const social = fs.readFileSync(new URL('frontend/app/social-hub/page.tsx', root), 'utf8');

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
];

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) {
  console.error(`Magnanimous TikTok LIVE host lock failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log('Magnanimous TikTok LIVE host contract passed.');
