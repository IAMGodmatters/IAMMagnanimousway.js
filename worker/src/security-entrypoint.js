import app from './operations-entrypoint.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';
import { recoverProfessionalGeneration } from './professional-resilience-runtime.js';
import { handleNativeWorkCrm } from './native-work-crm-runtime.js';
import { applyPlatformResponseHeaders, requestCorrelationId, unhandledRequestFailure } from './request-observability.js';
import { resolveSessionRequest, revokeOpaqueSession, upgradeAuthResponseToOpaque } from './session-authority.js';
import { prepareCarrierWebhook, completeCarrierWebhook } from './carrier-webhook-security.js';
import { enforceAssistantActionPolicy, completeAssistantActionPolicy } from './assistant-action-policy.js';
import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';

const CANONICAL_HOST='iammagnanimousway.com';
const WWW_HOST='www.iammagnanimousway.com';
const LEGACY_WORDPRESS_EXACT=new Set([
  '/wp-login.php','/xmlrpc.php','/wp-cron.php','/wp-signup.php','/wp-activate.php','/readme.html','/license.txt'
]);
const LEGACY_WORDPRESS_PREFIXES=['/wp-admin','/wp-json','/wp-content','/wp-includes'];

const NATIVE_OPERATIONS_PATHS=new Set([
  '/api/operations/capabilities','/api/operations/summary','/api/operations/bootstrap-crm',
  '/api/operations/workspaces','/api/operations/boards','/api/operations/fields',
  '/api/operations/records','/api/operations/links','/api/operations/views',
  '/api/operations/automations','/api/operations/events','/api/operations/sequences',
  '/api/operations/activity'
]);
function isNativeOperationsPath(pathname){return NATIVE_OPERATIONS_PATHS.has(pathname)||pathname.startsWith('/api/operations/records/');}

function canonicalOrLegacyResponse(request){
  const url=new URL(request.url);
  const host=url.hostname.toLowerCase();
  const path=url.pathname.toLowerCase();
  if(host===WWW_HOST||url.protocol==='http:'){
    url.protocol='https:';
    url.hostname=CANONICAL_HOST;
    url.port='';
    return new Response(null,{status:308,headers:{location:url.toString(),'cache-control':'public, max-age=3600'}});
  }
  const legacy=LEGACY_WORDPRESS_EXACT.has(path)||LEGACY_WORDPRESS_PREFIXES.some(prefix=>path===prefix||path.startsWith(`${prefix}/`))||url.searchParams.has('rest_route');
  if(legacy){
    return new Response('This legacy WordPress endpoint has been permanently retired.\n',{
      status:410,
      headers:{
        'content-type':'text/plain; charset=utf-8',
        'cache-control':'public, max-age=3600, must-revalidate',
        'x-robots-tag':'noindex, noarchive, nosnippet',
        'link':'<https://iammagnanimousway.com/>; rel="canonical"'
      }
    });
  }
  return null;
}

function applyCanonicalRootHeaders(request,response){
  if(!response)return response;
  const url=new URL(request.url);
  if(url.hostname.toLowerCase()!==CANONICAL_HOST||url.pathname!=='/')return response;
  const headers=new Headers(response.headers);
  headers.set('link','<https://iammagnanimousway.com/>; rel="canonical"');
  headers.set('x-robots-tag','index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  headers.set('cache-control','public, max-age=300, must-revalidate');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function finalizeResponse(request,response){
  return applyPlatformResponseHeaders(request,applyCanonicalRootHeaders(request,response));
}

export default {
  async fetch(request, env, ctx) {
    const canonicalOrLegacy=canonicalOrLegacyResponse(request);
    if(canonicalOrLegacy)return finalizeResponse(request,canonicalOrLegacy);
    const requestId=requestCorrelationId(request);
    let carrierContext=null;
    let assistantContext=null;
    try{
      const url=new URL(request.url);
      if(request.method==='POST'&&url.pathname==='/api/auth/logout'){
        const logout=await revokeOpaqueSession(request,env,'logout');
        if(logout.handled)return finalizeResponse(request,await securityPostflight(request,logout.response,env));
      }

      carrierContext=await prepareCarrierWebhook(request,env,requestId);
      if(carrierContext.response)return finalizeResponse(request,await securityPostflight(request,carrierContext.response,env));
      const guardedRequest=carrierContext.request;

      const sessionResolution=await resolveSessionRequest(guardedRequest,env,requestId);
      if(sessionResolution.response)return finalizeResponse(request,await securityPostflight(guardedRequest,sessionResolution.response,env));
      const routedRequest=sessionResolution.request;

      const assistantPolicy=await enforceAssistantActionPolicy(routedRequest,env);
      if(assistantPolicy instanceof Response)return finalizeResponse(request,await securityPostflight(routedRequest,assistantPolicy,env));
      const policyRequest=assistantPolicy?.request||routedRequest;
      assistantContext=assistantPolicy?.context||null;

      const blocked = await securityPreflight(policyRequest, env);
      if (blocked) {
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,blocked,env);
        const completed=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,completed,env));
      }

      const policyUrl=new URL(policyRequest.url);
      let cloudflareResponse=null;
      if(policyUrl.pathname.startsWith('/api/cloudflare')){
        const cloudflareEnv=await getProviderRuntimeEnv(env);
        cloudflareResponse=await handleMagnanimousCloudflare(policyRequest,cloudflareEnv);
      }
      if(cloudflareResponse){
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,cloudflareResponse,env);
        const carrierCompleted=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,carrierCompleted,env));
      }

      const routedUrl = policyUrl;
      const continuityRequest = policyRequest.method === 'POST' && routedUrl.pathname === '/api/professional/generate' ? policyRequest.clone() : null;
      if (isNativeOperationsPath(routedUrl.pathname)) {
        const nativeOperationsResponse = await handleNativeWorkCrm(policyRequest, env);
        if (nativeOperationsResponse) return finalizeResponse(request,await securityPostflight(policyRequest, nativeOperationsResponse, env));
      }
      const response = await app.fetch(policyRequest, env, ctx);
      const resilientResponse = continuityRequest ? await recoverProfessionalGeneration(continuityRequest, env, response) : response;
      const sessionResponse=await upgradeAuthResponseToOpaque(request,resilientResponse,env);
      const assistantResponse=await completeAssistantActionPolicy(assistantContext,sessionResponse,env);
      const carrierResponse=await completeCarrierWebhook(carrierContext,assistantResponse,env);
      const securedResponse=await securityPostflight(policyRequest, carrierResponse, env);
      return finalizeResponse(request,securedResponse);
    }catch(error){
      const fallback=unhandledRequestFailure(request,error);
      const assistantCompleted=await completeAssistantActionPolicy(assistantContext,fallback,env).catch(()=>fallback);
      const completed=await completeCarrierWebhook(carrierContext,assistantCompleted,env).catch(()=>assistantCompleted);
      const secured=await securityPostflight(request,completed,env);
      return finalizeResponse(request,secured);
    }
  },
  async scheduled(controller, env, ctx) {
    if (typeof app.scheduled === 'function') return app.scheduled(controller, env, ctx);
  }
};