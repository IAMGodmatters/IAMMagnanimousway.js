'use client';

import { useEffect, useState } from 'react';
import styles from '../telecom.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type ChargingOverview={
 identity:string;
 brain:string;
 charging_model:string;
 counts:{sessions:number;reserved_units:number;policy_decisions_24h:number};
 locks:{white_label_allowed:boolean;reseller_allowed:boolean;subcarrier_allowed:boolean;customer_number_resale_allowed:boolean};
 safety:{public_network_action:boolean;purchase_action:boolean;external_provider_brand_customer_visible:boolean};
};

const empty:ChargingOverview={identity:'Magnanimous Telecom',brain:'Magnanimous AI',charging_model:'reserve_commit_release',counts:{sessions:0,reserved_units:0,policy_decisions_24h:0},locks:{white_label_allowed:false,reseller_allowed:false,subcarrier_allowed:false,customer_number_resale_allowed:false},safety:{public_network_action:false,purchase_action:false,external_provider_brand_customer_visible:false}};

async function read(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}}

export default function TelecomChargingPage(){
 const[token,setToken]=useState('');
 const[overview,setOverview]=useState<ChargingOverview>(empty);
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/charging')}`);return}
  setToken(saved);void refresh(saved);
 },[]);

 async function refresh(activeToken=token){
  if(!activeToken)return;setBusy(true);
  try{
   const response=await fetch(`${api}/api/telecom/charging/overview`,{headers:{Authorization:`Bearer ${activeToken}`}}),data=await read(response);
   if(response.status===401){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/charging')}`);return}
   if(!response.ok)throw new Error(data.detail||'Unable to load Telecom charging control.');
   setOverview({...empty,...data,counts:{...empty.counts,...(data.counts||{})},locks:{...empty.locks,...(data.locks||{})},safety:{...empty.safety,...(data.safety||{})}});setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load Telecom charging control.')}finally{setBusy(false)}
 }

 const stages=[
  ['1','MEDIATION','Provider usage is normalized into Magnanimous usage events before charging.'],
  ['2','POLICY','Magnanimous AI policy checks roaming, fraud risk, SIM-registration state, fair use and line permissions.'],
  ['3','RESERVE','Minutes, texts or data are reserved from customer or authorized shared buckets with an idempotency key.'],
  ['4','COMMIT / RELEASE','Consumed units are committed; unused or failed-session reservations are returned to the balance.'],
  ['5','RATE & BILL','Rated usage feeds invoice, overage, tax, credit and payment-state records without exposing upstream providers.']
 ];

 return <main className={styles.shell}>
  <header className={styles.hero}>
   <nav><a href='/'>I AM MAGNANIMOUS WAY™</a><span>•</span><a href='/telecom'>TELECOM</a><span>•</span><a href='/telecom/operations'>OPERATIONS</a><span>•</span><a href='/telecom/plans'>PLANS</a><span>•</span><a href='/telecom/security'>LINE SECURITY</a></nav>
   <div className={styles.heroGrid}>
    <div><p className={styles.eyebrow}>MAGNANIMOUS TELECOM · CHARGING CONTROL PLANE</p><h1>Real-Time <em>Charging & Policy</em></h1><p className={styles.lead}>Reserve, commit and release customer allowances without giving the telecom platform away. Magnanimous Telecom stays the provider; Magnanimous AI stays the decision layer; outside networks stay replaceable and internal.</p><div className={styles.actions}><a className={styles.primary} href='/telecom/operations'>OPEN CARRIER OPERATIONS</a><a className={styles.secondary} href='/telecom/plans'>OPEN PLANS</a><button className={styles.secondary} onClick={()=>refresh()} disabled={busy}>{busy?'REFRESHING…':'REFRESH'}</button></div></div>
    <aside className={styles.identityCard}><span className={styles.pulse}/><small>CONTROL MODEL</small><strong>{overview.identity}</strong><p>Brain: {overview.brain}</p><p>Flow: Reserve → Commit / Release</p><p>Purchases from this runtime: OFF</p><p>Public-network actions from this runtime: OFF</p></aside>
   </div>
  </header>

  {error&&<div className={styles.error}>{error}</div>}

  <section className={styles.metrics}>
   <article><small>CHARGING SESSIONS</small><strong>{overview.counts.sessions}</strong><span>idempotent session records</span></article>
   <article><small>RESERVED UNITS</small><strong>{overview.counts.reserved_units}</strong><span>awaiting commit or release</span></article>
   <article><small>POLICY DECISIONS · 24H</small><strong>{overview.counts.policy_decisions_24h}</strong><span>allow, throttle, block or review</span></article>
   <article><small>RESELLER MODE</small><strong>{overview.locks.reseller_allowed?'ON':'OFF'}</strong><span>locked off by provider policy</span></article>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>ONLINE CHARGING FLOW</small><h2>How Magnanimous controls usage</h2></div><span>Customer balances stay separate from upstream network execution.</span></div>
   <div className={styles.tools}>{stages.map(([icon,title,text])=><article className={styles.tool} key={title}><b>{icon}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>ADDED OPERATIONAL DOMAINS</small><h2>Carrier-style BSS separation</h2></div><span>Additive to the existing Telecom core.</span></div>
   <div className={styles.foundation}><ul><li>Idempotent charging sessions</li><li>Balance reservations and immutable transaction ledger</li><li>Customer, family and business shared-balance groups</li><li>Plan-aware policy profiles and auditable decisions</li><li>Fair-use throttling controls</li><li>Fraud-risk policy hooks</li><li>SIM-registration state references without raw identity-document storage</li><li>Device/TAC capability inventory</li><li>APN and line network-policy records</li><li>VoLTE, VoNR, Wi-Fi Calling and RCS readiness flags</li><li>Internal rate-deck/rate-rule model</li><li>Invoice, invoice-item and payment-event foundations</li></ul></div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>SAFETY & IDENTITY LOCKS</small><h2>What this control plane cannot do</h2></div><span>Regulated and paid actions stay in their existing gated runtimes.</span></div>
   <div className={styles.gates}>
    <article className={styles.ready}><div><span>✓</span><h3>Provider identity locked</h3></div><p>Magnanimous Telecom remains customer-facing; external provider brand override remains disabled.</p></article>
    <article className={styles.ready}><div><span>✓</span><h3>White-label/reseller locked off</h3></div><p>No customer can turn this charging layer into a carrier, sub-carrier or number-resale business.</p></article>
    <article className={styles.ready}><div><span>✓</span><h3>No telecom purchases here</h3></div><p>A top-up can only be recorded after an existing confirmed payment reference; this runtime does not buy or charge external resources.</p></article>
    <article className={styles.ready}><div><span>✓</span><h3>No public-network activation here</h3></div><p>Calling, numbering, emergency service and SIM/eSIM provisioning remain behind the separate regulated-network safety gates.</p></article>
   </div>
  </section>
 </main>;
}
