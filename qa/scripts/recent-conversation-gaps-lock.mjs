import fs from'node:fs';import assert from'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const visual=read('frontend/lib/mode-visuals.ts'),kids=read('worker/src/kids-media-runtime.js'),credentials=read('worker/src/platform-credentials.js'),runtimeControl=read('worker/src/runtime-control.js'),kidsMigration=read('worker/migrations/0096_kids_drive_runtime_hotpath.sql');
for(const name of ['general','business','social-media','research','writing']){
 const path='frontend/public/mode-images/'+name+'.svg';
 assert.ok(fs.existsSync(new URL('../../'+path,import.meta.url)),path+' missing');
 const svg=read(path);
 assert.ok(svg.includes('I Am Magnanimous Way, Trademark.'),path+' must carry Magnanimous trademark line');
 assert.ok(visual.includes('/mode-images/'+name+'.svg'),'mode registry must use '+name+' artwork');
}
assert.ok(visual.includes('/mode-images/virtual-assistant.webp'),'existing Virtual Assistant portrait must be preserved');
assert.ok(kids.includes("import { currentUser } from './integrations.js';"),'Kids Drive owner OAuth must retain the existing session user resolver import');
assert.ok(!kids.includes("await ensureTables(env);\n if(request.method==='OPTIONS')"),'Kids public media routes must not run DDL per request');
assert.ok(credentials.includes('runtimeVaultRows'),'credential overlay reads must have a DDL-free runtime path');
assert.ok(runtimeControl.includes("getIntegrationRuntimeEnv(env,['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])"),'Kids runtime must load only the Google OAuth credential pair on its hot path');
for(const table of ['platform_credentials','kids_drive_states','kids_drive_auth'])assert.ok(kidsMigration.includes(table),'0096 migration missing '+table);
