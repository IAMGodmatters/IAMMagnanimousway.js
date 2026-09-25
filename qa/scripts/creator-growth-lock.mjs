import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/creator-growth-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const social=read('worker/src/social-publishing-runtime.js');
const ui=read('frontend/app/creator-growth/page.tsx');
const socialUi=read('frontend/app/social-media/page.tsx');

for(const s of [
 "https://www.googleapis.com/youtube/v3",
 "https://youtubeanalytics.googleapis.com/v2/reports",
 "monthly_search_volume:null",
 "YouTube does not expose official keyword search volume through the public Data API",
 "Channel-relative breakout discovery",
 "Magnanimous-observed title/thumbnail changes",
 "History begins when Magnanimous first observes the video",
 "This is an RPM-based estimate, not actual YouTube revenue",
 "These are historical performance windows from observed upload results",
 "provider_details_private:true"
])assert.ok(runtime.includes(s),'Creator Growth truth/source contract missing '+s);

assert.ok(!runtime.toLowerCase().includes('vidiq'),'Creator Growth must remain Magnanimous-native, not outside-tool branded');
assert.ok(!runtime.includes('monthly_search_volume:1000'),'Creator Growth must never fabricate keyword search volume');
assert.ok(security.includes("handleCreatorGrowth"),'Creator Growth must be wired through secured runtime');
assert.ok(security.includes("url.pathname.startsWith('/api/creator-growth')"),'Creator Growth route must be secured');

for(const s of [
 'https://www.googleapis.com/auth/youtube.readonly',
 'https://www.googleapis.com/auth/youtube.upload',
 'https://www.googleapis.com/auth/yt-analytics.readonly',
 'export async function connectedYouTubeContext',
 'analytics_scope:scopes.includes'
])assert.ok(social.includes(s),'YouTube authorization context missing '+s);

for(const s of [
 'TITLE LAB','KEYWORD / TRENDS','OUTLIERS','CHANNEL','VIDEO','COMMENTS','OWNED ANALYTICS',
 '/api/creator-growth/keyword-research','/api/creator-growth/outliers','/api/creator-growth/analytics'
])assert.ok(ui.includes(s),'Creator Growth UI missing '+s);

assert.ok(socialUi.includes('href="/creator-growth"'),'Social Studio must link Creator Growth');
console.log('Creator Growth official-source, truthfulness and authorization locks passed.');
