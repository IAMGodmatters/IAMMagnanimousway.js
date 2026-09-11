import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clip=(v,n=8000)=>String(v??'').trim().slice(0,n);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)));
const DEFAULTS={enabled:1,minimum_samples:4,minimum_success_rate:0.75,minimum_quality:0.60,lookback_days:30};

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_training_settings (tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,minimum_samples INTEGER NOT NULL DEFAULT 4,minimum_success_rate REAL NOT NULL DEFAULT 0.75,minimum_quality REAL NOT NULL DEFAULT 0.60,lookback_days INTEGER NOT NULL DEFAULT 30,updated_at INTEGER NOT NULL,PRIMARY KEY(tenant_id,user_id))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_training_examples (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,domain TEXT NOT NULL DEFAULT 'general',prompt TEXT NOT NULL,ideal_response TEXT NOT NULL,lesson_key TEXT NOT NULL DEFAULT '',lesson_value TEXT NOT NULL DEFAULT '',approved INTEGER NOT NULL DEFAULT 1,source TEXT NOT NULL DEFAULT 'explicit-user',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_training_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL DEFAULT 'general',provider TEXT NOT NULL DEFAULT '',rating INTEGER NOT NULL DEFAULT 0,correction TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_learning_candidates (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,provider TEXT NOT NULL,samples INTEGER NOT NULL DEFAULT 0,success_rate REAL NOT NULL DEFAULT 0,average_quality REAL NOT NULL DEFAULT 0,average_latency_ms REAL NOT NULL DEFAULT 0,score REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'observing',last_evidence_at INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,capability,provider))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_training_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,source TEXT NOT NULL DEFAULT 'cron',started_at INTEGER NOT NULL,finished_at INTEGER,status TEXT NOT NULL DEFAULT 'running',outcome_groups_scanned INTEGER NOT NULL DEFAULT 0,candidates_promoted INTEGER NOT NULL DEFAULT 0,lessons_updated INTEGER NOT NULL DEFAULT 0,errors INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '')`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_lessons (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,domain TEXT NOT NULL DEFAULT 'general',lesson_key TEXT NOT NULL,lesson_value TEXT NOT NULL,evidence TEXT NOT NULL DEFAULT '',score REAL NOT NULL DEFAULT 0.5,uses INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,user_id,domain,lesson_key))`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_outcomes (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,provider TEXT NOT NULL DEFAULT 'native',task TEXT NOT NULL DEFAULT '',success INTEGER NOT NULL DEFAULT 0,quality REAL NOT NULL DEFAULT 0,cost_hint REAL NOT NULL DEFAULT 0,latency_ms INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL)`).run();
}

async function settingsFor(env,tenantId,userId){
 await ensureSchema(env);
 const row=await env.DB.prepare('SELECT enabled,minimum_samples,minimum_success_rate,minimum_quality,lookback_days,updated_at FROM magnanimous_training_settings WHERE tenant_id=? AND user_id=?').bind(tenantId,userId).first();
 return row?{...DEFAULTS,...row}:{...DEFAULTS,updated_at:0};
}

function rejectSecrets(...values){
 const text=values.join('\n');
 const patterns=[/\bsk-[A-Za-z0-9_-]{16,}\b/,/\bBearer\s+[A-Za-z0-9._-]{16,}/i,/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i,/\b(?:password|client_secret|api[_ -]?key)\s*[:=]\s*\S{8,}/i];
 if(patterns.some(p=>p.test(text)))throw Object.assign(new Error('Training examples must not contain passwords, API keys, access tokens, or private keys.'),{status:400});
}

async function upsertExplicitLesson(env,user,{domain,key,value,evidence='Explicit training example'}){
 if(!key||!value)return 0;
 const ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_lessons(tenant_id,user_id,domain,lesson_key,lesson_value,evidence,score,uses,active,created_at,updated_at) VALUES(?,?,?,?,?,?,1,0,1,?,?) ON CONFLICT(tenant_id,user_id,domain,lesson_key) DO UPDATE SET lesson_value=excluded.lesson_value,evidence=excluded.evidence,score=1,active=1,updated_at=excluded.updated_at`).bind(String(user.tenant_id),String(user.id),clip(domain||'explicit-training',80),clip(key,160),clip(value,8000),clip(evidence,3000),ts,ts).run();
 return 1;
}

export async function runContinuousLearningCycle(env,{source='cron'}={}){
 if(!env?.DB)return {ok:false,detail:'Database binding is unavailable.'};
 await ensureSchema(env);
 const started=now();
 const run=await env.DB.prepare(`INSERT INTO magnanimous_training_runs(source,started_at,status) VALUES(?,?,'running') RETURNING id`).bind(clip(source,40),started).first();
 const runId=Number(run?.id||0);
 let scanned=0,promoted=0,lessons=0,errors=0;
 const notes=[];
 try{
   const cutoff=started-(90*86400);
   const {results=[]}=await env.DB.prepare(`SELECT tenant_id,user_id,capability,provider,COUNT(*) samples,AVG(success) success_rate,AVG(quality) average_quality,AVG(latency_ms) average_latency_ms,MAX(created_at) last_evidence_at FROM magnanimous_outcomes WHERE created_at>=? GROUP BY tenant_id,user_id,capability,provider HAVING COUNT(*)>=2 ORDER BY tenant_id,user_id,capability,samples DESC LIMIT 1000`).bind(cutoff).all();
   scanned=results.length;
   const settingCache=new Map();
   const best=new Map();
   for(const row of results){
     try{
       const tenant=String(row.tenant_id),uid=String(row.user_id),capability=clip(row.capability,100),provider=clip(row.provider||'native',100);
       const sk=`${tenant}|${uid}`;
       let settings=settingCache.get(sk);if(!settings){settings=await settingsFor(env,tenant,uid);settingCache.set(sk,settings)}
       if(!Number(settings.enabled))continue;
       const recentCutoff=started-(clamp(settings.lookback_days,7,90)*86400);
       if(Number(row.last_evidence_at||0)<recentCutoff)continue;
       const samples=Number(row.samples||0),success=Number(row.success_rate||0),quality=Number(row.average_quality||0),latency=Number(row.average_latency_ms||0);
       const enough=samples>=clamp(settings.minimum_samples,2,100);
       const qualityPass=success>=clamp(settings.minimum_success_rate,0.5,1)&&quality>=clamp(settings.minimum_quality,0,1);
       const score=clamp((success*0.48)+(quality*0.42)+(Math.min(samples,20)/20*0.10),0,1);
       const status=enough&&qualityPass?'eligible':'observing';
       const ts=now();
       await env.DB.prepare(`INSERT INTO magnanimous_learning_candidates(tenant_id,user_id,capability,provider,samples,success_rate,average_quality,average_latency_ms,score,status,last_evidence_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id,capability,provider) DO UPDATE SET samples=excluded.samples,success_rate=excluded.success_rate,average_quality=excluded.average_quality,average_latency_ms=excluded.average_latency_ms,score=excluded.score,status=excluded.status,last_evidence_at=excluded.last_evidence_at,updated_at=excluded.updated_at`).bind(tenant,uid,capability,provider,samples,success,quality,latency,score,status,Number(row.last_evidence_at||0),ts,ts).run();
       if(status==='eligible'){
         const bk=`${tenant}|${uid}|${capability}`;const prior=best.get(bk);
         if(!prior||score>prior.score)best.set(bk,{tenant,uid,capability,provider,samples,success,quality,latency,score});
       }
     }catch(e){errors++;notes.push(clip(e?.message||e,180));}
   }
   for(const item of best.values()){
     try{
       const ts=now();
       const evidence=`${item.samples} outcomes; success ${(item.success*100).toFixed(1)}%; avg quality ${item.quality.toFixed(2)}; avg latency ${Math.round(item.latency)} ms`;
       const value=`For ${item.capability}, ${item.provider} is currently the strongest observed provider/workflow from recent private workspace outcomes. Prefer it when available, but keep fallback routing and re-evaluate as new evidence arrives.`;
       await env.DB.prepare(`INSERT INTO magnanimous_lessons(tenant_id,user_id,domain,lesson_key,lesson_value,evidence,score,uses,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,0,1,?,?) ON CONFLICT(tenant_id,user_id,domain,lesson_key) DO UPDATE SET lesson_value=excluded.lesson_value,evidence=excluded.evidence,score=excluded.score,active=1,updated_at=excluded.updated_at`).bind(item.tenant,item.uid,'adaptive-routing',`preferred-provider:${item.capability}`,value,evidence,item.score,ts,ts).run();
       await env.DB.prepare(`UPDATE magnanimous_learning_candidates SET status='promoted',updated_at=? WHERE tenant_id=? AND user_id=? AND capability=? AND provider=?`).bind(ts,item.tenant,item.uid,item.capability,item.provider).run();
       promoted++;lessons++;
     }catch(e){errors++;notes.push(clip(e?.message||e,180));}
   }
   if(runId)await env.DB.prepare(`UPDATE magnanimous_training_runs SET finished_at=?,status=?,outcome_groups_scanned=?,candidates_promoted=?,lessons_updated=?,errors=?,notes=? WHERE id=?`).bind(now(),errors?'completed_with_errors':'completed',scanned,promoted,lessons,errors,clip(notes.join(' | '),2000),runId).run();
   return {ok:errors===0,run_id:runId,source,scanned,promoted,lessons_updated:lessons,errors};
 }catch(e){
   if(runId)await env.DB.prepare(`UPDATE magnanimous_training_runs SET finished_at=?,status='failed',outcome_groups_scanned=?,candidates_promoted=?,lessons_updated=?,errors=?,notes=? WHERE id=?`).bind(now(),scanned,promoted,lessons,errors+1,clip(e?.message||e,2000),runId).run();
   return {ok:false,run_id:runId,source,scanned,promoted,lessons_updated:lessons,errors:errors+1,detail:clip(e?.message||e,1000)};
 }
}

async function status(env,user){
 await ensureSchema(env);const tenant=String(user.tenant_id),uid=String(user.id),settings=await settingsFor(env,tenant,uid);
 const counts=await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM magnanimous_training_examples WHERE tenant_id=? AND user_id=? AND approved=1) examples,(SELECT COUNT(*) FROM magnanimous_learning_candidates WHERE tenant_id=? AND user_id=?) candidates,(SELECT COUNT(*) FROM magnanimous_learning_candidates WHERE tenant_id=? AND user_id=? AND status='promoted') promoted,(SELECT COUNT(*) FROM magnanimous_lessons WHERE tenant_id=? AND user_id=? AND domain IN ('adaptive-routing','explicit-training')) learned_lessons`).bind(tenant,uid,tenant,uid,tenant,uid,tenant,uid).first();
 const {results:runs=[]}=await env.DB.prepare('SELECT id,source,started_at,finished_at,status,outcome_groups_scanned,candidates_promoted,lessons_updated,errors FROM magnanimous_training_runs ORDER BY started_at DESC LIMIT 10').all();
 const {results:candidates=[]}=await env.DB.prepare(`SELECT capability,provider,samples,success_rate,average_quality,average_latency_ms,score,status,updated_at FROM magnanimous_learning_candidates WHERE tenant_id=? AND user_id=? ORDER BY score DESC,updated_at DESC LIMIT 25`).bind(tenant,uid).all();
 return {ok:true,mode:'continuous-learning',schedule:'every 15 minutes',foundation_model_retraining:false,learning_layers:['explicit training examples','persistent lessons','provider/workflow outcome scoring','adaptive routing','private knowledge retrieval'],settings,counts:{examples:Number(counts?.examples||0),candidates:Number(counts?.candidates||0),promoted:Number(counts?.promoted||0),learned_lessons:Number(counts?.learned_lessons||0)},recent_runs:runs,candidates};
}

async function teach(request,env,user){
 await ensureSchema(env);const b=await request.json().catch(()=>({}));
 const domain=clip(b.domain||'general',80),prompt=clip(b.prompt,12000),ideal=clip(b.ideal_response,16000),key=clip(b.lesson_key,160),value=clip(b.lesson_value,8000);
 if(!prompt||!ideal)return json({detail:'Prompt and ideal_response are required.'},400);
 rejectSecrets(prompt,ideal,key,value);
 const ts=now();const row=await env.DB.prepare(`INSERT INTO magnanimous_training_examples(tenant_id,user_id,domain,prompt,ideal_response,lesson_key,lesson_value,approved,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,1,'explicit-user',?,?) RETURNING id`).bind(String(user.tenant_id),String(user.id),domain,prompt,ideal,key,value,ts,ts).first();
 const lesson_updated=await upsertExplicitLesson(env,user,{domain:'explicit-training',key,value,evidence:`Training example ${row?.id||''}`});
 return json({ok:true,id:Number(row?.id||0),approved:true,lesson_updated:Boolean(lesson_updated)});
}

async function feedback(request,env,user){
 await ensureSchema(env);const b=await request.json().catch(()=>({}));
 const rawRating=Number(b.rating);if(!Number.isFinite(rawRating)||rawRating<1||rawRating>5)return json({detail:'Rating must be a number from 1 to 5.'},400);
 const rating=Math.round(rawRating),capability=clip(b.capability||'general',100),provider=clip(b.provider,100),correction=clip(b.correction,8000),notes=clip(b.notes,2000);rejectSecrets(correction,notes);
 const ts=now();
 await env.DB.prepare(`INSERT INTO magnanimous_training_feedback(tenant_id,user_id,capability,provider,rating,correction,notes,created_at) VALUES(?,?,?,?,?,?,?,?)`).bind(String(user.tenant_id),String(user.id),capability,provider,rating,correction,notes,ts).run();
 if(provider){
   const quality=(rating-1)/4;
   await env.DB.prepare(`INSERT INTO magnanimous_outcomes(tenant_id,user_id,capability,provider,task,success,quality,cost_hint,latency_ms,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(String(user.tenant_id),String(user.id),capability,provider,'Explicit user feedback',rating>=4?1:0,quality,0,0,clip(notes||correction,1200),ts).run();
 }
 let lesson_updated=0;
 if(correction)lesson_updated=await upsertExplicitLesson(env,user,{domain:'explicit-training',key:`feedback-correction:${capability}:${ts}`,value:correction,evidence:`Explicit ${rating}/5 user correction`});
 return json({ok:true,rating,stored:true,lesson_updated:Boolean(lesson_updated),note:'Feedback improves this private workspace learning signal. It is not used to retrain a public foundation model.'});
}

async function updateSettings(request,env,user){
 const b=await request.json().catch(()=>({}));const tenant=String(user.tenant_id),uid=String(user.id),current=await settingsFor(env,tenant,uid),ts=now();
 const next={enabled:b.enabled===undefined?Number(current.enabled):b.enabled?1:0,minimum_samples:Math.round(clamp(b.minimum_samples??current.minimum_samples,2,100)),minimum_success_rate:clamp(b.minimum_success_rate??current.minimum_success_rate,0.5,1),minimum_quality:clamp(b.minimum_quality??current.minimum_quality,0,1),lookback_days:Math.round(clamp(b.lookback_days??current.lookback_days,7,90))};
 await env.DB.prepare(`INSERT INTO magnanimous_training_settings(tenant_id,user_id,enabled,minimum_samples,minimum_success_rate,minimum_quality,lookback_days,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id) DO UPDATE SET enabled=excluded.enabled,minimum_samples=excluded.minimum_samples,minimum_success_rate=excluded.minimum_success_rate,minimum_quality=excluded.minimum_quality,lookback_days=excluded.lookback_days,updated_at=excluded.updated_at`).bind(tenant,uid,next.enabled,next.minimum_samples,next.minimum_success_rate,next.minimum_quality,next.lookback_days,ts).run();
 return json({ok:true,settings:{...next,updated_at:ts}});
}

async function exportExamples(env,user){
 const {results=[]}=await env.DB.prepare(`SELECT domain,prompt,ideal_response FROM magnanimous_training_examples WHERE tenant_id=? AND user_id=? AND approved=1 ORDER BY id ASC LIMIT 5000`).bind(String(user.tenant_id),String(user.id)).all();
 const lines=results.map(r=>JSON.stringify({messages:[{role:'system',content:`You are Magnanimous AI. Follow the platform safety, permission and truthfulness rules. Training domain: ${String(r.domain||'general')}.`},{role:'user',content:String(r.prompt)},{role:'assistant',content:String(r.ideal_response)}]}));
 return new Response(lines.join('\n')+(lines.length?'\n':''),{headers:{'content-type':'application/x-ndjson; charset=utf-8','content-disposition':'attachment; filename="magnanimous-training.jsonl"','cache-control':'no-store'}});
}

export async function handleContinuousLearning(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/magnanimous/training'))return null;
 if(!env?.DB)return json({detail:'Database binding is unavailable.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Authentication required.'},401);
 try{
   if(url.pathname==='/api/magnanimous/training/status'&&request.method==='GET')return json(await status(env,user));
   if(url.pathname==='/api/magnanimous/training/settings'&&request.method==='GET')return json({ok:true,settings:await settingsFor(env,String(user.tenant_id),String(user.id))});
   if(url.pathname==='/api/magnanimous/training/settings'&&request.method==='POST')return updateSettings(request,env,user);
   if(url.pathname==='/api/magnanimous/training/teach'&&request.method==='POST')return teach(request,env,user);
   if(url.pathname==='/api/magnanimous/training/feedback'&&request.method==='POST')return feedback(request,env,user);
   if(url.pathname==='/api/magnanimous/training/export'&&request.method==='GET')return exportExamples(env,user);
   if(url.pathname==='/api/magnanimous/training/run'&&request.method==='POST'){
     if(String(user.role)!=='owner')return json({detail:'Owner access required.'},403);
     return json(await runContinuousLearningCycle(env,{source:'owner-manual'}));
   }
   return json({detail:'Training route not found.'},404);
 }catch(e){return json({detail:e?.message||'Continuous-learning request failed.'},Number(e?.status)||400)}
}
