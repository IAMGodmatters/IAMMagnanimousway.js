import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/native-video-stack-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const renderer=read('video-renderer/server.py');
const ui=read('frontend/app/video-stack/page.tsx');
const movie=read('frontend/app/movie-maker/page.tsx');
const studio=read('frontend/app/video-studio/page.tsx');
const research=read('docs/MAGNANIMOUS-VIDEO-STACK-PUBLIC-SOURCE-RESEARCH-2026-09-25.md');

for(const s of [
 "SESSION_TTL=3600","CHUNK_MAX=8*1024*1024","x-magnanimous-media-session",
 "crypto.subtle.digest('SHA-256'","status TEXT NOT NULL DEFAULT 'initializing'",
 "'ready_to_play'","'canceled'","'failed'","accept-ranges","content-range",
 "video_stack_access_tokens","expires=N()+900","private, max-age=0",
 "preload_next","tags_json","metadata_json","tenantPlan(env,user.tenant_id)",
 "['free','plus']","/api/video/edit","browser-webrtc","tenant_isolation:true"
])assert.ok(runtime.includes(s),'native video stack missing '+s);

assert.ok(!runtime.includes('VIDEO_IO_APP_TOKEN'),'outside master token must not be part of native video stack');
assert.ok(security.includes("handleNativeVideoStack"),'native video stack must be routed through security entrypoint');
assert.ok(security.includes("url.pathname.startsWith('/api/video-stack')"),'video stack route must be secured explicitly');

for(const s of [
 'class EditSegment(BaseModel)','class EditRequest(BaseModel)',
 'approved_media_url','/api/video-stack/access/','MAGNANIMOUS_PUBLIC_MEDIA_HOSTS',
 'media_has_audio','anullsrc','-f", "concat"','watermark_required',
 '@app.post("/api/video/edit")','private_edit_sources_only'
])assert.ok(renderer.includes(s),'renderer edit safety/feature missing '+s);

for(const s of [
 'navigator.mediaDevices.getUserMedia','new MediaRecorder','PART=8*1024*1024',
 '/api/video-stack/uploads','/api/video-stack/playlists','Finalize selected clips',
 'Create live session','ready to play','RECORD • UPLOAD • PLAY • EDIT • LIVE'
])assert.ok(ui.includes(s),'video stack UI missing '+s);

assert.ok(movie.includes('href="/video-stack"'),'Movie Maker must link to native video stack');
assert.ok(studio.includes('href="/video-stack"'),'Video Studio must link to native video stack');
for(const s of ['BSD-3-Clause','Apache-2.0','No proprietary backend code','opaque one-hour media sessions','private by default'])assert.ok(research.includes(s),'public-source research record missing '+s);

console.log('Native Magnanimous video stack security, upload, playlist, editor and public-source locks passed.');
