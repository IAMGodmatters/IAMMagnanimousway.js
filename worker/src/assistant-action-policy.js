import { INTEGRATIONS, currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const WRITE_ACTIONS=new Set(['publish_post','publish_media','send_message','send_mail','manage_product','create_campaign']);
const CONFIRM_TTL_SECONDS=900;
const APPROVED_INTERNAL_REQUESTS=new WeakSet();
const CAPABILITY_ALIASES={
  facebook:{publish_posts:'publish_post'},
  instagram:{publish_media:'publish_media'},
  whatsapp:{send_messages:'send_message'},
  x:{publish_posts:'publish_post'}
};

function parseJson(value,fallback={}){try{return JSON.parse(value||'{}')}catch{return fallback}}
function providerDef(id){return INTEGRATIONS.find(item=>item.id===id)}
function providerSupports(provider,action){
  if(['google','outlook'].includes(provider)&&['read_mail','send_mail'].includes(action))return true;
  const def=providerDef(provider);if(!def)return false;
  const aliases=CAPABILITY_ALIASES[provider]||{};
  const capabilities=new Set((def.capabilities||[]).flatMap(cap=>aliases[cap]?[cap,aliases[cap]]:[cap]));
  return capabilities.has(action);
}
async function ensureTables(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_permissions (
    tenant_id TEXT NOT NULL,provider TEXT NOT NULL,can_read INTEGER NOT NULL DEFAULT 1,can_write INTEGER NOT NULL DEFAULT 1,
    require_confirmation INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,provider)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_actions (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,provider TEXT NOT NULL,external_account_id TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,status TEXT NOT NULL,requires_confirmation INTEGER NOT NULL DEFAULT 0,payload_json TEXT NOT NULL DEFAULT '{}',
    result_json TEXT NOT NULL DEFAULT '{}',error_text TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assistant_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,provider TEXT NOT NULL,
    action TEXT NOT NULL,status TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL
  )`).run();
}
async function permission(env,tenantId,provider){
  const row=await env.DB.prepare('SELECT can_read,can_write,require_confirmation FROM assistant_permissions WHERE tenant_id=? AND provider=?')
    .bind(tenantId,provider).first();
  return row?{can_read:!!row.can_read,can_write:!!row.can_write,require_confirmation:!!row.require_confirmation}:{can_read:true,can_write:true,require_confirmation:true};
}
async function connection(env,tenantId,provider,external=''){
  return external
    ? env.DB.prepare('SELECT id,external_account_id FROM integrations WHERE tenant_id=? AND provider=? AND external_account_id=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId,provider,external).first()
    : env.DB.prepare('SELECT id,external_account_id FROM integrations WHERE tenant_id=? AND provider=? ORDER BY updated_at DESC LIMIT 1').bind(tenantId,provider).first();
}
async function logActivity(env,user,provider,action,status,detail){
  await env.DB.prepare('INSERT INTO assistant_activity(tenant_id,user_id,provider,action,status,detail,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(user.tenant_id,user.id,provider,action,status,String(detail||'').slice(0,1000),now()).run();
}
function markApprovedInternal(request){APPROVED_INTERNAL_REQUESTS.add(request);return request}
export function isApprovedAssistantActionRequest(request){return APPROVED_INTERNAL_REQUESTS.has(request)}

async function createPendingWrite(request,env,user,body){
  const provider=String(body?.provider||'').trim(),action=String(body?.action||'').trim();
  if(!providerSupports(provider,action))return json({error:'This connected provider does not expose that write action.',code:'ACTION_NOT_SUPPORTED'},400);
  const perms=await permission(env,user.tenant_id,provider);
  if(!perms.can_write)return json({error:'AI write access is disabled for this connected provider.',code:'CONNECTED_WRITE_DISABLED'},403);
  const conn=await connection(env,user.tenant_id,provider,String(body?.external_account_id||''));
  if(!conn)return json({error:'Connect this provider before creating a write action.',code:'CONNECTION_REQUIRED'},409);
  const id=crypto.randomUUID(),ts=now(),payload=JSON.stringify(body?.payload||{}).slice(0,100000);
  await env.DB.prepare(`INSERT INTO assistant_actions(
    id,tenant_id,user_id,provider,external_account_id,action,status,requires_confirmation,payload_json,result_json,error_text,created_at,updated_at
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    id,user.tenant_id,user.id,provider,String(conn.external_account_id||''),action,'needs_confirmation',1,payload,'{}','',ts,ts
  ).run();
  await logActivity(env,user,provider,action,'needs_confirmation',`Pending action ${id} requires a separate user approval.`);
  return json({
    ok:true,id,status:'needs_confirmation',action,provider,
    requires_confirmation:true,confirmation_expires_at:ts+CONFIRM_TTL_SECONDS,
    message:'Review this action, then approve it with the separate confirmation control.'
  },202);
}

async function confirmationPolicy(request,env,user,id){
  const row=await env.DB.prepare(`SELECT id,tenant_id,user_id,provider,external_account_id,action,status,payload_json,created_at
    FROM assistant_actions WHERE id=? AND tenant_id=?`).bind(id,user.tenant_id).first();
  if(!row)return json({error:'Assistant action not found.'},404);
  const owner=String(user.role||'').toLowerCase()==='owner';
  if(String(row.user_id)!==String(user.id)&&!owner){
    return json({error:'Only the user who created this action or the workspace owner may approve it.',code:'ACTION_APPROVER_MISMATCH'},403);
  }
  if(String(row.status)!=='needs_confirmation'){
    return json({error:`Action is already ${String(row.status||'unknown')}.`,code:'ACTION_NOT_PENDING'},409);
  }
  if(Number(row.created_at||0)<now()-CONFIRM_TTL_SECONDS){
    await env.DB.prepare("UPDATE assistant_actions SET status='expired',updated_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'")
      .bind(now(),row.id,user.tenant_id).run();
    return json({error:'This approval expired. Create a fresh action so you can review its current payload before approving it.',code:'ACTION_CONFIRMATION_EXPIRED'},410);
  }
  if(!WRITE_ACTIONS.has(String(row.action||'')))return json({error:'This action does not require consequential write approval.',code:'ACTION_CONFIRMATION_NOT_APPLICABLE'},400);
  const perms=await permission(env,user.tenant_id,String(row.provider||''));
  if(!perms.can_write)return json({error:'AI write access was disabled after this action was created.',code:'CONNECTED_WRITE_DISABLED'},403);
  const conn=await connection(env,user.tenant_id,String(row.provider||''),String(row.external_account_id||''));
  if(!conn)return json({error:'The connected account is no longer available.',code:'CONNECTION_REQUIRED'},409);

  await logActivity(env,user,String(row.provider||''),String(row.action||''),'approved',`Approved pending action ${row.id}.`);

  // Gmail/Outlook sends use the enhanced email adapter rather than the older
  // generic provider executor. Translate only this already-approved request
  // into that adapter and mark the Request object in-memory so the downstream
  // consequential gate can distinguish it from any caller-forged header/body.
  if(String(row.action)==='send_mail'&&['google','outlook'].includes(String(row.provider))){
    const source=new URL(request.url),target=new URL('/api/assistant-integrations/actions',source.origin);
    const headers=new Headers(request.headers);headers.set('content-type','application/json');
    const translated=markApprovedInternal(new Request(target.toString(),{
      method:'POST',headers,redirect:request.redirect,
      body:JSON.stringify({
        provider:String(row.provider),action:'send_mail',external_account_id:String(row.external_account_id||''),
        payload:parseJson(row.payload_json),confirm:true
      })
    }));
    return {request:translated,context:{pending_action_id:String(row.id),tenant_id:String(row.tenant_id),provider:String(row.provider),action:'send_mail'}};
  }
  return null;
}

export async function enforceAssistantActionPolicy(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/assistant-integrations'))return null;
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return null; // Existing route remains responsible for its normal 401 contract.
  if(!env?.DB)return json({error:'Connected-account policy storage is unavailable.'},503);
  await ensureTables(env);

  if(request.method==='PUT'&&path.startsWith('/api/assistant-integrations/permissions/')){
    if(String(user.role||'').toLowerCase()!=='owner'){
      return json({error:'Workspace owner access is required to change connected-account AI permissions.',code:'WORKSPACE_OWNER_REQUIRED'},403);
    }
    const body=await request.clone().json().catch(()=>({}));
    if(body?.require_confirmation===false){
      return json({error:'Consequential connected-account writes always require a separate approval.',code:'CONSEQUENTIAL_CONFIRMATION_REQUIRED'},400);
    }
    return null;
  }

  if(request.method==='POST'&&path==='/api/assistant-integrations/actions'){
    if(isApprovedAssistantActionRequest(request))return null;
    const body=await request.clone().json().catch(()=>({}));
    const action=String(body?.action||'').trim();
    if(!WRITE_ACTIONS.has(action))return null;
    if(body?.confirm===true){
      return json({
        error:'Create the pending action first, then approve it with the separate confirmation endpoint.',
        code:'SEPARATE_ACTION_CONFIRMATION_REQUIRED',action,requires_confirmation:true
      },409);
    }
    return createPendingWrite(request,env,user,body);
  }

  const match=path.match(/^\/api\/assistant-integrations\/actions\/([^/]+)\/confirm$/);
  if(match&&request.method==='POST')return confirmationPolicy(request,env,user,match[1]);
  return null;
}

export async function completeAssistantActionPolicy(context,response,env){
  if(!context?.pending_action_id||!env?.DB||!response)return response;
  const data=await response.clone().json().catch(()=>null),ts=now();
  if(response.ok){
    const result=data?.result??data??{};
    await env.DB.prepare("UPDATE assistant_actions SET status='completed',requires_confirmation=0,result_json=?,error_text='',updated_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'")
      .bind(JSON.stringify(result).slice(0,100000),ts,context.pending_action_id,context.tenant_id).run();
  }else{
    const detail=String(data?.error||data?.detail||`Provider action failed (${response.status}).`).slice(0,1000);
    await env.DB.prepare("UPDATE assistant_actions SET status='failed',requires_confirmation=0,error_text=?,updated_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'")
      .bind(detail,ts,context.pending_action_id,context.tenant_id).run();
  }
  if(!String(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))return response;
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  const output=data&&typeof data==='object'?{...data,id:context.pending_action_id,approved_action_id:context.pending_action_id}:data;
  return new Response(JSON.stringify(output??{}),{status:response.status,statusText:response.statusText,headers});
}

export const ASSISTANT_CONFIRMATION_TTL_SECONDS=CONFIRM_TTL_SECONDS;
