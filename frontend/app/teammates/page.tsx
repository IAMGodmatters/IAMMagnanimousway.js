'use client';

import {FormEvent,useEffect,useRef,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import styles from './teammates.module.css';

type Teammate={id:string;name:string;role:string;instructions:string;status:string;busy:boolean};
type Source={title:string;url:string;source:string};
type Turn={id:string;teammate_id:string;message:string;output:string;status:string;source_turn_id?:string;error_code:string;sources:Source[]};
type Memory={id:string;memory_key:string;memory_value:string};
type Template={id:string;name:string;role:string;instructions:string};
type Surface={name:string;href:string;boundary:string};
const base='/api/magnanimous/teammates';

export default function Teammates(){
  const[roster,setRoster]=useState<Teammate[]>([]),[templates,setTemplates]=useState<Template[]>([]),[surfaces,setSurfaces]=useState<Surface[]>([]);
  const[selected,setSelected]=useState<Teammate|null>(null),[turns,setTurns]=useState<Turn[]>([]),[memories,setMemories]=useState<Memory[]>([]);
  const[name,setName]=useState(''),[role,setRole]=useState(''),[instructions,setInstructions]=useState('');
  const[message,setMessage]=useState(''),[mode,setMode]=useState('chat'),[handoff,setHandoff]=useState(''),[target,setTarget]=useState('');
  const[memoryKey,setMemoryKey]=useState(''),[memoryValue,setMemoryValue]=useState('');
  const[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const selection=useRef('');
  const pending=useRef<{teammateId:string;message:string;mode:string;request_key:string}|null>(null);

  async function call(path:string,method='GET',body?:unknown){
    const headers:Record<string,string>={authorization:`Bearer ${getPlatformAuthToken()}`};
    if(body!==undefined)headers['content-type']='application/json';
    const response=await fetch(path,{method,headers,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)});
    if(response.status===401){location.replace('/login/?returnTo=%2Fteammates');throw new Error('Please sign in.');}
    const data=await response.json();
    if(!response.ok)throw new Error(data.detail||`Request failed (${response.status})`);
    return data;
  }
  async function loadRoster(){const data=await call(base);setRoster(data.teammates);return data.teammates as Teammate[];}
  async function open(id:string){
    selection.current=id;
    setSelected(null);setTurns([]);setMemories([]);setHandoff('');setTarget('');setError('');
    const data=await call(`${base}/${encodeURIComponent(id)}`);
    if(selection.current!==id)return;
    setSelected(data.teammate);setTurns(data.turns);setMemories(data.memories);
  }
  async function refresh(id:string){
    const data=await call(`${base}/${encodeURIComponent(id)}`);
    if(selection.current!==id)return;
    setSelected(data.teammate);setTurns(data.turns);setMemories(data.memories);
  }
  async function action(task:()=>Promise<void>){
    if(busy)return;setBusy(true);setError('');setNotice('');
    try{await task();}catch(e){setError(e instanceof Error?e.message:'Request could not complete.');}finally{setBusy(false);}
  }
  useEffect(()=>{
    if(!getPlatformAuthToken()){location.replace('/login/?returnTo=%2Fteammates');return;}
    Promise.all([loadRoster(),call(base+'/catalog')]).then(([rows,catalog])=>{
      setTemplates(catalog.templates);setSurfaces(catalog.surfaces);if(rows[0])return open(rows[0].id);
    }).catch(e=>setError(e.message));
  },[]);
  useEffect(()=>{
    if(!selected)return;
    const id=selected.id;
    const timer=window.setInterval(()=>{if(!document.hidden&&!busy)refresh(id).catch(()=>{});},10000);
    return()=>window.clearInterval(timer);
  },[selected?.id,busy]);

  function create(e:FormEvent){e.preventDefault();void action(async()=>{
    const data=await call(base,'POST',{name,role,instructions});await loadRoster();await open(data.teammate.id);
    setName('');setRole('');setInstructions('');setNotice('Teammate created. Nothing has been scheduled or sent.');
  });}
  function send(e:FormEvent){e.preventDefault();if(!selected||!message.trim())return;const teammateId=selected.id;
    void action(async()=>{
      const text=message.trim(),prior=pending.current;
      const input=prior?.teammateId===teammateId&&prior.message===text&&prior.mode===mode?prior:{teammateId,message:text,mode,request_key:crypto.randomUUID()};
      pending.current=input;
      const result=await call(`${base}/${teammateId}/turns`,'POST',input);
      pending.current=null;await refresh(teammateId);await loadRoster();
      if(result.turn.status!=='completed')throw new Error(`Previous attempt ${result.turn.status}: ${result.turn.error_code}. Review history before starting a new turn.`);
      setMessage('');setNotice('Result saved. No external action was performed.');
    });
  }
  function passToTeammate(){if(!target||!handoff||!selected)return;
    const source=turns.find(t=>t.id===handoff);if(!source)return;
    void action(async()=>{
      const result=await call(`${base}/${target}/turns`,'POST',{message:`Continue this completed work in your role. State what is finished, what remains uncertain and the next useful deliverable.`,source_turn_id:source.id,request_key:`handoff:${source.id}:${target}`});
      await loadRoster();await open(target);
      setNotice(result.turn.status==='completed'?'Selected result handed off; the receiving teammate answered. No private memories were transferred.':`Handoff ${result.turn.status}: ${result.turn.error_code}`);
    });
  }
  function saveSkill(){if(!selected||!message.trim())return;void action(async()=>{
    await call(`${base}/${selected.id}/skill`,'POST',{name:`${selected.name} workflow`,prompt:message.trim()});
    setNotice('Skill saved in Routine Studio. Test it there before enabling a schedule. No schedule was created.');
  });}
  function remember(e:FormEvent){e.preventDefault();if(!selected)return;void action(async()=>{
    const data=await call(`${base}/${selected.id}/memories`,'POST',{key:memoryKey,value:memoryValue});setMemories(data.memories);setMemoryKey('');setMemoryValue('');setNotice('Memory saved for this teammate only.');
  });}
  function changeStatus(){if(!selected)return;void action(async()=>{
    await call(`${base}/${selected.id}`,'PATCH',{status:selected.status==='active'?'paused':'active'});await refresh(selected.id);await loadRoster();
  });}

  return <main className={styles.main}>
    <header className={styles.header}><div><a href="/">I AM Magnanimous Way</a><p className={styles.eyebrow}>ONE BRAIN · YOUR PERSISTENT TEAM</p><h1>Magnanimous Teammates</h1><p>Give work a name, a role and a memory. Research, draft and hand off results without losing context.</p></div><a className={styles.linkButton} href="/routine-studio">Skills &amp; routines →</a></header>
    <div role="status" aria-live="polite">{notice&&<p className={styles.notice}>{notice}</p>}</div>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.workspace}>
      <aside className={styles.panel}>
        <h2>Your teammates</h2>
        <div className={styles.roster}>{roster.map(t=><button key={t.id} disabled={busy} aria-pressed={selected?.id===t.id} onClick={()=>void action(()=>open(t.id))}><b>{t.name}</b><span>{t.role}</span><small>{t.status}{t.busy?' · working':''}</small></button>)}{!roster.length&&<p>Create a focused teammate to begin.</p>}</div>
        <form onSubmit={create} className={styles.form}><h3>Create a teammate</h3>
          <label>Start from a role<select defaultValue="" onChange={e=>{const t=templates.find(v=>v.id===e.target.value);if(t){setName(t.name);setRole(t.role);setInstructions(t.instructions);}}}><option value="">Choose a template</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label>Name<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>Role<input required maxLength={180} value={role} onChange={e=>setRole(e.target.value)}/></label>
          <label>Working instructions<textarea rows={4} maxLength={6000} value={instructions} onChange={e=>setInstructions(e.target.value)}/></label>
          <button disabled={busy||!name.trim()||!role.trim()}>Create teammate</button>
        </form>
      </aside>
      <section className={styles.panel} aria-label="Teammate conversation">
        {selected?<><div className={styles.row}><div><h2>{selected.name}</h2><p>{selected.role}</p></div><button disabled={busy} onClick={changeStatus}>{selected.status==='active'?'Pause':'Activate'}</button><button disabled={busy} onClick={()=>void action(()=>refresh(selected.id))}>Refresh history</button></div>
          <details><summary>Role instructions</summary><p className={styles.pre}>{selected.instructions||'No additional instructions.'}</p></details>
          <div className={styles.history}>{turns.map(t=><article key={t.id} className={styles.turn}>
            <p className={styles.eyebrow}>{t.source_turn_id?'HANDOFF':'TASK'} · {t.status}</p><p className={styles.pre}>{t.message}</p>
            {t.output&&<div className={styles.answer}>{t.output}</div>}{t.error_code&&<p className={styles.error}>{t.error_code}</p>}
            {t.sources?.length>0&&<ul>{t.sources.map((s,i)=><li key={`${s.url}-${i}`}>{s.url?<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title||s.url}</a>:s.title}<small> · {s.source||'source'}</small></li>)}</ul>}
            {t.status==='completed'&&<button disabled={busy} aria-pressed={handoff===t.id} onClick={()=>setHandoff(t.id)}>Select this result for handoff</button>}
          </article>)}{!turns.length&&<p className={styles.empty}>Start with a task and the evidence it needs. Results remain available when you return.</p>}</div>
          {handoff&&<div className={styles.handoff}><p>Only the selected task and answer will transfer—not the teammate’s private memories. Sources in that answer may need rechecking.</p><label>Receiving teammate<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose a teammate</option>{roster.filter(t=>t.id!==selected.id&&t.status==='active').map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button disabled={busy||!target} onClick={passToTeammate}>Hand off selected result</button></div>}
          <form onSubmit={send} className={styles.form}><label>Task<textarea required rows={5} maxLength={8000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe the task, inputs and the result you want."/></label>
            <label>Mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="chat">Reason &amp; draft · no live lookup</option><option value="research">Research · workspace and live sources</option></select></label>
            <div className={styles.row}><button disabled={busy||selected.status!=='active'||!message.trim()}>{busy?'Working…':'Run task'}</button><button type="button" disabled={busy||!message.trim()} onClick={saveSkill}>Save task as skill</button></div>
            <small>Saving skills is available to the platform owner. Test a saved skill before scheduling it. Research can include shared workspace knowledge; your conversations and memories stay private to you.</small>
          </form>
        </>:<p className={styles.empty}>Choose or create a teammate.</p>}
      </section>
      <aside className={styles.panel}><h2>Private memory</h2><p>Explicit preferences for the selected teammate. Do not put passwords, tokens or verification codes here.</p>
        {memories.map(m=><article key={m.id} className={styles.memory}><b>{m.memory_key}</b><p>{m.memory_value}</p><button disabled={busy||!selected} onClick={()=>void action(async()=>{await call(`${base}/${selected!.id}/memories/${m.id}`,'DELETE');await refresh(selected!.id);})}>Forget</button></article>)}
        <form onSubmit={remember} className={styles.form}><label>Preference name<input required maxLength={120} value={memoryKey} onChange={e=>setMemoryKey(e.target.value)}/></label><label>What to remember<textarea required rows={3} maxLength={4000} value={memoryValue} onChange={e=>setMemoryValue(e.target.value)}/></label><button disabled={busy||!selected||!memoryKey.trim()||!memoryValue.trim()}>Save memory</button></form>
      </aside>
    </div>
    <section className={styles.panel}><h2>Continue into execution</h2><p>Use these workspaces to act on a teammate’s results. Each workspace checks your permissions and any required approvals before running an action.</p><div className={styles.surfaces}>{surfaces.map(s=><a key={s.href} href={s.href}><b>{s.name} →</b><span>{s.boundary}</span></a>)}</div></section>
    <p className={styles.footnote}>Tool availability depends on your permissions and connected services. Check the destination workspace before starting work.</p>
  </main>;
}
