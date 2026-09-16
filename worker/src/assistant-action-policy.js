import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const WRITE_ACTIONS=new Set(['publish_post','publish_media','send_message','send_mail','manage_product','create_campaign']);
const CONFIRM_TTL_SECONDS=900;

export async function enforceAssistantActionPolicy(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/assistant-integrations'))return null;
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return null; // Existing route remains responsible for its normal 401 contract.

  if(request.method==='PUT'&&path.startsWith('/api/assistant-integrations/permissions/')){
    if(String(user.role||'').toLowerCase()!=='owner'){
      return json({error:'Workspace owner access is required to change connected-account AI permissions.',code:'WORKSPACE_OWNER_REQUIRED'},403);
    }
    return null;
  }

  if(request.method==='POST'&&path==='/api/assistant-integrations/actions'){
    const body=await request.clone().json().catch(()=>({}));
    const action=String(body?.action||'').trim();
    if(WRITE_ACTIONS.has(action)&&body?.confirm===true){
      return json({
        error:'Create the pending action first, then approve it with the separate confirmation endpoint.',
        code:'SEPARATE_ACTION_CONFIRMATION_REQUIRED',
        action,
        requires_confirmation:true
      },409);
    }
    return null;
  }

  const match=path.match(/^\/api\/assistant-integrations\/actions\/([^/]+)\/confirm$/);
  if(match&&request.method==='POST'&&env?.DB){
    const row=await env.DB.prepare('SELECT id,tenant_id,user_id,provider,action,status,created_at FROM assistant_actions WHERE id=? AND tenant_id=?')
      .bind(match[1],user.tenant_id).first();
    if(!row)return json({error:'Assistant action not found.'},404);
    const owner=String(user.role||'').toLowerCase()==='owner';
    if(String(row.user_id)!==String(user.id)&&!owner){
      return json({error:'Only the user who created this action or the workspace owner may approve it.',code:'ACTION_APPROVER_MISMATCH'},403);
    }
    if(String(row.status)!=='needs_confirmation')return null;
    if(Number(row.created_at||0)<now()-CONFIRM_TTL_SECONDS){
      await env.DB.prepare("UPDATE assistant_actions SET status='expired',updated_at=? WHERE id=? AND tenant_id=? AND status='needs_confirmation'")
        .bind(now(),row.id,user.tenant_id).run();
      return json({error:'This approval expired. Create a fresh action so you can review its current payload before approving it.',code:'ACTION_CONFIRMATION_EXPIRED'},410);
    }
    await env.DB.prepare('INSERT INTO assistant_activity(tenant_id,user_id,provider,action,status,detail,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(user.tenant_id,user.id,String(row.provider||''),String(row.action||''),'approved',`Approved pending action ${row.id}.`,now()).run();
  }
  return null;
}

export const ASSISTANT_CONFIRMATION_TTL_SECONDS=CONFIRM_TTL_SECONDS;
