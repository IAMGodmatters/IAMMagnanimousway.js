import { currentUserFromRequest, tenantPlan, canUsePremium, recordUsage } from './usage-guard.js';
import { getKnowledgeContext } from './knowledge-runtime.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const ACTIVE=new Set(['active']);

async function ensureSchema(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_projects(
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  intake_json TEXT NOT NULL DEFAULT '{}', work_json TEXT NOT NULL DEFAULT '{}',
  preview_text TEXT NOT NULL DEFAULT '', final_text TEXT NOT NULL DEFAULT '',
  sources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'drafting',
  paid INTEGER NOT NULL DEFAULT 0, stripe_session_id TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_provider_usage(
  id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
  project_id TEXT NOT NULL, phase TEXT NOT NULL, provider TEXT NOT NULL, model TEXT NOT NULL,
  estimated_cost_usd REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_bp_provider_usage_project ON business_plan_provider_usage(project_id,created_at DESC)').run();
}

function intakeText(intake){
 const clean={};
 for(const [key,value] of Object.entries(intake||{})){
  const text=String(value??'').trim();
  if(text)clean[key]=text.slice(0,5000);
 }
 return JSON.stringify(clean,null,2);
}
function extractText(result){
 if(!result)return'';
 if(typeof result==='string')return result;
 if(typeof result.response==='string')return result.response;
 if(typeof result.result?.response==='string')return result.result.response;
 if(typeof result.result==='string')return result.result;
 if(Array.isArray(result.choices))return result.choices.map(x=>x?.message?.content||x?.text||'').filter(Boolean).join('\n');
 return'';
}
function baseRules(){return `You are the senior consulting board inside I AM Magnanimous Way™. Be rigorous, skeptical and useful. Do not agree merely to please the founder. Separate verified facts, assumptions, estimates and recommendations. Reconcile numbers. Identify missing evidence, weak economics, legal/regulatory questions and execution risks. Never promise funding, grants, investment, approvals, profitability or success. Use plain professional language and concrete next actions. Never mention or promote an outside AI provider to the customer.`}

async function cloudflare(env,prompt,{strong=true,maxTokens=2600}={}){
 if(!env?.AI)throw new Error('I AM free-first reasoning is temporarily unavailable.');
 const requested=String(strong?env.BUSINESS_PLAN_FREE_MODEL||'@cf/qwen/qwen3-30b-a3b-fp8':env.CLOUDFLARE_AI_MODEL||'').trim();
 const models=[...new Set([requested,'@cf/qwen/qwen3-30b-a3b-fp8','@cf/zai-org/glm-4.7-flash','@cf/meta/llama-3.3-70b-instruct-fp8-fast'].filter(Boolean))];
 const errors=[];
 for(const model of models){
  try{
   const out=await env.AI.run(model,{messages:[{role:'system',content:baseRules()},{role:'user',content:prompt}],max_tokens:maxTokens});
   const text=extractText(out).trim();
   if(text)return{text,provider:'cloudflare-ai',model,estimated_cost_usd:0};
   errors.push(`${model}: empty response`);
  }catch(e){errors.push(`${model}: ${e?.message||'failed'}`)}
 }
 throw new Error(`I AM reasoning could not complete this pass. ${errors.join(' | ')}`);
}
async function anthropic(env,prompt){
 const model=env.BUSINESS_PLAN_ANTHROPIC_MODEL||'claude-sonnet-5';
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:5000,system:baseRules(),messages:[{role:'user',content:prompt}]})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`premium reasoning failed (${r.status})`);
 return{text:(d.content||[]).map(x=>x?.text||'').join('\n').trim(),provider:'anthropic',model,estimated_cost_usd:.18};
}
async function gemini(env,prompt){
 const model=env.BUSINESS_PLAN_GOOGLE_MODEL||'gemini-3.7-flash';
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:baseRules()}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:5000}})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`premium reasoning failed (${r.status})`);
 return{text:(d.candidates?.[0]?.content?.parts||[]).map(x=>x?.text||'').join('\n').trim(),provider:'google',model,estimated_cost_usd:.08};
}
async function compatible(base,key,model,prompt,provider,cost){
 const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model,max_tokens:5000,messages:[{role:'system',content:baseRules()},{role:'user',content:prompt}]})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`premium reasoning failed (${r.status})`);
 return{text:String(d.choices?.[0]?.message?.content||'').trim(),provider,model,estimated_cost_usd:cost};
}
async function premiumReasoning(env,prompt,allowMetered){
 const candidates=[];
 if(allowMetered&&String(env.ANTHROPIC_API_KEY||'').trim())candidates.push(()=>anthropic(env,prompt));
 if(allowMetered&&String(env.GOOGLE_API_KEY||'').trim())candidates.push(()=>gemini(env,prompt));
 if(allowMetered&&String(env.MISTRAL_API_KEY||'').trim())candidates.push(()=>compatible('https://api.mistral.ai/v1',env.MISTRAL_API_KEY,env.BUSINESS_PLAN_MISTRAL_MODEL||'mistral-medium-latest',prompt,'mistral',.10));
 if(allowMetered&&String(env.GROQ_API_KEY||'').trim())candidates.push(()=>compatible('https://api.groq.com/openai/v1',env.GROQ_API_KEY,env.BUSINESS_PLAN_GROQ_MODEL||'llama-3.3-70b-versatile',prompt,'groq',.05));
 candidates.push(()=>cloudflare(env,prompt,{strong:true,maxTokens:5000}));
 const errors=[];
 for(const call of candidates){
  try{const out=await call();if(out?.text)return out;errors.push('empty response')}catch(e){errors.push(e?.message||'provider failed')}
 }
 throw new Error(`I AM professional reasoning could not complete this pass. ${errors.join(' | ')}`);
}

async function projectForUser(env,id,user){return env.DB.prepare('SELECT * FROM business_plan_projects WHERE id=? AND tenant_id=? AND user_id=?').bind(id,user.tenant_id,user.id).first()}
async function entitlement(env,user,project){
 if(Number(project?.paid||0)===1)return{ok:true,reason:'business_plan_purchase',metered:true};
 try{const row=await env.DB.prepare('SELECT status FROM business_plan_subscriptions WHERE project_id=? AND tenant_id=? AND user_id=?').bind(project.id,user.tenant_id,user.id).first();if(row&&ACTIVE.has(String(row.status||'')))return{ok:true,reason:'business_plan_subscription',metered:true}}catch{}
 try{const tenant=await env.DB.prepare('SELECT slug FROM tenants WHERE id=?').bind(user.tenant_id).first();if(tenant?.slug==='owner')return{ok:true,reason:'platform_owner',metered:true}}catch{}
 const plan=await tenantPlan(env,user.tenant_id);
 if((plan.limits?.rank||0)>=2&&ACTIVE.has(String(plan.status||'')))return{ok:true,reason:'full_business',metered:true,plan};
 return{ok:false,reason:'purchase_required',metered:false,plan};
}
async function canSpendMetered(env,user,ent,estimated=.25){
 if(!ent?.metered)return false;
 if(ent.reason==='business_plan_purchase'||ent.reason==='business_plan_subscription'||ent.reason==='platform_owner')return true;
 const gate=await canUsePremium(env,user.tenant_id,{category:'professional business-plan reasoning',estimated_cost_usd:estimated,required_plan:'business',entitlement:'metered_ai'});
 return Boolean(gate.ok);
}
async function usage(env,user,projectId,phase,result,ent){
 const cost=Math.max(0,Number(result?.estimated_cost_usd||0));
 await env.DB.prepare('INSERT INTO business_plan_provider_usage(tenant_id,user_id,project_id,phase,provider,model,estimated_cost_usd,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(user.tenant_id,user.id,projectId,phase,result.provider||'iam-native',result.model||'',cost,now()).run();
 if(cost>0&&ent?.reason==='full_business'){
  try{await recordUsage(env,user.tenant_id,{category:'business-plan-premium-ai',provider:result.provider,units:1,direct_cost_usd:cost,reference_id:`${projectId}:${phase}:${now()}`})}catch(e){console.error('business plan usage record failed',e)}
 }
}

async function researchContext(request,env,intake){
 const query=[intake.businessIdea,intake.industry,intake.location,intake.targetCustomer,intake.competition].filter(Boolean).join(' ').slice(0,900);
 try{return await getKnowledgeContext(request,env,query,{liveSearch:true,news:false,remember:true,localLimit:6,webLimit:6,freshness:'pm'})}catch(e){console.error('business plan research grounding failed',e);return{context:'',sources:[]}}
}

async function draft(request,env,user,body){
 const intake=body.intake||{};if(!String(intake.businessIdea||intake.concept||'').trim())return json({detail:'Describe the business idea first.'},400);
 const id=crypto.randomUUID(),ts=now();
 await env.DB.prepare('INSERT INTO business_plan_projects(id,tenant_id,user_id,intake_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,user.tenant_id,user.id,JSON.stringify(intake),'drafting',ts,ts).run();
 try{
  const raw=intakeText(intake),ground=await researchContext(request,env,intake);
  const evidence=String(ground.context||'').slice(0,18000);
  const analysis=await cloudflare(env,`PASS A — CONSULTING BOARD ANALYSIS\n\nFounder intake:\n${raw}\n\nWorkspace/current research evidence:\n${evidence||'No current external evidence was available. Do not invent facts.'}\n\nProduce: (1) assumption register, (2) demand/customer analysis, (3) competitor/differentiation analysis, (4) conservative startup and operating-cost framework, (5) pricing/unit-economics logic, (6) cash-flow and break-even logic, (7) regulatory questions to verify, (8) red/yellow/green risk table, and (9) validation experiments. Cite only evidence actually present above; otherwise label verification needed.`);
  const preview=await cloudflare(env,`PASS B — PROFESSIONAL FREE DRAFT\n\nBuild a coherent business-plan preview using the intake and senior analysis below. Do not merely summarize. Resolve contradictions, show formulas where exact numbers are missing, and make the founder's next decisions obvious. Include Opportunity, Customer & Problem, Offer/Pricing, Market Evidence, Competitive Position, Operations, Financial Snapshot, Funding Need/Use of Funds, Key Risks, 30/60/90-Day Actions, Assumptions to Confirm, and Evidence/Sources.\n\nINTAKE:\n${raw}\n\nSENIOR ANALYSIS:\n${analysis.text}\n\nRESEARCH EVIDENCE:\n${evidence}`);
  const sources=(ground.sources||[]).map(x=>({title:String(x.title||'Source'),url:String(x.url||'')})).filter(x=>x.url).slice(0,16);
  const work={analysis:analysis.text,research_context:evidence,quality_policy:'free-first-strong-reasoning',model:preview.model};
  await env.DB.prepare('UPDATE business_plan_projects SET work_json=?,preview_text=?,sources_json=?,status=?,updated_at=? WHERE id=?').bind(JSON.stringify(work),preview.text,JSON.stringify(sources),'preview_ready',now(),id).run();
  await usage(env,user,id,'draft',preview,{reason:'free'});
  const ent=await entitlement(env,user,{id,paid:0});
  return json({project_id:id,preview:preview.text,sources,status:'preview_ready',premium:ent.ok,premium_reason:ent.reason,reasoning_tier:'free-first-strong',provider_checkout_required:false,provider_billing:'managed_by_i_am'});
 }catch(e){await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('draft_failed',now(),id).run();return json({detail:e?.message||'Business-plan drafting failed.',project_id:id},502)}
}

async function finalize(request,env,user,body){
 const id=String(body.project_id||''),project=await projectForUser(env,id,user);if(!project)return json({detail:'Plan project not found.'},404);
 const ent=await entitlement(env,user,project);if(!ent.ok)return json({detail:'Professional finalization must be purchased from I AM Magnanimous Way or included in an eligible I AM plan before paid AI resources can be used.',code:'I_AM_PURCHASE_REQUIRED',provider_checkout_required:false},402);
 if(project.final_text)return json({project_id:id,final:project.final_text,sources:JSON.parse(project.sources_json||'[]'),status:'final_ready',premium_reason:ent.reason,provider_checkout_required:false});
 try{
  await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('finalizing',now(),id).run();
  const intake=JSON.parse(project.intake_json||'{}'),work=JSON.parse(project.work_json||'{}'),raw=intakeText(intake),sources=JSON.parse(project.sources_json||'[]');
  const allowMetered=await canSpendMetered(env,user,ent,.35);
  const critique=await premiumReasoning(env,`PROFESSIONAL REVIEW BOARD\n\nAudience: ${String(body.audience||intake.audience||'business planning')}\n\nINTAKE:\n${raw}\n\nFREE DRAFT ANALYSIS:\n${String(work.analysis||'').slice(0,18000)}\n\nAct simultaneously as skeptical lender/investor, operations leader and conservative financial reviewer. Identify every material weakness, unsupported claim, missing expense, cash-flow risk, pricing flaw, market-evidence gap, staffing dependency, legal/regulatory issue and audience mismatch. Produce explicit corrections and a reconciliation ledger.`,allowMetered);
  await usage(env,user,id,'professional-review',critique,ent);
  const final=await premiumReasoning(env,`FINAL PROFESSIONAL BUSINESS PLAN\n\nCreate a complete, presentation-ready plan after applying every justified correction below. Write the Executive Summary last in your reasoning but place it first. Include Company & Concept; Opportunity; Product/Service & Pricing; Customer Segments; Market Evidence; Competitors; Business Model; Marketing & Sales; Operations; Staffing; Technology/Suppliers; Legal/Regulatory questions; Startup Budget; Revenue Assumptions; COGS; Operating Expenses; Cash Flow; Break-Even; Funding Requirement and Use of Funds; Base/Downside/Upside framework; 3–5 Year Forecast Assumptions; Milestones; Risk Register; Audience-Specific Notes; Evidence Register; Remaining Assumptions; Appendix Checklist. Never fabricate exact numbers where inputs are missing—show formulas/ranges and label verification required.\n\nINTAKE:\n${raw}\n\nFREE ANALYSIS:\n${String(work.analysis||'').slice(0,14000)}\n\nPROFESSIONAL REVIEW/CORRECTIONS:\n${critique.text}\n\nAVAILABLE SOURCES:\n${JSON.stringify(sources).slice(0,9000)}`,allowMetered);
  await usage(env,user,id,'final-publication',final,ent);
  work.final_reviews={professional_board:critique.text};work.final_model=final.model;work.final_provider_class=final.provider==='cloudflare-ai'?'iam-free-first':'iam-managed-premium';
  await env.DB.prepare('UPDATE business_plan_projects SET work_json=?,final_text=?,status=?,updated_at=? WHERE id=?').bind(JSON.stringify(work),final.text,'final_ready',now(),id).run();
  return json({project_id:id,final:final.text,sources,status:'final_ready',premium_reason:ent.reason,reasoning_tier:final.provider==='cloudflare-ai'?'strong-native':'managed-premium',provider_checkout_required:false,provider_billing:'managed_by_i_am'});
 }catch(e){await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('final_failed',now(),id).run();return json({detail:e?.message||'Final business-plan generation failed.'},502)}
}

export async function handleBusinessPlanQuality(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/api/business-plan/quality'&&request.method==='GET')return json({quality_router:true,free_draft:{provider_class:'I AM free-first',primary_model:'@cf/qwen/qwen3-30b-a3b-fp8',fallback_models:['@cf/zai-org/glm-4.7-flash','@cf/meta/llama-3.3-70b-instruct-fp8-fast'],live_research:true},professional_final:{requires_i_am_purchase:true,external_provider_checkout:false,managed_provider_costs:true,strong_model_fallback:true,preferred_models:['claude-sonnet-5','gemini-3.7-flash']},billing_rule:'Customers pay I AM. Outside AI providers are server-side execution engines and are never a customer checkout destination.'});
 if(!['/api/business-plan/draft','/api/business-plan/final'].includes(path)||request.method!=='POST')return null;
 if(!env?.DB)return json({detail:'Business-plan storage is unavailable.'},503);
 await ensureSchema(env);
 const user=await currentUserFromRequest(request,env);if(!user)return json({detail:'Sign in required.'},401);
 const body=await request.json().catch(()=>({}));
 if(path==='/api/business-plan/draft')return draft(request,env,user,body);
 return finalize(request,env,user,body);
}
