import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import {
 DEFAULT_TRAVEL_PRICING_POLICY,
 MAGNANIMOUS_TRAVEL_AGENCY_POLICY,
 TRAVEL_AGENCY_SKILLS,
 getTravelAgencySummary,
 getTravelSupplierReadiness,
 rankTravelDeals,
 publicTravelOffer,
 amountToMinor
} from './magnanimous-travel-agency-core.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=v=>String(v??'').trim();
const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?Math.round(n):d};
const now=()=>Math.floor(Date.now()/1000);

function ownerOnly(user){return String(user?.role||'').toLowerCase()==='owner'}

async function hashText(value){
 const bytes=new TextEncoder().encode(String(value));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function b64url(bytes){
 let s='';for(const b of bytes)s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function newSourceKey(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return 'mag_travel_'+b64url(bytes);
}
async function fingerprint(value){return (await hashText(JSON.stringify(value))).slice(0,32)}

async function policyFor(env,tenant){
 const row=await env.DB.prepare('SELECT * FROM travel_agency_pricing_policy WHERE tenant_id=?').bind(tenant).first().catch(()=>null);
 return{
  ...DEFAULT_TRAVEL_PRICING_POLICY,
  owner_margin_bps:num(row?.owner_margin_bps,DEFAULT_TRAVEL_PRICING_POLICY.owner_margin_bps),
  direct_retail_extra_bps:num(row?.direct_retail_extra_bps,0),
  reseller_default_markup_bps:num(row?.reseller_default_markup_bps,DEFAULT_TRAVEL_PRICING_POLICY.reseller_default_markup_bps),
  reseller_max_markup_bps:num(row?.reseller_max_markup_bps,DEFAULT_TRAVEL_PRICING_POLICY.reseller_max_markup_bps),
  quote_ttl_seconds:num(row?.quote_ttl_seconds,DEFAULT_TRAVEL_PRICING_POLICY.quote_ttl_seconds)
 };
}

async function authenticateSourceKey(request,env){
 const raw=clean(request.headers.get('x-magnanimous-travel-key')||request.headers.get('authorization')?.replace(/^Bearer\s+/i,''));
 if(!raw||!raw.startsWith('mag_travel_'))return null;
 const keyHash=await hashText(raw);
 const row=await env.DB.prepare(`SELECT k.id key_id,k.tenant_id,k.reseller_id,r.name reseller_name,r.status reseller_status,r.markup_bps
  FROM travel_source_api_keys k JOIN travel_reseller_accounts r ON r.id=k.reseller_id AND r.tenant_id=k.tenant_id
  WHERE k.key_hash=? AND k.status='active' LIMIT 1`).bind(keyHash).first().catch(()=>null);
 if(!row||row.reseller_status!=='active')return null;
 env.DB.prepare('UPDATE travel_source_api_keys SET last_used_at=? WHERE id=?').bind(now(),row.key_id).run().catch(()=>{});
 return row;
}

function validateFlightSearch(body){
 const slices=Array.isArray(body?.slices)?body.slices:[];
 if(!slices.length||slices.length>6)return'Supply one to six flight slices.';
 for(const s of slices){
  if(!/^[A-Z]{3}$/.test(clean(s.origin).toUpperCase())||!/^[A-Z]{3}$/.test(clean(s.destination).toUpperCase()))return'Each slice needs 3-letter origin and destination airport codes.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(s.departure_date)))return'Each slice needs departure_date in YYYY-MM-DD format.';
 }
 const passengers=Array.isArray(body?.passengers)?body.passengers:[];
 if(!passengers.length||passengers.length>9)return'Supply one to nine passengers.';
 return'';
}

function duffelItinerary(offer){
 return (offer?.slices||[]).map(slice=>({
  origin:slice?.origin?.iata_code||slice?.origin?.name||'',
  destination:slice?.destination?.iata_code||slice?.destination?.name||'',
  duration:slice?.duration||'',
  segments:(slice?.segments||[]).map(seg=>({
   origin:seg?.origin?.iata_code||'',
   destination:seg?.destination?.iata_code||'',
   departing_at:seg?.departing_at||'',
   arriving_at:seg?.arriving_at||'',
   operating_carrier:seg?.operating_carrier?.name||'',
   marketing_carrier:seg?.marketing_carrier?.name||'',
   flight_number:seg?.marketing_carrier_flight_number||''
  }))
 }));
}

async function searchDuffel(body,runtimeEnv){
 const token=clean(runtimeEnv?.DUFFEL_ACCESS_TOKEN);if(!token)return{supplier:'duffel',configured:false,offers:[]};
 const data={
  slices:(body.slices||[]).map(s=>({origin:clean(s.origin).toUpperCase(),destination:clean(s.destination).toUpperCase(),departure_date:clean(s.departure_date)})),
  passengers:(body.passengers||[]).map(p=>p.age!=null?{age:num(p.age)}:{type:clean(p.type||'adult')}),
  cabin_class:clean(body.cabin_class||'economy')||'economy',
  max_connections:Math.max(0,Math.min(num(body.max_connections,1),3))
 };
 const url='https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=12000&view=offers';
 const res=await fetch(url,{method:'POST',headers:{
  'Authorization':`Bearer ${token}`,'Duffel-Version':'v2','Accept':'application/json','Content-Type':'application/json'
 },body:JSON.stringify({data})});
 const payload=await res.json().catch(()=>({}));
 if(!res.ok)return{supplier:'duffel',configured:true,error:clean(payload?.errors?.[0]?.message||payload?.meta?.message||`Duffel search failed (${res.status})`),offers:[]};
 const offers=Array.isArray(payload?.data?.offers)?payload.data.offers:[];
 return{supplier:'duffel',configured:true,offers:offers.slice(0,80).map(o=>({
  id:'duffel:'+o.id,
  offer_id:o.id,
  supplier:'duffel',
  product:'air',
  currency:o.total_currency,
  total_minor:amountToMinor(o.total_amount),
  bookable:true,
  revalidated:false,
  expires_at:o.expires_at||null,
  source_timestamp:new Date().toISOString(),
  refundable:false,
  changeable:true,
  baggage_summary:null,
  itinerary:duffelItinerary(o)
 }))};
}

async function storeEvidence(env,{tenant,resellerId='',requestFingerprint,group}){
 if(!group?.best)return;
 const best=group.best,p=best.pricing||{},expires=best.expires_at?Math.floor(Date.parse(best.expires_at)/1000):null;
 await env.DB.prepare(`INSERT INTO travel_quote_evidence
  (id,tenant_id,reseller_id,request_fingerprint,product,currency,compared_sources,best_supplier,supplier_offer_ref,wholesale_minor,sell_minor,owner_margin_minor,reseller_margin_minor,proof_label,expires_at,created_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
   crypto.randomUUID(),tenant,resellerId,requestFingerprint,best.product||'travel',group.currency,group.compared_bookable_sources,best.supplier,best.supplier_offer_ref,
   num(p.magnanimous_wholesale_minor),num(p.final_sell_minor),num(p.owner_margin_minor),num(p.reseller_margin_minor),group.proof_label,expires,now()
  ).run().catch(()=>{});
}

async function flightSearch(body,env,{tenant,reseller=null,publicSource=false}){
 const error=validateFlightSearch(body);if(error)return json({detail:error},400);
 const runtimeEnv=await getProviderRuntimeEnv(env),policy=await policyFor(env,tenant);
 const readiness=getTravelSupplierReadiness(runtimeEnv);
 const active=readiness.filter(x=>x.configured&&x.products.includes('air'));
 const results=[];
 if(active.some(x=>x.id==='duffel')){
  const r=await searchDuffel(body,runtimeEnv);if(r.error)results.push({supplier:'duffel',error:r.error});else results.push(...r.offers);
 }
 const resellerMarkup=reseller?num(reseller.markup_bps,policy.reseller_default_markup_bps):num(policy.direct_retail_extra_bps,0);
 if(!results.length)return json({
  ok:false,code:'NO_LIVE_FLIGHT_OFFERS',
  detail:active.length?'Configured sources returned no usable live offers.':'No executable live flight supplier is configured yet.',
  configured_air_sources:active.map(x=>({id:x.id,name:x.name,adapter:x.adapter})),
  pending_air_sources:readiness.filter(x=>x.products.includes('air')&&!x.configured).map(x=>({id:x.id,name:x.name,adapter:x.adapter})),
  rule:'Magnanimous does not fabricate prices or claim cheapest without live supplier evidence.'
 },409);
 const groups=rankTravelDeals(results,policy,resellerMarkup);
 const requestFingerprint=await fingerprint({slices:body.slices,passengers:body.passengers,cabin_class:body.cabin_class||'economy',max_connections:body.max_connections??1});
 for(const group of groups)await storeEvidence(env,{tenant,resellerId:reseller?.reseller_id||'',requestFingerprint,group});
 return json({
  ok:true,
  identity:'Magnanimous AI Travel',
  request_fingerprint:requestFingerprint,
  reseller:reseller?{id:reseller.reseller_id,name:reseller.reseller_name,markup_bps:resellerMarkup}:null,
  pricing_policy:publicSource?{owner_margin_included:true,reseller_markup_bps:resellerMarkup}:policy,
  source_count:groups.reduce((n,g)=>Math.max(n,g.compared_bookable_sources),0),
  groups:groups.map(g=>({
   currency:g.currency,compared_bookable_sources:g.compared_bookable_sources,lowest_verified:g.lowest_verified,proof_label:g.proof_label,
   best:publicTravelOffer(g.best,{includeWholesale:publicSource}),
   alternatives:g.alternatives.slice(0,12).map(x=>publicTravelOffer(x,{includeWholesale:publicSource}))
  })),
  booking_boundary:'Search and pricing only. Booking/ticketing remains authority-gated through the Magnanimous reservation service.'
 });
}

function sourceApiSpec(){
 return{
  version:'v1',
  authentication:'X-Magnanimous-Travel-Key or Bearer mag_travel_*',
  endpoints:[
   {method:'GET',path:'/api/travel-source/v1/catalog',purpose:'Source capabilities and connected product families.'},
   {method:'POST',path:'/api/travel-source/v1/search/flights',purpose:'Search normalized live flight inventory with Magnanimous wholesale + reseller pricing.'}
  ],
  pricing_waterfall:['supplier true cost (private)','Magnanimous wholesale margin','reseller markup','final sell price'],
  secret_boundary:'Supplier credentials and raw supplier net prices are never returned to reseller clients.'
 };
}

export async function handleMagnanimousTravelAgency(request,env){
 const url=new URL(request.url),path=url.pathname;
 const internal=path.startsWith('/api/travel-agency'),external=path.startsWith('/api/travel-source/v1');
 if(!internal&&!external)return null;
 if(!env?.DB)return json({detail:'Travel Agency requires Magnanimous database storage.'},503);

 if(external){
  const reseller=await authenticateSourceKey(request,env);
  if(!reseller)return json({detail:'Valid Magnanimous Travel Source API key required.'},401);
  if(request.method==='GET'&&path==='/api/travel-source/v1/catalog'){
   const runtimeEnv=await getProviderRuntimeEnv(env),readiness=getTravelSupplierReadiness(runtimeEnv);
   return json({identity:'Magnanimous AI Travel Source',spec:sourceApiSpec(),products:['air','hotel','car','activities','transfers','rail','cruise'],live_sources:readiness.filter(x=>x.configured).map(x=>({id:x.id,name:x.name,products:x.products,adapter:x.adapter})),reseller:{id:reseller.reseller_id,name:reseller.reseller_name}});
  }
  if(request.method==='POST'&&path==='/api/travel-source/v1/search/flights'){
   const body=await request.json().catch(()=>({}));
   return flightSearch(body,env,{tenant:String(reseller.tenant_id),reseller,publicSource:true});
  }
  return json({detail:'Travel Source API route not found.'},404);
 }

 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to use Magnanimous Travel Agency.'},401);
 const tenant=String(user.tenant_id||'');
 if(request.method==='GET'&&(path==='/api/travel-agency'||path==='/api/travel-agency/catalog')){
  const runtimeEnv=await getProviderRuntimeEnv(env),policy=await policyFor(env,tenant);
  return json({identity:'Magnanimous AI Travel Agency',summary:getTravelAgencySummary(),policy:MAGNANIMOUS_TRAVEL_AGENCY_POLICY,pricing_policy:policy,suppliers:getTravelSupplierReadiness(runtimeEnv),skills:TRAVEL_AGENCY_SKILLS,source_api:sourceApiSpec()});
 }
 if(request.method==='POST'&&path==='/api/travel-agency/search/flights'){
  const body=await request.json().catch(()=>({}));
  return flightSearch(body,env,{tenant,publicSource:false});
 }
 if(request.method==='GET'&&path==='/api/travel-agency/pricing')return json({pricing_policy:await policyFor(env,tenant)});
 if(request.method==='PUT'&&path==='/api/travel-agency/pricing'){
  if(!ownerOnly(user))return json({detail:'Owner access required to change travel pricing.'},403);
  const body=await request.json().catch(()=>({})),current=await policyFor(env,tenant);
  const next={
   owner_margin_bps:Math.max(0,Math.min(num(body.owner_margin_bps,current.owner_margin_bps),2500)),
   direct_retail_extra_bps:Math.max(0,Math.min(num(body.direct_retail_extra_bps,current.direct_retail_extra_bps),5000)),
   reseller_default_markup_bps:Math.max(0,Math.min(num(body.reseller_default_markup_bps,current.reseller_default_markup_bps),5000)),
   reseller_max_markup_bps:Math.max(0,Math.min(num(body.reseller_max_markup_bps,current.reseller_max_markup_bps),10000)),
   quote_ttl_seconds:Math.max(60,Math.min(num(body.quote_ttl_seconds,current.quote_ttl_seconds),3600))
  };
  await env.DB.prepare(`INSERT INTO travel_agency_pricing_policy
   (tenant_id,owner_margin_bps,direct_retail_extra_bps,reseller_default_markup_bps,reseller_max_markup_bps,quote_ttl_seconds,updated_at,updated_by)
   VALUES(?,?,?,?,?,?,?,?)
   ON CONFLICT(tenant_id) DO UPDATE SET owner_margin_bps=excluded.owner_margin_bps,direct_retail_extra_bps=excluded.direct_retail_extra_bps,reseller_default_markup_bps=excluded.reseller_default_markup_bps,reseller_max_markup_bps=excluded.reseller_max_markup_bps,quote_ttl_seconds=excluded.quote_ttl_seconds,updated_at=excluded.updated_at,updated_by=excluded.updated_by`).bind(
    tenant,next.owner_margin_bps,next.direct_retail_extra_bps,next.reseller_default_markup_bps,next.reseller_max_markup_bps,next.quote_ttl_seconds,now(),String(user.id||'')
   ).run();
  return json({ok:true,pricing_policy:next});
 }
 if(request.method==='GET'&&path==='/api/travel-agency/resellers'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const {results=[]}=await env.DB.prepare('SELECT id,name,status,markup_bps,company_ref,contact_email,created_at,updated_at FROM travel_reseller_accounts WHERE tenant_id=? ORDER BY updated_at DESC').bind(tenant).all();
  return json({resellers:results});
 }
 if(request.method==='POST'&&path==='/api/travel-agency/resellers'){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const body=await request.json().catch(()=>({})),name=clean(body.name);
  if(!name)return json({detail:'Reseller name is required.'},400);
  const policy=await policyFor(env,tenant),id=crypto.randomUUID(),ts=now(),markup=Math.max(0,Math.min(num(body.markup_bps,policy.reseller_default_markup_bps),policy.reseller_max_markup_bps));
  await env.DB.prepare('INSERT INTO travel_reseller_accounts (id,tenant_id,name,status,markup_bps,company_ref,contact_email,created_at,updated_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(
   id,tenant,name,'active',markup,clean(body.company_ref),clean(body.contact_email),ts,ts,String(user.id||'')
  ).run();
  return json({ok:true,reseller:{id,name,status:'active',markup_bps:markup}},201);
 }
 const keyMatch=path.match(/^\/api\/travel-agency\/resellers\/([^/]+)\/keys$/);
 if(request.method==='POST'&&keyMatch){
  if(!ownerOnly(user))return json({detail:'Owner access required.'},403);
  const resellerId=keyMatch[1],r=await env.DB.prepare("SELECT id,name,status FROM travel_reseller_accounts WHERE id=? AND tenant_id=?").bind(resellerId,tenant).first();
  if(!r||r.status!=='active')return json({detail:'Active reseller not found.'},404);
  const secret=newSourceKey(),hash=await hashText(secret),id=crypto.randomUUID(),prefix=secret.slice(0,20);
  await env.DB.prepare('INSERT INTO travel_source_api_keys (id,tenant_id,reseller_id,key_prefix,key_hash,status,created_at,created_by) VALUES(?,?,?,?,?,?,?,?)').bind(
   id,tenant,resellerId,prefix,hash,'active',now(),String(user.id||'')
  ).run();
  return json({ok:true,reseller:{id:r.id,name:r.name},api_key:secret,key_prefix:prefix,note:'This key is shown once. Magnanimous stores only its SHA-256 hash.'},201);
 }
 return json({detail:'Magnanimous Travel Agency route not found.'},404);
}
