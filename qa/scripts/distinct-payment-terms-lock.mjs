import fs from'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'),c=r('frontend/components/PremiumAgreementConsent.tsx'),t=r('frontend/app/terms/page.tsx'),b=r('worker/src/billing-tiers-runtime.js'),a=r('worker/src/agency-billing-extension.js');
const ids=['plus','crm','business','pro','scale','agency','agency_pro','prepaid10','prepaid25','ownership'];
for(const id of ids){if(!c.includes(id+':{version:'))throw Error('missing product terms '+id);if(!t.includes('id="terms-'+id+'"'))throw Error('missing published terms '+id)}
for(const v of ['unlimited-2026-09-18.1','crm-2026-10-10.1','business-2026-10-10.1','business-annual-2026-10-10.1'])if(!b.includes(v))throw Error('billing gate '+v);
for(const v of ['agency-2026-09-18.1','agency-pro-2026-09-18.1'])if(!a.includes(v))throw Error('agency gate '+v);
for(const price of ['$79/month','$119/month','$1,190/year'])if(!t.includes(price))throw Error('published price missing '+price);
console.log('Distinct payment terms audit passed.');
