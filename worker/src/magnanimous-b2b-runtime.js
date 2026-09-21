import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { getB2BCapabilityManifest, getB2BConnectionCatalog, getB2BSummary, MAGNANIMOUS_B2B_POLICY } from './magnanimous-b2b-capability-registry.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=v=>String(v??'').trim();

const CONNECTION_READINESS=Object.freeze({
 amadeus:['AMADEUS_CLIENT_ID','AMADEUS_CLIENT_SECRET'],
 sabre:['SABRE_CLIENT_ID','SABRE_CLIENT_SECRET'],
 travelport:['TRAVELPORT_CLIENT_ID','TRAVELPORT_CLIENT_SECRET'],
 duffel:['DUFFEL_ACCESS_TOKEN'],
 'hbx-hotelbeds':['HBX_API_KEY','HBX_SECRET'],
 'expedia-rapid':['EXPEDIA_RAPID_API_KEY','EXPEDIA_RAPID_SHARED_SECRET'],
 viator:['VIATOR_API_KEY'],
 getyourguide:['GETYOURGUIDE_API_TOKEN'],
 zentrumhub:['ZENTRUMHUB_API_KEY'],
 travelopro:['TRAVELOPRO_API_KEY'],
 'brex-travel':['BREX_API_TOKEN'],
 navan:['NAVAN_API_TOKEN'],
 netsuite:['NETSUITE_ACCOUNT_ID','NETSUITE_CONSUMER_KEY','NETSUITE_CONSUMER_SECRET','NETSUITE_TOKEN_ID','NETSUITE_TOKEN_SECRET']
});

function readiness(env,connections){
 return connections.map(row=>{
  const keys=CONNECTION_READINESS[row.id]||[];
  const configured=keys.length?keys.every(k=>clean(env?.[k])):false;
  return {
   id:row.id,
   name:row.name,
   family:row.family,
   mode:row.mode,
   status:configured?'configured':row.status,
   configured,
   required_credential_keys:keys,
   live_connection_verified:false,
   note:configured?'Credentials are present; a provider-specific live handshake is still required before transactional use.':'No live credential claim is made.'
  };
 });
}

export const B2B_NORMALIZED_OBJECTS=Object.freeze({
 company:['id','name','locations','buyers','roles','tax_profile','payment_terms','credit_profile','price_tier'],
 supplier:['id','name','type','countries','currencies','terms','moq','lead_time','incoterms','quality_status','connection_id'],
 product:['id','supplier_sku','merchant_sku','gtin','title','variants','cost','currency','moq','inventory','lead_time','origin','documents'],
 quote:['id','buyer_id','supplier_id','items','price_breaks','freight','tax','terms','expires_at','status'],
 purchase_order:['id','buyer_id','supplier_id','po_number','items','ship_to','terms','status','receipts','invoice_refs'],
 travel_offer:['id','kind','supplier','source','traveler_scope','segments_or_stay','net_amount','sell_amount','currency','rules','expires_at'],
 travel_order:['id','kind','provider_ref','pnr_or_order_ref','travelers','items','payments','tickets_or_vouchers','status','servicing_actions'],
 settlement:['id','counterparty','type','gross','net','commission','markup','fees','tax','currency','due_at','status']
});

export const B2B_WORKFLOWS=Object.freeze({
 wholesale:[
  'discover supplier or receive supplier connection',
  'normalize supplier/company/product data',
  'qualify supplier and record rights/KYB evidence',
  'request quote / compare MOQ, price, lead time and terms',
  'approve sample/private-label/specification when applicable',
  'create negotiated catalog / price list',
  'receive RFQ, quote or wholesale order',
  'verify inventory, pricing, tax, shipping and payment terms',
  'create PO/sales order through authorized account',
  'route fulfillment / dropship / 3PL / freight',
  'track delivery, returns, credits and settlement',
  'learn margin, supplier quality and reorder patterns'
 ],
 travel:[
  'identify agency/corporate/sub-agent account and traveler scope',
  'search normalized live inventory through authorized suppliers',
  'compare fare/rate rules, baggage, cancellation and total sell price',
  'reprice/recheck live availability immediately before order',
  'apply markup/service fee/commission policy',
  'obtain required human/customer approval and payment authority',
  'book/order through an authorized provider',
  'issue ticket/voucher only when the connected rail grants authority',
  'store provider reference and normalized receipt',
  'monitor schedule/booking changes and servicing queues',
  'support change/cancel/refund/reissue/amendment through the original authorized rail',
  'reconcile supplier settlement, commission, fees and corporate expense'
 ]
});

function buildPlan(goal,connections){
 const text=clean(goal).toLowerCase();
 const travel=/flight|airline|hotel|travel|tour|trip|booking|gds|ndc|car rental|transfer/.test(text);
 const sourcing=/wholesale|supplier|manufacturer|dropship|private label|oem|odm|merch|inventory|procurement/.test(text);
 const sales=/prospect|lead|b2b sales|outbound|account|reseller|dealer|distributor/.test(text);
 const families=[];
 if(travel)families.push('travel-distribution');
 if(sourcing)families.push('wholesale-sourcing');
 if(sales)families.push('b2b-sales');
 if(!families.length)families.push('b2b-general');
 const recommended=connections.filter(c=>{
  if(travel)return ['air-travel','hotel-distribution','tours-activities','travel-platform','corporate-travel','travel-metasearch','travel-marketplace','travel-research','payments'].includes(c.family);
  if(sourcing)return ['commerce','wholesale-sourcing','erp','payments'].includes(c.family);
  return ['commerce','erp','payments','corporate-travel','air-travel','hotel-distribution'].includes(c.family);
 }).slice(0,12);
 return {
  goal:clean(goal).slice(0,4000),
  families,
  sequence:travel?B2B_WORKFLOWS.travel:sourcing?B2B_WORKFLOWS.wholesale:[
   'define target business customer and transaction',
   'select the Magnanimous-owned normalized workflow',
   'connect only the outside account/data/settlement rails required for that transaction',
   'verify authorization, pricing, terms and availability',
   'execute consequential actions only with required approval',
   'record receipts and learn from the outcome'
  ],
  recommended_connections:recommended.map(x=>({id:x.id,name:x.name,family:x.family,configured:x.configured,status:x.status})),
  rule:'Magnanimous owns the plan, memory, policy, normalization and verification. Outside B2B systems remain replaceable rails.'
 };
}

export async function handleMagnanimousB2B(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/b2b')&&!path.startsWith('/api/magnanimous/b2b'))return null;
 const user=await currentUser(request,env);
 if(!user)return json({detail:'Sign in to use the Magnanimous B2B network.'},401);
 const runtimeEnv=await getProviderRuntimeEnv(env);
 const connections=readiness(runtimeEnv,getB2BConnectionCatalog());
 if(request.method==='GET'&&(path==='/api/b2b'||path==='/api/b2b/catalog'||path==='/api/magnanimous/b2b')){
  return json({
   identity:'Magnanimous AI',
   summary:getB2BSummary(),
   policy:MAGNANIMOUS_B2B_POLICY,
   normalized_objects:B2B_NORMALIZED_OBJECTS,
   workflows:B2B_WORKFLOWS,
   connections,
   capabilities:getB2BCapabilityManifest()
  });
 }
 if(request.method==='GET'&&(path==='/api/b2b/connections'||path==='/api/magnanimous/b2b/connections')){
  return json({identity:'Magnanimous AI',connections,transactional_connections_verified:connections.filter(x=>x.live_connection_verified).length,note:'Configured means credential material is present. It does not mean a commercial account, ticketing authority, merchant status or live transaction has been verified.'});
 }
 if(request.method==='GET'&&path==='/api/b2b/travel/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.travel,objects:['travel_offer','travel_order','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='GET'&&path==='/api/b2b/wholesale/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.wholesale,objects:['company','supplier','product','quote','purchase_order','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='POST'&&(path==='/api/b2b/plan'||path==='/api/magnanimous/b2b/plan')){
  const body=await request.json().catch(()=>({}));const goal=clean(body.goal||body.message);
  if(!goal)return json({detail:'B2B goal is required.'},400);
  return json({ok:true,plan:buildPlan(goal,connections)});
 }
 return json({detail:'Magnanimous B2B route not found.'},404);
}
