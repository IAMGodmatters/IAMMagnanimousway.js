'use client';

import {useEffect,useMemo,useState} from 'react';

// Release marker: publish owner Edge AI after deploy workflow recovery.

type Device={id:string;name:string;hostname:string;platform:string;status:string;online:boolean;last_seen_at:number;capabilities:string[]};
type BridgeOverview={ready:boolean;paired:boolean;devices:Device[];pending_tasks:number};
type MeshCatalog={edge_ai_capabilities?:string[]};

const NCS2_ACTIONS=[
 ['ncs2_status','Runtime status'],
 ['ncs2_benchmark','Performance benchmark'],
 ['ncs2_detect','Object detection'],
 ['ncs2_media_triage','Image/media triage'],
 ['ncs2_batch_scan','Batch image scan'],
 ['ncs2_video_scan','Sampled video scan'],
 ['ncs2_face_detect','Face-presence framing'],
 ['ncs2_text_regions','Text-region detection'],
] as const;

export default function OwnerEdgeAiPage(){
 const [token,setToken]=useState('');
 const [bridge,setBridge]=useState<BridgeOverview|null>(null);
 const [catalog,setCatalog]=useState<MeshCatalog|null>(null);
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);

 const headers=(json=false)=>{const h:Record<string,string>={Authorization:`Bearer ${token}`};if(json)h['Content-Type']='application/json';return h};
 async function read(r:Response){const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||`HTTP ${r.status}`);return d}

 async function refresh(t=token){
  if(!t)return;
  setBusy(true);setNotice('');
  try{
   const [b,c]=await Promise.all([
    read(await fetch('/api/magnanimous/local-bridge',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'})),
    read(await fetch('/api/magnanimous/capability-mesh/catalog',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'})),
   ]);
   setBridge(b);setCatalog(c);
  }catch(e:any){setNotice(e?.message||'Could not load Edge AI status.')}finally{setBusy(false)}
 }

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||'';
  if(!saved){location.replace('/owner-login?returnTo=%2Fowner-edge-ai');return}
  setToken(saved);void refresh(saved);
 },[]);

 const devices=useMemo(()=>bridge?.devices||[],[bridge]);
 const ncs2Devices=useMemo(()=>devices.filter(d=>d.capabilities?.some(c=>c.startsWith('ncs2_'))),[devices]);
 const online=ncs2Devices.filter(d=>d.online);
 const capabilitySet=useMemo(()=>new Set(ncs2Devices.flatMap(d=>d.capabilities||[])),[ncs2Devices]);
 const registered=catalog?.edge_ai_capabilities||[];
 const ready=online.some(d=>d.capabilities.includes('ncs2_status'));

 return <main className="page">
  <header><a href="/owner-center">← Owner Center</a><span>PRIVATE OWNER • EDGE AI</span><a href="/local-bridge">Local Bridge →</a></header>

  <section className="hero">
   <small>I AM MAGNANIMOUS WAY™ • MAGNANIMOUS AI</small>
   <h1>Neural Compute Stick 2</h1>
   <p>Your Intel Neural Compute Stick 2 / MYRIAD is integrated as an owner-controlled local Edge AI coprocessor. Magnanimous AI can route supported image and media preprocessing to the paired Windows computer through the Local Bridge.</p>
   <div className="badges">
    <b className={ready?'good':'warn'}>{ready?'NCS2 READY':'NCS2 NOT CURRENTLY ONLINE'}</b>
    <span>{online.length} online NCS2 device(s)</span>
    <span>{ncs2Devices.length} paired NCS2 device(s)</span>
    <span>{bridge?.pending_tasks||0} pending local task(s)</span>
   </div>
  </section>

  {notice&&<div className="notice" role="status">{notice}</div>}

  <section className="grid">
   <article className="card">
    <small>WHAT WAS ADDED</small><h2>Magnanimous Edge AI path</h2>
    <ol>
     <li><strong>Magnanimous AI</strong> remains the brain and decides when local vision preprocessing is useful.</li>
     <li><strong>Capability Mesh</strong> exposes the NCS2 edge routes and checks whether the Local Bridge advertises each action.</li>
     <li><strong>Local Bridge</strong> securely carries the bounded task to your authorized Windows computer using outbound HTTPS.</li>
     <li><strong>Intel NCS2 / MYRIAD</strong> performs supported local OpenVINO inference and returns the result to Magnanimous.</li>
    </ol>
    <p className="note">The NCS2 is a vision coprocessor. It accelerates supported local inference and preprocessing; it does not accelerate the ChatGPT cloud model itself.</p>
   </article>

   <article className="card">
    <small>LIVE CONTROL</small><h2>Inspect the connection</h2>
    <p>Use this page for the Edge AI view and Local Bridge for pairing, health checks and device controls.</p>
    <div className="actions"><button onClick={()=>refresh()} disabled={!token||busy}>{busy?'REFRESHING…':'REFRESH LIVE STATUS'}</button><a className="button" href="/local-bridge">OPEN LOCAL BRIDGE</a><a className="button" href="/owner-capability-mesh">OPEN CAPABILITY MESH</a></div>
   </article>
  </section>

  <section className="card">
   <small>NCS2 CAPABILITIES</small><h2>What the stick can do for Magnanimous</h2>
   <div className="caps">{NCS2_ACTIONS.map(([id,label])=><div key={id} className={capabilitySet.has(id)?'cap ready':'cap'}><b>{label}</b><code>{id}</code><span>{capabilitySet.has(id)?'READY ON PAIRED DEVICE':'REGISTERED / WAITING FOR DEVICE'}</span></div>)}</div>
   {registered.length>0&&<p className="registered">Capability Mesh routes: {registered.join(' • ')}</p>}
  </section>

  <section className="card">
   <small>PAIRED EDGE DEVICES</small><h2>Neural hardware visible to the platform</h2>
   {!ncs2Devices.length?<p>No paired computer is currently advertising NCS2 capabilities. Open Local Bridge and bring the Windows bridge online; the integration remains installed in the platform.</p>:ncs2Devices.map(d=><article className="device" key={d.id}>
    <div><b>{d.name||'Magnanimous Windows Computer'}</b><p>{d.hostname||'Windows device'} • {d.platform||'local bridge'}</p></div>
    <span className={d.online?'online':'offline'}>{d.online?'ONLINE':'OFFLINE'}</span>
    <small>{(d.capabilities||[]).filter(c=>c.startsWith('ncs2_')).join(' • ')}</small>
   </article>)}
  </section>

  <section className="card explain">
   <small>OFFLINE + ONLINE</small><h2>How your phone and platform benefit</h2>
   <p><strong>Offline:</strong> OpenVINO and the installed model files can run local supported inference on the Windows computer without sending the image through a cloud vision service.</p>
   <p><strong>Online:</strong> I AM Magnanimous Way can route an eligible task through Magnanimous AI → Capability Mesh → Local Bridge → NCS2 and use the returned result in the larger workflow. A phone can therefore benefit indirectly by using the web platform while the paired computer performs the local NCS2 work.</p>
  </section>

  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#05080c;color:#eafaff;padding:24px 28px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 0,rgba(99,230,255,.13),transparent 30%)}header,.hero,.grid,.card,.notice{max-width:1400px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:12px;font-size:9px;letter-spacing:.15em;color:#6d8994}a{color:#74dff2;text-decoration:none}.hero{margin-top:26px;padding:30px;border:1px solid #205267;border-radius:22px;background:#07141c}.hero h1{font-size:clamp(38px,6vw,72px);margin:6px 0}.hero p{max-width:980px;color:#9ab3bd;line-height:1.65}.badges{display:flex;gap:8px;flex-wrap:wrap}.badges>*{border:1px solid #24596b;border-radius:999px;padding:8px 11px;font-size:9px}.good{border-color:#267c55!important;color:#86f6bb}.warn{border-color:#8a6a2d!important;color:#f1cf82}.notice{margin-top:12px;padding:12px;border:1px solid #5b4927;background:#171208;border-radius:10px;color:#efd18d}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:12px}.card{margin-top:12px;padding:22px;border:1px solid #173b49;border-radius:16px;background:#071118}.grid .card{margin-top:0}.card h2{margin:6px 0 12px}.card small{color:#63d8f1;letter-spacing:.14em;font-size:9px}.card p,.card li{color:#91aab4;font-size:12px;line-height:1.65}.note{padding:12px;border-left:3px solid #63d8f1;background:#061a22}.actions{display:flex;gap:8px;flex-wrap:wrap}button,.button{border:1px solid #2b6576;background:#0c222b;color:#dffaff;border-radius:10px;padding:11px 13px;font-weight:800;font-size:10px;cursor:pointer}.caps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cap{padding:13px;border:1px solid #24363d;border-radius:12px;background:#060d11}.cap.ready{border-color:#267c55;background:#07170f}.cap b,.cap code,.cap span{display:block}.cap code{margin:7px 0;color:#63d8f1;font-size:10px}.cap span{font-size:8px;color:#6f8994;letter-spacing:.08em}.registered{word-break:break-word}.device{margin-top:10px;padding:14px;border:1px solid #203e49;border-radius:12px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.device p{margin:3px 0}.device small{grid-column:1/-1;word-break:break-word}.online,.offline{font-size:9px;font-weight:900;border-radius:999px;padding:7px 9px}.online{color:#86f6bb;border:1px solid #267c55}.offline{color:#f1cf82;border:1px solid #8a6a2d}.explain strong{color:#dffaff}@media(max-width:900px){.grid{grid-template-columns:1fr}.caps{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.page{padding:18px 14px 50px}header{flex-wrap:wrap}.hero{padding:22px}.caps{grid-template-columns:1fr}.device{grid-template-columns:1fr}.device small{grid-column:1}}
  `}</style>
 </main>
}
