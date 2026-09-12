import {currentUser} from './integrations.js';
import {isPlatformOwnerUser} from './agent-branch-intelligence.js';

const now=()=>Math.floor(Date.now()/1000);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(v,n=8000)=>String(v??'').trim().slice(0,n);
const APPS=new Set(['funnel','branded-ai','client-apps','booking','reputation','automations','inbox','crm','receptionist','video-agents','work-engine','rebilling','platform']);
const SECRET_PATTERNS=[/\bsk-[A-Za-z0-9_-]{16,}\b/,/\bBearer\s+[A-Za-z0-9._-]{16,}/i,/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i,/\b(?:password|client_secret|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S{8,}/i];

function appId(v){const id=clip(v||'platform',60).toLowerCase().replace(/[^a-z0-9-]+/g,'-');return APPS.has(id)?id:'platform'}
function redactPii(v){return clip(v,12000).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email removed]').replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,'[phone removed]')}
function rejectSecrets(v){if(SECRET_PATTERNS.some(re=>re.test(String(v||''))))throw Object.assign(new Error('Do not teach Magnanimous passwords, API keys, access tokens, or private keys.'),{status:400})}

async function ensure(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_brain_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  lesson_key TEXT NOT NULL,
  lesson_value TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  score REAL NOT NULL DEFAULT 0.75,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id,user_id,client_id,app,lesson_key)
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_brain_memory ON white_label_brain_memory(tenant_id,user_id,client_id,app,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS white_label_brain_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL DEFAULT '',
  app TEXT NOT NULL DEFAULT 'platform',
  event_type TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  success INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_white_label_brain_signals ON white_label_brain_signals(tenant_id,user_id,app,created_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS magnanimous_outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,capability TEXT NOT NULL,provider TEXT NOT NULL DEFAULT 'native',task TEXT NOT NULL DEFAULT '',success INTEGER NOT NULL DEFAULT 0,quality REAL NOT NULL DEFAULT 0,cost_hint REAL NOT NULL DEFAULT 0,latency_ms INTEGER NOT NULL DEFAULT 0,notes TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL
 )`).run();
}

async function agencyPlan(env,user){
 if(!env?.DB||!user)return'';
 try{
  const active=await env.DB.prepare("SELECT plan FROM billing_subscriptions WHERE tenant_id=? AND status IN ('active','trialing') LIMIT 1").bind(String(user.tenant_id)).first();
  let plan=String(active?.plan||'').toLowerCase();
  if(!plan){const tenant=await env.DB.prepare('SELECT plan FROM tenants WHERE id=? LIMIT 1').bind(String(user.tenant_id)).first();plan=String(tenant?.plan||'').toLowerCase()}
  return plan==='agency'||plan==='agency_pro'?plan:'';
 }catch{return''}
}

async function clientContext(env,user,clientId){
 const id=clip(clientId,80);if(!id)return{ok:true,id:'',text:'No client selected. Work at the agency workspace level.'};
 const row=await env.DB.prepare(`SELECT c.id,c.name,c.industry,c.status,s.brand_name,s.accent_color,s.white_label_enabled
 FROM bpo_clients c LEFT JOIN agency_client_settings s ON s.tenant_id=c.tenant_id AND s.client_id=c.id
 WHERE c.id=? AND c.tenant_id=? LIMIT 1`).bind(id,String(user.tenant_id)).first();
 if(!row)return{ok:false,detail:'That client does not belong to this White Label workspace.'};
 return{ok:true,id,text:`Client: ${clip(row.name,160)}. Industry: ${clip(row.industry||'not set',120)}. Brand: ${clip(row.brand_name||row.name,160)}. White Label: ${Number(row.white_label_enabled||0)?'enabled':'not enabled yet'}.`};
}

async function memoryFor(env,user,{clientId='',app='platform',limit=18}={}){
 await ensure(env);const id=clip(clientId,80),a=appId(app);
 const {results=[]}=await env.DB.prepare(`SELECT lesson_key,lesson_value,evidence,score,updated_at FROM white_label_brain_memory
 WHERE tenant_id=? AND user_id=? AND (client_id=? OR client_id='') AND (app=? OR app='platform')
 ORDER BY CASE WHEN client_id=? THEN 0 ELSE 1 END,CASE WHEN app=? THEN 0 ELSE 1 END,score DESC,updated_at DESC LIMIT ?`)
 .bind(String(user.tenant_id),String(user.id),id,a,id,a,Math.max(1,Math.min(40,Number(limit)||18))).all();
 return results;
}

async function addSignal(env,user,{clientId='',app='platform',eventType='action',route='',success=false,httpStatus=0,quality}={}){
 await ensure(env);const a=appId(app),ts=now(),ok=success?1:0,status=Math.max(0,Number(httpStatus||0));
 await env.DB.prepare('INSERT INTO white_label_brain_signals(tenant_id,user_id,client_id,app,event_type,route,success,http_status,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
 .bind(String(user.tenant_id),String(user.id),clip(clientId,80),a,clip(eventType,100),clip(route,240),ok,status,ts).run();
 const q=quality===undefined?(ok?0.78:0.20):Math.max(0,Math.min(1,Number(quality)||0));
 await env.DB.prepare('INSERT INTO magnanimous_outcomes(tenant_id,user_id,capability,provider,task,success,quality,cost_hint,latency_ms,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
 .bind(String(user.tenant_id),String(user.id),`white-label:${a}`,'native-white-label',clip(`${eventType} ${route}`,500),ok,q,0,0,`Privacy-safe White Label outcome; client content was not copied into the learning signal. HTTP ${status||'n/a'}.`,ts).run();
}

function inferApp(path){
 const p=String(path||'').toLowerCase();
 if(p.includes('/funnels'))return'funnel';if(p.includes('/bookings'))return'booking';if(p.includes('/reputation')||p.includes('/reviews'))return'reputation';if(p.includes('/automations'))return'automations';if(p.includes('/inbox'))return'inbox';if(p.includes('/crm'))return'crm';if(p.includes('/voice-agent')||p.includes('/contact-center')||p.includes('/phone'))return'receptionist';if(p.includes('/video-agents')||p.includes('/video'))return'video-agents';if(p.includes('/work-engine'))return'work-engine';if(p.includes('/usage')||p.includes('/rebill'))return'rebilling';if(p.includes('/bpo')||p.includes('/clients'))return'client-apps';if(p.includes('/chat')||p.includes('/agents')||p.includes('/magnanimous'))return'branded-ai';return'platform';
}

export function shouldObserveWhiteLabelPath(path){
 const p=String(path||'');if(!p.startsWith('/api/'))return false;
 const blocked=['/api/auth','/api/billing','/api/admin','/api/bootstrap','/api/support','/api/integrations/platform-credentials','/api/white-label/brain','/api/magnanimous/learn','/api/magnanimous/outcome','/api/magnanimous/memory'];
 if(blocked.some(x=>p.startsWith(x)))return false;
 const relevant=['/api/agency','/api/inbox','/api/crm','/api/bpo','/api/work-engine','/api/voice-agent','/api/contact-center','/api/phone','/api/video-agents','/api/social-connect','/api/assistant-integrations','/api/knowledge','/api/agents','/api/chat','/api/magnanimous/tools','/api/professional'];
 return relevant.some(x=>p.startsWith(x));
}

export async function recordWhiteLabelAction(env,user,{path='',method='POST',payload={},responseStatus=0,durationMs=0}={}){
 if(!user||!await agencyPlan(env,user))return false;
 const clientId=clip(payload?.client_id||payload?.clientId||'',80),app=inferApp(path),success=Number(responseStatus)>=200&&Number(responseStatus)<400;
 await addSignal(env,user,{clientId,app,eventType:`action.${String(method||'POST').toLowerCase()}`,route:path,success,httpStatus:responseStatus,quality:success?Math.max(.62,Math.min(.92,1-(Number(durationMs||0)/120000))):.15});
 return true;
}

async function status(env,user,plan){
 await ensure(env);const tenant=String(user.tenant_id),uid=String(user.id);
 const counts=await env.DB.prepare(`SELECT
  (SELECT COUNT(*) FROM white_label_brain_memory WHERE tenant_id=? AND user_id=?) memory_count,
  (SELECT COUNT(*) FROM white_label_brain_signals WHERE tenant_id=? AND user_id=?) signal_count,
  (SELECT COUNT(*) FROM white_label_brain_signals WHERE tenant_id=? AND user_id=? AND success=1) successful_signals`).bind(tenant,uid,tenant,uid,tenant,uid).first();
 return{ok:true,brain:'Magnanimous AI',role:'shared brain for every White Label app',plan,access:true,client_isolation:true,workspace_learning:true,automatic_outcome_learning:true,global_learning_owner_review_required:true,memory_count:Number(counts?.memory_count||0),signal_count:Number(counts?.signal_count||0),successful_signals:Number(counts?.successful_signals||0),learning_note:'Magnanimous learns White Label patterns inside this tenant and client context. Raw client content is not promoted across customers.'};
}

async function assist(request,env,ctx,downstream,user,plan){
 const b=await request.json().catch(()=>({})),app=appId(b.app),goal=clip(b.goal,12000),context=clip(b.context,12000);if(!goal)return json({detail:'Tell Magnanimous what you want help with.'},400);
 const client=await clientContext(env,user,b.client_id);if(!client.ok)return json({detail:client.detail},404);
 const memory=await memoryFor(env,user,{clientId:client.id,app,limit:18});
 const learned=memory.map((x,i)=>`${i+1}. ${clip(x.lesson_key,160)}: ${clip(x.lesson_value,1500)}`).join('\n')||'(No client-specific lessons saved yet.)';
 const simple=`You are Magnanimous AI, the central brain for this White Label business platform. You are helping inside the ${app} app. Make the answer so simple that a young child could follow the steps, while keeping business details accurate. Use short steps, plain words, and concrete field values when useful. Never expose outside model/provider names. Never mix another client's private information into this client. Never claim a connected account action happened unless an authorized tool result proves it. If the user is drafting something, give ready-to-paste copy. If the user is configuring something, give the exact values and the next button to press.\n\nWHITE LABEL CLIENT CONTEXT\n${client.text}\n\nCLIENT/APP LESSONS MAGNANIMOUS HAS LEARNED\n${learned}\n\nCURRENT APP CONTEXT\n${context||'(none supplied)'}\n\nUSER GOAL\n${goal}`;
 const headers=new Headers(request.headers);headers.set('content-type','application/json');
 const forwarded=new Request(new URL('/api/chat',request.url).toString(),{method:'POST',headers,body:JSON.stringify({message:simple,provider:'auto',use_knowledge:true,live_search:false,news:false,specialist_routing:true})});
 const started=Date.now();const response=await downstream.fetch(forwarded,env,ctx);const data=await response.clone().json().catch(()=>({}));
 await addSignal(env,user,{clientId:client.id,app,eventType:'brain.assist',route:'/api/white-label/brain/assist',success:response.ok,httpStatus:response.status,quality:response.ok?.82:.15});
 if(!response.ok)return json({detail:data?.detail||'Magnanimous could not help with this White Label app.'},response.status);
 return json({ok:true,brain:'Magnanimous AI',role:'White Label central brain',plan,app,client_id:client.id||null,output:String(data?.output||data?.answer||'').trim(),learned_memory_count:memory.length,client_isolation:true,execution_provider_private:true});
}

async function learn(request,env,user){
 const b=await request.json().catch(()=>({})),app=appId(b.app),client=await clientContext(env,user,b.client_id);if(!client.ok)return json({detail:client.detail},404);
 const raw=clip(b.lesson,12000);if(!raw)return json({detail:'Add the lesson Magnanimous should remember.'},400);rejectSecrets(raw);
 const value=redactPii(raw);const key=clip(b.key||`approved-${app}-${now()}`,160),evidence=redactPii(b.evidence||'Explicit White Label workspace teaching'),score=Math.max(.5,Math.min(1,Number(b.score??.85))),ts=now();
 await ensure(env);await env.DB.prepare(`INSERT INTO white_label_brain_memory(tenant_id,user_id,client_id,app,lesson_key,lesson_value,evidence,score,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,user_id,client_id,app,lesson_key) DO UPDATE SET lesson_value=excluded.lesson_value,evidence=excluded.evidence,score=MAX(white_label_brain_memory.score,excluded.score),updated_at=excluded.updated_at`)
 .bind(String(user.tenant_id),String(user.id),client.id,app,key,value,clip(evidence,3000),score,ts,ts).run();
 await addSignal(env,user,{clientId:client.id,app,eventType:'brain.lesson-approved',route:'/api/white-label/brain/learn',success:true,httpStatus:201,quality:score});
 return json({ok:true,brain:'Magnanimous AI',app,client_id:client.id||null,key,score,scope:'tenant+client isolated',global:false},201);
}

async function feedback(request,env,user){
 const b=await request.json().catch(()=>({})),app=appId(b.app),client=await clientContext(env,user,b.client_id);if(!client.ok)return json({detail:client.detail},404);
 const helpful=b.helpful===true;await addSignal(env,user,{clientId:client.id,app,eventType:helpful?'brain.helpful':'brain.not-helpful',route:'/api/white-label/brain/feedback',success:helpful,httpStatus:200,quality:helpful?1:.1});
 return json({ok:true,learned_signal:true,helpful,scope:'private White Label workspace',raw_answer_stored:false});
}

async function insights(env,user){
 if(!await isPlatformOwnerUser(env,user))return json({detail:'Platform owner access required.'},403);await ensure(env);
 const cutoff=now()-30*86400;
 const {results=[]}=await env.DB.prepare(`SELECT app,COUNT(*) signals,SUM(success) successes,ROUND(AVG(success)*100,1) success_percent,MAX(created_at) last_signal_at FROM white_label_brain_signals WHERE created_at>=? GROUP BY app ORDER BY signals DESC`).bind(cutoff).all();
 const memory=await env.DB.prepare('SELECT COUNT(*) n FROM white_label_brain_memory').first();
 return json({ok:true,window_days:30,apps:results,private_memory_items:Number(memory?.n||0),raw_client_content_included:false,owner_review_required_before_global_promotion:true});
}

export async function handleWhiteLabelBrain(request,env,ctx,downstream){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/white-label/brain'))return null;if(!env?.DB)return json({detail:'White Label brain database is unavailable.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use the White Label brain.'},401);
 try{
  if(url.pathname==='/api/white-label/brain/insights'&&request.method==='GET')return insights(env,user);
  const plan=await agencyPlan(env,user);if(!plan)return json({detail:'An active White Label Agency plan is required.'},403);
  if(url.pathname==='/api/white-label/brain/status'&&request.method==='GET')return json(await status(env,user,plan));
  if(url.pathname==='/api/white-label/brain/assist'&&request.method==='POST')return assist(request,env,ctx,downstream,user,plan);
  if(url.pathname==='/api/white-label/brain/learn'&&request.method==='POST')return learn(request,env,user);
  if(url.pathname==='/api/white-label/brain/feedback'&&request.method==='POST')return feedback(request,env,user);
  return json({detail:'White Label brain route not found.'},404);
 }catch(e){return json({detail:e?.message||'White Label Magnanimous brain request failed.'},Number(e?.status)||500)}
}
