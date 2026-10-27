import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMagnanimousMultiFileChangeSet,commitMagnanimousMultiFileChangeSet,MAGNANIMOUS_MULTI_FILE_POLICY} from '../../worker/src/magnanimous-multi-file-change.js';

const sha='a'.repeat(40),tree='b'.repeat(40),newTree='c'.repeat(40),commit='d'.repeat(40);
const good={branch:'feat/owner-review',expected_head_sha:sha,message:'Add two reviewed files',files:[{path:'src/one.js',content:'export const one = 1;\n'},{path:'src/two.js',content:'export const two = 2;\n'}]};
assert.deepEqual(validateMagnanimousMultiFileChangeSet(good),good);
for(const edit of [
 {...good,branch:'main'},
 {...good,branch:'../bad'},
 {...good,expected_head_sha:'wrong'},
 {...good,files:[{path:'../secret',content:'x'}]},
 {...good,files:[{path:'src/file.js',content:'x\0y'}]},
 {...good,files:[{path:'src/file.js',content:'a'},{path:'SRC/FILE.js',content:'b'}]},
 {...good,files:Array.from({length:11},(_,i)=>({path:`file${i}`,content:'x'}))},
 {...good,files:[{path:'big.js',content:'x'.repeat(65537)}]}
])assert.throws(()=>validateMagnanimousMultiFileChangeSet(edit));

function githubMock(currentHead=sha){
 const calls=[];
 const github=async(method,path,body)=>{
  calls.push({method,path,body});
  if(method==='GET'&&path.includes('/git/ref/heads/'))return{ok:true,data:{object:{sha:currentHead}}};
  if(method==='GET'&&path.includes('/git/commits/'))return{ok:true,data:{tree:{sha:tree}}};
  if(method==='POST'&&path.endsWith('/git/blobs'))return{ok:true,data:{sha:'e'.repeat(40)}};
  if(method==='POST'&&path.endsWith('/git/trees'))return{ok:true,data:{sha:newTree}};
  if(method==='POST'&&path.endsWith('/git/commits'))return{ok:true,data:{sha:commit}};
  if(method==='PATCH'&&path.includes('/git/refs/heads/'))return{ok:true,data:{object:{sha:commit}}};
  throw new Error('Unexpected GitHub request');
 };
 return{github,calls};
}
const tested=githubMock();
const applied=await commitMagnanimousMultiFileChangeSet(tested.github,'example/repo',good);
assert.equal(applied.ok,true);
assert.equal(applied.data.atomic,true);
assert.equal(applied.data.published,false);
assert.deepEqual(applied.data.files_changed,['src/one.js','src/two.js']);
assert.equal(tested.calls.filter(c=>c.path.endsWith('/git/blobs')).length,2);
assert.equal(tested.calls.filter(c=>c.method==='PATCH').length,1);
assert.equal(tested.calls.at(-1).body.force,false);
assert.equal(tested.calls.find(c=>c.path.endsWith('/git/commits')&&c.method==='POST').body.parents[0],sha);
const conflict=githubMock('f'.repeat(40));
const rejected=await commitMagnanimousMultiFileChangeSet(conflict.github,'example/repo',good);
assert.equal(rejected.status,409);
assert.equal(rejected.data.code,'DEV_CHANGESET_HEAD_CONFLICT');
assert.equal(conflict.calls.filter(c=>c.method!=='GET').length,0);
assert.equal(MAGNANIMOUS_MULTI_FILE_POLICY.owner_confirmation_required,true);
assert.equal(MAGNANIMOUS_MULTI_FILE_POLICY.execution,false);

const runtime=fs.readFileSync('worker/src/magnanimous-dev-agent.js','utf8');
const ui=fs.readFileSync('frontend/app/developer-agent/page.tsx','utf8');
assert(runtime.includes("if(action==='upsert_files')return validateMagnanimousMultiFileChangeSet(p)"));
assert(runtime.includes("if(row.action==='upsert_files')return commitMagnanimousMultiFileChangeSet"));
assert(runtime.includes("status:'needs_confirmation'"));
assert(runtime.includes('DEV_ACTION_PAYLOAD_TOO_LARGE'),'staged JSON must never be silently truncated');
assert(ui.includes('Atomic multi-file edit (up to 10)'));
assert(ui.includes('CAPTURE EXACT BRANCH HEAD'));
console.log('Magnanimous atomic multi-file change lock passed: path/size guards, exact-head conflict refusal, one atomic ref update, owner confirmation and no executable side effects.');
