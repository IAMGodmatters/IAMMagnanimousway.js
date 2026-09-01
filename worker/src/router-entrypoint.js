import adminApp from './admin-compat-entrypoint.js';
import providerApp from './provider-entrypoint.js';
import { handleOwnerLeads } from './owner-leads.js';
import { handleMux } from './mux-integration.js';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
  'access-control-expose-headers': 'Content-Type'
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isOdinRoute(pathname) {
  return pathname === '/api/providers' ||
    pathname === '/api/odin/health' ||
    pathname === '/api/chat' ||
    pathname === '/api/tools';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (url.pathname.startsWith('/api/mux')) {
        const muxResponse = await handleMux(request, env);
        if (muxResponse) return withCors(muxResponse);
      }

      if (url.pathname === '/api/admin/leads') {
        const leadsResponse = await handleOwnerLeads(request, env);
        if (leadsResponse) return withCors(leadsResponse);
      }

      // Odin/provider traffic must not depend on legacy auth-table repair. The AI
      // binding is independent of D1, so provider detection and inference should
      // remain available even if an old database row/schema needs repair.
      if (isOdinRoute(url.pathname)) {
        return withCors(await providerApp.fetch(request, env, ctx));
      }

      return withCors(await adminApp.fetch(request, env, ctx));
    } catch (error) {
      return withCors(new Response(JSON.stringify({
        detail: error?.message || 'Server error',
        code: 'WORKER_RUNTIME_ERROR'
      }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      }));
    }
  }
};
