import adminApp from './admin-compat-entrypoint.js';
import providerApp from './provider-entrypoint.js';
import { handleOwnerLeads } from './owner-leads.js';
import { handleMux } from './mux-integration.js';
import { handleIntegrations } from './integrations.js';
import { handleAssistantIntegrations } from './assistant-integrations-runtime.js';
import { handleComposioManagedAuth, handleComposioAssistant } from './composio-managed-auth.js';
import { handlePlatformCredentials, getIntegrationRuntimeEnv } from './platform-credentials.js';
import { handleSocialPublishing } from './social-publishing-runtime.js';
import { handleKnowledge } from './knowledge-runtime.js';
import { handleMagnanimousBrain, getMagnanimousMemoryContext } from './magnanimous-brain-runtime.js';
import { handleMagnanimousSovereign } from './magnanimous-sovereign-runtime.js';
import { handleMagnanimousToolGateway } from './magnanimous-tool-gateway.js';
import { handleMagnanimousDns } from './magnanimous-dns-runtime.js';
import { handleMagnanimousRegistrar } from './magnanimous-registrar-runtime.js';
import { handleMagnanimousInkboxRouter } from './magnanimous-inkbox-router.js';
import { handleMagnanimousToolFoundry } from './magnanimous-tool-foundry.js';
import { handleWellness } from './wellness-runtime.js';
import { handleProfessionalWorkspace } from './professional-workspace-runtime.js';
import { handleFinancePeople } from './finance-people-v2.js';
import { handleCallCenterHealth } from './call-center-health-runtime.js';
import { handleContactCenter } from './contact-center-runtime.js';
import { handleContactCenterDialGuard } from './contact-center-dial-runtime.js';
import { handleProfessionalIvrStep } from './contact-center-ivr-routing-runtime.js';
import { handleTwilioSoftphone } from './twilio-softphone-runtime.js';
import { handleBpoOperations } from './bpo-operations-runtime.js';
import { handleEnterpriseCommercialization } from './enterprise-commercialization-runtime.js';
import { handleSupportFeedback } from './support-feedback-runtime.js';
import { handleBilling } from './billing-runtime.js';
import { handleTierBilling } from './billing-tiers-runtime.js';
import { handleBillingSupport } from './billing-support-runtime.js';
import { handleBillingCheckoutHardening } from './billing-checkout-hardening.js';
import { handleHardenedStripeWebhook } from './stripe-webhook-hardened.js';
import { handleVoiceAgent } from './voice-agent-runtime.js';
import { handlePhoneCarrier } from './phone-carrier-runtime.js';
import { handleAgentMesh } from './agent-mesh-runtime.js';
import { handleBootstrap } from './secure-bootstrap.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handlePaymentLinkBilling, augmentBillingResponse } from './payment-link-runtime.js';
import { requirePlatformOwner } from './platform-owner-guard.js';
import { handleMonetization } from './monetization-runtime.js';
import { handleBusinessEmail } from './business-email-runtime.js';
import { handleBusinessPlan } from './business-plan-subscription-runtime.js';
import { handleVisual } from './visual-runtime.js';
import { handleVideoAgents } from './video-agents-runtime.js';
import { premiumPreflight, premiumPostprocess } from './premium-runtime-guard.js';

const corsHeaders={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'Content-Type, Authorization, Stripe-Signature, X-Twilio-Signature','access-control-expose-headers':'Content-Type'};
function withCors(response){const headers=new Headers(response.headers);for(const[key,value]of Object.entries(corsHeaders))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
function isMagnanimousRoute(pathname){return pathname==='/api/providers'||pathname==='/api/operator/capabilities'||pathname==='/api/magnanimous/health'||pathname==='/api/odin/health'||pathname==='/api/chat'||pathname==='/api/tools';}
function needsProviderRuntime(pathname){return isMagnanimousRoute(pathname)||pathname.startsWith('/api/magnanimous/')||pathname.startsWith('/api/wellness')||pathname.startsWith('/api/business-plan')||pathname.startsWith('/api/visual')||pathname.startsWith('/api/video-agents')||pathname.startsWith('/api/phone')||pathname.startsWith('/api/contact-center')||pathname.startsWith('/api/social-connect')||pathname.startsWith('/api/enterprise')||pathname==='/api/plans'||pathname.startsWith('/api/billing')||pathname.startsWith('/api/voice-agent')||pathname.startsWith('/api/agents')||pathname==='/api/monetization/config';}
async function magnanimousChatRequest(request,env){if(request.method!=='POST')return request;try{const memory=await getMagnanimousMemoryContext(request,env);if(!memory)return request;const body=await request.clone().json();const message=String(body?.message||'').trim();if(!message)return request;return new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify({...body,message:`${message}${memory}`})});}catch{return request;}}

export default{async fetch(request,env,ctx){const url=new URL(request.url);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});try{
 const bootstrapResponse=await handleBootstrap(request,env);if(bootstrapResponse)return withCors(bootstrapResponse);
 const businessEmailResponse=await handleBusinessEmail(request,env);if(businessEmailResponse)return withCors(businessEmailResponse);
 const billingSupportResponse=await handleBillingSupport(request,env);if(billingSupportResponse)return withCors(billingSupportResponse);
 const providerEnv=needsProviderRuntime(url.pathname)?await getProviderRuntimeEnv(env):env;
 const premium=await premiumPreflight(request,providerEnv);if(premium.response)return withCors(premium.response);request=premium.request||request;
 if(url.pathname.startsWith('/api/enterprise')){const r=await handleEnterpriseCommercialization(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/social-connect')){const r=await handleSocialPublishing(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/contact-center')){const a=await handleTwilioSoftphone(request,providerEnv);if(a)return withCors(a);const b=await handleProfessionalIvrStep(request,providerEnv);if(b)return withCors(b);const c=await handleContactCenterDialGuard(request,providerEnv);if(c)return withCors(c);const d=await handleContactCenter(request,providerEnv);if(d)return withCors(await premiumPostprocess(d,providerEnv,premium.context));}
 if(url.pathname.startsWith('/api/bpo')){const r=await handleBpoOperations(request,env);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/wellness')){const r=await handleWellness(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/sovereign')){const r=await handleMagnanimousSovereign(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/tool-foundry')){const r=await handleMagnanimousToolFoundry(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/inkbox')){const r=await handleMagnanimousInkboxRouter(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/tools')){const r=await handleMagnanimousToolGateway(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/registrar')){const r=await handleMagnanimousRegistrar(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/dns')){const r=await handleMagnanimousDns(request,providerEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/magnanimous/')){const r=await handleMagnanimousBrain(request,providerEnv);if(r)return withCors(r);}
 const businessPlanResponse=await handleBusinessPlan(request,providerEnv);if(businessPlanResponse)return withCors(businessPlanResponse);
 const videoAgentsResponse=await handleVideoAgents(request,providerEnv);if(videoAgentsResponse)return withCors(await premiumPostprocess(videoAgentsResponse,providerEnv,premium.context));
 const visualResponse=await handleVisual(request,providerEnv);if(visualResponse)return withCors(await premiumPostprocess(visualResponse,providerEnv,premium.context));
 const agentResponse=await handleAgentMesh(request,providerEnv);if(agentResponse)return withCors(agentResponse);
 const monetizationResponse=await handleMonetization(request,providerEnv);if(monetizationResponse)return withCors(monetizationResponse);
 const checkoutHardeningResponse=await handleBillingCheckoutHardening(request,providerEnv);if(checkoutHardeningResponse)return withCors(checkoutHardeningResponse);
 const hardenedWebhookResponse=await handleHardenedStripeWebhook(request,providerEnv);if(hardenedWebhookResponse)return withCors(hardenedWebhookResponse);
 const tierBillingResponse=await handleTierBilling(request,providerEnv);if(tierBillingResponse)return withCors(await augmentBillingResponse(request,tierBillingResponse,providerEnv));
 const paymentLinkResponse=await handlePaymentLinkBilling(request,providerEnv);if(paymentLinkResponse)return withCors(paymentLinkResponse);
 const billingResponse=await handleBilling(request,providerEnv);if(billingResponse)return withCors(await augmentBillingResponse(request,billingResponse,providerEnv));
 const phoneCarrierResponse=await handlePhoneCarrier(request,providerEnv);if(phoneCarrierResponse)return withCors(await premiumPostprocess(phoneCarrierResponse,providerEnv,premium.context));
 const voiceAgentResponse=await handleVoiceAgent(request,providerEnv);if(voiceAgentResponse)return withCors(await premiumPostprocess(voiceAgentResponse,providerEnv,premium.context));
 if(url.pathname.startsWith('/api/mux')){const r=await handleMux(request,env);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/professional')){const runtimeEnv=await getIntegrationRuntimeEnv(env);const r=await handleProfessionalWorkspace(request,runtimeEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/finance-people')){const runtimeEnv=await getIntegrationRuntimeEnv(env);const r=await handleFinancePeople(request,runtimeEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/call-center-health')){const r=await handleCallCenterHealth(request,env);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/support/owner/')){const g=await requirePlatformOwner(request,env);if(g)return withCors(g);const r=await handleSupportFeedback(request,env,{platformOwner:true});if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/support')){const r=await handleSupportFeedback(request,env);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/knowledge')){const runtimeEnv=await getIntegrationRuntimeEnv(env);const r=await handleKnowledge(request,runtimeEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/assistant-integrations')){const runtimeEnv=await getIntegrationRuntimeEnv(env);const managed=await handleComposioAssistant(request,runtimeEnv);if(managed)return withCors(managed);const r=await handleAssistantIntegrations(request,runtimeEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/integrations/platform-credentials')){const g=await requirePlatformOwner(request,env);if(g)return withCors(g);const r=await handlePlatformCredentials(request,env);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/integrations')){const runtimeEnv=await getIntegrationRuntimeEnv(env);const managed=await handleComposioManagedAuth(request,runtimeEnv);if(managed)return withCors(managed);const r=await handleIntegrations(request,runtimeEnv);if(r)return withCors(r);}
 if(url.pathname.startsWith('/api/admin/')&&url.pathname!=='/api/admin/login'){const g=await requirePlatformOwner(request,env);if(g)return withCors(g);}
 if(url.pathname==='/api/admin/leads'){const r=await handleOwnerLeads(request,env);if(r)return withCors(r);}
 if(isMagnanimousRoute(url.pathname)){const routed=url.pathname==='/api/chat'?await magnanimousChatRequest(request,providerEnv):request;const r=await providerApp.fetch(routed,providerEnv,ctx);return withCors(await premiumPostprocess(r,providerEnv,premium.context));}
 return withCors(await adminApp.fetch(request,env,ctx));
}catch(error){return withCors(new Response(JSON.stringify({detail:error?.message||'Server error',code:'WORKER_RUNTIME_ERROR'}),{status:500,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}}));}}};