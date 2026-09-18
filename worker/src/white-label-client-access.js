import {currentUser} from './integrations.js';
import {createPasswordRecord} from './password-security.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const txt=(v,n=500)=>String(v||'').trim().slice(0,n);
const PRIVACY_VERSION='1.0-2026-09-01';
const TERMS_VERSION='1.0-2026-09-01';
const CORE_APPS=[
 ['branded-ai','Branded AI'],['crm','CRM'],['inbox','Unified Inbox'],['booking','Booking'],['funnel','Funnel Builder'],
 ['reputation','Reputation'],['automations','Automations'],['work-engine','Work Engine'],['receptionist','AI Receptionist'],
 ['video-agents','Video Agents'],['rebilling','Usage Rebilling']
];
const encoder=new TextEncoder();
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomToken(){return b64url(crypto.getRandomValues(new Uint8Array(32)))}
async function sha256(value){const d=await crypto.subtle.digest('SHA-256',encoder.encode(String(value||'')));return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function normEmail(v){return txt(v,320).toLowerCase()}
function owner(user){return ['owner','admin'].includes(String(user?.role||'').toLowerCase())}
async function ensure(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS agency_client_users(
  tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,user_id TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',
  active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
  PRIMARY KEY(tenant_id,client_id,user_id)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agency_client_users_user ON agency_client_users(tenant_id,user_id,active)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS agency_client_user_invites(
  id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,email TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,accepted_at INTEGER,revoked_at INTEGER,created_by TEXT NOT NULL,created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agency_client_invites_client ON agency_client_user_invites(tenant_id,client_id,created_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS consent_records(
  user_id TEXT PRIMARY KEY,email TEXT NOT NULL,account_processing_consent INTEGER NOT NULL DEFAULT 0,
  account_processing_version TEXT NOT NULL,terms_accepted INTEGER NOT NULL DEFAULT 0,terms_version TEXT NOT NULL,
  marketing_consent INTEGER NOT NULL DEFAULT 0,consented_at INTEGER NOT NULL,marketing_updated_at INTEGER,
  source TEXT NOT NULL DEFAULT 'signup'
 )`).run();
}
async function agencyAccess(env,user){
 if(!user)return false;
 if(owner(user))return true;
 const r=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first().catch(()=>null);
 return ['agency','agency_pro'].includes(String(r?.plan||'').toLowerCase());
}
async function clientRow(env,tenant,clientId){
 return env.DB.prepare("SELECT id,name,status FROM bpo_clients WHERE id=? AND tenant_id=? AND status!='archived' LIMIT 1").bind(clientId,tenant).first();
}
export async function getWhiteLabelClientContext(env,user){
 if(!env?.DB||!user||String(user.role||'').toLowerCase()!=='client')return null;
 await ensure(env);const tenant=String(user.tenant_id),userId=String(user.id);
 const membership=await env.DB.prepare(`SELECT m.client_id,m.role,m.active,c.name AS client_name,c.status AS client_status
  FROM agency_client_users m JOIN bpo_clients c ON c.id=m.client_id AND c.tenant_id=m.tenant_id
  WHERE m.tenant_id=? AND m.user_id=? AND m.active=1 AND c.status!='archived' ORDER BY m.updated_at DESC LIMIT 1`).bind(tenant,userId).first();
 return membership?{tenant_id:tenant,user_id:userId,client_id:String(membership.client_id),client_name:String(membership.client_name||''),role:String(membership.role||'member')}:null;
}
export async function canWhiteLabelClientUseBusinessAITool(env,user,toolId){
 const ctx=await getWhiteLabelClientContext(env,user);if(!ctx)return{restricted:String(user?.role||'').toLowerCase()==='client',allowed:String(user?.role||'').toLowerCase()!=='client',context:null};
 const appId='business-ai:'+String(toolId||'');
 const row=await env.DB.prepare('SELECT enabled FROM agency_client_apps WHERE tenant_id=? AND client_id=? AND app_id=? LIMIT 1').bind(ctx.tenant_id,ctx.client_id,appId).first();
 return{restricted:true,allowed:row?Boolean(row.enabled):true,context:ctx};
}
async function catalogForClient(env,ctx){
 const saved=await env.DB.prepare('SELECT app_id,label,enabled,sort_order FROM agency_client_apps WHERE tenant_id=? AND client_id=? ORDER BY sort_order,app_id').bind(ctx.tenant_id,ctx.client_id).all();
 const rows=saved.results||[],known=new Set(rows.map(x=>String(x.app_id)));
 const core=CORE_APPS.map(([app_id,name],index)=>{const row=rows.find(x=>String(x.app_id)===app_id);return{app_id,name,label:String(row?.label||name),group:'core',enabled:row?Boolean(row.enabled):true,sort_order:row?Number(row.sort_order||0):index,client_safe:false}});
 const business=rows.filter(x=>String(x.app_id).startsWith('business-ai:')).map(x=>({app_id:String(x.app_id),name:String(x.label||x.app_id),label:String(x.label||x.app_id),group:'business-ai',enabled:Boolean(x.enabled),sort_order:Number(x.sort_order||100),client_safe:true}));
 return [...core,...business].filter(x=>x.enabled).sort((a,b)=>a.sort_order-b.sort_order);
}
async function acceptInvite(request,env){
 await ensure(env);const b=await request.json().catch(()=>({})),token=txt(b.token,300),name=txt(b.name,180),password=String(b.password||'');
 if(!token||!name||password.length<10)return json({detail:'Name, invite token, and a password of at least 10 characters are required.'},400);
 if(b.accountProcessingConsent!==true)return json({detail:'Privacy Notice acknowledgment is required.',code:'PRIVACY_CONSENT_REQUIRED'},400);
 if(b.termsAccepted!==true)return json({detail:'Terms of Service acceptance is required.',code:'TERMS_REQUIRED'},400);
 const tokenHash=await sha256(token),ts=now();
 const invite=await env.DB.prepare(`SELECT i.*,c.name AS client_name,c.status AS client_status
  FROM agency_client_user_invites i JOIN bpo_clients c ON c.id=i.client_id AND c.tenant_id=i.tenant_id
  WHERE i.token_hash=? AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>? AND c.status!='archived' LIMIT 1`).bind(tokenHash,ts).first();
 if(!invite)return json({detail:'This client invitation is invalid, expired, already used, or revoked.',code:'INVITE_INVALID'},410);
 const existing=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND active=1 LIMIT 1').bind(normEmail(invite.email)).first();
 if(existing)return json({detail:'An account with this email already exists. Ask the agency owner to use a different email or contact support for account linking.',code:'EMAIL_ALREADY_REGISTERED'},409);
 const pass=await createPasswordRecord(password,env),userId=crypto.randomUUID(),email=normEmail(invite.email);
 const statements=[
  env.DB.prepare('INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(userId,invite.tenant_id,name,email,'client',pass.password_hash,pass.password_salt,1,ts),
  env.DB.prepare('INSERT INTO agency_client_users(tenant_id,client_id,user_id,role,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(invite.tenant_id,invite.client_id,userId,'member',1,ts,ts),
  env.DB.prepare(`INSERT INTO consent_records(user_id,email,account_processing_consent,account_processing_version,terms_accepted,terms_version,marketing_consent,consented_at,marketing_updated_at,source)
   VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(userId,email,1,PRIVACY_VERSION,1,TERMS_VERSION,b.marketingConsent===true?1:0,ts,ts,'white-label-client-invite'),
  env.DB.prepare('UPDATE agency_client_user_invites SET accepted_at=? WHERE id=? AND accepted_at IS NULL').bind(ts,invite.id)
 ];
 try{await env.DB.batch(statements)}catch(error){console.error('White Label client invite acceptance failed',error);return json({detail:'The client account could not be created safely. Please ask the agency owner to issue a new invitation.',code:'CLIENT_ACCOUNT_CREATE_FAILED'},500)}
 return json({ok:true,email,client_name:String(invite.client_name||''),login_url:'/login?returnTo=%2Fwhite-label%2Fclient',detail:'Client account created. Sign in with the email on this invitation.'},201);
}
export async function handleWhiteLabelClientAccess(request,env){
 const u=new URL(request.url),path=u.pathname;if(!path.startsWith('/api/white-label-client'))return null;
 if(path==='/api/white-label-client/accept'&&request.method==='POST')return acceptInvite(request,env);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await ensure(env);
 if(path==='/api/white-label-client/me'&&request.method==='GET'){
  const ctx=await getWhiteLabelClientContext(env,user);return ctx?json({client:ctx,client_portal:true}):json({detail:'This account is not mapped to an active White Label client.',code:'CLIENT_MEMBERSHIP_REQUIRED'},403);
 }
 if(path==='/api/white-label-client/apps'&&request.method==='GET'){
  const ctx=await getWhiteLabelClientContext(env,user);if(!ctx)return json({detail:'Client membership required.'},403);
  const apps=await catalogForClient(env,ctx);return json({client:ctx,apps,authorization_boundary:'Business AI apps are enforced server-side for this client user. Core agency apps remain unavailable to client users until each underlying data surface is client-scoped.',security_ready_apps:apps.filter(x=>x.client_safe).map(x=>x.app_id)});
 }
 if(path==='/api/white-label-client/invites'){
  if(!owner(user)||!await agencyAccess(env,user))return json({detail:'White Label owner or admin access required.'},403);
  const tenant=String(user.tenant_id),clientId=txt(u.searchParams.get('client_id'),80);
  if(request.method==='GET'){
   if(!clientId)return json({detail:'Choose a client first.'},400);if(!await clientRow(env,tenant,clientId))return json({detail:'Client not found.'},404);
   const{results=[]}=await env.DB.prepare(`SELECT id,client_id,email,expires_at,accepted_at,revoked_at,created_at
    FROM agency_client_user_invites WHERE tenant_id=? AND client_id=? ORDER BY created_at DESC LIMIT 100`).bind(tenant,clientId).all();
   const members=await env.DB.prepare(`SELECT m.user_id,m.role,m.active,m.created_at,u.name,u.email
    FROM agency_client_users m JOIN users u ON u.id=m.user_id AND u.tenant_id=m.tenant_id
    WHERE m.tenant_id=? AND m.client_id=? ORDER BY m.created_at DESC`).bind(tenant,clientId).all();
   return json({invites:results,members:members.results||[]});
  }
  if(request.method==='POST'){
   const b=await request.json().catch(()=>({})),cid=txt(b.client_id||clientId,80),email=normEmail(b.email),hours=Math.max(1,Math.min(168,Number(b.expires_hours)||72));
   const client=await clientRow(env,tenant,cid);if(!client)return json({detail:'Client not found or archived.'},404);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({detail:'Enter a valid email address.'},400);
   const existing=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND active=1 LIMIT 1').bind(email).first();if(existing)return json({detail:'That email already has an account. Account linking is not automatic because it could cross tenant boundaries.'},409);
   const raw=randomToken(),hash=await sha256(raw),id=crypto.randomUUID(),ts=now(),expires=ts+hours*3600;
   await env.DB.prepare('INSERT INTO agency_client_user_invites(id,tenant_id,client_id,email,token_hash,expires_at,accepted_at,revoked_at,created_by,created_at) VALUES(?,?,?,?,?,?,NULL,NULL,?,?)').bind(id,tenant,cid,email,hash,expires,String(user.id),ts).run();
   return json({ok:true,id,email,client_id:cid,expires_at:expires,invite_path:'/white-label/join?token='+encodeURIComponent(raw),delivery:'manual-share',note:'Share this one-time invitation link with the intended client user. The raw token is not stored.'},201);
  }
 }
 const revoke=path.match(/^\/api\/white-label-client\/invites\/([^/]+)$/);
 if(revoke&&request.method==='DELETE'){
  if(!owner(user)||!await agencyAccess(env,user))return json({detail:'White Label owner or admin access required.'},403);
  const r=await env.DB.prepare('UPDATE agency_client_user_invites SET revoked_at=? WHERE id=? AND tenant_id=? AND accepted_at IS NULL AND revoked_at IS NULL').bind(now(),txt(revoke[1],100),String(user.tenant_id)).run();
  return Number(r?.meta?.changes||0)?json({ok:true,revoked:true}):json({detail:'Active invitation not found.'},404);
 }
 return json({detail:'White Label client access endpoint not found.'},404);
}
