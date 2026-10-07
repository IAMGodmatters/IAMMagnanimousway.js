import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const wrangler=read('worker/wrangler.jsonc');
const deploy=read('.github/workflows/deploy.yml');
const railway=read('.github/workflows/magnanimous-railway-deploy.yml');
const security=read('worker/src/security-entrypoint.js');
const runtime=read('worker/src/runtime-control.js');
const reels=read('worker/src/reels-proxy.js');
const reelsPage=read('frontend/app/reels/page.tsx');
const oidc=read('worker/src/github-actions-oidc.js');
const checks=[
  ['Worker config has no required standalone paid origin',!wrangler.includes('MAGNANIMOUS_STANDALONE_API_ORIGIN')],
  ['Worker-first routing covers Reels proxy and runtime control',wrangler.includes('\"/reels-proxy/*\"')&&wrangler.includes('\"/__magnanimous_runtime/*\"')],
  ['production gate verifies the canonical Worker origin',deploy.includes('STANDALONE_ORIGIN: https://iammagnanimousway.com')],
  ['Worker deployment publishes the exact Git revision',deploy.includes('wrangler deploy --var MAGNANIMOUS_DEPLOY_REVISION:$GITHUB_SHA')],
  ['runtime health and smoke control are Worker-native',security.includes('handleMagnanimousRuntimeControl')&&runtime.includes("runtime:'cloudflare-worker'")&&runtime.includes("database:'cloudflare-d1'")],
  ['smoke control is OIDC-bound to deploy workflow',runtime.includes("audience:'magnanimous-deploy-smoke'")&&runtime.includes("workflowFile:'.github/workflows/deploy.yml'")&&oidc.includes("allowedEvents=['push']")],
  ['Railway exact-commit deployment is manual opt-in only',!railway.includes('  push:\n')&&railway.includes("MAGNANIMOUS_ENABLE_OPTIONAL_RAILWAY == 'true'")],
  ['public Reels no longer embeds Railway',reelsPage.includes('src="/reels-proxy/"')&&!reelsPage.includes('railway.app')],
  ['Reels Worker proxy preserves Magnanimous branding',reels.includes("REELS_ORIGIN='https://lja74zv1.basicdeploy.com'")&&reels.includes('removeUpstreamHostBranding')&&reels.includes("x-magnanimous-surface','reels")],
  ['active production files contain no Railway production hostname',![wrangler,deploy,security,runtime,reels,reelsPage].some(x=>x.includes('magnanimous-production.up.railway.app'))]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Free-first runtime-plane lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Free-first runtime-plane lock: ${checks.length} checks passed.`);
