import { currentUser } from './integrations.js';
import { whatsappCapabilitySummary } from './magnanimous-whatsapp-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

async function whatsappConnectionSummary(env,tenantId){
  if(!env?.DB)return {connected:false,connection_count:0,last_updated_at:null};
  try{
    const row=await env.DB.prepare(`SELECT COUNT(*) connection_count,MAX(updated_at) last_updated_at
      FROM integrations WHERE tenant_id=? AND provider='whatsapp'`).bind(tenantId).first();
    return {connected:Number(row?.connection_count||0)>0,connection_count:Number(row?.connection_count||0),last_updated_at:Number(row?.last_updated_at||0)||null};
  }catch{return {connected:false,connection_count:0,last_updated_at:null};}
}

async function tableCount(env,table,tenantId){
  if(!env?.DB)return 0;
  try{const row=await env.DB.prepare(`SELECT COUNT(*) count FROM ${table} WHERE tenant_id=?`).bind(tenantId).first();return Number(row?.count||0);}catch{return 0;}
}

async function normalizedState(env,tenantId){
  const tables={
    accounts:'magnanimous_whatsapp_accounts',
    phone_assets:'magnanimous_whatsapp_phone_assets',
    templates:'magnanimous_whatsapp_templates',
    flows:'magnanimous_whatsapp_flows',
    message_state:'magnanimous_whatsapp_message_state',
    webhook_events:'magnanimous_whatsapp_webhook_events',
    consent_records:'magnanimous_whatsapp_consent',
    quality_snapshots:'magnanimous_whatsapp_quality_snapshots',
    commerce_snapshots:'magnanimous_whatsapp_commerce_state'
  };
  const out={};
  for(const [key,table] of Object.entries(tables))out[key]=await tableCount(env,table,tenantId);
  return out;
}

export async function handleMagnanimousWhatsApp(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/whatsapp'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':'*',
    'access-control-allow-headers':'authorization,content-type',
    'access-control-allow-methods':'GET,OPTIONS'
  }});

  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to Magnanimous AI.'},401);
  if(user.role!=='owner')return json({detail:'Owner access required.'},403);

  if(request.method==='GET'&&['/api/whatsapp','/api/whatsapp/capabilities','/api/whatsapp/readiness'].includes(path)){
    const summary=whatsappCapabilitySummary(env);
    const tenantId=String(user.tenant_id||'');
    const connection=await whatsappConnectionSummary(env,tenantId);
    const state=await normalizedState(env,tenantId);
    return json({
      ...summary,
      owner_identity:'God Matters',
      affiliation_identity:'I AM MAGNANIMOUS WAY™',
      existing_whatsapp_connection:connection,
      normalized_state:state,
      action_router:'/api/assistant-integrations/actions',
      oauth_router:'/api/integrations/whatsapp',
      meta_control_plane:'/api/meta',
      write_execution_duplicated:false,
      direct_message_execution_enabled:false,
      direct_template_mutation_enabled:false,
      direct_flow_publish_enabled:false,
      direct_payment_execution_enabled:false,
      direct_call_execution_enabled:false,
      provider_tokens_exposed:false,
      provider_secrets_exposed:false,
      policy_note:'Existing authorized WhatsApp sends stay in the assistant integration router so permissions and confirmation gates are preserved. This control plane owns capability knowledge and normalized state, not a bypass path.'
    });
  }

  if(request.method==='GET'&&path==='/api/whatsapp/normalized-state'){
    return json({
      identity:'Magnanimous AI WhatsApp Control',
      normalized_state:await normalizedState(env,String(user.tenant_id||'')),
      raw_message_bodies_stored_by_control_plane:false,
      raw_media_stored_by_control_plane:false,
      provider_tokens_stored_by_control_plane:false,
      payment_credentials_stored_by_control_plane:false
    });
  }

  return json({
    detail:'Magnanimous WhatsApp Control is read-only. Send, template, flow, commerce, payment and calling mutations must use authorized capability-specific routers with confirmation and eligibility checks.',
    code:'WHATSAPP_CONTROL_PLANE_READ_ONLY'
  },405);
}
