'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

type Resource={id:string;title:string;provider:string;kind:string;description:string;url:string;phase:string;video:boolean};
const resources:Resource[]=[
{id:'scratch',title:'AI Engineering from Scratch',provider:'Rohit Ghumare and contributors',kind:'Open-source curriculum',description:'A code-first path through AI foundations, machine learning, deep learning, LLMs, agents, MCP and production engineering. The source project is MIT-licensed; follow its notices when reusing material.',url:'https://github.com/rohitg00/ai-engineering-from-scratch',phase:'Core curriculum',video:false},
{id:'karpathy',title:'Neural Networks: Zero to Hero',provider:'Andrej Karpathy',kind:'Video lecture series',description:'Build neural networks from the ground up, including backpropagation, language models and GPT.',url:'https://karpathy.ai/zero-to-hero.html',phase:'Neural networks',video:true},
{id:'3b1b',title:'Neural Networks',provider:'3Blue1Brown',kind:'Visual video lessons',description:'Intuitive visual explanations of neural networks, gradient descent and backpropagation.',url:'https://www.3blue1brown.com/topics/neural-networks',phase:'Neural networks',video:true},
{id:'mit',title:'Introduction to Deep Learning — 6.S191',provider:'MIT',kind:'University lectures and labs',description:'Deep learning lectures, slides and hands-on labs covering modern neural networks and generative models.',url:'https://introtodeeplearning.com/',phase:'Deep learning',video:true},
{id:'stanford',title:'Transformers United — CS25',provider:'Stanford University',kind:'Guest lectures and recordings',description:'Research talks on transformers, language models, retrieval and emerging AI systems.',url:'https://web.stanford.edu/class/cs25/recordings/',phase:'Transformers and LLMs',video:true},
{id:'microsoft',title:'Generative AI for Beginners',provider:'Microsoft',kind:'Video and coding lessons',description:'A practical 21-lesson course with short video introductions, written explanations and Python/TypeScript examples.',url:'https://microsoft.github.io/generative-ai-for-beginners/',phase:'Generative AI',video:true},
{id:'google',title:'Machine Learning Crash Course',provider:'Google',kind:'Interactive lessons',description:'Visual explanations, exercises and hands-on work for core machine-learning concepts.',url:'https://developers.google.com/machine-learning/crash-course/',phase:'Machine learning',video:false},
{id:'hfllm',title:'Large Language Models Course',provider:'Hugging Face',kind:'Open online course',description:'Learn NLP and LLM foundations and work with Transformers, Datasets, Tokenizers and the Hub.',url:'https://huggingface.co/learn/llm-course/',phase:'LLM engineering',video:false},
{id:'hfagents',title:'AI Agents Course',provider:'Hugging Face',kind:'Open online course',description:'Learn agent fundamentals, practical design and tool-using agent libraries.',url:'https://huggingface.co/learn/agents-course/en/unit0/introduction',phase:'AI agents',video:false},
{id:'hfcontext',title:'Context Engineering Course',provider:'Hugging Face',kind:'Open online course',description:'Explore context, skills, MCP, subagents, training, inference and datasets.',url:'https://huggingface.co/context-course',phase:'Agents and MCP',video:false}
];
const pathways=[
{title:'AI Literacy',level:'Beginner',outcome:'Understand AI, use it responsibly and judge whether an AI answer is reliable.',steps:['What AI can and cannot do','Prompting and source checking','Privacy, safety and responsible use']},
{title:'AI Foundations',level:'Beginner → Intermediate',outcome:'Understand the data, math and machine-learning ideas behind modern AI.',steps:['Python and data basics','Math and machine-learning foundations','Neural networks and model evaluation']},
{title:'AI Engineer',level:'Technical',outcome:'Build, test and explain a working AI application.',steps:['Deep learning and transformers','LLM applications and retrieval','Evaluation, deployment and monitoring']},
{title:'AI Agent Developer',level:'Advanced',outcome:'Build bounded agents that use tools safely and leave an audit trail.',steps:['Agent loops and tool use','MCP and portable agent skills','Permissions, testing and cost controls']}
];
const phases=['Orientation and Python','Math, data and machine learning','Neural networks and deep learning','NLP, transformers and LLMs','Retrieval and LLM applications','Agents, tools and MCP','Safety, evaluation and deployment','Capstone and portfolio'];

export default function MagnanimousAICollege(){
 const router=useRouter();
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState('All');
 const [done,setDone]=useState<string[]>([]);
 const [active,setActive]=useState('AI Engineer');
 const [hydrated,setHydrated]=useState(false);
 const [authToken,setAuthToken]=useState('');
 const [progressRecordId,setProgressRecordId]=useState('');
 const [migrationKey,setMigrationKey]=useState('');
 const [migrationPending,setMigrationPending]=useState(false);
 const [syncStatus,setSyncStatus]=useState<'local'|'loading'|'account'|'error'>('local');
 const [syncMessage,setSyncMessage]=useState('Progress is saved on this device. Sign in to sync it with your account.');
 useEffect(()=>{try{const raw=localStorage.getItem('magnanimous-college-open-progress-v1');if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setDone(parsed.filter(x=>typeof x==='string'&&resources.some(r=>r.id===x)));}}catch{}setHydrated(true);setAuthToken(getPlatformAuthToken())},[]);
 useEffect(()=>{if(hydrated){try{localStorage.setItem('magnanimous-college-open-progress-v1',JSON.stringify(done))}catch{}}},[done,hydrated]);
 useEffect(()=>{
  if(!hydrated||!authToken)return;
  let cancelled=false;
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+authToken};
  const request=async(path:string,init:RequestInit={})=>{const response=await fetch((process.env.NEXT_PUBLIC_API_BASE_URL||'')+path,{...init,headers:{...headers,...(init.headers||{})},cache:'no-store'});const raw=await response.text();let data:any={};try{data=JSON.parse(raw)}catch{}if(response.status===401){router.replace('/login?returnTo=%2Fai-college');throw new Error('Your session expired. Please sign in again.')}if(!response.ok)throw new Error(data.detail||'Account progress could not be loaded.');return data};
  (async()=>{
   setSyncStatus('loading');setSyncMessage('Connecting your private study record…');
   try{
    const workspaces=await request('/api/operations/workspaces');
    let workspace=workspaces.items?.find((x:any)=>x.kind==='college-progress');
    if(!workspace){const created=await request('/api/operations/workspaces',{method:'POST',body:JSON.stringify({name:'My Magnanimous AI College Progress',kind:'college-progress',description:'Private student learning progress and resource completion marks.'})});workspace=created.item}
    if(!workspace?.id)throw new Error('Your private study workspace could not be opened.');
    const boards=await request('/api/operations/boards?workspace_id='+encodeURIComponent(workspace.id));
    let board=boards.items?.find((x:any)=>x.kind==='college-progress');
    if(!board){const created=await request('/api/operations/boards',{method:'POST',body:JSON.stringify({workspace_id:workspace.id,name:'My Study Progress',singular_name:'study record',kind:'college-progress',description:'Private course and resource completion records.'})});board=created.item}
    if(!board?.id)throw new Error('Your private study record could not be opened.');
    const records=await request('/api/operations/records?board_id='+encodeURIComponent(board.id)+'&limit=500');
    const existing=records.items?.find((x:any)=>x.data?.kind==='college-progress');
    if(existing?.id){
     const saved=Array.isArray(existing.data?.done)?existing.data.done.filter((x:any)=>typeof x==='string'&&resources.some(r=>r.id===x)):[];
     const key='magnanimous-college-migrated-v1:'+existing.id;
     let migrated=false;try{migrated=localStorage.getItem(key)==='1'}catch{}
     const restored=migrated?saved:[...new Set([...saved,...done])];
     if(!cancelled){setDone(restored);setProgressRecordId(existing.id);setMigrationKey(key);setMigrationPending(!migrated);setSyncStatus('account');setSyncMessage('Your study progress is connected to your signed-in account.');}
    }else{
     const initial=done.filter(x=>resources.some(r=>r.id===x));
     const created=await request('/api/operations/records',{method:'POST',body:JSON.stringify({board_id:board.id,title:'Open Campus study progress',status:'active',data:{kind:'college-progress',done:initial,resource_ids:resources.map(r=>r.id),schema_version:1}})});
     if(!created.item?.id)throw new Error('Your study progress record could not be created.');
     if(!cancelled){setProgressRecordId(created.item.id);setMigrationKey('magnanimous-college-migrated-v1:'+created.item.id);setMigrationPending(true);setSyncStatus('account');setSyncMessage('Your study progress is now connected to your signed-in account.');}
    }
   }catch(error){if(!cancelled){setSyncStatus('error');setSyncMessage(error instanceof Error?error.message+' Your browser copy is still available.':'Account sync failed. Your browser copy is still available.');}}
  })();
  return()=>{cancelled=true};
 },[hydrated,authToken,router]);
 useEffect(()=>{
  if(syncStatus!=='account'||!progressRecordId||!authToken)return;
  const timer=setTimeout(async()=>{
   try{
    const response=await fetch((process.env.NEXT_PUBLIC_API_BASE_URL||'')+'/api/operations/records/'+encodeURIComponent(progressRecordId),{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authToken},body:JSON.stringify({data:{kind:'college-progress',done,resource_ids:resources.map(r=>r.id),schema_version:1}}),cache:'no-store'});
    if(response.status===401){router.replace('/login?returnTo=%2Fai-college');throw new Error('Your session expired. Please sign in again.')}if(!response.ok)throw new Error('Progress sync could not be confirmed.');
    if(migrationPending&&migrationKey){try{localStorage.setItem(migrationKey,'1')}catch{}setMigrationPending(false)}
    setSyncMessage('Your study progress is saved to your signed-in account.');
   }catch{setSyncStatus('error');setSyncMessage('Account sync could not be confirmed. Your browser copy remains available.');}
  },300);
  return()=>clearTimeout(timer);
 },[done,progressRecordId,authToken,syncStatus,router,migrationPending,migrationKey]);
 const filtered=useMemo(()=>resources.filter(r=>(filter==='All'||(filter==='Videos'&&r.video)||(filter==='Courses'&&!r.video))&&[r.title,r.provider,r.description,r.phase].join(' ').toLowerCase().includes(query.toLowerCase())),[filter,query]);
 const total=resources.length;
 const progress=Math.round(done.length/total*100);
 const path=pathways.find(x=>x.title===active)||pathways[2];
 function toggle(id:string){setDone(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id])}
 return <main className="college">
  <nav><a href="/">← I AM MAGNANIMOUS WAY™</a><span>OPEN CAMPUS · MAGNANIMOUS AI COLLEGE</span></nav>
  <section className="hero">
   <div className="eyebrow">LEARN IT · BUILD IT · PROVE IT</div>
   <h1>Build your future<br/><em>with AI.</em></h1>
   <p>Learn artificial intelligence through free lectures, open courses and practical projects—with Magnanimous AI as your learning guide.</p>
   <div className="heroActions"><a className="primary" href="#pathways">Choose your learning path</a><a className="secondary" href="#library">Explore free lessons</a></div>
   <div className="heroNote"><b>OPEN CAMPUS</b><span>Free learning sources · No course paywall · Learn at your own pace</span></div>
  </section>
  <section className="intro">
   <div><small>THE MAGNANIMOUS METHOD</small><h2>Don't just watch. Become a builder.</h2><p>Every learning block moves from a trusted source to your own explanation, a hands-on exercise, a test and evidence of what you built. Watching a video alone never counts as proof of mastery.</p></div>
   <div className="cycle">{['Learn','Explain','Build','Test','Reflect'].map((x,i)=><div key={x}><b>0{i+1}</b><strong>{x}</strong></div>)}</div>
  </section>
  <section id="pathways" className="section">
   <div className="sectionHead"><div><small>START WHERE YOU ARE</small><h2>Choose your school</h2></div><span>4 learning pathways</span></div>
   <div className="pathGrid">{pathways.map(p=><button key={p.title} onClick={()=>setActive(p.title)} className={active===p.title?'path active':'path'}><span>{p.level}</span><strong>{p.title}</strong><p>{p.outcome}</p><i>{p.steps.length} learning blocks →</i></button>)}</div>
   <article className="pathDetail"><div><small>YOUR SELECTED PATH</small><h3>{path.title}</h3><p>{path.outcome}</p></div><ol>{path.steps.map(x=><li key={x}>{x}</li>)}</ol></article>
  </section>
  <section id="library" className="section">
   <div className="sectionHead"><div><small>CREATOR-OWNED FREE MATERIAL</small><h2>Free learning library</h2><p>Open the original source. Videos remain hosted by their creators.</p></div><span>{total} curated resources</span></div>
   <div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search topics, teachers or courses…" aria-label="Search learning resources"/><div>{['All','Videos','Courses'].map(x=><button key={x} onClick={()=>setFilter(x)} className={filter===x?'chosen':''}>{x}</button>)}</div></div>
   <div className="resourceGrid">{filtered.map(r=><article className="resource" key={r.id}><div className="resourceTop"><span>{r.phase}</span><span>{r.video?'VIDEO / LECTURE':'COURSE / CODE'}</span></div><h3>{r.title}</h3><b>{r.provider}</b><p>{r.description}</p><div className="resourceActions"><button onClick={()=>toggle(r.id)} disabled={syncStatus==='loading'} className={done.includes(r.id)?'complete':''}>{done.includes(r.id)?'✓ Marked studied':'Mark studied'}</button><a href={r.url} target="_blank" rel="noopener noreferrer">Open official source ↗</a></div></article>)}</div>
   {!filtered.length&&<p className="empty">No resources match that search. Try another topic.</p>}
   <p className="rights">Respect for creators: this campus links to official resources and permitted official players. It does not download, mirror, re-upload or sell third-party videos. MIT-licensed source code is reused only with required license notices and attribution.</p>
  </section>
  <section className="section study">
   <div><small>YOUR STUDY RECORD</small><h2>Keep moving forward.</h2><p>Your learning resources remain free to open. Study marks are kept in this browser and, when you sign in successfully, copied into your private Magnanimous account workspace. This is a learning-progress record, not an accredited transcript or degree.</p><p role="status" aria-live="polite" style={{fontSize:11,color:syncStatus==='account'?'#9ce1c7':syncStatus==='error'?'#f1bd8c':'#b9c9d8'}}>{syncMessage}</p>{!authToken&&<a href="/login?returnTo=%2Fai-college" style={{color:'#e7d092',fontSize:11,fontWeight:800}}>Sign in to sync study progress ↗</a>}</div>
   <div className="progress"><div className="progressTop"><b>{done.length} of {total}</b><span>resources marked studied</span></div><div className="track"><i style={{width:progress+'%'}}/></div><strong>{progress}%</strong><button onClick={()=>setDone([])} disabled={!done.length||syncStatus==='loading'}>Reset study marks</button></div>
  </section>
  <section className="section roadmap">
   <div className="sectionHead"><div><small>AI ENGINEER ROADMAP</small><h2>From first steps to a capstone.</h2></div><span>Illustrative sequence</span></div>
   <div className="phaseGrid">{phases.map((x,i)=><div key={x}><b>{String(i+1).padStart(2,'0')}</b><strong>{x}</strong></div>)}</div>
   <p className="disclaimer">Study time varies with your background and pace. This is an independent learning program, not an accredited university degree. Certificates, when offered, will document completion of Magnanimous coursework only.</p>
  </section>
  <section className="footerCta"><small>YOUR AI LEARNING GUIDE</small><h2>Ask Magnanimous to help you learn.</h2><p>Bring a concept, code problem or lesson you are working through. Ask for an explanation, hints or a practice challenge—not just the answer.</p><a href="/ai-chat?prompt=Act%20as%20my%20AI%20college%20tutor.%20Ask%20my%20current%20skill%20level%20and%20learning%20goal%2C%20then%20teach%20me%20with%20questions%2C%20hints%2C%20practice%20and%20feedback.">Open Magnanimous AI tutor ↗</a></section>
  <footer><span>GOD MATTERS · I AM MAGNANIMOUS WAY™</span><span>Independent online AI learning program · Third-party materials belong to their creators</span></footer>
  <style jsx>{`
  .college{min-height:100vh;background:#06101e;color:#edf5ff;padding:26px clamp(16px,4vw,64px) 50px;font-family:Inter,system-ui,sans-serif}
  nav{max-width:1240px;margin:auto;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#9ab1c8;font-size:10px;letter-spacing:.14em}nav a{color:#e7d19b;text-decoration:none;font-weight:800;letter-spacing:.04em}
  .hero{max-width:1240px;margin:28px auto 16px;padding:clamp(28px,6vw,72px);border:1px solid #25415f;border-radius:26px;background:radial-gradient(ellipse at 78% 12%,rgba(25,111,163,.38),transparent 42%),linear-gradient(125deg,#10243c,#071322 65%,#12213a);box-shadow:0 25px 70px #0006}
  .eyebrow,.section small,.intro small,.study small,.footerCta small{font-size:10px;letter-spacing:.2em;font-weight:900;color:#e4c77f}
  h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.055em;margin:20px 0}h1 em{font-style:normal;color:#e8ce8d}
  .hero>p{max-width:670px;font-size:clamp(15px,2vw,19px);line-height:1.7;color:#b7c9db}
  .heroActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.heroActions a,.footerCta>a{padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:850;font-size:12px}.primary{background:#e5c77f;color:#101b2a}.secondary{border:1px solid #52718f;color:#e8f1fa}
  .heroNote{display:flex;gap:12px;flex-wrap:wrap;margin-top:40px;padding-top:17px;border-top:1px solid #ffffff24;color:#b8c9d8;font-size:11px}.heroNote b{color:#e7ce8d;letter-spacing:.12em}
  .intro,.section{max-width:1240px;margin:16px auto;padding:32px;border:1px solid #20354e;border-radius:20px;background:#0b1929}.intro{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center}.intro h2,.section h2,.footerCta h2{font-size:clamp(25px,4vw,38px);letter-spacing:-.035em;margin:9px 0}.intro p,.sectionHead p,.study p,.footerCta p{color:#aabbd0;line-height:1.65;font-size:13px;max-width:650px}
  .cycle{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.cycle div{background:#122941;border:1px solid #2a4764;padding:14px 8px;border-radius:12px}.cycle b,.cycle strong{display:block}.cycle b{font-size:9px;color:#e4c77f}.cycle strong{font-size:11px;margin-top:12px}
  .sectionHead{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:20px}.sectionHead>span{font-size:10px;color:#91a8be}.pathGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.path{background:#101f32;color:#eaf3fc;text-align:left;border:1px solid #29415c;border-radius:14px;padding:18px;cursor:pointer}.path.active{border-color:#e4c77f;background:#172b40;box-shadow:inset 0 0 0 1px #e4c77f55}.path span,.path strong,.path i{display:block}.path span{color:#e4c77f;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.path strong{font-size:17px;margin:12px 0 7px}.path p{font-size:11px;color:#aabbd0;line-height:1.5;min-height:50px}.path i{font-style:normal;color:#d6c18c;font-size:10px;font-weight:800}
  .pathDetail{margin-top:12px;padding:22px;border-radius:14px;background:#14263a;display:grid;grid-template-columns:1fr 1fr;gap:20px}.pathDetail h3{font-size:24px;margin:8px 0}.pathDetail p{color:#aabbd0;font-size:12px;line-height:1.6}.pathDetail ol{margin:0;padding-left:20px;color:#d9e4ef;font-size:12px;line-height:2}
  .filters{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:15px 0}.filters input{flex:1;min-width:220px;background:#071321;color:white;border:1px solid #314963;border-radius:9px;padding:12px;font:inherit;font-size:12px}.filters div{display:flex;gap:5px}.filters button,.resourceActions button,.progress button{background:#14263a;color:#cbd9e7;border:1px solid #38516b;border-radius:8px;padding:9px 12px;font-size:10px;cursor:pointer}.filters button.chosen{background:#e4c77f;color:#122033;border-color:#e4c77f}
  .resourceGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.resource{padding:19px;border:1px solid #29415a;border-radius:14px;background:#0e2033}.resourceTop{display:flex;justify-content:space-between;gap:8px;color:#d9bd79;font-size:8px;letter-spacing:.1em;text-transform:uppercase}.resource h3{font-size:18px;margin:14px 0 5px}.resource>b{font-size:10px;color:#8eb5d1}.resource p{font-size:11px;line-height:1.6;color:#afbed0;min-height:53px}.resourceActions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:15px}.resourceActions a{font-size:10px;color:#e7d092;font-weight:800;text-decoration:none}.resourceActions button.complete{border-color:#4e9b82;color:#9ce1c7}.rights,.disclaimer{margin-top:18px;color:#8197ac;font-size:10px;line-height:1.7}.empty{padding:20px;color:#aabbd0}
  .study{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:center}.progress{padding:20px;border:1px solid #2a4560;border-radius:14px;background:#10243a}.progressTop{display:flex;justify-content:space-between;font-size:11px;color:#b9c9d8}.track{height:8px;background:#263c53;border-radius:99px;margin:16px 0;overflow:hidden}.track i{display:block;height:100%;background:#e4c77f;border-radius:99px}.progress>strong{font-size:22px;color:#e4c77f}.progress button{float:right}
  .phaseGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.phaseGrid div{padding:16px;border-radius:12px;background:#12243a;border:1px solid #2a435d}.phaseGrid b,.phaseGrid strong{display:block}.phaseGrid b{font-size:10px;color:#e4c77f}.phaseGrid strong{font-size:12px;margin-top:8px}
  .footerCta{max-width:1240px;margin:16px auto;padding:34px;border-radius:20px;background:linear-gradient(120deg,#142d49,#0b1a2d);border:1px solid #39506a}.footerCta>a{display:inline-block;background:#e4c77f;color:#0d1a2a;margin-top:8px}footer{max-width:1240px;margin:25px auto 0;padding-top:18px;border-top:1px solid #23374d;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#8298ad;font-size:9px;letter-spacing:.05em}
  @media(max-width:850px){.pathGrid{grid-template-columns:repeat(2,1fr)}.intro,.study{grid-template-columns:1fr}.phaseGrid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:580px){.college{padding:18px 12px 35px}nav{font-size:8px}.hero{padding:26px 20px}.intro,.section,.footerCta{padding:21px 17px}.cycle{grid-template-columns:repeat(3,1fr)}.pathGrid,.resourceGrid,.pathDetail{grid-template-columns:1fr}.path p,.resource p{min-height:0}.sectionHead{display:block}.sectionHead>span{display:block;margin-top:8px}.filters{display:block}.filters div{margin-top:8px}.filters button{flex:1}.progress button{float:none;display:block;margin-top:12px}.resourceActions{align-items:flex-start}}
  `}</style>
 </main>
}
