'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {getPlatformAuthToken} from '../../../lib/magnanimous-session';
import styles from './programming.module.css';
const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Station={id:string;name:string;slug:string};
type Programme={id:string;title:string;creator:string;status:string;license_id:string;duration_seconds:number;media_url:string;source_url:string;attribution:string;review_notes:string};
const licenses=[['CC0-1.0','CC0 1.0'],['CC-BY-2.0','CC BY 2.0'],['CC-BY-3.0','CC BY 3.0'],['CC-BY-4.0','CC BY 4.0'],['PUBLIC-DOMAIN-VERIFIED','Verified public domain']];
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||'Request failed.'}}}
export default function TvProgrammingPage(){
 const[token,setToken]=useState(''),[stations,setStations]=useState<Station[]>([]),[programmes,setProgrammes]=useState<Programme[]>([]),[canManageNetworks,setCanManageNetworks]=useState(false);
 const[stationId,setStationId]=useState(''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[creator,setCreator]=useState(''),[sourceUrl,setSourceUrl]=useState(''),[evidenceUrl,setEvidenceUrl]=useState(''),[licenseId,setLicenseId]=useState('CC-BY-4.0'),[attribution,setAttribution]=useState(''),[duration,setDuration]=useState('300'),[territory,setTerritory]=useState('worldwide');
 const[programmeId,setProgrammeId]=useState(''),[channelKey,setChannelKey]=useState(''),[startsAt,setStartsAt]=useState(''),[reviewId,setReviewId]=useState(''),[reviewMedia,setReviewMedia]=useState(''),[reviewNotes,setReviewNotes]=useState('');
 const[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const load=useCallback(async(t:string)=>{const r=await fetch(api+'/api/tv/programmes',{headers:{Authorization:'Bearer '+t},cache:'no-store'}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Could not load TV programming.');setStations(d.stations||[]);setProgrammes(d.programmes||[]);setCanManageNetworks(!!d.can_manage_networks);setStationId(x=>x||d.stations?.[0]?.id||'');setProgrammeId(x=>x||d.programmes?.find((p:Programme)=>p.status==='approved'&&p.media_url)?.id||'');setChannelKey(x=>x||(d.stations?.[0]?.id?'station:'+d.stations[0].id:d.can_manage_networks?'philippines':''));setReviewId(x=>x||(d.programmes||[]).find((p:Programme)=>p.status==='pending')?.id||'')},[]);
 useEffect(()=>{const t=getPlatformAuthToken();if(!t){setNotice('Sign in to manage TV programming.');return}setToken(t);const localStart=new Date(Date.now()+15*60*1000);setStartsAt(new Date(localStart.getTime()-localStart.getTimezoneOffset()*60000).toISOString().slice(0,16));load(t).catch(e=>setError(e.message))},[load]);
 const approved=useMemo(()=>programmes.filter(p=>p.status==='approved'&&p.media_url),[programmes]),pending=useMemo(()=>programmes.filter(p=>p.status==='pending'),[programmes]);
 const channels=useMemo(()=>[...stations.map(s=>({value:'station:'+s.id,label:'My station — '+s.name})),...(canManageNetworks?[{value:'philippines',label:'Magnanimous TV Philippines'},{value:'worldwide',label:'Magnanimous TV Worldwide'}]:[])],[stations,canManageNetworks]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy('submit');setError('');setNotice('');try{const r=await fetch(api+'/api/tv/programmes',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({station_id:stationId,title,description,creator,source_url:sourceUrl,evidence_url:evidenceUrl,license_id:licenseId,attribution,duration_seconds:Number(duration),territories:[territory],uses:['linear','on_demand']})}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Submission failed.');setNotice(d.message||'Submitted for rights review.');setTitle('');setDescription('');setCreator('');setSourceUrl('');setEvidenceUrl('');setAttribution('');await load(token)}catch(e:any){setError(e?.message||'Submission failed.')}finally{setBusy('')}}
 async function schedule(e:React.FormEvent){e.preventDefault();setBusy('schedule');setError('');setNotice('');try{const r=await fetch(api+'/api/tv/programming/schedule',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({programme_id:programmeId,channel_key:channelKey,starts_at:new Date(startsAt).toISOString()})}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Schedule entry could not be saved.');setNotice(d.note||'Schedule saved; no stream is transmitted.')}catch(e:any){setError(e?.message||'Schedule entry could not be saved.')}finally{setBusy('')}}
 async function review(status:'approved'|'rejected'){setBusy('review');setError('');setNotice('');try{const r=await fetch(api+'/api/tv/programmes/'+encodeURIComponent(reviewId)+'/review',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status,media_url:reviewMedia,review_notes:reviewNotes})}),d=await read(r);if(!r.ok)throw new Error(d.detail||'Review could not be saved.');setNotice('Rights review saved: '+status+'.');setReviewMedia('');setReviewNotes('');await load(token)}catch(e:any){setError(e?.message||'Review could not be saved.')}finally{setBusy('')}}
 if(!token)return <main className={styles.page}><header><Link href="/tv/studio">← TV Studio</Link></header><section className={styles.hero}><p className={styles.eyebrow}>MAGNANIMOUS TV PROGRAMMING</p><h1>Programme library and schedule</h1><p>{notice||'Sign in to manage programming.'}</p><Link className={styles.link} href="/login?returnTo=%2Ftv%2Fstudio%2Fprogramming">Sign in to Magnanimous →</Link></section></main>;
 return <main className={styles.page}>
  <header className={styles.topbar}><Link href="/tv/studio">← TV Studio</Link><span>MAGNANIMOUS TV · PROGRAMMING CONTROL</span><Link href="/tv">Network home →</Link></header>
  <section className={styles.hero}><p className={styles.eyebrow}>RIGHTS BEFORE PLAYOUT · MAGNANIMOUS CONTROL PLANE</p><h1>Programme library and schedule.</h1><p>Submit source and rights evidence, review approved programmes, and reserve clear time slots. A schedule entry appears in the guide; it does not transmit video.</p><div className={styles.stats}><span>{stations.length} personal stations</span><span>{approved.length} approved programmes</span><span>{pending.length} awaiting review</span></div></section>
  {(error||notice)&&<div className={error?styles.error:styles.notice} role="status">{error||notice}</div>}
  <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>STEP 1 · RIGHTS SUBMISSION</p><h2>Propose a programme</h2></div><span className={styles.pill}>PENDING REVIEW</span></div>
   {!stations.length?<p className={styles.info}>Create a personal station first. <Link href="/tv/studio">Create your station →</Link></p>:<form className={styles.form} onSubmit={submit}>
    <label>Station<select value={stationId} onChange={e=>setStationId(e.target.value)} required>{stations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>Programme title<input value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={120} required/></label>
    <label>Creator or rights-holder<input value={creator} onChange={e=>setCreator(e.target.value)} maxLength={180} required/></label>
    <label>Original source page<input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://commons.wikimedia.org/wiki/File:…" required/></label>
    <label>Rights evidence link<input type="url" value={evidenceUrl} onChange={e=>setEvidenceUrl(e.target.value)} placeholder="Exact licence page or written permission" required/></label>
    <label>Licence<select value={licenseId} onChange={e=>setLicenseId(e.target.value)}>{licenses.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
    <label>Required attribution<input value={attribution} onChange={e=>setAttribution(e.target.value)} maxLength={500} required/></label>
    <label>Programme description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} maxLength={700}/></label>
    <div className={styles.inline}><label>Duration (seconds)<input type="number" min={30} max={14400} value={duration} onChange={e=>setDuration(e.target.value)} required/></label><label>Rights territory<select value={territory} onChange={e=>setTerritory(e.target.value)}><option value="worldwide">Worldwide</option><option value="philippines">Philippines only</option></select></label></div>
    <p className={styles.info}>Only CC0, CC BY and verified public-domain claims are accepted. Non-commercial and no-derivatives licences are not accepted for this general network. This form does not upload a video. A reviewer must verify the media file and rights before approval.</p>
    <button className={styles.primary} disabled={busy==='submit'}>{busy==='submit'?'Submitting…':'Submit for rights review'}</button>
   </form>}
  </section>
  <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>STEP 2 · APPROVED CATALOGUE</p><h2>Available programmes</h2></div><span className={styles.pill}>{approved.length} APPROVED</span></div>
   {!programmes.length?<p className={styles.info}>The approved starter programme catalogue is loading.</p>:<div className={styles.list}>{programmes.map(p=><article className={styles.item} key={p.id}><div><strong>{p.title}</strong><span>{p.creator} · {p.license_id}</span><small>{p.status.toUpperCase()} · {p.duration_seconds}s</small><p>{p.status==='approved'?p.attribution:p.review_notes||'Awaiting rights review.'}</p></div>{p.status==='approved'?<a href={p.source_url} target="_blank" rel="noreferrer">Source ↗</a>:null}</article>)}</div>}
  </section>
  <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>STEP 3 · SCHEDULE</p><h2>Reserve airtime</h2></div><span className={styles.pill}>NO STREAM TRANSMITTED</span></div>
   {!approved.length?<p className={styles.info}>No approved media file is available yet.</p>:<form className={styles.form} onSubmit={schedule}>
    <label>Approved programme<select value={programmeId} onChange={e=>setProgrammeId(e.target.value)} required>{approved.map(p=><option value={p.id} key={p.id}>{p.title} · {p.duration_seconds}s</option>)}</select></label>
    <label>Channel or station<select value={channelKey} onChange={e=>setChannelKey(e.target.value)} required>{channels.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <label>Start time (your local time)<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} required/></label>
    <p className={styles.info}>Slot length comes from the approved programme duration. Overlapping entries are blocked. Personal stations require worldwide rights because Philippines-only geofencing is not active.</p>
    <button className={styles.primary} disabled={busy==='schedule'||!programmeId||!channelKey}>{busy==='schedule'?'Saving schedule…':'Save programme-guide slot'}</button>
   </form>}
  </section>
  {canManageNetworks&&<section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>PLATFORM OWNER ONLY · STEP 4</p><h2>Review submitted rights</h2></div><span className={styles.pill}>OWNER REVIEW</span></div>
   {!pending.length?<p className={styles.info}>No submissions are awaiting review.</p>:<form className={styles.form} onSubmit={e=>e.preventDefault()}>
    <label>Submission<select value={reviewId} onChange={e=>setReviewId(e.target.value)}>{pending.map(p=><option value={p.id} key={p.id}>{p.title} — {p.creator}</option>)}</select></label>
    <label>Verified playback file URL<input type="url" value={reviewMedia} onChange={e=>setReviewMedia(e.target.value)} placeholder="https://upload.wikimedia.org/…"/></label>
    <label>Review notes<input value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} minLength={8} maxLength={1000} required placeholder="Evidence checked and any limits"/></label>
    <div className={styles.actions}><button type="button" className={styles.primary} disabled={busy==='review'||!reviewMedia} onClick={()=>void review('approved')}>Approve rights and media</button><button type="button" className={styles.secondary} disabled={busy==='review'} onClick={()=>void review('rejected')}>Reject submission</button></div>
    <p className={styles.info}>Only a platform owner can approve a submission. Approval requires an approved media host, verified rights evidence and attribution.</p>
   </form>}
  </section>}
  <section className={styles.panel}><p className={styles.eyebrow}>BROADCAST STATUS</p><h2>Guide now, playout later.</h2><p className={styles.info}>The schedule is stored and shown in the programme guide. The media server, HLS/WebRTC delivery, 24/7 playout, social simulcast and Philippines-only server-side geofencing are not connected. A saved time slot is not a broadcast.</p></section>
  <footer className={styles.footer}><span>Magnanimous TV · I Am Magnanimous Way™</span><Link href="/tv">Network home</Link></footer>
 </main>;
}
