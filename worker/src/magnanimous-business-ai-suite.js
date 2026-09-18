import {currentUser} from './integrations.js';
import {createWork,addWorkStep,getWork} from './work-engine-runtime.js';
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
const CAPABILITY_ROUTES={
'video-ads':{surface:'/video-agents',accessibility:['script','storyboard','captions','9:16 and 16:9'],dependencies:['video-agents','renderer']},
'academy-wizard':{surface:'/white-label-studio?tab=learning',accessibility:['course structure','lessons','plain-language learning paths'],dependencies:['learning']},
'coach-wizard':{surface:'/magnanimous',accessibility:['keyboard-first chat','plain-language instructions'],dependencies:['magnanimous-ai','knowledge']},
'hyper-images':{surface:'/magnanimous',accessibility:['text prompt','alt-text workflow'],dependencies:['image-generation']},
'scroll-ads':{surface:'/marketing',accessibility:['copy variants','creative brief'],dependencies:['marketing']},
'proposals':{surface:'/white-label-studio?tab=contracts',accessibility:['structured proposal','signature-status workflow'],dependencies:['contracts']},
'email-marketing':{surface:'/marketing',accessibility:['subject/body sequence','audience segmentation'],dependencies:['marketing','automation']},
'image-editor':{surface:'/magnanimous',accessibility:['text-directed edits','alt-text workflow'],dependencies:['image-editing']},
'magic-hooks':{surface:'/writing',accessibility:['plain text','variant generation'],dependencies:['writing']},
'asset-library':{surface:'/connections',accessibility:['searchable metadata','project/client linkage'],dependencies:['files','connections']},
'funnels':{surface:'/agency-command?tab=funnels',accessibility:['hosted page','CTA','analytics'],dependencies:['agency-funnels']},
'websites':{surface:'/developer',accessibility:['responsive structure','semantic content','SEO'],dependencies:['developer-agent']},
'ecommerce-pdp':{surface:'/marketing',accessibility:['structured product facts','FAQ','SEO/AEO'],dependencies:['marketing']},
'domain-generator':{surface:'/developer',accessibility:['candidate list','connection checklist'],dependencies:['developer-agent','dns-external']},
'crm':{surface:'/crm',accessibility:['contacts','accounts','pipelines','tasks','sequences'],dependencies:['crm']},
'chat-agent':{surface:'/magnanimous',accessibility:['keyboard chat','handoff rules'],dependencies:['magnanimous-ai','knowledge']},
'sticky-notes':{surface:'/work-engine',accessibility:['plain text','task linkage'],dependencies:['work-engine']},
'cloud-storage':{surface:'/connections',accessibility:['file metadata','access controls'],dependencies:['files','connections']},
'business-phone':{surface:'/telecom',accessibility:['consent controls','call workflow','receipts'],dependencies:['telecom','carrier-external']},
'project-management':{surface:'/work-engine',accessibility:['steps','status','resume','evidence'],dependencies:['work-engine']},
'app-wizard':{surface:'/developer',accessibility:['plain-language spec','QA workflow'],dependencies:['developer-agent']},
'lead-flow':{surface:'/crm',accessibility:['ICP','qualification','sequence','inbox replies'],dependencies:['crm','inbox','automation']},
'seo-aeo':{surface:'/marketing',accessibility:['metadata','schema plan','content recommendations'],dependencies:['marketing']},
'social':{surface:'/social',accessibility:['platform variants','calendar','repurposing'],dependencies:['social']},
'sms':{surface:'/inbox',accessibility:['consent preflight','opt-out','quiet hours'],dependencies:['inbox','sms-external']},
'forms-surveys':{surface:'/white-label/funnel',accessibility:['labels','field schema','response routing'],dependencies:['funnels','automation']},
'community':{surface:'/white-label-studio?tab=community',accessibility:['spaces','member access','moderation plan'],dependencies:['community']},
'marketplace':{surface:'/white-label-studio?tab=catalog',accessibility:['catalog metadata','pricing','terms'],dependencies:['catalog','billing']},
'multilingual':{surface:'/magnanimous',accessibility:['localization','meaning preservation','review'],dependencies:['translation']}
};
const VERIFY_CRITERIA={
'video-ads':['storyboard/script saved','render path available','final media reviewed'],
'academy-wizard':['course structure saved','lessons saved','learner path review complete'],
'coach-wizard':['instructions saved','knowledge boundary defined','test conversations reviewed'],
'hyper-images':['prompt/brief saved','image output created','brand/accessibility review complete'],
'scroll-ads':['audience/offer saved','variants created','test plan saved'],
'proposals':['scope saved','pricing/options saved','signature workflow status recorded'],
'email-marketing':['segment saved','sequence saved','CTA/tracking plan reviewed'],
'image-editor':['authorized source identified','edit instructions saved','output reviewed'],
'magic-hooks':['audience/promise saved','hook variants saved','selected hooks reviewed'],
'asset-library':['asset ownership/license recorded','metadata saved','access controls reviewed'],
'funnels':['page flow saved','CTA destination valid','analytics/experiment plan saved'],
'websites':['information architecture saved','responsive/semantic review complete','SEO/publish checklist saved'],
'ecommerce-pdp':['product facts saved','PDP copy/FAQ created','SEO/AEO review complete'],
'domain-generator':['brand constraints saved','candidate list saved','availability/trademark checks not falsely claimed'],
'crm':['pipeline/contact work saved','follow-up activities created','do-not-contact rules respected'],
'chat-agent':['role/questions saved','handoff rules saved','test conversations reviewed'],
'sticky-notes':['note saved','context/project linked','reminder/task linkage reviewed'],
'cloud-storage':['file metadata saved','authorized storage target selected','access controls reviewed'],
'business-phone':['call workflow saved','consent/quiet-hours checked','carrier connection verified before calling'],
'project-management':['milestones/tasks saved','owners/dates recorded','completion evidence reviewed'],
'app-wizard':['app spec saved','data/actions/UI plan saved','QA evidence required before release'],
'lead-flow':['ICP/criteria saved','sequence saved','consent/DNC checks applied'],
'seo-aeo':['audit/topic saved','recommendations saved','measurement plan saved'],
'social':['platform content saved','calendar/repurposing saved','publishing connection verified before post'],
'sms':['consent preflight required','opt-out/quiet-hours enforced','messaging connection verified before send'],
'forms-surveys':['field schema saved','routing saved','label/accessibility review complete'],
'community':['space/access rules saved','moderation plan saved','member experience reviewed'],
'marketplace':['offer/license saved','pricing/terms saved','payment connection verified before sale'],
'multilingual':['source meaning preserved','localized output saved','human/review step recorded']
};
const PLAYBOOKS={
'video-ads':['Define audience and offer','Write hook/script/CTA','Create scene and asset brief','Route to Video Studio','Review and publish'],
'academy-wizard':['Define learning outcome','Create course structure','Create lessons and exercises','Publish to Learning/Community'],
'coach-wizard':['Define assistant role','Set instructions and boundaries','Attach authorized knowledge','Test scenarios','Publish assistant'],
'hyper-images':['Define subject and campaign goal','Create image brief','Route to image generation','Review brand fit'],
'scroll-ads':['Define offer and audience','Generate hooks and variants','Create creative brief','Set campaign test plan'],
'proposals':['Collect client goal','Create scope and deliverables','Create pricing/options','Route to Contracts/eSign'],
'email-marketing':['Define segment and goal','Draft sequence','Add CTA and tracking plan','Route to campaign automation'],
'image-editor':['Describe authorized source image and edits','Create transformation brief','Route to image editor','Review result'],
'magic-hooks':['Define audience and promise','Generate hook families','Rank by clarity and relevance','Attach to campaign assets'],
'asset-library':['Classify user-owned/licensed assets','Add searchable metadata','Connect to campaigns and projects'],
'funnels':['Define conversion goal','Create page sequence','Write page/CTA copy','Create A/B test plan','Track conversion'],
'websites':['Define business and pages','Create information architecture','Generate responsive content/SEO plan','Prepare domain/publish checklist'],
'ecommerce-pdp':['Collect product facts','Write benefits and specifications','Create SEO/AEO structure','Add FAQs and CTA'],
'domain-generator':['Define brand constraints','Generate candidates','Flag trademark/domain checks','Prepare connection checklist'],
'crm':['Define pipeline','Capture/import contacts','Create stages and activities','Automate follow-up'],
'chat-agent':['Define qualification/support goal','Create questions and handoff rules','Set knowledge boundaries','Test conversations'],
'sticky-notes':['Capture note','Classify context','Link to client/project','Create reminder when requested'],
'cloud-storage':['Classify file','Choose authorized storage','Attach metadata/client/project','Apply access controls'],
'business-phone':['Define call workflow','Apply consent/quiet-hour controls','Route through Magnanimous Telecom/contact center','Record receipt'],
'project-management':['Define outcome','Create milestones/tasks','Assign owners/dates','Track evidence and completion'],
'app-wizard':['Define user problem','Create app specification','Create data/actions/UI plan','Route to developer agent','QA before release'],
'lead-flow':['Define ICP and lawful source','Build qualification criteria','Create outreach sequence','Route replies to CRM/inbox'],
'seo-aeo':['Audit page/topic','Map intent and entities','Create metadata/schema/content recommendations','Measure outcomes'],
'social':['Define platforms and goal','Create calendar and posts','Create repurposing plan','Route approved publishing'],
'sms':['Verify consent','Create concise sequence','Apply opt-out/quiet hours','Route approved sends'],
'forms-surveys':['Define questions and fields','Create form schema','Set routing/automation','Analyze responses'],
'community':['Define audience and access','Create spaces/topics','Create onboarding/content cadence','Moderate and measure'],
'marketplace':['Define original/authorized offer','Package deliverables and license','Set pricing/terms','Publish catalog item'],
'multilingual':['Identify source meaning and audience','Translate/localize','Preserve brand/legal terms','Review before publish']
};
function planFor(id,input){const steps=PLAYBOOKS[id]||['Understand goal','Plan','Execute with Magnanimous tools','Verify'];return{tool_id:id,goal:txt(input?.goal||'',1000),steps:steps.map((name,index)=>({index:index+1,name,status:'planned'})),orchestrator:'Magnanimous AI',provider_policy:'native-first; authorized replaceable infrastructure only when needed',verification_criteria:VERIFY_CRITERIA[id]||['output saved','execution reviewed','evidence recorded'],verification:'Evidence and action receipts required before claiming completion'}}
const externalFor=id=>(CAPABILITY_ROUTES[id]?.dependencies||[]).filter(x=>String(x).endsWith('-external'));
async function jobView(env,user,row){const out=(()=>{try{return JSON.parse(String(row.output_json||'{}'))}catch{return{}}})();const workId=Number(out.work_id||0),work=workId?await getWork(env,user,workId):null,external=externalFor(row.tool_id),done=Boolean(work&&work.status==='completed'&&Number(work.progress||0)===100);return{...row,input:(()=>{try{return JSON.parse(String(row.input_json||'{}'))}catch{return{}}})(),output:out,work,verification:{criteria:VERIFY_CRITERIA[row.tool_id]||[],workflow_complete:done,external_connections_required:external,action_ready:done&&external.length===0,status:done?(external.length?'workflow_verified_external_connection_required':'verified'):'not_verified'},resume_url:workId?'/work-engine?work='+workId:CAPABILITY_ROUTES[row.tool_id]?.surface||'/business-ai'}}
export async function handleBusinessAISuite(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/business-ai'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await ensure(env);const tenant=String(user.tenant_id);
if(u.pathname==='/api/business-ai/tools'&&request.method==='GET')return json({name:'Magnanimous Business AI Suite',brain:'Magnanimous AI',tools:BUSINESS_AI_SUITE.map(([id,name,description,category])=>({id,name,description,category,...CAPABILITY_ROUTES[id]})),count:BUSINESS_AI_SUITE.length,accessibility_standard:'keyboard-first, semantic labels, responsive layouts, plain-language errors, accessible generated-content metadata',truth_boundary:'External telecom, messaging, domain, storage, publishing or payment actions are only live when the corresponding authorized connection is actually ready.'});
if(u.pathname==='/api/business-ai/jobs'&&request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 100').bind(tenant).all();const items=[];for(const row of results)items.push(await jobView(env,user,row));return json({items})}
const jobMatch=u.pathname.match(/^\/api\/business-ai\/jobs\/([^/]+)(?:\/(verify))?$/);
if(jobMatch&&request.method==='GET'){const row=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE id=? AND tenant_id=?').bind(jobMatch[1],tenant).first();if(!row)return json({detail:'Business AI job not found.'},404);return json(await jobView(env,user,row))}
if(jobMatch&&jobMatch[2]==='verify'&&request.method==='POST'){const row=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE id=? AND tenant_id=?').bind(jobMatch[1],tenant).first();if(!row)return json({detail:'Business AI job not found.'},404);const view=await jobView(env,user,row);const status=view.verification.status==='verified'?'completed':view.verification.workflow_complete?'waiting':'working';await env.DB.prepare('UPDATE magnanimous_business_ai_jobs SET status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(status,now(),jobMatch[1],tenant).run();return json({...view,status,detail:view.verification.status==='verified'?'Verified complete.':view.verification.workflow_complete?'Workflow complete. An authorized external connection is still required before the outside action can be claimed complete.':'Execution is not complete yet.'})}
if(u.pathname==='/api/business-ai/jobs'&&request.method==='POST'){const b=await request.json().catch(()=>({})),tool=BUSINESS_AI_SUITE.find(x=>x[0]===String(b.tool_id||''));if(!tool)return json({detail:'Choose a valid tool.'},400);const id=crypto.randomUUID(),ts=now(),title=txt(b.title||tool[1],180);const plan=planFor(tool[0],b.input||{});const work=await createWork(env,user,{title,goal:plan.goal||tool[2],specialist_id:tool[0],metadata:{source:'business-ai',business_ai_job_id:id,tool_id:tool[0]}});if(!work)return json({detail:'Magnanimous Work Engine could not create this job.'},500);for(const step of plan.steps)await addWorkStep(env,user,work.id,{title:step.name,status:'planned'});const linked=await getWork(env,user,work.id);await env.DB.prepare('INSERT INTO magnanimous_business_ai_jobs(id,tenant_id,tool_id,title,input_json,output_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,tenant,tool[0],title,JSON.stringify(b.input||{}),JSON.stringify({...plan,work_id:work.id}),'working',ts,ts).run();return json({ok:true,id,tool:{id:tool[0],name:tool[1]},status:'working',work:linked,execution_plan:{...plan,work_id:work.id}},201)}
return json({detail:'Business AI endpoint not found.'},404)}
