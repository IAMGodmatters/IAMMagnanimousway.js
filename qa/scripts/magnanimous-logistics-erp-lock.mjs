import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('frontend/app/logistics-erp/page.tsx','utf8');
const globalTools=fs.readFileSync('frontend/app/global-tools.tsx','utf8');
const runtime=fs.readFileSync('worker/src/magnanimous-b2b-runtime.js','utf8');
const entry=fs.readFileSync('worker/src/progress-entrypoint.js','utf8');

assert.ok(page.includes("/login?returnTo=%2Flogistics-erp"),'Freight ERP must require platform auth.');
assert.ok(page.includes("/api/b2b/catalog"),'Freight ERP must read the Magnanimous B2B backend catalog.');
assert.ok(page.includes("cache:'no-store'"),'Freight ERP backend readiness must not rely on stale browser data.');
assert.ok(page.includes('live_connection_verified'),'Freight ERP must expose verified-vs-configured connection state.');
assert.ok(page.includes('BACKEND LOGISTICS WORKFLOW'),'Freight ERP must render its workflow from the backend.');
assert.ok(page.includes('NORMALIZED SHIPMENT RECORD'),'Freight ERP must expose the backend shipment contract.');
assert.ok(page.includes('Real connection state, not marketing claims'),'Freight ERP must distinguish evidence from claims.');
assert.ok(page.includes('no proprietary copying'),'Freight ERP must retain the clean-room boundary.');
assert.ok(globalTools.includes('href="/logistics-erp"'),'Platform Tools must link to Freight ERP.');
assert.ok(globalTools.includes('Live load economics backed by Magnanimous'),'Platform Tools must describe only the Freight capability that is actually live.');
for(const [href,file] of Object.entries({
  '/b2b':'frontend/app/b2b/page.tsx',
  '/crm':'frontend/app/crm/page.tsx',
  '/enterprise':'frontend/app/enterprise/page.tsx',
  '/connections':'frontend/app/connections/page.tsx'
})){
 assert.ok(page.includes(`href="${href}"`),`Freight ERP navigation is missing ${href}.`);
 assert.ok(fs.existsSync(file),`Freight ERP navigation target is not backed by a real route: ${href}`);
}
assert.ok(runtime.includes('shipment:['),'B2B backend must define the normalized shipment object.');
assert.ok(runtime.includes('logistics:['),'B2B backend must define the logistics workflow.');
assert.ok(runtime.includes('live_connection_verified:false'),'Backend must default external rails to not live-verified.');
assert.ok(entry.includes('handleMagnanimousB2B'),'B2B runtime must be mounted in the production worker entrypoint.');
for(const stale of ['href="#"','javascript:','Coming soon','COMING SOON','TODO:','example.com']) assert.equal(page.includes(stale),false,`Freight ERP contains stale placeholder: ${stale}`);
console.log('Magnanimous Freight Logistics + ERP lock PASS');
