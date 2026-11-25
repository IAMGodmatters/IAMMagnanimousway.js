import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const host = fs.readFileSync(new URL('frontend/app/tiktok-live/page.tsx', root), 'utf8');
const social = fs.readFileSync(new URL('frontend/app/social-hub/page.tsx', root), 'utf8');
const research = fs.readFileSync(new URL('docs/research/tiktok-live-ai-host-frontier-technology-2026-11-25.md', root), 'utf8');

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
  ['TikTok Shop LIVE prohibits AI-generated audio/narration in host guidance', host.includes('does not allow AI-generated voiceovers') && host.includes('do not use AI-generated audio or narration') && host.includes('real human voice')],
  ['TikTok AIGC permission is distinguished from the separate LIVE narration rule', host.includes('permits AIGC in compliant content generally') && host.includes('TikTok Shop LIVE')],
  ['frontier technology acquisition panel is visible', host.includes('The newest live-host technology you can acquire') && host.includes('frontier')],
  ['Gemini Live Avatar enterprise and reconnect limits are disclosed', host.includes('Gemini Enterprise') && host.includes('context compression') && host.includes('session resumption')],
  ['Simli low-cost avatar path is disclosed as a separate renderer', host.includes('Simli Trinity-2 + Magnanimous') && host.includes('50 free minutes/month') && host.includes('150 ms') && host.includes('separate TTS audio stream')],
  ['Tavus BYO LLM/audio option and plan costs are disclosed', host.includes('Tavus CVI + Bring Your Own LLM/Audio') && host.includes('$59/month') && host.includes('$0.37/minute')],
  ['GPT-Live-1 voice-only limitation and price are disclosed', host.includes('GPT-Live-1') && host.includes('$0.05 per live-voice minute') && host.includes('not a rendered avatar')],
  ['HeyGen LiveAvatar free and paid tier limits are disclosed', host.includes('10 credits per month') && host.includes('maximum two-minute session') && host.includes('Starter $19/month') && host.includes('Business $475/month')],
  ['HeyGen paid session tiers are disclosed accurately', host.includes('Starter $19/month') && host.includes('Essential $99/month') && host.includes('Business $475/month') && host.includes('up to 60-minute sessions')],
  ['HeyGen credit-based time limits are disclosed', host.includes('30 seconds in Full mode or one minute in Lite mode')],
  ['no paid provider is activated by default', host.includes('Nothing below is activated, billed, or connected') && host.includes('NOT CONNECTED')],
  ['official live chat and stream access boundary is documented', research.includes('smb.creator_data.read') && research.includes('not a general-purpose permission to read live chat comments')],
  ['no-spend and Magnanimous-brain architecture is documented', research.includes('Magnanimous owns the intelligence') && research.includes('Do not silently buy minutes')],
  ['frontier research lists Simli and Tavus primary sources', research.includes('simli-client') && research.includes('tavus.io/cvi') && research.includes('Simli Trinity-2 + Magnanimous')],
  ['frontier research records explicit TikTok Shop AI narration prohibition', research.includes('not to use AI-generated audio or narration in livestreams') && research.includes('Unoriginal Content')],
  ['frontier research lists dated primary sources', research.includes('25 November 2026') && research.includes('deepmind.google') && research.includes('seller-ph.tiktok.com')],
  ['Social Hub links to the host control room', social.includes('href="/tiktok-live"')],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) {
  console.error(`Magnanimous TikTok LIVE host lock failed: ${failures.length} check(s).`);
  process.exit(1);
}
console.log('Magnanimous TikTok LIVE host contract passed.');
