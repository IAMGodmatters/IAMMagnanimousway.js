import fs from 'node:fs';

const source = fs.readFileSync('frontend/app/voice-orchestrator.tsx', 'utf8');

const contracts = [
  ['speech output is primed from a user gesture', /function primeSpeechSynthesis\(\)/],
  ['microphone path primes spoken output', /primeSpeechSynthesis\(\);[\s\S]*?const r:SpeechRecognitionLike=new SR\(\)/],
  ['valid final recognition is remembered', /receivedFinal=true;setNotice\(''\)/],
  ['late recognition errors cannot overwrite a valid transcript', /if\(receivedFinal\)\{setNotice\(''\);return\}/],
  ['aborted recognition is not shown as a false hearing failure', /if\(code==='aborted'\)\{setNotice\(''\);return\}/],
  ['standalone voice input uses the real submit path', /form\.requestSubmit\(send\)/],
  ['voice submission retries while React enables Send', /if\(attempt<5\)window\.setTimeout\(\(\)=>submit\(attempt\+1\),140\)/],
  ['spoken replies resume synthesis before speaking', /window\.speechSynthesis\.resume\?\.\(\);[\s\S]*?window\.speechSynthesis\.speak\(u\)/],
  ['speech playback failures are visible to the user', /browser could not play the voice/],
];

let failed = false;
for (const [label, pattern] of contracts) {
  if (!pattern.test(source)) {
    console.error(`FAIL: ${label}`);
    failed = true;
  } else {
    console.log(`PASS: ${label}`);
  }
}

if (failed) process.exit(1);
console.log('Voice conversation source contracts are locked.');
