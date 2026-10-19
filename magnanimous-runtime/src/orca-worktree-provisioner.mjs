// Owner-local Git worktree provisioner: executes only fixed git subcommands.
// Does not start arbitrary agents, run task-supplied commands, merge branches, or spend API credits.
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
const run=promisify(execFile);
async function git(root,args){
 const result=await run('git',['-C',root,...args],{timeout:15000,maxBuffer:1024*1024,windowsHide:true});
 return result.stdout.trim();
}
const isWithin=(child,parent)=>child===parent||child.startsWith(parent+path.sep);
function checkPlan(plan){
 if(plan?.identity!=='Magnanimous AI'||plan?.mode!=='supervised-native-branch-planning'||!Array.isArray(plan.tasks)||!plan.tasks.length||plan.tasks.length>12)throw Error('A verified Magnanimous parallel-development plan is required.');
 if(plan.actions_executed!==0||plan.requires_owner_approval!==true)throw Error('Untrusted or preexecuted plan.');
 for(const t of plan.tasks){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(t.id)||t.branch!==`magnanimous/orca/${t.id}`)throw Error('Invalid branch identifier.');
 }
 const all=plan.waves?.flat()||[];
 if(all.length!==plan.tasks.length||new Set(all).size!==plan.tasks.length)throw Error('Invalid planned task waves.');
 if(plan.total_cost_ceiling_usd>plan.budget_usd)throw Error('Unfunded plan cannot provision worktrees.');
}
export async function provisionMagnanimousWorktrees({repoDir,plan,worktreeDir,execute=false}={}){
 checkPlan(plan);
 const root=await fs.realpath(path.resolve(String(repoDir||'')));
 const checked=await fs.realpath(await git(root,['rev-parse','--show-toplevel']));
 if(root!==checked)throw Error('repoDir must point to the actual Git repository root.');
 const status=await git(root,['status','--porcelain']);
 if(status)throw Error('Repository has uncommitted changes: preserve them before provisioning.');
 const reference=String(plan.base_ref);
 if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/.test(reference)||reference.includes('..'))throw Error('Invalid plan base ref.');
 const base_sha=await git(root,['rev-parse','--verify',reference+'^{commit}']);
 if(plan.base_sha&&plan.base_sha!==base_sha)throw Error('Base ref advanced since the plan was approved.');
 const location=path.resolve(worktreeDir||path.join(path.dirname(root),'.magnanimous-orca-worktrees'));
 if(isWithin(location,root)||isWithin(root,location))throw Error('Worktree directory cannot overlap the source repository.');
 const destinations=[];
 const seen=new Set();
 for(const t of plan.tasks){
  const folder=path.join(location,t.id);
  if(seen.has(folder))throw Error('Duplicate worktree path.');
  seen.add(folder);
  if(await fs.stat(folder).then(()=>true).catch(e=>{if(e.code==='ENOENT')return false;throw e;}))throw Error('Target worktree path already exists: '+t.id);
  const existing=await git(root,['show-ref','--verify','--quiet','refs/heads/'+t.branch]).then(()=>true).catch(e=>{if(e.code===1)return false;throw e;});
  if(existing)throw Error('Task branch already exists: '+t.id);
  destinations.push({task_id:t.id,branch:t.branch,folder,base_sha});
 }
 if(!execute)return{identity:'Magnanimous AI',ready_for_local_provisioning:true,created:false,repo:plan.repo,base_sha,worktrees:destinations,commands_executed:0};
 await fs.mkdir(location,{recursive:true});
 const created=[];
 for(const entry of destinations){
  try{
   await git(root,['worktree','add','-b',entry.branch,entry.folder,base_sha]);
   created.push(entry);
  }catch(error){
   return{identity:'Magnanimous AI',ok:false,partial:true,created,failed_task:entry.task_id,error:'Local Git worktree creation failed; inspect the repository before retrying.',commands_executed:created.length+1};
  }
 }
 return{identity:'Magnanimous AI',ok:true,created:true,base_sha,worktrees:created,commands_executed:created.length,workers_started:0};
}
