import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/creator-growth-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const page=read('frontend/app/creator-growth/page.tsx');
const home=read('frontend/app/page.tsx');
const social=read('worker/src/social-publishing-runtime.js');
const movie=read('worker/src/movie-maker-runtime.js');

for(const s of [
  "keyword-research","outlier-discovery","title-score","thumbnail-brief",
  "owned-channel-analytics","best-time-to-post","change-history","performance-trends",
  "movie-maker","media-compose","media-edit","social-publishing",
  "monthly_search_volume:null",
  "does not expose official keyword search volume",
  "Magnanimous reports evidence-based demand and competition proxies",
  "History begins when Magnanimous first observes the video"
])assert.ok(runtime.includes(s),'Creator Growth contract missing '+s);

for(const s of [
  "/api/creator-growth/title-score","/api/creator-growth/title-ideas",
  "/api/creator-growth/keyword-research","/api/creator-growth/outliers",
  "/api/creator-growth/channel-stats","/api/creator-growth/video-stats",
  "/api/creator-growth/comment-insights","/api/creator-growth/analytics",
  "/api/creator-growth/best-time"
])assert.ok(runtime.includes(s),'Creator Growth endpoint missing '+s);

assert.ok(security.includes("handleCreatorGrowth"),'Creator Growth must run through security entrypoint');
assert.ok(security.includes("url.pathname.startsWith('/api/creator-growth')"),'Creator Growth route must be wired');

for(const s of ['MAGNANIMOUS CREATOR GROWTH','Keyword research','Outliers','Analytics','Thumbnail brief','Script plan'])
 assert.ok(page.includes(s),'Creator Growth UI missing '+s);

assert.ok(home.includes("'/creator-growth'"),'Home systems must expose Creator Growth');
assert.ok(social.includes('https://www.googleapis.com/auth/yt-analytics.readonly'),'YouTube connection must request read-only analytics scope');
assert.ok(movie.includes("Magnanimous Movie Maker"),'Creator engine must retain native Movie Maker handoff');

for(const forbidden of ['vidIQ API','vidIQ proprietary','clone vidIQ code','vidiq.com/api'])
 assert.ok(!runtime.includes(forbidden),'Native creator runtime must not depend on proprietary vidIQ internals: '+forbidden);

console.log('Creator Growth native capability, truthful-data and secured-route locks passed.');
