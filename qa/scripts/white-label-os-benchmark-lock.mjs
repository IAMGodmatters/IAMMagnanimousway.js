import fs from'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'),x=r('worker/src/white-label-os-runtime.js'),o=r('worker/src/operations-entrypoint.js'),p=r('frontend/app/white-label-os/page.tsx');
for(const s of ['Brand Studio','CRM + Pipelines','Sites + Funnels','Automation Studio','Unified Inbox','Appointments','Reputation','Usage Rebilling','Catalog + Packages','Client Portal Pages','Projects','Proposals + Electronic Signatures','Learning Assets','Affiliate Programs','Agency Overview','Magnanimous AI','Connections + Payments','Mobile-ready Portal Pages'])if(!x.includes(s))throw Error('module '+s);
for(const t of ['agency_catalog_items','agency_projects','agency_contracts','agency_learning_assets','agency_affiliate_programs','agency_client_apps'])if(!x.includes(t))throw Error('storage '+t);
for(const forbidden of ['Proposals + eSign','Projects + Tasks','installable-app path'])if(x.includes(forbidden))throw Error('overstated White Label capability remains: '+forbidden);
if(!o.includes('handleWhiteLabelOS'))throw Error('not wired');
if(!p.includes('Five-year-old explanation'))throw Error('simple UX missing');
console.log('White Label OS truthful-capability benchmark passed.');