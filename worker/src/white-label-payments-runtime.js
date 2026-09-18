import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=(v,n=1200)=>String(v??'').trim().slice(0,n);
const owner=u=>['owner','admin'].includes(String(u?.role||'').toLowerCase());
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(v||''));
async function agencyAccess(env,user){if(await isPlatformOwnerUser(env,user))return true;try{const row=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status='active' LIMIT 1").bind(String(user.tenant_id)).first();return['agency','agency_pro'].includes(String(row?.plan||'').toLowerCase())}catch{return false}}
async function stripe(env,path,{method='GET',body=null,account=''}={}){
 if(!env.STRIPE_SECRET_KEY)return{ok:false,status:503,data:{error:{message:'Stripe API access is not configured.'}}};
 const headers={authorization:`Bearer ${env.STRIPE_SECRET_KEY}`};if(account)headers['Stripe-Account']=account;if(body)headers['content-type']='application/x-www-form-urlencoded';
 const r=await fetch(`https://api.stripe.com${path}`,{method,headers,body:body?body.toString():undefined});const d=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data:d};
}
function site(request,env){return String(env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'')||new URL(request.url).origin}
function connectReady(env){return Boolean(env.STRIPE_SECRET_KEY&&env.STRIPE_CONNECT_CLIENT_ID)}
async function connection(env,tenant){return env.DB.prepare('SELECT * FROM agency_payment_connections WHERE tenant_id=? LIMIT 1').bind(tenant).first()}
async function saveConnection(env,tenant,acct){
 const ts=now();await env.DB.prepare(`INSERT INTO agency_payment_connections(tenant_id,stripe_account_id,status,charges_enabled,payouts_enabled,details_submitted,country,default_currency,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(tenant_id) DO UPDATE SET stripe_account_id=excluded.stripe_account_id,status=excluded.status,charges_enabled=excluded.charges_enabled,payouts_enabled=excluded.payouts_enabled,details_submitted=excluded.details_submitted,country=excluded.country,default_currency=excluded.default_currency,updated_at=excluded.updated_at`)
 .bind(tenant,clean(acct.id,100),acct.charges_enabled?'ready':acct.details_submitted?'restricted':'connected',acct.charges_enabled?1:0,acct.payouts_enabled?1:0,acct.details_submitted?1:0,clean(acct.country,10),clean(acct.default_currency,10),ts,ts).run();
 return connection(env,tenant);
}
async function refresh(env,tenant,row){
 if(!row?.stripe_account_id||!env.STRIPE_SECRET_KEY)return row;const r=await stripe(env,`/v1/accounts/${encodeURIComponent(row.stripe_account_id)}`);if(!r.ok)return row;return saveConnection(env,tenant,r.data);
}
function publicConnection(row){return row?{connected:true,account_id:row.stripe_account_id,status:row.status,charges_enabled:Boolean(row.charges_enabled),payouts_enabled:Boolean(row.payouts_enabled),details_submitted:Boolean(row.details_submitted),country:row.country||'',default_currency:row.default_currency||''}:{connected:false,status:'not_started',charges_enabled:false,payouts_enabled:false,details_submitted:false}}
async function oauthCallback(request,env,url){
 const state=clean(url.searchParams.get('state'),160),code=clean(url.searchParams.get('code'),1000),error=clean(url.searchParams.get('error_description')||url.searchParams.get('error'),500),origin=site(request,env);
 if(error)return Response.redirect(`${origin}/white-label/integrations?payments=error&message=${encodeURIComponent(error)}`,302);
 if(!state||!code)return json({detail:'Stripe Connect callback is missing state or authorization code.'},400);
 const row=await env.DB.prepare('SELECT tenant_id,expires_at FROM agency_payment_states WHERE state=? LIMIT 1').bind(state).first();if(!row||Number(row.expires_at||0)<now())return json({detail:'Stripe Connect authorization expired. Start the connection again.'},400);
 if(!connectReady(env))return json({detail:'Stripe Connect is not configured for this platform.'},503);
 const form=new URLSearchParams({client_secret:String(env.STRIPE_SECRET_KEY),code,grant_type:'authorization_code'});
 const r=await fetch('https://connect.stripe.com/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form});const d=await r.json().catch(()=>({}));
 if(!r.ok||!d.stripe_user_id)return Response.redirect(`${origin}/white-label/integrations?payments=error&message=${encodeURIComponent(clean(d.error_description||d.error||'Stripe authorization failed.'))}`,302);
 const acct=await stripe(env,`/v1/accounts/${encodeURIComponent(String(d.stripe_user_id))}`);if(!acct.ok)return json({detail:clean(acct.data?.error?.message||'Connected Stripe account could not be verified.')},502);
 await saveConnection(env,String(row.tenant_id),acct.data);await env.DB.prepare('DELETE FROM agency_payment_states WHERE state=?').bind(state).run();
 return Response.redirect(`${origin}/white-label/integrations?payments=connected`,302);
}
export async function handleWhiteLabelPayments(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/white-label/payments'))return null;if(!env?.DB)return json({detail:'Client payment storage is unavailable.'},503);
 if(url.pathname==='/api/white-label/payments/callback'&&request.method==='GET')return oauthCallback(request,env,url);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);if(!await agencyAccess(env,user))return json({detail:'An active White Label Agency subscription is required.'},402);const tenant=String(user.tenant_id);
 if(url.pathname==='/api/white-label/payments/status'&&request.method==='GET'){
  let row=await connection(env,tenant);row=await refresh(env,tenant,row);return json({stripe_connect_available:connectReady(env),direct_charges:true,merchant_model:'agency connected account is the seller/merchant for its end-client payment',platform_subscription_separate:true,connection:publicConnection(row),requires_owner_authorization:!row?.stripe_account_id});
 }
 if(url.pathname==='/api/white-label/payments/onboard'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);if(!connectReady(env))return json({detail:'Stripe Connect is not enabled/configured for this platform account yet.',code:'STRIPE_CONNECT_NOT_CONFIGURED'},503);
  const state=crypto.randomUUID(),ts=now();await env.DB.prepare('INSERT INTO agency_payment_states(state,tenant_id,created_at,expires_at) VALUES(?,?,?,?)').bind(state,tenant,ts,ts+600).run();
  const redirect=`${new URL(request.url).origin}/api/white-label/payments/callback`,target=new URL('https://connect.stripe.com/oauth/authorize');target.searchParams.set('response_type','code');target.searchParams.set('client_id',String(env.STRIPE_CONNECT_CLIENT_ID));target.searchParams.set('scope','read_write');target.searchParams.set('state',state);target.searchParams.set('redirect_uri',redirect);
  return json({ok:true,onboarding_url:target.toString(),expires_at:ts+600,note:'Stripe-hosted authorization connects the agency owner’s own Stripe account. Magnanimous does not store bank or card credentials.'});
 }
 if(url.pathname==='/api/white-label/payments/connection'&&request.method==='DELETE'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const row=await connection(env,tenant);if(!row?.stripe_account_id){await env.DB.prepare('DELETE FROM agency_payment_connections WHERE tenant_id=?').bind(tenant).run();return json({ok:true,disconnected:true})}
  if(connectReady(env)){const form=new URLSearchParams({client_id:String(env.STRIPE_CONNECT_CLIENT_ID),stripe_user_id:String(row.stripe_account_id)});const r=await fetch('https://connect.stripe.com/oauth/deauthorize',{method:'POST',headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'content-type':'application/x-www-form-urlencoded'},body:form});if(!r.ok){const d=await r.json().catch(()=>({}));return json({detail:clean(d.error_description||d.error||'Stripe connection could not be disconnected.')},502)}}
  await env.DB.prepare('DELETE FROM agency_payment_connections WHERE tenant_id=?').bind(tenant).run();return json({ok:true,disconnected:true});
 }
 if(url.pathname==='/api/white-label/payments/usage-checkout'&&request.method==='POST'){
  if(!owner(user))return json({detail:'Workspace owner or admin access required.'},403);const b=await request.json().catch(()=>({})),usageId=clean(b.usage_id,100);if(!usageId)return json({detail:'Choose a usage rebilling item.'},400);
  let conn=await connection(env,tenant);conn=await refresh(env,tenant,conn);if(!conn?.stripe_account_id||!conn.charges_enabled)return json({detail:'Connect an agency Stripe account and enable charges before collecting client payments.',code:'CONNECTED_ACCOUNT_NOT_READY'},409);
  const usage=await env.DB.prepare('SELECT u.*,c.name client_name,s.billing_email,s.billing_currency FROM agency_usage_rebill u JOIN bpo_clients c ON c.id=u.client_id LEFT JOIN agency_client_settings s ON s.tenant_id=u.tenant_id AND s.client_id=u.client_id WHERE u.id=? AND u.tenant_id=? LIMIT 1').bind(usageId,tenant).first();if(!usage)return json({detail:'Usage rebilling item not found.'},404);if(usage.status==='paid')return json({detail:'This usage item is already marked paid.'},409);
  const customerEmail=clean(b.customer_email||usage.billing_email,254).toLowerCase();if(!validEmail(customerEmail))return json({detail:'Add a valid client billing email before creating checkout.'},400);
  const currency=clean(usage.billing_currency||'usd',10).toLowerCase(),amount=Math.round(Number(usage.customer_charge_usd||0)*100);if(!Number.isInteger(amount)||amount<50)return json({detail:'Client charge must be at least 0.50 in the selected currency.'},400);
  const description=clean(`${usage.client_name} • ${usage.category} • ${usage.period}`,240),recordId=crypto.randomUUID(),form=new URLSearchParams();
  form.set('mode','payment');form.set('line_items[0][price_data][currency]',currency);form.set('line_items[0][price_data][unit_amount]',String(amount));form.set('line_items[0][price_data][product_data][name]',description);form.set('line_items[0][quantity]','1');form.set('customer_email',customerEmail);form.set('client_reference_id',`usage:${usageId}`);form.set('metadata[tenant_id]',tenant);form.set('metadata[client_id]',String(usage.client_id));form.set('metadata[usage_id]',usageId);
  const origin=site(request,env);form.set('success_url',`${origin}/agency-command?tab=billing&client_payment=success&checkout_session={CHECKOUT_SESSION_ID}`);form.set('cancel_url',`${origin}/agency-command?tab=billing&client_payment=cancelled`);
  const r=await stripe(env,'/v1/checkout/sessions',{method:'POST',body:form,account:conn.stripe_account_id});if(!r.ok||!r.data?.id||!r.data?.url)return json({detail:clean(r.data?.error?.message||'Client checkout could not be created.')},r.status>=400&&r.status<500?r.status:502);
  const ts=now();await env.DB.prepare('INSERT INTO agency_client_charge_sessions(id,tenant_id,client_id,usage_id,connected_account_id,stripe_session_id,amount_cents,currency,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(recordId,tenant,usage.client_id,usageId,conn.stripe_account_id,r.data.id,amount,currency,description,'created',ts,ts).run();
  await env.DB.prepare("UPDATE agency_usage_rebill SET status='invoiced',note=CASE WHEN note='' THEN 'Stripe hosted client checkout created.' ELSE note END,updated_at=? WHERE id=? AND tenant_id=? AND status!='paid'").bind(ts,usageId,tenant).run();
  return json({ok:true,checkout_url:r.data.url,session_id:r.data.id,charge_record_id:recordId,amount_cents:amount,currency,merchant:'connected agency account',platform_application_fee_cents:0});
 }
 if(url.pathname==='/api/white-label/payments/confirm'&&request.method==='POST'){
  const b=await request.json().catch(()=>({})),sid=clean(b.session_id,180);const record=await env.DB.prepare('SELECT * FROM agency_client_charge_sessions WHERE tenant_id=? AND stripe_session_id=? LIMIT 1').bind(tenant,sid).first();if(!record)return json({detail:'Client checkout record not found.'},404);
  const r=await stripe(env,`/v1/checkout/sessions/${encodeURIComponent(sid)}`,{account:record.connected_account_id});if(!r.ok)return json({detail:clean(r.data?.error?.message||'Client payment could not be verified.')},502);const paid=String(r.data?.status||'')==='complete'&&String(r.data?.payment_status||'')==='paid',ts=now();
  await env.DB.prepare('UPDATE agency_client_charge_sessions SET status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(paid?'paid':String(r.data?.payment_status||r.data?.status||'pending'),ts,record.id,tenant).run();if(paid&&record.usage_id)await env.DB.prepare("UPDATE agency_usage_rebill SET status='paid',updated_at=? WHERE id=? AND tenant_id=?").bind(ts,record.usage_id,tenant).run();
  return json({confirmed:paid,status:String(r.data?.payment_status||r.data?.status||'pending'),usage_id:record.usage_id||null});
 }
 if(url.pathname==='/api/white-label/payments/sessions'&&request.method==='GET'){
  const cid=clean(url.searchParams.get('client_id'),100);let sql='SELECT id,client_id,usage_id,amount_cents,currency,description,status,created_at,updated_at FROM agency_client_charge_sessions WHERE tenant_id=?',args=[tenant];if(cid){sql+=' AND client_id=?';args.push(cid)}sql+=' ORDER BY created_at DESC LIMIT 200';const{results=[]}=await env.DB.prepare(sql).bind(...args).all();return json({sessions:results});
 }
 return json({detail:'White Label client-payment endpoint not found.'},404);
}
