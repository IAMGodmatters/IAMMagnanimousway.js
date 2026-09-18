import {currentUser} from './integrations.js';
import {createWork,addWorkStep,getWork,updateWorkStep} from './work-engine-runtime.js';
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
async function ensure(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_business_ai_jobs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL DEFAULT '',tool_id TEXT NOT NULL,title TEXT NOT NULL,input_json TEXT NOT NULL DEFAULT '{}',output_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
 try{await env.DB.prepare("ALTER TABLE magnanimous_business_ai_jobs ADD COLUMN user_id TEXT NOT NULL DEFAULT ''").run()}catch{}
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_business_ai_user ON magnanimous_business_ai_jobs(tenant_id,user_id,updated_at DESC)').run();
}
const CAPABILITY_ROUTES={
'video-ads':{surface:'/video-agents',accessibility:['script','storyboard','captions','9:16 and 16:9'],dependencies:['video-agents','renderer']},
'academy-wizard':{surface:'/white-label-studio?tab=learning',accessibility:['course structure','lessons','plain-language learning paths'],dependencies:['learning']},
'coach-wizard':{surface:'/magnanimous',accessibility:['keyboard-first chat','plain-language instructions'],dependencies:['magnanimous-ai','knowledge']},
'hyper-images':{surface:'/magnanimous',accessibility:['text prompt','alt-text workflow'],dependencies:['image-generation']},
'scroll-ads':{surface:'/marketing',accessibility:['copy variants','creative brief'],dependencies:['marketing']},
'proposals':{surface:'/white-label-studio?tab=contracts',accessibility:['structured proposal','signature-status workflow'],dependencies:['contracts','esign-external']},
'email-marketing':{surface:'/marketing',accessibility:['subject/body sequence','audience segmentation'],dependencies:['marketing','automation','email-send-external']},
'image-editor':{surface:'/magnanimous',accessibility:['text-directed edits','alt-text workflow'],dependencies:['image-editing','image-edit-engine-external']},
'magic-hooks':{surface:'/writing',accessibility:['plain text','variant generation'],dependencies:['writing']},
'asset-library':{surface:'/connections',accessibility:['searchable metadata','project/client linkage'],dependencies:['files','connections','storage-external']},
'funnels':{surface:'/agency-command?tab=funnels',accessibility:['hosted page','CTA','analytics'],dependencies:['agency-funnels']},
'websites':{surface:'/developer',accessibility:['responsive structure','semantic content','SEO'],dependencies:['developer-agent']},
'ecommerce-pdp':{surface:'/marketing',accessibility:['structured product facts','FAQ','SEO/AEO'],dependencies:['marketing']},
'domain-generator':{surface:'/developer',accessibility:['candidate list','connection checklist'],dependencies:['developer-agent','dns-external']},
'crm':{surface:'/crm',accessibility:['contacts','accounts','pipelines','tasks','sequences'],dependencies:['crm']},
'chat-agent':{surface:'/magnanimous',accessibility:['keyboard chat','handoff rules'],dependencies:['magnanimous-ai','knowledge']},
'sticky-notes':{surface:'/work-engine',accessibility:['plain text','task linkage'],dependencies:['work-engine']},
'cloud-storage':{surface:'/connections',accessibility:['file metadata','access controls'],dependencies:['files','connections','storage-external']},
'business-phone':{surface:'/telecom',accessibility:['consent controls','call workflow','receipts'],dependencies:['telecom','carrier-external']},
'project-management':{surface:'/work-engine',accessibility:['steps','status','resume','evidence'],dependencies:['work-engine']},
'app-wizard':{surface:'/developer',accessibility:['plain-language spec','QA workflow'],dependencies:['developer-agent','developer-approval-external']},
'lead-flow':{surface:'/crm',accessibility:['ICP','qualification','sequence','inbox replies'],dependencies:['crm','inbox','automation','outreach-external']},
'seo-aeo':{surface:'/marketing',accessibility:['metadata','schema plan','content recommendations'],dependencies:['marketing']},
'social':{surface:'/social',accessibility:['platform variants','calendar','repurposing'],dependencies:['social','publishing-external']},
'sms':{surface:'/inbox',accessibility:['consent preflight','opt-out','quiet hours'],dependencies:['inbox','sms-external']},
'forms-surveys':{surface:'/white-label/funnel',accessibility:['labels','field schema','response routing'],dependencies:['funnels','automation']},
'community':{surface:'/white-label-studio?tab=community',accessibility:['spaces','member access','moderation plan'],dependencies:['community']},
'marketplace':{surface:'/white-label-studio?tab=catalog',accessibility:['catalog metadata','pricing','terms'],dependencies:['catalog','billing','payment-external']},
'multilingual':{surface:'/magnanimous',accessibility:['localization','meaning preservation','review'],dependencies:['translation']}
};
const DIRECT_EXECUTION={
'video-ads':{tool:'video-script',instruction:'Create a production-ready video-ad script, hook, scene-by-scene storyboard, CTA, caption notes and accessibility/caption plan. Do not claim a video was rendered.'},
'academy-wizard':{tool:'writing',instruction:'Create a structured academy/course outline with modules, lessons, objectives, exercises and learner accessibility considerations. Do not claim it was published.'},
'coach-wizard':{tool:'magnanimous',instruction:'Create an original AI coach specification: role, boundaries, system behavior, intake questions, knowledge requirements, escalation rules and test scenarios.'},
'scroll-ads':{tool:'marketing',instruction:'Create an ad campaign pack with audience, offer, hooks, primary copy variants, creative directions, CTAs and an A/B testing plan.'},
'proposals':{tool:'business',instruction:'Create a client-ready marketing/business proposal with problem, goals, scope, deliverables, timeline, assumptions, pricing placeholders/options and acceptance next steps. Do not claim signature.'},
'email-marketing':{tool:'marketing',instruction:'Create an email campaign including segmentation assumptions, subject variants, sequence messages, CTAs, follow-up timing and measurement plan. Do not send email.'},
'magic-hooks':{tool:'writing',instruction:'Generate multiple distinct hook/headline families, explain intended audience angle briefly, and identify the clearest variants without fabricating performance data.'},
'funnels':{tool:'marketing',instruction:'Create a conversion funnel specification with page sequence, headline/copy blocks, CTA logic, form fields, A/B hypotheses and analytics events. Do not claim it is published.'},
'websites':{tool:'coding',instruction:'Create a responsive website implementation specification including sitemap, components, semantic HTML/accessibility requirements, SEO metadata, content sections and publish checklist. Do not claim deployment.'},
'ecommerce-pdp':{tool:'marketing',instruction:'Create an ecommerce product-detail-page package using only supplied facts: title, benefits, specifications, FAQs, SEO/AEO structure, structured-data recommendations and CTA. Never invent product claims.'},
'chat-agent':{tool:'customer-service',instruction:'Create a lead/support chat-agent specification with opening, qualification questions, knowledge boundaries, escalation/handoff rules, refusal boundaries and test conversations.'},
'seo-aeo':{tool:'marketing',instruction:'Create an SEO and answer-engine optimization plan with search intent, entities, page structure, metadata, schema recommendations, FAQs and measurement plan. Do not invent rankings or traffic.'},
'social':{tool:'social',instruction:'Create platform-specific social content variants, posting calendar suggestions, repurposing plan, CTA options and accessibility notes such as captions/alt-text prompts. Do not publish.'},
'forms-surveys':{tool:'business',instruction:'Create an accessible form/survey schema with labels, field types, required/optional states, validation, consent language placeholders, routing rules and response-analysis plan.'},
'multilingual':{tool:'writing',instruction:'Translate/localize the supplied material while preserving meaning, brand terms, numbers and legal/compliance wording; flag ambiguous phrases for review.'},
'domain-generator':{tool:'business',instruction:'Generate distinctive domain-name candidates from the supplied brand constraints. Flag that availability, registration rights and trademark clearance require live checks; do not claim a domain is available.'},
'lead-flow':{tool:'marketing',instruction:'Create a lawful lead-flow plan with ICP, qualification criteria, outreach sequence, CRM stages, reply handling, consent/DNC safeguards and measurement. Do not contact anyone.'},
'project-management':{tool:'business',instruction:'Turn the goal into a project plan with milestones, tasks, dependencies, owners/roles, due-date placeholders, risks, acceptance criteria and verification checkpoints.'},
'sticky-notes':{tool:'writing',instruction:'Turn the goal into a concise actionable note with context, decisions, next actions and reminder suggestions.'},
'cloud-storage':{tool:'business',instruction:'Create a secure file-organization plan with folder/taxonomy structure, metadata, access-control roles, retention notes and project/client linkage. Do not claim files were uploaded.'},
'business-phone':{tool:'customer-service',instruction:'Create a business-phone/call-center workflow with call purpose, script, routing, consent/quiet-hour checks, escalation, disposition and action-receipt requirements. Do not place a call.'},
'sms':{tool:'marketing',instruction:'Create a consent-aware SMS sequence with concise messages, opt-out language, quiet-hour safeguards and follow-up logic. Do not send messages.'},
'community':{tool:'business',instruction:'Create a community-space plan with audience, spaces/topics, access rules, onboarding, moderation, posting cadence and success measures. Do not claim it is published.'},
'marketplace':{tool:'business',instruction:'Create a marketplace/package specification with offer, deliverables, license/usage terms placeholders, pricing options, fulfillment steps and payment-readiness checklist. Do not publish or charge.'},
'asset-library':{tool:'business',instruction:'Create an asset-library taxonomy and metadata plan covering ownership/license status, tags, campaign/project linkage, access controls and reuse rules. Do not claim files were uploaded.'},
'image-editor':{tool:'writing',instruction:'Create a precise image-edit brief describing the source-image changes, preserved elements, accessibility/alt-text needs and review checklist. Do not claim an image was edited; a true edit requires an edit-capable visual engine.'},
'crm':{tool:'business',instruction:'Translate the goal into a structured CRM action plan using only supplied customer facts. Identify contact/account fields, pipeline stage, task/follow-up suggestions, notes and any missing information. Do not invent contact details or mutate CRM records from guesses.'},
'app-wizard':{tool:'coding',instruction:'Create an implementation-ready app specification with users, jobs-to-be-done, screens, data model, permissions, APIs/actions, edge cases, accessibility, security, acceptance criteria and QA plan. Do not stage repository mutations or claim deployment; those remain behind the developer-agent approval gate.'}
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
function aiText(data){return txt(data?.reply??data?.answer??data?.response??data?.output??data?.message??data?.result??'',30000)}
async function runDirectExecution(request,env,ctx,downstream,user,row){
 const input=(()=>{try{return JSON.parse(String(row.input_json||'{}'))}catch{return{}}})(),view=await jobView(env,user,row),work=view.work,goal=txt(input.goal||work?.goal||row.title,10000);
 if(!goal)return json({detail:'Add a goal before executing this capability.'},400);
 if(!work)return json({detail:'The linked Work Engine job is unavailable for this user.'},409);
 const step=work.steps.find(x=>x.status==='pending'||x.status==='working');
 if(!step)return json({detail:'All execution steps are finished. Run verification instead of creating another artifact.',verification:view.verification},409);
 if(!downstream?.fetch)return json({detail:'Magnanimous execution runtime is unavailable.'},503);
 const prior=work.steps.filter(x=>x.status==='completed'&&String(x.result||'').trim()).slice(-3).map(x=>`STEP: ${x.title}\nRESULT: ${txt(x.result,1800)}`).join('\n\n');

 if(row.tool_id==='hyper-images'&&/route to image generation/i.test(String(step.title||''))){
  const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
  const forwarded=new Request(new URL('/api/visual/scene',request.url),{method:'POST',headers,body:JSON.stringify({title:row.title,text:goal,style:'business'})});
  const response=await downstream.fetch(forwarded,env,ctx),data=await response.clone().json().catch(()=>({}));if(!response.ok)return json({detail:data.detail||'Image generation failed.',code:data.code||'VISUAL_GENERATION_FAILED'},response.status);
  await updateWorkStep(env,user,work.id,step.id,{status:'completed',result:'Generated image for this step. Prompt: '+txt(data.prompt,2400)});
  const fresh=await getWork(env,user,work.id),out={...(view.output||{}),work_id:work.id,last_execution_at:now(),last_step_id:step.id,last_step_title:step.title,artifact_type:'image',image_prompt:txt(data.prompt,2500),image_provider_internal:true};
  await env.DB.prepare('UPDATE magnanimous_business_ai_jobs SET output_json=?,status=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind(JSON.stringify(out),'working',now(),row.id,String(user.tenant_id),String(user.id)).run();
  return json({ok:true,id:row.id,artifact_type:'image',image_data_uri:data.image_data_uri,prompt:data.prompt,completed_step:{id:step.id,title:step.title},work:fresh,external_action_performed:false});
 }

 const adapter=row.tool_id==='hyper-images'
  ?{tool:'marketing',instruction:'Complete only the current image-planning or review step. Produce a concise visual brief, accessibility/alt-text guidance, or review checklist as appropriate. Do not claim an image was generated unless the current step is the actual image-generation step.'}
  :DIRECT_EXECUTION[row.tool_id];
 if(!adapter)return json({detail:'This capability uses a specialized workspace. Open its working surface to execute it.'},409);
 const prompt=`MAGNANIMOUS BUSINESS AI STEP EXECUTION
Capability: ${BUSINESS_AI_SUITE.find(x=>x[0]===row.tool_id)?.[1]||row.tool_id}
Overall goal: ${goal}
CURRENT STEP: ${step.title}
Step description: ${txt(step.description||'',1600)}
Execution requirement: ${adapter.instruction}
Relevant completed-step context:
${prior||'No prior completed-step output yet.'}
Verification criteria:
- ${(VERIFY_CRITERIA[row.tool_id]||[]).join('\n- ')}
Complete ONLY the current step. Return a concrete, useful deliverable for this step. Do not claim later steps, deployment, publishing, sending, signing, charging, calling, file upload, or any outside action occurred unless an authorized tool result proves it.`;
 const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
 const forwarded=new Request(new URL('/api/chat',request.url),{method:'POST',headers,body:JSON.stringify({message:prompt,tool:adapter.tool,provider:'auto',specialist_routing:true,use_knowledge:true})});
 const response=await downstream.fetch(forwarded,env,ctx),data=await response.clone().json().catch(()=>({}));if(!response.ok)return json({detail:data.detail||data.error||'Magnanimous AI execution failed.'},response.status);
 const artifact=aiText(data);if(!artifact)return json({detail:'Magnanimous AI returned no usable output.'},502);
 await updateWorkStep(env,user,work.id,step.id,{status:'completed',result:artifact});
 const fresh=await getWork(env,user,work.id),out={...(view.output||{}),work_id:work.id,latest_artifact:artifact,last_execution_at:now(),last_step_id:step.id,last_step_title:step.title,direct_execution_tool:adapter.tool};
 await env.DB.prepare('UPDATE magnanimous_business_ai_jobs SET output_json=?,status=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind(JSON.stringify(out),'working',now(),row.id,String(user.tenant_id),String(user.id)).run();
 return json({ok:true,id:row.id,artifact,completed_step:{id:step.id,title:step.title},work:fresh,verification:(await jobView(env,user,{...row,output_json:JSON.stringify(out),status:'working'})).verification,external_action_performed:false});
}
export async function handleBusinessAISuite(request,env,ctx,downstream){const u=new URL(request.url);if(!u.pathname.startsWith('/api/business-ai'))return null;const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);await ensure(env);const tenant=String(user.tenant_id),userId=String(user.id);
if(u.pathname==='/api/business-ai/tools'&&request.method==='GET')return json({name:'Magnanimous Business AI Suite',brain:'Magnanimous AI',tools:BUSINESS_AI_SUITE.map(([id,name,description,category])=>({id,name,description,category,...CAPABILITY_ROUTES[id]})),count:BUSINESS_AI_SUITE.length,accessibility_standard:'keyboard-first, semantic labels, responsive layouts, plain-language errors, accessible generated-content metadata',truth_boundary:'External telecom, messaging, domain, storage, publishing or payment actions are only live when the corresponding authorized connection is actually ready.'});
if(u.pathname==='/api/business-ai/jobs'&&request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE tenant_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 100').bind(tenant,userId).all();const items=[];for(const row of results)items.push(await jobView(env,user,row));return json({items})}
const jobMatch=u.pathname.match(/^\/api\/business-ai\/jobs\/([^/]+)(?:\/(verify|execute))?$/);
if(jobMatch&&request.method==='GET'){const row=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE id=? AND tenant_id=? AND user_id=?').bind(jobMatch[1],tenant,userId).first();if(!row)return json({detail:'Business AI job not found.'},404);return json(await jobView(env,user,row))}
if(jobMatch&&jobMatch[2]==='execute'&&request.method==='POST'){const row=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE id=? AND tenant_id=? AND user_id=?').bind(jobMatch[1],tenant,userId).first();if(!row)return json({detail:'Business AI job not found.'},404);return runDirectExecution(request,env,ctx,downstream,user,row)}
if(jobMatch&&jobMatch[2]==='verify'&&request.method==='POST'){const row=await env.DB.prepare('SELECT * FROM magnanimous_business_ai_jobs WHERE id=? AND tenant_id=? AND user_id=?').bind(jobMatch[1],tenant,userId).first();if(!row)return json({detail:'Business AI job not found.'},404);const view=await jobView(env,user,row);const status=view.verification.status==='verified'?'completed':view.verification.workflow_complete?'waiting':'working';await env.DB.prepare('UPDATE magnanimous_business_ai_jobs SET status=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=?').bind(status,now(),jobMatch[1],tenant,userId).run();return json({...view,status,detail:view.verification.status==='verified'?'Verified complete.':view.verification.workflow_complete?'Workflow complete. An authorized external connection is still required before the outside action can be claimed complete.':'Execution is not complete yet.'})}
if(u.pathname==='/api/business-ai/jobs'&&request.method==='POST'){const b=await request.json().catch(()=>({})),tool=BUSINESS_AI_SUITE.find(x=>x[0]===String(b.tool_id||''));if(!tool)return json({detail:'Choose a valid tool.'},400);const id=crypto.randomUUID(),ts=now(),title=txt(b.title||tool[1],180);const plan=planFor(tool[0],b.input||{});const work=await createWork(env,user,{title,goal:plan.goal||tool[2],specialist_id:tool[0],metadata:{source:'business-ai',business_ai_job_id:id,tool_id:tool[0]}});if(!work)return json({detail:'Magnanimous Work Engine could not create this job.'},500);for(const step of plan.steps)await addWorkStep(env,user,work.id,{title:step.name,status:'planned'});const linked=await getWork(env,user,work.id);await env.DB.prepare('INSERT INTO magnanimous_business_ai_jobs(id,tenant_id,user_id,tool_id,title,input_json,output_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,userId,tool[0],title,JSON.stringify(b.input||{}),JSON.stringify({...plan,work_id:work.id}),'working',ts,ts).run();return json({ok:true,id,tool:{id:tool[0],name:tool[1]},status:'working',work:linked,execution_plan:{...plan,work_id:work.id}},201)}
return json({detail:'Business AI endpoint not found.'},404)}
