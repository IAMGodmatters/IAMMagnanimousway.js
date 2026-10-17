import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=value=>String(value??'').trim();
const clamp=(value,min,max,fallback=min)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};

export const ADVANCED_CONTACT_CENTER_VERSION='2026-10-17';

export const ADVANCED_QUEUE_STRATEGIES=Object.freeze([
 'ring_all',
 'prioritized_hunt',
 'random_start',
 'round_robin',
 'longest_idle',
 'least_talk_time',
 'fewest_answered',
 'hunt_three_random',
 'hunt_three_priority',
 'skills_ring_all',
 'skills_random_start',
 'skills_round_robin',
 'skills_fewest_answered'
]);

const SKILL_BASE=Object.freeze({
 skills_ring_all:'ring_all',
 skills_random_start:'random_start',
 skills_round_robin:'round_robin',
 skills_fewest_answered:'fewest_answered'
});

const ACTION_RISK=new Set(['write','delete','paid','regulated','record','supervise']);

export const ADVANCED_CONTACT_CENTER_CAPABILITIES=Object.freeze({
 identity:{brain:'Magnanimous AI',service:'Magnanimous Call Center',telecom:'Magnanimous Telecom',provider_policy:'External PBX, carrier and AI systems remain replaceable adapters beneath Magnanimous policy and identity.'},
 queues:{
  strategies:ADVANCED_QUEUE_STRATEGIES,
  controls:['skills','availability_escalation','time_escalation','cumulative_escalation','callback','wrap_up','maximum_callers','priority_queue','sla','queue_login','queue_logout','status_scheduling','supervisor_assignment','queue_voicemail'],
  callbacks:['caller_requested','automatic_timeout','offered_after_wait'],
  supervisor:['monitor','whisper','barge','recording_control'],
  supervisor_policy:'Supervisor actions require authenticated role authority, explicit policy permission, audit logging and applicable recording/monitoring consent.'
 },
 ai:{
  roles:['receptionist','personal_assistant','customer_service','specialist'],
  controls:['knowledge_sources','human_handoff','topic_escalation','availability_check','engine_fallback','spam_filter','abuse_policy','nonresponsive_policy','prompt_versioning','provider_abstraction'],
  transcript_pipeline:['local_or_private_transcription','speaker_detection','summary','sentiment','topics','action_items','qa_flags','pii_reduction','human_review_before_knowledge_publish'],
  tool_policy:['server_side_identity','least_privilege','explicit_allowlist','read_only_default','approval_for_consequential_actions','deny_unapproved_tools','immutable_audit']
 },
 omnichannel:['voice','web_chat','click_to_call','sms','mms','whatsapp','facebook_messaging','email','voicemail'],
 crm:['contact_lookup','contact_creation','call_journaling','chat_journaling','screen_pop','disposition_sync','oauth_or_secret_binding'],
 control_plane:['rest_configuration','websocket_call_events','service_principals','scoped_tokens','call_create','answer','transfer','terminate','active_call_state','webhook_events'],
 site_edge:['sip_trunk_health','tls_sip','srtp','stun_turn','sbc_or_edge_proxy','nat_diagnostics','firewall_health','multi_site_federation'],
 observability:['queue_depth','answer_rate','abandon_rate','sla','wait_time','handle_time','wrap_time','agent_utilization','setup_ms','rtt_ms','jitter_ms','packet_loss_pct','mos_estimate','disconnect_cause'],
 safety:['dnc_and_consent','recording_consent','emergency_fail_closed','caller_identity_truth','fraud_controls','spend_caps','tenant_isolation','secret_bindings_only','audit_trail','supply_chain_update_discipline']
});

function hashText(value){
 let hash=2166136261;
 for(const ch of String(value||'')){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return hash>>>0;
}

function agentId(agent,index){return clean(agent?.id||agent?.agent_id||agent?.user_id||`agent-${index+1}`)}
function normalizedAgent(agent,index){
 return {
  id:agentId(agent,index),
  status:clean(agent?.status||'available').toLowerCase(),
  active:agent?.active!==false&&Number(agent?.active??1)!==0,
  logged_in:agent?.logged_in!==false&&Number(agent?.logged_in??1)!==0,
  priority:clamp(agent?.priority,1,1000,100),
  skill_level:clamp(agent?.skill_level,1,5,1),
  last_available_at:clamp(agent?.last_available_at,0,Number.MAX_SAFE_INTEGER,0),
  last_assigned_at:clamp(agent?.last_assigned_at,0,Number.MAX_SAFE_INTEGER,0),
  talk_seconds:clamp(agent?.talk_seconds,0,Number.MAX_SAFE_INTEGER,0),
  answered_count:clamp(agent?.answered_count,0,Number.MAX_SAFE_INTEGER,0),
  source:agent
 };
}

function eligibleAgents(input){
 const agents=Array.isArray(input)?input.slice(0,500):[];
 return agents.map(normalizedAgent).filter(agent=>agent.active&&agent.logged_in&&agent.status==='available');
}

function deterministicShuffle(agents,key){
 return [...agents].sort((a,b)=>hashText(`${key}:${a.id}`)-hashText(`${key}:${b.id}`)||a.id.localeCompare(b.id));
}

function rotate(agents,cursor){
 if(!agents.length)return [];
 const offset=Math.abs(Number(cursor)||0)%agents.length;
 return [...agents.slice(offset),...agents.slice(0,offset)];
}

function baseRoute(strategy,agents,options={}){
 const key=clean(options.call_key||options.queue_key||'magnanimous');
 const cursor=clamp(options.cursor,0,Number.MAX_SAFE_INTEGER,0);
 const prioritized=[...agents].sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 switch(strategy){
  case 'ring_all': return agents;
  case 'prioritized_hunt': return prioritized;
  case 'random_start': return rotate(deterministicShuffle(agents,key),hashText(key));
  case 'round_robin': return rotate([...agents].sort((a,b)=>a.id.localeCompare(b.id)),cursor);
  case 'longest_idle': return [...agents].sort((a,b)=>(a.last_assigned_at||0)-(b.last_assigned_at||0)||a.id.localeCompare(b.id));
  case 'least_talk_time': return [...agents].sort((a,b)=>a.talk_seconds-b.talk_seconds||a.id.localeCompare(b.id));
  case 'fewest_answered': return [...agents].sort((a,b)=>a.answered_count-b.answered_count||a.id.localeCompare(b.id));
  case 'hunt_three_random': return deterministicShuffle(agents,key).slice(0,3);
  case 'hunt_three_priority': return prioritized.slice(0,3);
  default: return [];
 }
}

function publicAgent(agent){
 return {
  id:agent.id,
  priority:agent.priority,
  skill_level:agent.skill_level,
  last_assigned_at:agent.last_assigned_at,
  talk_seconds:agent.talk_seconds,
  answered_count:agent.answered_count
 };
}

export function planAdvancedQueueRoute(body={}){
 const requested=clean(body.strategy||'longest_idle').toLowerCase();
 if(!ADVANCED_QUEUE_STRATEGIES.includes(requested)){
  return {ok:false,error:'UNSUPPORTED_STRATEGY',detail:'Unsupported queue routing strategy.',supported:ADVANCED_QUEUE_STRATEGIES};
 }
 const agents=eligibleAgents(body.agents);
 const maxCandidates=clamp(body.max_candidates,1,100,100);
 if(!agents.length)return {ok:true,strategy:requested,eligible:0,candidates:[],tiers:[],reason:'NO_AVAILABLE_AGENTS'};
 const skillBase=SKILL_BASE[requested];
 if(!skillBase){
  const candidates=baseRoute(requested,agents,body).slice(0,maxCandidates).map(publicAgent);
  return {ok:true,strategy:requested,eligible:agents.length,candidates,tiers:[],reason:candidates.length?'ROUTE_READY':'NO_ROUTE'};
 }
 const escalation=clean(body.skill_escalation||'availability').toLowerCase();
 const mode=['availability','time','cumulative'].includes(escalation)?escalation:'availability';
 const levels=[1,2,3,4,5];
 const tiers=[];
 let cumulative=[];
 for(const level of levels){
  const levelAgents=agents.filter(agent=>agent.skill_level===level);
  if(!levelAgents.length)continue;
  cumulative=[...cumulative,...levelAgents];
  const pool=mode==='cumulative'?cumulative:levelAgents;
  tiers.push({level,candidates:baseRoute(skillBase,pool,{...body,call_key:`${clean(body.call_key)}:skill-${level}`}).slice(0,maxCandidates).map(publicAgent)});
 }
 const first=tiers.find(tier=>tier.candidates.length)?.candidates||[];
 return {ok:true,strategy:requested,base_strategy:skillBase,skill_escalation:mode,eligible:agents.length,candidates:first,tiers,reason:first.length?'ROUTE_READY':'NO_ROUTE'};
}

function normalizeAllowlist(list){return new Set((Array.isArray(list)?list:[]).map(item=>clean(item)).filter(Boolean).slice(0,200))}

export function evaluateAIToolPolicy(body={},user={}){
 const tool=clean(body.tool);
 const risk=clean(body.risk||'read').toLowerCase();
 const approval=clean(body.approval||'needs_approval').toLowerCase();
 const allowlist=normalizeAllowlist(body.allowlist);
 const ownerLike=['owner','admin'].includes(clean(user?.role).toLowerCase());
 if(!tool)return {allowed:false,reason:'TOOL_REQUIRED'};
 if(!allowlist.has(tool))return {allowed:false,reason:'TOOL_NOT_ALLOWLISTED',tool};
 if(approval==='deny')return {allowed:false,reason:'CLIENT_POLICY_DENY',tool};
 if(['paid','regulated'].includes(risk)&&!ownerLike)return {allowed:false,reason:'OWNER_OR_ADMIN_REQUIRED',tool,risk};
 const consequential=ACTION_RISK.has(risk);
 if((approval==='needs_approval'||consequential)&&body.user_approved!==true){
  return {allowed:false,reason:'EXPLICIT_APPROVAL_REQUIRED',tool,risk,approval_required:true};
 }
 return {allowed:true,reason:'POLICY_ALLOWED',tool,risk,approval_required:false};
}

function redactPII(text){
 let value=String(text||'').slice(0,50000);
 const flags=[];
 const replace=(regex,label)=>{if(regex.test(value)){flags.push(label);regex.lastIndex=0;value=value.replace(regex,`[REDACTED_${label}]`)}};
 replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'EMAIL');
 replace(/(?:\+?\d[\s().-]*){8,16}/g,'PHONE');
 replace(/\b(?:\d[ -]*?){13,19}\b/g,'PAYMENT_NUMBER');
 replace(/\b(?:password|passcode|api\s*key|secret|token)\s*[:=]\s*\S+/gi,'SECRET');
 return {text:value,flags:[...new Set(flags)]};
}

export function transcriptKnowledgeDraft(body={}){
 const transcript=clean(body.transcript);
 if(!transcript)return {ok:false,error:'TRANSCRIPT_REQUIRED'};
 const redacted=redactPII(transcript);
 const lines=redacted.text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const excerpts=lines.filter(line=>line.length>=20).slice(0,40);
 return {
  ok:true,
  status:'needs_review',
  publish_allowed:false,
  pii_flags:redacted.flags,
  sanitized_transcript:redacted.text,
  candidate_excerpts:excerpts,
  review_requirements:['Verify factual accuracy.','Remove transient customer-specific details.','Remove remaining personal or confidential information.','Confirm the information is approved for future customer-facing use.'],
  note:'This endpoint prepares a review draft only. It never auto-publishes transcript content into the Magnanimous knowledge base.'
 };
}

async function requireUser(request,env){
 try{return await currentUser(request,env)}catch{return null}
}

export async function handleMagnanimousAdvancedContactCenter(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/contact-center/advanced'))return null;
 const user=await requireUser(request,env);
 if(!user)return json({detail:'Sign in required.'},401);
 if(request.method==='GET'&&path==='/api/contact-center/advanced/capabilities'){
  return json({version:ADVANCED_CONTACT_CENTER_VERSION,...ADVANCED_CONTACT_CENTER_CAPABILITIES});
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/route-plan'){
  const body=await request.json().catch(()=>({}));
  const plan=planAdvancedQueueRoute(body);
  return json(plan,plan.ok?200:400);
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/tool-policy'){
  const body=await request.json().catch(()=>({}));
  return json(evaluateAIToolPolicy(body,user));
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/knowledge-draft'){
  const body=await request.json().catch(()=>({}));
  const draft=transcriptKnowledgeDraft(body);
  return json(draft,draft.ok?200:400);
 }
 return json({detail:'Advanced contact-center route not found.'},404);
}
