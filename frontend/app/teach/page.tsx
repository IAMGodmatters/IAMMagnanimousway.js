'use client';

import {useEffect,useState} from 'react';
import PublicTeachingPanel from '../magnanimous/public-teaching-panel';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type TeachingStatus='checking'|'online'|'degraded';

export default function TeachMagnanimousPage(){
 const[status,setStatus]=useState<TeachingStatus>('checking');
 const[checkedAt,setCheckedAt]=useState('');
 const[copied,setCopied]=useState(false);

 useEffect(()=>{
  let live=true;
  async function check(){
   try{
    const r=await fetch(`${api}/api/agents`,{cache:'no-store'});
    const text=await r.text();let data:any={};try{data=JSON.parse(text)}catch{}
    const ready=r.ok&&Array.isArray(data?.agents)&&data.agents.length>0;
    if(live){setStatus(ready?'online':'degraded');setCheckedAt(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}
   }catch{if(live){setStatus('degraded');setCheckedAt(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}}
  }
  check();const timer=window.setInterval(check,60000);
  return()=>{live=false;window.clearInterval(timer)};
 },[]);

 async function copyLink(){
  const link=window.location.href;
  try{await navigator.clipboard.writeText(link);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{window.prompt('Copy this contributor link:',link)}
 }

 const online=status==='online',checking=status==='checking';
 const statusLabel=checking?'CHECKING TRAINING SYSTEM':online?'ACCEPTING KNOWLEDGE':'TEMPORARILY UNAVAILABLE';
 const statusText=checking?'Verifying the public training intake now.':online?'Public teaching is open. Contributions enter automatic QA review before anything can become reusable specialist knowledge.':'The public teaching intake could not be verified on the latest check. Please try again shortly.';

 return <main className="page">
  <header><a href="/magnanimous">← Magnanimous AI™</a><span>I AM MAGNANIMOUS WAY™</span><button type="button" onClick={copyLink}>{copied?'LINK COPIED ✓':'COPY INVITE LINK'}</button></header>
  <section className="hero">
   <small>PUBLIC KNOWLEDGE CONTRIBUTOR PORTAL</small>
   <h1>Help Teach Magnanimous AI™</h1>
   <p>Share useful knowledge, better methods, examples, corrections, or difficult QA challenges. No account is required. A proposal title, skill tags, and public source URL are optional. Contributions are reviewed by Magnanimous automatic QA before they can be learned, and uncertain material remains held for owner oversight.</p>
   <div className={`status ${status}`} role="status" aria-live="polite"><span className="dot"/><div><b>{statusLabel}</b><p>{statusText}</p>{checkedAt&&<small>Last checked {checkedAt}</small>}</div></div>
  </section>
  <section className="how"><article><b>1</b><h2>Choose a specialist</h2><p>Pick the Magnanimous branch that should receive the knowledge.</p></article><article><b>2</b><h2>Teach or challenge it</h2><p>Add the correction, method, example, or QA challenge you want reviewed. Title, tags, and a source link are optional.</p></article><article><b>3</b><h2>Automatic QA first</h2><p>Only high-confidence, safe, reusable material can be applied automatically. Anything uncertain is held for owner review.</p></article></section>
  <PublicTeachingPanel/>
  <section className="rules"><h2>Contributor rules</h2><p>Do not submit passwords, API keys, payment or account details, private records, or personal identifiers. Supporting sources are optional, though they can help Magnanimous verify claims that change over time such as prices, policies, laws, schedules, or platform rules.</p></section>
  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#04080d;color:#edfaff;padding:22px 26px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 80% 0,rgba(58,221,207,.12),transparent 34%),linear-gradient(rgba(83,218,232,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(83,218,232,.025) 1px,transparent 1px);background-size:auto,42px 42px,42px 42px}header,.hero,.how,.rules{max-width:1180px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:9px;letter-spacing:.12em;color:#6d8d99}header a{color:#71e7dd;text-decoration:none}header button{border:1px solid #275d60;border-radius:999px;background:#08191d;color:#a8fff5;padding:8px 11px;font-size:8px;font-weight:900;cursor:pointer}.hero{margin-top:26px;border:1px solid #1d5051;border-radius:24px;padding:34px;background:linear-gradient(135deg,#07191b,#061017)}.hero>small{font-size:9px;letter-spacing:.18em;color:#60ded4}.hero h1{font-size:clamp(40px,7vw,72px);line-height:1;margin:8px 0 14px}.hero>p{max-width:880px;color:#89a5ae;line-height:1.65}.status{margin-top:22px;display:flex;align-items:flex-start;gap:12px;border:1px solid #35525b;border-radius:14px;padding:14px 16px;background:#081217}.status .dot{width:12px;height:12px;border-radius:999px;margin-top:2px;background:#71828a;box-shadow:0 0 0 4px rgba(113,130,138,.08)}.status.online{border-color:#28664c;background:#081a13}.status.online .dot{background:#55e696;box-shadow:0 0 0 4px rgba(85,230,150,.10),0 0 18px rgba(85,230,150,.45)}.status.degraded{border-color:#6c4549;background:#1a0d10}.status.degraded .dot{background:#ff8795;box-shadow:0 0 0 4px rgba(255,135,149,.10)}.status b{font-size:10px;letter-spacing:.12em}.status p{margin:4px 0;color:#9ab3bb;font-size:10px;line-height:1.5}.status small{color:#5d7c85;font-size:8px}.how{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.how article{border:1px solid #173d42;border-radius:15px;background:#071116;padding:16px}.how article>b{display:inline-grid;place-items:center;width:26px;height:26px;border:1px solid #2b6866;border-radius:999px;color:#7de8dd}.how h2{font-size:15px;margin:10px 0 6px}.how p{margin:0;color:#78949c;font-size:10px;line-height:1.5}.rules{border:1px solid #16383d;border-radius:16px;background:#061015;padding:18px 20px}.rules h2{font-size:16px;margin:0 0 7px}.rules p{margin:0;color:#78949c;font-size:10px;line-height:1.6}@media(max-width:760px){.page{padding:16px 12px 50px}header{flex-wrap:wrap}.hero{padding:24px}.how{grid-template-columns:1fr}}
  `}</style>
 </main>
}