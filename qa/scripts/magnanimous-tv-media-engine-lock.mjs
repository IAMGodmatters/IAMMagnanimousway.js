import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const runtime=read('worker/src/magnanimous-tv-programming-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const mediamtx=read('magnanimous-runtime/mediamtx.yml');
const devCompose=read('magnanimous-runtime/docker-compose.yml');
const releaseCompose=read('magnanimous-runtime/docker-compose.release.yml');
const caddy=read('magnanimous-runtime/Caddyfile');
const env=read('magnanimous-runtime/.env.example');
const release=read('.github/workflows/magnanimous-standalone-release.yml');
const broadcast=read('frontend/app/tv/studio/broadcast/page.tsx');
const studio=read('frontend/app/tv/studio/page.tsx');
const docs=read('docs/MAGNANIMOUS-TV-MEDIA-ENGINE-2026-11-08.md');

for(const value of [
 'authMethod: http','authHTTPAddress: http://magnanimous:8788/api/tv/media/auth?key=UNCONFIGURED_DISABLED',
 'authHTTPExclude: []','api: false','metrics: false','pprof: false','playback: false',
 'rtsp: false','rtmp: false','srt: false','moq: false','hls: true','hlsAddress: :8888',
 'webrtc: true','webrtcAddress: :8889','webrtcLocalUDPAddress: :8189','webrtcLocalTCPAddress: ""',
 'webrtcIPsFromInterfaces: false','maxReaders: 40','record: false'
])assert.ok(mediamtx.includes(value),'MediaMTX config missing '+value);

for(const [name,compose] of [['development',devCompose],['release',releaseCompose]]){
 assert.ok(compose.includes('image: bluenviron/mediamtx:1.21.3'),'Pinned MediaMTX image missing in '+name+' compose.');
 assert.ok(compose.includes('profiles: ["broadcast"]'),'Live media must be opt-in in '+name+' compose.');
 assert.ok(compose.includes('MTX_AUTHMETHOD: "http"'),'External Magnanimous auth missing in '+name+' compose.');
 assert.ok(compose.includes('MTX_API: "false"')&&compose.includes('MTX_METRICS: "false"')&&compose.includes('MTX_PPROF: "false"'),'MediaMTX diagnostics must stay disabled in '+name+' compose.');
 assert.ok(!compose.includes('MTX_AUTHHTTPEXCLUDE'),'Compose must not override the secure empty auth exclusion list.');
 assert.ok(compose.includes('127.0.0.1')&&compose.includes('8189:8189/udp'),'ICE UDP must be loopback-only by default in '+name+' compose.');
 assert.ok(!/["'](?:0\.0\.0\.0|\[::\])?:(?:8888|8889):(?:8888|8889)["']/.test(compose),'Media HTTP ports must not be host-published in '+name+' compose.');
 assert.ok(compose.includes('networks:\n      - internal_services'),'MediaMTX must remain on the private internal network in '+name+' compose.');
 assert.ok(compose.includes('MAGNANIMOUS_TV_MEDIA_ENABLED:-false'),'Live feature flag must default false in '+name+' compose.');
}
assert.ok(env.includes('MAGNANIMOUS_TV_MEDIA_ENABLED=false'),'Environment template must default media off.');
assert.ok(env.includes('MAGNANIMOUS_MEDIA_AUTH_SECRET='),'Separate MediaMTX shared secret is required.');
assert.ok(env.includes('MAGNANIMOUS_TV_WEBRTC_UDP_BIND=127.0.0.1'),'ICE bind must default to loopback.');

assert.ok(caddy.includes('handle_path /tv-media/hls/*')&&caddy.includes('to live-media:8888'),'Caddy HLS path must route to the private MediaMTX listener.');
assert.ok(caddy.includes('handle_path /tv-media/webrtc/*')&&caddy.includes('to live-media:8889'),'Caddy WHIP/WHEP path must route to the private MediaMTX listener.');
assert.ok(caddy.includes('header_down Location ^/ /tv-media/webrtc/'),'Caddy must preserve WHIP resource URLs.');
assert.ok(caddy.includes('header_down Location ^/ /tv-media/hls/'),'Caddy must preserve HLS redirects.');

assert.ok(runtime.includes('CREATE TABLE IF NOT EXISTS magnanimous_tv_media_tokens'),'Magnanimous TV token table missing.');
assert.ok(runtime.includes('idx_tv_media_one_active_publish_per_path'),'At most one active publisher per stream path must be enforced.');
assert.ok(runtime.includes('await sha256Hex(token)'),'Only hashed publish credentials may be persisted.');
assert.ok(runtime.includes('rights_attested_at'),'Rights attestation timestamp must be recorded.');
assert.ok(runtime.includes("b.rights_attested!==true"),'A rights attestation is required before publishing.');
assert.ok(runtime.includes('currentOwnerStation(env,user,stationId)'),'Personal publishing must check station ownership.');
assert.ok(runtime.includes('isPlatformOwnerUser(env,user)'),'Network publishing must be platform-owner-only.');
assert.ok(runtime.includes('expiresAt=timestamp+3600'),'Publish key must expire after one hour.');
assert.ok(runtime.includes('MAGNANIMOUS_TV_MEDIA_ENABLED')&&runtime.includes('MAGNANIMOUS_MEDIA_AUTH_SECRET'),'Media feature flag and shared secret must gate authorization.');
assert.ok(runtime.includes("media_process_health:'not_probed'"),'Configuration readiness must not be represented as proof of a live media process.');
assert.ok(broadcast.includes('HOST CONFIGURED'),'Broadcast Studio must distinguish host configuration from actual media health.');
assert.ok(broadcast.includes('Geographic access restriction is not enabled yet'),'Philippines channel must not imply unimplemented geofencing.');
assert.ok(runtime.includes('constantTimeTextEqual(secret,supplied)'),'Shared secret must use constant-time comparison.');
assert.ok(runtime.includes('await schema(env);return await authenticateMediaNode(request,env,url)'),'Media auth must initialize DB schema on a fresh runtime.');
assert.ok(runtime.includes('payload.action')&&runtime.includes('payload.protocol')&&runtime.includes('payload.path'),'MediaMTX authorization payload must be checked.');
assert.ok(runtime.includes("new Set(['publish','read'])"),'Only publish and read actions are accepted.');
assert.ok(runtime.includes("new Set(['hls','webrtc'])"),'Only HLS and WebRTC read protocols are accepted.');
assert.ok(runtime.includes('payload.token||payload.password'),'WHIP bearer token must be validated.');
assert.ok(runtime.includes('expires_at>? AND revoked_at IS NULL'),'Expired/revoked tokens must be rejected.');
assert.ok(runtime.includes("visibility IN ('public','unlisted')"),'Station visibility must gate public read access.');
assert.ok(runtime.includes('existing_publisher_must_stop:true'),'OBS session revocation boundary must be truthful.');
assert.ok(runtime.includes('host!==publicDomain')&&runtime.includes('MAGNANIMOUS_TV_MEDIA_PUBLIC_DOMAIN')&&runtime.includes('udpReachable'),'Media must require matching host and reachable ICE UDP.');
assert.ok(security.includes("url.pathname.startsWith('/api/tv/media')"),'Media API and auth callback must be routed through security entrypoint.');

assert.ok(broadcast.includes('getPlatformAuthToken'),'Broadcast Studio must require sign-in.');
assert.ok(broadcast.includes('rights_attested:rights'),'Broadcast UI must send rights attestation.');
assert.ok(broadcast.includes('navigator.mediaDevices.getUserMedia'),'Browser camera capture must use secure native browser APIs.');
assert.ok(broadcast.includes('fetch(created.whip_url,{method:\'POST\''),'Browser publisher must use WHIP.');
assert.ok(broadcast.includes('await waitForConnection(pc)'),'Browser UI must wait for a live media connection before marking LIVE.');
assert.ok(broadcast.includes('This page cannot confirm an external OBS connection'),'OBS key generation must not imply OBS is live.');
assert.ok(broadcast.includes('stop streaming in OBS first'),'OBS stop/revoke boundary must be clear.');
assert.ok(studio.includes("href:'/tv/studio/broadcast'"),'TV Studio must link to Broadcast Studio.');
assert.ok(docs.includes('MediaMTX v1.21.3')&&docs.includes('No TURN relay is bundled.'),'Media docs must record pinned version and TURN limitation.');

assert.ok(release.includes('docker pull bluenviron/mediamtx:1.21.3'),'Offline release workflow must pull MediaMTX.');
assert.ok(release.includes('--validate-conf=/mediamtx.yml'),'Offline release must validate the pinned config.');
assert.ok(release.includes('"bluenviron/mediamtx:1.21.3"'),'Offline release artifact must bundle MediaMTX.');
assert.ok(release.includes('cp magnanimous-runtime/mediamtx.yml'),'Offline release artifact must bundle MediaMTX configuration.');
console.log('Magnanimous TV live-media security, WHIP/HLS, isolation and offline release regression lock passed.');
