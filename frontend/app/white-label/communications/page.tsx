'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../../lib/magnanimous-session';
import {capabilityGroups,implementationRules,publicSources,type CapabilityGroup} from './catalog';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const launchers=[
 {name:'Unified Inbox',href:'/inbox',icon:'✉',note:'Messages, follow-up and customer conversation work.'},
 {name:'I AM Internet Phone',href:'/phone',icon:'☎',note:'Native browser calling and call history.'},
 {name:'Agent Desk',href:'/agent-desk',icon:'◉',note:'Call-center scripts, queues, agent workflow and supervision gates.'},
 {name:'AI Receptionist',href:'/ai-receptionist',icon:'✦',note:'Magnanimous-controlled voice automation and handoff.'},
 {name:'Business Messaging',href:'/white-label/whatsapp',icon:'☏',note:'Provider-private client messaging inbox and delivery transport.'},
 {name:'Video Agents',href:'/video-agents',icon:'▶',note:'AI-assisted video workflows and live-media foundation.'},
 {name:'CRM',href:'/crm',icon:'◎',note:'Customer context for communication workflows.'},
 {name:'Automations',href:'/agency-automations',icon:'⚡',note:'Trigger follow-up and communication workflows.'}
];

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t}}}
const statusLabel=(g:CapabilityGroup)=>g.status==='native-now'?'NATIVE NOW':g.status==='native-target'?'NATIVE TARGET':g.status==='optional-provider'?'OPTIONAL PROVIDER':'LICENSE GATED';

export default function WhiteLabelCommunications(){
 const[plan,setPlan]=useState('free'),[checked,setChecked]=useState(false),[filter,setFilter]=useState('all');
 useEffect(()=>{
  const token=getPlatformAuthToken();if(!token){setChecked(true);return}
  fetch(`${api}/api/billing/status`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}).then(read).then(d=>{setPlan(String(d.plan||'free'));setChecked(true)}).catch(()=>setChecked(true));
 },[]);
 const active=plan==='agency'||plan==='agency_pro';
 const groups=useMemo(()=>filter==='all'?capabilityGroups:capabilityGroups.filter(x=>x.status===filter),[filter]);
 return <main className="page">
  <header><a href="/white-label">← WHITE LABEL</a><div><small>MAGNANIMOUS COMMUNICATIONS HUB</small><b>Messaging • Voice • Video • AI • Feeds</b></div><span>{active?'AGENCY ACTIVE':'PREVIEW'}</span></header>
  <section className="hero">
   <div className="eyebrow">MIRRORFLY PUBLIC-CAPABILITY RESEARCH • MAGNANIMOUS-CONTROLLED IMPLEMENTATION</div>
   <h1>One branded communications layer.<br/><em>Magnanimous stays the brain.</em></h1>
   <p>This hub absorbs the useful public techniques and capability families around modern chat, calling, meetings, contact centers, activity feeds and conversational AI. Existing Magnanimous-native tools are used first. MirrorFly can remain an optional replaceable adapter only when properly licensed and configured.</p>
   <div className="rules"><strong>Hard boundaries</strong>{implementationRules.slice(0,4).map(x=><span key={x}>✓ {x}</span>)}</div>
   {!checked?<div className="notice">Checking White Label access…</div>:active?<div className="good">✓ White Label active — native communications launchers unlocked.</div>:<div className="notice">Preview mode. An active Agency White Label plan is required to use client White Label apps.</div>}
  </section>

  <section className="launch">
   <div className="sectionTitle"><div><small>USE WHAT IS ALREADY BUILT</small><h2>Native communication tools</h2></div><span>FREE/NATIVE FIRST</span></div>
   <div className="launchGrid">{launchers.map(x=>active?<a key={x.href} href={x.href} className="launchCard"><i>{x.icon}</i><strong>{x.name}</strong><p>{x.note}</p><em>OPEN →</em></a>:<a key={x.href} href="/white-label#plans" className="launchCard locked"><i>{x.icon}</i><strong>{x.name}</strong><p>{x.note}</p><em>UNLOCK WHITE LABEL →</em></a>)}</div>
  </section>

  <section className="capabilities">
   <div className="sectionTitle"><div><small>CAPABILITY MAP</small><h2>Skills, techniques and implementation targets</h2></div></div>
   <div className="filters">
    {[['all','ALL'],['native-now','NATIVE NOW'],['native-target','NATIVE TARGET'],['license-gated','LICENSE GATED']].map(([k,l])=><button key={k} className={filter===k?'on':''} onClick={()=>setFilter(k)}>{l}</button>)}
   </div>
   <div className="capGrid">{groups.map(g=><article key={g.id} className="cap"><div className="capHead"><div><small>{statusLabel(g)}</small><h3>{g.name}</h3></div>{g.nativeHref&&<a href={active?g.nativeHref:'/white-label#plans'}>OPEN</a>}</div><p>{g.summary}</p><div className="columns"><div><b>Skills / tools</b><ul>{g.skills.map(s=><li key={s}>{s}</li>)}</ul></div><div><b>Techniques</b><ul>{g.techniques.map(s=><li key={s}>{s}</li>)}</ul></div></div></article>)}</div>
  </section>

  <section className="adapter">
   <small>OPTIONAL PROVIDER ADAPTER</small><h2>MirrorFly is not the identity layer.</h2>
   <p>MirrorFly SDK/API use requires its own valid license, credentials and provider terms. The public sample repositories do not establish a blanket right to copy proprietary production source. Magnanimous therefore keeps a provider-neutral contract: native capabilities first, optional licensed adapter second, customer-facing provider details hidden.</p>
   <div className="adapterGrid"><span><b>Identity</b>Magnanimous AI</span><span><b>Memory / policy</b>Magnanimous AI</span><span><b>Transport</b>Native WebRTC/SIP or approved adapter</span><span><b>Secrets</b>Server-side only</span><span><b>Paid usage</b>Funded + metered</span><span><b>Customer branding</b>Client / Magnanimous White Label</span></div>
  </section>

  <section className="sources">
   <div className="sectionTitle"><div><small>PUBLIC RESEARCH SOURCES</small><h2>Official documentation and public repositories</h2></div><span>{publicSources.length} SOURCES</span></div>
   <div className="sourceGrid">{publicSources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><small>{s.kind.toUpperCase()}</small><strong>{s.label}</strong><em>OPEN SOURCE →</em></a>)}</div>
   <p className="fine">This catalog records public/observable capabilities and engineering patterns. It does not contain MirrorFly credentials, private code, hidden prompts, proprietary server implementations, or a claim that Magnanimous owns MirrorFly technology.</p>
  </section>
  <footer><a href="/white-label">White Label home</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/billing-support">Billing support</a></footer>
  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#050a0f;color:#eefaff;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 80% 0,rgba(44,163,255,.18),transparent 28%),radial-gradient(circle at 5% 32%,rgba(120,77,255,.12),transparent 30%)}header{height:64px;display:flex;align-items:center;gap:18px;padding:0 22px;border-bottom:1px solid #183143;background:#07111a;position:sticky;top:0;z-index:20}header>a{color:#77dfff;text-decoration:none;font-size:10px;font-weight:900}header>div{display:grid;gap:1px}header small,.sectionTitle small,.adapter>small{font-size:8px;letter-spacing:.15em;color:#65b4d2;font-weight:900}header b{font-size:13px}header>span{margin-left:auto;border:1px solid #24526a;border-radius:999px;padding:6px 9px;color:#7fe4ff;font-size:9px;font-weight:900}.hero,.launch,.capabilities,.adapter,.sources,footer{max-width:1220px;margin:auto}.hero{padding:62px 24px 34px}.eyebrow{font-size:9px;letter-spacing:.12em;color:#7be7ff;font-weight:900}.hero h1{font-size:clamp(42px,7vw,78px);line-height:.98;margin:12px 0 18px;max-width:1000px}.hero h1 em{font-style:normal;color:#9a89ff}.hero>p{max-width:920px;color:#9eb2c0;line-height:1.7}.rules{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:22px;max-width:1000px}.rules strong{grid-column:1/-1;font-size:10px;color:#bfd7e4}.rules span{background:#091722;border:1px solid #17384b;border-radius:12px;padding:11px;color:#9ec3d2;font-size:10px;line-height:1.45}.notice,.good{margin-top:18px;border-radius:11px;padding:11px 13px;font-size:10px;font-weight:800}.notice{border:1px solid #5a4b2b;background:#211a0a;color:#f1d38e}.good{border:1px solid #226e54;background:#09241b;color:#89f0c6}.launch,.capabilities,.adapter,.sources{padding:30px 24px 50px}.sectionTitle{display:flex;justify-content:space-between;align-items:end;gap:16px}.sectionTitle h2{margin:5px 0 0;font-size:30px}.sectionTitle>span{font-size:9px;color:#73dfff;border:1px solid #204b61;border-radius:999px;padding:6px 9px}.launchGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}.launchCard{display:grid;gap:7px;min-height:160px;padding:15px;border:1px solid #1b3b4c;border-radius:16px;background:linear-gradient(145deg,#0a1a24,#0a1018);text-decoration:none;color:inherit}.launchCard:hover{border-color:#67dfff;transform:translateY(-1px)}.launchCard i{font-style:normal;font-size:25px;color:#77e8ff}.launchCard strong{font-size:13px}.launchCard p{margin:0;color:#7895a5;font-size:10px;line-height:1.5}.launchCard em{font-style:normal;color:#78e0ff;font-size:9px;font-weight:900;margin-top:auto}.locked{opacity:.72}.filters{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0}.filters button{border:1px solid #234456;background:#0a1720;color:#7fa2b1;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;cursor:pointer}.filters button.on{border-color:#75e4ff;color:#dffaff;background:#0b2834}.capGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cap{border:1px solid #1b3547;border-radius:18px;background:#09131d;padding:17px}.capHead{display:flex;justify-content:space-between;gap:12px;align-items:start}.capHead small{font-size:8px;color:#76dfff;font-weight:900;letter-spacing:.1em}.capHead h3{margin:4px 0 0;font-size:20px}.capHead a{font-size:8px;font-weight:950;text-decoration:none;color:#071019;background:#7ce5ff;padding:7px 9px;border-radius:8px}.cap>p{color:#86a4b4;font-size:10px;line-height:1.5}.columns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.columns b{font-size:9px;color:#c8e4ee}.columns ul{margin:7px 0 0;padding-left:16px;color:#7898a8;font-size:9px;line-height:1.55}.adapter{border-top:1px solid #173143;border-bottom:1px solid #173143;background:linear-gradient(90deg,rgba(34,24,69,.3),rgba(5,20,28,.5));max-width:none;padding-left:max(24px,calc((100vw - 1172px)/2));padding-right:max(24px,calc((100vw - 1172px)/2))}.adapter h2{font-size:34px;margin:6px 0 10px}.adapter>p{max-width:900px;color:#93a9b7;line-height:1.65}.adapterGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:16px;max-width:1050px}.adapterGrid span{display:grid;gap:3px;border:1px solid #293451;background:#0d1220;border-radius:12px;padding:11px;color:#899cac;font-size:9px}.adapterGrid b{color:#d8dcff;font-size:10px}.sourceGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:16px}.sourceGrid a{display:grid;gap:5px;padding:12px;border:1px solid #1d3848;border-radius:13px;background:#08131b;text-decoration:none;color:inherit}.sourceGrid small{font-size:7px;color:#63cce9;font-weight:900}.sourceGrid strong{font-size:10px}.sourceGrid em{font-style:normal;color:#668797;font-size:8px}.fine{color:#688493;font-size:9px;line-height:1.6;margin-top:16px}footer{display:flex;gap:15px;padding:25px 24px 80px;border-top:1px solid #152a37}footer a{color:#6f93a5;text-decoration:none;font-size:9px}@media(max-width:900px){.launchGrid{grid-template-columns:1fr 1fr}.capGrid{grid-template-columns:1fr}.sourceGrid{grid-template-columns:1fr 1fr}.adapterGrid{grid-template-columns:1fr 1fr}}@media(max-width:580px){header{padding:0 10px}header>span{display:none}.hero{padding-top:38px}.rules,.columns,.adapterGrid,.sourceGrid{grid-template-columns:1fr}.launchGrid{grid-template-columns:1fr}.sectionTitle{align-items:start}.hero h1{font-size:42px}.capabilities,.launch,.adapter,.sources{padding-left:14px;padding-right:14px}}
  `}</style>
 </main>
}
