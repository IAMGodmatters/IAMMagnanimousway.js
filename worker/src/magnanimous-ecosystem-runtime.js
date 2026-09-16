import { currentUser } from './integrations.js';
import { MAGNANIMOUS_ECOSYSTEM_PROVIDERS, magnanimousEcosystemSummary } from './magnanimous-ecosystem-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const ownerOnly=user=>user?.role==='owner';

export async function handleMagnanimousEcosystem(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/ecosystem'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
 if(request.method!=='GET')return json({detail:'Magnanimous Ecosystem control plane is read-only. Provider writes must use their existing guarded adapter and approval path.',code:'ECOSYSTEM_CONTROL_PLANE_READ_ONLY'},405);

 const summary=magnanimousEcosystemSummary(env);
 if(path==='/api/ecosystem'||path==='/api/ecosystem/')return json(summary);
 if(path==='/api/ecosystem/capabilities')return json({identity:summary.identity,brain_identity:summary.brain_identity,provider_count:summary.provider_count,capability_count:summary.capability_count,providers:summary.providers.map(({readiness,...provider})=>provider)});
 if(path==='/api/ecosystem/readiness')return json({identity:summary.identity,brain_identity:summary.brain_identity,locks:{purchase_actions_enabled:summary.purchase_actions_enabled,ad_spend_actions_enabled:summary.ad_spend_actions_enabled,carrier_provisioning_enabled:summary.carrier_provisioning_enabled,sim_esim_activation_enabled:summary.sim_esim_activation_enabled,domain_purchase_enabled:summary.domain_purchase_enabled,destructive_devops_enabled:summary.destructive_devops_enabled,secret_exposure_allowed:summary.secret_exposure_allowed},providers:summary.providers.map(provider=>({id:provider.id,name:provider.name,category:provider.category,access:provider.access,readiness:provider.readiness}))});
 const prefix='/api/ecosystem/providers/';
 if(path.startsWith(prefix)){
  const id=decodeURIComponent(path.slice(prefix.length)).replace(/\/$/,'');
  const provider=summary.providers.find(item=>item.id===id);
  return provider?json({identity:summary.identity,brain_identity:summary.brain_identity,provider}):json({detail:'Unknown ecosystem provider.'},404);
 }
 return json({detail:'Unknown Magnanimous Ecosystem route.'},404);
}

export function ecosystemProviderIds(){return MAGNANIMOUS_ECOSYSTEM_PROVIDERS.map(provider=>provider.id)};
