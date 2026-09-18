import { currentUser } from './integrations.js';

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
];

async function ensureSchema(env){
 if(!env?.DB)throw new Error('Database unavailable.');
 const stmts=[
 `CREATE TABLE IF NOT EXISTS crm_contacts (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,first_name TEXT NOT NULL,last_name TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',company TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'lead',source TEXT NOT NULL DEFAULT '',tags TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_activities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',due_at INTEGER,completed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,contact_id INTEGER,name TEXT NOT NULL,stage TEXT NOT NULL DEFAULT 'new',value REAL NOT NULL DEFAULT 0,probability REAL NOT NULL DEFAULT 0,expected_close_at INTEGER,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
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
  'CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_status ON crm_contacts(tenant_id,status)',
  'CREATE INDEX IF NOT EXISTS idx_crm_opportunities_tenant_stage ON crm_opportunities(tenant_id,stage)',
  'CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant_due ON crm_activities(tenant_id,due_at,completed)'
 ]){try{await env.DB.prepare(sql).run()}catch{}}
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
 try{const r=await env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(value),0) value FROM crm_opportunities WHERE tenant_id=? AND stage NOT IN ('won','lost','closed')").bind(t).first();crm.deals=Number(r?.n||0);crm.pipeline_value=Number(r?.value||0)}catch{}
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
async function crmOwnedContact(env,t,contactId){return env.DB.prepare('SELECT * FROM crm_contacts WHERE tenant_id=? AND id=?').bind(t,Number(contactId)).first()}
async function crmOwnedDeal(env,t,dealId){return env.DB.prepare('SELECT * FROM crm_opportunities WHERE tenant_id=? AND id=?').bind(t,Number(dealId)).first()}
async function crmOwnedTask(env,t,taskId){return env.DB.prepare('SELECT * FROM crm_activities WHERE tenant_id=? AND id=?').bind(t,Number(taskId)).first()}

async function crmCommandCenter(env,user){
 const t=tenant(user),ts=now();
 const [{results:contactsRaw=[]},{results:dealsRaw=[]},{results:tasksRaw=[]}]=await Promise.all([
  env.DB.prepare('SELECT * FROM crm_contacts WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 400').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_opportunities WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 400').bind(t).all(),
  env.DB.prepare('SELECT * FROM crm_activities WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500').bind(t).all()
 ]);
 const contacts=contactsRaw.map(r=>({...r,tags:parse(r.tags,[])}));
 const byId=new Map(contacts.map(r=>[Number(r.id),r]));
 const activityStats=new Map(),dealStats=new Map();
 for(const a of tasksRaw){const k=Number(a.contact_id);const cur=activityStats.get(k)||{count:0,last:0};cur.count++;cur.last=Math.max(cur.last,Number(a.created_at||0));activityStats.set(k,cur)}
 for(const d of dealsRaw){const k=Number(d.contact_id);dealStats.set(k,(dealStats.get(k)||0)+1)}
 const lead_scores=contacts.map(contact=>{
  const a=activityStats.get(Number(contact.id))||{count:0,last:0};
  const score=crmLeadScore(contact,{activityCount:a.count,dealCount:dealStats.get(Number(contact.id))||0,lastActivityAt:a.last});
  return{id:Number(contact.id),name:crmContactName(contact),company:contact.company||'',status:contact.status||'',email:contact.email||'',phone:contact.phone||'',score:score.score,reasons:score.reasons};
 }).sort((a,b)=>b.score-a.score).slice(0,50);

 const stageMap=new Map(),openDeals=[],staleDeals=[],riskDeals=[];let pipelineValue=0,weightedForecast=0;
 for(const deal of dealsRaw){
  const stage=crmStage(deal.stage),closed=CRM_CLOSED_STAGES.has(stage),value=Math.max(0,Number(deal.value||0)),probability=crmProbability(stage,deal.probability);
  const shaped={...deal,stage,value,probability,contact_name:crmContactName(byId.get(Number(deal.contact_id))),contact:byId.get(Number(deal.contact_id))||null};
  const agg=stageMap.get(stage)||{stage,count:0,value:0,weighted:0};agg.count++;agg.value+=value;agg.weighted+=value*(probability/100);stageMap.set(stage,agg);
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
 for(const lead of lead_scores.filter(x=>x.score>=55&&['lead','qualified'].includes(String(x.status).toLowerCase())).slice(0,5))next_actions.push({kind:'hot-lead',priority:'high',title:'Follow up with '+lead.name,detail:'Lead score '+lead.score+'/100 • '+lead.reasons.slice(0,2).join(' • '),contact_id:lead.id});
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
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/operations'))return null;
 if(url.pathname==='/api/operations/capabilities'&&request.method==='GET')return json({identity:'Magnanimous AI',native:true,capabilities:NATIVE_OPERATIONS_CAPABILITIES});
 await ensureSchema(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);
 let body={};if(!['GET','DELETE'].includes(request.method)){try{body=await request.json()}catch{return json({detail:'Valid JSON body required.'},400)}}


 if(url.pathname==='/api/operations/crm/command-center'&&request.method==='GET')return json(await crmCommandCenter(env,user));

 if(url.pathname==='/api/operations/crm/deals'){
  if(request.method==='GET'){const data=await crmCommandCenter(env,user);return json({items:data.deals,stage_summary:data.stage_summary,metrics:data.metrics})}
  if(request.method==='POST'){
   const contactId=Number(body.contact_id||0);if(contactId&&!await crmOwnedContact(env,t,contactId))return json({detail:'Contact not found in this workspace.'},404);
   const name=text(body.name,220);if(!name)return json({detail:'Deal name required.'},400);
   const ts=now(),stage=crmStage(body.stage||'new'),probability=crmProbability(stage,body.probability),value=Math.max(0,Number(body.value||0)),expected=body.expected_close_at?Number(body.expected_close_at):null;
   const r=await env.DB.prepare('INSERT INTO crm_opportunities(tenant_id,contact_id,name,stage,value,probability,expected_close_at,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(t,contactId||null,name,stage,value,probability,expected,text(body.notes,12000),ts,ts).run();
   const dealId=Number(r.meta?.last_row_id||0);await log(env,user,'crm_deal_created',{detail:{deal_id:dealId,contact_id:contactId||null,stage,value}});return json({item:await crmOwnedDeal(env,t,dealId)},201);
  }
 }

 let crmMatch=url.pathname.match(/^\/api\/operations\/crm\/deals\/(\d+)$/);
 if(crmMatch&&request.method==='PUT'){
  const dealId=Number(crmMatch[1]),cur=await crmOwnedDeal(env,t,dealId);if(!cur)return json({detail:'Deal not found.'},404);
  const contactId=body.contact_id===undefined?Number(cur.contact_id||0):Number(body.contact_id||0);if(contactId&&!await crmOwnedContact(env,t,contactId))return json({detail:'Contact not found in this workspace.'},404);
  const stage=body.stage===undefined?crmStage(cur.stage):crmStage(body.stage),stageChanged=body.stage!==undefined&&stage!==crmStage(cur.stage),probability=body.probability===undefined?(stageChanged?crmProbability(stage,0):crmProbability(stage,cur.probability)):crmProbability(stage,body.probability);
  await env.DB.prepare('UPDATE crm_opportunities SET contact_id=?,name=?,stage=?,value=?,probability=?,expected_close_at=?,notes=?,updated_at=? WHERE tenant_id=? AND id=?').bind(contactId||null,body.name===undefined?cur.name:text(body.name,220),stage,body.value===undefined?Number(cur.value||0):Math.max(0,Number(body.value||0)),probability,body.expected_close_at===undefined?cur.expected_close_at:(body.expected_close_at?Number(body.expected_close_at):null),body.notes===undefined?cur.notes:text(body.notes,12000),now(),t,dealId).run();
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
