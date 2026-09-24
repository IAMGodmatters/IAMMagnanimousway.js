'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from '../sim/sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type RegulatoryCase={id:string;jurisdiction:string;authority_key:string;authority_name:string;status:string;application_reference?:string;evidence_reference?:string;notes?:string};
type ProviderCandidate={provider_key:string;role:string;adapter_state?:string;connected?:boolean};
type Overview={identity:string;brain:string;architecture:string;readiness:Record<string,boolean>;owned_service_core?:{provider_key:string;role:string;native_pbx:string;provider_owned_identity:boolean};upstream_candidates?:ProviderCandidate[];native_browser_target?:{provider_key:string;role:string;live:boolean;truth_boundary:string};routing_policy?:{measured_quality_signals?:string[];max_rate_enforced?:boolean;live_execution_uses_route_planner?:boolean;execution_note?:string};mobile_alternative:{provider_key:string;role:string;capabilities:string[]};regulatory_cases:RegulatoryCase[];authority_note:string};
const empty:Overview={identity:'Magnanimous Telecom',brain:'Magnanimous AI',architecture:'provider-neutral regulated-network control',readiness:{},owned_service_core:{provider_key:'magnanimous-telecom',role:'PBX, SIP registrar, routing, policy, CDR and contact-center control',native_pbx:'Asterisk',provider_owned_identity:true},upstream_candidates:[],native_browser_target:{provider_key:'magnanimous-asterisk-webrtc',role:'owned browser-agent signaling/media target',live:false,truth_boundary:'Source readiness is not live readiness.'},routing_policy:{measured_quality_signals:['ASR','ACD','PDD','network_failure_rate'],max_rate_enforced:true,live_execution_uses_route_planner:false},mobile_alternative:{provider_key:'gigs',role:'MVNO/mobile subscription adapter',capabilities:[]},regulatory_cases:[],authority_note:'Software readiness is not regulatory authority.'};

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
 const[routeDestination,setRouteDestination]=useState('+63');
 const[routeMode,setRouteMode]=useState('balanced');
 const[routePlan,setRoutePlan]=useState<any>(null);
 const routeDestinationValid=/^\+[1-9]\d{6,14}$/.test(routeDestination);

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
   const data=await call('/api/telecom/network/telnyx/number-search',{method:'POST',body:JSON.stringify({country_code:country,area_code:areaCode,emergency_capable:['US','CA'].includes(country)})});
   setNumberResults(data.data||[]);setNotice(`Found ${(data.data||[]).length} available number option(s). Search is read-only and does not purchase anything.`);
  }catch(caught:any){setError(caught?.message||'Unable to search numbers.')}finally{setBusy(false)}
 }

 async function previewRoute(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');setRoutePlan(null);
  try{
   const params=new URLSearchParams({to:routeDestination,mode:routeMode});
   const data=await call('/api/magnanimous/carrier/route-plan?'+params.toString());
   if(data.error)throw new Error(data.error);setRoutePlan(data);
   setNotice(data.selected?'Route preview selected '+data.selected.interconnect+' using '+data.selection_mode+' policy. No call was placed.':'No matching live route is configured yet. No call was placed.');
  }catch(caught:any){setError(caught?.message||'Unable to preview the carrier route.')}finally{setBusy(false)}
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
   <article><small>TELNYX BRIDGE</small><strong>{overview.readiness.telnyx?'READY':'LOCKED'}</strong></article>
   <article><small>GIGS MOBILE</small><strong>{overview.readiness.gigs?'READY':'LOCKED'}</strong></article>
   <article><small>PSTN BRIDGE</small><strong>{overview.readiness.wholesale_voice?'READY':'LOCKED'}</strong></article>
   <article><small>NATIVE WEBRTC</small><strong>{overview.readiness.native_webrtc_live?'VERIFIED':'NOT LIVE'}</strong></article>
   <article><small>E911 LIVE</small><strong>{overview.readiness.emergency_enabled?'VERIFIED':'OFF'}</strong></article>
   <article><small>DIRECT NUMBERING</small><strong>{overview.readiness.direct_numbering_authorized?'VERIFIED':'LATER'}</strong></article>
  </section>

  <section className={styles.status}><div><span className={styles.good}/><b>Magnanimous remains the public identity and AI command layer.</b></div><p>{overview.authority_note}</p></section>

  <section className={styles.grid}>
   <article className={styles.card}><small>OWNED TELECOM CORE</small><h2>{overview.owned_service_core?.native_pbx||'Asterisk'} + Magnanimous SIP</h2><p className={styles.muted}>{overview.owned_service_core?.role||'PBX, SIP, routing, policy and contact-center control stay under Magnanimous.'}</p><ul><li>Magnanimous public identity</li><li>Provider-neutral SIP/PSTN boundary</li><li>Owned CDR + routing policy</li><li>Free browser path first</li></ul></article>
   <article className={styles.card}><small>NATIVE BROWSER TARGET</small><h2>Asterisk WebRTC</h2><p className={styles.muted}>{overview.native_browser_target?.truth_boundary||'Native browser media is not marked live until registration and two-way media are verified.'}</p><p><b>{overview.native_browser_target?.live?'LIVE VERIFIED':'SOURCE READY / NOT LIVE'}</b></p><ul><li>WSS signaling</li><li>DTLS-SRTP media</li><li>ICE + RTCP mux</li><li>Opus preferred</li></ul></article>
   <form className={styles.card} onSubmit={searchNumbers}><small>SAFE LIVE ACTION</small><h2>Search telephone numbers</h2><label>Country<select value={country} onChange={e=>setCountry(e.target.value)}><option value='US'>United States</option><option value='CA'>Canada</option><option value='PH'>Philippines</option></select></label><label>Area / destination code<input value={areaCode} onChange={e=>setAreaCode(e.target.value)} placeholder='Example: 512'/></label><button disabled={busy||!overview.readiness.telnyx}>SEARCH — NO PURCHASE</button><p className={styles.muted}>Paid number orders remain double-locked by a runtime enable flag plus an explicit purchase confirmation.</p></form>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>REPLACEABLE UPSTREAMS</small><h2>Carrier candidate matrix</h2></div><span>Credentials ≠ live route</span></div>
   <div className={styles.grid}>{(overview.upstream_candidates||[]).map(item=><article className={styles.card} key={item.provider_key}><small>{item.connected?'ACCOUNT DETECTED':'CANDIDATE'}</small><h2>{item.provider_key.toUpperCase()}</h2><p>{item.role}</p><p className={styles.muted}>{item.adapter_state||'No dedicated live adapter is claimed.'}</p></article>)}</div>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>MAGNANIMOUS CARRIER ROUTING</small><h2>Carrier Route Planner</h2></div><span>Preview only · no call is placed</span></div>
   <form className={styles.card} onSubmit={previewRoute}>
    <label>E.164 destination<input value={routeDestination} onChange={e=>setRouteDestination(e.target.value)} placeholder='+639171234567'/></label>
    <label>Routing policy<select value={routeMode} onChange={e=>setRouteMode(e.target.value)}><option value='balanced'>Balanced quality + cost</option><option value='least-cost'>Least cost</option><option value='priority'>Configured priority</option></select></label>
    <button disabled={busy||!routeDestinationValid}>PREVIEW ROUTE</button>
    <p className={styles.muted}>Longest destination prefix wins first. Down/unavailable/failed routes and routes above their configured max-rate cap are excluded. Balanced mode uses fresh measured quality (ASR, ACD, PDD and network failures) when enough samples exist, then falls back to configured quality.</p>
   </form>
   {routePlan ? (
    <div className={styles.grid}>
     <article className={styles.card}>
      <small>SELECTED ROUTE</small>
      <h2>{routePlan.selected?.route||'No route'}</h2>
      <p>{routePlan.selected?.interconnect||'Configure an interconnect and destination route.'}</p>
      <p className={styles.muted}>
       Health: {routePlan.selected?.health||'—'} · Quality: {routePlan.selected?.quality_score??'—'} ({routePlan.selected?.quality_source||'configured'}) · Estimated rate: {routePlan.selected?.estimated_rate==null?'not entered':String(routePlan.selected.estimated_rate)}
      </p>
      <p className={styles.muted}>ASR: {routePlan.selected?.observed?.asr==null?'—':String(routePlan.selected.observed.asr)} · ACD: {routePlan.selected?.observed?.acd_seconds==null?'—':routePlan.selected.observed.acd_seconds+'s'} · PDD: {routePlan.selected?.observed?.pdd_ms==null?'—':routePlan.selected.observed.pdd_ms+'ms'} · Network failure: {routePlan.selected?.observed?.network_failure_rate==null?'—':String(routePlan.selected.observed.network_failure_rate)} · Samples: {routePlan.selected?.observed?.sample_count??0}</p>
     </article>
     <article className={styles.card}>
      <small>POLICY</small>
      <h2>{routePlan.selection_mode||routeMode}</h2>
      <p className={styles.muted}>{routePlan.policy}</p>
      <p>{(routePlan.matches||[]).length} matching route(s) · {routePlan.eligible_routes??0} eligible after health/rate policy</p>
      <p className={styles.muted}>{overview.routing_policy?.execution_note||'Preview/control policy does not claim that every legacy compatibility adapter already executes through the same selected-route contract.'}</p>
     </article>
    </div>
   ) : null}
  </section>

  {numberResults.length>0&&<section className={styles.inventory}><div className={styles.title}><div><small>AVAILABLE NUMBERS</small><h2>Read-only results</h2></div></div><div className={styles.table}>{numberResults.map((item:any)=><article key={item.phone_number}><div><b>{item.phone_number}</b><span>{item.cost_information?.currency||''} {item.cost_information?.monthly_cost||''}/mo</span></div><p>{(item.region_information||[]).map((region:any)=>region.region_name).filter(Boolean).join(', ')||'Available inventory'}</p><small>No purchase was made.</small></article>)}</div></section>}

  <section className={styles.inventory}><div className={styles.title}><div><small>UNITED STATES</small><h2>FCC / network readiness</h2></div></div><div className={styles.grid}>{renderCases('US')}</div></section>
  <section className={styles.inventory}><div className={styles.title}><div><small>PHILIPPINES</small><h2>NTC / network readiness</h2></div></div><div className={styles.grid}>{renderCases('PH')}</div></section>

  <section className={styles.guardrail}><h2>What Magnanimous can absorb versus what must be granted</h2><p>APIs, routing, provisioning workflows, SIM/eSIM lifecycle, number ordering, emergency-service integrations and provider switching can live inside Magnanimous. Government licenses, spectrum rights, direct numbering authorization, host-network agreements and interconnection contracts must come from the authorized regulator/network party. This dashboard tracks those external grants without pretending code created them.</p></section>
 </main>
}
