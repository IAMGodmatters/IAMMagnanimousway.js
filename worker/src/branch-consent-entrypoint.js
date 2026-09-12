import baseApp from './consent-entrypoint.js';
import { currentUser } from './integrations.js';
import { branchProfile, ensureBranchSchema, branchKnowledge, branchKnowledgeContext, teachBranch, submitBranchTraining, branchTrainingSubmissions, reviewBranchTrainingSubmission, isPlatformOwnerUser, GLOBAL_BRANCH_TENANT } from './agent-branch-intelligence.js';
import { specialistForMessage, specialistIntroduction } from './specialist-router.js';

const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const isBranchTrainer=(user)=>Boolean(user&&['owner','admin'].includes(String(user.role||'').toLowerCase()));

async function catalog(request,env,ctx){
 const url=new URL(request.url);url.pathname='/api/agents';url.search='';
 const response=await baseApp.fetch(new Request(url.toString(),{method:'GET',headers:request.headers}),env,ctx);
 if(!response.ok)return[];
 const data=await response.json().catch(()=>({}));
 return Array.isArray(data.agents)?data.agents:[];
}

function escapeRe(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function spokenAgent(message,agents){
 const text=String(message||'').trim();
 for(const agent of agents){
  const re=new RegExp(`^(?:(?:hey|hi|hello|okay|ok)\\s+)?${escapeRe(agent.name)}(?:\\s*[,.:;-]?\\s+|$)`,'i');
  if(re.test(text))return{agent,cleaned:text.replace(re,'').trim()||text};
 }
 return null;
}

function safeTrainingUrl(value,base){
 try{
  const url=base?new URL(String(value||'').trim(),base):new URL(String(value||'').trim());
  if(!['http:','https:'].includes(url.protocol))return null;
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.local')||host==='0.0.0.0'||host==='127.0.0.1'||host==='::1'||/^10\./.test(host)||/^192\.168\./.test(host)||/^169\.254\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return null;
  return url;
 }catch{return null}
}
function htmlToTrainingText(value){
 return String(value||'')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,' ')
  .replace(/<!--([\s\S]*?)-->/g,' ')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi,'\n')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
  .replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
}
async function trainingFromUrl(value){
 let url=safeTrainingUrl(value);
 if(!url)return{ok:false,status:400,detail:'Use a public http or https webpage URL. Private-network addresses are blocked.'};
 try{
  let response=null;
  for(let redirects=0;redirects<=3;redirects++){
   response=await fetch(url.toString(),{redirect:'manual',headers:{Accept:'text/html,text/plain,application/json,application/xml;q=0.9,*/*;q=0.2','User-Agent':'I-AM-Magnanimous-AI-Academy/1.0'}});
   if(response.status>=300&&response.status<400){
    const location=response.headers.get('location');
    if(!location)return{ok:false,status:400,detail:'Training source returned an invalid redirect.'};
    const next=safeTrainingUrl(location,url.toString());
    if(!next)return{ok:false,status:400,detail:'Training source redirected to a blocked or private-network address.'};
    if(redirects===3)return{ok:false,status:400,detail:'Training source redirected too many times.'};
    url=next;continue;
   }
   break;
  }
  if(!response||!response.ok)return{ok:false,status:400,detail:`Training source could not be read (${response?.status||'network error'}).`};
  const type=String(response.headers.get('content-type')||'').toLowerCase();
  if(type&&!(type.includes('text/')||type.includes('json')||type.includes('xml')))return{ok:false,status:415,detail:'That URL is not a readable text or webpage source. Paste extracted text for PDF, DOCX, audio, or video sources.'};
  const raw=(await response.text()).slice(0,240000);
  const content=type.includes('html')?htmlToTrainingText(raw):raw.trim();
  if(!content)return{ok:false,status:400,detail:'No readable training text was found at that URL.'};
  const titleMatch=raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return{ok:true,url:url.toString(),content,title:htmlToTrainingText(titleMatch?.[1]||'').slice(0,180)};
 }catch{return{ok:false,status:400,detail:'Training source could not be fetched.'}}
}

async function enrichTrainingBody(body,agent,requireDirectPermission,user){
 let lesson={...body};
 if(!String(lesson.content||'').trim()&&String(lesson.url||'').trim()){
  if(requireDirectPermission&&!isBranchTrainer(user))return{ok:false,status:403,detail:'Direct teaching requires owner or administrator access. Use the QA submission route for approval-based training.'};
  const source=await trainingFromUrl(lesson.url);
  if(!source.ok)return source;
  lesson={...lesson,content:source.content,title:String(lesson.title||source.title||`${agent.name} web lesson`),source:String(lesson.source||`web:${source.url}`)};
 }
 return{ok:true,lesson};
}

async function branchRequest(request,env,ctx){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/agents')&&url.pathname!=='/api/chat')return null;
 await ensureBranchSchema(env);
 const agents=await catalog(request,env,ctx);

 if(request.method==='GET'&&url.pathname==='/api/agents'){
  const response=await baseApp.fetch(request,env,ctx);
  const data=await response.clone().json().catch(()=>null);
  if(!data)return response;
  return json({...data,agents:(data.agents||[]).map(a=>({...a,branch:branchProfile(a)})),architecture:'magnanimous-core-with-specialist-branches',qa_training_submission:true,owner_approval_required_for_global_learning:true},response.status);
 }

 const user=await currentUser(request,env);

 if(request.method==='POST'&&url.pathname==='/api/chat'){
  const body=await request.clone().json().catch(()=>({}));
  const original=String(body.message||'').trim();
  if(!original||body.specialist_routing===false)return null;
  const routed=specialistForMessage(original);
  if(!routed)return null;
  const agent=agents.find(a=>String(a.id)===String(routed.id))||routed;
  const profile=branchProfile(agent);
  const knowledge=await branchKnowledge(env,user?.tenant_id||'',agent.id,24);
  const context=branchKnowledgeContext(profile,knowledge);
  const internal=`\n\nAUTOMATIC SPECIALIST HANDOFF — apply silently.\nMagnanimous has routed this request to ${agent.name}, its ${agent.title} specialist branch.\n${context}\n\nAnswer the user's request now as ${agent.name}. Do not ask a follow-up question instead of giving a useful answer when reasonable assumptions are enough. Ask only when safety, authorization, or a truly indispensable missing fact makes an answer impossible. Do not introduce yourself because the platform will add the specialist greeting automatically.`;
  const forwarded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify({...body,message:`${original}${internal}`,specialist_routing:false})});
  const response=await baseApp.fetch(forwarded,env,ctx);
  const data=await response.clone().json().catch(()=>null);
  if(!data)return response;
  if(!response.ok)return response;
  const intro=specialistIntroduction(routed);
  const answer=String(data.output||data.answer||'').trim();
  const {provider,provider_name,model,...publicData}=data;
  return json({...publicData,output:`${intro}\n\n${answer}`,specialist_handoff:true,specialist:{id:agent.id,name:agent.name,title:agent.title,specialty:routed.specialty,introduction:intro,branch:profile},branch_knowledge_count:knowledge.length,global_branch_knowledge_count:knowledge.filter(x=>x.scope==='global').length,routed_by:'Magnanimous AI'},response.status);
 }

 if(!user)return null;
 const platformOwner=await isPlatformOwnerUser(env,user);

 if(request.method==='GET'&&url.pathname==='/api/agents/branch'){
  const id=String(url.searchParams.get('agent_id')||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===id);
  if(!agent)return json({detail:'Unknown specialist branch.'},404);
  const knowledge=await branchKnowledge(env,user.tenant_id,agent.id,60);
  return json({agent:{...agent,branch:branchProfile(agent)},knowledge,knowledge_count:knowledge.length,global_knowledge_count:knowledge.filter(x=>x.scope==='global').length,shared_core:'Magnanimous AI',branch_isolated:true,can_teach:isBranchTrainer(user),can_submit_training:true,platform_owner:platformOwner,qa_approval_required:true});
 }

 if(request.method==='POST'&&url.pathname==='/api/agents/branch/teach'){
  const body=await request.json().catch(()=>({}));
  const id=String(body.agent_id||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===id);
  if(!agent)return json({detail:'Choose a valid specialist branch.'},400);
  const enriched=await enrichTrainingBody(body,agent,true,user);
  if(!enriched.ok)return json({detail:enriched.detail},enriched.status||400);
  const taught=await teachBranch(env,user,agent,enriched.lesson);
  return taught.ok?json({...taught,branch:branchProfile(agent)},201):json({detail:taught.detail},taught.status||400);
 }

 if(request.method==='POST'&&url.pathname==='/api/agents/branch/submissions'){
  const body=await request.json().catch(()=>({}));
  const id=String(body.agent_id||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===id);
  if(!agent)return json({detail:'Choose a valid specialist branch.'},400);
  const enriched=await enrichTrainingBody(body,agent,false,user);
  if(!enriched.ok)return json({detail:enriched.detail},enriched.status||400);
  const submitted=await submitBranchTraining(env,user,agent,enriched.lesson);
  return submitted.ok?json({...submitted,branch:branchProfile(agent)},201):json({detail:submitted.detail},submitted.status||400);
 }

 if(request.method==='GET'&&url.pathname==='/api/agents/branch/submissions'){
  const agentId=String(url.searchParams.get('agent_id')||'').toLowerCase();
  const status=String(url.searchParams.get('status')||'').toLowerCase();
  const submissions=await branchTrainingSubmissions(env,user,{agentId,status});
  return json({submissions,platform_owner:platformOwner,approval_required:true,count:submissions.length});
 }

 if(request.method==='POST'&&url.pathname==='/api/agents/branch/submissions/review'){
  const body=await request.json().catch(()=>({}));
  const result=await reviewBranchTrainingSubmission(env,user,agents,Number(body.id||0),body);
  return result.ok?json(result):json({detail:result.detail},result.status||400);
 }

 if(request.method==='DELETE'&&url.pathname==='/api/agents/branch/knowledge'){
  if(!isBranchTrainer(user))return json({detail:'Only an owner or administrator can curate specialist training.'},403);
  const agentId=String(url.searchParams.get('agent_id')||'').toLowerCase();
  const lessonId=Number(url.searchParams.get('id')||0);
  const agent=agents.find(a=>String(a.id).toLowerCase()===agentId);
  if(!agent||!Number.isInteger(lessonId)||lessonId<1)return json({detail:'Choose a valid branch lesson.'},400);
  const tenantScope=platformOwner?GLOBAL_BRANCH_TENANT:String(user.tenant_id);
  const result=await env.DB.prepare('DELETE FROM agent_branch_knowledge WHERE id=? AND tenant_id=? AND agent_id=?').bind(lessonId,tenantScope,agent.id).run();
  return json({deleted:Number(result?.meta?.changes||0)>0,id:lessonId,agent_id:agent.id,scope:platformOwner?'global':'workspace'});
 }

 if(request.method==='POST'&&url.pathname==='/api/agents/chat'){
  const body=await request.clone().json().catch(()=>({}));
  const original=String(body.message||'').trim();
  if(!original)return null;
  const named=spokenAgent(original,agents);
  const requestedId=String(named?.agent?.id||body.agent_id||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===requestedId);
  if(!agent)return null;
  const cleanMessage=named?.cleaned||original;
  const knowledge=await branchKnowledge(env,user.tenant_id,agent.id,20);
  const profile=branchProfile(agent);
  const context=branchKnowledgeContext(profile,knowledge);
  const internal=`\n\nSPECIALIST BRANCH CONTEXT — apply this silently; do not quote it back to the user.\n${context}\n\nThe user is speaking to ${agent.name}. Stay in ${agent.name}'s ${agent.title} responsibility unless a handoff is genuinely needed. Answer the request directly. Do not replace a useful answer with a follow-up question when reasonable assumptions are sufficient.`;
  const forwarded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify({...body,agent_id:agent.id,message:`${cleanMessage}${internal}`})});
  const response=await baseApp.fetch(forwarded,env,ctx);
  try{
   await env.DB.prepare("UPDATE agent_mesh_messages SET content=? WHERE id=(SELECT id FROM agent_mesh_messages WHERE tenant_id=? AND agent_id=? AND role='user' ORDER BY id DESC LIMIT 1)").bind(cleanMessage,user.tenant_id,agent.id).run();
  }catch{}
  const data=await response.clone().json().catch(()=>null);
  if(!data)return response;
  const {provider,provider_name,model,...publicData}=data;
  return json({...publicData,agent:{...(data.agent||agent),branch:profile},branch_identity:true,branch_knowledge_count:knowledge.length,global_branch_knowledge_count:knowledge.filter(x=>x.scope==='global').length,spoken_name_routing:Boolean(named)},response.status);
 }
 return null;
}

export default {
 async fetch(request,env,ctx){
  try{
   const handled=await branchRequest(request,env,ctx);
   if(handled)return handled;
  }catch(error){console.error('specialist branch layer failed',error)}
  return baseApp.fetch(request,env,ctx);
 }
};
