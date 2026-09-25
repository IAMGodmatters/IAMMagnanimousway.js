import fs from'node:fs';
import assert from'node:assert/strict';
import {PROVIDER_PRICE_MARKUP_PERCENT,variableCustomerCharge} from '../../worker/src/provider-origin-pricing.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const heal=read('worker/src/self-healing-runtime.js');
const ops=read('worker/src/operations-entrypoint.js');
const page=read('frontend/app/owner-self-healing/page.tsx');
const ads=read('worker/src/sponsored-ad-runtime.js');
const legacy=read('worker/src/index.js');
const branch=read('worker/src/branch-consent-entrypoint.js');

for(const s of ['maxAttempts:3','retryMethods:[\'GET\',\'HEAD\']','scheduledSelfHealing','paid_fallback_required','current_incidents','audit_evidence_available'])assert.ok(heal.includes(s),'self-healing contract missing '+s);
for(const s of ['handleSelfHealing','scheduledSelfHealing'])assert.ok(ops.includes(s),'operations wiring missing '+s);
for(const s of ['CURRENT INCIDENTS','PRODUCTION HEALTH','FREE-FIRST AI','VOICE / AUDIO','COST IMPACT','Recent repair evidence'])assert.ok(page.includes(s),'owner self-healing UI missing '+s);

assert.equal(PROVIDER_PRICE_MARKUP_PERCENT,20);
assert.deepEqual(variableCustomerCharge(1),{
 provider_origin_cost_usd:1,markup_percent:20,markup_usd:.2,customer_charge_usd:1.2
});
assert.deepEqual(variableCustomerCharge(.01),{
 provider_origin_cost_usd:.01,markup_percent:20,markup_usd:.002,customer_charge_usd:.012
});

for(const s of ['MAGNANIMOUS_SPONSORED_ADS_ENABLED','owner_controlled: true','pending_owner_enable'])assert.ok(ads.includes(s),'owner ad control missing '+s);
assert.ok(legacy.includes("MAGNANIMOUS_SPONSORED_ADS_ENABLED"),'consumer ad API must stay disabled unless owner enabled');

for(const s of ['provider_details_private:true','execution_disclosure:\'Magnanimous AI privately selects authorized execution infrastructure. Specific infrastructure identities are owner-only.\''])assert.ok(branch.includes(s),'customer provider identity privacy missing '+s);

console.log('Self-healing, exact variable markup, ad control and provider-brand privacy lock passed.');
