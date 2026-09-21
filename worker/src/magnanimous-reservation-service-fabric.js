const VERIFIED_AT='2026-09-21';

export const MAGNANIMOUS_RESERVATION_POLICY=Object.freeze({
 brain_owner:'Magnanimous AI',
 reservation_record_owner:'Magnanimous AI',
 workflow_owner:'Magnanimous AI',
 provider_identity_owner:false,
 provider_memory_owner:false,
 supplier_inventory_not_assumed:true,
 booking_authority_not_assumed:true,
 ticketing_authority_not_assumed:true,
 merchant_of_record_not_assumed:true,
 settlement_authority_not_assumed:true,
 live_price_must_be_revalidated:true,
 live_availability_must_be_revalidated:true,
 idempotent_booking_required:true,
 duplicate_booking_prevention:true,
 external_confirmation_required_for_consequential_actions:true,
 preserve_provider_references:true,
 provider_specific_receipts_required:true,
 private_partner_lists_not_invented:true,
 proprietary_provider_code_copied:false
});

export const RESERVATION_LIFECYCLE=Object.freeze([
 {id:'discover',name:'Discover inventory',purpose:'Search eligible live or cached inventory through authorized supplier rails.',risk:'low'},
 {id:'normalize',name:'Normalize options',purpose:'Map provider-specific offers/rates/products to one Magnanimous reservation-option model.',risk:'low'},
 {id:'rank',name:'Rank and explain',purpose:'Compare total sell price, rules, flexibility, supplier quality, margin and traveler/buyer policy.',risk:'low'},
 {id:'revalidate',name:'Revalidate price and availability',purpose:'Reprice/recheck the exact selected option immediately before any hold or booking.',risk:'medium'},
 {id:'hold',name:'Hold inventory when supported',purpose:'Create a temporary price/inventory/order hold only through a provider that supports it.',risk:'high'},
 {id:'collect-authority',name:'Collect approval and payment authority',purpose:'Verify traveler/customer approval, payment authorization and agency/supplier rights.',risk:'high'},
 {id:'reserve',name:'Create reservation/order',purpose:'Create the supplier reservation/order and capture all supplier locators.',risk:'high'},
 {id:'fulfill',name:'Ticket or issue voucher',purpose:'Issue ticket, EMD, voucher or fulfillment document only when the connected rail grants authority.',risk:'high'},
 {id:'confirm',name:'Confirm and reconcile',purpose:'Retrieve the supplier record, verify status and amounts, and store the normalized receipt.',risk:'medium'},
 {id:'notify',name:'Deliver itinerary and documents',purpose:'Send confirmation, itinerary, ticket/voucher and policy information through authorized messaging rails.',risk:'medium'},
 {id:'monitor',name:'Monitor changes',purpose:'Track supplier schedule/status changes, queues, notifications and time-sensitive actions.',risk:'medium'},
 {id:'service',name:'Post-booking servicing',purpose:'Retrieve, amend, add services, exchange, cancel, refund or re-accommodate through the original authorized rail.',risk:'high'},
 {id:'settle',name:'Settle and reconcile',purpose:'Reconcile customer funds, supplier settlement, commission, markup, fees, debit/credit memos and refunds.',risk:'high'},
 {id:'learn',name:'Learn from outcome',purpose:'Improve routing and workflow reliability without absorbing secrets or proprietary implementation.',risk:'low'}
]);

export const RESERVATION_PROVIDER_GRAPH=Object.freeze([
 {
  id:'amadeus',name:'Amadeus',family:'air-hotel-distribution',connection_role:['inventory-source','booking-processor','order-management'],
  products:['air','hotel'],lifecycle:['discover','revalidate','reserve','confirm','service'],
  upstream:['airlines','hotel inventory sources','GDS/airline content subject to account product'],
  downstream:['travel agency','OTA','TMC','Magnanimous adapter'],
  settlement:['provider/account dependent','BSP/ARC or other agency settlement may apply to air'],
  authority:'API product credentials and commercial rights required',
  docs:['https://developers.amadeus.com/']
 },
 {
  id:'sabre',name:'Sabre',family:'gds-ndc-distribution',connection_role:['inventory-aggregator','booking-processor','ticketing-workflow','hotel-distribution'],
  products:['air','hotel','car'],lifecycle:['discover','revalidate','reserve','fulfill','confirm','monitor','service','settle'],
  upstream:['airlines','NDC airlines','GDS content','hotel/car suppliers'],
  downstream:['travel agencies','TMCs','OTAs','Magnanimous adapter'],
  settlement:['BSP/ARC/agency settlement and supplier rules may apply'],
  authority:'Sabre credentials/PCC/EPR and supplier ticketing rights required',
  docs:['https://developer.sabre.com/']
 },
 {
  id:'travelport',name:'Travelport',family:'gds-ndc-multicontent',connection_role:['inventory-aggregator','booking-processor','ticketing-workflow','multi-content-reservation'],
  products:['air','hotel','car'],lifecycle:['discover','revalidate','reserve','fulfill','confirm','monitor','service','settle'],
  upstream:['400+ airline content sources','GDS air','NDC airlines','LCCs','hotel suppliers','car suppliers'],
  downstream:['travel agencies','TMCs','OTAs','Magnanimous adapter'],
  settlement:['agency/supplier/BSP/ARC and payment configuration dependent'],
  authority:'Travelport account/PCC/API credentials and ticketing authority required where applicable',
  docs:['https://support.travelport.com/webhelp/JSONAPIs/Airv11/Content/Air11/APIReferences.htm','https://support.travelport.com/webhelp/JSONAPIs/Hotelv11/Content/Hotel11/General/HotelEndpoints.htm']
 },
 {
  id:'duffel',name:'Duffel',family:'air-order-platform',connection_role:['air-inventory-aggregator','offer-order-processor','managed-content-rail','payments-compatible'],
  products:['air','ancillaries'],lifecycle:['discover','revalidate','hold','collect-authority','reserve','fulfill','confirm','service','settle'],
  upstream:['airlines connected through Duffel','agency airline relationships when using accredited content'],
  downstream:['travel sellers','OTAs','Magnanimous adapter'],
  settlement:['Duffel balance/managed content or ARC/BSP cash for eligible accredited agents'],
  authority:'Duffel account and applicable airline/payment authority required',
  docs:['https://duffel.com/docs/api/offers','https://duffel.com/docs/api/orders','https://duffel.com/docs/guides/getting-started-with-flights']
 },
 {
  id:'hahnair',name:'Hahnair',family:'air-ticketing-distribution',connection_role:['validating-carrier','ticketing-rail','airline-distribution-network'],
  products:['air','interline'],lifecycle:['discover','reserve','fulfill','confirm','service','settle'],
  upstream:['350+ Hahnair partner airlines','GDS-distributed airline content','BSP/ARC markets'],
  downstream:['travel agencies','GDS users','airlines needing expanded distribution'],
  settlement:['HR-169 through applicable GDS/BSP/ARC processes'],
  authority:'agency/GDS and commercial eligibility required; provider rules determine ticketing',
  docs:['https://www.hahnair.com/en/hr-169','https://www.hahnair.com/en/global-sales-ticketing']
 },
 {
  id:'verteil',name:'Verteil',family:'ndc-aggregation',connection_role:['ndc-aggregator','booking-processor','ticketing-workflow','servicing-workflow'],
  products:['air','ancillaries'],lifecycle:['discover','revalidate','hold','collect-authority','reserve','fulfill','confirm','service','settle'],
  upstream:['NDC airlines','airline private/public/corporate offers'],
  downstream:['OTAs','TMCs','large travel agencies','sub-agents via approved commercial setup'],
  settlement:['BSP cash, cards, wallet and other provider-supported methods subject to setup'],
  authority:'Verteil commercial onboarding and airline/agency rights required',
  docs:['https://www.verteil.com/travel-seller']
 },
 {
  id:'travelfusion',name:'Travelfusion',family:'direct-connect-aggregation',connection_role:['air-content-aggregator','direct-connect-gateway','booking-processor'],
  products:['air','hotel','rail'],lifecycle:['discover','revalidate','reserve','confirm','monitor','service'],
  upstream:['412+ low-cost and scheduled airlines','direct-connect airline content','NDC/direct APIs','rail and other supported inventory'],
  downstream:['travel sellers','OTAs','Magnanimous adapter'],
  settlement:['provider/supplier/payment arrangement dependent'],
  authority:'Travelfusion commercial/API onboarding required',
  docs:['https://corporate.travelfusion.com/resources/xml-api','https://corporate.travelfusion.com/products-services']
 },
 {
  id:'expedia-rapid',name:'Expedia Group Rapid',family:'multicontent-travel-api',connection_role:['inventory-source','booking-processor','payment-token-rail','post-booking-service'],
  products:['lodging','air','car','activities'],lifecycle:['discover','revalidate','hold','collect-authority','reserve','confirm','service','settle'],
  upstream:['Expedia Group travel supply and contracted providers'],
  downstream:['travel partners','affiliates','Magnanimous adapter'],
  settlement:['Expedia Collect, property/vendor collect, affiliate/partner commercial terms'],
  authority:'Rapid partner credentials and product approval required',
  docs:['https://developers.expediagroup.com/rapid','https://developers.expediagroup.com/rapid/lodging','https://developers.expediagroup.com/rapid/flights/booking']
 },
 {
  id:'hbx-hotelbeds',name:'HBX Group / Hotelbeds API Suite',family:'hotel-activities-transfers',connection_role:['bedbank','activities-distributor','transfer-distributor','content-source'],
  products:['hotel','activities','transfers'],lifecycle:['discover','revalidate','reserve','confirm','service','settle'],
  upstream:['contracted hotel supply','activities suppliers','transfer suppliers'],
  downstream:['travel sellers','OTAs','tour operators','Magnanimous adapter'],
  settlement:['HBX commercial/client settlement terms'],
  authority:'HBX API key/secret and commercial account required',
  docs:['https://developer.hotelbeds.com/documentation/hotels/booking-api/','https://developer.hotelbeds.com/documentation/activities/booking-api/overview/','https://developer.hotelbeds.com/documentation/transfers/booking-api/overview/']
 },
 {
  id:'travelgate',name:'Travelgate Hotel-X',family:'hotel-connectivity-network',connection_role:['buyer-seller-switch','hotel-aggregator','normalization-gateway'],
  products:['hotel'],lifecycle:['discover','revalidate','reserve','confirm','service','settle'],
  upstream:['connected hotel sellers','bedbanks','wholesalers','hotel suppliers'],
  downstream:['hotel buyers','OTAs','travel platforms','Magnanimous adapter'],
  settlement:['underlying seller/buyer commercial relationship'],
  authority:'Travelgate buyer credentials plus seller access codes/contracts required',
  docs:['https://docs.travelgate.com/kb/connectivity-products/for-buyers/hotel-x/booking-flow/search/search-query/','https://docs.travelgate.com/kb/connectivity-products/for-buyers/hotel-x/booking-flow/quote/quote-query/','https://docs.travelgate.com/docs/apis/for-buyers/hotel-x-pull-buyers-api/booking-management/cancel/']
 },
 {
  id:'ratehawk',name:'RateHawk',family:'hotel-wholesale',connection_role:['accommodation-aggregator','booking-processor','content-source'],
  products:['hotel','accommodation'],lifecycle:['discover','revalidate','reserve','confirm','service','settle'],
  upstream:['220K+ direct accommodations','350+ accommodation suppliers','technology platforms and contracted supply'],
  downstream:['travel professionals','agencies','OTAs','technology platforms','Magnanimous adapter'],
  settlement:['RateHawk partner credit/card/VCC/commercial terms'],
  authority:'registration, API key and certification required',
  docs:['https://www.ratehawk.com/journey/api/']
 },
 {
  id:'tbo',name:'TBO',family:'hotel-wholesale',connection_role:['accommodation-aggregator','booking-processor','credit-payment-rail'],
  products:['hotel','accommodation'],lifecycle:['discover','revalidate','reserve','confirm','service','settle'],
  upstream:['direct/contracted accommodation supply','key sourcing platforms','publicly named partners including Expedia Group, WebBeds and hotel connectivity platforms'],
  downstream:['travel agents','enterprises','Magnanimous adapter'],
  settlement:['credit facility, card or virtual-card options subject to partner agreement'],
  authority:'TBO registration and API/commercial approval required',
  docs:['https://www.tbo.com/tbo-api']
 },
 {
  id:'zentrumhub',name:'ZentrumHub',family:'hotel-aggregation-platform',connection_role:['hotel-supplier-aggregator','booking-engine','portal-technology'],
  products:['hotel'],lifecycle:['discover','revalidate','reserve','confirm','service','settle'],
  upstream:['hotel suppliers and wholesalers connected to ZentrumHub'],
  downstream:['B2B portals','B2C portals','travel businesses','Magnanimous adapter'],
  settlement:['underlying supplier/commercial terms'],
  authority:'ZentrumHub partner/API credentials required',
  docs:['https://www.zentrumhub.com/']
 },
 {
  id:'viator',name:'Viator Partner API',family:'tours-activities',connection_role:['experience-marketplace','availability-source','booking-processor','post-booking-service'],
  products:['activities','tours','tickets'],lifecycle:['discover','revalidate','hold','collect-authority','reserve','fulfill','confirm','service','settle'],
  upstream:['experience/tour/activity suppliers on Viator'],
  downstream:['affiliate partners','booking affiliates','merchant partners','travel sellers','Magnanimous adapter'],
  settlement:['affiliate or merchant model and partner invoicing/payment terms'],
  authority:'API access level controls transactional endpoints; booking access must be explicitly approved',
  docs:['https://docs.viator.com/partner-api/','https://docs.viator.com/partner-api/technical/']
 },
 {
  id:'getyourguide',name:'GetYourGuide Partner API',family:'tours-activities',connection_role:['experience-marketplace','content-source','availability-source','booking-processor'],
  products:['activities','tours','tickets'],lifecycle:['discover','revalidate','reserve','fulfill','confirm','service'],
  upstream:['experience/activity suppliers connected to GetYourGuide'],
  downstream:['approved API partners','travel sites/apps','Magnanimous adapter'],
  settlement:['partner commercial terms'],
  authority:'partner account/access level/API token required; booking depends on approved access',
  docs:['https://api.getyourguide.com/','https://code.getyourguide.com/partner-api-spec/']
 },
 {
  id:'airline-direct-ndc',name:'Direct airline NDC/API',family:'airline-direct',connection_role:['first-party-airline-inventory','offer-order-source'],
  products:['air','ancillaries'],lifecycle:['discover','revalidate','hold','reserve','fulfill','confirm','service','settle'],
  upstream:['individual airline reservation/retailing systems'],
  downstream:['approved sellers','TMCs','OTAs','Magnanimous adapter'],
  settlement:['airline/agency agreement, BSP/ARC/card/wallet depending carrier'],
  authority:'airline commercial agreement and API credentials required',
  docs:['https://www.iata.org/en/programs/airline-distribution/retailing/ndc/']
 },
 {
  id:'host-consolidator',name:'Host agency / air consolidator',family:'air-ticketing',connection_role:['ticketing-authority-rail','private-net-fare-source','subagent-fulfillment'],
  products:['air'],lifecycle:['discover','reserve','fulfill','confirm','service','settle'],
  upstream:['airlines','GDS/NDC sources','private/net fare agreements'],
  downstream:['sub-agents','independent agencies','Magnanimous adapter'],
  settlement:['consolidator/host commercial terms and commission settlement'],
  authority:'signed commercial/sub-agent agreement required',
  docs:[]
 },
 {
  id:'iata-bsp',name:'IATA BSP',family:'air-settlement',connection_role:['agency-airline-reporting','remittance','settlement'],
  products:['air'],lifecycle:['settle'],
  upstream:['participating airlines','accredited agents'],
  downstream:['airline/agency settlement records'],
  settlement:['BSP'],
  authority:'IATA accreditation and BSP participation required',
  docs:['https://www.iata.org/en/services/finance/bsp/']
 },
 {
  id:'arc',name:'ARC',family:'air-settlement-us',connection_role:['agency-accreditation','ticketing-authority-validation','reporting','settlement'],
  products:['air'],lifecycle:['fulfill','settle'],
  upstream:['participating airlines','ARC-accredited agencies'],
  downstream:['US agency reporting/settlement'],
  settlement:['ARC'],
  authority:'ARC participation/accreditation required',
  docs:['https://www2.arccorp.com/arccheck/']
 },
 {
  id:'stripe',name:'Stripe',family:'payment-rail',connection_role:['customer-payment','refund-payment','billing'],
  products:['payments'],lifecycle:['collect-authority','settle'],
  upstream:['card/bank/payment networks exposed through Stripe account'],
  downstream:['Magnanimous billing/reservation checkout'],
  settlement:['Stripe account settlement'],
  authority:'authorized Stripe account and applicable payment compliance required',
  docs:['https://docs.stripe.com/']
 },
 {
  id:'brex-travel',name:'Brex Travel & Expense',family:'corporate-travel',connection_role:['corporate-policy','travel-expense','card-and-budget-context'],
  products:['corporate-travel','expense'],lifecycle:['rank','collect-authority','confirm','settle'],
  upstream:['corporate travel/card/expense products available to account'],
  downstream:['corporate traveler and finance workflows'],
  settlement:['corporate card/expense account'],
  authority:'authorized Brex corporate account required',
  docs:['https://www.brex.com/product/travel-expense-management']
 },
 {
  id:'navan',name:'Navan',family:'corporate-travel',connection_role:['corporate-booking-context','travel-policy','expense-workflow'],
  products:['corporate-travel','expense'],lifecycle:['rank','collect-authority','confirm','settle'],
  upstream:['travel and expense suppliers contracted by provider'],
  downstream:['corporate travelers','finance teams'],
  settlement:['corporate account terms'],
  authority:'authorized Navan corporate account required',
  docs:['https://navan.com/']
 }
]);

export const RESERVATION_PROVIDER_TOOLS=Object.freeze({
 amadeus:['flight offer search','flight offer pricing','flight order creation','flight order management','hotel search/list','hotel booking where product access allows'],
 sabre:['air shopping','offers/orders','NDC content','reservation creation','ticketing workflow','seat/ancillary workflow','hotel content/booking','car content/booking','agency servicing'],
 travelport:['air search','air pricing','fare rules','seat map','ancillary shop/price/book','reservation workbench','reservation commit/retrieve','ticket issue/retrieve/void','NDC reshop/reprice/modify','queues','hotel search/availability/rules/book/retrieve/modify/cancel','multi-content reservation'],
 duffel:['offer request','offer retrieval','order create','order hold','order payment','add services','order retrieve','change request/offers','cancel/refund workflow','airline-initiated change handling'],
 hahnair:['HR-169 validating-carrier ticketing','H1-Air/X1-Air GDS access','partner-airline ticketing','GDS ticketing assistance','refund/ADM policy servicing','NDC distribution through provider products'],
 verteil:['NDC shopping','branded/private/corporate fare search','ancillary shopping','booking hold','booking','ticketing','multiple forms of payment','void','cancel/refund','itinerary modification','post-ticket ancillary/EMD'],
 travelfusion:['XML flight search','real-time availability','automated booking','direct-connect airline content','LCC/NDC aggregation','rail content','hotel/prepackaged content where contracted'],
 'expedia-rapid':['property/geography/content','lodging shopping','price check','hold/resume','lodging booking','retrieve itinerary','room change/hard change','cancel','flight shopping/booking/manage','car shopping/booking','activities shopping/booking','payment tokenization API','notifications/typeahead'],
 'hbx-hotelbeds':['hotel content','hotel cache','hotel availability','check rates','hotel booking','booking list/detail','cancel/modify','activities content/search/check rate/book/post-booking','transfer availability/confirm/amend/cancel/retrieve'],
 travelgate:['Hotel-X search','quote/revalidation','book','booking query','cancel','buyer/seller mapping','supplier settings/context'],
 ratehawk:['accommodation content','real-time availability','rate shopping','booking','supplier aggregation','reviews/content synchronization','partner certification workflow'],
 tbo:['hotel/accommodation inventory','real-time pricing','availability','booking','cancellation-policy data','credit facility','card/VCC payment options','supplier aggregation'],
 zentrumhub:['hotel supplier aggregation','search','availability/rate normalization','booking engine','supplier connect','B2B portal','B2C portal','markup/agent distribution'],
 viator:['product content/search','bulk/modified content','real-time availability/pricing','booking questions','booking hold','cart booking','booking status','amendment check/quote/amend','cancel quote','cancel'],
 getyourguide:['configuration','tour/product content','availability','create booking','retrieve booking','cancel booking','supplier availability notifications','ticket redemption notifications where supported'],
 'airline-direct-ndc':['AirShopping','OfferPrice','ServiceList','OrderCreate','OrderRetrieve','OrderChange','ancillary offers','airline-specific ticket/fulfillment and servicing subject to agreement'],
 'host-consolidator':['private/net fare access','sub-agent booking','ticket issue','exchange/reissue','void/refund','airline servicing','commission/settlement reporting subject to contract'],
 'iata-bsp':['sales reporting','remittance','settlement','BSPlink workflows','airline-agent financial reconciliation'],
 arc:['agency status validation','ticketing-authority validation','sales/order reporting','settlement','refund/debit-credit reporting'],
 stripe:['customer payment authorization','tokenized payment methods','capture','refund','payment status/webhooks','dispute/chargeback evidence'],
 'brex-travel':['corporate travel policy context','budgets','corporate cards','travel/expense capture','approval/reimbursement workflows'],
 navan:['corporate travel policy','business travel booking context','expense workflow','corporate account controls']
});

export const RESERVATION_NORMALIZED_OBJECTS=Object.freeze({
 reservation_request:['id','tenant_id','requester','channel','trip_type','products','traveler_count','search_criteria','policy_context','created_at'],
 reservation_option:['id','request_id','product_type','provider','supplier','provider_offer_ref','segments_or_items','availability_status','net_amount','sell_amount','currency','commission','markup','fees','taxes','rules','expires_at','source_timestamp'],
 reservation_hold:['id','option_id','provider','provider_hold_ref','held_price','currency','expires_at','status','payment_required','release_policy'],
 reservation_record:['id','request_id','product_type','provider','supplier','provider_order_ref','locator','secondary_locators','status','travelers','items','financials','fulfillment_refs','servicing_state','created_at','updated_at'],
 traveler_profile_ref:['id','customer_id','authorized_profile_ref','loyalty_refs','preferences','document_refs','privacy_scope'],
 reservation_payment:['id','reservation_id','provider','payment_rail','payment_type','authorized_amount','captured_amount','currency','status','external_reference','refund_refs'],
 fulfillment_document:['id','reservation_id','document_type','issuer','document_number','provider_ref','status','issued_at','voided_at'],
 reservation_service_event:['id','reservation_id','event_type','provider','external_ref','old_state','new_state','financial_delta','currency','requested_by','approval_ref','created_at'],
 reservation_notification:['id','reservation_id','type','recipient_ref','channel','template','status','external_message_ref','sent_at'],
 reservation_settlement:['id','reservation_id','scheme','supplier','gross','net','commission','markup','fees','tax','refunds','debits_credits','remittance','currency','status']
});

export const RESERVATION_SKILLS=Object.freeze([
 ['inventory-routing','search','Select eligible providers based on product, market, account rights, latency, content quality and supplier coverage.'],
 ['multi-source-search','search','Fan out read-only searches to multiple authorized inventory rails and merge results safely.'],
 ['content-normalization','search','Normalize airline, hotel, car, transfer and activity content into canonical Magnanimous options.'],
 ['content-deduplication','search','Detect duplicate flights/properties/products while preserving source/provider attribution.'],
 ['airport-city-normalization','search','Normalize airport, city, station, port and geo identifiers without losing supplier codes.'],
 ['property-mapping','search','Map the same hotel/property across bedbanks and direct suppliers into a canonical property identity.'],
 ['room-rate-mapping','search','Normalize room, board, occupancy and rate-plan variants while preserving cancellation rules.'],
 ['air-offer-normalization','search','Normalize GDS, NDC, LCC and direct airline offers, brands, services and fare attributes.'],
 ['activity-option-mapping','search','Normalize activity options, sessions, age bands, capacity and pickup/logistics requirements.'],
 ['ground-option-mapping','search','Normalize car, rail, ferry, bus and transfer offers.'],
 ['supplier-ranking','search','Rank suppliers by live price, margin, servicing capability, cancellation flexibility and reliability evidence.'],
 ['policy-ranking','search','Apply corporate, agency, traveler or buyer policy to search ranking without altering supplier truth.'],
 ['price-breakdown','pricing','Normalize base, tax, surcharge, fee, commission, markup and total sell price.'],
 ['currency-normalization','pricing','Normalize currencies and preserve original supplier currency and conversion evidence.'],
 ['markup-service-fee','pricing','Apply approved markup/service-fee rules without changing supplier net-price evidence.'],
 ['commission-estimation','pricing','Represent expected commission separately from guaranteed/settled commission.'],
 ['fare-rule-interpretation','pricing','Explain fare/rate rules, refundability, penalties, baggage and change conditions.'],
 ['cancellation-policy-normalization','pricing','Normalize cancellation windows, penalties, no-show and refund rules across suppliers.'],
 ['reprice-before-book','pricing','Revalidate the chosen price immediately before hold or reservation creation.'],
 ['availability-recheck','pricing','Recheck live inventory/capacity immediately before a consequential booking action.'],
 ['price-expiry-monitor','pricing','Track offer/token/quote expiry and force refresh instead of using stale booking references.'],
 ['hold-eligibility','booking','Determine whether a provider supports a price, inventory or airline order hold.'],
 ['hold-create','booking','Create an authorized temporary hold and store expiry/provider reference.'],
 ['hold-release','booking','Release/cancel a hold when supported and capture the provider result.'],
 ['traveler-validation','booking','Validate required passenger/guest/driver/contact fields without inventing missing identity data.'],
 ['booking-question-resolution','booking','Collect provider-required booking questions and map answers to the provider contract.'],
 ['reservation-preflight','booking','Check credentials, authority, live price, availability, policy, approval and payment prerequisites.'],
 ['idempotency-guard','booking','Prevent duplicate reservations using request fingerprints, idempotency keys and provider reference reconciliation.'],
 ['create-reservation','booking','Create the supplier reservation/order only after preflight succeeds and confirmation is authorized.'],
 ['retrieve-reservation','booking','Retrieve the provider record and reconcile supplier status against Magnanimous state.'],
 ['multi-content-itinerary','booking','Combine air, hotel, car, transfer and activities under one Magnanimous itinerary without merging provider records incorrectly.'],
 ['booking-on-request','booking','Represent request/pending supplier states distinctly from confirmed inventory.'],
 ['supplier-locator-capture','booking','Store all PNR/order/itinerary/supplier locator variants and preserve source attribution.'],
 ['ticketing-authority-check','fulfillment','Verify actual issue/void authority before ticket issuance.'],
 ['air-ticket-issue','fulfillment','Issue an air ticket only through an explicitly authorized GDS/NDC/consolidator/airline rail.'],
 ['emd-ancillary-fulfillment','fulfillment','Issue or attach EMD/ancillary fulfillment when the provider supports it.'],
 ['voucher-generation','fulfillment','Store or generate customer-facing voucher references from confirmed supplier fulfillment data.'],
 ['document-reconciliation','fulfillment','Reconcile tickets, EMDs, hotel confirmations, car vouchers and activity tickets with the provider order.'],
 ['itinerary-delivery','communication','Build a normalized itinerary and deliver it through authorized customer communication rails.'],
 ['provider-notification-ingest','monitoring','Ingest signed/webhook/poll/queue provider changes and correlate them to the reservation record.'],
 ['schedule-change-detection','monitoring','Detect airline schedule changes and create servicing tasks without silently accepting them.'],
 ['supplier-status-monitor','monitoring','Monitor pending/on-request/confirmed/cancelled supplier statuses and timeouts.'],
 ['queue-management','monitoring','Represent GDS/provider queues and post-booking work queues as Magnanimous tasks.'],
 ['change-eligibility','servicing','Check whether a reservation can be amended, changed or exchanged before attempting mutation.'],
 ['change-quote','servicing','Quote date/room/flight/guest/service changes and preserve financial deltas.'],
 ['air-reshop','servicing','Search replacement air offers for exchange or involuntary reaccommodation.'],
 ['air-exchange-reissue','servicing','Commit authorized exchanges/reissues and reconcile new ticket/order documents.'],
 ['hotel-hard-change','servicing','Handle supplier-supported room/date/occupancy changes or safe cancel/rebook fallback.'],
 ['activity-amendment','servicing','Quote and apply supported tour/activity amendments through the original provider.'],
 ['ancillary-add','servicing','Add seats, bags, meals or services after booking when supported.'],
 ['cancel-quote','servicing','Obtain current cancellation eligibility, penalty and refund quote before cancellation.'],
 ['cancel-reservation','servicing','Cancel through the original provider and confirm final supplier status.'],
 ['refund-request','servicing','Submit authorized refund requests and track pending/completed provider refund status.'],
 ['void-window','servicing','Identify and use ticket void windows only when the issuing rail supports and authorizes voids.'],
 ['disruption-reaccommodation','servicing','Coordinate involuntary changes, alternatives, traveler approval and supplier actions.'],
 ['no-show-management','servicing','Represent no-show rules, penalties and provider actions without assuming refundability.'],
 ['customer-payment-orchestration','payments','Separate customer payment authorization/capture from supplier settlement and booking authority.'],
 ['supplier-payment-routing','payments','Route supplier payment through the method allowed by the connected supplier/account.'],
 ['virtual-card-workflow','payments','Represent VCC issuance/use/reconciliation only when an authorized payment provider/account supports it.'],
 ['payment-tokenization','payments','Use provider/payment tokenization instead of persisting raw sensitive card data.'],
 ['payment-failure-recovery','payments','Recover safely from authorization/capture failures without creating duplicate bookings.'],
 ['refund-payment-reconciliation','payments','Reconcile provider refund amount/status with customer refund action.'],
 ['commission-reconciliation','settlement','Compare expected vs settled commission and record discrepancies.'],
 ['bsp-settlement-reconciliation','settlement','Reconcile BSP reporting/remittance for authorized IATA agency workflows.'],
 ['arc-settlement-reconciliation','settlement','Reconcile ARC reporting/settlement for authorized US agency workflows.'],
 ['supplier-statement-reconciliation','settlement','Match supplier statements/invoices against normalized reservation records.'],
 ['adm-acm-reconciliation','settlement','Track airline debit/credit memo evidence, disputes and settlement impact.'],
 ['chargeback-evidence','settlement','Assemble reservation/payment/fulfillment evidence for authorized dispute workflows.'],
 ['reservation-audit-trail','governance','Preserve immutable action receipts, provider references, approvals and financial deltas.'],
 ['authority-matrix','governance','Represent which account can search, hold, book, ticket, void, change, cancel, refund and settle.'],
 ['provider-fallback','reliability','Fail over read-only search/ranking to alternative providers without moving an existing booking to another provider silently.'],
 ['circuit-breaker','reliability','Stop repeated failing provider calls and expose degraded-provider state.'],
 ['rate-limit-management','reliability','Respect provider quotas, backoff and retry rules without duplicating consequential actions.'],
 ['booking-reconciliation-retry','reliability','On ambiguous booking responses, retrieve/reconcile provider state before any retry.'],
 ['reservation-observability','reliability','Track latency, search success, quote-to-book, booking failure, cancellation and servicing metrics.'],
 ['supplier-health-score','reliability','Score connection health using recent technical and transaction evidence rather than marketing claims.']
].map(([id,category,description])=>({id,category,description,owner:'Magnanimous AI'})));

const CAPABILITIES=Object.freeze([
 ['reservation-provider-router','Provider-aware reservation routing','b2b-travel-distribution','authorized-external-live-inventory','provider eligibility; account rights; product; market; latency; supplier coverage; fallback','medium'],
 ['multi-source-reservation-search','Parallel multi-source inventory search','b2b-travel-distribution','authorized-external-live-inventory','air; hotel; car; transfer; activity; rail; cruise search fan-out; merge; dedupe','medium'],
 ['reservation-content-normalization','Cross-provider travel content normalization','data-platform','authorized-external-travel-content','canonical property; route; segment; product; room; rate; activity; supplier attribution','low'],
 ['reservation-option-ranking','Reservation option ranking and explanation','b2b-travel-distribution','authorized-external-live-inventory','price; policy; rules; margin; servicing; supplier quality; explanation','low'],
 ['reservation-price-revalidation','Live price revalidation','b2b-travel-distribution','authorized-external-live-inventory','price check; quote; repricing; token refresh; expiry; penalty rules','medium'],
 ['reservation-availability-revalidation','Live availability/capacity revalidation','b2b-travel-distribution','authorized-external-live-inventory','seat; room; car; ticket; transfer; activity capacity; on-request status','medium'],
 ['reservation-hold','Price/inventory/order hold abstraction','b2b-travel-distribution','authorized-external-provider-hold','hold; expiry; release; resume; inventory hold; price hold; air order hold','high'],
 ['reservation-preflight','Reservation transaction preflight','operations-hub','authorized-external-account-and-payment-data','credentials; authority; price; availability; approval; payment; idempotency','medium'],
 ['reservation-idempotency','Duplicate reservation prevention and reconciliation','operations-hub','authorized-external-provider-order-data','request fingerprint; idempotency key; ambiguous response; provider retrieve; duplicate guard','medium'],
 ['reservation-create','Create travel reservation/order','b2b-travel-distribution','authorized-external-booking-rail','traveler/guest; selected offer; payment reference; provider order; locator; confirmation','high'],
 ['reservation-retrieve','Retrieve and reconcile provider reservation','b2b-travel-distribution','authorized-external-booking-rail','PNR; order; itinerary; booking; supplier locator; status; documents; financials','medium'],
 ['reservation-multicontent','Unified multi-content itinerary record','b2b-travel-distribution','authorized-external-travel-order-data','air; hotel; car; transfer; activity; rail; cruise; separate supplier records; one itinerary','medium'],
 ['reservation-ticketing','Air ticket/fulfillment issue boundary','b2b-travel-distribution','authorized-ticketing-consolidator-gds-airline-or-accreditation','ticket; validating carrier; document number; EMD; issue; receipt','high'],
 ['reservation-voucher','Hotel/activity/car/transfer voucher fulfillment','b2b-travel-distribution','authorized-external-supplier-fulfillment','confirmation; voucher; ticket; supplier reference; fulfillment status','high'],
 ['reservation-notifications','Reservation confirmation and change notifications','communications-hub','authorized-external-messaging-rail','itinerary; confirmation; voucher; schedule change; cancellation; refund; delivery receipt','medium'],
 ['reservation-event-ingest','Provider booking-event ingestion','operations-hub','authorized-external-provider-event-data','webhook; queue; polling; change event; correlation; replay protection','medium'],
 ['reservation-schedule-change','Air schedule-change workflow','operations-hub','authorized-external-air-order-data','schedule change; old/new itinerary; traveler notice; acceptance; reaccommodation','high'],
 ['reservation-change-quote','Reservation change/amendment quote','b2b-travel-distribution','authorized-external-servicing-rail','change eligibility; new option; fare/rate difference; penalty; residual; refund','medium'],
 ['reservation-air-exchange','Air exchange/reshop/reissue','b2b-travel-distribution','authorized-external-air-servicing-rail','reshop; reprice; add collect; residual; reissue; new ticket/order','high'],
 ['reservation-hotel-modify','Hotel change/hard-change workflow','b2b-travel-distribution','authorized-external-hotel-servicing-rail','date; room; occupancy; guest; payment recapture; cancel/rebook fallback','high'],
 ['reservation-activity-amend','Activity/tour amendment workflow','b2b-travel-distribution','authorized-external-activities-servicing-rail','amendment quote; session; participant; logistics; booking update','high'],
 ['reservation-ancillary-add','Post-booking ancillary workflow','b2b-travel-distribution','authorized-external-air-servicing-rail','seat; bag; meal; service; payment; EMD; order update','high'],
 ['reservation-cancel-quote','Cancellation eligibility and refund quote','b2b-travel-distribution','authorized-external-servicing-rail','current policy; penalty; refundable amount; provider quote; expiry','medium'],
 ['reservation-cancel','Reservation cancellation','b2b-travel-distribution','authorized-external-servicing-rail','cancel; supplier status; penalty; release inventory; receipt','high'],
 ['reservation-refund','Reservation refund request and tracking','billing-engine','authorized-external-servicing-and-payment-rail','refund amount; provider status; customer refund; settlement; receipt','high'],
 ['reservation-void','Ticket/document void workflow','b2b-travel-distribution','authorized-external-ticketing-rail','void window; eligibility; ticket/EMD void; confirmation','high'],
 ['reservation-payment','Customer reservation payment orchestration','billing-engine','authorized-external-payment-rail','authorize; tokenize; capture; fail; retry; refund; payment reference','high'],
 ['reservation-supplier-payment','Supplier payment and VCC/credit routing','billing-engine','authorized-external-supplier-payment-rail','supplier collect; VCC; credit facility; wallet; balance; cash settlement; reconciliation','high'],
 ['reservation-settlement','Reservation financial settlement and commission reconciliation','finance-research','authorized-external-supplier-and-ledger-data','gross; net; commission; markup; fees; tax; refunds; statements; remittance','high'],
 ['reservation-bsp-arc','BSP/ARC reservation settlement boundary','finance-research','authorized-bsp-arc-agency-data','sales report; order/ticket; refund; debit/credit memo; remittance; settlement','high'],
 ['reservation-audit','Reservation evidence and audit ledger','business-operating-system','none','request; option; approval; provider reference; action receipt; financial delta; servicing event','low'],
 ['reservation-authority-matrix','Reservation action authority matrix','business-operating-system','none-or-authorized-external-account','search; hold; book; ticket; void; change; cancel; refund; settle permissions','low'],
 ['reservation-provider-health','Reservation provider health and reliability scoring','data-platform','authorized-external-provider-observability','latency; errors; booking success; ambiguous response; cancellation success; circuit breaker','low'],
 ['reservation-reconciliation','Ambiguous booking/result reconciliation','operations-hub','authorized-external-provider-order-data','timeout; retrieve; locator search; payment state; duplicate prevention; safe retry','medium']
]);

function initiative(risk,boundary){
 const consequential=risk==='high', bounded=risk==='medium';
 return{
  suggestive:true,
  auto_initiate:risk==='low'&&!/authorized|external|account|provider|inventory|payment/i.test(boundary),
  requires_confirmation:consequential||/booking|ticket|payment|refund|cancel|void|settle|authorized/i.test(boundary),
  action_class:consequential?'consequential':bounded?'bounded-action':'safe-native-or-research'
 };
}

export function getReservationCapabilityManifest(){
 return CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>({
  id:'reservation:'+id,
  connector_id:'magnanimous-reservation-service',
  connector_name:'Magnanimous Reservation Service Fabric',
  category:'b2b-travel',
  capability:id,
  native_target,
  priority:'first-party-reservation',
  source_kind:'official-public-provider-capability-research-and-magnanimous-first-party-contract',
  direct_connector:false,
  boundary,
  risk,
  absorption_status:'brain-spec-absorbed',
  implementation_status:'provider-neutral-contract',
  magnanimous_owned:['identity','memory','planning','policy','reservation-record','workflow-orchestration','tool-selection','normalization','verification','audit','learning'],
  external_only:boundary==='none'?[]:[boundary],
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  authorization_state:'not-assumed',
  acceptance_tests:[
   'Magnanimous owns the canonical reservation record and provider-independent workflow state.',
   'A provider credential never implies booking, ticketing, refund or settlement authority.',
   'Live price and availability are revalidated immediately before consequential booking actions.',
   'Ambiguous provider responses are reconciled by retrieve/status before retry to prevent duplicate bookings.',
   'Provider locators, receipts, documents and financial deltas are preserved for servicing and audit.',
   'External suppliers remain replaceable for new searches; existing bookings remain serviced through their original authorized rail.'
  ],
  initiative:initiative(risk,boundary),
  research:{verified_at:VERIFIED_AT,proprietary_implementation_copied:false}
 }));
}

export const RESERVATION_CONNECTION_READINESS=Object.freeze({
 amadeus:['AMADEUS_CLIENT_ID','AMADEUS_CLIENT_SECRET'],
 sabre:['SABRE_CLIENT_ID','SABRE_CLIENT_SECRET'],
 travelport:['TRAVELPORT_CLIENT_ID','TRAVELPORT_CLIENT_SECRET'],
 duffel:['DUFFEL_ACCESS_TOKEN'],
 'expedia-rapid':['EXPEDIA_RAPID_API_KEY','EXPEDIA_RAPID_SHARED_SECRET'],
 'hbx-hotelbeds':['HBX_API_KEY','HBX_SECRET'],
 travelgate:['TRAVELGATE_ACCESS_TOKEN','TRAVELGATE_PASSWORD'],
 ratehawk:['RATEHAWK_API_KEY'],
 zentrumhub:['ZENTRUMHUB_API_KEY'],
 viator:['VIATOR_API_KEY'],
 getyourguide:['GETYOURGUIDE_API_TOKEN'],
 verteil:['VERTEIL_API_TOKEN'],
 travelfusion:['TRAVELFUSION_API_TOKEN'],
 tbo:['TBO_API_KEY'],
 hahnair:['HAHNAIR_PARTNER_REFERENCE'],
 'brex-travel':['BREX_API_TOKEN'],
 navan:['NAVAN_API_TOKEN'],
 stripe:['STRIPE_SECRET_KEY']
});

export function getReservationProviderGraph(){
 return RESERVATION_PROVIDER_GRAPH.map(x=>({...x,connection_role:[...x.connection_role],products:[...x.products],lifecycle:[...x.lifecycle],upstream:[...x.upstream],downstream:[...x.downstream],settlement:[...(Array.isArray(x.settlement)?x.settlement:[x.settlement])],tools:[...(RESERVATION_PROVIDER_TOOLS[x.id]||[])],docs:[...x.docs]}));
}

export function getReservationSkillCatalog(){return RESERVATION_SKILLS.map(x=>({...x}));}
export function getReservationLifecycle(){return RESERVATION_LIFECYCLE.map(x=>({...x}));}
export function getReservationSummary(){
 return{
  verified_at:VERIFIED_AT,
  providers:RESERVATION_PROVIDER_GRAPH.length,
  capabilities:CAPABILITIES.length,
  skills:RESERVATION_SKILLS.length,
  lifecycle_stages:RESERVATION_LIFECYCLE.length,
  normalized_objects:Object.keys(RESERVATION_NORMALIZED_OBJECTS).length,
  provider_tool_contracts:Object.values(RESERVATION_PROVIDER_TOOLS).reduce((n,x)=>n+x.length,0),
  status:'magnanimous-reservation-service-defined'
 };
}
