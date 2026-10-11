import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { requirePlatformOwner } from './platform-owner-guard.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionRe=/^cs_[A-Za-z0-9_]+$/;
const publicOrderRe=/^[A-Za-z0-9_-]{8,80}$/;

function siteOrigin(request,env){
 return String(env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'')||new URL(request.url).origin;
}
function cleanCountry(value){const v=String(value||'').trim().toUpperCase();return /^[A-Z]{2}$/.test(v)?v:''}
function allowedCountries(env){
 const configured=String(env.STORE_ALLOWED_COUNTRIES||'').split(',').map(cleanCountry).filter(Boolean);
 return [...new Set(configured.length?configured:['PH','US'])].slice(0,20);
}
async function stripeRequest(env,path,options={}){
 if(!String(env.STRIPE_SECRET_KEY||'').trim())return{ok:false,status:503,data:{error:{message:'Secure checkout is not configured.'}}};
 const response=await fetch(`https://api.stripe.com/v1/${path}`,{...options,headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(options.headers||{})}});
 return{ok:response.ok,status:response.status,data:await response.json().catch(()=>({}))};
}
function money(value,currency='PHP'){
 return new Intl.NumberFormat('en-PH',{style:'currency',currency:String(currency||'PHP').toUpperCase()}).format(Number(value||0)/100);
}
function publicProduct(row){
 return{
  id:String(row.id),slug:String(row.slug),title:String(row.title),description:String(row.description||''),category:String(row.category||''),
  price_cents:Number(row.price_cents||0),currency:String(row.currency||'PHP'),image_url:String(row.image_url||''),featured:Boolean(row.featured),
  available:row.stock_qty==null||Number(row.stock_qty)>0,stock_qty:row.stock_qty==null?null:Math.max(0,Number(row.stock_qty||0))
 };
}
async function listProducts(env){
 const {results=[]}=await env.DB.prepare('SELECT id,slug,title,description,category,price_cents,currency,image_url,featured,stock_qty FROM store_products WHERE active=1 ORDER BY featured DESC, updated_at DESC, title ASC').all();
 return json({store:'Magnanimous Store',brand:'God Matters • I AM MAGNANIMOUS WAY™',currency:'PHP',products:results.map(publicProduct),dropshipping:true,supplier_auto_spend:false});
}
function normalizedCart(body){
 const raw=Array.isArray(body?.items)?body.items:[],merged=new Map();
 for(const entry of raw.slice(0,30)){
  const id=String(entry?.product_id||'').trim(),quantity=Math.min(10,Math.max(1,Math.trunc(Number(entry?.quantity||1))));
  if(!id)continue;merged.set(id,Math.min(10,(merged.get(id)||0)+quantity));
 }
 return[...merged.entries()].slice(0,20).map(([product_id,quantity])=>({product_id,quantity}));
}
async function loadCartProducts(env,cart){
 if(!cart.length)return[];
 const placeholders=cart.map(()=>'?').join(','),ids=cart.map(x=>x.product_id);
 const {results=[]}=await env.DB.prepare(`SELECT * FROM store_products WHERE active=1 AND id IN (${placeholders})`).bind(...ids).all();
 const rows=new Map(results.map(x=>[String(x.id),x]));
 return cart.map(item=>({row:rows.get(item.product_id),quantity:item.quantity}));
}
async function createCheckout(request,env){
 const body=await request.json().catch(()=>({})),cart=normalizedCart(body);
 if(!cart.length)return json({detail:'Add at least one product to your cart.'},400);
 const loaded=await loadCartProducts(env,cart);
 if(loaded.some(x=>!x.row))return json({detail:'One or more products are no longer available. Refresh the shop and try again.'},409);
 if(loaded.some(x=>x.row.stock_qty!=null&&Number(x.row.stock_qty)<x.quantity))return json({detail:'One or more products do not have enough available stock.'},409);
 const currencies=[...new Set(loaded.map(x=>String(x.row.currency||'PHP').toUpperCase()))];
 if(currencies.length!==1)return json({detail:'This cart contains products with incompatible currencies.'},409);
 const currency=currencies[0],amount=loaded.reduce((sum,x)=>sum+Number(x.row.price_cents||0)*x.quantity,0);
 if(!Number.isSafeInteger(amount)||amount<=0)return json({detail:'The cart total is invalid.'},400);
 const orderId=crypto.randomUUID(),publicId=`MW-${crypto.randomUUID().split('-')[0].toUpperCase()}`,ts=now(),email=emailRe.test(String(body.email||'').trim())?String(body.email).trim():'';
 const writes=[env.DB.prepare("INSERT INTO store_orders(id,public_id,customer_email,amount_cents,currency,status,fulfillment_status,created_at,updated_at) VALUES(?,?,?,?,?,'pending','not_ready',?,?)").bind(orderId,publicId,email,amount,currency,ts,ts)];
 for(const item of loaded){
  const p=item.row;
  writes.push(env.DB.prepare('INSERT INTO store_order_items(id,order_id,product_id,title_snapshot,unit_price_cents,quantity,supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku,supplier_cost_cents,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(crypto.randomUUID(),orderId,String(p.id),String(p.title),Number(p.price_cents),item.quantity,String(p.supplier_provider||''),String(p.supplier_product_id||''),String(p.supplier_variant_id||''),String(p.supplier_sku||''),null,ts));
 }
 await env.DB.batch(writes);

 const runtimeEnv=String(env.STRIPE_SECRET_KEY||'').trim()?env:await getProviderRuntimeEnv(env),form=new URLSearchParams(),origin=siteOrigin(request,runtimeEnv);
 form.set('mode','payment');
 form.set('billing_address_collection','required');
 if(email)form.set('customer_email',email);
 allowedCountries(runtimeEnv).forEach((country,i)=>form.set(`shipping_address_collection[allowed_countries][${i}]`,country));
 loaded.forEach((item,i)=>{
  form.set(`line_items[${i}][price_data][currency]`,currency.toLowerCase());
  form.set(`line_items[${i}][price_data][product_data][name]`,String(item.row.title).slice(0,120));
  form.set(`line_items[${i}][price_data][unit_amount]`,String(item.row.price_cents));
  form.set(`line_items[${i}][quantity]`,String(item.quantity));
 });
 form.set('metadata[product_type]','magnanimous_store_order');
 form.set('metadata[store_order_id]',orderId);
 form.set('metadata[store_order_public_id]',publicId);
 form.set('success_url',`${origin}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(publicId)}`);
 form.set('cancel_url',`${origin}/shop?checkout=cancelled`);
 const {ok,status,data}=await stripeRequest(runtimeEnv,'checkout/sessions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString()});
 if(!ok||!data?.url){
  await env.DB.prepare("UPDATE store_orders SET status='checkout_error',updated_at=? WHERE id=?").bind(now(),orderId).run();
  return json({detail:data?.error?.message||'Secure checkout could not be created.'},status||502);
 }
 await env.DB.prepare("UPDATE store_orders SET stripe_session_id=?,status='checkout_created',updated_at=? WHERE id=?").bind(String(data.id||''),now(),orderId).run();
 return json({url:data.url,session_id:data.id,order:publicId,total:money(amount,currency),amount_cents:amount,currency});
}
function extractShipping(object){
 const shipping=object?.shipping_details||{},address=shipping?.address||object?.customer_details?.address||{};
 return{
  name:String(shipping?.name||object?.customer_details?.name||''),phone:String(object?.customer_details?.phone||''),
  address:{line1:String(address.line1||''),line2:String(address.line2||''),city:String(address.city||''),state:String(address.state||''),postal_code:String(address.postal_code||''),country:String(address.country||'')}
 };
}
async function markStoreOrderPaid(env,object){
 const orderId=String(object?.metadata?.store_order_id||'').trim(),publicId=String(object?.metadata?.store_order_public_id||'').trim();
 if(!orderId||!publicId)return false;
 const order=await env.DB.prepare('SELECT * FROM store_orders WHERE id=? AND public_id=?').bind(orderId,publicId).first();
 if(!order)return true;
 const paid=['paid','no_payment_required'].includes(String(object?.payment_status||'').toLowerCase())&&String(object?.status||'')==='complete';
 if(!paid)return true;
 const paidAmount=Number(object?.amount_total||0),paidCurrency=String(object?.currency||'').toUpperCase();
 if(paidAmount!==Number(order.amount_cents)||paidCurrency!==String(order.currency).toUpperCase()){
  await env.DB.prepare("UPDATE store_orders SET status='payment_review',fulfillment_status='not_ready',updated_at=? WHERE id=?").bind(now(),orderId).run();return true;
 }
 const {results:items=[]}=await env.DB.prepare('SELECT supplier_provider,supplier_product_id,supplier_variant_id,supplier_sku FROM store_order_items WHERE order_id=?').bind(orderId).all();
 const mapped=items.length>0&&items.every(x=>String(x.supplier_provider||'').trim()&&String(x.supplier_product_id||'').trim()&&String(x.supplier_variant_id||'').trim());
 const providers=[...new Set(items.map(x=>String(x.supplier_provider||'').trim()).filter(Boolean))],provider=providers.length===1?providers[0]:(providers.length>1?'multi':'');
 const jobStatus=mapped?'awaiting_supplier_activation':'awaiting_supplier_mapping',ts=now();
 await env.DB.batch([
  env.DB.prepare("UPDATE store_orders SET status='paid',fulfillment_status='queued',stripe_session_id=?,payment_intent_id=?,customer_email=?,shipping_json=?,paid_at=COALESCE(paid_at,?),updated_at=? WHERE id=?")
   .bind(String(object.id||order.stripe_session_id||''),String(object.payment_intent||''),String(object?.customer_details?.email||order.customer_email||''),JSON.stringify(extractShipping(object)),ts,ts,orderId),
  env.DB.prepare(`INSERT INTO store_fulfillment_jobs(id,order_id,provider,status,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET provider=excluded.provider,status=CASE WHEN store_fulfillment_jobs.status IN ('fulfilled','submitted') THEN store_fulfillment_jobs.status ELSE excluded.status END,updated_at=excluded.updated_at`)
   .bind(crypto.randomUUID(),orderId,provider,jobStatus,ts,ts)
 ]);
 return true;
}
export async function handleNativeStoreStripeEvent(env,event){
 const type=String(event?.type||''),object=event?.data?.object||{},kind=String(object?.metadata?.product_type||'');
 if(kind!=='magnanimous_store_order')return false;
 if(type==='checkout.session.completed'||type==='checkout.session.async_payment_succeeded')return markStoreOrderPaid(env,object);
 if(type==='checkout.session.async_payment_failed'){
  const orderId=String(object?.metadata?.store_order_id||'').trim();
  if(orderId)await env.DB.prepare("UPDATE store_orders SET status='payment_failed',fulfillment_status='not_ready',updated_at=? WHERE id=?").bind(now(),orderId).run();
  return true;
 }
 return false;
}
async function orderStatus(request,env){
 const url=new URL(request.url),sessionId=String(url.searchParams.get('session_id')||''),publicId=String(url.searchParams.get('order')||'');
 if(!sessionRe.test(sessionId)||!publicOrderRe.test(publicId))return json({detail:'A valid order confirmation is required.'},400);
 const order=await env.DB.prepare('SELECT id,public_id,stripe_session_id,amount_cents,currency,status,fulfillment_status,created_at,paid_at FROM store_orders WHERE public_id=? AND stripe_session_id=?').bind(publicId,sessionId).first();
 if(!order)return json({detail:'Order not found.'},404);
 if(order.status!=='paid'&&order.status!=='payment_review'){
  const runtimeEnv=String(env.STRIPE_SECRET_KEY||'').trim()?env:await getProviderRuntimeEnv(env),stripe=await stripeRequest(runtimeEnv,`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if(stripe.ok&&String(stripe.data?.metadata?.store_order_id||'')===String(order.id))await markStoreOrderPaid(env,stripe.data);
 }
 const fresh=await env.DB.prepare('SELECT public_id,amount_cents,currency,status,fulfillment_status,created_at,paid_at FROM store_orders WHERE id=?').bind(order.id).first();
 return json({order:fresh.public_id,total:money(fresh.amount_cents,fresh.currency),amount_cents:Number(fresh.amount_cents),currency:fresh.currency,status:fresh.status,fulfillment_status:fresh.fulfillment_status,paid_at:fresh.paid_at||null});
}
async function ownerOrders(request,env){
 const guard=await requirePlatformOwner(request,env);if(guard)return guard;
 const {results:orders=[]}=await env.DB.prepare(`SELECT o.public_id,o.amount_cents,o.currency,o.status,o.fulfillment_status,o.customer_email,o.created_at,o.paid_at,j.provider,j.status AS job_status,j.external_order_id,j.last_error FROM store_orders o LEFT JOIN store_fulfillment_jobs j ON j.order_id=o.id ORDER BY o.created_at DESC LIMIT 100`).all();
 return json({orders,supplier_auto_spend:false,fulfillment_mode:'approval-gated dropshipping'});
}
export async function handleNativeStore(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/store/products'&&request.method==='GET')return listProducts(env);
 if(url.pathname==='/api/store/checkout'&&request.method==='POST')return createCheckout(request,env);
 if(url.pathname==='/api/store/order'&&request.method==='GET')return orderStatus(request,env);
 if(url.pathname==='/api/store/owner/orders'&&request.method==='GET')return ownerOrders(request,env);
 return null;
}
