import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';
import {BUSINESS_AI_SUITE} from './magnanimous-business-ai-suite.js';
import {getProviderRuntimeEnv} from './provider-runtime-env.js';
const json=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'no-store'}}),now=()=>Math.floor(Date.now()/1000),txt=(v,n=4000)=>String(v||'').trim().slice(0,n);
export const WHITE_LABEL_MODULES=[
{id:'branding',name:'Brand Studio',what:'Brand name, logo, accent color, White Label flag and custom-domain configuration for each client',status:'active',provider:'Magnanimous Native'},
{id:'crm',name:'CRM + Pipelines',what:'Contacts, companies, deals, pipelines, activities and client history',status:'active',provider:'Magnanimous Native'},
{id:'funnels',name:'Sites + Funnels',what:'Funnels, landing pages, offers, CTAs, templates and conversion tracking',status:'active',provider:'Magnanimous Native'},
{id:'automation',name:'Automation Studio',what:'Event rules, follow-ups, durable work and inbox actions',status:'active',provider:'Magnanimous Native'},
{id:'inbox',name:'Unified Inbox',what:'Email, SMS, voice, social, chat and task conversations in one queue',status:'active',provider:'Magnanimous Native + connected channels'},
{id:'booking',name:'Appointments',what:'Client bookings, services, status and scheduling records',status:'active',provider:'Magnanimous Native'},
{id:'reputation',name:'Reputation',what:'Review capture, response queue and reputation workflows',status:'active',provider:'Magnanimous Native'},
{id:'billing',name:'Usage Rebilling',what:'Client platform-fee settings, usage cost, approved markup and transparent client-charge ledger',status:'active',provider:'Magnanimous Native'},
{id:'marketplace',name:'Catalog + Packages',what:'Create and manage agency products, services, package descriptions, prices and status',status:'active',provider:'Magnanimous Native'},
{id:'portal',name:'Client Portal Pages',what:'Create tenant-isolated client portal pages with titles, slugs, content and publication status',status:'active',provider:'Magnanimous Native'},
{id:'projects',name:'Projects',what:'Track client projects, owners, due dates and delivery status',status:'active',provider:'Magnanimous Native'},
{id:'contracts',name:'Proposals + Signature Tracking',what:'Store proposal/agreement text, signer name and signature-state lifecycle; no third-party e-signature is implied',status:'active',provider:'Magnanimous Native'},
{id:'learning',name:'Learning Assets',what:'Create course/content records with descriptions, type and publication status',status:'active',provider:'Magnanimous Native'},
{id:'affiliate',name:'Affiliate Programs',what:'Create referral programs, commission percentages and referral ledger records',status:'active',provider:'Magnanimous Native'},
{id:'analytics',name:'Agency Overview',what:'Operational counts for clients, bookings, active funnels, reviews needing response and unbilled client usage',status:'active',provider:'Magnanimous Native'},
{id:'ai',name:'Magnanimous AI',what:'Shared agency intelligence, research, writing, service, operations and client-aware assistance',status:'active',provider:'Magnanimous AI'},
{id:'integrations',name:'Connections',what:'APIs, MCP, OAuth, webhooks and replaceable providers under Magnanimous control',status:'active',provider:'Magnanimous Provider Hub'},
{id:'mobile',name:'Mobile-ready Portal Pages',what:'Responsive client portal content managed from White Label Studio',status:'active',provider:'Magnanimous Native'}
]
async function ensure(env){for(const q of[
`CREATE TABLE IF NOT EXISTS agency_catalog_items(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price_usd REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_projects(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'planned',owner TEXT NOT NULL DEFAULT '',due_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_contracts(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',signer_name TEXT NOT NULL DEFAULT '',signed_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_learning_assets(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,title TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'course',description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_affiliate_programs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,commission_percent REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_portal_pages(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,title TEXT NOT NULL,slug TEXT NOT NULL,content TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_community_spaces(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',access_level TEXT NOT NULL DEFAULT 'members',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_affiliate_referrals(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,program_id TEXT NOT NULL,partner_name TEXT NOT NULL,reference TEXT NOT NULL DEFAULT '',revenue_usd REAL NOT NULL DEFAULT 0,commission_usd REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_client_apps(tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,app_id TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',enabled INTEGER NOT NULL DEFAULT 1,sort_order INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,client_id,app_id))`
])await env.DB.prepare(q).run()}
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());
async function agencyAccess(env,user){if(await isPlatformOwnerUser(env,user))return true;try{const active=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();const plan=String(active?.plan||'').toLowerCase();return plan==='agency'||plan==='agency_pro'}catch{return false}}
export async function handleWhiteLabelOS(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/white-label-os'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);await ensure(env);const tenant=String(user.tenant_id);
if(u.pathname==='/api/white-label-os/overview'&&request.method==='GET')return json({name:'Magnanimous White Label OS',brain:'Magnanimous AI',modules:WHITE_LABEL_MODULES,principles:['your brand','your clients','your pricing','tenant isolation','provider independence','no hidden provider identity','action receipts','transparent metered costs']});
const CORE_CLIENT_APPS=[
 ['branded-ai','Branded AI','core'],['crm','CRM','core'],['inbox','Unified Inbox','core'],['booking','Booking','core'],['funnel','Funnel Builder','core'],['reputation','Reputation','core'],['automations','Automations','core'],['work-engine','Work Engine','core'],['receptionist','AI Receptionist','core'],['video-agents','Video Agents','core'],['rebilling','Usage Rebilling','core'],
 ['invoice','Invoice Maker','core'],['pos','Point of Sale','core'],['website','Website Builder','core'],['app-builder','App Prototype Builder','core'],['whatsapp','WhatsApp Product Inbox','core']
];
const CLIENT_APP_CATALOG=[...CORE_CLIENT_APPS,...BUSINESS_AI_SUITE.map(([id,name])=>['business-ai:'+id,name,'business-ai'])];
const CLIENT_APP_PATHS={
 'branded-ai':'/white-label/branded-ai',crm:'/crm',inbox:'/inbox',booking:'/agency-command?tab=booking',
 funnel:'/agency-command?tab=funnels',reputation:'/agency-command?tab=reputation',automations:'/agency-automations',
 'work-engine':'/work-engine',receptionist:'/ai-receptionist','video-agents':'/video-agents',rebilling:'/agency-command?tab=billing',
 invoice:'/white-label/native?tool=invoice',pos:'/white-label/native?tool=pos',website:'/white-label/native?tool=website',
 'app-builder':'/white-label/native?tool=app',whatsapp:'/white-label/whatsapp'
};
const clientAppHref=id=>id.startsWith('business-ai:')?'/business-ai?tool='+encodeURIComponent(id.slice('business-ai:'.length)):(CLIENT_APP_PATHS[id]||'/white-label');
async function clientProviderContext(env,tenant,clientId){
 const providerEnv=await getProviderRuntimeEnv(env);
 let whatsappConnected=false;
 try{
  const row=await env.DB.prepare('SELECT phone_number_id FROM white_label_whatsapp_routes WHERE tenant_id=? AND client_id=? LIMIT 1').bind(tenant,clientId).first();
  whatsappConnected=Boolean(row?.phone_number_id);
 }catch{}
 return{
  whatsappConnected,
  twilioConnected:Boolean(providerEnv.TWILIO_ACCOUNT_SID&&providerEnv.TWILIO_AUTH_TOKEN&&providerEnv.TWILIO_PHONE_NUMBER),
  tavusConnected:Boolean(providerEnv.TAVUS_API_KEY),
  heygenConnected:Boolean(providerEnv.HEYGEN_API_KEY),
  renderNodeConnected:Boolean(providerEnv.MAGNANIMOUS_RENDER_NODE_URL||providerEnv.VIDEO_AVATAR_SESSION_URL)
 };
}
function clientAppProvider(context,id){
 if(id.startsWith('business-ai:'))return{id:'magnanimous-business-ai',name:'Magnanimous Business AI',mode:'native-first',status:'native-ready',ready:true,connected:true,setup_path:'/business-ai'};
 if(id==='receptionist')return{id:'magnanimous-voice',name:'Magnanimous Browser Voice',mode:'hybrid',status:'native-ready',ready:true,connected:true,optional_provider:'Twilio',optional_provider_connected:context.twilioConnected,setup_path:'/ai-receptionist'};
 if(id==='video-agents')return{id:'magnanimous-render-engine',name:'Magnanimous Render Engine',mode:'hybrid',status:'native-ready',ready:true,connected:true,optional_provider:'Realtime avatar adapter',optional_provider_connected:Boolean(context.renderNodeConnected||context.tavusConnected||context.heygenConnected),setup_path:'/video-agents'};
 if(id==='whatsapp')return{id:'meta-whatsapp',name:'Meta WhatsApp Business Platform',mode:'external',status:context.whatsappConnected?'connected':'setup-required',ready:context.whatsappConnected,connected:context.whatsappConnected,setup_path:'/white-label/whatsapp'};
 return{id:'magnanimous-native',name:'Magnanimous Native',mode:'native',status:'native-ready',ready:true,connected:true,setup_path:clientAppHref(id)};
}
if(u.pathname==='/api/white-label-os/client-apps'){
 const clientId=txt(u.searchParams.get('client_id'),80);
 if(!clientId)return json({detail:'Choose a client first.'},400);
 const client=await env.DB.prepare('SELECT id,name FROM bpo_clients WHERE id=? AND tenant_id=? LIMIT 1').bind(clientId,tenant).first();
 if(!client)return json({detail:'That client does not belong to this White Label workspace.'},404);
 if(request.method==='GET'){
  const{results=[]}=await env.DB.prepare('SELECT app_id,label,enabled,sort_order FROM agency_client_apps WHERE tenant_id=? AND client_id=? ORDER BY sort_order,app_id').bind(tenant,clientId).all();
  const saved=new Map(results.map(x=>[String(x.app_id),x])),providerContext=await clientProviderContext(env,tenant,clientId);
  const apps=CLIENT_APP_CATALOG.map(([app_id,name,group],index)=>{const row=saved.get(app_id);return{app_id,name,group,label:row?.label||name,enabled:row?Boolean(row.enabled):true,sort_order:row?Number(row.sort_order||0):index,href:clientAppHref(app_id),link_registered:true,provider:clientAppProvider(providerContext,app_id)}});
  return json({client,apps,available_apps:apps.map(({app_id,name,group,href,provider})=>({app_id,name,group,href,provider})),catalog_count:CLIENT_APP_CATALOG.length,provider_policy:'Every client app has a registered route and an explicit execution provider. Native apps use Magnanimous directly; external-network apps report setup-required until a verified account route exists.',authorization_boundary:'Client app selections control menu visibility and packaging. They do not become a security authorization boundary until the signed-in end user is reliably mapped to this client account.'});
 }
 if(request.method==='PUT'){
  if(!owner(user))return json({detail:'Owner or admin access required.'},403);
  const b=await request.json().catch(()=>({})),apps=Array.isArray(b.apps)?b.apps:[];
  const allowed=new Set(CLIENT_APP_CATALOG.map(x=>x[0])),ts=now(),seen=new Set();
  for(const row of apps){
   const appId=txt(row?.app_id,60);if(!allowed.has(appId)||seen.has(appId))continue;seen.add(appId);
   await env.DB.prepare(`INSERT INTO agency_client_apps(tenant_id,client_id,app_id,label,enabled,sort_order,updated_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(tenant_id,client_id,app_id) DO UPDATE SET label=excluded.label,enabled=excluded.enabled,sort_order=excluded.sort_order,updated_at=excluded.updated_at`)
    .bind(tenant,clientId,appId,txt(row?.label,120)||CLIENT_APP_CATALOG.find(x=>x[0]===appId)?.[1]||appId,row?.enabled===false?0:1,Math.max(0,Math.min(999,Number(row?.sort_order)||0)),ts).run();
  }
  return json({ok:true,client_id:clientId,saved:seen.size});
 }
 return json({detail:'Method not allowed.'},405);
}
const specs={catalog:['agency_catalog_items',['name','kind','description','price_usd','status']],projects:['agency_projects',['client_id','name','status','owner','due_at']],contracts:['agency_contracts',['client_id','title','body','status','signer_name']],learning:['agency_learning_assets',['title','kind','description','status']],affiliates:['agency_affiliate_programs',['name','commission_percent','status']],portal:['agency_portal_pages',['client_id','title','slug','content','status']],community:['agency_community_spaces',['title','description','access_level','status']],referrals:['agency_affiliate_referrals',['program_id','partner_name','reference','revenue_usd','commission_usd','status']]};
const base=u.pathname.match(/^\/api\/white-label-os\/(catalog|projects|contracts|learning|affiliates|portal|community|referrals)$/),item=u.pathname.match(/^\/api\/white-label-os\/(catalog|projects|contracts|learning|affiliates|portal|community|referrals)\/([^/]+)$/);const module=base?.[1]||item?.[1];if(!module)return json({detail:'White Label OS endpoint not found.'},404);const [table,fields]=specs[module];
const clientOk=async id=>!id||Boolean(await env.DB.prepare('SELECT id FROM bpo_clients WHERE id=? AND tenant_id=? LIMIT 1').bind(txt(id,80),tenant).first());
const affiliateOk=async id=>!id||Boolean(await env.DB.prepare('SELECT id FROM agency_affiliate_programs WHERE id=? AND tenant_id=? LIMIT 1').bind(txt(id,80),tenant).first());
const validateRefs=async b=>{if(['projects','contracts','portal'].includes(module)){const clientId=txt(b.client_id,80);if(!clientId)return'A valid client is required.';if(!await clientOk(clientId))return'That client does not belong to this White Label workspace.'}if(module==='referrals'){const programId=txt(b.program_id,80);if(!programId)return'An affiliate program is required.';if(!await affiliateOk(programId))return'That affiliate program does not belong to this White Label workspace.'}return''};
const fieldValue=(field,value)=>{
 if(field==='due_at')return Math.max(0,Number(value)||0);
 if(field==='price_usd'||field==='revenue_usd'||field==='commission_usd')return Math.max(0,Number(value)||0);
 if(field==='commission_percent')return Math.max(0,Math.min(100,Number(value)||0));
 return txt(value,field==='body'?12000:4000);
};
if(base&&request.method==='GET'){const{results=[]}=await env.DB.prepare(`SELECT * FROM ${table} WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 300`).bind(tenant).all();return json({items:results,module})}
if(base&&request.method==='POST'){if(!owner(user))return json({detail:'Owner or admin access required.'},403);const b=await request.json().catch(()=>({})),refError=await validateRefs(b);if(refError)return json({detail:refError},400);const id=crypto.randomUUID(),ts=now(),vals=fields.map(f=>fieldValue(f,b[f]));const primary=txt(b.name||b.title||b.partner_name,180);if(!primary)return json({detail:module==='referrals'?'A partner name is required.':'A name or title is required.'},400);await env.DB.prepare(`INSERT INTO ${table}(id,tenant_id,${fields.join(',')},created_at,updated_at) VALUES(?,?${',?'.repeat(fields.length)},?,?)`).bind(id,tenant,...vals,ts,ts).run();return json({ok:true,id,module},201)}
if(item&&request.method==='PATCH'){if(!owner(user))return json({detail:'Owner or admin access required.'},403);const id=txt(item[2],100),row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND tenant_id=? LIMIT 1`).bind(id,tenant).first();if(!row)return json({detail:'White Label item not found.'},404);const b=await request.json().catch(()=>({})),merged={...row,...b},refError=await validateRefs(merged);if(refError)return json({detail:refError},400);const changed=fields.filter(f=>Object.prototype.hasOwnProperty.call(b,f));if(!changed.length)return json({detail:'No editable fields were supplied.'},400);const vals=changed.map(f=>fieldValue(f,b[f]));await env.DB.prepare(`UPDATE ${table} SET ${changed.map(f=>`${f}=?`).join(',')},updated_at=? WHERE id=? AND tenant_id=?`).bind(...vals,now(),id,tenant).run();return json({ok:true,id,module})}
if(item&&request.method==='DELETE'){if(!owner(user))return json({detail:'Owner or admin access required.'},403);const id=txt(item[2],100);if(module==='affiliates'){const dependent=await env.DB.prepare('SELECT COUNT(*) n FROM agency_affiliate_referrals WHERE tenant_id=? AND program_id=?').bind(tenant,id).first();if(Number(dependent?.n||0)>0)return json({detail:'Remove or reassign this program’s referral records before deleting the program.'},409)}const result=await env.DB.prepare(`DELETE FROM ${table} WHERE id=? AND tenant_id=?`).bind(id,tenant).run();if(!Number(result?.meta?.changes||0))return json({detail:'White Label item not found.'},404);return json({ok:true,deleted:true,id,module})}
return json({detail:'Method not allowed.'},405)}
