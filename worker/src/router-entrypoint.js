import adminApp from './admin-compat-entrypoint.js';
import providerApp from './provider-entrypoint.js';
import { handleOwnerLeads } from './owner-leads.js';
import { handleMux } from './mux-integration.js';
import { handleIntegrations } from './integrations.js';
import { handleAssistantIntegrations } from './assistant-integrations-runtime.js';
import { handleComposioManagedAuth, handleComposioAssistant } from './composio-managed-auth.js';
import { handlePlatformCredentials, getIntegrationRuntimeEnv } from './platform-credentials.js';
import { handleKnowledge } from './knowledge-runtime.js';
import { handleProfessionalWorkspace } from './professional-workspace-runtime.js';
import { handleFinancePeople } from './finance-people-v2.js';
import { handleCallCenterHealth } from './call-center-health-runtime.js';
import { handleSupportFeedback } from './support-feedback-runtime.js';
import { handleBilling } from './billing-runtime.js';
import { handleBillingSupport } from './billing-support-runtime.js';
import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handleAgentMesh } from './agent-mesh-runtime.js';
import { handleBootstrap } from './secure-bootstrap.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handlePaymentLinkBilling, augmentBillingResponse } from './payment-link-runtime.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { handleMonetization } from './monetization-runtime.js';
import { handleBusinessEmail } from './business-email-runtime.js';
import { handleBusinessPlan } from './business-plan-runtime.js';
import { handleVisual } from './visual-runtime.js';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization, Stripe-Signature, X-Twilio-Signature',
  'access-control-expose-headers': 'Content-Type'
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isOdinRoute(pathname) {
  return pathname === '/api/providers' ||
    pathname === '/api/operator/capabilities' ||
    pathname === '/api/odin/health' ||
    pathname === '/api/chat' ||
    pathname === '/api/tools';
}

function needsProviderRuntime(pathname) {
  return isOdinRoute(pathname) ||
    pathname.startsWith('/api/business-plan') ||
    pathname.startsWith('/api/visual') ||
    pathname === '/api/plans' ||
    pathname.startsWith('/api/billing') ||
    pathname.startsWith('/api/voice-agent') ||
    pathname.startsWith('/api/agents') ||
    pathname === '/api/monetization/config';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    try {
      const bootstrapResponse = await handleBootstrap(request, env);
      if (bootstrapResponse) return withCors(bootstrapResponse);
      const businessEmailResponse = await handleBusinessEmail(request, env);
      if (businessEmailResponse) return withCors(businessEmailResponse);
      const billingSupportResponse = await handleBillingSupport(request, env);
      if (billingSupportResponse) return withCors(billingSupportResponse);
      const providerEnv = needsProviderRuntime(url.pathname) ? await getProviderRuntimeEnv(env) : env;
      const businessPlanResponse = await handleBusinessPlan(request, providerEnv);
      if (businessPlanResponse) return withCors(businessPlanResponse);
      const visualResponse = await handleVisual(request, providerEnv);
      if (visualResponse) return withCors(visualResponse);
      const agentResponse = await handleAgentMesh(request, providerEnv);
      if (agentResponse) return withCors(agentResponse);
      const monetizationResponse = await handleMonetization(request, providerEnv);
      if (monetizationResponse) return withCors(monetizationResponse);
      const paymentLinkResponse = await handlePaymentLinkBilling(request, providerEnv);
      if (paymentLinkResponse) return withCors(paymentLinkResponse);
      const billingResponse = await handleBilling(request, providerEnv);
      if (billingResponse) return withCors(await augmentBillingResponse(request, billingResponse, providerEnv));
      const voiceAgentResponse = await handleVoiceAgent(request, providerEnv);
      if (voiceAgentResponse) return withCors(voiceAgentResponse);
      if (url.pathname.startsWith('/api/mux')) {
        const muxResponse = await handleMux(request, env);
        if (muxResponse) return withCors(muxResponse);
      }

      if (url.pathname.startsWith('/api/professional')) {
        const runtimeEnv = await getIntegrationRuntimeEnv(env);
        const response = await handleProfessionalWorkspace(request, runtimeEnv);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/finance-people')) {
        const runtimeEnv = await getIntegrationRuntimeEnv(env);
        const response = await handleFinancePeople(request, runtimeEnv);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/call-center-health')) {
        const response = await handleCallCenterHealth(request, env);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/support/owner/')) {
        const guardResponse = await requirePlatformOwner(request, env);
        if (guardResponse) return withCors(guardResponse);
        const response = await handleSupportFeedback(request, env, { platformOwner: true });
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/support')) {
        const response = await handleSupportFeedback(request, env);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/knowledge')) {
        const runtimeEnv = await getIntegrationRuntimeEnv(env);
        const response = await handleKnowledge(request, runtimeEnv);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/assistant-integrations')) {
        const runtimeEnv = await getIntegrationRuntimeEnv(env);
        const managedResponse = await handleComposioAssistant(request, runtimeEnv);
        if (managedResponse) return withCors(managedResponse);
        const response = await handleAssistantIntegrations(request, runtimeEnv);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/integrations/platform-credentials')) {
        const guardResponse = await requirePlatformOwner(request, env);
        if (guardResponse) return withCors(guardResponse);
        const response = await handlePlatformCredentials(request, env);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/integrations')) {
        const runtimeEnv = await getIntegrationRuntimeEnv(env);
        const managedResponse = await handleComposioManagedAuth(request, runtimeEnv);
        if (managedResponse) return withCors(managedResponse);
        const response = await handleIntegrations(request, runtimeEnv);
        if (response) return withCors(response);
      }
      if (url.pathname.startsWith('/api/admin/') && url.pathname !== '/api/admin/login') {
        const guardResponse = await requirePlatformOwner(request, env);
        if (guardResponse) return withCors(guardResponse);
      }
      if (url.pathname === '/api/admin/leads') {
        const leadsResponse = await handleOwnerLeads(request, env);
        if (leadsResponse) return withCors(leadsResponse);
      }
      if (isOdinRoute(url.pathname)) return withCors(await providerApp.fetch(request, providerEnv, ctx));
      return withCors(await adminApp.fetch(request, env, ctx));
    } catch (error) {
      return withCors(new Response(JSON.stringify({ detail: error?.message || 'Server error', code: 'WORKER_RUNTIME_ERROR' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      }));
    }
  }
};