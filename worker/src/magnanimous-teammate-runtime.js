import { currentUser } from './integrations.js';
import { getProviderRuntimeEnv } from './provider-runtime-env.js';
import { getKnowledgeContext } from './knowledge-runtime.js';
import { handleMagnanimousRoutineStudio } from './magnanimous-skill-routine-runtime.js';
import { TeammateError, ensureTeammateSchema, normalizeTeammate, publicTeammate, publicTurn, findTeammate, teammateHistory, teammateMemories, runTeammateTurn } from './magnanimous-teammate-core.js';

const json = (body, status=200) => Response.json(body,{status,headers:{'cache-control':'no-store'}});
const stamp = () => Math.floor(Date.now()/1000);
const base = '/api/magnanimous/teammates';
export const TEAMMATE_TEMPLATES = [
  {id:'chief-of-staff',name:'Daily Coordinator',role:'Priorities and meeting preparation',instructions:'Use supplied calendar, inbox and project evidence to identify priorities, conflicts and decisions. Return a brief with source links. Missing inputs stay unknown. Draft replies only.'},
  {id:'research',name:'Research Partner',role:'Evidence-backed research and comparison',instructions:'Frame the question, compare current primary sources, distinguish facts from inference, and return a concise cited brief with uncertainties and dates.'},
  {id:'pipeline',name:'Pipeline Analyst',role:'Sales pipeline and account research',instructions:'Analyze authorized CRM exports and account evidence. Rank opportunities using explicit criteria, flag stale data and draft next steps. Do not contact prospects.'},
  {id:'outreach',name:'Outreach Writer',role:'Personalized outreach drafts',instructions:'Use only supplied, verified prospect facts. Draft clear relevant outreach with an explanation of the personalization. Do not invent contact details or send messages.'},
  {id:'marketing',name:'Campaign Analyst',role:'Campaign measurement and creative preparation',instructions:'Compare provided campaign results with objectives. Separate measured performance from hypotheses. Prepare creative and budget recommendations for review; do not publish or change spend.'},
  {id:'feedback',name:'Feedback Triage',role:'Customer feedback and product issues',instructions:'Group supplied feedback, retain evidence links, distinguish frequency from severity and propose reproducible acceptance criteria. Do not invent usage data.'},
  {id:'engineering',name:'Engineering Reviewer',role:'Bug analysis and implementation review',instructions:'Inspect provided code, logs and test results. Identify reproducible defects, scope a minimal fix and propose tests. Never claim code ran or was deployed without a real execution receipt.'},
  {id:'account-health',name:'Customer Health',role:'Account health and renewal preparation',instructions:'Combine supplied usage, tickets and contract dates into a dated risk assessment. Flag missing inputs and propose a renewal discussion pack. Do not change account terms or contact customers.'},
  {id:'coaching',name:'Conversation Coach',role:'Call and meeting coaching',instructions:'Use supplied transcripts with consent. Separate quotes from interpretation, identify actionable improvements and draft practice scenarios. Do not infer sensitive traits.'},
  {id:'operations',name:'Operations Partner',role:'Repeatable operations and reconciliation',instructions:'Reconcile supplied records, explain discrepancies and turn stable procedures into draft skills with input requirements, validation and approval boundaries.'}
];
const surfaces = [
  {name:'Skills, schedules and shared files',href:'/routine-studio',boundary:'Existing owner-authorized runner; browser and sandbox steps need attached execution services.'},
  {name:'Browser work',href:'/owner-web-agent',boundary:'Owner-paired browser; sessions, site restrictions and exact action approvals apply.'},
  {name:'Connected tools',href:'/assistant-actions',boundary:'Account authorization and confirmation remain required.'},
  {name:'Research and saved knowledge',href:'/knowledge',boundary:'Workspace sources and live search; stored knowledge is not model training data.'},
  {name:'Code and repository work',href:'/developer-agent',boundary:'Owner-authorized repository adapter; writes and releases are staged.'},
  {name:'Voice and specialist conversations',href:'/agent-video',boundary:'Existing voice/avatar workspace; device and service readiness apply.'},
  {name:'Images and video',href:'/video-studio',boundary:'Existing media workflows; rendering and paid usage require configured capacity.'}
];
async function bodyOf(request) {
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>64000)throw new TeammateError('Request is too large.',413);
  try{const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body}catch{throw new TeammateError('Send a JSON object.');}
}

export async function handleMagnanimousTeammates(request,env,dependencies={}) {
  const path=new URL(request.url).pathname;
  if(path!==base&&!path.startsWith(base+'/'))return null;
  if(!env?.DB)return json({detail:'Teammate storage is not configured.'},503);
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to use your Magnanimous teammates.'},401);
  try {
    await ensureTeammateSchema(env);
    const tenant=String(user.tenant_id),userId=String(user.id);
    if(path===base+'/catalog'&&request.method==='GET')return json({identity:'Magnanimous AI',templates:TEAMMATE_TEMPLATES,surfaces,
      capabilities:{private_profiles:true,private_memory:true,durable_history:true,explicit_handoffs:true,reusable_teammate_steps:true,
        research_with_sources:true,autonomous_external_actions:false,cloud_computer_provisioned_by_this_feature:false,proprietary_grok_copied:false},
      note:'Original Magnanimous workflows based on public capability research. Linked services report their own readiness; a link is not proof of a live connection.'});
    if(path===base) {
      if(request.method==='GET') {
        const{results=[]}=await env.DB.prepare("SELECT * FROM magnanimous_teammates WHERE tenant_id=? AND user_id=? AND status!='archived' ORDER BY updated_at DESC").bind(tenant,userId).all();
        return json({teammates:results.map(publicTeammate)});
      }
      if(request.method==='POST') {
        const body=normalizeTeammate(await bodyOf(request)),id=`mt_${crypto.randomUUID()}`,ts=stamp();
        const count=await env.DB.prepare("SELECT COUNT(*) n FROM magnanimous_teammates WHERE tenant_id=? AND user_id=? AND status!='archived'").bind(tenant,userId).first();
        if(Number(count?.n)>=50)throw new TeammateError('Archive an unused teammate before creating more than 50.',409);
        await env.DB.prepare('INSERT INTO magnanimous_teammates(id,tenant_id,user_id,name,role,instructions,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
          .bind(id,tenant,userId,body.name,body.role,body.instructions,body.status,ts,ts).run();
        return json({teammate:publicTeammate(await findTeammate(env,user,id))},201);
      }
    }
    const match=path.match(/^\/api\/magnanimous\/teammates\/([a-zA-Z0-9_-]+)(?:\/(turns|memories|skill)(?:\/([a-zA-Z0-9_-]+))?)?$/);
    if(!match)return json({detail:'Teammate endpoint not found.'},404);
    const[,teammateId,operation,itemId]=match,teammate=await findTeammate(env,user,teammateId);
    if(!teammate)return json({detail:'Teammate not found.'},404);
    if(!operation&&request.method==='GET')return json({teammate:publicTeammate(teammate),turns:(await teammateHistory(env,user,teammateId)).map(publicTurn),memories:await teammateMemories(env,user,teammateId)});
    if(!operation&&request.method==='PATCH') {
      const body=normalizeTeammate(await bodyOf(request),teammate);
      const result=await env.DB.prepare('UPDATE magnanimous_teammates SET name=?,role=?,instructions=?,status=?,updated_at=? WHERE id=? AND tenant_id=? AND user_id=? AND busy_until<=?')
        .bind(body.name,body.role,body.instructions,body.status,stamp(),teammateId,tenant,userId,stamp()).run();
      if(!result.meta?.changes)throw new TeammateError('Wait for the active turn before editing this teammate.',409);
      return json({teammate:publicTeammate(await findTeammate(env,user,teammateId))});
    }
    if(operation==='turns'&&!itemId&&request.method==='POST') {
      const body=await bodyOf(request),runtime=await getProviderRuntimeEnv(env);
      const research=dependencies.research|| (async query=>(await getKnowledgeContext(request,runtime,query,{liveSearch:true,remember:false,localLimit:6,webLimit:6})).sources);
      // No client-provided context, provider, tools, credentials or approval flags are forwarded.
      const result=await runTeammateTurn(runtime,user,teammateId,{message:body.message,request_key:body.request_key,source_turn_id:body.source_turn_id,mode:body.mode},
        {...dependencies,research});
      return json(result,result.replayed?200:201);
    }
    if(operation==='memories'&&!itemId&&request.method==='POST') {
      const body=await bodyOf(request),key=String(body.key||'').trim().slice(0,120),value=String(body.value||'').trim().slice(0,4000),ts=stamp();
      if(!key||!value)throw new TeammateError('Memory key and value are required. Do not store credentials here.');
      const memories=await teammateMemories(env,user,teammateId);
      if(memories.length>=50&&!memories.some(m=>m.memory_key===key))throw new TeammateError('Remove an unused memory before adding more than 50.',409);
      await env.DB.prepare(`INSERT INTO magnanimous_teammate_memories(id,tenant_id,user_id,teammate_id,memory_key,memory_value,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(tenant_id,user_id,teammate_id,memory_key) DO UPDATE SET memory_value=excluded.memory_value,updated_at=excluded.updated_at`)
        .bind(`mtm_${crypto.randomUUID()}`,tenant,userId,teammateId,key,value,ts,ts).run();
      return json({memories:await teammateMemories(env,user,teammateId)},201);
    }
    if(operation==='memories'&&itemId&&request.method==='DELETE') {
      const result=await env.DB.prepare('DELETE FROM magnanimous_teammate_memories WHERE id=? AND teammate_id=? AND tenant_id=? AND user_id=?').bind(itemId,teammateId,tenant,userId).run();
      return json({removed:Boolean(result.meta?.changes)});
    }
    if(operation==='skill'&&!itemId&&request.method==='POST') {
      const body=await bodyOf(request),prompt=String(body.prompt||'').trim().slice(0,8000);
      if(!prompt)throw new TeammateError('Describe the repeatable task first.');
      const headers=new Headers(request.headers);headers.set('content-type','application/json');
      // Delegate to the existing owner gate. Saving never enables a schedule.
      return handleMagnanimousRoutineStudio(new Request(new URL('/api/magnanimous/routine-studio/skills',request.url),{method:'POST',headers,body:JSON.stringify({
        name:String(body.name||`${teammate.name} skill`).slice(0,160),description:'Reusable Magnanimous teammate task. Test before scheduling.',
        steps:[{type:'teammate.prompt',teammate_id:teammateId,prompt,label:teammate.name}]
      })}),env);
    }
    return json({detail:'Method not allowed.'},405);
  } catch(error) {
    if(error instanceof TeammateError)return json({detail:error.message,code:error.code},error.status);
    console.error('Magnanimous teammate request failed',error?.name||'Error');
    return json({detail:'The teammate request could not complete. Refresh history before retrying.',code:'TEAMMATE_REQUEST_FAILED'},500);
  }
}
