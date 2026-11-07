import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const auth=read('worker/src/magnanimous-tv-media-auth-runtime.js');
const stations=read('worker/src/magnanimous-tv-stations-runtime.js');
const security=read('worker/src/security-entrypoint.js');
const media=read('broadcast-media/mediamtx.yml');
const compose=read('broadcast-media/compose.yml');
const caddy=read('broadcast-media/Caddyfile');
const readme=read('broadcast-media/README.md');

for(const s of ["authMethod: http","authHTTPAddress: https://iammagnanimousway.com/api/tv/media/auth","rtmp: false","rtsp: false","srt: false","moq: false","api: false","metrics: false","pprof: false","webrtcLocalUDPAddress: :8189","webrtcAdditionalHosts:","hlsAllowOrigins:","webrtcAllowOrigins:","maxReaders: 10"])assert.ok(media.includes(s),'MediaMTX hardening missing '+s);
assert.ok(compose.includes('bluenviron/mediamtx:1.21.3'),'MediaMTX must be pinned to a reviewed version');
assert.ok(compose.includes('8189:8189/udp'),'WebRTC UDP listener must be exposed');
for(const p of ['8888:8888','8889:8889','1935:1935','8554:8554','8890:8890','9997:9997'])assert.ok(!compose.includes(p),'Internal/disabled media port must not be public: '+p);
assert.ok(caddy.includes('reverse_proxy mediamtx:8889'),'WHIP/WHEP signaling must route to the WebRTC listener');
assert.ok(caddy.includes('reverse_proxy mediamtx:8888'),'HLS must route to the HLS listener');
assert.ok(security.includes('handleMagnanimousTvMediaAuth'),'MediaMTX auth endpoint must pass through the security boundary');

for(const s of ["request.method!=='POST'","action==='publish'","action==='read'||action==='playback'","protocol!=='webrtc'","!['webrtc','hls'].includes(protocol)","payload.path!==path","payload.exp","tenant_id=? AND user_id=? AND slug=?","visibility IN ('public','unlisted')"])assert.ok(auth.includes(s),'MediaMTX authorization rule missing '+s);
for(const s of ['TV_MEDIA_PUBLIC_HOST','magnanimous-tv-media-v1','expires=now+43200','/publish-token','WHIP/WebRTC'])assert.ok(stations.includes(s),'Station publish-token flow missing '+s);
for(const s of ['No media VM','Do not open ports 8888','TURN relay is not included','not deployed'])assert.ok(readme.toLowerCase().includes(s.toLowerCase()),'Media plane deployment limitation missing '+s);
console.log('Magnanimous TV media-plane auth, protocol exposure, and deployment safety checks passed.');
