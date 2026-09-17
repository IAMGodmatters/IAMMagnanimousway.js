import { currentUser } from './integrations.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { upsertApprovedTeachingTool } from './magnanimous-tool-foundry.js';

const GITHUB_API='https://api.github.com';
const DEFAULT_REPO='IAMGodmatters/IAMMagnanimousway.js';
const CONFIRM_TTL_SECONDS=900;
const MAX_FILE_BYTES=300000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(value,n=5000)=>String(value??'').trim().slice(0,n);
const truthy=value=>['1','true','yes','on'].includes(String(value||'').trim().toLowerCase());
let skillsSeeded=false;

export const MAGNANIMOUS_DEV_SKILLS=[
 {id:'repo-map',name:'Repository Map',risk:'low',requires_connection:false,description:'Inspect repository structure before changing code.',steps:['Identify the target repository and ref.','Inspect relevant directories and files before proposing changes.','Report what was actually inspected and what remains unknown.']},
 {id:'targeted-code-search',name:'Targeted Code Search',risk:'low',requires_connection:false,description:'Find symbols, routes, error strings, tests and related implementation paths.',steps:['Search for the exact symbol, error, route or behavior first.','Open the most relevant matches instead of scanning unrelated files.','Trace callers, tests and configuration that define the blast radius.']},
 {id:'codebase-health',name:'Codebase Health',risk:'low',requires_connection:true,description:'Assess type checks, builds, tests, CI evidence and actionable defects without bluffing.',steps:['Read the change, diff, plan or code in scope.','Trace affected paths and identify behavior changes and blast radius.','Validate findings against code, tests, contracts and runtime evidence when available.','Separate confirmed defects from open questions.','Do not claim a command or check ran unless a real runner or CI result proves it.']},
 {id:'bug-fix',name:'Bug Fix',risk:'medium',requires_connection:true,description:'Diagnose a reproducible defect, make the smallest safe correction, and verify it.',steps:['Reproduce or establish the failure from evidence.','Identify root cause rather than patching symptoms.','Preserve unrelated working behavior.','Prepare the smallest focused code change.','Run or dispatch the relevant verification before declaring success.']},
 {id:'feature-build',name:'Feature Build',risk:'medium',requires_connection:true,description:'Turn a feature goal into scoped implementation, verification and review steps.',steps:['Translate the request into acceptance criteria.','Inspect the current architecture and reuse existing patterns.','Implement additively unless removal is necessary for security or compatibility.','Add or update tests and regression locks.','Verify build, behavior and boundaries before release.']},
 {id:'refactor',name:'Safe Refactor',risk:'medium',requires_connection:true,description:'Improve structure without silently changing public behavior.',steps:['Record the current contract and callers.','Make incremental structural changes.','Preserve public interfaces unless the change explicitly requires a migration.','Use tests or deterministic checks to prove behavioral equivalence.']},
 {id:'code-review',name:'Code Review',risk:'low',requires_connection:false,description:'Review a diff for correctness, security, regressions and maintainability.',steps:['Inspect the exact diff and affected context.','Validate suspected findings against source and tests.','Prioritize actionable defects by consequence.','Keep review findings separate from code modifications unless fixes are explicitly requested.']},
 {id:'security-review',name:'Security Review',risk:'low',requires_connection:false,description:'Trace authentication, authorization, secrets, tenant boundaries and consequential actions.',steps:['Identify trust boundaries and protected data.','Trace authentication and authorization before mutation paths.','Check server-side secret handling and tenant scoping.','Require separate approval for consequential external writes.','Report evidence and residual risk without overstating certainty.']},
 {id:'ci-diagnosis',name:'CI Diagnosis',risk:'low',requires_connection:true,description:'Inspect workflow runs and isolate build, typecheck, test or deployment failures.',steps:['Inspect the exact-head workflow run.','Find the first meaningful failing step and its evidence.','Distinguish source failures from environment/provider failures.','Prepare a targeted fix and rerun only the checks needed to validate it.']},
 {id:'release-verify',name:'Release Verification',risk:'medium',requires_connection:true,description:'Verify that merged code actually deployed and passed production smoke checks.',steps:['Confirm the intended commit reached the deployment branch.','Inspect deployment, migration and smoke-test results for that exact commit.','Verify protected routes and critical health checks.','Do not call production complete until runtime evidence is green.']},
 {id:'pr-workflow',name:'Branch + Pull Request Workflow',risk:'medium',requires_connection:true,description:'Stage repository changes on a branch and open a reviewable pull request.',steps:['Create a focused branch from the intended base ref.','Write only reviewed files to that branch.','Open a pull request with scope, verification and remaining risks.','Use exact-head CI as the merge gate.']},
 {id:'skill-learning',name:'Developer Skill Learning',risk:'low',requires_connection:false,description:'Convert repeated successful engineering workflows into reusable Magnanimous Tool Foundry recipes.',steps:['Observe repeated engineering tasks and outcomes.','Generalize the reusable low-risk procedure.','Store the procedure as a Magnanimous-native recipe.','Keep real account/tool authorization separate from the recipe itself.','Promote only after measured success and regression checks.']}
];

async function ensureSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_dev_actions (
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,repo TEXT NOT NULL,action TEXT NOT NULL,
  risk_class TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'needs_confirmation',
  created_at INTEGER NOT NULL,confirmed_at INTEGER,completed_at INTEGER,response_status INTEGER,response_json TEXT NOT NULL DEFAULT '{}',error_text TEXT NOT NULL DEFAULT ''
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_dev_actions_tenant_created ON magnanimous_dev_actions(tenant_id,created_at DESC)').run();
}

async function seedSkills(env){
 if(skillsSeeded||!env?.DB)return;
 skillsSeeded=true;
 try{
  for(const skill of MAGNANIMOUS_DEV_SKILLS){
   await upsertApprovedTeachingTool(env,{
    submissionId:0,agentId:'magnanimous-dev-agent',name:`dev-${skill.id}`,
    purpose:`Magnanimous developer skill: ${skill.description}`,
    family:'software-engineering',risk:skill.risk,steps:skill.steps,
    requiredCapabilities:['source-inspection','structured-planning','verification',...(skill.requires_connection?['repository-adapter']:[])],
    requiresConnection:skill.requires_connection
   });
  }
 }catch(error){console.error('dev skill seed failed',error);skillsSeeded=false;}
}

function allowedRepos(env){
 const raw=String(env?.MAGNANIMOUS_DEV_REPOS||DEFAULT_REPO).split(',').map(x=>x.trim()).filter(Boolean);
 return new Set(raw.length?raw:[DEFAULT_REPO]);
}
function normalizeRepo(value,env){
 const repo=clip(value||DEFAULT_REPO,200);
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))return'';
 return allowedRepos(env).has(repo)?repo:'';
}
function normalizeRef(value){const ref=clip(value||'main',160);return /^[A-Za-z0-9._\/-]+$/.test(ref)&&!ref.includes('..')?ref:'';}
function normalizeBranch(value){const branch=clip(value,160);return /^[A-Za-z0-9._\/-]+$/.test(branch)&&!branch.includes('..')&&!branch.startsWith('/')&&!branch.endsWith('/')?branch:'';}
function normalizePath(value){
 const path=clip(value,1000).replace(/^\/+/, '');
 if(!path||path.includes('..')||path.includes('\\')||path.split('/').some(x=>!x))return'';
 return path;
}
function pathForApi(path){return normalizePath(path).split('/').map(encodeURIComponent).join('/');}
function githubToken(env){return clip(env?.GITHUB_PLATFORM_TOKEN||env?.MAGNANIMOUS_GITHUB_TOKEN,10000);}
function utf8ToBase64(text){const bytes=new TextEncoder().encode(String(text));let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary);}
function base64ToUtf8(value){const binary=atob(String(value||'').replace(/\s/g,''));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new TextDecoder().decode(bytes);}

async function ownerContext(request,env){
 const denied=await requirePlatformOwner(request,env);if(denied)return{denied};
 const user=await currentUser(request,env);if(!user)return{denied:json({detail:'Platform owner sign-in required.'},401)};
 return{user};
}

async function githubRequest(env,method,path,body){
 const headers={Accept:'application/vnd.github+json','User-Agent':'Magnanimous-Dev-Agent','X-GitHub-Api-Version':'2022-11-28'};
 const token=githubToken(env);if(token)headers.Authorization=`Bearer ${token}`;
 const options={method,headers};
 if(body!==undefined){headers['content-type']='application/json';options.body=JSON.stringify(body);}
 try{
  const response=await fetch(`${GITHUB_API}${path}`,options),text=await response.text();let data={};
  try{data=text?JSON.parse(text):{};}catch{data={raw:text.slice(0,20000)};}
  return{ok:response.ok,status:response.status,data};
 }catch(error){return{ok:false,status:502,data:{message:'Repository adapter request failed.',detail:clip(error?.message||error,500)}};}
}

function readiness(env){
 return{
  identity:'Magnanimous Dev Agent',
  brain:'Magnanimous AI',
  codex_dependency_required:false,
  repository_adapter:'GitHub-compatible REST',
  repository_token_configured:Boolean(githubToken(env)),
  public_repository_reads_without_token:true,
  allowed_repositories:[...allowedRepos(env)],
  staged_writes:true,
  confirmation_ttl_seconds:CONFIRM_TTL_SECONDS,
  merge_enabled:truthy(env?.DEV_AGENT_MERGE_ENABLED),
  shell_runner_configured:Boolean(String(env?.DEV_AGENT_RUNNER_URL||'').trim()),
  shell_runner_note:'A separate sandbox runner is optional. This release can use repository APIs and dispatch CI workflows without Codex.'
 };
}

function selectSkills(goal){
 const g=String(goal||'').toLowerCase(),ids=[];
 const add=id=>{if(!ids.includes(id))ids.push(id)};
 add('repo-map');add('targeted-code-search');
 if(/bug|fix|error|broken|failure|regression/.test(g))add('bug-fix');
 if(/feature|build|add|implement|create/.test(g))add('feature-build');
 if(/refactor|cleanup|simplify|architecture/.test(g))add('refactor');
 if(/review|audit|inspect|check/.test(g))add('code-review');
 if(/security|auth|permission|secret|tenant|token/.test(g))add('security-review');
 if(/ci|workflow|action|build|typecheck|test|deploy/.test(g))add('ci-diagnosis');
 if(/deploy|production|release|smoke/.test(g))add('release-verify');
 add('codebase-health');add('pr-workflow');add('skill-learning');
 return ids.map(id=>MAGNANIMOUS_DEV_SKILLS.find(x=>x.id===id)).filter(Boolean);
}
function buildPlan(goal,repo,ref){
 const skills=selectSkills(goal);
 return{
  goal:clip(goal,4000),repo,ref,operator:'Magnanimous AI',agent:'Magnanimous Dev Agent',
  skills:skills.map(x=>({id:x.id,name:x.name,risk:x.risk})),
  phases:[
   {id:'understand',name:'Understand',instruction:'Translate the request into observable acceptance criteria and preserve unrelated working behavior.'},
   {id:'inspect',name:'Inspect',instruction:'Read repository structure, exact files, related routes, tests and configuration before editing.'},
   {id:'plan',name:'Plan',instruction:'Choose the smallest coherent change set and identify verification required for each behavior change.'},
   {id:'implement',name:'Implement',instruction:'Prepare branch/file changes through the repository adapter. Repository writes are staged, not silently executed.'},
   {id:'verify',name:'Verify',instruction:'Use source checks and CI workflow dispatch where available. Never claim a command ran without evidence.'},
   {id:'review',name:'Review',instruction:'Review the exact diff for correctness, security, regressions, accessibility and product-boundary rules.'},
   {id:'release',name:'Release',instruction:'Open a pull request, use exact-head CI as the merge gate, and verify production deployment separately.'},
   {id:'learn',name:'Learn',instruction:'Record successful low-risk procedures in the Magnanimous Tool Foundry for reuse.'}
  ],
  safety:{repo_writes:'separate confirmation required',merge:'separate confirmation plus owner merge lock',credentials:'server-side only',provider_identity:'adapter only'}
 };
}

async function readRepository(request,env){
 const body=await request.json().catch(()=>({})),repo=normalizeRepo(body.repo,env),ref=normalizeRef(body.ref),path=clip(body.path,1000).replace(/^\/+/, '');
 if(!repo)return json({detail:'Repository is not in the Magnanimous developer allowlist.'},403);
 if(!ref)return json({detail:'Invalid repository ref.'},400);
 const endpoint=path?`/repos/${repo}/contents/${pathForApi(path)}?ref=${encodeURIComponent(ref)}`:`/repos/${repo}/contents?ref=${encodeURIComponent(ref)}`;
 const result=await githubRequest(env,'GET',endpoint);
 if(!result.ok)return json({detail:result.data?.message||'Repository read failed.',status:result.status},result.status);
 if(Array.isArray(result.data))return json({repo,ref,path:path||'/',type:'directory',entries:result.data.slice(0,500).map(x=>({name:x.name,path:x.path,type:x.type,sha:x.sha,size:x.size}))});
 const item=result.data||{};let content=null;
 if(item.type==='file'&&item.encoding==='base64'&&item.content&&Number(item.size||0)<=MAX_FILE_BYTES){try{content=base64ToUtf8(item.content)}catch{content=null}}
 return json({repo,ref,path:item.path||path,type:item.type||'file',sha:item.sha||null,size:item.size||0,content,content_truncated:item.type==='file'&&content===null,download_url:item.download_url||null,secrets_exposed:false});
}

async function searchRepository(request,env){
 const body=await request.json().catch(()=>({})),repo=normalizeRepo(body.repo,env),query=clip(body.query,300),limit=Math.min(Math.max(Number(body.limit)||20,1),50);
 if(!repo)return json({detail:'Repository is not in the Magnanimous developer allowlist.'},403);
 if(!query)return json({detail:'Search query is required.'},400);
 const result=await githubRequest(env,'GET',`/search/code?q=${encodeURIComponent(`${query} repo:${repo}`)}&per_page=${limit}`);
 if(!result.ok)return json({detail:result.data?.message||'Repository search failed.',status:result.status,token_configured:Boolean(githubToken(env))},result.status);
 return json({repo,query,total_count:Number(result.data?.total_count||0),items:(result.data?.items||[]).map(x=>({name:x.name,path:x.path,sha:x.sha,url:x.html_url,repository:x.repository?.full_name}))});
}

async function workflowRuns(request,env){
 const body=await request.json().catch(()=>({})),repo=normalizeRepo(body.repo,env),branch=normalizeRef(body.branch||body.ref||'main');
 if(!repo)return json({detail:'Repository is not in the Magnanimous developer allowlist.'},403);
 if(!branch)return json({detail:'Invalid branch.'},400);
 const result=await githubRequest(env,'GET',`/repos/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=20`);
 if(!result.ok)return json({detail:result.data?.message||'Workflow history read failed.',status:result.status},result.status);
 return json({repo,branch,runs:(result.data?.workflow_runs||[]).map(x=>({id:x.id,name:x.name,event:x.event,status:x.status,conclusion:x.conclusion,head_sha:x.head_sha,created_at:x.created_at,updated_at:x.updated_at,html_url:x.html_url}))});
}

function validateActionPayload(action,payload){
 const p=payload&&typeof payload==='object'?payload:{};
 if(action==='create_branch'){
  const branch=normalizeBranch(p.branch),base_ref=normalizeRef(p.base_ref||'main');
  if(!branch||!base_ref)throw new Error('create_branch requires a valid branch and base_ref.');
  return{branch,base_ref};
 }
 if(action==='upsert_file'){
  const path=normalizePath(p.path),branch=normalizeBranch(p.branch),message=clip(p.message||'Magnanimous Dev Agent update',300),content=String(p.content??'');
  if(!path||!branch||!message)throw new Error('upsert_file requires path, branch and commit message.');
  if(new TextEncoder().encode(content).length>MAX_FILE_BYTES)throw new Error(`File content exceeds ${MAX_FILE_BYTES} bytes.`);
  return{path,branch,message,content};
 }
 if(action==='create_pr'){
  const title=clip(p.title,300),head=normalizeBranch(p.head),base=normalizeBranch(p.base||'main'),body=clip(p.body,30000);
  if(!title||!head||!base)throw new Error('create_pr requires title, head and base.');
  return{title,head,base,body,draft:Boolean(p.draft)};
 }
 if(action==='dispatch_workflow'){
  const workflow_id=clip(p.workflow_id,240),ref=normalizeRef(p.ref||'main'),inputs=p.inputs&&typeof p.inputs==='object'?p.inputs:{};
  if(!workflow_id||!ref||!/^[A-Za-z0-9_.\/-]+$/.test(workflow_id))throw new Error('dispatch_workflow requires workflow_id and ref.');
  return{workflow_id,ref,inputs};
 }
 if(action==='merge_pr'){
  const pr_number=Number(p.pr_number),merge_method=['merge','squash','rebase'].includes(String(p.merge_method))?String(p.merge_method):'squash';
  if(!Number.isInteger(pr_number)||pr_number<1)throw new Error('merge_pr requires a valid PR number.');
  return{pr_number,merge_method,commit_title:clip(p.commit_title,300),commit_message:clip(p.commit_message,5000)};
 }
 throw new Error('Unsupported developer action.');
}
function actionRisk(action){return action==='merge_pr'?'high':'medium';}

async function stageAction(request,env,user){
 if(!githubToken(env))return json({detail:'A server-side GITHUB_PLATFORM_TOKEN is required before repository writes can be staged.',code:'DEV_REPOSITORY_TOKEN_REQUIRED'},409);
 const body=await request.json().catch(()=>({})),repo=normalizeRepo(body.repo,env),action=clip(body.action,80);
 if(!repo)return json({detail:'Repository is not in the Magnanimous developer allowlist.'},403);
 let payload;try{payload=validateActionPayload(action,body.payload)}catch(error){return json({detail:error?.message||'Invalid developer action.'},400)}
 await ensureSchema(env);const id=crypto.randomUUID(),ts=now(),risk=actionRisk(action);
 await env.DB.prepare(`INSERT INTO magnanimous_dev_actions(id,tenant_id,user_id,repo,action,risk_class,payload_json,status,created_at)
  VALUES(?,?,?,?,?,?,?,'needs_confirmation',?)`).bind(id,user.tenant_id,user.id,repo,action,risk,JSON.stringify(payload).slice(0,500000),ts).run();
 return json({id,repo,action,risk_class:risk,status:'needs_confirmation',expires_at:ts+CONFIRM_TTL_SECONDS,confirmation_endpoint:`/api/magnanimous/dev-agent/actions/${id}/confirm`,note:'No repository mutation has executed yet. Review the staged payload and approve separately.'},202);
}

async function executeAction(env,row,payload){
 const repo=String(row.repo),repoPath=`/repos/${repo}`;
 if(row.action==='create_branch'){
  const base=await githubRequest(env,'GET',`${repoPath}/git/ref/heads/${payload.base_ref.split('/').map(encodeURIComponent).join('/')}`);
  if(!base.ok)return base;
  return githubRequest(env,'POST',`${repoPath}/git/refs`,{ref:`refs/heads/${payload.branch}`,sha:base.data?.object?.sha});
 }
 if(row.action==='upsert_file'){
  const encoded=pathForApi(payload.path),current=await githubRequest(env,'GET',`${repoPath}/contents/${encoded}?ref=${encodeURIComponent(payload.branch)}`);
  if(!current.ok&&current.status!==404)return current;
  const body={message:payload.message,content:utf8ToBase64(payload.content),branch:payload.branch};
  if(current.ok&&current.data?.sha)body.sha=current.data.sha;
  return githubRequest(env,'PUT',`${repoPath}/contents/${encoded}`,body);
 }
 if(row.action==='create_pr')return githubRequest(env,'POST',`${repoPath}/pulls`,{title:payload.title,head:payload.head,base:payload.base,body:payload.body,draft:payload.draft});
 if(row.action==='dispatch_workflow')return githubRequest(env,'POST',`${repoPath}/actions/workflows/${encodeURIComponent(payload.workflow_id)}/dispatches`,{ref:payload.ref,inputs:payload.inputs});
 if(row.action==='merge_pr'){
  if(!truthy(env?.DEV_AGENT_MERGE_ENABLED))return{ok:false,status:409,data:{message:'Pull-request merge is hard-locked. Set DEV_AGENT_MERGE_ENABLED=true only when owner-controlled merge execution is desired.',code:'DEV_AGENT_MERGE_LOCKED'}};
  const body={merge_method:payload.merge_method};if(payload.commit_title)body.commit_title=payload.commit_title;if(payload.commit_message)body.commit_message=payload.commit_message;
  return githubRequest(env,'PUT',`${repoPath}/pulls/${payload.pr_number}/merge`,body);
 }
 return{ok:false,status:400,data:{message:'Unsupported developer action.'}};
}

async function confirmAction(request,env,user,id){
 const body=await request.json().catch(()=>({}));if(body.confirm!==true)return json({detail:'Set confirm=true in this separate approval request after reviewing the staged developer action.',code:'DEV_ACTION_CONFIRMATION_REQUIRED'},409);
 await ensureSchema(env);
 const row=await env.DB.prepare('SELECT * FROM magnanimous_dev_actions WHERE id=? AND tenant_id=? LIMIT 1').bind(id,user.tenant_id).first();
 if(!row)return json({detail:'Developer action not found.'},404);
 if(String(row.user_id)!==String(user.id))return json({detail:'Only the platform owner who staged this action may approve it.',code:'DEV_ACTION_APPROVER_MISMATCH'},403);
 if(String(row.status)!=='needs_confirmation')return json({detail:`Developer action is already ${row.status}.`,status:row.status},409);
 if(Number(row.created_at||0)<now()-CONFIRM_TTL_SECONDS){
  await env.DB.prepare("UPDATE magnanimous_dev_actions SET status='expired',error_text='confirmation expired' WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(id,user.tenant_id).run();
  return json({detail:'This developer action approval expired. Stage a fresh action and review the current payload.',code:'DEV_ACTION_CONFIRMATION_EXPIRED'},410);
 }
 if(!githubToken(env))return json({detail:'Repository token is not configured.',code:'DEV_REPOSITORY_TOKEN_REQUIRED'},409);
 const claimed=await env.DB.prepare("UPDATE magnanimous_dev_actions SET status='running',confirmed_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'").bind(now(),id,user.tenant_id).run();
 if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'Developer action could not be claimed safely.'},409);
 let payload={};try{payload=JSON.parse(row.payload_json||'{}')}catch{}
 const result=await executeAction(env,row,payload),done=now();
 if(result.ok){
  await env.DB.prepare("UPDATE magnanimous_dev_actions SET status='completed',completed_at=?,response_status=?,response_json=?,error_text='' WHERE id=? AND tenant_id=?").bind(done,result.status,JSON.stringify(result.data??{}).slice(0,300000),id,user.tenant_id).run();
  return json({id,status:'completed',action:row.action,repo:row.repo,result:result.data??{},provider_identity_exposed:false});
 }
 const detail=clip(result.data?.message||result.data?.detail||`Repository action failed (${result.status}).`,1000);
 await env.DB.prepare("UPDATE magnanimous_dev_actions SET status='failed',completed_at=?,response_status=?,response_json=?,error_text=? WHERE id=? AND tenant_id=?").bind(done,result.status,JSON.stringify(result.data??{}).slice(0,300000),detail,id,user.tenant_id).run();
 return json({id,status:'failed',action:row.action,repo:row.repo,detail,code:result.data?.code||null},result.status>=400&&result.status<600?result.status:502);
}

export async function handleMagnanimousDevAgent(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/dev-agent'))return null;
 const {denied,user}=await ownerContext(request,env);if(denied)return denied;
 await ensureSchema(env);await seedSkills(env);

 if(request.method==='GET'&&path==='/api/magnanimous/dev-agent'){
  const {results=[]}=await env.DB.prepare('SELECT id,repo,action,risk_class,status,created_at,confirmed_at,completed_at,response_status,error_text FROM magnanimous_dev_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 40').bind(user.tenant_id).all();
  return json({...readiness(env),skill_count:MAGNANIMOUS_DEV_SKILLS.length,skills_endpoint:'/api/magnanimous/dev-agent/skills',actions:results});
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dev-agent/skills')return json({identity:'Magnanimous Dev Agent',skills:MAGNANIMOUS_DEV_SKILLS,codex_dependency_required:false,tool_foundry_seeded:true});
 if(request.method==='POST'&&path==='/api/magnanimous/dev-agent/plan'){
  const body=await request.json().catch(()=>({})),repo=normalizeRepo(body.repo,env),ref=normalizeRef(body.ref||'main'),goal=clip(body.goal,4000);
  if(!repo)return json({detail:'Repository is not in the Magnanimous developer allowlist.'},403);if(!ref||!goal)return json({detail:'Goal and valid ref are required.'},400);
  return json(buildPlan(goal,repo,ref));
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dev-agent/read')return readRepository(request,env);
 if(request.method==='POST'&&path==='/api/magnanimous/dev-agent/search')return searchRepository(request,env);
 if(request.method==='POST'&&path==='/api/magnanimous/dev-agent/workflows')return workflowRuns(request,env);
 if(request.method==='GET'&&path==='/api/magnanimous/dev-agent/actions'){
  const {results=[]}=await env.DB.prepare('SELECT id,repo,action,risk_class,payload_json,status,created_at,confirmed_at,completed_at,response_status,response_json,error_text FROM magnanimous_dev_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(user.tenant_id).all();
  return json({actions:results.map(x=>({...x,payload:JSON.parse(x.payload_json||'{}'),result:JSON.parse(x.response_json||'{}')}))});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dev-agent/actions')return stageAction(request,env,user);
 const confirm=path.match(/^\/api\/magnanimous\/dev-agent\/actions\/([^/]+)\/confirm$/);
 if(confirm&&request.method==='POST')return confirmAction(request,env,user,confirm[1]);
 return json({detail:'Magnanimous developer-agent route not found.'},404);
}

export const MAGNANIMOUS_DEV_CONFIRM_TTL_SECONDS=CONFIRM_TTL_SECONDS;
