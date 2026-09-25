import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
 PROVIDER_PRICE_MARKUP_PERCENT,
 variableCustomerCharge,
 googleImageOriginCost,
 googleVeoOriginCost,
 googleTtsOriginCost
} from '../../worker/src/provider-origin-pricing.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/movie-maker-runtime.js');
const page=read('frontend/app/movie-maker/page.tsx');
const watch=read('frontend/app/movie/page.tsx');
const renderer=read('video-renderer/server.py');
const media=read('magnanimous-runtime/services/media-service.mjs');
const security=read('worker/src/security-entrypoint.js');
const runtimeRoutes=read('frontend/app/platform-runtime-script.tsx');
const template=read('frontend/app/template.tsx');
const monetization=read('worker/src/monetization-runtime.js');
const credentials=read('worker/src/platform-credentials.js');
const providerEnv=read('worker/src/provider-runtime-env.js');
const envExample=read('.env.example');

assert.equal(PROVIDER_PRICE_MARKUP_PERCENT,20);
assert.equal(variableCustomerCharge(.05).customer_charge_usd,.06);
assert.equal(variableCustomerCharge(.60).customer_charge_usd,.72);
assert.equal(googleImageOriginCost({model:'gemini-3.1-flash-image',image_size:'4K'}).provider_origin_cost_usd,.151);
assert.equal(googleVeoOriginCost({model:'veo-3.1-lite-generate-preview',seconds:8,resolution:'720p'}).provider_origin_cost_usd,.4);
assert.equal(googleVeoOriginCost({model:'veo-3.1-generate-preview',seconds:8,resolution:'4k'}).provider_origin_cost_usd,4.8);
assert.equal(googleTtsOriginCost({model:'gemini-3.8-flash-tts',audio_seconds:10,billing_mode:'paid'}).provider_origin_cost_usd,.00225);

for(const s of [
 "WATERMARK='Magnanimous AI • I AM MAGNANIMOUS WAY™'",
 "watermarkRequired=plan=>['free','plus']",
 "premium_studio_allowed",
 "canUsePremium",
 "recordUsage",
 "provider_origin_cost_usd",
 "variableCustomerCharge",
 "provider_details_private:true",
 "sponsored_or_approved_ads_only:true",
 "incentivized_clicks:false",
 "artificial_views:false",
 "googleImageApiSize",
 "image_size:googleImageApiSize(selected.size)",
 "durationSeconds:String(seconds)",
 "gemini-omni-1.1-flash",
 "veo-3.1-lite-generate-preview",
 "veo-3.1-fast-generate-preview",
 "veo-3.1-generate-preview",
 "gemini-3.8-flash-tts",
 "gemini-3.8-flash-lite-tts"
])assert.ok(runtime.includes(s),'Movie Maker runtime contract missing '+s);

for(const s of [
 'Magnanimous Movie Maker',
 'Reference images — up to 14',
 'Economy',
 'Editable',
 'Maximum / 4K',
 'HEAR FREE NARRATION',
 'CREATE ECONOMY VOICE',
 'CREATE MAX STUDIO VOICE',
 'Download',
 'Copy link',
 'Share',
 'YouTube • TikTok • LinkedIn',
 'No fake ad clicks'
])assert.ok(page.includes(s),'Movie Maker UI contract missing '+s);

for(const s of ['SPONSORED','Viewing or clicking is optional','Created with Magnanimous AI'])assert.ok(watch.includes(s),'Movie watch contract missing '+s);
for(const s of ['background_image_data_uri','watermark_text','watermark_required','burned_watermark','drawtext'])assert.ok(renderer.includes(s),'Free renderer watermark contract missing '+s);
for(const s of ['watermark_text','watermarked:Boolean(watermark)','-annotate'])assert.ok(media.includes(s),'Native image watermark contract missing '+s);
assert.ok(security.includes("url.pathname.startsWith('/api/movie-maker')"),'Movie Maker must be routed through secured runtime');
assert.ok(runtimeRoutes.includes("'/movie'"),'public Movie watch route missing');
assert.ok(!runtimeRoutes.match(/publicPaths=\[[^;]*'\/movie-maker'/),'Movie Maker workspace must remain protected');
assert.ok(template.includes("'/movie'"),'template public Movie watch route missing');
for(const s of ['MAGNANIMOUS_AD_NETWORK_ENABLED','ADSENSE_SLOT_MOVIE','movie_ads_ready','Incentivized clicks and artificial impressions are prohibited'])assert.ok(monetization.includes(s),'movie ad network must remain owner-controlled: '+s);
for(const s of ['MAGNANIMOUS_AD_NETWORK_ENABLED','ADSENSE_SLOT_MOVIE'])assert.ok(credentials.includes(s)&&providerEnv.includes(s)&&envExample.includes(s),'owner movie-ad configuration is not wired end-to-end: '+s);
assert.ok(credentials.includes('GOOGLE_API_BILLING_MODE')&&providerEnv.includes('GOOGLE_API_BILLING_MODE')&&envExample.includes('GOOGLE_API_BILLING_MODE='),'Movie Maker free/paid billing mode must be owner-configurable and explicit.');

for(const forbidden of [
 'reward users for clicking',
 'click the ads to support',
 'auto-click',
 'click exchange',
 'artificial ad clicks'
])assert.ok(!runtime.toLowerCase().includes(forbidden),'Invalid ad engagement pattern present: '+forbidden);

console.log('Movie Maker watermark, media pricing, sharing, quality and ad-safety lock passed.');
