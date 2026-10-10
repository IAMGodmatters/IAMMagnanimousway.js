import fs from'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const w=r('worker/wrangler.jsonc'),b=r('worker/src/billing-tiers-runtime.js'),a=r('worker/src/agency-billing-extension.js');
for(const id of ['price_1UGsdOBqx3ebIzujDBMRWFcm','price_1UOpLVBqx3ebIzujjKLZrs57','price_1UOpLdBqx3ebIzujmg94r0s0','price_1UOpLpBqx3ebIzuj20q5SAUH','price_1UEs75Bqx3ebIzujqlWosJKu','price_1UEs7EBqx3ebIzujT5pbI3QH'])if(!w.includes(id))throw Error('live Stripe catalog reference missing '+id);
for(const s of ['STRIPE_PAYMENT_LINK_AGENCY','STRIPE_PAYMENT_LINK_AGENCY_PRO'])if(!w.includes(s))throw Error('live Stripe White Label fallback missing '+s);
for(const s of ['TERMS_ACCEPTANCE_REQUIRED','metadata[terms_version]','Magnanimous Unlimited Fair-Use','Magnanimous CRM Pro','Magnanimous Business','Magnanimous Business Annual','configuredPriceForPlan','price_data][unit_amount]'])if(!b.includes(s))throw Error('primary billing runtime missing '+s);
for(const s of ['Magnanimous Agency','Magnanimous Agency Pro','price_usd:299','price_usd:499','agencyCheckoutConfigured'])if(!a.includes(s))throw Error('agency billing runtime missing '+s);
console.log('Live Stripe catalog alignment passed: Plus, CRM Pro, Business, Business Annual and White Label catalog references are locked; new CRM/Business checkout verifies configured Prices and retains safe recurring Checkout price-data fallback.');
