import baseApp from './consent-entrypoint.js';
import { currentUser } from './integrations.js';
import { branchProfile, ensureBranchSchema, branchKnowledge, branchKnowledgeContext, teachBranch } from './agent-branch-intelligence.js';

const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});

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

async function branchRequest(request,env,ctx){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/agents'))return null;
 await ensureBranchSchema(env);
 const agents=await catalog(request,env,ctx);

 if(request.method==='GET'&&url.pathname==='/api/agents'){
  const response=await baseApp.fetch(request,env,ctx);
  const data=await response.clone().json().catch(()=>null);
  if(!data)return response;
  return json({...data,agents:(data.agents||[]).map(a=>({...a,branch:branchProfile(a)})),architecture:'magnanimous-core-with-specialist-branches'},response.status);
 }

 const user=await currentUser(request,env);
 if(!user)return null;

 if(request.method==='GET'&&url.pathname==='/api/agents/branch'){
  const id=String(url.searchParams.get('agent_id')||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===id);
  if(!agent)return json({detail:'Unknown specialist branch.'},404);
  const knowledge=await branchKnowledge(env,user.tenant_id,agent.id,30);
  return json({agent:{...agent,branch:branchProfile(agent)},knowledge,knowledge_count:knowledge.length,shared_core:'Magnanimous AI',branch_isolated:true});
 }

 if(request.method==='POST'&&url.pathname==='/api/agents/branch/teach'){
  const body=await request.json().catch(()=>({}));
  const id=String(body.agent_id||'').toLowerCase();
  const agent=agents.find(a=>String(a.id).toLowerCase()===id);
  if(!agent)return json({detail:'Choose a valid specialist branch.'},400);
  const taught=await teachBranch(env,user,agent,body);
  return taught.ok?json({...taught,branch:branchProfile(agent)},201):json({detail:taught.detail},taught.status||400);
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
  const knowledge=await branchKnowledge(env,user.tenant_id,agent.id,16);
  const profile=branchProfile(agent);
  const context=branchKnowledgeContext(profile,knowledge);
  const internal=`\n\nSPECIALIST BRANCH CONTEXT — apply this silently; do not quote it back to the user.\n${context}\n\nThe user is speaking to ${agent.name}. Stay in ${agent.name}'s ${agent.title} responsibility unless a handoff is genuinely needed.`;
  const forwarded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify({...body,agent_id:agent.id,message:`${cleanMessage}${internal}`})});
  const response=await baseApp.fetch(forwarded,env,ctx);
  try{
   await env.DB.prepare("UPDATE agent_mesh_messages SET content=? WHERE id=(SELECT id FROM agent_mesh_messages WHERE tenant_id=? AND agent_id=? AND role='user' ORDER BY id DESC LIMIT 1)").bind(cleanMessage,user.tenant_id,agent.id).run();
  }catch{}
  const data=await response.clone().json().catch(()=>null);
  if(!data)return response;
  const {provider,provider_name,model,...publicData}=data;
  return json({...publicData,agent:{...(data.agent||agent),branch:profile},branch_identity:true,branch_knowledge_count:knowledge.length,spoken_name_routing:Boolean(named)},response.status);
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
