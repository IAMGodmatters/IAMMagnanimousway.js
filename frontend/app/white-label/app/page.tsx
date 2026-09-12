'use client';
import {useEffect,useState} from 'react';
import {getPlatformAuthToken} from '../../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const TOOLS:Record<string,{name:string;src:string}>={
 funnel:{name:'Funnel Builder',src:'/white-label/funnel'},
 'branded-ai':{name:'Branded AI',src:'/agency-command'},
 'client-apps':{name:'Client Apps',src:'/bpo-operations'},
 booking:{name:'Booking',src:'/agency-command'},
 reputation:{name:'Reputation',src:'/agency-command'},
 automations:{name:'Automations',src:'/agency-automations'},
 inbox:{name:'Unified Inbox',src:'/inbox'},
 crm:{name:'CRM',src:'/crm'},
 receptionist:{name:'AI Receptionist',src:'/ai-receptionist'},
 'video-agents':{name:'Video Agents',src:'/video-agents'},
 'work-engine':{name:'Work Engine',src:'/work-engine'},
 rebilling:{name:'Usage Rebilling',src:'/agency-command'}
};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}

export default function WhiteLabelAppShell(){
 const[ready,setReady]=useState(false),[tool,setTool]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  const key=new URLSearchParams(location.search).get('tool')||'';const item=TOOLS[key];if(!item){location.replace('/white-label');return}setTool(key);
  const token=getPlatformAuthToken();if(!token){location.replace(`/login?returnTo=${encodeURIComponent(`/white-label/app?tool=${key}`)}`);return}
  fetch(`${api}/api/billing/status`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}).then(async r=>{const d=await read(r);if(!r.ok)throw new Error(d.detail||'Could not verify White Label access.');if(d.plan!=='agency'&&d.plan!=='agency_pro'){location.replace('/white-label#plans');return}setReady(true)}).catch((e:any)=>setError(e?.message||'Could not open this White Label app.'));
 },[]);
 const item=TOOLS[tool];
 return <main className="shell">
  <header><a href="/white-label">← WHITE LABEL HOME</a><div><small>POWERED BY THE MAGNANIMOUS AI BRAIN</small><strong>{item?.name||'White Label App'}</strong></div><span>✦ Brain connected</span></header>
  {error?<section className="state"><h1>Could not open this app.</h1><p>{error}</p><a href="/white-label">Back to White Label</a></section>:!ready?<section className="state"><div className="pulse">✦</div><h1>Opening {item?.name||'your app'}…</h1><p>Magnanimous is connecting your White Label workspace.</p></section>:<iframe title={item?.name||'White Label App'} src={item?.src||'/white-label'} className="appframe"/>}
  <style jsx>{`
   .shell{height:100vh;display:grid;grid-template-rows:58px 1fr;background:#061019;color:#eaf8ff;font-family:Inter,system-ui,sans-serif;overflow:hidden}header{display:flex;align-items:center;gap:18px;padding:0 18px;border-bottom:1px solid #173647;background:#081721;z-index:3}header>a{color:#79daf8;text-decoration:none;font-size:10px;font-weight:900;white-space:nowrap}header>div{display:grid;gap:1px;min-width:0}header small{color:#537c90;font-size:8px;letter-spacing:.13em;font-weight:900}header strong{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}header>span{margin-left:auto;color:#75e0ff;border:1px solid #245269;border-radius:999px;padding:5px 8px;font-size:9px;white-space:nowrap}.appframe{width:100%;height:100%;border:0;background:#071019}.state{display:grid;place-items:center;align-content:center;text-align:center;padding:24px}.state h1{margin:8px 0;font-size:28px}.state p{color:#7e9aa8}.state a{color:#76dcfb}.pulse{font-size:36px;color:#71e1ff;animation:pulse 1.2s infinite}@keyframes pulse{50%{opacity:.35;transform:scale(.9)}}@media(max-width:600px){header{padding:0 10px;gap:9px}header>span{display:none}header small{display:none}header>a{font-size:9px}}
  `}</style>
 </main>
}
