'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const modules=[
 ['Smart Freight Board','Normalize loads from authorized boards, pin/hide rows, keep per-search state, deduplicate reposts, save loads and notes.'],
 ['Dispatch + TMS','Driver/truck timelines, assignment queue, pickup/delivery milestones, exception handling, proof-of-delivery and task ownership.'],
 ['Profit Intelligence','Loaded/deadhead miles, all-in RPM, fuel, tolls, driver pay, fixed/other costs, margin and break-even rate.'],
 ['Broker / Carrier Risk','MC/DOT authority evidence, factoring/credit signals, preferred/ignored parties, notes, review evidence and scam-risk flags.'],
 ['Outreach Automation','Reusable email/SMS/call templates, duplicate-contact guard, conversation state and human approval controls for consequential outreach.'],
 ['Route Intelligence','Route, deadhead, toll, weather, stop and market context through replaceable map/weather rails.'],
 ['ERP Core','Customers, suppliers, quotes, sales/purchase orders, invoices, receivables, payables, expenses, assets, inventory and cost centers.'],
 ['Documents + AI Intake','Rate-confirmation and document intake, structured extraction, confidence flags, source evidence and human review before posting.'],
 ['Operations Analytics','Lane profitability, dispatcher throughput, acceptance rate, response time, idle equipment, broker performance and margin leakage.'],
 ['Audit + Controls','Tenant isolation, role-based permissions, approval gates, idempotency, immutable action evidence and connection health.']
];

const workflow=['Discover or import an authorized load','Normalize lane, equipment, rate, dates and counterparty','Remove duplicates and apply preferred/ignored filters','Verify authority, risk evidence and communication history','Calculate total-mile economics and margin','Assign truck/driver and confirm availability','Send approved outreach or booking request','Capture rate confirmation and shipment documents','Track pickup, transit, delivery and exceptions','Reconcile invoice, carrier/driver cost and settlement','Write outcome analytics back to Magnanimous memory'];

const cleanNum=(v:string)=>Number.isFinite(Number(v))?Number(v):0;
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);

export default function LogisticsERPPage(){
 const[ready,setReady]=useState(false);
 const[rate,setRate]=useState('2500'),[loaded,setLoaded]=useState('900'),[deadhead,setDeadhead]=useState('80');
 const[fuelPrice,setFuelPrice]=useState('3.60'),[mpg,setMpg]=useState('7'),[tolls,setTolls]=useState('85');
 const[driver,setDriver]=useState('0'),[other,setOther]=useState('150');
 useEffect(()=>{const t=getPlatformAuthToken();if(!t){location.replace('/login?returnTo=%2Flogistics-erp');return}setReady(true)},[]);
 const calc=useMemo(()=>{
  const gross=cleanNum(rate),lm=cleanNum(loaded),dh=cleanNum(deadhead),miles=lm+dh;
  const gallons=miles/Math.max(cleanNum(mpg),.1),fuel=gallons*cleanNum(fuelPrice),cost=fuel+cleanNum(tolls)+cleanNum(driver)+cleanNum(other);
  const profit=gross-cost,margin=gross?profit/gross*100:0;
  const allRpm=miles?gross/miles:0,loadedRpm=lm?gross/lm:0,deadheadPct=miles?dh/miles*100:0;
  let score=50; score+=Math.min(25,Math.max(-25,(margin-10)*1.25)); score+=Math.min(15,Math.max(-15,(allRpm-2)*12)); score-=Math.min(20,deadheadPct*.45); score=Math.round(Math.max(0,Math.min(100,score)));
  return{gross,lm,dh,miles,fuel,cost,profit,margin,allRpm,loadedRpm,deadheadPct,score};
 },[rate,loaded,deadhead,fuelPrice,mpg,tolls,driver,other]);
 if(!ready)return <main style={{minHeight:'100vh',background:'#05090d',color:'#d8edf4',display:'grid',placeItems:'center'}}>Opening Magnanimous Logistics ERP…</main>;
 return <main className="page">
  <header><div><small>MAGNANIMOUS NATIVE OPERATIONS</small><h1>Freight Logistics + ERP Command</h1><p>Independent clean-room capabilities inspired by public dispatch/TMS workflows and open ERP patterns. Magnanimous AI stays the brain; outside boards, maps, email, factoring, carrier and accounting systems remain replaceable rails.</p></div><nav><a href="/b2b">B2B</a><a href="/crm">CRM</a><a href="/enterprise">Enterprise</a><a href="/connections">Connections</a></nav></header>

  <section className="heroGrid">
   <article className="panel calculator"><small>LIVE PROFITABILITY ENGINE</small><h2>Load economics</h2>
    <div className="inputs">{[
     ['Gross rate',rate,setRate],['Loaded miles',loaded,setLoaded],['Deadhead miles',deadhead,setDeadhead],['Fuel $/gal',fuelPrice,setFuelPrice],['MPG',mpg,setMpg],['Tolls',tolls,setTolls],['Driver / contractor cost',driver,setDriver],['Other trip cost',other,setOther]
    ].map(([label,value,setter]:any)=><label key={label}><span>{label}</span><input inputMode="decimal" value={value} onChange={e=>setter(e.target.value)}/></label>)}</div>
    <div className="score"><div><span>Magnanimous load score</span><b>{calc.score}/100</b></div><meter min="0" max="100" value={calc.score}/></div>
   </article>
   <article className="panel metrics"><small>DECISION METRICS</small><h2>Before you book</h2><div className="metricGrid">
    <div><span>Total miles</span><b>{calc.miles.toFixed(0)}</b></div><div><span>Loaded RPM</span><b>${calc.loadedRpm.toFixed(2)}</b></div><div><span>All-in RPM</span><b>${calc.allRpm.toFixed(2)}</b></div><div><span>Deadhead</span><b>{calc.deadheadPct.toFixed(1)}%</b></div><div><span>Fuel estimate</span><b>{money(calc.fuel)}</b></div><div><span>Trip cost</span><b>{money(calc.cost)}</b></div><div><span>Estimated profit</span><b className={calc.profit>=0?'good':'bad'}>{money(calc.profit)}</b></div><div><span>Margin</span><b className={calc.margin>=15?'good':calc.margin<0?'bad':''}>{calc.margin.toFixed(1)}%</b></div>
   </div><p className="muted">This calculator is advisory. Live tolls, fuel prices, route miles, market rates, authority and payment-risk data must be verified through authorized sources before a booking or financial commitment.</p></article>
  </section>

  <section className="panel wide"><small>CAPABILITY FABRIC</small><h2>What Magnanimous should own natively</h2><div className="cards">{modules.map(([name,desc])=><article key={name}><b>{name}</b><p>{desc}</p></article>)}</div></section>
  <section className="flow"><article className="panel"><small>FREIGHT / TMS FLOW</small><h2>Search → qualify → dispatch → settle</h2>{workflow.map((x,i)=><p className="step" key={x}><span>{i+1}</span>{x}</p>)}</article><article className="panel"><small>ERP DESIGN RULES</small><h2>One source of operational truth</h2><ul><li>One canonical customer/vendor/company master.</li><li>One load/shipment record linked to quotes, communications, documents, expenses and invoices.</li><li>General-ledger posting comes from approved business documents, not ad-hoc edits.</li><li>Every connector is replaceable; Magnanimous owns normalized records and policy.</li><li>Read-only research can automate aggressively; money, bookings, legal attestations and destructive changes stay approval-gated.</li><li>Never treat a rating, community note or risk signal as a definitive legal or safety determination.</li></ul></article></section>

  <section className="panel wide"><small>CLEAN-ROOM SOURCE ABSORPTION</small><h2>Public ideas absorbed without copying proprietary code</h2><div className="chips">{['Smart customizable board','Auto-refresh','Deduplication','Saved loads','Load notes','Preferred / ignored companies','Email templates','Duplicate-contact guard','Telegram-style alerts','VoIP / SMS rail','Integrated TMS','Profit calculator','RPM + deadhead','Tolls','Weather','Market context','FMCSA lookup','Factoring signals','Community evidence','Rate-confirmation parsing','Team management','Dispatcher analytics','Feature flags','Per-tab search state','Dark / light UI'].map(x=><span key={x}>{x}</span>)}</div><p className="muted">LoadHunter's public terms prohibit reverse engineering and its extension source is marked All Rights Reserved. This module therefore implements functional patterns independently from public descriptions and open standards rather than copying LoadHunter code, assets, private APIs or protected implementation details.</p></section>
  <style jsx>{`
   .page{min-height:100vh;background:#05090d;color:#ecf8fb;font-family:Inter,system-ui,sans-serif;padding:28px}.page>*{max-width:1320px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:24px;align-items:end;padding:28px 0}small{color:#64e8b2;font-weight:900;letter-spacing:.13em}h1{font-size:clamp(38px,6vw,70px);margin:6px 0}h2{margin:7px 0 14px}header p,.muted,.panel p,li{color:#94aab4;line-height:1.55}nav{display:flex;gap:8px;flex-wrap:wrap}a{color:#dceef4;text-decoration:none;border:1px solid #29414c;padding:9px 11px;border-radius:10px}.heroGrid,.flow{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.panel{background:#081118;border:1px solid #203b47;border-radius:16px;padding:18px}.wide{margin-top:14px}.inputs{display:grid;grid-template-columns:1fr 1fr;gap:9px}.inputs label{display:grid;gap:5px}.inputs span,.metricGrid span,.score span{color:#8fa5ae;font-size:11px}.inputs input{width:100%;box-sizing:border-box;background:#051018;border:1px solid #2a4653;border-radius:9px;padding:10px;color:#edf9fc}.metricGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.metricGrid div{background:#061018;border:1px solid #263943;border-radius:11px;padding:12px}.metricGrid b{display:block;font-size:22px;margin-top:4px}.good{color:#70efb5}.bad{color:#ff8f9e}.score{margin-top:14px;border-top:1px solid #21343d;padding-top:12px}.score>div{display:flex;justify-content:space-between}.score b{font-size:28px;color:#7ff1ba}meter{width:100%;height:18px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.cards article{background:#061018;border:1px solid #263943;border-radius:11px;padding:12px}.cards b{color:#e9f7fa}.cards p{font-size:12px}.step{display:flex;gap:10px;align-items:flex-start}.step span{min-width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#123929;color:#80e8b4;font-size:10px;font-weight:900}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips span{border:1px solid #285244;background:#0d201a;padding:7px 9px;border-radius:999px;font-size:11px;color:#aef1cf}ul{padding-left:20px}@media(max-width:960px){header{display:block}.heroGrid,.flow,.cards{grid-template-columns:1fr}.inputs,.metricGrid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.page{padding:16px}.inputs,.metricGrid{grid-template-columns:1fr}}
  `}</style>
 </main>
}
