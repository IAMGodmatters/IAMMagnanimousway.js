'use client';

import { useEffect, useState } from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Overview={identity:string;owner_identity:string;affiliation_identity:string;brain_identity:string;phase:string;programs:number;requirements:number;verified_regulatory_gates:number;configured_ground_adapters:number;launch_options:number;owned_spacecraft:number;flight_command_enabled:boolean;purchase_actions_enabled:boolean;note:string};
const fallback:Overview={identity:'Magnanimous AI Space Program',owner_identity:'God Matters',affiliation_identity:'I AM MAGNANIMOUS WAY™',brain_identity:'Magnanimous AI',phase:'software-and-mission-readiness',programs:0,requirements:0,verified_regulatory_gates:0,configured_ground_adapters:0,launch_options:0,owned_spacecraft:0,flight_command_enabled:false,purchase_actions_enabled:false,note:'Software readiness does not mean a satellite, launch, spectrum authorization, earth-station license, remote-sensing license, or flight-command authority has been obtained.'};

export default function SpacePage(){
 const[overview,setOverview]=useState(fallback);const[error,setError]=useState('');
 useEffect(()=>{const token=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';if(!token){location.replace(`/login?returnTo=${encodeURIComponent('/space')}`);return}fetch(`${api}/api/space/overview`,{headers:{Authorization:`Bearer ${token}`}}).then(async r=>{const text=await r.text();let data:any={};try{data=JSON.parse(text)}catch{}if(r.status===401){location.replace(`/login?returnTo=${encodeURIComponent('/space')}`);return}if(!r.ok)throw new Error(data.detail||'Unable to load space program.');setOverview({...fallback,...data})}).catch(e=>setError(e?.message||'Unable to load space program.'))},[]);
 const cards=[['PROGRAMS',overview.programs],['MISSION REQUIREMENTS',overview.requirements],['VERIFIED GATES',overview.verified_regulatory_gates],['GROUND ADAPTERS',overview.configured_ground_adapters],['LAUNCH OPTIONS',overview.launch_options],['OWNED SPACECRAFT',overview.owned_spacecraft]];
 return <main style={{minHeight:'100vh',background:'#030713',color:'#eef7ff',padding:'28px',fontFamily:'system-ui, sans-serif'}}>
  <div style={{maxWidth:1180,margin:'0 auto'}}>
   <nav style={{fontSize:13,letterSpacing:1,opacity:.82,marginBottom:38}}><a href='/' style={{color:'inherit'}}>I AM MAGNANIMOUS WAY™</a> · <a href='/telecom' style={{color:'inherit'}}>TELECOM</a> · SPACE</nav>
   <p style={{letterSpacing:2,fontSize:12,opacity:.65}}>OWNED BY GOD MATTERS · AFFILIATED WITH I AM MAGNANIMOUS WAY™</p>
   <h1 style={{fontSize:'clamp(42px,7vw,82px)',lineHeight:1,margin:'12px 0'}}>Magnanimous AI <span style={{fontWeight:300}}>Space</span></h1>
   <p style={{maxWidth:850,fontSize:19,lineHeight:1.6,opacity:.8}}>Mission engineering, satellite acquisition readiness, regulatory gates, ground-station adapters, telemetry architecture, launch planning, and future on-orbit Magnanimous AI operations—under one Magnanimous command layer.</p>
   {error&&<div style={{margin:'22px 0',padding:14,border:'1px solid #7b2936',borderRadius:12}}>{error}</div>}
   <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'34px 0'}}>{cards.map(([label,value])=><article key={String(label)} style={{padding:18,border:'1px solid #23314b',borderRadius:16,background:'#07101f'}}><small style={{opacity:.6}}>{label}</small><div style={{fontSize:34,fontWeight:700,marginTop:8}}>{value}</div></article>)}</section>
   <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
    <article style={{padding:22,border:'1px solid #23314b',borderRadius:18,background:'#07101f'}}><small>IDENTITY</small><h2>{overview.identity}</h2><p>Owner: <strong>{overview.owner_identity}</strong></p><p>Affiliation: <strong>{overview.affiliation_identity}</strong></p><p>Brain: <strong>{overview.brain_identity}</strong></p><p>Phase: {overview.phase}</p></article>
    <article style={{padding:22,border:'1px solid #23314b',borderRadius:18,background:'#07101f'}}><small>CONSEQUENTIAL ACTION LOCKS</small><h2>Safe by design</h2><p>Flight command: <strong>{overview.flight_command_enabled?'ENABLED':'LOCKED'}</strong></p><p>Purchases: <strong>{overview.purchase_actions_enabled?'ENABLED':'LOCKED'}</strong></p><p style={{opacity:.72,lineHeight:1.5}}>{overview.note}</p></article>
   </section>
   <section style={{marginTop:28,padding:22,border:'1px solid #23314b',borderRadius:18}}><small>FIRST MISSION PATH</small><h2>Hosted payload → owned smallsat → constellation-ready architecture</h2><p style={{lineHeight:1.65,opacity:.8}}>Start with one narrow Magnanimous AI mission, define compute/power/RF/data needs, select hosted payload or CubeSat architecture, complete spectrum and licensing work, integrate a ground-station provider, simulate everything first, then activate flight operations only after the real spacecraft and authorizations exist.</p></section>
  </div>
 </main>
}
