const now=()=>Math.floor(Date.now()/1000);
export async function ensureAgencyClientMembershipSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS agency_client_members(
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client_member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,user_id)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agency_client_members_client ON agency_client_members(tenant_id,client_id,status)').run();
}
export async function getAgencyClientMembership(env,user){
 if(!env?.DB||!user)return null;
 if(['owner','admin'].includes(String(user.role||'').toLowerCase()))return null;
 await ensureAgencyClientMembershipSchema(env);
 return env.DB.prepare(`SELECT m.tenant_id,m.user_id,m.client_id,m.role,m.status,c.name client_name
  FROM agency_client_members m JOIN bpo_clients c ON c.id=m.client_id AND c.tenant_id=m.tenant_id
  WHERE m.tenant_id=? AND m.user_id=? AND m.status='active' AND c.status='active' LIMIT 1`)
  .bind(String(user.tenant_id),String(user.id)).first();
}
export async function resolveBusinessAIClientAccess(env,user,registeredIds=[]){
 const membership=await getAgencyClientMembership(env,user);
 if(!membership)return{enforced:false,membership:null,allowed_ids:[...registeredIds]};
 try{
  const{results=[]}=await env.DB.prepare("SELECT app_id,enabled FROM agency_client_apps WHERE tenant_id=? AND client_id=? AND app_id LIKE 'business-ai:%' ORDER BY app_id")
   .bind(String(user.tenant_id),String(membership.client_id)).all();
  if(!results.length)return{enforced:true,membership,allowed_ids:[...registeredIds],default_all_enabled:true};
  const allowed=new Set(results.filter(x=>Boolean(x.enabled)).map(x=>String(x.app_id).slice('business-ai:'.length)));
  return{enforced:true,membership,allowed_ids:registeredIds.filter(id=>allowed.has(id)),default_all_enabled:false};
 }catch{
  return{enforced:true,membership,allowed_ids:[],default_all_enabled:false,configuration_error:true};
 }
}
export async function assignAgencyClientMember(env,{tenant_id,client_id,user_id,role='client_member',enabled=true}){
 await ensureAgencyClientMembershipSchema(env);const ts=now(),tenant=String(tenant_id),uid=String(user_id),client=String(client_id);
 if(!enabled){await env.DB.prepare('DELETE FROM agency_client_members WHERE tenant_id=? AND user_id=?').bind(tenant,uid).run();return{ok:true,removed:true,user_id:uid}}
 const safeRole=['client_member','client_admin'].includes(String(role))?String(role):'client_member';
 await env.DB.prepare(`INSERT INTO agency_client_members(tenant_id,user_id,client_id,role,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)
  ON CONFLICT(tenant_id,user_id) DO UPDATE SET client_id=excluded.client_id,role=excluded.role,status='active',updated_at=excluded.updated_at`)
  .bind(tenant,uid,client,safeRole,'active',ts,ts).run();
 return{ok:true,user_id:uid,client_id:client,role:safeRole};
}
