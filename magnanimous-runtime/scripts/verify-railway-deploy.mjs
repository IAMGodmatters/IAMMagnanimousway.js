import assert from 'node:assert/strict';
import {deployRailwayCommit,railwayDeployConfig} from '../src/railway-deploy.mjs';

const env={
  MAGNANIMOUS_RAILWAY_DEPLOY_ENABLED:'true',
  MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN:'verification-token',
  MAGNANIMOUS_RAILWAY_PROJECT_ID:'project-1',
  MAGNANIMOUS_RAILWAY_ENVIRONMENT_ID:'environment-1',
  MAGNANIMOUS_RAILWAY_SERVICE_ID:'service-1'
};
const seen={};
const result=await deployRailwayCommit('0123456789abcdef0123456789abcdef01234567',{
  env,
  fetchImpl:async (url,init)=>{
    seen.url=url; seen.init=init;
    return new Response(JSON.stringify({data:{serviceInstanceDeployV2:'deployment-1'}}),{
      status:200,
      headers:{'content-type':'application/json'}
    });
  }
});
assert.equal(result.ok,true);
assert.equal(result.deployment_id,'deployment-1');
assert.equal(seen.url,'https://backboard.railway.com/graphql/v2');
assert.equal(seen.init.headers['Project-Access-Token'],'verification-token');
const body=JSON.parse(seen.init.body);
assert.equal(body.variables.serviceId,'service-1');
assert.equal(body.variables.environmentId,'environment-1');
assert.equal(body.variables.commitSha,'0123456789abcdef0123456789abcdef01234567');
assert.ok(body.query.includes('serviceInstanceDeployV2'));
assert.deepEqual(railwayDeployConfig(env),{
  enabled:true,configured:true,project_id:'project-1',environment_id:'environment-1',service_id:'service-1'
});
await assert.rejects(
  ()=>deployRailwayCommit('bad-sha',{env,fetchImpl:fetch}),
  /full 40-character Git SHA/
);
await assert.rejects(
  ()=>deployRailwayCommit('0123456789abcdef0123456789abcdef01234567',{
    env:{...env,MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN:''},
    fetchImpl:fetch
  }),
  /token is not configured/
);
console.log('Magnanimous first-party Railway deploy verification PASS');
