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

function interactiveAssistantPage(request) {
  const referer = String(request.headers.get('referer') || '').trim();
  if (!referer) return false;
  try {
    const source = new URL(referer);
    const target = new URL(request.url);
    return source.origin === target.origin && source.pathname === '/assistant-actions';
  } catch (_) {
    return false;
  }
}

export async function requireConsequentialActionConfirmation(request) {
  if (request.method !== 'POST') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/api/assistant-integrations/actions') return null;

  const body = await request.clone().json().catch(() => ({}));
  const action = String(body?.action || '').trim();
  if (!WRITE_ACTIONS.has(action)) return null;

  // A deliberate click from the first-party Connected Assistant page is an
  // interactive user confirmation. Non-interactive callers must explicitly
  // assert confirm=true before the provider runtime is allowed to execute.
  if (body?.confirm === true || interactiveAssistantPage(request)) return null;

  return json({
    error: 'This action can publish, send, or otherwise change an external account. Confirm the action before it is executed.',
    code: 'ACTION_CONFIRMATION_REQUIRED',
    action,
    requires_confirmation: true
  }, 409);
}

export const CONSEQUENTIAL_WRITE_ACTIONS = Object.freeze([...WRITE_ACTIONS]);
