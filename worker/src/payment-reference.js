const PLANS = new Set(['plus', 'business', 'pro', 'scale']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePaidPlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  return PLANS.has(plan) ? plan : '';
}

export function validTenantId(value) {
  return UUID_RE.test(String(value || '').trim());
}

export function encodePlanPaymentReference(tenantId, plan) {
  const tenant = String(tenantId || '').trim();
  const normalized = normalizePaidPlan(plan);
  if (!validTenantId(tenant) || !normalized) throw new Error('Invalid payment reference.');
  // Preserve the existing Business Payment Link reference during rollout so
  // already-configured production smoke checks and older Business links remain compatible.
  if (normalized === 'business') return tenant;
  return `iam:${tenant}:plan:${normalized}`;
}

export function encodeTopupPaymentReference(tenantId) {
  const tenant = String(tenantId || '').trim();
  if (!validTenantId(tenant)) throw new Error('Invalid payment reference.');
  return `iam:${tenant}:topup`;
}

export function parsePaymentReference(value) {
  const raw = String(value || '').trim();
  if (validTenantId(raw)) return { tenantId: raw, kind: 'legacy', plan: '' };

  const planMatch = raw.match(/^iam:([0-9a-f-]{36}):plan:(plus|business|pro|scale)$/i);
  if (planMatch && validTenantId(planMatch[1])) {
    return { tenantId: planMatch[1], kind: 'plan', plan: planMatch[2].toLowerCase() };
  }

  const topupMatch = raw.match(/^iam:([0-9a-f-]{36}):topup$/i);
  if (topupMatch && validTenantId(topupMatch[1])) {
    return { tenantId: topupMatch[1], kind: 'topup', plan: '' };
  }

  return { tenantId: '', kind: 'invalid', plan: '' };
}
