import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/creator-growth-runtime.js');
const social=read('worker/src/social-publishing-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const ui=read('frontend/app/creator-growth/page.tsx');
const socialUi=read('frontend/app/social-media/page.tsx');
const doc=read('docs/VIDIQ-CREATOR-GROWTH-ABSORPTION-2026-09-25.md');

for(const s of [
 '/api/creator-growth/title-score','/api/creator-growth/title-ideas','/api/creator-growth/thumbnail-brief',
 '/api/creator-growth/keyword-research','/api/creator-growth/outliers','/api/creator-growth/trending',
 '/api/creator-growth/channel-stats','/api/creator-growth/channel-videos','/api/creator-growth/video-stats',
 '/api/creator-growth/comments','/api/creator-growth/comment-insights','/api/creator-growth/analytics',
 '/api/creator-growth/best-time','/api/creator-growth/change-history','/api/creator-growth/performance-history',
 '/api/creator-growth/chapters','/api/creator-growth/clip-plan','/api/creator-growth/script-plan',
 '/api/creator-growth/earnings-estimate','/api/creator-growth/channel-search',
 '/api/creator-growth/similar-videos','/api/creator-growth/similar-channels',
 '/api/creator-growth/videos-batch','/api/creator-growth/channels-batch',
 '/api/creator-growth/categories','/api/creator-growth/comment-replies',
 '/api/creator-growth/daily-ideas','/api/creator-growth/bookmarks','/api/creator-growth/competitors',
 'monthly_search_volume:null',
 'YouTube does not expose official keyword search volume','channel_recent_median_views',
 'History begins when Magnanimous first observes the video','not a claim that subscribers are online','Similarity uses public','not guaranteed view predictions'
])assert.ok(runtime.includes(s),'Creator Growth runtime missing '+s);

assert.ok(security.includes("handleCreatorGrowth"),'Creator Growth must pass through secured runtime');
assert.ok(security.includes("url.pathname.startsWith('/api/creator-growth')"),'Creator Growth route must be explicitly secured');
assert.ok(social.includes('https://www.googleapis.com/auth/yt-analytics.readonly'),'YouTube connection must support read-only analytics');
assert.ok(!social.includes('https://www.googleapis.com/auth/yt-analytics-monetary.readonly'),'least-privilege default must not silently request monetary analytics');
assert.ok(social.includes('connectedYouTubeContext'),'authorized YouTube context helper missing');

for(const s of ['MAGNANIMOUS CREATOR GROWTH','Keyword research','Find breakout videos','Audience insights','Retention curve','Creator Growth'])assert.ok(ui.includes(s),'Creator Growth UI missing '+s);
assert.ok(!ui.toLowerCase().includes('vidiq'),'customer Creator Growth UI must not expose benchmark/provider branding');
assert.ok(socialUi.includes('href="/creator-growth"'),'Social Studio must link to Creator Growth');

for(const s of ['63 current tool contracts','Never invent search volume','does **not** copy vidIQ','External creator-intelligence services remain optional research sources'])assert.ok(doc.includes(s),'creator absorption record missing '+s);

console.log('Magnanimous Creator Growth native capability, truth, privacy and analytics locks passed.');
