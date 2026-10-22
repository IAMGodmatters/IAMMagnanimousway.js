// Magnanimous-owned, two-person WebRTC room signaling. No external SDK, media
// relay or per-minute provider is required. TURN is optional infrastructure.
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const ROOM_SECONDS=90*60;
const ROOM_ID=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
const EVENTS=new Set(['offer','answer','candidate','chat']);
const encoder=new TextEncoder();
const clean=(value,max)=>String(value??'').trim().slice(0,max);

function randomInvite(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function sha256(value){
 const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(value));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
function equalHashes(a,b){
 if(a.length!==b.length)return false;
 let difference=0;
 for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 return difference===0;
}
function iceServers(env){
 // A self-hosted STUN/TURN configuration may be injected from a Worker secret.
 // Public STUN is a connectivity fallback, not a media host or TURN relay.
 const fallback=[{urls:'stun:stun.l.google.com:19302'}];
 try{
  const configured=JSON.parse(String(env.MAGNANIMOUS_MEETING_ICE_SERVERS_JSON||'null'));
  if(!Array.isArray(configured)||!configured.length)return fallback;
  return configured.filter(server=>server&&typeof server==='object'&&
   (typeof server.urls==='string'||Array.isArray(server.urls))).slice(0,5);
 }catch{return fallback;}
}
function member(room,user){return room.host_user_id===user.id||room.guest_user_id===user.id;}
async function roomFor(env,id,tenant){
 return env.DB.prepare('SELECT * FROM mag_meeting_rooms WHERE id=? AND tenant_id=?').bind(id,tenant).first();
}
function roomView(room,user){
 return {room_id:room.id,title:room.title,role:room.host_user_id===user.id?'host':'guest',
  guest_joined:Boolean(room.guest_user_id),status:room.status,expires_at:room.expires_at,
  participants:room.guest_user_id?2:1,max_participants:2};
}
function eventPayload(type,payload){
 if(type==='chat'){
  const message=clean(payload?.text,1000);
  return message?{text:message}:null;
 }
 if(type==='candidate'){
  if(!payload||typeof payload.candidate!=='string'||payload.candidate.length>2500)return null;
  return {candidate:payload.candidate,sdpMid:clean(payload.sdpMid,100)||null,
   sdpMLineIndex:Number.isInteger(payload.sdpMLineIndex)?payload.sdpMLineIndex:null};
 }
 if((type==='offer'||type==='answer')&&payload?.type===type&&typeof payload.sdp==='string'&&payload.sdp.length<=30000){
  return {type,sdp:payload.sdp};
 }
 return null;
}

export async function handleNativeMeetingRooms(request,env,user){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/meet/'))return null;
 if(!user?.id||!user?.tenant_id)return json({detail:'Sign in to use Magnanimous meetings.'},401);
 if(!env?.DB)return json({detail:'Meeting room storage is unavailable.'},503);
 const tenant=String(user.tenant_id),identity=String(user.id),method=request.method;
 if(path==='/api/meet/rooms'&&method==='POST'){
  const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM mag_meeting_rooms WHERE tenant_id=? AND host_user_id=? AND status<>'ended' AND expires_at>?").bind(tenant,identity,now()).first();
  if(Number(count?.n||0)>=5)return json({detail:'End an existing room before starting another.'},429);
  const input=await request.json().catch(()=>({}));
  const title=clean(input.title,120)||'Magnanimous Meeting';
  const id=crypto.randomUUID(),invite=randomInvite(),timestamp=now();
  await env.DB.prepare('INSERT INTO mag_meeting_rooms(id,tenant_id,host_user_id,title,invite_hash,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)')
   .bind(id,tenant,identity,title,await sha256(invite),'waiting',timestamp,timestamp+ROOM_SECONDS).run();
  return json({...roomView({id,title,host_user_id:identity,guest_user_id:null,status:'waiting',expires_at:timestamp+ROOM_SECONDS},user),invite},201);
 }
 const match=path.match(/^\/api\/meet\/rooms\/([^/]+)(?:\/(join|events|leave))?$/);
 if(!match||!ROOM_ID.test(match[1]))return json({detail:'Meeting route not found.'},404);
 const id=match[1],action=match[2]||'';
 const room=await roomFor(env,id,tenant);
 // Deliberately conceal whether a room exists in another tenant.
 if(!room)return json({detail:'Meeting room unavailable.'},404);
 if(room.expires_at<=now()||room.status==='ended')return json({detail:'This meeting has ended or expired.'},410);

 if(action==='join'&&method==='POST'){
  if(member(room,user))return json(roomView(room,user));
  if(room.guest_user_id)return json({detail:'This two-person room is full.'},409);
  const input=await request.json().catch(()=>({}));
  const supplied=clean(input.invite,128);
  if(!/^[a-f0-9]{64}$/.test(supplied)||!equalHashes(await sha256(supplied),room.invite_hash))return json({detail:'Invalid invitation.'},403);
  await env.DB.prepare("UPDATE mag_meeting_rooms SET guest_user_id=?,status='active' WHERE id=? AND tenant_id=? AND guest_user_id IS NULL AND status='waiting' AND expires_at>?")
   .bind(identity,id,tenant,now()).run();
  const updated=await roomFor(env,id,tenant);
  return updated&&member(updated,user)?json(roomView(updated,user)):json({detail:'This meeting is already full.'},409);
 }
 if(!member(room,user))return json({detail:'Only invited room members can access this meeting.'},403);
 if(!action&&method==='GET')return json({...roomView(room,user),ice_servers:iceServers(env)});
 if(action==='events'&&method==='GET'){
  const after=Math.max(0,Math.min(Number(url.searchParams.get('after'))||0,2147483647));
  const result=await env.DB.prepare("SELECT id,sender_user_id,event_type,payload,created_at FROM mag_meeting_events WHERE room_id=? AND id>? AND (event_type='chat' OR sender_user_id<>?) ORDER BY id ASC LIMIT 100")
   .bind(id,after,identity).all();
  const items=(result.results||[]).map(event=>({id:event.id,own:event.sender_user_id===identity,
   type:event.event_type,payload:JSON.parse(event.payload),created_at:event.created_at}));
  return json({room:roomView(room,user),events:items});
 }
 if(action==='events'&&method==='POST'){
  if(!room.guest_user_id)return json({detail:'Wait for the invited participant to join.'},409);
  const input=await request.json().catch(()=>({})),type=clean(input.type,20);
  if(!EVENTS.has(type))return json({detail:'Unsupported meeting event.'},400);
  const payload=eventPayload(type,input.payload);
  if(!payload)return json({detail:'Invalid or oversized event.'},400);
  const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM mag_meeting_events WHERE room_id=?').bind(id).first();
  if(Number(count?.n||0)>=2400)return json({detail:'Room message limit reached. Please start another meeting.'},429);
  await env.DB.prepare('INSERT INTO mag_meeting_events(room_id,sender_user_id,event_type,payload,created_at) VALUES(?,?,?,?,?)')
   .bind(id,identity,type,JSON.stringify(payload),now()).run();
  return json({ok:true},201);
 }
 if(action==='leave'&&method==='POST'){
  await env.DB.prepare("UPDATE mag_meeting_rooms SET status='ended',ended_at=? WHERE id=? AND tenant_id=? AND status<>'ended'")
   .bind(now(),id,tenant).run();
  return json({ended:true});
 }
 return json({detail:'Method not allowed.'},405);
}

export async function pruneExpiredMeetingRooms(env){
 if(!env?.DB)return;
 // Retain a short troubleshooting grace period, then remove text and SDP/ICE.
 const cutoff=now()-24*60*60;
 await env.DB.prepare('DELETE FROM mag_meeting_events WHERE room_id IN (SELECT id FROM mag_meeting_rooms WHERE expires_at<?)').bind(cutoff).run();
 await env.DB.prepare('DELETE FROM mag_meeting_rooms WHERE expires_at<?').bind(cutoff).run();
}
