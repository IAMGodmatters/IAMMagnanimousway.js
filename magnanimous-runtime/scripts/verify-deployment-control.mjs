import assert from 'node:assert/strict';
import { deploymentControlConfig, deployMagnanimousCommit } from '../src/deployment-control.mjs';

const disabled=deploymentControlConfig({});
assert.equal(disabled.provider,'none');
assert.equal(disabled.enabled,false);
assert.equal(disabled.configured,false);
assert.equal(disabled.magnanimous_control_plane,true);
assert.equal(disabled.provider_identity_owner,false);
assert.equal(disabled.provider_memory_owner,false);
assert.equal(disabled.provider_reasoning_owner,false);

const env={
  MAGNANIMOUS_RAILWAY_DEPLOY_ENABLED:'true',
  MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN:'verification-token',
  MAGNANIMOUS_RAILWAY_PROJECT_ID:'project-1',
  MAGNANIMOUS_RAILWAY_ENVIRONMENT_ID:'environment-1',
  MAGNANIMOUS_RAILWAY_SERVICE_ID:'service-1'
};
const legacy=deploymentControlConfig(env);
assert.equal(legacy.provider,'railway');
assert.equal(legacy.enabled,true);
assert.equal(legacy.configured,true);

let request=null;
const deployed=await deployMagnanimousCommit('a'.repeat(40),{
  env,
  fetchImpl:async(url,init)=>{
    request={url,init};
    return Response.json({data:{serviceInstanceDeployV2:'deployment-1'}});
  }
});
assert.equal(deployed.ok,true);
assert.equal(deployed.provider,'railway');
assert.equal(deployed.control_plane,'Magnanimous AI');
assert.equal(deployed.commit_sha,'a'.repeat(40));
assert.match(String(request?.url||''),/railway\.com/);
assert.equal(request?.init?.headers?.['Project-Access-Token'],'verification-token');

await assert.rejects(
  ()=>deployMagnanimousCommit('b'.repeat(40),{env:{MAGNANIMOUS_DEPLOY_PROVIDER:'unsupported'}}),
  error=>error?.code==='MAGNANIMOUS_DEPLOY_ADAPTER_UNSUPPORTED'
);

console.log('Magnanimous provider-neutral deployment control PASS');
