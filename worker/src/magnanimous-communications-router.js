import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { handleInkboxRouter, MAGNANIMOUS_COMMUNICATION_TOOLS } from './inkbox-router.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const ROOT_METHODS=new Set(['GET','POST','PUT','PATCH','DELETE']);

function safeA2APath(value){
 let path=String(value||'').trim();
 if(/^https?:\/\//i.test(path))throw new Error('Absolute URLs are not allowed.');
 if(!path.startsWith('/'))path=`/${path}`;
 if(!path.startsWith('/a2a/')&&path!=='/a2a')throw new Error('Only documented root-level A2A paths are allowed on this transport.');
 if(path.includes('..')||path.includes('\\')||/[\u0000-\u001f]/.test(path))throw new Error('Unsafe A2A path.');
 return path;
}
function queryText(query){
 const params=new URLSearchParams();
 if(query&&typeof query==='object')for(const[k,v]of Object.entries(query)){
  if(v===undefined||v===null||v==='')continue;
  if(Array.isArray(v))for(const x of v)params.append(k,String(x));else params.set(k,String(v));
 }
 const text=params.toString();return text?`?${text}`:'';
}
function rootRisk(method,path){
 if(method==='GET')return'read';
 if(method==='DELETE')return'destructive';
 if(/task|message|contact-rule|settings|invite/i.test(path))return'consequential';
 return'write';
}
async function rootA2A(request,env,user,input){
 const method=String(input.method||'GET').toUpperCase();
 if(!ROOT_METHODS.has(method))return json({detail:'Unsupported A2A method.'},405);
 let path;try{path=safeA2APath(input.path)}catch(error){return json({detail:error.message||'Invalid A2A path.'},400)}
 const risk=rootRisk(method,path);
 if(['consequential','destructive'].includes(risk)&&input.approved!==true)return json({detail:'This A2A action can modify state or delegate work. Re-submit with approved=true after explicit authorization.',code:'EXPLICIT_ACTION_APPROVAL_REQUIRED',risk,path,method},409);
 const runtime=await getProviderRuntimeEnv(env),key=String(runtime?.INKBOX_API_KEY||'').trim();
 if(!key)return json({detail:'Magnanimous Communications is ready, but its server-side communication API credential is not configured.',code:'COMMUNICATION_PROVIDER_NOT_CONFIGURED'},503);
 const headers=new Headers({'X-API-Key':key,'Accept':'application/json'});
 if(!['GET','HEAD'].includes(method)){headers.set('Content-Type','application/json')}
 if(input.idempotency_key)headers.set('Idempotency-Key',String(input.idempotency_key).slice(0,200));
 const init={method,headers};if(!['GET','HEAD'].includes(method)&&input.body!==undefined)init.body=JSON.stringify(input.body);
 let response;try{response=await fetch(`https://inkbox.ai${path}${queryText(input.query)}`,init)}catch{return json({detail:'Magnanimous could not reach the A2A transport.',code:'A2A_TRANSPORT_UNREACHABLE'},502)}
 const safeHeaders=new Headers({'cache-control':'no-store','x-magnanimous-execution':'a2a-router'});for(const name of ['content-type','retry-after','etag']){const value=response.headers.get(name);if(value)safeHeaders.set(name,value)}
 return new Response(response.body,{status:response.status,headers:safeHeaders});
}

export async function handleMagnanimousCommunications(request,env){
 const url=new URL(request.url),path=url.pathname;
 if((path==='/api/magnanimous/communications/root-a2a'||path==='/api/magnanimous/inkbox/root-a2a')&&request.method==='POST'){
  const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);if(user.role!=='owner')return json({detail:'Owner access required for the Magnanimous communications router.'},403);
  const input=await request.json().catch(()=>({}));return rootA2A(request,env,user,input);
 }
 const handled=await handleInkboxRouter(request,env);if(handled)return handled;
 return null;
}

export { MAGNANIMOUS_COMMUNICATION_TOOLS };
