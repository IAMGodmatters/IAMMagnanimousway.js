import app from './progress-entrypoint-base.js';
import {runQaLearningQueue} from './qa-learning-runtime.js';
import {runQaLearningNow} from './qa-learning-now-runtime.js';

async function patchJson(response,patch){
 const data=await response.clone().json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return response;
 const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
 return new Response(JSON.stringify({...data,...patch(data)}),{status:response.status,statusText:response.statusText,headers});
}

export default{
 async fetch(request,env,ctx){
  let response=await app.fetch(request,env,ctx);
  const path=new URL(request.url).pathname;
  if(response.ok&&request.method==='POST'&&path==='/api/agents/branch/submissions/public'){
   runQaLearningNow(env,ctx);
   response=await patchJson(response,()=>({automatic_qa_review:true,manual_owner_review_if_held:true,owner_override_available:true,message:'Thank you. Your teaching entered automatic QA review. Teaching that passes the quality gate is applied to the selected Magnanimous specialist automatically; held items remain available for owner review.'}));
  }else if(response.ok&&request.method==='POST'&&path==='/api/agents/branch/submissions'){
   runQaLearningQueue(env,ctx);
   response=await patchJson(response,()=>({automatic_qa_review:true,manual_owner_review_if_held:true,owner_override_available:true}));
  }else if(response.ok&&request.method==='GET'&&path==='/api/agents'){
   runQaLearningQueue(env,ctx);
   response=await patchJson(response,()=>({automatic_qa_review_required_for_global_learning:true,manual_owner_review_if_held:true,owner_override_available:true}));
  }else if(response.ok&&request.method==='GET'&&path==='/api/agents/branch'){
   runQaLearningQueue(env,ctx);
   response=await patchJson(response,()=>({automatic_qa_review:true,manual_owner_review_if_held:true,owner_override_available:true}));
  }else if(response.ok&&request.method==='GET'&&path==='/api/agents/branch/submissions'){
   runQaLearningQueue(env,ctx);
   response=await patchJson(response,()=>({automatic_qa_review:true,manual_owner_review_if_held:true,owner_override_available:true}));
  }else if(response.ok&&(path==='/api/chat'||path==='/api/agents/chat'))runQaLearningQueue(env,ctx);
  return response;
 }
};