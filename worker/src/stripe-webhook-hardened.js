const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const ACTIVE=new Set(['active','trialing']);
const PLANS=new Set(['plus','business','pro','scale']);

async function hmacHex(secret,value){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const out=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
function parseSignature(header){const out={t:'',v1:[]};for(const part of String(header||'').split(',')){const[k,...rest]=part.trim().split('='),v=rest.join('=');if(k==='t')out.t=v;if(k==='v1'&&v)out.v1.push(v)}return out}
async function verify(raw,header,secret){const p=parseSignature(header),stamp=Number(p.t);if(!p.t||!p.v1.length||!Number.isFinite(stamp)||Math.abs(now()-stamp)>300)return false;const expected=await hmacHex(secret,`${p.t}.${raw}`);return p.v1.some(v=>safeEqual(v,expected))}
function pricePlan(env,object){
 const map=new Map([[String(env.STRIPE_PRICE_PLUS||''),'plus'],[String(env.STRIPE_PRICE_BUSINESS||''),'business'],[String(env.STRIPE_PRICE_PRO||''),'pro'],[String(env.STRIPE_PRICE_SCALE||''),'scale']]);
 const items=object?.items?.data||[];for(const item of items){const id=String(item?.price?.id||item?.plan?.id||'');if(map.has(id))return map.get(id)}
 const metadata=String(object?.metadata?.plan||'').toLowerCase();return PLANS.has(metadata)?metadata:'';
}
async function ensureSchema(env){
 try{await env.DB.prepare("ALTER TABLE tenants ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'").run()}catch(_){ }
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_subscriptions (tenant_id TEXT PRIMARY KEY,plan TEXT NOT NULL DEFAULT 'free',stripe_customer_id TEXT,stripe_subscription_id TEXT,status TEXT NOT NULL DEFAULT 'inactive',current_period_end INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS billing_webhook_events (event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,processed_at INTEGER NOT NULL)`).run();
}
async function save(env,tenantId,values){
 if(!tenantId)return;const ts=now(),old=await env.DB.prepare('SELECT * FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
 const plan=String(values.plan||old?.plan||'free').toLowerCase();
 await env.DB.prepare(`INSERT INTO billing_subscriptions(tenant_id,plan,stripe_customer_id,stripe_subscription_id,status,current_period_end,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET plan=excluded.plan,stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`)
  .bind(tenantId,plan,values.customer_id??old?.stripe_customer_id??null,values.subscription_id??old?.stripe_subscription_id??null,String(values.status??old?.status??'inactive'),values.current_period_end??old?.current_period_end??null,old?.created_at||ts,ts).run();
 await env.DB.prepare('UPDATE tenants SET plan=? WHERE id=?').bind(plan,tenantId).run();
}
async function resolveTenant(env,object){
 const direct=String(object?.metadata?.tenant_id||object?.client_reference_id||'').trim();if(direct)return direct;
 const sub=String(object?.id||'').startsWith('sub_')?String(object.id):String(object?.subscription||'');if(!sub)return'';
 const row=await env.DB.prepare('SELECT tenant_id FROM billing_subscriptions WHERE stripe_subscription_id=?').bind(sub).first();return String(row?.tenant_id||'')
}
async function processEvent(env,event){
 const type=String(event?.type||''),object=event?.data?.object||{};
 if(type==='checkout.session.completed'){
  const tenantId=await resolveTenant(env,object);if(!tenantId)return;
  const metadataPlan=String(object?.metadata?.plan||'').toLowerCase(),plan=PLANS.has(metadataPlan)?metadataPlan:'business';
  await save(env,tenantId,{plan,customer_id:String(object.customer||'')||null,subscription_id:String(object.subscription||'')||null,status:'active'});return;
 }
 if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(type)){
  const tenantId=await resolveTenant(env,object);if(!tenantId)return;
  const old=await env.DB.prepare('SELECT plan FROM billing_subscriptions WHERE tenant_id=?').bind(tenantId).first();
  const detected=pricePlan(env,object)||String(object?.metadata?.plan||old?.plan||'business').toLowerCase();
  const desired=PLANS.has(detected)?detected:'business',status=String(object.status||(type.endsWith('.deleted')?'canceled':'inactive'));
  const active=ACTIVE.has(status)&&!type.endsWith('.deleted');
  await save(env,tenantId,{plan:active?desired:'free',customer_id:String(object.customer||'')||null,subscription_id:String(object.id||'')||null,status,current_period_end:Number(object.current_period_end||0)||null});
 }
}

export async function handleHardenedStripeWebhook(request,env){
 const url=new URL(request.url);if(url.pathname!=='/api/billing/webhook'||request.method!=='POST')return null;
 const secret=String(env.STRIPE_WEBHOOK_SECRET||'').trim();if(!secret)return null;
 await ensureSchema(env);const raw=await request.text(),signature=request.headers.get('stripe-signature')||'';
 if(!await verify(raw,signature,secret))return json({detail:'Invalid Stripe webhook signature.'},401);
 let event;try{event=JSON.parse(raw)}catch{return json({detail:'Invalid Stripe webhook payload.'},400)}
 const id=String(event?.id||'');if(!id)return json({detail:'Stripe event id is required.'},400);
 if(await env.DB.prepare('SELECT event_id FROM billing_webhook_events WHERE event_id=?').bind(id).first())return json({received:true,duplicate:true});
 await processEvent(env,event);
 await env.DB.prepare('INSERT INTO billing_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)').bind(id,String(event?.type||''),now()).run();
 return json({received:true,hardened:true});
}