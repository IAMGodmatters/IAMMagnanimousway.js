'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from '../sim/sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Plan={id:string;name:string;plan_kind:string;description:string;monthly_price:number;currency:string;activation_fee:number;included_minutes:number;included_sms:number;included_data_mb:number;included_numbers:number;included_sims:number;overage_per_minute:number;overage_per_sms:number;overage_per_mb:number;status:string};
type Overview={identity:string;brain:string;service_model:string;policy:Record<string,unknown>;commercial:{active_plans:number;lines:number;active_lines:number};current_usage:{minutes:number;sms:number;data_mb:number};sellable_units:string[];prohibited_modes:string[]};
const emptyOverview:Overview={identity:'Magnanimous Telecom',brain:'Magnanimous AI',service_model:'retail_service_provider',policy:{},commercial:{active_plans:0,lines:0,active_lines:0},current_usage:{minutes:0,sms:0,data_mb:0},sellable_units:[],prohibited_modes:[]};

async function parse(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}}

export default function TelecomPlansPage(){
 const[token,setToken]=useState('');
 const[overview,setOverview]=useState<Overview>(emptyOverview);
 const[plans,setPlans]=useState<Plan[]>([]);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(false);
 const[name,setName]=useState('');
 const[kind,setKind]=useState('bundle');
 const[description,setDescription]=useState('');
 const[monthlyPrice,setMonthlyPrice]=useState('');
 const[currency,setCurrency]=useState('USD');
 const[activationFee,setActivationFee]=useState('');
 const[minutes,setMinutes]=useState('');
 const[sms,setSms]=useState('');
 const[dataMb,setDataMb]=useState('');
 const[numbers,setNumbers]=useState('');
 const[sims,setSims]=useState('');
 const[overageMinute,setOverageMinute]=useState('');
 const[status,setStatus]=useState('draft');

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/plans')}`);return}
  setToken(saved);void refresh(saved);
 },[]);

 async function call(path:string,options:RequestInit={},activeToken=token){
  const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${activeToken}`);if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const response=await fetch(`${api}${path}`,{...options,headers});const data=await parse(response);if(!response.ok)throw new Error(data.detail||'Request failed.');return data;
 }

 async function refresh(activeToken=token){
  try{
   const [summary,catalog]=await Promise.all([call('/api/telecom/service/overview',{},activeToken),call('/api/telecom/service/plans',{},activeToken)]);
   setOverview({...emptyOverview,...summary,commercial:{...emptyOverview.commercial,...(summary.commercial||{})},current_usage:{...emptyOverview.current_usage,...(summary.current_usage||{})}});setPlans(catalog.plans||[]);setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load Magnanimous Telecom plans.')}
 }

 async function createPlan(event:FormEvent){
  event.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   await call('/api/telecom/service/plans',{method:'POST',body:JSON.stringify({name,plan_kind:kind,description,monthly_price:Number(monthlyPrice||0),currency,activation_fee:Number(activationFee||0),included_minutes:Number(minutes||0),included_sms:Number(sms||0),included_data_mb:Number(dataMb||0),included_numbers:Number(numbers||0),included_sims:Number(sims||0),overage_per_minute:Number(overageMinute||0),status})});
   setName('');setDescription('');setMonthlyPrice('');setActivationFee('');setMinutes('');setSms('');setDataMb('');setNumbers('');setSims('');setOverageMinute('');setStatus('draft');setNotice('Magnanimous Telecom retail plan created. No charge was made.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to create plan.')}finally{setBusy(false)}
 }

 async function setPlanStatus(plan:Plan,nextStatus:string){
  setBusy(true);setError('');setNotice('');
  try{await call(`/api/telecom/service/plans/${encodeURIComponent(plan.id)}`,{method:'PUT',body:JSON.stringify({status:nextStatus})});setNotice(`${plan.name} is now ${nextStatus}.`);await refresh()}catch(caught:any){setError(caught?.message||'Unable to update plan.')}finally{setBusy(false)}
 }

 return <main className={styles.shell}>
  <header className={styles.header}>
   <nav><a href='/telecom'>← TELECOM</a><a href='/telecom/sim'>SIM + eSIM</a><a href='/telecom/network'>CARRIER ACCESS</a><a href='/'>I AM MAGNANIMOUS WAY™</a></nav>
   <p className={styles.eyebrow}>MAGNANIMOUS TELECOM · RETAIL SERVICE</p>
   <h1>Plans + <em>Subscriptions</em></h1>
   <p>Build monthly Magnanimous Telecom service plans for SIM/eSIM lines, phone numbers, minutes, call-center lines and bundles. Telecom stays a Magnanimous-operated provider service and cannot be white-labeled into another phone company.</p>
  </header>

  {error&&<div className={styles.error}>{error}</div>}{notice&&<div className={styles.notice}>{notice}</div>}

  <section className={styles.metrics}>
   <article><small>ACTIVE PLANS</small><strong>{overview.commercial.active_plans}</strong></article>
   <article><small>CUSTOMER LINES</small><strong>{overview.commercial.lines}</strong></article>
   <article><small>ACTIVE LINES</small><strong>{overview.commercial.active_lines}</strong></article>
   <article><small>USED MINUTES</small><strong>{overview.current_usage.minutes}</strong></article>
   <article><small>PROVIDER</small><strong>MAGNANIMOUS</strong></article>
  </section>

  <section className={styles.status}><div><span className={styles.good}/><b>Provider identity locked: Magnanimous Telecom · Brain locked: Magnanimous AI</b></div><p>No white-label telecom, reseller carrier, sub-carrier, alternate provider branding, or customer resale of assigned phone numbers.</p></section>

  <section className={styles.grid}>
   <form className={styles.card} onSubmit={createPlan}>
    <small>CREATE RETAIL PLAN</small><h2>Monthly service package</h2>
    <label>Plan name<input value={name} onChange={e=>setName(e.target.value)} placeholder='Example: Magnanimous Mobile 500'/></label>
    <label>Type<select value={kind} onChange={e=>setKind(e.target.value)}><option value='sim'>Physical SIM line</option><option value='esim'>eSIM line</option><option value='phone_number'>Phone number</option><option value='minutes'>Minutes package</option><option value='call_center'>Call-center line</option><option value='bundle'>Combined bundle</option></select></label>
    <label>Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder='What the customer receives each month'/></label>
    <label>Monthly price<input type='number' min='0' step='0.01' value={monthlyPrice} onChange={e=>setMonthlyPrice(e.target.value)} placeholder='0.00'/></label>
    <label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value='USD'>USD</option><option value='PHP'>PHP</option><option value='SGD'>SGD</option></select></label>
    <label>Activation fee<input type='number' min='0' step='0.01' value={activationFee} onChange={e=>setActivationFee(e.target.value)} placeholder='0.00'/></label>
    <label>Included minutes<input type='number' min='0' value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder='500'/></label>
    <label>Included SMS<input type='number' min='0' value={sms} onChange={e=>setSms(e.target.value)} placeholder='1000'/></label>
    <label>Included data MB<input type='number' min='0' value={dataMb} onChange={e=>setDataMb(e.target.value)} placeholder='10240'/></label>
    <label>Included phone numbers<input type='number' min='0' value={numbers} onChange={e=>setNumbers(e.target.value)} placeholder='1'/></label>
    <label>Included SIM/eSIM lines<input type='number' min='0' value={sims} onChange={e=>setSims(e.target.value)} placeholder='1'/></label>
    <label>Overage per minute<input type='number' min='0' step='0.0001' value={overageMinute} onChange={e=>setOverageMinute(e.target.value)} placeholder='0.00'/></label>
    <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value='draft'>Draft</option><option value='active'>Active / sellable</option></select></label>
    <button disabled={busy||!name.trim()}>{busy?'SAVING…':'CREATE MAGNANIMOUS PLAN'}</button>
   </form>

   <article className={styles.card}>
    <small>BUSINESS MODEL LOCK</small><h2>Customers buy service, not the telecom platform</h2>
    <ul><li>Monthly SIM/eSIM subscriptions</li><li>Monthly phone-number subscriptions</li><li>Included or metered voice minutes</li><li>SMS and mobile-data allowances</li><li>Call-center lines and business bundles</li><li>Overage pricing when you choose it</li><li>Magnanimous Telecom remains the provider</li><li>Magnanimous AI remains the brain</li></ul>
   </article>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>PLAN CATALOG</small><h2>Magnanimous Telecom plans</h2></div><button onClick={()=>refresh()} disabled={busy}>REFRESH</button></div>
   {plans.length===0?<p className={styles.empty}>No plans yet. Create draft plans first; set pricing only when you are ready.</p>:<div className={styles.table}>{plans.map(plan=><article key={plan.id}><div><b>{plan.name}</b><span>{plan.status}</span></div><p>{plan.currency} {Number(plan.monthly_price||0).toFixed(2)}/month · {plan.plan_kind.replaceAll('_',' ')}</p><small>{plan.included_minutes||0} minutes · {plan.included_numbers||0} number(s) · {plan.included_sims||0} SIM/eSIM line(s) · {plan.included_data_mb||0} MB</small><div><button disabled={busy||plan.status==='active'} onClick={()=>setPlanStatus(plan,'active')}>ACTIVATE</button><button disabled={busy||plan.status==='retired'} onClick={()=>setPlanStatus(plan,'retired')}>RETIRE</button></div></article>)}</div>}
  </section>

  <section className={styles.guardrail}><h2>Telecom is intentionally excluded from white labeling</h2><p>Your general I AM MAGNANIMOUS WAY™ platform may offer other white-label products, but this telecom stack is different. A customer can subscribe to a line, number, SIM/eSIM, minutes, data, messaging or call-center service from Magnanimous Telecom. They cannot rename the network, become a reseller, create a sub-carrier, export the carrier backend, or turn an assigned number into their own telephone-company product.</p></section>
 </main>
}
