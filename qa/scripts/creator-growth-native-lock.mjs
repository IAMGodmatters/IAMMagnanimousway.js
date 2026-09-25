import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/creator-growth-runtime.js');
const page=read('frontend/app/creator-growth/page.tsx');
const social=read('worker/src/social-publishing-runtime.js');
const assistant=read('worker/src/assistant-integrations.js');
const security=read('worker/src/security-entrypoint.js');
const benchmark=read('docs/MAGNANIMOUS-CREATOR-GROWTH-VIDIQ-BENCHMARK-2026-09-25.md');
const home=read('frontend/app/page.tsx');
const catalog=read('frontend/app/interaction-catalog.ts');

for(const s of [
 '/api/creator-growth/keyword-research','/api/creator-growth/outliers','/api/creator-growth/channel-search',
 '/api/creator-growth/similar-videos','/api/creator-growth/similar-channels','/api/creator-growth/comment-insights',
 '/api/creator-growth/comment-replies','/api/creator-growth/owned-transcript','/api/creator-growth/youtube-video-update',
 '/api/creator-growth/youtube-comment-reply','/api/creator-growth/instagram/accounts','/api/creator-growth/instagram/profile',
 '/api/creator-growth/instagram/reels','/api/creator-growth/feedback','/api/creator-growth/job-poll',
 '/api/creator-growth/bookmarks','/api/creator-growth/competitors',
 '/api/creator-growth/analytics','/api/creator-growth/change-history','/api/creator-growth/performance-history'
])assert.ok(runtime.includes(s),'creator-growth runtime missing '+s);

for(const s of ['monthly_search_volume:null','does not expose official keyword search volume','Magnanimous-observed','native_similarity_score'])
 assert.ok(runtime.includes(s),'truthful native creator evidence missing '+s);

for(const s of ['Similar channels','Similar videos','Track competitor','Saved research','Draft replies','Owned captions','Publish title change to YouTube','Post reply to YouTube','Connected accounts','Recent Reels','Check job status','Save feedback'])
 assert.ok(page.includes(s),'creator-growth UI missing '+s);

assert.ok(!page.toLowerCase().includes('vidiq'),'consumer Creator Growth UI must not expose outside benchmark branding');
assert.ok(security.includes("url.pathname.startsWith('/api/creator-growth')"),'Creator Growth must run through the secured platform entrypoint');
assert.ok(social.includes('https://www.googleapis.com/auth/yt-analytics.readonly'),'YouTube connection must request read-only analytics scope');
assert.ok(social.includes('https://www.googleapis.com/auth/youtube.force-ssl'),'YouTube connection must request the official owner write scope');
for(const s of ['explicit_consent!==true','not owned by the connected YouTube channel','youtube_owner_write_ready','defaultLanguage','publicStatsViewable','selfDeclaredMadeForKids','containsSyntheticMedia'])assert.ok(runtime.includes(s),'guarded YouTube owner action missing '+s);
for(const s of ["provider==='instagram'","action==='read_media'","media_product_type","profile_picture_url"])assert.ok(assistant.includes(s),'Instagram assistant read capability missing '+s);
for(const s of ["assistant_permissions","can_read","decrypt(row.access_token,env)","source:'authorized-official-api'","creator_feedback","handleMovieMaker","/api/movie-maker/jobs/"])assert.ok(runtime.includes(s),'Creator Growth benchmark closure missing '+s);
assert.ok(benchmark.includes('Final mapped-gap closure'),'benchmark must record closure of the remaining mapped capabilities');
assert.ok(!benchmark.includes('| mapped |'),'all 63 benchmark rows must now have a concrete native/authorized implementation status');
assert.ok(benchmark.includes('| 63 |'),'benchmark must cover all 63 live vidIQ capability contracts observed on 2026-09-25');
assert.ok(benchmark.includes('does **not** copy proprietary code'),'benchmark must preserve the non-copy boundary');
assert.ok(home.includes("'/creator-growth'"),'Main Systems grid must expose Creator Growth');
assert.ok(catalog.includes("'/creator-growth':'social'"),'Interaction guidance must route Creator Growth into social/creator help');

console.log('Magnanimous native Creator Growth benchmark and safety lock passed.');
