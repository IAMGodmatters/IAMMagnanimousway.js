'use client';
import {useState} from 'react';

type Opportunity={
 id:string;name:string;status:'active-ph'|'location-check'|'waitlist';
 badge:string;summary:string;requirements:string[];examples?:string[];official:string;secondary?:string;cta:string;referral?:string;verified:string;
};

const opportunities:Opportunity[]=[
 {
  id:'atlas',name:'Atlas Capture',status:'active-ph',badge:'PHILIPPINES • ACTIVE PATHS',
  summary:'Paid AI-data work with two different paths: first-person video capture through the iPhone app, plus browser-based text labeling and AI-response review.',
  requirements:['Video capture: iPhone 11 or newer plus a head strap','Labeling/review: current browser; no iPhone required for that track','Tasks, rates and location availability vary; review the shown terms before starting'],
  examples:['Video capture tasks show per-task pay','Browser annotation is advertised up to $10 USD/hour','Official site says payouts run biweekly'],
  official:'https://www.atlascapture.io/opportunities',
  secondary:'https://apps.apple.com/ph/app/atlas-capture/id6755671397',
  cta:'Open official opportunities',
  referral:'2PDR9UXD',
  verified:'2026-09-25'
 },
 {
  id:'welo',name:'Welo Global',status:'active-ph',badge:'PHILIPPINES • ACTIVE ROLES',
  summary:'Current official Philippines listings include remote/freelance AI training, language, quality-control, rating and video-annotation work.',
  requirements:['Requirements differ by role','Apply only through the official Welo/Lever listing','Do not assume every role is open indefinitely; the official list is the live source'],
  examples:['AI Data Quality Specialist — English (Philippines)','AI Trainers Network — Cebuano / English / Tagalog','Robot Manipulation Video Annotator','Filipino Quality Control Specialist'],
  official:'https://jobs.lever.co/weloglobal/?location=Philippines',
  cta:'Open current Philippines roles',
  verified:'2026-09-25'
 },
 {
  id:'outlier',name:'Outlier',status:'location-check',badge:'LOCATION-DEPENDENT',
  summary:'Flexible AI-training and evaluation projects are listed globally, but specific roles can be blocked by country and the live opportunity list changes frequently.',
  requirements:['Check the exact role location before applying','Do not treat a role shown for another country as available in the Philippines','Skills and onboarding requirements vary by project'],
  official:'https://app.outlier.ai/opportunities?hl=en-US',
  cta:'Check live opportunities',
  verified:'2026-09-25'
 },
 {
  id:'prolific',name:'Prolific',status:'waitlist',badge:'NOT CURRENTLY PH-SUPPORTED',
  summary:'Paid studies and AI-task work are legitimate opportunities, but Prolific’s current participant-country list does not include the Philippines. Eligibility is based on where you currently live, not citizenship.',
  requirements:['Philippines residence is not currently on the supported participant-country list','A waitlist may be available, but access is not guaranteed','If residency changes, re-check the official current-country list before applying'],
  official:'https://www.prolific.com/participants-join-us',
  cta:'View official participant information',
  verified:'2026-09-25'
 }
];

const statusLabel=(s:Opportunity['status'])=>s==='active-ph'?'Verified PH path':s==='location-check'?'Check live location':'Waitlist / unavailable in PH';

export default function OpportunityVault(){
 const[filter,setFilter]=useState<'all'|'active-ph'|'location-check'|'waitlist'>('all'),[msg,setMsg]=useState('');
 const visible=opportunities.filter(x=>filter==='all'||x.status===filter);
 async function copy(code:string){try{await navigator.clipboard.writeText(code);setMsg('Referral code copied. The current bonus or referral terms are controlled by Atlas, so verify them inside the app before relying on them.')}catch{setMsg('Referral code: '+code)}}
 return <main className="page">
  <header><a href="/">← Home</a><span>MAGNANIMOUS OPPORTUNITY VAULT</span><a href="/creator-growth">Creator Growth →</a></header>
  <section className="hero">
   <small>I AM MAGNANIMOUS WAY™ • VERIFIED SOURCES FIRST</small>
   <h1>Real opportunities, current requirements, no fake promises.</h1>
   <p>The Vault keeps outside opportunities separate from Magnanimous itself. Each card links to the official source, shows the last verification date, and states when Philippines eligibility is uncertain or unavailable.</p>
  </section>
  <section className="rules">
   <b>Safety rule</b><span>Never pay an application fee. Equipment, identity verification or platform-specific onboarding can have separate requirements; verify them on the official source before spending money.</span>
   <b>Truth rule</b><span>Displayed pay is not guaranteed income. Availability, task volume, approval and payouts are controlled by the outside platform.</span>
  </section>
  <nav>{[['all','All'],['active-ph','Verified PH'],['location-check','Check location'],['waitlist','Waitlist / unavailable']] .map(([id,label])=><button key={id} className={filter===id?'on':''} onClick={()=>setFilter(id as any)}>{label}</button>)}</nav>
  {msg&&<div className="msg">{msg}</div>}
  <section className="grid">
   {visible.map(o=><article key={o.id} className={o.status}>
    <div className="top"><div><small>{o.badge}</small><h2>{o.name}</h2></div><em>{statusLabel(o.status)}</em></div>
    <p>{o.summary}</p>
    <h3>Current facts</h3><ul>{o.requirements.map(x=><li key={x}>{x}</li>)}</ul>
    {o.examples?.length?<><h3>Examples seen in the current official listing</h3><ul>{o.examples.map(x=><li key={x}>{x}</li>)}</ul></>:null}
    {o.referral&&<div className="ref"><span>Optional referral code supplied by I AM Magnanimous Way™</span><b>{o.referral}</b><button onClick={()=>copy(o.referral!)}>Copy code</button><small>No bonus amount is promised here; current referral terms must be checked in the app.</small></div>}
    <div className="actions"><a href={o.official} target="_blank" rel="noreferrer">{o.cta}</a>{o.secondary&&<a href={o.secondary} target="_blank" rel="noreferrer">Open iPhone app listing</a>}</div>
    <footer>Last source verification: {o.verified}</footer>
   </article>)}
  </section>
  <section className="watch">
   <small>WATCHLIST</small><h2>Unverified names stay out of the active list.</h2><p>Older notes mentioned ClarU.ai/Claru.ai, but I did not find a current authoritative source tied clearly enough to that opportunity during this verification pass, so it is not presented as an active earning option.</p>
  </section>
  <style jsx>{`
   *{box-sizing:border-box}.page{min-height:100vh;background:#060b10;color:#f2f8ff;padding:22px 28px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 85% 0,rgba(75,201,255,.12),transparent 30%),radial-gradient(circle at 12% 38%,rgba(83,255,174,.08),transparent 27%)}header,.hero,.rules,nav,.grid,.watch,.msg{max-width:1450px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:12px;color:#7d95a8;font-size:9px;letter-spacing:.14em}header a{color:#83dcff;text-decoration:none}.hero{padding:48px 0 28px}.hero small,.watch small{font-size:9px;letter-spacing:.18em;color:#72e5ba;font-weight:900}.hero h1{font-size:clamp(42px,6vw,76px);line-height:.95;margin:9px 0;max-width:1100px}.hero p,.watch p{max-width:980px;color:#8299aa;line-height:1.65}.rules{display:grid;grid-template-columns:130px 1fr;gap:7px 16px;border:1px solid #203844;border-radius:14px;padding:16px;background:#09131a}.rules b{color:#9cebd0;font-size:10px}.rules span{color:#8299aa;font-size:10px;line-height:1.5}nav{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}nav button{border:1px solid #294657;background:#0a1620;color:#9fb7c7;border-radius:9px;padding:9px 11px;cursor:pointer}nav button.on{background:#75e4bd;color:#06150f;border-color:#75e4bd;font-weight:900}.msg{margin-top:10px;padding:11px;border:1px solid #2f6656;background:#0a211b;color:#adf4da;border-radius:10px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.grid article{border:1px solid #213b49;background:#08131b;border-radius:17px;padding:19px}.grid article.active-ph{border-color:#2c6550}.grid article.waitlist{border-color:#554547}.top{display:flex;justify-content:space-between;gap:12px}.top small{font-size:8px;letter-spacing:.13em;color:#74dfb9}.top h2{font-size:27px;margin:5px 0}.top em{font-style:normal;font-size:8px;border:1px solid #325163;border-radius:999px;padding:6px 8px;height:max-content;color:#aac0cf}.grid p,.grid li{color:#8ba0b0;font-size:10px;line-height:1.55}.grid h3{font-size:10px;margin:15px 0 5px;color:#d7e7f2}.grid ul{margin:0;padding-left:18px}.ref{margin-top:13px;border:1px solid #285745;background:#091e17;border-radius:11px;padding:12px}.ref span,.ref small,.ref b{display:block}.ref span,.ref small{font-size:8px;color:#83a397}.ref b{font-size:23px;letter-spacing:.08em;margin:5px 0;color:#a6f2d5}.ref button{border:1px solid #3d7c65;background:#102d23;color:#d8fff0;border-radius:7px;padding:7px 9px;cursor:pointer}.actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px}.actions a{border:1px solid #356075;border-radius:9px;padding:9px 11px;color:#ccefff;text-decoration:none;font-size:9px;font-weight:800}.grid footer{margin-top:13px;font-size:8px;color:#637d8e}.watch{margin-top:12px;border:1px solid #263d49;border-radius:15px;padding:19px;background:#081219}@media(max-width:780px){.page{padding:18px 12px 55px}.grid{grid-template-columns:1fr}.rules{grid-template-columns:1fr}.top{align-items:flex-start}.hero{padding-top:32px}header span{display:none}}
  `}</style>
 </main>
}
