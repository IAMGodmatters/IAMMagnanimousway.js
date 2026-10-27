import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {handleMagnanimousRepositoryIndex,normalizeRepositoryIndexRef,sanitizeRepositoryTree,searchRepositoryFileIndex} from '../../worker/src/magnanimous-repository-index.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dev=readFileSync(resolve(root,'worker/src/magnanimous-dev-agent.js'),'utf8');
const frontend=readFileSync(resolve(root,'frontend/app/developer-agent/page.tsx'),'utf8');
assert.match(dev,/requirePlatformOwner/);
assert.match(dev,/normalizeRepo\(body\.repo,env\)/);
assert.match(dev,/tenantId:user\.tenant_id/);
assert.match(dev,/handleMagnanimousRepositoryIndex/);
assert.match(frontend,/BUILD \/ REFRESH INDEX/);
assert.match(frontend,/SEARCH INDEX/);
assert.match(frontend,/exact commit/i);

const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
assert.equal(normalizeRepositoryIndexRef('release/next'),'release/next');
assert.equal(normalizeRepositoryIndexRef('../secrets'),'');
assert.equal(normalizeRepositoryIndexRef('/absolute'),'');
assert.throws(()=>sanitizeRepositoryTree({truncated:true,tree:[]}),/incomplete/);
assert.throws(()=>sanitizeRepositoryTree({truncated:false,tree:[{type:'blob',path:'../secret',sha:a}]}),/unsupported/);
const clean=sanitizeRepositoryTree({truncated:false,tree:[{type:'tree',path:'worker',sha:a},{type:'blob',path:'worker/src/index.js',sha:b,size:32},{type:'blob',path:'frontend/page.tsx',sha:c,size:21}]});
assert.equal(clean.files.length,2);
assert.equal(searchRepositoryFileIndex(clean.files,'INDEX').total_count,1);
assert.throws(()=>searchRepositoryFileIndex(clean.files,''),/Enter a file/);

class FakeDb {
  rows=new Map();
  prepare(sql){
    return {run:async()=>{},bind:(...args)=>({
      run:async()=>{if(sql.includes('INSERT INTO magnanimous_repository_file_indices')){const[tenant,repo,ref,sha,files,num,at]=args;this.rows.set(`${tenant}|${repo}|${ref}`,{commit_sha:sha,files_json:files,file_count:num,indexed_at:at});}},
      first:async()=>this.rows.get(args.join('|'))||null
    })};
  }
}
const db=new FakeDb();
const github=async(method,path)=>{
  assert.equal(method,'GET');
  if(path.includes('/commits/'))return {ok:true,status:200,data:{sha:a,commit:{tree:{sha:b}}}};
  if(path.includes('/git/trees/'))return {ok:true,status:200,data:{truncated:false,tree:[{type:'blob',path:'worker/src/index.js',sha:c,size:42}]}};
  throw new Error(`Unexpected route ${path}`);
};
const params={db,tenantId:'owner-tenant',repo:'IAMGodmatters/IAMMagnanimousway.js',ref:'main',githubRequest:github};
const built=await handleMagnanimousRepositoryIndex({...params,operation:'build'});
assert.equal(built.status,200);
assert.equal(built.body.commit_sha,a);
assert.equal(built.body.file_count,1);
assert.equal(db.rows.size,1);
assert.equal(db.rows.values().next().value.files_json.includes('secret'),false);
const found=await handleMagnanimousRepositoryIndex({...params,operation:'search',query:'index'});
assert.equal(found.status,200);
assert.equal(found.body.total_count,1);
assert.equal(found.body.files[0].path,'worker/src/index.js');
const isolated=await handleMagnanimousRepositoryIndex({...params,tenantId:'other-tenant',operation:'search',query:'index'});
assert.equal(isolated.status,404);
const incomplete=await handleMagnanimousRepositoryIndex({...params,operation:'build',githubRequest:async(method,path)=>path.includes('/commits/')?{ok:true,data:{sha:a,commit:{tree:{sha:b}}}}:{ok:true,data:{truncated:true,tree:[]}}});
assert.equal(incomplete.status,422);
assert.equal(db.rows.size,1,'a truncated tree must not replace the good snapshot');
const after=await handleMagnanimousRepositoryIndex({...params,operation:'status'});
assert.equal(after.body.commit_sha,a);
console.log('Magnanimous tenant-isolated repository index tests passed.');
