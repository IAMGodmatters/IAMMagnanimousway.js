import fs from'node:fs';
const x=fs.readFileSync(new URL('../../frontend/app/white-label/page.tsx',import.meta.url),'utf8');
for(const s of ['PremiumAgreementConsent','termsAccepted:true','agency-2026-09-18.1','agency-pro-2026-09-18.1','!termsAccepted'])if(!x.includes(s))throw Error('white label payment consent '+s);
if(!x.includes("plan==='agency_pro'?'agency-pro-2026-09-18.1':'agency-2026-09-18.1'"))throw Error('White Label checkout must send the plan-specific terms version.');
console.log('White Label payment consent passed.');
