'use client';

import {FormEvent,useEffect,useMemo,useRef,useState} from 'react';

type Role='user'|'assistant';
type ChatMessage={id:number;role:Role;content:string;meta?:string;sources?:Array<{title?:string;url?:string}>;assistantName?:string;assistantTitle?:string};
type Mode={id:string;label:string;hint:string;live?:boolean;news?:boolean};

const MODES:Mode[]=[
 {id:'general',label:'Magnanimous',hint:'Reason, plan, create and solve across domains.'},
 {id:'research',label:'Research',hint:'Use stored knowledge and fresh research when needed.',live:true},
 {id:'business',label:'Business',hint:'Strategy, operations, planning and decision support.'},
 {id:'writing',label:'Writing',hint:'Draft, rewrite, summarize and develop ideas.'},
 {id:'coding',label:'Coding',hint:'Build, debug and reason about software systems.'},
 {id:'bible-study',label:'Bible Study',hint:'Study Scripture, themes and biblical questions.'}
];

function authToken(){
 if(typeof window==='undefined')return'';
 return localStorage.getItem('iam_account_token')||localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||'';
}
function initials(name?:string){const parts=String(name||'M').trim().split(/\s+/).filter(Boolean);return(parts.slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'M')}
function extractSources(value:unknown):Array<{title?:string;url?:string}>{
 if(!Array.isArray(value))return[];
 return value.slice(0,8).map((x:any)=>({title:String(x?.title||x?.name||'Source'),url:typeof x?.url==='string'?x.url:undefined}));
}

export default function StandaloneMagnanimous(){
 const[input,setInput]=useState('');
 const[mode,setMode]=useState('general');
 const[messages,setMessages]=useState<ChatMessage[]>([{id:1,role:'assistant',assistantName:'Magnanimous AI',content:'I am Magnanimous AI. Tell me what you need done. I can use my central reasoning, learned knowledge, research, tool planning, specialist branches and intelligent routing without bringing the rest of the website into this workspace.'}]);
 const[busy,setBusy]=useState(false);
 const[status,setStatus]=useState<'checking'|'online'|'limited'>('checking');
 const[signedIn,setSignedIn]=useState(false);
 const[nextId,setNextId]=useState(2);
 const endRef=useRef<HTMLDivElement|null>(null);
 const activeMode=useMemo(()=>MODES.find(x=>x.id===mode)||MODES[0],[mode]);

 useEffect(()=>{
  setSignedIn(Boolean(authToken()));
  fetch('/api/magnanimous/health',{cache:'no-store'}).then(r=>setStatus(r.ok?'online':'limited')).catch(()=>setStatus('limited'));
 },[]);
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'end'})},[messages,busy]);

 async function send(e?:FormEvent){
  e?.preventDefault();
  const text=input.trim();
  if(!text||busy)return;
  const userId=nextId;
  setNextId(v=>v+2);
  setMessages(v=>[...v,{id:userId,role:'user',content:text}]);
  setInput('');setBusy(true);
  try{
   const token=authToken();
   const headers:Record<string,string>={'content-type':'application/json'};
   if(token)headers.authorization=`Bearer ${token}`;
   const requestText=activeMode.id==='general'?text:`[${activeMode.label.toUpperCase()} MODE]\n${text}`;
   const r=await fetch('/api/chat',{
    method:'POST',headers,
    body:JSON.stringify({
     message:requestText,
     provider:'auto',
     use_knowledge:true,
     use_tools:true,
     learn_links:true,
     remember_search:true,
     specialist_routing:true,
     live_search:Boolean(activeMode.live),
     news:Boolean(activeMode.news)
    })
   });
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(String(d?.detail||d?.error||`Magnanimous returned ${r.status}`));
   const answer=String(d?.output||d?.answer||'Magnanimous completed the request but returned no text.');
   const learned=Number(d?.link_learning?.absorbed||0);
   const grounded=Number(d?.sources?.length||0);
   const specialist=d?.specialist_handoff&&d?.specialist?d.specialist:null;
   const parts=[specialist?`Magnanimous routed to ${specialist.name}`:'',learned?`learned ${learned} link${learned===1?'':'s'}`:'',grounded?`${grounded} source${grounded===1?'':'s'}`:''].filter(Boolean);
   setMessages(v=>[...v,{id:userId+1,role:'assistant',content:answer,assistantName:specialist?String(specialist.name||'Specialist'):'Magnanimous AI',assistantTitle:specialist?String(specialist.title||specialist.specialty||'Specialist branch'):'',meta:parts.join(' • '),sources:extractSources(d?.sources)}]);
  }catch(err:any){
   setMessages(v=>[...v,{id:userId+1,role:'assistant',assistantName:'Magnanimous AI',content:`I could not complete that request: ${String(err?.message||err)}. ${signedIn?'Try again in a moment.':'You can also sign in if this task needs persistent memory or connected-account access.'}`}]);
  }finally{setBusy(false)}
 }

 function clearChat(){
  setMessages([{id:Date.now(),role:'assistant',assistantName:'Magnanimous AI',content:'New conversation started. The Magnanimous brain itself has not been reset; signed-in memory and owner-approved specialist knowledge remain available.'}]);
 }

 async function copyLast(){
  const last=[...messages].reverse().find(x=>x.role==='assistant');
  if(last?.content&&navigator?.clipboard)await navigator.clipboard.writeText(last.content).catch(()=>{});
 }

 return <main className="mag-standalone" id="iam-main">
  <header className="mag-head">
   <div className="mag-brand"><span className="mag-mark" aria-hidden="true">M</span><div><strong>MAGNANIMOUS AI™</strong><small>STANDALONE INTELLIGENCE</small></div></div>
   <div className="mag-head-actions">
    <span className={`mag-status ${status}`}><i/>{status==='checking'?'Checking brain':status==='online'?'Brain online':'Limited connection'}</span>
    <button onClick={clearChat}>New chat</button>
   </div>
  </header>

  <section className="mag-shell">
   <aside className="mag-rail" aria-label="Magnanimous modes">
    <div className="mag-core"><span>M</span><b>ONE BRAIN</b><small>Many specialist branches</small></div>
    <nav>{MODES.map(x=><button key={x.id} className={mode===x.id?'active':''} onClick={()=>setMode(x.id)}><b>{x.label}</b><span>{x.hint}</span></button>)}</nav>
    <div className="mag-memory"><b>{signedIn?'Persistent learning on':'Guest session'}</b><span>{signedIn?'Your authorized memory and learned workspace knowledge can be reused here. Magnanimous can automatically hand specialty work to the best named branch.':'Direct AI access is available. Global owner-approved specialist knowledge can still help; sign in for persistent workspace memory.'}</span>{!signedIn&&<a href="/login?returnTo=%2Fmagnanimous">Sign in for memory →</a>}</div>
   </aside>

   <section className="mag-chat" aria-label="Magnanimous conversation">
    <div className="mag-modebar"><div><small>ACTIVE MODE</small><b>{activeMode.label}</b></div><span>Magnanimous core • automatic named specialist handoff when the subject matches</span></div>
    <div className="mag-thread" aria-live="polite">
     {messages.map(m=>{const name=m.role==='assistant'?(m.assistantName||'Magnanimous AI'):'YOU';return <article key={m.id} className={`mag-message ${m.role}`}>
      <div className="mag-avatar">{m.role==='assistant'?initials(name):'YOU'}</div>
      <div className="mag-bubble"><small>{name.toUpperCase()}{m.role==='assistant'&&m.assistantTitle?` • ${m.assistantTitle.toUpperCase()}`:''}</small><p>{m.content}</p>{m.meta&&<div className="mag-meta">{m.meta}</div>}{m.sources&&m.sources.length>0&&<div className="mag-sources"><b>Sources</b>{m.sources.map((s,i)=>s.url?<a key={`${s.url}-${i}`} href={s.url} target="_blank" rel="noreferrer">{s.title||s.url}</a>:<span key={i}>{s.title}</span>)}</div>}</div>
     </article>})}
     {busy&&<article className="mag-message assistant"><div className="mag-avatar">M</div><div className="mag-bubble"><small>MAGNANIMOUS AI</small><div className="mag-thinking"><i/><i/><i/><span>Thinking, matching the specialty and routing…</span></div></div></article>}
     <div ref={endRef}/>
    </div>
    <form className="mag-compose" onSubmit={send}>
     <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder={`Message Magnanimous — ${activeMode.label} mode`} rows={3}/>
     <div className="mag-compose-row"><span>Magnanimous answers directly and automatically hands specialty questions to the matching named AI. Shift+Enter for a new line.</span><div><button type="button" className="secondary" onClick={copyLast}>Copy last</button><button type="submit" disabled={busy||!input.trim()}>{busy?'Working…':'Send →'}</button></div></div>
    </form>
   </section>
  </section>

  <footer className="mag-foot"><span>MAGNANIMOUS AI™</span><b>Central brain • named specialist branches • owner-approved learning</b><span>Knowledge and actions remain permission-aware.</span></footer>

  <style jsx global>{`
   html[data-iam-standalone="true"],html[data-iam-standalone="true"] body{background:#050811!important;min-height:100%;}
   .mag-standalone{min-height:100vh;background:radial-gradient(circle at 72% 8%,rgba(27,145,188,.16),transparent 34%),radial-gradient(circle at 16% 80%,rgba(208,151,50,.08),transparent 28%),#050811;color:#edf8ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column}
   .mag-head{height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 24px;border-bottom:1px solid rgba(137,216,246,.15);background:rgba(5,8,17,.9);backdrop-filter:blur(18px);position:sticky;top:0;z-index:30}.mag-brand{display:flex;align-items:center;gap:12px}.mag-mark{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#0c3045,#10141c);border:1px solid rgba(102,222,255,.5);box-shadow:0 0 28px rgba(59,200,244,.13);font-family:Georgia,serif;font-weight:900;color:#ffe08a;font-size:20px}.mag-brand div{display:flex;flex-direction:column}.mag-brand strong{font-size:15px;letter-spacing:.08em}.mag-brand small{margin-top:3px;font-size:8px;letter-spacing:.22em;color:#70cae8}.mag-head-actions{display:flex;align-items:center;gap:10px}.mag-head-actions button,.mag-compose button{border:1px solid rgba(101,214,248,.3);background:#0c1823;color:#eafbff;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}.mag-status{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:999px;background:#0a131d;border:1px solid rgba(255,255,255,.08);font-size:10px;color:#9fb4c2}.mag-status i{width:7px;height:7px;border-radius:50%;background:#8797a1}.mag-status.online i{background:#51e7a6;box-shadow:0 0 12px rgba(81,231,166,.7)}.mag-status.limited i{background:#ffc760}
   .mag-shell{width:min(1500px,100%);margin:0 auto;display:grid;grid-template-columns:270px minmax(0,1fr);flex:1;min-height:calc(100vh - 114px)}.mag-rail{border-right:1px solid rgba(137,216,246,.12);padding:20px 14px;display:flex;flex-direction:column;gap:18px;background:rgba(5,11,20,.5)}.mag-core{padding:18px;border:1px solid rgba(102,222,255,.16);border-radius:18px;background:linear-gradient(155deg,rgba(17,47,66,.55),rgba(10,13,20,.6));display:grid;grid-template-columns:52px 1fr;column-gap:12px;align-items:center}.mag-core>span{grid-row:1/3;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,205,95,.4);font:900 23px Georgia;color:#ffdd82;background:#08121c}.mag-core b{font-size:12px;letter-spacing:.12em}.mag-core small{font-size:10px;color:#83a7b9}.mag-rail nav{display:flex;flex-direction:column;gap:5px}.mag-rail nav button{text-align:left;border:1px solid transparent;background:transparent;color:#b4c7d2;border-radius:12px;padding:11px 12px;cursor:pointer;display:flex;flex-direction:column;gap:4px}.mag-rail nav button:hover,.mag-rail nav button.active{background:#0c1a26;border-color:rgba(91,206,242,.22);color:#fff}.mag-rail nav b{font-size:12px}.mag-rail nav span{font-size:9px;line-height:1.4;color:#758e9d}.mag-memory{margin-top:auto;padding:14px;border-top:1px solid rgba(137,216,246,.12);display:flex;flex-direction:column;gap:6px}.mag-memory b{font-size:10px;color:#78dff8;text-transform:uppercase;letter-spacing:.1em}.mag-memory span{font-size:10px;line-height:1.5;color:#7f95a4}.mag-memory a{font-size:10px;color:#ffd878;text-decoration:none;font-weight:800;margin-top:4px}
   .mag-chat{min-width:0;display:grid;grid-template-rows:auto 1fr auto;height:calc(100vh - 72px)}.mag-modebar{padding:14px 22px;border-bottom:1px solid rgba(137,216,246,.09);display:flex;align-items:center;justify-content:space-between;gap:14px;background:rgba(8,13,23,.68)}.mag-modebar div{display:flex;align-items:baseline;gap:10px}.mag-modebar small{font-size:8px;letter-spacing:.14em;color:#6991a6}.mag-modebar b{font-size:13px}.mag-modebar>span{font-size:9px;color:#6d8999}.mag-thread{overflow:auto;padding:28px max(22px,6vw) 34px;display:flex;flex-direction:column;gap:22px;scrollbar-color:#233b4a transparent}.mag-message{width:min(900px,100%);margin:0 auto;display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px}.mag-message.user{grid-template-columns:minmax(0,1fr) 42px}.mag-message.user .mag-avatar{grid-column:2}.mag-message.user .mag-bubble{grid-column:1;grid-row:1;background:#111c28;border-color:rgba(255,206,105,.15)}.mag-avatar{width:38px;height:38px;border-radius:12px;border:1px solid rgba(92,216,250,.3);background:#081824;display:grid;place-items:center;font:900 11px Georgia;color:#ffe08a}.mag-message.user .mag-avatar{font:800 8px Inter;color:#c7e9f4;border-color:rgba(255,205,100,.25);background:#18160f}.mag-bubble{border:1px solid rgba(92,216,250,.12);background:rgba(8,17,27,.72);border-radius:4px 18px 18px 18px;padding:16px 18px}.mag-message.user .mag-bubble{border-radius:18px 4px 18px 18px}.mag-bubble>small{display:block;font-size:8px;letter-spacing:.14em;color:#6fcfe9;margin-bottom:8px}.mag-message.user .mag-bubble>small{color:#d4b65f}.mag-bubble p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.72;color:#dceaf0}.mag-meta{margin-top:12px;font-size:9px;color:#6f8998;border-top:1px solid rgba(255,255,255,.06);padding-top:9px}.mag-sources{margin-top:13px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}.mag-sources>b{font-size:9px;color:#7894a4;margin-right:3px}.mag-sources a,.mag-sources span{font-size:9px;color:#92dff2;text-decoration:none;border:1px solid rgba(88,201,235,.16);border-radius:999px;padding:5px 8px;background:#08141d}.mag-thinking{display:flex;align-items:center;gap:5px}.mag-thinking i{width:6px;height:6px;border-radius:50%;background:#69d9f5;animation:magPulse 1.1s infinite}.mag-thinking i:nth-child(2){animation-delay:.16s}.mag-thinking i:nth-child(3){animation-delay:.32s}.mag-thinking span{font-size:11px;color:#89a4b2;margin-left:5px}@keyframes magPulse{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
   .mag-compose{border-top:1px solid rgba(137,216,246,.1);padding:15px max(18px,6vw) 18px;background:rgba(5,9,17,.93);backdrop-filter:blur(16px)}.mag-compose textarea{display:block;width:min(900px,100%);box-sizing:border-box;margin:0 auto;resize:none;border:1px solid rgba(94,205,238,.24);background:#09131d;color:#f0fbff;border-radius:16px;padding:15px 16px;font:500 14px/1.5 Inter,system-ui,sans-serif;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}.mag-compose textarea:focus{border-color:rgba(87,220,255,.55)}.mag-compose-row{width:min(900px,100%);margin:9px auto 0;display:flex;align-items:center;justify-content:space-between;gap:12px}.mag-compose-row>span{font-size:9px;color:#677f8e}.mag-compose-row>div{display:flex;gap:7px}.mag-compose button[type="submit"]{background:linear-gradient(135deg,#14384b,#182632);border-color:rgba(91,222,255,.45);color:#f1fcff}.mag-compose button.secondary{background:transparent;color:#90a9b8}.mag-compose button:disabled{opacity:.45;cursor:not-allowed}.mag-foot{min-height:42px;box-sizing:border-box;padding:10px 20px;display:flex;justify-content:center;gap:14px;align-items:center;flex-wrap:wrap;border-top:1px solid rgba(137,216,246,.08);background:#04070d;color:#617b8a;font-size:9px}.mag-foot>span:first-child{color:#bbdce8;font-weight:900;letter-spacing:.09em}.mag-foot b{color:#8ea5b1}
   @media(max-width:820px){.mag-head{height:64px;padding:0 12px}.mag-brand strong{font-size:13px}.mag-brand small{font-size:7px}.mag-head-actions .mag-status{display:none}.mag-head-actions button{padding:8px 10px;font-size:10px}.mag-shell{display:block;min-height:calc(100vh - 106px)}.mag-rail{border-right:0;border-bottom:1px solid rgba(137,216,246,.1);padding:9px 10px;gap:8px}.mag-core,.mag-memory{display:none}.mag-rail nav{flex-direction:row;overflow:auto;gap:6px;padding-bottom:2px}.mag-rail nav button{min-width:max-content;padding:8px 11px;border-color:rgba(255,255,255,.05)}.mag-rail nav button span{display:none}.mag-chat{height:calc(100vh - 112px);min-height:560px}.mag-modebar{padding:10px 13px}.mag-modebar>span{display:none}.mag-thread{padding:19px 12px 25px;gap:16px}.mag-message{grid-template-columns:34px minmax(0,1fr);gap:8px}.mag-message.user{grid-template-columns:minmax(0,1fr) 34px}.mag-avatar{width:32px;height:32px;border-radius:10px;font-size:9px}.mag-bubble{padding:13px 14px}.mag-bubble p{font-size:13px;line-height:1.62}.mag-compose{padding:11px 10px 12px}.mag-compose-row>span{display:none}.mag-compose-row{justify-content:flex-end}.mag-foot{display:none}}
  `}</style>
 </main>;
}
