const WRITE_ACTIONS = new Set([
  'publish_post',
  'publish_media',
  'send_message',
  'send_mail',
  'manage_product',
  'create_campaign'
]);

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'cache-control': 'no-store' }
});

export async function requireConsequentialActionConfirmation(request) {
  if (request.method !== 'POST') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/api/assistant-integrations/actions') return null;

  const body = await request.clone().json().catch(() => ({}));
  const action = String(body?.action || '').trim();
  if (!WRITE_ACTIONS.has(action)) return null;

  // A write request is allowed to create a pending action, but approval must be
  // a separate request to /actions/:id/confirm. Never accept confirm=true or a
  // Referer header as proof of human approval because an automated caller can
  // manufacture either value in the same request that creates the action.
  if (body?.confirm === true) {
    return json({
      error: 'Create the pending action first, then approve it with the separate confirmation endpoint.',
      code: 'SEPARATE_ACTION_CONFIRMATION_REQUIRED',
      action,
      requires_confirmation: true
    }, 409);
  }
  return null;
}

export const CONSEQUENTIAL_WRITE_ACTIONS = Object.freeze([...WRITE_ACTIONS]);
