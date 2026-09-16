import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const id=prefix=>`${prefix}_${crypto.randomUUID()}`;
const ownerOnly=user=>user?.role==='owner';
const PROVIDER='Magnanimous Telecom';
const BRAIN='Magnanimous AI';
const PLAN_KINDS=new Set(['sim','esim','phone_number','minutes','call_center','bundle']);
const LINE_KINDS=new Set(['voice','mobile','call_center','data','bundle']);

async function ensureSchema(env){
 if(!env?.DB)return;
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_provider_policy (tenant_id TEXT PRIMARY KEY,provider_identity TEXT NOT NULL DEFAULT 'Magnanimous Telecom' CHECK(provider_identity='Magnanimous Telecom'),brain_identity TEXT NOT NULL DEFAULT 'Magnanimous AI' CHECK(brain_identity='Magnanimous AI'),service_model TEXT NOT NULL DEFAULT 'retail_service_provider' CHECK(service_model='retail_service_provider'),white_label_allowed INTEGER NOT NULL DEFAULT 0 CHECK(white_label_allowed=0),reseller_allowed INTEGER NOT NULL DEFAULT 0 CHECK(reseller_allowed=0),subcarrier_allowed INTEGER NOT NULL DEFAULT 0 CHECK(subcarrier_allowed=0),customer_number_resale_allowed INTEGER NOT NULL DEFAULT 0 CHECK(customer_number_resale_allowed=0),external_provider_brand_override_allowed INTEGER NOT NULL DEFAULT 0 CHECK(external_provider_brand_override_allowed=0),customer_number_assignment_only INTEGER NOT NULL DEFAULT 1 CHECK(customer_number_assignment_only=1),updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_retail_plans (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,plan_kind TEXT NOT NULL DEFAULT 'bundle' CHECK(plan_kind IN ('sim','esim','phone_number','minutes','call_center','bundle')),description TEXT NOT NULL DEFAULT '',monthly_price REAL NOT NULL DEFAULT 0 CHECK(monthly_price>=0),currency TEXT NOT NULL DEFAULT 'USD',activation_fee REAL NOT NULL DEFAULT 0 CHECK(activation_fee>=0),included_minutes REAL NOT NULL DEFAULT 0 CHECK(included_minutes>=0),included_sms INTEGER NOT NULL DEFAULT 0 CHECK(included_sms>=0),included_data_mb INTEGER NOT NULL DEFAULT 0 CHECK(included_data_mb>=0),included_numbers INTEGER NOT NULL DEFAULT 0 CHECK(included_numbers>=0),included_sims INTEGER NOT NULL DEFAULT 0 CHECK(included_sims>=0),overage_per_minute REAL NOT NULL DEFAULT 0 CHECK(overage_per_minute>=0),overage_per_sms REAL NOT NULL DEFAULT 0 CHECK(overage_per_sms>=0),overage_per_mb REAL NOT NULL DEFAULT 0 CHECK(overage_per_mb>=0),status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','retired')),features_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_customer_lines (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,customer_id TEXT NOT NULL,plan_id TEXT NOT NULL,number_id TEXT,sim_id TEXT,line_label TEXT NOT NULL DEFAULT '',line_kind TEXT NOT NULL DEFAULT 'voice' CHECK(line_kind IN ('voice','mobile','call_center','data','bundle')),service_role TEXT NOT NULL DEFAULT 'customer' CHECK(service_role IN ('customer','business_customer')),provider_identity TEXT NOT NULL DEFAULT 'Magnanimous Telecom' CHECK(provider_identity='Magnanimous Telecom'),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','cancelled')),billing_cycle_day INTEGER NOT NULL DEFAULT 1 CHECK(billing_cycle_day BETWEEN 1 AND 28),started_at INTEGER,renews_at INTEGER,suspended_at INTEGER,ended_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS telecom_usage_cycles (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,line_id TEXT NOT NULL,cycle_start INTEGER NOT NULL,cycle_end INTEGER NOT NULL,included_minutes REAL NOT NULL DEFAULT 0,used_minutes REAL NOT NULL DEFAULT 0,included_sms INTEGER NOT NULL DEFAULT 0,used_sms INTEGER NOT NULL DEFAULT 0,included_data_mb INTEGER NOT NULL DEFAULT 0,used_data_mb INTEGER NOT NULL DEFAULT 0,overage_amount REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','invoiced')),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,line_id,cycle_start,cycle_end))`,
  `CREATE TABLE IF NOT EXISTS telecom_policy_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_user_id TEXT NOT NULL DEFAULT '',event_type TEXT NOT NULL,attempted_mode TEXT NOT NULL DEFAULT '',detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL)`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom retail schema repair failed',error)}}
}

async function ensurePolicy(env,tenant){
 await env.DB.prepare(`INSERT OR IGNORE INTO telecom_provider_policy(tenant_id,provider_identity,brain_identity,service_model,white_label_allowed,reseller_allowed,subcarrier_allowed,customer_number_resale_allowed,external_provider_brand_override_allowed,customer_number_assignment_only,updated_at) VALUES(?,?,?,'retail_service_provider',0,0,0,0,0,1,?)`).bind(tenant,PROVIDER,BRAIN,now()).run();
}

async function policyEvent(env,tenant,user,eventType,attemptedMode='',detail={}){
 try{await env.DB.prepare('INSERT INTO telecom_policy_events(tenant_id,actor_user_id,event_type,attempted_mode,detail_json,created_at) VALUES(?,?,?,?,?,?)').bind(tenant,String(user?.id||user?.user_id||''),eventType,attemptedMode,JSON.stringify(detail||{}),now()).run()}catch(error){console.error('telecom policy event failed',error)}
}

function blockedIntent(body={}){
 const forbidden=['white_label','whitelabel','reseller','resale','subcarrier','sub_carrier','carrier_platform','provider_override','external_brand','provider_name','customer_carrier'];
 for(const key of forbidden){
  const value=body?.[key];
  if(value===true||String(value||'').trim())return key;
 }
 const role=String(body?.service_role||body?.role||'').trim().toLowerCase();
 if(['reseller','carrier','subcarrier','mvno_operator','white_label'].includes(role))return role;
 return '';
}

function number(value,defaultValue=0){const n=Number(value);return Number.isFinite(n)&&n>=0?n:defaultValue}
function integer(value,defaultValue=0){return Math.floor(number(value,defaultValue))}
function cleanCurrency(value){const v=String(value||'USD').trim().toUpperCase();return /^[A-Z]{3}$/.test(v)?v:'USD'}

export async function handleMagnanimousTelecomService(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/telecom/service'))return null;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}});
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to Magnanimous Telecom.'},401);
 await ensureSchema(env);
 const tenant=String(user.tenant_id||'');
 await ensurePolicy(env,tenant);

 if(/\/(white-?label|reseller|sub-?carrier|carrier-platform)(\/|$)/i.test(path)){
  await policyEvent(env,tenant,user,'telecom.service.mode.blocked',path.split('/').pop()||'blocked',{});
  return json({detail:'Magnanimous Telecom is a service provider, not a white-label, reseller, sub-carrier, or customer-owned carrier platform.'},403);
 }

 if(path==='/api/telecom/service/overview'&&request.method==='GET'){
  const [policy,plans,lines,activeLines,usage]=await Promise.all([
   env.DB.prepare('SELECT provider_identity,brain_identity,service_model,white_label_allowed,reseller_allowed,subcarrier_allowed,customer_number_resale_allowed,external_provider_brand_override_allowed,customer_number_assignment_only,updated_at FROM telecom_provider_policy WHERE tenant_id=?').bind(tenant).first(),
   env.DB.prepare("SELECT COUNT(*) n FROM telecom_retail_plans WHERE tenant_id=? AND status='active'").bind(tenant).first(),
   env.DB.prepare('SELECT COUNT(*) n FROM telecom_customer_lines WHERE tenant_id=?').bind(tenant).first(),
   env.DB.prepare("SELECT COUNT(*) n FROM telecom_customer_lines WHERE tenant_id=? AND status='active'").bind(tenant).first(),
   env.DB.prepare("SELECT COALESCE(SUM(used_minutes),0) minutes,COALESCE(SUM(used_sms),0) sms,COALESCE(SUM(used_data_mb),0) data_mb FROM telecom_usage_cycles WHERE tenant_id=? AND status='open'").bind(tenant).first()
  ]);
  return json({
   identity:PROVIDER,brain:BRAIN,service_model:'retail_service_provider',
   policy:policy||{},
   commercial:{active_plans:Number(plans?.n||0),lines:Number(lines?.n||0),active_lines:Number(activeLines?.n||0)},
   current_usage:{minutes:Number(usage?.minutes||0),sms:Number(usage?.sms||0),data_mb:Number(usage?.data_mb||0)},
   sellable_units:['SIM/eSIM line','phone number line','monthly minutes','call-center line','voice/mobile/data bundle'],
   prohibited_modes:['white-label telecom','telecom reseller platform','sub-carrier platform','customer-created phone company','customer resale of assigned numbers']
  });
 }

 if(path==='/api/telecom/service/policy'&&request.method==='GET'){
  const policy=await env.DB.prepare('SELECT provider_identity,brain_identity,service_model,white_label_allowed,reseller_allowed,subcarrier_allowed,customer_number_resale_allowed,external_provider_brand_override_allowed,customer_number_assignment_only,updated_at FROM telecom_provider_policy WHERE tenant_id=?').bind(tenant).first();
  return json({identity:PROVIDER,brain:BRAIN,policy});
 }

 if(path==='/api/telecom/service/plans'&&request.method==='GET'){
  const owner=ownerOnly(user);
  const sql=owner?'SELECT * FROM telecom_retail_plans WHERE tenant_id=? ORDER BY status,name':"SELECT id,name,plan_kind,description,monthly_price,currency,activation_fee,included_minutes,included_sms,included_data_mb,included_numbers,included_sims,overage_per_minute,overage_per_sms,overage_per_mb,features_json FROM telecom_retail_plans WHERE tenant_id=? AND status='active' ORDER BY monthly_price,name";
  const {results}=await env.DB.prepare(sql).bind(tenant).all();
  return json({identity:PROVIDER,service_model:'retail_service_provider',plans:results||[]});
 }

 if(path==='/api/telecom/service/plans'&&request.method==='POST'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const body=await request.json().catch(()=>({}));
  const blocked=blockedIntent(body);if(blocked){await policyEvent(env,tenant,user,'telecom.plan.blocked',blocked,{});return json({detail:'Telecom plans may sell Magnanimous Telecom service only. White-label, reseller, sub-carrier, and alternate-provider plans are prohibited.'},403)}
  const name=String(body.name||'').trim().slice(0,120);if(!name)return json({detail:'Plan name is required.'},400);
  const kind=String(body.plan_kind||'bundle').trim().toLowerCase();if(!PLAN_KINDS.has(kind))return json({detail:'Unsupported plan_kind.'},400);
  const status=String(body.status||'draft').trim().toLowerCase();if(!['draft','active','retired'].includes(status))return json({detail:'Unsupported plan status.'},400);
  const planId=id('plan'),ts=now();
  const values={
   description:String(body.description||'').trim().slice(0,2000),monthly_price:number(body.monthly_price),currency:cleanCurrency(body.currency),activation_fee:number(body.activation_fee),included_minutes:number(body.included_minutes),included_sms:integer(body.included_sms),included_data_mb:integer(body.included_data_mb),included_numbers:integer(body.included_numbers),included_sims:integer(body.included_sims),overage_per_minute:number(body.overage_per_minute),overage_per_sms:number(body.overage_per_sms),overage_per_mb:number(body.overage_per_mb),features:JSON.stringify(body.features||{})
  };
  await env.DB.prepare('INSERT INTO telecom_retail_plans(id,tenant_id,name,plan_kind,description,monthly_price,currency,activation_fee,included_minutes,included_sms,included_data_mb,included_numbers,included_sims,overage_per_minute,overage_per_sms,overage_per_mb,status,features_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(planId,tenant,name,kind,values.description,values.monthly_price,values.currency,values.activation_fee,values.included_minutes,values.included_sms,values.included_data_mb,values.included_numbers,values.included_sims,values.overage_per_minute,values.overage_per_sms,values.overage_per_mb,status,values.features,ts,ts).run();
  await policyEvent(env,tenant,user,'telecom.plan.created','retail_service_provider',{plan_id:planId,plan_kind:kind,status});
  return json({ok:true,id:planId,identity:PROVIDER,name,plan_kind:kind,status},201);
 }

 const planMatch=path.match(/^\/api\/telecom\/service\/plans\/([^/]+)$/);
 if(planMatch&&request.method==='PUT'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const body=await request.json().catch(()=>({}));const blocked=blockedIntent(body);if(blocked){await policyEvent(env,tenant,user,'telecom.plan.blocked',blocked,{plan_id:planMatch[1]});return json({detail:'Magnanimous Telecom cannot be converted into a white-label or reseller telecom product.'},403)}
  const current=await env.DB.prepare('SELECT * FROM telecom_retail_plans WHERE tenant_id=? AND id=?').bind(tenant,planMatch[1]).first();if(!current)return json({detail:'Plan not found.'},404);
  const name=String(body.name??current.name).trim().slice(0,120),kind=String(body.plan_kind??current.plan_kind).trim().toLowerCase(),status=String(body.status??current.status).trim().toLowerCase();
  if(!name||!PLAN_KINDS.has(kind)||!['draft','active','retired'].includes(status))return json({detail:'Invalid plan update.'},400);
  await env.DB.prepare('UPDATE telecom_retail_plans SET name=?,plan_kind=?,description=?,monthly_price=?,currency=?,activation_fee=?,included_minutes=?,included_sms=?,included_data_mb=?,included_numbers=?,included_sims=?,overage_per_minute=?,overage_per_sms=?,overage_per_mb=?,status=?,features_json=?,updated_at=? WHERE tenant_id=? AND id=?').bind(name,kind,String(body.description??current.description).trim().slice(0,2000),number(body.monthly_price,current.monthly_price),cleanCurrency(body.currency??current.currency),number(body.activation_fee,current.activation_fee),number(body.included_minutes,current.included_minutes),integer(body.included_sms,current.included_sms),integer(body.included_data_mb,current.included_data_mb),integer(body.included_numbers,current.included_numbers),integer(body.included_sims,current.included_sims),number(body.overage_per_minute,current.overage_per_minute),number(body.overage_per_sms,current.overage_per_sms),number(body.overage_per_mb,current.overage_per_mb),status,JSON.stringify(body.features??JSON.parse(current.features_json||'{}')),now(),tenant,planMatch[1]).run();
  await policyEvent(env,tenant,user,'telecom.plan.updated','retail_service_provider',{plan_id:planMatch[1],status});
  return json({ok:true,id:planMatch[1],identity:PROVIDER,status});
 }

 if(path==='/api/telecom/service/lines'&&request.method==='GET'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const {results}=await env.DB.prepare('SELECT l.*,p.name plan_name,p.plan_kind,p.monthly_price,p.currency FROM telecom_customer_lines l LEFT JOIN telecom_retail_plans p ON p.id=l.plan_id AND p.tenant_id=l.tenant_id WHERE l.tenant_id=? ORDER BY l.updated_at DESC LIMIT 500').bind(tenant).all();
  return json({identity:PROVIDER,lines:results||[]});
 }

 if(path==='/api/telecom/service/lines'&&request.method==='POST'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const body=await request.json().catch(()=>({}));const blocked=blockedIntent(body);if(blocked){await policyEvent(env,tenant,user,'telecom.line.blocked',blocked,{});return json({detail:'Customer lines are service subscriptions only; reseller/carrier roles are prohibited.'},403)}
  const customerId=String(body.customer_id||'').trim(),planId=String(body.plan_id||'').trim();if(!customerId||!planId)return json({detail:'customer_id and plan_id are required.'},400);
  const plan=await env.DB.prepare("SELECT id,included_minutes,included_sms,included_data_mb,currency,status FROM telecom_retail_plans WHERE tenant_id=? AND id=? AND status='active'").bind(tenant,planId).first();if(!plan)return json({detail:'An active Magnanimous Telecom plan is required.'},409);
  const customer=await env.DB.prepare("SELECT id FROM telecom_customers WHERE tenant_id=? AND id=? AND status NOT IN ('closed','suspended')").bind(tenant,customerId).first();if(!customer)return json({detail:'Active telecom customer not found.'},404);
  const lineKind=String(body.line_kind||'voice').trim().toLowerCase();if(!LINE_KINDS.has(lineKind))return json({detail:'Unsupported line_kind.'},400);
  const billingDay=Math.max(1,Math.min(28,integer(body.billing_cycle_day,1)||1)),ts=now(),lineId=id('line');
  await env.DB.prepare("INSERT INTO telecom_customer_lines(id,tenant_id,customer_id,plan_id,number_id,sim_id,line_label,line_kind,service_role,provider_identity,status,billing_cycle_day,started_at,renews_at,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,'Magnanimous Telecom','pending',?,?,?,?,?,?)").bind(lineId,tenant,customerId,planId,String(body.number_id||'').trim()||null,String(body.sim_id||'').trim()||null,String(body.line_label||'').trim().slice(0,120),lineKind,body.business_customer===true?'business_customer':'customer',billingDay,null,null,JSON.stringify(body.metadata||{}),ts,ts).run();
  await policyEvent(env,tenant,user,'telecom.customer_line.created','customer',{line_id:lineId,plan_id:planId});
  return json({ok:true,id:lineId,provider_identity:PROVIDER,service_role:body.business_customer===true?'business_customer':'customer',status:'pending'},201);
 }

 return json({detail:'Magnanimous Telecom service endpoint not found.'},404);
}
