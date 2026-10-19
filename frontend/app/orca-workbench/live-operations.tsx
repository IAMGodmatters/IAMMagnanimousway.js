'use client';
import {useState} from 'react';

type PlanTask={id:string;title:string;branch:string;files:string[];risk_review_required?:boolean};
type DevPlan={repo:string;base_ref:string;tasks:PlanTask[]};
type Staged={id:string;repo:string;action:string;payload:Record<string,unknown>;expires_at?:number;note?:string};
type ToolRow={server_id:number;server_name:string;tool_name:string;description:string;input_schema?:Record<string,unknown>};
type ServerRow={id:number;name:string;status:string;tool_count:number;last_error?:string};
type ReviewRow={server_id:number;tool_name:string;description:string;input_schema:Record<string,unknown>;manifest_sha:string};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
function auth(){
 if(typeof window==='undefined')return '';
 return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
}
async function req(path:string,method:'GET'|'POST'='GET',body?:unknown){
 const session=auth();if(!session)throw Error('Sign in to your Magnanimous owner account first.');
 const response=await fetch(api+path,{method,headers:{Authorization:'Bearer '+session,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(body??{})}:{}),cache:'no-store'});
 const data=await response.json().catch(()=>({detail:'No readable response.'}));
 if(!response.ok)throw Error(data.detail||`Request returned HTTP ${response.status}.`);
 return data;
}
function display(value:unknown){return JSON.stringify(value,null,2);}
export default function OrcaLiveOperations({plan}:{plan:DevPlan|null}){
 const[busy,setBusy]=useState('');
 const[message,setMessage]=useState('');
 const[staged,setStaged]=useState<Staged|null>(null);
 const[completed,setCompleted]=useState<Record<string,unknown>|null>(null);
 const[taskId,setTaskId]=useState('');
 const[filePath,setFilePath]=useState('');
 const[fileContents,setFileContents]=useState('');
 const[replacementVerified,setReplacementVerified]=useState(false);
 const[prTitle,setPrTitle]=useState('');
 const[serverName,setServerName]=useState('');
 const[serverUrl,setServerUrl]=useState('');
 const[bearerToken,setBearerToken]=useState('');
 const[registry,setRegistry]=useState<{servers:ServerRow[];tools:ToolRow[]}|null>(null);
 const[reviews,setReviews]=useState<ReviewRow[]>([]);
 const[reviewTarget,setReviewTarget]=useState('');
 const[callTarget,setCallTarget]=useState('');
 const[callArgs,setCallArgs]=useState('{}');
 const[callApproved,setCallApproved]=useState(false);
 const[result,setResult]=useState<unknown>(null);
 const[confirmedManifest,setConfirmedManifest]=useState(false);
 const task=plan?.tasks.find(t=>t.id===taskId)||plan?.tasks[0]||null;
 const tools=registry?.tools||[];
 const selectedTool=tools.find(t=>`${t.server_id}:${t.tool_name}`===callTarget);
 const pickedReview=reviews.find(x=>`${x.server_id}:${x.tool_name}`===reviewTarget);
 async function doAction(label:string,operation:()=>Promise<void>){
  setBusy(label);setMessage('');
  try{await operation()}catch(e){setMessage(e instanceof Error?e.message:'Action failed.');}
  finally{setBusy('')}
 }
 const stageAction=(action:string,payload:Record<string,unknown>)=>doAction('stage-'+action,async()=>{
  if(!plan)throw Error('Check a development plan first.');
  const response=await req('/api/magnanimous/dev-agent/actions','POST',{repo:plan.repo,action,payload});
  setStaged({...response,payload});setCompleted(null);
  setMessage('Staged for owner review only. Nothing has been changed. Check the exact payload before approving.');
 });
 const createBranch=()=>{if(!task||!plan)return;stageAction('create_branch',{branch:task.branch,base_ref:plan.base_ref})};
 const stageFile=()=>{if(!task||!plan)return;
  const path=(filePath||task.files[0]||'').trim();
  if(!task.files.includes(path)){setMessage('Only a file explicitly scoped in the selected plan task can be changed.');return}
  if(!fileContents.trim()||!replacementVerified){setMessage('Supply the entire reviewed file contents and acknowledge replacement before staging.');return}
  stageAction('upsert_file',{path,branch:task.branch,content:fileContents,message:`Magnanimous Orca: ${task.title}`});
 };
 const stagePr=()=>{if(!task||!plan)return;stageAction('create_pr',{title:prTitle.trim()||`Magnanimous: ${task.title}`,head:task.branch,base:plan.base_ref,body:`Magnanimous owner-reviewed workstream ${task.id}. Scoped files: ${task.files.join(', ')}. Verify diff, tests and approvals before merge.`,draft:true})};
 const confirm=()=>doAction('confirm',async()=>{
  if(!staged)throw Error('No pending owner action.');
  const response=await req(staged.note&&staged.id?`/api/magnanimous/dev-agent/actions/${encodeURIComponent(staged.id)}/confirm`:'','POST',{confirm:true});
  setCompleted(response);setStaged(null);
  setMessage(response.status==='completed'?'GitHub confirmed the owner-approved action completed. Inspect the returned evidence.':'The action did not complete.');
 });
 const refresh=()=>doAction('registry',async()=>{
  const [toolsList,pending]=await Promise.all([req('/api/magnanimous/tools'),req('/api/magnanimous/tools/manifest-reviews')]);
  setRegistry({servers:toolsList.servers||[],tools:toolsList.tools||[]});setReviews(pending.reviews||[]);
  setMessage('Live MCP registry and pending approvals refreshed.');
 });
 const connect=()=>doAction('connect',async()=>{
  if(!confirmedManifest)throw Error('Confirm that connection is discovery-only, subject to tool review.');
  if(!/^https:\/\//i.test(serverUrl))throw Error('Use a valid public HTTPS MCP endpoint.');
  const data=await req('/api/magnanimous/tools/register','POST',{name:serverName||'Orca-reviewed MCP',url:serverUrl,auth_type:bearerToken?'bearer':'none',...(bearerToken?{token:bearerToken}:{})});
  setBearerToken('');setConfirmedManifest(false);
  const [toolList,reviewList]=await Promise.all([req('/api/magnanimous/tools'),req('/api/magnanimous/tools/manifest-reviews')]);
  setRegistry({servers:toolList.servers||[],tools:toolList.tools||[]});setReviews(reviewList.reviews||[]);
  setMessage(data.discovery?.ok===false?'Connection saved, but initial tool discovery failed: '+(data.discovery.error||'unknown error'):'Connection recorded. New tools are disabled until individually reviewed and approved.');
 });
 const reloadDiscovery=()=>doAction('discover',async()=>{
  const d=await req('/api/magnanimous/tools/discover','POST',{});
  const [t,p]=await Promise.all([req('/api/magnanimous/tools'),req('/api/magnanimous/tools/manifest-reviews')]);
  setRegistry({servers:t.servers||[],tools:t.tools||[]});setReviews(p.reviews||[]);
  setMessage(`Discovery checked ${d.servers?.length||0} connections; approve new or changed tools below.`);
 });
 const review=(decision:'approve'|'reject')=>doAction('review',async()=>{
  if(!pickedReview)throw Error('Select a pending tool review.');
  await req('/api/magnanimous/tools/manifest-reviews','POST',{server_id:pickedReview.server_id,tool:pickedReview.tool_name,decision});
  const [t,p]=await Promise.all([req('/api/magnanimous/tools'),req('/api/magnanimous/tools/manifest-reviews')]);
  setRegistry({servers:t.servers||[],tools:t.tools||[]});setReviews(p.reviews||[]);setReviewTarget('');
  setMessage(decision==='approve'?'Reviewed tool enabled in the existing Magnanimous gateway.':'Tool proposal rejected; execution remains disabled.');
 });
 const call=()=>doAction('call',async()=>{
  if(!selectedTool)throw Error('Select an already approved and enabled tool.');
  if(!callApproved)throw Error('Review arguments, potential external changes and provider charges before invoking a live tool.');
  let args;try{args=JSON.parse(callArgs)}catch{throw Error('Arguments must be valid JSON.')}
  if(!args||Array.isArray(args)||typeof args!=='object')throw Error('MCP tool arguments must be a JSON object.');
  setCallApproved(false);
  const d=await req('/api/magnanimous/tools/call','POST',{server_id:selectedTool.server_id,tool:selectedTool.tool_name,arguments:args});
  setResult(d);setMessage(d.ok?'Live enabled MCP tool returned a response.':'Live MCP call failed.');
 });
 return <section className="live">
  <div className="intro"><small>LIVE ACTIONS • APPROVAL GATED</small><h2>Magnanimous Execution Controls</h2><p>These controls use your existing GitHub and MCP connections. The action requires a separate deliberate approval. Nothing automatically merges, spends money, or starts an unreviewed tool.</p></div>
  <div className="status" role="status" aria-live="polite">{message||'Live controls are ready. Sign in as platform owner to use them.'}</div>
  <div className="columns">
   <article><small>4 • GITHUB ACTIONS</small><h3>Execute reviewed development work</h3><p>Plan tasks can become real GitHub branches. Stage a full-file commit and draft pull request using the existing two-step owner approval flow.</p>
    {plan?.tasks?.length?<><label htmlFor="orca-live-task">Planned task</label><select id="orca-live-task" value={task?.id||''} onChange={e=>{setTaskId(e.target.value);setFilePath('');setReplacementVerified(false)}}>{plan.tasks.map(t=><option key={t.id} value={t.id}>{t.title} — {t.branch}</option>)}</select>
    <p className="hint">Branch: <code>{task?.branch}</code>{task?.risk_review_required?' • Sensitive paths require extra review':''}</p>
    <button disabled={busy!==''||!!staged} onClick={createBranch}>Stage GitHub branch creation</button>
    <label htmlFor="orca-live-file">Scoped file for reviewed full-file commit</label><select id="orca-live-file" value={filePath||task?.files[0]||''} onChange={e=>{setFilePath(e.target.value);setReplacementVerified(false)}}>{task?.files.map(f=><option key={f} value={f}>{f}</option>)}</select>
    <label htmlFor="orca-live-content">Complete replacement contents</label><textarea id="orca-live-content" spellCheck={false} value={fileContents} onChange={e=>{setFileContents(e.target.value);setReplacementVerified(false)}} placeholder="Paste the complete, reviewed file contents. Existing files will be replaced, not patched." />
    <label className="tick"><input type="checkbox" checked={replacementVerified} onChange={e=>setReplacementVerified(e.target.checked)}/>I verified the complete content and understand this may replace an existing file.</label>
    <button disabled={busy!==''||!!staged||!fileContents.trim()||!replacementVerified} onClick={stageFile}>Stage file commit for owner approval</button>
    <label htmlFor="orca-live-pr">Draft PR title</label><input id="orca-live-pr" value={prTitle} onChange={e=>setPrTitle(e.target.value)} placeholder={task?.title||'Feature improvement'}/>
    <button disabled={busy!==''||!!staged} onClick={stagePr}>Stage draft pull request</button>
    </>:<p className="hint">Generate a development plan in section 1 to enable real repository actions.</p>}
    {staged&&<div className="approval"><h4>Owner approval required — no write yet</h4><p>Review the exact action and scope below. Approval expires shortly.</p><pre>{display({repo:staged.repo,action:staged.action,payload:staged.payload,expires_at:staged.expires_at})}</pre><button disabled={busy!==''} onClick={confirm}>Approve and execute this exact action</button><button className="muted" onClick={()=>{setStaged(null);setMessage('Unapproved action left unexecuted; it will expire server-side.')}}>Do not execute</button></div>}
    {completed&&<pre aria-label="Completed GitHub operation evidence">{display(completed)}</pre>}
    <p className="hint">For autonomous local Git worktrees use the free, separately authorized owner-local CLI. This screen safely performs GitHub branch, file and PR actions only after your confirmation.</p>
   </article>
   <article><small>5 • LIVE MCP PROVIDERS</small><h3>Connect, approve, and run tools</h3><p>Discover a public HTTPS MCP server. Every new tool starts disabled. Review its description and JSON schema before approval; provider charges and execution permissions remain external.</p>
    <label htmlFor="orca-mcp-name">Connection label</label><input id="orca-mcp-name" value={serverName} onChange={e=>setServerName(e.target.value)} placeholder="My approved MCP server"/>
    <label htmlFor="orca-mcp-url">Public HTTPS MCP endpoint</label><input id="orca-mcp-url" value={serverUrl} onChange={e=>setServerUrl(e.target.value)} placeholder="https://provider.example/mcp"/>
    <label htmlFor="orca-mcp-token">Optional provider bearer token</label><input id="orca-mcp-token" type="password" autoComplete="off" value={bearerToken} onChange={e=>setBearerToken(e.target.value)} placeholder="Stored encrypted on the server"/>
    <label className="tick"><input type="checkbox" checked={confirmedManifest} onChange={e=>setConfirmedManifest(e.target.checked)}/>I authorize discovery of this endpoint. Tools require separate review and approval.</label>
    <div className="buttons"><button disabled={busy!==''||!confirmedManifest||!serverUrl} onClick={connect}>Connect and discover</button><button className="muted" disabled={busy!==''} onClick={refresh}>Load connected tools</button><button className="muted" disabled={busy!==''} onClick={reloadDiscovery}>Refresh discovery</button></div>
    {registry&&<div className="info"><b>{registry.servers.length} servers • {tools.length} enabled tools • {reviews.length} awaiting review</b>{registry.servers.map(s=><p key={s.id}>{s.name}: {s.status}, {s.tool_count} reported tools{s.last_error?' • '+s.last_error:''}</p>)}</div>}
    {reviews.length>0&&<div className="approval"><h4>Review untrusted tool definitions</h4><label htmlFor="orca-review">Pending tool</label><select id="orca-review" value={reviewTarget} onChange={e=>setReviewTarget(e.target.value)}><option value="">Select an unapproved tool</option>{reviews.map(r=><option key={r.server_id+':'+r.tool_name} value={r.server_id+':'+r.tool_name}>{r.tool_name} (server {r.server_id})</option>)}</select>{pickedReview&&<pre>{display({name:pickedReview.tool_name,description:pickedReview.description,input_schema:pickedReview.input_schema,fingerprint:pickedReview.manifest_sha})}</pre>}<div className="buttons"><button disabled={busy!==''||!pickedReview} onClick={()=>review('approve')}>Approve this exact tool</button><button disabled={busy!==''||!pickedReview} className="muted" onClick={()=>review('reject')}>Reject</button></div></div>}
    <h4>Call an enabled tool</h4><label htmlFor="orca-enabled">Enabled MCP tool</label><select id="orca-enabled" value={callTarget} onChange={e=>{setCallTarget(e.target.value);setCallApproved(false)}}><option value="">Select an enabled tool</option>{tools.map(t=><option key={t.server_id+':'+t.tool_name} value={t.server_id+':'+t.tool_name}>{t.tool_name} — {t.server_name}</option>)}</select>
    {selectedTool&&<p className="hint">{selectedTool.description}</p>}
    <label htmlFor="orca-args">Tool arguments (JSON object)</label><textarea id="orca-args" value={callArgs} onChange={e=>{setCallArgs(e.target.value);setCallApproved(false)}} spellCheck={false}/>
    <label className="tick"><input type="checkbox" checked={callApproved} onChange={e=>setCallApproved(e.target.checked)}/>I reviewed this tool and its arguments, authorize this specific live call, and accept any known provider charges or external effects.</label>
    <button disabled={busy!==''||!selectedTool||!callApproved} onClick={call}>Call enabled MCP tool now</button>
    {result&&<pre aria-label="Live MCP tool result">{display(result)}</pre>}
   </article>
  </div>
  <style jsx>{`
   .live{max-width:1280px;margin:28px auto;color:#eaf7ff}.intro{border-top:1px solid #2b526a;padding-top:18px}.intro small,article small{color:#91ddf4;font-weight:800;letter-spacing:.08em}.intro h2{font-size:26px;margin:6px 0}.intro p,p{color:#adbfce;line-height:1.55}.columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.status{padding:12px 15px;background:#122739;border:1px solid #39647a;border-radius:10px;margin:12px 0}article{min-width:0;border-radius:16px;border:1px solid #2a465c;background:#0c1c2c;padding:18px}h3{font-size:20px;margin:8px 0}h4{margin:16px 0 6px}label{display:block;margin:12px 0 6px;font-size:13px;font-weight:700}.tick{display:flex;gap:9px;align-items:flex-start;line-height:1.5} .tick input{width:19px;height:19px;flex:none;accent-color:#90dcef}input:not([type="checkbox"]),select,textarea{box-sizing:border-box;display:block;width:100%;padding:10px 12px;border-radius:9px;color:#eaf7ff;background:#06111c;border:1px solid #48687f;min-height:44px}textarea{min-height:110px;resize:vertical}.buttons{display:flex;flex-wrap:wrap;gap:8px}button{border:0;border-radius:10px;padding:11px 13px;min-height:44px;margin:5px 6px 5px 0;background:#91e8fa;color:#062037;font-weight:800;cursor:pointer}button.muted{background:#263f53;color:#eaf7ff}button:disabled{opacity:.5;cursor:not-allowed}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #f2df92;outline-offset:3px}.approval{border:1px solid #6d7280;padding:14px;border-radius:12px;margin:14px 0;background:#162536}.info{margin-top:10px;border:1px solid #365269;padding:12px;border-radius:10px}pre{white-space:pre-wrap;word-break:break-word;max-height:270px;overflow:auto;background:#050d15;padding:12px;border:1px solid #294052;border-radius:10px;font-size:11px}.hint{font-size:12px;color:#a7b9c8;overflow-wrap:anywhere}@media(max-width:760px){.columns{grid-template-columns:1fr}article{padding:14px}}
  `}</style>
 </section>
}
