// Run from an owner-controlled Git checkout with Node 24+ and Git installed.
// Example: node magnanimous-runtime/scripts/orca-worktrees.mjs --repo-dir . --plan-file plan.json
// Actual filesystem mutation requires explicit --execute.
import fs from 'node:fs/promises';
import path from 'node:path';
import {provisionMagnanimousWorktrees} from '../src/orca-worktree-provisioner.mjs';

const argv=process.argv.slice(2);
function option(name){
 const i=argv.indexOf(name);
 if(i<0)return '';
 if(i+1>=argv.length||argv[i+1].startsWith('--'))throw Error('Missing value for '+name);
 return argv[i+1];
}
try{
 const repoDir=option('--repo-dir'),planFile=option('--plan-file'),worktreeDir=option('--worktree-dir');
 if(!repoDir||!planFile)throw Error('Usage: --repo-dir <local-git-root> --plan-file <reviewed-plan.json> [--worktree-dir <path>] [--execute]');
 const plan=JSON.parse(await fs.readFile(path.resolve(planFile),'utf8'));
 const result=await provisionMagnanimousWorktrees({repoDir,plan,worktreeDir:worktreeDir||undefined,execute:argv.includes('--execute')});
 console.log(JSON.stringify(result,null,2));
 if(result.ok===false)process.exitCode=1;
}catch(e){console.error('Magnanimous local worktree operation failed:',e.message);process.exitCode=1;}
