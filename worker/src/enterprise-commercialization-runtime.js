import { currentUser } from './integrations.js';
import { usageStatus, walletStatus } from './usage-guard.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const text=(v,n=6000)=>String(v||'').trim().slice(0,n);
const arr=v=>Array.isArray(v)?v:[];
const num=(v,min=0,max=1e9)=>Math.min(max,Math.max(min,Number(v||0)));
const ACTIVE_CONTRACTS=new Set(['active','signed','implementation']);

const PROVIDERS=[
 {id:'browser-webrtc',category:'voice',name:'Browser WebRTC',cost_model:'free-first',recommended:true,requires:['browser microphone permission'],capabilities:['browser calling','agent-to-agent voice','fallback communications']},
 {id:'cloudflare-ai',category:'ai',name:'Cloudflare Workers AI',cost_model:'free-quota/usage',recommended:true,requires:['Cloudflare AI binding'],capabilities:['chat','summaries','classification','agent assist']},
 {id:'groq',category:'ai',name:'Groq',cost_model:'free-quota/usage',recommended:true,requires:['GROQ_API_KEY'],capabilities:['fast inference','agent assist']},
 {id:'google-gemini',category:'ai',name:'Google Gemini',cost_model:'free-quota/usage',recommended:true,requires:['GEMINI_API_KEY'],capabilities:['reasoning','multimodal','research support']},
 {id:'mistral',category:'ai',name:'Mistral',cost_model:'free-quota/usage',recommended:true,requires:['MISTRAL_API_KEY'],capabilities:['chat','coding','classification']},
 {id:'openai',category:'ai',name:'OpenAI',cost_model:'metered',recommended:false,requires:['OPENAI_API_KEY'],capabilities:['premium reasoning','multimodal','tool orchestration']},
 {id:'anthropic',category:'ai',name:'Anthropic',cost_model:'metered',recommended:false,requires:['ANTHROPIC_API_KEY'],capabilities:['premium reasoning','long-context analysis']},
 {id:'twilio',category:'telephony',name:'Twilio Voice',cost_model:'metered',recommended:true,requires:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN'],capabilities:['PSTN','IVR','queues','browser softphone','recording when enabled']},
 {id:'telnyx',category:'telephony',name:'Telnyx',cost_model:'metered',recommended:true,requires:['TELNYX_API_KEY'],capabilities:['PSTN','SIP','BYOC alternative']},
 {id:'sip-byoc',category:'telephony',name:'SIP / BYOC',cost_model:'customer-carrier',recommended:true,requires:['authorized SIP carrier'],capabilities:['bring your own carrier','enterprise trunks','bank-approved telecom']},
 {id:'browser-video',category:'video',name:'I AM Cinematic Free',cost_model:'free-first',recommended:true,requires:['browser rendering'],capabilities:['text-to-video scenes','motion rendering','free creator fallback']},
 {id:'heygen',category:'video',name:'HeyGen',cost_model:'metered',recommended:false,requires:['HEYGEN_API_KEY'],capabilities:['presenter video','avatars','personalized video']},
 {id:'tavus',category:'video',name:'Tavus',cost_model:'metered',recommended:false,requires:['TAVUS_API_KEY'],capabilities:['real-time avatar','conversational video']},
 {id:'stripe',category:'billing',name:'Stripe',cost_model:'transaction-fees',recommended:true,requires:['Stripe account'],capabilities:['subscriptions','payment links','usage top-ups','quotes','invoices']},
 {id:'hubspot',category:'crm',name:'HubSpot',cost_model:'provider-plan',recommended:false,requires:['authorized HubSpot connection'],capabilities:['CRM sync','deals','companies','contacts']},
 {id:'shopify',category:'commerce',name:'Shopify',cost_model:'provider-plan',recommended:false,requires:['authorized Shopify connection'],capabilities:['merchant support','orders','customers','commerce operations']},
 {id:'google-drive',category:'knowledge',name:'Google Drive',cost_model:'provider-plan',recommended:true,requires:['authorized Google connection'],capabilities:['client knowledge','documents','SOPs','shared files']},
 {id:'notion',category:'knowledge',name:'Notion',cost_model:'provider-plan',recommended:true,requires:['authorized Notion connection'],capabilities:['knowledge base','implementation plans','SOPs']}
];

function configured(env,p){
 const requirements=p.requires||[];
 if(p.id==='browser-webrtc'||p.id==='browser-video'||p.id==='stripe')return true;
 if(p.id==='cloudflare-ai')return Boolean(env.AI);
 if(p.id==='sip-byoc')return Boolean(env.SIP_DOMAIN||env.BYOC_SIP_URI||env.TWILIO_SIP_DOMAIN);
 return requirements.some(k=>Boolean(String(env?.[k]||'').trim()));
}

async function ensure(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS enterprise_accounts (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,industry TEXT NOT NULL DEFAULT '',website TEXT NOT NULL DEFAULT '',primary_contact_name TEXT NOT NULL DEFAULT '',primary_contact_email TEXT NOT NULL DEFAULT '',primary_contact_phone TEXT NOT NULL DEFAULT '',country TEXT NOT NULL DEFAULT '',data_classification TEXT NOT NULL DEFAULT 'standard',security_requirements TEXT NOT NULL DEFAULT '[]',authorized_systems TEXT NOT NULL DEFAULT '[]',status TEXT NOT NULL DEFAULT 'prospect',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS enterprise_contracts (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,account_id TEXT NOT NULL,title TEXT NOT NULL,service_lines TEXT NOT NULL DEFAULT '[]',billing_model TEXT NOT NULL DEFAULT 'monthly-plus-usage',monthly_commitment_usd REAL NOT NULL DEFAULT 0,setup_fee_usd REAL NOT NULL DEFAULT 0,included_usage_usd REAL NOT NULL DEFAULT 0,target_gross_margin_percent REAL NOT NULL DEFAULT 20,payment_terms_days INTEGER NOT NULL DEFAULT 15,start_at INTEGER,end_at INTEGER,renewal_mode TEXT NOT NULL DEFAULT 'manual',security_addendum_required INTEGER NOT NULL DEFAULT 0,data_processing_addendum_required INTEGER NOT NULL DEFAULT 0,stripe_customer_id TEXT,stripe_quote_id TEXT,external_contract_url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS enterprise_opportunities (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,account_id TEXT,name TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'direct',stage TEXT NOT NULL DEFAULT 'identified',estimated_monthly_value_usd REAL NOT NULL DEFAULT 0,estimated_setup_value_usd REAL NOT NULL DEFAULT 0,probability_percent REAL NOT NULL DEFAULT 10,next_action TEXT NOT NULL DEFAULT '',next_action_at INTEGER,owner_user_id TEXT,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS enterprise_revenue_events (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,account_id TEXT,contract_id TEXT,event_type TEXT NOT NULL,amount_usd REAL NOT NULL DEFAULT 0,source TEXT NOT NULL DEFAULT '',reference_id TEXT NOT NULL DEFAULT '',occurred_at INTEGER NOT NULL,UNIQUE(tenant_id,event_type,reference_id))`
 ];
 for(const q of statements)await env.DB.prepare(q).run();
}
function parseList(v){try{return JSON.parse(v||'[]')}catch{return[]}}
async function summary(env,tenant){
 const [accounts,contracts,opps,revenue,usage,wallet]=await Promise.all([
  env.DB.prepare("SELECT COUNT(*) n FROM enterprise_accounts WHERE tenant_id=? AND status NOT IN ('lost','inactive')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(monthly_commitment_usd),0) mrr FROM enterprise_contracts WHERE tenant_id=? AND status IN ('active','signed','implementation')").bind(tenant).first(),
  env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM((estimated_monthly_value_usd*12+estimated_setup_value_usd)*(probability_percent/100.0)),0) weighted FROM enterprise_opportunities WHERE tenant_id=? AND stage NOT IN ('won','lost')").bind(tenant).first(),
  env.DB.prepare("SELECT COALESCE(SUM(amount_usd),0) total FROM enterprise_revenue_events WHERE tenant_id=? AND occurred_at>=?").bind(tenant,now()-86400*30).first(),
  usageStatus(env,tenant),walletStatus(env,tenant)
 ]);
 return{accounts:Number(accounts?.n||0),active_contracts:Number(contracts?.n||0),contracted_mrr_usd:Number(contracts?.mrr||0),open_opportunities:Number(opps?.n||0),weighted_pipeline_usd:Number(opps?.weighted||0),revenue_30d_usd:Number(revenue?.total||0),usage,wallet};
}

export async function handleEnterpriseCommercialization(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/enterprise'))return null;if(!env?.DB)return json({detail:'Enterprise database is unavailable.'},503);
 try{
  await ensure(env);const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Enterprise Command.'},401);const tenant=String(user.tenant_id),owner=user.role==='owner';
  if(request.method==='GET'&&url.pathname==='/api/enterprise/overview')return json({ok:true,...await summary(env,tenant),topup_configured:Boolean(String(env.STRIPE_PAYMENT_LINK_USAGE_TOPUP||'').trim())});
  if(request.method==='GET'&&url.pathname==='/api/enterprise/providers')return json({providers:PROVIDERS.map(p=>({...p,configured:configured(env,p)})),principle:'Free-first by default; customer-funded or customer-provided infrastructure for metered enterprise services.'});
  if(request.method==='GET'&&url.pathname==='/api/enterprise/accounts'){const{results=[]}=await env.DB.prepare('SELECT * FROM enterprise_accounts WHERE tenant_id=? ORDER BY status,name').bind(tenant).all();return json({accounts:results.map(x=>({...x,security_requirements:parseList(x.security_requirements),authorized_systems:parseList(x.authorized_systems)}))})}
  if(request.method==='POST'&&url.pathname==='/api/enterprise/accounts'){
   if(!owner)return json({detail:'Owner access required.'},403);const b=await request.json().catch(()=>({})),name=text(b.name,180);if(!name)return json({detail:'Account name is required.'},400);const id=crypto.randomUUID(),ts=now();
   await env.DB.prepare('INSERT INTO enterprise_accounts(id,tenant_id,name,industry,website,primary_contact_name,primary_contact_email,primary_contact_phone,country,data_classification,security_requirements,authorized_systems,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,name,text(b.industry,120),text(b.website,300),text(b.primary_contact_name,180),text(b.primary_contact_email,200),text(b.primary_contact_phone,80),text(b.country,100),text(b.data_classification||'standard',50),JSON.stringify(arr(b.security_requirements).map(x=>text(x,120)).filter(Boolean)),JSON.stringify(arr(b.authorized_systems).map(x=>text(x,160)).filter(Boolean)),text(b.status||'prospect',40),text(b.notes),ts,ts).run();return json({id},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/enterprise/contracts'){const{results=[]}=await env.DB.prepare('SELECT c.*,a.name account_name FROM enterprise_contracts c JOIN enterprise_accounts a ON a.id=c.account_id WHERE c.tenant_id=? ORDER BY c.updated_at DESC').bind(tenant).all();return json({contracts:results.map(x=>({...x,service_lines:parseList(x.service_lines)}))})}
  if(request.method==='POST'&&url.pathname==='/api/enterprise/contracts'){
   if(!owner)return json({detail:'Owner access required.'},403);const b=await request.json().catch(()=>({})),account=await env.DB.prepare('SELECT id FROM enterprise_accounts WHERE id=? AND tenant_id=?').bind(String(b.account_id||''),tenant).first();if(!account)return json({detail:'Choose a valid enterprise account.'},400);const title=text(b.title,220);if(!title)return json({detail:'Contract title is required.'},400);const id=crypto.randomUUID(),ts=now();
   await env.DB.prepare('INSERT INTO enterprise_contracts(id,tenant_id,account_id,title,service_lines,billing_model,monthly_commitment_usd,setup_fee_usd,included_usage_usd,target_gross_margin_percent,payment_terms_days,start_at,end_at,renewal_mode,security_addendum_required,data_processing_addendum_required,stripe_customer_id,stripe_quote_id,external_contract_url,status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,account.id,title,JSON.stringify(arr(b.service_lines).map(x=>text(x,100)).filter(Boolean)),text(b.billing_model||'monthly-plus-usage',60),num(b.monthly_commitment_usd),num(b.setup_fee_usd),num(b.included_usage_usd),num(b.target_gross_margin_percent||20,20,95),num(b.payment_terms_days||15,0,120),b.start_at?Number(b.start_at):null,b.end_at?Number(b.end_at):null,text(b.renewal_mode||'manual',40),b.security_addendum_required?1:0,b.data_processing_addendum_required?1:0,text(b.stripe_customer_id,120)||null,text(b.stripe_quote_id,120)||null,text(b.external_contract_url,800),text(b.status||'draft',40),text(b.notes),ts,ts).run();return json({id},201)
  }
  const contractMatch=url.pathname.match(/^\/api\/enterprise\/contracts\/([^/]+)$/);if(contractMatch&&request.method==='PUT'){
   if(!owner)return json({detail:'Owner access required.'},403);const old=await env.DB.prepare('SELECT * FROM enterprise_contracts WHERE id=? AND tenant_id=?').bind(contractMatch[1],tenant).first();if(!old)return json({detail:'Contract not found.'},404);const b=await request.json().catch(()=>({}));const status=text(b.status||old.status,40);
   await env.DB.prepare('UPDATE enterprise_contracts SET status=?,stripe_customer_id=?,stripe_quote_id=?,external_contract_url=?,notes=?,updated_at=? WHERE id=? AND tenant_id=?').bind(status,b.stripe_customer_id===undefined?old.stripe_customer_id:text(b.stripe_customer_id,120)||null,b.stripe_quote_id===undefined?old.stripe_quote_id:text(b.stripe_quote_id,120)||null,b.external_contract_url===undefined?old.external_contract_url:text(b.external_contract_url,800),b.notes===undefined?old.notes:text(b.notes),now(),old.id,tenant).run();return json({ok:true,status})
  }
  if(request.method==='GET'&&url.pathname==='/api/enterprise/opportunities'){const{results=[]}=await env.DB.prepare('SELECT o.*,a.name account_name FROM enterprise_opportunities o LEFT JOIN enterprise_accounts a ON a.id=o.account_id WHERE o.tenant_id=? ORDER BY CASE o.stage WHEN \'proposal\' THEN 0 WHEN \'qualified\' THEN 1 WHEN \'discovery\' THEN 2 ELSE 3 END,o.next_action_at').bind(tenant).all();return json({opportunities:results})}
  if(request.method==='POST'&&url.pathname==='/api/enterprise/opportunities'){
   if(!owner)return json({detail:'Owner access required.'},403);const b=await request.json().catch(()=>({})),name=text(b.name,220);if(!name)return json({detail:'Opportunity name is required.'},400);const id=crypto.randomUUID(),ts=now();
   await env.DB.prepare('INSERT INTO enterprise_opportunities(id,tenant_id,account_id,name,source,stage,estimated_monthly_value_usd,estimated_setup_value_usd,probability_percent,next_action,next_action_at,owner_user_id,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,b.account_id?String(b.account_id):null,name,text(b.source||'direct',80),text(b.stage||'identified',40),num(b.estimated_monthly_value_usd),num(b.estimated_setup_value_usd),num(b.probability_percent||10,0,100),text(b.next_action,500),b.next_action_at?Number(b.next_action_at):null,String(b.owner_user_id||user.id),text(b.notes),ts,ts).run();return json({id},201)
  }
  if(request.method==='GET'&&url.pathname==='/api/enterprise/usage-wallet'){const s=await usageStatus(env,tenant);const{results=[]}=await env.DB.prepare('SELECT * FROM billing_usage_wallet_events WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100').bind(tenant).all();return json({status:s,events:results})}
  if(request.method==='POST'&&url.pathname==='/api/enterprise/usage-wallet/topup'){
   const base=String(env.STRIPE_PAYMENT_LINK_USAGE_TOPUP||'').trim();if(!base)return json({detail:'Premium usage top-up checkout is not configured.'},503);const link=new URL(base);link.searchParams.set('client_reference_id',tenant);return json({url:link.toString(),min_usd:10,max_usd:1000,purpose:'prepaid-premium-usage'});
  }
  if(request.method==='GET'&&url.pathname==='/api/enterprise/revenue'){const{results=[]}=await env.DB.prepare('SELECT * FROM enterprise_revenue_events WHERE tenant_id=? ORDER BY occurred_at DESC LIMIT 250').bind(tenant).all();const s=await summary(env,tenant);return json({events:results,summary:s})}
  return json({detail:'Enterprise endpoint not found.'},404);
 }catch(error){console.error('enterprise commercialization error',error);return json({detail:error?.message||'Enterprise commercialization error.'},500)}
}
