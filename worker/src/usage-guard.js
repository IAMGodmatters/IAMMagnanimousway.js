import {PROVIDER_PRICE_MARKUP_PERCENT,variableCustomerCharge} from './provider-origin-pricing.js';
const now=()=>Math.floor(Date.now()/1000);

export const PLAN_LIMITS={
 free:{rank:0,metered_ai:false,pstn_minutes:0,avatar_minutes:0,premium_video_credits:0,cost_ceiling_usd:0},
 plus:{rank:1,metered_ai:false,pstn_minutes:0,avatar_minutes:0,premium_video_credits:0,cost_ceiling_usd:8},
 business:{rank:2,metered_ai:true,pstn_minutes:30,avatar_minutes:10,premium_video_credits:10,cost_ceiling_usd:24},
 pro:{rank:3,metered_ai:true,pstn_minutes:90,avatar_minutes:30,premium_video_credits:30,cost_ceiling_usd:54},
 scale:{rank:4,metered_ai:true,pstn_minutes:180,avatar_minutes:60,premium_video_credits:60,cost_ceiling_usd:112},
 agency:{rank:5,metered_ai:true,pstn_minutes:240,avatar_minutes:90,premium_video_credits:90,cost_ceiling_usd:170,white_label:true,client_subaccounts:25,usage_rebilling:true},
 agency_pro:{rank:6,metered_ai:true,pstn_minutes:360,avatar_minutes:120,premium_video_credits:120,cost_ceiling_usd:280,white_label:true,client_subaccounts:100,usage_rebilling:true}
};

export function normalizePlan(value){const id=String(value||'free').toLowerCase();return PLAN_LIMITS[id]?id:'free'}
export function periodKey(ts=Date.now()){const d=new Date(ts);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`}

function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function hmacHex(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sessionSecret(env){const configured=String(env?.SESSION_SECRET||'').trim();if(configured)return configured;try{const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}catch(_){return''}}

export async function currentUserFromRequest(request,env){
 if(!env?.DB)return null;const raw=request.headers.get('authorization')||'';if(!raw.startsWith('Bearer '))return null;
 const parts=raw.slice(7).split('|');if(parts.length!==5||Number(parts[3])<now())return null;
 const[userId,tenantId,role,exp,sig]=parts,secret=await sessionSecret(env);if(!secret||!safeEqual(sig,await hmacHex(secret,`${userId}|${tenantId}|${role}|${exp}`)))return null;
 try{return await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first()}catch(_){return null}
}

export async function ensureUsageSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_usage_guard (
  tenant_id TEXT NOT NULL,period_key TEXT NOT NULL,direct_variable_cost_usd REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,period_key)
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,period_key TEXT NOT NULL,
  category TEXT NOT NULL,provider TEXT NOT NULL DEFAULT '',units REAL NOT NULL DEFAULT 0,
  direct_cost_usd REAL NOT NULL DEFAULT 0,provider_origin_cost_usd REAL NOT NULL DEFAULT 0,
  markup_usd REAL NOT NULL DEFAULT 0,customer_charge_usd REAL NOT NULL DEFAULT 0,
  pricing_source TEXT NOT NULL DEFAULT '',pricing_verified_at TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL
 )`).run();
 for(const ddl of [
  'ALTER TABLE billing_usage_events ADD COLUMN provider_origin_cost_usd REAL NOT NULL DEFAULT 0',
  'ALTER TABLE billing_usage_events ADD COLUMN markup_usd REAL NOT NULL DEFAULT 0',
  'ALTER TABLE billing_usage_events ADD COLUMN customer_charge_usd REAL NOT NULL DEFAULT 0',
  "ALTER TABLE billing_usage_events ADD COLUMN pricing_source TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE billing_usage_events ADD COLUMN pricing_verified_at TEXT NOT NULL DEFAULT ''"
 ]){try{await env.DB.prepare(ddl).run()}catch(_){}}
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_usage_wallet (
  tenant_id TEXT PRIMARY KEY,balance_usd REAL NOT NULL DEFAULT 0,total_funded_usd REAL NOT NULL DEFAULT 0,
  total_consumed_usd REAL NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_usage_wallet_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,event_type TEXT NOT NULL,amount_usd REAL NOT NULL,
  reference_id TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,
  UNIQUE(tenant_id,event_type,reference_id)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_billing_usage_events_tenant_period ON billing_usage_events(tenant_id,period_key,created_at DESC)').run();
 try{await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_usage_events_idempotent ON billing_usage_events(tenant_id,category,reference_id) WHERE reference_id<>''").run()}catch(_){}
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_usage_wallet_events_tenant ON billing_usage_wallet_events(tenant_id,created_at DESC)').run();
}

export async function tenantPlan(env,tenantId){
 if(!env?.DB||!tenantId)return{plan:'free',limits:PLAN_LIMITS.free,status:'inactive'};
 let row=null;
 try{row=await env.DB.prepare('SELECT plan,status FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first()}catch(_){ }
 if(row){
  const status=String(row.status||'inactive');
  const paidActive=status==='active';
  const plan=paidActive?normalizePlan(row.plan):'free';return{plan,limits:PLAN_LIMITS[plan],status};
 }
 // A historical tenants.plan flag is not proof of successful payment. Preserve
 // the account, but do not let it incur platform-paid provider charges until a
 // Stripe-confirmed billing row exists.
 return{plan:'free',limits:PLAN_LIMITS.free,status:'unverified_legacy'};
}

export async function walletStatus(env,tenantId){
 await ensureUsageSchema(env);const row=await env.DB.prepare('SELECT balance_usd,total_funded_usd,total_consumed_usd,updated_at FROM billing_usage_wallet WHERE tenant_id=?').bind(String(tenantId)).first();
 return{balance_usd:Number(row?.balance_usd||0),total_funded_usd:Number(row?.total_funded_usd||0),total_consumed_usd:Number(row?.total_consumed_usd||0),updated_at:row?.updated_at||null};
}

export async function creditWallet(env,tenantId,amountUsd,{reference_id='',detail='Stripe premium usage top-up'}={}){
 await ensureUsageSchema(env);const amount=Math.max(0,Number(amountUsd||0));if(!tenantId||amount<=0)return walletStatus(env,tenantId);
 const ref=String(reference_id||'');
 try{await env.DB.prepare('INSERT INTO billing_usage_wallet_events(tenant_id,event_type,amount_usd,reference_id,detail,created_at) VALUES(?,?,?,?,?,?)').bind(String(tenantId),'credit',amount,ref,String(detail||''),now()).run()}catch(error){if(String(error?.message||'').toLowerCase().includes('unique'))return walletStatus(env,tenantId);throw error}
 await env.DB.prepare(`INSERT INTO billing_usage_wallet(tenant_id,balance_usd,total_funded_usd,total_consumed_usd,updated_at) VALUES(?,?,?,?,?)
  ON CONFLICT(tenant_id) DO UPDATE SET balance_usd=billing_usage_wallet.balance_usd+excluded.balance_usd,total_funded_usd=billing_usage_wallet.total_funded_usd+excluded.total_funded_usd,updated_at=excluded.updated_at`)
  .bind(String(tenantId),amount,amount,0,now()).run();
 return walletStatus(env,tenantId);
}

export async function debitWallet(env,tenantId,amountUsd,{reference_id='',detail='Premium usage overage'}={}){
 await ensureUsageSchema(env);const amount=Math.max(0,Number(amountUsd||0));if(!tenantId||amount<=0)return walletStatus(env,tenantId);
 const current=await walletStatus(env,tenantId);if(amount>current.balance_usd+1e-9)throw new Error('PREPAID_USAGE_BALANCE_EXHAUSTED');
 const ref=String(reference_id||crypto.randomUUID());
 await env.DB.prepare('INSERT INTO billing_usage_wallet_events(tenant_id,event_type,amount_usd,reference_id,detail,created_at) VALUES(?,?,?,?,?,?)').bind(String(tenantId),'debit',-amount,ref,String(detail||''),now()).run();
 await env.DB.prepare('UPDATE billing_usage_wallet SET balance_usd=MAX(0,balance_usd-?),total_consumed_usd=total_consumed_usd+?,updated_at=? WHERE tenant_id=?').bind(amount,amount,now(),String(tenantId)).run();
 return walletStatus(env,tenantId);
}

export async function usageStatus(env,tenantId){
 await ensureUsageSchema(env);const p=await tenantPlan(env,tenantId);const key=periodKey();
 const [row,wallet]=await Promise.all([
  env.DB.prepare('SELECT direct_variable_cost_usd FROM billing_usage_guard WHERE tenant_id=? AND period_key=?').bind(tenantId,key).first(),
  walletStatus(env,tenantId)
 ]);
 const used=Number(row?.direct_variable_cost_usd||0),ceiling=Number(p.limits.cost_ceiling_usd||0),remainingIncluded=Math.max(0,ceiling-used);
 const prepaidBalance=Number(wallet.balance_usd||0),prepaidOriginCapacity=prepaidBalance/(1+PROVIDER_PRICE_MARKUP_PERCENT/100),originSpendable=remainingIncluded+prepaidOriginCapacity;
 return{...p,period_key:key,direct_variable_cost_usd:used,cost_ceiling_usd:ceiling,remaining_cost_usd:remainingIncluded,prepaid_balance_usd:prepaidBalance,prepaid_provider_origin_capacity_usd:prepaidOriginCapacity,prepaid_total_funded_usd:Number(wallet.total_funded_usd||0),prepaid_total_consumed_usd:Number(wallet.total_consumed_usd||0),premium_spendable_usd:originSpendable,provider_origin_spendable_usd:originSpendable,variable_markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,premium_usage_allowed:p.plan!=='free'&&originSpendable>0};
}

export async function canUsePremium(env,tenantId,{category='premium',estimated_provider_origin_cost_usd=null,estimated_cost_usd=0,required_plan='business',entitlement=''}={}){
 const s=await usageStatus(env,tenantId),required=PLAN_LIMITS[normalizePlan(required_plan)]?.rank??2;
 if((s.limits?.rank??0)<required)return{ok:false,code:'PLAN_REQUIRED',detail:`${required_plan} or higher is required for ${category}.`,...s};
 if(entitlement&&s.limits?.[entitlement]!==true&&Number(s.limits?.[entitlement]||0)<=0)return{ok:false,code:'ENTITLEMENT_REQUIRED',detail:`Your plan does not include ${category}.`,...s};
 const estimatedOrigin=Math.max(0,Number(estimated_provider_origin_cost_usd??estimated_cost_usd??0)||0);
 const overageOrigin=Math.max(0,estimatedOrigin-Number(s.remaining_cost_usd||0));
 const variable=variableCustomerCharge(overageOrigin);
 if(variable.customer_charge_usd>Number(s.prepaid_balance_usd||0)+1e-9)return{
  ok:false,code:'PREMIUM_BUDGET_EXHAUSTED',
  detail:'Your included premium allowance and prepaid usage balance cannot fund this provider-origin reserve plus the disclosed 20% variable markup. Use a free-first option, upgrade, or add prepaid credits.',
  estimated_provider_origin_cost_usd:estimatedOrigin,
  estimated_variable_customer_charge_usd:variable.customer_charge_usd,
  ...s
 };
 return{ok:true,estimated_provider_origin_cost_usd:estimatedOrigin,estimated_variable_customer_charge_usd:variable.customer_charge_usd,...s};
}

export async function recordUsage(env,tenantId,{category='premium',provider='',units=0,provider_origin_cost_usd=null,direct_cost_usd=0,reference_id='',pricing_source='',pricing_verified_at=''}={}){
 if(!env?.DB||!tenantId)return null;
 await ensureUsageSchema(env);
 const key=periodKey(),originCost=Math.max(0,Number(provider_origin_cost_usd??direct_cost_usd??0)||0),ref=String(reference_id||crypto.randomUUID());
 if(reference_id){
  const existing=await env.DB.prepare('SELECT id FROM billing_usage_events WHERE tenant_id=? AND category=? AND reference_id=? LIMIT 1').bind(String(tenantId),String(category),ref).first();
  if(existing)return usageStatus(env,tenantId);
 }
 const before=await usageStatus(env,tenantId);
 const overageOrigin=Math.max(0,originCost-Number(before.remaining_cost_usd||0));
 const variable=variableCustomerCharge(overageOrigin);
 if(variable.customer_charge_usd>0){
  await debitWallet(env,tenantId,variable.customer_charge_usd,{reference_id:ref,detail:`${category} variable usage via ${provider||'provider'}: origin $${overageOrigin.toFixed(6)} + 20% markup`});
 }
 await env.DB.prepare(`INSERT INTO billing_usage_events(
  tenant_id,period_key,category,provider,units,direct_cost_usd,provider_origin_cost_usd,markup_usd,customer_charge_usd,pricing_source,pricing_verified_at,reference_id,created_at
 ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
  String(tenantId),key,String(category),String(provider),Number(units||0),originCost,originCost,
  variable.markup_usd,variable.customer_charge_usd,String(pricing_source||''),String(pricing_verified_at||''),ref,now()
 ).run();
 await env.DB.prepare(`INSERT INTO billing_usage_guard(tenant_id,period_key,direct_variable_cost_usd,updated_at) VALUES(?,?,?,?)
  ON CONFLICT(tenant_id,period_key) DO UPDATE SET direct_variable_cost_usd=billing_usage_guard.direct_variable_cost_usd+excluded.direct_variable_cost_usd,updated_at=excluded.updated_at`)
  .bind(String(tenantId),key,originCost,now()).run();
 return usageStatus(env,tenantId);
}

export function estimateAiCostUsd(provider){
 if(String(provider||'').toLowerCase()==='cloudflare-ai')return 0;
 throw new Error('UNVERIFIED_AI_COST_ESTIMATE_DISABLED');
}

export function estimatePstnReserveUsd(seconds=900){
 const minutes=Math.max(1,Math.ceil(Number(seconds||900)/60));
 return Math.min(12,Math.max(0.5,minutes*0.30));
}
