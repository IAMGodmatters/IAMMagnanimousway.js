'use client';

import {useEffect,useMemo,useState} from 'react';

type Capability={id:string;name:string;mode?:string;notes?:string};
type Family={id:string;name:string;capabilities:Capability[]};
type Technique={id:string;name:string;apply:string};
type McpServer={id:string;url:string;purpose:string;recommended?:boolean};
type ActionRow={id:string;method:string;api_path:string;risk_class:string;status:string;created_at:number;response_status?:number;error_text?:string};

type Overview={
  identity?:string;brain_identity?:string;family_count?:number;capability_count?:number;
  readiness?:{configured?:boolean;account_id_configured?:boolean;zone_id_configured?:boolean;least_privilege_token_recommended?:boolean};
  credential_names?:string[];families?:Family[];skills?:string[];techniques?:Technique[];mcp_servers?:McpServer[];
  action_model?:string;
};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const pretty=(value:any)=>JSON.stringify(value,null,2);

export default function OwnerCloudflare(){
 const[overview,setOverview]=useState<Overview|null>(null),[actions,setActions]=useState<ActionRow[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState('');
 const[readPath,setReadPath]=useState('/zones'),[readResult,setReadResult]=useState<any>(null);
 const[method,setMethod]=useState('PATCH'),[mutationPath,setMutationPath]=useState(''),[mutationBody,setMutationBody]=useState('{}');
 const[filter,setFilter]=useState('');
 function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
 function headers(json=false){const h:Record<string,string>={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}
 async function body(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`HTTP ${r.status}`}}}
 async function load(){
  if(!token()){location.replace('/login');return}
  setBusy('load');setMessage('');
  try{
   const[o,a]=await Promise.all([
    fetch(`${api}/api/cloudflare/overview`,{headers:headers(),cache:'no-store'}),
    fetch(`${api}/api/cloudflare/actions`,{headers:headers(),cache:'no-store'})
   ]);
   const od=await body(o),ad=await body(a);
   if(o.status===401||o.status===403){location.replace('/login');return}
   if(!o.ok)throw new Error(od.detail||'Unable to load Cloudflare control plane.');
   setOverview(od);setActions(ad.actions||[]);
  }catch(e:any){setMessage(e?.message||'Unable to load Cloudflare control plane.')}finally{setBusy('')}
 }
 useEffect(()=>{load()},[]);

 const visibleFamilies=useMemo(()=>{
  const q=filter.trim().toLowerCase();if(!q)return overview?.families||[];
  return (overview?.families||[]).map(f=>({...f,capabilities:f.capabilities.filter(c=>`${c.id} ${c.name} ${c.mode||''}`.toLowerCase().includes(q))})).filter(f=>f.name.toLowerCase().includes(q)||f.capabilities.length);
 },[overview,filter]);

 async function verify(){setBusy('verify');setMessage('');try{const r=await fetch(`${api}/api/cloudflare/token-verify`,{headers:headers(),cache:'no-store'}),d=await body(r);setReadResult(d);if(!r.ok)throw new Error(d.detail||'Token verification failed.');setMessage('Cloudflare token verification completed.')}catch(e:any){setMessage(e?.message||'Token verification failed.')}finally{setBusy('')}}
 async function quick(path:string){setBusy(path);setMessage('');try{const r=await fetch(`${api}${path}`,{headers:headers(),cache:'no-store'}),d=await body(r);setReadResult(d);if(!r.ok)throw new Error(d.detail||`Request failed (${r.status}).`);setMessage('Cloudflare read completed.')}catch(e:any){setMessage(e?.message||'Cloudflare read failed.')}finally{setBusy('')}}
 async function runRead(){setBusy('read');setMessage('');setReadResult(null);try{const r=await fetch(`${api}/api/cloudflare/read`,{method:'POST',headers:headers(true),body:JSON.stringify({path:readPath})}),d=await body(r);setReadResult(d);if(!r.ok)throw new Error(d.detail||`Cloudflare read failed (${r.status}).`);setMessage('Read-only Cloudflare API request completed.')}catch(e:any){setMessage(e?.message||'Cloudflare read failed.')}finally{setBusy('')}}
 async function stage(){
  setBusy('stage');setMessage('');
  try{let parsed:any={};try{parsed=mutationBody.trim()?JSON.parse(mutationBody):{}}catch{throw new Error('Mutation body must be valid JSON.')}
   const r=await fetch(`${api}/api/cloudflare/actions`,{method:'POST',headers:headers(true),body:JSON.stringify({method,path:mutationPath,body:parsed})}),d=await body(r);
   if(!r.ok)throw new Error(d.detail||'Unable to stage Cloudflare action.');
   setMessage(`Action ${d.id} staged. Nothing has executed yet. Review it below, then approve separately.`);await load();
  }catch(e:any){setMessage(e?.message||'Unable to stage Cloudflare action.')}finally{setBusy('')}
 }
 async function confirm(id:string){
  setBusy(`confirm-${id}`);setMessage('');
  try{const r=await fetch(`${api}/api/cloudflare/actions/${encodeURIComponent(id)}/confirm`,{method:'POST',headers:headers(true),body:JSON.stringify({confirm:true})}),d=await body(r);setReadResult(d);if(!r.ok)throw new Error(d.required_configuration||d.detail||'Cloudflare action did not execute.');setMessage(`Cloudflare action ${id} completed.`);await load();}
  catch(e:any){setMessage(e?.message||'Cloudflare action was not executed.');await load()}finally{setBusy('')}
 }

 return <main className="shell">
  <header><a href="/owner-center">← Owner Center</a><span>MAGNANIMOUS CLOUDFLARE CONTROL</span></header>
  <section className="hero">
   <div><small>MAGNANIMOUS AI • OWNER-ONLY INFRASTRUCTURE CONTROL</small><h1>Cloudflare capabilities, skills, techniques and actions.</h1><p>Magnanimous remains the brain and public identity. Cloudflare is an internal infrastructure provider. Reads can run with a dedicated least-privilege token; mutations are staged, reviewed and separately approved.</p></div>
   <div className="status"><b>{overview?.readiness?.configured?'TOKEN READY':'TOKEN NOT CONFIGURED'}</b><span>{overview?.capability_count||0} mapped capabilities</span><span>{overview?.family_count||0} product families</span></div>
  </section>
  {message&&<div className="notice" role="status" aria-live="polite">{message}</div>}

  <section className="grid top">
   <article><small>READINESS</small><h2>Connection</h2><p>Dedicated token: <b>{overview?.readiness?.configured?'configured':'not configured'}</b></p><p>Account ID: <b>{overview?.readiness?.account_id_configured?'configured':'not configured'}</b></p><p>Zone ID: <b>{overview?.readiness?.zone_id_configured?'configured':'optional / not configured'}</b></p><div className="buttons"><button onClick={verify} disabled={!!busy}>VERIFY TOKEN</button><button onClick={()=>quick('/api/cloudflare/account')} disabled={!!busy}>READ ACCOUNT</button><button onClick={()=>quick('/api/cloudflare/zones')} disabled={!!busy}>LIST ZONES</button></div></article>
   <article><small>SECURE CONFIGURATION</small><h2>Credential names</h2><p>No Cloudflare API token is entered or displayed in this browser console.</p><pre>{(overview?.credential_names||[]).join('\n')||'Loading…'}</pre><p className="muted">Use a dedicated least-privilege Worker secret. Do not reuse the deployment token.</p></article>
   <article><small>ACTION MODEL</small><h2>Fail closed</h2><p>{overview?.action_model||'Owner-only reads; mutations use staged confirmation and hard locks.'}</p><p>Spend, destructive, identity/secret, resource-creation and network-control actions remain independently disabled until their server-side locks are deliberately enabled.</p></article>
  </section>

  <section className="panel"><div className="panelHead"><div><small>READ-ONLY API ACTION</small><h2>Run a Cloudflare GET</h2></div></div><div className="row"><label>Relative Cloudflare API path<input value={readPath} onChange={e=>setReadPath(e.target.value)} placeholder="/zones or /accounts/{id}/workers/scripts"/></label><button onClick={runRead} disabled={busy==='read'||!readPath.trim()}>{busy==='read'?'READING…':'RUN SAFE READ'}</button></div></section>

  <section className="panel"><div className="panelHead"><div><small>TWO-STEP MUTATION</small><h2>Stage infrastructure action</h2></div><span>STAGE ≠ EXECUTE</span></div><div className="mutation"><label>Method<select value={method} onChange={e=>setMethod(e.target.value)}><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label><label>Relative API path<input value={mutationPath} onChange={e=>setMutationPath(e.target.value)} placeholder="/zones/{zone_id}/dns_records/{record_id}"/></label><label className="wide">JSON body<textarea value={mutationBody} onChange={e=>setMutationBody(e.target.value)} spellCheck={false}/></label><button onClick={stage} disabled={busy==='stage'||!mutationPath.trim()}>{busy==='stage'?'STAGING…':'STAGE FOR REVIEW'}</button></div></section>

  <section className="panel"><div className="panelHead"><div><small>DURABLE ACTION LEDGER</small><h2>Pending and recent actions</h2></div><button onClick={load} disabled={!!busy}>REFRESH</button></div>{actions.length===0?<p className="empty">No Cloudflare actions recorded yet.</p>:<div className="actions">{actions.map(a=><article key={a.id}><div><b>{a.method} {a.api_path}</b><span>{a.risk_class}</span></div><strong className={a.status}>{a.status.replaceAll('_',' ')}</strong>{a.status==='needs_confirmation'&&<button onClick={()=>confirm(a.id)} disabled={busy===`confirm-${a.id}`}>{busy===`confirm-${a.id}`?'CHECKING LOCKS…':'REVIEWED — APPROVE & RUN'}</button>}{a.error_text&&<p>{a.error_text}</p>}</article>)}</div>}</section>

  <section className="panel"><div className="panelHead"><div><small>CAPABILITY MAP</small><h2>Cloudflare platform</h2></div><input className="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter capabilities…" aria-label="Filter Cloudflare capabilities"/></div><div className="families">{visibleFamilies.map(f=><article key={f.id}><h3>{f.name}</h3><div>{f.capabilities.map(c=><span key={`${f.id}-${c.id}`}><b>{c.name}</b><small>{c.mode||'adapter'}</small></span>)}</div></article>)}</div></section>

  <section className="grid"><article><small>OFFICIAL MCP</small><h2>Managed servers</h2>{(overview?.mcp_servers||[]).map(m=><div className="list" key={m.id}><b>{m.id}{m.recommended?' • recommended':''}</b><code>{m.url}</code><span>{m.purpose}</span></div>)}</article><article><small>OFFICIAL SKILLS</small><h2>On-demand knowledge</h2><div className="tags">{(overview?.skills||[]).map(s=><span key={s}>{s}</span>)}</div></article></section>

  <section className="panel"><div className="panelHead"><div><small>ARCHITECTURE TECHNIQUES</small><h2>Patterns Magnanimous can apply</h2></div></div><div className="techniques">{(overview?.techniques||[]).map(t=><article key={t.id}><b>{t.name}</b><p>{t.apply}</p></article>)}</div></section>

  {readResult&&<section className="panel"><div className="panelHead"><div><small>LAST RESULT</small><h2>Provider response</h2></div><button onClick={()=>setReadResult(null)}>CLEAR</button></div><pre className="result">{pretty(readResult)}</pre></section>}

  <footer>Magnanimous AI remains the commander • Cloudflare stays internal and replaceable • secrets never render here</footer>
  <style jsx>{`
   *{box-sizing:border-box}.shell{min-height:100vh;background:#05080d;color:#edf8ff;padding:24px 32px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 10%,rgba(45,145,255,.14),transparent 30%),radial-gradient(circle at 12% 85%,rgba(255,156,42,.08),transparent 30%)}header{max-width:1450px;margin:auto;display:flex;justify-content:space-between;font-size:11px;letter-spacing:.14em;color:#7791a5}a{color:#9adfff;text-decoration:none}.hero{max-width:1450px;margin:28px auto 16px;border:1px solid #183246;background:#09111b;padding:34px;border-radius:18px;display:grid;grid-template-columns:1fr 250px;gap:26px}.hero small,.panel small,article>small{color:#6fa9c6;letter-spacing:.14em}.hero h1{font-size:34px;margin:9px 0 12px}.hero p{max-width:900px;color:#aac0cf;line-height:1.6}.status{border-left:1px solid #20384a;padding-left:24px;display:flex;flex-direction:column;gap:10px}.status b{color:#77e1af}.status span{color:#9db2c0}.notice{max-width:1450px;margin:0 auto 16px;padding:14px 18px;border:1px solid #27506c;border-radius:12px;background:#0a1722;color:#bfeaff}.grid{max-width:1450px;margin:16px auto;display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid.top{grid-template-columns:repeat(3,1fr)}article,.panel{border:1px solid #183246;background:#08111a;border-radius:16px}.grid>article{padding:24px}.grid h2,.panel h2{margin:7px 0 14px;font-size:20px}.grid p{color:#a7bac7;line-height:1.55}.buttons{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}button{min-height:44px;border:1px solid #2a5876;border-radius:10px;background:#0d2030;color:#c9eeff;padding:10px 14px;font-weight:700;cursor:pointer}button:hover{background:#123049}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #83d8ff;outline-offset:2px}button:disabled{opacity:.5;cursor:not-allowed}pre{white-space:pre-wrap;overflow:auto;color:#a9d4e9;background:#050b11;border:1px solid #142b3a;border-radius:10px;padding:13px}.muted{font-size:12px}.panel{max-width:1450px;margin:16px auto;padding:24px}.panelHead{display:flex;justify-content:space-between;align-items:center;gap:16px}.panelHead>span{font-size:11px;color:#f0b26f;border:1px solid #6d4b28;padding:7px 9px;border-radius:999px}.row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}.mutation{display:grid;grid-template-columns:140px 1fr;gap:12px}.mutation .wide{grid-column:1/-1}.mutation button{grid-column:1/-1;justify-self:start}label{display:flex;flex-direction:column;gap:7px;color:#abc0cf;font-size:12px}input,textarea,select{min-height:44px;background:#040a10;border:1px solid #24475d;border-radius:10px;color:#eaf8ff;padding:10px 12px}textarea{min-height:140px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.actions{display:grid;gap:9px}.actions article{padding:14px;display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center}.actions article div{display:flex;flex-direction:column;gap:5px}.actions span{font-size:11px;color:#7997aa}.actions strong{font-size:11px;text-transform:uppercase;color:#89d7ff}.actions strong.completed{color:#78e2a9}.actions strong.failed,.actions strong.expired{color:#ff9e9e}.actions p{grid-column:1/-1;color:#ffb0b0}.empty{color:#7892a4}.search{width:min(360px,100%)}.families{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.families article{padding:17px}.families h3{margin:0 0 12px}.families article>div{display:flex;flex-wrap:wrap;gap:7px}.families span,.tags span{display:flex;gap:7px;align-items:center;border:1px solid #1e4055;background:#0b1a25;border-radius:999px;padding:7px 9px;font-size:11px}.families span small{color:#7293a6}.list{display:flex;flex-direction:column;gap:4px;margin:12px 0}.list code{color:#8dd8ff}.list span{color:#8ba1b0;font-size:12px}.tags{display:flex;flex-wrap:wrap;gap:8px}.techniques{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.techniques article{padding:16px}.techniques p{color:#9bb1c0;line-height:1.45;font-size:13px}.result{max-height:520px}.shell footer{max-width:1450px;margin:26px auto 0;text-align:center;color:#647d8d;font-size:11px;letter-spacing:.08em}@media(max-width:1000px){.grid.top,.families,.techniques{grid-template-columns:1fr 1fr}.hero{grid-template-columns:1fr}.status{border-left:0;border-top:1px solid #20384a;padding:18px 0 0}}@media(max-width:700px){.shell{padding:18px 14px 50px}.grid,.grid.top,.families,.techniques,.mutation,.row{grid-template-columns:1fr}.hero{padding:22px}.hero h1{font-size:27px}.panelHead{align-items:flex-start;flex-direction:column}.actions article{grid-template-columns:1fr}.mutation .wide,.mutation button{grid-column:auto}}
  `}</style>
 </main>
}
