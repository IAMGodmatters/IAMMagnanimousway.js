import app from './progress-entrypoint-base.js';
import {runQaLearningQueue} from './qa-learning-runtime.js';
import {runQaLearningNow} from './qa-learning-now-runtime.js';
import {specialistForMessage,specialistIntroduction} from './specialist-router.js';
import {handleMagnanimousNativeFirst} from './magnanimous-native-first.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

async function patchJson(response,patch){
 const data=await response.clone().json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return response;
 const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
 return new Response(JSON.stringify({...data,...patch(data)}),{status:response.status,statusText:response.statusText,headers});
}

function specialistResilienceAnswer(agent,message){
 const text=String(message||'').replace(/\s+/g,' ').trim();
 const lower=text.toLowerCase();
 if(agent.group==='creator'){
  if(/\b(new product|product launch|announce|announcement|launch)\b/.test(lower))return 'Something new is here! We are excited to introduce our latest product—created to bring real value, make things easier, and give customers another reason to choose us. Take a look, see what makes it different, and be among the first to try it.';
  return `Here is a practical content starter you can use now: lead with the main benefit, explain in one clear sentence why it matters, add one proof point or useful detail, and finish with a direct call to action. Request received: “${text.slice(0,260)}”`;
 }
 if(agent.group==='business')return `Keep this moving with a simple execution plan: define the customer and desired result, choose the strongest offer or next action, set one measurable target, and test the smallest version before expanding. Request received: “${text.slice(0,280)}”`;
 if(agent.group==='call-center')return `Use this immediate call-center fallback: confirm the caller's goal, state only verified information, follow the approved script or policy, give the safest next step, and document the outcome for follow-up. Request received: “${text.slice(0,280)}”`;
 if(agent.group==='career')return `Use this immediate work plan: identify the exact outcome, put the strongest relevant evidence first, remove unnecessary wording, and finish with a clear next step. Request received: “${text.slice(0,280)}”`;
 if(agent.group==='everyday')return `I can keep this moving with a simple plan: identify the immediate goal, list the known constraints, choose the safest practical next step, and handle one action at a time. Request received: “${text.slice(0,280)}”`;
 if(agent.group==='learning')return `Start with the core question, separate what is known from what still needs evidence, work through the answer step by step, and verify the result before relying on it. Request received: “${text.slice(0,280)}”`;
 return `I can keep this request moving in local resilience mode without inventing facts or claiming outside actions happened. Immediate request: “${text.slice(0,300)}”`;
}

async function recoverSpecialistHandoff(request,path,response,chatBody){
 if(request.method!=='POST'||path!=='/api/chat'||response.ok||!chatBody||chatBody.specialist_routing===false)return response;
 if(response.status<500)return response;
 const failure=await response.clone().json().catch(()=>null);
 const code=String(failure?.code||'').toUpperCase();
 if(code!=='AI_PROVIDER_FAILURE'&&code!=='AGENT_PROVIDER_FAILURE')return response;
 const routed=specialistForMessage(chatBody.message);
 if(!routed)return response;
 const intro=specialistIntroduction(routed);
 const answer=specialistResilienceAnswer(routed,chatBody.message);
 return json({
  output:`${intro}\n\n${answer}`,
  specialist_handoff:true,
  specialist:{id:routed.id,name:routed.name,title:routed.title,specialty:routed.specialty,group:routed.group},
  routed_by:'Magnanimous AI',
  resilience_mode:true,
  reasoning_capacity_limited:true,
  provider_details_private:true
 });
}

export default{
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/magnanimous/native-first')){
   try{
    const nativeFirst=await handleMagnanimousNativeFirst(request,env);
    if(nativeFirst)return nativeFirst;
   }catch(error){
    console.error('Magnanimous native-first runtime failed',error);
    return json({detail:'Magnanimous native-first runtime could not complete this request.'},500);
   }
  }
  const chatBody=request.method==='POST'&&path==='/api/chat'?await request.clone().json().catch(()=>null):null;
  let response=await app.fetch(request,env,ctx);
  response=await recoverSpecialistHandoff(request,path,response,chatBody);
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