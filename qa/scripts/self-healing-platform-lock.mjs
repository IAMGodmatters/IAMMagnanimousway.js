import fs from'node:fs';
import assert from'node:assert/strict';
import {PROVIDER_PRICE_MARKUP_PERCENT,pricingFor,variableCustomerCharge,voiceOriginCost} from '../../worker/src/provider-origin-pricing.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const heal=read('worker/src/self-healing-runtime.js');
const ops=read('worker/src/operations-entrypoint.js');
const page=read('frontend/app/owner-self-healing/page.tsx');
const ads=read('worker/src/sponsored-ad-runtime.js');
const legacy=read('worker/src/index.js');
const branch=read('worker/src/branch-consent-entrypoint.js');
const provider=read('worker/src/provider-entrypoint.js');
const voice=read('worker/src/premium-voice-runtime.js');
const businessPlan=read('worker/src/business-plan-quality-runtime.js');
const aiBinding=read('magnanimous-runtime/src/ai-binding.mjs');
const envExample=read('.env.example');
const carrierConsent=read('frontend/app/phone/carrier-consent.tsx');

for(const s of ['maxAttempts:3','retryMethods:[\'GET\',\'HEAD\']','scheduledSelfHealing','paid_fallback_required','current_incidents','audit_evidence_available','mediaProbe','movie_maker_health','free-movie-rendering-degraded'])assert.ok(heal.includes(s),'self-healing contract missing '+s);
for(const s of ['handleSelfHealing','scheduledSelfHealing'])assert.ok(ops.includes(s),'operations wiring missing '+s);
for(const s of ['CURRENT INCIDENTS','PRODUCTION HEALTH','FREE-FIRST AI','MOVIE MAKER','VOICE / AUDIO','COST IMPACT','Recent repair evidence'])assert.ok(page.includes(s),'owner self-healing UI missing '+s);

assert.equal(PROVIDER_PRICE_MARKUP_PERCENT,20);
assert.deepEqual(variableCustomerCharge(1),{
 provider_origin_cost_usd:1,markup_percent:20,markup_usd:.2,customer_charge_usd:1.2
});
assert.deepEqual(variableCustomerCharge(.01),{
 provider_origin_cost_usd:.01,markup_percent:20,markup_usd:.002,customer_charge_usd:.012
});
assert.equal(pricingFor('openai','gpt-6-luna').input_per_million_usd,.1);
assert.equal(pricingFor('openai','gpt-6-sol').output_per_million_usd,10);
assert.deepEqual(voiceOriginCost({provider:'elevenlabs-v3',characters:1000}),{
 ok:true,provider:'elevenlabs-v3',characters:1000,origin_usd_per_1000_characters:.1,
 provider_origin_cost_usd:.1,customer_charge_usd:.12,markup_usd:.02,markup_percent:20,
 pricing_source:'https://elevenlabs.io/pricing/api',pricing_verified_at:'2026-09-25'
});

for(const s of ['MAGNANIMOUS_SPONSORED_ADS_ENABLED','owner_controlled: true','pending_owner_enable'])assert.ok(ads.includes(s),'owner ad control missing '+s);
assert.ok(legacy.includes("MAGNANIMOUS_SPONSORED_ADS_ENABLED"),'consumer ad API must stay disabled unless owner enabled');

for(const s of ['provider_details_private:true','execution_disclosure:\'Magnanimous AI privately selects authorized execution infrastructure. Specific infrastructure identities are owner-only.\''])assert.ok(branch.includes(s),'customer provider identity privacy missing '+s);

for(const s of ['gpt-6-luna','gpt-6-sol','openai/gpt-oss-120b','deepseek-ai/deepseek-v4.1-flash','NVIDIA_AI_ENTERPRISE_LICENSE_CONFIRMED'])assert.ok(provider.includes(s),'current provider routing contract missing '+s);
for(const stale of ['llama-3.3-70b-versatile','deepseek-ai/deepseek-v4-flash-0731'])assert.ok(!provider.includes(stale),'deprecated provider model remains in live routing: '+stale);
for(const s of ['ELEVENLABS_COMMERCIAL_PLAN_CONFIRMED','MAX_CHARS=4000','provider_origin_cost_usd','DUPLICATE_VOICE_REQUEST','free_browser_voice:true'])assert.ok(voice.includes(s),'premium voice protection missing '+s);
assert.ok(!voice.includes('retry'),'premium synthesis must not auto-retry paid generation');
assert.ok(businessPlan.includes("provider_details_private:true"),'business-plan quality metadata must keep provider details private');
assert.ok(!businessPlan.includes("preferred_models:"),'customer business-plan quality metadata must not expose provider model names');
assert.ok(aiBinding.includes('tenant-aware billing guard'),'standalone binding must reject tenant-unaware paid fallback');
assert.ok(!aiBinding.includes("fetch('https://api.openai.com/v1/responses'"),'standalone binding must not directly invoke metered OpenAI');
for(const s of ['OPENAI_MODEL=gpt-6-luna','OPENAI_QUALITY_MODEL=gpt-6-sol','GOOGLE_API_BILLING_MODE='])assert.ok(envExample.includes(s),'environment contract missing '+s);
assert.ok(!carrierConsent.includes('Twilio AI carrier'),'customer carrier consent must not expose provider branding');

console.log('Self-healing, exact variable markup, current routing, premium voice, ad control and provider-brand privacy lock passed.');
