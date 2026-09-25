'use client';

import { FormEvent, useEffect, useState } from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Profile={
 assistant_mode:string;ring_mode:string;spam_action:string;assistant_voice:string;assistant_tone:string;
 summary_enabled:boolean;transcript_enabled:boolean;recording_enabled:boolean;recording_jurisdiction:string;
 forwarding_mode:string;forwarding_target_ref:string;network_selection_mode:string;
};
type Capability={key:string;label:string;state:string;action:string;truth:string};
const defaults:Profile={assistant_mode:'missed_only',ring_mode:'always',spam_action:'screen',assistant_voice:'neutral',assistant_tone:'helpful',summary_enabled:true,transcript_enabled:true,recording_enabled:false,recording_jurisdiction:'',forwarding_mode:'off',forwarding_target_ref:'',network_selection_mode:'automatic'};

async function read(response:Response){const body=await response.text();try{return JSON.parse(body)}catch{return{detail:body||('Request failed ('+response.status+')')}}}

export default function GlobalMobilePage(){
 const[token,setToken]=useState('');
 const[profile,setProfile]=useState<Profile>(defaults);
 const[caps,setCaps]=useState<Capability[]>([]);
 const[lines,setLines]=useState<any[]>([]);
 const[devices,setDevices]=useState<any[]>([]);
 const[blocked,setBlocked]=useState<any[]>([]);
 const[memberLabel,setMemberLabel]=useState('');
 const[lineRole,setLineRole]=useState('additional');
 const[deviceModel,setDeviceModel]=useState('');
 const[platform,setPlatform]=useState('ios');
 const[esimCapable,setEsimCapable]=useState(true);
 const[unlocked,setUnlocked]=useState(false);
 const[backup,setBackup]=useState(false);
 const[blockPhone,setBlockPhone]=useState('');
 const[busy,setBusy]=useState('');
 const[error,setError]=useState('');
 const[message,setMessage]=useState('');

 useEffect(()=>{
  const saved=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(!saved){location.replace('/login?returnTo='+encodeURIComponent(location.pathname||'/telecom/global-mobile'));return}
  setToken(saved);load(saved);
 },[]);

 async function get(path:string,activeToken=token){
  const response=await fetch(api+path,{headers:{Authorization:'Bearer '+activeToken}});
  const data=await read(response);
  if(response.status===401){location.replace('/login?returnTo='+encodeURIComponent(location.pathname||'/telecom/global-mobile'));throw new Error('Sign in required.')}
  if(!response.ok)throw new Error(data.detail||('Request failed ('+response.status+')'));
  return data;
 }

 async function load(activeToken=token){
  setError('');
  try{
   const pair=await Promise.all([
    get('/api/telecom/global-mobile/capabilities',activeToken),
    get('/api/telecom/global-mobile/profile',activeToken)
   ]);
   const capData=pair[0],profileData=pair[1];
   setCaps(capData.capabilities||[]);setProfile({...defaults,...(profileData.profile||{})});
   const optional=await Promise.allSettled([
    get('/api/telecom/global-mobile/lines',activeToken),
    get('/api/telecom/global-mobile/devices',activeToken),
    get('/api/telecom/global-mobile/blocklist',activeToken)
   ]);
   if(optional[0].status==='fulfilled')setLines(optional[0].value.lines||[]);
   if(optional[1].status==='fulfilled')setDevices(optional[1].value.devices||[]);
   if(optional[2].status==='fulfilled')setBlocked(optional[2].value.numbers||[]);
  }catch(e:any){setError(e?.message||'Unable to load Global Mobile.')}
 }

 async function send(path:string,method:string,body?:any){
  const response=await fetch(api+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await read(response);
  if(!response.ok)throw new Error(data.detail||('Request failed ('+response.status+')'));
  return data;
 }

 async function saveProfile(event:FormEvent){
  event.preventDefault();setBusy('profile');setError('');setMessage('');
  try{
   const payload:any={...profile};
   if(profile.recording_enabled)payload.confirm_recording_compliance=true;
   await send('/api/telecom/global-mobile/profile','PUT',payload);
   setMessage('Global Mobile preferences saved. No carrier-side activation was performed.');
  }catch(e:any){setError(e?.message||'Unable to save profile.')}finally{setBusy('')}
 }

 async function addLine(event:FormEvent){
  event.preventDefault();if(!memberLabel.trim())return;setBusy('line');setError('');
  try{
   await send('/api/telecom/global-mobile/lines','POST',{member_label:memberLabel,line_role:lineRole});
   setMemberLabel('');setMessage('Line plan added. Public-network activation remains separately gated.');await load();
  }catch(e:any){setError(e?.message||'Unable to add line.')}finally{setBusy('')}
 }

 async function addDevice(event:FormEvent){
  event.preventDefault();if(!deviceModel.trim())return;setBusy('device');setError('');
  try{
   await send('/api/telecom/global-mobile/devices','POST',{device_model:deviceModel,platform,esim_capable:esimCapable,unlocked_confirmed:unlocked,backup_enabled:backup,preferred_access:'auto'});
   setDeviceModel('');setMessage('Device readiness record added. No eSIM credential was generated or stored.');await load();
  }catch(e:any){setError(e?.message||'Unable to add device.')}finally{setBusy('')}
 }

 async function addBlock(event:FormEvent){
  event.preventDefault();if(!blockPhone.trim())return;setBusy('block');setError('');
  try{
   await send('/api/telecom/global-mobile/blocklist','POST',{phone_e164:blockPhone,reason:'spam'});
   setBlockPhone('');setMessage('Number added to your Magnanimous screening policy.');await load();
  }catch(e:any){setError(e?.message||'Unable to block number.')}finally{setBusy('')}
 }

 async function removeBlock(rowId:string){
  setBusy('block-'+rowId);setError('');
  try{await send('/api/telecom/global-mobile/blocklist/'+encodeURIComponent(rowId),'DELETE');await load();}
  catch(e:any){setError(e?.message||'Unable to unblock number.')}finally{setBusy('')}
 }

 const shell:React.CSSProperties={maxWidth:1180,margin:'0 auto',padding:'30px 18px 70px',fontFamily:'Arial, sans-serif'};
 const card:React.CSSProperties={border:'1px solid #d7d7d7',borderRadius:18,padding:18,background:'#fff'};
 const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14};
 const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:'10px 12px',border:'1px solid #bbb',borderRadius:10,marginTop:6,marginBottom:10};
 const button:React.CSSProperties={padding:'10px 14px',border:'1px solid #222',borderRadius:10,fontWeight:700,cursor:'pointer',background:'#111',color:'#fff'};

 return <main style={shell}>
  <nav style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:22}}><a href='/telecom'>← Telecom</a><a href='/telecom/sim'>SIM + eSIM</a><a href='/softphone'>Backup Dialer</a><a href='/ai-receptionist'>AI Receptionist</a><a href='/contact-center'>Contact Center</a><a href='/telecom/network'>Carrier Access</a></nav>
  <header style={{marginBottom:22}}><small>I AM MAGNANIMOUS WAY™ · MAGNANIMOUS TELECOM</small><h1 style={{fontSize:44,margin:'6px 0'}}>Global Mobile</h1><p style={{maxWidth:820,lineHeight:1.6}}>One Magnanimous control surface for travel-ready SIM/eSIM, multi-line/device organization, backup calling, call-screening preferences, spam policy and AI call handling. Outside carriers stay replaceable and private. Software settings never masquerade as public-network activation.</p></header>
  {error&&<div style={{...card,borderColor:'#9b1c1c',marginBottom:14}}>{error}</div>}
  {message&&<div style={{...card,marginBottom:14}}>{message}</div>}

  <section style={{marginBottom:24}}><h2>Capability truth</h2><div style={grid}>{caps.map(cap=><article key={cap.key} style={card}><small>{cap.state.toUpperCase()}</small><h3>{cap.label}</h3><p style={{lineHeight:1.5}}>{cap.truth}</p><a href={cap.action}>Open tool →</a></article>)}</div></section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(330px,1fr))',gap:16,marginBottom:24}}>
   <form onSubmit={saveProfile} style={card}>
    <h2>Call handling</h2>
    <label>AI assistant mode<select style={input} value={profile.assistant_mode} onChange={e=>setProfile({...profile,assistant_mode:e.target.value})}><option value='off'>Off</option><option value='missed_only'>Missed calls only</option><option value='unknown_only'>Unknown callers only</option><option value='all_calls'>All calls</option></select></label>
    <label>Ring mode<select style={input} value={profile.ring_mode} onChange={e=>setProfile({...profile,ring_mode:e.target.value})}><option value='always'>Always ring</option><option value='contacts_only'>Contacts only</option><option value='never'>Never ring</option></select></label>
    <label>Spam action<select style={input} value={profile.spam_action} onChange={e=>setProfile({...profile,spam_action:e.target.value})}><option value='screen'>Screen</option><option value='block'>Block</option><option value='voicemail'>Voicemail</option><option value='ring'>Ring normally</option></select></label>
    <label>Forwarding<select style={input} value={profile.forwarding_mode} onChange={e=>setProfile({...profile,forwarding_mode:e.target.value})}><option value='off'>Off</option><option value='magnanimous_app'>Magnanimous app</option><option value='ai_assistant'>Magnanimous AI assistant</option><option value='verified_external'>Verified external target</option></select></label>
    <label>Forwarding target reference<input style={input} value={profile.forwarding_target_ref} onChange={e=>setProfile({...profile,forwarding_target_ref:e.target.value})} placeholder='Optional verified route/reference'/></label>
    <label><input type='checkbox' checked={profile.summary_enabled} onChange={e=>setProfile({...profile,summary_enabled:e.target.checked})}/> Call summaries</label><br/>
    <label><input type='checkbox' checked={profile.transcript_enabled} onChange={e=>setProfile({...profile,transcript_enabled:e.target.checked})}/> Transcripts when available</label><br/>
    <label><input type='checkbox' checked={profile.recording_enabled} onChange={e=>setProfile({...profile,recording_enabled:e.target.checked})}/> Consent-gated recording</label>
    {profile.recording_enabled&&<label>Recording jurisdiction<input style={input} value={profile.recording_jurisdiction} onChange={e=>setProfile({...profile,recording_jurisdiction:e.target.value})} placeholder='Example: US-CA or PH'/></label>}
    <p style={{fontSize:13,lineHeight:1.5}}>Saving this profile changes Magnanimous policy only. It does not secretly reprogram a carrier or start recording.</p>
    <button style={button} disabled={busy==='profile'}>{busy==='profile'?'Saving…':'Save preferences'}</button>
   </form>

   <div style={{display:'grid',gap:16}}>
    <form onSubmit={addLine} style={card}><h2>Managed lines</h2><label>Person / line label<input style={input} value={memberLabel} onChange={e=>setMemberLabel(e.target.value)} placeholder='Jessie, Family, Tablet…'/></label><label>Role<select style={input} value={lineRole} onChange={e=>setLineRole(e.target.value)}><option value='primary'>Primary</option><option value='additional'>Additional</option><option value='tablet'>Tablet</option><option value='backup'>Backup</option></select></label><button style={button} disabled={busy==='line'}>Add line plan</button><div style={{marginTop:12}}>{lines.map(line=><p key={line.id}><b>{line.member_label}</b> · {line.line_role} · {line.status}</p>)}</div></form>
    <form onSubmit={addDevice} style={card}><h2>Device readiness</h2><label>Device model<input style={input} value={deviceModel} onChange={e=>setDeviceModel(e.target.value)} placeholder='iPhone 16, Pixel 10…'/></label><label>Platform<select style={input} value={platform} onChange={e=>setPlatform(e.target.value)}><option value='ios'>iOS</option><option value='android'>Android</option><option value='other'>Other</option></select></label><label><input type='checkbox' checked={esimCapable} onChange={e=>setEsimCapable(e.target.checked)}/> eSIM capable</label><br/><label><input type='checkbox' checked={unlocked} onChange={e=>setUnlocked(e.target.checked)}/> Carrier unlocked confirmed</label><br/><label><input type='checkbox' checked={backup} onChange={e=>setBackup(e.target.checked)}/> Backup device/eSIM role</label><br/><button style={{...button,marginTop:10}} disabled={busy==='device'}>Add device</button><div style={{marginTop:12}}>{devices.map(device=><p key={device.id}><b>{device.device_model}</b> · {device.platform} · {device.status}</p>)}</div></form>
   </div>
  </section>

  <section style={{...card,marginBottom:24}}><h2>Manual spam block list</h2><form onSubmit={addBlock} style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'end'}}><label style={{flex:'1 1 280px'}}>E.164 number<input style={{...input,marginBottom:0}} value={blockPhone} onChange={e=>setBlockPhone(e.target.value)} placeholder='+15551234567'/></label><button style={button} disabled={busy==='block'}>Block</button></form><div style={{marginTop:14}}>{blocked.map(row=><div key={row.id} style={{display:'flex',gap:10,justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee'}}><span>{row.phone_e164} · {row.reason}</span><button onClick={()=>removeBlock(row.id)} disabled={busy==='block-'+row.id}>Remove</button></div>)}</div></section>

  <section style={card}><h2>Travel/mobile operating rules</h2><ul style={{lineHeight:1.8}}><li>Use the authorized mobile adapter for real country coverage and roaming truth.</li><li>Keep Data Roaming, device unlock and eSIM compatibility as explicit readiness checks.</li><li>Use the Magnanimous softphone as the backup calling path when a roaming voice path fails.</li><li>Use Magnanimous AI for optional call handling; do not pretend it is human.</li><li>Do not store reusable eSIM activation secrets or raw SIM authentication keys.</li><li>Do not advertise direct carrier, emergency-service or numbering authority unless externally verified.</li></ul></section>
 </main>
}
