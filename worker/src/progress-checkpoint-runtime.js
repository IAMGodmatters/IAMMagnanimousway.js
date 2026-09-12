const now=()=>Math.floor(Date.now()/1000);
const clip=(value,n=30000)=>String(value??'').slice(0,n);

const REDACTIONS=[
 [/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,'Bearer [REDACTED]'],
 [/(password|passwd|passcode|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi,'$1=[REDACTED]'],
 [/\b(?:\d[ -]*?){13,19}\b/g,'[REDACTED-PAYMENT-NUMBER]'],
 [/(cvv|cvc|security[_ -]?code)\s*[:=]\s*\d{3,4}/gi,'$1=[REDACTED]']
];

export function sanitizeProgressText(value,limit=30000){
 let text=clip(value,limit);
 for(const[pattern,replacement]of REDACTIONS)text=text.replace(pattern,replacement);
 return text;
}

export async function ensureProgressSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_progress_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_key TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'platform',
  kind TEXT NOT NULL DEFAULT 'progress',
  stage TEXT NOT NULL DEFAULT 'working',
  content TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'saved',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_progress_user ON magnanimous_progress_checkpoints(tenant_id,user_id,updated_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_magnanimous_progress_session ON magnanimous_progress_checkpoints(tenant_id,user_id,session_key,updated_at DESC)').run();
}

function safeMetadata(metadata={}){
 const out={};
 for(const[key,value]of Object.entries(metadata||{})){
  if(/password|passwd|passcode|secret|token|authorization|cookie|card|cvv|cvc/i.test(key))continue;
  if(value==null||['string','number','boolean'].includes(typeof value))out[key]=typeof value==='string'?sanitizeProgressText(value,1000):value;
 }
 return out;
}

export async function checkpointProgress(env,user,{sessionKey='',scope='platform',kind='progress',stage='working',content='',metadata={},status='saved'}={}){
 if(!env?.DB||!user)return null;
 await ensureProgressSchema(env);
 const ts=now();
 const result=await env.DB.prepare('INSERT INTO magnanimous_progress_checkpoints(tenant_id,user_id,session_key,scope,kind,stage,content,metadata,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
  .bind(String(user.tenant_id||''),String(user.id||''),clip(sessionKey,180),clip(scope,80),clip(kind,80),clip(stage,80),sanitizeProgressText(content),JSON.stringify(safeMetadata(metadata)).slice(0,6000),clip(status,40),ts,ts).run();
 return result?.meta?.last_row_id||null;
}

export async function listProgressCheckpoints(env,user,{sessionKey='',limit=120}={}){
 if(!env?.DB||!user)return[];
 await ensureProgressSchema(env);
 const cap=Math.max(1,Math.min(300,Number(limit)||120));
 const query=sessionKey
  ? env.DB.prepare('SELECT id,session_key,scope,kind,stage,content,metadata,status,created_at,updated_at FROM magnanimous_progress_checkpoints WHERE tenant_id=? AND user_id=? AND session_key=? ORDER BY id DESC LIMIT ?').bind(String(user.tenant_id),String(user.id),String(sessionKey),cap)
  : env.DB.prepare('SELECT id,session_key,scope,kind,stage,content,metadata,status,created_at,updated_at FROM magnanimous_progress_checkpoints WHERE tenant_id=? AND user_id=? ORDER BY id DESC LIMIT ?').bind(String(user.tenant_id),String(user.id),cap);
 const{results=[]}=await query.all();
 return results.map(row=>({...row,metadata:(()=>{try{return JSON.parse(String(row.metadata||'{}'))}catch{return{}}})()}));
}

export function progressContentFromPayload(payload={}){
 const candidates=[payload.message,payload.prompt,payload.content,payload.text,payload.query,payload.task,payload.title,payload.challenge_prompt,payload.expected_outcome,payload.action];
 return sanitizeProgressText(candidates.filter(v=>typeof v==='string'&&v.trim()).join('\n\n'),30000);
}

export function progressContentFromResponse(payload={}){
 const candidates=[payload.output,payload.answer,payload.result,payload.detail,payload.message,payload.status_text];
 return sanitizeProgressText(candidates.filter(v=>typeof v==='string'&&v.trim()).join('\n\n'),30000);
}

export function progressSessionKey(path,payload={}){
 return clip(payload.session_key||payload.session_id||payload.conversation_id||payload.thread_id||payload.agent_id||path,180);
}

export function isSensitiveProgressPath(path=''){
 return /\/(?:auth|login|signup|billing|payment|checkout|credentials|secrets?|oauth|webhooks?)(?:\/|$)/i.test(String(path));
}
