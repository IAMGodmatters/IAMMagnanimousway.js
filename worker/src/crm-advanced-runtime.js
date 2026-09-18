const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const txt=(v,n=12000)=>String(v??'').trim().slice(0,n);
const parse=(v,f={})=>{try{return JSON.parse(String(v??''))}catch{return f}};
const uid=()=>crypto.randomUUID();
const tenant=u=>String(u?.tenant_id||'');

export const ADVANCED_CRM_CAPABILITIES=[
 {id:'service-cases',name:'Customer service cases, priority, SLA and ownership'},
 {id:'cpq-quotes',name:'Quotes, line items, discounts, approvals and deal linkage'},
 {id:'campaign-attribution',name:'Campaigns, touches and first/last/multi-touch attribution'},
 {id:'territory-quota',name:'Sales territories, assignments, quotas and attainment'},
 {id:'customer-health',name:'Customer health, churn-risk signals and relationship monitoring'},
 {id:'sequence-governance',name:'Contact-timezone communication windows and safe-send planning'},
 {id:'predictive-readiness',name:'Historical outcome readiness gate for future trained predictive models'},
 {id:'crm-audit-center',name:'Advanced CRM activation and operating-health audit'}
];

async function ensure(env){
 const q=[
 `CREATE TABLE IF NOT EXISTS crm_cases(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,contact_id INTEGER,account_id INTEGER,subject TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',priority TEXT NOT NULL DEFAULT 'normal',channel TEXT NOT NULL DEFAULT '',owner_user_id TEXT NOT NULL DEFAULT '',sla_due_at INTEGER,resolved_at INTEGER,description TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_quotes(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,deal_id INTEGER,contact_id INTEGER,account_id INTEGER,quote_number TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',currency TEXT NOT NULL DEFAULT 'USD',subtotal REAL NOT NULL DEFAULT 0,discount REAL NOT NULL DEFAULT 0,tax REAL NOT NULL DEFAULT 0,total REAL NOT NULL DEFAULT 0,valid_until INTEGER,approval_status TEXT NOT NULL DEFAULT 'not_required',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,quote_number))`,
 `CREATE TABLE IF NOT EXISTS crm_quote_items(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,quote_id TEXT NOT NULL,name TEXT NOT NULL,sku TEXT NOT NULL DEFAULT '',quantity REAL NOT NULL DEFAULT 1,unit_price REAL NOT NULL DEFAULT 0,discount REAL NOT NULL DEFAULT 0,total REAL NOT NULL DEFAULT 0,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_campaigns(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',channel TEXT NOT NULL DEFAULT '',budget REAL NOT NULL DEFAULT 0,start_at INTEGER,end_at INTEGER,utm_source TEXT NOT NULL DEFAULT '',utm_medium TEXT NOT NULL DEFAULT '',utm_campaign TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_campaign_touches(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,campaign_id TEXT NOT NULL,contact_id INTEGER NOT NULL,deal_id INTEGER,touch_type TEXT NOT NULL DEFAULT 'engagement',occurred_at INTEGER NOT NULL,value REAL NOT NULL DEFAULT 0,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_territories(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,owner_user_id TEXT NOT NULL DEFAULT '',criteria_json TEXT NOT NULL DEFAULT '{}',quota REAL NOT NULL DEFAULT 0,period_start INTEGER,period_end INTEGER,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS crm_health_snapshots(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,contact_id INTEGER NOT NULL,health_score REAL NOT NULL DEFAULT 0,risk_level TEXT NOT NULL DEFAULT 'unknown',signals_json TEXT NOT NULL DEFAULT '[]',calculated_at INTEGER NOT NULL)`
 ];
 for(const s of q)await env.DB.prepare(s).run();
 try{await env.DB.prepare("ALTER TABLE crm_contact_preferences ADD COLUMN local_timezone TEXT NOT NULL DEFAULT ''").run()}catch{}
 try{await env.DB.prepare("ALTER TABLE crm_contact_preferences ADD COLUMN quiet_hours_json TEXT NOT NULL DEFAULT '{}'").run()}catch{}
 for(const s of [
  'CREATE INDEX IF NOT EXISTS idx_crm_cases_tenant_status ON crm_cases(tenant_id,status,priority)',
  'CREATE INDEX IF NOT EXISTS idx_crm_quotes_tenant_deal ON crm_quotes(tenant_id,deal_id,status)',
  'CREATE INDEX IF NOT EXISTS idx_crm_quote_items_quote ON crm_quote_items(tenant_id,quote_id)',
  'CREATE INDEX IF NOT EXISTS idx_crm_campaign_touches_contact ON crm_campaign_touches(tenant_id,contact_id,occurred_at)',
  'CREATE INDEX IF NOT EXISTS idx_crm_territories_tenant ON crm_territories(tenant_id,active)',
  'CREATE INDEX IF NOT EXISTS idx_crm_health_contact ON crm_health_snapshots(tenant_id,contact_id,calculated_at)'
 ])await env.DB.prepare(s).run();
}

async function owned(env,t,table,id){return env.DB.prepare(`SELECT * FROM ${table} WHERE tenant_id=? AND id=?`).bind(t,id).first()}
async function audit(env,user,action,detail={}){
 try{await env.DB.prepare('INSERT INTO magnanimous_ops_activity(tenant_id,user_id,workspace_id,board_id,record_id,action,detail_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(tenant(user),String(user.id||''),'','','',action,JSON.stringify(detail).slice(0,16000),now()).run()}catch{}
}
function quoteTotals(items=[],discount=0,tax=0){
 let subtotal=0;const normalized=items.slice(0,100).map(x=>{const quantity=Math.max(0,Number(x.quantity||1)),unit_price=Math.max(0,Number(x.unit_price||0)),lineDiscount=Math.max(0,Math.min(100,Number(x.discount||0))),total=quantity*unit_price*(1-lineDiscount/100);subtotal+=total;return{name:txt(x.name||'Item',220),sku:txt(x.sku,120),quantity,unit_price,line_discount:lineDiscount,total,metadata:x.metadata||{}}});
 const d=Math.max(0,Math.min(subtotal,Number(discount||0))),taxAmount=Math.max(0,Number(tax||0)),total=Math.max(0,subtotal-d+taxAmount);return{items:normalized,subtotal,discount:d,tax:taxAmount,total};
}
async function predictiveReadiness(env,t){
 const outcomes=await env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN lower(COALESCE(ps.kind,o.stage))='won' THEN 1 ELSE 0 END) won,SUM(CASE WHEN lower(COALESCE(ps.kind,o.stage)) IN ('lost','closed') THEN 1 ELSE 0 END) lost FROM crm_opportunities o LEFT JOIN crm_pipeline_stages ps ON ps.id=o.stage_id AND ps.tenant_id=o.tenant_id WHERE o.tenant_id=?").bind(t).first();
 const contacts=Number((await env.DB.prepare('SELECT COUNT(*) n FROM crm_contacts WHERE tenant_id=?').bind(t).first())?.n||0),won=Number(outcomes?.won||0),lost=Number(outcomes?.lost||0),labeled=won+lost;
 return{contacts,labeled_outcomes:labeled,won,lost,minimum_recommended:200,ready:labeled>=200&&won>=20&&lost>=20,reason:labeled>=200&&won>=20&&lost>=20?'Historical outcomes are sufficient to begin a tenant-specific trained scoring experiment.':'Keep collecting real won/lost outcomes; Magnanimous will not pretend heuristic scoring is a trained predictive model.'};
}
async function healthFor(env,t,contactId){
 const ts=now(),activity=await env.DB.prepare('SELECT COUNT(*) n,MAX(created_at) last FROM crm_activities WHERE tenant_id=? AND contact_id=?').bind(t,contactId).first(),deals=await env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(value),0) value,MAX(updated_at) last FROM crm_opportunities WHERE tenant_id=? AND contact_id=?").bind(t,contactId).first(),cases=await env.DB.prepare("SELECT COUNT(*) n FROM crm_cases WHERE tenant_id=? AND contact_id=? AND status NOT IN ('resolved','closed')").bind(t,contactId).first(),pref=await env.DB.prepare('SELECT * FROM crm_contact_preferences WHERE tenant_id=? AND contact_id=?').bind(t,contactId).first();
 const last=Math.max(Number(activity?.last||0),Number(deals?.last||0)),days=last?Math.floor((ts-last)/86400):999;let score=50;const signals=[];
 if(days<=7){score+=20;signals.push('recent engagement')}else if(days>30){score-=20;signals.push('no recent engagement')}
 if(Number(deals?.value||0)>0){score+=15;signals.push('active commercial value')}
 if(Number(cases?.n||0)>0){score-=15;signals.push('open service case')}
 if(Number(pref?.do_not_contact||0)){score-=20;signals.push('do not contact')}
 score=Math.max(0,Math.min(100,score));const risk=score>=70?'healthy':score>=45?'watch':'at_risk';
 return{contact_id:contactId,health_score:score,risk_level:risk,signals,last_touch_at:last};
}
function communicationPlan(settings={},pref={},base=now()){
 const window=settings.communication_window||{},weekdays=Array.isArray(window.weekdays)&&window.weekdays.length?window.weekdays:[1,2,3,4,5],start=Math.max(0,Math.min(23,Number(window.start_hour??9))),end=Math.max(start+1,Math.min(24,Number(window.end_hour??16)));
 const tz=txt(pref.local_timezone||window.fallback_timezone||'UTC',80)||'UTC';let cursor=new Date(base*1000);
 const parts=d=>{try{return new Intl.DateTimeFormat('en-US',{timeZone:tz,weekday:'short',hour:'numeric',hourCycle:'h23'}).formatToParts(d)}catch{return[]}};
 const dayMap={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
 for(let i=0;i<24*14;i++){const p=parts(cursor),day=dayMap[p.find(x=>x.type==='weekday')?.value]??cursor.getUTCDay(),hour=Number(p.find(x=>x.type==='hour')?.value??cursor.getUTCHours());if(weekdays.includes(day)&&hour>=start&&hour<end)return{eligible_at:Math.floor(cursor.getTime()/1000),timezone:tz,window:{weekdays,start_hour:start,end_hour:end}};cursor=new Date(cursor.getTime()+3600000)}
 return{eligible_at:base,timezone:tz,window:{weekdays,start_hour:start,end_hour:end}};
}
async function overview(env,t){
 const count=async(table,extra='')=>Number((await env.DB.prepare(`SELECT COUNT(*) n FROM ${table} WHERE tenant_id=? ${extra}`).bind(t).first())?.n||0);
 const [open_cases,quotes,campaigns,territories,readiness]=await Promise.all([count('crm_cases',"AND status NOT IN ('resolved','closed')"),count('crm_quotes'),count('crm_campaigns'),count('crm_territories','AND active=1'),predictiveReadiness(env,t)]);
 const healthRows=await env.DB.prepare("SELECT risk_level,COUNT(*) n FROM crm_health_snapshots WHERE tenant_id=? AND calculated_at IN (SELECT MAX(calculated_at) FROM crm_health_snapshots h2 WHERE h2.tenant_id=crm_health_snapshots.tenant_id AND h2.contact_id=crm_health_snapshots.contact_id) GROUP BY risk_level").bind(t).all();
 return{identity:'Magnanimous CRM',activation:'advanced',capabilities:ADVANCED_CRM_CAPABILITIES,metrics:{open_cases,quotes,campaigns,territories},customer_health:Object.fromEntries((healthRows.results||[]).map(x=>[x.risk_level,Number(x.n||0)])),predictive_readiness:readiness};
}

export async function handleAdvancedCrm(request,env,user,body={}){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/operations/crm/'))return null;await ensure(env);const t=tenant(user);if(!t)return json({detail:'Tenant context required.'},403);
 if(url.pathname==='/api/operations/crm/advanced'&&request.method==='GET')return json(await overview(env,t));
 if(url.pathname==='/api/operations/crm/predictive-readiness'&&request.method==='GET')return json(await predictiveReadiness(env,t));
 if(url.pathname==='/api/operations/crm/cases'){
  if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM crm_cases WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 500').bind(t).all();return json({items:r.results||[]})}
  if(request.method==='POST'){const subject=txt(body.subject,240);if(!subject)return json({detail:'Case subject required.'},400);const id=uid(),ts=now(),priority=['low','normal','high','urgent'].includes(body.priority)?body.priority:'normal';await env.DB.prepare('INSERT INTO crm_cases(id,tenant_id,contact_id,account_id,subject,status,priority,channel,owner_user_id,sla_due_at,description,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,t,Number(body.contact_id)||null,Number(body.account_id)||null,subject,'open',priority,txt(body.channel,60),txt(body.owner_user_id||user.id,120),body.sla_due_at?Number(body.sla_due_at):null,txt(body.description),ts,ts).run();await audit(env,user,'crm_case_created',{case_id:id,priority});return json({item:await owned(env,t,'crm_cases',id)},201)}
 }
 if(url.pathname==='/api/operations/crm/quotes'){
  if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM crm_quotes WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 500').bind(t).all();return json({items:r.results||[]})}
  if(request.method==='POST'){const calc=quoteTotals(Array.isArray(body.items)?body.items:[],body.discount,body.tax),qid=uid(),ts=now(),num=txt(body.quote_number||`Q-${String(ts).slice(-8)}-${qid.slice(0,4).toUpperCase()}`,80);await env.DB.prepare('INSERT INTO crm_quotes(id,tenant_id,deal_id,contact_id,account_id,quote_number,status,currency,subtotal,discount,tax,total,valid_until,approval_status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(qid,t,Number(body.deal_id)||null,Number(body.contact_id)||null,Number(body.account_id)||null,num,'draft',txt(body.currency||'USD',12),calc.subtotal,calc.discount,calc.tax,calc.total,body.valid_until?Number(body.valid_until):null,calc.discount>0?'pending':'not_required',txt(body.notes),ts,ts).run();for(const x of calc.items)await env.DB.prepare('INSERT INTO crm_quote_items(id,tenant_id,quote_id,name,sku,quantity,unit_price,discount,total,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(uid(),t,qid,x.name,x.sku,x.quantity,x.unit_price,x.line_discount,x.total,JSON.stringify(x.metadata).slice(0,12000),ts).run();await audit(env,user,'crm_quote_created',{quote_id:qid,total:calc.total});return json({item:await owned(env,t,'crm_quotes',qid),items:calc.items},201)}
 }
 if(url.pathname==='/api/operations/crm/campaigns'){
  if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM crm_campaigns WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 500').bind(t).all();return json({items:r.results||[]})}
  if(request.method==='POST'){const name=txt(body.name,220);if(!name)return json({detail:'Campaign name required.'},400);const id=uid(),ts=now();await env.DB.prepare('INSERT INTO crm_campaigns(id,tenant_id,name,status,channel,budget,start_at,end_at,utm_source,utm_medium,utm_campaign,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,t,name,'active',txt(body.channel,80),Math.max(0,Number(body.budget||0)),body.start_at?Number(body.start_at):null,body.end_at?Number(body.end_at):null,txt(body.utm_source,160),txt(body.utm_medium,160),txt(body.utm_campaign||name,160),ts,ts).run();await audit(env,user,'crm_campaign_created',{campaign_id:id});return json({item:await owned(env,t,'crm_campaigns',id)},201)}
 }
 if(url.pathname==='/api/operations/crm/campaign-touches'&&request.method==='POST'){const cid=txt(body.campaign_id,80),contact=Number(body.contact_id||0);if(!cid||!contact)return json({detail:'campaign_id and contact_id required.'},400);if(!await owned(env,t,'crm_campaigns',cid))return json({detail:'Campaign not found.'},404);const id=uid(),ts=now();await env.DB.prepare('INSERT INTO crm_campaign_touches(id,tenant_id,campaign_id,contact_id,deal_id,touch_type,occurred_at,value,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,t,cid,contact,Number(body.deal_id)||null,txt(body.touch_type||'engagement',80),Number(body.occurred_at||ts),Math.max(0,Number(body.value||0)),JSON.stringify(body.metadata||{}).slice(0,12000),ts).run();return json({id},201)}
 if(url.pathname==='/api/operations/crm/attribution'&&request.method==='GET'){const r=await env.DB.prepare(`SELECT c.id,c.name,c.channel,c.budget,COUNT(t.id) touches,COUNT(DISTINCT t.contact_id) contacts,COALESCE(SUM(t.value),0) attributed_value,MIN(t.occurred_at) first_touch,MAX(t.occurred_at) last_touch FROM crm_campaigns c LEFT JOIN crm_campaign_touches t ON t.campaign_id=c.id AND t.tenant_id=c.tenant_id WHERE c.tenant_id=? GROUP BY c.id ORDER BY attributed_value DESC,touches DESC`).bind(t).all();return json({model:'multi-touch-observed',items:r.results||[]})}
 if(url.pathname==='/api/operations/crm/territories'){
  if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM crm_territories WHERE tenant_id=? ORDER BY active DESC,name').bind(t).all();return json({items:(r.results||[]).map(x=>({...x,criteria:parse(x.criteria_json,{})}))})}
  if(request.method==='POST'){const name=txt(body.name,180);if(!name)return json({detail:'Territory name required.'},400);const id=uid(),ts=now();await env.DB.prepare('INSERT INTO crm_territories(id,tenant_id,name,owner_user_id,criteria_json,quota,period_start,period_end,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,t,name,txt(body.owner_user_id||user.id,120),JSON.stringify(body.criteria||{}).slice(0,16000),Math.max(0,Number(body.quota||0)),body.period_start?Number(body.period_start):null,body.period_end?Number(body.period_end):null,1,ts,ts).run();return json({item:await owned(env,t,'crm_territories',id)},201)}
 }
 if(url.pathname==='/api/operations/crm/customer-health/recalculate'&&request.method==='POST'){const rows=await env.DB.prepare('SELECT id FROM crm_contacts WHERE tenant_id=? ORDER BY id LIMIT 2000').bind(t).all(),ts=now(),items=[];for(const r of rows.results||[]){const h=await healthFor(env,t,Number(r.id));items.push(h);await env.DB.prepare('INSERT INTO crm_health_snapshots(id,tenant_id,contact_id,health_score,risk_level,signals_json,calculated_at) VALUES(?,?,?,?,?,?,?)').bind(uid(),t,h.contact_id,h.health_score,h.risk_level,JSON.stringify(h.signals),ts).run()}await audit(env,user,'crm_customer_health_recalculated',{count:items.length});return json({count:items.length,items})}
 const planMatch=url.pathname.match(/^\/api\/operations\/crm\/sequence-enrollments\/([^/]+)\/communication-plan$/);
 if(planMatch&&request.method==='GET'){const e=await owned(env,t,'crm_sequence_enrollments',planMatch[1]);if(!e)return json({detail:'Enrollment not found.'},404);const s=await owned(env,t,'magnanimous_ops_sequences',e.sequence_id),pref=await env.DB.prepare('SELECT * FROM crm_contact_preferences WHERE tenant_id=? AND contact_id=?').bind(t,e.contact_id).first(),settings=parse(s?.settings_json,{}),plan=communicationPlan(settings,pref||{},Math.max(now(),Number(e.next_due_at||0)));return json({enrollment_id:e.id,contact_id:e.contact_id,permission:{do_not_contact:Boolean(pref?.do_not_contact),email:pref?.email_status||'unknown',sms:pref?.sms_status||'unknown',phone:pref?.phone_status||'unknown',whatsapp:pref?.whatsapp_status||'unknown'},...plan})}
 return null;
}
