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
 const expired=await env.DB.prepare("UPDATE magnanimous_tv_schedule SET status='completed',updated_at=? WHERE status='scheduled' AND ends_at<=?").bind(timestamp,timestamp).run();
 const revoked=await env.DB.prepare("UPDATE magnanimous_tv_schedule SET status='cancelled',updated_at=? WHERE status='scheduled' AND programme_id IN (SELECT id FROM magnanimous_tv_programmes WHERE rights_expires_at IS NOT NULL AND rights_expires_at<=?)").bind(timestamp,timestamp).run();
 return{completed:Number(expired?.meta?.changes||0),revoked:Number(revoked?.meta?.changes||0),playout_connected:false};
}
export async function handleMagnanimousTvProgramming(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/tv/programming/public'&&request.method==='GET'){
  try{await schema(env);return await publicGuide(env,url)}catch(error){console.error('Magnanimous TV public guide failed',error);return J({detail:'The TV programme guide is temporarily unavailable.'},503)}
 }
 if(!path.startsWith('/api/tv/programmes')&&!path.startsWith('/api/tv/programming'))return null;
 if(!env?.DB)return J({detail:'TV programme storage is unavailable.'},503);
 try{
  await schema(env);
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return J({detail:'Sign in to manage TV programming.'},401);
  const tenant=String(user.tenant_id||''),uid=String(user.id||'');
  if(!tenant||!uid)return J({detail:'Your account does not have a valid workspace identity.'},403);
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
