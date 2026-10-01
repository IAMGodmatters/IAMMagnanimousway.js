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
const standaloneVault='https://opportunity-vault-n6t5cz.v2.appdeploy.ai/';
assert.ok(home.includes('Opportunity Vault — Separate'),'home must label Opportunity Vault as separate');
assert.ok(home.includes(standaloneVault),'home must link directly to the standalone Opportunity Vault');
assert.ok(vault.includes(standaloneVault),'legacy /opportunity-vault route must hand off to the standalone Vault');
assert.ok(vault.includes('SEPARATE PRODUCT • NOT PART OF MAGNANIMOUS AI'),'legacy Vault route must preserve the product boundary');
assert.ok(!vault.includes('2PDR9UXD'),'main Magnanimous platform must not carry Opportunity Vault referral codes');
assert.ok(catalog.includes("key:'opportunity'"),'interaction catalog may retain the Opportunity Vault discovery topic');
console.log('Recent-conversation mode visual and Opportunity Vault gaps passed.');
