'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Row=Record<string,any>;
type ActiveDial={campaignId:string;memberId:string;phone:string;name:string;callId:number|string;providerCallId?:string;startedAt:number};

async function parse(r:Response){const text=await r.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}}
const terminal=new Set(['completed','busy','failed','no-answer','canceled','cancelled']);
function dispositionFor(status:string){const s=String(status||'').toLowerCase();if(s==='busy')return'busy';if(s==='no-answer')return'no-answer';if(s==='failed'||s==='canceled'||s==='cancelled')return'follow-up';return'connected'}
function when(ts:number){return ts?new Date(ts*1000).toLocaleTimeString():'—'}

export default function AutoDialer(){
 const[token,setToken]=useState('');
 const[campaigns,setCampaigns]=useState<Row[]>([]);
 const[selected,setSelected]=useState('');
 const[running,setRunning]=useState(false);
 const[confirmed,setConfirmed]=useState(false);
 const[parallel,setParallel]=useState(1);
 const[intervalSeconds,setIntervalSeconds]=useState(12);
 const[active,setActive]=useState<ActiveDial[]>([]);
 const[log,setLog]=useState<string[]>([]);
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
 const activeRef=useRef<ActiveDial[]>([]);
 const runningRef=useRef(false);

 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{runningRef.current=running},[running]);
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){location.replace('/login');return}
  setToken(t);loadCampaigns(t);
  return()=>{if(timerRef.current)clearInterval(timerRef.current)};
 },[]);
 useEffect(()=>{
  if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
  if(!running||!token)return;
  const tick=()=>cycle(token).catch(e=>{setError(e?.message||'Auto dial cycle failed.');stop()});
  tick();
  timerRef.current=setInterval(tick,Math.max(8,intervalSeconds)*1000);
  return()=>{if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}};
 },[running,token,intervalSeconds,selected,parallel]);

 async function authed(path:string,options:RequestInit={},t=token){
  const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  return fetch(`${api}${path}`,{...options,headers});
 }
 async function get(path:string,t=token){const r=await authed(path,{},t),d=await parse(r);if(!r.ok)throw new Error(d.detail||`Request failed (${r.status})`);return d}
 async function send(path:string,body:any,t=token){const r=await authed(path,{method:'POST',body:JSON.stringify(body)},t),d=await parse(r);if(!r.ok){const e:any=new Error(d.detail||`Request failed (${r.status})`);e.code=d.code;e.status=r.status;throw e}return d}
 function note(text:string){setLog(x=>[`${new Date().toLocaleTimeString()} — ${text}`,...x].slice(0,80))}

 async function loadCampaigns(t=token){
  try{const d=await get('/api/contact-center/campaigns',t);const rows=d.campaigns||[];setCampaigns(rows);if(!selected){const first=rows.find((x:Row)=>x.status==='active')||rows[0];if(first)setSelected(first.id)}}catch(e:any){setError(e.message)}
 }
 async function reconcile(t:string){
  if(!activeRef.current.length)return;
  const data=await get('/api/phone/calls',t);const calls:Array<Row>=data.calls||[];const remaining:ActiveDial[]=[];
  for(const dial of activeRef.current){
   const call=calls.find(c=>String(c.id)===String(dial.callId)||(dial.providerCallId&&String(c.provider_call_id)===String(dial.providerCallId)));
   const status=String(call?.status||'').toLowerCase();
   if(call&&terminal.has(status)){
    const code=dispositionFor(status);
    try{await send(`/api/contact-center/campaigns/${dial.campaignId}/result`,{member_id:dial.memberId,disposition:code},t);note(`${dial.name||dial.phone}: ${status} → ${code}.`)}catch(e:any){note(`${dial.name||dial.phone}: call ended but result update failed (${e.message}).`);remaining.push(dial)}
   }else remaining.push(dial);
  }
  activeRef.current=remaining;setActive(remaining);
 }
 async function dialOne(t:string){
  if(!selected)return false;
  let next:Row;
  try{next=await send(`/api/contact-center/campaigns/${selected}/next`,{},t)}catch(e:any){
   if(['NO_ELIGIBLE_CONTACT','DAILY_CAP','HOURLY_CAP','QUIET_HOURS','CAMPAIGN_NOT_ACTIVE'].includes(String(e.code||''))){note(e.message);stop();return false}
   throw e;
  }
  const member=next.member||{};
  await send(`/api/contact-center/campaigns/${selected}/dial-start`,{member_id:member.id},t);
  try{
   const call=await send(next.dial_endpoint||'/api/phone/calls/outbound',next.required_payload||{to:member.phone,consent_confirmed:true,ai_disclosure_accepted:true},t);
   const item:ActiveDial={campaignId:selected,memberId:member.id,phone:member.phone,name:member.display_name||member.phone,callId:call.call_id||call.id,providerCallId:call.provider_call_id,startedAt:Math.floor(Date.now()/1000)};
   const updated=[...activeRef.current,item];activeRef.current=updated;setActive(updated);note(`Dialing ${item.name} at ${item.phone} through ${call.provider||'configured carrier'}.`);return true;
  }catch(e){await send(`/api/contact-center/campaigns/${selected}/dial-cancel`,{member_id:member.id},t).catch(()=>{});throw e}
 }
 async function cycle(t:string){
  if(!runningRef.current||busy)return;
  setBusy(true);setError('');
  try{
   await reconcile(t);
   if(!runningRef.current)return;
   const overview=await get('/api/contact-center/overview',t);
   const serverActive=Math.max(0,Number(overview.active_calls||0));
   const localActive=activeRef.current.length;
   const occupied=Math.max(serverActive,localActive);
   const slots=Math.max(0,Math.min(3,parallel)-occupied);
   if(slots===0){note(`Waiting: ${occupied} active call${occupied===1?'':'s'}; limit is ${parallel}.`);return}
   for(let i=0;i<slots&&runningRef.current;i++){const ok=await dialOne(t);if(!ok)break}
  }finally{setBusy(false)}
 }
 function start(){
  setError('');
  const c=campaigns.find(x=>x.id===selected);
  if(!c){setError('Choose a campaign first.');return}
  if(c.status!=='active'){setError('Activate the campaign in Contact Center before starting Auto Dial.');return}
  if(!confirmed){setError('Confirm the consent and compliance statement before starting.');return}
  runningRef.current=true;setRunning(true);note(`Auto Dial started for ${c.name}. It is optional and does not replace the manual dialer or softphone.`)
 }
 function stop(){runningRef.current=false;setRunning(false);if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}note('Auto Dial stopped. Existing calls may finish normally.')}

 const current=useMemo(()=>campaigns.find(x=>x.id===selected),[campaigns,selected]);
 return <main style={{maxWidth:1120,margin:'0 auto',padding:'28px 18px 60px',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <header style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
   <div><a href="/contact-center">← Contact Center</a><p style={{letterSpacing:1,fontSize:12,marginTop:18}}>I AM MAGNANIMOUS WAY™ · OPTIONAL CALLING MODULE</p><h1 style={{fontSize:42,margin:'6px 0 8px'}}>Auto Dialer</h1><p style={{maxWidth:760,lineHeight:1.55}}>Automatically works through an active campaign while keeping the existing manual campaign dialer, AI receptionist, free browser phone and Twilio carrier softphone available as separate options.</p></div>
   <div style={{padding:'10px 14px',border:'1px solid #bbb',borderRadius:999,fontWeight:700}}>{running?'● AUTO DIAL ACTIVE':'○ STOPPED'}</div>
  </header>

  {error&&<div style={{margin:'18px 0',padding:14,border:'1px solid #b44',borderRadius:10}}>{error}</div>}
  <section style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:18,marginTop:22}}>
   <article style={{border:'1px solid #ccc',borderRadius:16,padding:18}}>
    <h2>Campaign</h2>
    <label style={{display:'grid',gap:7}}>Active campaign<select value={selected} onChange={e=>setSelected(e.target.value)} disabled={running} style={{padding:11}}><option value="">Choose campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name} — {c.mode} — {c.status}</option>)}</select></label>
    <p><b>Status:</b> {current?.status||'—'}<br/><b>Contacts:</b> {current?.member_count||0}<br/><b>Completed:</b> {current?.completed_count||0}<br/><b>Timezone:</b> {current?.timezone||'—'}</p>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
     <label>Maximum simultaneous calls<select value={parallel} onChange={e=>setParallel(Math.min(3,Math.max(1,Number(e.target.value))))} disabled={running} style={{display:'block',width:'100%',padding:10,marginTop:6}}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
     <label>Dial cycle<select value={intervalSeconds} onChange={e=>setIntervalSeconds(Number(e.target.value))} disabled={running} style={{display:'block',width:'100%',padding:10,marginTop:6}}><option value={8}>8 seconds</option><option value={12}>12 seconds</option><option value={20}>20 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></label>
    </div>
    <label style={{display:'flex',gap:10,alignItems:'flex-start',marginTop:18,lineHeight:1.45}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={running}/><span>I confirm this campaign contains contacts who may lawfully be called and have the required consent. The existing DNC list, campaign calling hours, retry rules and hourly/daily caps remain enforced.</span></label>
    <div style={{display:'flex',gap:10,marginTop:18}}><button onClick={start} disabled={running||busy} style={{padding:'12px 18px',fontWeight:800}}>START AUTO DIAL</button><button onClick={stop} disabled={!running} style={{padding:'12px 18px'}}>STOP</button><button onClick={()=>loadCampaigns()} disabled={running} style={{padding:'12px 18px'}}>Refresh</button></div>
   </article>

   <article style={{border:'1px solid #ccc',borderRadius:16,padding:18}}>
    <h2>Calls in this Auto Dial session</h2>
    {!active.length&&<p>No active Auto Dial calls.</p>}
    {active.map(x=><div key={`${x.memberId}-${x.callId}`} style={{padding:'10px 0',borderBottom:'1px solid #ddd'}}><b>{x.name}</b><br/><span>{x.phone}</span><br/><small>Call {x.callId} · started {when(x.startedAt)}</small></div>)}
    <p style={{fontSize:13,lineHeight:1.5,marginTop:18}}>The dialer waits when the simultaneous-call limit is reached. When a tracked call reaches a terminal carrier status, it records a basic campaign outcome automatically. You can continue using the normal Contact Center campaign tools separately.</p>
   </article>
  </section>

  <section style={{marginTop:18,border:'1px solid #ccc',borderRadius:16,padding:18}}><h2>Activity</h2>{!log.length&&<p>Start Auto Dial to see activity here.</p>}<div style={{display:'grid',gap:8}}>{log.map((line,i)=><div key={`${i}-${line}`} style={{fontFamily:'monospace',fontSize:13,padding:'8px 0',borderBottom:'1px solid #eee'}}>{line}</div>)}</div></section>
  <section style={{marginTop:18,display:'flex',gap:12,flexWrap:'wrap'}}><a href="/contact-center">Manual Campaign Dialer</a><a href="/softphone">Carrier Softphone</a><a href="/phone">Free Browser Phone</a><a href="/ai-receptionist">AI Receptionist</a></section>
 </main>
}
