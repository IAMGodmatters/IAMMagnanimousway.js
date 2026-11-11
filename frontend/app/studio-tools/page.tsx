'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import TalkingRecorder from './talking-recorder';

type Item={id:string;title:string;status:string;due_at:number|null;data:Record<string,unknown>;updated_at:number};
type Kind='task'|'note'|'planner'|'habit'|'voice';
const API=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const KINDS:Kind[]=['task','note','planner','habit','voice'];
const LABEL:Record<Kind,string>={task:'Tasks',note:'Notes',planner:'Planner',habit:'Habits',voice:'Talking Recorder'};
async function read(r:Response){const raw=await r.text();try{return JSON.parse(raw)}catch{return{detail:raw}}}
function dateLabel(value:number|null){return value?new Date(value*1000).toLocaleString():''}

export default function StudioToolsPage(){
 const router=useRouter();
 const[token,setToken]=useState('');
 const[workspaceId,setWorkspaceId]=useState('');
 const[boardId,setBoardId]=useState('');
 const[items,setItems]=useState<Item[]>([]);
 const[kind,setKind]=useState<Kind>('task');
 const[title,setTitle]=useState('');
 const[body,setBody]=useState('');
 const[due,setDue]=useState('');
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[search,setSearch]=useState('');

 const request=useCallback(async(path:string,init:RequestInit={})=>{
  const response=await fetch(API+path,{...init,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(init.headers||{})},cache:'no-store'});
  const data=await read(response);
  if(response.status===401){router.push('/login?returnTo=%2Fstudio-tools');throw new Error('Please sign in to open your private workspace.')}
  if(!response.ok)throw new Error(data.detail||'The request could not be completed.');
  return data;
 },[token,router]);

 const load=useCallback(async()=>{
  if(!token)return;
  setLoading(true);setError('');
  try{
   let workspaces=await request('/api/operations/workspaces');
   let workspace=workspaces.items?.find((x:any)=>x.kind==='personal-tools');
   if(!workspace){const created=await request('/api/operations/workspaces',{method:'POST',body:JSON.stringify({name:'My Studio Tools',kind:'personal-tools',description:'Private tasks, notes, planning and habit workspace.'})});workspace=created.item}
   if(!workspace?.id)throw new Error('Your private workspace could not be opened.');
   setWorkspaceId(workspace.id);
   const boards=await request('/api/operations/boards?workspace_id='+encodeURIComponent(workspace.id));
   let board=boards.items?.find((x:any)=>x.kind==='personal-tools');
   if(!board){const created=await request('/api/operations/boards',{method:'POST',body:JSON.stringify({workspace_id:workspace.id,name:'My Tools',singular_name:'item',kind:'personal-tools',description:'Private records for tasks, notes, planning and habits.'})});board=created.item}
   if(!board?.id)throw new Error('Your private tools list could not be opened.');
   setBoardId(board.id);
   const records=await request('/api/operations/records?board_id='+encodeURIComponent(board.id)+'&limit=500');
   setItems((records.items||[]).filter((x:any)=>KINDS.includes(x.data?.kind)).map((x:any)=>({...x,data:x.data||{}})));
  }catch(e:any){setError(e.message||'Could not load your workspace.')}
  finally{setLoading(false)}
 },[token,request]);

 useEffect(()=>{const t=getPlatformAuthToken();setToken(t);if(!t){router.replace('/login?returnTo=%2Fstudio-tools');return}},[router]);
 useEffect(()=>{if(token)load()},[token,load]);

 const visible=useMemo(()=>items.filter(x=>x.data.kind===kind&&String(x.title+' '+(x.data.body||'')).toLowerCase().includes(search.toLowerCase())&&x.status!=='archived'),[items,kind,search]);
 const add=async()=>{
  if(!title.trim()||!boardId)return;
  setSaving(true);setError('');setNotice('');
  try{
   const data={kind,body:body.slice(0,12000)};
   const result=await request('/api/operations/records',{method:'POST',body:JSON.stringify({board_id:boardId,title:title.trim().slice(0,240),status:'open',due_at:due?Math.floor(new Date(due).getTime()/1000):null,data})});
   setItems(old=>[result.item,...old]);setTitle('');setBody('');setDue('');setNotice('Saved to your private workspace.');
  }catch(e:any){setError(e.message||'Could not save this item.')}
  finally{setSaving(false)}
 };
 const update=async(item:Item,patch:Partial<Item>)=>{
  try{const result=await request('/api/operations/records/'+encodeURIComponent(item.id),{method:'PUT',body:JSON.stringify(patch)});setItems(old=>old.map(x=>x.id===item.id?result.item:x))}
  catch(e:any){setError(e.message||'Could not update this item.')}
 };
 const count=(k:Kind)=>items.filter(x=>x.data.kind===k&&x.status!=='archived').length;
 const saveVoice=async(voiceTitle:string,transcript:string,duration:number,mimeType:string)=>{
  if(!boardId)throw new Error('Your private workspace is still loading.');
  const result=await request('/api/operations/records',{method:'POST',body:JSON.stringify({board_id:boardId,title:voiceTitle.slice(0,240),status:'open',due_at:null,data:{kind:'voice',body:transcript.slice(0,12000),duration_seconds:duration,mime_type:mimeType,recorded_at:new Date().toISOString(),audio_storage:'downloaded_on_device'}})});
  setItems(old=>[result.item,...old]);setNotice('Recording transcript and details saved to your private workspace.');
 };

 return <main className="st-page">
  <div className="st-wrap">
   <header className="st-head"><div><p className="st-kicker">I AM MAGNANIMOUS WAY™</p><h1>Studio Tools</h1><p className="st-sub">Your own private space to organize everyday work.</p></div><a className="st-home" href="/">Back to platform</a></header>
   <section className="st-intro"><div><h2>One simple place to keep things moving.</h2><p>Save tasks, notes, plans and habits. Sign in from another device and continue in your own account workspace.</p></div><span className="st-lock">PRIVATE WORKSPACE</span></section>
   <nav className="st-tabs" aria-label="Studio tools">{KINDS.map(k=><button key={k} className={kind===k?'active':''} onClick={()=>setKind(k)}>{LABEL[k]} <small>{count(k)}</small></button>)}</nav>
   {kind==='voice'?<TalkingRecorder onSave={saveVoice}/>:<section className="st-panel">
    <div className="st-toolbar"><h2>{LABEL[kind]}</h2><input aria-label="Search items" value={search} onChange={e=>setSearch(e.target.value)} placeholder={'Search '+LABEL[kind].toLowerCase()}/></div>
    <div className="st-create"><input aria-label="Title" value={title} onChange={e=>setTitle(e.target.value)} placeholder={kind==='task'?'What needs to get done?':kind==='note'?'Note title':kind==='planner'?'Plan or event title':'Habit name'} maxLength={240}/>{kind!=='note'&&<input aria-label="Due date" type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/>}<textarea aria-label="Details" value={body} onChange={e=>setBody(e.target.value)} placeholder="Add details (optional)" rows={2}/><button disabled={saving||!title.trim()} onClick={add}>{saving?'Saving…':'Save '+(kind==='task'?'task':kind==='note'?'note':kind==='planner'?'plan':'habit')}</button></div>
    {error&&<p className="st-error" role="alert">{error}</p>}{notice&&<p className="st-notice" role="status">{notice}</p>}
    {loading?<p className="st-empty">Loading your private workspace…</p>:visible.length===0?<p className="st-empty">Nothing here yet. Add your first {kind} above.</p>:<ul className="st-list">{visible.map(item=><li key={item.id}><div className="st-item-main"><strong>{item.title}</strong>{item.data.body!=null&&String(item.data.body).length>0?<p>{String(item.data.body)}</p>:null}{item.due_at&&<small>{dateLabel(item.due_at)}</small>}</div><div className="st-actions">{kind!=='note'&&<button onClick={()=>update(item,{status:item.status==='done'?'open':'done'})}>{item.status==='done'?'Reopen':'Complete'}</button>}<button className="quiet" onClick={()=>update(item,{status:'archived'})}>Archive</button></div></li>)}</ul>}
   </section>}
   {notice&&kind==='voice'&&<p className="st-notice" role="status">{notice}</p>}
   <footer className="st-foot">Your records are stored under your signed-in Magnanimous workspace. Other customer workspaces are separated by the platform’s tenant controls.</footer>
  </div>
  <style jsx>{`
   .st-page{min-height:100vh;background:radial-gradient(ellipse at 80% 0%,#163d66 0,transparent 38%),linear-gradient(145deg,#020a1b,#07172e 55%,#030916);color:#edf7ff;padding:clamp(18px,4vw,48px) 16px 56px;font-family:Inter,system-ui,sans-serif}.st-wrap{max-width:1000px;margin:auto}.st-head{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:28px}.st-kicker{font-size:11px;letter-spacing:.17em;color:#f4ce80;font-weight:900}.st-head h1{font-size:clamp(34px,6vw,54px);margin:5px 0;color:#ffe0a0}.st-sub,.st-intro p{color:#b9d2e7;line-height:1.6}.st-home{color:#9de8ff;text-decoration:none;border:1px solid #39708b;border-radius:12px;padding:11px 14px}.st-intro,.st-panel{border:1px solid #28506b;border-radius:20px;background:#071a31eF;box-shadow:0 18px 60px #0005}.st-intro{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:24px;margin-bottom:18px}.st-intro h2{margin:0;color:#fff;font-size:23px}.st-lock{font-size:10px;letter-spacing:.12em;color:#a5e8ff;border:1px solid #39708b;padding:9px 12px;border-radius:99px;white-space:nowrap}.st-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.st-tabs button,.st-actions button{border:1px solid #315975;background:#0c2946;color:#d9efff;border-radius:11px;padding:11px 15px;cursor:pointer}.st-tabs button.active{background:#f1ce82;color:#14253a;border-color:#f1ce82;font-weight:900}.st-tabs small{margin-left:5px;opacity:.7}.st-panel{padding:22px}.st-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.st-toolbar h2{margin:0}.st-toolbar input,.st-create input,.st-create textarea{box-sizing:border-box;width:100%;border:1px solid #315975;border-radius:10px;background:#041326;color:#fff;padding:12px;font:inherit}.st-toolbar input{max-width:260px}.st-create{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px;background:#0a2340;border-radius:14px}.st-create textarea{grid-column:1/-1;resize:vertical}.st-create button{grid-column:1/-1;border:0;border-radius:10px;padding:13px;background:linear-gradient(90deg,#f4d18a,#b7eaff);color:#07182b;font-weight:900;cursor:pointer}.st-create button:disabled{opacity:.5;cursor:not-allowed}.st-list{list-style:none;padding:0;margin:18px 0 0}.st-list li{display:flex;justify-content:space-between;gap:16px;align-items:center;border-top:1px solid #23445e;padding:16px 2px}.st-item-main{min-width:0}.st-item-main strong{overflow-wrap:anywhere}.st-item-main p{color:#b9d2e7;white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0}.st-item-main small{color:#9fc7dc}.st-actions{display:flex;gap:8px;flex-wrap:wrap}.st-actions button{font-size:12px;padding:8px 11px}.st-actions button.quiet{background:transparent}.st-empty{color:#a8c3d9;padding:22px 4px}.st-error{color:#ffc0c0}.st-notice{color:#a6f0c4}.st-foot{color:#89a9c3;font-size:12px;line-height:1.6;padding:18px 4px}@media(max-width:640px){.st-head,.st-intro,.st-toolbar{align-items:flex-start;flex-direction:column}.st-home{align-self:flex-start}.st-create{grid-template-columns:1fr}.st-create textarea,.st-create button{grid-column:1}.st-toolbar input{max-width:none}.st-list li{align-items:flex-start;flex-direction:column}.st-actions{width:100%}.st-actions button{flex:1}.st-panel{padding:15px}.st-lock{white-space:normal}}
  `}</style>
 </main>
}
