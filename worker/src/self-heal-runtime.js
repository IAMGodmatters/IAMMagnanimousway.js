import { currentUser } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
let schemaReady=false;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

export const SELF_HEAL_POLICY=Object.freeze({
 version:'2026-09-25.1',
 provider_failure_threshold:2,
 cooldown_seconds:{authorization:3600,'model-access':1800,capacity:600,timeout:300,'request-contract':600,unavailable:600},
 voice_retry_count:1,
 voice_safe_mode_seconds:900,
 event_retention_days:14,
 principle:'Repair and fail over automatically only inside bounded reversible contracts; never auto-spend, weaken security, or claim a repair passed without verification.'
});

async function ensureSchema(env){
 if(!env?.DB)return false;
 if(schemaReady)return true;
 try{
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_provider_health (
   provider TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'healthy',consecutive_failures INTEGER NOT NULL DEFAULT 0,
   last_failure_class TEXT NOT NULL DEFAULT '',cooldown_until INTEGER NOT NULL DEFAULT 0,last_failure_at INTEGER,
   last_success_at INTEGER,last_latency_ms INTEGER NOT NULL DEFAULT 0,last_model TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_self_heal_events (
   id INTEGER PRIMARY KEY AUTOINCREMENT,component TEXT NOT NULL,target TEXT NOT NULL DEFAULT '',
   action TEXT NOT NULL,status TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_self_heal_events_time ON magnanimous_self_heal_events(created_at DESC)').run();
  schemaReady=true;
  return true;
 }catch(error){console.error('self-heal schema unavailable',String(error?.message||error));return false}
}

function safeClass(value){
 const v=String(value||'unavailable').toLowerCase();
 return ['authorization','model-access','capacity','timeout','request-contract','unavailable'].includes(v)?v:'unavailable';
}
function cooldownFor(failureClass,failures){
 const cls=safeClass(failureClass);
 const immediate=['authorization','model-access','capacity'].includes(cls);
 if(!immediate&&Number(failures||0)<SELF_HEAL_POLICY.provider_failure_threshold)return 0;
 return Number(SELF_HEAL_POLICY.cooldown_seconds[cls]||600);
}
async function event(env,component,target,action,status,detail=''){
 if(!env?.DB)return;
 try{
  if(!await ensureSchema(env))return;
  await env.DB.prepare('INSERT INTO magnanimous_self_heal_events(component,target,action,status,detail,created_at) VALUES(?,?,?,?,?,?)')
   .bind(String(component).slice(0,60),String(target).slice(0,120),String(action).slice(0,80),String(status).slice(0,40),String(detail).slice(0,220),now()).run();
 }catch(error){console.error('self-heal event recording failed',String(error?.message||error))}
}

export async function filterHealthyProviders(env,providers=[]){
 if(!env?.DB||!providers.length)return providers;
 try{
  if(!await ensureSchema(env))return providers;
  const ids=providers.map(p=>String(p.id||'')).filter(Boolean);
  if(!ids.length)return providers;
  const placeholders=ids.map(()=>'?').join(',');
  const {results=[]}=await env.DB.prepare(`SELECT provider,cooldown_until FROM magnanimous_provider_health WHERE provider IN (${placeholders})`).bind(...ids).all();
  const cooling=new Set(results.filter(r=>Number(r.cooldown_until||0)>now()).map(r=>String(r.provider)));
  return providers.filter(p=>!cooling.has(String(p.id||'')));
 }catch(error){console.error('provider self-heal filter failed',String(error?.message||error));return providers}
}

export async function recordProviderSuccess(env,provider,{latencyMs=0,model=''}={}){
 if(!env?.DB||!provider)return;
 try{
  if(!await ensureSchema(env))return;
  const current=await env.DB.prepare('SELECT status,consecutive_failures,cooldown_until FROM magnanimous_provider_health WHERE provider=?').bind(String(provider)).first();
  if(!current)return;
  if(String(current.status||'')==='healthy'&&Number(current.consecutive_failures||0)===0&&Number(current.cooldown_until||0)===0)return;
  const ts=now();
  await env.DB.prepare(`UPDATE magnanimous_provider_health SET status='healthy',consecutive_failures=0,last_failure_class='',cooldown_until=0,last_success_at=?,last_latency_ms=?,last_model=?,updated_at=? WHERE provider=?`)
   .bind(ts,Math.max(0,Math.round(Number(latencyMs||0))),String(model||'').slice(0,160),ts,String(provider)).run();
  await event(env,'ai-provider',provider,'circuit-recovered','healthy','Provider succeeded after a degraded/cooldown state.');
 }catch(error){console.error('provider success self-heal write failed',String(error?.message||error))}
}

export async function recordProviderFailure(env,provider,{failureClass='unavailable',model=''}={}){
 if(!env?.DB||!provider)return;
 try{
  if(!await ensureSchema(env))return;
  const current=await env.DB.prepare('SELECT consecutive_failures FROM magnanimous_provider_health WHERE provider=?').bind(String(provider)).first();
  const failures=Number(current?.consecutive_failures||0)+1,cls=safeClass(failureClass),cooldown=cooldownFor(cls,failures),ts=now(),until=cooldown?ts+cooldown:0;
  await env.DB.prepare(`INSERT INTO magnanimous_provider_health(provider,status,consecutive_failures,last_failure_class,cooldown_until,last_failure_at,last_model,updated_at)
   VALUES(?,?,?,?,?,?,?,?)
   ON CONFLICT(provider) DO UPDATE SET status=excluded.status,consecutive_failures=excluded.consecutive_failures,last_failure_class=excluded.last_failure_class,cooldown_until=excluded.cooldown_until,last_failure_at=excluded.last_failure_at,last_model=excluded.last_model,updated_at=excluded.updated_at`)
   .bind(String(provider),cooldown?'cooldown':'degraded',failures,cls,until,ts,String(model||'').slice(0,160),ts).run();
  if(cooldown)await event(env,'ai-provider',provider,'circuit-open','repaired',`${cls} cooldown ${cooldown}s after ${failures} failure(s)`);
 }catch(error){console.error('provider failure self-heal write failed',String(error?.message||error))}
}

export async function recordVoiceIssue(env,user,{code='',platform='',stage='playback'}={}){
 if(!env?.DB||!user?.tenant_id)return;
 const safeCode=String(code||'unknown').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,50);
 const safePlatform=String(platform||'browser').replace(/[^a-zA-Z0-9 _./()-]/g,'').slice(0,100);
 await event(env,'voice-browser',safePlatform,'safe-retry-exhausted','attention',`${stage}:${safeCode}`);
}

export async function scheduledSelfHeal(env){
 if(!env?.DB)return{ok:false,reason:'database_unavailable'};
 if(!await ensureSchema(env))return{ok:false,reason:'schema_unavailable'};
 const ts=now(),retention=ts-SELF_HEAL_POLICY.event_retention_days*86400;
 try{
  const reopened=await env.DB.prepare("UPDATE magnanimous_provider_health SET status='healthy',consecutive_failures=0,last_failure_class='',cooldown_until=0,updated_at=? WHERE cooldown_until>0 AND cooldown_until<=?").bind(ts,ts).run();
  await env.DB.prepare('DELETE FROM magnanimous_self_heal_events WHERE created_at<?').bind(retention).run();
  return{ok:true,reopened:Number(reopened?.meta?.changes||0),checked_at:ts};
 }catch(error){console.error('scheduled self-heal failed',String(error?.message||error));return{ok:false,reason:'maintenance_failed'}}
}

async function owner(request,env){
 try{const user=await currentUser(request,env);return user&&['owner','admin'].includes(String(user.role||'').toLowerCase())?user:null}catch{return null}
}

export async function handleSelfHeal(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/self-heal'))return null;
 if(url.pathname==='/api/self-heal/voice'&&request.method==='POST'){
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return new Response(null,{status:204});
  const body=await request.json().catch(()=>({}));
  await recordVoiceIssue(env,user,{code:body.code,platform:body.platform,stage:body.stage});
  return json({ok:true,stored:'sanitized-telemetry-only'});
 }
 const user=await owner(request,env);
 if(!user)return json({detail:'Owner access required.'},403);
 if(url.pathname==='/api/self-heal/status'&&request.method==='GET'){
  await ensureSchema(env);
  const {results:providers=[]}=await env.DB.prepare('SELECT provider,status,consecutive_failures,last_failure_class,cooldown_until,last_failure_at,last_success_at,last_latency_ms,last_model,updated_at FROM magnanimous_provider_health ORDER BY provider').all();
  const {results:events=[]}=await env.DB.prepare('SELECT component,target,action,status,detail,created_at FROM magnanimous_self_heal_events ORDER BY id DESC LIMIT 50').all();
  return json({ok:true,policy:SELF_HEAL_POLICY,providers,events});
 }
 return json({detail:'Self-heal endpoint not found.'},404);
}
