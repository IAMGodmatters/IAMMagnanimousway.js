'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const relevantFamilies=new Set(['shipping-logistics','ocean-logistics','trade-data','erp','payments']);
const modules=[
 ['Smart Freight Board','Normalize authorized load-board data, preserve source provenance, deduplicate reposts, save views, notes, preferences and search state.'],
 ['Dispatch + TMS','Driver and truck assignment, pickup/delivery milestones, exceptions, proof-of-delivery and task ownership.'],
 ['Profit Intelligence','Loaded/deadhead miles, RPM, fuel, tolls, driver pay, other costs, margin and break-even decision support.'],
 ['Broker / Carrier Risk','Authority, factoring/credit and review evidence without treating any one signal as a definitive safety or legal judgment.'],
 ['ERP Core','Customers, suppliers, quotes, sales/purchase orders, invoices, receivables, payables, expenses, assets, inventory and cost centers.'],
 ['Audit + Controls','Tenant isolation, role-based access, approval gates, idempotency, evidence and connector health.']
];
const cleanNum=(v:string)=>Number.isFinite(Number(v))?Number(v):0;
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}

export default function LogisticsERPPage(){
 const[ready,setReady]=useState(false),[backing,setBacking]=useState<any>(null),[backingError,setBackingError]=useState('');
 const[rate,setRate]=useState('2500'),[loaded,setLoaded]=useState('900'),[deadhead,setDeadhead]=useState('80');
 const[fuelPrice,setFuelPrice]=useState('3.60'),[mpg,setMpg]=useState('7'),[tolls,setTolls]=useState('85');
 const[driver,setDriver]=useState('0'),[other,setOther]=useState('150');
 useEffect(()=>{
  const t=getPlatformAuthToken();
  if(!t){location.replace('/login?returnTo=%2Flogistics-erp');return}
  setReady(true);
  fetch(`${api}/api/b2b/catalog`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'})
   .then(async r=>{const d=await read(r);if(!r.ok)throw new Error(d.detail||'Magnanimous B2B backend is unavailable.');setBacking(d)})
   .catch((e:any)=>setBackingError(e?.message||'Magnanimous B2B backend is unavailable.'));
 },[]);
 const calc=useMemo(()=>{
  const gross=cleanNum(rate),lm=cleanNum(loaded),dh=cleanNum(deadhead),miles=lm+dh;
  const fuel=(miles/Math.max(cleanNum(mpg),.1))*cleanNum(fuelPrice),cost=fuel+cleanNum(tolls)+cleanNum(driver)+cleanNum(other);
  const profit=gross-cost,margin=gross?profit/gross*100:0,allRpm=miles?gross/miles:0,loadedRpm=lm?gross/lm:0,deadheadPct=miles?dh/miles*100:0;
  let score=50;score+=Math.min(25,Math.max(-25,(margin-10)*1.25));score+=Math.min(15,Math.max(-15,(allRpm-2)*12));score-=Math.min(20,deadheadPct*.45);score=Math.round(Math.max(0,Math.min(100,score)));
  return{miles,fuel,cost,profit,margin,allRpm,loadedRpm,deadheadPct,score};
 },[rate,loaded,deadhead,fuelPrice,mpg,tolls,driver,other]);
 const connections=(backing?.connections||[]).filter((x:any)=>relevantFamilies.has(String(x.family||'')));
 const configured=connections.filter((x:any)=>x.configured).length;
 const verified=connections.filter((x:any)=>x.live_connection_verified).length;
 const workflow=backing?.workflows?.logistics||[];
 const shipmentFields=backing?.normalized_objects?.shipment||[];
 if(!ready)return <main style={{minHeight:'100vh',background:'#05090d',color:'#d8edf4',display:'grid',placeItems:'center'}}>Opening Magnanimous Logistics ERP…</main>;
 return <main className="page">
  <header><div><small>MAGNANIMOUS NATIVE OPERATIONS</small><h1>Freight Logistics + ERP Command</h1><p>Magnanimous AI owns the workflow, normalized records, policy, memory and decision support. Authorized carrier, load-board, map, weather, factoring, email and accounting services remain replaceable rails.</p></div><nav><a href="/b2b">B2B</a><a href="/crm">CRM</a><a href="/enterprise">Enterprise</a><a href="/connections">Connections</a></nav></header>

  <section className="status panel">
   <div><small>BACKING SERVICE</small><b className={backing?'good':backingError?'bad':''}>{backing?'MAGNANIMOUS B2B BACKEND REACHABLE':backingError?'BACKEND CHECK FAILED':'CHECKING BACKEND…'}</b></div>
   <div><span>Relevant connector templates</span><b>{connections.length}</b></div><div><span>Credentials present</span><b>{configured}</b></div><div><span>Transactionally verified</span><b>{verified}</b></div>
   {backingError&&<p className="bad">{backingError}</p>}
   <p className="muted">Credentials present are not proof of commercial approval or transaction authority. A provider is not treated as live until its own handshake and authority are verified.</p>
  </section>

  <section className="heroGrid">
   <article className="panel"><small>LOCAL PROFITABILITY ENGINE</small><h2>Load economics</h2><div className="inputs">{[
    ['Gross rate',rate,setRate],['Loaded miles',loaded,setLoaded],['Deadhead miles',deadhead,setDeadhead],['Fuel $/gal',fuelPrice,setFuelPrice],['MPG',mpg,setMpg],['Tolls',tolls,setTolls],['Driver / contractor cost',driver,setDriver],['Other trip cost',other,setOther]
   ].map(([label,value,setter]:any)=><label key={label}><span>{label}</span><input inputMode="decimal" value={value} onChange={e=>setter(e.target.value)}/></label>)}</div><div className="score"><span>Magnanimous load score</span><b>{calc.score}/100</b></div></article>
   <article className="panel"><small>DECISION METRICS</small><h2>Before you book</h2><div className="metricGrid"><div><span>Total miles</span><b>{calc.miles.toFixed(0)}</b></div><div><span>Loaded RPM</span><b>${calc.loadedRpm.toFixed(2)}</b></div><div><span>All-in RPM</span><b>${calc.allRpm.toFixed(2)}</b></div><div><span>Deadhead</span><b>{calc.deadheadPct.toFixed(1)}%</b></div><div><span>Fuel estimate</span><b>{money(calc.fuel)}</b></div><div><span>Trip cost</span><b>{money(calc.cost)}</b></div><div><span>Estimated profit</span><b className={calc.profit>=0?'good':'bad'}>{money(calc.profit)}</b></div><div><span>Margin</span><b>{calc.margin.toFixed(1)}%</b></div></div><p className="muted">These are local planning calculations. Live route miles, tolls, rates, authority and payment risk must be verified through authorized sources before commitment.</p></article>
  </section>

  <section className="flow"><article className="panel"><small>BACKEND LOGISTICS WORKFLOW</small><h2>Canonical execution sequence</h2>{workflow.length?workflow.map((x:string,i:number)=><p className="step" key={x}><span>{i+1}</span>{x}</p>):<p className="muted">Workflow is unavailable until the backend catalog loads.</p>}</article><article className="panel"><small>NORMALIZED SHIPMENT RECORD</small><h2>Fields backed by Magnanimous</h2><div className="chips">{shipmentFields.length?shipmentFields.map((x:string)=><span key={x}>{x.replaceAll('_',' ')}</span>):<span>Waiting for backend…</span>}</div></article></section>

  <section className="panel wide"><small>PROVIDER READINESS</small><h2>Real connection state, not marketing claims</h2><div className="cards">{connections.length?connections.map((c:any)=><article key={c.id} className={c.live_connection_verified?'verified':c.configured?'configured':''}><b>{c.name}</b><span>{c.family}</span><em>{c.live_connection_verified?'LIVE VERIFIED':c.configured?'CREDENTIALS PRESENT':'NOT CONFIGURED'}</em><p>{c.note}</p></article>):<p className="muted">No relevant connection state is available until the backend catalog loads.</p>}</div></section>

  <section className="panel wide"><small>NATIVE CAPABILITY CONTRACTS</small><h2>What Magnanimous owns</h2><div className="cards">{modules.map(([name,desc])=><article key={name}><b>{name}</b><em>MAGNANIMOUS CONTRACT</em><p>{desc}</p></article>)}</div></section>
  <section className="panel wide"><small>CLEAN-ROOM IMPLEMENTATION</small><h2>Independent design, no proprietary copying</h2><p className="muted">Public workflow ideas may inform independent design, but LoadHunter code, private APIs, assets, credentials, sessions and protected implementation details are not copied or reverse engineered. Every live external integration must use an authorized account and supported interface.</p></section>

  <style jsx>{`
   .page{min-height:100vh;background:#05090d;color:#ecf8fb;font-family:Inter,system-ui,sans-serif;padding:28px}.page>*{max-width:1320px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:24px;align-items:end;padding:28px 0}small{color:#64e8b2;font-weight:900;letter-spacing:.13em}h1{font-size:clamp(38px,6vw,70px);margin:6px 0}h2{margin:7px 0 14px}header p,.muted,.panel p{color:#94aab4;line-height:1.55}nav{display:flex;gap:8px;flex-wrap:wrap}a{color:#dceef4;text-decoration:none;border:1px solid #29414c;padding:9px 11px;border-radius:10px}.panel{background:#081118;border:1px solid #203b47;border-radius:16px;padding:18px}.wide,.status,.heroGrid,.flow{margin-top:14px}.status{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:10px;align-items:start}.status>div{display:grid;gap:4px}.status b{font-size:20px}.heroGrid,.flow{display:grid;grid-template-columns:1fr 1fr;gap:14px}.inputs{display:grid;grid-template-columns:1fr 1fr;gap:9px}.inputs label{display:grid;gap:5px}.inputs span,.metricGrid span,.status span{color:#8fa5ae;font-size:11px}.inputs input{width:100%;box-sizing:border-box;background:#051018;border:1px solid #2a4653;border-radius:9px;padding:10px;color:#edf9fc}.metricGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.metricGrid div,.cards article{background:#061018;border:1px solid #263943;border-radius:11px;padding:12px}.metricGrid b{display:block;font-size:22px;margin-top:4px}.score{display:flex;justify-content:space-between;border-top:1px solid #21343d;margin-top:14px;padding-top:12px}.score b{font-size:28px;color:#7ff1ba}.good{color:#70efb5!important}.bad{color:#ff8f9e!important}.step{display:flex;gap:10px;align-items:flex-start;color:#9eb2ba}.step span{min-width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#123929;color:#80e8b4;font-size:10px;font-weight:900}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.cards b,.cards span,.cards em{display:block}.cards span{font-size:10px;color:#79dcb5;margin-top:4px}.cards em{font-size:9px;font-style:normal;color:#d9a45f;margin-top:8px}.cards .configured{border-color:#6a5b2a}.cards .verified{border-color:#2f815d}.cards .verified em{color:#70efb5}.cards p{font-size:11px}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips span{border:1px solid #285244;background:#0d201a;padding:7px 9px;border-radius:999px;font-size:11px;color:#aef1cf}@media(max-width:960px){header{display:block}.heroGrid,.flow,.cards,.status{grid-template-columns:1fr 1fr}}@media(max-width:600px){.page{padding:16px}.heroGrid,.flow,.cards,.status,.inputs,.metricGrid{grid-template-columns:1fr}}
  `}</style>
 </main>
}
