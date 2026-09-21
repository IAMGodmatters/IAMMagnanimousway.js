import { deployRailwayCommit, railwayDeployConfig } from './railway-deploy.mjs';

const SHA_RE=/^[0-9a-f]{40}$/i;
const clean=value=>String(value||'').trim();

export function deploymentControlConfig(env=process.env){
  const explicit=clean(env.MAGNANIMOUS_DEPLOY_PROVIDER).toLowerCase();
  const railway=railwayDeployConfig(env);
  const provider=explicit || (railway.enabled ? 'railway' : 'none');
  const configured=provider==='railway' ? railway.configured : provider==='none' ? false : true;
  return {
    provider,
    enabled:provider!=='none',
    configured,
    exact_commit:true,
    provider_role:'replaceable infrastructure adapter',
    magnanimous_control_plane:true,
    provider_identity_owner:false,
    provider_memory_owner:false,
    provider_reasoning_owner:false,
    railway
  };
}

export async function deployMagnanimousCommit(commitSha,{env=process.env,fetchImpl=fetch}={}){
  const sha=clean(commitSha);
  if(!SHA_RE.test(sha)){
    const error=new Error('Magnanimous deploy commit SHA must be a full 40-character Git SHA.');
    error.code='MAGNANIMOUS_DEPLOY_SHA_INVALID';
    throw error;
  }
  const config=deploymentControlConfig(env);
  if(!config.enabled){
    const error=new Error('No external deployment capacity adapter is enabled.');
    error.code='MAGNANIMOUS_DEPLOY_ADAPTER_DISABLED';
    throw error;
  }
  if(config.provider==='railway'){
    const result=await deployRailwayCommit(sha,{env,fetchImpl});
    return {...result,provider:'railway',control_plane:'Magnanimous AI'};
  }
  const error=new Error('Configured deployment provider is not supported by the current adapter set.');
  error.code='MAGNANIMOUS_DEPLOY_ADAPTER_UNSUPPORTED';
  throw error;
}
