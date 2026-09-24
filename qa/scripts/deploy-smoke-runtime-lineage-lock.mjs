import assert from 'node:assert/strict';
import {deploymentSmokeRevisionAllowed,RUNTIME_IMPACT_PATH} from '../../magnanimous-runtime/src/deploy-smoke-lineage.mjs';

const live='5ac07cbb6f64a48966f08a990cb47bfc57870bc6';
const source='007d2e97ca9e6a7699f9bf1facb8c59e7cd667dc';
const repo='IAMGodmatters/IAMMagnanimousway.js';

let calls=0;
const response=(body,{ok=true}={})=>({ok,json:async()=>body});

assert.equal(await deploymentSmokeRevisionAllowed(live,live,repo,async()=>{calls++;throw new Error('must not fetch exact match')}),true);
assert.equal(calls,0);

assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async(url)=>{
  calls++;
  assert.equal(url,`https://api.github.com/repos/${repo}/compare/${live}...${source}`);
  return response({status:'ahead',ahead_by:2,total_commits:2,files:[
    {filename:'.github/workflows/deploy.yml'},
    {filename:'qa/scripts/d1-quota-resilience-lock.mjs'}
  ]});
}),true);

for(const filename of [
  'worker/src/security-entrypoint.js',
  'frontend/app/white-label/page.tsx',
  'magnanimous-runtime/src/server.mjs',
  'video-gateway/src/index.js',
  'api/example.js',
  'package.json',
  'package-lock.json'
]){
  assert.equal(RUNTIME_IMPACT_PATH.test(filename),true,filename);
  assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async()=>response({
    status:'ahead',ahead_by:1,total_commits:1,files:[{filename}]
  })),false,filename);
}

assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async()=>response({status:'diverged',ahead_by:1,total_commits:1,files:[{filename:'.github/workflows/deploy.yml'}]})),false);
assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async()=>response({status:'ahead',ahead_by:51,total_commits:51,files:[{filename:'.github/workflows/deploy.yml'}]})),false);
assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async()=>response({status:'ahead',ahead_by:1,total_commits:1,files:Array.from({length:300},(_,i)=>({filename:`docs/${i}.md`}))})),false);
assert.equal(await deploymentSmokeRevisionAllowed(source,live,repo,async()=>response({}, {ok:false})),false);
assert.equal(await deploymentSmokeRevisionAllowed('bad',live,repo,async()=>response({})),false);

console.log('Deployment smoke runtime-lineage authorization lock: PASS');
