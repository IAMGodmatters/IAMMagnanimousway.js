import { currentUserFromRequest } from './usage-guard.js';
import { CUSTOMER_MARKUP_PERCENT, FREE_FIRST_LIMITS, ORIGIN_PRICING, PRICING_EFFECTIVE_DATE, publicMeteredCatalog } from './magnanimous-provider-economics.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

export async function handleMagnanimousEconomics(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/magnanimous/economics'))return null;
  if(request.method!=='GET')return json({detail:'Method not allowed.'},405);

  if(url.pathname==='/api/magnanimous/economics'){
    return json({
      identity:'Magnanimous AI',
      free_first:true,
      free_first_allocation:{daily_neurons:FREE_FIRST_LIMITS.cloudflare_neurons_per_day},
      metered_upgrades:publicMeteredCatalog(),
      markup_percent:CUSTOMER_MARKUP_PERCENT,
      pricing_effective_date:PRICING_EFFECTIVE_DATE,
      prepaid_required:true,
      uncapped_owner_funded_usage:false,
      external_provider_names_public:false,
      outside_advertising_policy:'Only owner-owned or revenue-authorized paid placements may appear.'
    });
  }

  if(url.pathname==='/api/magnanimous/economics/origin-costs'){
    const user=await currentUserFromRequest(request,env);
    if(!user||user.role!=='owner')return json({detail:'Owner access required.'},403);
    return json({
      identity:'Magnanimous AI',
      owner_only:true,
      pricing_effective_date:PRICING_EFFECTIVE_DATE,
      markup_percent:CUSTOMER_MARKUP_PERCENT,
      free_first_limits:FREE_FIRST_LIMITS,
      origin_pricing:ORIGIN_PRICING
    });
  }

  return json({detail:'Economics route not found.'},404);
}
