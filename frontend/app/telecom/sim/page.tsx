'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type SimOverview={identity:string;brain:string;physical_sims:number;esims:number;active_sims:number;mobile_adapters:number;pending_esim_orders:number;provisioning_ready:boolean;secret_policy:string};
type SimItem={id:string;sim_type:string;iccid:string;eid:string;label:string;mobile_adapter_id?:string;provider_profile_ref?:string;status:string;device_ref?:string};
type Adapter={id:string;name:string;kind:string;status:string;endpoint_ref?:string;secret_binding_name?:string};

const emptyOverview:SimOverview={identity:'Magnanimous Telecom',brain:'Magnanimous AI',physical_sims:0,esims:0,active_sims:0,mobile_adapters:0,pending_esim_orders:0,provisioning_ready:false,secret_policy:'Raw SIM/eSIM authentication secrets are not stored by Magnanimous Telecom.'};

async function parse(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}}

export default function SimControlPage(){
 const[token,setToken]=useState('');
 const[overview,setOverview]=useState<SimOverview>(emptyOverview);
 const[items,setItems]=useState<SimItem[]>([]);
 const[adapters,setAdapters]=useState<Adapter[]>([]);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(false);
 const[simType,setSimType]=useState('physical');
 const[iccid,setIccid]=useState('');
 const[eid,setEid]=useState('');
 const[label,setLabel]=useState('');
 const[profileRef,setProfileRef]=useState('');
 const[adapterName,setAdapterName]=useState('');
 const[adapterKind,setAdapterKind]=useState('mvno');
 const[adapterEndpoint,setAdapterEndpoint]=useState('');
 const[secretBinding,setSecretBinding]=useState('');
 const[orderAdapter,setOrderAdapter]=useState('');
 const[deviceEid,setDeviceEid]=useState('');

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/sim')}`);return}
  setToken(saved);void refresh(saved);
 },[]);

 async function call(path:string,options:RequestInit={},activeToken=token){
  const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${activeToken}`);if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const response=await fetch(`${api}${path}`,{...options,headers});const data=await parse(response);if(!response.ok)throw new Error(data.detail||'Request failed.');return data;
 }

 async function refresh(activeToken=token){
  try{
   const [status,inventory,adapterData]=await Promise.all([
    call('/api/telecom/sim/overview',{},activeToken),
    call('/api/telecom/sim/inventory',{},activeToken),
    call('/api/telecom/sim/adapters',{},activeToken)
   ]);
   setOverview({...emptyOverview,...status});setItems(inventory.items||[]);setAdapters(adapterData.items||[]);if(!orderAdapter&&adapterData.items?.[0]?.id)setOrderAdapter(adapterData.items[0].id);setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load SIM/eSIM control.')}
 }

 async function addInventory(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   await call('/api/telecom/sim/inventory',{method:'POST',body:JSON.stringify({sim_type:simType,iccid,eid,label,provider_profile_ref:profileRef})});
   setIccid('');setEid('');setLabel('');setProfileRef('');setNotice(`${simType==='esim'?'eSIM':'Physical SIM'} inventory record added.`);await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to add inventory.')}finally{setBusy(false)}
 }

 async function addAdapter(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   const result=await call('/api/telecom/sim/adapters',{method:'POST',body:JSON.stringify({name:adapterName,kind:adapterKind,endpoint_ref:adapterEndpoint,secret_binding_name:secretBinding,capabilities:{physical_sim:true,esim:true}})});
   setAdapterName('');setAdapterEndpoint('');setSecretBinding('');setNotice('Authorized mobile adapter metadata added. Put the actual credential only in the named runtime secret binding.');setOrderAdapter(result.id||'');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to add mobile adapter.')}finally{setBusy(false)}
 }

 async function requestEsim(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   await call('/api/telecom/sim/esim-orders',{method:'POST',body:JSON.stringify({mobile_adapter_id:orderAdapter,device_eid:deviceEid})});
   setDeviceEid('');setNotice('eSIM provisioning request recorded. The authorized adapter must issue the actual eSIM profile.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to request eSIM provisioning.')}finally{setBusy(false)}
 }

 return <main className={styles.shell}>
  <header className={styles.header}>
   <nav><a href='/telecom'>← TELECOM</a><a href='/telecom-standalone'>STANDALONE</a><a href='/'>I AM MAGNANIMOUS WAY™</a></nav>
   <p className={styles.eyebrow}>MAGNANIMOUS TELECOM · MOBILE CONTROL</p>
   <h1>SIM + <em>eSIM</em></h1>
   <p>Manage legitimate SIM inventory, eSIM provisioning workflows, device assignments and authorized mobile-network adapters under the same Magnanimous AI telecom brain.</p>
  </header>

  {error&&<div className={styles.error}>{error}</div>}{notice&&<div className={styles.notice}>{notice}</div>}

  <section className={styles.metrics}>
   <article><small>PHYSICAL SIMS</small><strong>{overview.physical_sims}</strong></article>
   <article><small>eSIMS</small><strong>{overview.esims}</strong></article>
   <article><small>ACTIVE / ASSIGNED</small><strong>{overview.active_sims}</strong></article>
   <article><small>PROVISIONERS</small><strong>{overview.mobile_adapters}</strong></article>
   <article><small>PENDING eSIM</small><strong>{overview.pending_esim_orders}</strong></article>
  </section>

  <section className={styles.status}><div><span className={overview.provisioning_ready?styles.good:styles.wait}/><b>{overview.provisioning_ready?'Mobile provisioning adapter connected':'Provisioning adapter not connected yet'}</b></div><p>{overview.secret_policy}</p></section>

  <section className={styles.grid}>
   <form className={styles.card} onSubmit={addInventory}>
    <small>STEP 1</small><h2>Add SIM inventory</h2>
    <label>Type<select value={simType} onChange={e=>setSimType(e.target.value)}><option value='physical'>Physical SIM</option><option value='esim'>eSIM</option></select></label>
    <label>Label<input value={label} onChange={e=>setLabel(e.target.value)} placeholder='Customer SIM, staff line, demo eSIM'/></label>
    {simType==='physical'?<label>ICCID<input value={iccid} onChange={e=>setIccid(e.target.value)} placeholder='ICCID from authorized SIM'/></label>:<><label>Device EID<input value={eid} onChange={e=>setEid(e.target.value)} placeholder='EID from compatible device/eUICC'/></label><label>Provider profile reference<input value={profileRef} onChange={e=>setProfileRef(e.target.value)} placeholder='Opaque provider reference (optional if EID entered)'/></label></>}
    <button disabled={busy}>ADD TO MAGNANIMOUS</button>
   </form>

   <form className={styles.card} onSubmit={addAdapter}>
    <small>STEP 2</small><h2>Register mobile adapter</h2>
    <label>Name<input value={adapterName} onChange={e=>setAdapterName(e.target.value)} placeholder='Authorized MVNO / MNO / SM-DP+ adapter'/></label>
    <label>Kind<select value={adapterKind} onChange={e=>setAdapterKind(e.target.value)}><option value='mvno'>MVNO</option><option value='mno'>MNO</option><option value='smdp_plus'>SM-DP+</option><option value='iot_esim'>IoT eSIM</option></select></label>
    <label>Endpoint reference<input value={adapterEndpoint} onChange={e=>setAdapterEndpoint(e.target.value)} placeholder='https://adapter.example/v1'/></label>
    <label>Runtime secret binding name<input value={secretBinding} onChange={e=>setSecretBinding(e.target.value)} placeholder='MOBILE_PROVISIONER_TOKEN'/></label>
    <button disabled={busy}>REGISTER ADAPTER</button>
   </form>

   <form className={styles.card} onSubmit={requestEsim}>
    <small>STEP 3</small><h2>Request eSIM profile</h2>
    <label>Authorized adapter<select value={orderAdapter} onChange={e=>setOrderAdapter(e.target.value)}><option value=''>Select adapter</option>{adapters.map(adapter=><option key={adapter.id} value={adapter.id}>{adapter.name} · {adapter.kind}</option>)}</select></label>
    <label>Device EID<input value={deviceEid} onChange={e=>setDeviceEid(e.target.value)} placeholder='EID of the device receiving the profile'/></label>
    <button disabled={busy||!orderAdapter}>REQUEST PROFILE</button>
    <p className={styles.muted}>Magnanimous records the request. The authorized carrier/MVNO/SM-DP+ must create and deliver the actual profile and activation data.</p>
   </form>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>INVENTORY</small><h2>SIM/eSIM records</h2></div><button onClick={()=>refresh()} disabled={busy}>REFRESH</button></div>
   {items.length===0?<p className={styles.empty}>No SIM/eSIM inventory yet.</p>:<div className={styles.table}>{items.map(item=><article key={item.id}><div><b>{item.label||item.sim_type.toUpperCase()}</b><span>{item.status}</span></div><p>{item.sim_type==='physical'?`ICCID ${item.iccid}`:`EID ${item.eid||'not recorded'}`}</p><small>{item.provider_profile_ref?`Profile ref: ${item.provider_profile_ref}`:'Magnanimous-managed lifecycle record'}</small></article>)}</div>}
  </section>

  <section className={styles.guardrail}><h2>What “programming” means here</h2><p>Magnanimous can orchestrate activation and profile delivery for SIMs/eSIMs that your authorized mobile partner issues. It does not clone another SIM or manufacture carrier authentication credentials. That keeps the system ready for a legitimate MVNO/carrier path later.</p></section>
 </main>
}
