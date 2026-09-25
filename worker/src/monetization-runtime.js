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

  const ownerEnabled = String(env?.MAGNANIMOUS_AD_NETWORK_ENABLED||'').trim().toLowerCase()==='true';
  const client = ownerEnabled ? cleanClient(env?.ADSENSE_CLIENT_ID) : '';
  const homeSlot = ownerEnabled ? cleanSlot(env?.ADSENSE_SLOT_HOME) : '';
  const movieSlot = ownerEnabled ? cleanSlot(env?.ADSENSE_SLOT_MOVIE) : '';
  return json({
    adsense_configured: Boolean(client),
    adsense_client_id: client || null,
    adsense_home_slot: homeSlot || null,
    owner_enabled: ownerEnabled,
    auto_ads_ready: Boolean(client),
    adsense_movie_slot: movieSlot || null,
    movie_ads_ready: Boolean(client && movieSlot),
    sponsored_placements_endpoint: '/api/ads?placement=home',
    policy: 'Ads are displayed only through owner-provided sponsored links or an intentionally owner-enabled publisher account that pays I AM MAGNANIMOUS WAY™. Incentivized clicks and artificial impressions are prohibited.'
  });
}
