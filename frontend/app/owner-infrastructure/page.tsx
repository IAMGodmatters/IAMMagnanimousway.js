'use client';

import {useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Family={id:string;name:string;owned_contract:string;current_target:string;future_targets?:string[];status:string;external_network_required?:boolean};
type Summary={identity:string;infrastructure_owner:string;architecture:string;active_runtime:string;cutover_phase:string;production_cutover_complete:boolean;external_host_dependency_active:boolean;data_cutover_required:boolean;dns_cutover_required:boolean;digitalocean_required_for_cloud_control_plane?:boolean;magnanimous_cloud_control_plane_complete?:boolean;families:Family[];rules:string[]};
type Absorption={benchmark:string;magnanimous:string;status:string};
type CloudSummary={identity:string;architecture:string;native_control_plane_active:boolean;physical_capacity_required_for_compute?:boolean;resources?:number;projects?:number;absorption?:{absorption_map:Absorption[]};absorption_map?:Absorption[];external_capacity_boundary?:string[];status?:string};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||('Request failed ('+r.status+')')}}}
const card={border:'1px solid #214756',borderRadius:14,padding:16,background:'#081117'} as const;
export default function OwnerInfrastructure(){
 const[data,setData]=useState<Summary|null>(null),[cloud,setCloud]=useState<CloudSummary|null>(null),[error,setError]=useState('');
 useEffect(()=>{const token=localStorage.getItem('odin_admin_token')||'';if(!token){location.replace('/owner-login?returnTo=%2Fowner-infrastructure');return}
  const headers={Authorization:'Bearer '+token};
  Promise.all([
   fetch(api+'/api/magnanimous/infrastructure',{headers,cache:'no-store'}),
   fetch(api+'/api/magnanimous/cloud',{headers,cache:'no-store'})
  ]).then(async([infraRes,cloudRes])=>{
   const infra=await read(infraRes),cloudData=await read(cloudRes);
   if(infraRes.status===401||infraRes.status===403||cloudRes.status===401||cloudRes.status===403){localStorage.removeItem('odin_admin_token');location.replace('/owner-login?returnTo=%2Fowner-infrastructure');return}
   if(!infraRes.ok)throw new Error(infra.detail||'Infrastructure status could not load.');
   setData(infra); if(cloudRes.ok)setCloud(cloudData);
  }).catch(e=>setError(e?.message||'Infrastructure status could not load.'))
 },[]);
 const absorption=cloud?.absorption?.absorption_map||cloud?.absorption_map||[];
 return <main style={{minHeight:'100vh',background:'#05080b',color:'#eaf7ff',padding:'24px 32px 60px',fontFamily:'Inter,system-ui,sans-serif'}}>
  <header style={{maxWidth:1400,margin:'auto',display:'flex',justifyContent:'space-between',fontSize:10,letterSpacing:'.16em',color:'#6d91a2'}}><a href="/owner-center" style={{color:'#7ae7ff'}}>← Owner Center</a><span>PRIVATE INFRASTRUCTURE CONTROL</span></header>
  <section style={{...card,maxWidth:1400,margin:'28px auto 0',display:'flex',justifyContent:'space-between',gap:24,alignItems:'center',flexWrap:'wrap'}}><div><small style={{color:'#5dddf9'}}>I AM MAGNANIMOUS WAY™</small><h1 style={{fontSize:48,margin:'8px 0'}}>Magnanimous Infrastructure</h1><p style={{maxWidth:800,color:'#8fa6b2'}}>Magnanimous AI owns the control plane. Hosting, databases, model compute, DNS, storage and network capacity are replaceable execution rails beneath it.</p></div><div style={{display:'grid',gap:8,minWidth:230}}><b>{data?.production_cutover_complete?'STANDALONE ACTIVE':'PARALLEL MIGRATION'}</b><span>{data?.active_runtime||'Loading runtime…'}</span><span>{data?.cutover_phase||'Loading phase…'}</span></div></section>
  {error&&<div style={{...card,maxWidth:1400,margin:'12px auto',borderColor:'#69353b',color:'#ffb7c0'}}>{error}</div>}
  {data&&<><section style={{maxWidth:1400,margin:'12px auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
   <article style={card}><small>OWNER</small><strong style={{display:'block',marginTop:7}}>{data.infrastructure_owner}</strong></article>
   <article style={card}><small>ARCHITECTURE</small><strong style={{display:'block',marginTop:7}}>{data.architecture}</strong></article>
   <article style={card}><small>MAGNANIMOUS CLOUD</small><strong style={{display:'block',marginTop:7,color:data.magnanimous_cloud_control_plane_complete?'#8ef0b0':'#e7bd72'}}>{data.magnanimous_cloud_control_plane_complete?'CONTROL PLANE OWNED':'LOADING'}</strong></article>
   <article style={card}><small>DIGITALOCEAN REQUIRED</small><strong style={{display:'block',marginTop:7,color:data.digitalocean_required_for_cloud_control_plane===false?'#8ef0b0':'#e7bd72'}}>{data.digitalocean_required_for_cloud_control_plane===false?'NO — OPTIONAL CAPACITY':'UNKNOWN'}</strong></article>
   <article style={card}><small>DATA CUTOVER</small><strong style={{display:'block',marginTop:7}}>{data.data_cutover_required?'REQUIRED':'COMPLETE'}</strong></article>
   <article style={card}><small>DNS CUTOVER</small><strong style={{display:'block',marginTop:7}}>{data.dns_cutover_required?'REQUIRED':'COMPLETE'}</strong></article>
  </section>
  {cloud&&<section style={{...card,maxWidth:1400,margin:'0 auto 10px'}}><small style={{color:'#5dddf9'}}>MAGNANIMOUS CLOUD</small><h2 style={{marginBottom:8}}>Provider-neutral cloud control plane</h2><p style={{color:'#8fa6b2',maxWidth:1000}}>Projects, resource inventory, compute desired state, apps/workers/jobs/functions, databases, storage, images/backups, private networks, firewalls, load balancing, DNS, SSH keys, monitoring and usage are normalized under Magnanimous. Real CPU/RAM/disk/public IP capacity still has to exist on owner hardware or an attached host.</p><div style={{display:'flex',gap:20,flexWrap:'wrap'}}><span><b>Native binding:</b> {cloud.native_control_plane_active?'ACTIVE':'CODE READY / CURRENT RAIL LEGACY'}</span><span><b>Projects:</b> {cloud.projects??'—'}</span><span><b>Resources:</b> {cloud.resources??'—'}</span></div></section>}
  {absorption.length>0&&<section style={{maxWidth:1400,margin:'0 auto 10px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:10}}>{absorption.map(row=><article key={row.benchmark} style={card}><small style={{color:'#5dddf9'}}>ABSORBED CAPABILITY PATTERN</small><h3>{row.benchmark}</h3><p style={{color:'#8fa6b2'}}>{row.magnanimous}</p><code style={{color:'#8ef0b0'}}>{row.status}</code></article>)}</section>}
  <section style={{maxWidth:1400,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:10}}>{data.families.map(f=><article style={card} key={f.id}><small style={{color:'#5dddf9'}}>{f.id.toUpperCase()}</small><h2>{f.name}</h2><p style={{color:'#8fa6b2'}}>{f.owned_contract}</p><p><b>NOW:</b> <code>{f.current_target}</code></p>{f.future_targets?.length?<p><b>NEXT:</b> <code>{f.future_targets.join(' · ')}</code></p>:null}<p style={{color:'#8ef0b0'}}>{f.status}</p>{f.external_network_required?<em style={{color:'#e7bd72'}}>Real public-network or physical capacity may still be required.</em>:null}</article>)}</section>
  <section style={{...card,maxWidth:1400,margin:'10px auto'}}><h2>Magnanimous Infrastructure Rules</h2>{data.rules.map(rule=><p key={rule} style={{color:'#92a9b4'}}>• {rule}</p>)}</section></>}
 </main>;
}
