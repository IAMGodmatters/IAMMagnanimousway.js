import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';

const GLOBAL_TENANT='__global__';
const J=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const S=(v,n=700)=>String(v??'').trim().slice(0,n);
const ID=()=>crypto.randomUUID();
const now=()=>Math.floor(Date.now()/1000);
const LICENSES=Object.freeze({
 'CC0-1.0':'https://creativecommons.org/publicdomain/zero/1.0/',
 'CC-BY-2.0':'https://creativecommons.org/licenses/by/2.0/',
 'CC-BY-3.0':'https://creativecommons.org/licenses/by/3.0/',
 'CC-BY-4.0':'https://creativecommons.org/licenses/by/4.0/',
 'PUBLIC-DOMAIN-VERIFIED':'https://creativecommons.org/publicdomain/mark/1.0/'
});
const SAFE_MEDIA_HOSTS=new Set(['upload.wikimedia.org','iammagnanimousway.com','cdn.iammagnanimousway.com']);
const CHANNELS=new Set(['philippines','worldwide']);
const USES=new Set(['linear','on_demand']);
const TERRITORIES=new Set(['worldwide','philippines']);

async function schema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tv_stations(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',visibility TEXT NOT NULL DEFAULT 'public',
  primary_color TEXT NOT NULL DEFAULT '#D9B66D',secondary_color TEXT NOT NULL DEFAULT '#102A4C',
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_stations_owner ON magnanimous_tv_stations(tenant_id,user_id,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tv_media_tokens(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,station_id TEXT,
  path TEXT NOT NULL,action TEXT NOT NULL,protocol TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,
  rights_attested_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,revoked_at INTEGER,
  created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_media_token_path ON magnanimous_tv_media_tokens(path,action,expires_at,revoked_at)').run();
 await env.DB.prepare(\"CREATE UNIQUE INDEX IF NOT EXISTS idx_tv_media_one_active_publish_per_path ON magnanimous_tv_media_tokens(path) WHERE action='publish' AND revoked_at IS NULL\").run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_media_token_owner ON magnanimous_tv_media_tokens(tenant_id,user_id,expires_at,revoked_at)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tv_programmes(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,submitted_by TEXT NOT NULL,station_id TEXT,
  title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',source_url TEXT NOT NULL,
  creator TEXT NOT NULL,license_id TEXT NOT NULL,license_url TEXT NOT NULL,
  attribution TEXT NOT NULL,evidence_url TEXT NOT NULL,territories_json TEXT NOT NULL,
  uses_json TEXT NOT NULL,duration_seconds INTEGER NOT NULL,media_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',reviewer_id TEXT,reviewed_at INTEGER,
  review_notes TEXT NOT NULL DEFAULT '',rights_expires_at INTEGER,
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_programmes_owner ON magnanimous_tv_programmes(tenant_id,submitted_by,status,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_tv_schedule(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,channel_key TEXT NOT NULL,station_id TEXT,
  programme_id TEXT NOT NULL,starts_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
  UNIQUE(channel_key,starts_at)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_schedule_channel_time ON magnanimous_tv_schedule(channel_key,status,starts_at,ends_at)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_tv_schedule_station ON magnanimous_tv_schedule(tenant_id,station_id,status,starts_at)').run();
 const seed={
  id:'builtin-bahay-kubo-kabataang-silay',
  title:'Bahay Kubo — Kabataang Silay Rondalla',
  description:'A Filipino folk-song performance by Kabataang Silay Rondalla. Original Commons file is used without edits.',
  source_url:'https://commons.wikimedia.org/wiki/File:Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm',
  media_url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm',
  creator:'Kabataang Silay Rondalla',
  license_id:'CC-BY-3.0',
  license_url:LICENSES['CC-BY-3.0'],
  attribution:'Attribution: marsilingco · Performer: Kabataang Silay Rondalla · No changes made.',
  evidence_url:'https://commons.wikimedia.org/wiki/File:Bahay_Kubo_by_Kabataang_Silay_Rondalla.webm',
  territories_json:'["worldwide"]',
  uses_json:'["linear","on_demand"]',
  duration_seconds:215,
  status:'approved',
  reviewer_id:'magnanimous-curated-source-review',
  review_notes:'Curated starter item. Exact Wikimedia Commons file page records CC BY 3.0 and attribution. Preserve attribution and licence link; do not modify the source recording.'
 };
 await env.DB.prepare(`INSERT OR IGNORE INTO magnanimous_tv_programmes(
  id,tenant_id,submitted_by,station_id,title,description,source_url,creator,
  license_id,license_url,attribution,evidence_url,territories_json,uses_json,
  duration_seconds,media_url,status,reviewer_id,reviewed_at,review_notes,
  rights_expires_at,created_at,updated_at
 ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
  seed.id,GLOBAL_TENANT,'magnanimous-curated-source-review',null,seed.title,seed.description,
  seed.source_url,seed.creator,seed.license_id,seed.license_url,seed.attribution,seed.evidence_url,
  seed.territories_json,seed.uses_json,seed.duration_seconds,seed.media_url,seed.status,
  seed.reviewer_id,now(),seed.review_notes,null,now(),now()
 ).run();
}
function safeUrl(value,{hosts,allowAnyPublicHttps=false}={}){
 const raw=S(value,2000);if(!raw)return null;
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return null;
  const host=u.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.local')||/^\d+(?:\.\d+){3}$/.test(host)||host.includes(':'))return null;
  if(hosts&&!hosts.has(host))return null;
  if(!hosts&&!allowAnyPublicHttps)return null;
  return u.toString();
 }catch{return null}
}
function parseJsonArray(value,allowed){try{const v=JSON.parse(String(value||'[]'));return Array.isArray(v)?v.filter(x=>allowed.has(x)):[]}catch{return[]}}
function publicProgramme(row){
 return{
  id:row.id,title:row.title,description:row.description,creator:row.creator,
  source_url:row.source_url,media_url:row.media_url,
  license_id:row.license_id,license_url:row.license_url,
  attribution:row.attribution,evidence_url:row.evidence_url,
  territories:parseJsonArray(row.territories_json,TERRITORIES),
  duration_seconds:Number(row.duration_seconds||0),status:row.status,
  rights_expires_at:row.rights_expires_at||null
 };
}
function privateProgramme(row){return{...publicProgramme(row),station_id:row.station_id,submitted_by:row.submitted_by,uses:parseJsonArray(row.uses_json,USES),reviewer_id:row.reviewer_id||null,reviewed_at:row.reviewed_at||null,review_notes:row.review_notes||'',created_at:row.created_at,updated_at:row.updated_at}}
async function currentOwnerStation(env,user,id){
 return env.DB.prepare('SELECT id,slug,name,visibility FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(String(id),String(user.tenant_id),String(user.id)).first();
}
function mediaEnabled(env){
 const bind=String(env?.MAGNANIMOUS_TV_WEBRTC_UDP_BIND||'127.0.0.1').trim().toLowerCase();
 const udpReachable=Boolean(bind)&&!['127.0.0.1','::1','localhost'].includes(bind);
 return String(env?.MAGNANIMOUS_TV_MEDIA_ENABLED||'').trim().toLowerCase()==='true'&&
  String(env?.MAGNANIMOUS_MEDIA_AUTH_SECRET||'').trim().length>=32&&
  Boolean(mediaHostOrigin(env))&&udpReachable;
}
function constantTimeTextEqual(a,b){
 const left=String(a||''),right=String(b||'');
 if(left.length!==right.length)return false;
 let mismatch=0;for(let i=0;i<left.length;i++)mismatch|=left.charCodeAt(i)^right.charCodeAt(i);
 return mismatch===0;
}
async function sha256Hex(value){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value)));
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function newMediaToken(){
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
 return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function mediaHostOrigin(env){
 const host=S(env?.MAGNANIMOUS_TV_MEDIA_HOST,253).toLowerCase();
 const publicDomain=S(env?.MAGNANIMOUS_DOMAIN,253).toLowerCase();
 if(!host||!publicDomain||host!==publicDomain||host.includes('/')||host.includes('@')||host.includes(':')||host==='localhost'||host.endsWith('.local'))return '';
 try{
  const u=new URL('https://'+host);
  if(u.hostname!==host||u.protocol!=='https:'||u.username||u.password||u.port)return '';
  return u.origin;
 }catch{return ''}
}
async function issueMediaPublishAccess(request,env,user){
 if(!mediaEnabled(env))return J({detail:'Live broadcasting is not enabled on this host. The media service remains disabled until its secure host, shared authentication secret and network limits are configured.'},503);
 const origin=mediaHostOrigin(env);
 if(!origin)return J({detail:'The secure Magnanimous TV media host has not been configured.'},503);
 const b=await request.json().catch(()=>({}));
 if(b.rights_attested!==true)return J({detail:'Confirm that you have permission to broadcast every video, voice, music track and other item in this live programme.'},400);
 if(S(b.protocol,20)!=='webrtc')return J({detail:'The free-first live ingest currently supports secure browser/WHIP WebRTC only.'},400);
 const stationId=S(b.station_id,64),channelKey=S(b.channel_key,20).toLowerCase();
 let station=null,path='',stationRef=null;
 if(stationId){
  station=await currentOwnerStation(env,user,stationId);
  if(!station)return J({detail:'The selected station does not belong to your account.'},403);
  path='tv-station-'+station.slug;
  stationRef=station.id;
 }else if(CHANNELS.has(channelKey)){
  if(!await isPlatformOwnerUser(env,user))return J({detail:'Only the platform owner can publish to a network-wide channel.'},403);
  path='tv-'+channelKey;
 }else return J({detail:'Choose one of your own TV stations or an owner-managed network channel.'},400);
 const timestamp=now();
 await env.DB.prepare("DELETE FROM magnanimous_tv_media_tokens WHERE path=? AND action='publish' AND expires_at<=?").bind(path,timestamp).run();
 const active=await env.DB.prepare("SELECT COUNT(*) AS count FROM magnanimous_tv_media_tokens WHERE path=? AND action='publish' AND expires_at>? AND revoked_at IS NULL").bind(path,timestamp).first();
 if(Number(active?.count||0)>0)return J({detail:'This station already has an active broadcast key. Revoke that key before creating another.'},409);
 const expiresAt=timestamp+3600,id=ID(),token=newMediaToken();
 try{
  await env.DB.prepare("INSERT INTO magnanimous_tv_media_tokens(id,tenant_id,user_id,station_id,path,action,protocol,token_hash,rights_attested_at,expires_at,revoked_at,created_at) VALUES(?,?,?,?,?,'publish','webrtc',?,?,?,NULL,?)").bind(
   id,String(user.tenant_id),String(user.id),stationRef,path,await sha256Hex(token),
   timestamp,expiresAt,timestamp
  ).run();
 }catch{return J({detail:'A broadcast credential was created at the same time from another session. Use the existing key or revoke it first.'},409)}
 const whipUrl=origin+'/tv-media/webrtc/'+encodeURIComponent(path)+'/whip';
 const playbackUrl=origin+'/tv-media/hls/'+encodeURIComponent(path)+'/index.m3u8';
 return J({
  access:{id,path,protocol:'webrtc',action:'publish',whip_url:whipUrl,bearer_token:token,playback_url:playbackUrl,expires_at:expiresAt},
  broadcast_active:false,
  message:'A one-hour private ingest credential was created. The stream is not live until a publisher connects successfully.'
 },201);
}
async function revokeMediaAccess(env,user,id){
 const row=await env.DB.prepare('SELECT id FROM magnanimous_tv_media_tokens WHERE id=? AND tenant_id=? AND user_id=? AND revoked_at IS NULL').bind(id,String(user.tenant_id),String(user.id)).first();
 if(!row)return J({detail:'Active broadcast key not found.'},404);
 await env.DB.prepare('UPDATE magnanimous_tv_media_tokens SET revoked_at=? WHERE id=? AND tenant_id=? AND user_id=? AND revoked_at IS NULL').bind(now(),id,String(user.tenant_id),String(user.id)).run();
 return J({revoked:true,id,new_publish_blocked:true,existing_publisher_must_stop:true,note:'This blocks new publishing with the key. An already-established OBS session must be stopped in OBS; the server also expires the authorization at the one-hour key deadline.'});
}
async function authenticateMediaNode(request,env,url){
 const secret=String(env?.MAGNANIMOUS_MEDIA_AUTH_SECRET||'');
 const supplied=String(url.searchParams.get('key')||'');
 if(!mediaEnabled(env)||secret.length<32||!constantTimeTextEqual(secret,supplied))return J({detail:'Media server authentication denied.'},401);
 if(request.method!=='POST')return J({detail:'Method not allowed.'},405);
 const length=Number(request.headers.get('content-length')||0);
 if(length>12000)return J({detail:'Authentication payload too large.'},413);
 let payload={};
 try{
  const raw=await request.text();if(raw.length>12000)return J({detail:'Authentication payload too large.'},413);
  payload=JSON.parse(raw||'{}');
 }catch{return J({detail:'Invalid media authentication payload.'},400)}
 const action=S(payload.action,24),path=S(payload.path,96),protocol=S(payload.protocol,24);
 if(!path||!new Set(['publish','read']).has(action))return J({detail:'Media action denied.'},401);
 const expires=now()+300;
 if(action==='read'){
  if(!new Set(['hls','webrtc']).has(protocol))return J({detail:'Only HLS and WebRTC public read access is enabled.'},401);
  if(path==='tv-philippines'||path==='tv-worldwide')return J({expireAt:new Date(expires*1000).toISOString()});
  const match=path.match(/^tv-station-([a-z0-9-]{3,48})$/);
  if(!match)return J({detail:'Unknown public TV stream.'},401);
  const station=await env.DB.prepare("SELECT id FROM magnanimous_tv_stations WHERE slug=? AND visibility IN ('public','unlisted') LIMIT 1").bind(match[1]).first();
  return station?J({expireAt:new Date(expires*1000).toISOString()}):J({detail:'This TV station is not publicly available.'},401);
 }
 if(protocol!=='webrtc')return J({detail:'Only WebRTC/WHIP publishing is enabled.'},401);
 const rawToken=S(payload.token||payload.password,256);
 if(!rawToken)return J({detail:'A short-lived Magnanimous broadcast key is required.'},401);
 const tokenHash=await sha256Hex(rawToken),timestamp=now();
 const record=await env.DB.prepare("SELECT * FROM magnanimous_tv_media_tokens WHERE token_hash=? AND action='publish' AND path=? AND protocol='webrtc' AND expires_at>? AND revoked_at IS NULL LIMIT 1").bind(tokenHash,path,timestamp).first();
 if(!record)return J({detail:'Broadcast key is invalid, expired, revoked or assigned to another stream.'},401);
 const owner=await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(record.user_id,record.tenant_id).first();
 if(!owner)return J({detail:'Broadcast account is no longer active.'},401);
 if(record.station_id){
  const station=await env.DB.prepare('SELECT id FROM magnanimous_tv_stations WHERE id=? AND tenant_id=? AND user_id=?').bind(record.station_id,record.tenant_id,record.user_id).first();
  if(!station)return J({detail:'Broadcast station ownership is no longer valid.'},401);
 }else if(!await isPlatformOwnerUser(env,owner))return J({detail:'Network broadcast permission is no longer valid.'},401);
 return J({expireAt:new Date(Number(record.expires_at)*1000).toISOString()});
}

async function publicGuide(env,url){
 const channel=S(url.searchParams.get('channel'),20).toLowerCase();
 const stationSlug=S(url.searchParams.get('station'),48).toLowerCase();
 const timestamp=now();
 let rows=[];
 if(stationSlug){
  const station=await env.DB.prepare("SELECT id,tenant_id,slug,name FROM magnanimous_tv_stations WHERE slug=? AND visibility IN ('public','unlisted') LIMIT 1").bind(stationSlug).first();
  if(!station)return J({detail:'Public station not found.'},404);
  const channelKey='station:'+String(station.id);
  const result=await env.DB.prepare(`SELECT s.id AS schedule_id,s.starts_at AS schedule_starts_at,s.ends_at AS schedule_ends_at,p.*
   FROM magnanimous_tv_schedule s JOIN magnanimous_tv_programmes p ON p.id=s.programme_id
   WHERE s.tenant_id=? AND s.channel_key=? AND s.status='scheduled'
    AND s.ends_at>? AND p.status='approved'
    AND (p.rights_expires_at IS NULL OR p.rights_expires_at>?)
   ORDER BY s.starts_at ASC LIMIT 40`).bind(station.tenant_id,channelKey,timestamp,timestamp).all();
  rows=result.results||[];
  return J({channel:'station',station:{slug:station.slug,name:station.name},programmes:rows.map(r=>({schedule_id:r.schedule_id,starts_at:r.schedule_starts_at,ends_at:r.schedule_ends_at,programme:publicProgramme(r)})),playout_connected:false,note:'This is a programme-guide preview. Automatic playout and viewer streaming are not connected yet.'});
 }
 if(!CHANNELS.has(channel))return J({detail:'Choose the Philippines or Worldwide channel.'},400);
 const result=await env.DB.prepare(`SELECT s.id,s.starts_at,s.ends_at,s.status,p.*
  FROM magnanimous_tv_schedule s JOIN magnanimous_tv_programmes p ON p.id=s.programme_id
  WHERE s.tenant_id=? AND s.channel_key=? AND s.status='scheduled'
   AND s.ends_at>? AND p.tenant_id=? AND p.status='approved'
   AND (p.rights_expires_at IS NULL OR p.rights_expires_at>?)
  ORDER BY s.starts_at ASC LIMIT 40`).bind(GLOBAL_TENANT,channel,timestamp,GLOBAL_TENANT,timestamp).all();
 rows=result.results||[];
 return J({channel,programmes:rows.map(r=>({schedule_id:r.id,starts_at:r.starts_at,ends_at:r.ends_at,programme:publicProgramme(r)})),playout_connected:false,note:'This is a programme-guide preview. Automatic playout and viewer streaming are not connected yet.'});
}
async function listPrivate(env,user){
 const tenant=String(user.tenant_id),uid=String(user.id);
 const canManageNetworks=await isPlatformOwnerUser(env,user);
 const [stations,programmes]=await Promise.all([
  env.DB.prepare('SELECT id,slug,name,visibility FROM magnanimous_tv_stations WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC LIMIT 5').bind(tenant,uid).all(),
  env.DB.prepare(`SELECT * FROM magnanimous_tv_programmes
   WHERE (tenant_id=? AND submitted_by=?)
    OR (tenant_id=? AND status='approved')
    OR (?=1 AND tenant_id<>? AND status='pending')
   ORDER BY CASE WHEN status='pending' THEN 0 WHEN tenant_id=? THEN 1 ELSE 2 END,updated_at DESC LIMIT 100`)
   .bind(tenant,uid,GLOBAL_TENANT,canManageNetworks?1:0,GLOBAL_TENANT,GLOBAL_TENANT).all()
 ]);
 return J({stations:stations.results||[],programmes:(programmes.results||[]).map(privateProgramme),can_manage_networks:canManageNetworks,limits:{stations:5,programme_submissions_per_station:20},broadcast_connected:false});
}
async function submitProgramme(request,env,user){
 const b=await request.json().catch(()=>({}));
 const stationId=S(b.station_id,64),station=await currentOwnerStation(env,user,stationId);
 if(!station)return J({detail:'Create or select a station that belongs to your account.'},403);
 const title=S(b.title,120),description=S(b.description,700),creator=S(b.creator,180);
 const sourceUrl=safeUrl(b.source_url,{hosts:new Set(['commons.wikimedia.org','www.youtube.com','youtube.com','youtu.be','vimeo.com','www.vimeo.com','drive.google.com','openstat.psa.gov.ph','psa.gov.ph'])});
 const evidenceUrl=safeUrl(b.evidence_url,{allowAnyPublicHttps:true});
 const licenseId=S(b.license_id,40),licenseUrl=LICENSES[licenseId];
 const attribution=S(b.attribution,500);
 const duration=Number(b.duration_seconds);
 const territories=Array.isArray(b.territories)?[...new Set(b.territories.filter(x=>TERRITORIES.has(x)))]:[];
 const uses=Array.isArray(b.uses)?[...new Set(b.uses.filter(x=>USES.has(x)))]:[];
 if(title.length<3||!creator||!sourceUrl||!evidenceUrl||!licenseUrl||!attribution||!Number.isInteger(duration)||duration<30||duration>14400||!territories.length||!uses.length){
  return J({detail:'Complete the title, creator, source page, evidence link, supported licence, attribution, duration (30 seconds–4 hours), territory and intended uses.'},400);
 }
 const tenant=String(user.tenant_id),uid=String(user.id),count=await env.DB.prepare('SELECT COUNT(*) AS count FROM magnanimous_tv_programmes WHERE tenant_id=? AND submitted_by=? AND station_id=?').bind(tenant,uid,station.id).first();
 if(Number(count?.count||0)>=20)return J({detail:'This station has reached the current review-queue limit of 20 programme submissions.'},429);
 const id=ID(),timestamp=now();
 await env.DB.prepare(`INSERT INTO magnanimous_tv_programmes(
  id,tenant_id,submitted_by,station_id,title,description,source_url,creator,
  license_id,license_url,attribution,evidence_url,territories_json,uses_json,
  duration_seconds,media_url,status,created_at,updated_at
 ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
  id,tenant,uid,station.id,title,description,sourceUrl,creator,licenseId,licenseUrl,
  attribution,evidenceUrl,JSON.stringify(territories),JSON.stringify(uses),
  duration,'','pending',timestamp,timestamp
 ).run();
 const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_programmes WHERE id=? AND tenant_id=? AND submitted_by=?').bind(id,tenant,uid).first();
 return J({programme:privateProgramme(row),message:'Submitted for rights review. It is not approved or scheduled, and no video has been broadcast.'},201);
}
async function reviewProgramme(request,env,user,id){
 if(!await isPlatformOwnerUser(env,user))return J({detail:'Platform owner review access required.'},403);
 const b=await request.json().catch(()=>({}));
 const status=S(b.status,20),note=S(b.review_notes,1000);
 if(!['approved','rejected','suspended'].includes(status)||note.length<8)return J({detail:'Choose approved, rejected or suspended and provide a review note.'},400);
 const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_programmes WHERE id=? AND tenant_id<>?').bind(id,GLOBAL_TENANT).first();
 if(!row)return J({detail:'Programme submission not found.'},404);
 let mediaUrl='';
 if(status==='approved'){
  mediaUrl=safeUrl(b.media_url,{hosts:SAFE_MEDIA_HOSTS});
  if(!mediaUrl)return J({detail:'Approval requires a verified HTTPS media file on an approved media host.'},400);
  if(!LICENSES[row.license_id]||row.license_url!==LICENSES[row.license_id]||!row.creator||!row.attribution||!safeUrl(row.evidence_url,{allowAnyPublicHttps:true}))return J({detail:'The rights evidence, creator, licence and attribution are incomplete.'},400);
 }
 const timestamp=now();
 await env.DB.prepare(`UPDATE magnanimous_tv_programmes SET status=?,media_url=?,reviewer_id=?,reviewed_at=?,review_notes=?,updated_at=?
  WHERE id=? AND status='pending'`).bind(status,mediaUrl,String(user.id),timestamp,note,timestamp,id).run();
 const updated=await env.DB.prepare('SELECT * FROM magnanimous_tv_programmes WHERE id=?').bind(id).first();
 if(!updated||updated.status!==status)return J({detail:'Programme was already reviewed or could not be updated.'},409);
 return J({programme:privateProgramme(updated)});
}
async function createSchedule(request,env,user){
 const b=await request.json().catch(()=>({}));
 const programmeId=S(b.programme_id,80),channelKey=S(b.channel_key,80);
 const startRaw=b.starts_at;
 const startsAt=typeof startRaw==='number'?Math.floor(startRaw):Math.floor(Date.parse(String(startRaw||''))/1000);
 const timestamp=now();
 if(!programmeId||!Number.isFinite(startsAt)||startsAt<timestamp+60||startsAt>timestamp+90*86400)return J({detail:'Choose a start time at least one minute from now and within the next 90 days.'},400);
 let tenant='',stationId=null;
 if(CHANNELS.has(channelKey)){
  if(!await isPlatformOwnerUser(env,user))return J({detail:'Only the platform owner can schedule a network-wide channel.'},403);
  tenant=GLOBAL_TENANT;
 }else if(channelKey.startsWith('station:')){
  stationId=channelKey.slice(8);
  const station=await currentOwnerStation(env,user,stationId);
  if(!station)return J({detail:'That station does not belong to your account.'},403);
  tenant=String(user.tenant_id);
 }else return J({detail:'Choose a supported Magnanimous TV channel.'},400);
 const programme=await env.DB.prepare('SELECT * FROM magnanimous_tv_programmes WHERE id=?').bind(programmeId).first();
 if(!programme||programme.status!=='approved'||!programme.media_url||(programme.rights_expires_at&&Number(programme.rights_expires_at)<=timestamp))return J({detail:'Only approved programmes with a current rights record and verified media file can be scheduled.'},409);
 if(CHANNELS.has(channelKey)&&programme.tenant_id!==GLOBAL_TENANT)return J({detail:'Network channels can only use globally approved programme assets.'},403);
 if(stationId&&(programme.tenant_id!==GLOBAL_TENANT&&(programme.tenant_id!==tenant||programme.station_id!==stationId)))return J({detail:'This programme is not approved for the selected station.'},403);
 const uses=parseJsonArray(programme.uses_json,USES);
 if(!uses.includes('linear'))return J({detail:'This programme is not licensed for scheduled linear television.'},403);
 const territories=parseJsonArray(programme.territories_json,TERRITORIES);
 if(channelKey==='worldwide'&&!territories.includes('worldwide'))return J({detail:'This programme is not cleared for worldwide distribution.'},403);
 if(channelKey==='philippines'&&!territories.some(x=>x==='worldwide'||x==='philippines'))return J({detail:'This programme is not cleared for the Philippines.'},403);
 if(stationId&&!territories.includes('worldwide'))return J({detail:'Personal stations currently require worldwide territory clearance; regional geofencing is not active.'},403);
 const duration=Number(programme.duration_seconds||0);
 if(!Number.isInteger(duration)||duration<30||duration>14400)return J({detail:'The approved programme duration is not valid for scheduling.'},409);
 const endsAt=startsAt+duration,id=ID(),key=channelKey;
 const result=await env.DB.prepare(`INSERT INTO magnanimous_tv_schedule(
  id,tenant_id,channel_key,station_id,programme_id,starts_at,ends_at,status,created_by,created_at,updated_at
 ) SELECT ?,?,?,?,?,?,?,'scheduled',?,?,? WHERE NOT EXISTS(
  SELECT 1 FROM magnanimous_tv_schedule
  WHERE tenant_id=? AND channel_key=? AND status='scheduled'
   AND starts_at<? AND ends_at>?
 )`).bind(id,tenant,key,stationId,programmeId,startsAt,endsAt,String(user.id),timestamp,timestamp,tenant,key,endsAt,startsAt).run();
 if(!Number(result?.meta?.changes||0))return J({detail:'This time overlaps an existing programme on the selected channel. Choose another time.'},409);
 return J({schedule:{id,channel_key:key,station_id:stationId,programme_id:programmeId,starts_at:startsAt,ends_at:endsAt,status:'scheduled'},playout_connected:false,note:'Schedule entry saved. It appears in the guide, but automatic playout and live transmission are not connected yet.'},201);
}
async function cancelSchedule(request,env,user,id){
 const row=await env.DB.prepare('SELECT * FROM magnanimous_tv_schedule WHERE id=? AND status=\'scheduled\'').bind(id).first();
 if(!row)return J({detail:'Scheduled programme not found.'},404);
 if(row.channel_key==='philippines'||row.channel_key==='worldwide'){
  if(!await isPlatformOwnerUser(env,user))return J({detail:'Platform owner access required.'},403);
 }else{
  const station=await currentOwnerStation(env,user,row.station_id);
  if(!station)return J({detail:'This station does not belong to your account.'},403);
 }
 await env.DB.prepare("UPDATE magnanimous_tv_schedule SET status='cancelled',updated_at=? WHERE id=? AND status='scheduled'").bind(now(),id).run();
 return J({cancelled:true});
}
export async function scheduledMagnanimousTvProgramming(env){
 if(!env?.DB)return{completed:0,revoked:0};
 await schema(env);
 const timestamp=now();
 await env.DB.prepare('DELETE FROM magnanimous_tv_media_tokens WHERE expires_at<? OR revoked_at IS NOT NULL').bind(timestamp-86400).run();
 const expired=await env.DB.prepare("UPDATE magnanimous_tv_schedule SET status='completed',updated_at=? WHERE status='scheduled' AND ends_at<=?").bind(timestamp,timestamp).run();
 const revoked=await env.DB.prepare("UPDATE magnanimous_tv_schedule SET status='cancelled',updated_at=? WHERE status='scheduled' AND programme_id IN (SELECT id FROM magnanimous_tv_programmes WHERE rights_expires_at IS NOT NULL AND rights_expires_at<=?)").bind(timestamp,timestamp).run();
 return{completed:Number(expired?.meta?.changes||0),revoked:Number(revoked?.meta?.changes||0),playout_connected:false};
}
export async function handleMagnanimousTvProgramming(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/tv/media/auth'){if(!env?.DB)return J({detail:'TV media authorization storage is unavailable.'},503);try{await schema(env);return await authenticateMediaNode(request,env,url)}catch{return J({detail:'TV media authorization is unavailable.'},503)}}
 if(path==='/api/tv/media/status'&&request.method==='GET'){const origin=mediaHostOrigin(env),bind=String(env?.MAGNANIMOUS_TV_WEBRTC_UDP_BIND||'127.0.0.1').trim().toLowerCase(),udp_ready=Boolean(bind)&&!['127.0.0.1','::1','localhost'].includes(bind);return J({enabled:mediaEnabled(env),host_configured:Boolean(origin),udp_ready,media_host:mediaEnabled(env)?origin:null,ingest_protocol:'webrtc-whip',viewer_protocols:['webrtc-whep','hls'],maximum_readers_per_stream:40,recording_enabled:false,default_network_ports_public:false});}
 if(path==='/api/tv/programming/public'&&request.method==='GET'){
  try{await schema(env);return await publicGuide(env,url)}catch(error){console.error('Magnanimous TV public guide failed',error);return J({detail:'The TV programme guide is temporarily unavailable.'},503)}
 }
 if(!path.startsWith('/api/tv/programmes')&&!path.startsWith('/api/tv/programming')&&!path.startsWith('/api/tv/media'))return null;
 if(!env?.DB)return J({detail:'TV programme storage is unavailable.'},503);
 try{
  await schema(env);
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return J({detail:'Sign in to manage TV programming.'},401);
  const tenant=String(user.tenant_id||''),uid=String(user.id||'');
  if(!tenant||!uid)return J({detail:'Your account does not have a valid workspace identity.'},403);
  if(path==='/api/tv/media/access'&&request.method==='POST')return await issueMediaPublishAccess(request,env,user);
  const revoke=path.match(/^\/api\/tv\/media\/access\/([a-f0-9-]{36})\/revoke$/);
  if(revoke&&request.method==='POST')return await revokeMediaAccess(env,user,revoke[1]);
  if(path==='/api/tv/programmes'&&request.method==='GET')return await listPrivate(env,user);
  if(path==='/api/tv/programmes'&&request.method==='POST')return await submitProgramme(request,env,user);
  const review=path.match(/^\/api\/tv\/programmes\/([a-z0-9-]{8,80})\/review$/);
  if(review&&request.method==='POST')return await reviewProgramme(request,env,user,review[1]);
  if(path==='/api/tv/programming/schedule'&&request.method==='POST')return await createSchedule(request,env,user);
  const cancel=path.match(/^\/api\/tv\/programming\/schedule\/([a-z0-9-]{8,80})\/cancel$/);
  if(cancel&&request.method==='POST')return await cancelSchedule(request,env,user,cancel[1]);
  return J({detail:'TV programming route not found.'},404);
 }catch(error){console.error('Magnanimous TV programming request failed',error);return J({detail:'TV programming could not complete this request.'},500)}
}
