import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDeveloperRepositoryShortcuts} from '../../worker/src/magnanimous-repo-shortcuts.js';

const repo='IAMGodmatters/IAMMagnanimousway.js';
const open=buildDeveloperRepositoryShortcuts(repo,{visibility:'public',verified:true});
assert.equal(open.github_editor,`https://github.dev/${repo}`);
assert.equal(open.gitmcp,`https://gitmcp.io/${repo}`);
assert.equal(open.gitingest,`https://gitingest.com/${repo}`);
assert.equal(open.githubbox,`https://githubbox.com/${repo}`);
assert.equal(open.third_party_enabled,true);

for(const sample of [
 {visibility:'private',verified:true},
 {visibility:'public',verified:false},
 {visibility:'unknown',verified:false},
 {visibility:'internal',verified:true}
]){
 const value=buildDeveloperRepositoryShortcuts(repo,sample);
 assert.equal(value.third_party_enabled,false,'Unknown and private repositories must fail closed.');
 for(const name of ['gitmcp','gitingest','githubbox'])assert.equal(value[name],null,`${name} must stay locked.`);
 assert.equal(value.github_editor,`https://github.dev/${repo}`,'Official first-party editor remains usable.');
}
for(const invalid of ['../../sensitive','other/repo?token=abc','https://github.com/owner/repo','owner/repo/extra','owner/repo#fragment','']){
 assert.throws(()=>buildDeveloperRepositoryShortcuts(invalid),TypeError);
}

const runtime=fs.readFileSync('worker/src/magnanimous-dev-agent.js','utf8');
const ui=fs.readFileSync('frontend/app/developer-agent/page.tsx','utf8');
assert.match(runtime,/if\(request\.method==='GET'&&path==='\/api\/magnanimous\/dev-agent\/shortcuts'\)/);
assert.match(runtime,/const \{denied,user\}=await ownerContext\(request,env\);if\(denied\)return denied/);
assert.match(runtime,/normalizeRepo\(url\.searchParams\.get\('repo'\),env\)/);
assert.match(runtime,/metadata\.data\?\.private===false&&metadata\.data\?\.visibility==='public'/);
assert.match(ui,/checkShortcuts/);
assert.match(ui,/repoShortcuts\?\.repo===repo\.trim\(\)/);
assert.match(ui,/rel="noopener noreferrer"/);
assert.match(ui,/LOCKED FOR PRIVACY/);
assert.match(ui,/CHECK REPOSITORY VISIBILITY/);
assert.match(runtime,/id:'repo-context-grounding'/);
assert.match(runtime,/id:'browser-repo-workflow'/);
console.log('GitHub repository shortcuts lock: PASS (public/private/unknown, allowlist, owner gate, safe links, skills and mobile UI).');
