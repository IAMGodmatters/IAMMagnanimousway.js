'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from '../sim/sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type RegulatoryCase={id:string;jurisdiction:string;authority_key:string;authority_name:string;status:string;application_reference?:string;evidence_reference?:string;notes?:string};
type ProviderRole={provider_key:string;role:string;capabilities?:string[];usage?:string;limits?:string[]};
type Overview={identity:string;brain:string;architecture:string;readiness:Record<string,boolean>;preferred_bridge:ProviderRole;recommended_upstream:ProviderRole;fallback_policy:ProviderRole[];routing_policy:string;mobile_alternative:ProviderRole;regulatory_cases:RegulatoryCase[];authority_note:string};
const empty:Overview={identity:'Magnanimous Telecom',brain:'Magnanimous AI',architecture:'Magnanimous-owned PBX/SIP core with replaceable upstream carriers',readiness:{},preferred_bridge:{provider_key:'magnanimous-owned-sip',role:'carrier-neutral PBX/control bridge',capabilities:[]},recommended_upstream:{provider_key:'telnyx',role:'preferred upstream',capabilities:[]},fallback_policy:[],routing_policy:'Free browser → owned SIP/PBX → low-cost fallback → compatibility fallback.',mobile_alternative:{provider_key:'gigs',role:'MVNO/mobile subscription adapter',capabilities:[]},regulatory_cases:[],authority_note:'Software readiness is not regulatory authority.'};

async function parse(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}}

export default function NetworkAuthorityPage(){
 const[token,setToken]=useState('');
 const[overview,setOverview]=useState<Overview>(empty);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(false);
 const[country,setCountry]=useState('US');
 const[areaCode,setAreaCode]=useState('');
 const[numberResults,setNumberResults]=useState<any[]>([]);
 const[caseDrafts,setCaseDrafts]=useState<Record<string,{status:string;application_reference:string;evidence_reference:string;notes:string}>>({});

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace(`/login?returnTo=${encodeURIComponent('/telecom/network')}`);return}
  setToken(saved);void refresh(saved);
 },[]);

 async function call(path:string,options:RequestInit={},activeToken=token){
  const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${activeToken}`);if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const response=await fetch(`${api}${path}`,{...options,headers});const data=await parse(response);if(!response.ok)throw new Error(data.detail||'Request failed.');return data;
 }

 async function refresh(activeToken=token){
  try{
   const data=await call('/api/telecom/network/overview',{},activeToken);setOverview({...empty,...data});
   const drafts:Record<string,{status:string;application_reference:string;evidence_reference:string;notes:string}>={};
   for(const item of data.regulatory_cases||[])drafts[item.id]={status:item.status||'not_started',application_reference:item.application_reference||'',evidence_reference:item.evidence_reference||'',notes:item.notes||''};
   setCaseDrafts(drafts);setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load regulated-network control.')}
 }

 async function searchNumbers(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');setNumberResults([]);
  try{
   const data=await call('/api/telecom/network/telnyx/number-search',{method:'POST',body:JSON.stringify({country_code:country,area_code:areaCode,emergency_capable:country==='US'||country==='CA'})});
   setNumberResults(data.data||[]);setNotice(`Found ${(data.data||[]).length} available number option(s). Search is read-only and does not purchase anything.`);
  }catch(caught:any){setError(caught?.message||'Unable to search numbers.')}finally{setBusy(false)}
 }

 async function saveCase(item:RegulatoryCase){
  const draft=caseDrafts[item.id];if(!draft)return;setBusy(true);setNotice('');setError('');
  try{
   await call('/api/telecom/network/regulatory',{method:'PUT',body:JSON.stringify({jurisdiction:item.jurisdiction,authority_key:item.authority_key,...draft})});
   setNotice(`${item.authority_name} readiness record updated. This does not itself grant regulatory authority.`);await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to update readiness record.')}finally{setBusy(false)}
 }

 const renderCases=(jurisdiction:string)=>overview.regulatory_cases.filter(item=>item.jurisdiction===jurisdiction).map(item=>{
  const draft=caseDrafts[item.id]||{status:item.status,application_reference:'',evidence_reference:'',notes:''};
  return <article className={styles.card} key={item.id}>
   <small>{jurisdiction}</small><h2>{item.authority_name}</h2>
   <label>Status<select value={draft.status} onChange={e=>setCaseDrafts(current=>({...current,[item.id]:{...draft,status:e.target.value}}))}><option value='not_started'>Not started</option><option value='researching'>Researching</option><option value='planned'>Planned</option><option value='applying'>Applying</option><option value='submitted'>Submitted</option><option value='pending'>Pending</option><option value='blocked'>Blocked</option><option value='approved'>Approved</option><option value='verified'>Verified</option><option value='not_applicable'>Not applicable</option></select></label>
   <label>Application / case reference<input value={draft.application_reference} onChange={e=>setCaseDrafts(current=>({...current,[item.id]:{...draft,application_reference:e.target.value}}))} placeholder='Official filing or case reference'/></label>
   <label>Evidence reference<input value={draft.evidence_reference} onChange={e=>setCaseDrafts(current=>({...current,[item.id]:{...draft,evidence_reference:e.target.value}}))} placeholder='Approval/order/document reference'/></label>
   <label>Notes<input value={draft.notes} onChange={e=>setCaseDrafts(current=>({...current,[item.id]:{...draft,notes:e.target.value}}))} placeholder='Next step or blocker'/></label>
   <button type='button' disabled={busy} onClick={()=>saveCase(item)}>SAVE READINESS</button>
  </article>
 });

 return <main className={styles.shell}>
  <header className={styles.header}>
   <nav><a href='/telecom'>← TELECOM</a><a href='/telecom/sim'>SIM + eSIM</a><a href='/telecom-standalone'>STANDALONE</a><a href='/'>I AM MAGNANIMOUS WAY™</a></nav>
   <p className={styles.eyebrow}>MAGNANIMOUS TELECOM · REGULATED NETWORK</p>
   <h1>Carrier <em>Access</em></h1>
   <p>Connect numbering, PSTN, emergency service, SIM/eSIM and mobile-network partners underneath Magnanimous while tracking the outside approvals needed for greater direct telecom authority.</p>
  </header>

  {error&&<div className={styles.error}>{error}</div>}{notice&&<div className={styles.notice}>{notice}</div>}

  <section className={styles.metrics}>
   <article><small>OWNED SIP CORE</small><strong>{overview.readiness.owned_sip_bridge?'CONNECTED':'DEPLOY / CONNECT'}</strong></article>
   <article><small>TELNYX UPSTREAM</small><strong>{overview.readiness.telnyx_provisioning?'PROVISIONING READY':'SETUP'}</strong></article>
   <article><small>PLIVO FALLBACK</small><strong>{overview.readiness.plivo_fallback?'READY':'OPTIONAL'}</strong></article>
   <article><small>TWILIO FALLBACK</small><strong>{overview.readiness.twilio_fallback?'READY':'OPTIONAL'}</strong></article>
   <article><small>DIRECT NUMBERING</small><strong>{overview.readiness.direct_numbering_authorized?'VERIFIED':'LATER'}</strong></article>
  </section>

  <section className={styles.status}><div><span className={styles.good}/><b>Magnanimous remains the public identity and AI command layer.</b></div><p>{overview.authority_note}</p></section>

  <section className={styles.grid}>
   <article className={styles.card}><small>PRIMARY CONTROL PLANE</small><h2>Magnanimous-owned SIP / PBX</h2><p className={styles.muted}>Asterisk and the Magnanimous Telecom control API stay in charge of agent extensions, IVR/ACD control and carrier routing. Upstream carriers remain replaceable.</p><ul>{(overview.preferred_bridge.capabilities||[]).slice(0,6).map(item=><li key={item}>{item.replaceAll('_',' ')}</li>)}</ul><p className={styles.muted}>{overview.readiness.owned_sip_bridge?'The authenticated PBX bridge is configured.':'The owned telecom-core is code-ready, but an authenticated public PBX bridge is not yet proven connected in this runtime.'}</p></article>
   <article className={styles.card}><small>RECOMMENDED UPSTREAM</small><h2>Telnyx behind Magnanimous</h2><p className={styles.muted}>{overview.recommended_upstream.usage||'Use Telnyx as a replaceable SIP/numbering upstream where its rates, coverage and local requirements fit.'}</p><ul><li>SIP/PSTN trunking</li><li>Phone numbers + porting</li><li>Emergency-service provisioning</li><li>WebRTC / voice APIs</li><li>Mobile connectivity options</li></ul><p className={styles.muted}>{overview.readiness.telnyx_provisioning?'Encrypted Telnyx provisioning credentials are detected.':'Telnyx remains an available upstream once its encrypted credentials/account are connected.'}</p></article>
   <article className={styles.card}><small>ROUTING POLICY</small><h2>Cost + coverage failover</h2><p className={styles.muted}>{overview.routing_policy}</p><ul>{(overview.fallback_policy||[]).map(item=><li key={item.provider_key}><b>{item.provider_key}</b> — {item.role}</li>)}</ul><p className={styles.muted}>No vendor is assumed cheapest for every country. Magnanimous should select by destination, number availability, compliance, quality and current rate card.</p></article>
   <article className={styles.card}><small>MOBILE ALTERNATIVE</small><h2>Gigs adapter</h2><p className={styles.muted}>Second path for branded wireless/MVNO subscriptions, physical SIM and eSIM lifecycle.</p><ul><li>pSIM + eSIM</li><li>Mobile plans</li><li>Subscriptions</li><li>Provider diversity</li></ul><p className={styles.muted}>{overview.readiness.gigs?'Encrypted Gigs project credentials detected.':'Add GIGS_API_TOKEN and GIGS_PROJECT_ID as encrypted Worker secrets when a Gigs project exists.'}</p></article>
   <form className={styles.card} onSubmit={searchNumbers}><small>SAFE LIVE ACTION</small><h2>Search telephone numbers</h2><label>Country<select value={country} onChange={e=>setCountry(e.target.value)}><option value='US'>United States</option><option value='CA'>Canada</option><option value='PH'>Philippines</option></select></label><label>Area / destination code<input value={areaCode} onChange={e=>setAreaCode(e.target.value)} placeholder='Example: 512'/></label><button disabled={busy||!overview.readiness.telnyx_provisioning}>SEARCH — NO PURCHASE</button><p className={styles.muted}>Number inventory and documentation requirements vary by country. Paid orders remain double-locked by a runtime flag plus explicit purchase confirmation.</p></form>
  </section>

  {numberResults.length>0&&<section className={styles.inventory}><div className={styles.title}><div><small>AVAILABLE NUMBERS</small><h2>Read-only results</h2></div></div><div className={styles.table}>{numberResults.map((item:any)=><article key={item.phone_number}><div><b>{item.phone_number}</b><span>{item.cost_information?.currency||''} {item.cost_information?.monthly_cost||''}/mo</span></div><p>{(item.region_information||[]).map((region:any)=>region.region_name).filter(Boolean).join(', ')||'Available inventory'}</p><small>No purchase was made.</small></article>)}</div></section>}

  <section className={styles.inventory}><div className={styles.title}><div><small>UNITED STATES</small><h2>FCC / network readiness</h2></div></div><div className={styles.grid}>{renderCases('US')}</div></section>
  <section className={styles.inventory}><div className={styles.title}><div><small>PHILIPPINES</small><h2>NTC / network readiness</h2></div></div><div className={styles.grid}>{renderCases('PH')}</div></section>

  <section className={styles.guardrail}><h2>What Magnanimous can absorb versus what must be granted</h2><p>APIs, routing, provisioning workflows, SIM/eSIM lifecycle, number ordering, emergency-service integrations and provider switching can live inside Magnanimous. Government licenses, spectrum rights, direct numbering authorization, host-network agreements and interconnection contracts must come from the authorized regulator/network party. This dashboard tracks those external grants without pretending code created them.</p></section>
 </main>
}
