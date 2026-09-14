import fs from 'node:fs';

const refs=fs.readFileSync('worker/src/payment-reference.js','utf8');
const checkout=fs.readFileSync('worker/src/billing-checkout-hardening.js','utf8');
const links=fs.readFileSync('worker/src/payment-link-runtime.js','utf8');
const webhook=fs.readFileSync('worker/src/stripe-webhook-hardened.js','utf8');
const enterprise=fs.readFileSync('worker/src/enterprise-commercialization-runtime.js','utf8');
const tiers=fs.readFileSync('worker/src/billing-tiers-runtime.js','utf8');
const usage=fs.readFileSync('worker/src/usage-guard.js','utf8');

const checks=[
 ['paid tier prices stay 19/49/99/199', /plus:[\s\S]*price_usd:\s*19/.test(tiers)&&/business:[\s\S]*price_usd:\s*49/.test(tiers)&&/pro:[\s\S]*price_usd:\s*99/.test(tiers)&&/scale:[\s\S]*price_usd:\s*199/.test(tiers)],
 ['payment references encode non-Business tier identity', refs.includes('iam:${tenantId}:plan:${normalized}')||refs.includes('iam:${tenant}:plan:${normalized}')],
 ['legacy Business references remain backwards compatible', refs.includes("if (normalized === 'business') return tenant")],
 ['payment references support prepaid top-up identity', refs.includes('iam:${tenant}:topup')],
 ['checkout hardening uses plan-bound references', checkout.includes('encodePlanPaymentReference')&&checkout.includes("client_reference_id',paymentReference")],
 ['payment-link runtime validates paid plans', links.includes('normalizePaidPlan')&&links.includes('INVALID_PLAN')],
 ['payment-link runtime uses plan-bound references', links.includes('encodePlanPaymentReference')&&links.includes("client_reference_id',paymentReference")],
 ['prepaid top-up checkout binds top-up purpose into the payment reference', enterprise.includes('encodeTopupPaymentReference')&&enterprise.includes("client_reference_id',encodeTopupPaymentReference(tenant)")],
 ['webhook parses payment reference', webhook.includes('parsePaymentReference')],
 ['webhook requires confirmed payment before fulfillment', webhook.includes("if(!tenantId||!paymentConfirmed(object))return")],
 ['metadata plan wins when valid', webhook.includes("PLANS.has(metadataPlan)?metadataPlan")],
 ['encoded reference plan is used when metadata is absent', webhook.includes("PLANS.has(referencePlan)?referencePlan:'business'")],
 ['top-up reference is recognized by webhook', webhook.includes("paymentReference.kind==='topup'?'premium_usage_topup'")],
 ['webhook signature has five-minute replay window', webhook.includes('Math.abs(now()-stamp)>300')],
 ['webhook events are deduplicated', webhook.includes('billing_webhook_events')&&webhook.includes('duplicate:true')],
 ['duplicate active subscriptions are blocked before checkout', checkout.includes('ACTIVE_SUBSCRIPTION_EXISTS')&&checkout.includes('stripe_subscription_id')],
 ['paid provider usage requires active Stripe-confirmed billing row', usage.includes("const paidActive=status==='active'")&&usage.includes("return{plan:'free',limits:PLAN_LIMITS.free,status:'unverified_legacy'}")],
 ['prepaid wallet refuses overspend', usage.includes('PREPAID_USAGE_BALANCE_EXHAUSTED')]
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} - ${name}`);
if(failed.length){console.error(`Payment safety lock failed: ${failed.length} check(s).`);process.exit(1)}
console.log(`Payment safety lock: ${checks.length} checks passed.`);
