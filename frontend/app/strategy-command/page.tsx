'use client';

import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import {buildStrategyGoal,strategySummary,type StrategyWork} from './strategy-metrics';
import styles from './page.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const checkpointSteps=[
 'Capture a baseline and define the evidence of success',
 'Map the work, dependencies and responsible specialists',
 'Review progress, risks and approval requirements',
 'Verify the measurable result before reporting completion'
];

async function json(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return {detail:text||'Server did not return a usable response.'}}
}
function dateStamp(seconds:number){
 if(!Number.isFinite(seconds)||seconds<=0)return 'No timestamp';
 try{return new Date(seconds*1000).toLocaleDateString()}catch{return 'No timestamp'}
}

export default function StrategyCommand(){
 const [token,setToken]=useState('');
 const [items,setItems]=useState<StrategyWork[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [name,setName]=useState('');
 const [outcome,setOutcome]=useState('');
 const [measure,setMeasure]=useState('');
 const [target,setTarget]=useState('');
 const [due,setDue]=useState('');
 const [filter,setFilter]=useState('all');
 const metrics=useMemo(()=>strategySummary(items),[items]);
 const visible=useMemo(()=>metrics.rows.filter(r=>filter==='all'||r.health===filter).sort((a,b)=>Number(b.updated_at||0)-Number(a.updated_at||0)),[metrics,filter]);

 async function request(path:string,auth:string,options:RequestInit={}){
  const headers=new Headers(options.headers||{});
  headers.set('Authorization','Bearer '+auth);
  if(options.body)headers.set('Content-Type','application/json');
  const response=await fetch(api+path,{...options,headers,cache:'no-store'});
  const body=await json(response);
  if(response.status===401){window.location.replace('/login?returnTo=%2Fstrategy-command');throw new Error('Sign in required.')}
  if(!response.ok)throw new Error(body.detail||'Request failed ('+response.status+').');
  return body;
 }
 async function refresh(t=token){
  if(!t)return;
  setLoading(true);
  try{
   const data=await request('/api/work-engine',t);
   setItems(Array.isArray(data.items)?data.items:[]);
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Unable to load your private Work Engine goals.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){window.location.replace('/login?returnTo=%2Fstrategy-command');return;}
  setToken(t);
  void refresh(t);
 },[]);

 async function createGoal(){
  if(busy||!token)return;
  setBusy(true);setError('');setNotice('');
  let createdId:number|null=null;
  try{
   const input=buildStrategyGoal({title:name,outcome,measure,target,due});
   const result=await request('/api/work-engine',token,{method:'POST',body:JSON.stringify(input)});
   const id=Number(result.item?.id);
   if(!Number.isInteger(id)||id<=0)throw new Error('Server did not confirm a saved work ID. Check Work Engine before retrying.');
   createdId=id;
   for(const title of checkpointSteps){
    await request('/api/work-engine/'+id+'/steps',token,{method:'POST',body:JSON.stringify({title})});
   }
   setName('');setOutcome('');setMeasure('');setTarget('');setDue('');
   setNotice('Outcome saved in your private Work Engine with four review checkpoints. No external action was executed.');
   await refresh(token);
  }catch(e){
   const message=e instanceof Error?e.message:'Unable to save goal.';
   setError(createdId!==null?'Work item #'+createdId+' was created, but not all checkpoints were saved: '+message+' Do not create it again; open the existing item.':message);
   if(createdId!==null)await refresh(token);
  }finally{setBusy(false);}
 }

 return <main className={styles.page} id="strategy-main">
  <header className={styles.mast}>
   <div><a href="/operations">← Operations</a><small>I AM MAGNANIMOUS WAY™ / MAGNANIMOUS AI</small><h1>Strategy &amp; Outcomes</h1></div>
   <nav aria-label="Related Magnanimous tools"><a href="/work-engine">Work Engine</a><a href="/agency-automations">Automations</a><a href="/routine-studio">Routines</a></nav>
  </header>
  <section className={styles.intro}><strong>NATIVE • PRIVATE • EVIDENCE FIRST</strong><p>Connect strategy to real work. Track goals, progress, stalled items and review checkpoints without another subscription or a competing AI brain. All data is loaded through your existing authenticated Work Engine.</p><p className={styles.caution}>Advisory progress signals are not independent proof of completion. Confirm results and evidence before declaring success.</p></section>
  {error&&<div role="alert" className={styles.error}>{error}</div>}
  {notice&&<div role="status" className={styles.notice}>{notice}</div>}
  <section className={styles.metrics} aria-label="Goal overview">
   <article><span>Saved outcomes</span><b>{metrics.total}</b></article>
   <article><span>Active progress</span><b>{metrics.working}</b></article>
   <article><span>Needs review</span><b>{metrics.attention}</b></article>
   <article><span>Reported complete</span><b>{metrics.complete}</b></article>
   <article><span>Avg. recorded progress</span><b>{metrics.averageProgress}%</b></article>
  </section>
  <div className={styles.columns}>
   <section className={styles.panel}>
    <h2>Create a measurable objective</h2>
    <p>A native strategy workflow. This creates a persistent work item; it does not launch external actions or bill an account.</p>
    <form onSubmit={e=>{e.preventDefault();void createGoal()}}>
     <label>Objective <input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Improve customer response quality"/></label>
     <label>Desired outcome <textarea required rows={3} maxLength={1600} value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="What measurable change will count as success?"/></label>
     <label>Measurement (optional) <input maxLength={180} value={measure} onChange={e=>setMeasure(e.target.value)} placeholder="e.g. Verified response accuracy"/></label>
     <label>Target (if measuring) <input maxLength={180} value={target} onChange={e=>setTarget(e.target.value)} placeholder="e.g. 98% over 100 checked requests"/></label>
     <label>Target date (optional) <input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
     <button type="submit" disabled={busy||!token||!name.trim()||!outcome.trim()}>{busy?'Saving to Work Engine…':'Create outcome & review checkpoints'}</button>
    </form>
    <div className={styles.boundary}><strong>Secure action boundary</strong><p>Every external write, purchase, publication, message or account change still requires its own authenticated authorization. No workflow is executed by opening this page.</p></div>
   </section>
   <section className={styles.panel}>
    <div className={styles.heading}><div><h2>Live Work Engine portfolio</h2><p>Based on your account's saved work, not fabricated demo data.</p></div><button type="button" onClick={()=>void refresh()} disabled={loading||busy}>Refresh</button></div>
    <label className={styles.filter}>Show <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All outcomes</option><option value="attention">Needs review</option><option value="in-progress">Active progress</option><option value="planned">Planned or cancelled</option><option value="complete">Reported complete</option></select></label>
    {loading?<p role="status">Loading your private outcomes…</p>:visible.length===0?<p>No matching work yet. Create an outcome or open the Work Engine.</p>:<div className={styles.items}>{visible.slice(0,100).map(item=><article key={item.id} className={styles.work}>
     <div className={styles.worktop}><strong>{item.title||'Outcome #'+item.id}</strong><span className={styles.state}>{item.health==='attention'?'Review':item.health==='complete'?'Complete':item.health==='in-progress'?'In progress':'Planned'}</span></div>
     <p>{item.reason}</p><div className={styles.bar} aria-label={'Reported progress '+item.safeProgress+' percent'}><span style={{width:item.safeProgress+'%'}}/></div>
     <small>{item.safeProgress}% reported · Last update {dateStamp(Number(item.updated_at))} · Stage {item.stage||'unknown'}</small>
     <a href={'/work-engine?work='+encodeURIComponent(String(item.id))}>Review record & evidence →</a>
    </article>)}</div>}
    {visible.length>100&&<p>Showing first 100 records. Narrow the filter to review others.</p>}
   </section>
  </div>
  <section className={styles.links}><h2>Orchestrate without replacing what works</h2><div><a href="/agency-automations">Event-driven automation →</a><a href="/routine-studio">Reusable skills & scheduled routines →</a><a href="/crm">CRM & relationships →</a><a href="/activity">Execution history →</a></div><p>Magnanimous AI remains the orchestration, memory, identity, verification and policy layer. No competitor is embedded or required.</p></section>
 </main>;
}
