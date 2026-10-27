// An atomic Git Data API change set for the existing owner-confirmed Developer Agent.
// Source is staged first; no file is committed until the existing second approval.
const MAX_FILES=10;
const MAX_TOTAL_BYTES=240000;
const MAX_FILE_BYTES=65536;
const utf8=v=>new TextEncoder().encode(v).length;
const goodBranch=value=>typeof value==='string'&&value.length<=160&&/^[A-Za-z0-9._/-]+$/.test(value)&&!value.includes('..')&&!value.startsWith('/')&&!value.endsWith('/');
const goodPath=value=>typeof value==='string'&&value.length<=300&&!value.startsWith('/')&&!value.includes('\\')&&value.split('/').every(x=>x&&x!=='.'&&x!=='..')&&!/[\u0000-\u001f]/.test(value);
const goodSha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);

export const MAGNANIMOUS_MULTI_FILE_POLICY=Object.freeze({owner_confirmation_required:true,
 immutable_expected_head:true,atomic_commit:true,protected_default_branch_write:false,
 max_files:MAX_FILES,max_total_bytes:MAX_TOTAL_BYTES,max_file_bytes:MAX_FILE_BYTES,
 autonomous_ai_writes:false,execution:false,paid_runner_required:false});

export function validateMagnanimousMultiFileChangeSet(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Change set must be an object.');
 const branch=String(input.branch||''),expected_head_sha=String(input.expected_head_sha||'').toLowerCase(),message=String(input.message||'').trim();
 if(!goodBranch(branch)||['main','master','production'].includes(branch.toLowerCase()))throw new Error('Choose a valid feature branch, not the default or production branch.');
 if(!goodSha(expected_head_sha))throw new Error('A valid 40-character expected branch HEAD SHA is required. Refresh it before staging.');
 if(!message||message.length>300)throw new Error('Provide a commit message of at most 300 characters.');
 if(!Array.isArray(input.files)||input.files.length<1||input.files.length>MAX_FILES)throw new Error(`Change set requires 1-${MAX_FILES} files.`);
 const seen=new Set();let total=0;
 const files=input.files.map((file,i)=>{
  const path=file?.path,content=file?.content;
  if(!goodPath(path))throw new Error(`File ${i+1} has an unsafe repository path.`);
  if(seen.has(path.toLowerCase()))throw new Error('Change set contains a duplicate file path.');
  seen.add(path.toLowerCase());
  if(typeof content!=='string'||/[\u0000]/.test(content))throw new Error(`File ${path} must contain UTF-8 text without NUL characters.`);
  const bytes=utf8(content);total+=bytes;
  if(bytes>MAX_FILE_BYTES)throw new Error(`File ${path} exceeds ${MAX_FILE_BYTES} bytes.`);
  return{path,content};
 });
 if(total>MAX_TOTAL_BYTES)throw new Error(`Change set exceeds ${MAX_TOTAL_BYTES} bytes.`);
 return{branch,expected_head_sha,message,files};
}

export async function commitMagnanimousMultiFileChangeSet(github,repo,input){
 const data=validateMagnanimousMultiFileChangeSet(input),base=`/repos/${repo}`;
 const branchRef=data.branch.split('/').map(encodeURIComponent).join('/');
 const failed=result=>!result?.ok;
 const ref=await github('GET',`${base}/git/ref/heads/${branchRef}`);
 if(failed(ref))return ref;
 const currentSha=ref.data?.object?.sha;
 if(currentSha!==data.expected_head_sha)return{ok:false,status:409,data:{message:'Branch has advanced. Re-read changed files and stage a new change set.',code:'DEV_CHANGESET_HEAD_CONFLICT'}};
 const current=await github('GET',`${base}/git/commits/${currentSha}`);
 if(failed(current))return current;
 const treeSha=current.data?.tree?.sha;
 if(!goodSha(treeSha))return{ok:false,status:502,data:{message:'Branch tree could not be verified.',code:'DEV_CHANGESET_TREE_UNVERIFIED'}};
 const entries=[];
 for(const file of data.files){
  const created=await github('POST',`${base}/git/blobs`,{content:file.content,encoding:'utf-8'});
  if(failed(created))return created;
  if(!goodSha(created.data?.sha))return{ok:false,status:502,data:{message:'Repository did not return a verified blob SHA.'}};
  entries.push({path:file.path,mode:'100644',type:'blob',sha:created.data.sha});
 }
 const tree=await github('POST',`${base}/git/trees`,{base_tree:treeSha,tree:entries});
 if(failed(tree))return tree;
 if(!goodSha(tree.data?.sha))return{ok:false,status:502,data:{message:'Repository did not return a verified tree SHA.'}};
 const commit=await github('POST',`${base}/git/commits`,{message:data.message,tree:tree.data.sha,parents:[currentSha]});
 if(failed(commit))return commit;
 if(!goodSha(commit.data?.sha))return{ok:false,status:502,data:{message:'Repository did not return a verified commit SHA.'}};
 // Force remains false; GitHub rejects stale refs and protected-branch writes.
 const updated=await github('PATCH',`${base}/git/refs/heads/${branchRef}`,{sha:commit.data.sha,force:false});
 if(failed(updated))return updated;
 return{ok:true,status:200,data:{repo,branch:data.branch,base_sha:currentSha,commit_sha:commit.data.sha,files_changed:entries.map(x=>x.path),atomic:true,published:false,pr_created:false}};
}
