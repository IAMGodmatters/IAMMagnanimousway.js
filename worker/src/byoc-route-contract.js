export function runtimeTrue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

export function genericByocRouteContractReady(env, { coreReady = false } = {}) {
  try {
    if (coreReady) return false;
    if (!runtimeTrue(env?.VOIP_PROVIDER_ROUTE_CONTROL_ENABLED)) return false;
    if (!env?.VOIP_PROVIDER_URL || !env?.VOIP_PROVIDER_HEALTH_URL || !env?.VOIP_PROVIDER_TOKEN) return false;
    const provider = new URL(String(env.VOIP_PROVIDER_URL));
    const health = new URL(String(env.VOIP_PROVIDER_HEALTH_URL));
    return provider.protocol === 'https:' && health.protocol === 'https:' && provider.origin === health.origin;
  } catch {
    return false;
  }
}

export async function verifyGenericByocRoute(env, selected, routePlan, fetchImpl = fetch) {
  const routeKey = String(selected?.bridge_route_key || '').trim();
  if (!genericByocRouteContractReady(env) || !routeKey) return null;
  const response = await fetchImpl(String(env.VOIP_PROVIDER_HEALTH_URL), {
    method: 'GET',
    headers: {
      authorization: `Bearer ${env.VOIP_PROVIDER_TOKEN}`,
      accept: 'application/json',
      'x-iam-platform': 'I-AM-Magnanimous-Way',
      'x-iam-route-contract': 'magnanimous-selected-route-v1'
    },
    redirect: 'error'
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok || data?.selected_route_contract !== 'magnanimous-selected-route-v1') {
    const error = new Error('The carrier bridge did not verify the selected-route contract.');
    error.code = 'CARRIER_ROUTE_UNAVAILABLE';
    throw error;
  }
  const routes = Array.isArray(data.routes) ? data.routes : [];
  const route = routes.find(item => String(item?.route_key || '') === routeKey);
  const state = String(route?.status || '').trim().toLowerCase();
  const healthy = route?.healthy === true || ['up', 'ready', 'healthy', 'available', 'online'].includes(state);
  if (!route || !healthy) {
    const error = new Error('The selected BYOC route is not currently healthy.');
    error.code = 'CARRIER_ROUTE_UNAVAILABLE';
    throw error;
  }
  return {
    contract: 'generic-byoc-v1',
    route_id: selected.route_id,
    interconnect_id: selected.interconnect_id,
    bridge_route_key: routeKey,
    selection_mode: routePlan?.selection_mode || 'balanced',
    health: selected.health,
    quality_score: selected.quality_score,
    quality_source: selected.quality_source,
    estimated_rate: selected.estimated_rate
  };
}

export function selectedRouteConfirmed(provider, selectedRoute) {
  if (!selectedRoute || provider?.selected_route_applied !== true) return false;
  if (String(provider.route_id || '') !== String(selectedRoute.route_id || '')) return false;
  if (String(provider.interconnect_id || '') !== String(selectedRoute.interconnect_id || '')) return false;
  if (selectedRoute.contract === 'generic-byoc-v1') {
    return String(provider.bridge_route_key || '') === String(selectedRoute.bridge_route_key || '');
  }
  return true;
}
