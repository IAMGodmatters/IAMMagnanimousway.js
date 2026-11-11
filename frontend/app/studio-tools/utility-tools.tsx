'use client';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import './utility-tools.css';

type StudioRecord = { id:string; title:string; status:string; due_at:number|null; data:Record<string,unknown>; updated_at:number };
export type RestoreRecord = { sourceId:string; kind:'task'|'note'|'planner'|'habit'; title:string; status:string; due_at:number|null; data:Record<string,unknown> };
type Props = { items:StudioRecord[]; onRestore:(records:RestoreRecord[])=>Promise<{imported:number;skipped:number}> };
const UNITS:Record<string,Record<string,number>> = {
  Length:{m:1,km:1000,cm:.01,mm:.001,ft:.3048,in:.0254,mi:1609.344},
  Weight:{kg:1,g:.001,mg:.000001,lb:.45359237,oz:.028349523125},
  Volume:{L:1,mL:.001,gal:3.785411784,cup:.2365882365}
};
const UNIT_NAMES:Record<string,string[]>={...Object.fromEntries(Object.entries(UNITS).map(([k,v])=>[k,Object.keys(v)])),Temperature:['°C','°F','K']};

function calculate(source:string):number {
  const s=source.replace(/\s+/g,'');
  if(!s||!/^[\d.+\-*/%()]+$/.test(s))throw new Error('Enter a valid arithmetic expression.');
  const t=s.match(/\d+(?:\.\d+)?|[()+\-*/%]/g)||[];
  if(t.join('')!==s)throw new Error('Check the expression and try again.');
  let i=0;
  const primary=():number=>{const x=t[i++];if(x==='('){const n=expr();if(t[i++]!==')')throw new Error('A closing parenthesis is missing.');return n;}if(x===undefined||!/^\d+(?:\.\d+)?$/.test(x))throw new Error('A number is missing.');return Number(x);};
  const unary=():number=>{if(t[i]==='+'){i++;return unary();}if(t[i]==='-'){i++;return -unary();}return primary();};
  const term=():number=>{let n=unary();while(['*','/','%'].includes(t[i])){const op=t[i++],r=unary();if((op==='/'||op==='%')&&r===0)throw new Error('Division by zero is not allowed.');n=op==='*'?n*r:op==='/'?n/r:n%r;}return n;};
  const expr=():number=>{let n=term();while(t[i]==='+'||t[i]==='-'){const op=t[i++],r=term();n=op==='+'?n+r:n-r;}return n;};
  const result=expr();if(i!==t.length||!Number.isFinite(result))throw new Error('The expression could not be calculated.');return Number(result.toPrecision(12));
}
function convert(value:string,category:string,from:string,to:string):number {
  const n=Number(value);if(!Number.isFinite(n))throw new Error('Enter a valid number.');
  if(category==='Temperature'){const c=from==='°C'?n:from==='°F'?(n-32)*5/9:n-273.15;return to==='°C'?c:to==='°F'?c*9/5+32:c+273.15;}
  const u=UNITS[category];if(!u||!(from in u)||!(to in u))throw new Error('Choose valid units.');return n*u[from]/u[to];
}
function normalizeBackup(backup:any):RestoreRecord[] {
  if(Array.isArray(backup?.records)){
    if(backup.records.length>500)throw new Error('A backup can contain no more than 500 records.');
    return backup.records.map((x:any,i:number)=>{
      const kind=x?.data?.kind;if(!['task','note','planner','habit'].includes(kind))throw new Error('The backup contains an unsupported record type.');
      const title=String(x.title||'').trim(),body=String(x.data?.body||'');if(!title||title.length>240)throw new Error('Each item needs a title of 1–240 characters.');if(body.length>12000)throw new Error('An imported description is too long.');
      const sourceId=String(x.id||x.sourceId||'record-'+i).slice(0,160);
      return {sourceId,kind,title,status:['open','done','archived'].includes(x.status)?x.status:'open',due_at:Number.isFinite(x.due_at)?x.due_at:null,data:{...x.data,kind,body,backup_source_id:sourceId}};
    });
  }
  const d=backup?.workspace||backup;
  if(!d||!['tasks','notes','plans','habits'].every(k=>Array.isArray(d[k])))throw new Error('This is not a supported Magnanimous Studio backup.');
  const out:RestoreRecord[]=[];
  const add=(kind:RestoreRecord['kind'],x:any,i:number,due_at:number|null=null)=>{
    const title=String(x?.title||x?.name||(kind==='note'?'Untitled note':'')).trim(),body=String(x?.body||'');
    if(!title||title.length>240)throw new Error('Each item needs a title of 1–240 characters.');if(body.length>12000)throw new Error('An imported description is too long.');
    const sourceId=String(x?.id||kind+'-'+i).slice(0,160);
    out.push({sourceId,kind,title,status:kind==='task'&&x.done?'done':'open',due_at,data:{kind,body,...(kind==='habit'?{doneOn:String(x.doneOn||'')}:{}),...(kind==='planner'?{legacy_date:String(x.date||''),legacy_time:String(x.time||'')}:{}),backup_source_id:sourceId}});
  };
  d.tasks.forEach((x:any,i:number)=>add('task',x,i));
  d.notes.forEach((x:any,i:number)=>add('note',x,i));
  d.plans.forEach((x:any,i:number)=>{const date=x?.date&&x?.time?new Date(String(x.date)+'T'+String(x.time)):null;add('planner',x,i,date&&Number.isFinite(date.getTime())?Math.floor(date.getTime()/1000):null);});
  d.habits.forEach((x:any,i:number)=>add('habit',x,i));
  if(out.length>500)throw new Error('A backup can contain no more than 500 records.');return out;
}

export default function UtilityTools({items,onRestore}:Props) {
  const [active,setActive]=useState('focus'),[theme,setTheme]=useState<'dark'|'light'>('dark');
  const [seconds,setSeconds]=useState(1500),[mode,setMode]=useState<'Focus'|'Break'>('Focus'),[running,setRunning]=useState(false),deadline=useRef<number|null>(null);
  const [expression,setExpression]=useState('12 * (3 + 2)'),[result,setResult]=useState('60'),[calcError,setCalcError]=useState('');
  const [category,setCategory]=useState('Length'),[amount,setAmount]=useState('1'),[from,setFrom]=useState('km'),[to,setTo]=useState('m');
  const [text,setText]=useState(''),[textResult,setTextResult]=useState(''),[json,setJson]=useState('{\n  "magnanimous": "ready"\n}'),[jsonResult,setJsonResult]=useState(''),[jsonError,setJsonError]=useState('');
  const [backupMessage,setBackupMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{try{setTheme(localStorage.getItem('magnanimous-studio-theme-v1')==='light'?'light':'dark')}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('magnanimous-studio-theme-v1',theme)}catch{}},[theme]);
  useEffect(()=>{if(!running)return;const tick=()=>{const left=Math.max(0,Math.ceil(((deadline.current||Date.now())-Date.now())/1000));setSeconds(left);if(left===0){setRunning(false);deadline.current=null;}};const id=window.setInterval(tick,250);tick();return()=>window.clearInterval(id)},[running]);
  useEffect(()=>{const units=UNIT_NAMES[category]||[];if(!units.includes(from)||!units.includes(to)){setFrom(units[0]||'');setTo(units[1]||units[0]||'')}},[category,from,to]);
  const conversion=useMemo(()=>{try{return convert(amount,category,from,to).toFixed(8).replace(/\.?0+$/,'')+' '+to}catch{return 'Enter a valid amount and units.'}},[amount,category,from,to]);
  const records=items.filter(x=>x.status!=='archived'&&['task','note','planner','habit'].includes(String(x.data?.kind)));
  const tools=[['focus','Focus Timer','◷'],['calculator','Calculator','＋'],['converter','Unit Converter','⇄'],['text','Text Tools','T'],['json','JSON Formatter','{ }'],['backup','Backup & Restore','↥']];
  function selectMode(next:'Focus'|'Break'){setRunning(false);deadline.current=null;setMode(next);setSeconds(next==='Focus'?1500:300);}
  function toggleTimer(){if(running){setSeconds(Math.max(0,Math.ceil(((deadline.current||Date.now())-Date.now())/1000)));deadline.current=null;setRunning(false)}else{deadline.current=Date.now()+seconds*1000;setRunning(true)}}
  function calc(e:FormEvent){e.preventDefault();try{setResult(String(calculate(expression)));setCalcError('')}catch(err){setResult('');setCalcError(err instanceof Error?err.message:'Could not calculate.')}}
  function transform(action:string){if(action==='Uppercase')setTextResult(text.toUpperCase());if(action==='Lowercase')setTextResult(text.toLowerCase());if(action==='Title Case')setTextResult(text.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()));if(action==='Trim')setTextResult(text.trim().replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n'));if(action==='Reverse')setTextResult(Array.from(text).reverse().join(''));}
  function formatJson(minify:boolean){try{const parsed=JSON.parse(json);setJsonResult(minify?JSON.stringify(parsed):JSON.stringify(parsed,null,2));setJsonError('')}catch(err){setJsonResult('');setJsonError(err instanceof Error?err.message:'Invalid JSON.')}}
  function download(){const backup={app:'I AM MAGNANIMOUS WAY — Studio Tools',version:1,exportedAt:new Date().toISOString(),records:records.map(x=>({id:x.id,title:x.title,status:x.status,due_at:x.due_at,data:x.data}))};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='magnanimous-studio-backup.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setBackupMessage('Your cloud workspace backup was created. Keep the file somewhere safe.');}
  async function restore(e:ChangeEvent<HTMLInputElement>){const input=e.currentTarget,file=input.files?.[0];if(!file)return;setBusy(true);setBackupMessage('');try{if(file.size>2*1024*1024)throw new Error('Backup file is larger than 2 MB.');const data=normalizeBackup(JSON.parse(await file.text()));if(!data.length)throw new Error('This backup contains no workspace records.');if(!window.confirm('Import '+data.length+' items into your signed-in workspace? Existing records will not be deleted or replaced.'))return;const done=await onRestore(data);setBackupMessage('Import complete: '+done.imported+' added, '+done.skipped+' already present. Existing records were preserved.')}catch(err){setBackupMessage(err instanceof Error?err.message:'The backup could not be imported.')}finally{setBusy(false);input.value=''}}
  return <section className={'st-utilities '+theme}>
    <header className="ut-head"><div><small>MAGNANIMOUS WORKSPACE</small><h2>Everyday tools</h2><p>Helpful tools connected to your signed-in workspace.</p></div><button type="button" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'Light mode':'Dark mode'}</button></header>
    <nav className="ut-nav" aria-label="Everyday tools">{tools.map(([id,label,icon])=><button type="button" key={id} className={active===id?'active':''} aria-pressed={active===id} onClick={()=>setActive(id)}><span>{icon}</span>{label}</button>)}</nav>
    {active==='focus'&&<section className="ut-panel"><h3>Make space for focus</h3><p>The timer uses a clock deadline so it stays accurate when the tab is in the background.</p><div className="ut-actions"><button type="button" className={mode==='Focus'?'active':''} onClick={()=>selectMode('Focus')}>25 min focus</button><button type="button" className={mode==='Break'?'active':''} onClick={()=>selectMode('Break')}>5 min break</button></div><div className="ut-clock" aria-live="polite">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}<small>{mode} session</small></div><div className="ut-actions"><button className="ut-primary" type="button" onClick={toggleTimer}>{running?'Pause':'Start'}</button><button type="button" onClick={()=>selectMode(mode)}>Reset</button></div>{seconds===0&&<p role="status" className="ut-success">Session complete. Take a moment before the next one.</p>}</section>}
    {active==='calculator'&&<section className="ut-panel"><h3>Everyday calculator</h3><p>Use +, −, ×, ÷, %, and parentheses.</p><form className="ut-stack" onSubmit={calc}><label>Expression<input value={expression} onChange={e=>setExpression(e.target.value)} placeholder="12 * (3 + 2)"/></label><button className="ut-primary">Calculate</button></form>{calcError&&<p role="alert" className="ut-error">{calcError}</p>}{result&&<div className="ut-result"><small>RESULT</small><strong>{result}</strong></div>}</section>}
    {active==='converter'&&<section className="ut-panel"><h3>Convert a measurement</h3><p>Length, weight, volume and temperature.</p><div className="ut-grid"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.keys(UNIT_NAMES).map(x=><option key={x}>{x}</option>)}</select></label><label>Amount<input type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>From<select value={from} onChange={e=>setFrom(e.target.value)}>{(UNIT_NAMES[category]||[]).map(x=><option key={x}>{x}</option>)}</select></label><label>To<select value={to} onChange={e=>setTo(e.target.value)}>{(UNIT_NAMES[category]||[]).map(x=><option key={x}>{x}</option>)}</select></label></div><div className="ut-result"><small>CONVERTED VALUE</small><strong>{conversion}</strong></div></section>}
    {active==='text'&&<section className="ut-panel"><h3>Text helper</h3><p>Count words and quickly transform text.</p><textarea rows={7} value={text} onChange={e=>setText(e.target.value)} placeholder="Paste or type your text here..."/><div className="ut-stats"><span>{text.trim()?text.trim().split(/\s+/).length:0} words</span><span>{text.length} characters</span><span>{text.split(/\n/).length} lines</span></div><div className="ut-actions">{['Uppercase','Lowercase','Title Case','Trim','Reverse'].map(x=><button type="button" key={x} onClick={()=>transform(x)}>{x}</button>)}</div>{textResult&&<div className="ut-result"><small>RESULT</small><pre>{textResult}</pre><button type="button" onClick={()=>void navigator.clipboard?.writeText(textResult)}>Copy result</button></div>}</section>}
    {active==='json'&&<section className="ut-panel"><h3>JSON formatter</h3><p>Format or minify JSON and catch syntax errors.</p><textarea className="ut-code" rows={9} spellCheck={false} value={json} onChange={e=>setJson(e.target.value)}/><div className="ut-actions"><button className="ut-primary" type="button" onClick={()=>formatJson(false)}>Format JSON</button><button type="button" onClick={()=>formatJson(true)}>Minify</button></div>{jsonError&&<p role="alert" className="ut-error">{jsonError}</p>}{jsonResult&&<pre className="ut-result ut-code-result">{jsonResult}</pre>}</section>}
    {active==='backup'&&<section className="ut-panel"><h3>Your data belongs to you</h3><p>Export your cloud workspace or import an earlier local Preact Studio backup. Import adds records; it never erases your current workspace.</p><div className="ut-backup"><div><strong>Download a backup</strong><small>{records.length} saved workspace records</small></div><button type="button" className="ut-primary" onClick={download}>Download backup</button></div><div className="ut-backup"><div><strong>Import a backup</strong><small>Supports the original local Preact Studio and cloud backup formats.</small></div><label className="ut-file">Choose file<input type="file" accept="application/json,.json" disabled={busy} onChange={restore}/></label></div>{busy&&<p className="ut-muted">Validating and importing…</p>}{backupMessage&&<p className="ut-success" role="status">{backupMessage}</p>}<p className="ut-muted">Imported records are stored in your authenticated Magnanimous workspace and remain protected by tenant access controls.</p></section>}
  </section>;
}
