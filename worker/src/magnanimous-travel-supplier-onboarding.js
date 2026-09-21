export const SUPPLIER_ONBOARDING_STAGES=Object.freeze([
 'not_started','contacted','reply_pending','application_started','application_submitted',
 'sandbox_pending','sandbox_active','certification','commercial_review','contract_pending',
 'approved','credentials_pending','production_testing','live','blocked','declined'
]);

export const MAGNANIMOUS_TRAVEL_APPLICATION_PROFILE=Object.freeze({
 business_name:'I AM MAGNANIMOUS WAY™ / Magnanimous Travel',
 product_name:'Magnanimous Travel',
 website:'https://iammagnanimousway.com/',
 business_email:'godmattersinc@iammagnanimousway.com',
 operating_market:'Philippines',
 model:['B2C travel agency','B2B sub-agent/reseller distribution','provider-neutral travel API'],
 technical_model:'Normalize authorized supplier inventory, compare live bookable offers, apply a small Magnanimous source margin, then allow approved downstream resellers to add their own bounded markup.',
 accreditation_status:'No IATA/ARC ticketing authority is assumed. Seek supplier-managed ticketing, consolidator/host access, TIDS where useful, and own accreditation only when commercially justified.',
 asks:[
  'buyer/agency eligibility','sandbox/test access','commercial terms','deposit/prepaid/credit requirements',
  'production certification','ticketing/settlement model','non-IATA path','B2B redistribution rules',
  'minimum booking or search-to-book requirements','net/private/wholesale rate model'
 ],
 owner_rules:['Never claim accreditation not granted.','Never expose supplier credentials or raw net cost downstream.','Never mark a supplier live before production access is verified.']
});

export const TRAVEL_SUPPLIER_ONBOARDING=Object.freeze([
 {id:'duffel',priority:1,fit:'fast-air-launch',path:'sales + Flights API / Managed Content',action:'Await sales response; create/connect API account when approved.',url:'https://duffel.com/contact-us',startup_path:'Managed Content can reduce early accreditation dependency.',initial:{status:'contacted',channel:'email',destination:'sales@duffel.com',outcome:'delivered'}},
 {id:'pkfare',priority:1,fit:'airfare-marketplace',path:'buyer/API partnership',action:'Monitor queued outreach; retry only if mail fails, then complete buyer onboarding.',url:'https://www.pkfare.com/',startup_path:'Ask specifically for buyer API, ticketing model, deposit/credit and redistribution rights.',initial:{status:'contacted',channel:'email',destination:'partners@pkfare.com',outcome:'queued'}},
 {id:'mystifly',priority:1,fit:'multisource-air',path:'SSP commercial/API onboarding',action:'Await SSP sales response and request sandbox credentials.',url:'https://mystifly.com/ssp-paas/',startup_path:'Ask for non-IATA access and settlement model.',initial:{status:'reply_pending',channel:'email',destination:'growth@mystifly.com',outcome:'delivered'}},
 {id:'ratehawk',priority:1,fit:'hotel-fast-launch',path:'direct registration → free API key → certification',action:'Await RateHawk response; obtain free API key when issued, then complete certification.',url:'https://www.ratehawk.com/journey/api/',startup_path:'Official flow advertises free API key and certification.',initial:{status:'application_submitted',channel:'web',destination:'RateHawk API inquiry',outcome:'submitted 2026-09-21; privacy acknowledged; marketing opt-in declined'}},
 {id:'tbo',priority:1,fit:'hotel-air-b2b',path:'API/commercial onboarding',action:'Await TBO Air API support response; request buyer credentials and wallet/credit terms.',url:'https://www.tbo.com/tbo-api',startup_path:'Prioritize prepaid/wallet or consolidator-friendly access.',initial:{status:'reply_pending',channel:'email',destination:'apisupport@tboair.com',outcome:'delivered'}},
 {id:'webbeds',priority:1,fit:'hotel-wholesale',path:'APAC buyer/API sales',action:'Await APAC buyer response; request test environment and net-rate terms.',url:'https://www.webbeds.com/buyers/solutions/',startup_path:'Strong APAC hotel-wholesale candidate.',initial:{status:'reply_pending',channel:'email',destination:'apac.sales@webbeds.com',outcome:'delivered'}},
 {id:'stuba',priority:1,fit:'hotel-wholesale',path:'agency + HAPI onboarding',action:'Await sales response; request HAPI AuthApiKey and certification details.',url:'https://developer.stuba.com/hapi/getting-started/',startup_path:'Hotel API candidate for early multi-source deal proof.',initial:{status:'reply_pending',channel:'email',destination:'start@stuba.com',outcome:'delivered'}},

 {id:'expedia-rapid',priority:2,fit:'hotel-scale',path:'Rapid partner onboarding',action:'Apply for Rapid partner access and request sandbox/commercial review.',url:'https://developers.expediagroup.com/rapid',startup_path:'Useful hotel-scale rail once approved.',initial:{status:'not_started'}},
 {id:'hbx-hotelbeds',priority:2,fit:'bedbank-scale',path:'HBX buyer/API onboarding',action:'Apply as buyer/distributor; confirm mTLS, settlement and redistribution rights.',url:'https://developer.hotelbeds.com/documentation/hotels/booking-api/',startup_path:'Large bedbank; commercial approval and security setup expected.',initial:{status:'not_started'}},
 {id:'travelgate',priority:2,fit:'hotel-aggregation',path:'Hotel-X buyer connection',action:'Complete the user reCAPTCHA on the prepared Contact Travelgate form, then await sales response and HotelX onboarding.',url:'https://docs.travelgate.com/docs/apis/for-buyers/hotel-x-pull-buyers-api/quickstart/',startup_path:'Best after at least one seller relationship is ready.',initial:{status:'application_started',channel:'web',destination:'Contact Travelgate form',outcome:'all required fields prepared 2026-09-21; submission blocked only by reCAPTCHA'}},
 {id:'amadeus',priority:2,fit:'gds-self-service',path:'developer test → production/commercial',action:'Establish developer project, validate test APIs, then request appropriate production access.',url:'https://developers.amadeus.com/',startup_path:'Use self-service learning/test access without treating it as ticketing authority.',initial:{status:'not_started'}},
 {id:'travelport',priority:2,fit:'gds-ndc',path:'agency/API commercial onboarding',action:'Request agency/API onboarding and certification path.',url:'https://developer.travelport.com/',startup_path:'Enterprise commercial path; preserve as optional supplier rail.',initial:{status:'not_started'}},
 {id:'sabre',priority:2,fit:'gds-ndc',path:'agency/API commercial onboarding',action:'Request Sabre agency/API production onboarding and ticketing requirements.',url:'https://developer.sabre.com/',startup_path:'Enterprise path; do not block initial launch on approval.',initial:{status:'not_started'}},
 {id:'verteil',priority:2,fit:'ndc-air',path:'travel seller onboarding',action:'Apply as travel seller and request NDC commercial access.',url:'https://www.verteil.com/travel-seller',startup_path:'Use to broaden NDC airline content after initial air rail is live.',initial:{status:'not_started'}},
 {id:'travelfusion',priority:2,fit:'direct-connect-air',path:'XML API commercial onboarding',action:'Request XML API access, commercial terms and low-cost carrier content scope.',url:'https://corporate.travelfusion.com/resources/xml-api',startup_path:'Useful for LCC/direct-connect depth.',initial:{status:'not_started'}},
 {id:'zentrumhub',priority:2,fit:'hotel-aggregation',path:'API sales/onboarding',action:'Request hotel API trial, supplier coverage, pricing and redistribution rights.',url:'https://www.zentrumhub.com/',startup_path:'Potential aggregation accelerator.',initial:{status:'not_started'}},

 {id:'viator',priority:3,fit:'activities',path:'Partner API onboarding',action:'Apply for partner API when core air/hotel supply is live.',url:'https://docs.viator.com/partner-api/',startup_path:'Adds activities margin and packaging depth.',initial:{status:'not_started'}},
 {id:'getyourguide',priority:3,fit:'activities',path:'Partner API onboarding',action:'Apply for partner/supply connectivity after core launch.',url:'https://code.getyourguide.com/partner-api-spec/',startup_path:'Activities diversification.',initial:{status:'not_started'}},
 {id:'skyscanner',priority:3,fit:'benchmark',path:'Travel API partnership',action:'Request Travel API/affiliate access for market comparison; never treat referral results as bookable Magnanimous inventory.',url:'https://www.partners.skyscanner.net/product/travel-api',startup_path:'Use as external benchmark where terms permit.',initial:{status:'not_started'}},
 {id:'juniper',priority:3,fit:'distribution-tech',path:'Web Services commercial onboarding',action:'Evaluate only if native Magnanimous adapters cannot cover a required distribution gap.',url:'https://ejuniper.com/en/products/juniper-booking-engine/modules/web-services/',startup_path:'Technology accelerator, not a mandatory dependency.',initial:{status:'not_started'}}
]);

export function onboardingFor(id){return TRAVEL_SUPPLIER_ONBOARDING.find(x=>x.id===id)||null}
export function onboardingSummary(rows=[]){
 const counts={};
 for(const r of rows)counts[r.status]=(counts[r.status]||0)+1;
 return{
  total:rows.length,
  priority_one:rows.filter(x=>Number(x.priority)===1).length,
  contacted_or_beyond:rows.filter(x=>x.status!=='not_started').length,
  live:rows.filter(x=>x.status==='live').length,
  blocked:rows.filter(x=>['blocked','declined'].includes(x.status)).length,
  by_status:counts
 };
}
