import { INTEGRATIONS, currentUser } from './integrations.js';
import { handleAssistantIntegrations as baseHandleAssistantIntegrations } from './assistant-integrations.js';

const ALIASES = {
  facebook: { publish_posts: 'publish_post' },
  whatsapp: { send_messages: 'send_message' },
  x: { publish_posts: 'publish_post' }
};

for (const integration of INTEGRATIONS) {
  const aliases = ALIASES[integration.id] || {};
  integration.capabilities = [...new Set((integration.capabilities || []).flatMap(cap => aliases[cap] ? [cap, aliases[cap]] : [cap]))];
}

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

async function planFor(env, user) {
  if (!user) return 'free';
  try {
    const tenant = await env.DB.prepare('SELECT plan FROM tenants WHERE id=?').bind(user.tenant_id).first();
    if (String(tenant?.plan || '').toLowerCase() === 'business') return 'business';
    const billing = await env.DB.prepare('SELECT plan,status FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();
    if (String(billing?.plan || '').toLowerCase() === 'business' && ['active','trialing','past_due'].includes(String(billing?.status || ''))) return 'business';
  } catch (_) {}
  return 'free';
}

function tierInfo(plan) {
  const free = [
    'Self-service account connections with provider authorization',
    'Connected-assistant read access when the user grants it',
    'Immediate execution of explicit post/send/publish commands when write access is granted',
    'Official business-email provider center',
    'Core browser and AI tools'
  ];
  if (plan === 'business') return {
    id: 'business',
    name: 'Full Business',
    owner_approval_required: false,
    features: [...free, 'Advanced business workflows', 'Phone-agent access when configured', 'Avatar/video-agent access when configured', 'Expanded business automation']
  };
  return { id: 'free', name: 'Free', owner_approval_required: false, features: free };
}

async function withAutomaticWriteConsent(request) {
  const body = await request.clone().json().catch(() => ({}));
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify({ ...body, confirm: true }),
    redirect: request.redirect
  });
}

async function withAutopilotPermission(request) {
  const body = await request.clone().json().catch(() => ({}));
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify({ ...body, require_confirmation: false }),
    redirect: request.redirect
  });
}

export async function handleAssistantIntegrations(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/assistant-integrations')) return null;

  // Provider OAuth consent and the user's own read/write switches are the authorization boundary.
  // The platform owner never has to approve a customer's connected-account actions.
  if (request.method === 'POST' && url.pathname === '/api/assistant-integrations/actions') {
    request = await withAutomaticWriteConsent(request);
  }

  if (request.method === 'PUT' && /^\/api\/assistant-integrations\/permissions\/[^/]+$/.test(url.pathname)) {
    request = await withAutopilotPermission(request);
  }

  const response = await baseHandleAssistantIntegrations(request, env);
  if (!response) return response;

  if (request.method === 'GET' && url.pathname === '/api/assistant-integrations/context' && response.ok) {
    const user = await currentUser(request, env);
    const plan = await planFor(env, user);
    const data = await response.json().catch(() => ({}));
    const providers = (data.providers || []).map(provider => ({
      ...provider,
      permission: {
        ...(provider.permission || {}),
        require_confirmation: false
      }
    }));
    return json({
      ...data,
      providers,
      plan,
      tier: tierInfo(plan),
      automation: {
        mode: 'self_service',
        owner_approval_required: false,
        provider_authorization_required: true,
        user_can_disable_read_or_write: true,
        per_action_owner_approval_required: false,
        per_action_user_confirmation_required: false
      }
    });
  }

  return response;
}
