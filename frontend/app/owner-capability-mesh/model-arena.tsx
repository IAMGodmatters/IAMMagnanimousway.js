'use client';

import {useState} from 'react';

type Candidate={id:string;output:string};
type Ranking={id:string;rank:number;rubric_adherence_score:number;required_met:string[];required_missing:string[];exclusions_detected:string[]};
type Result={ok:boolean;rankings:Ranking[];winner_label:string;funding:{external_model_calls:number;actual_external_spend_usd:number};caveat:string};
const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const panel={border:'1px solid #325164',borderRadius:16,padding:18,background:'#07121a'} as const;
const textarea={width:'100%',minHeight:140,boxSizing:'border-box' as const,borderRadius:9,padding:12,background:'#0e202a',color:'#effaff',border:'1px solid #386073',font:'inherit',resize:'vertical' as const};
const button={border:'1px solid #7f6d3b',borderRadius:10,padding:'11px 16px',background:'#45380f',color:'#ffe7aa',fontWeight:800,cursor:'pointer'} as const;
const phraseLines=(s:string)=>s.split('\n').map(x=>x.trim()).filter(Boolean);

export default function ModelArena({getToken}:{getToken:()=>string}){
 const[required,setRequired]=useState('tenant isolation\naudit log\ncost ceiling');
 const[excluded,setExcluded]=useState('disable security');
 const[answers,setAnswers]=useState<Candidate[]>([{id:'answer_1',output:''},{id:'answer_2',output:''}]);
 const[result,setResult]=useState<Result|null>(null);
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);

 function update(id:string,output:string){setAnswers(prev=>prev.map(a=>a.id===id?{...a,output}:a));setResult(null);}
 function add(){setAnswers(prev=>{if(prev.length>=8)return prev;let n=1;while(prev.some(a=>a.id===`answer_${n}`))n++;return [...prev,{id:`answer_${n}`,output:''}];});setResult(null);}
 function remove(id:string){setAnswers(prev=>prev.length>2?prev.filter(a=>a.id!==id):prev);setResult(null);}
 async function compare(){
  setError('');setResult(null);
  const token=getToken();
  if(!token){setError('Owner sign-in is required to compare answers.');return;}
  const rubric={required_phrases:phraseLines(required),excluded_phrases:phraseLines(excluded)};
  if(!rubric.required_phrases.length){setError('Enter at least one required phrase.');return;}
  if(answers.some(a=>!a.output.trim())){setError('Paste an answer into each comparison box.');return;}
  setBusy(true);
  try{
   const response=await fetch(api+'/api/magnanimous/model-arena/evaluate',{
    method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+token},cache:'no-store',
    body:JSON.stringify({rubric,estimated_budget_usd:0,candidates:answers})
   });
   const body=await response.json().catch(()=>({detail:'Unexpected server response.'}));
   if(!response.ok){setError(String(body.detail||`Request failed (${response.status}).`));return;}
   setResult(body as Result);
  }catch{setError('Could not contact the Magnanimous evaluation service. Check your connection and try again.');}
  finally{setBusy(false);}
 }

 return <section aria-labelledby="model-arena-title" style={{...panel,maxWidth:1400,margin:'0 auto 12px',borderColor:'#78663b'}}>
  <small style={{color:'#eaca77',letterSpacing:'.12em'}}>MAGNANIMOUS AI · OWNER TOOLS</small>
  <h2 id="model-arena-title" style={{fontSize:28,margin:'8px 0'}}>Model Comparison Arena</h2>
  <p style={{color:'#acc1cb',lineHeight:1.6,maxWidth:1000}}>Compare answers you already have against clear requirements. This uses Magnanimous-owned scoring: <strong>no new AI provider calls, no usage fees, no saved answers</strong>. Scores check literal phrases—not whether an answer is factually true.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:14}}>
   <label style={{display:'grid',gap:8,color:'#dceefa'}}>Required phrases (one per line)
    <textarea aria-label="Required phrases" value={required} onChange={e=>{setRequired(e.target.value);setResult(null);}} maxLength={2900} style={{...textarea,minHeight:100}}/>
   </label>
   <label style={{display:'grid',gap:8,color:'#dceefa'}}>Excluded phrases (optional)
    <textarea aria-label="Excluded phrases" value={excluded} onChange={e=>{setExcluded(e.target.value);setResult(null);}} maxLength={2900} style={{...textarea,minHeight:100}}/>
   </label>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14,marginTop:14}}>
   {answers.map((answer,index)=><label key={answer.id} style={{display:'grid',gap:8,color:'#dceefa'}}>
     <span style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>Answer {index+1}
      {answers.length>2&&<button type="button" onClick={()=>remove(answer.id)} style={{...button,padding:'5px 9px'}}>Remove</button>}
     </span>
     <textarea aria-label={`Answer ${index+1}`} placeholder="Paste an existing AI answer here" maxLength={8000} value={answer.output} onChange={e=>update(answer.id,e.target.value)} style={textarea}/>
    </label>)}
  </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14,alignItems:'center'}}>
   <button type="button" onClick={add} disabled={busy||answers.length>=8} style={{...button,opacity:answers.length>=8?.5:1}}>Add answer (up to 8)</button>
   <button type="button" onClick={compare} disabled={busy} style={{...button,background:'#14526a',borderColor:'#339db7',color:'#f4fbff'}}>{busy?'Comparing…':'Compare answers — free'}</button>
  </div>
  {error&&<p role="alert" style={{color:'#ffb7bd'}}>{error}</p>}
  {result&&<div aria-live="polite" style={{marginTop:18}}>
   <h3 style={{color:'#eaca77'}}>Comparison results</h3>
   <p style={{color:'#acc1cb'}}>{result.winner_label}. Provider calls: {result.funding.external_model_calls}; charged by this comparison: ${result.funding.actual_external_spend_usd.toFixed(2)}.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
    {result.rankings.map(rank=><article key={rank.id} style={{...panel,background:'#102632'}}>
      <h4 style={{margin:'0 0 8px'}}>#{rank.rank} · {rank.id.replace('_',' ')}</h4>
      <p style={{fontSize:26,color:'#d7b85d',margin:'4px 0'}}>{rank.rubric_adherence_score}/100</p>
      <p>Matched: {rank.required_met.length} · Missing: {rank.required_missing.length} · Exclusions found: {rank.exclusions_detected.length}</p>
      {rank.required_missing.length>0&&<p style={{color:'#ffc29c'}}>Missing: {rank.required_missing.join(', ')}</p>}
      {rank.exclusions_detected.length>0&&<p style={{color:'#ffadb6'}}>Excluded phrases found: {rank.exclusions_detected.join(', ')}</p>}
    </article>)}
   </div>
   <p style={{color:'#97b4c4',fontSize:13,lineHeight:1.6}}>{result.caveat}</p>
  </div>}
 </section>;
}
