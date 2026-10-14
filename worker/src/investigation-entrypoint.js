import securityApp from './security-entrypoint.js';
import { handleNativeInvestigation } from './native-investigation-runtime.js';
import { securityPostflight } from './security-hardening.js';
import { applyPlatformResponseHeaders } from './request-observability.js';

function finalize(request,response){
  return applyPlatformResponseHeaders(request,response);
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/magnanimous/investigation')){
      const response=await handleNativeInvestigation(request,env);
      if(response)return finalize(request,await securityPostflight(request,response,env));
    }
    return securityApp.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){
    if(typeof securityApp.scheduled==='function')return securityApp.scheduled(controller,env,ctx);
  }
};
