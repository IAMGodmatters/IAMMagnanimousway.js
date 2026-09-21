import { getUniversalB2BCapabilityManifest, getUniversalB2BConnectionCatalog, getUniversalB2BSummary } from './magnanimous-b2b-universal-fabric.js';

const VERIFIED_AT='2026-09-21';

export const MAGNANIMOUS_B2B_POLICY=Object.freeze({
  brain_owner:'Magnanimous AI',
  memory_owner:'Magnanimous AI',
  workflow_owner:'Magnanimous AI',
  verification_owner:'Magnanimous AI',
  external_accounts_replaceable:true,
  preserve_existing_features:true,
  additive_only_default:true,
  no_unverified_vendor_promises:true,
  no_false_connection_claims:true,
  no_automatic_purchase_or_ticket_issue:true,
  consequential_actions_require_authority:true,
  regulated_travel_authority_not_assumed:true,
  merchant_of_record_not_assumed:true,
  iata_arc_accreditation_not_assumed:true
});

export const B2B_CONNECTIONS=Object.freeze([
  {id:'shopify-b2b',name:'Shopify B2B',family:'commerce',mode:'account-connector',capabilities:['company accounts','buyer permissions','catalogs','customer-specific pricing','volume pricing','quantity rules','payment terms','PO numbers','draft orders','reorders','returns','inventory sync','B2B APIs'],status:'supported-connector',docs:['https://help.shopify.com/en/manual/b2b']},
  {id:'alibaba-sourcing',name:'Alibaba.com sourcing / private label',family:'wholesale-sourcing',mode:'partner-or-marketplace',capabilities:['manufacturer discovery','RFQ','MOQ comparison','private label','OEM/ODM','sample workflow','supplier negotiation','trade documentation'],status:'partner-boundary',docs:['https://www.alibaba.com/']},
  {id:'syncee',name:'Syncee wholesale & dropshipping',family:'wholesale-sourcing',mode:'optional-connector',capabilities:['supplier catalog discovery','dropshipping','wholesale product sourcing','catalog import','supplier connection'],status:'optional-connector',docs:['https://syncee.com/']},
  {id:'zendrop',name:'Zendrop dropshipping',family:'wholesale-sourcing',mode:'optional-connector',capabilities:['product sourcing','store import','order routing','supplier fulfillment','private labeling where offered'],status:'optional-connector',docs:['https://www.zendrop.com/']},
  {id:'netsuite',name:'NetSuite',family:'erp',mode:'optional-connector',capabilities:['ERP','inventory','purchase orders','sales orders','customers','vendors','finance','reporting'],status:'optional-connector',docs:['https://www.netsuite.com/']},
  {id:'amadeus',name:'Amadeus',family:'air-travel',mode:'api-partner',capabilities:['flight search','flight pricing','flight orders','order management','seat maps','fare analysis','hotel search'],status:'partner-credentials-required',docs:['https://developers.amadeus.com/']},
  {id:'sabre',name:'Sabre',family:'air-travel',mode:'api-partner',capabilities:['air shopping','offers','orders','NDC content','reshop','changes','hotel content','agency workflows'],status:'partner-credentials-required',docs:['https://developer.sabre.com/']},
  {id:'travelport',name:'Travelport',family:'air-travel',mode:'api-partner',capabilities:['air search','offers','booking','reservation management','NDC','ancillaries','hotel','car'],status:'partner-credentials-required',docs:['https://developer.travelport.com/']},
  {id:'duffel',name:'Duffel',family:'air-travel',mode:'api-partner',capabilities:['flight offers','orders','ticketing through managed content','changes','cancellations','ancillaries','payments','markups'],status:'partner-credentials-required',docs:['https://duffel.com/docs']},
  {id:'zentrumhub',name:'ZentrumHub',family:'hotel-distribution',mode:'api-or-portal-partner',capabilities:['hotel supplier aggregation','hotel booking engine','B2B portal','B2C portal','supplier connect','markup','agent distribution'],status:'partner-credentials-required',docs:['https://www.zentrumhub.com/']},
  {id:'travelopro',name:'Travelopro',family:'travel-platform',mode:'technology-partner-benchmark',capabilities:['B2B travel portal','flight API integration','hotel API integration','tours','packages','visa workflow','agent markup','contracted inventory'],status:'benchmark-or-partner',docs:['https://www.travelopro.com/b2b-booking-platform.php']},
  {id:'hbx-hotelbeds',name:'HBX Group / Hotelbeds API Suite',family:'hotel-distribution',mode:'api-partner',capabilities:['hotel content','hotel availability','hotel booking','booking management','activities','transfers','car rental'],status:'partner-credentials-required',docs:['https://developer.hotelbeds.com/']},
  {id:'expedia-rapid',name:'Expedia Group Rapid',family:'hotel-distribution',mode:'api-partner',capabilities:['lodging content','lodging shopping','booking','payments','property search','post-booking servicing'],status:'partner-credentials-required',docs:['https://developers.expediagroup.com/rapid']},
  {id:'viator',name:'Viator Partner API',family:'tours-activities',mode:'api-partner',capabilities:['experience content','search','availability','pricing','booking','holds','cancellation','amendments','merchant and affiliate models'],status:'partner-approval-required',docs:['https://docs.viator.com/partner-api/']},
  {id:'getyourguide',name:'GetYourGuide Partner API',family:'tours-activities',mode:'api-partner',capabilities:['tour content','ratings','pricing','availability','booking where approved'],status:'partner-approval-required',docs:['https://api.getyourguide.com/']},
  {id:'skyscanner',name:'Skyscanner',family:'travel-metasearch',mode:'optional-discovery-connector',capabilities:['flight comparison','provider discovery','fare comparison','travel research'],status:'optional-connector',docs:['https://www.skyscanner.net/']},
  {id:'booking-com',name:'Booking.com',family:'travel-marketplace',mode:'optional-discovery-connector',capabilities:['stays','car rentals','attractions','travel discovery'],status:'optional-connector',docs:['https://www.booking.com/']},
  {id:'tripadvisor',name:'Tripadvisor',family:'travel-research',mode:'optional-discovery-connector',capabilities:['hotel research','reviews','photos','amenities','price offer comparison'],status:'optional-connector',docs:['https://www.tripadvisor.com/']},
  {id:'brex-travel',name:'Brex Travel & Expense',family:'corporate-travel',mode:'corporate-account-connector',capabilities:['travel booking','travel policy','budgets','corporate cards','expense capture','reimbursements','travel approvals'],status:'account-approval-required',docs:['https://www.brex.com/product/travel-expense-management']},
  {id:'navan',name:'Navan',family:'corporate-travel',mode:'corporate-account-connector',capabilities:['business travel','policy','corporate booking','expense workflows','global travel support'],status:'account-approval-required',docs:['https://navan.com/']},
  {id:'stripe',name:'Stripe',family:'payments',mode:'account-connector',capabilities:['payment collection','payment links','invoicing','customer billing','refund rails'],status:'supported-connector',docs:['https://docs.stripe.com/']}
]);

const CAPS=Object.freeze([
 ['company-account-management','Company accounts, buyer roles, locations and permissions','business-operating-system','none','company profiles; buyer roles; purchasing permissions; multi-location accounts','low'],
 ['b2b-catalogs-pricing','Customer-specific catalogs, price lists and volume pricing','commerce-engine','external-commerce-account','catalogs; price lists; volume tiers; quantity rules; market-specific pricing','medium'],
 ['rfq-quote-cpq','RFQ, quote, negotiation and CPQ workflows','crm-growth-engine','none','RFQ intake; quote versions; negotiated pricing; approval; quote-to-order','low'],
 ['purchase-orders','Purchase order intake, approval and matching','business-operating-system','none-or-external-erp-account','PO number; approval; three-way match preparation; order conversion','medium'],
 ['net-terms-credit','B2B payment terms, deposits and credit controls','billing-engine','external-payment-or-credit-rail','net terms; deposits; credit limits; aging; collection rules','high'],
 ['b2b-invoicing','Wholesale invoices, statements and account billing','billing-engine','external-payment-rail','invoice; statement; account balance; payment receipt; refund record','high'],
 ['quick-bulk-order','Quick order, bulk order and repeat purchasing','commerce-engine','external-commerce-account','quick order; CSV/order form; bulk variants; reorder','medium'],
 ['returns-rma','B2B returns, RMA and credit-note workflows','operations-hub','none-or-external-commerce-account','return request; RMA; inspection; credit note; restock','medium'],
 ['supplier-onboarding','Supplier onboarding, KYB evidence and contract records','professional-intelligence','authorized-external-business-data','supplier profile; KYB checklist; tax/bank evidence; contract status','medium'],
 ['supplier-discovery','Manufacturer, wholesaler and distributor discovery','commerce-research','external-fresh-public-or-authorized-data','supplier search; manufacturer discovery; distributor discovery; evidence comparison','low'],
 ['rfq-sourcing','Sourcing RFQ and bid comparison','professional-intelligence','authorized-external-supplier-rail','RFQ; sample request; MOQ; lead time; unit cost; Incoterms; quote comparison','medium'],
 ['private-label-oem','Private label, OEM and ODM sourcing workflow','operations-hub','authorized-external-supplier-rail','specification; sample; packaging; branding; QA; production approval','high'],
 ['dropshipping','B2B dropshipping and supplier fulfillment routing','commerce-engine','authorized-external-supplier-and-commerce-rail','supplier catalog; inventory; order routing; tracking; exception handling','medium'],
 ['kitting-bundling','Kitting, bundling and branded packaging workflows','business-operating-system','authorized-external-fulfillment-rail','bundle BOM; kitting instructions; packaging; inserts; assembly cost','medium'],
 ['inventory-sync','Multi-supplier inventory and availability normalization','data-platform','authorized-external-supplier-or-erp-data','SKU mapping; inventory sync; ATP; backorder; safety stock','medium'],
 ['pim-product-data','Product information management and supplier catalog normalization','data-platform','authorized-external-catalog-data','SKU; UPC/EAN/GTIN; variants; images; attributes; taxonomy','low'],
 ['edi-documents','EDI-style B2B document normalization','universal-tool-gateway','authorized-external-trading-partner-rail','PO; PO acknowledgement; ASN; invoice; inventory advice; status','medium'],
 ['erp-procurement','ERP and procurement integration','universal-tool-gateway','authorized-external-erp-account','vendor; requisition; PO; receipt; bill; sales order; inventory','medium'],
 ['freight-logistics','Freight, parcel, 3PL and fulfillment orchestration','operations-hub','authorized-external-logistics-rail','rate quote; shipment; label; pickup; tracking; exception; POD','medium'],
 ['customs-landed-cost','Customs, duties and landed-cost planning','finance-research','external-current-trade-and-carrier-data','HS code support; duty/tax estimate; Incoterms; landed cost; import documentation','medium'],
 ['partner-reseller-network','Distributor, dealer, reseller and sub-agent network management','crm-growth-engine','none','partner onboarding; territories; price tier; commission; rebate; performance','low'],
 ['b2b-prospecting','B2B company/contact prospecting and enrichment','sales-intelligence','authorized-external-business-data','company search; contact search; enrichment; intent; trigger; qualification','medium'],
 ['abm-outbound','Account-based marketing and multichannel B2B outreach','marketing-automation','authorized-external-messaging-and-ad-rails','ICP; account list; personalization; sequence; attribution','medium'],
 ['contracts-renewals','Commercial contract, renewal and obligation tracking','business-operating-system','none-or-external-esign-rail','MSA; SOW; supplier agreement; renewal; obligation; approval','medium'],
 ['commissions-rebates','B2B commissions, rebates and partner earnings','finance-research','external-payment-or-ledger-rail','commission rule; rebate; accrual; settlement; statement','high'],

 ['travel-agency-accounts','Travel agency, corporate client and sub-agent accounts','crm-growth-engine','none','agency profile; corporate account; sub-agent hierarchy; credit profile; markup plan','low'],
 ['travel-supplier-registry','Travel supplier and content-source registry','b2b-travel-distribution','external-travel-partner-contracts','GDS; NDC; airline; hotel wholesaler; OTA; activities; cars; transfers','medium'],
 ['travel-search-normalization','Unified travel search across replaceable suppliers','b2b-travel-distribution','external-live-travel-inventory','air; hotel; car; transfer; activity; package search normalization','medium'],
 ['air-offer-search','Flight offer search across GDS, NDC and aggregators','b2b-travel-distribution','external-live-air-inventory','origin/destination; dates; passenger mix; cabin; fares; branded fares','medium'],
 ['air-offer-price','Flight price confirmation and fare-rule capture','b2b-travel-distribution','external-live-air-inventory','reprice; availability confirm; fare rules; taxes; baggage; refundability','medium'],
 ['air-order-book','Flight booking/order creation','b2b-travel-distribution','authorized-external-air-ticketing-rail','passenger data; selected offer; payment; order/PNR; confirmation','high'],
 ['air-ticketing','Ticket issue/void authority boundary','b2b-travel-distribution','authorized-ticketing-consolidator-gds-or-accreditation','ticket issue; e-ticket; void; ticket number; BSP/ARC/consolidator boundary','high'],
 ['air-ancillaries','Seats, bags and flight ancillary sales','b2b-travel-distribution','authorized-external-air-inventory','seat map; bags; meals; lounge; priority; ancillary pricing','high'],
 ['air-change-reshop','Flight changes, reshop and exchanges','b2b-travel-distribution','authorized-external-air-servicing-rail','reshop; exchange quote; additional collection; residual; reissue','high'],
 ['air-cancel-refund','Flight cancellation and refund workflows','b2b-travel-distribution','authorized-external-air-servicing-rail','cancel; void; refund quote; refund request; status','high'],
 ['air-disruption','Schedule change, disruption and reaccommodation workflow','b2b-travel-distribution','external-live-air-order-data','schedule change; involuntary change; re-accommodation; traveler notice','medium'],
 ['hotel-search-book','Hotel wholesale search, rate check and booking','b2b-travel-distribution','authorized-external-hotel-inventory','destination; occupancy; net rate; retail rate; cancellation policy; booking','high'],
 ['hotel-modify-cancel','Hotel modification and cancellation','b2b-travel-distribution','authorized-external-hotel-servicing-rail','retrieve; modify; cancel; penalty; refund/status','high'],
 ['cars-transfers','Car rental and transfer distribution','b2b-travel-distribution','authorized-external-ground-inventory','search; rate; booking; voucher; modify; cancel','high'],
 ['tours-activities','Tours, attractions and experiences distribution','b2b-travel-distribution','authorized-external-activities-inventory','content; availability; pricing; booking; voucher; cancel/amend','high'],
 ['travel-packages','Dynamic and contracted travel package assembly','b2b-travel-distribution','authorized-external-travel-inventory','air+hotel+activity; package pricing; margin; itinerary; terms','high'],
 ['travel-markup-commission','Travel net rate, markup, commission and service-fee engine','finance-research','authorized-external-travel-and-payment-data','net; sell; markup; commission; service fee; agent split; tax','high'],
 ['travel-credit-ledger','Agency/sub-agent wallet, credit and supplier settlement ledger','billing-engine','external-payment-and-supplier-settlement-rail','deposit; credit limit; wallet; debit; settlement; reconciliation','high'],
 ['corporate-travel-policy','Corporate travel policy, budget and approval engine','operations-hub','authorized-external-corporate-account','policy; preferred suppliers; cabin/hotel caps; approval; exception','medium'],
 ['corporate-travel-expense','Travel + expense reconciliation','finance-research','authorized-external-card-expense-account','card; receipt; trip grouping; expense category; reimbursement; reconciliation','high'],
 ['traveler-profiles','Traveler profiles, loyalty and preferences','knowledge-workspace','authorized-external-sensitive-traveler-data','identity fields; loyalty; seat preference; document references; emergency contact','high'],
 ['group-travel','Group travel request, quote and servicing workflow','b2b-travel-distribution','authorized-external-travel-supplier-rail','group request; block space; quote; deposit; rooming/passenger list; servicing','high'],
 ['travel-notifications','Traveler and agent itinerary/status notifications','communications-hub','authorized-external-messaging-rail','confirmation; schedule change; reminder; voucher; disruption; refund status','medium'],
 ['travel-white-label','White-label B2B/B2C/sub-agent travel portal contract','b2b-travel-distribution','external-live-travel-inventory','brand; domain; agent login; search; book; markup; wallet; reporting','medium'],
 ['travel-reporting','Travel sales, margin, booking and supplier analytics','data-platform','authorized-external-travel-data','bookings; GMV; net; margin; cancellations; supplier share; agent performance','low'],
 ['travel-support-queue','Post-booking travel servicing and support queues','operations-hub','authorized-external-travel-order-data','queue; SLA; ticket; PNR/order; supplier escalation; resolution receipt','medium']
]);

function initiative(risk,boundary){
 const consequential=risk==='high';
 const bounded=risk==='medium';
 return {
  suggestive:true,
  auto_initiate:risk==='low'&&!/external|authorized|account|rail|inventory|data|supplier/i.test(boundary),
  requires_confirmation:consequential||bounded||/authorized|account|payment|ticket|booking|supplier|external/i.test(boundary),
  action_class:consequential?'consequential':bounded?'bounded-action':'safe-native-or-research'
 };
}

function getBaseB2BCapabilityManifest(){
 return CAPS.map(([id,name,native_target,boundary,techniques,risk])=>({
  id:'b2b:'+id,
  connector_id:'magnanimous-b2b-network',
  connector_name:'Magnanimous B2B Wholesale & Travel Network',
  category:id.startsWith('travel-')||id.startsWith('air-')||id.startsWith('hotel-')||['cars-transfers','tours-activities','group-travel','corporate-travel-policy','corporate-travel-expense','traveler-profiles'].includes(id)?'b2b-travel':'b2b-commerce',
  capability:id,
  native_target,
  priority:'first-party-b2b',
  source_kind:'official-public-capability-research-and-magnanimous-first-party-contract',
  direct_connector:false,
  boundary,
  risk,
  absorption_status:'brain-spec-absorbed',
  implementation_status:'provider-neutral-contract',
  magnanimous_owned:['identity','memory','planning','policy','workflow-orchestration','tool-selection','normalization','verification','audit','learning'],
  external_only:boundary==='none'?[]:[boundary],
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  acceptance_tests:[
   'Magnanimous owns the normalized workflow and provider-neutral data contract.',
   'Existing platform functionality is preserved and reused before new dependencies are introduced.',
   'External supplier/account/ticketing/payment authority is explicit and never assumed.',
   'Search and recommendation may proceed read-only; booking, purchase, ticket issue, payment, cancellation, refund and account mutation require actual authorized rails.',
   'Provider-specific data is normalized without making the provider the Magnanimous product identity.',
   'A provider outage or removal must not delete Magnanimous-owned CRM, memory, policy, audit or workflow state.'
  ],
  recipe:[
   'Identify the business outcome and B2B account context.',
   'Route to an existing Magnanimous CRM, commerce, work, billing, research, data or travel-distribution surface.',
   'Use first-party normalized company, catalog, supplier, quote, order, booking and servicing objects.',
   boundary==='none'?'Execute natively and store evidence.':'Use only an explicitly authorized provider/account for live external data or action.',
   'Verify price, availability, terms and authority immediately before any consequential transaction.',
   'Record provider reference, normalized receipt, financial impact and post-action servicing state.',
   'Learn reusable workflow improvements without absorbing external credentials or proprietary implementation.'
  ],
  search_text:name+' '+techniques,
  authorization_state:'not-assumed',
  initiative:initiative(risk,boundary),
  research:{verified_at:VERIFIED_AT,proprietary_implementation_copied:false}
 }));
}

export function getB2BCapabilityManifest(){return [...getBaseB2BCapabilityManifest(),...getUniversalB2BCapabilityManifest()];}

export function getB2BConnectionCatalog(){return [...B2B_CONNECTIONS.map(x=>({...x,capabilities:[...x.capabilities],docs:[...x.docs]})),...getUniversalB2BConnectionCatalog()];}

export function getB2BSummary(){
 const rows=getB2BCapabilityManifest(),universal=getUniversalB2BSummary();
 return {
  verified_at:VERIFIED_AT,
  capability_contracts:rows.length,
  commerce_contracts:rows.filter(x=>x.category==='b2b-commerce').length,
  travel_contracts:rows.filter(x=>x.category==='b2b-travel').length,
  connection_templates:B2B_CONNECTIONS.length+universal.connections,
  protocol_adapters:universal.protocol_adapters,
  standards:universal.standards,
  opportunity_families:universal.opportunity_families,
  universal_capability_contracts:universal.capabilities,
  provider_identity_owner:false,
  provider_memory_owner:false,
  provider_workflow_owner:false,
  merchant_of_record_assumed:false,
  iata_arc_accreditation_assumed:false,
  status:'provider-neutral-b2b-network-defined'
 };
}
