import fs from 'node:fs';

const source = fs.readFileSync('frontend/app/voice-orchestrator.tsx', 'utf8');
const hardener = fs.readFileSync('frontend/app/voice-surface-hardener.tsx', 'utf8');
const globals = fs.readFileSync('frontend/app/global-tools.tsx', 'utf8');

const contracts = [
  ['speech output is primed from a user gesture', /function primeSpeechSynthesis\(\)/, source],
  ['microphone path primes spoken output', /primeSpeechSynthesis\(\);[\s\S]*?const r:SpeechRecognitionLike=new SR\(\)/, source],
  ['valid final recognition is remembered', /receivedFinal=true;setNotice\(''\)/, source],
  ['late recognition errors cannot overwrite a valid transcript', /if\(receivedFinal\)\{setNotice\(''\);return\}/, source],
  ['aborted recognition is not shown as a false hearing failure', /if\(code==='aborted'\)\{setNotice\(''\);return\}/, source],
  ['standalone voice input uses the real submit path', /form\.requestSubmit\(send\)/, source],
  ['voice submission retries while React enables Send', /if\(attempt<5\)window\.setTimeout\(\(\)=>submit\(attempt\+1\),140\)/, source],
  ['spoken replies resume synthesis before speaking', /window\.speechSynthesis\.resume\?\.\(\);[\s\S]*?window\.speechSynthesis\.speak\(u\)/, source],
  ['speech playback failures are visible to the user', /browser could not play the voice/, source],
  ['remaining voice pages mount the global hardener', /<VoiceSurfaceHardener\/>/, globals],
  ['agent workspace voice auto-sends into its real chat form', /\.chat form textarea[\s\S]*?button\[type="submit"\]/, hardener],
  ['live video agent voice auto-sends into its real chat form', /\.stage form textarea[\s\S]*?button\.send/, hardener],
  ['virtual assistant voice auto-sends assignments', /\.work textarea[\s\S]*?button\.assign/, hardener],
  ['remaining voice surfaces prime speech from user gestures', /document\.addEventListener\('pointerdown',primeOnGesture,true\)/, hardener],
  ['remaining voice surfaces remember valid final recognition', /receivedFinal=false[\s\S]*?receivedFinal=true/, hardener],
  ['remaining voice surfaces ignore late recognition errors', /if\(receivedFinal\|\|code==='aborted'\)/, hardener],
  ['remaining voice surfaces resume synthesis before playback', /synth\.resume\?\.\(\)/, hardener],
  ['virtual assistant voice turns speak generated results', /location\.pathname\.startsWith\('\/virtual-assistant'\)[\s\S]*?SpeechSynthesisUtterance/, hardener],
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
