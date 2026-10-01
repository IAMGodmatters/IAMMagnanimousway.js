'use client';

import {useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
function auth(){return localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t}}}

export default function MagnanimousTraining(){
 const[status,setStatus]=useState<any>(null);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState('');
 const[form,setForm]=useState({domain:'general',prompt:'',ideal_response:'',lesson_key:'',lesson_value:''});
 const h=()=>({Authorization:`Bearer ${auth()}`});

 async function refresh(){
  const r=await fetch(`${api}/api/magnanimous/training/status`,{headers:h()});
  const d=await read(r);setStatus(d);if(!r.ok)setMsg(d.detail||'Unable to load training status.');
 }
 useEffect(()=>{if(!auth()){location.replace('/login');return}refresh()},[]);

 async function teach(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMsg('Saving approved training example…');
  try{
   const r=await fetch(`${api}/api/magnanimous/training/teach`,{method:'POST',headers:{...h(),'Content-Type':'application/json'},body:JSON.stringify(form)});
   const d=await read(r);setMsg(r.ok?'Training example saved to your private Magnanimous learning set.':d.detail||'Unable to save training example.');
   if(r.ok){setForm(v=>({...v,prompt:'',ideal_response:'',lesson_key:'',lesson_value:''}));await refresh()}
  }finally{setBusy(false)}
 }

 async function toggle(){
  if(!status?.settings)return;setBusy(true);
  try{
   const r=await fetch(`${api}/api/magnanimous/training/settings`,{method:'POST',headers:{...h(),'Content-Type':'application/json'},body:JSON.stringify({enabled:!Number(status.settings.enabled)})});
   const d=await read(r);setMsg(r.ok?`Continuous learning ${d.settings.enabled?'enabled':'paused'}.`:d.detail||'Unable to update training.');await refresh();
  }finally{setBusy(false)}
 }

 async function runNow(){
  setBusy(true);setMsg('Running a learning cycle…');
  try{const r=await fetch(`${api}/api/magnanimous/training/run`,{method:'POST',headers:h()});const d=await read(r);setMsg(r.ok?`Cycle complete: ${d.scanned||0} outcome groups scanned, ${d.promoted||0} patterns promoted.`:d.detail||'Unable to run learning cycle.');await refresh()}finally{setBusy(false)}
 }

 async function download(){
  setBusy(true);
  try{
   const r=await fetch(`${api}/api/magnanimous/training/export`,{headers:h()});
   if(!r.ok){const d=await read(r);setMsg(d.detail||'Unable to export dataset.');return}
   const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='magnanimous-training.jsonl';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setMsg('Approved training examples exported as JSONL.');
  }finally{setBusy(false)}
 }

 const counts=status?.counts||{},settings=status?.settings||{},runs=status?.recent_runs||[],candidates=status?.candidates||[];
 return <main>
  <header><a href="/magnanimous-brain">← Magnanimous Brain</a><small>I AM MAGNANIMOUS WAY™</small><div className="badge">24/7 CONTINUOUS LEARNING</div><h1>Magnanimous Training Center</h1><p>This trains the private Magnanimous intelligence layer through approved examples, persistent lessons, knowledge retrieval, execution outcomes and adaptive routing. It does not silently retrain a public foundation model.</p></header>

  <section className="metrics"><article><b>{counts.examples||0}</b><span>approved examples</span></article><article><b>{counts.candidates||0}</b><span>patterns observed</span></article><article><b>{counts.promoted||0}</b><span>patterns promoted</span></article><article><b>{counts.learned_lessons||0}</b><span>active learned lessons</span></article></section>

  <section className="panel status"><div><small>LEARNING ENGINE</small><h2>{Number(settings.enabled)!==0?'ACTIVE':'PAUSED'}</h2><p>Automatic cycle: <strong>every 15 minutes</strong>. Default promotion gate: at least {settings.minimum_samples??4} samples, {Math.round(Number(settings.minimum_success_rate??.75)*100)}% success, and {Math.round(Number(settings.minimum_quality??.60)*100)}% average quality.</p></div><div className="actions"><button onClick={toggle} disabled={busy}>{Number(settings.enabled)!==0?'PAUSE LEARNING':'ENABLE LEARNING'}</button><button onClick={runNow} disabled={busy}>RUN OWNER CYCLE NOW</button><button onClick={download} disabled={busy}>EXPORT APPROVED JSONL</button></div></section>

  {msg&&<p className="notice" role="status">{msg}</p>}

  <section className="grid"><form className="panel" onSubmit={teach}><small>EXPLICIT TEACHING</small><h2>Teach Magnanimous a better example</h2><p>Use examples you intentionally approve. Never paste passwords, API keys, access tokens or private keys.</p><label>Domain<input value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} maxLength={80}/></label><label>User request / prompt<textarea value={form.prompt} onChange={e=>setForm({...form,prompt:e.target.value})} required maxLength={12000}/></label><label>Ideal Magnanimous answer<textarea value={form.ideal_response} onChange={e=>setForm({...form,ideal_response:e.target.value})} required maxLength={16000}/></label><label>Optional rule key<input value={form.lesson_key} onChange={e=>setForm({...form,lesson_key:e.target.value})} placeholder="Example: preferred-writing-tone" maxLength={160}/></label><label>Optional rule Magnanimous should remember<textarea value={form.lesson_value} onChange={e=>setForm({...form,lesson_value:e.target.value})} maxLength={8000}/></label><button disabled={busy||!form.prompt.trim()||!form.ideal_response.trim()}>SAVE APPROVED TRAINING EXAMPLE</button></form>

  <article className="panel"><small>HOW IT LEARNS</small><h2>Safe continuous improvement</h2><ol><li>Observe successful and failed provider/workflow outcomes.</li><li>Keep every customer and tenant isolated.</li><li>Require repeated evidence before promoting a pattern.</li><li>Write high-confidence routing lessons back into the Magnanimous brain.</li><li>Combine those lessons with private memory and knowledge retrieval on future work.</li><li>Keep paid foundation-model fine-tuning review-gated instead of launching it from raw chats.</li></ol><div className="guard"><b>Guardrail</b><p>A single bad answer cannot immediately become a global rule. Private customer data never becomes cross-tenant training data.</p></div></article></section>

  <section className="grid"><article className="panel"><h2>Top observed patterns</h2>{candidates.length?<div className="cards">{candidates.map((x:any,i:number)=><div className="card" key={`${x.capability}-${x.provider}-${i}`}><b>{x.capability}</b><strong>{x.provider}</strong><span className={x.status==='promoted'?'good':'watch'}>{String(x.status||'observing').toUpperCase()}</span><small>{x.samples} samples · {Math.round(Number(x.success_rate||0)*100)}% success · quality {Number(x.average_quality||0).toFixed(2)} · score {Number(x.score||0).toFixed(2)}</small></div>)}</div>:<p>No eligible patterns yet. Magnanimous will populate this as real outcomes accumulate.</p>}</article>
  <article className="panel"><h2>Recent learning cycles</h2>{runs.length?<div className="cards">{runs.map((x:any)=><div className="card" key={x.id}><b>Run #{x.id}</b><span className={x.status==='completed'?'good':'watch'}>{String(x.status).toUpperCase()}</span><small>{new Date(Number(x.started_at)*1000).toLocaleString()} · scanned {x.outcome_groups_scanned||0} · promoted {x.candidates_promoted||0} · lessons {x.lessons_updated||0} · errors {x.errors||0}</small></div>)}</div>:<p>The first scheduled run will appear here after deployment.</p>}</article></section>

  <style jsx>{`*{box-sizing:border-box}main{min-height:100vh;background:radial-gradient(circle at 75% 5%,#193b72 0,transparent 28%),#070b13;color:#eefcff;padding:30px;font-family:Inter,system-ui,sans-serif}header,.metrics,.grid,.panel,.notice{max-width:1280px;margin-left:auto;margin-right:auto}header a{color:#64edff;text-decoration:none}header small,.panel>small{display:block;margin-top:14px;letter-spacing:.16em;color:#7e96ad;font-weight:900}.badge{display:inline-block;margin-top:12px;padding:7px 11px;border:1px solid #58e5b8;border-radius:999px;color:#7bffd6;background:#09251f;font-size:10px;font-weight:1000;letter-spacing:.12em}h1{font-size:clamp(42px,6vw,76px);margin:8px 0;background:linear-gradient(90deg,#fff,#5cecff,#ed68ff);-webkit-background-clip:text;color:transparent}header p,.panel p,.panel li{color:#9db0c5;line-height:1.65}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:24px}.metrics article,.panel{border:1px solid #203c59;background:#0a1423;border-radius:16px;padding:18px}.metrics b{font-size:34px;display:block}.metrics span{font-size:11px;color:#8298af}.panel{margin-top:12px}.status{display:grid;grid-template-columns:1.2fr .8fr;gap:18px}.status h2{font-size:32px;color:#73efb2}.actions{display:grid;gap:8px;align-content:center}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.notice{margin-top:12px;padding:12px 16px;border:1px solid #2d5b75;border-radius:12px;background:#0b1d2b;color:#bfefff}label{display:block;margin-top:12px;color:#b7c8d8;font-size:12px;font-weight:800}input,textarea{width:100%;margin-top:5px;background:#07101c;border:1px solid #294862;border-radius:10px;color:#fff;padding:12px;font:inherit}textarea{min-height:110px;resize:vertical}button{padding:12px;border:0;border-radius:9px;background:linear-gradient(90deg,#25dae9,#725cff,#ea5cff);color:#fff;font-weight:900;cursor:pointer}form button{width:100%;margin-top:14px}button:disabled{opacity:.5}.guard{margin-top:18px;padding:14px;border:1px solid #5c4d26;border-radius:12px;background:#201b0c}.guard b{color:#ffd879}.cards{display:grid;gap:8px}.card{position:relative;background:#0d1a2b;border:1px solid #263f59;border-radius:10px;padding:12px}.card b,.card strong,.card small{display:block}.card strong{color:#65edff;margin-top:3px}.card small{color:#8196aa;margin-top:7px}.card span{position:absolute;right:10px;top:10px;font-size:9px}.good{color:#73efb2}.watch{color:#ffd27e}@media(max-width:800px){main{padding:18px}.metrics,.grid,.status{grid-template-columns:1fr 1fr}}@media(max-width:560px){.metrics,.grid,.status{grid-template-columns:1fr}}`}</style>
 </main>
}
