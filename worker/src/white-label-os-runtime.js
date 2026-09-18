import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';
const json=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'no-store'}}),now=()=>Math.floor(Date.now()/1000),txt=(v,n=4000)=>String(v||'').trim().slice(0,n);
export const WHITE_LABEL_MODULES=[
{id:'branding',name:'Brand Studio',what:'Logo, colors, custom domain, branded login, emails and client experience',status:'active'},
{id:'crm',name:'CRM + Pipelines',what:'Contacts, companies, deals, pipelines, activities and client history',status:'active'},
{id:'funnels',name:'Sites + Funnels',what:'Funnels, landing pages, offers, CTAs, templates and conversion tracking',status:'active'},
{id:'automation',name:'Automation Studio',what:'Event rules, follow-ups, durable work and inbox actions',status:'active'},
{id:'inbox',name:'Unified Inbox',what:'Email, SMS, voice, social, chat and task conversations in one queue',status:'active'},
{id:'booking',name:'Appointments',what:'Client bookings, services, status and scheduling records',status:'active'},
{id:'reputation',name:'Reputation',what:'Review capture, response queue and reputation workflows',status:'active'},
{id:'billing',name:'Billing + Rebilling',what:'Client platform fees, usage markup, subscriptions and transparent rebilling',status:'active'},
{id:'marketplace',name:'Marketplace + Packages',what:'Create your own products, bundles, plans, margins, add-ons and upgrade paths',status:'active'},
{id:'portal',name:'Client Portal',what:'Per-client navigation, modules, announcements, onboarding and self-service experience',status:'active'},
{id:'projects',name:'Projects + Tasks',what:'Client projects, tasks, owners, due dates and delivery status',status:'active'},
{id:'contracts',name:'Proposals + eSign',what:'Reusable proposals, agreements, signature state and document lifecycle',status:'active'},
{id:'learning',name:'Courses + Community',what:'Branded courses, lessons, member communities and knowledge delivery',status:'active'},
{id:'affiliate',name:'Affiliate Center',what:'Referral programs, commission rules and partner attribution',status:'active'},
{id:'analytics',name:'Agency Analytics',what:'MRR, usage, funnel, pipeline, client health and product performance',status:'active'},
{id:'ai',name:'Magnanimous AI',what:'Shared agency intelligence, research, writing, service, operations and client-aware assistance',status:'active'},
{id:'integrations',name:'Connections',what:'APIs, MCP, OAuth, webhooks and replaceable providers under Magnanimous control',status:'active'},
{id:'mobile',name:'Mobile-ready Portal',what:'Responsive branded client experience with installable-app path',status:'active'}
];
async function ensure(env){for(const q of[
`CREATE TABLE IF NOT EXISTS agency_catalog_items(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price_usd REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_projects(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'planned',owner TEXT NOT NULL DEFAULT '',due_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_contracts(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',signer_name TEXT NOT NULL DEFAULT '',signed_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_learning_assets(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,title TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'course',description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_affiliate_programs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,commission_percent REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_portal_pages(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,client_id TEXT NOT NULL,title TEXT NOT NULL,slug TEXT NOT NULL,content TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_community_spaces(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',access_level TEXT NOT NULL DEFAULT 'members',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS agency_affiliate_referrals(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,program_id TEXT NOT NULL,partner_name TEXT NOT NULL,reference TEXT NOT NULL DEFAULT '',revenue_usd REAL NOT NULL DEFAULT 0,commission_usd REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`
])await env.DB.prepare(q).run()}
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());
async function agencyAccess(env,user){if(await isPlatformOwnerUser(env,user))return true;try{const active=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();const plan=String(active?.plan||'').toLowerCase();return plan==='agency'||plan==='agency_pro'}catch{return false}}
export async function handleWhiteLabelOS(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/white-label-os'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);await ensure(env);const tenant=String(user.tenant_id);
if(u.pathname==='/api/white-label-os/overview'&&request.method==='GET')return json({name:'Magnanimous White Label OS',brain:'Magnanimous AI',modules:WHITE_LABEL_MODULES,principles:['your brand','your clients','your pricing','tenant isolation','provider independence','no hidden provider identity','action receipts','transparent metered costs']});
const specs={catalog:['agency_catalog_items',['name','kind','description','price_usd','status']],projects:['agency_projects',['client_id','name','status','owner','due_at']],contracts:['agency_contracts',['client_id','title','body','status','signer_name']],learning:['agency_learning_assets',['title','kind','description','status']],affiliates:['agency_affiliate_programs',['name','commission_percent','status']],portal:['agency_portal_pages',['client_id','title','slug','content','status']],community:['agency_community_spaces',['title','description','access_level','status']],referrals:['agency_affiliate_referrals',['program_id','partner_name','reference','revenue_usd','commission_usd','status']]};
const m=u.pathname.match(/^\/api\/white-label-os\/(catalog|projects|contracts|learning|affiliates|portal|community|referrals)$/);if(!m)return json({detail:'White Label OS endpoint not found.'},404);const [table,fields]=specs[m[1]];
if(request.method==='GET'){const{results=[]}=await env.DB.prepare(`SELECT * FROM ${table} WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 300`).bind(tenant).all();return json({items:results,module:m[1]})}
if(request.method==='POST'){if(!owner(user))return json({detail:'Owner or admin access required.'},403);const b=await request.json().catch(()=>({})),id=crypto.randomUUID(),ts=now(),vals=fields.map(f=>f.includes('price')||f.includes('percent')||f==='due_at'?Number(b[f]||0):txt(b[f],f==='body'?12000:4000));const primary=txt(b.name||b.title||b.partner_name,180);if(!primary)return json({detail:m[1]==='referrals'?'A partner name is required.':'A name or title is required.'},400);await env.DB.prepare(`INSERT INTO ${table}(id,tenant_id,${fields.join(',')},created_at,updated_at) VALUES(?,?${',?'.repeat(fields.length)},?,?)`).bind(id,tenant,...vals,ts,ts).run();return json({ok:true,id,module:m[1]},201)}
return json({detail:'Method not allowed.'},405)}
