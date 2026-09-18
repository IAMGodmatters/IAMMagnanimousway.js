import { currentUser } from './integrations.js';
import { handleAdvancedCrm, ADVANCED_CRM_CAPABILITIES } from './crm-advanced-runtime.js';
import { handleWorkforceOps, WORKFORCE_CAPABILITIES } from './magnanimous-workforce-ops.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const text=(v,n=12000)=>String(v??'').trim().slice(0,n);
const parse=(v,fallback={})=>{try{return JSON.parse(String(v??''))}catch{return fallback}};
const id=()=>crypto.randomUUID();
const tenant=(user)=>String(user?.tenant_id||'');

export const NATIVE_OPERATIONS_CAPABILITIES=[
 {id:'workspaces',name:'Workspaces & teams',native:true},
 {id:'boards',name:'Boards, lists & custom objects',native:true},
 {id:'records',name:'Tasks, records, subitems & ownership',native:true},
 {id:'custom-fields',name:'Custom fields & configurable attributes',native:true},
 {id:'relationships',name:'Linked records & bidirectional relationships',native:true},
 {id:'views',name:'Table, Kanban, calendar, timeline & saved views',native:true},
 {id:'forms',name:'Intake forms backed by board records',native:true},
 {id:'dashboards',name:'Dashboards & report definitions',native:true},
 {id:'automations',name:'Trigger / condition / action automations',native:true},
 {id:'crm',name:'People, companies, deals & pipelines',native:true},
 {id:'activity',name:'Notes, tasks, comments & activity history',native:true},
 {id:'sequences',name:'Outreach sequence definitions & follow-up steps',native:true},
 {id:'email-calendar',name:'Email/calendar connection hooks',native:true,bridge:'existing integrations + business email'},
 {id:'call-intelligence',name:'Call history & intelligence hooks',native:true,bridge:'existing contact center'},
 {id:'ai-attributes',name:'AI research, summaries & structured extraction hooks',native:true,bridge:'Magnanimous brain + knowledge'},
 {id:'imports-exports',name:'Structured import/export-ready record model',native:true},
 {id:'permissions',name:'Workspace permission policy storage',native:true},
 {id:'lead-scoring',name:'Lead fit & engagement scoring',native:true},
 {id:'revenue-intelligence',name:'Weighted forecast, stale-deal & risk signals',native:true},
 {id:'next-best-action',name:'Next-best-action priority queue',native:true,bridge:'Magnanimous AI + work engine'},
 {id:'data-hygiene',name:'Duplicate & incomplete-data health signals',native:true},
 {id:'source-attribution',name:'Lead-source attribution & source mix',native:true},
 {id:'omnichannel',name:'Unified email, SMS, voice, chat & inbox handoff',native:true,bridge:'Unified Inbox + business email + contact center'},
 {id:'consent-safety',name:'Consent-aware outreach & communication safety hooks',native:true,bridge:'Contact center permission gates + assistant policy'},
 {id:'account-graph',name:'Companies/accounts with person and deal rollups',native:true},
 {id:'multi-pipeline',name:'Multiple configurable sales pipelines and stage probabilities',native:true},
 {id:'configurable-scoring',name:'Configurable fit, engagement & combined scoring profiles',native:true},
 {id:'sequence-engine',name:'Consent-aware multi-touch sequences with reply stop goals',native:true,bridge:'CRM tasks + Unified Inbox'},
 ...ADVANCED_CRM_CAPABILITIES.map(x=>({...x,native:true})),
 ...WORKFORCE_CAPABILITIES.map(x=>({...x,native:true})),
];

async function ensureSchema(env){
 if(!env?.DB)throw new Error('Database unavailable.');
 const stmts=[
 `CREATE TABLE IF NOT EXISTS crm_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'lead',source TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_activities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',due_at INTEGER,completed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER,name TEXT NOT NULL,stage TEXT NOT NULL DEFAULT 'new',value REAL NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,expected_close_at INTEGER,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_contact_preferences (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,contact_id INTEGER NOT NULL,email_status TEXT NOT NULL DEFAULT 'unknown',sms_status TEXT NOT NULL DEFAULT 'unknown',phone_status TEXT NOT NULL DEFAULT 'unknown',whatsapp_status TEXT NOT NULL DEFAULT 'unknown',do_not_contact INTEGER NOT NULL DEFAULT 0,lawful_basis TEXT NOT NULL DEFAULT '',consent_source TEXT NOT NULL DEFAULT '',consent_note TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL,UNIQUE(tenant_id,contact_id))`,
 `CREATE TABLE IF NOT EXISTS crm_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,name TEXT NOT NULL,domain TEXT NOT NULL DEFAULT '',industry TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'prospect',owner_user_id TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_pipelines (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',is_default INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_pipeline_stages (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,pipeline_id TEXT NOT NULL,name TEXT NOT NULL,stage_key TEXT NOT NULL,position INTEGER NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,kind TEXT NOT NULL DEFAULT 'open',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(pipeline_id,stage_key))`,
 `CREATE TABLE IF NOT EXISTS crm_scoring_profiles (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,score_type TEXT NOT NULL DEFAULT 'combined',enabled INTEGER NOT NULL DEFAULT 1,rules_json TEXT NOT NULL DEFAULT '[]',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,sequence_id TEXT NOT NULL,contact_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active',next_due_at INTEGER,goal TEXT NOT NULL DEFAULT 'reply',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_sequence_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,enrollment_id TEXT NOT NULL,sequence_id TEXT NOT NULL,contact_id INTEGER NOT NULL,step_index INTEGER NOT NULL DEFAULT 0,event_type TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'scheduled',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_workspaces(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,owner_user_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'workspace',description TEXT NOT NULL DEFAULT '',settings_json TEXT NOT NULL DEFAULT '{}',permissions_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_boards(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,workspace_id TEXT NOT NULL,name TEXT NOT NULL,singular_name TEXT NOT NULL DEFAULT 'record',kind TEXT NOT NULL DEFAULT 'board',description TEXT NOT NULL DEFAULT '',icon TEXT NOT NULL DEFAULT '',settings_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_fields(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,board_id TEXT NOT NULL,name TEXT NOT NULL,field_key TEXT NOT NULL,field_type TEXT NOT NULL DEFAULT 'text',required INTEGER NOT NULL DEFAULT 0,position INTEGER NOT NULL DEFAULT 0,config_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(board_id,field_key))`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_records(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,board_id TEXT NOT NULL,title TEXT NOT NULL,status TEXT NOT NULL DEFAULT '',owner_user_id TEXT NOT NULL DEFAULT '',group_key TEXT NOT NULL DEFAULT '',parent_id TEXT,due_at INTEGER,sort_order REAL NOT NULL DEFAULT 0,data_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_links(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,from_record_id TEXT NOT NULL,to_record_id TEXT NOT NULL,relation_type TEXT NOT NULL DEFAULT 'related',metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,UNIQUE(tenant_id,from_record_id,to_record_id,relation_type))`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_views(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,board_id TEXT NOT NULL,name TEXT NOT NULL,view_type TEXT NOT NULL DEFAULT 'table',config_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_automations(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,workspace_id TEXT NOT NULL,board_id TEXT,name TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,trigger_json TEXT NOT NULL DEFAULT '{}',conditions_json TEXT NOT NULL DEFAULT '[]',actions_json TEXT NOT NULL DEFAULT '[]',run_count INTEGER NOT NULL DEFAULT 0,last_run_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_sequences(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,workspace_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',audience_json TEXT NOT NULL DEFAULT '{}',steps_json TEXT NOT NULL DEFAULT '[]',settings_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS magnanimous_ops_activity(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,workspace_id TEXT NOT NULL DEFAULT '',board_id TEXT NOT NULL DEFAULT '',record_id TEXT NOT NULL DEFAULT '',action TEXT NOT NULL,detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`
 ];
 for(const s of stmts)await env.DB.prepare(s).run();
 for(const table of ['crm_contacts','crm_activities','crm_opportunities']){try{await env.DB.prepare('ALTER TABLE '+table+' ADD COLUMN tenant_id TEXT').run()}catch{}}
 for(const sql of [
  'ALTER TABLE crm_contacts ADD COLUMN account_id INTEGER',
  'ALTER TABLE crm_opportunities ADD COLUMN account_id INTEGER',
  'ALTER TABLE crm_opportunities ADD COLUMN pipeline_id TEXT',
  'ALTER TABLE crm_opportunities ADD COLUMN stage_id TEXT',
  'ALTER TABLE crm_activities ADD COLUMN sequence_enrollment_id TEXT',
  'ALTER TABLE crm_activities ADD COLUMN sequence_step_index INTEGER'
 ]){try{await env.DB.prepare(sql).run()}catch{}}
 for(const sql of [
  'CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_status ON crm_contacts(tenant_id,status)',
  'CREATE INDEX IF NOT EXISTS idx_crm_opportunities_tenant_stage ON crm_opportunities(tenant_id,stage)',
  'CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant_due ON crm_activities(tenant_id,due_at,completed)',
  'CREATE INDEX IF NOT EXISTS idx_crm_preferences_contact ON crm_contact_preferences(tenant_id,contact_id)',
  'CREATE INDEX IF NOT EXISTS idx_crm_accounts_tenant_name ON crm_accounts(tenant_id,name)',
  'CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON crm_contacts(tenant_id,account_id)',
  'CREATE INDEX IF NOT EXISTS idx_crm_opportunities_account ON crm_opportunities(tenant_id,account_id)',
  'CREATE INDEX IF NOT EXISTS idx_crm_opportunities_pipeline ON crm_opportunities(tenant_id,pipeline_id,stage_id)',
  'CREATE INDEX IF NOT EXISTS idx_crm_pipelines_tenant ON crm_pipelines(tenant_id,active,is_default)',
  'CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_pipeline ON crm_pipeline_stages(tenant_id,pipeline_id,position)',
  'CREATE INDEX IF NOT EXISTS idx_crm_scoring_profiles_tenant ON crm_scoring_profiles(tenant_id,enabled)',
  'CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_contact ON crm_sequence_enrollments(tenant_id,contact_id,status)',
  'CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_sequence ON crm_sequence_enrollments(tenant_id,sequence_id,status)',
  'CREATE INDEX IF NOT EXISTS idx_crm_sequence_events_enrollment ON crm_sequence_events(tenant_id,enrollment_id,id)'
 ]){try{await env.DB.prepare(sql).run()}catch{}}
 try{
  const tenantRows=await env.DB.prepare("SELECT DISTINCT tenant_id FROM crm_contacts WHERE tenant_id IS NOT NULL AND tenant_id<>'' UNION SELECT DISTINCT tenant_id FROM crm_opportunities WHERE tenant_id IS NOT NULL AND tenant_id<>''").all();
  for(const row of tenantRows.results||[])await ensureDefaultCrmPipeline(env,String(row.tenant_id||''));
 }catch{}
}

async function log(env,user,action,{workspace_id='',board_id='',record_id='',detail={}}={}){
 try{await env.DB.prepare('INSERT INTO magnanimous_ops_activity(tenant_id,user_id,workspace_id,board_id,record_id,action,detail_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(tenant(user),String(user.id||''),text(workspace_id,80),text(board_id,80),text(record_id,80),text(action,120),JSON.stringify(detail||{}).slice(0,16000),now()).run()}catch{}
}

const mapWorkspace=r=>r&&({...r,settings:parse(r.settings_json,{}),permissions:parse(r.permissions_json,{})});
const mapBoard=r=>r&&({...r,settings:parse(r.settings_json,{})});
const mapField=r=>r&&({...r,required:Boolean(r.required),config:parse(r.config_json,{})});
const mapRecord=r=>r&&({...r,data:parse(r.data_json,{})});
const mapView=r=>r&&({...r,config:parse(r.config_json,{})});
const mapAutomation=r=>r&&({...r,enabled:Boolean(r.enabled),trigger:parse(r.trigger_json,{}),conditions:parse(r.conditions_json,[]),actions:parse(r.actions_json,[])});
const mapSequence=r=>r&&({...r,audience:parse(r.audience_json,{}),steps:parse(r.steps_json,[]),settings:parse(r.settings_json,{})});

async function ownedWorkspace(env,t,wid){return env.DB.prepare('SELECT * FROM magnanimous_ops_workspaces WHERE tenant_id=? AND id=?').bind(t,wid).first()}
async function ownedBoard(env,t,bid){return env.DB.prepare('SELECT * FROM magnanimous_ops_boards WHERE tenant_id=? AND id=?').bind(t,bid).first()}
async function ownedRecord(env,t,rid){return env.DB.prepare('SELECT * FROM magnanimous_ops_records WHERE tenant_id=? AND id=?').bind(t,rid).first()}

async function summary(env,t){
 const count=async(table)=>Number((await env.DB.prepare(`SELECT COUNT(*) n FROM ${table} WHERE tenant_id=?`).bind(t).first())?.n||0);
 const [workspaces,boards,records,automations,sequences]=await Promise.all([count('magnanimous_ops_workspaces'),count('magnanimous_ops_boards'),count('magnanimous_ops_records'),count('magnanimous_ops_automations'),count('magnanimous_ops_sequences')]);
 let crm={contacts:0,deals:0,pipeline_value:0};
 try{crm.contacts=Number((await env.DB.prepare('SELECT COUNT(*) n FROM crm_contacts WHERE tenant_id=?').bind(t).first())?.n||0)}catch{}
 try{const r=await env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(o.value),0) value FROM crm_opportunities o LEFT JOIN crm_pipeline_stages ps ON ps.id=o.stage_id AND ps.tenant_id=o.tenant_id WHERE o.tenant_id=? AND COALESCE(ps.kind,CASE WHEN lower(o.stage) IN ('won','lost','closed') THEN 'closed' ELSE 'open' END)='open'").bind(t).first();crm.deals=Number(r?.n||0);crm.pipeline_value=Number(r?.value||0)}catch{}
 return{workspaces,boards,records,automations,sequences,crm,capabilities:NATIVE_OPERATIONS_CAPABILITIES.length};
}

function matchesCondition(record,c){
 const left=c?.field==='status'?record.status:c?.field==='title'?record.title:record.data?.[String(c?.field||'')];
 const right=c?.value;switch(String(c?.operator||'equals')){case'not_equals':return String(left??'')!==String(right??'');case'contains':return String(left??'').toLowerCase().includes(String(right??'').toLowerCase());case'exists':return left!==undefined&&left!==null&&String(left)!=='';case'gt':return Number(left)>Number(right);case'lt':return Number(left)<Number(right);default:return String(left??'')===String(right??'')}
}

async function applyAction(env,user,automation,record,a){
 const t=tenant(user),ts=now(),type=String(a?.type||'');
 if(type==='set_field'){
  if(!record)return;const key=text(a.field,120),value=a.value;if(key==='status')await env.DB.prepare('UPDATE magnanimous_ops_records SET status=?,updated_at=? WHERE tenant_id=? AND id=?').bind(text(value,120),ts,t,record.id).run();else{const data={...(record.data||{}),[key]:value};await env.DB.prepare('UPDATE magnanimous_ops_records SET data_json=?,updated_at=? WHERE tenant_id=? AND id=?').bind(JSON.stringify(data).slice(0,60000),ts,t,record.id).run();}
 }else if(type==='create_record'){
  const bid=text(a.board_id||automation.board_id,80);if(!bid||!await ownedBoard(env,t,bid))return;const rid=id();await env.DB.prepare('INSERT INTO magnanimous_ops_records(id,tenant_id,board_id,title,status,owner_user_id,group_key,parent_id,due_at,sort_order,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(rid,t,bid,text(a.title||'Automated record',240),text(a.status||'',80),text(a.owner_user_id||'',120),text(a.group_key||'',120),null,a.due_at?Number(a.due_at):null,0,JSON.stringify(a.data||{}).slice(0,60000),ts,ts).run();
 }else if(type==='activity'){
  await log(env,user,text(a.action||automation.name||'automation',120),{workspace_id:automation.workspace_id,board_id:automation.board_id||'',record_id:record?.id||'',detail:{automation_id:automation.id,message:text(a.message,2000)}});
 }else if(type==='create_work_item'){
  try{const wid=id();await env.DB.prepare('INSERT INTO magnanimous_work_items(tenant_id,user_id,title,goal,status,stage,specialist_id,progress,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(t,String(user.id||''),text(a.title||record?.title||automation.name,220),text(a.goal||'',8000),'planned','understand','',0,JSON.stringify({source:'native-operations',automation_id:automation.id,record_id:record?.id||''}),ts,ts).run()}catch{}
 }
}

async function emitEvent(env,user,body){
 const t=tenant(user),event=text(body.event,120);if(!event)return{matched:0,ran:0};
 const recordId=text(body.record_id,80),recordRaw=recordId?await ownedRecord(env,t,recordId):null,record=mapRecord(recordRaw);
 const boardId=text(body.board_id||record?.board_id,80),workspaceId=text(body.workspace_id,80);
 let sql='SELECT * FROM magnanimous_ops_automations WHERE tenant_id=? AND enabled=1';const args=[t];if(boardId){sql+=' AND (board_id=? OR board_id IS NULL)';args.push(boardId)}if(workspaceId){sql+=' AND workspace_id=?';args.push(workspaceId)}
 const{results=[]}=await env.DB.prepare(sql).bind(...args).all();let matched=0,ran=0;
 for(const raw of results){const a=mapAutomation(raw);if(String(a.trigger?.event||'')!==event)continue;matched++;if(record&&a.conditions.some(c=>!matchesCondition(record,c)))continue;for(const action of a.actions)await applyAction(env,user,a,record,action);await env.DB.prepare('UPDATE magnanimous_ops_automations SET run_count=run_count+1,last_run_at=?,updated_at=? WHERE id=? AND tenant_id=?').bind(now(),now(),a.id,t).run();ran++;}
 return{matched,ran};
}

async function seedCrmWorkspace(env,user){
 const t=tenant(user),ts=now();let ws=await env.DB.prepare("SELECT * FROM magnanimous_ops_workspaces WHERE tenant_id=? AND kind='crm' ORDER BY created_at LIMIT 1").bind(t).first();
 if(!ws){const wid=id();await env.DB.prepare('INSERT INTO magnanimous_ops_workspaces(id,tenant_id,owner_user_id,name,kind,description,settings_json,permissions_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(wid,t,String(user.id||''),'Magnanimous CRM','crm','Native relationship, sales and follow-up workspace','{}','{}',ts,ts).run();ws=await ownedWorkspace(env,t,wid)}
 const specs=[['People','person'],['Companies','company'],['Deals','deal']];for(const[name,kind]of specs){const exists=await env.DB.prepare('SELECT id FROM magnanimous_ops_boards WHERE tenant_id=? AND workspace_id=? AND kind=? LIMIT 1').bind(t,ws.id,kind).first();if(!exists){const bid=id();await env.DB.prepare('INSERT INTO magnanimous_ops_boards(id,tenant_id,workspace_id,name,singular_name,kind,description,icon,settings_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(bid,t,ws.id,name,kind,kind,`Native ${name.toLowerCase()} object`,'','{}',ts,ts).run();}}
 return mapWorkspace(ws);
}



const CRM_DEFAULT_PIPELINE_STAGES=[
 ['new','New',10,'open'],['qualified','Qualified',25,'open'],['discovery','Discovery',35,'open'],['demo','Demo',45,'open'],
 ['proposal','Proposal',55,'open'],['negotiation','Negotiation',75,'open'],['contract','Contract',85,'open'],['won','Won',100,'won'],['lost','Lost',0,'lost']
];
async function ensureDefaultCrmPipeline(env,t){
 if(!t)return null;
 let pipeline=await env.DB.prepare("SELECT * FROM crm_pipelines WHERE tenant_id=? AND is_default=1 AND active=1 ORDER BY created_at LIMIT 1").bind(t).first();
 if(!pipeline){const pid=id(),ts=now();await env.DB.prepare('INSERT INTO crm_pipelines(id,tenant_id,name,description,is_default,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(pid,t,'Main Sales Pipeline','Default Magnanimous sales process',1,1,ts,ts).run();pipeline=await env.DB.prepare('SELECT * FROM crm_pipelines WHERE tenant_id=? AND id=?').bind(t,pid).first()}
 const count=Number((await env.DB.prepare('SELECT COUNT(*) n FROM crm_pipeline_stages WHERE tenant_id=? AND pipeline_id=?').bind(t,pipeline.id).first())?.n||0);
 if(!count){let position=0;for(const [key,name,probability,kind] of CRM_DEFAULT_PIPELINE_STAGES){position++;const sid=id(),ts=now();await env.DB.prepare('INSERT INTO crm_pipeline_stages(id,tenant_id,pipeline_id,name,stage_key,position,probability,kind,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(sid,t,pipeline.id,name,key,position,probability,kind,1,ts,ts).run()}}
 return pipeline;
}
async function crmPipelines(env,t){
 await ensureDefaultCrmPipeline(env,t);
 const{results:pipes=[]}=await env.DB.prepare('SELECT * FROM crm_pipelines WHERE tenant_id=? AND active=1 ORDER BY is_default DESC,created_at').bind(t).all();
 const{results:stages=[]}=await env.DB.prepare('SELECT * FROM crm_pipeline_stages WHERE tenant_id=? AND active=1 ORDER BY pipeline_id,position').bind(t).all();
 return pipes.map(p=>({...p,is_default:Boolean(p.is_default),active:Boolean(p.active),stages:stages.filter(s=>s.pipeline_id===p.id).map(s=>({...s,probability:Number(s.probability||0),position:Number(s.position||0),active:Boolean(s.active)}))}));
}
async function crmPipelineStage(env,t,pipelineId,stageKey){
 const pipeline=pipelineId?await env.DB.prepare('SELECT * FROM crm_pipelines WHERE tenant_id=? AND id=? AND active=1').bind(t,pipelineId).first():await ensureDefaultCrmPipeline(env,t);
 if(!pipeline)return null;
 let stage=null;
 if(stageKey)stage=await env.DB.prepare('SELECT * FROM crm_pipeline_stages WHERE tenant_id=? AND pipeline_id=? AND stage_key=? AND active=1').bind(t,pipeline.id,crmStage(stageKey)).first();
 if(!stage)stage=await env.DB.prepare("SELECT * FROM crm_pipeline_stages WHERE tenant_id=? AND pipeline_id=? AND active=1 AND kind='open' ORDER BY position LIMIT 1").bind(t,pipeline.id).first();
 return stage?{pipeline,stage}:null;
}
async function crmOwnedAccount(env,t,accountId){return env.DB.prepare('SELECT * FROM crm_accounts WHERE tenant_id=? AND id=?').bind(t,Number(accountId)).first()}
async function crmAccounts(env,t){
 const{results=[]}=await env.DB.prepare(`SELECT a.*,
  (SELECT COUNT(*) FROM crm_contacts c WHERE c.tenant_id=a.tenant_id AND c.account_id=a.id) contact_count,
  (SELECT COUNT(*) FROM crm_opportunities o LEFT JOIN crm_pipeline_stages ps ON ps.id=o.stage_id AND ps.tenant_id=o.tenant_id WHERE o.tenant_id=a.tenant_id AND o.account_id=a.id AND COALESCE(ps.kind,CASE WHEN lower(o.stage) IN ('won','lost','closed') THEN 'closed' ELSE 'open' END)='open') open_deals,
  (SELECT COALESCE(SUM(o.value),0) FROM crm_opportunities o LEFT JOIN crm_pipeline_stages ps ON ps.id=o.stage_id AND ps.tenant_id=o.tenant_id WHERE o.tenant_id=a.tenant_id AND o.account_id=a.id AND COALESCE(ps.kind,CASE WHEN lower(o.stage) IN ('won','lost','closed') THEN 'closed' ELSE 'open' END)='open') pipeline_value
  FROM crm_accounts a WHERE a.tenant_id=? ORDER BY a.updated_at DESC LIMIT 300`).bind(t).all();
 return results.map(r=>({...r,tags:parse(r.tags,[]),contact_count:Number(r.contact_count||0),open_deals:Number(r.open_deals||0),pipeline_value:Number(r.pipeline_value||0)}));
}
async function crmScoreProfiles(env,t){
 const{results=[]}=await env.DB.prepare('SELECT * FROM crm_scoring_profiles WHERE tenant_id=? ORDER BY enabled DESC,updated_at DESC').bind(t).all();
 return results.map(r=>({...r,enabled:Boolean(r.enabled),rules:parse(r.rules_json,[])}));
}
async function crmSequenceDefinitions(env,user){
 const workspace=await seedCrmWorkspace(env,user),t=tenant(user);
 const{results=[]}=await env.DB.prepare("SELECT * FROM magnanimous_ops_sequences WHERE tenant_id=? AND workspace_id=? ORDER BY updated_at DESC").bind(t,workspace.id).all();
 const items=results.map(mapSequence);for(const item of items){try{item.active_enrollments=Number((await env.DB.prepare("SELECT COUNT(*) n FROM crm_sequence_enrollments WHERE tenant_id=? AND sequence_id=? AND status='active'").bind(t,item.id).first())?.n||0)}catch{item.active_enrollments=0}}
 return items;
}
async function crmStudio(env,t,user){return{accounts:await crmAccounts(env,t),pipelines:await crmPipelines(env,t),scoring_profiles:await crmScoreProfiles(env,t),sequences:user?await crmSequenceDefinitions(env,user):[]}}

const CRM_STAGE_PROBABILITY={new:10,qualified:25,discovery:35,demo:45,proposal:55,negotiation:75,contract:85,won:100,closed:100,lost:0};
const CRM_CLOSED_STAGES=new Set(['won','lost','closed']);
const crmContactName=(c)=>[c?.first_name,c?.last_name].filter(Boolean).join(' ').trim()||c?.company||('Contact '+String(c?.id||''));
const crmStage=(v)=>text(v||'new',60).toLowerCase().replace(/\s+/g,'-');
function crmProbability(stage,value){
 const n=Number(value);
 if(Number.isFinite(n)&&n>0)return Math.max(0,Math.min(100,n));
 return CRM_STAGE_PROBABILITY[crmStage(stage)]??20;
}
function crmLeadScore(contact,{activityCount=0,dealCount=0,lastActivityAt=0}={}){
 let score=0;const reasons=[];
 const add=(points,reason)=>{score+=points;if(reason)reasons.push(reason)};
 const status=String(contact?.status||'').toLowerCase();
 if(status==='qualified')add(25,'Qualified status');else if(status==='customer')add(35,'Existing customer');else if(status==='lead')add(12,'Active lead');
 if(contact?.email)add(12,'Email available');
 if(contact?.phone)add(12,'Phone available');
 if(contact?.company)add(8,'Company identified');
 if(contact?.source)add(5,'Lead source captured');
 const tags=Array.isArray(contact?.tags)?contact.tags:parse(contact?.tags,[]);
 if(tags.length)add(Math.min(10,tags.length*2),'Profile tags');
 if(activityCount)add(Math.min(12,activityCount*3),'Recorded engagement');
 if(dealCount)add(Math.min(10,dealCount*4),'Open opportunity');
 const ts=Number(lastActivityAt||contact?.updated_at||contact?.created_at||0),age=ts?now()-ts:999999999;
 if(age<=7*86400)add(12,'Recent activity');else if(age<=30*86400)add(6,'Activity in last 30 days');
 return{score:Math.max(0,Math.min(100,Math.round(score))),reasons:reasons.slice(0,5)};
}
function crmRuleMatch(rule,contact,ctx){
 const field=String(rule?.field||''),op=String(rule?.operator||'equals'),expected=rule?.value;
 let actual;
 if(field==='email_present')actual=Boolean(contact?.email);
 else if(field==='phone_present')actual=Boolean(contact?.phone);
 else if(field==='company_present')actual=Boolean(contact?.company||contact?.account_id);
 else if(field==='activity_count')actual=Number(ctx.activityCount||0);
 else if(field==='deal_count')actual=Number(ctx.dealCount||0);
 else if(field==='days_since_activity'){const ts=Number(ctx.lastActivityAt||contact?.updated_at||contact?.created_at||0);actual=ts?Math.floor((now()-ts)/86400):99999}
 else if(field==='tags')actual=Array.isArray(contact?.tags)?contact.tags:parse(contact?.tags,[]);
 else actual=contact?.[field];
 if(op==='exists')return expected===false?!actual:Boolean(actual);
 if(op==='contains')return Array.isArray(actual)?actual.map(String).some(x=>x.toLowerCase().includes(String(expected||'').toLowerCase())):String(actual??'').toLowerCase().includes(String(expected??'').toLowerCase());
 if(op==='not_equals')return String(actual??'').toLowerCase()!==String(expected??'').toLowerCase();
 if(op==='gte')return Number(actual)>=Number(expected);
 if(op==='lte')return Number(actual)<=Number(expected);
 if(op==='gt')return Number(actual)>Number(expected);
 if(op==='lt')return Number(actual)<Number(expected);
 return String(actual??'').toLowerCase()===String(expected??'').toLowerCase();
}
function crmConfiguredScore(contact,ctx,profiles){
 if(!profiles.length)return null;
 const profileScores=[];const reasons=[];
 for(const profile of profiles){
  let score=0;const matched=[];
  for(const rule of profile.rules||[]){if(crmRuleMatch(rule,contact,ctx)){const points=Math.max(-100,Math.min(100,Number(rule.points||0)));score+=points;if(rule.label)matched.push(String(rule.label))}}
  score=Math.max(0,Math.min(100,Math.round(score)));
  profileScores.push({id:profile.id,name:profile.name,type:profile.score_type,score,matched:matched.slice(0,5)});
  for(const label of matched.slice(0,3))if(!reasons.includes(label))reasons.push(label);
 }
 const score=Math.round(profileScores.reduce((s,p)=>s+p.score,0)/Math.max(1,profileScores.length));
 return{score,reasons:reasons.slice(0,5),profiles:profileScores};
}
function crmNormalizeSequenceSteps(steps){
 const allowed=new Set(['email','sms','call','whatsapp','task','wait']);
 return (Array.isArray(steps)?steps:[]).slice(0,25).map((s,index)=>({type:allowed.has(String(s?.type||'').toLowerCase())?String(s.type).toLowerCase():'task',title:text(s?.title||('Step '+(index+1)),180),content:text(s?.content,6000),delay_hours:Math.max(0,Math.min(8760,Number(s?.delay_hours||0)))}));
}
function crmChannelPreference(preferences,type){if(type==='email')return preferences.email_status;if(type==='sms')return preferences.sms_status;if(type==='call')return preferences.phone_status;if(type==='whatsapp')return preferences.whatsapp_status;return'not_applicable'}
async function crmEnrollSequence(env,user,sequenceId,contactId){
 const t=tenant(user),contact=await crmOwnedContact(env,t,contactId);if(!contact)return{error:'CRM contact not found.',status:404};
 const sequence=await env.DB.prepare('SELECT * FROM magnanimous_ops_sequences WHERE tenant_id=? AND id=?').bind(t,sequenceId).first();if(!sequence)return{error:'Sequence not found.',status:404};
 const preferences=await crmPreferences(env,t,contactId);if(preferences.do_not_contact)return{error:'This contact is marked do-not-contact and cannot be enrolled.',status:409};
 const steps=crmNormalizeSequenceSteps(parse(sequence.steps_json,[]));if(!steps.length)return{error:'This sequence has no steps.',status:400};
 const existing=await env.DB.prepare("SELECT id FROM crm_sequence_enrollments WHERE tenant_id=? AND sequence_id=? AND contact_id=? AND status='active'").bind(t,sequenceId,contactId).first();if(existing)return{error:'This contact is already active in this sequence.',status:409};
 const enrollmentId=id(),ts=now();let due=ts,firstDue=null,scheduled=0,needsConsent=0;
 await env.DB.prepare('INSERT INTO crm_sequence_enrollments(id,tenant_id,sequence_id,contact_id,status,next_due_at,goal,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(enrollmentId,t,sequenceId,contactId,'active',null,'reply',JSON.stringify({sequence_name:sequence.name}),ts,ts).run();
 for(let i=0;i<steps.length;i++){
  const step=steps[i];due+=Math.round(step.delay_hours*3600);if(step.type==='wait')continue;
  if(firstDue===null)firstDue=due;
  const channelStatus=crmChannelPreference(preferences,step.type),needs=channelStatus==='unknown'||channelStatus==='opted_out';
  if(channelStatus==='opted_out')needsConsent++;
  else if(channelStatus==='unknown'&&['email','sms','call','whatsapp'].includes(step.type))needsConsent++;
  const prefix=needs?'[Permission review required] ':'';
  const result=await env.DB.prepare('INSERT INTO crm_activities(tenant_id,contact_id,type,title,body,due_at,completed,created_at,sequence_enrollment_id,sequence_step_index) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(t,contactId,'sequence_'+step.type,prefix+step.title,step.content,due,0,ts,enrollmentId,i).run();
  await env.DB.prepare('INSERT INTO crm_sequence_events(tenant_id,enrollment_id,sequence_id,contact_id,step_index,event_type,status,detail_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(t,enrollmentId,sequenceId,contactId,i,step.type,needs?'needs_consent':'scheduled',JSON.stringify({activity_id:Number(result.meta?.last_row_id||0),due_at:due,channel_status:channelStatus,title:step.title}),ts).run();
  scheduled++;
 }
 await env.DB.prepare('UPDATE crm_sequence_enrollments SET next_due_at=?,metadata_json=?,updated_at=? WHERE tenant_id=? AND id=?').bind(firstDue,JSON.stringify({sequence_name:sequence.name,scheduled_steps:scheduled,needs_consent:needsConsent}),ts,t,enrollmentId).run();
 await log(env,user,'crm_sequence_enrolled',{detail:{enrollment_id:enrollmentId,sequence_id:sequenceId,contact_id:contactId,scheduled_steps:scheduled,needs_consent:needsConsent}});
 return{ok:true,enrollment_id:enrollmentId,scheduled_steps:scheduled,needs_consent:needsConsent,next_due_at:firstDue};
}

async function crmOwnedContact(env,t,contactId){return env.DB.prepare('SELECT * FROM crm_contacts WHERE tenant_id=? AND id=?').bind(t,Number(contactId)).first()}
async function crmOwnedDeal(env,t,dealId){return env.DB.prepare('SELECT * FROM crm_opportunities WHERE tenant_id=? AND id=?').bind(t,Number(dealId)).first()}
async function crmOwnedTask(env,t,taskId){return env.DB.prepare('SELECT * FROM crm_activities WHERE tenant_id=? AND id=?').bind(t,Number(taskId)).first()}


const CRM_CONSENT_STATUSES=new Set(['unknown','opted_in','opted_out','transactional','not_applicable']);
const crmConsentStatus=(v)=>CRM_CONSENT_STATUSES.has(String(v||'').toLowerCase())?String(v).toLowerCase():'unknown';
const crmDefaultPreferences=(contactId)=>({contact_id:Number(contactId),email_status:'unknown',sms_status:'unknown',phone_status:'unknown',whatsapp_status:'unknown',do_not_contact:false,lawful_basis:'',consent_source:'',consent_note:'',local_timezone:'',quiet_hours:{},updated_at:0});
async function crmPreferences(env,t,contactId){
 try{
  const row=await env.DB.prepare('SELECT * FROM crm_contact_preferences WHERE tenant_id=? AND contact_id=?').bind(t,Number(contactId)).first();
  return row?{...row,contact_id:Number(row.contact_id),do_not_contact:Boolean(row.do_not_contact),quiet_hours:parse(row.quiet_hours_json,{}),updated_at:Number(row.updated_at||0)}:crmDefaultPreferences(contactId);
 }catch{return crmDefaultPreferences(contactId)}
}
async function saveCrmPreferences(env,t,contactId,body){
 const current=await crmPreferences(env,t,contactId),ts=now();
 const next={
  email_status:body.email_status===undefined?current.email_status:crmConsentStatus(body.email_status),
  sms_status:body.sms_status===undefined?current.sms_status:crmConsentStatus(body.sms_status),
  phone_status:body.phone_status===undefined?current.phone_status:crmConsentStatus(body.phone_status),
  whatsapp_status:body.whatsapp_status===undefined?current.whatsapp_status:crmConsentStatus(body.whatsapp_status),
  do_not_contact:body.do_not_contact===undefined?Boolean(current.do_not_contact):Boolean(body.do_not_contact),
  lawful_basis:body.lawful_basis===undefined?current.lawful_basis:text(body.lawful_basis,160),
  consent_source:body.consent_source===undefined?current.consent_source:text(body.consent_source,200),
  consent_note:body.consent_note===undefined?current.consent_note:text(body.consent_note,4000),
  local_timezone:body.local_timezone===undefined?text(current.local_timezone,80):text(body.local_timezone,80),
  quiet_hours:body.quiet_hours===undefined?(current.quiet_hours||{}):(body.quiet_hours||{})
 };
 await env.DB.prepare('INSERT INTO crm_contact_preferences(tenant_id,contact_id,email_status,sms_status,phone_status,whatsapp_status,do_not_contact,lawful_basis,consent_source,consent_note,local_timezone,quiet_hours_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,contact_id) DO UPDATE SET email_status=excluded.email_status,sms_status=excluded.sms_status,phone_status=excluded.phone_status,whatsapp_status=excluded.whatsapp_status,do_not_contact=excluded.do_not_contact,lawful_basis=excluded.lawful_basis,consent_source=excluded.consent_source,consent_note=excluded.consent_note,local_timezone=excluded.local_timezone,quiet_hours_json=excluded.quiet_hours_json,updated_at=excluded.updated_at').bind(t,Number(contactId),next.email_status,next.sms_status,next.phone_status,next.whatsapp_status,next.do_not_contact?1:0,next.lawful_basis,next.consent_source,next.consent_note,next.local_timezone,JSON.stringify(next.quiet_hours).slice(0,4000),ts).run();
 return crmPreferences(env,t,contactId);
}
async function crmContact360(env,user,contactId){
 const t=tenant(user),contact=await crmOwnedContact(env,t,contactId);if(!contact)return null;
 const preferences=await crmPreferences(env,t,contactId),events=[];let calls=0,messages=0,activities=0,deals=0;
 try{
  const{results=[]}=await env.DB.prepare('SELECT * FROM crm_activities WHERE tenant_id=? AND contact_id=? ORDER BY created_at DESC LIMIT 150').bind(t,Number(contactId)).all();
  activities=results.length;for(const a of results)events.push({id:'activity:'+a.id,kind:a.type||'activity',channel:'crm',direction:'internal',title:a.title||'CRM activity',body:a.body||'',status:Number(a.completed)?'completed':'open',timestamp:Number(a.created_at||0),due_at:a.due_at?Number(a.due_at):null});
 }catch{}
 try{
  const{results=[]}=await env.DB.prepare('SELECT * FROM crm_opportunities WHERE tenant_id=? AND contact_id=? ORDER BY updated_at DESC LIMIT 100').bind(t,Number(contactId)).all();
  deals=results.length;for(const d of results)events.push({id:'deal:'+d.id,kind:'deal',channel:'sales',direction:'internal',title:d.name||'Deal',body:(crmStage(d.stage)+' • '+Number(d.value||0).toLocaleString()+' • '+Math.round(crmProbability(d.stage,d.probability))+'%'),status:crmStage(d.stage),timestamp:Number(d.updated_at||d.created_at||0),value:Number(d.value||0),deal_id:Number(d.id)});
 }catch{}
 try{
  const{results=[]}=await env.DB.prepare('SELECT id,direction,caller,callee,status,started_at,ended_at,duration_seconds,notes,created_at FROM phone_calls WHERE tenant_id=? AND contact_id=? ORDER BY created_at DESC LIMIT 100').bind(t,Number(contactId)).all();
  calls=results.length;for(const call of results)events.push({id:'call:'+call.id,kind:'call',channel:'voice',direction:call.direction||'',title:(call.direction==='inbound'?'Inbound call':'Outbound call'),body:call.notes||'',status:call.status||'',timestamp:Number(call.started_at||call.created_at||0),duration_seconds:Number(call.duration_seconds||0),caller:call.caller||'',callee:call.callee||''});
 }catch{}
 try{await env.DB.prepare('ALTER TABLE unified_inbox_threads ADD COLUMN crm_contact_id INTEGER').run()}catch{}
 try{
  const email=String(contact.email||'').trim().toLowerCase(),phone=String(contact.phone||'').trim();
  const{results=[]}=await env.DB.prepare("SELECT m.id,m.thread_id,m.direction,m.author_type,m.author_name,m.content,m.created_at,t.channel,t.subject,t.status FROM unified_inbox_messages m JOIN unified_inbox_threads t ON t.id=m.thread_id AND t.tenant_id=m.tenant_id WHERE m.tenant_id=? AND (t.crm_contact_id=? OR (?<>'' AND lower(t.customer_ref)=?) OR (?<>'' AND t.customer_ref=?)) ORDER BY m.created_at DESC LIMIT 180").bind(t,Number(contactId),email,email,phone,phone).all();
  messages=results.length;for(const m of results)events.push({id:'message:'+m.id,kind:'message',channel:m.channel||'inbox',direction:m.direction||'',title:m.subject||((m.direction||'')==='inbound'?'Inbound message':'Outbound message'),body:m.content||'',status:m.status||'',timestamp:Number(m.created_at||0),thread_id:m.thread_id,author:m.author_name||m.author_type||''});
 }catch{}
 events.sort((a,b)=>Number(b.timestamp||0)-Number(a.timestamp||0));
 const lastTouch=events.length?Number(events[0].timestamp||0):Number(contact.updated_at||contact.created_at||0);
 let sequence_enrollments=[];try{const r=await env.DB.prepare("SELECT e.*,s.name sequence_name FROM crm_sequence_enrollments e LEFT JOIN magnanimous_ops_sequences s ON s.id=e.sequence_id AND s.tenant_id=e.tenant_id WHERE e.tenant_id=? AND e.contact_id=? ORDER BY e.updated_at DESC LIMIT 20").bind(t,Number(contactId)).all();sequence_enrollments=(r.results||[]).map(x=>({...x,metadata:parse(x.metadata_json,{})}))}catch{}
 return{contact:{...contact,tags:parse(contact.tags,[])},preferences,summary:{activities,deals,calls,messages,total_touches:events.length,last_touch_at:lastTouch},timeline:events.slice(0,250),sequence_enrollments};
}

async function crmCommandCenter(env,user){
 const t=tenant(user),ts=now();
 const [{results:contactsRaw=[]},{results:dealsRaw=[]},{results:tasksRaw=[]},{results:preferencesRaw=[]},{results:pipelineStagesRaw=[]},{results:scoreProfilesRaw=[]}]=await Promise.all([
  env.DB.prepare('SELECT * FROM crm_contacts WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 400').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_opportunities WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 400').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_activities WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_contact_preferences WHERE tenant_id=?').bind(t).all(),
  env.DB.prepare('SELECT id,pipeline_id,stage_key,name,probability,kind FROM crm_pipeline_stages WHERE tenant_id=?').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_scoring_profiles WHERE tenant_id=? AND enabled=1 ORDER BY updated_at DESC').bind(t).all()
 ]);
 const contacts=contactsRaw.map(r=>({...r,tags:parse(r.tags,[])}));
 const byId=new Map(contacts.map(r=>[Number(r.id),r]));
 const preferencesByContact=new Map(preferencesRaw.map(r=>[Number(r.contact_id),{...r,do_not_contact:Boolean(r.do_not_contact)}]));
 const pipelineStageById=new Map(pipelineStagesRaw.map(r=>[String(r.id),r]));
 const scoringProfiles=scoreProfilesRaw.map(r=>({...r,rules:parse(r.rules_json,[])}));
 const activityStats=new Map(),dealStats=new Map();
 for(const a of tasksRaw){const k=Number(a.contact_id);const cur=activityStats.get(k)||{count:0,last:0};cur.count++;cur.last=Math.max(cur.last,Number(a.created_at||0));activityStats.set(k,cur)}
 for(const d of dealsRaw){const k=Number(d.contact_id);dealStats.set(k,(dealStats.get(k)||0)+1)}
 const lead_scores=contacts.map(contact=>{
  const a=activityStats.get(Number(contact.id))||{count:0,last:0};
  const native=crmLeadScore(contact,{activityCount:a.count,dealCount:dealStats.get(Number(contact.id))||0,lastActivityAt:a.last}),configured=crmConfiguredScore(contact,{activityCount:a.count,dealCount:dealStats.get(Number(contact.id))||0,lastActivityAt:a.last},scoringProfiles),effective=configured||native;
  const preferences=preferencesByContact.get(Number(contact.id))||crmDefaultPreferences(contact.id);return{id:Number(contact.id),name:crmContactName(contact),company:contact.company||'',status:contact.status||'',email:contact.email||'',phone:contact.phone||'',score:effective.score,native_score:native.score,score_source:configured?'configured':'native',profile_scores:configured?.profiles||[],reasons:effective.reasons,do_not_contact:Boolean(preferences.do_not_contact),consent:{email:preferences.email_status||'unknown',sms:preferences.sms_status||'unknown',phone:preferences.phone_status||'unknown'}};
 }).sort((a,b)=>b.score-a.score).slice(0,50);

 const stageMap=new Map(),openDeals=[],staleDeals=[],riskDeals=[];let pipelineValue=0,weightedForecast=0;
 for(const deal of dealsRaw){
  const stage=crmStage(deal.stage),stageMeta=pipelineStageById.get(String(deal.stage_id||'')),stageKind=String(stageMeta?.kind||'').toLowerCase()||(CRM_CLOSED_STAGES.has(stage)?(stage==='lost'?'lost':'won'):'open'),closed=stageKind!=='open',value=Math.max(0,Number(deal.value||0)),probability=crmProbability(stage,deal.probability);
  const shaped={...deal,stage,stage_kind:stageKind,value,probability,contact_name:crmContactName(byId.get(Number(deal.contact_id))),contact:byId.get(Number(deal.contact_id))||null};
  const stageMapKey=String(deal.pipeline_id||'legacy')+':'+stage;const agg=stageMap.get(stageMapKey)||{stage,pipeline_id:deal.pipeline_id||null,stage_kind:stageKind,count:0,value:0,weighted:0};agg.count++;agg.value+=value;agg.weighted+=value*(probability/100);stageMap.set(stageMapKey,agg);
  if(!closed){pipelineValue+=value;weightedForecast+=value*(probability/100);openDeals.push(shaped)}
  const age=ts-Number(deal.updated_at||deal.created_at||0),pastClose=Number(deal.expected_close_at||0)>0&&Number(deal.expected_close_at)<ts;
  if(!closed&&age>14*86400)staleDeals.push({...shaped,days_stale:Math.floor(age/86400)});
  if(!closed&&(age>21*86400||pastClose))riskDeals.push({...shaped,risk:pastClose?'Expected close date passed':'No recent movement'});
 }
 staleDeals.sort((a,b)=>b.days_stale-a.days_stale);
 const dueTasks=tasksRaw.filter(a=>!Number(a.completed)&&Number(a.due_at||0)>0).map(a=>({...a,contact_name:crmContactName(byId.get(Number(a.contact_id)))})).sort((a,b)=>Number(a.due_at)-Number(b.due_at));
 const overdue=dueTasks.filter(a=>Number(a.due_at)<ts),due7=dueTasks.filter(a=>Number(a.due_at)>=ts&&Number(a.due_at)<=ts+7*86400);

 const sourceCounts=new Map();for(const contact of contacts){const source=text(contact.source||'Unknown',100)||'Unknown';sourceCounts.set(source,(sourceCounts.get(source)||0)+1)}
 const source_mix=[...sourceCounts.entries()].map(([source,count])=>({source,count})).sort((a,b)=>b.count-a.count).slice(0,12);

 let duplicateEmailGroups=[],duplicatePhoneGroups=[];
 try{const r=await env.DB.prepare("SELECT lower(trim(email)) key,COUNT(*) count FROM crm_contacts WHERE tenant_id=? AND trim(email)<>'' GROUP BY lower(trim(email)) HAVING COUNT(*)>1 ORDER BY count DESC LIMIT 25").bind(t).all();duplicateEmailGroups=r.results||[]}catch{}
 try{const r=await env.DB.prepare("SELECT trim(phone) key,COUNT(*) count FROM crm_contacts WHERE tenant_id=? AND trim(phone)<>'' GROUP BY trim(phone) HAVING COUNT(*)>1 ORDER BY count DESC LIMIT 25").bind(t).all();duplicatePhoneGroups=r.results||[]}catch{}
 const missingEmail=contacts.filter(c=>!c.email).length,missingPhone=contacts.filter(c=>!c.phone).length,missingCompany=contacts.filter(c=>!c.company).length;

 const next_actions=[];
 for(const task of overdue.slice(0,5))next_actions.push({kind:'overdue-task',priority:'urgent',title:task.title||'Overdue follow-up',detail:(task.contact_name||'Contact')+' • due '+new Date(Number(task.due_at)*1000).toISOString(),contact_id:Number(task.contact_id),task_id:Number(task.id)});
 for(const deal of riskDeals.slice(0,5))next_actions.push({kind:'deal-risk',priority:'high',title:'Protect '+deal.name,detail:(deal.contact_name||'Contact')+' • '+deal.risk+' • '+Math.round(deal.probability)+'% probability',contact_id:Number(deal.contact_id),deal_id:Number(deal.id)});
 for(const lead of lead_scores.filter(x=>x.score>=55&&!x.do_not_contact&&['lead','qualified'].includes(String(x.status).toLowerCase())).slice(0,5))next_actions.push({kind:'hot-lead',priority:'high',title:'Follow up with '+lead.name,detail:'Lead score '+lead.score+'/100 • '+lead.reasons.slice(0,2).join(' • '),contact_id:lead.id});
 for(const lead of lead_scores.filter(x=>x.do_not_contact).slice(0,3))next_actions.push({kind:'consent-review',priority:'normal',title:'Respect contact preference for '+lead.name,detail:'Do-not-contact is enabled. Review the record without sending outreach.',contact_id:lead.id});
 if(!next_actions.length&&contacts.length)next_actions.push({kind:'relationship-review',priority:'normal',title:'Review recent relationships',detail:'No urgent CRM risks detected. Review the newest contacts and keep next steps current.'});

 return{
  generated_at:ts,
  metrics:{
   contacts:contacts.length,
   leads:contacts.filter(c=>['lead','qualified'].includes(String(c.status).toLowerCase())).length,
   customers:contacts.filter(c=>String(c.status).toLowerCase()==='customer').length,
   open_deals:openDeals.length,
   pipeline_value:pipelineValue,
   weighted_forecast:weightedForecast,
   overdue_tasks:overdue.length,
   due_next_7_days:due7.length,
   stale_deals:staleDeals.length,
   at_risk_deals:riskDeals.length,
   duplicate_groups:duplicateEmailGroups.length+duplicatePhoneGroups.length
  },
  lead_scores,
  stage_summary:[...stageMap.values()].sort((a,b)=>b.value-a.value),
  source_mix,
  next_actions:next_actions.slice(0,12),
  deals:openDeals.sort((a,b)=>Number(b.updated_at||0)-Number(a.updated_at||0)).slice(0,100),
  tasks:dueTasks.slice(0,100),
  risks:{stale_deals:staleDeals.slice(0,20),at_risk_deals:riskDeals.slice(0,20)},
  data_quality:{missing_email:missingEmail,missing_phone:missingPhone,missing_company:missingCompany,duplicate_email_groups:duplicateEmailGroups,duplicate_phone_groups:duplicatePhoneGroups}
 };
}

export async function handleNativeWorkCrm(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/operations'))const workforce=await handleWorkforceOps(request,env,user,body);if(workforce)return workforce;
 return null;
 if(url.pathname==='/api/operations/capabilities'&&request.method==='GET')return json({identity:'Magnanimous AI',native:true,capabilities:NATIVE_OPERATIONS_CAPABILITIES});
 await ensureSchema(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);
 let body={};if(!['GET','DELETE'].includes(request.method)){try{body=await request.json()}catch{return json({detail:'Valid JSON body required.'},400)}}
 const advancedCrmResponse=await handleAdvancedCrm(request,env,user,body);if(advancedCrmResponse)return advancedCrmResponse;



 if(url.pathname==='/api/operations/crm/studio'&&request.method==='GET')return json(await crmStudio(env,t,user));

 if(url.pathname==='/api/operations/crm/accounts'){
  if(request.method==='GET')return json({items:await crmAccounts(env,t)});
  if(request.method==='POST'){
   const name=text(body.name,220);if(!name)return json({detail:'Account name required.'},400);const ts=now();
   const r=await env.DB.prepare('INSERT INTO crm_accounts(tenant_id,name,domain,industry,status,owner_user_id,tags,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(t,name,text(body.domain,220),text(body.industry,160),text(body.status||'prospect',60),text(body.owner_user_id||user.id,120),JSON.stringify(Array.isArray(body.tags)?body.tags:[]),text(body.notes,12000),ts,ts).run();
   const accountId=Number(r.meta?.last_row_id||0);await log(env,user,'crm_account_created',{detail:{account_id:accountId,name}});return json({item:await crmOwnedAccount(env,t,accountId)},201);
  }
 }

 let crmAccountMatch=url.pathname.match(/^\/api\/operations\/crm\/contacts\/(\d+)\/account$/);
 if(crmAccountMatch&&request.method==='PUT'){
  const contactId=Number(crmAccountMatch[1]);if(!await crmOwnedContact(env,t,contactId))return json({detail:'CRM contact not found.'},404);
  const accountId=body.account_id?Number(body.account_id):null;if(accountId&&!await crmOwnedAccount(env,t,accountId))return json({detail:'Account not found.'},404);
  await env.DB.prepare('UPDATE crm_contacts SET account_id=?,updated_at=? WHERE tenant_id=? AND id=?').bind(accountId,now(),t,contactId).run();
  await log(env,user,'crm_contact_account_updated',{detail:{contact_id:contactId,account_id:accountId}});return json({ok:true,contact_id:contactId,account_id:accountId});
 }

 if(url.pathname==='/api/operations/crm/pipelines'){
  if(request.method==='GET')return json({items:await crmPipelines(env,t)});
  if(request.method==='POST'){
   const name=text(body.name,180);if(!name)return json({detail:'Pipeline name required.'},400);const pid=id(),ts=now(),makeDefault=Boolean(body.is_default);
   if(makeDefault)await env.DB.prepare('UPDATE crm_pipelines SET is_default=0,updated_at=? WHERE tenant_id=?').bind(ts,t).run();
   await env.DB.prepare('INSERT INTO crm_pipelines(id,tenant_id,name,description,is_default,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(pid,t,name,text(body.description,2000),makeDefault?1:0,1,ts,ts).run();
   const rawStages=Array.isArray(body.stages)&&body.stages.length?body.stages:CRM_DEFAULT_PIPELINE_STAGES.map(([stage_key,stageName,probability,kind])=>({stage_key,name:stageName,probability,kind}));
   let position=0;for(const s of rawStages.slice(0,30)){position++;const key=crmStage(s.stage_key||s.name||('stage-'+position));const kind=['open','won','lost'].includes(String(s.kind||''))?String(s.kind):'open';const probability=kind==='won'?100:kind==='lost'?0:Math.max(0,Math.min(100,Number(s.probability||0)));await env.DB.prepare('INSERT INTO crm_pipeline_stages(id,tenant_id,pipeline_id,name,stage_key,position,probability,kind,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id(),t,pid,text(s.name||key,120),key,position,probability,kind,1,ts,ts).run()}
   await log(env,user,'crm_pipeline_created',{detail:{pipeline_id:pid,name,stage_count:position}});return json({items:await crmPipelines(env,t)},201);
  }
 }


 if(url.pathname==='/api/operations/crm/scoring'){
  if(request.method==='GET')return json({items:await crmScoreProfiles(env,t)});
  if(request.method==='POST'){
   const name=text(body.name,180);if(!name)return json({detail:'Scoring profile name required.'},400);const rules=Array.isArray(body.rules)?body.rules.slice(0,50).map(r=>({field:text(r.field,80),operator:text(r.operator||'equals',30),value:r.value,points:Math.max(-100,Math.min(100,Number(r.points||0))),label:text(r.label,160)})):[];
   const sid=id(),ts=now(),scoreType=['fit','engagement','combined'].includes(String(body.score_type))?String(body.score_type):'combined';await env.DB.prepare('INSERT INTO crm_scoring_profiles(id,tenant_id,name,score_type,enabled,rules_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(sid,t,name,scoreType,body.enabled===false?0:1,JSON.stringify(rules),ts,ts).run();await log(env,user,'crm_scoring_profile_created',{detail:{profile_id:sid,name,score_type:scoreType,rule_count:rules.length}});return json({items:await crmScoreProfiles(env,t)},201)
  }
 }

 if(url.pathname==='/api/operations/crm/sequences'){
  if(request.method==='GET')return json({items:await crmSequenceDefinitions(env,user)});
  if(request.method==='POST'){
   const workspace=await seedCrmWorkspace(env,user),name=text(body.name,180);if(!name)return json({detail:'Sequence name required.'},400);const steps=crmNormalizeSequenceSteps(body.steps);if(!steps.length)return json({detail:'At least one sequence step is required.'},400);
   const sid=id(),ts=now(),settings={stop_on_reply:body.stop_on_reply!==false,communication_window:body.communication_window||{weekdays:[1,2,3,4,5],start_hour:9,end_hour:16,timezone:'contact'}};await env.DB.prepare('INSERT INTO magnanimous_ops_sequences(id,tenant_id,workspace_id,name,status,audience_json,steps_json,settings_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(sid,t,workspace.id,name,'active',JSON.stringify(body.audience||{}),JSON.stringify(steps),JSON.stringify(settings),ts,ts).run();await log(env,user,'crm_sequence_created',{workspace_id:workspace.id,detail:{sequence_id:sid,name,step_count:steps.length}});return json({items:await crmSequenceDefinitions(env,user)},201)
  }
 }

 let crmSequenceMatch=url.pathname.match(/^\/api\/operations\/crm\/sequences\/([^/]+)\/enroll$/);
 if(crmSequenceMatch&&request.method==='POST'){const result=await crmEnrollSequence(env,user,crmSequenceMatch[1],Number(body.contact_id||0));if(result.error)return json({detail:result.error},result.status||400);return json(result,201)}
 if(url.pathname==='/api/operations/crm/sequence-enrollments'&&request.method==='GET'){const{results=[]}=await env.DB.prepare("SELECT e.*,s.name sequence_name,c.first_name,c.last_name,c.company FROM crm_sequence_enrollments e LEFT JOIN magnanimous_ops_sequences s ON s.id=e.sequence_id AND s.tenant_id=e.tenant_id LEFT JOIN crm_contacts c ON c.id=e.contact_id AND c.tenant_id=e.tenant_id WHERE e.tenant_id=? ORDER BY e.updated_at DESC LIMIT 300").bind(t).all();return json({items:results.map(r=>({...r,metadata:parse(r.metadata_json,{})}))})}

 if(url.pathname==='/api/operations/crm/command-center'&&request.method==='GET')return json(await crmCommandCenter(env,user));


 let crmContactMatch=url.pathname.match(/^\/api\/operations\/crm\/contacts\/(\d+)\/360$/);
 if(crmContactMatch&&request.method==='GET'){
  const data=await crmContact360(env,user,Number(crmContactMatch[1]));if(!data)return json({detail:'CRM contact not found.'},404);return json(data);
 }
 crmContactMatch=url.pathname.match(/^\/api\/operations\/crm\/contacts\/(\d+)\/preferences$/);
 if(crmContactMatch){
  const contactId=Number(crmContactMatch[1]);if(!await crmOwnedContact(env,t,contactId))return json({detail:'CRM contact not found.'},404);
  if(request.method==='GET')return json({preferences:await crmPreferences(env,t,contactId)});
  if(request.method==='PUT'){const preferences=await saveCrmPreferences(env,t,contactId,body);await log(env,user,'crm_contact_preferences_updated',{detail:{contact_id:contactId,do_not_contact:Boolean(preferences.do_not_contact),email_status:preferences.email_status,sms_status:preferences.sms_status,phone_status:preferences.phone_status}});return json({preferences})}
 }

 if(url.pathname==='/api/operations/crm/deals'){
  if(request.method==='GET'){const data=await crmCommandCenter(env,user);return json({items:data.deals,stage_summary:data.stage_summary,metrics:data.metrics})}
  if(request.method==='POST'){
   const contactId=Number(body.contact_id||0);const contact=contactId?await crmOwnedContact(env,t,contactId):null;if(contactId&&!contact)return json({detail:'Contact not found in this workspace.'},404);
   const accountId=body.account_id!==undefined?Number(body.account_id||0)||null:(contact?.account_id?Number(contact.account_id):null);if(accountId&&!await crmOwnedAccount(env,t,accountId))return json({detail:'Account not found in this workspace.'},404);
   const name=text(body.name,220);if(!name)return json({detail:'Deal name required.'},400);
   const configured=await crmPipelineStage(env,t,text(body.pipeline_id,80),body.stage||'new'),ts=now(),stage=crmStage(configured?.stage?.stage_key||body.stage||'new'),probability=body.probability===undefined?Number(configured?.stage?.probability??crmProbability(stage,0)):crmProbability(stage,body.probability),value=Math.max(0,Number(body.value||0)),expected=body.expected_close_at?Number(body.expected_close_at):null;
   const r=await env.DB.prepare('INSERT INTO crm_opportunities(tenant_id,contact_id,account_id,pipeline_id,stage_id,name,stage,value,probability,expected_close_at,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(t,contactId||null,accountId,configured?.pipeline?.id||null,configured?.stage?.id||null,name,stage,value,probability,expected,text(body.notes,12000),ts,ts).run();
   const dealId=Number(r.meta?.last_row_id||0);await log(env,user,'crm_deal_created',{detail:{deal_id:dealId,contact_id:contactId||null,stage,value}});return json({item:await crmOwnedDeal(env,t,dealId)},201);
  }
 }

 let crmMatch=url.pathname.match(/^\/api\/operations\/crm\/deals\/(\d+)$/);
 if(crmMatch&&request.method==='PUT'){
  const dealId=Number(crmMatch[1]),cur=await crmOwnedDeal(env,t,dealId);if(!cur)return json({detail:'Deal not found.'},404);
  const contactId=body.contact_id===undefined?Number(cur.contact_id||0):Number(body.contact_id||0);const contact=contactId?await crmOwnedContact(env,t,contactId):null;if(contactId&&!contact)return json({detail:'Contact not found in this workspace.'},404);
  const accountId=body.account_id===undefined?(cur.account_id?Number(cur.account_id):(contact?.account_id?Number(contact.account_id):null)):(Number(body.account_id||0)||null);if(accountId&&!await crmOwnedAccount(env,t,accountId))return json({detail:'Account not found in this workspace.'},404);
  const requestedPipeline=body.pipeline_id===undefined?text(cur.pipeline_id,80):text(body.pipeline_id,80),requestedStage=body.stage===undefined?crmStage(cur.stage):crmStage(body.stage),configured=await crmPipelineStage(env,t,requestedPipeline,requestedStage),stage=crmStage(configured?.stage?.stage_key||requestedStage),stageChanged=body.stage!==undefined&&stage!==crmStage(cur.stage),probability=body.probability===undefined?(stageChanged?Number(configured?.stage?.probability??crmProbability(stage,0)):crmProbability(stage,cur.probability)):crmProbability(stage,body.probability);
  await env.DB.prepare('UPDATE crm_opportunities SET contact_id=?,account_id=?,pipeline_id=?,stage_id=?,name=?,stage=?,value=?,probability=?,expected_close_at=?,notes=?,updated_at=? WHERE tenant_id=? AND id=?').bind(contactId||null,accountId,configured?.pipeline?.id||cur.pipeline_id||null,configured?.stage?.id||cur.stage_id||null,body.name===undefined?cur.name:text(body.name,220),stage,body.value===undefined?Number(cur.value||0):Math.max(0,Number(body.value||0)),probability,body.expected_close_at===undefined?cur.expected_close_at:(body.expected_close_at?Number(body.expected_close_at):null),body.notes===undefined?cur.notes:text(body.notes,12000),now(),t,dealId).run();
  await log(env,user,'crm_deal_updated',{detail:{deal_id:dealId,stage,probability}});return json({item:await crmOwnedDeal(env,t,dealId)});
 }

 if(url.pathname==='/api/operations/crm/tasks'){
  if(request.method==='GET'){const data=await crmCommandCenter(env,user);return json({items:data.tasks,metrics:data.metrics})}
  if(request.method==='POST'){
   const contactId=Number(body.contact_id||0);if(!contactId||!await crmOwnedContact(env,t,contactId))return json({detail:'A valid CRM contact is required.'},400);
   const title=text(body.title||'Follow up',220),ts=now(),due=body.due_at?Number(body.due_at):null;
   const r=await env.DB.prepare('INSERT INTO crm_activities(tenant_id,contact_id,type,title,body,due_at,completed,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(t,contactId,text(body.type||'task',60),title,text(body.body,12000),due,body.completed?1:0,ts).run();
   const taskId=Number(r.meta?.last_row_id||0);await log(env,user,'crm_task_created',{detail:{task_id:taskId,contact_id:contactId,due_at:due}});return json({item:await crmOwnedTask(env,t,taskId)},201);
  }
 }

 crmMatch=url.pathname.match(/^\/api\/operations\/crm\/tasks\/(\d+)$/);
 if(crmMatch&&request.method==='PUT'){
  const taskId=Number(crmMatch[1]),cur=await crmOwnedTask(env,t,taskId);if(!cur)return json({detail:'Task not found.'},404);
  const contactId=body.contact_id===undefined?Number(cur.contact_id||0):Number(body.contact_id||0);if(!contactId||!await crmOwnedContact(env,t,contactId))return json({detail:'A valid CRM contact is required.'},400);
  await env.DB.prepare('UPDATE crm_activities SET contact_id=?,type=?,title=?,body=?,due_at=?,completed=? WHERE tenant_id=? AND id=?').bind(contactId,body.type===undefined?cur.type:text(body.type,60),body.title===undefined?cur.title:text(body.title,220),body.body===undefined?cur.body:text(body.body,12000),body.due_at===undefined?cur.due_at:(body.due_at?Number(body.due_at):null),body.completed===undefined?Number(cur.completed||0):(body.completed?1:0),t,taskId).run();
  await log(env,user,'crm_task_updated',{detail:{task_id:taskId,completed:body.completed===undefined?Boolean(cur.completed):Boolean(body.completed)}});return json({item:await crmOwnedTask(env,t,taskId)});
 }

 if(url.pathname==='/api/operations/summary'&&request.method==='GET')return json(await summary(env,t));
 if(url.pathname==='/api/operations/bootstrap-crm'&&request.method==='POST'){const workspace=await seedCrmWorkspace(env,user);await log(env,user,'bootstrap_crm',{workspace_id:workspace.id});return json({workspace},201)}

 if(url.pathname==='/api/operations/workspaces'){
  if(request.method==='GET'){const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_ops_workspaces WHERE tenant_id=? ORDER BY updated_at DESC').bind(t).all();return json({items:results.map(mapWorkspace)})}
  if(request.method==='POST'){const wid=id(),ts=now();await env.DB.prepare('INSERT INTO magnanimous_ops_workspaces(id,tenant_id,owner_user_id,name,kind,description,settings_json,permissions_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(wid,t,String(user.id||''),text(body.name||'New workspace',220),text(body.kind||'workspace',80),text(body.description,4000),JSON.stringify(body.settings||{}).slice(0,30000),JSON.stringify(body.permissions||{}).slice(0,30000),ts,ts).run();await log(env,user,'workspace_created',{workspace_id:wid});return json({item:mapWorkspace(await ownedWorkspace(env,t,wid))},201)}
 }

 if(url.pathname==='/api/operations/boards'){
  if(request.method==='GET'){const wid=text(url.searchParams.get('workspace_id'),80);let sql='SELECT * FROM magnanimous_ops_boards WHERE tenant_id=?',args=[t];if(wid){sql+=' AND workspace_id=?';args.push(wid)}sql+=' ORDER BY updated_at DESC';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results.map(mapBoard)})}
  if(request.method==='POST'){const wid=text(body.workspace_id,80);if(!wid||!await ownedWorkspace(env,t,wid))return json({detail:'Workspace not found.'},404);const bid=id(),ts=now();await env.DB.prepare('INSERT INTO magnanimous_ops_boards(id,tenant_id,workspace_id,name,singular_name,kind,description,icon,settings_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(bid,t,wid,text(body.name||'New board',220),text(body.singular_name||'record',80),text(body.kind||'board',80),text(body.description,4000),text(body.icon,40),JSON.stringify(body.settings||{}).slice(0,30000),ts,ts).run();await log(env,user,'board_created',{workspace_id:wid,board_id:bid});return json({item:mapBoard(await ownedBoard(env,t,bid))},201)}
 }

 if(url.pathname==='/api/operations/fields'){
  if(request.method==='GET'){const bid=text(url.searchParams.get('board_id'),80);if(!bid)return json({detail:'board_id required.'},400);const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_ops_fields WHERE tenant_id=? AND board_id=? ORDER BY position,created_at').bind(t,bid).all();return json({items:results.map(mapField)})}
  if(request.method==='POST'){const bid=text(body.board_id,80);if(!bid||!await ownedBoard(env,t,bid))return json({detail:'Board not found.'},404);const fid=id(),ts=now(),key=text(body.field_key||body.name,120).toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'');if(!key)return json({detail:'Field name required.'},400);await env.DB.prepare('INSERT INTO magnanimous_ops_fields(id,tenant_id,board_id,name,field_key,field_type,required,position,config_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(fid,t,bid,text(body.name||key,160),key,text(body.field_type||'text',60),body.required?1:0,Number(body.position)||0,JSON.stringify(body.config||{}).slice(0,30000),ts,ts).run();return json({item:mapField(await env.DB.prepare('SELECT * FROM magnanimous_ops_fields WHERE tenant_id=? AND id=?').bind(t,fid).first())},201)}
 }

 if(url.pathname==='/api/operations/records'){
  if(request.method==='GET'){const bid=text(url.searchParams.get('board_id'),80);if(!bid)return json({detail:'board_id required.'},400);const cap=Math.min(500,Math.max(1,Number(url.searchParams.get('limit'))||100));const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_ops_records WHERE tenant_id=? AND board_id=? ORDER BY sort_order,updated_at DESC LIMIT ?').bind(t,bid,cap).all();return json({items:results.map(mapRecord)})}
  if(request.method==='POST'){const bid=text(body.board_id,80),board=bid&&await ownedBoard(env,t,bid);if(!board)return json({detail:'Board not found.'},404);const rid=id(),ts=now();await env.DB.prepare('INSERT INTO magnanimous_ops_records(id,tenant_id,board_id,title,status,owner_user_id,group_key,parent_id,due_at,sort_order,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(rid,t,bid,text(body.title||`New ${board.singular_name||'record'}`,240),text(body.status,80),text(body.owner_user_id,120),text(body.group_key,120),body.parent_id?text(body.parent_id,80):null,body.due_at?Number(body.due_at):null,Number(body.sort_order)||0,JSON.stringify(body.data||{}).slice(0,60000),ts,ts).run();await log(env,user,'record_created',{workspace_id:board.workspace_id,board_id:bid,record_id:rid});await emitEvent(env,user,{event:'record.created',workspace_id:board.workspace_id,board_id:bid,record_id:rid});return json({item:mapRecord(await ownedRecord(env,t,rid))},201)}
 }

 if(url.pathname.startsWith('/api/operations/records/')&&request.method==='PUT'){
  const rid=text(url.pathname.split('/').pop(),80),cur=mapRecord(await ownedRecord(env,t,rid));if(!cur)return json({detail:'Record not found.'},404);const data=body.data===undefined?cur.data:{...cur.data,...body.data},ts=now();await env.DB.prepare('UPDATE magnanimous_ops_records SET title=?,status=?,owner_user_id=?,group_key=?,parent_id=?,due_at=?,sort_order=?,data_json=?,updated_at=? WHERE tenant_id=? AND id=?').bind(body.title===undefined?cur.title:text(body.title,240),body.status===undefined?cur.status:text(body.status,80),body.owner_user_id===undefined?cur.owner_user_id:text(body.owner_user_id,120),body.group_key===undefined?cur.group_key:text(body.group_key,120),body.parent_id===undefined?cur.parent_id:(body.parent_id?text(body.parent_id,80):null),body.due_at===undefined?cur.due_at:(body.due_at?Number(body.due_at):null),body.sort_order===undefined?cur.sort_order:Number(body.sort_order)||0,JSON.stringify(data).slice(0,60000),ts,t,rid).run();await log(env,user,'record_updated',{board_id:cur.board_id,record_id:rid});await emitEvent(env,user,{event:'record.updated',board_id:cur.board_id,record_id:rid});return json({item:mapRecord(await ownedRecord(env,t,rid))})
 }

 if(url.pathname==='/api/operations/links'&&request.method==='POST'){
  const from=text(body.from_record_id,80),to=text(body.to_record_id,80);if(!await ownedRecord(env,t,from)||!await ownedRecord(env,t,to))return json({detail:'Both records must exist.'},404);const lid=id();await env.DB.prepare('INSERT OR IGNORE INTO magnanimous_ops_links(id,tenant_id,from_record_id,to_record_id,relation_type,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(lid,t,from,to,text(body.relation_type||'related',100),JSON.stringify(body.metadata||{}).slice(0,20000),now()).run();return json({id:lid},201)
 }

 if(url.pathname==='/api/operations/views'){
  if(request.method==='GET'){const bid=text(url.searchParams.get('board_id'),80);const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_ops_views WHERE tenant_id=? AND board_id=? ORDER BY updated_at DESC').bind(t,bid).all();return json({items:results.map(mapView)})}
  if(request.method==='POST'){const bid=text(body.board_id,80);if(!await ownedBoard(env,t,bid))return json({detail:'Board not found.'},404);const vid=id(),ts=now();await env.DB.prepare('INSERT INTO magnanimous_ops_views(id,tenant_id,board_id,name,view_type,config_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(vid,t,bid,text(body.name||'New view',180),text(body.view_type||'table',60),JSON.stringify(body.config||{}).slice(0,40000),ts,ts).run();return json({item:mapView(await env.DB.prepare('SELECT * FROM magnanimous_ops_views WHERE tenant_id=? AND id=?').bind(t,vid).first())},201)}
 }

 if(url.pathname==='/api/operations/automations'){
  if(request.method==='GET'){const wid=text(url.searchParams.get('workspace_id'),80);let sql='SELECT * FROM magnanimous_ops_automations WHERE tenant_id=?',args=[t];if(wid){sql+=' AND workspace_id=?';args.push(wid)}sql+=' ORDER BY updated_at DESC';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results.map(mapAutomation)})}
  if(request.method==='POST'){const wid=text(body.workspace_id,80);if(!await ownedWorkspace(env,t,wid))return json({detail:'Workspace not found.'},404);const aid=id(),ts=now(),bid=body.board_id?text(body.board_id,80):null;await env.DB.prepare('INSERT INTO magnanimous_ops_automations(id,tenant_id,workspace_id,board_id,name,enabled,trigger_json,conditions_json,actions_json,run_count,last_run_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(aid,t,wid,bid,text(body.name||'New automation',220),body.enabled===false?0:1,JSON.stringify(body.trigger||{}).slice(0,20000),JSON.stringify(body.conditions||[]).slice(0,30000),JSON.stringify(body.actions||[]).slice(0,30000),0,null,ts,ts).run();return json({item:mapAutomation(await env.DB.prepare('SELECT * FROM magnanimous_ops_automations WHERE tenant_id=? AND id=?').bind(t,aid).first())},201)}
 }
 if(url.pathname==='/api/operations/events'&&request.method==='POST')return json(await emitEvent(env,user,body));

 if(url.pathname==='/api/operations/sequences'){
  if(request.method==='GET'){const wid=text(url.searchParams.get('workspace_id'),80);let sql='SELECT * FROM magnanimous_ops_sequences WHERE tenant_id=?',args=[t];if(wid){sql+=' AND workspace_id=?';args.push(wid)}sql+=' ORDER BY updated_at DESC';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({items:results.map(mapSequence)})}
  if(request.method==='POST'){const wid=text(body.workspace_id,80);if(!await ownedWorkspace(env,t,wid))return json({detail:'Workspace not found.'},404);const sid=id(),ts=now();await env.DB.prepare('INSERT INTO magnanimous_ops_sequences(id,tenant_id,workspace_id,name,status,audience_json,steps_json,settings_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(sid,t,wid,text(body.name||'New sequence',220),text(body.status||'draft',60),JSON.stringify(body.audience||{}).slice(0,30000),JSON.stringify(body.steps||[]).slice(0,50000),JSON.stringify(body.settings||{}).slice(0,30000),ts,ts).run();return json({item:mapSequence(await env.DB.prepare('SELECT * FROM magnanimous_ops_sequences WHERE tenant_id=? AND id=?').bind(t,sid).first())},201)}
 }

 if(url.pathname==='/api/operations/activity'&&request.method==='GET'){const cap=Math.min(300,Math.max(1,Number(url.searchParams.get('limit'))||80));const{results=[]}=await env.DB.prepare('SELECT * FROM magnanimous_ops_activity WHERE tenant_id=? ORDER BY created_at DESC LIMIT ?').bind(t,cap).all();return json({items:results.map(r=>({...r,detail:parse(r.detail_json,{})}))})}
 return json({detail:'Operations route not found.'},404);
}
