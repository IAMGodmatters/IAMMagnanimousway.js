'use client';
import {useEffect,useMemo,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Branch={identity?:string;mission?:string;core_skills?:string[];operating_method?:string[];learning_policy?:string[];relationship?:string};
type Agent={id:string;name:string;title:string;description:string;group:string;branch?:Branch};
type Lesson={id:number;title:string;content:string;tags:string;source:string;updated_at:number};
type Detail={agent?:Agent;knowledge?:Lesson[];knowledge_count?:number;can_teach?:boolean;shared_core?:string};

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}
function chunks(text:string,size=28000){const clean=text.trim();if(!clean)return[];const out:string[]=[];for(let i=0;i<clean.length;i+=size)out.push(clean.slice(i,i+size));return out}
function sourceLabel(value:string){return value==='sop'?'SOP / Procedure':value==='policy'?'Policy / Rules':value==='examples'?'Examples / Gold Answers':value==='reference'?'Book / Reference':value==='outsourced-trainer'?'Outsourced Trainer':'Developer Lesson'}

export default function OwnerAiAcademy(){
 const[token,setToken]=useState(''),[agents,setAgents]=useState<Agent[]>([]),[selected,setSelected]=useState(''),[detail,setDetail]=useState<Detail>({}),[title,setTitle]=useState(''),[tags,setTags]=useState(''),[source,setSource]=useState('developer-teaching'),[content,setContent]=useState(''),[url,setUrl]=useState(''),[test,setTest]=useState(''),[testAnswer,setTestAnswer]=useState(''),[busy,setBusy]=useState(''),[msg,setMsg]=useState(''),[error,setError]=useState('');
 const agent=useMemo(()=>agents.find(a=>a.id===selected)||detail.agent,[agents,selected,detail.agent]);

 async function loadBranch(id:string,t=token){
  if(!id||!t)return;
  const r=await fetch(`${api}/api/agents/branch?agent_id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'});
  const d=await read(r);
  if(r.status===401||r.status===403){location.replace('/owner-login');return}
  if(!r.ok){setError(d.detail||'Branch training could not be loaded.');return}
  setDetail(d);setError('');
 }
 async function load(t:string){
  const r=await fetch(`${api}/api/agents`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'});const d=await read(r);
  if(!r.ok){location.replace('/owner-login');return}
  const list:Agent[]=d.agents||[];setAgents(list);const first=list[0]?.id||'';setSelected(first);if(first)await loadBranch(first,t);
 }
 useEffect(()=>{const t=localStorage.getItem('odin_admin_token')||'';if(!t){location.replace('/owner-login');return}setToken(t);load(t)},[]);
 useEffect(()=>{if(token&&selected)loadBranch(selected)},[selected]);

 async function filePicked(files:FileList|null){
  if(!files?.length)return;
  setError('');const parts:string[]=[];const names:string[]=[];
  for(const file of Array.from(files)){
   const ext=file.name.toLowerCase().split('.').pop()||'';
   if(!['txt','md','markdown','csv','json','html','htm','xml','log','yaml','yml'].includes(ext)){setError('Text-based training files are supported here. For PDF, DOCX, audio, or video, paste the extracted/transcribed text or teach from a public webpage URL.');continue}
   if(file.size>2_000_000){setError(`${file.name} is too large. Keep each text training file under 2 MB.`);continue}
   const text=await file.text();if(text.trim()){names.push(file.name);parts.push(`SOURCE FILE: ${file.name}\n\n${text.trim()}`)}
  }
  if(parts.length){setContent(v=>[v,...parts].filter(Boolean).join('\n\n---\n\n'));if(!title)setTitle(names.length===1?names[0]:`${names.length} uploaded training files`);setMsg(`${parts.length} training file${parts.length===1?'':'s'} loaded for review before teaching.`)}
 }

 async function teach(){
  if(!selected){setError('Choose a specialist branch.');return}
  if(!content.trim()&&!url.trim()){setError('Add training text, a supported text file, or a public webpage URL.');return}
  setBusy('teach');setError('');setMsg('');
  try{
   if(url.trim()&&!content.trim()){
    const r=await fetch(`${api}/api/agents/branch/teach`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({agent_id:selected,title:title.trim(),tags:tags.split(',').map(x=>x.trim()).filter(Boolean),source,url:url.trim()})});
    const d=await read(r);if(!r.ok)throw new Error(d.detail||'Web training could not be saved.');
   }else{
    const pieces=chunks(content);for(let i=0;i<pieces.length;i++){
     const partTitle=pieces.length>1?`${title.trim()||`${agent?.name||'Branch'} lesson`} — part ${i+1} of ${pieces.length}`:(title.trim()||`${agent?.name||'Branch'} lesson`);
     const r=await fetch(`${api}/api/agents/branch/teach`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({agent_id:selected,title:partTitle,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),source,content:pieces[i]})});
     const d=await read(r);if(!r.ok)throw new Error(d.detail||`Training part ${i+1} could not be saved.`);
    }
   }
   setTitle('');setTags('');setContent('');setUrl('');setMsg(`${agent?.name||'Specialist'} absorbed the approved training into its own branch knowledge.`);await loadBranch(selected);
  }catch(e:any){setError(e?.message||'Training could not be saved.')}finally{setBusy('')}
 }

 async function removeLesson(id:number){
  setBusy(`delete-${id}`);setError('');
  try{const r=await fetch(`${api}/api/agents/branch/knowledge?agent_id=${encodeURIComponent(selected)}&id=${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});const d=await read(r);if(!r.ok)throw new Error(d.detail||'Lesson could not be removed.');setMsg('Branch lesson removed.');await loadBranch(selected)}catch(e:any){setError(e?.message||'Lesson could not be removed.')}finally{setBusy('')}
 }
 async function testBranch(){
  if(!test.trim())return;setBusy('test');setError('');setTestAnswer('');
  try{const r=await fetch(`${api}/api/agents/chat`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({agent_id:selected,message:test.trim(),provider:'auto'})});const d=await read(r);if(!r.ok)throw new Error(d.detail||'Branch test failed.');setTestAnswer(String(d.output||''));if(d.agent?.id&&d.agent.id!==selected)setSelected(d.agent.id)}catch(e:any){setError(e?.message||'Branch test failed.')}finally{setBusy('')}
 }

 const profile=detail.agent?.branch||agent?.branch||{};
 return <main className="academy">
  <header><a href="/owner-center">← Owner Center</a><span>PRIVATE DEVELOPER TRAINING</span><a href="/agents">Open AI Team →</a></header>
  <section className="hero"><div><small>I AM MAGNANIMOUS WAY™ • MAGNANIMOUS AI™</small><h1>Owner AI Academy</h1><p>Magnanimous is the shared core brain. Train each named AI as a permanent specialist branch with its own responsibilities, procedures, examples and learned knowledge.</p></div><div className="stat"><b>{agents.length}</b><span>SPECIALIST BRANCHES</span><b>{detail.knowledge_count||0}</b><span>LESSONS IN ACTIVE BRANCH</span></div></section>
  {msg&&<div className="msg ok">{msg}</div>}{error&&<div className="msg err">{error}</div>}
  <section className="layout">
   <aside><small>CHOOSE BRANCH</small><div className="agents">{agents.map(a=><button key={a.id} className={selected===a.id?'active':''} onClick={()=>setSelected(a.id)}><b>{a.name}</b><span>{a.title}</span></button>)}</div></aside>
   <div className="workspace">
    <section className="profile"><div><small>ACTIVE SPECIALIST BRANCH</small><h2>{agent?.name||'Loading…'} <span>{agent?.title}</span></h2><p>{profile.identity||agent?.description}</p></div><div className="profileGrid"><div><b>MISSION</b><p>{profile.mission||agent?.description}</p></div><div><b>CORE SKILLS</b><ul>{(profile.core_skills||[]).map(x=><li key={x}>{x}</li>)}</ul></div><div><b>OPERATING METHOD</b><ol>{(profile.operating_method||[]).map(x=><li key={x}>{x}</li>)}</ol></div><div><b>LEARNING RULES</b><ul>{(profile.learning_policy||[]).map(x=><li key={x}>{x}</li>)}</ul></div></div></section>
    <section className="teach"><div className="head"><div><small>TEACH THIS BRANCH</small><h3>Add approved knowledge</h3></div><span>{detail.can_teach===false?'READ ONLY':'OWNER / ADMIN'}</span></div><div className="formGrid"><label>Lesson title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder={`${agent?.name||'Branch'} SOP, playbook, reference…`}/></label><label>Training type<select value={source} onChange={e=>setSource(e.target.value)}><option value="developer-teaching">Developer Lesson</option><option value="sop">SOP / Procedure</option><option value="policy">Policy / Rules</option><option value="examples">Examples / Gold Answers</option><option value="reference">Book / Reference</option><option value="outsourced-trainer">Outsourced Trainer</option></select></label></div><label>Skill tags<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="sales, discovery, objection handling"/></label><label>Training material<textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste the lesson, SOP, examples, reference notes, or approved training here…"/></label><div className="sources"><label className="file">Upload text training<input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.log,.yaml,.yml,text/plain,text/markdown,text/csv,application/json" onChange={e=>filePicked(e.target.files)}/></label><span>OR</span><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Public webpage URL to absorb"/></div><p className="hint">Large text is automatically divided into branch lessons. For PDF, DOCX, audio or video, paste extracted/transcribed text. Webpage teaching accepts public text/HTML sources and blocks private-network addresses.</p><button className="primary" disabled={busy==='teach'||detail.can_teach===false} onClick={teach}>{busy==='teach'?'Teaching branch…':`Teach ${agent?.name||'Branch'} →`}</button></section>
    <section className="test"><div className="head"><div><small>VERIFY THE TRAINING</small><h3>Test this specialist</h3></div></div><textarea value={test} onChange={e=>setTest(e.target.value)} placeholder={`Ask ${agent?.name||'this branch'} something that should use its specialty or newly taught knowledge…`}/><button onClick={testBranch} disabled={busy==='test'||!test.trim()}>{busy==='test'?'Testing…':'Run Specialist Test →'}</button>{testAnswer&&<article><small>{agent?.name||'BRANCH'} ANSWER</small><p>{testAnswer}</p></article>}</section>
    <section className="library"><div className="head"><div><small>BRANCH MEMORY</small><h3>{detail.knowledge_count||0} learned lesson{detail.knowledge_count===1?'':'s'}</h3></div></div>{!detail.knowledge?.length?<p className="empty">No extra developer training has been added yet. The branch still starts with its built-in curriculum.</p>:detail.knowledge.map(k=><article key={k.id}><div><b>{k.title||`Lesson #${k.id}`}</b><small>{sourceLabel(k.source)}{k.tags?` • ${k.tags}`:''}</small><p>{k.content}</p></div><button disabled={busy===`delete-${k.id}`||detail.can_teach===false} onClick={()=>removeLesson(k.id)}>{busy===`delete-${k.id}`?'Removing…':'Remove'}</button></article>)}</section>
   </div>
  </section>
  <style jsx>{`
   *{box-sizing:border-box}.academy{min-height:100vh;background:#05090d;color:#eaf7ff;padding:24px 30px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 0,rgba(64,211,255,.09),transparent 30%),linear-gradient(rgba(73,198,230,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(73,198,230,.025) 1px,transparent 1px);background-size:auto,38px 38px,38px 38px}header,.hero,.layout,.msg{max-width:1450px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:15px;color:#628797;font-size:9px;letter-spacing:.15em}header a{color:#72dff5;text-decoration:none}.hero{margin-top:28px;padding:34px;border:1px solid #1c4858;border-radius:22px;background:linear-gradient(135deg,#07151d,#080b0f);display:flex;justify-content:space-between;gap:28px}.hero small,.profile small,.head small,aside>small{color:#4fc9e4;font-size:9px;letter-spacing:.18em}.hero h1{font-size:clamp(42px,6vw,72px);line-height:.95;margin:8px 0 16px}.hero p{max-width:800px;color:#829da8;line-height:1.6}.stat{min-width:210px;display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-content:center}.stat b{font-size:28px;color:#a8f3ff}.stat span{font-size:8px;color:#668793;align-self:center}.msg{margin-top:12px;padding:11px 14px;border-radius:10px}.ok{border:1px solid #315b48;background:#0c1b16;color:#a3efc9}.err{border:1px solid #63313a;background:#211014;color:#ffb8c0}.layout{display:grid;grid-template-columns:270px 1fr;gap:12px;margin-top:12px}aside,.profile,.teach,.test,.library{border:1px solid #173844;background:#071017;border-radius:16px}aside{padding:14px;align-self:start;position:sticky;top:16px}.agents{display:grid;gap:5px;margin-top:10px;max-height:78vh;overflow:auto}.agents button{border:1px solid transparent;background:#071017;color:#9bb1bb;border-radius:9px;padding:9px 10px;text-align:left;cursor:pointer}.agents button b,.agents button span{display:block}.agents button b{font-size:11px}.agents button span{font-size:8px;color:#647f89;margin-top:2px}.agents button.active{border-color:#2d7185;background:#0d2732;color:#fff}.workspace{display:grid;gap:12px}.profile,.teach,.test,.library{padding:20px}.profile h2{font-size:28px;margin:5px 0}.profile h2 span{font-size:12px;color:#799aa7;font-weight:500}.profile>div>p{color:#87a2ad;line-height:1.55}.profileGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.profileGrid>div{border:1px solid #17333e;border-radius:11px;padding:13px;background:#050c11}.profileGrid b{font-size:9px;color:#6bd9ec;letter-spacing:.12em}.profileGrid p,.profileGrid li{color:#839aa4;font-size:10px;line-height:1.5}.profileGrid ul,.profileGrid ol{padding-left:18px}.head{display:flex;justify-content:space-between;align-items:start;gap:12px}.head h3{margin:4px 0 10px;font-size:22px}.head>span{border:1px solid #285b6b;border-radius:999px;padding:6px 9px;color:#85ddeb;font-size:8px}.formGrid{display:grid;grid-template-columns:1fr 240px;gap:10px}label{display:block;color:#7895a0;font-size:10px;margin:9px 0}input,textarea,select{display:block;width:100%;margin-top:5px;border:1px solid #234653;border-radius:9px;background:#040a0e;color:#e9fbff;padding:11px;font:inherit}textarea{min-height:145px;resize:vertical}.sources{display:grid;grid-template-columns:220px auto 1fr;gap:8px;align-items:center}.sources>span{font-size:9px;color:#57727c}.file{border:1px dashed #2d6172;border-radius:9px;padding:11px;color:#83dced;cursor:pointer;margin:0}.file input{display:none}.hint{color:#617b85;font-size:9px;line-height:1.5}.primary,.test>button{border:0;border-radius:9px;background:#dffaff;color:#061115;padding:12px 15px;font-weight:900;cursor:pointer}.primary:disabled,.test>button:disabled,.library article button:disabled{opacity:.45;cursor:not-allowed}.test textarea{min-height:80px}.test article{margin-top:12px;border:1px solid #245064;border-radius:12px;background:#081922;padding:15px}.test article small{font-size:8px;color:#65d8ed;letter-spacing:.14em}.test article p{white-space:pre-wrap;line-height:1.6;color:#cce9f2}.library article{display:grid;grid-template-columns:1fr auto;gap:14px;border-top:1px solid #19343f;padding:14px 0}.library article b{display:block;color:#d9f7ff}.library article small{display:block;color:#5f8492;font-size:8px;margin:4px 0 8px}.library article p{white-space:pre-wrap;max-height:170px;overflow:auto;color:#78939e;font-size:10px;line-height:1.5}.library article button{align-self:start;border:1px solid #5a3036;background:#241115;color:#ffb7c0;border-radius:8px;padding:8px 10px;cursor:pointer}.empty{color:#708a95}@media(max-width:900px){.layout{grid-template-columns:1fr}aside{position:static}.agents{grid-template-columns:repeat(2,1fr);max-height:300px}.profileGrid{grid-template-columns:1fr}.hero{display:block}.stat{margin-top:16px}}@media(max-width:620px){.academy{padding:17px 12px 50px}.formGrid,.sources{grid-template-columns:1fr}.sources>span{display:none}.agents{grid-template-columns:1fr}.hero{padding:24px}header{flex-wrap:wrap}}
  `}</style>
 </main>
}
