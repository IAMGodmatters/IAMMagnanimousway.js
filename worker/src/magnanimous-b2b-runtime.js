import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { getB2BCapabilityManifest, getB2BConnectionCatalog, getB2BSummary, MAGNANIMOUS_B2B_POLICY } from './magnanimous-b2b-capability-registry.js';
import { getB2BProtocolCatalog, getB2BStandardsCatalog, getB2BOpportunityCatalog, getB2BSkillCatalog } from './magnanimous-b2b-universal-fabric.js';
import { MAGNANIMOUS_RESERVATION_POLICY, RESERVATION_NORMALIZED_OBJECTS, RESERVATION_CONNECTION_READINESS, getReservationProviderGraph, getReservationSkillCatalog, getReservationLifecycle, getReservationSummary } from './magnanimous-reservation-service-fabric.js';

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
 netsuite:['NETSUITE_ACCOUNT_ID','NETSUITE_CONSUMER_KEY','NETSUITE_CONSUMER_SECRET','NETSUITE_TOKEN_ID','NETSUITE_TOKEN_SECRET'],
 'amazon-sp-api':['AMAZON_SPAPI_CLIENT_ID','AMAZON_SPAPI_CLIENT_SECRET','AMAZON_SPAPI_REFRESH_TOKEN'],
 'walmart-marketplace':['WALMART_CLIENT_ID','WALMART_CLIENT_SECRET'],
 'ebay-sell':['EBAY_CLIENT_ID','EBAY_CLIENT_SECRET','EBAY_REFRESH_TOKEN'],
 coupa:['COUPA_BASE_URL','COUPA_CLIENT_ID','COUPA_CLIENT_SECRET'],
 'peppol-service-provider':['PEPPOL_ACCESS_POINT_URL','PEPPOL_ACCESS_POINT_TOKEN'],
 ups:['UPS_CLIENT_ID','UPS_CLIENT_SECRET'],
 fedex:['FEDEX_CLIENT_ID','FEDEX_CLIENT_SECRET'],
 dhl:['DHL_API_KEY'],
 maersk:['MAERSK_CONSUMER_KEY'],
 travelgate:['TRAVELGATE_ACCESS_TOKEN','TRAVELGATE_PASSWORD'],
 ratehawk:['RATEHAWK_API_KEY'],
 ...RESERVATION_CONNECTION_READINESS
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
 settlement:['id','counterparty','type','gross','net','commission','markup','fees','tax','currency','due_at','status'],
 trading_document:['id','standard','document_type','sender','receiver','business_ref','payload_ref','validation_status','transport','ack_status'],
 shipment:['id','mode','carrier','service','origin','destination','packages_or_units','rate','currency','tracking_refs','milestones','status'],
 procurement_event:['id','buyer','event_type','requirements','suppliers','responses','deadline','evaluation','award_status'],
 agency_identity:['id','legal_entity','country','tids_code','iata_code','arc_number','accreditation_type','ticketing_authority','verified_at'],
 travel_settlement:['id','scheme','agency','supplier','period','sales','refunds','commissions','debits_credits','remittance','currency','status'],
 ...RESERVATION_NORMALIZED_OBJECTS
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
 ],
 procurement:[
  'discover or receive an enterprise sourcing/procurement opportunity',
  'normalize buyer requirements, supplier identity, catalog and contract context',
  'select protocol: API, cXML, X12, EDIFACT, Peppol, SFTP/file or portal',
  'qualify supplier and verify trading-partner authority',
  'respond to RFI/RFQ/tender or publish/search supplier catalog',
  'negotiate price, terms, MOQ, lead time and service levels',
  'exchange PO / acknowledgement / ASN / receipt / invoice / remittance',
  'perform three-way match and route exceptions',
  'reconcile settlement, rebates, credits and supplier scorecards',
  'retain normalized evidence while keeping outside procurement networks replaceable'
 ],
 logistics:[
  'normalize origin, destination, goods, service level and trade terms',
  'compare parcel, freight, ocean, warehouse or 3PL rails',
  'verify live rate, capacity, cutoff and account authority',
  'create shipment/booking only through an authorized carrier or forwarder',
  'capture labels/documents/tracking or carrier booking reference',
  'monitor milestones, exceptions, customs and proof of delivery',
  'reconcile freight cost against quote/invoice and update landed cost'
 ],
 travel_accreditation:[
  'determine operating country, business model and whether ticket issuance is needed',
  'separate identification from ticketing authority: TIDS is not BSP accreditation',
  'prepare business, tax, banking, licensing and recommendation evidence as required',
  'select TIDS, IATA accreditation/BSP, ARC, host agency or consolidator route',
  'store identifiers/status only after external approval is evidenced',
  'verify ticketing and settlement authority before enabling issue/void/refund actions',
  'track renewals, financial/security requirements and supplier appointments'
 ],
 reservation:getReservationLifecycle().map(x=>x.name+' — '+x.purpose)
});

function reservationPreflight(body,connections){
 const product=clean(body?.product||body?.kind||'').toLowerCase();
 const provider=clean(body?.provider||'').toLowerCase();
 const action=clean(body?.action||'reserve').toLowerCase();
 const consequential=['hold','reserve','book','ticket','issue','void','cancel','refund','change','exchange','reissue','settle'].some(x=>action.includes(x));
 const row=provider?connections.find(x=>x.id===provider):null;
 const authority={
  credentials_present:!!row?.configured,
  live_connection_verified:!!row?.live_connection_verified,
  booking_authority_verified:false,
  ticketing_authority_verified:false,
  settlement_authority_verified:false,
  merchant_of_record_verified:false
 };
 const missing=[];
 if(!product)missing.push('product');
 if(provider&&!row)missing.push('known provider');
 if(consequential&&!row?.configured)missing.push('configured provider credentials');
 if(consequential)missing.push('live provider handshake/authority verification');
 return{
  ok:missing.length===0&&!consequential,
  product:product||null,
  provider:provider||null,
  action,
  consequential,
  authority,
  missing,
  next_steps:consequential?[
   'revalidate live price and availability',
   'verify the connected account is authorized for this exact action',
   'verify customer/traveler approval and payment authority',
   'generate an idempotency key and duplicate-booking guard',
   'execute only through the original authorized supplier rail',
   'retrieve/reconcile provider state before retrying any ambiguous response'
  ]:[
   'select eligible configured providers',
   'search/read only',
   'normalize and compare options',
   'preserve provider references and expiry'
  ],
  rule:'Magnanimous owns the reservation record and workflow. A credential is not proof of booking, ticketing, refund or settlement authority.'
 };
}

function buildPlan(goal,connections){
 const text=clean(goal).toLowerCase();
 const travel=/flight|airline|hotel|travel|tour|trip|booking|gds|ndc|one order|bsp|arc|iata|tids|car rental|transfer|cruise|rail|ferry|mice/.test(text);
 const sourcing=/wholesale|supplier|manufacturer|dropship|private label|oem|odm|merch|inventory|procurement|rfq|rfi|tender|edi|cxml|peppol|x12|edifact/.test(text);
 const logistics=/shipping|freight|carrier|warehouse|3pl|parcel|ocean|container|tracking|landed cost/.test(text);
 const sales=/prospect|lead|b2b sales|outbound|account|reseller|dealer|distributor/.test(text);
 const families=[];
 if(travel)families.push('travel-distribution');
 if(sourcing)families.push('wholesale-sourcing');
 if(sales)families.push('b2b-sales');
 if(logistics)families.push('logistics');
 if(!families.length)families.push('b2b-general');
 const recommended=connections.filter(c=>{
  if(travel)return ['air-travel','airline-standard','travel-settlement','travel-settlement-us','travel-agency-identity','hotel-distribution','tours-activities','travel-platform','travel-distribution','corporate-travel','travel-metasearch','travel-marketplace','travel-research','ground-travel','payments'].includes(c.family);
  if(logistics)return ['shipping-logistics','ocean-logistics','trade-data','erp','payments'].includes(c.family);
  if(sourcing)return ['commerce','wholesale-sourcing','wholesale-marketplace','supplier-discovery','procurement-network','e-procurement','trade-data','erp','shipping-logistics','payments'].includes(c.family);
  return ['commerce','erp','procurement-network','payments','corporate-travel','air-travel','hotel-distribution'].includes(c.family);
 }).slice(0,12);
 return {
  goal:clean(goal).slice(0,4000),
  families,
  sequence:travel?B2B_WORKFLOWS.travel:logistics?B2B_WORKFLOWS.logistics:sourcing?( /rfq|rfi|tender|edi|cxml|peppol|x12|edifact|procurement/.test(text)?B2B_WORKFLOWS.procurement:B2B_WORKFLOWS.wholesale):[
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
   protocols:getB2BProtocolCatalog(),
   standards:getB2BStandardsCatalog(),
   opportunities:getB2BOpportunityCatalog(),
   skills:getB2BSkillCatalog(),
   reservation:{summary:getReservationSummary(),policy:MAGNANIMOUS_RESERVATION_POLICY,lifecycle:getReservationLifecycle(),providers:getReservationProviderGraph(),skills:getReservationSkillCatalog()},
   connections,
   capabilities:getB2BCapabilityManifest()
  });
 }
 if(request.method==='GET'&&(path==='/api/b2b/connections'||path==='/api/magnanimous/b2b/connections')){
  return json({identity:'Magnanimous AI',connections,transactional_connections_verified:connections.filter(x=>x.live_connection_verified).length,note:'Configured means credential material is present. It does not mean a commercial account, ticketing authority, merchant status or live transaction has been verified.'});
 }
 if(request.method==='GET'&&path==='/api/b2b/protocols')return json({identity:'Magnanimous AI',protocols:getB2BProtocolCatalog()});
 if(request.method==='GET'&&path==='/api/b2b/standards')return json({identity:'Magnanimous AI',standards:getB2BStandardsCatalog()});
 if(request.method==='GET'&&path==='/api/b2b/opportunities')return json({identity:'Magnanimous AI',opportunities:getB2BOpportunityCatalog()});
 if(request.method==='GET'&&path==='/api/b2b/skills')return json({identity:'Magnanimous AI',skills:getB2BSkillCatalog()});
 if(request.method==='GET'&&path==='/api/b2b/reservations')return json({identity:'Magnanimous AI',summary:getReservationSummary(),policy:MAGNANIMOUS_RESERVATION_POLICY,lifecycle:getReservationLifecycle(),providers:getReservationProviderGraph(),skills:getReservationSkillCatalog(),objects:RESERVATION_NORMALIZED_OBJECTS});
 if(request.method==='GET'&&path==='/api/b2b/reservations/providers')return json({identity:'Magnanimous AI',providers:getReservationProviderGraph(),connections});
 if(request.method==='GET'&&path==='/api/b2b/reservations/skills')return json({identity:'Magnanimous AI',skills:getReservationSkillCatalog()});
 if(request.method==='GET'&&path==='/api/b2b/reservations/workflow')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.reservation,policy:MAGNANIMOUS_RESERVATION_POLICY});
 if(request.method==='POST'&&path==='/api/b2b/reservations/preflight'){
  const body=await request.json().catch(()=>({}));
  return json({identity:'Magnanimous AI',preflight:reservationPreflight(body,connections)});
 }
  if(request.method==='GET'&&path==='/api/b2b/procurement/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.procurement,objects:['company','supplier','product','procurement_event','trading_document','purchase_order','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='GET'&&path==='/api/b2b/logistics/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.logistics,objects:['shipment','trading_document','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='GET'&&path==='/api/b2b/travel/accreditation')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.travel_accreditation,objects:['agency_identity','travel_settlement'],policy:MAGNANIMOUS_B2B_POLICY});
  if(request.method==='GET'&&path==='/api/b2b/travel/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.travel,objects:['travel_offer','travel_order','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='GET'&&path==='/api/b2b/wholesale/workflows')return json({identity:'Magnanimous AI',workflow:B2B_WORKFLOWS.wholesale,objects:['company','supplier','product','quote','purchase_order','settlement'],policy:MAGNANIMOUS_B2B_POLICY});
 if(request.method==='POST'&&(path==='/api/b2b/plan'||path==='/api/magnanimous/b2b/plan')){
  const body=await request.json().catch(()=>({}));const goal=clean(body.goal||body.message);
  if(!goal)return json({detail:'B2B goal is required.'},400);
  return json({ok:true,plan:buildPlan(goal,connections)});
 }
 return json({detail:'Magnanimous B2B route not found.'},404);
}
