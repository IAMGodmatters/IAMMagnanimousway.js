'use client';

import {useEffect,useState} from 'react';

type Pair = {session_id:string;remote_token:string;expires_at:number};
type Favorite = {label:string;url:string};
type Action = 'navigate'|'back'|'forward'|'reload'|'home'|'up'|'down'|'left'|'right'|'select'|'playpause'|'fullscreen'|'seek-back'|'seek-forward'|'volume-up'|'volume-down';
const STORAGE_KEY='magnanimous_tv_remote_session';
const FAVORITES_KEY='magnanimous_tv_remote_favorites';
const API='/api/tv-companion';

function safeFavorite(input:string){
 try{
  const url=new URL(input.trim());
  if(url.protocol!=='https:'||url.username||url.password||url.href.length>1024)return null;
  // Match the TV receiver and relay: a final DNS dot does not make a LAN host public.
  const host=url.hostname.toLowerCase().replace(/\.+$/,'');
  if(!host.includes('.')||host.endsWith('.local')||host.endsWith('.localhost')||host.endsWith('.internal')||host.includes(':')||/^\d+(?:\.\d+){3}$/.test(host))return null;
  for(const key of url.searchParams.keys())if(/token|passw|secret|auth|api_key|client_secret|^code$/i.test(key))return null;
  return url.href;
 }catch{return null}
}

async function reply(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return {detail:'The service returned an unexpected response.'}}
}

export default function TvRemote(){
 const [code,setCode]=useState('');
 const [pair,setPair]=useState<Pair|null>(null);
 const [address,setAddress]=useState('https://drive.google.com/drive/u/0/my-drive');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [favorites,setFavorites]=useState<Favorite[]>([]);
 useEffect(()=>{
  document.documentElement.dataset.iamStandalone='true';
  try{
   const saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null') as Pair|null;
   if(saved?.remote_token&&saved?.session_id&&saved.expires_at>Date.now()/1000)setPair(saved);
  }catch{}
  try{
   const saved=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]') as Favorite[];
   if(Array.isArray(saved))setFavorites(saved.filter(item=>typeof item?.label==='string'&&typeof item?.url==='string'&&safeFavorite(item.url)).slice(0,12));
  }catch{}
  return()=>{delete document.documentElement.dataset.iamStandalone};
 },[]);

 function saveFavorite(){
  const url=safeFavorite(address);
  if(!url)return setMessage('Enter a safe HTTPS movie or website link without private credentials.');
  if(favorites.some(item=>item.url===url))return setMessage('That link is already saved.');
  if(favorites.length>=12)return setMessage('Remove an old favorite before adding another.');
  const label=new URL(url).hostname.replace(/^www\./,'');
  const next=[...favorites,{label,url}];
  localStorage.setItem(FAVORITES_KEY,JSON.stringify(next));setFavorites(next);
  setMessage('Saved on this phone only.');
 }

 function removeFavorite(url:string){
  const next=favorites.filter(item=>item.url!==url);
  localStorage.setItem(FAVORITES_KEY,JSON.stringify(next));setFavorites(next);
  setMessage('Favorite removed from this phone.');
 }

 async function connect(){
  if(code.replace(/[-\s]/g,'').length!==10)return setMessage('Enter the ten characters displayed on the TV.');
  setBusy(true);setMessage('Connecting securely…');
  try{
   const response=await fetch(`${API}/pair`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code}),cache:'no-store'});
   const data=await reply(response);
   if(!response.ok)throw new Error(data.detail||'Unable to connect.');
   const connected:Pair={session_id:data.session_id,remote_token:data.remote_token,expires_at:data.expires_at};
   sessionStorage.setItem(STORAGE_KEY,JSON.stringify(connected));
   setPair(connected);setMessage('Pairing accepted. Keep the TV browser open and online to receive commands.');
  }catch(error){setMessage(error instanceof Error?error.message:'Connection failed.')}finally{setBusy(false)}
 }

 async function send(action:Action,value=''){
  if(!pair||busy)return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch(`${API}/command`,{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${pair.remote_token}`},body:JSON.stringify({session_id:pair.session_id,action,value}),cache:'no-store'});
   const data=await reply(response);
   if(!response.ok){
    if(response.status===401){sessionStorage.removeItem(STORAGE_KEY);setPair(null)}
    throw new Error(data.detail||'The TV did not accept this command.');
   }
   if(action==='navigate')setMessage('Website sent to TV.');
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to reach your TV.')}finally{setBusy(false)}
 }

 async function disconnect(){
  if(!pair||busy)return;
  setBusy(true);setMessage('Disconnecting securely…');
  try{
   const response=await fetch(`${API}/disconnect`,{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${pair.remote_token}`},body:JSON.stringify({session_id:pair.session_id}),cache:'no-store'});
   const data=await reply(response);
   if(response.status===401){
    // The server no longer recognizes this session: the TV has already
    // revoked it, or it expired. Do not claim this request performed revocation.
    sessionStorage.removeItem(STORAGE_KEY);setPair(null);setCode('');
    setMessage('TV pairing is no longer active. Enter a new code to reconnect.');
    return;
   }
   if(!response.ok||data.disconnected!==true)throw new Error(data.detail||'Disconnect was not confirmed. Please try again.');
   sessionStorage.removeItem(STORAGE_KEY);setPair(null);setCode('');setMessage('Disconnected.');
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to confirm disconnect. Please try again.')}finally{setBusy(false)}
 }

 const control=(action:Action,label:string,extra='')=><button type="button" disabled={busy} className={`key ${extra}`} onClick={()=>send(action)} aria-label={label}>{label}</button>;
 return <main className="remote"><div className="wrap">
  <header><a href="/" aria-label="Return to I AM Magnanimous Way">✦ I AM MAGNANIMOUS WAY™</a><span className="pill">MAGNANIMOUS TV</span></header>
  <section className="intro"><span className="eyebrow">YOUR PHONE. YOUR TELEVISION. ONE EXPERIENCE.</span><h1>TV Browser Remote</h1><p>Control your Magnanimous TV browser from your iPhone. Your Google login and video files stay on your devices and with Google—not in the remote-control service.</p></section>
  {!pair?<section className="panel pairing"><span className="step">STEP 1 — CONNECT</span><h2>Enter the code on your TV</h2><p>Open the Magnanimous TV Browser on your Android / Google TV. Type its 10-character pairing code here. Codes expire after five minutes.</p><label htmlFor="pair-code">TV pairing code</label><input id="pair-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" maxLength={12} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9\s-]/g,''))} placeholder="ABCDEFGHIJ"/><button type="button" className="primary" onClick={connect} disabled={busy}>{busy?'Connecting…':'Connect to my TV →'}</button></section>
  :<><section className="panel"><div className="connected"><span className="dot"/><div><b>TV paired</b><small>Commands are sent over an encrypted connection</small></div><button type="button" className="disconnect" onClick={disconnect} disabled={busy}>{busy?'Disconnecting…':'Disconnect'}</button></div>
   <div className="url"><label htmlFor="tv-address">Open a website or movie link on the TV</label><form onSubmit={e=>{e.preventDefault();send('navigate',address)}}><input id="tv-address" aria-label="Website HTTPS address" type="url" required value={address} onChange={e=>setAddress(e.target.value)} placeholder="https://drive.google.com"/><button type="submit" disabled={busy}>Open ↗</button></form><div className="row"><button type="button" className="quick" onClick={()=>send('navigate','https://drive.google.com/drive/u/0/my-drive')}>▸ Open Google Drive</button><button type="button" className="quick" onClick={saveFavorite}>☆ Save this link</button></div><p className="hint">For a movie, copy its HTTPS sharing link from Google Drive on your iPhone and paste it above. Private files still require authorized access on your TV. Google may block sign-in inside a TV browser.</p></div>
  {favorites.length>0&&<div className="favorites"><span className="step">SAVED ON THIS PHONE</span>{favorites.map(item=><div className="favorite" key={item.url}><button type="button" disabled={busy} onClick={()=>send('navigate',item.url)} title={item.url}>▶ {item.label}</button><button type="button" className="remove" onClick={()=>removeFavorite(item.url)} aria-label={`Remove ${item.label}`}>×</button></div>)}</div>}
  </section><section className="panel pad"><span className="step">NAVIGATE</span><div className="directions"><span/>{control('up','↑')}<span/>{control('left','←')}{control('select','OK','select')}{control('right','→')}<span/>{control('down','↓')}<span/></div><div className="row">{control('back','← Back')}{control('forward','Forward →')}{control('home','⌂ Home')}{control('reload','↻ Reload')}</div></section>
   <section className="panel"><span className="step">WATCH</span><div className="row media">{control('seek-back','− 10s')}{control('playpause','⏯ Play / Pause')}{control('seek-forward','+ 10s')}</div><div className="row">{control('volume-down','Volume −')}{control('volume-up','Volume +')}{control('fullscreen','⛶ Full screen')}</div><p className="hint">Some websites—including certain Google Drive player screens—handle video shortcuts differently. The direction keys can still navigate focused controls.</p></section></>}
  {message&&<p className="notice" role="status">{message}</p>}
  <footer>Free-first • No advertising SDK • Secure one-to-one pairing • <a href="/privacy">Privacy</a></footer>
  </div><style jsx>{`
   .remote{min-height:100dvh;color:#eef7ff;background:radial-gradient(circle at 90% 4%,#15345d 0,transparent 38%),radial-gradient(circle at 10% 80%,#123047 0,transparent 30%),#030915;font:500 16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px 16px 50px}.wrap{max-width:670px;margin:auto}header{display:flex;align-items:center;justify-content:space-between;gap:12px}header a{font-size:12px;font-weight:800;color:#f2d48b;letter-spacing:.045em;text-decoration:none}.pill,.step,.eyebrow{color:#70e9fa;letter-spacing:.13em;font-size:11px;font-weight:800}.pill{border:1px solid #317083;padding:7px 10px;border-radius:30px}.intro{padding:45px 0 22px}.intro h1{font-size:clamp(34px,7vw,62px);line-height:1.06;letter-spacing:-.05em;margin:12px 0}.intro p,.panel p{color:#acc1d4}.intro p{max-width:550px}.panel{padding:24px;background:#081627ed;border:1px solid #28506b;border-radius:22px;margin:16px 0;box-shadow:0 18px 45px #0004}.panel h2{margin:12px 0 6px}.pairing label,.url label{font-size:13px;display:block;font-weight:700;color:#dbeaff;margin:18px 0 8px}.pairing input,.url input{width:100%;min-width:0;border:1px solid #3b5c76;border-radius:11px;background:#030c19;color:#fff;padding:16px;font:600 17px system-ui;box-sizing:border-box}.pairing input{text-align:center;letter-spacing:.19em;font-size:24px}.primary,.url form button{background:linear-gradient(120deg,#5ee1f4,#b3e8e1);color:#071322;border:0;border-radius:11px;padding:15px 17px;font-weight:800;cursor:pointer}.primary{width:100%;margin-top:14px}button:disabled{opacity:.52;cursor:not-allowed}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #f4d47a;outline-offset:3px}.connected{display:flex;gap:10px;align-items:center}.connected b,.connected small{display:block}.connected small{font-size:11px;color:#9cb7c8}.dot{width:13px;height:13px;background:#59eaa2;border-radius:50%;box-shadow:0 0 18px #59eaa288;flex-shrink:0}.disconnect{margin-left:auto;background:#1f2935;color:#ffb6b6;border:1px solid #734c50;border-radius:10px;padding:9px 12px;cursor:pointer}.url form{display:flex;gap:8px}.url input{font-size:14px}.quick{color:#78e8fa;background:transparent;border:1px solid #235272;border-radius:10px;padding:10px 12px;margin-top:12px;cursor:pointer}.favorites{margin:18px 0}.favorite{display:flex;gap:8px;align-items:center;margin-top:7px}.favorite button{background:#0e2539;color:#c5f5fc;border:1px solid #285671;padding:9px 12px;border-radius:9px;cursor:pointer}.favorite button:first-child{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.favorite .remove{color:#ffbbbb}.directions{display:grid;grid-template-columns:repeat(3,80px);justify-content:center;gap:9px;margin:16px auto 25px}.key{min-height:52px;border:1px solid #45647b;border-radius:12px;background:linear-gradient(145deg,#172d45,#0a192b);color:#f4fbff;cursor:pointer;font-size:17px;font-weight:750;box-shadow:0 6px 16px #0005}.directions .key{height:70px;font-size:24px}.directions .select{border-radius:50%;color:#071623;background:#71e8ef;font-size:19px}.row{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}.row .key{flex:1;min-width:calc(33.33% - 12px);font-size:13px}.media .key:nth-child(2){background:#21546a;border-color:#64d8eb}.hint{font-size:12px;line-height:1.5}.notice{background:#1d3141;border:1px solid #436b80;border-radius:10px;padding:12px}footer{text-align:center;color:#9ab0bf;font-size:11px;margin-top:25px}footer a{color:#70e9fa}@media(max-width:400px){.panel{padding:16px}.directions{grid-template-columns:repeat(3,68px)}.directions .key{height:60px}.url form{flex-wrap:wrap}.url form button{width:100%}header a{font-size:10px}}
  `}</style></main>
}
