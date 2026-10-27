import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const wrangler=read('worker/wrangler.jsonc');
const deploy=read('.github/workflows/deploy.yml');
const railway=read('.github/workflows/magnanimous-railway-deploy.yml');
const dataStage=read('.github/workflows/magnanimous-production-data-stage.yml');
const runtimeSecrets=read('.github/workflows/magnanimous-runtime-secrets-stage.yml');
const security=read('worker/src/security-entrypoint.js');
const bpo=read('worker/src/bpo-operations-runtime.js');
const runtime=read('worker/src/runtime-control.js');
const reels=read('worker/src/reels-proxy.js');
const reelsPage=read('frontend/app/reels/page.tsx');
const oidc=read('worker/src/github-actions-oidc.js');
const checks=[
  ['Worker diagnostic sampling stays free-first and bounded',/"observability"\s*:\s*\{[\s\S]*?"logs"\s*:\s*\{\s*"enabled"\s*:\s*true\s*,\s*"head_sampling_rate"\s*:\s*0\.05/.test(wrangler)&&/"traces"\s*:\s*\{\s*"enabled"\s*:\s*false/.test(wrangler)],
  ['BPO D1 schema initialization is single-flight per Worker isolate',bpo.includes('let bpoSchemaReady=false')&&bpo.includes('let bpoSchemaPromise=null')&&bpo.includes('if(bpoSchemaReady)return;')&&bpo.includes('if(bpoSchemaPromise)return bpoSchemaPromise;')&&bpo.includes('bpoSchemaReady=true;')],
  ['BPO initialization retries after transient D1 failure',bpo.includes('finally{if(!bpoSchemaReady)bpoSchemaPromise=null}')],
  ['Worker config has no required standalone paid origin',!wrangler.includes('MAGNANIMOUS_STANDALONE_API_ORIGIN')],
  ['Worker-first routing covers Reels proxy and runtime control',wrangler.includes('\"/reels-proxy/*\"')&&wrangler.includes('\"/__magnanimous_runtime/*\"')],
  ['production gate verifies the canonical Worker origin',deploy.includes('STANDALONE_ORIGIN: https://iammagnanimousway.com')],
  ['Worker deployment publishes the exact Git revision',deploy.includes('wrangler deploy --var MAGNANIMOUS_DEPLOY_REVISION:$GITHUB_SHA')],
  ['runtime health and smoke control are Worker-native',security.includes('handleMagnanimousRuntimeControl')&&runtime.includes("runtime:'cloudflare-worker'")&&runtime.includes("database:'cloudflare-d1'")],
  ['smoke control is OIDC-bound to deploy workflow',runtime.includes("audience:'magnanimous-deploy-smoke'")&&runtime.includes("workflowFile:'.github/workflows/deploy.yml'")&&oidc.includes("allowedEvents=['push']")],
  ['Railway exact-commit deployment is manual opt-in only',!railway.includes('  push:\n')&&railway.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")],
  ['standalone secret/data migration planes are optional instead of production blockers',dataStage.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")&&runtimeSecrets.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")],
  ['optional standalone plane has no retired hard-coded Railway hostname',[railway,dataStage,runtimeSecrets].every(x=>x.includes('vars.MAGNANIMOUS_STANDALONE_ORIGIN')&&!x.includes('magnanimous-production.up.railway.app'))],
  ['public Reels no longer embeds Railway',reelsPage.includes('src="/reels-proxy/"')&&!reelsPage.includes('railway.app')],
  ['Reels Worker proxy preserves Magnanimous branding',reels.includes("REELS_ORIGIN='https://lja74zv1.basicdeploy.com'")&&reels.includes('removeUpstreamHostBranding')&&reels.includes("x-magnanimous-surface','reels")],
  ['active production files contain no Railway production hostname',![wrangler,deploy,security,runtime,reels,reelsPage].some(x=>x.includes('magnanimous-production.up.railway.app'))]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Free-first runtime-plane lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Free-first runtime-plane lock: ${checks.length} checks passed.`);
