'use client';
import {useEffect,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}
function when(value:any){if(!value)return'—';const d=new Date(typeof value==='number'?value*1000:value);return Number.isNaN(d.getTime())?'—':d.toLocaleString()}
function count(value:any[]|undefined){return Array.isArray(value)?value.length:0}

export default function OwnerSelfHealing(){
 const[data,setData]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(record=false){
  const token=getPlatformAuthToken();
  if(!token){location.replace('/owner-login?returnTo=%2Fowner-self-healing');return}
  setBusy(true);setError('');
  try{
   const path=record?'/api/operations/self-healing/check-now':'/api/operations/self-healing';
   const r=await fetch(`${api}${path}`,{method:record?'POST':'GET',headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   const d=await read(r);
   if(r.status===401||r.status===403){location.replace('/owner-login?returnTo=%2Fowner-self-healing');return}
   if(!r.ok){setError(d.detail||'Self-healing status could not be loaded.');return}
   setData(d);
  }catch{setError('Self-healing status could not be loaded.')}
  finally{setBusy(false)}
 }
 useEffect(()=>{load(false)},[]);
 const p=data?.production_health||{},provider=data?.provider_health||{},voice=data?.voice_audio_health||{};
 return <main className="page">
  <header><a href="/owner-operations">← Operations</a><span>MAGNANIMOUS SELF-HEALING</span><button disabled={busy} onClick={()=>load(true)}>{busy?'CHECKING…':'RUN SAFE CHECK NOW'}</button></header>
  <section className="hero"><small>I AM MAGNANIMOUS WAY™ • OWNER ONLY</small><h1>Detect, retry, verify, and escalate without hiding failures.</h1><p>Safe transient repairs use capped retries. Persistent faults remain visible and do not authorize unfunded paid fallback, weaker authentication, or bypasses around billing, privacy, tenant isolation, consent, or deployment safeguards.</p></section>
  {error&&<div className="error">{error}</div>}
  {!data?<div className="loading">Loading verified operating state…</div>:<>
   <section className="cards">
    <article className={p.status==='healthy'?'good':'warn'}><small>PRODUCTION HEALTH</small><b>{String(p.status||'unknown').toUpperCase()}</b><span>HTTP {p.http_status||'—'} • {p.latency_ms||0} ms • {p.attempt_count||0} attempt(s)</span></article>
    <article className={provider.free_first_ready?'good':'warn'}><small>FREE-FIRST AI</small><b>{provider.free_first_ready?'READY':'ATTENTION'}</b><span>{provider.paid_fallback_required?'Paid fallback would be required.':'Paid fallback is not required.'}</span></article>
    <article><small>VOICE / AUDIO</small><b>{String(voice.status||'unknown').toUpperCase()}</b><span>{voice.note||'No voice health detail.'}</span></article>
    <article><small>DEPLOYMENT REVISION</small><b className="sha">{data.deployment_revision||'unreported'}</b><span>Production self-report; no credential values are shown.</span></article>
    <article className={count(data.current_incidents)?'warn':'good'}><small>CURRENT INCIDENTS</small><b>{count(data.current_incidents)}</b><span>{count(data.failed_repairs)} failed/escalated records • {count(data.successful_repairs)} successful repairs</span></article>
    <article><small>COST IMPACT</small><b>$${Number(data.cost_impact_usd||0).toFixed(2)}</b><span>{data.paid_fallback_required?'Paid fallback required before continuation.':'No paid fallback required by this check.'}</span></article>
   </section>
   <section className="provider"><h2>Private execution health</h2><p>Provider identities stay owner-only. Consumers continue to see Magnanimous AI.</p><div className="providerGrid">
    {Object.entries(provider).filter(([k,v])=>v&&typeof v==='object').map(([key,value]:any)=><div key={key}><small>{key.replaceAll('_',' ').toUpperCase()}</small><b>{String(value.status||'unknown').toUpperCase()}</b><span>{value.configured?'Configured':'Not configured'}</span></div>)}
   </div></section>
   <section className="incidents"><h2>Current incidents</h2>{!count(data.current_incidents)?<p className="empty">No unresolved self-healing incident is recorded.</p>:data.current_incidents.map((x:any)=><article key={x.id}><div><b>{x.content||x.stage}</b><span>{x.stage} • {x.status}</span></div><time>{when(x.updated_at)}</time><pre>{JSON.stringify(x.metadata||{},null,2)}</pre></article>)}</section>
   <section className="incidents"><h2>Recent repair evidence</h2>{!count(data.recent_events)?<p className="empty">No repair event has been recorded yet.</p>:data.recent_events.slice(0,30).map((x:any)=><article key={x.id}><div><b>{x.content||x.stage}</b><span>{x.stage} • retry {Number(x.metadata?.retry_count||0)}</span></div><time>{when(x.updated_at)}</time></article>)}</section>
   <section className="contract"><small>CONTROLLED FLOW</small><h2>Detect → diagnose → repair → test → verify → record.</h2><p>Automatic checks may retry only safe idempotent health requests. Code changes still travel through repository review, tests, merge safeguards, deployment, and production verification.</p><p>Generated {when(data.generated_at)} • Audit evidence {data.audit_evidence_available?'available':'not available'}.</p></section>
  </>}
  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#05090d;color:#eaf7ff;padding:24px 28px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 0,rgba(61,216,255,.09),transparent 30%)}header,.hero,.cards,.provider,.incidents,.contract,.error,.loading{max-width:1450px;margin-left:auto;margin-right:auto}header{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:9px;letter-spacing:.14em;color:#668594}header a{color:#72dff5;text-decoration:none}header button{border:1px solid #2d6878;border-radius:10px;background:#09202b;color:#bdf4ff;padding:10px 12px;font-size:9px;font-weight:900;cursor:pointer}.hero{margin-top:26px;border:1px solid #1c4350;border-radius:22px;padding:32px;background:linear-gradient(135deg,#07151d,#070b10)}.hero small,.cards small,.contract small{font-size:9px;letter-spacing:.16em;color:#55d9ef}.hero h1{font-size:clamp(38px,5.5vw,68px);line-height:.98;margin:8px 0}.hero p,.provider p,.contract p{max-width:1000px;color:#819aa5;line-height:1.65}.error,.loading{margin-top:10px;padding:12px;border-radius:10px}.error{border:1px solid #63313a;background:#211014;color:#ffb8c0}.loading{border:1px solid #173844;background:#071017;color:#78939e}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.cards article,.provider,.incidents,.contract{border:1px solid #173844;border-radius:14px;background:#071017;padding:17px}.cards article.good{border-color:#295849}.cards article.warn{border-color:#70404a}.cards b,.cards span{display:block}.cards b{font-size:24px;color:#8eeafa;margin:7px 0}.cards .good b{color:#8de7b3}.cards .warn b{color:#ff9da8}.cards span{font-size:9px;color:#708c96;line-height:1.5}.cards .sha{font-size:11px;overflow-wrap:anywhere}.provider,.incidents,.contract{margin-top:10px}.provider h2,.incidents h2,.contract h2{margin:0 0 8px;font-size:24px}.providerGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.providerGrid>div{border:1px solid #1d3f4a;border-radius:10px;padding:12px}.providerGrid small,.providerGrid b,.providerGrid span{display:block}.providerGrid small{color:#5d98a7;font-size:8px}.providerGrid b{color:#b9edf5;margin:5px 0;font-size:12px}.providerGrid span{color:#718d96;font-size:9px}.incidents article{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #142c34;padding:12px 0}.incidents article:first-of-type{border-top:0}.incidents b,.incidents span{display:block}.incidents b{font-size:11px}.incidents span,.incidents time,.empty{font-size:9px;color:#718d96}.incidents pre{grid-column:1/-1;margin:0;padding:9px;background:#050a0d;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;color:#93b9c2;font-size:8px}@media(max-width:950px){.cards{grid-template-columns:1fr 1fr}.providerGrid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.page{padding:18px 12px}.cards,.providerGrid{grid-template-columns:1fr}header{flex-wrap:wrap}.hero{padding:24px 18px}}
  `}</style>
 </main>
}
