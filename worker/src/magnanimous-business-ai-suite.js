import {currentUser} from './integrations.js';
const json=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'no-store'}}),now=()=>Math.floor(Date.now()/1000),txt=(v,n=12000)=>String(v||'').trim().slice(0,n);
export const BUSINESS_AI_SUITE=[
['video-ads','AI Video Ads','Generate video-ad briefs, scripts, scenes, hooks, CTAs and production jobs','video'],
['academy-wizard','Academy Wizard','Build branded academies, courses, lessons and learning paths','education'],
['coach-wizard','AI Coach Wizard','Create niche assistants with instructions and knowledge context','agent'],
['hyper-images','Hyperrealistic Images','Create production-ready image briefs and route to image generation','creative'],
['scroll-ads','Scroll-Stopping Ads','Generate campaign concepts, ad copy, creative briefs and variants','marketing'],
['proposals','Marketing Proposals','Build client-specific marketing proposals and scopes','sales'],
['email-marketing','Email Marketing','Create campaigns, sequences, subject lines and follow-up plans','marketing'],
['image-editor','AI Image Editor','Route image transformation and editing workflows','creative'],
['magic-hooks','Magic Hooks','Generate headline and hook variants for ads, sites, funnels and social','copy'],
['asset-library','Asset Library','Organize reusable licensed/user-owned creative assets and files','storage'],
['funnels','Ultra-Fast Funnels','Create funnel structures, pages, CTAs, experiments and analytics plans','web'],
['websites','Smart Websites','Create multi-page responsive website structures, SEO and navigation','web'],
['ecommerce-pdp','E-commerce PDP','Generate SEO/AEO-ready product page copy and merchandising structure','commerce'],
['domain-generator','AI Domain Generator','Generate domain-name candidates and connection checklists','web'],
['crm','Easy CRM','Manage contacts, companies, deals, pipelines and service history','sales'],
['chat-agent','Chat Agent','Create lead qualification and support chat-agent configurations','agent'],
['sticky-notes','Sticky Notes','Create lightweight notes, tasks and reminders','productivity'],
['cloud-storage','Cloud Storage','Organize files and references through connected storage architecture','storage'],
['business-phone','Business Phone','Connect Magnanimous Telecom/contact-center calling workflows','communications'],
['project-management','Project Management','Create durable projects, tasks, owners and delivery workflows','productivity'],
['app-wizard','AI App Wizard','Turn an app idea into a structured build specification and implementation job','builder'],
['lead-flow','AI Marketing Lead Flow','Create prospecting criteria, lead campaigns, qualification and outreach plans','growth'],
['seo-aeo','SEO + AEO Optimizer','Generate metadata, schema/content plans and AI-search optimization recommendations','growth'],
['social','Social Media Studio','Create platform-specific posts, calendars, repurposing and campaigns','marketing'],
['sms','SMS Automation','Create consent-aware SMS sequences and follow-up automation','communications'],
['forms-surveys','Forms + Surveys','Build lead forms, questionnaires and feedback flows','growth'],
['community','Community','Create branded member spaces and engagement plans','education'],
['marketplace','AI Marketplace','Package original/user-authorized assets, apps and services for sale','commerce'],
['multilingual','Multilingual Studio','Localize business content while preserving meaning and brand voice','language']
];
async function ensure(env){await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_business_ai_jobs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,tool_id TEXT NOT NULL,title TEXT NOT NULL,input_json TEXT NOT NULL DEFAULT '{}',output_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run()}
export async function handleBusinessAISuite(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/business-ai'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await ensure(env);const tenant=String(user.tenant_id);
if(u.pathname==='/api/business-ai/tools'&&request.method==='GET')return json({name:'Magnanimous Business AI Suite',brain:'Magnanimous AI',tools:BUSINESS_AI_SUITE.map(([id,name,description,category])=>({id,name,description,category})),count:BUSINESS_AI_SUITE.length});
if(u.pathname==='/api/business-ai/jobs'&&request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 300').bind(tenant).all();return json({items:results})}
if(u.pathname==='/api/business-ai/jobs'&&request.method==='POST'){const b=await request.json().catch(()=>({})),tool=BUSINESS_AI_SUITE.find(x=>x[0]===String(b.tool_id||''));if(!tool)return json({detail:'Choose a valid tool.'},400);const id=crypto.randomUUID(),ts=now(),title=txt(b.title||tool[1],180);await env.DB.prepare('INSERT INTO magnanimous_business_ai_jobs(id,tenant_id,tool_id,title,input_json,output_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,tool[0],title,JSON.stringify(b.input||{}),JSON.stringify({next:'Magnanimous AI orchestration',capability:tool[1]}),'planned',ts,ts).run();return json({ok:true,id,tool:{id:tool[0],name:tool[1]},status:'planned'},201)}
return json({detail:'Business AI endpoint not found.'},404)}
