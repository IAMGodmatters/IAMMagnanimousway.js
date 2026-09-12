'use client';
import {useEffect,useMemo,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Agent={id:string;name:string;title:string;description:string;branch?:{core_skills?:string[]}};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}

export default function PublicTeachingPanel(){
 const[agents,setAgents]=useState<Agent[]>([]),[selected,setSelected]=useState(''),[title,setTitle]=useState(''),[tags,setTags]=useState(''),[content,setContent]=useState(''),[url,setUrl]=useState(''),[challenge,setChallenge]=useState(''),[expected,setExpected]=useState(''),[website,setWebsite]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[err,setErr]=useState('');
 const agent=useMemo(()=>agents.find(x=>x.id===selected),[agents,selected]);
 useEffect(()=>{fetch(`${api}/api/agents`,{cache:'no-store'}).then(read).then(d=>{const list:Array<Agent>=Array.isArray(d?.agents)?d.agents:[];setAgents(list);setSelected(v=>v||list[0]?.id||'')}).catch(()=>setErr('The teaching list could not be loaded right now.'))},[]);
 async function submit(){
  if(!selected){setErr('Choose a specialist branch.');return}
  if(!content.trim()&&!challenge.trim()&&!url.trim()){setErr('Add a lesson, source URL, or QA challenge.');return}
  setBusy(true);setErr('');setMsg('');
  try{
   const r=await fetch(`${api}/api/agents/branch/submissions/public`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent_id:selected,title:title.trim(),tags:tags.split(',').map(x=>x.trim()).filter(Boolean),content:content.trim(),url:url.trim(),challenge_prompt:challenge.trim(),expected_outcome:expected.trim(),website})});
   const d=await read(r);if(!r.ok)throw new Error(d.detail||'Submission failed.');
   setTitle('');setTags('');setContent('');setUrl('');setChallenge('');setExpected('');setWebsite('');setMsg('Thank you. Your teaching is now waiting for the platform owner to review it before anything can be learned or published.');
  }catch(e:any){setErr(e?.message||'Submission failed.')}finally{setBusy(false)}
 }
 return <section className="teach" aria-labelledby="teach-magnanimous-title">
  <div className="head"><div><small>PUBLIC QA + TEACHING</small><h2 id="teach-magnanimous-title">Teach Magnanimous AI™</h2><p>Anyone can contribute a better method, example, source, or difficult QA challenge. Public teaching never goes live automatically. Every submission stays pending until the platform owner reviews and approves it.</p></div><span className="badge">OWNER APPROVAL REQUIRED</span></div>
  {msg&&<div className="notice ok">{msg}</div>}{err&&<div className="notice bad">{err}</div>}
  <div className="grid">
   <label>Specialist branch<select value={selected} onChange={e=>setSelected(e.target.value)}>{agents.map(a=><option key={a.id} value={a.id}>{a.name} — {a.title}</option>)}</select></label>
   <label>Proposal title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What should Magnanimous learn or improve?"/></label>
   <label>Skill tags<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="research, sales, Bible study, support…"/></label>
   <label>Public source URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/source" inputMode="url"/></label>
  </div>
  {agent&&<p className="agent"><b>{agent.name}</b> — {agent.description}</p>}
  <label>Proposed lesson / better method<textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Explain the procedure, expert method, correction, example, or stronger answer pattern you want the owner to review…"/></label>
  <div className="two"><label>QA challenge<textarea value={challenge} onChange={e=>setChallenge(e.target.value)} placeholder="Give Magnanimous or the specialist a difficult question, edge case, failure mode, or real-world scenario…"/></label><label>Expected strong outcome<textarea value={expected} onChange={e=>setExpected(e.target.value)} placeholder="Describe what a strong answer should contain or accomplish…"/></label></div>
  <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
  <div className="foot"><p>No account is required. Common personal identifiers and credentials are not needed; do not submit passwords, API keys, payment details, or private records.</p><button type="button" disabled={busy||!selected} onClick={submit}>{busy?'Submitting…':'Submit Teaching for Owner Review →'}</button></div>
  <style jsx>{`
   *{box-sizing:border-box}.teach{max-width:1180px;margin:28px auto 60px;padding:24px;border:1px solid rgba(96,224,255,.26);border-radius:22px;background:linear-gradient(145deg,rgba(5,17,31,.97),rgba(4,11,20,.99));color:#e8faff;font-family:Inter,system-ui,sans-serif;box-shadow:0 24px 70px rgba(0,0,0,.28)}.head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.head small{font-size:9px;letter-spacing:.18em;color:#6ee7ff}.head h2{font-size:clamp(28px,4vw,44px);margin:6px 0 9px}.head p{max-width:780px;margin:0;color:#8fb0bf;line-height:1.6;font-size:12px}.badge{border:1px solid rgba(255,213,115,.42);border-radius:999px;padding:7px 10px;color:#ffe19a;font-size:8px;font-weight:900;letter-spacing:.08em;white-space:nowrap}.notice{margin-top:14px;padding:11px 13px;border-radius:10px;font-size:11px}.ok{border:1px solid #2e644b;background:#0b2117;color:#bff4d1}.bad{border:1px solid #713b45;background:#271116;color:#ffc2ca}.grid,.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}label{display:block;color:#88a5b2;font-size:9px;letter-spacing:.02em}input,select,textarea{display:block;width:100%;margin-top:6px;border:1px solid #244a5d;border-radius:10px;background:#030a12;color:#edfaff;padding:11px;font:inherit}textarea{min-height:115px;resize:vertical}.agent{margin:12px 0;color:#718f9d;font-size:10px}.agent b{color:#9cecff}.hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.foot{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:14px}.foot p{margin:0;max-width:720px;color:#6f8a96;font-size:9px;line-height:1.5}.foot button{border:0;border-radius:11px;background:#dffbff;color:#031019;padding:12px 16px;font-weight:950;cursor:pointer}.foot button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:760px){.teach{margin:20px 12px 46px;padding:18px}.head,.foot{display:block}.badge{display:inline-block;margin-top:12px}.grid,.two{grid-template-columns:1fr}.foot button{width:100%;margin-top:12px}}
  `}</style>
 </section>
}
