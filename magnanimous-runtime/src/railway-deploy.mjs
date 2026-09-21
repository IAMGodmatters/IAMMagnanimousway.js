const RAILWAY_GRAPHQL_URL='https://backboard.railway.com/graphql/v2';
const SHA_RE=/^[0-9a-f]{40}$/i;

function clean(value){return String(value||'').trim()}

export function railwayDeployConfig(env=process.env){
  return {
    enabled:clean(env.MAGNANIMOUS_RAILWAY_DEPLOY_ENABLED).toLowerCase()==='true',
    configured:Boolean(clean(env.MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN)),
    project_id:clean(env.MAGNANIMOUS_RAILWAY_PROJECT_ID),
    environment_id:clean(env.MAGNANIMOUS_RAILWAY_ENVIRONMENT_ID),
    service_id:clean(env.MAGNANIMOUS_RAILWAY_SERVICE_ID)
  };
}

export async function deployRailwayCommit(commitSha,{env=process.env,fetchImpl=fetch}={}){
  const sha=clean(commitSha);
  if(!SHA_RE.test(sha))throw new Error('Railway deploy commit SHA must be a full 40-character Git SHA.');
  const config=railwayDeployConfig(env);
  if(!config.enabled){
    const error=new Error('Magnanimous Railway exact-commit deployment is disabled.');
    error.code='RAILWAY_DEPLOY_DISABLED';
    throw error;
  }
  const token=clean(env.MAGNANIMOUS_RAILWAY_DEPLOY_TOKEN);
  if(!token){
    const error=new Error('Magnanimous Railway deployment token is not configured.');
    error.code='RAILWAY_DEPLOY_NOT_CONFIGURED';
    throw error;
  }
  if(!config.environment_id||!config.service_id){
    const error=new Error('Magnanimous Railway deployment scope is incomplete.');
    error.code='RAILWAY_DEPLOY_SCOPE_MISSING';
    throw error;
  }

  const query=`mutation serviceInstanceDeployV2($serviceId: String!, $environmentId: String!, $commitSha: String!) {
    serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId, commitSha: $commitSha)
  }`;
  const response=await fetchImpl(RAILWAY_GRAPHQL_URL,{
    method:'POST',
    headers:{
      'Project-Access-Token':token,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      query,
      variables:{
        serviceId:config.service_id,
        environmentId:config.environment_id,
        commitSha:sha
      }
    }),
    signal:AbortSignal.timeout(30000)
  });
  let payload;
  try{payload=await response.json()}catch{
    throw new Error('Railway deployment API returned a non-JSON response.');
  }
  if(!response.ok||Array.isArray(payload?.errors)&&payload.errors.length){
    const detail=Array.isArray(payload?.errors)
      ? payload.errors.map(item=>String(item?.message||'Railway API error')).join('; ')
      : 'HTTP '+response.status;
    throw new Error('Railway exact-commit deployment failed: '+detail.slice(0,1500));
  }
  const deploymentId=clean(payload?.data?.serviceInstanceDeployV2);
  if(!deploymentId)throw new Error('Railway deployment API returned no deployment ID.');
  return {
    ok:true,
    deployment_id:deploymentId,
    commit_sha:sha,
    service_id:config.service_id,
    environment_id:config.environment_id
  };
}
