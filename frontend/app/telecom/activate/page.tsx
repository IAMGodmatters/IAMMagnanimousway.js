'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from '../sim/sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

async function parse(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}
}

export default function TelecomActivatePage(){
 const[token,setToken]=useState('');
 const[enrollmentToken,setEnrollmentToken]=useState('');
 const[deviceRef,setDeviceRef]=useState('');
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[result,setResult]=useState<any>(null);

 useEffect(()=>{
  const saved=localStorage.getItem('iam_account_token')||localStorage.getItem('magnanimous_admin_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/activate')}`);return}
  setToken(saved);
 },[]);

 async function redeem(event:FormEvent){
  event.preventDefault();setBusy(true);setError('');setResult(null);
  try{
   const response=await fetch(`${api}/api/telecom/network/global-mobile/enrollment/redeem`,{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({enrollment_token:enrollmentToken.trim(),device_ref:deviceRef.trim()})
   });
   const data=await parse(response);
   if(!response.ok)throw new Error(data.detail||'Enrollment failed.');
   setResult(data);setEnrollmentToken('');
  }catch(caught:any){setError(caught?.message||'Enrollment failed.')}finally{setBusy(false)}
 }

 return <main className={styles.shell}>
  <header className={styles.header}>
   <nav><a href='/telecom'>← TELECOM</a><a href='/account'>ACCOUNT</a><a href='/'>I AM MAGNANIMOUS WAY™</a></nav>
   <p className={styles.eyebrow}>MAGNANIMOUS TELECOM · SECURE ENROLLMENT</p>
   <h1>Activate your <em>Magnanimous</em> mobile profile</h1>
   <p>Use the one-time Magnanimous enrollment token your account administrator gave you. This token binds your signed-in Magnanimous account/device to an already-authorized mobile profile. It is not an eSIM SM-DP+ activation code and does not contain carrier authentication secrets.</p>
  </header>

  {error&&<div className={styles.error}>{error}</div>}

  <section className={styles.grid}>
   <form className={styles.card} onSubmit={redeem} autoComplete='off'>
    <small>ONE-TIME TOKEN</small><h2>Enroll this device</h2>
    <label>Magnanimous enrollment token
     <input type='password' value={enrollmentToken} onChange={e=>setEnrollmentToken(e.target.value)} placeholder='mge1_…' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
    </label>
    <label>Device label
     <input value={deviceRef} onChange={e=>setDeviceRef(e.target.value)} placeholder='Example: Jessie iPhone' maxLength={200}/>
    </label>
    <button disabled={busy||!token||!enrollmentToken.trim()||!deviceRef.trim()}>{busy?'VERIFYING…':'REDEEM ONCE'}</button>
    <p className={styles.muted}>The token is single-use and short-lived. Magnanimous stores only its SHA-256 hash. Do not paste a carrier QR payload, Ki, OPc, ADM key, or SM-DP+ activation string here.</p>
   </form>

   <article className={styles.card}>
    <small>SECURITY BOUNDARY</small><h2>Magnanimous enrollment ≠ carrier activation</h2>
    <ul>
     <li>No raw SIM authentication material is accepted.</li>
     <li>No provider activation secret is exposed.</li>
     <li>No purchase is made from this page.</li>
     <li>No regulatory or network authority is implied.</li>
    </ul>
   </article>
  </section>

  {result&&<section className={styles.status}>
   <div><span className={styles.good}/><b>Magnanimous enrollment completed.</b></div>
   <p>Profile role: {result.profile_role||'—'} · Country: {result.country_code||'—'} · Carrier profile: {result.carrier_profile_status||'unknown'}.</p>
   {result.provider_activation_required&&<p>The upstream carrier profile is not yet proven active. Magnanimous will not claim mobile service live until real provider/network evidence is recorded.</p>}
  </section>}
 </main>
}
