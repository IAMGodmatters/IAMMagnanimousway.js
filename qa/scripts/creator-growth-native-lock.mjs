import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/creator-growth-runtime.js');
const page=read('frontend/app/creator-growth/page.tsx');
const social=read('worker/src/social-publishing-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const benchmark=read('docs/MAGNANIMOUS-CREATOR-GROWTH-VIDIQ-BENCHMARK-2026-09-25.md');

for(const s of [
 '/api/creator-growth/keyword-research','/api/creator-growth/outliers','/api/creator-growth/channel-search',
 '/api/creator-growth/similar-videos','/api/creator-growth/similar-channels','/api/creator-growth/comment-insights',
 '/api/creator-growth/comment-replies','/api/creator-growth/bookmarks','/api/creator-growth/competitors',
 '/api/creator-growth/analytics','/api/creator-growth/change-history','/api/creator-growth/performance-history'
])assert.ok(runtime.includes(s),'creator-growth runtime missing '+s);

for(const s of ['monthly_search_volume:null','does not expose official keyword search volume','Magnanimous-observed','native_similarity_score'])
 assert.ok(runtime.includes(s),'truthful native creator evidence missing '+s);

for(const s of ['Similar channels','Similar videos','Track competitor','Saved research','Draft replies'])
 assert.ok(page.includes(s),'creator-growth UI missing '+s);

assert.ok(!page.toLowerCase().includes('vidiq'),'consumer Creator Growth UI must not expose outside benchmark branding');
assert.ok(security.includes("url.pathname.startsWith('/api/creator-growth')"),'Creator Growth must run through the secured platform entrypoint');
assert.ok(social.includes('https://www.googleapis.com/auth/yt-analytics.readonly'),'YouTube connection must request read-only analytics scope');
assert.ok(benchmark.includes('| 63 |'),'benchmark must cover all 63 live vidIQ capability contracts observed on 2026-09-25');
assert.ok(benchmark.includes('does **not** copy proprietary code'),'benchmark must preserve the non-copy boundary');

console.log('Magnanimous native Creator Growth benchmark and safety lock passed.');
