import fs from 'node:fs';
const engine=fs.readFileSync('music-engine/app.py','utf8');
const adapter=fs.readFileSync('worker/src/music-studio.js','utf8');
for(const x of ['ACE-Step/Ace-Step1.5','text-to-audio','/v1/generate','MUSIC_ENGINE_TOKEN','soundfile'])if(!engine.includes(x))throw new Error('Engine missing '+x);
for(const x of ['MUSIC_ENGINE_URL','/v1/generate','magnanimous-self-hosted','status=\'completed\''])if(!adapter.includes(x))throw new Error('Adapter missing '+x);
if(/suno/i.test(engine+adapter))throw new Error('Forbidden outside music brand dependency');
console.log('Real Music Engine integration contract passed.');
