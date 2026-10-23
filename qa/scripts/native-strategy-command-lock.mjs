import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const page=read('frontend/app/strategy-command/page.tsx');
const model=read('frontend/app/strategy-command/strategy-metrics.ts');
const layout=read('frontend/app/strategy-command/layout.tsx');
const operations=read('frontend/app/operations/page.tsx');
const sitemap=read('frontend/public/sitemap.xml');
const runtime=read('frontend/app/platform-runtime-script.tsx');
const template=read('frontend/app/template.tsx');

for(const fragment of [
 "getPlatformAuthToken()",
 "window.location.replace('/login?returnTo=%2Fstrategy-command')",
 "headers.set('Authorization','Bearer '+auth)",
 "request('/api/work-engine',t)",
 "method:'POST'",
 "request('/api/work-engine/'+id+'/steps'",
 "buildStrategyGoal({title:name,outcome,measure,target,due})",
 'createdId!==null',
 "onSubmit={e=>{e.preventDefault();void createGoal()}}",
 'No external action was executed.'
])assert.ok(page.includes(fragment),'Strategy cockpit lost safe behavior: '+fragment);

assert.ok(model.includes("export function classifyStrategyWork("),'Strategy progress assessment missing');
assert.ok(model.includes('nowSeconds-updated>=7*86400'),'Stalled-work advisory heuristic missing');
assert.ok(model.includes("health='attention';reason='Waiting"),'Waiting-work advisory missing');
assert.ok(model.includes("throw new Error('Provide both an objective"),'Objective validation missing');
assert.ok(layout.includes('robots:{index:false,follow:false}'),'Protected strategy route must not be indexed');
assert.ok(operations.includes('<a href="/strategy-command">Strategy &amp; Outcomes</a>'),'Strategy route not reachable from native Operations');
assert.ok(!sitemap.includes('https://iammagnanimousway.com/strategy-command'),'Private route must not enter public sitemap');

for(const [label,source] of [['runtime',runtime],['template',template]]){
 // Do not weaken the app's existing protected-by-default routing policy.
 const allowlist=source.match(label==='runtime'?/var publicPaths=\[([^;]+)\];/:/const publicPaths=new Set\(\[([^;]+)\]\);/);
 assert.ok(allowlist,'Public route allowlist could not be verified in '+label);
 assert.ok(!allowlist[1].includes("'/strategy-command'")&&!allowlist[1].includes('"/strategy-command"'),'Strategy route was made public in '+label);
}
assert.ok(!page.includes('localStorage.setItem'),'Do not persist private strategy records in browser storage');
assert.ok(!page.includes('NEXT_PUBLIC_')||page.includes('NEXT_PUBLIC_API_BASE_URL'),'Unexpected public env variable reference');
assert.ok(!/fetch\(['"]https?:\/\//.test(page),'No direct third-party strategy data transfers');
assert.ok(!/setInterval\(/.test(page),'No unsolicited background polling for strategy');
console.log('Magnanimous Strategy & Outcomes security/readiness lock PASS');
