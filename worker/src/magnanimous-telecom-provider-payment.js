const clean=value=>String(value??'').trim();
const now=()=>Math.floor(Date.now()/1000);

async function ensureSchema(env){
 const statements=[
  `CREATE TABLE IF NOT EXISTS telecom_provider_quotes (
    id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,created_by TEXT NOT NULL,provider_key TEXT NOT NULL,mode TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 0,requires_programmatic_control INTEGER NOT NULL DEFAULT 0,
    provider_origin_cost_micros INTEGER NOT NULL DEFAULT 0,customer_charge_micros INTEGER NOT NULL DEFAULT 0,
    markup_percent INTEGER NOT NULL DEFAULT 20,currency TEXT NOT NULL DEFAULT 'USD',status TEXT NOT NULL DEFAULT 'quoted',
    expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS telecom_provider_payment_events (
    event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,tenant_id TEXT NOT NULL DEFAULT '',quote_id TEXT NOT NULL DEFAULT '',
    provider_key TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'received',upstream_payment_ref TEXT NOT NULL DEFAULT '',
    detail_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
  )`
 ];
 for(const sql of statements){try{await env.DB.prepare(sql).run()}catch(error){console.error('telecom provider payment schema repair failed',error)}}
}

async function payUpstreamIfConfigured(env,quote){
 const originMicros=Number(quote.provider_origin_cost_micros||0);
 if(originMicros<=0)return {status:'funded_free',reference:''};
 if(clean(env.TELECOM_UPSTREAM_AUTO_PAY_ENABLED).toLowerCase()!=='true')return {status:'customer_paid_upstream_pending',reference:''};
 const endpoint=clean(env.TELECOM_UPSTREAM_BILLING_URL),token=clean(env.TELECOM_UPSTREAM_BILLING_TOKEN);
 if(!endpoint||!token)return {status:'customer_paid_upstream_pending',reference:''};
 let parsed;try{parsed=new URL(endpoint)}catch{return {status:'customer_paid_upstream_manual_review',reference:'',detail:'Invalid upstream billing endpoint.'}}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password)return {status:'customer_paid_upstream_manual_review',reference:'',detail:'Upstream billing endpoint must be credential-free HTTPS.'};
 const maxUsd=Math.max(0,Number(env.TELECOM_UPSTREAM_MAX_AUTO_PAY_USD||0)),amountUsd=originMicros/1_000_000;
 if(!maxUsd||amountUsd>maxUsd)return {status:'customer_paid_upstream_manual_review',reference:''};
 const response=await fetch(parsed.toString(),{
  method:'POST',redirect:'error',
  headers:{authorization:`Bearer ${token}`,'content-type':'application/json','idempotency-key':`magnanimous:telecom-provider:${quote.id}`},
  body:JSON.stringify({quote_id:quote.id,provider_key:quote.provider_key,amount_usd:amountUsd,currency:'USD',tenant_id:quote.tenant_id})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)return {status:'customer_paid_upstream_failed',reference:clean(data?.id||data?.reference),detail:clean(data?.error||data?.detail||`HTTP ${response.status}`)};
 return {status:'upstream_paid',reference:clean(data?.id||data?.reference||data?.payment_id)};
}

async function recordEventOnce(env,{eventId,type,tenantId,quoteId,providerKey='',status,detail={}}){
 try{
  await env.DB.prepare(`INSERT INTO telecom_provider_payment_events(event_id,event_type,tenant_id,quote_id,provider_key,status,detail_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(eventId,type,tenantId,quoteId,providerKey,status,JSON.stringify(detail),now(),now()).run();
  return true;
 }catch{return false}
}

async function settlePaidQuote(env,{eventId,type,tenantId,quote}){
 const alreadySettled=await env.DB.prepare("SELECT event_id,status,upstream_payment_ref FROM telecom_provider_payment_events WHERE quote_id=? AND tenant_id=? AND status IN ('upstream_paid','funded_free') ORDER BY updated_at DESC LIMIT 1").bind(quote.id,tenantId).first().catch(()=>null);
 if(alreadySettled){await env.DB.prepare("UPDATE telecom_provider_quotes SET status='funded' WHERE id=? AND tenant_id=?").bind(quote.id,tenantId).run();return true}
 const existing=await env.DB.prepare('SELECT status FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first().catch(()=>null);
 if(existing&&!['customer_paid_upstream_failed','customer_paid_upstream_pending'].includes(clean(existing.status)))return true;
 if(!existing){const inserted=await recordEventOnce(env,{eventId,type,tenantId,quoteId:quote.id,providerKey:quote.provider_key,status:'customer_paid'});if(!inserted)return true}
 else await env.DB.prepare("UPDATE telecom_provider_payment_events SET status='customer_paid',detail_json='{}',updated_at=? WHERE event_id=?").bind(now(),eventId).run();
 const upstream=await payUpstreamIfConfigured(env,quote);
 await env.DB.prepare('UPDATE telecom_provider_payment_events SET status=?,upstream_payment_ref=?,detail_json=?,updated_at=? WHERE event_id=?').bind(upstream.status,upstream.reference||'',JSON.stringify({detail:upstream.detail||''}),now(),eventId).run();
 await env.DB.prepare('UPDATE telecom_provider_quotes SET status=? WHERE id=? AND tenant_id=?').bind(upstream.status==='upstream_paid'||upstream.status==='funded_free'?'funded':'customer_paid',quote.id,tenantId).run();
 return true;
}

export async function processMagnanimousTelecomProviderStripeEvent(env,event){
 const type=clean(event?.type),object=event?.data?.object||{},metadata=object?.metadata||{};
 if(clean(metadata.product_type)!=='telecom_provider_fallback')return false;
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(type))return false;
 const eventId=clean(event?.id),quoteId=clean(metadata.telecom_quote_id),tenantId=clean(metadata.tenant_id||object.client_reference_id);
 if(!eventId||!quoteId||!tenantId)return true;
 await ensureSchema(env);
 const quote=await env.DB.prepare('SELECT * FROM telecom_provider_quotes WHERE id=? AND tenant_id=?').bind(quoteId,tenantId).first();
 if(!quote){await recordEventOnce(env,{eventId,type,tenantId,quoteId,status:'quote_missing'});return true}

 if(type==='checkout.session.async_payment_failed'){
  const seen=await env.DB.prepare('SELECT event_id FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first();
  if(!seen&&await recordEventOnce(env,{eventId,type,tenantId,quoteId,providerKey:quote.provider_key,status:'payment_failed'}))await env.DB.prepare("UPDATE telecom_provider_quotes SET status='payment_failed' WHERE id=? AND tenant_id=? AND status IN ('checkout_created','checkout_reserving')").bind(quoteId,tenantId).run();
  return true;
 }
 if(type==='checkout.session.expired'){
  const seen=await env.DB.prepare('SELECT event_id FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first();
  if(!seen&&await recordEventOnce(env,{eventId,type,tenantId,quoteId,providerKey:quote.provider_key,status:'checkout_expired'}))await env.DB.prepare("UPDATE telecom_provider_quotes SET status='expired' WHERE id=? AND tenant_id=? AND status IN ('checkout_created','checkout_reserving','quoted')").bind(quoteId,tenantId).run();
  return true;
 }
 if(!['paid','no_payment_required'].includes(clean(object.payment_status)))return true;
 if(Number(quote.expires_at)<=now()){
  const seen=await env.DB.prepare('SELECT event_id FROM telecom_provider_payment_events WHERE event_id=?').bind(eventId).first();
  if(!seen&&await recordEventOnce(env,{eventId,type,tenantId,quoteId,providerKey:quote.provider_key,status:'customer_paid_expired_quote',detail:{manual_review:true}}))await env.DB.prepare("UPDATE telecom_provider_quotes SET status='customer_paid_review_required' WHERE id=? AND tenant_id=?").bind(quoteId,tenantId).run();
  return true;
 }
 if(!['checkout_created','checkout_reserving','customer_paid'].includes(clean(quote.status))&&clean(quote.status)!=='funded'){
  await recordEventOnce(env,{eventId,type,tenantId,quoteId,providerKey:quote.provider_key,status:'unexpected_quote_state',detail:{quote_status:quote.status}});return true;
 }
 if(clean(quote.status)==='funded')return true;
 return settlePaidQuote(env,{eventId,type,tenantId,quote});
}
