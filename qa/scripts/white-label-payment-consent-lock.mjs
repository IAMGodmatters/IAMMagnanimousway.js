import fs from'node:fs';
const x=fs.readFileSync(new URL('../../frontend/app/white-label/page.tsx',import.meta.url),'utf8');
for(const s of ['PremiumAgreementConsent','termsAccepted:true','agency-2026-09-18.1','agency-pro-2026-09-18.1','acceptedTerms[plan]','plan={p.id}'])if(!x.includes(s))throw Error('white label payment consent '+s);
if(!x.includes("plan==='agency_pro'?'agency-pro-2026-09-18.1':'agency-2026-09-18.1'"))throw Error('White Label checkout must send the plan-specific terms version.');
if(!x.includes("checked={!!acceptedTerms[p.id]}")||!x.includes("!acceptedTerms[p.id]"))throw Error('Each White Label plan must require its own visible consent before checkout.');
console.log('White Label plan-specific payment consent passed.');
