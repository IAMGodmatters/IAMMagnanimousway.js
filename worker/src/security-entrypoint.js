import app from './operations-entrypoint.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';
import { recoverProfessionalGeneration } from './professional-resilience-runtime.js';
import { handleNativeWorkCrm } from './native-work-crm-runtime.js';
import { applyPlatformResponseHeaders, requestCorrelationId, unhandledRequestFailure } from './request-observability.js';
import { resolveSessionRequest, revokeOpaqueSession, upgradeAuthResponseToOpaque } from './session-authority.js';
import { prepareCarrierWebhook, completeCarrierWebhook } from './carrier-webhook-security.js';
import { enforceAssistantActionPolicy, completeAssistantActionPolicy } from './assistant-action-policy.js';
import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';
import { handleMagnanimousInfrastructure } from './magnanimous-infrastructure-core.js';
import { handleMagnanimousCloudProvider } from './magnanimous-cloud-provider-core.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { currentUser } from './integrations.js';
import { isPlatformOwnerUser } from './agent-branch-intelligence.js';
import { handleVideoAgents } from './video-agent-runtime.js';
import { handleRenderEngine } from './magnanimous-render-engine.js';
import { handleCredentialVaultMigration } from './credential-vault-migration.js';

const CANONICAL_HOST='iammagnanimousway.com';
const WWW_HOST='www.iammagnanimousway.com';
const LEGACY_WORDPRESS_EXACT=new Set([
  '/wp-login.php','/xmlrpc.php','/wp-cron.php','/wp-signup.php','/wp-activate.php','/readme.html','/license.txt'
]);
const LEGACY_WORDPRESS_PREFIXES=['/wp-admin','/wp-json','/wp-content','/wp-includes'];
const CREDENTIAL_VAULT_PATHS=new Set(['/api/platform-credentials','/api/integrations/platform-credentials']);
const SERVER_ONLY_CREDENTIAL_KEYS=new Set([
  'CLOUDFLARE_PLATFORM_API_TOKEN',
  'CLOUDFLARE_PLATFORM_ACCOUNT_ID',
  'CLOUDFLARE_PLATFORM_ZONE_ID'
]);

const NATIVE_OPERATIONS_PATHS=new Set([
  '/api/operations/capabilities','/api/operations/summary','/api/operations/bootstrap-crm',
  '/api/operations/workspaces','/api/operations/boards','/api/operations/fields',
  '/api/operations/records','/api/operations/links','/api/operations/views',
  '/api/operations/automations','/api/operations/events','/api/operations/sequences',
  '/api/operations/activity'
]);
function isNativeOperationsPath(pathname){return NATIVE_OPERATIONS_PATHS.has(pathname)||pathname.startsWith('/api/operations/records/')||pathname.startsWith('/api/operations/crm/');}

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

function credentialVaultPath(request){
  return CREDENTIAL_VAULT_PATHS.has(new URL(request.url).pathname);
}

async function enforcePlatformOwnerBoundary(request,env){
  const url=new URL(request.url);
  const path=url.pathname;

  // The owner login endpoint is public by necessity, but only the configured
  // platform identity (or an already-established user in the reserved owner
  // tenant) may attempt the platform-owner login flow. Workspace owners use the
  // normal account login and never become global administrators.
  if(path==='/api/admin/login'&&request.method==='POST'){
    const body=await request.clone().json().catch(()=>({}));
    const email=String(body?.email||'').trim().toLowerCase();
    if(!email)return Response.json({detail:'Invalid owner email or password.'},{status:401,headers:{'cache-control':'no-store'}});
    const configured=String(env?.ADMIN_EMAIL||'').trim().toLowerCase();
    if(configured&&email===configured)return null;
    if(env?.DB){
      try{
        const existing=await env.DB.prepare(`SELECT u.id FROM users u
          JOIN tenants t ON t.id=u.tenant_id
          WHERE lower(u.email)=? AND u.active=1 AND u.role='owner' AND t.slug='owner' LIMIT 1`).bind(email).first();
        if(existing?.id)return null;
      }catch(_){}
    }
    return Response.json({detail:'Invalid owner email or password.'},{status:401,headers:{'cache-control':'no-store'}});
  }

  const restricted=path==='/api/auth/audit'||
    (path.startsWith('/api/admin/')&&path!=='/api/admin/login')||
    credentialVaultPath(request);
  if(!restricted)return null;

  const user=await currentUser(request,env).catch(()=>null);
  if(!user||!await isPlatformOwnerUser(env,user)){
    return Response.json({detail:'Platform owner access required.',code:'PLATFORM_OWNER_REQUIRED'},{status:403,headers:{'cache-control':'no-store'}});
  }
  return null;
}

async function blockServerOnlyCredentialBrowserWrite(request){
  if(!credentialVaultPath(request))return null;
  const url=new URL(request.url);
  if(request.method==='DELETE'){
    const key=String(url.searchParams.get('key')||'').trim();
    if(SERVER_ONLY_CREDENTIAL_KEYS.has(key))return Response.json({detail:'Cloudflare platform credentials are server-side only and cannot be changed through browser credential APIs.',code:'SERVER_ONLY_CREDENTIAL'},{status:403,headers:{'cache-control':'no-store'}});
    return null;
  }
  if(!['POST','PUT','PATCH'].includes(request.method))return null;
  const body=await request.clone().json().catch(()=>({}));
  const keys=new Set([
    String(body?.key||'').trim(),
    ...Object.keys(body?.values&&typeof body.values==='object'?body.values:{})
  ].filter(Boolean));
  if([...keys].some(key=>SERVER_ONLY_CREDENTIAL_KEYS.has(key))){
    return Response.json({detail:'Cloudflare platform credentials are server-side only and cannot be submitted from browser credential APIs.',code:'SERVER_ONLY_CREDENTIAL'},{status:403,headers:{'cache-control':'no-store'}});
  }
  return null;
}

async function hideServerOnlyCredentialMetadata(request,response){
  if(!credentialVaultPath(request)||request.method!=='GET'||!response)return response;
  const type=String(response.headers.get('content-type')||'').toLowerCase();
  if(!type.includes('application/json'))return response;
  const data=await response.clone().json().catch(()=>null);
  if(!data||!Array.isArray(data.groups))return response;
  const groups=data.groups.filter(group=>{
    if(String(group?.id||'').toLowerCase()==='cloudflare')return false;
    const fields=Array.isArray(group?.fields)?group.fields:[];
    return !fields.some(field=>SERVER_ONLY_CREDENTIAL_KEYS.has(String(field?.key||'')));
  });
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  headers.set('content-type','application/json; charset=utf-8');
  return new Response(JSON.stringify({...data,groups}),{status:response.status,statusText:response.statusText,headers});
}

export default {
  async fetch(request, env, ctx) {
    const canonicalOrLegacy=canonicalOrLegacyResponse(request);
    if(canonicalOrLegacy)return finalizeResponse(request,canonicalOrLegacy);
    const outerUrl=new URL(request.url);
    if(request.method==='GET'&&outerUrl.pathname==='/health'){
      return finalizeResponse(request,Response.json({
        status:'ok',
        service:'iamagnanimous-ai',
        version:'4.0.0-multitenant',
        database_bootstrap:'bypassed-for-health',
        database_independent:true
      },{headers:{'cache-control':'no-store'}}));
    }
    const requestId=requestCorrelationId(request);
    let carrierContext=null;
    let assistantContext=null;
    try{
      const url=new URL(request.url);
      const credentialMigrationResponse=await handleCredentialVaultMigration(request,env);
      if(credentialMigrationResponse)return finalizeResponse(request,await securityPostflight(request,credentialMigrationResponse,env));
      if(url.pathname.startsWith('/api/video-agents/render-engine')){const rr=await handleRenderEngine(request,env,await currentUser(request,env).catch(()=>null));if(rr)return finalizeResponse(request,await securityPostflight(request,rr,env));}
      if(url.pathname.startsWith('/api/video-agents')){const vr=await handleVideoAgents(request,env);if(vr)return finalizeResponse(request,await securityPostflight(request,vr,env));}
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

      const ownerBoundary=await enforcePlatformOwnerBoundary(routedRequest,env);
      if(ownerBoundary)return finalizeResponse(request,await securityPostflight(routedRequest,ownerBoundary,env));

      const assistantPolicy=await enforceAssistantActionPolicy(routedRequest,env);
      if(assistantPolicy instanceof Response)return finalizeResponse(request,await securityPostflight(routedRequest,assistantPolicy,env));
      const policyRequest=assistantPolicy?.request||routedRequest;
      assistantContext=assistantPolicy?.context||null;

      const credentialWriteBlock=await blockServerOnlyCredentialBrowserWrite(policyRequest);
      if(credentialWriteBlock){
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,credentialWriteBlock,env);
        const completed=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,completed,env));
      }

      const blocked = await securityPreflight(policyRequest, env);
      if (blocked) {
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,blocked,env);
        const completed=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,completed,env));
      }

      const policyUrl=new URL(policyRequest.url);
      const infrastructureResponse=await handleMagnanimousInfrastructure(policyRequest,env);
      if(infrastructureResponse){
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,infrastructureResponse,env);
        const carrierCompleted=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,carrierCompleted,env));
      }

      const magnanimousCloudResponse=await handleMagnanimousCloudProvider(policyRequest,env);
      if(magnanimousCloudResponse){
        const assistantCompleted=await completeAssistantActionPolicy(assistantContext,magnanimousCloudResponse,env);
        const carrierCompleted=await completeCarrierWebhook(carrierContext,assistantCompleted,env);
        return finalizeResponse(request,await securityPostflight(policyRequest,carrierCompleted,env));
      }

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
      const rawResponse = await app.fetch(policyRequest, env, ctx);
      const response = await hideServerOnlyCredentialMetadata(policyRequest,rawResponse);
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