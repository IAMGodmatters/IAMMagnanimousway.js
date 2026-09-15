import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);

export const MAGNANIMOUS_SOVEREIGN_STACK={
 identity:'Magnanimous AI',
 rule:'Magnanimous AI owns identity, orchestration, memory, reasoning policy, verification and learning. External engines, plugins and transports are replaceable execution adapters only. Magnanimous may learn portable workflows and capability patterns, but never copies proprietary model weights, private prompts, credentials, copyrighted implementation code, or protected provider data.',
 layers:[
  {id:'brain',name:'Magnanimous Cognitive Core',mode:'native-control',status:'active'},
  {id:'memory',name:'Magnanimous Persistent Memory',mode:'native-control',status:'active'},
  {id:'reasoning',name:'Magnanimous Deliberation + Verification',mode:'native-control',status:'active'},
  {id:'skill-foundry',name:'Magnanimous Skill Foundry',mode:'native-control',status:'active'},
  {id:'evaluation-lab',name:'Magnanimous Adapter Evaluation Lab',mode:'native-control',status:'active'},
  {id:'model-fabric',name:'Replaceable Model Execution Fabric',mode:'adapter',status:'active'},
  {id:'voice',name:'Magnanimous Voice Runtime',mode:'native-first',status:'active'},
  {id:'rtc',name:'Magnanimous WebRTC Calling',mode:'native-first',status:'active'},
  {id:'pstn',name:'Magnanimous Carrier Gateway',mode:'licensed-or-byoc-transport',status:'adapter-required'},
  {id:'messaging',name:'Magnanimous Omnichannel Messaging',mode:'native-or-official-channel-adapter',status:'active'},
  {id:'avatar',name:'Magnanimous Virtual Host',mode:'native-first',status:'active'},
  {id:'crm',name:'Magnanimous CRM',mode:'native-control',status:'active'},
  {id:'site-builder',name:'Magnanimous Site Builder',mode:'white-label-product',status:'product-ready'},
  {id:'app-builder',name:'Magnanimous App Builder',mode:'white-label-product',status:'product-ready'},
  {id:'pos',name:'Magnanimous POS',mode:'white-label-product',status:'product-ready'},
  {id:'invoice',name:'Magnanimous Invoice Maker',mode:'white-label-product',status:'product-ready'}
 ]
};

const PRODUCTS=[
 {id:'ai',name:'Magnanimous AI',category:'intelligence',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'crm',name:'Magnanimous CRM',category:'business',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'voice-center',name:'Magnanimous Voice & Contact Center',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-usage'},
 {id:'virtual-host',name:'Magnanimous Virtual Host',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-usage'},
 {id:'whatsapp-commerce',name:'Magnanimous WhatsApp Commerce',category:'communications',standalone:true,white_label:true,pricing_model:'base-plus-channel-cost'},
 {id:'site-builder',name:'Magnanimous Website Builder',category:'builder',standalone:true,white_label:true,pricing_model:'plan'},
 {id:'app-builder',name:'Magnanimous App Builder',category:'builder',standalone:true,white_label:true,pricing_model:'plan-plus-publishing-costs'},
 {id:'pos',name:'Magnanimous POS',category:'commerce',standalone:true,white_label:true,pricing_model:'plan-plus-payment-processing'},
 {id:'invoice',name:'Magnanimous Invoice Maker',category:'commerce',standalone:true,white_label:true,pricing_model:'plan'}
];

const ADAPTERS=[
 {id:'replit',class:'builder',role:'temporary execution accelerator',native_target:'app-builder',portable:['requirements decomposition','build-test-revise workflow','preview verification','deployment handoff']},
 {id:'close',class:'crm',role:'temporary CRM/communications accelerator',native_target:'crm',portable:['lead lifecycle','activity timeline','communications logging','saved views','voice-agent outcome metrics']},
 {id:'heygen',class:'avatar-video',role:'temporary avatar/video execution adapter',native_target:'virtual-host',portable:['persona configuration','avatar session workflow','voice-video synchronization','render verification']},
 {id:'livekit',class:'realtime-media',role:'open infrastructure adapter or self-hosted substrate',native_target:'voice-center',portable:['WebRTC rooms','turn handling','interruptions','multi-agent handoff','SIP telephony','MCP tool bridging']},
 {id:'meta-whatsapp',class:'messaging-transport',role:'official channel transport',native_target:'whatsapp-commerce',portable:['webhook ingestion','conversation routing','CRM logging','commerce response workflow']}
];

const STRESS_DIMENSIONS=['happy-path','multi-turn','tool-selection','tool-arguments','handoff','memory-context','invalid-input','tool-failure','timeout','partial-result','grounding','contradiction','misuse-resistance','recovery','concurrency','provider-loss','native-parity'];

const NATIVE_RECIPES=[
 {skill_key:'crm.lead-contact-opportunity-model',name:'Lead Contact Opportunity Relationship Model',capability_class:'crm',recipe:{objects:['lead','contact','opportunity'],rules:['contacts belong to leads','opportunities belong to leads','lead persists pre-sale and post-sale'],supports:['B2B multi-contact','B2C single-contact']},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.stage-driven-sales-process',name:'Stage Driven Sales Process',capability_class:'crm',recipe:{lead_statuses:true,opportunity_statuses:true,pipelines:true,conversion_tracking:true,cycle_time_tracking:true,bottleneck_detection:true},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.omnichannel-workflow-engine',name:'Omnichannel Workflow Engine',capability_class:'automation',recipe:{channels:['email','sms','call','task'],triggers:['status-change','field-change','manual-enrollment'],features:['delays','templates','personalization','stop-conditions','task-generation']},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.dynamic-smart-views',name:'Dynamic Smart Views',capability_class:'crm',recipe:{dynamic_filters:true,actionable_segments:true,use_cases:['dialing','emailing','reporting','consent-filtering','rep-queues']},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.custom-data-model',name:'Extensible CRM Data Model',capability_class:'crm',recipe:{custom_fields:['lead','contact','opportunity','activity'],custom_objects:true,field_operations:['create','rename','merge','remove','type-change']},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.activity-timeline',name:'Unified Activity Timeline',capability_class:'crm',recipe:{activities:['email','sms','call','task','whatsapp','custom'],goal:'single chronological customer context',handoff_ready:true},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.performance-feedback-loop',name:'CRM Performance Feedback Loop',capability_class:'analytics',recipe:{reports:['activity','opportunity-funnel','calls'],signals:['stage-conversion-drop','deal-cycle-growth','repeated-team-friction'],action:'revise process and retest'},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.communication-consent-guard',name:'Communication Consent Guard',capability_class:'safety',recipe:{track:['consent-status','consent-date','consent-method','timezone'],filter_before_outreach:true,exclude_nonconsented:true,channel_rules:true},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.import-migration-safety',name:'CRM Import and Migration Safety',capability_class:'data',recipe:{sample_migration_first:true,single_import_coordinator:true,mapping_validation:true,deduplication:true,rollback_plan:true,source_limitations_recorded:true},evidence:'documented-public-product-pattern'},
 {skill_key:'crm.lead-context-summary',name:'Lead Context Summary',capability_class:'intelligence',recipe:{inputs:['lead-data','contacts','opportunities','activity-history','tasks'],outputs:['current-status','history-summary','next-action','handoff-context'],private_reasoning:true},evidence:'documented-public-product-pattern'}
];

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sovereign_product_settings(tenant_id TEXT NOT NULL, product_id TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,white_label INTEGER NOT NULL DEFAULT 0, brand_name TEXT NOT NULL DEFAULT '', custom_domain TEXT NOT NULL DEFAULT '',config_json TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,product_id))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sovereign_reasoning_evaluations(id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,task_class TEXT NOT NULL DEFAULT 'general', score REAL NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_skill_registry(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,skill_key TEXT NOT NULL,name TEXT NOT NULL,capability_class TEXT NOT NULL DEFAULT 'general',source_kind TEXT NOT NULL DEFAULT 'observed-workflow',source_adapter TEXT NOT NULL DEFAULT '',recipe_json TEXT NOT NULL DEFAULT '{}',evidence_json TEXT NOT NULL DEFAULT '{}',quality_score REAL NOT NULL DEFAULT 0,verified INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'candidate',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,skill_key))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_adapter_evaluations(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,adapter_id TEXT NOT NULL,capability TEXT NOT NULL DEFAULT '',dimension TEXT NOT NULL DEFAULT 'happy-path',scenario TEXT NOT NULL DEFAULT '',result_json TEXT NOT NULL DEFAULT '{}',score REAL NOT NULL DEFAULT 0,passed INTEGER NOT NULL DEFAULT 0,native_parity INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`).run();
}

function publicArchitecture(){
 return {
  ...MAGNANIMOUS_SOVEREIGN_STACK,
  execution_provider_details_private:true,
  products:PRODUCTS,
  skill_foundry:{
   policy:'learn portable capability patterns, workflows, schemas, evaluations and verified recipes; do not ingest proprietary hidden prompts, model weights, credentials or protected implementation',
   lifecycle:['inventory','exercise','observe','abstract','reimplement','stress-test','verify','promote','monitor','improve'],
   stress_dimensions:STRESS_DIMENSIONS,
   adapter_count:ADAPTERS.length,
   native_recipe_count:NATIVE_RECIPES.length
  }
 };
}

async function settings(env,user){
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT product_id,enabled,white_label,brand_name,custom_domain,config_json,updated_at FROM sovereign_product_settings WHERE tenant_id=?').bind(user.tenant_id).all();
 return results.map(x=>({...x,enabled:!!x.enabled,white_label:!!x.white_label,config:(()=>{try{return JSON.parse(x.config_json||'{}')}catch{return{}}})()}));
}

async function saveProduct(request,env,user){
 await ensureSchema(env);
 const body=await request.json().catch(()=>({}));
 const id=String(body.product_id||'').trim();
 if(!PRODUCTS.some(x=>x.id===id))return json({detail:'Unknown Magnanimous product.'},400);
 const ts=now(),brand=String(body.brand_name||'').trim().slice(0,120),domain=String(body.custom_domain||'').trim().slice(0,255),config=JSON.stringify(body.config&&typeof body.config==='object'?body.config:{}).slice(0,12000);
 await env.DB.prepare(`INSERT INTO sovereign_product_settings(tenant_id,product_id,enabled,white_label,brand_name,custom_domain,config_json,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,product_id) DO UPDATE SET enabled=excluded.enabled,white_label=excluded.white_label,brand_name=excluded.brand_name,custom_domain=excluded.custom_domain,config_json=excluded.config_json,updated_at=excluded.updated_at`).bind(user.tenant_id,id,body.enabled===false?0:1,body.white_label?1:0,brand,domain,config,ts).run();
 return json({ok:true,product_id:id,enabled:body.enabled!==false,white_label:!!body.white_label,brand_name:brand,custom_domain:domain});
}

async function evaluateReasoning(request,env,user){
 await ensureSchema(env);
 const body=await request.json().catch(()=>({}));
 const score=Math.max(0,Math.min(1,Number(body.score||0))),verified=body.verified?1:0;
 await env.DB.prepare('INSERT INTO sovereign_reasoning_evaluations(tenant_id,user_id,task_class,score,verified,notes,created_at) VALUES(?,?,?,?,?,?,?)').bind(user.tenant_id,user.id,String(body.task_class||'general').slice(0,80),score,verified,String(body.notes||'').slice(0,2000),now()).run();
 return json({ok:true,score,verified:!!verified,learning_target:'Magnanimous reasoning policy and routing'});
}

async function skills(env,user){
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare('SELECT skill_key,name,capability_class,source_kind,source_adapter,recipe_json,evidence_json,quality_score,verified,status,updated_at FROM magnanimous_skill_registry WHERE tenant_id=? ORDER BY verified DESC,quality_score DESC,updated_at DESC LIMIT 250').bind(user.tenant_id).all();
 return results.map(x=>({...x,verified:!!x.verified,recipe:(()=>{try{return JSON.parse(x.recipe_json)}catch{return{}}})(),evidence:(()=>{try{return JSON.parse(x.evidence_json)}catch{return{}}})()}));
}

async function learnSkill(request,env,user){
 await ensureSchema(env);
 const b=await request.json().catch(()=>({}));
 const key=String(b.skill_key||'').trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(0,120);
 const name=String(b.name||'').trim().slice(0,160);
 if(!key||!name)return json({detail:'skill_key and name are required.'},400);
 const source=String(b.source_adapter||'').trim().slice(0,80);
 const recipe=b.recipe&&typeof b.recipe==='object'?b.recipe:{};
 const evidence=b.evidence&&typeof b.evidence==='object'?b.evidence:{};
 const forbidden=JSON.stringify({recipe,evidence}).match(/api[_ -]?key|password|secret[_ -]?key|private[_ -]?prompt|model[_ -]?weights/i);
 if(forbidden)return json({detail:'Protected credentials, hidden prompts, secrets, or model-weight material cannot be assimilated.'},400);
 const score=Math.max(0,Math.min(1,Number(b.quality_score||0)));
 const verified=!!b.verified&&score>=0.8;
 const status=verified?'verified':'candidate';
 const ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_skill_registry(tenant_id,skill_key,name,capability_class,source_kind,source_adapter,recipe_json,evidence_json,quality_score,verified,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,skill_key) DO UPDATE SET name=excluded.name,capability_class=excluded.capability_class,source_kind=excluded.source_kind,source_adapter=excluded.source_adapter,recipe_json=excluded.recipe_json,evidence_json=excluded.evidence_json,quality_score=excluded.quality_score,verified=excluded.verified,status=excluded.status,updated_at=excluded.updated_at`).bind(user.tenant_id,key,name,String(b.capability_class||'general').slice(0,80),String(b.source_kind||'observed-workflow').slice(0,80),source,JSON.stringify(recipe).slice(0,16000),JSON.stringify(evidence).slice(0,16000),score,verified?1:0,status,ts,ts).run();
 return json({ok:true,skill_key:key,status,verified,principle:'Magnanimous learned a portable recipe/pattern, not proprietary provider internals.'});
}

async function seedNativeRecipes(env,user){
 await ensureSchema(env);
 const ts=now();
 for(const s of NATIVE_RECIPES){
  await env.DB.prepare(`INSERT INTO magnanimous_skill_registry(tenant_id,skill_key,name,capability_class,source_kind,source_adapter,recipe_json,evidence_json,quality_score,verified,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,skill_key) DO UPDATE SET name=excluded.name,capability_class=excluded.capability_class,source_kind=excluded.source_kind,source_adapter=excluded.source_adapter,recipe_json=excluded.recipe_json,evidence_json=excluded.evidence_json,quality_score=MAX(quality_score,excluded.quality_score),verified=MAX(verified,excluded.verified),status='verified',updated_at=excluded.updated_at`).bind(user.tenant_id,s.skill_key,s.name,s.capability_class,'lawful-public-pattern','close',JSON.stringify(s.recipe),JSON.stringify({basis:s.evidence,implementation_owner:'Magnanimous AI'}),0.9,1,'verified',ts,ts).run();
 }
 return NATIVE_RECIPES.length;
}

async function recordEvaluation(request,env,user){
 await ensureSchema(env);
 const b=await request.json().catch(()=>({}));
 const adapter=String(b.adapter_id||'').trim().slice(0,80);
 if(!ADAPTERS.some(x=>x.id===adapter))return json({detail:'Unknown adapter.'},400);
 const dimension=String(b.dimension||'happy-path').trim();
 if(!STRESS_DIMENSIONS.includes(dimension))return json({detail:'Unknown stress-test dimension.',allowed:STRESS_DIMENSIONS},400);
 const score=Math.max(0,Math.min(1,Number(b.score||0)));
 const passed=!!b.passed;
 const parity=!!b.native_parity;
 const result=b.result&&typeof b.result==='object'?b.result:{};
 await env.DB.prepare('INSERT INTO magnanimous_adapter_evaluations(tenant_id,user_id,adapter_id,capability,dimension,scenario,result_json,score,passed,native_parity,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(user.tenant_id,user.id,adapter,String(b.capability||'').slice(0,120),dimension,String(b.scenario||'').slice(0,3000),JSON.stringify(result).slice(0,16000),score,passed?1:0,parity?1:0,now()).run();
 return json({ok:true,adapter_id:adapter,dimension,score,passed,native_parity:parity,next:passed&&!parity?'reimplement-and-run-native-parity':passed&&parity?'candidate-for-promotion':'repair-and-retest'});
}

async function evaluationReport(env,user){
 await ensureSchema(env);
 const {results=[]}=await env.DB.prepare(`SELECT adapter_id,COUNT(*) tests,SUM(passed) passed,SUM(native_parity) parity,AVG(score) avg_score,MAX(created_at) last_test FROM magnanimous_adapter_evaluations WHERE tenant_id=? GROUP BY adapter_id ORDER BY adapter_id`).bind(user.tenant_id).all();
 return results.map(x=>({...x,avg_score:Number(x.avg_score||0)}));
}

export async function handleMagnanimousSovereign(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/sovereign'))return null;
 if(path==='/api/magnanimous/sovereign/architecture'&&request.method==='GET')return json(publicArchitecture());
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 if(path==='/api/magnanimous/sovereign/products'&&request.method==='GET')return json({products:PRODUCTS,settings:await settings(env,user),provider_details_private:true});
 if(path==='/api/magnanimous/sovereign/products'&&request.method==='POST')return saveProduct(request,env,user);
 if(path==='/api/magnanimous/sovereign/reasoning/evaluate'&&request.method==='POST')return evaluateReasoning(request,env,user);
 if(path==='/api/magnanimous/sovereign/adapters'&&request.method==='GET')return json({adapters:ADAPTERS.map(({id,class:capability_class,role,native_target,portable})=>({id,capability_class,role,native_target,portable})),stress_dimensions:STRESS_DIMENSIONS,rule:'Adapters are replaceable and never own Magnanimous identity or memory.'});
 if(path==='/api/magnanimous/sovereign/skills'&&request.method==='GET')return json({skills:await skills(env,user)});
 if(path==='/api/magnanimous/sovereign/skills/learn'&&request.method==='POST')return learnSkill(request,env,user);
 if(path==='/api/magnanimous/sovereign/skills/seed-native'&&request.method==='POST')return json({ok:true,seeded:await seedNativeRecipes(env,user),owner:'Magnanimous AI'});
 if(path==='/api/magnanimous/sovereign/evaluations'&&request.method==='POST')return recordEvaluation(request,env,user);
 if(path==='/api/magnanimous/sovereign/evaluations/report'&&request.method==='GET')return json({report:await evaluationReport(env,user),promotion_rule:'Do not promote a learned skill until verified evidence shows native parity on required scenarios.'});
 return json({detail:'Sovereign capability route not found.'},404);
}
