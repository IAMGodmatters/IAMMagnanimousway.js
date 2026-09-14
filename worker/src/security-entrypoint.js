import app from './operations-entrypoint.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';

export default {
  async fetch(request, env, ctx) {
    const blocked = await securityPreflight(request, env);
    if (blocked) return securityPostflight(request, blocked, env);
    const response = await app.fetch(request, env, ctx);
    return securityPostflight(request, response, env);
  },
  async scheduled(controller, env, ctx) {
    if (typeof app.scheduled === 'function') return app.scheduled(controller, env, ctx);
  }
};
