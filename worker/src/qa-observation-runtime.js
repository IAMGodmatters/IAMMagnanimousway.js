import { currentUser } from './integrations.js';
import { ensureBranchSchema, isPlatformOwnerUser } from './agent-branch-intelligence.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const qnaPaths=new Set(['/api/chat','/api/agents/chat']);
const PRIVATE_EXECUTION_RE=/\b(openai|chatgpt|anthropic|claude|gemini|groq|mistral|openrouter|cerebras|hugging face|cloudflare workers ai|workers ai|nemotron|gemma|glm)\b|@cf\/[\w./-]+|\b(?:gpt|llama|claude|gemini|mistral|nemotron|gemma|glm)-[\w.-]+/i;
const MALFORMED_QA_RE=/\[object Object\]|\bundefined\b|\bNaN\b|MAGNANIMOUS CENTRAL BRAIN CONTEXT|MAGNANIMOUS COMMAND LAYER|AUTOMATIC SPECIALIST HANDOFF|SPECIALIST BRANCH CONTEXT/i;
function qaQualityIssue({qa,failed,answer}){
 if(!qa||failed)return'';
 const text=String(answer||'').trim();
 if(!text)return'Successful Q&A response contained no readable answer.';
 if(PRIVATE_EXECUTION_RE.test(text))return'Customer answer exposed a private execution provider or model identity.';
 if(MALFORMED_QA_RE.test(text))return'Customer answer appears to contain malformed output or internal routing/context text.';
 return'';
}

function cleanText(value,limit=2400){
 return String(value||'')
  .replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]')
  .replace(/(password|passwd|passcode|secret|token|authorization|api.?key|cvv|cvc)\s*[:=]\s*\S+/gi,'$1=[REDACTED]')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[EMAIL REDACTED]')
  .replace(/\+?\d[\d\s().-]{7,}\d/g,'[PHONE REDACTED]')
  .replace(/\b(?:\d[ -]*?){13,19}\b/g,'[NUMBER REDACTED]')
  .trim().slice(0,limit);
}
function int(v,min,max,fallback){const n=Number.parseInt(String(v??''),10);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function isQaPath(path){return qnaPaths.has(String(path||''))||/^\/api\/[^/]+\/chat$/.test(String(path||''))}

export async function ensureQaObservationSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS qa_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  http_status INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  agent_id TEXT NOT NULL DEFAULT '',
  question_excerpt TEXT NOT NULL DEFAULT '',
  answer_excerpt TEXT NOT NULL DEFAULT '',
  error_excerpt TEXT NOT NULL DEFAULT '',
  resolved INTEGER NOT NULL DEFAULT 0,
  owner_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_qa_observations_time ON qa_observations(created_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_qa_observations_kind_time ON qa_observations(kind,created_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_qa_observations_unresolved ON qa_observations(resolved,http_status,created_at DESC)').run();
}

async function fingerprint(request){
 const seed=[request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'',request.headers.get('user-agent')||'',request.headers.get('accept-language')||''].join('|');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(seed||crypto.randomUUID()));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32);
}
function sourceUrl(value){
 const raw=String(value||'').trim();if(!raw)return'';
 try{const u=new URL(raw);return ['http:','https:'].includes(u.protocol)?u.toString().slice(0,1200):''}catch{return''}
}

async function publicTeachingSubmission(request,env){
 await ensureBranchSchema(env);
 const body=await request.json().catch(()=>({}));
 if(String(body.website||'').trim())return json({ok:true,status:'pending'},202);
 const agentId=String(body.agent_id||'').trim().toLowerCase();
 if(!/^[a-z0-9-]{1,64}$/.test(agentId))return json({detail:'Choose a valid specialist branch.'},400);
 const lesson=cleanText(body.content,30000),challenge=cleanText(body.challenge_prompt,10000),expected=cleanText(body.expected_outcome,10000),url=sourceUrl(body.url);
 if(!lesson&&!challenge&&!url)return json({detail:'Add a proposed lesson, public source URL, or QA challenge before submitting.'},400);
 if(challenge&&!expected)return json({detail:'Add the expected strong outcome for every QA challenge so the answer can be evaluated against a clear target.'},400);
 const fp=await fingerprint(request),submittedBy=`public:${fp}`,ts=now();
 const recent=await env.DB.prepare('SELECT COUNT(*) AS total FROM agent_branch_training_submissions WHERE submitted_by=? AND created_at>=?').bind(submittedBy,ts-3600).first();
 if(Number(recent?.total||0)>=6)return json({detail:'Public teaching limit reached for this hour. Please try again later.'},429);
 const title=cleanText(body.title,180)||'Public QA training proposal';
 const tags=Array.isArray(body.tags)?body.tags.map(x=>cleanText(x,60)).filter(Boolean).slice(0,20).join(', '):cleanText(body.tags,500);
 const content=[lesson,url?`PUBLIC SOURCE URL FOR OWNER REVIEW\n${url}`:''].filter(Boolean).join('\n\n');
 const result=await env.DB.prepare('INSERT INTO agent_branch_training_submissions(tenant_id,agent_id,title,content,tags,source,challenge_prompt,expected_outcome,submitted_by,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind('__public__',agentId,title,content,tags,'public-qa',challenge,expected,submittedBy,'pending',ts).run();
 return json({ok:true,id:result?.meta?.last_row_id||null,agent_id:agentId,status:'pending',requires_quality_review:true,automatic_qa_review:true,owner_oversight_if_held:true,public_contribution:true,message:'Thank you. Your teaching entered automatic QA review. Only high-confidence, safe, self-contained teaching can be applied automatically; uncertain material stays held for platform-owner oversight.'},201);
}

export async function captureQaObservationRequest(request){
 const url=new URL(request.url),path=url.pathname;
 if(!isQaPath(path))return {path,method:request.method,qa:false,agent_id:'',question_excerpt:''};
 let body={};
 if(!['GET','HEAD'].includes(request.method)&&String(request.headers.get('content-type')||'').toLowerCase().includes('json'))body=await request.clone().json().catch(()=>({}));
 return {path,method:request.method,qa:true,agent_id:cleanText(body.agent_id,120),question_excerpt:cleanText(body.message||body.question||body.prompt,1800)};
}

async function userForObservation(request,env,knownUser){
 if(knownUser)return knownUser;
 try{return await currentUser(request,env)}catch{return null}
}

export async function recordQaObservation(env,request,response,{startedAt=Date.now(),capture=null,user=null}={}){
 if(!env?.DB||!response)return;
 const url=new URL(request.url),path=url.pathname,qa=Boolean(capture?.qa)||isQaPath(path),failed=response.status>=400;
 if(!qa&&!failed)return;
 try{
  await ensureQaObservationSchema(env);
  const actor=await userForObservation(request,env,user);
  let data={};
  const type=String(response.headers.get('content-type')||'').toLowerCase();
  if(type.includes('json'))data=await response.clone().json().catch(()=>({}));
  const answer=cleanText(data?.output||data?.answer||data?.result||'',2400);
  const qualityIssue=qaQualityIssue({qa,failed,answer});
  const error=failed?cleanText(data?.detail||data?.error||data?.message||`HTTP ${response.status}`,1800):cleanText(qualityIssue,1800);
  const kind=qa?(failed?'qa-error':qualityIssue?'qa-quality':'qa-turn'):'api-error',ts=now();
  await env.DB.prepare('INSERT INTO qa_observations(tenant_id,user_id,kind,path,method,http_status,duration_ms,agent_id,question_excerpt,answer_excerpt,error_excerpt,resolved,owner_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(String(actor?.tenant_id||''),String(actor?.id||''),kind,path,request.method,Number(response.status||0),Math.max(0,Date.now()-startedAt),String(capture?.agent_id||''),String(capture?.question_excerpt||''),answer,error,0,'',ts,ts).run();
 }catch(error){console.error('QA observation write failed',error)}
}

export async function recordQaException(env,request,error,{startedAt=Date.now(),capture=null,user=null}={}){
 if(!env?.DB)return;
 const url=new URL(request.url),path=url.pathname,qa=Boolean(capture?.qa)||isQaPath(path);
 try{
  await ensureQaObservationSchema(env);
  const actor=await userForObservation(request,env,user),ts=now();
  await env.DB.prepare('INSERT INTO qa_observations(tenant_id,user_id,kind,path,method,http_status,duration_ms,agent_id,question_excerpt,answer_excerpt,error_excerpt,resolved,owner_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(String(actor?.tenant_id||''),String(actor?.id||''),qa?'qa-error':'api-error',path,request.method,500,Math.max(0,Date.now()-startedAt),String(capture?.agent_id||''),String(capture?.question_excerpt||''),'',cleanText(error?.message||error||'Unhandled platform error',1800),0,'',ts,ts).run();
 }catch(writeError){console.error('QA exception observation write failed',writeError)}
}

async function ownerObservation(request,env){
 const user=await currentUser(request,env).catch(()=>null);
 if(!user||!await isPlatformOwnerUser(env,user))return json({detail:'Platform owner access is required.'},403);
 await ensureQaObservationSchema(env);
 const url=new URL(request.url),match=url.pathname.match(/^\/api\/owner\/qa-observation\/(\d+)$/);
 if(match&&request.method==='PATCH'){
  const body=await request.json().catch(()=>({})),id=Number(match[1]),resolved=body.resolved===true?1:body.resolved===false?0:null,note=body.owner_note===undefined?null:cleanText(body.owner_note,2400),qualityFlagged=body.quality_flagged===true?true:body.quality_flagged===false?false:null;
  const old=await env.DB.prepare('SELECT * FROM qa_observations WHERE id=? LIMIT 1').bind(id).first();if(!old)return json({detail:'Observation not found.'},404);
  let nextKind=String(old.kind||''),nextResolved=resolved===null?Number(old.resolved||0):resolved,nextNote=note===null?String(old.owner_note||''):note;
  if(Number(old.http_status||0)<400&&qualityFlagged===true){nextKind='qa-quality';nextResolved=0;if(!nextNote)nextNote='Owner flagged this successful response for answer-quality review.'}
  if(Number(old.http_status||0)<400&&qualityFlagged===false&&nextKind==='qa-quality'){nextKind='qa-turn';nextResolved=1}
  await env.DB.prepare('UPDATE qa_observations SET kind=?,resolved=?,owner_note=?,updated_at=? WHERE id=?').bind(nextKind,nextResolved,nextNote,now(),id).run();
  return json({ok:true,observation:await env.DB.prepare('SELECT * FROM qa_observations WHERE id=? LIMIT 1').bind(id).first()});
 }
 if(request.method!=='GET'||url.pathname!=='/api/owner/qa-observation')return json({detail:'Method not allowed.'},405);
 const filter=String(url.searchParams.get('filter')||'all').toLowerCase(),limit=int(url.searchParams.get('limit'),1,300,160),q=cleanText(url.searchParams.get('q'),160).toLowerCase();
 const where=[],bind=[];
 if(filter==='errors')where.push("(http_status>=400 OR kind='qa-quality')");
 else if(filter==='qa')where.push("kind IN ('qa-turn','qa-error','qa-quality')");
 else if(filter==='unresolved')where.push("(http_status>=400 OR kind='qa-quality') AND resolved=0");
 if(q){where.push('(LOWER(path) LIKE ? OR LOWER(agent_id) LIKE ? OR LOWER(question_excerpt) LIKE ? OR LOWER(answer_excerpt) LIKE ? OR LOWER(error_excerpt) LIKE ?)');const needle=`%${q}%`;bind.push(needle,needle,needle,needle,needle)}
 const sql=`SELECT id,tenant_id,user_id,kind,path,method,http_status,duration_ms,agent_id,question_excerpt,answer_excerpt,error_excerpt,resolved,owner_note,created_at,updated_at FROM qa_observations ${where.length?`WHERE ${where.join(' AND ')}`:''} ORDER BY created_at DESC,id DESC LIMIT ?`;bind.push(limit);
 const {results=[]}=await env.DB.prepare(sql).bind(...bind).all();
 const summary=await env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN kind IN ('qa-turn','qa-error','qa-quality') THEN 1 ELSE 0 END) qa_turns,SUM(CASE WHEN http_status>=400 THEN 1 ELSE 0 END) errors,SUM(CASE WHEN http_status>=400 AND resolved=0 THEN 1 ELSE 0 END) unresolved_errors,SUM(CASE WHEN kind='qa-quality' THEN 1 ELSE 0 END) quality_issues,SUM(CASE WHEN http_status>=400 OR kind='qa-quality' THEN 1 ELSE 0 END) issues,SUM(CASE WHEN (http_status>=400 OR kind='qa-quality') AND resolved=0 THEN 1 ELSE 0 END) unresolved_issues,SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END) last_24h FROM qa_observations").bind(now()-86400).first();
 return json({observations:results,summary:{total:Number(summary?.total||0),qa_turns:Number(summary?.qa_turns||0),errors:Number(summary?.errors||0),unresolved_errors:Number(summary?.unresolved_errors||0),quality_issues:Number(summary?.quality_issues||0),issues:Number(summary?.issues||0),unresolved_issues:Number(summary?.unresolved_issues||0),last_24h:Number(summary?.last_24h||0)},privacy:'Question and answer excerpts are truncated and scrubbed for common credentials, email addresses, phone numbers and long account/card-like numbers.',coverage:'Core Magnanimous chat and specialist chat are observed for transport errors plus obvious answer-quality failures such as empty output, malformed internal text, or private execution-provider leakage. The platform owner can also flag a successful turn for manual quality review. Downstream API failures are observed here; White Label keeps its separate privacy-safe outcome signals.'});
}

export async function handleQaObservationControl(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/agents/branch/submissions/public'&&request.method==='POST')return publicTeachingSubmission(request,env);
 if(url.pathname==='/api/owner/qa-observation'||url.pathname.startsWith('/api/owner/qa-observation/'))return ownerObservation(request,env);
 return null;
}
