'use client';

import {useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Ready={id:string;ready:boolean;required:boolean;mode:string;detail:string};
type Suggestion={id:string;risk:string;action:string};
type Mesh={
 identity:string;status:string;ready_count:number;total_readiness_checks:number;route_count:number;
 readiness:Ready[];suggested_actions:Suggestion[];
 surfaces:{
  native_web?:{core_read_ready?:boolean;research_ready?:boolean;interactive_ready?:boolean;persistent_session_ready?:boolean;tinyfish_runtime_dependency?:boolean};
  github?:{repository_token_configured?:boolean;staged_writes?:boolean;merge_enabled?:boolean};
  cloudflare?:{configured?:boolean;family_count?:number;capability_count?:number;provider_required?:boolean};
  railway?:{direct_project_adapter_configured?:boolean;exact_commit_workflow_available?:boolean;exact_commit_workflow_control_ready?:boolean;native_contract_count?:number};
  magnanimous_cloud?:{native_binding_active?:boolean;native_control_plane_code?:boolean};
 };
 recent_checks?:Array<{id:string;status:string;ready_count:number;total_count:number;created_at:number}>;
};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||('Request failed ('+r.status+')')}}}
const card={border:'1px solid #254552',borderRadius:16,padding:18,background:'#071117'} as const;

export default function OwnerCapabilityMesh(){
 const[data,setData]=useState<Mesh|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState('');
 const token=()=>localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||'';
 async function load(){
  const t=token();if(!t){location.replace('/owner-login?returnTo=%2Fowner-capability-mesh');return}
  setError('');
  const r=await fetch(api+'/api/magnanimous/capability-mesh',{headers:{Authorization:'Bearer '+t},cache:'no-store'}),d=await read(r);
  if(r.status===401||r.status===403){localStorage.removeItem('odin_admin_token');localStorage.removeItem('magnanimous_admin_token');location.replace('/owner-login?returnTo=%2Fowner-capability-mesh');return}
  if(!r.ok){setError(d.detail||'Capability Mesh could not load.');return}
  setData(d);
 }
 useEffect(()=>{load()},[]);
 async function selfCheck(){
  setBusy('check');setMessage('');setError('');
  const r=await fetch(api+'/api/magnanimous/capability-mesh/self-check',{method:'POST',headers:{Authorization:'Bearer '+token()},cache:'no-store'}),d=await read(r);
  if(r.ok){setMessage('Capability Mesh self-check recorded.');setData({...d.summary,recent_checks:[d.check,...(data?.recent_checks||[])].filter(Boolean).slice(0,20)})}
  else setError(d.detail||'Self-check failed.');
  setBusy('');
 }
 async function stageRailway(){
  setBusy('railway');setMessage('');setError('');
  const r=await fetch(api+'/api/magnanimous/capability-mesh/route',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({capability:'railway.deploy_exact',input:{}})}),d=await read(r);
  if(r.ok){setMessage(d.status==='needs_confirmation'?'Exact-main Railway promotion is staged. Review and approve it in Magnanimous Dev Agent before execution.':'Railway promotion request prepared.');}
  else setError(d.detail||'Railway promotion could not be staged.');
  setBusy('');
 }
 return <main style={{minHeight:'100vh',background:'#04090d',color:'#ecf8ff',padding:'24px 30px 60px',fontFamily:'Inter,system-ui,sans-serif'}}>
  <header style={{maxWidth:1400,margin:'auto',display:'flex',justifyContent:'space-between',fontSize:10,letterSpacing:'.16em',color:'#7194a4'}}><a href="/owner-center" style={{color:'#7be7ff'}}>← Owner Center</a><span>PRIVATE MAGNANIMOUS CONTROL</span></header>
  <section style={{...card,maxWidth:1400,margin:'28px auto 12px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:24,flexWrap:'wrap'}}>
   <div><small style={{color:'#60ddf7'}}>I AM MAGNANIMOUS WAY™</small><h1 style={{fontSize:'clamp(38px,6vw,68px)',margin:'8px 0'}}>Capability Mesh</h1><p style={{maxWidth:850,color:'#90aab6',lineHeight:1.6}}>One Magnanimous AI command layer for native web/TinyFish-independent execution, GitHub engineering, Magnanimous Cloud, optional Cloudflare adapters and optional Railway capacity/deployment rails. Providers remain tools beneath the Magnanimous brain.</p></div>
   <div style={{display:'grid',gap:8,minWidth:250}}><b>{data?.status||'LOADING'}</b><span>{data?data.ready_count+' / '+data.total_readiness_checks+' readiness checks green':'Reading runtime evidence…'}</span><span>{data?data.route_count+' routed capability actions':'—'}</span></div>
  </section>
  {(message||error)&&<section style={{...card,maxWidth:1400,margin:'0 auto 12px',borderColor:error?'#713b43':'#315f48',color:error?'#ffc0c8':'#a9f1bd'}}>{error||message}</section>}
  <section style={{maxWidth:1400,margin:'0 auto 12px',display:'flex',gap:10,flexWrap:'wrap'}}>
   <button onClick={selfCheck} disabled={!!busy} style={{padding:'12px 15px',borderRadius:10,border:'1px solid #26788e',background:'#0d5264',color:'#effcff',fontWeight:800,cursor:'pointer'}}>{busy==='check'?'CHECKING…':'RUN FULL READINESS CHECK'}</button>
   <button onClick={stageRailway} disabled={!!busy||!data?.surfaces?.railway?.exact_commit_workflow_control_ready} style={{padding:'12px 15px',borderRadius:10,border:'1px solid #6b5a2b',background:'#463610',color:'#ffe8a8',fontWeight:800,cursor:'pointer'}}>{busy==='railway'?'STAGING…':'STAGE CURRENT-MAIN RAILWAY PROMOTION'}</button>
   <a href="/developer-agent" style={{padding:'12px 15px',borderRadius:10,border:'1px solid #31515f',color:'#a8eaff',textDecoration:'none'}}>Developer Agent / approvals →</a>
   <a href="/owner-web-agent" style={{padding:'12px 15px',borderRadius:10,border:'1px solid #31515f',color:'#a8eaff',textDecoration:'none'}}>Native Web →</a>
   <a href="/owner-infrastructure" style={{padding:'12px 15px',borderRadius:10,border:'1px solid #31515f',color:'#a8eaff',textDecoration:'none'}}>Infrastructure →</a>
  </section>
  {data&&<>
   <section style={{maxWidth:1400,margin:'0 auto 12px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:10}}>
    {data.readiness.map(r=><article key={r.id} style={{...card,borderColor:r.ready?'#275943':r.required?'#7a3d45':'#625329'}}><small style={{color:r.ready?'#84edaa':r.required?'#ffabb4':'#e8c975'}}>{r.ready?'READY':r.required?'ACTION NEEDED':'OPTIONAL / NOT READY'}</small><h3>{r.id}</h3><p style={{color:'#91a8b2',lineHeight:1.5}}>{r.detail}</p><code>{r.mode}</code></article>)}
   </section>
   <section style={{maxWidth:1400,margin:'0 auto 12px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:10}}>
    <article style={card}><small style={{color:'#60ddf7'}}>NATIVE WEB</small><h2>TinyFish-independent</h2><p>Search/fetch: <b>{data.surfaces.native_web?.core_read_ready?'READY':'NEEDS LOCAL BRIDGE'}</b></p><p>Research: <b>{data.surfaces.native_web?.research_ready?'READY':'NOT LIVE'}</b></p><p>Interactive: <b>{data.surfaces.native_web?.interactive_ready?'READY':'NOT LIVE'}</b></p></article>
    <article style={card}><small style={{color:'#60ddf7'}}>GITHUB</small><h2>Engineering rail</h2><p>Repository token: <b>{data.surfaces.github?.repository_token_configured?'READY':'READ-ONLY / TOKEN NEEDED FOR WRITES'}</b></p><p>Writes are staged: <b>{data.surfaces.github?.staged_writes?'YES':'NO'}</b></p></article>
    <article style={card}><small style={{color:'#60ddf7'}}>CLOUDFLARE</small><h2>Optional adapter</h2><p>Authorized: <b>{data.surfaces.cloudflare?.configured?'YES':'NO / NOT REQUIRED'}</b></p><p>{data.surfaces.cloudflare?.capability_count??0} public capability contracts across {data.surfaces.cloudflare?.family_count??0} families.</p></article>
    <article style={card}><small style={{color:'#60ddf7'}}>RAILWAY</small><h2>Optional capacity rail</h2><p>Exact workflow: <b>{data.surfaces.railway?.exact_commit_workflow_available?'INSTALLED':'MISSING'}</b></p><p>Runtime dispatch: <b>{data.surfaces.railway?.exact_commit_workflow_control_ready?'READY':'GITHUB ADAPTER NEEDED'}</b></p><p>Direct project token: <b>{data.surfaces.railway?.direct_project_adapter_configured?'READY':'OPTIONAL / NOT CONFIGURED'}</b></p></article>
   </section>
   {data.suggested_actions.length>0&&<section style={{...card,maxWidth:1400,margin:'0 auto 12px'}}><small style={{color:'#60ddf7'}}>MAGNANIMOUS INITIATIVE</small><h2>Suggested next actions</h2>{data.suggested_actions.map(x=><p key={x.id} style={{color:'#98adb7'}}><b>{x.id}</b> — {x.action} <code>{x.risk}</code></p>)}</section>}
   <section style={{...card,maxWidth:1400,margin:'0 auto'}}><small style={{color:'#60ddf7'}}>READINESS HISTORY</small><h2>Recent self-checks</h2>{!data.recent_checks?.length?<p style={{color:'#8098a3'}}>No saved checks yet. Run the full readiness check above.</p>:data.recent_checks.slice(0,10).map(x=><p key={x.id} style={{color:'#91a8b2'}}><b>{x.ready_count}/{x.total_count}</b> · {x.status} · {new Date(x.created_at*1000).toLocaleString()}</p>)}</section>
  </>}
 </main>
}
