import app from './security-entrypoint.js';
import { securityPreflight, securityPostflight } from './security-hardening.js';
import { applyPlatformResponseHeaders, requestCorrelationId } from './request-observability.js';
import { resolveSessionRequest } from './session-authority.js';
import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handleMagnanimousTelecomProviderFallback, observeMagnanimousTelecomProviderPayment } from './magnanimous-telecom-provider-fallback.js';

const ownerLike=user=>['owner','admin','super_admin','superadmin'].includes(String(user?.role||'').trim().toLowerCase());
const isFallbackPath=pathname=>pathname.startsWith('/api/telecom/provider-fallback')||pathname.startsWith('/api/telecom/execution');
const finalize=async(request,response,env)=>applyPlatformResponseHeaders(request,await securityPostflight(request,response,env));

async function securedFallback(request,env){
  const requestId=requestCorrelationId(request);
  const session=await resolveSessionRequest(request,env,requestId);
  if(session.response)return finalize(request,session.response,env);
  const routed=session.request||request;
  const blocked=await securityPreflight(routed,env);
  if(blocked)return finalize(routed,blocked,env);
  const user=await currentUser(routed,env).catch(()=>null);
  if(!user)return finalize(routed,Response.json({detail:'Sign in to Magnanimous Telecom.'},{status:401,headers:{'cache-control':'no-store'}}),env);
  const path=new URL(routed.url).pathname;
  // Provider identity, pricing, source selection and upstream settlement remain
  // owner/admin control-plane data. Ordinary customers only interact with the
  // Magnanimous-branded telecom service, never a provider-selection endpoint.
  if(path.startsWith('/api/telecom/provider-fallback')&&!ownerLike(user)){
    return finalize(routed,Response.json({detail:'Workspace owner access required.'},{status:403,headers:{'cache-control':'no-store'}}),env);
  }
  const runtimeEnv=await getProviderRuntimeEnv(env);
  const response=await handleMagnanimousTelecomProviderFallback(routed,runtimeEnv);
  return finalize(routed,response||Response.json({detail:'Not found.'},{status:404,headers:{'cache-control':'no-store'}}),env);
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    // Observe only a verified Stripe webhook clone. The established billing
    // handler still owns the webhook response and remains authoritative.
    if(url.pathname==='/api/billing/webhook'&&request.method==='POST'){
      const runtimeEnv=await getProviderRuntimeEnv(env);
      await observeMagnanimousTelecomProviderPayment(request,runtimeEnv,ctx);
    }
    if(isFallbackPath(url.pathname))return securedFallback(request,env);
    return app.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){
    if(typeof app.scheduled==='function')return app.scheduled(controller,env,ctx);
  }
};
