import test from 'node:test';
import assert from 'node:assert/strict';
import {
  failedCheckoutSubscriptionReference,
  failedInvoiceSubscriptionReference,
  subscriptionFailureMatchesBillingRow
} from '../../worker/src/stripe-subscription-failure-guard.js';

const billingRow = overrides => ({
  tenant_id: 'tenant-1',
  plan: 'plus',
  stripe_customer_id: 'cus_1',
  stripe_subscription_id: 'sub_1',
  ...overrides
});
const providerSubscription = overrides => ({
  id: 'sub_1',
  customer: 'cus_1',
  status: 'past_due',
  current_period_end: 1900000000,
  metadata: { tenant_id: 'tenant-1', plan: 'plus' },
  ...overrides
});

test('failed one-time Checkout payments cannot be treated as subscription failures', () => {
  assert.equal(failedCheckoutSubscriptionReference({
    mode: 'payment', status: 'complete', payment_status: 'unpaid',
    subscription: null, metadata: { plan: 'plus' }
  }), null);
});

test('failed Checkout requires a completed subscription, recognized plan and subscription ID', () => {
  const base = { mode: 'subscription', status: 'complete', payment_status: 'unpaid', subscription: 'sub_1', metadata: { plan: 'plus' } };
  assert.equal(failedCheckoutSubscriptionReference({ ...base, status: 'open' }), null);
  assert.equal(failedCheckoutSubscriptionReference({ ...base, subscription: null }), null);
  assert.equal(failedCheckoutSubscriptionReference({ ...base, metadata: { plan: 'unknown' } }), null);
  assert.equal(failedCheckoutSubscriptionReference({ ...base, payment_status: 'paid' }), null);
  assert.equal(failedCheckoutSubscriptionReference({ ...base, payment_status: 'no_payment_required' }), null);
  assert.deepEqual(failedCheckoutSubscriptionReference({ ...base, customer: 'cus_1' }), {
    subscriptionId: 'sub_1', plan: 'plus', customerId: 'cus_1'
  });
});

test('signed plan references can supply a plan only when Checkout metadata omits it', () => {
  const object = { mode: 'subscription', status: 'complete', payment_status: 'unpaid', subscription: { id: 'sub_1' }, metadata: {}, customer: { id: 'cus_1' } };
  assert.equal(failedCheckoutSubscriptionReference(object), null);
  assert.deepEqual(failedCheckoutSubscriptionReference(object, 'pro'), {
    subscriptionId: 'sub_1', plan: 'business', customerId: 'cus_1'
  });
});

test('failed invoice requires an explicit Stripe subscription reference', () => {
  assert.equal(failedInvoiceSubscriptionReference({ id: 'in_1', customer: 'cus_1' }), null);
  assert.deepEqual(failedInvoiceSubscriptionReference({ id: 'in_1', subscription: 'sub_1', customer: 'cus_1' }), {
    subscriptionId: 'sub_1', plan: '', customerId: 'cus_1'
  });
  assert.deepEqual(failedInvoiceSubscriptionReference({
    id: 'in_2', parent: { subscription_details: { subscription: { id: 'sub_2' } } }, customer: 'cus_2'
  }), { subscriptionId: 'sub_2', plan: '', customerId: 'cus_2' });
});

test('only the exact current tenant subscription and customer can be downgraded', () => {
  const candidate = { subscriptionId: 'sub_1', plan: 'plus', customerId: 'cus_1' };
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow(), providerSubscription: providerSubscription(), tenantId: 'tenant-1'
  }), true);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow({ stripe_subscription_id: 'sub_old' }), providerSubscription: providerSubscription(), tenantId: 'tenant-1'
  }), false);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow({ tenant_id: 'tenant-2' }), providerSubscription: providerSubscription(), tenantId: 'tenant-2'
  }), false);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow({ stripe_customer_id: 'cus_other' }), providerSubscription: providerSubscription(), tenantId: 'tenant-1'
  }), false);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow(), providerSubscription: providerSubscription({ customer: 'cus_other' }), tenantId: 'tenant-1'
  }), false);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow(), providerSubscription: providerSubscription({ metadata: { tenant_id: 'tenant-2', plan: 'plus' } }), tenantId: 'tenant-1'
  }), false);
  assert.equal(subscriptionFailureMatchesBillingRow({
    candidate, billingRow: billingRow(), providerSubscription: providerSubscription({ metadata: { tenant_id: 'tenant-1', plan: 'business' } }), tenantId: 'tenant-1'
  }), false);
});

test('active, trialing and unknown Stripe states fail closed against stale payment-failure events', () => {
  const candidate = { subscriptionId: 'sub_1', plan: 'plus', customerId: 'cus_1' };
  for (const status of ['active', 'trialing', '', 'pending_unknown']) {
    assert.equal(subscriptionFailureMatchesBillingRow({
      candidate, billingRow: billingRow(), providerSubscription: providerSubscription({ status }), tenantId: 'tenant-1'
    }), false, status || '(empty)');
  }
});

test('known delinquent and terminal Stripe states can be reconciled against the current subscription', () => {
  const candidate = { subscriptionId: 'sub_1', plan: 'plus', customerId: 'cus_1' };
  for (const status of ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled', 'paused']) {
    assert.equal(subscriptionFailureMatchesBillingRow({
      candidate, billingRow: billingRow(), providerSubscription: providerSubscription({ status }), tenantId: 'tenant-1'
    }), true, status);
  }
});
