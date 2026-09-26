import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync('worker/src/magnanimous-telecom-network-runtime.js','utf8');
const migration=fs.readFileSync('worker/migrations/0090_global_mobile_partner_acquisition.sql','utf8');
const ui=fs.readFileSync('frontend/app/telecom/network/page.tsx','utf8');
const acquisition=fs.readFileSync('docs/GLOBAL-MOBILE-CARRIER-ACQUISITION-2026-09-26.md','utf8');

for(const provider of ['gigs','telna','1global','fonus']) assert.ok(runtime.includes(`key:'${provider}'`),'Missing seeded partner '+provider);
assert.ok(runtime.includes("global-mobile/partners"),'Carrier acquisition API is missing.');
assert.ok(runtime.includes("body.api_key||body.token||body.secret||body.password||body.activation_code"),'Acquisition API must reject provider/activation secrets.');
assert.ok(runtime.includes("status==='contract_verified'&&!validCommercialReference(commercialReference)"),'Contract verification must require agreement-grade evidence.');
assert.ok(runtime.includes("WHERE telecom_mobile_partner_acquisition.updated_by='system-seed'"),'System seed refreshes must not overwrite owner-edited acquisition rows.');
assert.ok(runtime.includes('tinyfish-run:0fbee7e5-a0af-4e02-b9ce-9a7b308fc42f'),'Successful Gigs official sales-form evidence must remain in the seeded acquisition baseline.');
assert.ok(migration.includes('telecom_mobile_partner_acquisition'),'Durable acquisition table is missing.');
assert.ok(ui.includes('Carrier partnership pipeline'),'Owner acquisition UI is missing.');
assert.ok(ui.includes('SAVE ACQUISITION STATE'),'Owner must be able to persist acquisition state.');
assert.ok(acquisition.includes('02547094'),'1GLOBAL case must remain durably recorded.');
assert.ok(acquisition.includes('zhac@fonusmobile.com'),'Fonus direct commercial handoff must remain durably recorded.');
assert.ok(acquisition.includes('official sales/MVNO form submitted'),'Gigs official sales-form completion must remain durably recorded.');
assert.ok(acquisition.includes('1a0db67a03572b70'),'Fonus direct commercial outreach evidence must remain durably recorded.');
console.log('Global mobile carrier acquisition control lock passed.');
