import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const host = fs.readFileSync(new URL('frontend/app/tiktok-live/page.tsx', root), 'utf8');
const social = fs.readFileSync(new URL('frontend/app/social-hub/page.tsx', root), 'utf8');
const research = fs.readFileSync(new URL('docs/research/tiktok-live-ai-host-frontier-technology-2026-11-25.md', root), 'utf8');
const avatarRuntime = fs.readFileSync(new URL('worker/src/tiktok-live-avatar-runtime.js', root), 'utf8');
const avatarMigration = fs.readFileSync(new URL('worker/migrations/0113_tiktok_live_avatar_sessions.sql', root), 'utf8');
const operations = fs.readFileSync(new URL('worker/src/operations-entrypoint.js', root), 'utf8');
const security = fs.readFileSync(new URL('worker/src/security-entrypoint.js', root), 'utf8');

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
  ['technology grid has no literal newline escape text', !host.includes('techGrid">\\n')],
  ['Tavus BYO LLM/audio option and plan costs are disclosed', host.includes('Tavus CVI + Bring Your Own LLM/Audio') && host.includes('$59/month') && host.includes('$0.37/minute on Basic') && host.includes('$0.32/minute on Starter')],
  ['GPT-Live-1 voice-only limitation and price are disclosed', host.includes('GPT-Live 1.1') && host.includes('$0.05/minute') && host.includes('$0.02/minute') && host.includes('not a rendered avatar')],
  ['HeyGen LiveAvatar free and paid tier limits are disclosed', host.includes('10 credits per month') && host.includes('maximum two-minute session') && host.includes('Starter $19/month') && host.includes('Business $475/month')],
  ['HeyGen paid session tiers are disclosed accurately', host.includes('Starter $19/month') && host.includes('Essential $99/month') && host.includes('Business $475/month') && host.includes('up to 60-minute sessions')],
  ['HeyGen credit-based time limits are disclosed', host.includes('30 seconds in Full mode or one minute in Lite mode')],
  ['no paid provider is activated by default', host.includes('Nothing below is activated, billed, or connected') && host.includes('NOT CONNECTED')],
  ['official live chat and stream access boundary is documented', research.includes('smb.creator_data.read') && research.includes('not a general-purpose permission to read live chat comments')],
  ['no-spend and Magnanimous-brain architecture is documented', research.includes('Magnanimous owns the intelligence') && research.includes('Do not silently buy minutes')],
  ['frontier research lists Simli and Tavus primary sources', research.includes('simli-client') && research.includes('tavus.io/cvi') && research.includes('Simli Trinity-2 + Magnanimous')],
  ['Simli server gateway is owner-only', avatarRuntime.includes('platformOwnerDeveloperIdentity') && avatarRuntime.includes('Only the platform owner')],
  ['Simli gateway uses documented server-side session and ICE endpoints', avatarRuntime.includes('https://api.simli.ai/startAudioToVideoSession') && avatarRuntime.includes('https://api.simli.ai/getIceServer')],
  ['Simli provider key remains a Worker secret and is not returned', avatarRuntime.includes('SIMLI_API_KEY') && avatarRuntime.includes('apiKey:String(env.SIMLI_API_KEY)') && !avatarRuntime.includes('apiKey:session')],
  ['Simli gateway is fail-closed until explicitly enabled', avatarRuntime.includes("env?.SIMLI_AVATAR_ENABLED==='true'") && avatarRuntime.includes('SIMLI_AVATAR_NOT_CONFIGURED')),
  ['Simli sessions are provider-capped at 120 seconds and 30 idle seconds', avatarRuntime.includes('MAX_SESSION_SECONDS=120') && avatarRuntime.includes('MAX_IDLE_SECONDS=30')],
  ['Simli free-tier usage has a conservative 20-session reservation ceiling', avatarRuntime.includes('MAX_MONTHLY_SESSIONS=20') && avatarRuntime.includes('SIMLI_MONTHLY_TRIAL_LIMIT')),
  ['Simli D1 ledger does not store credentials or provider session tokens', avatarMigration.includes('session_seconds') && !/api_key|session_token/i.test(avatarMigration)),
  ['Simli session route is wired into Worker operations', operations.includes('handleTikTokLiveAvatar') && operations.includes('await handleTikTokLiveAvatar(request,env)')],
  ['Simli secret route bypasses the standalone API proxy', security.includes("url.pathname.startsWith('/api/tiktok-live/avatar/')")],
  ['Simli SDK and live TTS stream are disclosed as not yet connected', host.includes('browser SDK and a real TTS audio track are still required')],
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
