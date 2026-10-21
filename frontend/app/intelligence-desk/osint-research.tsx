'use client';
import {useState,type FormEvent} from 'react';
import styles from './osint-research.module.css';

type DnsAnswer={data?:string;type?:string;ttl?:number};
type DnsSource={error?:string;status_text?:string;records?:DnsAnswer[]};
type Lookup={name?:string;type?:string;results?:DnsSource[]};
type SecurityFinding={level?:string;code?:string;message?:string};
type SecurityReport={domain?:string;findings?:SecurityFinding[];[key:string]:unknown};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const domainPattern=/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/i;
const types=['A','AAAA','MX','TXT','NS','CAA','CNAME','SOA','DS'] as const;

export default function OsintResearch({token}:{token:string}){
 const [domain,setDomain]=useState('');
 const [mode,setMode]=useState<'dns'|'email'>('dns');
 const [recordType,setRecordType]=useState<(typeof types)[number]>('A');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<Lookup|SecurityReport|null>(null);
 const [error,setError]=useState('');
 async function run(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setResult(null);
  const name=domain.trim().toLowerCase().replace(/\.$/,'');
  if(!domainPattern.test(name)){setError('Enter a valid public domain, such as example.com.');return}
  if(!token){setError('Sign in before running a live read-only check.');return}
  setBusy(true);
  try{
   const route=mode==='dns'?'/api/magnanimous/dns/lookup':'/api/magnanimous/dns/email-security';
   const body=mode==='dns'?{name,type:recordType,resolver:'all'}:{domain:name};
   const response=await fetch(api+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),cache:'no-store'});
   const raw=await response.text();
   let data:Lookup|SecurityReport|{detail?:string};
   try{data=JSON.parse(raw)}catch{throw new Error('Research service did not return readable data.')}
   if(!response.ok)throw new Error(('detail' in data&&typeof data.detail==='string'?data.detail:null)||'Research service unavailable ('+response.status+').');
   setResult(data as Lookup|SecurityReport);
  }catch(e){setError(e instanceof Error?e.message:'Unable to complete this check.')}
  finally{setBusy(false)}
 }
 const dns=mode==='dns'?result as Lookup|null:null;
 const security=mode==='email'?result as SecurityReport|null:null;
 const recordCount=dns?.results?.reduce((n,r)=>n+(r.records?.length||0),0)||0;
 return <section className={styles.shell} aria-labelledby="osint-title">
  <div className={styles.top}><div><small>MAGNANIMOUS AI • RESEARCH & VERIFICATION</small><h2 id="osint-title">Public-domain intelligence</h2><p>Live, read-only technical evidence through existing Magnanimous intelligence routes. No metered provider, active network scan, or paid job is activated.</p></div><span className={styles.safety}>SIGNED-IN • READ ONLY</span></div>
  <form className={styles.form} onSubmit={run}>
   <label htmlFor="osint-domain">Domain to verify</label>
   <input id="osint-domain" value={domain} onChange={e=>setDomain(e.target.value)} maxLength={254} autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="url" placeholder="example.com" required/>
   <label htmlFor="osint-mode">Research task</label>
   <select id="osint-mode" value={mode} onChange={e=>{setMode(e.target.value as 'dns'|'email');setResult(null)}}>
    <option value="dns">Public DNS records</option><option value="email">Email-domain security signals</option>
   </select>
   {mode==='dns'&&<><label htmlFor="osint-type">Record</label><select id="osint-type" value={recordType} onChange={e=>{setRecordType(e.target.value as (typeof types)[number]);setResult(null)}}>{types.map(t=><option key={t} value={t}>{t}</option>)}</select></>}
   <button disabled={busy||!token} type="submit">{busy?'CHECKING…':'CHECK LIVE PUBLIC DATA'}</button>
  </form>
  <p className={styles.notice}>Use public domains you own or have permission to assess. Technical signals are not proof of identity, compromise, legal compliance, or authority to act.</p>
  {error&&<div className={styles.error} role="alert">{error}</div>}
  {dns&&<section className={styles.results} aria-live="polite"><h3>{dns.name||domain} • {dns.type||recordType}</h3><p>{recordCount} returned record(s) from {dns.results?.length||0} independent query paths. Empty results do not prove a domain is safe or inactive.</p><div className={styles.answers}>{(dns.results||[]).map((source,index)=><article key={index}><b>Query path {index+1}</b><span>{source.error?'Unavailable: '+source.error:source.status_text||'Response received'}</span>{(source.records||[]).map((r,i)=><code key={i}>{String(r.data||'')}{typeof r.ttl==='number'?' · TTL '+r.ttl:''}</code>)}</article>)}</div></section>}
  {security&&<section className={styles.results} aria-live="polite"><h3>Email domain security • {security.domain||domain}</h3><p>Checks are indicators only; confirm configurations and delivery behavior separately.</p>{(security.findings||[]).length?<div className={styles.answers}>{(security.findings||[]).map((f,i)=><article key={i}><b>{f.level||'Finding'} • {f.code||'Signal'}</b><span>{f.message||'No explanation returned.'}</span></article>)}</div>:<p>No findings were returned. This is not a security certification.</p>}</section>}
  <div className={styles.links}><a href="/dns">Full Magnanimous DNS workspace →</a><a href="/contact-validation">Contact hygiene →</a><a href="/crm">Continue to CRM →</a></div>
 </section>
}
