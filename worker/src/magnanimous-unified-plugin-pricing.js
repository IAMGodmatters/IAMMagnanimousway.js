import {PROVIDER_PRICE_MARKUP_PERCENT,variableCustomerCharge} from './provider-origin-pricing.js';

export const MAGNANIMOUS_PLUGIN_PRICING_VERIFIED_AT='2026-09-28';
export const MAGNANIMOUS_PLUGIN_BASE_FEE_USD=0;

export const MAGNANIMOUS_PLUGIN_PRICING_POLICY=Object.freeze({
  product:'Magnanimous AI — All-in-One ChatGPT Operations Plugin',
  base_fee_usd:MAGNANIMOUS_PLUGIN_BASE_FEE_USD,
  markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,
  billing_model:'free-native-plus-prepaid-pass-through',
  charge_timing:'before a paid direct-cost operation starts, reserve customer-funded wallet credit; after verified usage, charge actual direct origin cost plus exactly 20% markup',
  free_rule:'If the selected Magnanimous-native path has no verified direct metered origin cost, customer charge is $0.',
  paid_rule:'If a real direct metered origin cost is required, customer charge is verified direct origin cost × 1.20.',
  subscription_required_for_plugin:false,
  prepaid_required_for_paid_origin_cost:true,
  silent_owner_funding:false,
  provider_benchmark_only:true,
  stripe_role:'payment settlement and prepaid wallet funding; Stripe processing fees are not represented as Magnanimous markup',
  customer_value:'one Magnanimous connection instead of separate TinyFish, Railway and Cloudflare plugins for the supported native contracts'
});

export const MAGNANIMOUS_PLUGIN_BENCHMARKS=Object.freeze({
  tinyfish:Object.freeze({
    source:'https://www.tinyfish.ai/pricing',
    verified_at:'2026-09-28',
    note:'Public benchmark only; Magnanimous Native Web is the default supported path.',
    search_usd_per_request:0,
    fetch_usd_per_url:0,
    agent_usd_per_step:0.016,
    browser_usd_per_minute:0.002
  }),
  railway:Object.freeze({
    source:'https://docs.railway.com/pricing/plans',
    verified_at:'2026-09-28',
    note:'Public benchmark / optional capacity rail only. Bill customers from actual attributable direct cost, not from these benchmark rates unless that rail is actually used.',
    free_monthly_usd:0,
    hobby_monthly_minimum_usd:5,
    pro_monthly_minimum_usd:20,
    memory_usd_per_gb_minute:0.000231,
    cpu_usd_per_vcpu_minute:0.000463,
    egress_usd_per_gb:0.05,
    volume_usd_per_gb_minute:0.000003472222222
  }),
  cloudflare:Object.freeze({
    source:'https://developers.cloudflare.com/workers/platform/pricing/',
    verified_at:'2026-09-28',
    note:'Public benchmark / optional capacity rail only. Free/included allowances must not be charged as if they were direct customer cost.',
    workers_free_requests_per_day:100000,
    workers_paid_minimum_usd_per_month:5,
    workers_paid_included_requests_per_month:10000000,
    workers_overage_usd_per_million_requests:0.30,
    workers_included_cpu_ms_per_month:30000000,
    workers_overage_usd_per_million_cpu_ms:0.02,
    r2_free_storage_gb_month:10,
    r2_standard_storage_usd_per_gb_month:0.015,
    queues_free_operations_per_day:10000,
    queues_paid_included_operations_per_month:1000000,
    queues_overage_usd_per_million_operations:0.40
  })
});

const money=value=>Math.round((Math.max(0,Number(value)||0)+Number.EPSILON)*1e9)/1e9;

export function quoteMagnanimousPluginCost(providerOriginCostUsd=0){
  const origin=money(providerOriginCostUsd);
  const charge=variableCustomerCharge(origin);
  return{
    product:MAGNANIMOUS_PLUGIN_PRICING_POLICY.product,
    base_fee_usd:0,
    provider_origin_cost_usd:charge.provider_origin_cost_usd,
    magnanimous_markup_percent:PROVIDER_PRICE_MARKUP_PERCENT,
    magnanimous_markup_usd:charge.markup_usd,
    customer_charge_usd:charge.customer_charge_usd,
    charge_now:charge.customer_charge_usd>0,
    prepaid_required:charge.customer_charge_usd>0,
    formula:origin>0?'verified direct origin cost × 1.20':'$0 direct cost → $0 customer charge',
    processor_fee_note:'Payment-processor fees, taxes, FX and legally required surcharges are external settlement costs and are not counted as Magnanimous markup.'
  };
}

export function magnanimousPluginPricingSnapshot(){
  return{
    verified_at:MAGNANIMOUS_PLUGIN_PRICING_VERIFIED_AT,
    policy:MAGNANIMOUS_PLUGIN_PRICING_POLICY,
    benchmarks:MAGNANIMOUS_PLUGIN_BENCHMARKS,
    examples:[
      quoteMagnanimousPluginCost(0),
      quoteMagnanimousPluginCost(0.10),
      quoteMagnanimousPluginCost(1),
      quoteMagnanimousPluginCost(10)
    ]
  };
}
