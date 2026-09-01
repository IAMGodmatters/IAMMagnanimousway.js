import { INTEGRATIONS } from './integrations.js';
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

export async function handleAssistantIntegrations(request, env) {
  return baseHandleAssistantIntegrations(request, env);
}
