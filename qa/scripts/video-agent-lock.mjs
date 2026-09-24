import fs from'node:fs';
const r=fs.readFileSync(new URL('../../worker/src/video-agent-runtime.js',import.meta.url),'utf8');
const s=fs.readFileSync(new URL('../../worker/src/security-entrypoint.js',import.meta.url),'utf8');
for(const x of ['realtime-avatar','lip-sync','interruptions','consented-custom-avatar','rendering_ready:Boolean(live)','live_renderer_configured:adapterReady(env)',"u.pathname==='/api/video-agents'&&request.method==='GET'","u.pathname==='/api/video-agents/storyboard'&&request.method==='POST'",'renderVisualScene','visualProviderSnapshot','iam-cinematic-free','magnanimous-browser-assembly'])if(!r.includes(x))throw Error('video agent lock '+x);
if(!s.includes('handleVideoAgents')||!s.includes('getProviderRuntimeEnv(env);const vr=await handleVideoAgents'))throw Error('video agent provider routing lock');
console.log('Video agent root, storyboard and provider routing lock passed.');
