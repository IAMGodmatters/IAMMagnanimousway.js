import app from './progress-entrypoint.js';
import {currentUser} from './integrations.js';
import {checkpointProgress,listProgressCheckpoints} from './progress-checkpoint-runtime.js';
import {listWork,getWork,createWork,updateWork,addWorkStep,updateWorkStep} from './work-engine-runtime.js';
import {listEvidence,addEvidence,removeEvidence,evidenceCount} from './evidence-notebook-runtime.js';
import {handleUnifiedInbox} from './unified-inbox-runtime.js';
import {handleAgencyGrowth} from './agency-growth-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const bodyOf=(request)=>request.clone().json().catch(()=>({}));

async function signedIn(request,env){
 const user=await currentUser(request,env);return user||null;
}
async function saveEvent(env,user,{sessionKey,scope,kind,stage,content,status='saved',metadata={}}){
 return checkpointProgress(env,user,{sessionKey,scope,kind,stage,content,metadata,status}).catch(()=>null);
}

const INTEGRATION_CONTRACT={
 version:'1.0',
 lifecycle:['connect','permissions','health','read','write','approval','receipt','disconnect'],
 required_controls:['tenant isolation','server-side credentials','revocable authorization','explicit write permissions','action receipts'],
 optional_transports:['oauth2','api-key','webhook','rest','mcp'],
 principle:'Connections extend Magnanimous AI without changing the identity or ownership of the underlying customer account.'
};

async function operationsRequest(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(request.method==='GET'&&path==='/api/integration-contract')return json(INTEGRATION_CONTRACT);
 if(!path.startsWith('/api/work-engine')&&!path.startsWith('/api/evidence-notebook')&&path!=='/api/operations/overview')return null;
 const user=await signedIn(request,env);if(!user)return json({detail:'Sign in to use this workspace.'},401);

 if(path==='/api/work-engine'){
  if(request.method==='GET'){const items=await listWork(env,user,Number(url.searchParams.get('limit')||80));return json({items,count:items.length,workflow:'understand-plan-approve-execute-verify-continue'});}
  if(request.method==='POST'){
   const body=await bodyOf(request),item=await createWork(env,user,body);if(!item)return json({detail:'Work item could not be created.'},500);
   await saveEvent(env,user,{sessionKey:`work:${item.id}`,scope:'work-engine',kind:'workflow',stage:'created',content:item.goal||item.title,metadata:{work_id:item.id,title:item.title}});
   return json({item},201);
  }
  return json({detail:'Method not allowed.'},405);
 }

 let match=path.match(/^\/api\/work-engine\/(\d+)$/);
 if(match){
  const id=Number(match[1]);
  if(request.method==='GET'){const item=await getWork(env,user,id);return item?json({item}):json({detail:'Work item not found.'},404);}
  if(request.method==='PATCH'){
   const body=await bodyOf(request),item=await updateWork(env,user,id,body);if(!item)return json({detail:'Work item not found.'},404);
   await saveEvent(env,user,{sessionKey:`work:${id}`,scope:'work-engine',kind:'workflow',stage:item.stage,content:item.goal||item.title,status:item.status==='failed'?'failed':'saved',metadata:{work_id:id,status:item.status,progress:item.progress}});
   return json({item});
  }
  return json({detail:'Method not allowed.'},405);
 }

 match=path.match(/^\/api\/work-engine\/(\d+)\/steps$/);
 if(match&&request.method==='POST'){
  const id=Number(match[1]),body=await bodyOf(request),stepId=await addWorkStep(env,user,id,body);if(!stepId)return json({detail:'Work item not found.'},404);
  const item=await getWork(env,user,id);await saveEvent(env,user,{sessionKey:`work:${id}`,scope:'work-engine',kind:'step',stage:'planned',content:String(body.title||'Next step'),metadata:{work_id:id,step_id:stepId}});return json({item,step_id:stepId},201);
 }

 match=path.match(/^\/api\/work-engine\/(\d+)\/steps\/(\d+)$/);
 if(match&&request.method==='PATCH'){
  const workId=Number(match[1]),stepId=Number(match[2]),body=await bodyOf(request),item=await updateWorkStep(env,user,workId,stepId,body);if(!item)return json({detail:'Work step not found.'},404);
  const step=item.steps.find(x=>Number(x.id)===stepId);await saveEvent(env,user,{sessionKey:`work:${workId}`,scope:'work-engine',kind:'step',stage:step?.status||'working',content:step?.result||step?.title||'',status:step?.status==='failed'?'failed':'saved',metadata:{work_id:workId,step_id:stepId,progress:item.progress}});return json({item});
 }

 if(path==='/api/evidence-notebook'){
  if(request.method==='GET'){const items=await listEvidence(env,user,{limit:Number(url.searchParams.get('limit')||100),notebook:String(url.searchParams.get('notebook')||'')});return json({items,count:items.length,evidence_notebook:true});}
  if(request.method==='POST'){
   const body=await bodyOf(request),id=await addEvidence(env,user,body);if(!id)return json({detail:'Evidence could not be saved.'},500);
   await saveEvent(env,user,{sessionKey:`evidence:${id}`,scope:'research',kind:'evidence',stage:'saved',content:String(body.claim||body.title||'Research evidence'),metadata:{evidence_id:id,source_url:String(body.source_url||'').slice(0,700)}});return json({ok:true,id},201);
  }
  return json({detail:'Method not allowed.'},405);
 }

 match=path.match(/^\/api\/evidence-notebook\/(\d+)$/);
 if(match&&request.method==='DELETE')return json({deleted:await removeEvidence(env,user,Number(match[1]))});

 if(path==='/api/operations/overview'&&request.method==='GET'){
  const [work,evidence,checkpoints]=await Promise.all([listWork(env,user,200),evidenceCount(env,user),listProgressCheckpoints(env,user,{limit:300})]);
  const counts=(status)=>work.filter(x=>x.status===status).length;
  return json({health:counts('failed')?'attention':'healthy',work_total:work.length,working:counts('working'),waiting:counts('waiting'),failed:counts('failed'),completed:counts('completed'),planned:counts('planned'),evidence_items:evidence,checkpoints:checkpoints.length,recoverable:checkpoints.filter(x=>x.status==='failed'||x.stage==='working'||x.stage==='page-exit').length,integration_contract:INTEGRATION_CONTRACT,unified_inbox:'/api/inbox/overview',agency_command:'/api/agency/overview'});
 }
 return null;
}

export default{
 async fetch(request,env,ctx){
  try{const inbox=await handleUnifiedInbox(request,env);if(inbox)return inbox}catch(error){console.error('unified inbox layer failed',error);return json({detail:'Unified Inbox could not complete this request.'},500)}
  try{const agency=await handleAgencyGrowth(request,env);if(agency)return agency}catch(error){console.error('agency command layer failed',error);return json({detail:'Agency Command could not complete this request.'},500)}
  try{const handled=await operationsRequest(request,env);if(handled)return handled}catch(error){console.error('operations layer failed',error);return json({detail:'Operations workspace could not complete this request.'},500)}
  return app.fetch(request,env,ctx);
 }
};
