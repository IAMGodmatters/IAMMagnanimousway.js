'use client';
import {FormEvent,useEffect,useState} from 'react';
import styles from './page.module.css';

type Cap={ready:boolean;mode:string;confirmation:boolean;description:string};
type Caps={architecture:string;browser_engine:string;tinyfish_required:boolean;capabilities:Record<string,Cap>};
type Run={id:string;kind?:string;action?:string;status:string;requires_confirmation?:boolean;result?:any;error?:string};
type Monitor={id:string;name:string;kind:string;interval_minutes:number;status:string;changed:boolean;last_run_at:number;last_changed_at:number;last_error:string};

async function readData(response:Response){
 const text=await response.text();let out:any={};
 try{out=JSON.parse(text)}catch{out={detail:text}}
 if(!response.ok)throw new Error(out.detail||'Request failed ('+response.status+')');
 return out;
}

export default function OwnerWebAgentPage(){
 const[token,setToken]=useState('');
 const[caps,setCaps]=useState<Caps|null>(null);
 const[runs,setRuns]=useState<Run[]>([]);
 const[monitors,setMonitors]=useState<Monitor[]>([]);
 const[query,setQuery]=useState('');
 const[url,setUrl]=useState('');
 const[monitorUrl,setMonitorUrl]=useState('');
 const[monitorName,setMonitorName]=useState('');
 const[notice,setNotice]=useState('');
 const[error,setError]=useState('');
 const[busy,setBusy]=useState('');

 const headers=(json=false,t=token)=>{
  const value:Record<string,string>={Authorization:'Bearer '+t};
  if(json)value['Content-Type']='application/json';
  return value;
 };

 async function refresh(t=token){
  if(!t)return;
  const[c,m]=await Promise.all([
   fetch('/api/magnanimous/native-web/capabilities',{headers:headers(false,t),cache:'no-store'}).then(readData),
   fetch('/api/magnanimous/native-web/monitors',{headers:headers(false,t),cache:'no-store'}).then(readData)
  ]);
  setCaps(c);setMonitors(m.monitors||[]);
 }

 useEffect(()=>{
  const t=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||'';
  if(!t){location.replace('/owner-login');return}
  setToken(t);refresh(t).catch(e=>setError(e.message));
 },[]);

 useEffect(()=>{
  if(!token||!runs.some(r=>['queued','claimed'].includes(r.status)))return;
  const timer=setInterval(()=>runs.forEach(r=>{if(['queued','claimed'].includes(r.status))void poll(r.id)}),2500);
  return()=>clearInterval(timer);
 },[token,runs]);

 async function queue(kind:string,body:any){
  setBusy(kind);setError('');setNotice('');
  try{
   const d=await readData(await fetch('/api/magnanimous/native-web/runs',{method:'POST',headers:headers(true),body:JSON.stringify({kind,...body})}));
   const next:Run={id:d.id,kind,status:d.status,requires_confirmation:d.requires_confirmation};
   setRuns(list=>[next,...list.filter(x=>x.id!==next.id)]);
   setNotice(d.requires_confirmation?'Task prepared. Confirm the exact browser action before it executes.':'Native browser task queued on your paired Magnanimous computer.');
  }catch(e:any){setError(e.message||'Could not queue native browser task.')}finally{setBusy('')}
 }

 async function poll(id:string){
  try{
   const d=await readData(await fetch('/api/magnanimous/native-web/runs/'+encodeURIComponent(id),{headers:headers(),cache:'no-store'}));
   setRuns(list=>list.map(x=>x.id===id?{...x,...d}:x));
  }catch{}
 }

 async function confirmRun(id:string){
  setBusy(id);setError('');
  try{
   const d=await readData(await fetch('/api/magnanimous/native-web/runs/'+encodeURIComponent(id)+'/confirm',{method:'POST',headers:headers(true),body:'{}'}));
   setRuns(list=>list.map(x=>x.id===id?{...x,status:d.status,requires_confirmation:false}:x));
   setNotice('Exact browser action confirmed and queued.');
  }catch(e:any){setError(e.message)}finally{setBusy('')}
 }

 async function cancelRun(id:string){
  setBusy(id);setError('');
  try{
   await readData(await fetch('/api/magnanimous/native-web/runs/'+encodeURIComponent(id)+'/cancel',{method:'POST',headers:headers(true),body:'{}'}));
   setRuns(list=>list.map(x=>x.id===id?{...x,status:'cancelled'}:x));
  }catch(e:any){setError(e.message)}finally{setBusy('')}
 }

 async function createMonitor(e:FormEvent){
  e.preventDefault();setBusy('monitor');setError('');
  try{
   await readData(await fetch('/api/magnanimous/native-web/monitors',{method:'POST',headers:headers(true),body:JSON.stringify({kind:'fetch',name:monitorName||'Website monitor',url:monitorUrl,interval_minutes:60})}));
   setMonitorName('');setMonitorUrl('');await refresh();setNotice('Native website monitor created.');
  }catch(e:any){setError(e.message)}finally{setBusy('')}
 }

 const browserReady=!!caps?.capabilities?.fetch?.ready;
 return <main className={styles.page}>
  <header className={styles.header}><a href="/owner-center">← Owner Center</a><span>PRIVATE OWNER • MAGNANIMOUS NATIVE WEB</span><a href="/local-bridge">Local Bridge →</a></header>

  <section className={styles.hero}>
   <div><small>I AM MAGNANIMOUS WAY™ • MAGNANIMOUS AI</small><h1>Native Web Agent</h1><p>Magnanimous-owned browser orchestration using Chromium on your paired Local Bridge. Search, rendered extraction, browser workflows, persistent local sessions, screenshots and monitoring stay under Magnanimous control.</p></div>
   <div className={browserReady?styles.statusGood:styles.statusWarn}><b>{browserReady?'NATIVE BROWSER READY':'LOCAL BROWSER UPDATE REQUIRED'}</b><span>TinyFish required: {caps?.tinyfish_required?'YES':'NO'}</span><span>{caps?.browser_engine||'Local Chromium + Playwright'}</span></div>
  </section>

  {!browserReady&&<section className={styles.upgrade}><b>One-time local upgrade needed</b><p>The platform runtime is ready, but the paired computer must advertise the new browser capabilities. Re-run the Windows activation once; the existing pairing is reused.</p><a href="/local-bridge">OPEN LOCAL BRIDGE ACTIVATION →</a></section>}
  {notice&&<div className={styles.noticeOk}>{notice}</div>}
  {error&&<div className={styles.noticeErr}>{error}</div>}

  <section className={styles.grid}>
   <article className={styles.card}><small>NATIVE SEARCH</small><h2>Search the public web</h2><p>Uses local Chromium instead of a metered web-agent service.</p><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What should Magnanimous search for?"/><button disabled={!browserReady||!query.trim()||!!busy} onClick={()=>queue('search',{query,limit:10})}>{busy==='search'?'QUEUING…':'RUN NATIVE SEARCH'}</button></article>
   <article className={styles.card}><small>RENDERED FETCH</small><h2>Read a JavaScript website</h2><p>Returns rendered text and links after the page loads.</p><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com"/><button disabled={!browserReady||!url.trim()||!!busy} onClick={()=>queue('fetch',{url,link_limit:60})}>{busy==='fetch'?'QUEUING…':'FETCH WITH NATIVE BROWSER'}</button></article>
  </section>

  <section className={styles.panel}><div className={styles.panelHead}><div><small>CAPABILITIES</small><h2>Native browser contract</h2></div><button onClick={()=>refresh().catch(e=>setError(e.message))}>REFRESH</button></div><div className={styles.caps}>{Object.entries(caps?.capabilities||{}).map(([id,c])=><span key={id} className={c.ready?styles.capReady:''}><b>{id.replaceAll('_',' ')}</b><small>{c.ready?'READY':'NOT READY'} • {c.confirmation?'CONFIRMATION':'AUTO/READ'}</small></span>)}</div></section>

  <section className={styles.panel}><div className={styles.panelHead}><div><small>RUN LIFECYCLE</small><h2>Native browser runs</h2></div></div>{!runs.length?<p>No native web runs started from this page yet.</p>:runs.map(r=><article className={styles.run} key={r.id}><div><b>{r.kind||r.action||'browser task'}</b><small>{r.id} • {r.status.toUpperCase()}</small></div><div className={styles.actions}>{r.requires_confirmation&&<button onClick={()=>confirmRun(r.id)} disabled={busy===r.id}>CONFIRM EXACT ACTION</button>}{['queued','needs_confirmation'].includes(r.status)&&<button onClick={()=>cancelRun(r.id)} disabled={busy===r.id}>CANCEL</button>}<button onClick={()=>poll(r.id)}>REFRESH</button></div>{r.error&&<p className={styles.errorText}>{r.error}</p>}{r.result&&Object.keys(r.result).length>0&&<pre>{JSON.stringify(r.result,null,2)}</pre>}</article>)}</section>

  <section className={styles.panel}><div className={styles.panelHead}><div><small>NATIVE MONITORING</small><h2>Watch a website</h2></div><span>15-minute minimum</span></div><form className={styles.monitorForm} onSubmit={createMonitor}><input value={monitorName} onChange={e=>setMonitorName(e.target.value)} placeholder="Monitor name"/><input required type="url" value={monitorUrl} onChange={e=>setMonitorUrl(e.target.value)} placeholder="https://example.com/page"/><button disabled={!browserReady||busy==='monitor'}>{busy==='monitor'?'CREATING…':'CREATE HOURLY NATIVE MONITOR'}</button></form>{monitors.map(m=><div className={styles.monitor} key={m.id}><b>{m.name}</b><span>{m.status.toUpperCase()} • every {m.interval_minutes} min</span><small>{m.changed?'CHANGE DETECTED':'No recorded change'}{m.last_error?' • '+m.last_error:''}</small></div>)}</section>

  <section className={styles.safety}><b>Native safety boundary</b><span>No generic shell</span><span>No password values in remote browser tasks</span><span>Private-network targets blocked</span><span>Interactive actions require confirmation</span><span>Browser cookies stay in local profiles</span><span>External browser agents remain optional fallbacks only</span></section>
 </main>
}
