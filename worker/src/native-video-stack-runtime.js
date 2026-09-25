import {currentUser} from './integrations.js';
import {tenantPlan} from './usage-guard.js';

const J=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'no-store'}});
const N=()=>Math.floor(Date.now()/1000),ID=()=>crypto.randomUUID(),S=(v,n=1000)=>String(v??'').trim().slice(0,n);
const SESSION_TTL=3600,CHUNK_MAX=8*1024*1024;
const maxUpload=env=>String(env?.MAGNANIMOUS_RUNTIME||'')==='standalone-node'?Math.max(64*1024*1024,Math.min(512*1024*1024,Number(env?.MAGNANIMOUS_VIDEO_UPLOAD_MAX_BYTES||256*1024*1024))):Math.max(32*1024*1024,Math.min(96*1024*1024,Number(env?.MAGNANIMOUS_VIDEO_UPLOAD_MAX_BYTES||64*1024*1024)));
const bytesToHex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hash(v){return bytesToHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(v||''))))}
function jsonText(v,fallback){try{return JSON.stringify(v??fallback)}catch{return JSON.stringify(fallback)}}
function parseJson(v,fallback){try{return JSON.parse(String(v||''))}catch{return fallback}}
function safeTags(v){return[...new Set((Array.isArray(v)?v:[]).map(x=>S(x,60)).filter(Boolean))].slice(0,24)}
function contentType(v){const t=String(v||'video/mp4').toLowerCase();return /^video\/(mp4|webm|quicktime|x-m4v)$/.test(t)?t:'video/mp4'}
function ext(t){return t.includes('webm')?'webm':t.includes('quicktime')?'mov':'mp4'}
function objectStore(env){return env?.MAGNANIMOUS_OBJECT_STORE||env?.OBJECT_STORE||null}
async function schema(env){
 for(const q of[
  `CREATE TABLE IF NOT EXISTS video_stack_sessions(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL,last_seen_at INTEGER NOT NULL,created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS video_stack_uploads(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',content_type TEXT NOT NULL DEFAULT 'video/mp4',declared_bytes INTEGER NOT NULL DEFAULT 0,received_bytes INTEGER NOT NULL DEFAULT 0,part_count INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'initializing',tags_json TEXT NOT NULL DEFAULT '[]',metadata_json TEXT NOT NULL DEFAULT '{}',asset_id TEXT,error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS video_stack_parts(upload_id TEXT NOT NULL,part_number INTEGER NOT NULL,object_key TEXT NOT NULL,bytes INTEGER NOT NULL DEFAULT 0,etag TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,PRIMARY KEY(upload_id,part_number))`,
  `CREATE TABLE IF NOT EXISTS video_stack_assets(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',object_key TEXT NOT NULL,content_type TEXT NOT NULL DEFAULT 'video/mp4',bytes INTEGER NOT NULL DEFAULT 0,duration_ms INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'ready_to_play',tags_json TEXT NOT NULL DEFAULT '[]',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS video_stack_access_tokens(token_hash TEXT PRIMARY KEY,asset_id TEXT NOT NULL,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,purpose TEXT NOT NULL DEFAULT 'playback',expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS video_stack_editor_projects(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',segments_json TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'editing',progress REAL NOT NULL DEFAULT 0,output_asset_id TEXT,error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS video_stack_live_sessions(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',mode TEXT NOT NULL DEFAULT 'browser-webrtc',status TEXT NOT NULL DEFAULT 'created',audience INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_video_assets_owner ON video_stack_assets(tenant_id,user_id,updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_video_assets_tenant ON video_stack_assets(tenant_id,updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_video_uploads_owner ON video_stack_uploads(tenant_id,user_id,updated_at DESC)`
 ])await env.DB.prepare(q).run();
}
async function mediaUser(request,env){
 const user=await currentUser(request,env).catch(()=>null);if(user)return user;
 const token=S(request.headers.get('x-magnanimous-media-session'),400);if(!token||!env?.DB)return null;
 await schema(env);const h=await hash(token),row=await env.DB.prepare('SELECT * FROM video_stack_sessions WHERE token_hash=? AND expires_at>?').bind(h,N()).first();
 if(!row)return null;await env.DB.prepare('UPDATE video_stack_sessions SET last_seen_at=? WHERE id=?').bind(N(),row.id).run().catch(()=>null);
 return{id:row.user_id,tenant_id:row.tenant_id,role:'media-session'};
}
async function makeSession(request,env){
 const user=await currentUser(request,env).catch(()=>null);if(!user)return J({detail:'Sign in before creating a media session.'},401);
 await schema(env);const raw=crypto.randomUUID()+crypto.randomUUID().replace(/-/g,''),id=ID(),ts=N(),expires=ts+SESSION_TTL;
 await env.DB.prepare('INSERT INTO video_stack_sessions(id,token_hash,tenant_id,user_id,expires_at,last_seen_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,await hash(raw),String(user.tenant_id),String(user.id),expires,ts,ts).run();
 return J({session_id:id,session_token:raw,expires_at:expires,ttl_seconds:SESSION_TTL,identity:'Magnanimous Video Stack',client_rule:'Keep this short-lived token in memory only. Never embed platform secrets in browser or mobile builds.'},201);
}
async function createUpload(request,env,user){
 const store=objectStore(env);if(!store?.put)return J({detail:'Magnanimous object storage is unavailable.'},503);
 const b=await request.json().catch(()=>({})),title=S(b.title||'Untitled video',220),declared=Math.max(0,Number(b.total_bytes||b.bytes||0)||0),limit=maxUpload(env),type=contentType(b.content_type);
 if(declared>limit)return J({detail:`Upload exceeds this runtime's ${Math.floor(limit/1024/1024)} MB safety limit.`,code:'VIDEO_UPLOAD_TOO_LARGE',max_bytes:limit},413);
 const id=ID(),ts=N();await env.DB.prepare('INSERT INTO video_stack_uploads(id,tenant_id,user_id,title,content_type,declared_bytes,status,tags_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),title,type,declared,'initializing',jsonText(safeTags(b.tags),[]),jsonText(b.metadata&&typeof b.metadata==='object'?b.metadata:{},{}),ts,ts).run();
 return J({upload_id:id,status:'initializing',chunk_max_bytes:CHUNK_MAX,max_upload_bytes:limit,next:{method:'PUT',path:`/api/video-stack/uploads/${id}/parts/0`}},201);
}
async function uploadPart(request,env,user,uploadId,partNumber){
 if(!Number.isInteger(partNumber)||partNumber<0||partNumber>9999)return J({detail:'Invalid upload part number.'},400);
 const store=objectStore(env);if(!store?.put)return J({detail:'Magnanimous object storage is unavailable.'},503);
 const row=await env.DB.prepare('SELECT * FROM video_stack_uploads WHERE id=? AND tenant_id=? AND user_id=?').bind(uploadId,String(user.tenant_id),String(user.id)).first();if(!row)return J({detail:'Upload not found.'},404);
 if(['canceled','ready_to_play','failed'].includes(String(row.status)))return J({detail:`Upload is already ${row.status}.`},409);
 const declared=Number(request.headers.get('content-length')||0);if(declared>CHUNK_MAX)return J({detail:'Chunk exceeds the 8 MB part limit.',max_part_bytes:CHUNK_MAX},413);
 const buffer=new Uint8Array(await request.arrayBuffer());if(!buffer.byteLength)return J({detail:'Upload chunk is empty.'},400);if(buffer.byteLength>CHUNK_MAX)return J({detail:'Chunk exceeds the 8 MB part limit.',max_part_bytes:CHUNK_MAX},413);
 const key=`video-stack/tmp/${user.tenant_id}/${uploadId}/${String(partNumber).padStart(5,'0')}.part`,put=await store.put(key,buffer,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{upload_id:uploadId,part_number:String(partNumber)}});
 const ts=N();await env.DB.prepare(`INSERT INTO video_stack_parts(upload_id,part_number,object_key,bytes,etag,created_at) VALUES(?,?,?,?,?,?)
 ON CONFLICT(upload_id,part_number) DO UPDATE SET object_key=excluded.object_key,bytes=excluded.bytes,etag=excluded.etag,created_at=excluded.created_at`).bind(uploadId,partNumber,key,buffer.byteLength,String(put?.etag||''),ts).run();
 const totals=await env.DB.prepare('SELECT COALESCE(SUM(bytes),0) bytes,COUNT(*) parts FROM video_stack_parts WHERE upload_id=?').bind(uploadId).first(),received=Number(totals?.bytes||0),limit=maxUpload(env);
 if(received>limit){await env.DB.prepare('UPDATE video_stack_uploads SET status=?,error_text=?,updated_at=? WHERE id=?').bind('failed','Upload safety limit exceeded.',ts,uploadId).run();return J({detail:'Upload safety limit exceeded.',code:'VIDEO_UPLOAD_TOO_LARGE'},413)}
 await env.DB.prepare('UPDATE video_stack_uploads SET status=?,received_bytes=?,part_count=?,updated_at=? WHERE id=?').bind('uploading',received,Number(totals?.parts||0),ts,uploadId).run();
 return J({upload_id:uploadId,status:'uploading',received_bytes:received,declared_bytes:Number(row.declared_bytes||0),progress:Number(row.declared_bytes||0)>0?Math.min(1,received/Number(row.declared_bytes)):null,part_count:Number(totals?.parts||0),next_part:partNumber+1});
}
async function finalizeUpload(request,env,user,uploadId){
 const store=objectStore(env);if(!store?.put||!store?.get)return J({detail:'Magnanimous object storage is unavailable.'},503);
 const row=await env.DB.prepare('SELECT * FROM video_stack_uploads WHERE id=? AND tenant_id=? AND user_id=?').bind(uploadId,String(user.tenant_id),String(user.id)).first();if(!row)return J({detail:'Upload not found.'},404);
 if(row.asset_id){const asset=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=?').bind(row.asset_id).first();return J({upload_id:uploadId,status:'ready_to_play',asset:publicAsset(asset)})}
 const{results=[]}=await env.DB.prepare('SELECT * FROM video_stack_parts WHERE upload_id=? ORDER BY part_number ASC').bind(uploadId).all();if(!results.length)return J({detail:'Upload has no chunks.'},409);
 for(let i=0;i<results.length;i++)if(Number(results[i].part_number)!==i)return J({detail:`Upload is missing part ${i}.`,code:'UPLOAD_PART_MISSING'},409);
 const total=results.reduce((n,x)=>n+Number(x.bytes||0),0),declared=Number(row.declared_bytes||0);
 if(declared&&total!==declared)return J({detail:'Received bytes do not match the declared upload size.',code:'UPLOAD_SIZE_MISMATCH',declared_bytes:declared,received_bytes:total},409);
 if(total>maxUpload(env))return J({detail:'Upload exceeds runtime safety limit.'},413);
 const merged=new Uint8Array(total);let offset=0;
 for(const part of results){const obj=await store.get(part.object_key);if(!obj)return J({detail:`Upload part ${part.part_number} is unavailable.`},409);const bytes=new Uint8Array(await obj.arrayBuffer());merged.set(bytes,offset);offset+=bytes.byteLength}
 const assetId=ID(),type=contentType(row.content_type),key=`video-stack/assets/${user.tenant_id}/${assetId}.${ext(type)}`,ts=N();
 await store.put(key,merged,{httpMetadata:{contentType:type,cacheControl:'private, max-age=0'},customMetadata:{tenant_id:String(user.tenant_id),asset_id:assetId,source:'magnanimous-video-stack'}});
 await env.DB.prepare('INSERT INTO video_stack_assets(id,tenant_id,user_id,title,object_key,content_type,bytes,status,tags_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(assetId,String(user.tenant_id),String(user.id),row.title,key,type,total,'ready_to_play',row.tags_json,row.metadata_json,ts,ts).run();
 await env.DB.prepare('UPDATE video_stack_uploads SET status=?,received_bytes=?,part_count=?,asset_id=?,updated_at=? WHERE id=?').bind('ready_to_play',total,results.length,assetId,ts,uploadId).run();
 for(const part of results)if(store.delete)await store.delete(part.object_key).catch(()=>null);await env.DB.prepare('DELETE FROM video_stack_parts WHERE upload_id=?').bind(uploadId).run();
 const asset=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=?').bind(assetId).first();
 return J({upload_id:uploadId,status:'ready_to_play',asset:publicAsset(asset),detail:'Upload finalized and verified ready for playback.'},201);
}
function publicAsset(x){if(!x)return null;return{id:x.id,title:x.title,content_type:x.content_type,bytes:Number(x.bytes||0),duration_ms:Number(x.duration_ms||0),status:x.status,tags:parseJson(x.tags_json,[]),metadata:parseJson(x.metadata_json,{}),created_at:Number(x.created_at||0),updated_at:Number(x.updated_at||0),stream_url:`/api/video-stack/assets/${x.id}`,manifest_url:`/api/video-stack/assets/${x.id}/manifest`}}
async function listPlaylist(request,env,user){
 const u=new URL(request.url),limit=Math.max(1,Math.min(50,Number(u.searchParams.get('limit')||20)||20)),cursor=Math.max(0,Number(u.searchParams.get('cursor')||0)||0),tag=S(u.searchParams.get('tag'),60),scope=u.searchParams.get('scope')==='tenant'?'tenant':'mine';
 const params=[String(user.tenant_id)],where=['tenant_id=?'];if(scope==='mine'){where.push('user_id=?');params.push(String(user.id))}
 if(tag){where.push("tags_json LIKE ?");params.push('%'+JSON.stringify(tag).slice(1,-1)+'%')}
 const{results=[]}=await env.DB.prepare(`SELECT * FROM video_stack_assets WHERE ${where.join(' AND ')} AND status='ready_to_play' ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(...params,limit+1,cursor).all(),more=results.length>limit,items=results.slice(0,limit).map(publicAsset);
 return J({items,total_loaded:items.length,next_cursor:more?cursor+limit:null,filters:{scope,tag:tag||null},preload:items.slice(0,3).map(x=>x.stream_url)});
}
async function streamAsset(request,env,user,assetId){
 const row=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=? AND tenant_id=?').bind(assetId,String(user.tenant_id)).first();if(!row)return J({detail:'Video not found.'},404);
 const store=objectStore(env),obj=await store?.get?.(row.object_key);if(!obj)return J({detail:'Video bytes are unavailable.'},404);const bytes=new Uint8Array(await obj.arrayBuffer()),size=bytes.byteLength,type=row.content_type||'video/mp4',range=String(request.headers.get('range')||'');
 if(range){const m=range.match(/^bytes=(\d*)-(\d*)$/);if(m){let start=m[1]?Number(m[1]):0,end=m[2]?Number(m[2]):size-1;if(!m[1]&&m[2]){const suffix=Math.min(size,Number(m[2]));start=size-suffix;end=size-1}start=Math.max(0,Math.min(start,size-1));end=Math.max(start,Math.min(end,size-1));const chunk=bytes.slice(start,end+1);return new Response(chunk,{status:206,headers:{'content-type':type,'accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${size}`,'content-length':String(chunk.byteLength),'cache-control':'private, no-store'}})}}
 return new Response(bytes,{headers:{'content-type':type,'content-length':String(size),'accept-ranges':'bytes','cache-control':'private, no-store'}});
}
async function makeAccess(request,env,user,assetId,purpose='playback'){
 const row=await env.DB.prepare('SELECT id FROM video_stack_assets WHERE id=? AND tenant_id=?').bind(assetId,String(user.tenant_id)).first();if(!row)return J({detail:'Video not found.'},404);
 const token=crypto.randomUUID()+crypto.randomUUID().replace(/-/g,''),expires=N()+900;await env.DB.prepare('INSERT INTO video_stack_access_tokens(token_hash,asset_id,tenant_id,user_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(await hash(token),assetId,String(user.tenant_id),String(user.id),S(purpose,30),expires,N()).run();
 return J({url:`${new URL(request.url).origin}/api/video-stack/access/${token}`,expires_at:expires,purpose});
}
async function publicAccess(request,env,token){
 const row=await env.DB.prepare('SELECT a.* FROM video_stack_access_tokens t JOIN video_stack_assets a ON a.id=t.asset_id WHERE t.token_hash=? AND t.expires_at>?').bind(await hash(token),N()).first();if(!row)return J({detail:'Temporary media link expired or invalid.'},401);
 return streamAsset(request,env,{tenant_id:row.tenant_id,id:row.user_id},row.id);
}
async function manifest(request,env,user,assetId){
 const row=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=? AND tenant_id=?').bind(assetId,String(user.tenant_id)).first();if(!row)return J({detail:'Video not found.'},404);
 const access=await makeAccess(request,env,user,assetId,'playback'),d=await access.clone().json();
 const next=await env.DB.prepare("SELECT id,title FROM video_stack_assets WHERE tenant_id=? AND status='ready_to_play' AND updated_at<? ORDER BY updated_at DESC LIMIT 3").bind(String(user.tenant_id),Number(row.updated_at||0)).all();
 return J({video:publicAsset(row),playback_url:d.url,playback_expires_at:d.expires_at,preload_next:(next.results||[]).map(x=>({id:x.id,title:x.title,manifest_url:`/api/video-stack/assets/${x.id}/manifest`}))});
}
async function createEditor(request,env,user){
 const b=await request.json().catch(()=>({})),segments=Array.isArray(b.segments)?b.segments.slice(0,40):[];if(!segments.length)return J({detail:'Add at least one clip to the editor.'},400);
 const normalized=[];for(const [index,s] of segments.entries()){const assetId=S(s.asset_id,100),row=await env.DB.prepare('SELECT id,duration_ms FROM video_stack_assets WHERE id=? AND tenant_id=?').bind(assetId,String(user.tenant_id)).first();if(!row)return J({detail:`Clip ${index+1} was not found.`},404);const start=Math.max(0,Number(s.trim_start_ms||0)||0),end=Math.max(0,Number(s.trim_end_ms||0)||0);if(end&&end<=start)return J({detail:`Clip ${index+1} trim end must be after trim start.`},400);normalized.push({asset_id:assetId,trim_start_ms:start,trim_end_ms:end||null})}
 const id=ID(),ts=N();await env.DB.prepare('INSERT INTO video_stack_editor_projects(id,tenant_id,user_id,title,segments_json,status,progress,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),S(b.title||'Magnanimous edit',220),JSON.stringify(normalized),'editing',0,ts,ts).run();return J({project_id:id,status:'editing',segments:normalized,controls:['reorder','trim','preview','finalize']},201);
}
async function updateEditor(request,env,user,id){
 const row=await env.DB.prepare('SELECT * FROM video_stack_editor_projects WHERE id=? AND tenant_id=? AND user_id=?').bind(id,String(user.tenant_id),String(user.id)).first();if(!row)return J({detail:'Edit project not found.'},404);const b=await request.json().catch(()=>({})),segments=Array.isArray(b.segments)?b.segments:parseJson(row.segments_json,[]);const fake=new Request(request.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({segments,title:b.title||row.title})});const validated=[];for(const [index,s] of segments.slice(0,40).entries()){const a=await env.DB.prepare('SELECT id FROM video_stack_assets WHERE id=? AND tenant_id=?').bind(S(s.asset_id,100),String(user.tenant_id)).first();if(!a)return J({detail:`Clip ${index+1} was not found.`},404);const start=Math.max(0,Number(s.trim_start_ms||0)||0),end=Math.max(0,Number(s.trim_end_ms||0)||0);if(end&&end<=start)return J({detail:`Clip ${index+1} trim end must be after trim start.`},400);validated.push({asset_id:a.id,trim_start_ms:start,trim_end_ms:end||null})}
 await env.DB.prepare('UPDATE video_stack_editor_projects SET title=?,segments_json=?,status=?,updated_at=? WHERE id=?').bind(S(b.title||row.title,220),JSON.stringify(validated),'editing',N(),id).run();return J({project_id:id,status:'editing',segments:validated});
}
async function finalizeEditor(request,env,user,id){
 const row=await env.DB.prepare('SELECT * FROM video_stack_editor_projects WHERE id=? AND tenant_id=? AND user_id=?').bind(id,String(user.tenant_id),String(user.id)).first();if(!row)return J({detail:'Edit project not found.'},404);if(row.output_asset_id){const asset=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=?').bind(row.output_asset_id).first();return J({project_id:id,status:'ready_to_play',asset:publicAsset(asset)})}
 const segments=parseJson(row.segments_json,[]);if(!segments.length)return J({detail:'Edit project has no clips.'},409);
 const renderSegments=[];for(const seg of segments){const access=await makeAccess(request,env,user,seg.asset_id,'render'),d=await access.clone().json();renderSegments.push({url:d.url,trim_start_ms:seg.trim_start_ms||0,trim_end_ms:seg.trim_end_ms||null})}
 const planState=await tenantPlan(env,user.tenant_id),watermark=['free','plus'].includes(String(planState?.plan||'free').toLowerCase()),gateway=String(env?.MAGNANIMOUS_VIDEO_GATEWAY_URL||env?.VIDEO_GATEWAY_URL||'https://iam-magnanimous-video-gateway.iam-magnanimous.workers.dev').replace(/\/$/,'');
 await env.DB.prepare('UPDATE video_stack_editor_projects SET status=?,progress=?,updated_at=? WHERE id=?').bind('finalizing',.2,N(),id).run();
 const r=await fetch(gateway+'/api/video/edit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:row.title,segments:renderSegments,watermark_required:watermark,watermark_text:watermark?'Magnanimous AI • I AM MAGNANIMOUS WAY™':''})}),d=await r.json().catch(()=>({}));
 if(!r.ok||!d.download_url){await env.DB.prepare('UPDATE video_stack_editor_projects SET status=?,error_text=?,updated_at=? WHERE id=?').bind('failed',S(d.detail||`Renderer failed (${r.status}).`,700),N(),id).run();return J({detail:d.detail||'Video edit finalization failed.',code:'VIDEO_EDIT_RENDER_FAILED'},502)}
 const source=new URL(String(d.download_url),gateway).toString(),vr=await fetch(source);if(!vr.ok){await env.DB.prepare('UPDATE video_stack_editor_projects SET status=?,error_text=?,updated_at=? WHERE id=?').bind('failed','Rendered video could not be fetched.',N(),id).run();return J({detail:'Rendered video could not be fetched.'},502)}
 const bytes=new Uint8Array(await vr.arrayBuffer()),assetId=ID(),key=`video-stack/assets/${user.tenant_id}/${assetId}.mp4`,store=objectStore(env),ts=N();await store.put(key,bytes,{httpMetadata:{contentType:'video/mp4',cacheControl:'private, max-age=0'},customMetadata:{tenant_id:String(user.tenant_id),asset_id:assetId,source:'magnanimous-video-editor'}});
 await env.DB.prepare('INSERT INTO video_stack_assets(id,tenant_id,user_id,title,object_key,content_type,bytes,status,tags_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(assetId,String(user.tenant_id),String(user.id),row.title,key,'video/mp4',bytes.byteLength,'ready_to_play','[]',JSON.stringify({editor_project_id:id,watermarked:watermark}),ts,ts).run();
 await env.DB.prepare('UPDATE video_stack_editor_projects SET status=?,progress=?,output_asset_id=?,updated_at=? WHERE id=?').bind('ready_to_play',1,assetId,ts,id).run();const asset=await env.DB.prepare('SELECT * FROM video_stack_assets WHERE id=?').bind(assetId).first();return J({project_id:id,status:'ready_to_play',asset:publicAsset(asset),watermarked:watermark});
}
async function live(request,env,user){
 const b=request.method==='POST'?await request.json().catch(()=>({})):{};if(request.method==='POST'){const id=ID(),ts=N(),mode=S(b.mode||'browser-webrtc',40);await env.DB.prepare('INSERT INTO video_stack_live_sessions(id,tenant_id,user_id,title,mode,status,audience,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,String(user.tenant_id),String(user.id),S(b.title||'Live stream',180),mode,'created',0,ts,ts).run();return J({live_id:id,status:'created',mode,free_first:mode==='browser-webrtc',note:'Browser WebRTC is the free-first live mode. Server-scale live distribution remains an optional configured capacity rail.'},201)}
 const{results=[]}=await env.DB.prepare('SELECT id,title,mode,status,audience,created_at,updated_at FROM video_stack_live_sessions WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 50').bind(String(user.tenant_id),String(user.id)).all();return J({sessions:results});
}
export async function handleNativeVideoStack(request,env){
 const u=new URL(request.url),p=u.pathname;if(!p.startsWith('/api/video-stack'))return null;if(!env?.DB)return J({detail:'Video stack database is unavailable.'},503);await schema(env);
 if(p==='/api/video-stack/session'&&request.method==='POST')return makeSession(request,env);
 if(p.startsWith('/api/video-stack/access/')&&request.method==='GET')return publicAccess(request,env,p.split('/').pop());
 const user=await mediaUser(request,env);if(!user)return J({detail:'Sign in or use a valid short-lived Magnanimous media session.'},401);
 if(p==='/api/video-stack/capabilities'&&request.method==='GET')return J({identity:'Magnanimous Video Stack',recording:{browser_media_recorder:true,multipart_clips:true,state_events:true},upload:{chunked:true,chunk_max_bytes:CHUNK_MAX,max_upload_bytes:maxUpload(env),states:['initializing','uploading','uploaded','ready_to_play','failed','canceled']},player:{range_requests:true,preload_next:true,playlists:true},playlist:{pagination:true,tags:true,metadata:true,tenant_scope:true},editor:{reorder:true,trim:true,finalize_mp4:true,watermark_by_plan:true},live:{browser_webrtc_free_first:true,server_scale_optional:true},security:{opaque_media_sessions:true,private_assets_default:true,temp_playback_links:true,tenant_isolation:true},provider_details_private:true});
 if(p==='/api/video-stack/uploads'&&request.method==='POST')return createUpload(request,env,user);
 const part=p.match(/^\/api\/video-stack\/uploads\/([^/]+)\/parts\/(\d+)$/);if(part&&request.method==='PUT')return uploadPart(request,env,user,part[1],Number(part[2]));
 const fin=p.match(/^\/api\/video-stack\/uploads\/([^/]+)\/finalize$/);if(fin&&request.method==='POST')return finalizeUpload(request,env,user,fin[1]);
 const up=p.match(/^\/api\/video-stack\/uploads\/([^/]+)$/);if(up&&request.method==='GET'){const row=await env.DB.prepare('SELECT * FROM video_stack_uploads WHERE id=? AND tenant_id=? AND user_id=?').bind(up[1],String(user.tenant_id),String(user.id)).first();return row?J({upload_id:row.id,status:row.status,received_bytes:Number(row.received_bytes||0),declared_bytes:Number(row.declared_bytes||0),part_count:Number(row.part_count||0),progress:Number(row.declared_bytes||0)>0?Math.min(1,Number(row.received_bytes||0)/Number(row.declared_bytes)):null,asset_id:row.asset_id||null,error:row.error_text||null}):J({detail:'Upload not found.'},404)}
 if(up&&request.method==='DELETE'){await env.DB.prepare('UPDATE video_stack_uploads SET status=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind('canceled',N(),up[1],String(user.tenant_id),String(user.id)).run();return J({upload_id:up[1],status:'canceled'})}
 if(p==='/api/video-stack/playlists'&&request.method==='GET')return listPlaylist(request,env,user);
 const manifestMatch=p.match(/^\/api\/video-stack\/assets\/([^/]+)\/manifest$/);if(manifestMatch&&request.method==='GET')return manifest(request,env,user,manifestMatch[1]);
 const accessMatch=p.match(/^\/api\/video-stack\/assets\/([^/]+)\/access$/);if(accessMatch&&request.method==='POST')return makeAccess(request,env,user,accessMatch[1],S((await request.json().catch(()=>({}))).purpose||'playback',30));
 const assetMatch=p.match(/^\/api\/video-stack\/assets\/([^/]+)$/);if(assetMatch&&request.method==='GET')return streamAsset(request,env,user,assetMatch[1]);
 if(p==='/api/video-stack/editor/projects'&&request.method==='POST')return createEditor(request,env,user);
 const edit=p.match(/^\/api\/video-stack\/editor\/projects\/([^/]+)$/);if(edit&&request.method==='PATCH')return updateEditor(request,env,user,edit[1]);
 const editFin=p.match(/^\/api\/video-stack\/editor\/projects\/([^/]+)\/finalize$/);if(editFin&&request.method==='POST')return finalizeEditor(request,env,user,editFin[1]);
 if(p==='/api/video-stack/live'&&['GET','POST'].includes(request.method))return live(request,env,user);
 return J({detail:'Magnanimous Video Stack route not found.'},404);
}
