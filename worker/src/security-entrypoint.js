import app from './operations-entrypoint.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';
import { recoverProfessionalGeneration } from './professional-resilience-runtime.js';
import { handleNativeWorkCrm } from './native-work-crm-runtime.js';

export default {
  async fetch(request, env, ctx) {
    const blocked = await securityPreflight(request, env);
    if (blocked) return securityPostflight(request, blocked, env);
    const url = new URL(request.url);
    const continuityRequest = request.method === 'POST' && url.pathname === '/api/professional/generate' ? request.clone() : null;
    if (url.pathname.startsWith('/api/operations')) {
      const nativeOperationsResponse = await handleNativeWorkCrm(request, env);
      if (nativeOperationsResponse) return securityPostflight(request, nativeOperationsResponse, env);
    }
    const response = await app.fetch(request, env, ctx);
    const resilientResponse = continuityRequest ? await recoverProfessionalGeneration(continuityRequest, env, response) : response;
    return securityPostflight(request, resilientResponse, env);
  },
  async scheduled(controller, env, ctx) {
    if (typeof app.scheduled === 'function') return app.scheduled(controller, env, ctx);
  }
};
