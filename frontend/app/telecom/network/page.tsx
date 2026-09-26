'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from '../sim/sim.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type RegulatoryCase={id:string;jurisdiction:string;authority_key:string;authority_name:string;status:string;application_reference?:string;evidence_reference?:string;notes?:string};
type ProviderCandidate={provider_key:string;role:string;adapter_state?:string;connected?:boolean};
type Overview={identity:string;brain:string;architecture:string;readiness:Record<string,boolean>;owned_service_core?:{provider_key:string;role:string;native_pbx:string;provider_owned_identity:boolean};upstream_candidates?:ProviderCandidate[];native_browser_target?:{provider_key:string;role:string;live:boolean;truth_boundary:string};routing_policy?:{measured_quality_signals?:string[];max_rate_enforced?:boolean;live_execution_uses_route_planner?:boolean;execution_note?:string};mobile_alternative:{provider_key:string;role:string;capabilities:string[]};global_mobile?:any;regulatory_cases:RegulatoryCase[];authority_note:string};
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
 const[originCost,setOriginCost]=useState('10');
 const[originVariableCost,setOriginVariableCost]=useState('0');
 const[fundedVariableCap,setFundedVariableCap]=useState('0');
 const[mandatoryFees,setMandatoryFees]=useState('0');
 const[originReference,setOriginReference]=useState('');
 const[commercialReference,setCommercialReference]=useState('');
 const[originVerified,setOriginVerified]=useState(false);
 const[globalQuote,setGlobalQuote]=useState<any>(null);
 const[mobileCountry,setMobileCountry]=useState('PH');
 const[countryEvidence,setCountryEvidence]=useState('');
 const[countryVerified,setCountryVerified]=useState(false);
 const[offerAdapter,setOfferAdapter]=useState('');
 const[offerNetwork,setOfferNetwork]=useState('');
 const[offerAuthorized,setOfferAuthorized]=useState(false);
 const[offerBackup,setOfferBackup]=useState(false);
 const[profileRef,setProfileRef]=useState('');
 const[profileRole,setProfileRole]=useState('primary');
 const[profileNetwork,setProfileNetwork]=useState('');
 const[mobileProfiles,setMobileProfiles]=useState<any[]>([]);
 const[connectProfile,setConnectProfile]=useState('');
 const[connectEventType,setConnectEventType]=useState('quality');
 const[failoverReason,setFailoverReason]=useState('');
 const[servingNetwork,setServingNetwork]=useState('');
 const[latencyMs,setLatencyMs]=useState('0');
 const[packetLoss,setPacketLoss]=useState('0');
 const[downlinkMbps,setDownlinkMbps]=useState('0');
 const[uplinkMbps,setUplinkMbps]=useState('0');
 const[enrollmentProfile,setEnrollmentProfile]=useState('');
 const[enrollmentToken,setEnrollmentToken]=useState('');
 const[enrollmentExpires,setEnrollmentExpires]=useState(0);
 const[primaryProofProfile,setPrimaryProofProfile]=useState('');
 const[backupProofProfile,setBackupProofProfile]=useState('');
 const[triggerEventId,setTriggerEventId]=useState('');
 const[backupEventId,setBackupEventId]=useState('');
 const[failoverEvidence,setFailoverEvidence]=useState('');
 const[mobilePartners,setMobilePartners]=useState<any[]>([]);
 const[partnerDrafts,setPartnerDrafts]=useState<Record<string,any>>({});
 const[emailWatch,setEmailWatch]=useState<any>(null);
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
   const [data,profiles,partners,emailWatchState]=await Promise.all([
    call('/api/telecom/network/overview',{},activeToken),
    call('/api/telecom/network/global-mobile/profiles',{},activeToken).catch(()=>({items:[]})),
    call('/api/telecom/network/global-mobile/partners',{},activeToken).catch(()=>({items:[]})),
    call('/api/telecom/email-watch/status',{},activeToken).catch(()=>null)
   ]);
   setOverview({...empty,...data});setMobileProfiles(profiles.items||[]);setMobilePartners(partners.items||[]);setEmailWatch(emailWatchState);
   const partnerState:Record<string,any>={};
   for(const item of partners.items||[])partnerState[item.provider_key]={...item,countries_csv:(item.countries||[]).join(','),capabilities_csv:(item.capabilities||[]).join(',')};
   setPartnerDrafts(partnerState);
   const items=profiles.items||[];
   if(!connectProfile&&items.length)setConnectProfile(String(items[0].id||''));
   if(!enrollmentProfile&&items.length)setEnrollmentProfile(String(items[0].id||''));
   if(!primaryProofProfile){const primary=items.find((item:any)=>item.profile_role==='primary');if(primary)setPrimaryProofProfile(String(primary.id||''))}
   if(!backupProofProfile){const backup=items.find((item:any)=>item.profile_role==='backup');if(backup)setBackupProofProfile(String(backup.id||''))}
   const drafts:Record<string,{status:string;application_reference:string;evidence_reference:string;notes:string}>={};
   for(const item of data.regulatory_cases||[])drafts[item.id]={status:item.status||'not_started',application_reference:item.application_reference||'',evidence_reference:item.evidence_reference||'',notes:item.notes||''};
   setCaseDrafts(drafts);setError('');
  }catch(caught:any){setError(caught?.message||'Unable to load regulated-network control.')}
 }

 async function runTelecomEmailWatch(){
  setBusy(true);setNotice('');setError('');
  try{
   const result=await call('/api/telecom/email-watch/run',{method:'POST'});
   setNotice(`Telecom email watch ran: ${result.status||'ok'} · processed ${Number(result.processed||0)} · replied ${Number(result.replied||0)}. Automated acknowledgements and recent same-thread replies are suppressed.`);
   await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to run Telecom email watch.')}finally{setBusy(false)}
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

 async function quoteGlobalMobile(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');setGlobalQuote(null);
  try{
   const data=await call('/api/telecom/network/global-mobile/retail-quote',{method:'POST',body:JSON.stringify({
    origin_monthly_cost:Number(originCost),
    origin_variable_cost_per_gb:Number(originVariableCost),
    funded_variable_cost_cap:Number(fundedVariableCap),
    mandatory_taxes_and_fees:Number(mandatoryFees),
    currency:'USD',
    origin_reference:originReference,
    origin_cost_verified:originVerified
   })});
   setGlobalQuote(data);
   setNotice('Global mobile retail quote calculated from the verified origin cost. No purchase or service activation occurred.');
  }catch(caught:any){setError(caught?.message||'Unable to calculate the global mobile quote.')}finally{setBusy(false)}
 }

 async function verifyMobileCountry(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   await call('/api/telecom/network/global-mobile/countries',{method:'PUT',body:JSON.stringify({
    country_code:mobileCountry,capability:'mobile_data',state:'production_verified',
    evidence_reference:countryEvidence,provider_ref:offerAdapter,production_verified:countryVerified,
    notes:'Owner-verified global mobile data capability evidence.'
   })});
   setNotice('Country mobile-data capability evidence saved. This records proof; it does not create carrier authority.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to save country capability evidence.')}finally{setBusy(false)}
 }

 async function saveWholesaleOffer(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   const data=await call('/api/telecom/network/global-mobile/offers',{method:'POST',body:JSON.stringify({
    country_code:mobileCountry,adapter_key:offerAdapter,network_group:offerNetwork||offerAdapter,
    origin_reference:originReference,commercial_reference:commercialReference,origin_cost_verified:originVerified,commercial_authorized:offerAuthorized,
    origin_monthly_cost:Number(originCost),included_high_speed_gb:0,
    expected_high_speed_gb:0,origin_variable_cost_per_gb:Number(originVariableCost),
    funded_variable_cost_cap:Number(fundedVariableCap),mandatory_taxes_and_fees:Number(mandatoryFees),
    observed_latency_ms:0,quality_score:0.5,backup_eligible:offerBackup
   })});
   setNotice('Verified wholesale offer '+data.id+' saved. No purchase or activation occurred.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to save wholesale offer.')}finally{setBusy(false)}
 }

 async function createMobileProfile(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   const data=await call('/api/telecom/network/global-mobile/profiles',{method:'POST',body:JSON.stringify({
    country_code:mobileCountry,adapter_key:offerAdapter,provider_profile_ref:profileRef,
    network_group:profileNetwork||offerNetwork||offerAdapter,profile_role:profileRole
   })});
   setNotice('Mobile access profile '+data.id+' created in provisioning state. Only an opaque provider reference was stored.');
   setProfileRef('');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to create access profile.')}finally{setBusy(false)}
 }

 async function recordConnectivity(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   const data=await call('/api/telecom/network/global-mobile/connectivity',{method:'POST',body:JSON.stringify({
    profile_id:connectProfile,event_type:connectEventType,serving_network_ref:servingNetwork,
    latency_ms:Number(latencyMs),packet_loss_percent:Number(packetLoss),
    downlink_mbps:Number(downlinkMbps),uplink_mbps:Number(uplinkMbps),failover_reason:failoverReason
   })});
   setNotice('Connectivity evidence '+data.id+' recorded for '+connectEventType+'. Keep this event ID for any independent-backup proof.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to record connectivity evidence.')}finally{setBusy(false)}
 }

 async function issueEnrollmentToken(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');setEnrollmentToken('');setEnrollmentExpires(0);
  try{
   const profile=mobileProfiles.find(item=>item.id===enrollmentProfile);
   const data=await call('/api/telecom/network/global-mobile/enrollment-tokens',{method:'POST',body:JSON.stringify({
    profile_id:enrollmentProfile,purpose:profile?.profile_role==='backup'?'backup_enrollment':'profile_enrollment'
   })});
   setEnrollmentToken(data.enrollment_token||'');setEnrollmentExpires(Number(data.expires_at||0));
   setNotice('One-time Magnanimous enrollment token issued. It is returned once and stored only as a hash.');
  }catch(caught:any){setError(caught?.message||'Unable to issue enrollment token.')}finally{setBusy(false)}
 }

 async function verifyFailoverProof(event:FormEvent){
  event.preventDefault();setBusy(true);setNotice('');setError('');
  try{
   const data=await call('/api/telecom/network/global-mobile/failover-proof',{method:'POST',body:JSON.stringify({
    primary_profile_id:primaryProofProfile,backup_profile_id:backupProofProfile,
    trigger_event_id:triggerEventId,backup_event_id:backupEventId,evidence_reference:failoverEvidence
   })});
   setNotice('Independent backup failover proof '+data.id+' verified from observed events on different network groups.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to verify independent backup evidence.')}finally{setBusy(false)}
 }

 async function savePartner(item:any){
  const draft=partnerDrafts[item.provider_key];if(!draft)return;setBusy(true);setNotice('');setError('');
  try{
   await call('/api/telecom/network/global-mobile/partners',{method:'PUT',body:JSON.stringify({
    provider_key:item.provider_key,status:draft.status,case_reference:draft.case_reference,
    evidence_reference:draft.evidence_reference,pricing_reference:draft.pricing_reference,
    commercial_reference:draft.commercial_reference,sandbox_reference:draft.sandbox_reference,
    next_action:draft.next_action,notes:draft.notes,
    countries:String(draft.countries_csv||'').split(',').map((x:string)=>x.trim()).filter(Boolean),
    capabilities:String(draft.capabilities_csv||'').split(',').map((x:string)=>x.trim()).filter(Boolean)
   })});
   setNotice(item.display_name+' acquisition record updated. Provider credentials remain outside this tracker.');await refresh();
  }catch(caught:any){setError(caught?.message||'Unable to update carrier acquisition record.')}finally{setBusy(false)}
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
   <article><small>GLOBAL MOBILE</small><strong>{overview.global_mobile?.production_verified?'VERIFIED':'NOT LIVE'}</strong></article>
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
   <div className={styles.title}><div><small>TELECOM EMAIL WATCH</small><h2>Carrier + NTC correspondence</h2></div><span>{Number(emailWatch?.state?.enabled??1)===1?'MONITORING ENABLED':'MONITORING DISABLED'}</span></div>
   <div className={styles.grid}>
    <article className={styles.card}>
     <small>15-MINUTE NATIVE WATCH</small><h2>{emailWatch?.state?.last_error?'NEEDS ATTENTION':emailWatch?.state?.last_run_at?'ACTIVE':'READY / FIRST RUN PENDING'}</h2>
     <p><b>Last run:</b> {emailWatch?.state?.last_run_at?new Date(Number(emailWatch.state.last_run_at)*1000).toLocaleString():'Not recorded yet'}</p>
     <p><b>Last action:</b> {emailWatch?.state?.last_action||'No processed carrier/NTC mail yet'}</p>
     {emailWatch?.state?.last_error&&<p className={styles.muted}><b>Setup/action needed:</b> {emailWatch.state.last_error}</p>}
     <button disabled={busy} onClick={runTelecomEmailWatch}>RUN WATCH NOW</button>
     <p className={styles.muted}>Uses the owner-authorized Magnanimous Gmail connection. It never exposes OAuth tokens, never replies twice to the same Gmail message, suppresses automatic acknowledgements, enforces a six-hour thread cooldown, and never accepts contracts or authorizes payments.</p>
    </article>
    <article className={styles.card}>
     <small>RECENT EVIDENCE</small><h2>{(emailWatch?.events||[]).length} recorded item(s)</h2>
     <ul>{(emailWatch?.events||[]).slice(0,8).map((item:any)=><li key={item.message_id}><b>{String(item.provider_key||'telecom').toUpperCase()}</b> · {String(item.classification||'observed').replaceAll('_',' ')} · {String(item.action||'recorded').replaceAll('_',' ')}</li>)}</ul>
     <p className={styles.muted}>Message bodies, OAuth secrets, and provider authentication material are not displayed here.</p>
    </article>
   </div>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>GLOBAL MOBILE ACQUISITION</small><h2>Carrier partnership pipeline</h2></div><span>Owner-only · no provider secrets</span></div>
   <div className={styles.grid}>{mobilePartners.map(item=>{
    const draft=partnerDrafts[item.provider_key]||item;
    return <article className={styles.card} key={item.provider_key}>
     <small>{String(draft.status||'researching').replaceAll('_',' ').toUpperCase()}</small><h2>{item.display_name}</h2>
     <p>{item.contact_channel||'contact'} · {item.contact_destination||'not entered'}</p>
     <label>Status<select value={draft.status||'researching'} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,status:e.target.value}}))}>
      {['researching','contacted','sales_contacted','case_open','case_followed_up','sales_handoff','test_access_requested','sandbox_pending','sandbox_ready','commercial_review','contract_pending','contract_verified','blocked','declined','retired'].map(status=><option value={status} key={status}>{status.replaceAll('_',' ')}</option>)}
     </select></label>
     <label>Case / sales reference<input value={draft.case_reference||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,case_reference:e.target.value}}))}/></label>
     <label>Contact/evidence reference<input value={draft.evidence_reference||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,evidence_reference:e.target.value}}))}/></label>
     <label>Pricing/rate-card reference<input value={draft.pricing_reference||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,pricing_reference:e.target.value}}))}/></label>
     <label>Commercial agreement reference<input value={draft.commercial_reference||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,commercial_reference:e.target.value}}))}/></label>
     <label>Sandbox/test reference<input value={draft.sandbox_reference||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,sandbox_reference:e.target.value}}))}/></label>
     <label>Countries (CSV)<input value={draft.countries_csv||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,countries_csv:e.target.value}}))} placeholder='PH,US'/></label>
     <label>Capabilities (CSV)<input value={draft.capabilities_csv||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,capabilities_csv:e.target.value}}))} placeholder='esim,data,sms,voice'/></label>
     <label>Next action<input value={draft.next_action||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,next_action:e.target.value}}))}/></label>
     <label>Notes<input value={draft.notes||''} onChange={e=>setPartnerDrafts(current=>({...current,[item.provider_key]:{...draft,notes:e.target.value}}))}/></label>
     <button disabled={busy} onClick={()=>savePartner(item)}>SAVE ACQUISITION STATE</button>
     <p className={styles.muted}>Contract verified is rejected unless an agreement-grade commercial reference is present. Sandbox/test access proves integration only; it never satisfies real subscriber-connectivity or production-country proof by itself.</p>
    </article>
   })}</div>
  </section>

  <section className={styles.inventory}>
   <div className={styles.title}><div><small>MAGNANIMOUS GLOBAL MOBILE</small><h2>Global SIM/eSIM retail blueprint</h2></div><span>{overview.global_mobile?.production_verified?'LIVE VERIFIED':'SOURCE READY / NOT LIVE'}</span></div>
   <div className={styles.grid}>
    <article className={styles.card}><small>ACCESS LAYER</small><h2>Multi-network eSIM strategy</h2><p className={styles.muted}>{overview.global_mobile?.architecture||'Provider-neutral mobile access beneath Magnanimous.'}</p><ul><li>Primary SIM/eSIM</li><li>Optional backup profile</li><li>Quality/cost-aware network selection</li><li>Local profiles where permanent roaming requires them</li></ul></article>
    <article className={styles.card}><small>COMMUNICATIONS LAYER</small><h2>Magnanimous number + app fallback</h2><ul><li>Multiple number identity</li><li>App voice and messaging fallback</li><li>Voicemail + optional AI call assistance</li><li>2FA compatibility reported honestly per number type</li></ul><p className={styles.muted}>A VoIP number is never advertised as guaranteed to receive every bank or short-code message.</p></article>
    <article className={styles.card}><small>COST CONTROL</small><h2>Funded fair-use economics</h2><ul><li>{overview.global_mobile?.cost_policy?.retail_markup_percent??20}% verified-origin uplift</li><li>High-speed allowance + documented throttle/QoS when supported</li><li>Hard variable-cost cap</li><li>No silent paid fallback</li></ul><p className={styles.muted}>Competitor retail prices are benchmarks, not Magnanimous wholesale cost.</p></article>
   </div>
   <div className={styles.grid}>
    <article className={styles.card}><small>LIVE PROOF GATES</small><h2>{overview.global_mobile?.launch_readiness?.launch_ready?'ALL PROOF PASSED':'NOT YET LIVE'}</h2><ul>
     {Object.entries(overview.global_mobile?.launch_readiness?.gates||{}).map(([key,value])=><li key={key}>{value?'✓':'○'} {key.replaceAll('_',' ')}</li>)}
    </ul><p><b>Independent backup:</b> {overview.global_mobile?.launch_readiness?.multi_network_resilience_verified?'VERIFIED':'NOT VERIFIED'}</p><p className={styles.muted}>{overview.global_mobile?.launch_readiness?.truth_boundary||'The environment flag cannot make service live without durable proof.'}</p></article>
    <form className={styles.card} onSubmit={verifyMobileCountry}><small>COUNTRY PROOF</small><h2>Verify mobile-data capability</h2>
     <label>Country code<input maxLength={2} value={mobileCountry} onChange={e=>{setMobileCountry(e.target.value.toUpperCase());setCountryVerified(false)}} placeholder='PH'/></label>
     <label>Evidence reference<input value={countryEvidence} onChange={e=>{setCountryEvidence(e.target.value);setCountryVerified(false)}} placeholder='Official agreement/compliance evidence reference'/></label>
     <label><input type='checkbox' checked={countryVerified} onChange={e=>setCountryVerified(e.target.checked)}/> I verified this country capability against the referenced evidence.</label>
     <button disabled={busy||!countryEvidence.trim()||!countryVerified}>SAVE VERIFIED COUNTRY PROOF</button>
    </form>
    <form className={styles.card} onSubmit={saveWholesaleOffer}><small>WHOLESALE PROOF</small><h2>Activate verified origin offer</h2>
     <label>Adapter key<input value={offerAdapter} onChange={e=>setOfferAdapter(e.target.value.toLowerCase())} placeholder='authorized-mobile-adapter'/></label>
     <label>Independent network group<input value={offerNetwork} onChange={e=>setOfferNetwork(e.target.value.toLowerCase())} placeholder='network-a'/></label>
     <label>Commercial agreement evidence<input value={commercialReference} onChange={e=>{setCommercialReference(e.target.value);setOfferAuthorized(false)}} placeholder='https://… or contract:/agreement:/reseller-agreement: reference'/></label>
     <label><input type='checkbox' checked={offerAuthorized} onChange={e=>setOfferAuthorized(e.target.checked)}/> I verified that this separate agreement authorizes the intended commercial/resale use.</label>
     <label><input type='checkbox' checked={offerBackup} onChange={e=>setOfferBackup(e.target.checked)}/> Eligible as a backup path.</label>
     <button disabled={busy||!offerAdapter.trim()||!offerAuthorized||!commercialReference.trim()||!originVerified||!originReference.trim()}>SAVE VERIFIED WHOLESALE OFFER</button>
     <p className={styles.muted}>Pricing evidence and commercial/resale authorization are separate proofs. Both are required; neither makes a purchase.</p>
    </form>
    <form className={styles.card} onSubmit={createMobileProfile}><small>ACCESS PROFILE</small><h2>Register provisioned SIM/eSIM</h2>
     <label>Role<select value={profileRole} onChange={e=>setProfileRole(e.target.value)}><option value='primary'>Primary</option><option value='backup'>Backup</option></select></label>
     <label>Opaque provider profile reference<input value={profileRef} onChange={e=>setProfileRef(e.target.value)} placeholder='Provider-issued non-secret profile ID'/></label>
     <label>Network group<input value={profileNetwork} onChange={e=>setProfileNetwork(e.target.value.toLowerCase())} placeholder='network-a'/></label>
     <button disabled={busy||!offerAdapter.trim()||!profileRef.trim()}>CREATE ACCESS PROFILE</button>
     <p className={styles.muted}>Never paste QR payloads, activation codes, Ki, OPc, ADM, or other SIM secrets here.</p>
    </form>
    <form className={styles.card} onSubmit={recordConnectivity}><small>REAL CONNECTIVITY PROOF</small><h2>Record subscriber network evidence</h2>
     <label>Access profile<select value={connectProfile} onChange={e=>setConnectProfile(e.target.value)}><option value=''>Select profile</option>{mobileProfiles.map(item=><option value={item.id} key={item.id}>{item.profile_role} · {item.adapter_key} · {item.network_group} · {item.country_code}</option>)}</select></label>
     <label>Observed event<select value={connectEventType} onChange={e=>setConnectEventType(e.target.value)}><option value='quality'>Quality sample</option><option value='attach'>Attach / service acquired</option><option value='detach'>Primary service lost</option><option value='failover'>Failover trigger</option><option value='recovery'>Recovered service</option></select></label>
     <label>Serving network reference<input value={servingNetwork} onChange={e=>setServingNetwork(e.target.value)} placeholder={['detach','failover'].includes(connectEventType)?'Optional for loss/trigger':'Observed network/operator reference'}/></label>
     <label>Failover / observation reason<input value={failoverReason} onChange={e=>setFailoverReason(e.target.value)} placeholder='What was observed?'/></label>
     <label>Latency ms<input type='number' min='0' value={latencyMs} onChange={e=>setLatencyMs(e.target.value)}/></label>
     <label>Packet loss %<input type='number' min='0' max='100' step='0.01' value={packetLoss} onChange={e=>setPacketLoss(e.target.value)}/></label>
     <label>Downlink Mbps<input type='number' min='0' step='0.01' value={downlinkMbps} onChange={e=>setDownlinkMbps(e.target.value)}/></label>
     <label>Uplink Mbps<input type='number' min='0' step='0.01' value={uplinkMbps} onChange={e=>setUplinkMbps(e.target.value)}/></label>
     <button disabled={busy||!connectProfile||(!['detach','failover'].includes(connectEventType)&&!servingNetwork.trim())}>SAVE OBSERVED CONNECTIVITY EVENT</button>
    </form>
    <form className={styles.card} onSubmit={issueEnrollmentToken}><small>MAGNANIMOUS ACTIVATION</small><h2>Issue one-time enrollment secret</h2>
     <label>Access profile<select value={enrollmentProfile} onChange={e=>{setEnrollmentProfile(e.target.value);setEnrollmentToken('')}}><option value=''>Select profile</option>{mobileProfiles.map(item=><option value={item.id} key={item.id}>{item.profile_role} · {item.adapter_key} · {item.country_code}</option>)}</select></label>
     <button disabled={busy||!enrollmentProfile}>ISSUE ONE-TIME MAGNANIMOUS TOKEN</button><p><a href='/telecom/activate'>Open customer redemption page →</a></p>
     {enrollmentToken&&<><label>Returned once<input readOnly value={enrollmentToken}/></label><p className={styles.muted}>Expires {enrollmentExpires?new Date(enrollmentExpires*1000).toLocaleString():'soon'}. Stored only as a SHA-256 hash. This is not a carrier/SM-DP+ activation code.</p></>}
    </form>
    <form className={styles.card} onSubmit={verifyFailoverProof}><small>INDEPENDENT BACKUP</small><h2>Verify observed failover path</h2>
     <label>Primary profile<select value={primaryProofProfile} onChange={e=>setPrimaryProofProfile(e.target.value)}><option value=''>Select primary</option>{mobileProfiles.filter(item=>item.profile_role==='primary').map(item=><option value={item.id} key={item.id}>{item.adapter_key} · {item.network_group}</option>)}</select></label>
     <label>Backup profile<select value={backupProofProfile} onChange={e=>setBackupProofProfile(e.target.value)}><option value=''>Select backup</option>{mobileProfiles.filter(item=>item.profile_role==='backup').map(item=><option value={item.id} key={item.id}>{item.adapter_key} · {item.network_group}</option>)}</select></label>
     <label>Primary detach/failover event ID<input value={triggerEventId} onChange={e=>setTriggerEventId(e.target.value)} placeholder='mobile_net_…'/></label>
     <label>Later successful backup event ID<input value={backupEventId} onChange={e=>setBackupEventId(e.target.value)} placeholder='mobile_net_…'/></label>
     <label>Evidence reference<input value={failoverEvidence} onChange={e=>setFailoverEvidence(e.target.value)} placeholder='Test log, incident, measurement, or provider evidence reference'/></label>
     <button disabled={busy||!primaryProofProfile||!backupProofProfile||!triggerEventId.trim()||!backupEventId.trim()||!failoverEvidence.trim()}>VERIFY INDEPENDENT BACKUP EVIDENCE</button>
     <p className={styles.muted}>This passes only when the primary trigger is recorded first, the backup later proves service, and the two profiles use different network groups.</p>
    </form>
    <article className={styles.card}><small>COST / FAIR-USE GATE</small><h2>{overview.global_mobile?.launch_readiness?.gates?.active_cost_fair_use_policy?'ACTIVE':'REQUIRED'}</h2><p>Global mobile requires an active data/roaming-data policy with a fair-use threshold, throttle, or daily spend limit before launch.</p><p><a href='/telecom/charging'>Open Telecom Charging →</a></p></article>
   </div>
   <form className={styles.card} onSubmit={quoteGlobalMobile}>
    <small>SAFE PRICING TOOL</small><h2>Quote from verified wholesale cost</h2>
    <label>Verified origin monthly cost (USD)<input type='number' min='0' step='0.01' value={originCost} onChange={e=>setOriginCost(e.target.value)}/></label>
    <label>Mandatory taxes/fees (USD)<input type='number' min='0' step='0.01' value={mandatoryFees} onChange={e=>setMandatoryFees(e.target.value)}/></label>
    <label>Origin variable data cost / GB<input type='number' min='0' step='0.0001' value={originVariableCost} onChange={e=>setOriginVariableCost(e.target.value)}/></label>
    <label>Funded variable-cost cap (USD)<input type='number' min='0' step='0.01' value={fundedVariableCap} onChange={e=>setFundedVariableCap(e.target.value)}/></label>
    <label>Origin cost evidence/reference<input value={originReference} onChange={e=>{setOriginReference(e.target.value);setOriginVerified(false)}} placeholder='https://… or contract:/rate-card:/provider-quote:/invoice: reference'/></label>
    <label><input type='checkbox' checked={originVerified} onChange={e=>setOriginVerified(e.target.checked)}/> I confirmed this origin cost against the referenced provider evidence.</label>
    <button disabled={busy||!originReference.trim()||!originVerified}>CALCULATE — NO PURCHASE</button>
    <p className={styles.muted}>This tool only prices a verified origin cost. It does not activate a SIM, purchase capacity, or mark global service live.</p>
   </form>
   {globalQuote&&<div className={styles.grid}>
    <article className={styles.card}><small>MONTHLY RETAIL</small><h2>{globalQuote.origin?.currency||'USD'} {Number(globalQuote.pricing?.retail_monthly_total||0).toFixed(2)}</h2><p>Base after 20% uplift: {Number(globalQuote.pricing?.retail_monthly_before_mandatory_fees||0).toFixed(2)}</p><p className={styles.muted}>Mandatory taxes/fees: {Number(globalQuote.pricing?.mandatory_taxes_and_fees||0).toFixed(2)} · Quote only</p></article>
    <article className={styles.card}><small>VARIABLE DATA</small><h2>{Number(globalQuote.pricing?.retail_variable_price_per_gb||0).toFixed(4)} / GB</h2><p>Funded cost cap: {Number(globalQuote.pricing?.funded_variable_cost_cap||0).toFixed(2)}</p><p className={styles.muted}>No variable usage is allowed without a funded cap when the origin has metered data cost.</p></article>
   </div>}
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
