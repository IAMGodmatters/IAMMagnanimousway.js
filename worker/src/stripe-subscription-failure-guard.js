const PLANS = new Set(['plus', 'crm', 'studio', 'business', 'scale']);
const PLAN_ALIAS = { pro: 'business' };
const stripeId = value => typeof value === 'string' ? value : String(value?.id || '');

function canonicalPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  return PLAN_ALIAS[raw] || raw;
}

export function failedCheckoutSubscriptionReference(object, signedPlan = '') {
  if (String(object?.mode || '') !== 'subscription') return null;
  if (String(object?.status || '') !== 'complete') return null;
  const paymentStatus = String(object?.payment_status || '').toLowerCase();
  if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') return null;
  const subscriptionId = stripeId(object?.subscription);
  const plan = canonicalPlan(object?.metadata?.plan || signedPlan);
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId) || !PLANS.has(plan)) return null;
  return { subscriptionId, plan, customerId: stripeId(object?.customer) };
}

export function failedInvoiceSubscriptionReference(object) {
  const subscriptionValue = object?.subscription
    ?? object?.parent?.subscription_details?.subscription
    ?? object?.subscription_details?.subscription;
  const subscriptionId = stripeId(subscriptionValue);
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) return null;
  return { subscriptionId, plan: '', customerId: stripeId(object?.customer) };
}

export function subscriptionFailureMatchesBillingRow({ candidate, billingRow, providerSubscription, tenantId = '' }) {
  if (!candidate || !billingRow || !providerSubscription) return false;
  const subscriptionId = stripeId(providerSubscription);
  if (!subscriptionId || subscriptionId !== candidate.subscriptionId) return false;
  if (subscriptionId !== String(billingRow.stripe_subscription_id || '')) return false;

  const rowTenant = String(billingRow.tenant_id || '');
  if (!rowTenant || (tenantId && String(tenantId) !== rowTenant)) return false;

  const rowCustomer = String(billingRow.stripe_customer_id || '');
  const providerCustomer = stripeId(providerSubscription.customer);
  if (candidate.customerId && rowCustomer && candidate.customerId !== rowCustomer) return false;
  if (candidate.customerId && providerCustomer && candidate.customerId !== providerCustomer) return false;
  if (rowCustomer && providerCustomer && rowCustomer !== providerCustomer) return false;

  const providerTenant = String(providerSubscription.metadata?.tenant_id || '');
  if (providerTenant && providerTenant !== rowTenant) return false;

  const rowPlan = canonicalPlan(billingRow.plan);
  const providerPlan = canonicalPlan(providerSubscription.metadata?.plan);
  if (candidate.plan && rowPlan && candidate.plan !== rowPlan) return false;
  if (candidate.plan && providerPlan && candidate.plan !== providerPlan) return false;
  if (providerPlan && rowPlan && providerPlan !== rowPlan) return false;

  // A delayed failure event must never revoke a subscription Stripe currently reports active.
  if (String(providerSubscription.status || '').toLowerCase() === 'active') return false;
  return true;
}
