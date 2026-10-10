import fs from 'node:fs';

const refs=fs.readFileSync('worker/src/payment-reference.js','utf8');
const checkout=fs.readFileSync('worker/src/billing-checkout-hardening.js','utf8');
const links=fs.readFileSync('worker/src/payment-link-runtime.js','utf8');
const webhook=fs.readFileSync('worker/src/stripe-webhook-hardened.js','utf8');
const enterprise=fs.readFileSync('worker/src/enterprise-commercialization-runtime.js','utf8');
const tiers=fs.readFileSync('worker/src/billing-tiers-runtime.js','utf8');
const usage=fs.readFileSync('worker/src/usage-guard.js','utf8');
const pluginPricing=fs.readFileSync('worker/src/magnanimous-unified-plugin-pricing.js','utf8');

const checks=[
 ['paid catalog includes Plus, standalone CRM, Business and annual Business', /plus:[\s\S]*price_usd:\s*19\.99/.test(tiers)&&/crm:[\s\S]*price_usd:\s*79/.test(tiers)&&/business:[\s\S]*price_usd:\s*119/.test(tiers)&&/scale:[\s\S]*price_usd:\s*1190[\s\S]*cadence:\s*'year'/.test(tiers)&&tiers.includes("PLAN_ORDER = ['free', 'plus', 'crm', 'business', 'scale']")],
 ['Business bundle encodes required 20 percent pricing basis', tiers.includes('markup_percent:20')&&tiers.includes('calculated_usd:118.788')&&tiers.includes('rounded_price_usd:119')],
 ['payment references encode CRM and paid-plan identity', refs.includes('(plus|crm|business|pro|scale)')&&(refs.includes('iam:${tenantId}:plan:${normalized}')||refs.includes('iam:${tenant}:plan:${normalized}'))],
 ['legacy Business references remain backwards compatible', refs.includes("if (normalized === 'business') return tenant")],
 ['payment references support prepaid top-up identity', refs.includes('iam:${tenant}:topup')],
 ['checkout hardening validates CRM and Business terms', checkout.includes("crm:'crm-2026-10-10.1'")&&checkout.includes("business:'business-2026-10-10.1'")&&checkout.includes("scale:'business-annual-2026-10-10.1'")],
 ['checkout hardening blocks duplicate active subscriptions', checkout.includes('ACTIVE_SUBSCRIPTION_EXISTS')&&checkout.includes('stripe_subscription_id')],
 ['stale CRM Business Annual payment links cannot intercept checkout', links.includes("const LINK_KEYS={plus:'STRIPE_PAYMENT_LINK_PLUS'}")&&!links.includes("business:'STRIPE_PAYMENT_LINK_BUSINESS'")&&!links.includes("scale:'STRIPE_PAYMENT_LINK_SCALE'")],
 ['tier checkout verifies configured Stripe Price before use', tiers.includes('configuredPriceForPlan')&&tiers.includes('Number(data.unit_amount||0)!==unit')&&tiers.includes("String(data?.recurring?.interval||'')!==interval")],
 ['tier checkout safely falls back to inline recurring price data', tiers.includes("line_items[0][price_data][unit_amount]")&&tiers.includes("line_items[0][price_data][recurring][interval]")],
 ['prepaid top-up checkout binds top-up purpose into the payment reference', enterprise.includes('encodeTopupPaymentReference')&&enterprise.includes("client_reference_id',encodeTopupPaymentReference(tenant)")],
 ['webhook parses payment reference', webhook.includes('parsePaymentReference')],
 ['webhook requires confirmed payment before fulfillment', webhook.includes("if(!tenantId||!paymentConfirmed(object))return")],
 ['metadata plan wins when valid', webhook.includes("PLANS.has(metadataPlan)?metadataPlan")],
 ['webhook recognizes CRM and Business canonical plans', webhook.includes("const PLANS=new Set(['plus','crm','business','scale'])")&&webhook.includes("const PLAN_ALIAS={pro:'business'}")],
 ['stale legacy Business price cannot be remapped into new Business plan', webhook.includes("const plusId=String(env.STRIPE_PRICE_PLUS||'')")&&!webhook.includes("STRIPE_PRICE_BUSINESS||''),'business'")],
 ['top-up reference is recognized by webhook', webhook.includes("paymentReference.kind==='topup'?'premium_usage_topup'")],
 ['webhook signature has five-minute replay window', webhook.includes('Math.abs(now()-stamp)>300')],
 ['webhook events are deduplicated', webhook.includes('billing_webhook_events')&&webhook.includes('duplicate:true')],
 ['paid provider usage requires active Stripe-confirmed billing row', usage.includes("const paidActive=status==='active'")&&usage.includes("return{plan:'free',limits:PLAN_LIMITS.free,status:'unverified_legacy'}")],
 ['prepaid wallet refuses overspend', usage.includes('PREPAID_USAGE_BALANCE_EXHAUSTED')],
 ['subscription-free pass-through path exists for the all-in-one plugin', usage.includes('canUsePassThrough')&&usage.includes("code:'FREE_NATIVE_PATH'")&&usage.includes("code:'PREPAID_FUNDED'")],
 ['all-in-one plugin has zero base fee and exact 20% markup', pluginPricing.includes('MAGNANIMOUS_PLUGIN_BASE_FEE_USD=0')&&pluginPricing.includes("markup_percent:PROVIDER_PRICE_MARKUP_PERCENT")&&pluginPricing.includes("subscription_required_for_plugin:false")],
 ['all-in-one paid usage requires prepaid customer funding', pluginPricing.includes("prepaid_required_for_paid_origin_cost:true")&&pluginPricing.includes("silent_owner_funding:false")],
 ['metered AI router requires full prepaid pass-through funding', fs.readFileSync('worker/src/provider-entrypoint.js','utf8').includes('canUsePassThrough')&&fs.readFileSync('worker/src/provider-entrypoint.js','utf8').includes("estimated_provider_origin_cost_usd:reserve.provider_origin_cost_usd")],
 ['ChatGPT Magnanimous ask requests pass-through billing', fs.readFileSync('worker/src/magnanimous-universal-ai-connector.js','utf8').includes("billing_mode:'pass-through'")]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Payment safety lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Payment safety lock: ${checks.length} checks passed.`);
