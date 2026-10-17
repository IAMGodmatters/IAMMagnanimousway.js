import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clean=value=>String(value??'').trim();
const clamp=(value,min,max,fallback=min)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
const bool=value=>value===true||value===1||value==='1'||String(value||'').toLowerCase()==='true';

export const ADVANCED_CONTACT_CENTER_VERSION='2026-10-17.2';

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
const FLOW_TYPES=new Set(['start','prompt','menu','input','condition','transfer','queue','voicemail','callback','http_request','crm_lookup','database_lookup','tts','transcribe','set_variable','wait','webhook','hangup']);
const BLOCKED_FLOW_TYPES=new Set(['execute_code','shell','socket','filesystem','eval','arbitrary_script']);
const DAY_KEYS=['sun','mon','tue','wed','thu','fri','sat'];

export const ADVANCED_CONTACT_CENTER_CAPABILITIES=Object.freeze({
 identity:{brain:'Magnanimous AI',service:'Magnanimous Call Center',telecom:'Magnanimous Telecom',provider_policy:'External PBX, carrier and AI systems remain replaceable adapters beneath Magnanimous policy and identity.'},
 queues:{
  strategies:ADVANCED_QUEUE_STRATEGIES,
  controls:['skills','availability_escalation','time_escalation','cumulative_escalation','callback','wrap_up','maximum_callers','priority_queue','sla','queue_login','queue_logout','status_scheduling','supervisor_assignment','queue_voicemail'],
  callbacks:['caller_requested','automatic_timeout','offered_after_wait','scheduled_callback'],
  supervisor:['monitor','whisper','barge','recording_control'],
  supervisor_policy:'Supervisor actions require authenticated role authority, explicit policy permission, audit logging and applicable recording/monitoring consent.'
 },
 outbound:{
  planning:['power','progressive','predictive'],
  predictive_optimization:['agents','callees'],
  safety:'Predictive planning never places calls. Execution remains behind consent, DNC, calling-window, holiday, spend, carrier and consequential-action gates.'
 },
 schedules:['department_office_hours','breaks','holidays','temporary_override','destination_based_routing'],
 devices:['hot_desking','authenticated_takeover','forced_logout','idle_emergency_only'],
 workflows:{
  components:[...FLOW_TYPES],
  policy:'Server-side flow validation permits declarative components only. Raw code, shell, sockets, filesystem access and embedded credentials are rejected.'
 },
 reporting:['queue_summary','sla','answer_rate','abandon_rate','wait_time','handle_time','wrap_time','agent_utilization','call_drilldown_ready'],
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

function complianceFailures(body={}){
 const failures=[];
 if(!bool(body.campaign_enabled))failures.push('CAMPAIGN_DISABLED');
 if(!bool(body.consent_verified))failures.push('CONSENT_NOT_VERIFIED');
 if(!bool(body.dnc_clear))failures.push('DNC_NOT_CLEARED');
 if(!bool(body.within_calling_window))failures.push('OUTSIDE_CALLING_WINDOW');
 if(bool(body.holiday_blocked))failures.push('HOLIDAY_BLOCK');
 if(!bool(body.spend_cap_ok))failures.push('SPEND_CAP_NOT_CONFIRMED');
 if(!bool(body.carrier_ready))failures.push('CARRIER_NOT_READY');
 return failures;
}

export function planPredictiveDialing(body={}){
 const optimization=['agents','callees'].includes(clean(body.optimization).toLowerCase())?clean(body.optimization).toLowerCase():'callees';
 const failures=complianceFailures(body);
 const totalAgents=clamp(body.available_agents,0,10000,0);
 const activeAgentCalls=clamp(body.active_agent_calls,0,10000,0);
 const freeAgents=Math.max(0,totalAgents-activeAgentCalls);
 const answerRate=clamp(body.estimated_answer_rate,0.05,1,0.35);
 const abandonmentCeiling=clamp(body.max_abandonment_rate,0,0.2,0.03);
 const maxConcurrent=clamp(body.max_concurrent_outbound,0,10000,freeAgents||0);
 const perMinuteCap=clamp(body.per_minute_cap,0,10000,maxConcurrent);
 const overdialRatio=clamp(body.max_overdial_ratio,1,2.5,1.25);
 let demand=0;
 if(freeAgents>0){
  demand=optimization==='agents'?Math.ceil((freeAgents/answerRate)*Math.min(overdialRatio,1.5)):freeAgents;
 }
 demand=Math.min(demand,maxConcurrent,perMinuteCap);
 const estimatedSetupCost=clamp(body.estimated_setup_cost_micro,0,Number.MAX_SAFE_INTEGER,0);
 const spendRemaining=clamp(body.spend_remaining_micro,0,Number.MAX_SAFE_INTEGER,0);
 if(estimatedSetupCost>0)demand=Math.min(demand,Math.floor(spendRemaining/estimatedSetupCost));
 if(failures.length)demand=0;
 return {
  ok:true,
  planning_allowed:failures.length===0,
  execution_authorized:false,
  optimization,
  free_agents:freeAgents,
  estimated_answer_rate:answerRate,
  max_abandonment_rate:abandonmentCeiling,
  recommended_dials:Math.max(0,demand),
  blocked_by:failures,
  note:'Planning only. Actual dialing must re-check consent, DNC, calling window, carrier, spend and consequential-action authorization at execution time.'
 };
}

function parseMinute(value){
 const match=/^(\d{1,2}):(\d{2})$/.exec(clean(value));
 if(!match)return null;
 const hour=Number(match[1]),minute=Number(match[2]);
 if(hour<0||hour>23||minute<0||minute>59)return null;
 return hour*60+minute;
}

function timeParts(now,timeZone){
 let date=new Date(now||Date.now());
 if(Number.isNaN(date.getTime()))date=new Date();
 const zone=clean(timeZone)||'UTC';
 try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const map=Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  const weekday=clean(map.weekday).slice(0,3).toLowerCase();
  return {zone,weekday,date:`${map.year}-${map.month}-${map.day}`,minute:Number(map.hour)*60+Number(map.minute),epoch_ms:date.getTime()};
 }catch{
  return {zone:'UTC',weekday:DAY_KEYS[date.getUTCDay()],date:date.toISOString().slice(0,10),minute:date.getUTCHours()*60+date.getUTCMinutes(),epoch_ms:date.getTime()};
 }
}

function inWindow(minute,window){
 const start=parseMinute(window?.start),end=parseMinute(window?.end);
 if(start===null||end===null||start===end)return false;
 return start<end?(minute>=start&&minute<end):(minute>=start||minute<end);
}

export function evaluateOfficeHours(body={}){
 const current=timeParts(body.now,body.time_zone);
 const override=body.override&&typeof body.override==='object'?body.override:null;
 const overrideMode=clean(override?.mode).toLowerCase();
 const overrideUntil=Number(new Date(override?.until||0));
 if(['open','closed','break'].includes(overrideMode)&&Number.isFinite(overrideUntil)&&overrideUntil>current.epoch_ms){
  return {ok:true,mode:overrideMode,reason:'TEMPORARY_OVERRIDE',date:current.date,weekday:current.weekday,time_zone:current.zone,override_until:new Date(overrideUntil).toISOString()};
 }
 const holidays=new Set((Array.isArray(body.holidays)?body.holidays:[]).map(clean));
 if(holidays.has(current.date))return {ok:true,mode:'holiday',reason:'HOLIDAY',date:current.date,weekday:current.weekday,time_zone:current.zone};
 const breaks=Array.isArray(body.breaks?.[current.weekday])?body.breaks[current.weekday]:[];
 if(breaks.some(window=>inWindow(current.minute,window)))return {ok:true,mode:'break',reason:'BREAK_WINDOW',date:current.date,weekday:current.weekday,time_zone:current.zone};
 const windows=Array.isArray(body.hours?.[current.weekday])?body.hours[current.weekday]:[];
 if(windows.some(window=>inWindow(current.minute,window)))return {ok:true,mode:'open',reason:'OFFICE_HOURS',date:current.date,weekday:current.weekday,time_zone:current.zone};
 return {ok:true,mode:'closed',reason:'OUTSIDE_OFFICE_HOURS',date:current.date,weekday:current.weekday,time_zone:current.zone};
}

export function evaluateHotdeskPolicy(body={},user={}){
 const emergency=bool(body.emergency_call);
 const occupied=Boolean(clean(body.current_user_id));
 const requestedUser=clean(body.requested_user_id||user?.id);
 const currentUserId=clean(body.current_user_id);
 const userAllowed=bool(body.user_allowed);
 const credentialVerified=bool(body.credential_verified);
 const explicitTakeover=bool(body.explicit_takeover);
 if(!requestedUser&&!emergency)return {allowed:false,reason:'USER_REQUIRED'};
 if(!occupied&&emergency)return {allowed:true,reason:'IDLE_EMERGENCY_ONLY',mode:'emergency'};
 if(!occupied&&!userAllowed)return {allowed:false,reason:'HOTDESK_NOT_ALLOWED'};
 if(!occupied&&!credentialVerified)return {allowed:false,reason:'AUTHENTICATION_REQUIRED'};
 if(occupied&&currentUserId===requestedUser)return {allowed:true,reason:'ALREADY_ASSIGNED',mode:'user'};
 if(occupied&&!explicitTakeover)return {allowed:false,reason:'EXPLICIT_TAKEOVER_REQUIRED'};
 if(occupied&&!credentialVerified)return {allowed:false,reason:'AUTHENTICATION_REQUIRED'};
 if(!userAllowed)return {allowed:false,reason:'HOTDESK_NOT_ALLOWED'};
 return {allowed:true,reason:occupied?'TAKEOVER_ALLOWED':'LOGIN_ALLOWED',mode:'user',force_logout_previous:occupied};
}

function containsRawSecret(config={}){
 const keys=Object.keys(config||{}).map(key=>key.toLowerCase());
 return keys.some(key=>['password','secret','token','api_key','apikey','private_key','credential'].some(term=>key.includes(term)));
}

export function validateCallFlow(body={}){
 const nodes=Array.isArray(body.nodes)?body.nodes.slice(0,201):[];
 const edges=Array.isArray(body.edges)?body.edges.slice(0,401):[];
 const errors=[];
 if(!nodes.length)errors.push('FLOW_REQUIRES_NODES');
 if(nodes.length>200)errors.push('FLOW_NODE_LIMIT_EXCEEDED');
 if(edges.length>400)errors.push('FLOW_EDGE_LIMIT_EXCEEDED');
 const ids=new Set();
 let starts=0;
 for(const node of nodes){
  const id=clean(node?.id),type=clean(node?.type).toLowerCase();
  if(!id)errors.push('NODE_ID_REQUIRED');
  else if(ids.has(id))errors.push(`DUPLICATE_NODE:${id}`);
  else ids.add(id);
  if(type==='start')starts+=1;
  if(BLOCKED_FLOW_TYPES.has(type)||!FLOW_TYPES.has(type))errors.push(`UNSUPPORTED_NODE_TYPE:${type||'empty'}`);
  if(containsRawSecret(node?.config))errors.push(`RAW_SECRET_NOT_ALLOWED:${id||'unknown'}`);
  const url=clean(node?.config?.url);
  if(['http_request','webhook'].includes(type)&&url&&!url.startsWith('https://'))errors.push(`HTTPS_REQUIRED:${id||'unknown'}`);
 }
 if(starts!==1)errors.push('FLOW_REQUIRES_EXACTLY_ONE_START');
 for(const edge of edges){
  const from=clean(edge?.from),to=clean(edge?.to);
  if(!ids.has(from))errors.push(`EDGE_FROM_UNKNOWN:${from||'empty'}`);
  if(!ids.has(to))errors.push(`EDGE_TO_UNKNOWN:${to||'empty'}`);
 }
 return {ok:errors.length===0,valid:errors.length===0,errors:[...new Set(errors)],node_count:nodes.length,edge_count:edges.length,execution_authorized:false,note:'Validation only. Executing a flow requires normal tenant, tool, carrier, billing and compliance authorization.'};
}

export function planScheduledCallback(body={}){
 const requested=new Date(body.requested_at||'');
 const now=new Date(body.now||Date.now());
 const failures=[];
 if(Number.isNaN(requested.getTime()))failures.push('INVALID_CALLBACK_TIME');
 if(!Number.isNaN(requested.getTime())&&requested.getTime()<=now.getTime())failures.push('CALLBACK_MUST_BE_FUTURE');
 if(!Number.isNaN(requested.getTime())&&requested.getTime()-now.getTime()>90*24*60*60*1000)failures.push('CALLBACK_TOO_FAR_OUT');
 if(!bool(body.consent_verified))failures.push('CONSENT_NOT_VERIFIED');
 if(!bool(body.dnc_clear))failures.push('DNC_NOT_CLEARED');
 if(!bool(body.carrier_ready))failures.push('CARRIER_NOT_READY');
 if(!bool(body.spend_cap_ok))failures.push('SPEND_CAP_NOT_CONFIRMED');
 return {ok:true,scheduled:failures.length===0,execution_authorized:false,requested_at:Number.isNaN(requested.getTime())?null:requested.toISOString(),blocked_by:failures,note:'Scheduling eligibility only. Execution must re-check office hours, consent, DNC, carrier and spend at call time.'};
}

function average(values){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0}

export function summarizeContactCenterReport(body={}){
 const rows=(Array.isArray(body.calls)?body.calls:[]).slice(0,10000);
 const slaTarget=clamp(body.sla_target_ms,1,24*60*60*1000,20000);
 let offered=0,answered=0,abandoned=0;
 const waits=[],handles=[],wraps=[];
 let withinSla=0;
 for(const row of rows){
  const status=clean(row?.status).toLowerCase();
  if(['offered','answered','completed','abandoned','missed'].includes(status))offered+=1;
  if(['answered','completed'].includes(status))answered+=1;
  if(status==='abandoned')abandoned+=1;
  const wait=clamp(row?.wait_ms,0,24*60*60*1000,0);
  const handle=clamp(row?.handle_ms,0,24*60*60*1000,0);
  const wrap=clamp(row?.wrap_ms,0,24*60*60*1000,0);
  waits.push(wait);handles.push(handle);wraps.push(wrap);
  if(['answered','completed'].includes(status)&&wait<=slaTarget)withinSla+=1;
 }
 const pct=(num,den)=>den?Math.round((num/den)*10000)/100:0;
 return {
  ok:true,
  rows:rows.length,
  offered,
  answered,
  abandoned,
  answer_rate_pct:pct(answered,offered),
  abandon_rate_pct:pct(abandoned,offered),
  sla_target_ms:slaTarget,
  sla_pct:pct(withinSla,answered),
  avg_wait_ms:Math.round(average(waits)),
  avg_handle_ms:Math.round(average(handles)),
  avg_wrap_ms:Math.round(average(wraps))
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
 if(request.method==='POST'&&path==='/api/contact-center/advanced/predictive-plan'){
  const body=await request.json().catch(()=>({}));
  return json(planPredictiveDialing(body));
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/office-hours'){
  const body=await request.json().catch(()=>({}));
  return json(evaluateOfficeHours(body));
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/hotdesk-policy'){
  const body=await request.json().catch(()=>({}));
  return json(evaluateHotdeskPolicy(body,user));
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/callflow-validate'){
  const body=await request.json().catch(()=>({}));
  const result=validateCallFlow(body);
  return json(result,result.ok?200:400);
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/callback-plan'){
  const body=await request.json().catch(()=>({}));
  return json(planScheduledCallback(body));
 }
 if(request.method==='POST'&&path==='/api/contact-center/advanced/report-summary'){
  const body=await request.json().catch(()=>({}));
  return json(summarizeContactCenterReport(body));
 }
 return json({detail:'Advanced contact-center route not found.'},404);
}
