import { currentUser } from './integrations.js';
import { metaCapabilitySummary } from './magnanimous-meta-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const META_CONNECTIONS=['facebook','instagram','whatsapp'];

async function connectionSummary(env,tenantId){
  if(!env?.DB)return [];
  try{
    const {results=[]}=await env.DB.prepare(`SELECT provider,COUNT(*) connection_count,MAX(updated_at) last_updated_at
      FROM integrations WHERE tenant_id=? AND provider IN ('facebook','instagram','whatsapp') GROUP BY provider ORDER BY provider`).bind(tenantId).all();
    return META_CONNECTIONS.map(provider=>{
      const row=results.find(item=>item.provider===provider);
      return {provider,connected:Boolean(row?.connection_count),connection_count:Number(row?.connection_count||0),last_updated_at:Number(row?.last_updated_at||0)||null};
    });
  }catch{
    return META_CONNECTIONS.map(provider=>({provider,connected:false,connection_count:0,last_updated_at:null}));
  }
}

export async function handleMagnanimousMeta(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/meta'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'}});
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI.'},401);
  if(user.role!=='owner')return json({detail:'Owner access required.'},403);

  if((path==='/api/meta'||path==='/api/meta/capabilities'||path==='/api/meta/readiness')&&request.method==='GET'){
    const capabilities=metaCapabilitySummary(env);
    const connections=await connectionSummary(env,String(user.tenant_id||''));
    const configured=String(capabilities.configured_graph_version||'');
    return json({
      ...capabilities,
      owner_identity:'God Matters',
      affiliation_identity:'I AM MAGNANIMOUS WAY™',
      existing_connections:connections,
      connected_provider_count:connections.filter(item=>item.connected).length,
      action_router:'/api/assistant-integrations/actions',
      oauth_router:'/api/integrations',
      write_execution_duplicated:false,
      provider_tokens_exposed:false,
      provider_secrets_exposed:false,
      current_reference:{graph_api:'v26.0',marketing_api:'v26.0',checked_at:'2026-09-16'},
      version_note:configured==='v26.0'
        ?'Configured Graph API version matches the current reference version used by this capability catalog.'
        :'Existing Meta integrations are preserved. Review current v26.0 changelogs and app permissions before changing the configured Graph API version; no automatic version upgrade is performed.'
    });
  }

  return json({
    detail:'This Meta control plane is read-only. Existing authorized Facebook, Instagram and WhatsApp actions remain in the assistant integration router so confirmation and permission gates are preserved.',
    code:'META_CONTROL_PLANE_READ_ONLY'
  },405);
}
