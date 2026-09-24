'use client';

import {useEffect,useRef,useState} from 'react';
import {Device} from '@twilio/voice-sdk';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import {MagnanimousNativePhone,type NativeBrowserSession} from './native-webrtc';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}

type Config={
 configured:boolean;identity?:string;token?:string;expires_at?:number;caller_id?:string;twiml_app_voice_url?:string;queue_voice_url?:string;required?:string[];free_browser_phone?:string;note?:string;
 native_pbx_live?:boolean;native_session_ready?:boolean;compatibility_transport_ready?:boolean;transport_preference?:string;native_session_url?:string
};
type CallTransport=''|'native'|'compatibility';

export default function Softphone(){
 const[token,setToken]=useState(''),[config,setConfig]=useState<Config>({configured:false}),[status,setStatus]=useState('Loading carrier phone…'),[number,setNumber]=useState(''),[incomingFrom,setIncomingFrom]=useState(''),[error,setError]=useState(''),[muted,setMuted]=useState(false),[compatOnline,setCompatOnline]=useState(false),[nativeOnline,setNativeOnline]=useState(false),[callState,setCallState]=useState('idle'),[callTransport,setCallTransport]=useState<CallTransport>('');
 const deviceRef=useRef<Device|null>(null),callRef=useRef<any>(null),incomingRef=useRef<any>(null),nativeRef=useRef<MagnanimousNativePhone|null>(null),nativeSessionRef=useRef(''),nativeRefreshRef=useRef<ReturnType<typeof setTimeout>|null>(null),remoteAudioRef=useRef<HTMLAudioElement|null>(null);
 const online=compatOnline||nativeOnline;

 useEffect(()=>{const t=getPlatformAuthToken();if(!t){location.replace('/login');return}setToken(t);setup(t);return()=>{if(nativeRefreshRef.current)clearTimeout(nativeRefreshRef.current);try{deviceRef.current?.destroy()}catch{};void cleanupNative(t,false);presence(t,'offline').catch(()=>{})}},[]);

 async function authed(path:string,options:RequestInit={},active=token){const h=new Headers(options.headers||{});h.set('Authorization',`Bearer ${active}`);if(options.body&&!h.has('Content-Type'))h.set('Content-Type','application/json');return fetch(`${api}${path}`,{...options,headers:h})}
 async function presence(active:string,state:string){await authed('/api/phone/agents/me',{method:'PUT',body:JSON.stringify({status:state})},active)}
 async function getConfig(active=token){const r=await authed('/api/contact-center/softphone/config',{},active),d=await read(r);if(!r.ok)throw new Error(d.detail||'Unable to load the carrier softphone.');return d as Config}
 async function requestNativeSession(active:string){const r=await authed('/api/contact-center/softphone/native-session',{method:'POST',body:'{}'},active),d=await read(r);if(!r.ok)throw new Error(d.detail||'Unable to create a native Magnanimous PBX session.');return d as NativeBrowserSession}
 async function revokeNativeSession(active:string,sessionId:string){if(!sessionId)return;await authed(`/api/contact-center/softphone/native-session/${encodeURIComponent(sessionId)}`,{method:'DELETE'},active).catch(()=>{})}

 async function cleanupNative(active=token,updateUi=true){
  if(nativeRefreshRef.current){clearTimeout(nativeRefreshRef.current);nativeRefreshRef.current=null}
  const phone=nativeRef.current;nativeRef.current=null;
  const sessionId=nativeSessionRef.current;nativeSessionRef.current='';
  if(phone)await phone.stop().catch(()=>{});
  if(sessionId&&active)await revokeNativeSession(active,sessionId);
  if(updateUi)setNativeOnline(false);
 }

 async function startNative(cfg:Config,active:string){
  if(!cfg.native_pbx_live||!cfg.native_session_ready||!remoteAudioRef.current)return false;
  await cleanupNative(active,false);
  const session=await requestNativeSession(active);
  if(session.pstn_direct!==false||!session.session_id||!session.username||!session.password||!session.domain||!session.wss_url)throw new Error('Native PBX returned an invalid browser session.');
  nativeSessionRef.current=session.session_id;
  const phone=new MagnanimousNativePhone(session,remoteAudioRef.current,{
   onRegistered:()=>{setNativeOnline(true);setStatus('Native Magnanimous PBX registered');presence(active,'available').catch(()=>{})},
   onUnregistered:()=>setNativeOnline(false),
   onIncoming:()=>{setIncomingFrom('Magnanimous internal call');setCallTransport('native');setCallState('ringing');setStatus('Incoming native PBX call')},
   onAnswered:()=>{setCallTransport('native');setCallState('connected');setStatus('Native PBX call connected');presence(active,'busy').catch(()=>{})},
   onHangup:()=>clearCall('Native PBX call ended'),
   onError:(message)=>{setNativeOnline(false);setError(message)}
  });
  nativeRef.current=phone;
  try{await phone.start()}catch(e){await cleanupNative(active,false);throw e}
  const refreshAt=Math.max(60_000,session.expires_at*1000-Date.now()-120_000);
  nativeRefreshRef.current=setTimeout(()=>{startNative(cfg,active).catch(()=>{setNativeOnline(false);setStatus('Native PBX session expired; compatibility calling remains available.')})},refreshAt);
  return true;
 }

 async function setup(active=token){
  setError('');
  try{
   const cfg=await getConfig(active);setConfig(cfg);
   let nativeStarted=false;
   if(cfg.native_pbx_live&&cfg.native_session_ready){try{nativeStarted=await startNative(cfg,active)}catch(e:any){setError(e?.message||'Native PBX is unavailable; compatibility fallback remains active.')}}
   if(cfg.compatibility_transport_ready&&cfg.token)await createDevice(cfg,active);
   else if(nativeStarted)setStatus('Native PBX ready for internal calling. PSTN compatibility is not configured.');
   else setStatus('Carrier browser phone needs a verified native PBX or compatibility voice credentials.');
  }catch(e:any){setError(e?.message||'Unable to start the carrier softphone.');setStatus('Offline')}
 }

 async function createDevice(cfg:Config,active:string){
  try{deviceRef.current?.destroy()}catch{}
  const device=new Device(String(cfg.token),{closeProtection:true});deviceRef.current=device;
  device.on('registered',async()=>{setCompatOnline(true);if(!nativeOnline)setStatus(`Compatibility PSTN ready as ${cfg.identity||'agent'}`);await presence(active,'available').catch(()=>{})});
  device.on('unregistered',()=>{setCompatOnline(false);if(!nativeOnline)setStatus('Compatibility carrier phone offline')});
  device.on('error',(e:any)=>setError(e?.message||'Carrier voice error.'));
  device.on('tokenWillExpire',async()=>{try{const fresh=await getConfig(active);if(fresh.token){device.updateToken(fresh.token);setConfig(fresh)}}catch{}});
  device.on('incoming',(call:any)=>{incomingRef.current=call;setIncomingFrom(call?.parameters?.From||call?.customParameters?.get?.('From')||'Incoming caller');setCallTransport('compatibility');setCallState('ringing');setStatus('Incoming carrier call');call.on('cancel',()=>clearCall('Caller canceled'));call.on('disconnect',()=>clearCall('Call ended'));call.on('reject',()=>clearCall('Call rejected'))});
  await device.register();
 }

 function bindCompatibilityCall(call:any){callRef.current=call;setCallTransport('compatibility');call.on('accept',()=>{setCallState('connected');setStatus('Carrier call connected')});call.on('disconnect',()=>clearCall('Call ended'));call.on('cancel',()=>clearCall('Call canceled'));call.on('reject',()=>clearCall('Call rejected'));call.on('error',(e:any)=>{setError(e?.message||'Call error');clearCall('Call failed')})}
 function clearCall(label:string){callRef.current=null;incomingRef.current=null;setIncomingFrom('');setMuted(false);setCallState('idle');setCallTransport('');setStatus(label);if(token)presence(token,'available').catch(()=>{})}

 async function accept(){
  try{
   await presence(token,'busy');
   if(callTransport==='native'&&nativeRef.current){await nativeRef.current.answer();setIncomingFrom('');return}
   const call=incomingRef.current;if(!call)return;bindCompatibilityCall(call);call.accept();const sid=call?.parameters?.CallSid;if(sid)await authed('/api/contact-center/softphone/claim',{method:'POST',body:JSON.stringify({call_sid:sid})});setIncomingFrom('');
  }catch(e:any){setError(e?.message||'Could not answer the call.')}
 }

 async function reject(){try{if(callTransport==='native'&&nativeRef.current)await nativeRef.current.decline();else incomingRef.current?.reject()}catch{}clearCall('Call rejected')}

 async function dial(){
  const to=number.trim(),internal=/^\d{2,8}$/.test(to),e164=/^\+[1-9]\d{7,14}$/.test(to);
  if(!internal&&!e164){setError('Enter a Magnanimous internal extension or an E.164 number such as +14155551212.');return}
  setError('');
  try{
   await presence(token,'busy');
   if(internal){
    if(!nativeOnline||!nativeRef.current)throw new Error('Native Magnanimous PBX is not online for internal calling.');
    setCallTransport('native');setStatus(`Calling Magnanimous extension ${to}…`);setCallState('dialing');await nativeRef.current.callInternal(to);setNumber('');return;
   }
   const device=deviceRef.current;if(!device||!compatOnline)throw new Error('Ordinary-number calling still requires the guarded compatibility PSTN route.');
   setStatus(`Calling ${to}…`);setCallState('dialing');const call=await device.connect({params:{To:to}});bindCompatibilityCall(call);setNumber('');
  }catch(e:any){setError(e?.message||'Unable to place the call.');clearCall('Dial failed')}
 }

 async function hangup(){try{if(callTransport==='native'&&nativeRef.current)await nativeRef.current.hangup();else{callRef.current?.disconnect();incomingRef.current?.reject()}}catch{}clearCall('Call ended')}
 async function toggleMute(){const next=!muted;try{if(callTransport==='native'&&nativeRef.current){if(next)await nativeRef.current.mute();else await nativeRef.current.unmute()}else{const call=callRef.current;if(!call)return;call.mute(next)}setMuted(next)}catch{}}

 async function toggleOnline(){
  if(online){
   try{await deviceRef.current?.unregister()}catch{}
   await cleanupNative(token);
   await presence(token,'offline').catch(()=>{});
   setCompatOnline(false);setNativeOnline(false);setStatus('Agent phone offline');return;
  }
  let nativeStarted=false;
  if(config.native_pbx_live&&config.native_session_ready)try{nativeStarted=await startNative(config,token)}catch(e:any){setError(e?.message||'Native PBX registration failed.')}
  if(config.compatibility_transport_ready&&config.token){if(deviceRef.current)await deviceRef.current.register();else await createDevice(config,token)}
  else if(nativeStarted)setStatus('Native PBX ready for internal calling.');
 }

 return <main className="phone"><audio ref={remoteAudioRef} autoPlay hidden/><header><div><a href="/agent-desk">← Agent Desk</a><small>MAGNANIMOUS PROFESSIONAL AGENT PHONE</small><h1>Carrier Softphone</h1><p>Use the owned Magnanimous Asterisk WebRTC rail for internal calls whenever it is production-verified. Ordinary telephone numbers remain behind the guarded compatibility PSTN route until native public-network call control is separately authorized and tested.</p></div><div className={online?'badge live':'badge'}><i/>{nativeOnline?'NATIVE PBX':compatOnline?'PSTN READY':'OFFLINE'}</div></header>{error&&<div className="error">{error}<button onClick={()=>setError('')}>×</button></div>}
 <section className="grid"><article className="dialer"><div className="screen"><small>STATUS</small><strong>{status}</strong><span>{`Native PBX ${nativeOnline?'registered':'offline'} • PSTN compatibility ${compatOnline?'registered':'offline'}`}</span></div>{incomingFrom&&<div className="incoming"><small>{callTransport==='native'?'NATIVE PBX':'INCOMING'}</small><strong>{incomingFrom}</strong><div><button className="answer" onClick={accept}>ANSWER</button><button className="hang" onClick={reject}>DECLINE</button></div></div>}{!incomingFrom&&<><input value={number} onChange={e=>setNumber(e.target.value)} placeholder="+14155551212 or 9000" inputMode="tel"/><div className="controls"><button className="call" onClick={dial} disabled={!online||callState!=='idle'}>CALL</button><button onClick={toggleMute} disabled={callState!=='connected'}>{muted?'UNMUTE':'MUTE'}</button><button className="hang" onClick={hangup} disabled={callState==='idle'}>HANG UP</button></div></>}<button className="presence" onClick={toggleOnline} disabled={!config.configured}>{online?'GO OFFLINE':'GO ONLINE'}</button></article>
 <aside><article><small>NATIVE MAGNANIMOUS PBX</small><strong>{nativeOnline?'REGISTERED':config.native_session_ready?'READY WHEN LIVE':'GATED'}</strong><p>{nativeOnline?'This browser is registered with a short-lived Magnanimous/Asterisk SIP identity. Internal extension calls use the owned WebRTC rail.':'Native registration is allowed only after the public WSS/RTP production verification gate passes.'}</p></article><article><small>ORDINARY NUMBERS</small><strong>{compatOnline?'COMPATIBILITY READY':'FALLBACK GATED'}</strong><p>E.164 PSTN calls remain on the existing guarded compatibility transport so billing, consent, DNC and regulatory controls are not bypassed during migration.</p></article><article><small>FREE FIRST</small><strong>I AM WEBRTC</strong><p>Use free browser-to-browser calling whenever both people can use the platform. This avoids PSTN minute charges entirely.</p><a href="/phone">Open Free Phone →</a></article><article><small>RECORDING</small><strong>OFF BY DEFAULT</strong><p>{config.note||'Recording stays opt-in because consent and recording laws vary by location.'}</p></article></aside></section>
 {!config.configured&&<section className="setup"><h2>Owner setup required</h2><p>The native Telecom Core and any compatibility carrier credentials stay protected in Owner Integrations. Agents never receive the Telecom Core bearer token or carrier secrets.</p><a href="/owner-integrations">Open Owner Integrations →</a></section>}
 <section className="facts"><article><b>Native internal</b><span>Short-lived per-browser SIP identities register to Magnanimous Asterisk and may call approved internal extensions.</span></article><article><b>PSTN boundary</b><span>Public telephone numbers continue through the guarded compatibility route until native PSTN execution is explicitly policy-controlled.</span></article><article><b>Cost control</b><span>Use free browser calling first, owned PBX media for internal calling, then the approved public-network route only when needed.</span></article></section>
 <style jsx>{`.phone{min-height:100vh;background:#050d0b;color:#eafff7;padding:30px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 20% 10%,rgba(55,247,170,.09),transparent 27%),radial-gradient(circle at 90% 70%,rgba(67,115,255,.1),transparent 30%)}header{max-width:1200px;margin:auto;display:flex;justify-content:space-between;gap:20px}header a,.setup a,aside a{color:#6ff0b8;text-decoration:none}header small{display:block;margin-top:18px;color:#58987e;letter-spacing:.18em;font-size:9px}h1{font-size:clamp(48px,7vw,82px);margin:8px 0;line-height:.92}header p{max-width:760px;color:#86aa9b;line-height:1.6}.badge{height:max-content;border:1px solid #4f3337;border-radius:999px;padding:9px 13px;font-size:10px}.badge i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#a95764;margin-right:7px}.badge.live{border-color:#285942}.badge.live i{background:#4ef0a7;box-shadow:0 0 12px #4ef0a7}.error{max-width:1200px;margin:18px auto;background:#39171d;border:1px solid #73313d;padding:13px 16px;border-radius:12px;display:flex;justify-content:space-between}.error button{background:none;border:0;color:#fff}.grid{max-width:1200px;margin:28px auto;display:grid;grid-template-columns:1fr 360px;gap:15px}.dialer,aside article,.setup,.facts article{border:1px solid #1f493a;background:rgba(8,23,18,.86);border-radius:22px;padding:22px}.screen{min-height:150px;background:#020706;border:1px solid #18392d;border-radius:17px;padding:22px;display:flex;flex-direction:column;justify-content:center}.screen small,aside small{color:#5da887;letter-spacing:.16em;font-size:9px}.screen strong{font-size:30px;margin:8px 0}.screen span{color:#6f9182;font-size:11px}.dialer input{width:100%;margin:18px 0;background:#06100d;border:1px solid #2c5d49;border-radius:14px;padding:17px;color:#fff;font-size:24px;letter-spacing:.04em}.controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}.dialer button{border:1px solid #2d5948;background:#10251e;color:#dff8ec;border-radius:12px;padding:14px;font-weight:800;cursor:pointer}.dialer button.call,.answer{background:#55eca5;color:#052016;border-color:#55eca5}.dialer button.hang,.hang{background:#3b171c;border-color:#73313b;color:#ffced3}.dialer button:disabled{opacity:.4;cursor:not-allowed}.presence{width:100%;margin-top:10px}.incoming{margin:18px 0;padding:22px;border:1px solid #3b7b5f;border-radius:17px;background:#0a251a}.incoming small{color:#62eeb0}.incoming strong{display:block;font-size:30px;margin:8px 0 18px}.incoming div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.incoming button{padding:14px;border-radius:11px;font-weight:900}aside{display:grid;gap:11px}aside strong{display:block;font-size:22px;margin:8px 0}aside p,.setup p{color:#779889;line-height:1.55;font-size:12px}.setup{max-width:1200px;margin:15px auto}.facts{max-width:1200px;margin:15px auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.facts b{display:block;color:#5ce9aa;margin-bottom:8px}.facts span{color:#799b8b;font-size:12px;line-height:1.55}@media(max-width:800px){.phone{padding:18px 13px 50px}header{display:block}.badge{display:inline-block;margin-top:12px}.grid,.facts{grid-template-columns:1fr}.controls{grid-template-columns:1fr 1fr}.controls .call{grid-column:1/-1}}`}</style></main>
}
