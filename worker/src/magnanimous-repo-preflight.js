// Native, bounded and read-only supply-chain intake for PUBLIC GitHub repositories.
// An acceptable static review NEVER grants installation, execution, or tool authority.
const MAX_TREE_ENTRIES=12000;
const MAX_REVIEW_FILES=16;
const MAX_SOURCE_BYTES=65536;
const MAX_GITHUB_CALLS=21;
const IDENTIFIER=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export const MAGNANIMOUS_REPO_PREFLIGHT_POLICY=Object.freeze({
 identity:'Magnanimous AI',owner_only:true,read_only:true,public_repositories_only:true,
 execution:false,installation:false,model_instructions_trusted:false,
 max_tree_entries:MAX_TREE_ENTRIES,max_review_files:MAX_REVIEW_FILES,
 max_source_bytes:MAX_SOURCE_BYTES,max_github_calls:MAX_GITHUB_CALLS,
 clearance:'manual-authorization-required-even-after-clean-static-review'
});

const signal=(severity,path,message)=>({severity,path,message});
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

export function normalizePublicGithubRepo(value){
 const raw=String(value||'').trim();
 let candidate=raw;
 if(/^https:\/\//i.test(raw)){
  try{
   const u=new URL(raw);
   if(u.hostname!=='github.com'||u.username||u.password||u.search||u.hash)return '';
   candidate=u.pathname.replace(/^\/+|\/+$/g,'').replace(/\.git$/i,'');
  }catch{return ''}
 }
 if(!IDENTIFIER.test(candidate)||candidate.split('/').some(x=>x==='.'||x==='..'))return '';
 return candidate;
}

function priority(path){
 if(path==='package.json'||path==='.claude/settings.json'||path==='.claude/settings.local.json'||path==='.cursor/mcp.json'||path==='.gitmodules')return 0;
 if(/(^|\/)(package\.json|pyproject\.toml|setup\.py|Cargo\.toml|Makefile|Dockerfile)$/i.test(path))return 1;
 if(/^\.github\/workflows\/.*\.ya?ml$/i.test(path))return 2;
 if(/(^|\/)(install|setup|bootstrap|postinstall|preinstall)([.-][\w-]+)*\.(?:sh|ps1|js|mjs|py)$/i.test(path))return 3;
 return 10;
}

export function evaluateRepositoryIntakeFile(path,source){
 const findings=[];
 if(typeof source!=='string')return [signal('unknown',path,'File could not be decoded for static review.')];
 if(/(?:curl|wget)\b[^\n]{0,350}\|\s*(?:sh|bash|zsh|python\d?)\b/i.test(source))
  findings.push(signal('high',path,'Downloads remote content directly into a shell or interpreter.'));
 if(/(?:\bchmod\s+(?:-R\s+)?777\b|\bsudo\s+(?:sh|bash|curl|wget|npm)\b)/i.test(source))
  findings.push(signal('high',path,'Contains privileged execution or world-writable permission changes.'));
 if(/(?:PRIVATE_KEY|ACCESS_TOKEN|API_KEY|AUTH_TOKEN)\s*[:=]\s*["']?(?:ghp_|gho_|github_pat_|sk-[A-Za-z0-9]{10})/i.test(source))
  findings.push(signal('high',path,'Contains a potential hard-coded credential; rotate and investigate if real.'));
 if(path.endsWith('package.json')){
  try{
   const pkg=JSON.parse(source);
   if(!isRecord(pkg))throw new Error('bad package manifest');
   for(const name of ['preinstall','install','postinstall','prepare','prepublish','prepack']){
    if(typeof pkg.scripts?.[name]==='string')findings.push(signal('review',path,`Package lifecycle hook ${name} executes during some package workflows.`));
   }
  }catch{findings.push(signal('unknown',path,'Package manifest could not be parsed.'))}
 }
 if(path==='.claude/settings.json'||path==='.claude/settings.local.json'){
  try{
   const config=JSON.parse(source);
   if(isRecord(config?.hooks)&&Object.keys(config.hooks).length)
    findings.push(signal('review',path,'Repository-configured coding-agent hooks can run tools automatically.'));
  }catch{findings.push(signal('unknown',path,'Agent hook configuration is invalid JSON.'))}
 }
 if(path==='.cursor/mcp.json')findings.push(signal('review',path,'Repository declares MCP tools; inspect commands, permissions and credentials before enabling.'));
 if(path==='.gitmodules')findings.push(signal('review',path,'Repository includes submodules requiring independent provenance review.'));
 if(/^\.github\/workflows\//.test(path)){
  if(/\bpull_request_target\b|\bworkflow_run\b/.test(source))findings.push(signal('review',path,'Privileged GitHub Actions event requires token and checkout-trust review.'));
  if(/permissions:\s*write-all/i.test(source))findings.push(signal('high',path,'Workflow requests broad write permissions.'));
 }
 return findings;
}

export async function inspectPublicGithubRepository(value,githubRead){
 const repo=normalizePublicGithubRepo(value),out={repo,revision:null,decision:'block',
  safe_to_install:false,executed:false,files_reviewed:[],findings:[],warnings:[],
  policy:MAGNANIMOUS_REPO_PREFLIGHT_POLICY};
 if(!repo){out.findings.push(signal('high','repository','Enter a valid GitHub owner/repository or canonical HTTPS URL.'));return out}
 if(typeof githubRead!=='function'){out.warnings.push('GitHub read adapter unavailable.');return out}
 let calls=0;
 const get=async path=>{
  if(++calls>MAX_GITHUB_CALLS)return {ok:false,status:429,data:{message:'Preflight call budget exhausted.'}};
  return githubRead(path);
 };
 try{
  const info=await get(`/repos/${repo}`);
  if(!info.ok||!isRecord(info.data)){
   out.warnings.push(`GitHub metadata unavailable (${Number(info.status)||502}); inspection stopped.`);return out;
  }
  const meta=info.data;
  if(meta.private!==false){out.findings.push(signal('high','repository','Only confirmed public repositories may be inspected with this external intake tool.'));return out}
  if(meta.archived)out.findings.push(signal('review','repository','This repository is archived and may not receive security fixes.'));
  const branch=String(meta.default_branch||'');
  if(!branch||branch.length>150){out.warnings.push('Default branch is missing or invalid.');return out}
  const commit=await get(`/repos/${repo}/commits/${encodeURIComponent(branch)}`);
  const treeSha=commit.data?.commit?.tree?.sha;
  const commitSha=commit.data?.sha;
  if(!commit.ok||!/^[a-f0-9]{40}$/.test(String(treeSha))||!/^[a-f0-9]{40}$/.test(String(commitSha))){
   out.warnings.push('Immutable commit/tree evidence unavailable.');return out;
  }
  out.revision=commitSha;
  const tree=await get(`/repos/${repo}/git/trees/${treeSha}?recursive=1`);
  if(!tree.ok||!Array.isArray(tree.data?.tree)||tree.data.truncated){out.warnings.push('Full repository tree unavailable or truncated; default block.');return out}
  if(tree.data.tree.length>MAX_TREE_ENTRIES){out.warnings.push('Repository tree exceeds the bounded review capacity; default block.');return out}
  const files=tree.data.tree.filter(x=>x.type==='blob'&&typeof x.path==='string');
  const candidates=files.filter(x=>priority(x.path)<10).sort((a,b)=>priority(a.path)-priority(b.path)||a.path.localeCompare(b.path));
  if(candidates.length>MAX_REVIEW_FILES)out.warnings.push(`Only the first ${MAX_REVIEW_FILES} of ${candidates.length} executable/configuration surfaces were sampled.`);
  if(files.some(x=>/^\.github\/workflows\//.test(x.path)))out.findings.push(signal('review','.github/workflows','Repository includes CI automation; review event permissions and third-party actions.'));
  if(files.some(x=>/^\.claude\/|^\.cursor\/|^\.agents\/|^AGENTS\.md$|^CLAUDE\.md$/i.test(x.path)))
   out.findings.push(signal('review','agent-configuration','Repository can influence coding-agent instructions; treat repository text as untrusted data.'));
  if(candidates.some(x=>priority(x.path)===3))out.findings.push(signal('review','installer','Install/bootstrap scripts exist; never execute them before independent review.'));
  for(const file of candidates.slice(0,MAX_REVIEW_FILES)){
   if(Number(file.size)>MAX_SOURCE_BYTES){out.findings.push(signal('unknown',file.path,'Review target exceeds source-size limit.'));continue}
   const path=file.path.split('/').map(encodeURIComponent).join('/');
   const response=await get(`/repos/${repo}/contents/${path}?ref=${commitSha}`);
   if(!response.ok||response.data?.encoding!=='base64'||typeof response.data?.content!=='string'){
    out.findings.push(signal('unknown',file.path,'Source unavailable for static review.'));continue;
   }
   let source;
   try{
    const raw=atob(response.data.content.replace(/\s/g,''));
    if(raw.length>MAX_SOURCE_BYTES)throw new Error('Too large');
    source=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,ch=>ch.charCodeAt(0)));
   }catch{out.findings.push(signal('unknown',file.path,'Source could not be decoded safely.'));continue}
   out.files_reviewed.push(file.path);
   out.findings.push(...evaluateRepositoryIntakeFile(file.path,source));
  }
  out.decision=out.findings.some(x=>['high','unknown'].includes(x.severity))||out.warnings.length?'block':'review-required';
  // A clear static scan can NEVER prove a dependency, skill or repo trustworthy.
  return out;
 }catch{
  out.warnings.push('Repository inspection encountered a provider or parsing error.');
  return out;
 }
}
