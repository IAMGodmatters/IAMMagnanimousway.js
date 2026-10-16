import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=fs.existsSync('frontend/app/social-hub/page.tsx')?'.':'..';
const read=p=>fs.readFileSync(`${root}/${p}`,'utf8');
const hub=read('frontend/app/social-hub/page.tsx');
const socialLayout=read('frontend/app/social-media/layout.tsx');
const returnLayout=read('frontend/app/social-connect/layout.tsx');
const integrations=read('worker/src/integrations.js');
const publishing=read('worker/src/social-publishing-runtime.js');
const has=(src,needle,msg)=>assert(src.includes(needle),msg);

for(const provider of ['facebook','instagram','whatsapp','youtube','linkedin','tiktok','x','snapchat','discord','telegram'])has(hub,`${provider}:`,`Universal social hub missing ${provider}`);
for(const check of ["setConsent('privacy'","setConsent('terms'","setConsent('ai'"])has(hub,check,`Universal social hub missing consent gate ${check}`);
has(hub,'/api/integrations/${item.id}/connect','General social providers must use the existing official integration OAuth rail');
has(hub,'/api/social-connect/${item.id}/start','YouTube/TikTok/LinkedIn must use the existing first-party social OAuth rail');
has(hub,"return_path:'/social-hub'",'General OAuth providers must return to the universal social hub');
has(hub,"sessionStorage.setItem('iam-social-hub-return','1')",'First-party social OAuth must record an authenticated return to the universal hub');
has(returnLayout,"location.replace(`/social-hub?connected=${encodeURIComponent(connected)}`)",'First-party social OAuth callbacks must return to the universal hub when started there');
has(socialLayout,'href="/social-hub"','Social Studio must expose the universal social hub');
has(integrations,"id:'facebook'",'Facebook integration contract must remain present');
has(integrations,"id:'instagram'",'Instagram integration contract must remain present');
has(integrations,"id:'whatsapp'",'WhatsApp integration contract must remain present');
has(publishing,"youtube:{name:'YouTube'",'YouTube publishing connection contract must remain present');
has(publishing,"tiktok:{name:'TikTok'",'TikTok publishing connection contract must remain present');
has(publishing,"linkedin:{name:'LinkedIn'",'LinkedIn publishing connection contract must remain present');
assert(!hub.includes('passwords are stored'),'Universal social hub must not claim social passwords are stored');
console.log('Universal social hub lock passed.');
