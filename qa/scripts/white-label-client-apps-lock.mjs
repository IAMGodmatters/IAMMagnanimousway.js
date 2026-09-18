import fs from'node:fs';
const r=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const wl=r('worker/src/white-label-os-runtime.js'),apps=r('frontend/app/white-label/client-apps/page.tsx'),os=r('frontend/app/white-label-os/page.tsx'),biz=r('frontend/app/business-ai/page.tsx'),deploy=r('.github/workflows/deploy.yml');
for(const s of ["import {BUSINESS_AI_SUITE}","CORE_CLIENT_APPS","'business-ai:'+id","catalog_count:CLIENT_APP_CATALOG.length","authorization_boundary"])if(!wl.includes(s))throw Error('White Label expanded client catalog missing '+s);
for(const s of ["client-app-search","client-app-group","business-ai?tool=","security authorization boundary","/agency-command?tab=funnels"])if(!apps.includes(s)&&!os.includes(s))throw Error('White Label client app UX/route missing '+s);
if(!biz.includes("get('tool')")||!biz.includes("setPick(found)"))throw Error('Business AI deep-link preselection missing');
for(const s of ["len(apps) == 58","catalog_count') == 58","business-ai:podcast-studio","business-ai:logo-maker","business-ai:accounting-books","business-ai:data-studio","business-ai:open-media-library"])if(!deploy.includes(s))throw Error('White Label production smoke missing '+s);
console.log('White Label 58-app client catalog and route integrity passed.');