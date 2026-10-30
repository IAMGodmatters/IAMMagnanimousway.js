import fs from'node:fs';import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const visual=read('frontend/lib/mode-visuals.ts'),home=read('frontend/app/page.tsx'),vault=read('frontend/app/opportunity-vault/page.tsx'),catalog=read('frontend/app/interaction-catalog.ts'),kids=read('worker/src/kids-media-runtime.js'),credentials=read('worker/src/platform-credentials.js'),runtimeControl=read('worker/src/runtime-control.js'),kidsMigration=read('worker/migrations/0096_kids_drive_runtime_hotpath.sql');
for(const name of ['general','business','social-media','research','writing']){
 const path='frontend/public/mode-images/'+name+'.svg';
 assert.ok(fs.existsSync(new URL('../../'+path,import.meta.url)),path+' missing');
 const svg=read(path);
 assert.ok(svg.includes('I Am Magnanimous Way, Trademark.'),path+' must carry Magnanimous trademark line');
 assert.ok(visual.includes('/mode-images/'+name+'.svg'),'mode registry must use '+name+' artwork');
}
assert.ok(visual.includes('/mode-images/virtual-assistant.webp'),'existing Virtual Assistant portrait must be preserved');
for(const s of ['/opportunity-vault','Opportunity Vault'])assert.ok(home.includes(s),'home must expose '+s);
for(const s of [
 'https://www.atlascapture.io/opportunities','https://apps.apple.com/ph/app/atlas-capture/id6755671397',
 'https://jobs.lever.co/weloglobal/?location=Philippines','https://app.outlier.ai/opportunities?hl=en-US',
 'https://www.prolific.com/participants-join-us','2PDR9UXD','NOT CURRENTLY PH-SUPPORTED',
 'https://ph.linkedin.com/jobs/view/ai-conversation-recording-contributor-cebuano-at-rws-4481376934','USD $7/hour',
 'https://contributors.premise.com/','https://apps.apple.com/ph/app/premise-earn-money/id1390094962','https://play.google.com/store/apps/details?id=com.premise.android.prod',
 'https://www.scamadviser.com/check-website/atlascapture.io','https://www.trustpilot.com/review/atlascapture.io','https://ph.linkedin.com/jobs/view/senior-computing-it-domain-expert-ai-training-benchmarking-technical-evaluation-at-innodata-inc-4481430713',
 'https://ph.linkedin.com/jobs/view/english-linguist-expert-at-telus-digital-ai-community-4485309477','https://ph.linkedin.com/jobs/view/tagalog-linguist-expert-ai-community-at-telus-international-ai-data-solutions-4482081515','id:'telus-ai-linguist-experts-ph','confirm the actual engagement classification and hours with RWS'
 '1.9/5 from 92 reviews','71% one-star ratings','Caution Recommended'
 "id:'premise-ph-local-tasks'","id:'rws-cebuano-conversation-recording'","id:'innodata-ph-robotics-annotator'","id:'innodata-ph-domain-experts'",
 "id:'dost-tapi-technicom-2'","id:'dost-tapi-evfp'","id:'landbank-dost-lifting'",
 'October 31, 2026 Philippine time','no longer accepting applications','Unverified names stay out of the active list.'
])assert.ok(vault.includes(s),'Opportunity Vault missing '+s);
assert.ok(!/referral[^.]{0,120}\$3\b|\$3\b[^.]{0,120}referral/i.test(vault),'Vault must not preserve stale $3 referral-bonus claims without current source verification');
assert.ok(vault.includes('typical tests take 20–40 minutes'),'Userlytics typical test duration must match its official tester FAQ');
assert.ok(vault.includes("id:'swc-ph-2026',name:'Startup World Cup Philippines Regional 2026 — Pitch Competition',status:'closed'"),'expired Startup World Cup application must remain closed');
assert.ok(vault.includes('The official iPhone app is listed in the Philippines App Store'),'Premise Android PH availability must not be overstated');
assert.ok(vault.includes('Philippines eligibility is not stated')||vault.includes('Philippines storefront availability'),'country uncertainty must be visible for unverified listings');
assert.ok(catalog.includes("key:'opportunity'"),'interaction catalog must understand Opportunity Vault');
assert.ok(vault.includes('quaternary?:string;quaternaryLabel?:string'),'Opportunity Vault must support an additional verified source link');
assert.ok(vault.includes('o.quaternary&&<a href={o.quaternary}'),'additional source links must render as clickable links');
assert.ok(kids.includes("import { currentUser } from './integrations.js';"),'Kids Drive owner OAuth must retain the existing session user resolver import');
assert.ok(!kids.includes("await ensureTables(env);\n if(request.method==='OPTIONS')"),'Kids public media routes must not run DDL per request');
assert.ok(credentials.includes('runtimeVaultRows'),'credential overlay reads must have a DDL-free runtime path');
assert.ok(runtimeControl.includes("getIntegrationRuntimeEnv(env,['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])"),'Kids runtime must load only the Google OAuth credential pair on its hot path');
for(const table of ['platform_credentials','kids_drive_states','kids_drive_auth'])assert.ok(kidsMigration.includes(table),'0096 migration missing '+table);
console.log('Recent-conversation mode visual and Opportunity Vault gaps passed.');
