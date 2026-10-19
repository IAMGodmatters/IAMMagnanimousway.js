'use client';
import {useState} from 'react';
import OrcaLiveOperations from './live-operations';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const examplePlan={
 repo:'IAMGodmatters/IAMMagnanimousway.js',base_ref:'main',max_concurrency:2,budget_usd:0,
 tasks:[
  {id:'improve-mobile',title:'Improve an isolated mobile screen',files:['frontend/app/preview/page.tsx'],depends_on:[],maximum_cost_usd:0},
  {id:'add-regression',title:'Add independent QA',files:['qa/tests/orca-preview.spec.ts'],depends_on:[],maximum_cost_usd:0}
 ]};
const exampleContract={
 openapi:'3.1.0',info:{title:'Example read-only API',version:'1.0.0'},
 paths:{'/items/{id}':{get:{summary:'Read an item',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'OK'}}}}}
};
const stringify=(v:unknown)=>JSON.stringify(v,null,2);
const token=()=>typeof window==='undefined'?'':(localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'');
type DevPlan={repo:string;base_ref:string;tasks:{id:string;title:string;branch:string;files:string[];risk_review_required?:boolean}[]};
type ResponseValue={detail?:string;[key:string]:any};

export default function OrcaWorkbench(){
 const[planJson,setPlanJson]=useState(stringify(examplePlan));
 const[contractJson,setContractJson]=useState(stringify(exampleContract));
 const[planResult,setPlanResult]=useState<DevPlan|null>(null);
 const[contractResult,setContractResult]=useState<ResponseValue|null>(null);
 const[traceResult,setTraceResult]=useState<ResponseValue|null>(null);
 const[drafts,setDrafts]=useState<ResponseValue|null>(null);
 const[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 async function request(path:string,method:'GET'|'POST'='GET',body?:unknown){
  const session=token();
  if(!session)throw new Error('Please sign in through Owner Center first.');
  const res=await fetch(`${api}${path}`,{method,headers:{Authorization:`Bearer ${session}`,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data:ResponseValue=await res.json().catch(()=>({detail:'The server did not return readable JSON.'}));
  if(!res.ok)throw new Error(data.detail||`Request failed (${res.status}).`);
  return data;
 }
 async function run(label:string,fn:()=>Promise<void>){
  setBusy(label);setMessage('');
  try{await fn()}catch(e){setMessage(e instanceof Error?e.message:'The operation could not be completed.')}
  finally{setBusy('')}
 }
 function parse(value:string){
  try{return JSON.parse(value)}catch{throw new Error('The pasted text must be valid JSON.')}
 }
 const plan=()=>run('plan',async()=>{const d=await request('/api/magnanimous/dev-agent/parallel/plan','POST',parse(planJson));setPlanResult((d.plan||d) as DevPlan);setMessage('Safe development plan generated. No branches, agents or paid services were started.');});
 const preview=()=>run('preview',async()=>{const d=await request('/api/magnanimous/api-contract/mcp-preview','POST',{material:parse(contractJson)});setContractResult(d.draft);setMessage('MCP tool draft generated. Every tool is disabled until separately approved and connected.');});
 const stage=()=>run('stage',async()=>{const d=await request('/api/magnanimous/api-contract/mcp-stage','POST',{material:parse(contractJson),acknowledge_draft_only:true});setMessage(`Saved disabled draft ${d.id}. No outside API was contacted.`);await viewDrafts();});
 const viewDrafts=async()=>{setDrafts(await request('/api/magnanimous/api-contract/mcp-drafts'));};
 const viewTraces=()=>run('traces',async()=>{setTraceResult(await request('/api/magnanimous/tools/traces'));setMessage('Read-only MCP execution metadata loaded.');});
 const getDrafts=()=>run('drafts',async()=>{await viewDrafts();setMessage('Stored disabled tool drafts loaded.');});
 return <main className="page">
  <header><nav aria-label="Workbench navigation"><a href="/developer-agent">← Developer Agent</a><a href="/tool-foundry">Tool Foundry</a><a href="/owner-center">Owner Center</a></nav><span>I AM MAGNANIMOUS WAY™</span></header>
  <section className="hero"><small>MAGNANIMOUS AI • NATIVE TOOL SUPERVISION</small><h1>Orca Workbench</h1><p>Three practical controls for safe coding workspaces, building API tool drafts, and viewing tool performance. Magnanimous AI stays in charge. No paid service is started by these controls.</p></section>
  <div className="notice" role="status" aria-live="polite">{message||'Choose an action below. Planning and previews do not change production.'}</div>
  <section className="grid">
   <article><small>1 • ISOLATE DEVELOPMENT</small><h2>Parallel workspaces</h2><p>Describe independent tasks and their exact file paths. Magnanimous checks dependencies, file conflicts and spending ceilings.</p><label htmlFor="orca-plan">Development tasks (JSON)</label><textarea id="orca-plan" value={planJson} onChange={e=>setPlanJson(e.target.value)} spellCheck={false}/><button disabled={busy!==''} onClick={plan}>{busy==='plan'?'Checking…':'Check development plan'}</button><p className="hint">For actual free local Git worktrees, use the separate reviewed plan with the owner-local CLI. This page never runs agents on your computer.</p>{planResult&&<pre aria-label="Safe parallel development plan">{stringify(planResult)}</pre>}</article>
   <article><small>2 • BUILD CONNECTOR DRAFTS</small><h2>OpenAPI to MCP</h2><p>Paste an OpenAPI 3 JSON contract. Generate tool definitions without connecting to or charging the outside service.</p><label htmlFor="orca-api">API specification (JSON)</label><textarea id="orca-api" value={contractJson} onChange={e=>setContractJson(e.target.value)} spellCheck={false}/><div className="actions"><button disabled={busy!==''} onClick={preview}>{busy==='preview'?'Checking…':'Preview disabled tools'}</button><button className="secondary" disabled={busy!==''} onClick={stage}>{busy==='stage'?'Saving…':'Save as disabled draft'}</button></div><button className="subtle" disabled={busy!==''} onClick={getDrafts}>View my saved drafts</button>{contractResult&&<pre aria-label="Generated disabled MCP tool definitions">{stringify(contractResult)}</pre>}{drafts&&<pre aria-label="Saved disabled MCP drafts">{stringify(drafts)}</pre>}</article>
   <article><small>3 • VERIFY EXECUTION</small><h2>Tool diagnostics</h2><p>Inspect recent MCP tool-call success, failures, latency and response sizes. No prompts, credentials, or results are stored in the trace database.</p><button disabled={busy!==''} onClick={viewTraces}>{busy==='traces'?'Loading…':'View tool diagnostics'}</button><p className="hint">Only confirmed provider costs can be displayed as costs. Unverified costs remain unknown.</p>{traceResult&&<pre aria-label="MCP tool execution diagnostics">{stringify(traceResult)}</pre>}</article>
  </section>
  <OrcaLiveOperations plan={planResult?.tasks?planResult:null}/>
  <footer>Magnanimous AI remains the owner of intelligence, memory, authorization, security policy and verification. Repository writes, external tool activation, telecommunications and payments remain governed by their existing controls.</footer>
  <style jsx>{`
   *{box-sizing:border-box} .page{min-height:100vh;background:#07101b;color:#eef8ff;font-family:Inter,system-ui,sans-serif;padding:28px;overflow-wrap:anywhere}
   header{max-width:1280px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;color:#79dbf3;font-size:12px}
   nav{display:flex;gap:14px;flex-wrap:wrap} a{color:#a5f0ff;text-decoration:none}a:hover{text-decoration:underline}
   .hero{max-width:1280px;margin:20px auto;border:1px solid #2b526a;border-radius:18px;padding:24px;background:linear-gradient(110deg,#113247,#18233a)}
   small{color:#78dfff;letter-spacing:.1em;font-weight:800}h1{font-size:clamp(32px,5vw,55px);margin:8px 0}h2{font-size:22px;margin:10px 0}p{color:#c1cdd9;line-height:1.55}
   .notice{max-width:1280px;margin:0 auto 16px;padding:12px 15px;border:1px solid #345f70;border-radius:12px;background:#0d2332}
   .grid{max-width:1280px;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
   article{min-width:0;border:1px solid #2a465c;background:#0c1c2c;border-radius:16px;padding:18px}
   label{display:block;font-size:13px;font-weight:700;margin-top:12px}textarea{width:100%;min-height:160px;resize:vertical;margin:8px 0 12px;background:#06121e;color:#eef8ff;border:1px solid #54798f;border-radius:10px;padding:12px;font-size:12px}
   button{border:0;border-radius:10px;background:#91e8fa;color:#082037;font-weight:800;padding:12px 14px;min-height:44px;cursor:pointer}
   button:disabled{opacity:.55;cursor:wait}button:focus-visible,a:focus-visible,textarea:focus-visible{outline:3px solid #f4dc8f;outline-offset:3px}
   .actions{display:flex;flex-wrap:wrap;gap:8px}.secondary{background:#d5baf9}.subtle{background:#263f53;color:#eaf7ff;margin-top:10px}
   pre{white-space:pre-wrap;word-break:break-word;background:#050d15;border:1px solid #294052;border-radius:10px;padding:12px;font-size:11px;max-height:330px;overflow:auto}
   .hint{font-size:12px;color:#a8bbc9}footer{max-width:1280px;margin:22px auto;color:#9bb0c2;font-size:12px}
   @media(max-width:980px){.grid{grid-template-columns:1fr 1fr}}
   @media(max-width:700px){.grid{grid-template-columns:1fr}.page{padding:14px}.hero{padding:18px}header{align-items:flex-start}}
  `}</style>
 </main>;
}
