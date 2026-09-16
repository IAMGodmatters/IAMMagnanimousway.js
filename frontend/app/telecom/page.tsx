'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './telecom.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Overview={
 identity:string;
 parent_brand:string;
 brain:string;
 architecture:string;
 provider_disclosure:string;
 readiness:Record<string,boolean>;
 inventory:{numbers:number;active_interconnects:number;open_port_requests:number;enabled_emergency_locations:number;rated_calls:number};
 commercial:{customers:number;active_plans:number;active_subscriptions:number;verified_caller_identities:number;active_fraud_policies:number;audit_events:number};
 mobile:{physical_sims:number;esims:number;active_sims:number;mobile_adapters:number;pending_esim_orders:number;provisioning_ready:boolean};
 gates:Array<{key:string;label:string;ready:boolean;detail:string}>;
};

const fallback:Overview={
 identity:'Magnanimous Telecom',parent_brand:'I AM MAGNANIMOUS WAY™',brain:'Magnanimous AI',architecture:'integrated-and-standalone',provider_disclosure:'hidden-from-customer-ui',
 readiness:{internal_voice:true,pstn_bridge:false,public_number:false,inbound_events:false,emergency_calling:false,direct_numbering:false,carrier_authorized:false,mobile_provisioning:false},
 inventory:{numbers:0,active_interconnects:0,open_port_requests:0,enabled_emergency_locations:0,rated_calls:0},
 commercial:{customers:0,active_plans:0,active_subscriptions:0,verified_caller_identities:0,active_fraud_policies:0,audit_events:0},
 mobile:{physical_sims:0,esims:0,active_sims:0,mobile_adapters:0,pending_esim_orders:0,provisioning_ready:false},gates:[]
};

async function read(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}}

export default function TelecomPage(){
 const[token,setToken]=useState('');
 const[overview,setOverview]=useState<Overview>(fallback);
 const[question,setQuestion]=useState('');
 const[answer,setAnswer]=useState('');
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent(location.pathname||'/telecom')}`);return}
  setToken(saved);load(saved);
 },[]);

 async function load(activeToken=token){
  try{
   const response=await fetch(`${api}/api/telecom/overview`,{headers:{Authorization:`Bearer ${activeToken}`}});
   if(response.status===401){location.replace(`/login?returnTo=${encodeURIComponent(location.pathname||'/telecom')}`);return}
   const data=await read(response);
   if(!response.ok)throw new Error(data.detail||'Unable to load Magnanimous Telecom.');
   setOverview({...fallback,...data,inventory:{...fallback.inventory,...(data.inventory||{})},commercial:{...fallback.commercial,...(data.commercial||{})},mobile:{...fallback.mobile,...(data.mobile||{})}});setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load Magnanimous Telecom.')}
 }

 async function askMagnanimous(event:FormEvent){
  event.preventDefault();
  const prompt=question.trim();if(!prompt||!token)return;
  setBusy(true);setError('');setAnswer('');
  const context=`You are Magnanimous AI operating inside Magnanimous Telecom. Keep Magnanimous as the public identity and command layer. Treat outside carriers, mobile networks, MVNOs, eSIM providers, model providers and infrastructure vendors as replaceable tools. Never claim emergency calling, direct numbering authority, carrier authorization, a public telephone number, or mobile provisioning unless the live system indicates it is configured and verified. Never request or store raw SIM authentication credentials such as Ki, OPc or ADM keys. Help with telecom operations, architecture, customer service, routing, compliance planning, fraud controls, service-plan design, SIM/eSIM lifecycle, number lifecycle and troubleshooting. User request: ${prompt}`;
  try{
   const response=await fetch(`${api}/api/chat`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({message:context,tool:'magnanimous'})});
   const data=await read(response);
   if(!response.ok)throw new Error(data.detail||data.error||'Magnanimous AI could not answer.');
   const value=data.reply??data.answer??data.response??data.message??data.result??data;
   setAnswer(typeof value==='string'?value:JSON.stringify(value,null,2));
  }catch(caught:any){setError(caught?.message||'Magnanimous AI could not answer.')}finally{setBusy(false)}
 }

 const tools=[
  {href:'/phone',icon:'☎',title:'Phone & Call Center',text:'Browser calling, agents, queues and call history.'},
  {href:'/softphone',icon:'◉',title:'Softphone',text:'Use Magnanimous as a working phone endpoint.'},
  {href:'/ai-receptionist',icon:'✦',title:'AI Receptionist',text:'Magnanimous AI can answer, route and assist callers.'},
  {href:'/telecom/sim',icon:'▤',title:'SIM + eSIM Control',text:'Inventory, mobile adapters and authorized profile provisioning.'},
  {href:'/auto-dialer',icon:'↗',title:'Auto Dialer',text:'Authorized outbound calling workflows and campaigns.'},
  {href:'/ai-connectors',icon:'⌘',title:'Universal Connector',text:'Keep external engines beneath the Magnanimous command layer.'},
  {href:'/business',icon:'▣',title:'Business Operations',text:'Operate the telecom company from the same platform.'}
 ];

 return <main className={styles.shell}>
  <header className={styles.hero}>
   <nav><a href='/'>I AM MAGNANIMOUS WAY™</a><span>•</span><a href='/phone'>PHONE</a><span>•</span><a href='/telecom/sim'>SIM + eSIM</a><span>•</span><a href='/telecom-standalone'>STANDALONE</a></nav>
   <div className={styles.heroGrid}>
    <div>
     <p className={styles.eyebrow}>STANDALONE SERVICE · SHARED MAGNANIMOUS BRAIN</p>
     <h1>Magnanimous <em>Telecom</em></h1>
     <p className={styles.lead}>A provider-neutral communications company foundation powered by Magnanimous AI. The telecom service has its own command center while remaining part of the I AM MAGNANIMOUS WAY™ platform.</p>
     <div className={styles.actions}><a className={styles.primary} href='/phone'>OPEN LIVE PHONE</a><a className={styles.secondary} href='/telecom/sim'>OPEN SIM + eSIM</a></div>
    </div>
    <aside className={styles.identityCard}>
     <span className={styles.pulse}/><small>PUBLIC IDENTITY</small><strong>{overview.identity}</strong><p>Brain: {overview.brain}</p><p>Architecture: integrated + standalone</p><p>Underlying providers stay replaceable and out of the customer-facing identity.</p>
    </aside>
   </div>
  </header>

  {error&&<div className={styles.error}>{error}</div>}

  <section className={styles.metrics}>
   <article><small>NUMBERS</small><strong>{overview.inventory.numbers}</strong><span>inventory records</span></article>
   <article><small>CUSTOMERS</small><strong>{overview.commercial.customers}</strong><span>active/prospect records</span></article>
   <article><small>SIM + eSIM</small><strong>{overview.mobile.physical_sims+overview.mobile.esims}</strong><span>mobile inventory</span></article>
   <article><small>SUBSCRIPTIONS</small><strong>{overview.commercial.active_subscriptions}</strong><span>trial + active</span></article>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>MAGNANIMOUS AI INSIDE TELECOM</small><h2>Telecom Command AI</h2></div><span>One brain. Two surfaces.</span></div>
   <div className={styles.aiPanel}>
    <form onSubmit={askMagnanimous}>
     <textarea value={question} onChange={event=>setQuestion(event.target.value)} placeholder='Ask Magnanimous to plan routing, troubleshoot calls, manage SIM/eSIM workflows, design a business phone package, explain a compliance gate, or prepare the next telecom build step.'/>
     <button disabled={busy||!question.trim()}>{busy?'MAGNANIMOUS IS WORKING…':'ASK MAGNANIMOUS'}</button>
    </form>
    <div className={styles.answer}>{answer||'Magnanimous AI remains the reasoning and command layer here. Outside AI engines, carriers, MVNOs and telecom vendors are tools beneath it, not the identity of the service.'}</div>
   </div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>OPERATIONS</small><h2>Telecom Apps</h2></div><span>Simple enough to understand at a glance.</span></div>
   <div className={styles.tools}>{tools.map(tool=><a href={tool.href} className={styles.tool} key={tool.href}><b>{tool.icon}</b><div><h3>{tool.title}</h3><p>{tool.text}</p></div><span>OPEN →</span></a>)}</div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>MOBILE FOUNDATION</small><h2>SIM + eSIM Readiness</h2></div><span>{overview.mobile.provisioning_ready?'Provisioning adapter connected':'Awaiting authorized mobile adapter'}</span></div>
   <div className={styles.metrics}>
    <article><small>PHYSICAL SIMS</small><strong>{overview.mobile.physical_sims}</strong><span>inventory</span></article>
    <article><small>eSIMS</small><strong>{overview.mobile.esims}</strong><span>profile records</span></article>
    <article><small>ACTIVE / ASSIGNED</small><strong>{overview.mobile.active_sims}</strong><span>mobile lines</span></article>
    <article><small>PENDING eSIM</small><strong>{overview.mobile.pending_esim_orders}</strong><span>provisioning requests</span></article>
   </div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>COMMERCIAL FOUNDATION</small><h2>Phone-company Building Blocks</h2></div><span>Shared by the platform and standalone service.</span></div>
   <div className={styles.metrics}>
    <article><small>PLANS</small><strong>{overview.commercial.active_plans}</strong><span>active service plans</span></article>
    <article><small>CALLER ID</small><strong>{overview.commercial.verified_caller_identities}</strong><span>verified identities</span></article>
    <article><small>FRAUD POLICIES</small><strong>{overview.commercial.active_fraud_policies}</strong><span>active protections</span></article>
    <article><small>AUDIT EVENTS</small><strong>{overview.commercial.audit_events}</strong><span>telecom history</span></article>
   </div>
  </section>

  <section className={styles.section}>
   <div className={styles.sectionTitle}><div><small>FUTURE PHONE-COMPANY READINESS</small><h2>Carrier Growth Gates</h2></div><button className={styles.refresh} onClick={()=>load()}>REFRESH STATUS</button></div>
   <div className={styles.gates}>{(overview.gates.length?overview.gates:[
    {key:'public_pstn',label:'Public PSTN calling',ready:false,detail:'Requires an authorized PSTN interconnect and assigned number.'},
    {key:'mobile_provisioning',label:'SIM/eSIM mobile provisioning',ready:false,detail:'Requires an authorized MNO/MVNO or SM-DP+ adapter.'},
    {key:'emergency',label:'Emergency calling',ready:false,detail:'Disabled until emergency routing and location validation are configured and tested.'},
    {key:'direct_numbering',label:'Direct numbering authority',ready:false,detail:'Wholesale numbering can be used until direct authorization exists.'},
    {key:'carrier_authority',label:'Facilities/carrier authority',ready:false,detail:'Legal authorization is external to the software.'}
   ]).map(gate=><article key={gate.key} className={gate.ready?styles.ready:styles.pending}><div><span>{gate.ready?'✓':'○'}</span><h3>{gate.label}</h3></div><p>{gate.detail}</p></article>)}</div>
  </section>

  <section className={styles.foundation}>
   <div><small>BUILT INTO THE FOUNDATION</small><h2>Ready to grow without rebuilding the company from scratch.</h2></div>
   <ul><li>Number inventory and lifecycle</li><li>Replaceable SIP/PSTN interconnect registry</li><li>Physical SIM inventory and lifecycle</li><li>eSIM profile-order workflow</li><li>Replaceable MNO/MVNO/SM-DP+ adapter layer</li><li>Number-porting workflow records</li><li>Emergency-location readiness records</li><li>STIR/SHAKEN and caller-identity readiness</li><li>Usage and call-rating ledger</li><li>Customer, plan and subscription records</li><li>Fraud/spend protection policies</li><li>Immutable-style telecom audit history</li><li>Jurisdiction/compliance control tracking</li><li>Provider-neutral Magnanimous AI command layer</li></ul>
  </section>

  <footer className={styles.footer}><b>I AM MAGNANIMOUS WAY™</b><span>Magnanimous Telecom · ONE GOD • ONE PEOPLE • A BRIGHTER TOMORROW.</span></footer>
 </main>
}
