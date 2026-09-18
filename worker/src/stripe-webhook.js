const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json'}});
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function verify(payload,sig,secret){
 if(!sig||!secret)return false;const parts=Object.fromEntries(sig.split(',').map(x=>x.split('=')));if(!parts.t||!parts.v1)return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=hex(await crypto.subtle.sign('HMAC',key,enc.encode(parts.t+'.'+payload)));
 if(mac.length!==parts.v1.length)return false;let d=0;for(let i=0;i<mac.length;i++)d|=mac.charCodeAt(i)^parts.v1.charCodeAt(i);return d===0;
}
export async function handleStripeWebhook(request,env,path){
 if(path!=='/api/webhooks/stripe'||request.method!=='POST')return null;
 const raw=await request.text();if(!(await verify(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET)))return json({detail:'Invalid Stripe signature'},400);
 const event=JSON.parse(raw);const seen=await env.DB.prepare('SELECT id FROM stripe_events WHERE id=?').bind(event.id).first();if(seen)return json({received:true,duplicate:true});
 const o=event.data?.object||{},md=o.metadata||o.subscription_details?.metadata||{};
 if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
  const uid=String(md.user_id||''),tid=String(md.tenant_id||'');
  if(uid&&tid)await env.DB.prepare(`INSERT INTO music_entitlements(tenant_id,user_id,stripe_customer_id,stripe_subscription_id,stripe_event_id,status,current_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,stripe_event_id=excluded.stripe_event_id,status=excluded.status,current_period_end=excluded.current_period_end,updated_at=excluded.updated_at`).bind(tid,uid,String(o.customer||''),String(o.id||''),event.id,String(o.status||'inactive'),Number(o.current_period_end||0),Math.floor(Date.now()/1000)).run();
 }
 await env.DB.prepare('INSERT INTO stripe_events(id,event_type,processed_at) VALUES(?,?,?)').bind(event.id,event.type,Math.floor(Date.now()/1000)).run();
 return json({received:true});
}
