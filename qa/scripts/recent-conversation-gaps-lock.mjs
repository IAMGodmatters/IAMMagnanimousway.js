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
 'https://www.prolific.com/participants-join-us','2PDR9UXD','USD 10 each after 1 approved hour','USD 50 each after 20 approved hours','USD 100 each after 50 approved hours','task availability vary by country','https://www.crowtado.com/en/sign-up','Crowtado','United States and Canada','unverified reports of long review queues','OneForma — Kawaii Audio Labeling ($17/hour)','USD $17/hour','UserTesting','Classic tests','14 days','Payoneer','Wise','direct-to-bank transfer powered by Wise','not available in all countries','KB0010111','independent contractor','https://www.utest.com/projects/Join-Ambassador-2026','uTest — Global Ambassador Program (Referral-Based)','Ambassador Academy Quiz','no fixed rate, minimum hours or income is published','SIGN-UP TEMPORARILY UNAVAILABLE','temporarily unavailable','November 26, 2026','Philippine Startup Week 2026 — underway November 9–12','STARTUP FUNDING WATCH • 2026-11-09',
 'Unverified names stay out of the active list.'
])assert.ok(vault.includes(s),'Opportunity Vault missing '+s);
assert.ok(!/(?:referral|invite)[\s\S]{0,120}\$3|\$3[\s\S]{0,120}(?:referral|invite)/i.test(vault),'Vault must not preserve stale referral bonus claims without current source verification');
assert.ok(catalog.includes("key:'opportunity'"),'interaction catalog must understand Opportunity Vault');
assert.ok(catalog.includes("'utest'")&&catalog.includes("'ambassador'"),'interaction catalog must route uTest ambassador searches');
assert.ok(kids.includes("import { currentUser } from './integrations.js';"),'Kids Drive owner OAuth must retain the existing session user resolver import');
assert.ok(!kids.includes("await ensureTables(env);\n if(request.method==='OPTIONS')"),'Kids public media routes must not run DDL per request');
assert.ok(credentials.includes('runtimeVaultRows'),'credential overlay reads must have a DDL-free runtime path');
assert.ok(runtimeControl.includes("getIntegrationRuntimeEnv(env,['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])"),'Kids runtime must load only the Google OAuth credential pair on its hot path');
for(const table of ['platform_credentials','kids_drive_states','kids_drive_auth'])assert.ok(kidsMigration.includes(table),'0096 migration missing '+table);
console.log('Recent-conversation mode visual and Opportunity Vault gaps passed.');
