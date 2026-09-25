export const BILLING_CATALOG={prepaid10:{price:'price_1UGsdJBqx3ebIzujLsXd4fbD',cents:1000,type:'prepaid'},prepaid25:{price:'price_1UGsdLBqx3ebIzujjuIyHJl2',cents:2500,type:'prepaid'},unlimited:{price:'price_1UGsdOBqx3ebIzujDBMRWFcm',cents:1999,type:'monthly',fair_use:true},annual:{price:'price_1UGsdQBqx3ebIzujn5X0tN1y',cents:19900,type:'annual',fair_use:true},ownership:{price:'price_1UGsdSBqx3ebIzuj566OxAry',cents:49900,type:'ownership',perpetualSoftware:true}};
export const COST_POLICY={reservePercent:20,minPrepaidCents:100,paidGpuRequiresFundedBalance:true,telecomRequiresFundedBalance:true,externalMeteredRequiresFundedBalance:true,unlimitedExcludesPassThroughInfrastructure:true,activateEntitlementOn:['checkout.session.completed','invoice.paid'],revokeOrReviewOn:['charge.dispute.created','charge.refunded']};
export function canSpend({balanceCents=0,estimatedCostCents=0,plan='free'}={}){if(estimatedCostCents<=0)return{allowed:true};const reserve=Math.max(COST_POLICY.minPrepaidCents,Math.ceil(estimatedCostCents*(1+COST_POLICY.reservePercent/100)));return{allowed:balanceCents>=reserve,requiredCents:reserve,balanceCents,reason:balanceCents>=reserve?'funded':'prepaid_required'}};
export function entitlement(plan){const p=BILLING_CATALOG[plan];if(!p)return{tier:'free'};return{tier:plan,fairUse:Boolean(p.fair_use),ownership:Boolean(p.perpetualSoftware),passThroughCostsPrepaid:true}};
export const HEAVY_USE_POLICY={windowHours:24,includedComputeCostCents:100,warningAtPercent:75,prepaidOverage:true,neverAllowUnfundedPassThrough:true,continuousUseMetering:true,concurrencyMultiplier:true};
export function usageCharge({plan='free',estimatedCostCents=0,usedIncludedCostCents=0,concurrency=1}={}){const cost=Math.max(0,Math.ceil(estimatedCostCents*Math.max(1,concurrency)));const included=plan==='unlimited'?Math.max(0,HEAVY_USE_POLICY.includedComputeCostCents-usedIncludedCostCents):0;const overage=Math.max(0,cost-included);return{costCents:cost,includedCents:Math.min(cost,included),prepaidChargeCents:overage,requiresFunding:overage>0,continuousMetering:true};}
export function maximumUseGuard({balanceCents=0,estimatedHourlyCostCents=0,hours=24,concurrency=1}={}){const projected=Math.ceil(estimatedHourlyCostCents*Math.min(hours,HEAVY_USE_POLICY.windowHours)*Math.max(1,concurrency));const funded=canSpend({balanceCents,estimatedCostCents:projected});return{...funded,projectedCostCents:projected,hours:Math.min(hours,24),action:funded.allowed?'allow_and_meter':'require_prepaid_topup'};}

export const CAP_UPGRADE_PATH={free:['prepaid10','prepaid25','unlimited'],prepaid10:['prepaid25','unlimited','annual'],prepaid25:['unlimited','annual'],unlimited:['annual','ownership'],annual:['ownership'],ownership:['prepaid10','prepaid25']};
export function capUpgrade({plan='free',balanceCents=0,requiredCents=0}={}){const options=CAP_UPGRADE_PATH[plan]||CAP_UPGRADE_PATH.free;const shortfall=Math.max(0,requiredCents-balanceCents);return{capped:shortfall>0,currentPlan:plan,shortfallCents:shortfall,upgradeRequired:shortfall>0,options:options.map(id=>({id,price:BILLING_CATALOG[id]?.price||null})),message:shortfall>0?'Usage cap reached. Upgrade your plan or add prepaid balance to continue premium metered usage.':'Usage remains funded.'};}


export const VARIABLE_USAGE_MARKUP_PERCENT=20;
export const VARIABLE_USAGE_MARKUP_BASIS_POINTS=2000;

/**
 * Audit variable pass-through usage without rounding provider cost up to a whole cent.
 * One USD = 1,000,000 micros. The customer charge is exactly provider origin cost + 20%,
 * rounded upward only to the next micro-unit so the platform never funds the remainder.
 */
export function auditableVariableCharge({providerOriginCostMicros=0}={}){
 const origin=Math.max(0,Math.ceil(Number(providerOriginCostMicros)||0));
 const customer=Math.ceil(origin*(10000+VARIABLE_USAGE_MARKUP_BASIS_POINTS)/10000);
 return{
  provider_origin_cost_micros:origin,
  markup_percent:VARIABLE_USAGE_MARKUP_PERCENT,
  markup_micros:Math.max(0,customer-origin),
  customer_charge_micros:customer
 };
}
