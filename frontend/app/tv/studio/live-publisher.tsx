'use client';
import {useEffect,useRef,useState} from 'react';
import styles from './live-publisher.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Props={stationId:string;stationName:string;authToken:string};
type MediaStatus={configured:boolean;host:string|null;publish_protocol:string;playback_protocols:string[];viewer_limit_per_station:number};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||'Request failed.'}}}
function waitForIce(pc:RTCPeerConnection,timeout=10000){if(pc.iceGatheringState==='complete')return Promise.resolve();return new Promise<void>(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;pc.removeEventListener('icegatheringstatechange',changed);window.clearTimeout(timer);resolve()};const changed=()=>{if(pc.iceGatheringState==='complete')finish()};const timer=window.setTimeout(finish,timeout);pc.addEventListener('icegatheringstatechange',changed)})}

export default function LivePublisher({stationId,stationName,authToken}:Props){
 const canvasRef=useRef<HTMLCanvasElement|null>(null),videoRef=useRef<HTMLVideoElement|null>(null),pcRef=useRef<RTCPeerConnection|null>(null),cameraRef=useRef<MediaStream|null>(null),canvasStreamRef=useRef<MediaStream|null>(null),resourceRef=useRef(''),publishTokenRef=useRef(''),rafRef=useRef<number|null>(null),titleRef=useRef(stationName),lowerRef=useRef(true);
 const[media,setMedia]=useState<MediaStatus|null>(null),[status,setStatus]=useState<'idle'|'connecting'|'live'|'error'>('idle'),[error,setError]=useState(''),[stageTitle,setStageTitle]=useState(stationName),[showLower,setShowLower]=useState(true);
 useEffect(()=>{titleRef.current=stageTitle},[stageTitle]);
 useEffect(()=>{lowerRef.current=showLower},[showLower]);
 useEffect(()=>{let active=true;fetch(api+'/api/tv/media/status',{cache:'no-store'}).then(read).then(d=>{if(active)setMedia(d)}).catch(()=>{if(active)setMedia({configured:false,host:null,publish_protocol:'WHIP/WebRTC',playback_protocols:['HLS','WHEP'],viewer_limit_per_station:10})});return()=>{active=false}},[]);
 function stopDrawing(){if(rafRef.current!==null){cancelAnimationFrame(rafRef.current);rafRef.current=null}}
 function drawStage(){
  const canvas=canvasRef.current,video=videoRef.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
  const draw=()=>{ctx.fillStyle='#08111f';ctx.fillRect(0,0,1280,720);if(video&&video.readyState>=2){const vw=video.videoWidth||1280,vh=video.videoHeight||720,scale=Math.max(1280/vw,720/vh),dw=vw*scale,dh=vh*scale;ctx.drawImage(video,(1280-dw)/2,(720-dh)/2,dw,dh)}else{const g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#16365a');g.addColorStop(1,'#080d17');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);ctx.fillStyle='#e4c77f';ctx.font='bold 34px Arial';ctx.fillText('MAGNANIMOUS TV',48,92)}
   ctx.fillStyle='rgba(5,12,23,.84)';ctx.fillRect(0,610,1280,110);
   ctx.fillStyle='#e4c77f';ctx.font='bold 20px Arial';ctx.fillText('I AM MAGNANIMOUS WAY™  ·  MAGNANIMOUS TV',48,660);
   if(lowerRef.current){ctx.fillStyle='#ffffff';ctx.font='bold 34px Arial';ctx.fillText(titleRef.current.slice(0,52),48,710)}
   ctx.fillStyle='#e4c77f';ctx.fillRect(1100,38,130,48);ctx.fillStyle='#101827';ctx.font='bold 20px Arial';ctx.fillText('LIVE',1138,70);
   rafRef.current=requestAnimationFrame(draw)
  };draw()
 }
 async function stop(){
  stopDrawing();
  const pc=pcRef.current;pcRef.current=null;
  const token=publishTokenRef.current,resource=resourceRef.current;resourceRef.current='';publishTokenRef.current='';
  if(resource&&token)void fetch(resource,{method:'DELETE',headers:{Authorization:'Bearer '+token}}).catch(()=>{});
  pc?.close();
  cameraRef.current?.getTracks().forEach(t=>t.stop());cameraRef.current=null;
  canvasStreamRef.current?.getTracks().forEach(t=>t.stop());canvasStreamRef.current=null;
  if(videoRef.current)videoRef.current.srcObject=null;
  setStatus('idle')
 }
 async function start(){
  if(!authToken){setError('Sign in to Magnanimous before broadcasting.');return}
  if(!media?.configured){setError('The media server has not been provisioned yet. Your station is ready, but live broadcasting is not active.');return}
  setError('');setStatus('connecting');
  try{
   const tokenResponse=await fetch(api+'/api/tv/stations/'+encodeURIComponent(stationId)+'/publish-token',{method:'POST',headers:{Authorization:'Bearer '+authToken}});
   const tokenData=await read(tokenResponse);if(!tokenResponse.ok)throw new Error(tokenData.detail||'Could not authorize this station.');
   publishTokenRef.current=tokenData.token;
   const camera=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}},audio:{echoCancellation:true,noiseSuppression:true}});
   cameraRef.current=camera;
   if(!videoRef.current||!canvasRef.current)throw new Error('The broadcast stage is not ready.');
   videoRef.current.srcObject=camera;await videoRef.current.play();
   drawStage();
   const canvasStream=canvasRef.current.captureStream(30);canvasStreamRef.current=canvasStream;
   const outgoing=new MediaStream([...canvasStream.getVideoTracks(),...camera.getAudioTracks()]);
   const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});pcRef.current=pc;
   outgoing.getTracks().forEach(track=>pc.addTrack(track,outgoing));
   pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='disconnected'){setStatus('error');setError('The live connection was interrupted. Stop and try again when the network is stable.')}};
   const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitForIce(pc);
   const response=await fetch(tokenData.publish_url,{method:'POST',headers:{Authorization:'Bearer '+tokenData.token,'Content-Type':'application/sdp','Accept':'application/sdp'},body:pc.localDescription?.sdp||offer.sdp});
   if(!response.ok)throw new Error('Media server rejected the live connection ('+response.status+').');
   const answer=await response.text();const location=response.headers.get('Location');if(location)resourceRef.current=new URL(location,tokenData.publish_url).toString();
   await pc.setRemoteDescription({type:'answer',sdp:answer});setStatus('live');
  }catch(e:any){await stop();setStatus('error');setError(e?.message||'Could not start the live broadcast.')}
 }
 useEffect(()=>()=>{stopDrawing();pcRef.current?.close();cameraRef.current?.getTracks().forEach(t=>t.stop());canvasStreamRef.current?.getTracks().forEach(t=>t.stop())},[]);
 return <section className={styles.panel}>
  <div className={styles.heading}><div><p className={styles.eyebrow}>LIVE BROADCAST STAGE</p><h4>Go live from your phone or computer</h4><p>Your camera and microphone feed a branded Magnanimous stage. The lower-third can be changed while you prepare.</p></div><span className={status==='live'?styles.live:styles.status}>{status==='live'?'LIVE':status==='connecting'?'CONNECTING':status==='error'?'NEEDS ATTENTION':media?.configured?'READY':'MEDIA HOST PENDING'}</span></div>
  <div className={styles.stage}><video ref={videoRef} className={styles.hiddenVideo} playsInline muted/><canvas ref={canvasRef} width={1280} height={720} className={styles.canvas}/></div>
  <div className={styles.controls}><label>Lower-third title<input value={stageTitle} onChange={e=>setStageTitle(e.target.value)} maxLength={52}/></label><label className={styles.toggle}><input type="checkbox" checked={showLower} onChange={e=>setShowLower(e.target.checked)}/> Show title</label>
   {status==='live'?<button className={styles.stop} onClick={()=>void stop()}>Stop broadcast</button>:<button className={styles.start} disabled={!media?.configured||status==='connecting'} onClick={()=>void start()}>{status==='connecting'?'Connecting…':'Start live broadcast'}</button>}
  </div>
  {!media?.configured&&<p className={styles.pending}>Live ingest is not active yet. The separate MediaMTX server package is prepared, but a free host, DNS record and firewall setup are still required. No paid server has been activated.</p>}
  {error&&<p className={styles.error}>{error}</p>}
  <p className={styles.footnote}>WHIP/WebRTC publishing · 720p target · 10 concurrent viewers per station in the initial free pilot · Keep your temporary publish token private.</p>
 </section>;
}
