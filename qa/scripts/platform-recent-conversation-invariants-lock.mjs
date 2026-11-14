import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const exists = path => fs.existsSync(new URL('../../' + path, import.meta.url));
const visuals = read('frontend/lib/mode-visuals.ts');
const home = read('frontend/app/page.tsx');
const catalog = read('frontend/app/interaction-catalog.ts');
const vault = read('frontend/app/opportunity-vault/page.tsx');
const kids = read('worker/src/kids-media-runtime.js');
const credentials = read('worker/src/platform-credentials.js');
const runtimeControl = read('worker/src/runtime-control.js');
const kidsMigration = read('worker/migrations/0096_kids_drive_runtime_hotpath.sql');

for (const mode of ['general', 'business', 'social-media', 'research', 'writing']) {
  const asset = 'frontend/public/mode-images/' + mode + '.svg';
  assert.ok(exists(asset), 'Missing mode artwork: ' + asset);
  const svg = read(asset);
  assert.ok(svg.includes('I Am Magnanimous Way, Trademark.'), asset + ' must carry the exact Magnanimous trademark line');
  assert.ok(!svg.includes('God Matters, Trademark') && !svg.includes('God Matters™'), asset + ' must not place a trademark on God Matters');
  assert.ok(visuals.includes('/mode-images/' + mode + '.svg'), 'Mode registry must use ' + mode + ' artwork');
}

assert.ok(visuals.includes('/mode-images/virtual-assistant.webp'), 'Virtual Assistant mode must preserve its existing artwork reference');
assert.ok(exists('frontend/public/mode-images/virtual-assistant.webp'), 'Virtual Assistant artwork file must remain present');
assert.ok(home.includes("href:'/opportunity-vault'") && home.includes('Opportunity Vault'), 'Homepage navigation must expose Opportunity Vault');
assert.ok(catalog.includes("key:'opportunity'") && catalog.includes("'/opportunity-vault'"), 'Interaction catalog must understand and route Opportunity Vault');

assert.ok(kids.includes("import { currentUser } from './integrations.js';"), 'Kids Drive must preserve the existing session-user resolver');
const routeStart = kids.indexOf('export async function handleKidsDriveMedia');
const options = kids.indexOf("if(request.method==='OPTIONS')", routeStart);
const ddl = kids.indexOf('await ensureTables(env)', routeStart);
assert.ok(routeStart >= 0 && options > routeStart, 'Kids media route must handle OPTIONS');
assert.ok(ddl < 0 || options < ddl, 'Kids media OPTIONS must return before any DDL work');

assert.ok(credentials.includes('runtimeVaultRows'), 'Credential overlay must retain the DDL-free runtime read path');
assert.ok(runtimeControl.includes("getIntegrationRuntimeEnv(env,['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'])"), 'Kids Drive hot path must load only the Google OAuth credential pair');
for (const table of ['platform_credentials', 'kids_drive_states', 'kids_drive_auth']) {
  assert.ok(kidsMigration.includes(table), 'Kids Drive migration is missing ' + table);
}

assert.ok(vault.includes('quaternary?:string;quaternaryLabel?:string'), 'Opportunity Vault must type a fourth verified source link');
assert.ok(vault.includes('{o.quaternary&&<a href={o.quaternary}'), 'Opportunity Vault must render the fourth source link');
assert.ok(!/referral[^.]{0,120}\$3\b|\$3\b[^.]{0,120}referral/i.test(vault), 'Opportunity Vault must not preserve stale $3 referral-bonus claims without current verification');
assert.ok(vault.includes("id:'swc-ph-2026',name:'Startup World Cup Philippines Regional 2026 — Pitch Competition',status:'closed'"), 'Expired Startup World Cup application must remain closed');
assert.ok(vault.includes('The official iPhone app is listed in the Philippines App Store'), 'Premise Android availability must not be overstated');
assert.ok(vault.includes('not confirmed Philippine eligibility') || vault.includes('Philippines eligibility is not confirmed'), 'Unverified country eligibility must remain visible');

console.log('Recent platform invariants lock passed: branded mode art, Opportunity Vault navigation, Kids Drive DDL-free preflight, credential hot path, migrations and source-link rendering.');
