'use client';
import {useState,type FormEvent} from 'react';
import styles from './osint-research.module.css';

type DnsAnswer={data?:string;type?:string;ttl?:number};
type DnsSource={error?:string;status_text?:string;records?:DnsAnswer[]};
type Lookup={name?:string;type?:string;results?:DnsSource[]};
type Finding={level?:string;code?:string;message?:string};
type Report={domain?:string;findings?:Finding[];checked_at?:string;privacy?:string;rdap?:Record<string,unknown>;dns?:{dnssec?:{ds_present?:boolean;dnskey_present?:boolean;authenticated_data?:boolean}};propagation?:Record<string,{consistent?:boolean;resolvers_checked?:number}>;[key:string]:unknown};
type Mode='dns'|'email'|'rdap'|'diagnose';
type Evidence={schema_version:1;domain:string;task:Mode;record_type?:string;collected_at:string;origin:'magnanimous-native-dns';scope:'read-only-public-domain';verification_note:string;result:Lookup|Report};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const domainPattern=/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/i;
const types=['A','AAAA','MX','TXT','NS','CAA','CNAME','SOA','DS'] as const;
const routes:Record<Mode,string>={
 dns:'/api/magnanimous/dns/lookup',
 email:'/api/magnanimous/dns/email-security',
 rdap:'/api/magnanimous/dns/rdap',
 diagnose:'/api/magnanimous/dns/diagnose'
};
const labels:Record<Mode,string>={dns:'Public DNS records',email:'Email-domain security signals',rdap:'Domain registration context',diagnose:'Full DNS health review'};
const note='Time-stamped research observation only. Public DNS, RDAP, and security findings are clues, not proof of ownership, attribution, compliance, compromise, or independent validation.';

export default function OsintResearch({token}:{token:string}){
 const [domain,setDomain]=useState('');
 const [mode,setMode]=useState<Mode>('dns');
 const [recordType,setRecordType]=useState<(typeof types)[number]>('A');
 const [busy,setBusy]=useState(false);
 const [evidence,setEvidence]=useState<Evidence|null>(null);
 const [error,setError]=useState('');
 const [downloadError,setDownloadError]=useState('');
 const validDomain=domain.trim().toLowerCase().replace(/\.$/,'');
 const canPivot=domainPattern.test(validDomain);

 async function run(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setEvidence(null);setDownloadError('');
  const name=validDomain;
  if(!domainPattern.test(name)){setError('Enter a valid public domain, such as example.com.');return}
  if(!token){setError('Sign in before running a live read-only check.');return}
  setBusy(true);
  try{
   const body=mode==='dns'?{name,type:recordType,resolver:'all'}:{domain:name};
   const response=await fetch(api+routes[mode],{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),cache:'no-store'});
   const raw=await response.text();
   let data:Lookup|Report|{detail?:string};
   try{data=JSON.parse(raw)}catch{throw new Error('Research service did not return readable data.')}
   if(!response.ok)throw new Error(('detail' in data&&typeof data.detail==='string'?data.detail:null)||'Research service unavailable ('+response.status+').');
   setEvidence({schema_version:1,domain:name,task:mode,...(mode==='dns'?{record_type:recordType}:{}),collected_at:new Date().toISOString(),origin:'magnanimous-native-dns',scope:'read-only-public-domain',verification_note:note,result:data as Lookup|Report});
  }catch(e){setError(e instanceof Error?e.message:'Unable to complete this check.')}
  finally{setBusy(false)}
 }
 function saveEvidence(){
  if(!evidence)return;
  try{
   const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=url;a.download='magnanimous-domain-evidence-'+evidence.domain+'-'+evidence.collected_at.slice(0,10)+'.json';
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),10000);setDownloadError('');
  }catch{setDownloadError('Could not save the report on this device. The results remain visible here.')}
 }
 const dns=evidence?.task==='dns'?evidence.result as Lookup:null;
 const report=evidence?.task!=='dns'&&evidence?evidence.result as Report:null;
 const recordCount=dns?.results?.reduce((n,r)=>n+(r.records?.length||0),0)||0;
 const findings=Array.isArray(report?.findings)?report.findings:[];
 const isRdap=evidence?.task==='rdap';
 const isDiagnose=evidence?.task==='diagnose';

 return <section className={styles.shell} aria-labelledby="osint-title">
  <div className={styles.top}><div><small>MAGNANIMOUS AI • RESEARCH & VERIFICATION</small><h2 id="osint-title">Public-domain intelligence</h2><p>Read-only checks through existing Magnanimous intelligence routes. Investigate technical records, registration context, and domain-health signals without activating a paid provider or active scan.</p></div><span className={styles.safety}>SIGNED-IN • READ ONLY</span></div>
  <form className={styles.form} onSubmit={run}>
   <label htmlFor="osint-domain">Domain to verify</label>
   <input id="osint-domain" value={domain} onChange={e=>{setDomain(e.target.value);setEvidence(null)}} maxLength={254} autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="url" placeholder="example.com" required/>
   <label htmlFor="osint-mode">Research task</label>
   <select id="osint-mode" value={mode} onChange={e=>{setMode(e.target.value as Mode);setEvidence(null)}}>
    {(Object.keys(labels) as Mode[]).map(k=><option value={k} key={k}>{labels[k]}</option>)}
   </select>
   {mode==='dns'&&<><label htmlFor="osint-type">Record</label><select id="osint-type" value={recordType} onChange={e=>{setRecordType(e.target.value as (typeof types)[number]);setEvidence(null)}}>{types.map(t=><option key={t} value={t}>{t}</option>)}</select></>}
   <button disabled={busy||!token} type="submit">{busy?'CHECKING…':'CHECK LIVE PUBLIC DATA'}</button>
  </form>
  <p className={styles.notice}>Enter a public domain you own or have permission to assess. Domain checks do not authorize intrusion, profiling, or website changes. No results are stored by this page.</p>
  {error&&<div className={styles.error} role="alert">{error}</div>}
  {evidence&&<section className={styles.results} aria-live="polite">
   <div className={styles.evidenceHead}><div><h3>{labels[evidence.task]} • {evidence.domain}</h3><p>Observed at {evidence.collected_at} (UTC). Collected through Magnanimous read-only services.</p></div><button className={styles.save} type="button" onClick={saveEvidence}>SAVE EVIDENCE JSON</button></div>
   {downloadError&&<p className={styles.error} role="alert">{downloadError}</p>}
   {dns&&<><p>{recordCount} returned record(s) from {dns.results?.length||0} independent query paths. Empty results do not prove a domain is safe or inactive.</p><div className={styles.answers}>{(dns.results||[]).map((source,index)=><article key={index}><b>Query path {index+1}</b><span>{source.error?'Unavailable: '+source.error:source.status_text||'Response received'}</span>{(source.records||[]).map((r,i)=><code key={i}>{String(r.data||'')}{typeof r.ttl==='number'?' · TTL '+r.ttl:''}</code>)}</article>)}</div></>}
   {isRdap&&<><p>{report?.privacy||'Registrant contact details are not displayed.'} Registration context can be incomplete or outdated.</p><pre className={styles.raw}>{JSON.stringify(report?.rdap||{},null,2)}</pre></>}
   {isDiagnose&&<><p>DNSSEC observations: DS {report?.dns?.dnssec?.ds_present?'detected':'not detected'}; DNSKEY {report?.dns?.dnssec?.dnskey_present?'detected':'not detected'}. Public resolver agreement does not establish security.</p><div className={styles.answers}>{Object.entries(report?.propagation||{}).map(([t,p])=><article key={t}><b>{t} • {p.consistent?'Resolver answers aligned':'Check differences'}</b><span>{p.resolvers_checked||0} resolvers compared</span></article>)}</div></>}
   {!isRdap&&!dns&&<><p>Automated findings are indicators to investigate, not security certification.</p>{findings.length?<div className={styles.answers}>{findings.map((f,i)=><article key={i}><b>{f.level||'Finding'} • {f.code||'Signal'}</b><span>{f.message||'No explanation returned.'}</span></article>)}</div>:<p>No findings were returned. This does not prove the domain is secure.</p>}</>}
   <p className={styles.notice}>{note}</p>
  </section>}
  <div className={styles.links}>
   {canPivot&&<><a href={'https://web.archive.org/web/*/https://'+encodeURIComponent(validDomain)+'/'} rel="noopener noreferrer" target="_blank" aria-label="Research historical public webpage captures in a separate website">Historical web captures ↗</a><a href={'https://crt.sh/?q=%25.'+encodeURIComponent(validDomain)} rel="noopener noreferrer" target="_blank" aria-label="Research public certificate transparency in a separate website">Certificate history ↗</a></>}
   <a href="/owner-dns">Owner DNS workspace →</a><a href="/contact-validation">Contact hygiene →</a><a href="/crm">Continue to CRM →</a>
  </div>
  {canPivot&&<p className={styles.notice}>Historical and certificate-history links open separate public research websites and disclose the entered domain to them when clicked. These external sources are not connected services or verified findings.</p>}
 </section>
}
