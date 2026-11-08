'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';

type Device={id:string;name:string;hostname:string;platform:string;status:string;online:boolean;capabilities:string[];activation?:{verified:boolean;status:string}};
type Overview={ready:boolean;paired:boolean;devices:Device[];pending_tasks:number};
type TaskResult={id:string;action:string;status:string;result?:Record<string,unknown>;error?:string;requires_confirmation?:boolean;confirmation_endpoint?:string;note?:string};

const API_IMAGE_DEFAULT='system-images;android-35;google_apis;x86_64';

export default function VirtualPhonesPage(){
 const [token,setToken]=useState('');
 const [overview,setOverview]=useState<Overview|null>(null);
 const [busy,setBusy]=useState('');
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [name,setName]=useState('Magnanimous-Pixel-01');
 const [image,setImage]=useState(API_IMAGE_DEFAULT);
 const [profile,setProfile]=useState('pixel_2');
 const [slot,setSlot]=useState(0);
 const [task,setTask]=useState<TaskResult|null>(null);
 const [localStatus,setLocalStatus]=useState<Record<string,unknown>|null>(null);
 const [localList,setLocalList]=useState<Record<string,unknown>|null>(null);
 const [cloudStatus,setCloudStatus]=useState<Record<string,unknown>|null>(null);
 const [pairCode,setPairCode]=useState('');
 const [pairExpiry,setPairExpiry]=useState(0);

 const headers=(json=false):Record<string,string>=>{const h:Record<string,string>={Authorization:'Bearer '+token};if(json)h['Content-Type']='application/json';return h};
 const read=async(r:Response)=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||('HTTP '+r.status));return d};
 const refresh=useCallback(async(t=token)=>{if(!t)return;try{const d=await read(await fetch('/api/magnanimous/local-bridge',{headers:{Authorization:'Bearer '+t},cache:'no-store'}));setOverview(d)}catch(e:any){setError(e?.message||'Could not read device status.')}},[token]);
 useEffect(()=>{const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';if(!saved){location.replace('/login?returnTo=%2Fvirtual-phones');return;}setToken(saved);void refresh(saved)},[]);
 useEffect(()=>{if(!token)return;const timer=setInterval(()=>void refresh(),12000);return()=>clearInterval(timer)},[token,refresh]);

 const active=useMemo(()=>(overview?.devices||[]).filter(d=>d.status==='active'),[overview]);
 const localNodes=active.filter(d=>d.capabilities.includes('android_emulator_status'));
 const cloudNodes=active.filter(d=>d.capabilities.includes('android_cloud_status'));

 async function queue(device:Device,action:string,payload:Record<string,unknown>={},confirmText=''){
  if(!token||busy)return;
  if(confirmText&&!window.confirm(confirmText))return;
  setBusy(action);setError('');setNotice('');
  try{
   let d=await read(await fetch('/api/magnanimous/local-bridge/tasks',{method:'POST',headers:headers(true),body:JSON.stringify({device_id:device.id,action,payload})}));
   if(d.requires_confirmation){
    const allowed=window.confirm(d.note||('Confirm '+action+' on '+device.name+'?'));
    if(!allowed){await read(await fetch('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(d.id)+'/cancel',{method:'POST',headers:headers(true)}));setNotice('Task cancelled. Nothing was executed.');return;}
    d=await read(await fetch(d.confirmation_endpoint||('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(d.id)+'/confirm'),{method:'POST',headers:headers(true)}));
   }
   setTask({id:d.id,action,status:d.status||'queued',note:d.note});
   setNotice('Task '+d.id+' was queued on '+device.name+'. Check the result below; queued does not mean the virtual phone has started.');
   await refresh();
  }catch(e:any){setError(e?.message||'Could not queue the device task.')}finally{setBusy('')}
 }

 async function checkTask(){
  if(!task||!token||busy)return;setBusy('result');setError('');
  try{
   const d=await read(await fetch('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(task.id),{headers:headers(),cache:'no-store'}));
   setTask(d);
   const result=d.result||{};
   if(d.status==='completed'&&d.action==='android_emulator_status')setLocalStatus(result);
   if(d.status==='completed'&&d.action==='android_emulator_list')setLocalList(result);
   if(d.status==='completed'&&d.action==='android_cloud_status')setCloudStatus(result);
   setNotice('Latest task state: '+d.status+'.');
  }catch(e:any){setError(e?.message||'Could not read task result.')}finally{setBusy('')}
 }

 async function inspect(device:Device,action:'android_emulator_status'|'android_emulator_list'|'android_cloud_status'){
  await queue(device,action,{},'Run a read-only '+action.replaceAll('_',' ')+' check on '+device.name+'?');
 }
 async function pairCloud(){
  if(!token||busy)return;setBusy('pair-cloud');setError('');setNotice('');
  try{const d=await read(await fetch('/api/magnanimous/local-bridge/pairings',{method:'POST',headers:headers(true),body:JSON.stringify({name:'Magnanimous Cloud Android Emulator Host'})}));setPairCode(d.pairing_code||'');setPairExpiry(Number(d.expires_at||0));setNotice('One-time Linux host pairing code created. It can be used once before expiry.')}catch(e:any){setError(e?.message||'Could not create cloud-node pairing.')}finally{setBusy('')}
 }
 async function copyCloudCommand(){
  const command="curl -fsSL https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/install-cloud-node.sh | bash -s -- '"+pairCode+"'";
  try{await navigator.clipboard.writeText(command);setNotice('Cloud-node pairing command copied.')}catch{setError('Clipboard unavailable; select and copy the command shown.')}
 }
 const styles=`
 .page{min-height:100vh;background:#050607;color:#f4ead8;padding:24px clamp(14px,3vw,38px) 56px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(ellipse at 8% 0%,rgba(186,128,39,.10),transparent 38%)}
 header{max-width:1400px;margin:auto;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#b18c52;font-size:11px;letter-spacing:.12em}a{color:#e7c17d;text-decoration:none}
 .hero,.card{max-width:1400px;margin:18px auto;background:linear-gradient(135deg,#12110f,#090909);border:1px solid #554126;border-radius:18px;padding:clamp(18px,3vw,30px)}
 .eyebrow{color:#bd9657;font-size:10px;letter-spacing:.2em}.hero h1{font-family:Georgia,serif;font-size:clamp(34px,5vw,58px);color:#f4d08c;margin:8px 0}.hero p,.card p{color:#b5a78e;line-height:1.65;max-width:900px}
 .status{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.status span{border:1px solid #51412a;border-radius:99px;padding:7px 11px;color:#dec18d;font-size:11px}
 .grid{max-width:1400px;margin:18px auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:16px}.card{margin:0}.card h2{font-size:21px;color:#f1d193;margin:8px 0}.card h3{font-size:15px;color:#e0bd7b}
 label{display:block;color:#c6b392;font-size:12px;margin:12px 0}input,select{display:block;width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #4c402e;background:#080808;color:#f8ebd3;padding:12px;border-radius:9px;font:inherit}
 button{border:1px solid #a47a39;background:#77501b;color:#fff0d2;padding:10px 13px;border-radius:9px;font-size:11px;font-weight:800;cursor:pointer;margin:5px 5px 5px 0}button.secondary{background:#111;border-color:#675433}button.danger{background:#331617;border-color:#79383b}button:disabled{opacity:.45;cursor:not-allowed}
 .notice,.error,.result{max-width:1400px;margin:12px auto;padding:12px 15px;border-radius:10px;background:#101710;border:1px solid #36513b;color:#c4e1c8;overflow-wrap:anywhere}.error{background:#211012;border-color:#65363b;color:#ffc0c4}.result{background:#0a1018;border-color:#34485e;color:#c7d8e8;white-space:pre-wrap;font-size:12px}
 .device{padding:13px 0;border-top:1px solid #342b20}.device small{display:block;color:#a99b80;margin-top:5px;overflow-wrap:anywhere}.muted{color:#968873!important;font-size:12px}.code{padding:12px;border:1px dashed #81643a;border-radius:9px;overflow-wrap:anywhere;color:#f5d696;background:#080808;font-family:monospace;font-size:12px}
 @media(max-width:650px){.page{padding:16px 12px 38px}header{font-size:9px}.grid{grid-template-columns:1fr}.card{padding:17px}.hero{padding:20px}}
 `;
 return <main className="page">
  <header><a href="/owner-center">← Owner Center</a><span>PRIVATE OWNER • MAGNANIMOUS AI</span><a href="/local-bridge">Local Bridge →</a></header>
  <section className="hero"><div className="eyebrow">OWNER DEVICE OPERATIONS • LOCAL + CLOUD</div><h1>Magnanimous Virtual Phone Farm</h1><p>Manage independent Android Virtual Devices on your paired computer and Android Emulator containers on a Linux KVM host that you own or control. Magnanimous AI remains the orchestrator. No cloud VM is provisioned and no paid service is activated by this page.</p><div className="status"><span>{overview?.devices?.length||0} paired node(s)</span><span>{active.filter(d=>d.online).length} online</span><span>{overview?.pending_tasks||0} queued / active task(s)</span><span>{localNodes.length} local-capable</span><span>{cloudNodes.length} cloud-capable</span></div></section>
  {notice&&<div className="notice" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}
  <section className="grid">
   <article className="card"><div className="eyebrow">WINDOWS / LOCAL LINUX</div><h2>Local Android Virtual Devices</h2><p>Uses the Android SDK already installed on a paired Windows or Linux computer. Install a system image, create separate AVDs, and start/stop them on that computer. The device owner must accept Android SDK licenses locally.</p>
    {localNodes.length===0?<p className="muted">No paired computer currently advertises the new Android Emulator capabilities. Open Local Bridge and refresh its agent after the computer reconnects.</p>:localNodes.map(d=><div className="device" key={d.id}><b>{d.name}</b><small>{d.online?'Online':'Offline'} · {d.hostname} · {d.platform}</small>
      <button disabled={!d.online||busy!==''} onClick={()=>inspect(d,'android_emulator_status')}>CHECK SDK & ACCELERATION</button>
      <button disabled={!d.online||busy!==''} onClick={()=>inspect(d,'android_emulator_list')}>LIST VIRTUAL PHONES</button>
      <button className="secondary" disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_emulator_install_image',{image},'Download and install '+image+' on '+d.name+'? This downloads a large Android image and uses local disk/bandwidth. SDK licenses must already have been accepted by you.')}>INSTALL SYSTEM IMAGE</button>
      <button disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_emulator_create',{name,image,device_profile:profile},'Create a new Android Virtual Device named '+name+'? Existing AVDs will not be overwritten.')}>CREATE VIRTUAL PHONE</button>
      <button disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_emulator_start',{name},'Start Android virtual device '+name+'?')}>START</button>
      <button className="secondary" disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_emulator_stop',{name},'Stop Android virtual device '+name+'?')}>STOP</button>
      <button className="danger" disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_emulator_delete',{name},'Permanently delete AVD '+name+' and its virtual data?')}>DELETE AVD</button>
     </div>)}
    <label>Virtual phone name<input value={name} onChange={e=>setName(e.target.value)} maxLength={40}/></label>
    <label>Android system image package<input value={image} onChange={e=>setImage(e.target.value)}/></label>
    <label>Hardware profile<select value={profile} onChange={e=>setProfile(e.target.value)}><option value="pixel_2">Pixel 2</option><option value="pixel">Pixel</option><option value="pixel_3">Pixel 3</option><option value="pixel_4">Pixel 4</option></select></label>
    {localStatus&&<div className="result">Local SDK status: {JSON.stringify(localStatus,null,2)}</div>}
    {localList&&<div className="result">Local AVDs: {JSON.stringify(localList,null,2)}</div>}
   </article>
   <article className="card"><div className="eyebrow">OWNER-SUPPLIED LINUX KVM HOST</div><h2>Cloud Android Virtual Devices</h2><p>Runs Google’s Android Emulator container on a paired Linux host with Docker and hardware KVM access. This does not create a cloud VM. Hosting, storage, bandwidth and VM costs remain under your account and require your separate approval.</p>
    {cloudNodes.length===0?<p className="muted">No cloud KVM host paired yet. Create a one-time pairing code and run the installer on a Linux KVM host you control.</p>:cloudNodes.map(d=><div className="device" key={d.id}><b>{d.name}</b><small>{d.online?'Online':'Offline'} · {d.hostname} · {d.platform}</small><button disabled={!d.online||busy!==''} onClick={()=>inspect(d,'android_cloud_status')}>CHECK CLOUD KVM / DOCKER</button><button disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_cloud_start',{slot,google_sdk_license_accepted:true},'I have reviewed and accept the applicable Google Android SDK and emulator container terms. Start cloud Android emulator slot '+slot+' on this paired Linux host? This can download a large container image and consume disk and bandwidth. Ports are loopback-only.')}>START CLOUD VIRTUAL PHONE</button><button className="secondary" disabled={!d.online||busy!==''} onClick={()=>queue(d,'android_cloud_stop',{slot},'Stop cloud Android emulator slot '+slot+'? Container data is retained.')}>STOP CLOUD VIRTUAL PHONE</button></div>)}
    <label>Cloud emulator slot (0–9)<input type="number" min={0} max={9} value={slot} onChange={e=>setSlot(Math.max(0,Math.min(9,Number(e.target.value)||0)))}/></label>
    <button disabled={!token||busy!==''} onClick={pairCloud}>CREATE CLOUD HOST PAIRING CODE</button>
    {pairCode&&<><p className="muted">Single-use pairing code. Expires: {pairExpiry?new Date(pairExpiry*1000).toLocaleString():'within 10 minutes'}</p><div className="code">{pairCode}</div><p className="muted">Run this on the prepared Linux KVM host. It checks Docker, ADB, Python and /dev/kvm, then pairs the outbound Local Bridge. It does not install or provision paid hosting.</p><div className="code">curl -fsSL https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/install-cloud-node.sh | bash -s -- '{pairCode}'</div><button onClick={copyCloudCommand}>COPY PAIRING COMMAND</button></>}
    {cloudStatus&&<div className="result">Cloud host status: {JSON.stringify(cloudStatus,null,2)}</div>}
   </article>
  </section>
  <section className="card"><div className="eyebrow">TASK RECEIPTS</div><h2>Execution verification</h2><p>Queued tasks are not reported as completed until the paired bridge returns an actual result. Start the updated Local Bridge agent and then check task evidence here.</p>{task?<><div className="status"><span>{task.action}</span><span>{task.status}</span><span>{task.id}</span></div><button disabled={busy!==''} onClick={checkTask}>CHECK TASK RESULT</button><div className="result">{JSON.stringify(task,null,2)}</div></>:<p className="muted">No virtual-phone task submitted in this session.</p>}</section>
  <p className="muted" style={{maxWidth:1400,margin:'18px auto'}}>For local Windows setup or pairing refresh, use <a href="/local-bridge">Magnanimous Local Bridge</a>. The local PC must be online. Google’s Android Emulator container project is experimental and requires Linux plus KVM; consult the owner documentation before using a cloud VM.</p>
  <style jsx>{styles}</style>
 </main>;
}
