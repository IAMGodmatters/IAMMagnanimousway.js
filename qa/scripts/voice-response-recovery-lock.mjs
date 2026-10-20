import assert from 'node:assert/strict';
import fs from 'node:fs';

const provider=fs.readFileSync('worker/src/provider-entrypoint.js','utf8');
const assistant=fs.readFileSync('frontend/app/virtual-assistant/page.tsx','utf8');
const standalone=fs.readFileSync('frontend/app/magnanimous/page.tsx','utf8');
const voices=fs.readFileSync('frontend/lib/persona-voice.ts','utf8');

const start=provider.indexOf('function nativeOriginalSong(message)');
const end=provider.indexOf('\nfunction extractBrainContext(',start);
assert.ok(start>=0&&end>start,'native original song helper must exist');
const implementation=provider.slice(start,end);
const song=new Function(`${implementation}\nreturn nativeOriginalSong;`)();

for(const phrase of [
 'sing me a song',
 'Sing me a song!',
 'Please sing me a song.',
 'Can you sing us a little song?',
 '[WRITING MODE]\nsing me a song',
 '[BIBLE STUDY MODE]\nPlease sing me a song.',
]){
 const lyrics=song(phrase);
 assert.match(lyrics,/A Brighter Day/);
 assert.match(lyrics,/Chorus/);
 assert.match(lyrics,/Verse 2/);
 assert.ok(lyrics.length>200,'real usable original lyrics expected');
}
assert.equal(song('Can you send an email for me?'),'','non-song tasks must route normally');
assert.equal(song('Give me the latest headlines'),'','research tasks must route normally');

assert.match(provider,/if\(originalLyrics\)return json\(\{output:originalLyrics/);
assert.match(provider,/native_song:true/);
assert.match(provider,/voice_performance:'not-generated'/);
assert.match(provider,/const otherFreeReady=Boolean\(freeFailoverAvailable\)/,'only shorten Workers AI budget for real alternate candidates');
assert.match(provider,/freeFailoverAvailable=requested==='auto'&&candidates\.slice/,'honor explicit provider selection and remaining failover candidates');
assert.match(provider,/otherFreeReady\?24000:CLOUDFLARE_MODEL_BUDGET_MS/,'reserve failover time only when another free engine exists');
assert.match(provider,/Math\.min\(modelTimeout,remaining\)/,'apply the adaptive per-model timeout');
assert.match(assistant,/message: isSimpleSong \? request :/,'Virtual Assistant passes simple song prompts directly');
assert.match(assistant,/if \(d\.degraded \|\| d\.code === "AI_PROVIDER_POOL_DEGRADED"\)/,'Virtual Assistant must detect provider exhaustion despite HTTP 200');
assert.match(assistant,/setTask\(request\);/,'Virtual Assistant must restore failed request');
assert.match(assistant,/!ready && !isSimpleSongRequest\(request\)/,'native song bypasses the no-provider run guard');
assert.match(assistant,/!ready && !isSimpleSongRequest\(task\)/,'native song bypasses the no-provider button guard');
assert.match(assistant,/partialSources\.length && String\(d\.output\|\|""\)\.trim\(\)/,'source-backed degraded results must remain visible');
assert.ok(assistant.indexOf('setTask("");')>assistant.indexOf('setOutput(d.output);'),'draft only clears after real success');
assert.match(assistant,/availablePersonaVoices\(/);
assert.match(assistant,/setPreferredPersonaVoiceId\(e\.target\.value\)/);
assert.match(standalone,/d\?\.degraded===true\|\|d\?\.code==='AI_PROVIDER_POOL_DEGRADED'/,'standalone chat must expose retry');
assert.match(standalone,/partialSources\.length&&partialText/,'standalone must retain partial research results');
assert.match(voices,/getPreferredPersonaVoiceId/);
assert.match(voices,/const preferred=voices\.find/);
assert.match(voices,/if\(central\)return\{voice:chosen,rate:\.98,pitch:1/);
console.log('PASS: original song fallback, honest speech capability, retry retention, and user-selectable device voices.');
