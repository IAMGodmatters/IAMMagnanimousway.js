const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

function cleanClient(value) {
  const client = String(value || '').trim();
  return /^ca-pub-\d{10,24}$/.test(client) ? client : '';
}

function cleanSlot(value) {
  const slot = String(value || '').trim();
  return /^\d{5,24}$/.test(slot) ? slot : '';
}

export async function handleMonetization(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/monetization/config') return null;
  if (request.method !== 'GET') return json({ detail: 'Method not allowed.' }, 405);

  const revenueAuthorized = ['1','true','yes','on'].includes(String(env?.ADSENSE_REVENUE_AUTHORIZED||'').trim().toLowerCase());
  const client = revenueAuthorized ? cleanClient(env?.ADSENSE_CLIENT_ID) : '';
  const homeSlot = revenueAuthorized ? cleanSlot(env?.ADSENSE_SLOT_HOME) : '';
  return json({
    adsense_configured: Boolean(client),
    adsense_client_id: client || null,
    adsense_home_slot: homeSlot || null,
    auto_ads_ready: Boolean(client),
    revenue_authorized: revenueAuthorized && Boolean(client),
    sponsored_placements_endpoint: '/api/ads?placement=home',
    policy: 'Outside ads can render only after explicit revenue authorization. Owner-owned promotions and paid sponsored placements remain allowed; all other third-party advertising is blocked by default.'
  });
}
