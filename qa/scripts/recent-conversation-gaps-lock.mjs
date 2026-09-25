import fs from'node:fs';import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const visual=read('frontend/lib/mode-visuals.ts'),home=read('frontend/app/page.tsx'),vault=read('frontend/app/opportunity-vault/page.tsx'),catalog=read('frontend/app/interaction-catalog.ts');
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
 'Unverified names stay out of the active list.'
])assert.ok(vault.includes(s),'Opportunity Vault missing '+s);
assert.ok(!vault.includes('$3'),'Vault must not preserve stale referral bonus claims without current source verification');
assert.ok(catalog.includes("key:'opportunity'"),'interaction catalog must understand Opportunity Vault');
console.log('Recent-conversation mode visual and Opportunity Vault gaps passed.');
