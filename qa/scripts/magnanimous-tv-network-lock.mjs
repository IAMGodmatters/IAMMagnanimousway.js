import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const stations=read('worker/src/magnanimous-tv-stations-runtime.js');
const data=read('worker/src/magnanimous-tv-data-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const studio=read('frontend/app/tv/studio/page.tsx');
const builder=read('frontend/app/tv/studio/station-builder.tsx');
const stationPage=read('frontend/app/tv/station/page.tsx');
const bulletin=read('frontend/app/tv/data/page.tsx');
const home=read('frontend/app/tv/page.tsx');
const nav=read('frontend/app/platform-chrome.tsx');
const research=read('docs/MAGNANIMOUS-TV-NETWORK-RESEARCH-2026-11-08.md');

for(const s of ['tenant_id TEXT NOT NULL','user_id TEXT NOT NULL','slug TEXT NOT NULL UNIQUE','SLUG=/','visibility IN (\'public\',\'unlisted\')','WHERE tenant_id=? AND user_id=?','COUNT(*) AS n','>=5','station_url:'])assert.ok(stations.includes(s),'TV station tenant/ownership contract missing '+s);
assert.ok(stations.includes('if(!user)return J({detail:\'Sign in to manage your TV stations.\'},401)'),'station management must require authenticated account');
assert.ok(stations.includes('Station profile created. Live broadcasting is not connected yet.'),'station creation must not imply live broadcast readiness');
assert.ok(security.includes('handleMagnanimousTvStations'),'TV station handler must be wired through the security entrypoint');
assert.ok(security.includes('handleMagnanimousTvData'),'TV data handler must be wired through the security entrypoint');

for(const s of ['https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/2E/CS/0012E4EVCP0.px','request.method!==\'GET\'','Ecosystem/Croptype','PHILIPPINES','Annual','latestCompletedYear','response:{format:\'csv\'}','globalThis.caches?.default','source-data-ready'])assert.ok(data.includes(s),'PSA source connector contract missing '+s);
assert.ok(!data.includes('new URL(request.url).searchParams.get(\'url\')'),'PSA connector must not accept arbitrary upstream URLs');
for(const s of ['setInterval','6*60*60*1000','PSA OpenSTAT','attribution','not a continuous TV broadcast'])assert.ok(bulletin.includes(s),'automatic data bulletin page missing '+s);

for(const s of ['StationBuilder','/video-stack','/video-studio','/social-media','/tv/data'])assert.ok(studio.includes(s),'TV Studio missing '+s);
for(const s of ['/api/tv/stations','Authorization:\'Bearer \'+t','station_url','up to five','not yet a live channel'])assert.ok(builder.includes(s),'station creator missing '+s);
for(const s of ['/api/tv/stations/public/','MAGNANIMOUS TV','Broadcast coming soon','Powered by I Am Magnanimous Way™'])assert.ok(stationPage.includes(s),'public station page missing '+s);
assert.ok(home.includes('href="/tv/studio"'),'TV homepage must link to TV Studio');
assert.ok(nav.includes('href:\'/tv/studio\''),'platform navigation must link to TV Studio');
for(const s of ['PNA terms','PAGASA','Luz Morales','Netflix','MediaMTX','OpenSTAT'])assert.ok(research.includes(s),'TV rights/technology research missing '+s);
console.log('Magnanimous TV network, station tenancy, PSA source and rights checks passed.');
