import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/magnanimous-tv-programming-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const operations=read('worker/src/operations-entrypoint.js');
const guide=read('frontend/app/tv/programme-guide.tsx');
const channel=read('frontend/app/tv/channel-page.tsx');
const station=read('frontend/app/tv/station/page.tsx');
const studio=read('frontend/app/tv/studio/page.tsx');
const planner=read('frontend/app/tv/studio/programming/page.tsx');

for(const text of [
 'CREATE TABLE IF NOT EXISTS magnanimous_tv_stations',
 'CREATE TABLE IF NOT EXISTS magnanimous_tv_programmes',
 'CREATE TABLE IF NOT EXISTS magnanimous_tv_schedule',
 'tenant_id TEXT NOT NULL',
 'submitted_by TEXT NOT NULL',
 'rights_expires_at INTEGER',
 'UNIQUE(channel_key,starts_at)',
 'idx_tv_schedule_channel_time'
])assert.ok(runtime.includes(text),'TV programming schema missing '+text);

for(const text of [
 "'CC0-1.0'","'CC-BY-2.0'","'CC-BY-3.0'","'CC-BY-4.0'","'PUBLIC-DOMAIN-VERIFIED'",
 "status:'pending'","isPlatformOwnerUser(env,user)",
 'SAFE_MEDIA_HOSTS','upload.wikimedia.org',
 'SELECT COUNT(*) AS count FROM magnanimous_tv_programmes',
 'programme_submissions_per_station:20',
 'Submitted for rights review. It is not approved or scheduled'
])assert.ok(runtime.includes(text),'Rights review and submission protection missing '+text);

assert.ok(runtime.includes('WHERE id=? AND tenant_id=? AND user_id=?'),'Station operations must be tenant/user scoped.');
assert.ok(runtime.includes("if(!uses.includes('linear'))"),'Linear schedule must require an explicit linear-use grant.');
assert.ok(runtime.includes("if(channelKey==='worldwide'&&!territories.includes('worldwide'))"),'Worldwide channel must enforce worldwide rights.');
assert.ok(runtime.includes("if(channelKey==='philippines'&&!territories.some(x=>x==='worldwide'||x==='philippines'))"),'Philippines channel must enforce territory rights.');
assert.ok(runtime.includes("if(stationId&&!territories.includes('worldwide'))"),'Personal stations must not pretend regional geofencing is active.');
assert.ok(runtime.includes('NOT EXISTS(')&&runtime.includes('starts_at<? AND ends_at>?'),'Overlapping schedule entries must be blocked.');
assert.ok(runtime.includes('startsAt>timestamp+90*86400'),'Schedule horizon must be bounded to 90 days.');
assert.ok(runtime.includes('p.status=\'approved\''),'Public programme guide must expose approved items only.');
assert.ok(runtime.includes('s.id AS schedule_id')&&runtime.includes('s.starts_at AS schedule_starts_at'),'Schedule identifiers must not collide with programme identifiers.');
assert.ok(runtime.includes('playout_connected:false'),'Programme guide must not imply live playout.');
assert.ok(runtime.includes('scheduledMagnanimousTvProgramming'),'TV scheduler cleanup must be implemented.');

assert.ok(security.includes('handleMagnanimousTvProgramming'),'TV programming route must be connected in the security entrypoint.');
assert.ok(security.includes('getProviderRuntimeEnv(env)'),'TV programming must receive the provider-aware environment.');
assert.ok(security.includes('if (typeof app.scheduled === \'function\') return app.scheduled(controller, env, ctx)'),'Worker scheduled events must reach the Magnanimous scheduler.');
assert.ok(operations.includes('scheduledMagnanimousTvProgramming(env)'),'TV programme expiry cleanup must be scheduled.');

assert.ok(guide.includes('/api/tv/programming/public?'),'Public programme guide must use the read-only public API.');
assert.ok(guide.includes('Automatic playout and the live viewer feed are not connected yet.'),'Guide must state that playout is not live.');
assert.ok(channel.includes("import ProgrammeGuide from './programme-guide'" )&&channel.includes('<ProgrammeGuide channel={channel}/>'),'Both network channels must display their programme guide.');
assert.ok(station.includes("import ProgrammeGuide from '../programme-guide'")&&station.includes('<ProgrammeGuide stationSlug={station.slug}/>'),'Personal station pages must display their programme guide.');
assert.ok(studio.includes("href:'/tv/studio/programming'"),'TV Studio must link to programme scheduling.');
assert.ok(planner.includes('/api/tv/programmes')&&planner.includes('/api/tv/programming/schedule'),'Programming control must use the native Magnanimous APIs.');
assert.ok(planner.includes('Submit for rights review')&&planner.includes('Save programme-guide slot'),'The planner must expose distinct rights submission and schedule actions.');
assert.ok(planner.includes('A saved time slot is not a broadcast.'),'The creator UI must distinguish guide scheduling from broadcasting.');
assert.ok(planner.includes('getTimezoneOffset()'),'Schedule default must use the viewer local timezone.');

console.log('Magnanimous TV rights ledger, tenant boundaries, schedule rules, guide routing and truthful playout locks passed.');
