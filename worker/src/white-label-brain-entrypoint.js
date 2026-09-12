import app from './operations-entrypoint.js';
import {currentUser} from './integrations.js';
import {handleWhiteLabelBrain,recordWhiteLabelAction,shouldObserveWhiteLabelPath} from './white-label-brain-runtime.js';

function canReadJson(request){
 const type=String(request.headers.get('content-type')||'').toLowerCase();
 return !['GET','HEAD'].includes(request.method)&&type.includes('application/json');
}

async function observationPayload(request){
 if(!canReadJson(request))return{};
 try{
  const body=await request.clone().json();
  return{client_id:String(body?.client_id||body?.clientId||'').slice(0,80)};
 }catch{return{}}
}

export default {
 async fetch(request,env,ctx){
  const brain=await handleWhiteLabelBrain(request,env,ctx,app);
  if(brain)return brain;

  const url=new URL(request.url);
  const observe=shouldObserveWhiteLabelPath(url.pathname);
  const started=Date.now();
  const payload=observe?await observationPayload(request):{};
  const response=await app.fetch(request,env,ctx);

  if(observe){
   const work=(async()=>{
    try{
     const user=await currentUser(request,env);
     if(user)await recordWhiteLabelAction(env,user,{path:url.pathname,method:request.method,payload,responseStatus:response.status,durationMs:Date.now()-started});
    }catch(_){/* Learning signals must never break the customer action. */}
   })();
   if(ctx?.waitUntil)ctx.waitUntil(work);else await work;
  }
  return response;
 },
 async scheduled(controller,env,ctx){
  if(typeof app.scheduled==='function')return app.scheduled(controller,env,ctx);
 }
};
