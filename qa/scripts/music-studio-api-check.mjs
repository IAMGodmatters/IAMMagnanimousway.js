import fs from 'node:fs';
const api=fs.readFileSync('worker/src/music-studio.js','utf8');
const index=fs.readFileSync('worker/src/index.js','utf8');
for(const route of ['capabilities','projects','generate','lyrics','extend','remix','replace-section','remaster','stems','sounds','midi','render']) if(!api.includes(route)) throw new Error('Missing music API capability '+route);
for(const guard of ['Sign in required','tenant_id','voice_consent','source_rights','No audio generation engine configured','cost_units']) if(!api.includes(guard)) throw new Error('Missing guard '+guard);
if(!index.includes("handleMusic(request,env,user,path)")) throw new Error('Music API not wired');
if(/suno/i.test(api)) throw new Error('Music API must remain independent');
console.log('Music Studio API contract passed.');
