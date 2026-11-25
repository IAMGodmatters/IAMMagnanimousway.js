'use client';

import {useEffect,useMemo,useState} from 'react';

type Activation={verified:boolean;status:string;task_id:string|null;completed_at:number;error:string};
type Device={id:string;name:string;hostname:string;platform:string;status:string;online:boolean;last_seen_at:number;capabilities:string[];activation:Activation};
type Overview={ready:boolean;paired:boolean;policy:Record<string,unknown>;devices:Device[];pending_tasks:number;actions:Record<string,{risk:string;confirmation:boolean;family:string}>};
const POCKET_TTS_VOICES:Record<string,string[]> = {
 english:['alba','anna','azelma','bill_boerst','caro_davy','charles','cosette','eponine','eve','fantine','george','jane','jean','javert','marius','mary','michael','paul','peter_yearsley','stuart_bell'],
 french_24l:['estelle'],
 german:['juergen'], german_24l:['juergen'],
 portuguese:['rafael'], portuguese_24l:['rafael'],
 italian:['giovanni'], italian_24l:['giovanni'],
 spanish:['lola'], spanish_24l:['lola'],
};
const POCKET_TTS_DEFAULT_VOICE:Record<string,string> = {
 english:'alba', french_24l:'estelle', german:'juergen', german_24l:'juergen',
 portuguese:'rafael', portuguese_24l:'rafael', italian:'giovanni', italian_24l:'giovanni',
 spanish:'lola', spanish_24l:'lola',
};

const RAW_INSTALLER='https://iammagnanimousway.com/downloads/local-bridge/bootstrap.ps1';
const RAW_UNINSTALLER='https://iammagnanimousway.com/downloads/local-bridge/uninstall.ps1';

function psQuote(value:string){return "'" + value.replaceAll("'","''") + "'"}
function encodePowerShell(command:string){
 const bytes=new Uint8Array(command.length*2);
 for(let i=0;i<command.length;i++){const c=command.charCodeAt(i);bytes[i*2]=c&255;bytes[i*2+1]=c>>8}
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary);
}

export default function LocalBridgePage(){
 const [token,setToken]=useState('');
 const [overview,setOverview]=useState<Overview|null>(null);
 const [pairCode,setPairCode]=useState('');
 const [expires,setExpires]=useState(0);
 const [workspace,setWorkspace]=useState('%USERPROFILE%\\Documents\\MagnanimousWorkspace');
 const [installGit,setInstallGit]=useState(true);
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState('');
 const [heimdallTaskId,setHeimdallTaskId]=useState('');
 const [pocketTtsTaskId,setPocketTtsTaskId]=useState('');
 const [pocketTtsDeviceName,setPocketTtsDeviceName]=useState('');
 const [pocketTtsText,setPocketTtsText]=useState('Welcome, everyone. Magnanimous AI is here to make this stream more creative and interactive.');
 const [pocketTtsVoice,setPocketTtsVoice]=useState('alba');
 const [pocketTtsLanguage,setPocketTtsLanguage]=useState('english');
 const [pocketTtsResult,setPocketTtsResult]=useState<any>(null);
 const [copied,setCopied]=useState(false);

 const headers=(json=false)=>{const h:Record<string,string>={Authorization:`Bearer ${token}`};if(json)h['Content-Type']='application/json';return h};
 async function read(r:Response){const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||`HTTP ${r.status}`);return d}

 async function refresh(t=token){
  if(!t)return;
  try{
   const d=await read(await fetch('/api/magnanimous/local-bridge',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}));
   setOverview(d);
   if(d.ready)setNotice('Verified: a paired computer completed a real Magnanimous health task and is READY LOCAL.');
   else if(d.paired)setNotice('Computer paired. Waiting for the automatic health task to complete before marking READY LOCAL.');
  }catch(e:any){setNotice(e?.message||'Could not load Local Bridge status.')}
 }

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace('/login?returnTo=%2Flocal-bridge');return}
  setToken(saved);void refresh(saved);
 },[]);

 useEffect(()=>{
  if(!token)return;
  const timer=setInterval(()=>void refresh(token),overview?.ready?15000:3000);
  return()=>clearInterval(timer);
 },[token,overview?.ready]);

 async function createPairing(){
  if(!token||busy)return;
  setBusy('pair');setNotice('');setCopied(false);
  try{
   const d=await read(await fetch('/api/magnanimous/local-bridge/pairings',{method:'POST',headers:headers(true),body:JSON.stringify({name:'My Magnanimous Computer'})}));
   setPairCode(d.pairing_code||'');setExpires(Number(d.expires_at||0));
   setNotice('Pairing code created. Download the activation file and run it on the Windows computer within 10 minutes.');
  }catch(e:any){setNotice(e?.message||'Could not create pairing code.')}finally{setBusy('')}
 }

 async function health(device:Device){
  setBusy(device.id);setNotice('');
  try{
   const d=await read(await fetch('/api/magnanimous/local-bridge/tasks',{method:'POST',headers:headers(true),body:JSON.stringify({device_id:device.id,action:'health',payload:{}})}));
   setNotice(`Health verification queued as ${d.id}. Magnanimous will update this page when the computer returns evidence.`);
   setTimeout(()=>void refresh(),1000);
  }catch(e:any){setNotice(e?.message||'Could not queue health check.')}finally{setBusy('')}
 }

 async function runHeimdall(device:Device,action:'heimdall_status'|'heimdall_detect'){
  if(busy||!device.online||!device.capabilities.includes(action))return;
  if(action==='heimdall_detect'&&!confirm('I confirm that I own this Samsung device or have written authorization to service it. Perform USB detection only?'))return;
  setBusy('heimdall');setNotice('');
  try{
   const d=await read(await fetch('/api/magnanimous/local-bridge/tasks',{method:'POST',headers:headers(true),body:JSON.stringify({device_id:device.id,action,payload:action==='heimdall_detect'?{ownership_confirmed:true}:{}})}));
   setHeimdallTaskId(d.id);
   if(d.requires_confirmation){
    if(!confirm(`Confirm task ${d.id}: detect USB device without writing firmware or bypassing any protections?`)){
     await read(await fetch(`/api/magnanimous/local-bridge/tasks/${encodeURIComponent(d.id)}/cancel`,{method:'POST',headers:headers(true)}));
     setHeimdallTaskId('');
     setNotice(`Task ${d.id} cancelled. No USB detection was executed.`);return;
    }
    await read(await fetch(d.confirmation_endpoint,{method:'POST',headers:headers(true)}));
   }
   setNotice(`Task ${d.id} was queued on ${device.name}. Select CHECK TASK RESULT to see its verified result.`);
  }catch(e:any){setNotice(e?.message||'Unable to queue local device task.')}finally{setBusy('')}
 }

 async function readHeimdallResult(){
  if(!heimdallTaskId||busy)return;setBusy('read-heimdall');
  try{
   const d=await read(await fetch(`/api/magnanimous/local-bridge/tasks/${encodeURIComponent(heimdallTaskId)}`,{headers:headers(),cache:'no-store'}));
   const task=d.task||d;
   setNotice(`Heimdall task ${heimdallTaskId}: ${task.status||'unknown'}.`+(task.status==='completed'?` Result: ${JSON.stringify(task.result||{}).slice(0,1200)}`:'')+(task.error?` Error: ${String(task.error).slice(0,300)}`:''));
  }catch(e:any){setNotice(e?.message||'Could not read the device task status.')}finally{setBusy('')}
 }

 async function runPocketTts(device:Device,action:'pocket_tts_status'|'pocket_tts_generate'){
  if(!token||busy||!device.online||!device.capabilities.includes(action))return;
  if(action==='pocket_tts_generate'){
   const clip=pocketTtsText.trim();
   if(!clip||clip.length>800){setNotice('Keep the speech clip between 1 and 800 characters.');return}
   if(!confirm('Generate this short speech clip locally on the computer? The model cache and WAV output are kept in the approved D: data folder. No TTS API is called.'))return;
  }
  setBusy('pocket-tts-'+device.id);setNotice('');setPocketTtsResult(null);
  try{
   const payload=action==='pocket_tts_generate'?{text:pocketTtsText.trim(),voice:pocketTtsVoice,language:pocketTtsLanguage}:{};
   const d=await read(await fetch('/api/magnanimous/local-bridge/tasks',{method:'POST',headers:headers(true),body:JSON.stringify({device_id:device.id,action,payload})}));
   setPocketTtsTaskId(d.id);setPocketTtsDeviceName(device.name);
   if(d.requires_confirmation){
    if(!confirm('Confirm local Pocket TTS WAV generation? This creates one bounded audio file in the approved local output folder.')){
     await read(await fetch(`/api/magnanimous/local-bridge/tasks/${encodeURIComponent(d.id)}/cancel`,{method:'POST',headers:headers(true)}));
     setPocketTtsTaskId('');
     setNotice('Pocket TTS task cancelled. No speech audio was generated.');return;
    }
    await read(await fetch(d.confirmation_endpoint,{method:'POST',headers:headers(true)}));
   }
   setNotice(`Pocket TTS ${action==='pocket_tts_status'?'hardware check':'audio generation'} queued on ${device.name}. Check the task result when the Local Bridge finishes.`);
  }catch(e:any){setNotice(e?.message||'Could not queue the local Pocket TTS task.')}finally{setBusy('')}
 }

 async function readPocketTtsResult(){
  if(!pocketTtsTaskId||busy)return;
  setBusy('read-pocket-tts');
  try{
   const d=await read(await fetch(`/api/magnanimous/local-bridge/tasks/${encodeURIComponent(pocketTtsTaskId)}`,{headers:headers(),cache:'no-store'}));
   const task=d.task||d;
   const result=task.result||{};
   setPocketTtsResult({status:task.status||'unknown',result,error:task.error||''});
   if(task.status==='completed'){
    if(result.installed!==undefined){
     setNotice(`Pocket TTS check on ${pocketTtsDeviceName}: ${result.status||'checked'}; AVX2 ${result.avx2_available?'available':'not detected'}; binary ${result.installed?'found':'not installed'}.`);
    }else if(result.file_name){
     setNotice(`Local WAV clip created: ${result.file_name} (${result.duration_seconds}s). It remains on ${pocketTtsDeviceName}; use an approved OBS/Streamer.bot playback action.`);
    }else setNotice(`Pocket TTS task completed on ${pocketTtsDeviceName}.`);
   }else if(task.status==='failed')setNotice(`Pocket TTS task failed: ${String(task.error||'See task result').slice(0,400)}`);
   else setNotice(`Pocket TTS task is ${task.status||'still running'} on ${pocketTtsDeviceName}.`);
  }catch(e:any){setNotice(e?.message||'Could not read the Pocket TTS task result.')}finally{setBusy('')}
 }

 async function revoke(device:Device){
  if(!confirm(`Revoke Local Bridge access for ${device.name}? This stops its token immediately and cancels pending tasks.`))return;
  setBusy('revoke-'+device.id);setNotice('');
  try{
   await read(await fetch(`/api/magnanimous/local-bridge/devices/${device.id}/revoke`,{method:'POST',headers:headers(true),body:JSON.stringify({confirm:true})}));
   setNotice(`${device.name} was revoked. Its existing bridge token can no longer claim tasks.`);await refresh();
  }catch(e:any){setNotice(e?.message||'Could not revoke the device.')}finally{setBusy('')}
 }

 const bootstrapPowerShell=useMemo(()=>{
  if(!pairCode)return'';
  return [
   "$ErrorActionPreference='Stop'",
   "$bootstrap=Join-Path $env:TEMP 'install-magnanimous-bridge.ps1'",
   `Invoke-WebRequest -UseBasicParsing -Uri ${psQuote(RAW_INSTALLER)} -OutFile $bootstrap`,
   `& $bootstrap -PairingCode ${psQuote(pairCode)} -WorkspaceRoot ${psQuote(workspace||'%USERPROFILE%\\Documents\\MagnanimousWorkspace')}${installGit?' -InstallGit':''}`,
   "Write-Host ''",
   "Write-Host 'Activation command finished. Return to I AM MAGNANIMOUS WAY and wait for VERIFIED / READY LOCAL.'"
  ].join('; ');
 },[pairCode,workspace,installGit]);

 const windowsCommand=useMemo(()=>bootstrapPowerShell?`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShell(bootstrapPowerShell)}`:'',[bootstrapPowerShell]);

 function downloadActivator(){
  if(!windowsCommand)return;
  const body=`@echo off\r\ntitle Magnanimous Local Bridge Activation\r\necho I AM MAGNANIMOUS WAY - Local Bridge Activation\r\necho This opens no inbound port.\r\necho.\r\n${windowsCommand}\r\nif errorlevel 1 (\r\n  echo.\r\n  echo Activation failed. Keep this window open and review the error above.\r\n  pause\r\n  exit /b 1\r\n)\r\necho.\r\necho Activation completed. Return to the Local Bridge page and wait for VERIFIED.\r\npause\r\n`;
  const blob=new Blob([body],{type:'application/x-msdos-program'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='Activate-Magnanimous-Local-Bridge.cmd';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 }

 async function copyCommand(){
  if(!windowsCommand)return;
  try{await navigator.clipboard.writeText(windowsCommand);setCopied(true);setNotice('Windows activation command copied.')}catch{setNotice('Copy was blocked by this browser. Use the Download Activation File button instead.')}
 }

 function downloadRemoval(){
  const removalPowerShell=[
   "$ErrorActionPreference='Stop'",
   "$cleanup=Join-Path $env:TEMP 'uninstall-magnanimous-bridge.ps1'",
   `Invoke-WebRequest -UseBasicParsing -Uri ${psQuote(RAW_UNINSTALLER)} -OutFile $cleanup`,
   "& $cleanup"
  ].join('; ');
  const command=`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodePowerShell(removalPowerShell)}`;
  const body=`@echo off\r\ntitle Remove Magnanimous Local Bridge\r\necho Removing local Magnanimous Local Bridge files and startup task...\r\n${command}\r\nif errorlevel 1 (echo Removal failed. Review the error above. & pause & exit /b 1)\r\necho Local Bridge removed from this computer.\r\npause\r\n`;
  const blob=new Blob([body],{type:'application/x-msdos-program'});const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='Remove-Magnanimous-Local-Bridge.cmd';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 }

 const activeDevices=(overview?.devices||[]).filter(d=>d.status==='active');
 const nativeBrowserReady=activeDevices.some(d=>d.online&&d.capabilities.includes('browser_fetch'));
 const revokedDevices=(overview?.devices||[]).filter(d=>d.status!=='active');

 return <main className="page">
  <header><a href="/owner-center">← Owner Center</a><span>PRIVATE OWNER • LOCAL EXECUTION</span><nav><a href="/virtual-phones">Virtual Phones</a><a href="/owner-edge-ai">Edge AI</a><a href="/god-coding">God Coding →</a></nav></header>

  <section className="hero">
   <small>I AM MAGNANIMOUS WAY™ • MAGNANIMOUS AI</small>
   <h1>Local Bridge</h1>
   <p>Connect an authorized Windows computer to Magnanimous through outbound HTTPS only. No inbound port, no generic remote shell, explicit workspace roots, hashed server-side tokens, and separate confirmation before source mutations.</p>
   <div className="badges">
    <b className={overview?.ready?'good':overview?.paired?'warn':''}>{overview?.ready?'READY LOCAL — VERIFIED':overview?.paired?'PAIRED — VERIFYING':'LOCAL BRIDGE REQUIRED'}</b>
    <span>{activeDevices.filter(x=>x.online).length} online device(s)</span>
    <span>{overview?.pending_tasks||0} pending task(s)</span><span className={nativeBrowserReady?'good':'warn'}>{nativeBrowserReady?'NATIVE BROWSER READY':'NATIVE BROWSER UPDATE NEEDED'}</span>
   </div>
  </section>

  {notice&&<div className="notice" role="status">{notice}</div>}

  <section className="card" aria-label="Authorized Samsung device diagnostics">
   <small>FREE OPEN-SOURCE • OPTIONAL • OWNER LOCAL BRIDGE</small><h2>Samsung device diagnostics</h2>
   <p>Heimdall is a separate MIT-licensed utility controlled by Magnanimous AI. Version checks are read-only; USB detection requires proof of permission and exact-task confirmation. Firmware writing, unlocking and erasure are disabled.</p>
   {activeDevices.length===0?<p>Pair an owner-controlled computer to activate local tool checks.</p>:activeDevices.map(d=><div key={d.id}>
    <b>{d.name}</b> <span>{d.online?'Online':'Offline'}</span>
    <div>
     <button disabled={!d.online||!d.capabilities.includes('heimdall_status')||Boolean(busy)} onClick={()=>runHeimdall(d,'heimdall_status')}>CHECK HEIMDALL STATUS</button>
     <button disabled={!d.online||!d.capabilities.includes('heimdall_detect')||Boolean(busy)} onClick={()=>runHeimdall(d,'heimdall_detect')}>DETECT AUTHORIZED DEVICE</button>
    </div>
    {!d.capabilities.includes('heimdall_detect')&&<p>USB detection is unavailable until a reviewed Heimdall CLI is installed locally and your Local Bridge agent is updated.</p>}
   </div>)}
   {heimdallTaskId&&<button disabled={Boolean(busy)} onClick={readHeimdallResult}>CHECK TASK RESULT</button>}
  </section>

  <section className="card" aria-label="Local Pocket TTS voice engine">
   <small>FREE LOCAL AI VOICE • NO GPU API • D-DRIVE STORAGE</small><h2>Pocket TTS home voice</h2>
   <p>Check the paired computer before installing or using anything. The current official Windows binary requires AVX2. The bridge keeps model cache and generated WAV clips under D:\\MagnanimousData\\PocketTTS; it does not install or download the binary automatically, and does not use C: for voice files.</p>
   <label>Words for the local test clip
    <textarea maxLength={800} rows={3} value={pocketTtsText} onChange={e=>setPocketTtsText(e.target.value)} />
   </label>
   <div className="grid" style={{marginTop:8}}>
    <label>Voice
     <select value={pocketTtsVoice} onChange={e=>setPocketTtsVoice(e.target.value)}>
      {(POCKET_TTS_VOICES[pocketTtsLanguage]||['alba']).map(v=><option key={v} value={v}>{v}</option>)}
     </select>
    </label>
    <label>Language
     <select value={pocketTtsLanguage} onChange={e=>{const language=e.target.value;setPocketTtsLanguage(language);setPocketTtsVoice(POCKET_TTS_DEFAULT_VOICE[language]||'alba')}}>
      <option value="english">English</option><option value="french_24l">French</option><option value="german">German</option><option value="german_24l">German 24L</option><option value="portuguese">Portuguese</option><option value="portuguese_24l">Portuguese 24L</option><option value="italian">Italian</option><option value="italian_24l">Italian 24L</option><option value="spanish">Spanish</option><option value="spanish_24l">Spanish 24L</option>
     </select>
    </label>
   </div>
   {activeDevices.length===0?<p>Pair an owner-controlled computer to check this local engine.</p>:activeDevices.map(d=><div key={d.id} style={{borderTop:'1px solid #173b49',paddingTop:12,marginTop:12}}>
    <b>{d.name}</b> <span>{d.online?'Online':'Offline'}</span>
    <div className="actions">
     <button onClick={()=>runPocketTts(d,'pocket_tts_status')} disabled={!d.online||!d.capabilities.includes('pocket_tts_status')||Boolean(busy)}>{busy==='pocket-tts-'+d.id?'QUEUING…':'1. CHECK CPU / POCKET TTS'}</button>
     <button className="primary" onClick={()=>runPocketTts(d,'pocket_tts_generate')} disabled={!d.online||!d.capabilities.includes('pocket_tts_generate')||Boolean(busy)}>{busy==='pocket-tts-'+d.id?'QUEUING…':'2. GENERATE LOCAL WAV CLIP'}</button>
    </div>
    {!d.capabilities.includes('pocket_tts_generate')&&<p>Clip generation appears only after the approved Pocket TTS binary is present on D: and AVX2 is verified. Status check remains read-only.</p>}
   </div>)}
   {pocketTtsTaskId&&<div style={{marginTop:12}}>
    <button disabled={Boolean(busy)} onClick={readPocketTtsResult}>CHECK POCKET TTS TASK RESULT</button>
    <small>Task {pocketTtsTaskId}</small>
   </div>}
   {pocketTtsResult&&<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:10,color:'#a9c8d3'}}>{JSON.stringify(pocketTtsResult,null,2)}</pre>}
   <p>Current language models do not include Filipino or Cebuano. This feature creates a local WAV clip; continuous live PCM output and automatic OBS playback are not yet connected.</p>
  </section>

  <section className="grid">
   <article className="card">
    <small>ONE-CLICK WINDOWS ACTIVATION</small><h2>Pair a computer</h2>
    <p>Choose the folder Magnanimous is allowed to use. The activation file can install Python automatically when Windows Package Manager is available, optionally installs Git, installs the free Magnanimous Native Browser (Playwright + Chromium), pairs or reuses the bridge, creates its startup task, and triggers a real health verification. Existing paired computers can safely run activation again to add native browser capability.</p>
    <label>Authorized workspace
     <input value={workspace} onChange={e=>setWorkspace(e.target.value)} placeholder="%USERPROFILE%\Documents\MagnanimousWorkspace"/>
    </label>
    <label className="check"><input type="checkbox" checked={installGit} onChange={e=>setInstallGit(e.target.checked)}/>Install Git automatically if it is missing</label>
    <button className="primary" onClick={createPairing} disabled={busy==='pair'}>{busy==='pair'?'CREATING…':'1. CREATE ACTIVATION'}</button>
    {pairCode&&<div className="pair">
     <div className="pairTop"><div><small>ONE-TIME PAIRING CODE</small><b>{pairCode}</b></div><span>expires {expires?new Date(expires*1000).toLocaleTimeString():'soon'}</span></div>
     <button className="primary" onClick={downloadActivator}>2. DOWNLOAD WINDOWS ACTIVATION FILE</button>
     <button onClick={copyCommand}>{copied?'COPIED':'COPY COMMAND INSTEAD'}</button>
     <p>On the Windows computer, open the downloaded <strong>Activate-Magnanimous-Local-Bridge.cmd</strong>. Keep the window open until it says activation completed. This page refreshes automatically and changes to <strong>READY LOCAL — VERIFIED</strong> only after Magnanimous receives a completed health task.</p>
    </div>}
   </article>

   <article className="card">
    <small>SECURITY MODEL</small><h2>Capability-scoped, not remote shell</h2>
    <ul><li>No inbound listener or opened LAN port.</li><li>No arbitrary shell/process endpoint.</li><li>Filesystem access stays inside the authorized workspace roots.</li><li>Default Git branch remains protected.</li><li>Patch/branch/commit mutations require separate confirmation.</li><li>Netwalk remains read-only and scope-authorized.</li><li>Native browser work blocks private-network targets and remote password filling.</li><li>Interactive browser actions require separate confirmation.</li><li>Browser cookies and sessions stay in local browser profiles.</li><li>Revoking a device invalidates its bridge token immediately.</li></ul><button onClick={downloadRemoval}>DOWNLOAD WINDOWS REMOVAL FILE</button>
   </article>
  </section>

  <section className="card devices">
   <div className="head"><div><small>PAIRED DEVICES</small><h2>Execution surfaces</h2></div><button onClick={()=>refresh()} disabled={!token}>REFRESH</button></div>
   {!activeDevices.length?<p>No active paired computer yet.</p>:activeDevices.map(d=><article key={d.id}>
    <div className="deviceTop"><div><b>{d.name}</b><p>{d.hostname} • {d.platform}</p></div><div className="states"><span className={d.online?'online':'offline'}>{d.online?'ONLINE':'OFFLINE'}</span><span className={d.activation?.verified?'online':'pending'}>{d.activation?.verified?'VERIFIED':d.activation?.status?.toUpperCase()||'NOT VERIFIED'}</span></div></div>
    <small>{d.capabilities.join(' • ')||'No executable capabilities advertised'}</small>
    {d.activation?.error&&<p className="errText">{d.activation.error}</p>}
    <div className="actions">
     {d.online&&d.capabilities.includes('health')&&<button onClick={()=>health(d)} disabled={busy===d.id}>{busy===d.id?'QUEUING…':'RUN HEALTH VERIFICATION'}</button>}
     <button className="danger" onClick={()=>revoke(d)} disabled={busy==='revoke-'+d.id}>{busy==='revoke-'+d.id?'REVOKING…':'REVOKE DEVICE'}</button>
    </div>
   </article>)}
   {revokedDevices.length>0&&<details><summary>{revokedDevices.length} revoked device(s)</summary>{revokedDevices.map(d=><p key={d.id}>{d.name} • REVOKED</p>)}</details>}
  </section>

  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#05080c;color:#eafaff;padding:24px 28px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 80% 0,rgba(54,210,255,.12),transparent 28%)}header,.hero,.grid,.card,.notice{max-width:1400px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;font-size:9px;letter-spacing:.15em;color:#6d8994}header nav{display:flex;gap:14px}a{color:#74dff2;text-decoration:none}.hero{margin-top:26px;padding:30px;border:1px solid #205267;border-radius:22px;background:#07141c}.hero h1{font-size:clamp(42px,7vw,76px);margin:6px 0}.hero p{max-width:950px;color:#8ca6b0;line-height:1.6}.badges{display:flex;gap:8px;flex-wrap:wrap}.badges>*{border:1px solid #24596b;border-radius:999px;padding:8px 11px;font-size:9px}.badges .good{border-color:#267c55;color:#86f6bb}.badges .warn{border-color:#8a6a2d;color:#f1cf82}.notice{margin-top:12px;padding:12px;border:1px solid #5b4927;background:#171208;border-radius:10px;color:#efd18d}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px;margin-top:12px}.card{margin-top:12px;padding:20px;border:1px solid #173b49;border-radius:16px;background:#071118}.grid .card{margin-top:0}.card small{color:#63d8f1;letter-spacing:.14em;font-size:9px}.card p,.card li,.card label{color:#7896a1;font-size:11px;line-height:1.55}.card input[type=text],.card input:not([type]){width:100%;margin-top:6px;padding:11px;border-radius:9px;border:1px solid #245365;background:#030a0e;color:#dffaff}.check{display:flex;align-items:center;gap:8px;margin:12px 0}.check input{width:auto}.card button{border:1px solid #2b687b;background:#0c2c37;color:#d5f9ff;border-radius:10px;padding:10px 13px;cursor:pointer;margin-right:7px}.card button.primary{background:#115469;border-color:#52cce8;font-weight:800}.card button.danger{background:#2a1013;border-color:#7d3137;color:#ffbec3}.pair{margin-top:14px;padding:14px;border:1px solid #245365;border-radius:12px;background:#050c11}.pairTop{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.pair b{display:block;font-family:monospace;font-size:18px;color:#a9f5ff}.pair span{font-size:9px;color:#6d8b96}.head,.deviceTop{display:flex;justify-content:space-between;gap:16px;align-items:center}.devices>article{margin-top:8px;padding:14px;border:1px solid #153844;border-radius:11px}.devices p{margin:5px 0}.states{display:flex;gap:6px;flex-wrap:wrap}.states span{border:1px solid #294957;border-radius:999px;padding:5px 8px;font-size:8px}.online{color:#7ef0b8}.offline{color:#dd9d78}.pending{color:#efd18d}.actions{margin-top:10px}.errText{color:#ffb5bb!important}details{margin-top:15px;color:#75929c}button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:850px){.grid{grid-template-columns:1fr}.page{padding:18px 12px}.pairTop,.deviceTop{align-items:flex-start;flex-direction:column}}`}</style>
 </main>
}