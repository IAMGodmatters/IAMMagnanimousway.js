'use client';
import {useEffect,useState} from 'react';

type Entitlements={metered_ai?:boolean;pstn_minutes?:number;avatar_minutes?:number;premium_video_credits?:number;cost_ceiling_usd?:number};
type Plan={id:string;name:string;price_usd:number;cadence:string;primary?:boolean;description:string;features:string[];note?:string;checkout_configured?:boolean;entitlements?:Entitlements};
const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
async function read(r:Response){const text=await r.text();try{return JSON.parse(text)}catch{return{detail:text}}}
function ownerToken(){
 const current=localStorage.getItem('magnanimous_admin_token');
 const legacy=localStorage.getItem('odin_admin_token');
 if(!current&&legacy)localStorage.setItem('magnanimous_admin_token',legacy);
 return current||legacy||'';
}
function authToken(){return localStorage.getItem('iam_account_token')||ownerToken()}

export default function PricingPage(){
 const[plans,setPlans]=useState<Plan[]>([]),[currentPlan,setCurrentPlan]=useState('free'),[portalReady,setPortalReady]=useState(false),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[targetMargin,setTargetMargin]=useState(20);
 const[token,setToken]=useState('');
 useEffect(()=>{
  const t=authToken();setToken(t);
  fetch(`${api}/api/plans`,{cache:'no-store'}).then(read).then(d=>{setPlans(d.plans||[]);if(d.target_gross_margin_percent)setTargetMargin(Number(d.target_gross_margin_percent)||20)}).catch(()=>{});
  const load=()=>t?fetch(`${api}/api/billing/status`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}).then(read).then(d=>{if(d.plan)setCurrentPlan(d.plan);setPortalReady(!!d.portal_configured);return d}).catch(()=>null):Promise.resolve(null);
  const q=new URLSearchParams(location.search),state=q.get('checkout'),sessionId=q.get('session_id')||'',requested=q.get('plan')||'';
  if(state==='success'&&t&&sessionId){
   setMessage('Confirming your subscription with Stripe…');
   fetch(`${api}/api/billing/confirm`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({session_id:sessionId,plan:requested})})
    .then(async r=>({ok:r.ok,d:await read(r)})).then(({ok,d})=>{if(ok&&d.confirmed){setCurrentPlan(d.plan);setMessage(`${d.plan==='business'?'Full Business':plans.find(p=>p.id===d.plan)?.name||'Your plan'} is active.`);history.replaceState({},'',location.pathname)}else setMessage(d.detail||'Stripe has not confirmed the subscription yet.')}).finally(()=>load());
  }else{if(state==='cancelled')setMessage('Checkout was cancelled. Your current access is unchanged.');load()}
 },[]);
 async function checkout(plan:string){
  if(!token){location.href='/login';return}setBusy(plan);setMessage('');
  try{const r=await fetch(`${api}/api/billing/checkout`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({plan})});const d=await read(r);if(!r.ok)throw new Error(d.detail||'Checkout could not start.');if(!d.url)throw new Error('Stripe did not return a checkout page.');location.href=d.url}catch(e:any){setMessage(e?.message||'Checkout could not start.');setBusy('')}
 }
 async function manage(){
  if(!token){location.href='/login';return}setBusy('portal');
  try{const r=await fetch(`${api}/api/billing/portal`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:'{}'});const d=await read(r);if(!r.ok)throw new Error(d.detail||'Subscription management could not open.');location.href=d.url}catch(e:any){setMessage(e?.message||'Billing management could not open.');setBusy('')}
 }
 const fallback:Plan[]=[
  {id:'free',name:'Free',price_usd:0,cadence:'forever',primary:true,description:'Core Magnanimous AI and free-first tools.',features:['Magnanimous AI','Free-first AI','Creator tools','CRM']},
  {id:'plus',name:'Magnanimous Plus',price_usd:19,cadence:'month',description:'Affordable expanded access.',features:['Everything in Free','Higher workflow capacity']},
  {id:'business',name:'Full Business',price_usd:49,cadence:'month',description:'Complete business workspace.',features:['Everything in Plus','Business workflows','Controlled premium integrations']},
  {id:'pro',name:'Magnanimous Pro',price_usd:99,cadence:'month',description:'Higher professional capacity.',features:['Everything in Full Business','Larger premium allowances']},
  {id:'scale',name:'Magnanimous Scale',price_usd:199,cadence:'month',description:'High-capacity organizational plan.',features:['Everything in Pro','Largest controlled allowances']}
 ];
 const shown=plans.length?plans:fallback;
 return <main className="page">
  <header><a href="/">I AM MAGNANIMOUS WAY™</a><small>MAGNANIMOUS AI • FREE-FIRST</small><h1>Start free. Pay only when you need more capacity.</h1><p>The free platform remains important. Paid tiers add capacity and controlled premium services while the system targets at least a {targetMargin}% gross margin instead of offering unlimited owner-funded usage.</p><div><a className="button" href="/signup">Start free</a><a className="button ghost" href="/login">Sign in</a></div></header>
  {message&&<div className="message">{message}</div>}
  <section className="plans">{shown.map(p=><article key={p.id} className={p.id===currentPlan?'active':''}>
   <div className="top"><div><small>{p.primary?'FREE-FIRST':'PAID TIER'}</small><h2>{p.name}</h2></div>{p.id===currentPlan&&<b>CURRENT</b>}</div>
   <div className="price"><strong>${p.price_usd}</strong><span>{p.price_usd?'/month':'forever'}</span></div><p>{p.description}</p>
   <ul>{p.features.map(f=><li key={f}>✓ {f}</li>)}</ul>
   {p.entitlements&&p.price_usd>0&&<div className="limits"><b>Cost-protected included capacity</b><span>AI: {p.entitlements.metered_ai?'premium eligible':'free-first'}</span><span>PSTN calling: {p.entitlements.pstn_minutes||0} min</span><span>Avatar: {p.entitlements.avatar_minutes||0} min</span><span>Premium video credits: {p.entitlements.premium_video_credits||0}</span></div>}
   {p.id==='free'?<a className="button ghost full" href="/signup">Keep it free</a>:p.id===currentPlan?<button className="button full" onClick={manage} disabled={busy==='portal'}>{busy==='portal'?'Opening…':'Manage subscription'}</button>:<button className="button full" onClick={()=>checkout(p.id)} disabled={!!busy||p.checkout_configured===false}>{busy===p.id?'Opening Stripe…':p.checkout_configured===false?'Checkout setup pending':`Choose ${p.name}`}</button>}
  </article>)}</section>
  <section className="rules"><div><b>FREE-FIRST</b><p>Free users stay on free-first AI and browser tools.</p></div><div><b>MARGIN GUARD</b><p>Premium variable costs are capped by plan instead of being silently unlimited.</p></div><div><b>NO FALSE GUARANTEE</b><p>The platform targets {targetMargin}%+ gross margin, but actual profit still depends on fees, refunds, taxes, usage and sales.</p></div></section>
  <footer><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/billing-support">Billing support</a><a href="/business-plan">Professional Business Plan</a></footer>
  <style jsx>{`
  .page{min-height:100vh;background:#05080d;color:#edf7fb;font-family:Inter,system-ui,sans-serif;padding:0 22px 60px}header{max-width:1180px;margin:auto;padding:72px 0 44px}header>a{color:#ffc65c;text-decoration:none;font:900 12px Georgia;letter-spacing:.14em}header small{display:block;color:#59ddfb;margin-top:24px;letter-spacing:.18em}h1{font-size:clamp(42px,7vw,78px);line-height:1;margin:12px 0 20px;max-width:1000px}header p{max-width:850px;color:#9db2c1;line-height:1.7}.button{display:inline-block;border:1px solid #59ddfb;background:#59ddfb;color:#041017;border-radius:10px;padding:13px 17px;font-weight:900;text-decoration:none;cursor:pointer;margin:10px 8px 0 0}.ghost{background:transparent;color:#cde2ec;border-color:#34505e}.message{max-width:1180px;margin:0 auto 20px;padding:13px 16px;border:1px solid #315469;background:#0b151e;border-radius:10px}.plans{max-width:1180px;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.plans article{border:1px solid #253844;background:#081018;border-radius:18px;padding:22px}.plans article.active{border-color:#d79a35;box-shadow:0 0 30px rgba(255,184,55,.1)}.top{display:flex;justify-content:space-between;gap:10px}.top small{color:#59ddfb;font-size:9px;letter-spacing:.14em}.top h2{margin:5px 0;font-size:24px}.top>b{font-size:9px;color:#76e5ad;border:1px solid #39785a;padding:6px 8px;border-radius:20px;height:max-content}.price{display:flex;align-items:end;gap:7px;margin:14px 0}.price strong{font-size:46px}.price span{color:#8299a8;padding-bottom:7px}.plans p{color:#9aafbc;line-height:1.55;min-height:70px}.plans ul{list-style:none;padding:0;display:grid;gap:8px;min-height:130px}.plans li{font-size:12px;border-bottom:1px solid #162630;padding-bottom:7px}.limits{display:grid;gap:5px;background:#101820;border:1px solid #263b48;border-radius:10px;padding:10px;font-size:11px;color:#9cc7d8;min-height:108px}.limits b{color:#ffc76d}.full{width:100%;box-sizing:border-box;text-align:center}.rules{max-width:1180px;margin:25px auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.rules div{padding:17px;border:1px solid #1f333f;border-radius:13px}.rules b{color:#61def8;font-size:10px;letter-spacing:.12em}.rules p{color:#899daa;font-size:12px;line-height:1.5}footer{max-width:1180px;margin:55px auto 0;display:flex;gap:18px;flex-wrap:wrap}footer a{color:#8ca2b1;text-decoration:none;font-size:11px}@media(max-width:900px){.plans{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.plans,.rules{grid-template-columns:1fr}.plans p,.plans ul,.limits{min-height:0}}
  `}</style>
 </main>
}
