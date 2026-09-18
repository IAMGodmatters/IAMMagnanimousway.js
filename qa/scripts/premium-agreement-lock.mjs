import fs from'node:fs';
const a=fs.readFileSync(new URL('../../docs/legal/premium-services-agreement.md',import.meta.url),'utf8');
const r=fs.readFileSync(new URL('../../worker/src/premium-terms-consent.js',import.meta.url),'utf8');
for(const x of ['Recurring billing and cancellation','Prepaid and metered usage','Electronic agreement and records'])if(!a.includes(x))throw Error('terms '+x);
if(!a.toLowerCase().includes('opportunity to read'))throw Error('terms opportunity to read');
for(const x of ['termsVersion','affirmative:true','recurringDisclosureAccepted'])if(!r.includes(x))throw Error('consent '+x);
console.log('Premium agreement consent lock passed.');
