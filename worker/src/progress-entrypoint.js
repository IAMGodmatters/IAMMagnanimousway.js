import app from './progress-entrypoint-base.js';
import {runQaLearningQueue} from './qa-learning-runtime.js';
import {runQaLearningNow} from './qa-learning-now-runtime.js';
import {specialistForMessage,specialistIntroduction} from './specialist-router.js';
import {handleMagnanimousNativeFirst} from './magnanimous-native-first.js';
import {handleMagnanimousOgenic} from './magnanimous-ogenic-god-toolkit.js';
import {handleMagnanimousLocalBridge} from './magnanimous-local-bridge-runtime.js';
import {handleMagnanimousB2B} from './magnanimous-b2b-runtime.js';
import {handleMagnanimousTravelAgency} from './magnanimous-travel-agency-runtime.js';
import {requirePlatformOwner} from './platform-owner-guard.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

async function patchJson(response,patch){
 const data=await response.clone().json().catch(()=>null);
 if(!data||typeof data!=='object'||Array.isArray(data))return response;
 const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
 return new Response(JSON.stringify({...data,...patch(data)}),{status:response.status,statusText:response.statusText,headers});
}

async function runComputeAccelerator(request,env,ctx){
 const denied=await requirePlatformOwner(request,env);if(denied)return denied;
 const body=await request.clone().json().catch(()=>({}));
 const prompt=String(body.prompt||body.message||'').trim();
 if(!prompt)return json({detail:'Compute accelerator prompt is required.'},400);
 if(prompt.length>60000)return json({detail:'Compute accelerator prompt is too large.'},413);
 const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
 const policy=`MAGNANIMOUS COMPUTE ACCELERATOR CONTRACT
You are a replaceable compute accelerator beneath Magnanimous AI.
You have advisory analysis authority only.
Do not claim to be Magnanimous AI, do not create or own memory, do not call tools, do not initiate specialist actions, do not authorize repository writes, do not approve changes, do not merge, deploy, publish, message, call, purchase, pay, delete, alter credentials or change security policy.
Return analysis/proposals only. Magnanimous retains identity, planning authority, memory, policy, skills, workflow ownership, verification and all consequential-action authority.

REQUEST:
${prompt}`;
 const forwarded=new Request(new URL('/api/chat',request.url).toString(),{
  method:'POST',headers,
  body:JSON.stringify({
   message:policy,
   provider:'auto',
   route_policy:'free-first',
   compute_only:true,
   allow_metered_accelerator:false,
   use_tools:false,
   use_knowledge:false,
   learn_links:false,
   live_search:false,
   news:false,
   remember_search:false,
   specialist_routing:false,
   ogenic_initiative:false
  })
 });
 const response=await app.fetch(forwarded,env,ctx);
 const data=await response.clone().json().catch(()=>({}));
 if(!response.ok)return json({detail:String(data.detail||'Optional compute accelerator failed.'),code:String(data.code||'COMPUTE_ACCELERATOR_FAILURE'),accelerator_used:false,provider_details_private:true},response.status);
 return json({
  ok:true,
  output:String(data.output||''),
  accelerator_used:true,
  advisory_only:true,
  tools_enabled:false,
  memory_access:false,
  memory_write:false,
  specialist_actions:false,
  repository_authority:false,
  approval_authority:false,
  merge_authority:false,
  deployment_authority:false,
  metered_compute_allowed:false,
  provider_details_private:true,
  identity_owner:'Magnanimous AI'
 });
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
  if(path==='/api/magnanimous/compute-accelerator'&&request.method==='POST'){
   try{return await runComputeAccelerator(request,env,ctx)}catch(error){console.error('Magnanimous compute accelerator failed',error);return json({detail:'Optional compute accelerator could not complete this request.',code:'COMPUTE_ACCELERATOR_FAILURE'},500)}
  }
  if(path.startsWith('/api/magnanimous/native-first')){
   try{
    const nativeFirst=await handleMagnanimousNativeFirst(request,env);
    if(nativeFirst)return nativeFirst;
   }catch(error){
    console.error('Magnanimous native-first runtime failed',error);
    return json({detail:'Magnanimous native-first runtime could not complete this request.'},500);
   }
  }
  if(path.startsWith('/api/travel-agency')||path.startsWith('/api/travel-source/v1')){
   try{
    const travel=await handleMagnanimousTravelAgency(request,env);
    if(travel)return travel;
   }catch(error){
    console.error('Magnanimous Travel Agency runtime failed',error);
    return json({detail:'Magnanimous Travel Agency could not complete this request.'},500);
   }
  }
  if(path.startsWith('/api/b2b')||path.startsWith('/api/magnanimous/b2b')){
   try{
    const b2b=await handleMagnanimousB2B(request,env);
    if(b2b)return b2b;
   }catch(error){
    console.error('Magnanimous B2B runtime failed',error);
    return json({detail:'Magnanimous B2B network could not complete this request.'},500);
   }
  }
  if(path.startsWith('/api/magnanimous/local-bridge')){
   try{
    const bridge=await handleMagnanimousLocalBridge(request,env);
    if(bridge)return bridge;
   }catch(error){
    console.error('Magnanimous Local Bridge runtime failed',error);
    return json({detail:'Magnanimous Local Bridge could not complete this request.'},500);
   }
  }
  if(path.startsWith('/api/magnanimous/ogenic')){
   try{
    const ogenic=await handleMagnanimousOgenic(request,env);
    if(ogenic)return ogenic;
   }catch(error){
    console.error('Magnanimous OGENIC runtime failed',error);
    return json({detail:'Magnanimous GOD TOOLKIT runtime could not complete this request.'},500);
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