'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const APPS=[
 ['platform','Whole White Label'],['funnel','Funnel Builder'],['branded-ai','Branded AI'],['client-apps','Client Apps'],['booking','Booking'],['reputation','Reputation'],['automations','Automations'],['inbox','Unified Inbox'],['crm','CRM'],['receptionist','AI Receptionist'],['video-agents','Video Agents'],['work-engine','Work Engine'],['rebilling','Usage Rebilling']
] as const;
type Client={id:string;name:string};
type BrainStatus={access?:boolean;plan?:string;memory_count?:number;signal_count?:number;learning_note?:string};

async function data(r:Response){const text=await r.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}}

export default function WhiteLabelBrainDock(){
 const[embedded,setEmbedded]=useState(true),[open,setOpen]=useState(false),[token,setToken]=useState(''),[status,setStatus]=useState<BrainStatus|null>(null),[clients,setClients]=useState<Client[]>([]),[app,setApp]=useState('platform'),[clientId,setClientId]=useState(''),[goal,setGoal]=useState(''),[answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[feedback,setFeedback]=useState('');
 useEffect(()=>{
  setEmbedded(window.self!==window.top);
  if(window.self!==window.top)return;
  const t=getPlatformAuthToken();setToken(t);if(!t)return;
  Promise.all([
   fetch(`${api}/api/white-label/brain/status`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),
   fetch(`${api}/api/agency/clients`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'})
  ]).then(async([s,c])=>{const sd=await data(s),cd=await data(c);if(s.ok)setStatus(sd);if(c.ok){setClients(cd.clients||[]);setClientId(cd.clients?.[0]?.id||'')}}).catch(()=>{});
 },[]);
 const unlocked=Boolean(status?.access);
 const appName=useMemo(()=>APPS.find(x=>x[0]===app)?.[1]||'White Label', [app]);
 if(embedded)return null;
 async function ask(){
  if(!token){location.href='/login?returnTo=%2Fwhite-label';return}
  if(!unlocked){location.href='/white-label#plans';return}
  if(!goal.trim())return;
  setBusy(true);setError('');setAnswer('');setFeedback('');
  try{
   const r=await fetch(`${api}/api/white-label/brain/assist`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({app,client_id:clientId,goal:goal.trim(),context:`User is working in ${appName}.`})});
   const d=await data(r);if(!r.ok)throw new Error(d.detail||'Magnanimous could not answer.');setAnswer(d.output||'Magnanimous finished, but no text was returned.');
  }catch(e:any){setError(e?.message||'Magnanimous could not answer.')}finally{setBusy(false)}
 }
 async function rate(helpful:boolean){
  if(!token||!answer)return;
  await fetch(`${api}/api/white-label/brain/feedback`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({app,client_id:clientId,helpful})}).catch(()=>null);
  setFeedback(helpful?'Learned: that helped.':'Learned: that needs improvement.');
 }
 return <>
  <button className="brain-launch" onClick={()=>setOpen(v=>!v)} aria-label="Ask Magnanimous AI"><span>✦</span><b>Ask Magnanimous</b><small>{unlocked?'Brain online':'Preview'}</small></button>
  {open&&<aside className="brain-panel" role="dialog" aria-label="Magnanimous White Label Brain">
   <div className="brain-head"><div><small>WHITE LABEL BRAIN</small><h2>Magnanimous AI</h2><p>One brain for every app. It learns what works in this workspace while keeping clients separated.</p></div><button onClick={()=>setOpen(false)} aria-label="Close">×</button></div>
   {!token?<div className="brain-lock"><b>Sign in first.</b><p>Then Magnanimous can remember your White Label workspace.</p><a href="/login?returnTo=%2Fwhite-label">SIGN IN</a></div>:!unlocked?<div className="brain-lock"><b>White Label is locked.</b><p>You can explore the apps before buying. Purchase White Label to use the shared Magnanimous brain inside them.</p><a href="/white-label#plans">SEE WHITE LABEL PLANS</a></div>:<>
    <div className="brain-stats"><span>🧠 {status?.memory_count||0} learned lessons</span><span>↗ {status?.signal_count||0} learning signals</span></div>
    <label>1. Where are you working?<select value={app} onChange={e=>setApp(e.target.value)}>{APPS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    <label>2. Which client?<select value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">My agency / no client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>3. What do you want to do?<textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Example: Help me build a simple funnel for this client." rows={4}/></label>
    <button className="brain-ask" onClick={ask} disabled={busy||!goal.trim()}>{busy?'MAGNANIMOUS IS THINKING…':'ASK MAGNANIMOUS'}</button>
    {error&&<div className="brain-error">{error}</div>}
    {answer&&<div className="brain-answer"><small>MAGNANIMOUS</small><pre>{answer}</pre><div className="brain-rate"><span>Did this help?</span><button onClick={()=>rate(true)}>👍 Yes</button><button onClick={()=>rate(false)}>👎 No</button></div>{feedback&&<em>{feedback}</em>}</div>}
    <p className="brain-note">Magnanimous learns outcome patterns and your approved workspace lessons. It does not use one client’s private content to teach another client.</p>
   </>}
  </aside>}
  <style jsx>{`
   .brain-launch{position:fixed;right:18px;bottom:18px;z-index:2147483000;border:1px solid #2c6b8a;border-radius:16px;background:linear-gradient(135deg,#071520,#0d2635);color:#eafbff;padding:10px 14px;display:grid;grid-template-columns:auto auto;gap:0 8px;align-items:center;box-shadow:0 12px 42px #0009;cursor:pointer;text-align:left}.brain-launch span{grid-row:1/3;font-size:24px;color:#74e5ff}.brain-launch b{font-size:12px}.brain-launch small{font-size:9px;color:#67a0b8}.brain-panel{position:fixed;right:18px;bottom:82px;z-index:2147482999;width:min(420px,calc(100vw - 24px));max-height:min(720px,calc(100vh - 110px));overflow:auto;border:1px solid #24536a;border-radius:20px;background:#07131d;color:#eaf8ff;padding:18px;box-shadow:0 24px 80px #000c;font-family:Inter,system-ui,sans-serif}.brain-head{display:flex;gap:12px;justify-content:space-between}.brain-head small,.brain-answer>small{color:#62c8ed;font-size:9px;letter-spacing:.16em;font-weight:900}.brain-head h2{margin:4px 0 5px;font-size:26px}.brain-head p{margin:0;color:#84a0ae;font-size:12px;line-height:1.45}.brain-head>button{align-self:start;border:0;background:#102836;color:#fff;border-radius:9px;width:34px;height:34px;font-size:22px;cursor:pointer}.brain-lock{margin-top:16px;padding:16px;border:1px solid #20485e;border-radius:14px;background:#0b1d28}.brain-lock p{color:#8aa4b3;font-size:12px}.brain-lock a{display:inline-block;text-decoration:none;background:#68dcff;color:#041017;border-radius:9px;padding:10px 12px;font-size:10px;font-weight:900}.brain-stats{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.brain-stats span{font-size:9px;color:#83dfff;border:1px solid #244f63;border-radius:999px;padding:5px 8px}label{display:block;margin:11px 0;color:#9bb0bc;font-size:10px;font-weight:800}select,textarea{margin-top:5px;width:100%;box-sizing:border-box;border:1px solid #234b60;border-radius:10px;background:#091c27;color:#f4fbff;padding:10px;font:inherit;font-size:12px}textarea{resize:vertical;line-height:1.45}.brain-ask{width:100%;border:0;border-radius:10px;background:#6addff;color:#041117;padding:11px;font-weight:950;cursor:pointer}.brain-ask:disabled{opacity:.45;cursor:not-allowed}.brain-error{margin-top:10px;color:#ffc0c8;background:#2b1118;border:1px solid #64303a;border-radius:9px;padding:9px;font-size:11px}.brain-answer{margin-top:13px;padding:13px;background:#0b1d28;border:1px solid #244e62;border-radius:13px}.brain-answer pre{white-space:pre-wrap;font:inherit;font-size:12px;line-height:1.55;color:#dcecf4}.brain-rate{display:flex;align-items:center;gap:6px;border-top:1px solid #173848;padding-top:9px}.brain-rate span{font-size:10px;color:#86a3b1;margin-right:auto}.brain-rate button{border:1px solid #285368;background:#0a1720;color:#ccebf8;border-radius:8px;padding:6px 8px;cursor:pointer;font-size:10px}.brain-answer em{display:block;color:#6fd8f6;font-size:9px;margin-top:8px}.brain-note{color:#617f8e;font-size:9px;line-height:1.45;margin:12px 2px 0}@media(max-width:540px){.brain-launch{right:12px;bottom:12px}.brain-panel{right:12px;bottom:74px}.brain-launch b{font-size:11px}}
  `}</style>
 </>
}
