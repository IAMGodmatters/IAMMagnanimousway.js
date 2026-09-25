import fs from'node:fs';
import assert from'node:assert/strict';
import {googleVeoOriginCost,googleImageReserveUsd,googleTtsOriginCost,variableCustomerCharge,PROVIDER_PRICE_MARKUP_PERCENT} from '../../worker/src/provider-origin-pricing.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const movie=read('worker/src/movie-maker-runtime.js');
const maker=read('frontend/app/movie-maker/page.tsx');
const watch=read('frontend/app/movie/page.tsx');
const renderer=read('video-renderer/server.py');
const media=read('magnanimous-runtime/services/media-service.mjs');
const monetization=read('worker/src/monetization-runtime.js');
const env=read('.env.example');
const security=read('worker/src/security-entrypoint.js');

assert.equal(PROVIDER_PRICE_MARKUP_PERCENT,20);
assert.equal(variableCustomerCharge(.05).customer_charge_usd,.06);
assert.equal(variableCustomerCharge(.60).customer_charge_usd,.72);
assert.equal(googleVeoOriginCost({model:'veo-3.1-lite-generate-preview',seconds:8,resolution:'720p'}).provider_origin_cost_usd,.4);
assert.equal(googleVeoOriginCost({model:'veo-3.1-generate-preview',seconds:8,resolution:'4k'}).provider_origin_cost_usd,4.8);
assert.ok(googleImageReserveUsd('1K','gemini-3.1-flash-lite-image')>.0336);
assert.equal(googleTtsOriginCost({model:'gemini-3.8-flash-tts',billing_mode:'free'}).provider_origin_cost_usd,0);

for(const s of [
 "const WATERMARK='Magnanimous AI • I AM MAGNANIMOUS WAY™'",
 "const watermarkRequired=plan=>['free','plus']",
 "premium_studio_allowed",
 "veo-3.1-lite-generate-preview",
 "veo-3.1-fast-generate-preview",
 "veo-3.1-generate-preview",
 "gemini-3.1-flash-lite-image",
 "gemini-3.1-flash-image",
 "gemini-3-pro-image",
 "gemini-3.8-flash-lite-tts",
 "gemini-3.8-flash-tts",
 "incentivized_clicks:false",
 "artificial_views:false",
 "social_publish_url"
])assert.ok(movie.includes(s),'Movie Maker contract missing '+s);

for(const stale of ['sora-2','veo-2.0-generate-001','gemini-3.1-flash-image-preview','gemini-3-pro-image-preview'])assert.ok(!movie.includes(stale),'Movie Maker contains retired/deprecated model '+stale);
assert.ok(security.includes("handleMovieMaker"),'Movie Maker must be wired through security entrypoint');

for(const s of ['watermark_required','BUILD STORYBOARD','CREATE ECONOMY VOICE','CREATE MAX STUDIO VOICE','navigator.share','files:[file]','YouTube • TikTok • LinkedIn'])assert.ok(maker.includes(s),'Movie Maker UI missing '+s);
assert.ok(watch.includes("Engagement is never rewarded or required.")||watch.includes("Viewing or clicking is optional"),'movie watch ads must not encourage clicks');
assert.ok(watch.includes("ADVERTISEMENT"),'movie watch ad network must be clearly labeled');
assert.ok(watch.includes("SPONSORED"),'movie sponsor placement must be clearly labeled');
assert.ok(renderer.includes("watermark_required: bool = False"),'video renderer must accept enforced watermark policy');
assert.ok(movie.includes("body.reference_images.slice(0,14)"),'Movie Maker must support up to 14 image references');
assert.ok(movie.includes("estimated_provider_origin_cost_usd:reserve"),'studio media must reserve funded provider-origin cost before generation');
assert.ok(movie.includes("INSERT INTO movie_maker_jobs")&&movie.includes("'paid'"),'studio video jobs must record paid billing mode');
assert.ok(renderer.includes("Magnanimous AI • I AM MAGNANIMOUS WAY™"),'video renderer must burn Magnanimous watermark');
assert.ok(media.includes("watermark_text"),'native image service must support real watermark rendering');
assert.ok(media.includes("'-annotate'"),'native image watermark must be rendered into output bytes');

for(const s of ['MAGNANIMOUS_AD_NETWORK_ENABLED','ADSENSE_SLOT_MOVIE','owner_enabled','Incentivized clicks and artificial impressions are prohibited'])assert.ok(monetization.includes(s),'monetization guard missing '+s);
for(const s of ['ENABLE_PREMIUM_MEDIA=false','GOOGLE_API_BILLING_MODE=','ADSENSE_SLOT_MOVIE=','MAGNANIMOUS_AD_NETWORK_ENABLED=false'])assert.ok(env.includes(s),'Movie Maker environment contract missing '+s);

console.log('Movie Maker pricing, watermark, sharing, monetization and current-model locks passed.');
