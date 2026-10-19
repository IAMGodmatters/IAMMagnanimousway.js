// Native Magnanimous supervised parallel-development planner.
// No external worker, model, command or repository mutation occurs here.
const IDENT=/^[a-z][a-z0-9-]{0,39}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/;
const MAX_TASKS=12;
function failure(message){throw new Error(message)}
function path(value){
 const p=String(value??'').trim().replaceAll('\\','/');
 if(!p||p.length>250||p.startsWith('/')||p.includes('//')||p.split('/').some(x=>x==='.'||x==='..')||!/^[-a-zA-Z0-9_./@]+$/.test(p))failure('Invalid scoped repository file path.');
 return p;
}
function safeRef(value){
 const v=String(value??'main');
 if(!REF.test(v)||v.includes('..')||v.includes('//')||v.endsWith('/')||v.includes('@{'))failure('Invalid base ref.');
 return v;
}
export function planMagnanimousParallelDevelopment(input={}){
 const repo=String(input.repo||'IAMGodmatters/IAMMagnanimousway.js');
 if(!REPO.test(repo))failure('Repository must be owner/name.');
 const base_ref=safeRef(input.base_ref||'main');
 const concurrency=Number(input.max_concurrency??2),budget=Number(input.budget_usd??0);
 if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>4)failure('max_concurrency must be from 1 to 4.');
 if(!Number.isFinite(budget)||budget<0||budget>10000)failure('budget_usd must be a bounded nonnegative number.');
 const raw=input.tasks;
 if(!Array.isArray(raw)||raw.length<1||raw.length>MAX_TASKS)failure('Provide 1 to 12 development tasks.');
 const tasks=raw.map((row,i)=>{
  const id=String(row?.id||'');
  if(!IDENT.test(id))failure('Every task needs a unique lowercase hyphenated id.');
  const title=String(row?.title||'').trim();
  if(!title||title.length>240)failure('Task title is required and must be under 240 characters.');
  const files=Array.isArray(row?.files)?[...new Set(row.files.map(path))]:[];
  if(!files.length||files.length>50)failure('Each task must declare 1 to 50 scoped files.');
  const depends_on=Array.isArray(row?.depends_on)?[...new Set(row.depends_on.map(String))]:[];
  if(depends_on.length>MAX_TASKS)failure('Too many dependencies.');
  const maximum_cost_usd=Number(row?.maximum_cost_usd??0);
  if(!Number.isFinite(maximum_cost_usd)||maximum_cost_usd<0||maximum_cost_usd>10000)failure('Invalid task cost ceiling.');
  return{id,title,files,depends_on,maximum_cost_usd,branch:`magnanimous/orca/${id}`,risk_review_required:files.some(f=>/(^|\/)(billing|security|telecom|migrations|payments|stripe|auth|credentials|secrets)(\/|[.-])|\.github\/workflows\//i.test(f))};
 });
 const ids=new Set(tasks.map(x=>x.id));
 if(ids.size!==tasks.length)failure('Task IDs must be unique.');
 for(const t of tasks)for(const dep of t.depends_on)if(!ids.has(dep)||dep===t.id)failure('Task dependency is missing or self-referential.');
 const total_cost_ceiling_usd=Number(tasks.reduce((a,t)=>a+t.maximum_cost_usd,0).toFixed(2));
 if(total_cost_ceiling_usd>budget)failure('Task cost ceilings exceed the project budget. No work is dispatched.');
 const remaining=new Map(tasks.map(t=>[t.id,t])),done=new Set(),waves=[];
 while(remaining.size){
  const ready=[...remaining.values()].filter(t=>t.depends_on.every(d=>done.has(d)));
  if(!ready.length)failure('Circular dependencies prevent a safe execution order.');
  const used=new Set(),batch=[];
  for(const t of ready){
   if(batch.length>=concurrency)break;
   // File overlap forces sequential execution even when tasks are otherwise independent.
   if(t.files.some(f=>used.has(f)))continue;
   t.files.forEach(f=>used.add(f));batch.push(t);
  }
  if(!batch.length)failure('No safe independent tasks could be scheduled.');
  waves.push(batch.map(t=>t.id));
  for(const t of batch){done.add(t.id);remaining.delete(t.id);}
 }
 const overlaps=[];
 for(let i=0;i<tasks.length;i++)for(let j=i+1;j<tasks.length;j++){
  const shared=tasks[i].files.filter(f=>tasks[j].files.includes(f));
  if(shared.length)overlaps.push({tasks:[tasks[i].id,tasks[j].id],files:shared});
 }
 return{
  identity:'Magnanimous AI',mode:'supervised-native-branch-planning',repo,base_ref,
  task_count:tasks.length,max_concurrency:concurrency,budget_usd:budget,total_cost_ceiling_usd,
  waves,overlaps,tasks,protected_paths_require_review:tasks.some(t=>t.risk_review_required),
  requires_owner_approval:true,automatic_external_spend:false,actions_executed:0,
  next_action:'Use existing staged Magnanimous Dev Agent branch/PR workflow for authorized writes. Execute worktree workers only in an authorized isolated local runner, then verify candidate diffs and CI.'
 };
}
