import fs from 'node:fs';

const source = fs.readFileSync('frontend/app/voice-orchestrator.tsx', 'utf8');
const hardener = fs.readFileSync('frontend/app/voice-surface-hardener.tsx', 'utf8');
const globals = fs.readFileSync('frontend/app/global-tools.tsx', 'utf8');
const natural = fs.readFileSync('frontend/lib/natural-speech.ts', 'utf8');
const agents = fs.readFileSync('frontend/app/agents/page.tsx', 'utf8');
const videoAgents = fs.readFileSync('frontend/app/agent-video/page.tsx', 'utf8');
const virtualAssistant = fs.readFileSync('frontend/app/virtual-assistant/page.tsx', 'utf8');

const contracts = [
  ['speech output is primed from a user gesture', /function primeSpeechSynthesis\(\)/, source],
  ['microphone path primes spoken output', /primeSpeechSynthesis\(\);[\s\S]*?const r:SpeechRecognitionLike=new SR\(\)/, source],
  ['valid final recognition is remembered', /receivedFinal=true;setNotice\(''\)/, source],
  ['late recognition errors cannot overwrite a valid transcript', /if\(receivedFinal\)\{setNotice\(''\);return\}/, source],
  ['aborted recognition is not shown as a false hearing failure', /if\(code==='aborted'\)\{setNotice\(''\);return\}/, source],
  ['standalone voice input uses the real submit path', /form\.requestSubmit\(send\)/, source],
  ['voice submission retries while React enables Send', /if\(attempt<5\)window\.setTimeout\(\(\)=>submit\(attempt\+1\),140\)/, source],
  ['spoken replies use the shared natural speech engine', /speakTextNaturally\(settled/, source],
  ['streaming replies wait for a stable text window before speaking', /speechTimer\.current=window\.setTimeout\([\s\S]*?\},950\)/, source],
  ['unrelated DOM mutations cannot indefinitely postpone the same pending reply', /text===pendingReply\.current&&speechTimer\.current!==null/, source],
  ['voice reply detection has a bounded polling fallback when DOM mutation timing is missed', /setInterval\(scheduleReplySpeech,600\)/, source],
  ['voice reply polling is cleaned up on unmount', /clearInterval\(replyPoll\)/, source],
  ['speech playback failures are visible to the user', /browser could not play the voice/, source],
  ['remaining voice pages mount the global hardener', /<VoiceSurfaceHardener\/>/, globals],
  ['agent workspace voice auto-sends into its real chat form', /\.chat form textarea[\s\S]*?button\[type="submit"\]/, hardener],
  ['live video agent voice auto-sends into its real chat form', /\.stage form textarea[\s\S]*?button\.send/, hardener],
  ['virtual assistant voice auto-sends assignments', /\.work textarea[\s\S]*?button\.assign/, hardener],
  ['remaining voice surfaces prime speech from user gestures', /document\.addEventListener\('pointerdown',primeOnGesture,true\)/, hardener],
  ['remaining voice surfaces remember valid final recognition', /receivedFinal=false[\s\S]*?receivedFinal=true/, hardener],
  ['remaining voice surfaces ignore late recognition errors', /if\(receivedFinal\|\|code==='aborted'\)/, hardener],
  ['remaining voice surfaces resume synthesis before playback', /synth\.resume\?\.\(\)/, hardener],
  ['virtual assistant voice turns use stable chunked playback', /speakTextNaturally\(text,[\s\S]*?Virtual Assistant/, hardener],
  ['speech cleanup strips markdown emphasis and heading marks', /replace\(\/\[\\\*_~#\\\`\]\/g,''\)/, natural],
  ['speech cleanup removes bare web addresses before playback', /replace\(\/https\?:\\\/\\\/\\S\+\/gi,' '\)/, natural],
  ['speech playback is split into sentence-sized chunks', /export function splitSpeechText[\s\S]*?maxChars=260/, natural],
  ['speech playback ignores stale callbacks after cancellation', /generation!==speechGeneration/, natural],
  ['speech chunks continue only after the prior chunk ends', /utterance\.onend=[\s\S]*?setTimeout\(next/, natural],
  ['agent workspace uses shared natural speech', /speakTextNaturally\(text/, agents],
  ['live video agents use shared natural speech', /speakTextNaturally\(text/, videoAgents],
  ['virtual assistant uses shared natural speech', /speakTextNaturally\(output/, virtualAssistant],
];

let failed = false;
for (const [label, pattern, target] of contracts) {
  if (!pattern.test(target)) {
    console.error(`FAIL: ${label}`);
    failed = true;
  } else {
    console.log(`PASS: ${label}`);
  }
}

if (failed) process.exit(1);
console.log('Voice conversation source contracts are locked across all voice surfaces.');
