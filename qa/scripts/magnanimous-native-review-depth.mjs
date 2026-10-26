// Magnanimous-owned, read-only, deterministic change-impact and supply-chain analysis.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CODE=/\.(?:[cm]?[jt]sx?)$/i;
const EXTENSIONS=['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json'];
const EXCLUDE=/(?:^|\/)(?:node_modules|dist|build|\.next|coverage|vendor|\.git)(?:\/|$)/;
const SENSITIVE=/(?:^|\/)(?:\.env(?:\.(?!example$)[^/]*)?|[^/]+\.(?:pem|p12|pfx|key))$/i;
const MAX_FILE=256*1024,MAX_SOURCE=1800,MAX_PATCH=12*1024*1024;
const RULES=[
  ['Dynamic evaluation',/\b(?:eval\s*\(|new\s+Function\s*\()/],
  ['Direct HTML injection',/\bdangerouslySetInnerHTML\b|\binnerHTML\s*=/],
  ['SQL string interpolation',/\.prepare\s*\(\s*\x60[^\x60]*\$\{|(?:execute|query)\s*\(\s*\x60[^\x60]*\$\{/],
  ['Shell execution',/\b(?:exec|execSync|spawn)\s*\(/],
  ['Potential permissive CORS',/Access-Control-Allow-Origin.{0,20}(?:\*|['"]\*['"])/i],
  ['Potentially insecure cookie options',/\b(?:httpOnly|secure)\s*:\s*false\b/i],
  ['TLS verification disabled',/\b(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0\b)/],
  ['Sensitive logging',/console\.(?:log|debug|info)\s*\([^)]*\b(?:password|secret|access_token|privateKey)\b/i],
];
const safe=v=>String(v).replace(/[\r\n\0\t|<>\x60[\]]/g,'_').slice(0,180);
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024,timeout:20000});

export function importedRelatives(text){
 const found=new Set(),patterns=[
  /\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.[^'"]+)['"]/g,
  /\brequire\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
 ];
 for(const pattern of patterns)for(const match of text.matchAll(pattern))found.add(match[1].split(/[?#]/,1)[0]);
 return [...found];
}
export function impactedFiles(files,changed){
 const allowed=new Set(files.map(x=>x.path)),reverse=new Map();
 for(const {path:source,content} of files){
  if(!CODE.test(source))continue;
  for(const relative of importedRelatives(content)){
   const base=path.posix.normalize(path.posix.join(path.posix.dirname(source),relative));
   if(base.startsWith('../')||base==='..')continue;
   const choices=[base,...EXTENSIONS.map(ext=>base+ext),...EXTENSIONS.map(ext=>base+'/index'+ext)];
   const target=choices.find(c=>allowed.has(c));
   if(!target||target===source)continue;
   if(!reverse.has(target))reverse.set(target,new Set());
   reverse.get(target).add(source);
  }
 }
 const affected=new Set(changed.filter(x=>allowed.has(x))),queue=[...affected];
 while(queue.length&&affected.size<=MAX_SOURCE){
  const target=queue.shift();
  for(const dependent of reverse.get(target)||[])if(!affected.has(dependent)){affected.add(dependent);queue.push(dependent);}
 }
 return [...affected].filter(x=>!changed.includes(x)).sort();
}
export function inspectAddedLines(patch){
 const findings=new Set();
 for(const line of patch.split('\n')){
  if(!line.startsWith('+')||line.startsWith('+++'))continue;
  for(const [name,regex]of RULES)if(regex.test(line.slice(1)))findings.add(name);
 }
 return [...findings].sort();
}
export function dependencyDelta(previous,current){
 const a=previous?.packages||{},b=current?.packages||{},incoming=[],updated=[],risky=[];
 for(const [where,item]of Object.entries(b)){
  if(!where||!item||typeof item!=='object')continue;
  const before=a[where];
  if(!before)incoming.push(where);
  else if(before.version!==item.version||before.resolved!==item.resolved||before.integrity!==item.integrity)updated.push(where);
  else continue;
  const resolved=String(item.resolved||'');
  if(/^http:\/\//i.test(resolved))risky.push({kind:'critical',type:'unencrypted dependency origin'});
  if(/^(?:git\+|ssh:|file:)/i.test(resolved))risky.push({kind:'review',type:'non-registry dependency source'});
  if(/^https:\/\//i.test(resolved)&&!/^https:\/\/registry\.npmjs\.org\//i.test(resolved))risky.push({kind:'review',type:'non-default package registry'});
  if(item.hasInstallScript===true)risky.push({kind:'review',type:'package installation script'});
  if(resolved&&/^https:\/\//i.test(resolved)&&!item.integrity)risky.push({kind:'review',type:'missing lockfile integrity'});
 }
 return{introduced:incoming.length,updated:updated.length,findings:[...new Map(risky.map(x=>[x.kind+':'+x.type,x])).values()]};
}
export function analyzePackageChanges(lockfilePaths,readCurrent,readPrevious){
 let introduced=0,updated=0;const warnings=new Set(),blocks=new Set(),inspected=[];
 for(const name of lockfilePaths){
  let current;
  try{current=JSON.parse(readCurrent(name));}catch{blocks.add('Changed npm lockfile cannot be parsed');continue;}
  let previous=null;
  try{previous=JSON.parse(readPrevious(name));}catch{/* initial version */}
  if(!current||!current.packages||typeof current.packages!=='object'){blocks.add('Changed npm lockfile missing package inventory');continue;}
  const delta=dependencyDelta(previous,current);
  introduced+=delta.introduced;updated+=delta.updated;inspected.push(name);
  for(const finding of delta.findings)(finding.kind==='critical'?blocks:warnings).add(finding.type);
 }
 return{lockfiles:inspected,introduced,updated,warnings:[...warnings].sort(),blocks:[...blocks].sort()};
}
export function reviewReport(changed,dependents,sourceFindings,supply){
 const blocks=[...new Set([...changed.filter(n=>SENSITIVE.test(n)).map(()=>'Sensitive file was added or modified'),...supply.blocks])];
 const lines=['## Magnanimous native deep change-impact review','',
  'Read-only heuristic analysis; neither exploit verification nor a comprehensive security audit.','',
  '- Changed files: '+changed.length,
  '- Reverse-import dependents: '+dependents.length,
  '- Impacted sample: '+(dependents.slice(0,12).map(safe).join(', ')||'none resolved'),
  '- Lockfiles examined: '+supply.lockfiles.length,
  '- Introduced/changed locked entries: '+supply.introduced+'/'+supply.updated];
 for(const name of sourceFindings)lines.push('- REVIEW: '+safe(name));
 for(const name of supply.warnings)lines.push('- SUPPLY-CHAIN REVIEW: '+safe(name));
 for(const name of blocks)lines.push('- BLOCK: '+safe(name));
 if(!sourceFindings.length&&!supply.warnings.length&&!blocks.length)lines.push('- No additional issues detected; existing review and QA are still required.');
 lines.push('','No external model call or autonomous repair was performed; preserve authorization, billing, and tenant controls.','');
 return{markdown:lines.join('\n'),blocked:blocks.length>0,blocks};
}
function selfTest(){
 assert.deepEqual(importedRelatives("import a from './auth'; export {b} from './b'; const c=require('./c'); import('./d');").sort(),['./auth','./b','./c','./d']);
 const files=[{path:'worker/src/auth.ts',content:'export const secure=true;'},{path:'worker/src/server.ts',content:"import {secure} from './auth';"},{path:'frontend/app/ui.ts',content:"import './../../worker/src/server';"}];
 assert.deepEqual(impactedFiles(files,['worker/src/auth.ts']),['frontend/app/ui.ts','worker/src/server.ts']);
 assert(inspectAddedLines("+const x = eval(input)\n-context\n").includes('Dynamic evaluation'));
 assert.deepEqual(inspectAddedLines("-const x = eval(input)\n+const x = 0\n"),[]);
 const d=dependencyDelta({packages:{'node_modules/a':{version:'1'}}},{packages:{'node_modules/a':{version:'2',resolved:'http://not-https.example/a'},'node_modules/b':{version:'1',hasInstallScript:true}}});
 assert.equal(d.introduced,1);assert.equal(d.updated,1);assert(d.findings.some(x=>x.kind==='critical'));
 const baseline={lockfiles:[],introduced:0,updated:0,warnings:[],blocks:[]};
 assert(reviewReport(['worker/.env'],[],[],baseline).blocked);
 assert(!reviewReport(['worker/.env.example'],[],[],baseline).blocked);
 assert(analyzePackageChanges(['frontend/package-lock.json'],()=>'{bad',()=>null).blocks.length);
 console.log('Native deep review self-test PASS: dependency graph, risk rules, lockfile integrity, fail-closed paths');
}
if(process.argv.includes('--self-test'))selfTest();
else{
 const base=process.env.MAGNANIMOUS_DIFF_BASE||'HEAD^1',head=process.env.MAGNANIMOUS_DIFF_HEAD||'HEAD';
 const tracked=git(['ls-files','-z']).split('\0').filter(Boolean),changed=git(['diff','--name-only','-z','--diff-filter=ACMR',base,head]).split('\0').filter(Boolean),sources=[];
 for(const name of tracked){
  if(sources.length>=MAX_SOURCE)break;
  if(!CODE.test(name)||EXCLUDE.test(name))continue;
  try{const stat=fs.lstatSync(name);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_FILE)continue;sources.push({path:name.replaceAll('\\','/'),content:fs.readFileSync(name,'utf8')});}catch{/* deleted/unreadable */}
 }
 const patch=git(['diff','--no-ext-diff','--unified=0',base,head]);
 if(Buffer.byteLength(patch)>MAX_PATCH){console.error('Diff exceeds native review bound; analysis incomplete.');process.exit(2);}
 const lockfiles=changed.filter(x=>/^(?:[^/]+\/)?package-lock\.json$/i.test(x));
 const supply=analyzePackageChanges(lockfiles,file=>fs.readFileSync(file,'utf8'),file=>git(['show',base+':'+file]));
 const result=reviewReport(changed,impactedFiles(sources,changed),inspectAddedLines(patch),supply);
 console.log(result.markdown);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,result.markdown);
 if(result.blocked){console.error('Native deep review blocked a sensitive-file change or unencrypted dependency origin.');process.exitCode=1;}
}
