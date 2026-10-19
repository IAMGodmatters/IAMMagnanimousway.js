import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {planMagnanimousParallelDevelopment} from '../../worker/src/magnanimous-parallel-supervisor.js';
import {provisionMagnanimousWorktrees} from '../../magnanimous-runtime/src/orca-worktree-provisioner.mjs';

const command=promisify(execFile);
async function git(root,...args){return(await command('git',['-C',root,...args],{timeout:15000})).stdout.trim();}
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'magnanimous-orca-worktrees-'));
const root=path.join(dir,'test-repo'),dest=path.join(dir,'isolated-workers');
try{
 await fs.mkdir(root);
 await git(root,'init','-b','main');
 await fs.writeFile(path.join(root,'README.md'),'Magnanimous owner-native test fixture\n');
 await git(root,'add','README.md');
 await git(root,'-c','user.name=Magnanimous QA','-c','user.email=qa@invalid.example','commit','-m','local fixture');
 const main_before=await git(root,'rev-parse','main');
 const plan=planMagnanimousParallelDevelopment({
  repo:'IAMGodmatters/IAMMagnanimousway.js',base_ref:'main',max_concurrency:2,budget_usd:0,
  tasks:[{id:'feature-a',title:'Safe independent feature',files:['worker/src/a.js']},
   {id:'feature-b',title:'Safe independent QA',files:['qa/scripts/b.mjs']}]
 });
 const preview=await provisionMagnanimousWorktrees({repoDir:root,plan,worktreeDir:dest});
 assert.equal(preview.created,false);
 assert.equal(preview.worktrees.length,2);
 assert.equal(preview.commands_executed,0);
 await assert.rejects(()=>fs.stat(dest),{code:'ENOENT'});
 const created=await provisionMagnanimousWorktrees({repoDir:root,plan,worktreeDir:dest,execute:true});
 assert.equal(created.ok,true);
 assert.equal(created.created,true);
 assert.equal(created.worktrees.length,2);
 assert.equal(created.workers_started,0);
 for(const t of created.worktrees){
  assert.equal(await git(t.folder,'rev-parse','HEAD'),main_before);
  assert.equal(await git(t.folder,'rev-parse','--abbrev-ref','HEAD'),t.branch);
 }
 assert.equal(await git(root,'rev-parse','main'),main_before,'Main must not advance.');
 assert.equal(await git(root,'status','--porcelain'),'','Main must stay clean.');
 await assert.rejects(()=>provisionMagnanimousWorktrees({repoDir:root,plan,worktreeDir:dest,execute:true}),/already exists/);
 const stale={...plan,base_sha:'deadbeef'};
 await assert.rejects(()=>provisionMagnanimousWorktrees({repoDir:root,plan:stale,worktreeDir:path.join(dir,'another')}),/advanced/);
 await assert.rejects(()=>provisionMagnanimousWorktrees({repoDir:root,plan,worktreeDir:path.join(root,'nested')}),/overlap/);
 console.log('Magnanimous owner-local Orca worktree provisioning passed: explicit execution, isolated branches, no worker costs, main untouched.');
}finally{
 await fs.rm(dir,{recursive:true,force:true});
}
