import fs from 'node:fs';
const page=fs.readFileSync('frontend/app/music-studio/page.tsx','utf8');
const blueprint=fs.readFileSync('docs/magnanimous-music-studio-blueprint.md','utf8');
const required=['Music Studio','provider-neutral','Rights protection','Free-first','/video-studio'];
for(const x of required) if(!page.includes(x)) throw new Error('Missing Music Studio contract: '+x);
for(const forbidden of ['suno.com','api.suno','Suno API']) if(page.includes(forbidden)) throw new Error('Public Music Studio must remain independent: '+forbidden);
if(!blueprint.includes('native, provider-neutral')) throw new Error('Music blueprint independence rule missing');
console.log('Magnanimous Music Studio foundation checks passed.');
