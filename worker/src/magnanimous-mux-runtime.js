import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { muxCapabilitySummary } from './magnanimous-mux-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

async function tableCount(env,table){
  try{
    const row=await env.DB.prepare(`SELECT COUNT(*) count FROM ${table}`).first();
    return Number(row?.count||0);
  }catch{return 0;}
}

async function normalizedState(env){
  if(!env?.DB)return {};
  const tables={
    assets:'magnanimous_mux_assets',
    playback_ids:'magnanimous_mux_playback_ids',
    live_streams:'magnanimous_mux_live_streams',
    uploads:'magnanimous_mux_uploads',
    webhooks:'magnanimous_mux_webhooks',
    robots_jobs:'magnanimous_mux_robots_jobs',
    data_snapshots:'magnanimous_mux_data_snapshots',
    tracks:'magnanimous_mux_tracks',
    simulcast_targets:'magnanimous_mux_simulcast_targets',
    playback_restrictions:'magnanimous_mux_playback_restrictions',
    usage_snapshots:'magnanimous_mux_usage_snapshots'
  };
  const entries=await Promise.all(Object.entries(tables).map(async([key,table])=>[key,await tableCount(env,table)]));
  return Object.fromEntries(entries);
}

function basicAuth(env){
  const id=String(env.MUX_TOKEN_ID||'').trim(),secret=String(env.MUX_TOKEN_SECRET||'').trim();
  if(!id||!secret)return '';
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

async function muxWhoAmI(env){
  const auth=basicAuth(env);
  if(!auth)return {configured:false,reachable:false,detail:'Mux server credentials are not configured.'};
  try{
    const response=await fetch('https://api.mux.com/system/v1/whoami',{headers:{Authorization:auth,Accept:'application/json'}});
    const text=await response.text();let body={};try{body=JSON.parse(text)}catch{body={}};
    if(!response.ok)return {configured:true,reachable:false,status:response.status,detail:body?.error?.messages?.join('; ')||body?.error?.message||'Mux credential probe failed.'};
    const data=body?.data||{};
    return {
      configured:true,
      reachable:true,
      organization_id:String(data.organization_id||''),
      organization_name:String(data.organization_name||''),
      environment_id:String(data.environment_id||''),
      environment_name:String(data.environment_name||''),
      environment_type:String(data.environment_type||''),
      access_token_name:String(data.access_token_name||''),
      permissions:Array.isArray(data.permissions)?data.permissions:[]
    };
  }catch(error){return {configured:true,reachable:false,detail:String(error?.message||error)};}
}

export async function handleMagnanimousMux(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/mux'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'}});
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI.'},401);
  if(user.role!=='owner')return json({detail:'Owner access required.'},403);
  const runtimeEnv=await getProviderRuntimeEnv(env);

  if(request.method==='GET'&&(path==='/api/mux'||path==='/api/mux/capabilities'||path==='/api/mux/readiness')){
    const summary=muxCapabilitySummary(runtimeEnv);
    return json({
      ...summary,
      normalized_state:await normalizedState(env),
      credential_source:'Magnanimous encrypted provider vault or server environment',
      read_probe:'/api/mux/whoami',
      provider_tokens_exposed:false,
      provider_secrets_exposed:false,
      stream_keys_exposed:false,
      private_signing_keys_exposed:false,
      webhook_signing_secrets_exposed:false,
      direct_paid_write_execution:false,
      mutation_note:'Cost-producing or security-sensitive Mux mutations are not executed by this control plane. They must go through an explicit future authorized action adapter with confirmation, permissions and audit logging.'
    });
  }

  if(request.method==='GET'&&path==='/api/mux/whoami')return json(await muxWhoAmI(runtimeEnv));

  return json({
    detail:'Magnanimous Mux Control is read-only in this release. Asset creation, direct uploads, live-stream creation, Robots jobs, signing-key changes, webhook changes and other provider mutations remain confirmation-gated and disabled here.',
    code:'MUX_CONTROL_PLANE_READ_ONLY'
  },405);
}
