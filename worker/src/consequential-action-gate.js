import { isApprovedAssistantActionRequest } from './assistant-action-policy.js';

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

  // The central policy creates pending actions. Only a Request object marked
  // in-memory after a separate approval may carry confirm=true downstream.
  // Headers, Referer and JSON fields are never trusted as approval by themselves.
  if (isApprovedAssistantActionRequest(request)) return null;
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
