import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('worker/src/magnanimous-dev-agent.js');
const operations=read('worker/src/operations-entrypoint.js');
const security=read('worker/src/security-entrypoint.js');
const wrangler=read('worker/wrangler.jsonc');
const migration=read('worker/migrations/0067_magnanimous_dev_agent.sql');
const ui=read('frontend/app/developer-agent/page.tsx');
const ownerCenter=read('frontend/app/owner-center/page.tsx');
const robots=read('frontend/public/robots.txt');
const cognitive=read('worker/src/magnanimous-cognitive-architecture.js');
const foundry=read('worker/src/magnanimous-tool-foundry.js');
const catalog=read('worker/src/magnanimous-integration-catalog.js');

const checks=[];
const has=(text,needle,name)=>checks.push([name,text.includes(needle)]);
const lacks=(text,needle,name)=>checks.push([name,!text.includes(needle)]);

has(wrangler,'"main": "src/security-entrypoint.js"','production remains behind central security entrypoint');
has(security,"import app from './operations-entrypoint.js'",'security entrypoint still wraps operations');
has(operations,"handleMagnanimousDevAgent",'developer agent is routed through the secured operations layer');
has(runtime,"requirePlatformOwner",'developer agent requires platform-owner authorization');
has(runtime,"const GITHUB_API='https://api.github.com'",'repository adapter uses a fixed GitHub API origin');
has(runtime,'GITHUB_PLATFORM_TOKEN','repository credentials are server-side configuration');
has(runtime,'MAGNANIMOUS_DEV_REPOS','repository access is allowlisted');
has(runtime,'DEFAULT_REPO=\'IAMGodmatters/IAMMagnanimousway.js\'','default repository is explicitly scoped');
has(runtime,"status:'needs_confirmation'",'repository writes are staged before execution');
has(runtime,'CONFIRM_TTL_SECONDS=900','staged repository approvals expire after 15 minutes');
has(runtime,"body.confirm!==true",'approval requires an explicit separate confirmation payload');
has(runtime,"/confirm",'developer action exposes a separate confirmation endpoint');
has(runtime,'DEV_ACTION_APPROVER_MISMATCH','only the staging owner can approve a developer action');
has(runtime,'DEV_AGENT_MERGE_ENABLED','merge has an additional hard lock');
has(runtime,'No repository mutation has executed yet','staging never claims execution');
has(runtime,'codex_dependency_required:false','Magnanimous developer agent does not depend on Codex');
has(runtime,'upsertApprovedTeachingTool','developer skills seed through Magnanimous Tool Foundry');
has(runtime,"family:'software-engineering'",'developer skills are stored as Magnanimous engineering recipes');
has(cognitive,'MAGNANIMOUS_DEVELOPMENT_SKILLS','cognitive architecture preserves software-development competence');
has(foundry,'Proven low-risk recipes can self-promote to READY','Tool Foundry supports measured native recipe growth');
has(catalog,"id:'github'",'GitHub remains a replaceable engineering adapter target');

for(const id of ['repo-map','targeted-code-search','codebase-health','bug-fix','feature-build','refactor','code-review','security-review','ci-diagnosis','release-verify','pr-workflow','skill-learning']){
 has(runtime,`id:'${id}'`,`developer skill present: ${id}`);
}
for(const action of ['create_branch','upsert_file','create_pr','dispatch_workflow','merge_pr'])has(runtime,`action==='${action}'`,`staged developer action present: ${action}`);

has(migration,'CREATE TABLE IF NOT EXISTS magnanimous_dev_actions','developer action ledger migration exists');
has(migration,'idx_magnanimous_dev_actions_tenant_created','developer action ledger has tenant/time index');
has(ui,'Codex not required','owner console explains Codex is optional');
has(ui,'STAGE ≠ EXECUTE','owner console distinguishes staging from execution');
has(ui,'REVIEWED — APPROVE & RUN','owner console has a separate approval control');
has(ui,'aria-live="polite"','owner console announces status changes accessibly');
has(ui,':focus-visible','owner console preserves visible keyboard focus');
has(ui,'min-height:44px','owner console preserves practical touch-target sizing');
has(ui,'GITHUB_PLATFORM_TOKEN','owner console identifies server-side repo token without collecting it');
lacks(ui,'type="password"','owner console never collects repository credentials in the browser');
has(ownerCenter,'href="/developer-agent"','Owner Center links to Magnanimous Dev Agent');
has(robots,'Disallow: /developer-agent/','private developer console is excluded from crawler indexing');

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Magnanimous Dev Agent lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Magnanimous Dev Agent lock: ${checks.length} checks passed.`);
