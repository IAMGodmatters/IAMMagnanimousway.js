const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const PLAN_PRICE_ID='price_1UBIQCDuxV2kib03Gaow8HrJ';
const PLAN_PRICE_USD=79;

async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function safeEqual(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function sessionSecret(env){
  const configured=String(env.SESSION_SECRET||'').trim();if(configured)return configured;
  try{const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}catch{return''}
}
async function currentUser(request,env){
  const raw=request.headers.get('authorization')||'';if(!raw.startsWith('Bearer '))return null;
  const parts=raw.slice(7).split('|');if(parts.length!==5||Number(parts[3])<now())return null;
  const [userId,tenantId,role,exp,sig]=parts,secret=await sessionSecret(env);
  if(!secret||!safeEqual(sig,await hmacHex(secret,`${userId}|${tenantId}|${role}|${exp}`)))return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first();
}
async function ensureSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_projects(
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
    intake_json TEXT NOT NULL DEFAULT '{}', work_json TEXT NOT NULL DEFAULT '{}',
    preview_text TEXT NOT NULL DEFAULT '', final_text TEXT NOT NULL DEFAULT '',
    sources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'drafting',
    paid INTEGER NOT NULL DEFAULT 0, stripe_session_id TEXT,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_business_plan_tenant ON business_plan_projects(tenant_id,updated_at)').run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_plan_webhook_events(
    event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,processed_at INTEGER NOT NULL
  )`).run();
}
function textFromResponse(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
  const parts=[];
  const walk=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v!=='object')return;
    if(v.type==='output_text'&&typeof v.text==='string')parts.push(v.text);
    if(typeof v.content==='string'&&v.type==='text')parts.push(v.content);
    Object.values(v).forEach(walk);
  };walk(data?.output);return [...new Set(parts.map(x=>x.trim()).filter(Boolean))].join('\n\n');
}
function sourcesFromResponse(data){
  const map=new Map();
  const walk=v=>{if(!v)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v!=='object')return;
    const url=typeof v.url==='string'&&/^https?:\/\//i.test(v.url)?v.url:'';
    if(url){const title=String(v.title||v.name||'Source').slice(0,180);if(!map.has(url))map.set(url,{title,url})}
    Object.values(v).forEach(walk);
  };walk(data);return [...map.values()].slice(0,24);
}
async function responses(env,{prompt,model,research=false}){
  if(!env.OPENAI_API_KEY)throw new Error('OpenAI is not configured for the professional business-plan pipeline.');
  const payload={model:model||env.BUSINESS_PLAN_MODEL||'gpt-5.6-terra',input:prompt};
  if(research)payload.tools=[{type:'web_search_preview'}];
  let r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify(payload)});
  let d=await r.json().catch(()=>({}));
  if(!r.ok&&research){
    delete payload.tools;
    payload.input=`${prompt}\n\nCurrent web-search tooling was unavailable for this pass. Do not invent current facts. Clearly label any item that requires external verification.`;
    r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify(payload)});
    d=await r.json().catch(()=>({}));
  }
  if(!r.ok)throw new Error(d?.error?.message||`OpenAI Responses API failed (${r.status}).`);
  const text=textFromResponse(d);if(!text)throw new Error('The consulting pass returned no usable text.');
  return{text,sources:sourcesFromResponse(d),model:payload.model};
}
function intakeText(intake){
  const clean={};for(const [k,v] of Object.entries(intake||{})){const s=String(v??'').trim();if(s)clean[k]=s.slice(0,4000)}
  return JSON.stringify(clean,null,2);
}
function baseRules(){return `You are part of I AM Operator's professional small-business consulting team. Be rigorous rather than agreeable. Never promise financing, investment, grants, profitability, regulatory approval, or business success. Separate facts, assumptions, estimates, and recommendations. Flag missing evidence and weak assumptions. Use practical language suitable for an entrepreneur, lender, investor, grant reviewer, or partner. Numbers across sections must reconcile. Avoid generic AI filler.`}
async function createDraft(env,intake){
  const raw=intakeText(intake),model=env.BUSINESS_PLAN_MODEL||'gpt-5.6-terra';
  const clarify=await responses(env,{model,prompt:`${baseRules()}\n\nPASS 1 — CLARIFICATION AND ASSUMPTION CONTROL\nReview this intake and identify missing, vague, contradictory, or unrealistic inputs. Do not merely list questions: create a concise working assumptions register so the draft can proceed while clearly marking what the founder should confirm.\n\nINTAKE:\n${raw}`});
  const research=await responses(env,{model,research:true,prompt:`${baseRules()}\n\nPASS 2 — CURRENT MARKET RESEARCH\nResearch the business described below. Focus on relevant market conditions, competitors/substitutes, pricing evidence, customer behavior, location factors, regulations or licensing categories, startup-cost benchmarks, and credible risks. Prefer primary, government, industry, academic, or established commercial sources. Do not fabricate statistics. End with a compact evidence ledger showing the claim, source/URL when available, and date/context.\n\nINTAKE:\n${raw}\n\nCLARIFICATION REGISTER:\n${clarify.text}`});
  const [validation,finance]=await Promise.all([
    responses(env,{model,prompt:`${baseRules()}\n\nPASS 3 — MARKET VALIDATION\nAct as a skeptical market analyst. Test demand, target customer, differentiation, pricing, acquisition logic, competition and business-model viability. Give a red/yellow/green verdict for each major assumption and specific validation experiments before money is committed.\n\nINTAKE:\n${raw}\n\nRESEARCH:\n${research.text}`}),
    responses(env,{model,prompt:`${baseRules()}\n\nPASS 4 — FINANCIAL SANITY REVIEW\nAct as a conservative small-business financial analyst. Build or critique startup-cost categories, pricing/revenue assumptions, COGS, payroll, operating expenses, working capital, break-even logic, cash-flow needs, funding requirement, and base/downside/upside scenarios. If exact inputs are missing, use clearly labeled formulas or ranges instead of pretending precision.\n\nINTAKE:\n${raw}\n\nRESEARCH:\n${research.text}`})
  ]);
  const preview=await responses(env,{model,prompt:`${baseRules()}\n\nPASS 5 — FREE DRAFT PREVIEW\nCreate a polished but intentionally concise business-plan preview from the consulting work below. Include: Opportunity Snapshot; Customer & Problem; Offer & Pricing; Market Evidence; Competitive Position; Operating Model; Financial Snapshot with assumptions; Funding Need/Use of Funds if relevant; Top Risks; 30/60/90-Day Priorities; Founder Questions Still Open; Sources/Evidence. This is a planning document, not a promise of financing. Keep the preview useful on screen but reserve full detailed lender/investor-ready narratives, 3–5 year model guidance, hostile review corrections and appendices for finalization.\n\nINTAKE:\n${raw}\n\nCLARIFICATION:\n${clarify.text}\n\nRESEARCH:\n${research.text}\n\nVALIDATION:\n${validation.text}\n\nFINANCIAL REVIEW:\n${finance.text}`});
  return{preview:preview.text,work:{clarify:clarify.text,research:research.text,validation:validation.text,finance:finance.text},sources:[...research.sources,...preview.sources].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i),model};
}
async function createFinal(env,intake,work,audience){
  const raw=intakeText(intake),draftContext=JSON.stringify(work||{}),model=env.BUSINESS_PLAN_MODEL||'gpt-5.6-terra',finalModel=env.BUSINESS_PLAN_FINAL_MODEL||'gpt-5.6-sol';
  const [hostile,consistency,audienceReview]=await Promise.all([
    responses(env,{model,prompt:`${baseRules()}\n\nPASS 6 — HOSTILE REVIEW\nAct as a skeptical lender and investor reviewing this proposed business. Find the reasons you would decline it: unsupported demand, weak margins, missing expenses, cash-flow gaps, execution risks, legal/regulatory gaps, founder capability gaps, competitive responses and overly optimistic assumptions. Then give concrete corrections required before presentation.\n\nINTAKE:\n${raw}\n\nWORKING PLAN MATERIAL:\n${draftContext}`}),
    responses(env,{model,prompt:`${baseRules()}\n\nPASS 7 — CROSS-DOCUMENT CONSISTENCY CHECK\nAudit every material number, assumption, market claim, staffing statement, timeline, price, funding requirement and operational dependency in the working material. Produce a reconciliation list and corrected values/wording. Do not allow contradictory numbers to survive.\n\nINTAKE:\n${raw}\n\nWORKING PLAN MATERIAL:\n${draftContext}`}),
    responses(env,{model,prompt:`${baseRules()}\n\nPASS 8 — AUDIENCE ADAPTATION\nThe intended audience is: ${String(audience||'general business planning')}. Explain what this audience will care about most, what evidence must be foregrounded, what claims should be softened or removed, and how the final plan should be framed without implying approval or guaranteed funding.\n\nINTAKE:\n${raw}\n\nWORKING PLAN MATERIAL:\n${draftContext}`})
  ]);
  const final=await responses(env,{model:finalModel,prompt:`${baseRules()}\n\nPASS 9 — FINAL PROFESSIONAL PUBLICATION\nCreate the complete final business plan. Incorporate the prior research and correct every issue identified by the hostile review, consistency audit and audience review. Write the Executive Summary last in your reasoning but place it first in the document. Use clear headings and well-structured text tables where useful. Include: Executive Summary; Company & Concept; Problem/Opportunity; Product/Service & Pricing; Customer Segments; Market & Industry Evidence; Competitor Analysis; Business Model; Marketing & Sales; Operations; Staffing & Management; Technology/Suppliers where relevant; Legal/Regulatory Considerations (with appropriate professional-advice caveats); Startup Budget; Revenue Assumptions; COGS; Operating Expenses; Cash Flow Logic; Break-Even Analysis; Funding Requirement & Use of Funds; Base/Downside/Upside Scenario Framework; 3–5 Year Forecast Assumptions (do not fake exact figures when inputs are insufficient); Milestones; Risk Register & Mitigations; Audience-Specific Presentation Notes; Source & Evidence Register; Assumptions Still Requiring Confirmation; Appendix Checklist. State clearly that the plan supports preparation and decision-making and does not guarantee financing, investment, grants, approvals or business success.\n\nINTAKE:\n${raw}\n\nWORKING MATERIAL:\n${draftContext}\n\nHOSTILE REVIEW:\n${hostile.text}\n\nCONSISTENCY AUDIT:\n${consistency.text}\n\nAUDIENCE REVIEW:\n${audienceReview.text}`});
  return{final:final.text,reviews:{hostile:hostile.text,consistency:consistency.text,audience:audienceReview.text},sources:final.sources,model:finalModel};
}
async function projectForUser(env,id,user){return env.DB.prepare('SELECT * FROM business_plan_projects WHERE id=? AND tenant_id=? AND user_id=?').bind(id,user.tenant_id,user.id).first()}
async function premium(env,user,project){
  if(Number(project?.paid||0)===1)return{ok:true,reason:'one_time_purchase'};
  const tenant=await env.DB.prepare('SELECT id,slug,plan FROM tenants WHERE id=?').bind(user.tenant_id).first();
  if(tenant?.slug==='owner')return{ok:true,reason:'platform_owner'};
  if(String(tenant?.plan||'free')==='business')return{ok:true,reason:'full_business'};
  try{const sub=await env.DB.prepare('SELECT plan,status FROM billing_subscriptions WHERE tenant_id=?').bind(user.tenant_id).first();if(sub?.plan==='business'&&['active','trialing','past_due'].includes(String(sub?.status||'')))return{ok:true,reason:'full_business'}}catch{}
  return{ok:false,reason:'purchase_required'};
}
function siteOrigin(request,env){return String(env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'')||new URL(request.url).origin}
async function stripeRequest(env,path,options={}){
  if(!env.STRIPE_SECRET_KEY)return{ok:false,status:503,data:{error:{message:'Stripe is not configured.'}}};
  const r=await fetch(`https://api.stripe.com${path}`,{...options,headers:{authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,...(options.headers||{})}});return{ok:r.ok,status:r.status,data:await r.json().catch(()=>({}))};
}
function parseStripeSignature(header){const out={t:'',v1:[]};for(const part of String(header||'').split(',')){const [k,...rest]=part.trim().split('='),v=rest.join('=');if(k==='t')out.t=v;if(k==='v1'&&v)out.v1.push(v)}return out}
async function verifyWebhook(raw,header,secret){const p=parseStripeSignature(header);if(!p.t||!p.v1.length)return false;const ts=Number(p.t);if(!Number.isFinite(ts)||Math.abs(now()-ts)>300)return false;const expected=await hmacHex(secret,`${p.t}.${raw}`);return p.v1.some(x=>safeEqual(x,expected))}
async function markPaid(env,projectId,sessionId){await env.DB.prepare("UPDATE business_plan_projects SET paid=1,status=CASE WHEN final_text='' THEN 'paid' ELSE status END,stripe_session_id=?,updated_at=? WHERE id=?").bind(sessionId||null,now(),projectId).run()}

export async function handleBusinessPlan(request,env){
  const url=new URL(request.url),path=url.pathname;
  const isWebhook=path==='/api/billing/webhook'&&request.method==='POST';
  if(!path.startsWith('/api/business-plan')&&!isWebhook)return null;
  await ensureSchema(env);
  if(isWebhook){
    if(!env.STRIPE_WEBHOOK_SECRET)return null;
    const clone=request.clone(),raw=await clone.text(),sig=clone.headers.get('stripe-signature')||'';
    if(!await verifyWebhook(raw,sig,String(env.STRIPE_WEBHOOK_SECRET)))return null;
    let event;try{event=JSON.parse(raw)}catch{return null}
    const object=event?.data?.object||{},meta=object?.metadata||{};
    if(String(meta.product_type||'')!=='professional_business_plan')return null;
    const eventId=String(event?.id||'');if(!eventId)return json({detail:'Stripe event id is required.'},400);
    const seen=await env.DB.prepare('SELECT event_id FROM business_plan_webhook_events WHERE event_id=?').bind(eventId).first();if(seen)return json({received:true,duplicate:true});
    if(event.type==='checkout.session.completed'&&['paid','no_payment_required'].includes(String(object.payment_status||'')))await markPaid(env,String(meta.project_id||''),String(object.id||''));
    await env.DB.prepare('INSERT INTO business_plan_webhook_events(event_id,event_type,processed_at) VALUES(?,?,?)').bind(eventId,String(event.type||''),now()).run();
    return json({received:true,business_plan:true});
  }
  if(path==='/api/business-plan/config'&&request.method==='GET')return json({enabled:true,free_preview:true,one_time_price_usd:PLAN_PRICE_USD,included_with_full_business:true,pipeline:['Intake','Clarify','Research','Validate','Financial Review','Draft','Hostile Review','Consistency Check','Audience Adaptation','Final Polish']});
  const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
  if(path==='/api/business-plan/draft'&&request.method==='POST'){
    const body=await request.json().catch(()=>({})),intake=body.intake||{};
    if(!String(intake.businessIdea||intake.concept||'').trim())return json({detail:'Describe the business idea first.'},400);
    const id=crypto.randomUUID(),ts=now();
    await env.DB.prepare('INSERT INTO business_plan_projects(id,tenant_id,user_id,intake_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,user.tenant_id,user.id,JSON.stringify(intake),'drafting',ts,ts).run();
    try{const draft=await createDraft(env,intake);await env.DB.prepare('UPDATE business_plan_projects SET work_json=?,preview_text=?,sources_json=?,status=?,updated_at=? WHERE id=?').bind(JSON.stringify(draft.work),draft.preview,JSON.stringify(draft.sources),'preview_ready',now(),id).run();const ent=await premium(env,user,{paid:0});return json({project_id:id,preview:draft.preview,sources:draft.sources,status:'preview_ready',premium:ent.ok,premium_reason:ent.reason,one_time_price_usd:PLAN_PRICE_USD})}
    catch(e){await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('draft_failed',now(),id).run();return json({detail:e?.message||'Business-plan drafting failed.',project_id:id},502)}
  }
  if(path==='/api/business-plan/status'&&request.method==='GET'){
    const id=String(url.searchParams.get('id')||''),p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);const ent=await premium(env,user,p);return json({project_id:p.id,status:p.status,preview:p.preview_text,final:ent.ok?p.final_text:'',sources:JSON.parse(p.sources_json||'[]'),premium:ent.ok,premium_reason:ent.reason,paid:Boolean(p.paid),one_time_price_usd:PLAN_PRICE_USD})
  }
  if(path==='/api/business-plan/checkout'&&request.method==='POST'){
    const body=await request.json().catch(()=>({})),id=String(body.project_id||''),p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);const ent=await premium(env,user,p);if(ent.ok)return json({included:true,premium:true,reason:ent.reason});
    if(!env.STRIPE_SECRET_KEY)return json({detail:'Stripe checkout is not configured.'},503);
    const form=new URLSearchParams(),origin=siteOrigin(request,env),price=String(env.STRIPE_PRICE_BUSINESS_PLAN||PLAN_PRICE_ID);
    form.set('mode','payment');form.set('line_items[0][price]',price);form.set('line_items[0][quantity]','1');form.set('client_reference_id',String(user.tenant_id));form.set('customer_email',String(user.email||''));
    form.set('metadata[product_type]','professional_business_plan');form.set('metadata[tenant_id]',String(user.tenant_id));form.set('metadata[user_id]',String(user.id));form.set('metadata[project_id]',id);
    form.set('success_url',`${origin}/business-plan?checkout=success&session_id={CHECKOUT_SESSION_ID}&project_id=${encodeURIComponent(id)}`);form.set('cancel_url',`${origin}/business-plan?checkout=cancelled&project_id=${encodeURIComponent(id)}`);
    const {ok,data}=await stripeRequest(env,'/v1/checkout/sessions',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form.toString()});if(!ok||!data?.url)return json({detail:data?.error?.message||'Stripe could not create checkout.'},502);return json({url:data.url,session_id:data.id,project_id:id})
  }
  if(path==='/api/business-plan/confirm'&&request.method==='POST'){
    const body=await request.json().catch(()=>({})),id=String(body.project_id||''),sessionId=String(body.session_id||'');const p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);if(!/^cs_[A-Za-z0-9_]+$/.test(sessionId))return json({detail:'A valid Stripe Checkout session is required.'},400);
    const {ok,data:s}=await stripeRequest(env,`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);if(!ok||!s?.id)return json({detail:s?.error?.message||'Stripe checkout could not be verified.'},502);
    const meta=s.metadata||{};if(String(meta.product_type||'')!=='professional_business_plan'||String(meta.project_id||'')!==id||String(meta.tenant_id||'')!==String(user.tenant_id))return json({detail:'This checkout does not belong to this business-plan project.'},403);
    if(s.status!=='complete'||!['paid','no_payment_required'].includes(String(s.payment_status||'')))return json({detail:'Stripe has not confirmed this payment yet.'},409);await markPaid(env,id,sessionId);return json({confirmed:true,project_id:id,premium:true})
  }
  if(path==='/api/business-plan/final'&&request.method==='POST'){
    const body=await request.json().catch(()=>({})),id=String(body.project_id||''),p=await projectForUser(env,id,user);if(!p)return json({detail:'Plan project not found.'},404);const ent=await premium(env,user,p);if(!ent.ok)return json({detail:'Final professional plan requires Full Business or the one-time plan unlock.',code:'PLAN_UNLOCK_REQUIRED',price_usd:PLAN_PRICE_USD},402);if(p.final_text)return json({project_id:id,final:p.final_text,sources:JSON.parse(p.sources_json||'[]'),status:'final_ready',premium_reason:ent.reason});
    try{await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('finalizing',now(),id).run();const intake=JSON.parse(p.intake_json||'{}'),work=JSON.parse(p.work_json||'{}'),done=await createFinal(env,intake,work,body.audience||intake.audience||'business planning');const existing=JSON.parse(p.sources_json||'[]'),sources=[...existing,...done.sources].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);work.final_reviews=done.reviews;await env.DB.prepare('UPDATE business_plan_projects SET work_json=?,final_text=?,sources_json=?,status=?,updated_at=? WHERE id=?').bind(JSON.stringify(work),done.final,JSON.stringify(sources),'final_ready',now(),id).run();return json({project_id:id,final:done.final,sources,status:'final_ready',premium_reason:ent.reason})}
    catch(e){await env.DB.prepare('UPDATE business_plan_projects SET status=?,updated_at=? WHERE id=?').bind('final_failed',now(),id).run();return json({detail:e?.message||'Final business-plan generation failed.'},502)}
  }
  return json({detail:'Business-plan endpoint not found.'},404);
}
