const VERIFIED_AT='2026-09-21';

export const MAGNANIMOUS_TRAVEL_AGENCY_POLICY=Object.freeze({
 identity_owner:'Magnanimous AI',
 reservation_record_owner:'Magnanimous AI',
 pricing_policy_owner:'Magnanimous AI',
 reseller_relationship_owner:'Magnanimous AI',
 supplier_credentials_private:true,
 raw_supplier_net_private:true,
 provider_identity_owner:false,
 live_price_revalidation_required:true,
 live_availability_revalidation_required:true,
 booking_authority_not_assumed:true,
 ticketing_authority_not_assumed:true,
 merchant_of_record_not_assumed:true,
 accreditation_not_assumed:true,
 cheapest_claim_requires_live_comparison:true,
 stale_quote_cannot_be_sold:true,
 external_provider_code_copied:false,
 additive_only:true
});

export const DEFAULT_TRAVEL_PRICING_POLICY=Object.freeze({
 owner_margin_bps:150,
 direct_retail_extra_bps:0,
 reseller_default_markup_bps:500,
 reseller_max_markup_bps:5000,
 max_owner_margin_bps:2500,
 quote_ttl_seconds:900,
 deal_proof_min_bookable_sources:2,
 currency_strategy:'compare-like-currency-only',
 rounding:'nearest-minor-unit'
});

export const TRAVEL_SUPPLIER_CATALOG=Object.freeze([
 {id:'duffel',name:'Duffel',products:['air','ancillaries'],role:'bookable-air-aggregator',adapter:'live-native',credential_keys:['DUFFEL_ACCESS_TOKEN'],supports_resale:true,docs:['https://duffel.com/docs/api/offer-requests','https://duffel.com/flights/content/managed']},
 {id:'pkfare',name:'PKFARE',products:['air','ancillaries'],role:'airfare-marketplace',adapter:'credential-ready',credential_keys:['PKFARE_PARTNER_ID','PKFARE_API_KEY'],supports_resale:true,docs:['https://www.pkfare.com/flight','https://apifox.pkfare.com/apidoc/docs-site/345083']},
 {id:'mystifly',name:'Mystifly SSP',products:['air','ancillaries'],role:'multisource-air-platform',adapter:'credential-ready',credential_keys:['MYSTIFLY_API_CREDENTIAL'],supports_resale:true,docs:['https://mystifly.com/','https://mystifly.com/ssp-paas/']},
 {id:'amadeus',name:'Amadeus',products:['air','hotel'],role:'gds-api',adapter:'credential-ready',credential_keys:['AMADEUS_CLIENT_ID','AMADEUS_CLIENT_SECRET'],supports_resale:true,docs:['https://developers.amadeus.com/']},
 {id:'sabre',name:'Sabre',products:['air','hotel','car'],role:'gds-ndc-api',adapter:'credential-ready',credential_keys:['SABRE_CLIENT_ID','SABRE_CLIENT_SECRET'],supports_resale:true,docs:['https://developer.sabre.com/']},
 {id:'travelport',name:'Travelport',products:['air','hotel','car'],role:'gds-ndc-api',adapter:'credential-ready',credential_keys:['TRAVELPORT_CLIENT_ID','TRAVELPORT_CLIENT_SECRET'],supports_resale:true,docs:['https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide']},
 {id:'verteil',name:'Verteil',products:['air','ancillaries'],role:'ndc-aggregator',adapter:'credential-ready',credential_keys:['VERTEIL_API_TOKEN'],supports_resale:true,docs:['https://www.verteil.com/travel-seller']},
 {id:'travelfusion',name:'Travelfusion',products:['air','rail','hotel'],role:'direct-connect-aggregator',adapter:'credential-ready',credential_keys:['TRAVELFUSION_API_TOKEN'],supports_resale:true,docs:['https://corporate.travelfusion.com/resources/xml-api']},
 {id:'travelgate',name:'Travelgate Hotel-X',products:['hotel'],role:'hotel-buyer-seller-network',adapter:'credential-ready',credential_keys:['TRAVELGATE_ACCESS_TOKEN','TRAVELGATE_PASSWORD'],supports_resale:true,docs:['https://docs.travelgate.com/docs/apis/for-buyers/hotel-x-pull-buyers-api/quickstart/']},
 {id:'hbx-hotelbeds',name:'HBX / Hotelbeds',products:['hotel','activities','transfers','car'],role:'bedbank-wholesaler',adapter:'credential-ready-mtls',credential_keys:['HBX_API_KEY','HBX_SECRET'],supports_resale:true,docs:['https://developer.hotelbeds.com/documentation/hotels/booking-api/']},
 {id:'ratehawk',name:'RateHawk',products:['hotel'],role:'hotel-wholesaler',adapter:'credential-ready',credential_keys:['RATEHAWK_API_KEY'],supports_resale:true,docs:['https://www.ratehawk.com/journey/api/']},
 {id:'tbo',name:'TBO',products:['hotel'],role:'hotel-wholesale-api',adapter:'credential-ready',credential_keys:['TBO_API_KEY'],supports_resale:true,docs:['https://www.tbo.com/tbo-api']},
 {id:'webbeds',name:'WebBeds',products:['hotel','ground'],role:'b2b-hotel-marketplace',adapter:'credential-ready',credential_keys:['WEBBEDS_API_CREDENTIAL'],supports_resale:true,docs:['https://www.webbeds.com/buyers/solutions/']},
 {id:'stuba',name:'Stuba',products:['hotel'],role:'hotel-wholesale-api',adapter:'credential-ready',credential_keys:['STUBA_AUTH_API_KEY'],supports_resale:true,docs:['https://developer.stuba.com/hapi/getting-started/']},
 {id:'expedia-rapid',name:'Expedia Rapid',products:['hotel','air','car','activities'],role:'travel-booking-api',adapter:'credential-ready',credential_keys:['EXPEDIA_RAPID_API_KEY','EXPEDIA_RAPID_SHARED_SECRET'],supports_resale:true,docs:['https://developers.expediagroup.com/rapid']},
 {id:'zentrumhub',name:'ZentrumHub',products:['hotel'],role:'hotel-aggregation-api',adapter:'credential-ready',credential_keys:['ZENTRUMHUB_API_KEY'],supports_resale:true,docs:['https://www.zentrumhub.com/']},
 {id:'viator',name:'Viator',products:['activities'],role:'activities-marketplace',adapter:'credential-ready',credential_keys:['VIATOR_API_KEY'],supports_resale:true,docs:['https://docs.viator.com/partner-api/']},
 {id:'getyourguide',name:'GetYourGuide',products:['activities'],role:'activities-marketplace',adapter:'credential-ready',credential_keys:['GETYOURGUIDE_API_TOKEN'],supports_resale:true,docs:['https://code.getyourguide.com/partner-api-spec/']},
 {id:'skyscanner',name:'Skyscanner Travel API',products:['air','hotel','car'],role:'benchmark-affiliate-metasearch',adapter:'benchmark-ready',credential_keys:['SKYSCANNER_API_KEY'],supports_resale:false,docs:['https://www.partners.skyscanner.net/product/travel-api']},
 {id:'juniper',name:'Juniper Booking Engine / Web Services',products:['air','hotel','rail','car','activities','cruise'],role:'distribution-technology-benchmark',adapter:'credential-ready',credential_keys:['JUNIPER_API_CREDENTIAL'],supports_resale:true,docs:['https://ejuniper.com/en/products/juniper-booking-engine/modules/web-services/']}
]);

export const TRAVEL_AGENCY_SKILLS=Object.freeze([
 ['multi-supplier-search','Search every eligible authorized supplier in parallel and preserve source attribution.'],
 ['lowest-net-routing','Rank normalized bookable supplier offers by true landed supplier cost before Magnanimous margin.'],
 ['best-sell-routing','Rank by final customer/reseller sell price after authorized fees and markup.'],
 ['deal-proof','State the exact number of live suppliers compared before using a lowest-price claim.'],
 ['benchmark-comparison','Compare bookable inventory with approved metasearch/affiliate benchmarks without treating benchmark links as booking authority.'],
 ['quote-freshness','Reject stale quotes and force revalidation before sale.'],
 ['price-revalidation','Reprice the selected supplier offer immediately before booking.'],
 ['availability-revalidation','Recheck capacity immediately before booking.'],
 ['owner-margin','Apply a small configurable Magnanimous wholesale margin in basis points.'],
 ['reseller-markup','Allow each approved sub-agent to add a bounded markup above Magnanimous wholesale.'],
 ['net-rate-secrecy','Keep raw supplier net cost and supplier credentials private from retail/reseller clients.'],
 ['wholesale-price','Expose a Magnanimous wholesale price to approved resellers.'],
 ['retail-price','Expose final retail sell price with transparent taxes/mandatory fees.'],
 ['margin-waterfall','Track supplier net, Magnanimous gross margin, reseller gross margin and final sell price separately.'],
 ['currency-isolation','Never compare prices across currencies without an explicit conversion quote.'],
 ['offer-deduplication','Collapse materially identical offers while preserving alternate supplier references.'],
 ['supplier-health-routing','Prefer reliable bookable suppliers when prices are equal or near-equal.'],
 ['cancellation-value','Score refundability and cancellation flexibility alongside price.'],
 ['ancillary-value','Compare baggage, seat and ancillary inclusions instead of headline fare alone.'],
 ['package-value','Combine air, hotel, car, transfer and activities without losing each supplier booking record.'],
 ['split-ticket-awareness','Represent split-ticket opportunities and their added servicing risk.'],
 ['private-fare-awareness','Preserve eligible private/corporate/tour fare inputs when authorized.'],
 ['reseller-onboarding','Create sub-agent accounts with status, markup policy and distribution credentials.'],
 ['reseller-api-key','Issue one-time-visible hashed distribution API keys; never store the raw key.'],
 ['reseller-rate-limit','Apply per-reseller quotas and abuse protection.'],
 ['reseller-ledger','Track Magnanimous wholesale amount, reseller margin, booking amount, refund and adjustment.'],
 ['source-api','Expose normalized search/price results to approved reseller systems.'],
 ['white-label-source','Allow an approved reseller to present its own brand while Magnanimous remains the source/control plane.'],
 ['booking-authority-check','Require real supplier/agency authority before booking or ticket issue.'],
 ['settlement-boundary','Keep customer collection, supplier settlement, BSP/ARC and reseller settlement as distinct ledgers.'],
 ['commission-separation','Keep expected supplier commission separate from guaranteed margin.'],
 ['service-fee-policy','Apply explicit service fees without disguising them as supplier taxes.'],
 ['deal-alerts','Identify meaningful verified price improvements from fresh supplier results.'],
 ['price-history','Retain non-sensitive normalized quote history for trend and conversion analysis.'],
 ['conversion-analysis','Measure search-to-book and margin without training on raw payment credentials.'],
 ['supplier-yield-analysis','Measure supplier competitiveness by route/destination/product and reliability.'],
 ['reseller-profit-analysis','Measure reseller margin and conversion without exposing supplier secrets.'],
 ['direct-contract-ingest','Support future direct hotel/DMC/airline contracted rates as another supplier rail.'],
 ['inventory-distribution','Distribute Magnanimous-owned/contracted inventory to approved downstream agencies.'],
 ['dynamic-packaging','Create compliant package quotes while preserving component terms and cancellation rules.']
].map(([id,description])=>({id,description,owner:'Magnanimous AI'})));

function int(v,d=0){const n=Number(v);return Number.isFinite(n)?Math.round(n):d}
export function amountToMinor(value){
 const s=String(value??'0').trim();
 if(!/^-?\d+(?:\.\d+)?$/.test(s))return 0;
 const neg=s.startsWith('-'),u=neg?s.slice(1):s,[a,b='']=u.split('.');
 const n=(Number(a||0)*100)+Number((b+'00').slice(0,2));
 return neg?-n:n;
}
export function minorToAmount(v){return (int(v)/100).toFixed(2)}

export function applyBps(amountMinor,bps){return Math.round(int(amountMinor)*int(bps)/10000)}

export function normalizeTravelOffer(input={}){
 const currency=String(input.currency||input.total_currency||'').trim().toUpperCase();
 const supplier=String(input.supplier||input.provider||'unknown').trim().toLowerCase();
 const net=int(input.net_minor??input.total_minor??amountToMinor(input.total_amount||input.amount||0));
 const taxes=int(input.tax_minor||0),mandatoryFees=int(input.mandatory_fee_minor||0),settlement=int(input.settlement_cost_minor||0);
 return{
  id:String(input.id||input.offer_id||crypto.randomUUID()),
  supplier,
  supplier_offer_ref:String(input.supplier_offer_ref||input.offer_id||input.id||''),
  product:String(input.product||'travel'),
  currency,
  supplier_net_minor:net,
  tax_minor:taxes,
  mandatory_fee_minor:mandatoryFees,
  settlement_cost_minor:settlement,
  true_cost_minor:net+taxes+mandatoryFees+settlement,
  bookable:input.bookable!==false,
  revalidated:input.revalidated===true,
  expires_at:input.expires_at||null,
  source_timestamp:input.source_timestamp||new Date().toISOString(),
  refundable:input.refundable===true,
  changeable:input.changeable!==false,
  baggage_summary:input.baggage_summary||null,
  itinerary:input.itinerary||null,
  raw_ref:input.raw_ref||null
 };
}

export function priceOffer(offerInput,policyInput={},resellerMarkupBps=0){
 const offer=normalizeTravelOffer(offerInput),policy={...DEFAULT_TRAVEL_PRICING_POLICY,...policyInput};
 const ownerBps=Math.max(0,Math.min(int(policy.owner_margin_bps,150),int(policy.max_owner_margin_bps,2500)));
 const resellerBps=Math.max(0,Math.min(int(resellerMarkupBps),int(policy.reseller_max_markup_bps,5000)));
 const ownerMargin=applyBps(offer.true_cost_minor,ownerBps);
 const wholesale=offer.true_cost_minor+ownerMargin;
 const resellerMargin=applyBps(wholesale,resellerBps);
 const retail=wholesale+resellerMargin;
 return{
  ...offer,
  pricing:{
   owner_margin_bps:ownerBps,
   owner_margin_minor:ownerMargin,
   magnanimous_wholesale_minor:wholesale,
   reseller_markup_bps:resellerBps,
   reseller_margin_minor:resellerMargin,
   final_sell_minor:retail
  }
 };
}

function fresh(row,ttl){
 const t=Date.parse(row.source_timestamp||'');
 return Number.isFinite(t)&&Date.now()-t<=Math.max(1,int(ttl,900))*1000;
}

export function rankTravelDeals(offers=[],policyInput={},resellerMarkupBps=0){
 const policy={...DEFAULT_TRAVEL_PRICING_POLICY,...policyInput};
 const priced=offers.map(o=>priceOffer(o,policy,resellerMarkupBps)).filter(o=>o.currency&&o.bookable&&fresh(o,policy.quote_ttl_seconds));
 const byCurrency=new Map();
 for(const row of priced){if(!byCurrency.has(row.currency))byCurrency.set(row.currency,[]);byCurrency.get(row.currency).push(row)}
 const groups=[];
 for(const [currency,rows] of byCurrency){
  rows.sort((a,b)=>a.pricing.final_sell_minor-b.pricing.final_sell_minor||Number(b.refundable)-Number(a.refundable));
  const sources=new Set(rows.map(x=>x.supplier));
  groups.push({
   currency,
   compared_bookable_sources:sources.size,
   lowest_verified:sources.size>=int(policy.deal_proof_min_bookable_sources,2),
   proof_label:sources.size>=int(policy.deal_proof_min_bookable_sources,2)?`Lowest verified across ${sources.size} live bookable sources`:`Best available from ${sources.size} live bookable source${sources.size===1?'':'s'}; wider-market cheapest not claimed`,
   best:rows[0]||null,
   alternatives:rows.slice(1,20)
  });
 }
 return groups;
}

export function publicTravelOffer(row,{includeWholesale=false}={}){
 if(!row)return null;
 const out={
  id:row.id,supplier:row.supplier,product:row.product,currency:row.currency,
  sell_amount:minorToAmount(row.pricing?.final_sell_minor||0),
  refundable:row.refundable,changeable:row.changeable,baggage_summary:row.baggage_summary,
  itinerary:row.itinerary,expires_at:row.expires_at
 };
 if(includeWholesale)out.wholesale_amount=minorToAmount(row.pricing?.magnanimous_wholesale_minor||0);
 return out;
}

export function getTravelSupplierReadiness(runtimeEnv={}){
 return TRAVEL_SUPPLIER_CATALOG.map(row=>{
  const configured=row.credential_keys.length>0&&row.credential_keys.every(k=>String(runtimeEnv?.[k]||'').trim());
  return {...row,configured,live_search_verified:false,status:configured?'credentials-present':row.adapter};
 });
}

export function getTravelAgencySummary(){
 return{
  verified_at:VERIFIED_AT,
  suppliers:TRAVEL_SUPPLIER_CATALOG.length,
  skills:TRAVEL_AGENCY_SKILLS.length,
  native_live_adapters:TRAVEL_SUPPLIER_CATALOG.filter(x=>x.adapter==='live-native').length,
  reseller_source_api:true,
  owner_margin_default_bps:DEFAULT_TRAVEL_PRICING_POLICY.owner_margin_bps,
  cheapest_claim_requires_live_comparison:true,
  status:'magnanimous-travel-agency-portal-defined'
 };
}
