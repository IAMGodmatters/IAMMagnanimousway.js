import app from './branch-consent-entrypoint.js';
import {currentUser} from './integrations.js';
import {checkpointProgress,listProgressCheckpoints,progressContentFromPayload,progressContentFromResponse,progressSessionKey,isSensitiveProgressPath} from './progress-checkpoint-runtime.js';
import {captureQaObservationRequest,handleQaObservationControl,recordQaException,recordQaObservation} from './qa-observation-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const MUTATING=new Set(['POST','PUT','PATCH','DELETE']);

async function payloadOf(request){
 const type=String(request.headers.get('content-type')||'').toLowerCase();
 if(!type.includes('json'))return{};
 return await request.clone().json().catch(()=>({}));
}

function metadataFor(request,path,payload,sensitive=false){
 return{
  method:request.method,
  path,
  agent_id:sensitive?'':String(payload?.agent_id||'').slice(0,120),
  specialist_routing:Boolean(payload?.specialist_routing),
  source:sensitive?'sensitive-action':String(payload?.source||'').slice(0,120)
 };
}

function background(ctx,task,label){
 const safe=Promise.resolve(task).catch(error=>console.error(label,error));
 if(ctx?.waitUntil)ctx.waitUntil(safe);
 return safe;
}

export default{
 async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;

  const control=await handleQaObservationControl(request,env);
  if(control)return control;

  if(path==='/api/progress/checkpoint'){
   const user=await currentUser(request,env);
   if(!user)return json({detail:'Sign in to sync progress checkpoints.'},401);
   if(request.method==='GET'){
    const checkpoints=await listProgressCheckpoints(env,user,{sessionKey:String(url.searchParams.get('session_key')||''),limit:Number(url.searchParams.get('limit')||120)});
    return json({checkpoints,count:checkpoints.length,autosave:true});
   }
   if(request.method==='POST'){
    const body=await payloadOf(request);
    const id=await checkpointProgress(env,user,{sessionKey:String(body.session_key||''),scope:String(body.scope||'platform'),kind:String(body.kind||'progress'),stage:String(body.stage||'working'),content:String(body.content||''),metadata:body.metadata||{},status:'saved'});
    return json({ok:true,id,autosave:true},201);
   }
   return json({detail:'Method not allowed.'},405);
  }

  const startedAt=Date.now();
  const qaCapture=await captureQaObservationRequest(request);
  const shouldCheckpoint=MUTATING.has(request.method)&&path.startsWith('/api/');
  const user=shouldCheckpoint?await currentUser(request,env):null;
  const payload=shouldCheckpoint?await payloadOf(request):{};
  const sensitive=isSensitiveProgressPath(path);
  const sessionKey=progressSessionKey(path,payload);
  const kind=path==='/api/chat'||path==='/api/agents/chat'?'conversation':'action';

  if(user){
   const task=checkpointProgress(env,user,{sessionKey,scope:path.includes('/agents')?'specialist':'platform',kind,stage:'started',content:sensitive?'':progressContentFromPayload(payload),metadata:metadataFor(request,path,payload,sensitive),status:'working'}).catch(()=>null);
   if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
  }

  let response;
  try{
   response=await app.fetch(request,env,ctx);
  }catch(error){
   if(user){
    const task=checkpointProgress(env,user,{sessionKey,scope:'platform',kind,stage:'failed',content:sensitive?'':String(error?.message||error||'Action failed'),metadata:{method:request.method,path},status:'failed'}).catch(()=>null);
    if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
   }
   const observation=recordQaException(env,request,error,{startedAt,capture:qaCapture,user});
   if(ctx?.waitUntil)background(ctx,observation,'QA exception observer failed');else await observation;
   throw error;
  }

  if(user){
   const save=async()=>{
    let data={};
    const type=String(response.headers.get('content-type')||'').toLowerCase();
    if(type.includes('json'))data=await response.clone().json().catch(()=>({}));
    await checkpointProgress(env,user,{sessionKey,scope:path.includes('/agents')?'specialist':'platform',kind,stage:response.ok?'completed':'failed',content:sensitive?'':progressContentFromResponse(data),metadata:{method:request.method,path,http_status:response.status},status:response.ok?'saved':'failed'});
   };
   const task=save().catch(()=>null);if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
  }

  const observation=recordQaObservation(env,request,response,{startedAt,capture:qaCapture,user});
  if(ctx?.waitUntil)background(ctx,observation,'QA observation failed');else await observation;
  return response;
 }
};
