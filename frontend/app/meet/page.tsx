'use client';

import {useEffect,useRef,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Room={room_id:string;title:string;role:'host'|'guest';guest_joined:boolean;status:string;expires_at:number;participants:number;max_participants:2;ice_servers?:RTCIceServer[]};
type EventItem={id:number;own:boolean;type:string;payload:any;created_at:number};
type Message={id:number;own:boolean;text:string;time:number};

async function read(response:Response){
 const value=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(new Error(value.detail||`Meeting request failed (${response.status}).`),{status:response.status});
 return value;
}

export default function Meet(){
 const [token,setToken]=useState(''),[title,setTitle]=useState('Magnanimous Meeting');
 const [room,setRoom]=useState<Room|null>(null),[invite,setInvite]=useState('');
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('Ready to create a private meeting.');
 const [error,setError]=useState(''),[messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState('');
 const [muted,setMuted]=useState(false),[cameraOff,setCameraOff]=useState(false),[sharing,setSharing]=useState(false);
 const localVideo=useRef<HTMLVideoElement>(null),remoteVideo=useRef<HTMLVideoElement>(null);
 const localStream=useRef<MediaStream|null>(null),peer=useRef<RTCPeerConnection|null>(null),screenTrack=useRef<MediaStreamTrack|null>(null);
 const tokenRef=useRef(''),roomRef=useRef<Room|null>(null),lastEvent=useRef(0),pendingIce=useRef<RTCIceCandidateInit[]>([]),offered=useRef(false);

 async function request(path:string,method='GET',body?:unknown){
  return read(await fetch(`${api}${path}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${tokenRef.current}`,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)}));
 }
 function cleanup(){
  peer.current?.close();peer.current=null;
  screenTrack.current?.stop();screenTrack.current=null;
  localStream.current?.getTracks().forEach(t=>t.stop());localStream.current=null;
  if(localVideo.current)localVideo.current.srcObject=null;
  if(remoteVideo.current)remoteVideo.current.srcObject=null;
  roomRef.current=null;lastEvent.current=0;offered.current=false;pendingIce.current=[];
  setSharing(false);setRoom(null);setInvite('');setMessages([]);setMuted(false);setCameraOff(false);
 }
 async function startMedia(){
  if(!navigator.mediaDevices?.getUserMedia){setStatus('This browser needs HTTPS and camera/microphone permissions. Chat is still available.');return;}
  try{
   let media:MediaStream;
   try{media=await navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:'user'}});}
   catch{media=await navigator.mediaDevices.getUserMedia({audio:true,video:false});setCameraOff(true);}
   localStream.current=media;
   if(localVideo.current)localVideo.current.srcObject=media;
  }catch{setStatus('Camera or microphone unavailable. You can still use room chat.');}
 }
 async function sendEvent(id:string,type:string,payload:unknown){
  return request(`/api/meet/rooms/${encodeURIComponent(id)}/events`,'POST',{type,payload});
 }
 function ensurePeer(current:Room){
  if(peer.current)return peer.current;
  const connection=new RTCPeerConnection({iceServers:current.ice_servers||[]});
  peer.current=connection;
  const tracks=localStream.current?.getTracks()||[];
  for(const track of tracks)connection.addTrack(track,localStream.current!);
  if(!tracks.some(t=>t.kind==='video'))connection.addTransceiver('video',{direction:'recvonly'});
  if(!tracks.some(t=>t.kind==='audio'))connection.addTransceiver('audio',{direction:'recvonly'});
  const fallbackRemote=new MediaStream();
  connection.ontrack=e=>{
   if(!e.streams[0]&&!fallbackRemote.getTracks().some(track=>track.id===e.track.id))fallbackRemote.addTrack(e.track);
   const remote=e.streams[0]||fallbackRemote;
   if(remoteVideo.current)remoteVideo.current.srcObject=remote;
  };
  connection.onicecandidate=e=>{if(e.candidate)sendEvent(current.room_id,'candidate',e.candidate.toJSON()).catch(()=>setStatus('Network candidate could not be delivered.'));};
  connection.onconnectionstatechange=()=>{
   const names:Record<string,string>={new:'Preparing…',connecting:'Connecting video…',connected:'Connected via browser WebRTC',disconnected:'Connection interrupted',failed:'Media connection failed. A TURN relay may be needed.',closed:'Meeting closed'};
   setStatus(names[connection.connectionState]||connection.connectionState);
  };
  return connection;
 }
 async function flushCandidates(connection:RTCPeerConnection){
  for(const candidate of pendingIce.current.splice(0))await connection.addIceCandidate(candidate).catch(()=>{});
 }
 async function makeOffer(current:Room){
  if(offered.current)return;
  offered.current=true;
  try{
   const connection=ensurePeer(current),offer=await connection.createOffer();
   await connection.setLocalDescription(offer);
   await sendEvent(current.room_id,'offer',offer);
   setStatus('Invited participant is connecting…');
  }catch(e:any){offered.current=false;setError(e.message||'Could not start the video connection.');}
 }
 async function openRoom(id:string,key=''){
  setBusy(true);setError('');
  try{
   let data:Room;
   try{data=await request(`/api/meet/rooms/${encodeURIComponent(id)}`);}
   catch(e:any){
    if(e.status!==403||!key)throw e;
    await request(`/api/meet/rooms/${encodeURIComponent(id)}/join`,'POST',{invite:key});
    data=await request(`/api/meet/rooms/${encodeURIComponent(id)}`);
   }
   await startMedia();
   roomRef.current=data;setRoom(data);setStatus(data.guest_joined?'Joining meeting…':'Waiting for another signed-in workspace member…');
   history.replaceState({},'',`/meet?room=${encodeURIComponent(id)}`);
  }catch(e:any){setError(e.message||'Could not join this meeting.');}
  finally{setBusy(false);}
 }
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){location.replace(`/login?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`);return;}
  tokenRef.current=t;setToken(t);
  const id=new URLSearchParams(location.search).get('room')||'';
  if(id){const key=new URLSearchParams(location.hash.slice(1)).get('invite')||'';void openRoom(id,key);}
  return()=>{peer.current?.close();screenTrack.current?.stop();localStream.current?.getTracks().forEach(track=>track.stop());};
 // Auth and deep link are captured only when this page first mounts.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  if(localVideo.current&&localStream.current)localVideo.current.srcObject=localStream.current;
 },[room?.room_id]);
 useEffect(()=>{
  if(!room||!token)return;
  let disposed=false,running=false;
  const poll=async()=>{
   if(disposed||running)return;running=true;
   try{
    const data=await request(`/api/meet/rooms/${encodeURIComponent(room.room_id)}/events?after=${lastEvent.current}`);
    const current:Room={...data.room,ice_servers:roomRef.current?.ice_servers};
    roomRef.current=current;
    if(current.guest_joined!==roomRefState.guest_joined){setRoom(previous=>previous?{...previous,...data.room}:previous);roomRefState.guest_joined=current.guest_joined;}
    for(const item of data.events as EventItem[]){
     if(item.id<=lastEvent.current)continue;
     lastEvent.current=item.id;
     if(item.type==='chat')setMessages(previous=>[...previous,{id:item.id,own:item.own,text:item.payload.text,time:item.created_at}].slice(-100));
     else if(!item.own&&item.type==='offer'&&current.role==='guest'){
      const p=ensurePeer(current);
      if(!p.remoteDescription){
       await p.setRemoteDescription(item.payload);await flushCandidates(p);
       const answer=await p.createAnswer();await p.setLocalDescription(answer);
       await sendEvent(current.room_id,'answer',answer);
      }
     }else if(!item.own&&item.type==='answer'&&current.role==='host'){
      const p=peer.current;if(p&&!p.remoteDescription){await p.setRemoteDescription(item.payload);await flushCandidates(p);}
     }else if(!item.own&&item.type==='candidate'){
      if(peer.current?.remoteDescription)await peer.current.addIceCandidate(item.payload).catch(()=>{});
      else pendingIce.current.push(item.payload);
     }
    }
    if(current.role==='host'&&current.guest_joined&&!offered.current)await makeOffer(current);
   }catch(e:any){
    if(e.status===410){cleanup();setStatus('This meeting ended or expired.');}
    else if(!disposed)setError(e.message||'Meeting connection interrupted.');
   }finally{running=false;}
  };
  const roomRefState={guest_joined:room.guest_joined};
  void poll();const timer=setInterval(poll,2500);
  return()=>{disposed=true;clearInterval(timer);};
 // Room ID and credentials determine the polling lifecycle.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[room?.room_id,token]);
 async function createRoom(){
  setBusy(true);setError('');
  try{
   const data=await request('/api/meet/rooms','POST',{title});
   const key=String(data.invite||'');setInvite(key);
   await startMedia();
   const result=await request(`/api/meet/rooms/${encodeURIComponent(data.room_id)}`);
   roomRef.current=result;setRoom(result);setStatus('Room created. Copy the private invitation to invite one teammate.');
   history.replaceState({},'',`/meet?room=${encodeURIComponent(data.room_id)}`);
  }catch(e:any){setError(e.message||'Could not create the room.');}finally{setBusy(false);}
 }
 async function copyInvite(){
  if(!room||!invite)return;
  try{await navigator.clipboard.writeText(`${location.origin}/meet?room=${encodeURIComponent(room.room_id)}#invite=${encodeURIComponent(invite)}`);setStatus('Invitation copied. Share it privately with a member of this workspace.');}
  catch{setError('Your browser could not copy the link. Please allow clipboard access.');}
 }
 async function submitChat(e:React.FormEvent){
  e.preventDefault();if(!room||!draft.trim())return;
  try{await sendEvent(room.room_id,'chat',{text:draft.trim()});setDraft('');}
  catch(e:any){setError(e.message||'Message was not sent.');}
 }
 async function shareScreen(){
  if(!peer.current||!room?.guest_joined)return setError('Connect the video call before sharing your screen.');
  if(!navigator.mediaDevices?.getDisplayMedia)return setError('Screen sharing is not available in this browser.');
  try{
   const media=await navigator.mediaDevices.getDisplayMedia({video:true});
   const track=media.getVideoTracks()[0];
   const sender=peer.current.getSenders().find(s=>s.track?.kind==='video');
   if(!sender){track.stop();return setError('Start with camera access to enable screen sharing in this call.');}
   await sender.replaceTrack(track);screenTrack.current=track;setSharing(true);
   track.onended=()=>{void sender.replaceTrack(localStream.current?.getVideoTracks()[0]||null).then(()=>setSharing(false)).catch(()=>setSharing(false));screenTrack.current=null;};
  }catch(e:any){setError(e.message||'Screen sharing was cancelled.');}
 }
 function toggleAudio(){const track=localStream.current?.getAudioTracks()[0];if(track){track.enabled=!track.enabled;setMuted(!track.enabled);}}
 function toggleCamera(){const track=localStream.current?.getVideoTracks()[0];if(track){track.enabled=!track.enabled;setCameraOff(!track.enabled);}}
 async function endRoom(){
  if(room){try{await request(`/api/meet/rooms/${encodeURIComponent(room.room_id)}/leave`,'POST',{});}catch{}}
  cleanup();history.replaceState({},'','/meet');setStatus('Meeting ended.');
 }
 return <main className="meet">
  <header><a href="/">← I AM MAGNANIMOUS WAY™</a><span>MAGNANIMOUS MEET</span><a href="/phone">Free Phone</a></header>
  <section className="intro"><small>NATIVE BROWSER COMMUNICATION</small><h1>Private meetings, made simple.</h1><p>Video, voice, screen sharing and room chat in one Magnanimous workspace. No paid meeting SDK required.</p></section>
  {error&&<div className="alert" role="alert">{error}<button onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
  {!room?<section className="setup"><label htmlFor="title">Meeting name</label><input id="title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/><button onClick={createRoom} disabled={busy||!token}>{busy?'Preparing meeting…':'Create private meeting →'}</button><p>Both participants must sign in to the same Magnanimous workspace. Invitations expire after 90 minutes.</p></section>:
   <section className="room"><div className="roomTitle"><div><small>{room.role==='host'?'HOST':'INVITED PARTICIPANT'} • {room.participants}/2 PEOPLE</small><h2>{room.title}</h2><p role="status">{status}</p></div><div className="actions">{invite&&<button onClick={copyInvite}>Copy invitation</button>}<button className="danger" onClick={endRoom}>End meeting</button></div></div>
    <div className="workspace"><div className="stage"><div className="videos"><div className="video"><video ref={remoteVideo} autoPlay playsInline/><span>Other participant</span>{!room.guest_joined&&<div className="waiting">Waiting for guest…</div>}</div><div className="video self"><video ref={localVideo} autoPlay muted playsInline/><span>You</span></div></div><div className="controls"><button onClick={toggleAudio} disabled={!localStream.current?.getAudioTracks().length}>{muted?'Unmute':'Mute'}</button><button onClick={toggleCamera} disabled={!localStream.current?.getVideoTracks().length}>{cameraOff?'Camera on':'Camera off'}</button><button onClick={shareScreen} disabled={!room.guest_joined||sharing}>{sharing?'Sharing screen':'Share screen'}</button></div></div><aside className="chat"><h3>Room chat</h3><div className="messages" aria-live="polite">{messages.length===0?<p className="empty">Messages from this meeting appear here.</p>:messages.map(m=><div className={m.own?'mine':'theirs'} key={m.id}><small>{m.own?'You':'Guest'} · {new Date(m.time*1000).toLocaleTimeString()}</small><p>{m.text}</p></div>)}</div><form onSubmit={submitChat}><input aria-label="Message" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1000} placeholder="Type a message…" disabled={!room.guest_joined}/><button disabled={!draft.trim()||!room.guest_joined} type="submit">Send</button></form></aside></div>
   </section>}
  <p className="fine">Two-person beta. Camera and microphone require HTTPS and your permission. Media is peer-to-peer when the networks allow it; some networks require a separately configured TURN relay. Chat/signaling are stored on Magnanimous servers and removed by scheduled retention cleanup. Room chat is not end-to-end encrypted. No recordings are made.</p>
  <style jsx>{`
  *{box-sizing:border-box}.meet{min-height:100vh;background:radial-gradient(circle at 85% 0,rgba(113,71,213,.18),transparent 38%),#060916;color:#eff6ff;font-family:Inter,system-ui,sans-serif;padding-bottom:35px}header{display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:66px;padding:16px max(20px,calc((100vw - 1200px)/2));border-bottom:1px solid #273351}header a{color:#adbbd8;text-decoration:none;font-size:12px}header span{color:#9de6ff;font-size:11px;font-weight:900;letter-spacing:.12em}.intro,.setup,.room,.alert,.fine{width:min(1180px,calc(100% - 36px));margin-left:auto;margin-right:auto}.intro{padding:42px 0 24px}.intro small,.roomTitle small{font-size:10px;letter-spacing:.16em;font-weight:900;color:#8feaff}.intro h1{font-size:clamp(32px,5vw,54px);margin:10px 0}.intro p,.fine,.setup p,.roomTitle p{color:#aab7cf;line-height:1.55;font-size:13px}.setup{border:1px solid #304263;border-radius:22px;background:#10182c;padding:28px;max-width:620px;display:grid;gap:14px}.setup label{font-weight:700}.setup input,.chat input{background:#070e1d;color:white;border:1px solid #3a496b;border-radius:10px;padding:13px;font:inherit;min-width:0}.setup button,.actions button,.controls button,.chat button{border:1px solid #4d78a0;background:#1b3655;color:#eff8ff;border-radius:10px;padding:12px 15px;font-weight:800;cursor:pointer}.setup button{background:linear-gradient(90deg,#65daeb,#a18aff);color:#071625}.setup button:disabled,.controls button:disabled,.chat button:disabled{opacity:.5;cursor:not-allowed}.roomTitle{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:17px;flex-wrap:wrap}.roomTitle h2{margin:8px 0;font-size:25px}.actions,.controls{display:flex;flex-wrap:wrap;gap:8px}.actions .danger{border-color:#865061;background:#492139}.workspace{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:16px}.stage,.chat{border:1px solid #283853;background:#0f1628;border-radius:20px;overflow:hidden}.videos{display:grid;grid-template-columns:2fr 1fr;gap:10px;padding:10px}.video{aspect-ratio:4/3;min-height:180px;background:#040812;border-radius:14px;position:relative;overflow:hidden}.video video{width:100%;height:100%;object-fit:cover}.video.self video{transform:scaleX(-1)}.video span{position:absolute;left:12px;bottom:10px;background:#081023d9;padding:6px 9px;border-radius:8px;font-size:11px}.waiting{position:absolute;inset:0;display:grid;place-items:center;color:#8293ae}.controls{border-top:1px solid #293750;padding:14px}.chat{display:flex;flex-direction:column;min-height:370px}.chat h3{margin:0;padding:18px;border-bottom:1px solid #273750}.messages{overflow:auto;flex:1;min-height:250px;max-height:480px;padding:14px;display:flex;flex-direction:column;gap:9px}.messages>div{max-width:92%;border-radius:11px;padding:9px;background:#1d2c48;overflow-wrap:anywhere}.messages .mine{align-self:flex-end;background:#264d5c}.messages small{font-size:10px;color:#b1c8d9}.messages p{margin:5px 0;font-size:13px;white-space:pre-wrap}.empty{color:#90a4be;font-size:12px}.chat form{display:flex;gap:6px;padding:10px;border-top:1px solid #283853}.chat input{flex:1;font-size:12px}.alert{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #c76c70;background:#411e2d;padding:12px 16px;border-radius:12px;margin-bottom:20px}.alert button{border:0;background:none;color:white;font-size:24px;cursor:pointer}.fine{margin-top:22px;font-size:11px}@media(max-width:800px){.workspace{grid-template-columns:1fr}.videos{grid-template-columns:1fr 1fr}.video{min-height:140px}.chat{min-height:320px}.intro{padding-top:27px}}@media(max-width:480px){header span{display:none}.videos{display:flex;flex-direction:column}.video{min-height:230px}.video.self{min-height:130px;max-height:180px}.roomTitle h2{font-size:20px}.setup{padding:18px}}
  `}</style>
 </main>;
}
