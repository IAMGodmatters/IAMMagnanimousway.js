import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const clean=(value,max=12000)=>String(value||'').trim().slice(0,max);
const GENERATION_MODULES=new Set(['business-demand','daily-assistant','email-replies','research','customer-follow-up','leads','press','ad-planner','context-control']);
const RESEARCH_MODULES=new Set(['business-demand','research','leads','press','ad-planner']);

function recoverableExecutionFailure(text){
  return /(4006|daily free allocation|quota|rate[ -]?limit|workers ai|cloudflare ai|ai generation failed|ai engine is not available|no magnanimous ai execution rail is configured|execution rail[^\n]{0,80}(not configured|unavailable)|model[^\n]{0,80}(unavailable|failed|capacity)|capacity[^\n]{0,80}(model|generation|execution))/i.test(String(text||''));
}

async function ensureRecordTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS professional_records (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, module TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft', priority TEXT NOT NULL DEFAULT 'normal',
    related_contact_id INTEGER, due_at INTEGER, input_json TEXT NOT NULL DEFAULT '{}', output_text TEXT NOT NULL DEFAULT '',
    sources_json TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_professional_records_tenant_module ON professional_records(tenant_id,module,updated_at)').run();
}

function recordView(row){
  if(!row)return row;
  let input={},sources=[];
  try{input=JSON.parse(row.input_json||'{}')}catch{}
  try{sources=JSON.parse(row.sources_json||'[]')}catch{}
  return{...row,input,sources};
}

function continuityOutput(module,input){
  const request=clean(input,9000);
  const header='Magnanimous continuity mode preserved this work request and produced a structured starting point while full generative capacity is temporarily constrained.';
  if(module==='daily-assistant')return `${header}\n\nOBJECTIVE\n${request}\n\nTOP PRIORITIES\n1. Define the exact finished outcome and the most time-sensitive requirement.\n2. Complete the smallest high-impact action that moves the request forward.\n3. Verify dependencies, people, files, approvals, or deadlines before the next irreversible step.\n\nACTION PLAN\n- Break the objective into concrete tasks and mark the first task as active.\n- Gather any missing facts or inputs before making assumptions.\n- Complete the active task, verify the result, then continue in order.\n- Record follow-ups and due items so nothing is lost.\n\nCHECKLIST\n[ ] Confirm desired outcome\n[ ] Identify urgent/dependent items\n[ ] Execute first actionable step\n[ ] Verify result\n[ ] Continue or schedule follow-up\n\nWHAT CAN WAIT\nCosmetic refinements and low-impact extras can wait until the core outcome and required verification are complete.`;
  if(module==='email-replies')return `${header}\n\nCORRESPONDENCE REQUEST\n${request}\n\nDRAFT FRAMEWORK\nSubject: Follow-up\n\nHello,\n\nThank you for your message. I am following up regarding the request above. I want to make sure the important details are handled accurately. Please confirm any missing dates, amounts, commitments, or decisions that are required before final action.\n\nThank you.\n\nFOLLOW-UP\nReview names, facts, commitments, attachments, and recipient details before sending. Nothing has been sent automatically.`;
  if(module==='research')return `${header}\n\nRESEARCH QUESTION\n${request}\n\nCURRENT POSITION\nNo new external fact should be treated as verified until a source is checked. Preserve supplied workspace facts separately from inference.\n\nRESEARCH PLAN\n1. Define the decision this research must support.\n2. Gather primary or authoritative sources first.\n3. Record each material claim with its source and date.\n4. Compare disagreements and note uncertainty.\n5. Summarize decision implications only after verification.\n\nUNKNOWN / VERIFY\nCurrent facts, statistics, prices, laws, availability, and market claims require live verification before being presented as fact.`;
  if(module==='business-demand')return `${header}\n\nMARKET-DEMAND REQUEST\n${request}\n\nVALIDATION BRIEF\n- Target customer: define the narrowest buyer/user segment first.\n- Problem intensity: identify frequency, urgency, cost, and existing workarounds.\n- Demand signals: verify searches, inquiries, purchases, reviews, communities, and competitor traction with sources.\n- Alternatives: list what customers use today and why they may switch.\n- Offer fit: test one clear promise, audience, price hypothesis, and conversion action.\n- Risks/unknowns: do not invent market size, growth, or competitor metrics.\n\nNEXT TEST\nRun the smallest evidence-producing validation test before increasing spend or making irreversible commitments.`;
  if(module==='customer-follow-up')return `${header}\n\nFOLLOW-UP REQUEST\n${request}\n\nRECOMMENDED NEXT STEP\nConfirm the customer's latest known need, prior commitment, and due date, then contact them through the previously approved channel.\n\nREADY-TO-REVIEW MESSAGE\nHello, I am following up on our previous conversation. I want to make sure we address the next step correctly. Please let me know whether anything has changed and what you need from us next.\n\nCHECKPOINT\nRecord the response, agreed action, owner, and follow-up date. Do not mark an action complete until it actually occurs.`;
  if(module==='leads')return `${header}\n\nLEAD-INTELLIGENCE REQUEST\n${request}\n\nQUALIFICATION PLAN\n- Define ideal-customer fit by business type, need, location, size, and buying signal.\n- Verify public business evidence before assigning fit or intent.\n- Separate confirmed facts from hypotheses.\n- Do not fabricate personal contact information.\n- Prioritize prospects with a visible problem your offer can credibly solve.\n\nOUTREACH ANGLE\nLead with the verified problem, a specific helpful outcome, and a low-friction next step rather than pressure.`;
  if(module==='press')return `${header}\n\nPR REQUEST\n${request}\n\nPR PLAN\n- Communications objective: define what should change in awareness, trust, or action.\n- Story angle: identify the genuinely newsworthy fact, event, result, or human impact.\n- Verification: confirm every name, date, number, quote, and claim before publication.\n- Pitch: keep it concise, relevant to the outlet's beat, and personalized from public information.\n- Distribution: prioritize relevant outlets rather than mass outreach.\n- Measurement: track qualified coverage, referral traffic, responses, and downstream business outcomes.`;
  if(module==='ad-planner')return `${header}\n\nAD-PLANNING REQUEST\n${request}\n\nCAMPAIGN FRAMEWORK\n- Objective: choose one primary conversion.\n- Audience: define one testable audience hypothesis.\n- Offer: state the value, proof, and action clearly.\n- Creative: test materially different hooks rather than cosmetic variations.\n- Landing page: keep message, proof, and conversion action consistent with the ad.\n- Measurement: verify tracking before spend.\n- Stop/scale rule: set budget and evidence thresholds in advance.\n\nRISK CONTROL\nDo not assume ROI, conversion rate, or platform performance without measured data.`;
  if(module==='context-control')return `${header}\n\nCONTEXT REVIEW REQUEST\n${request}\n\nCONTEXT GOVERNANCE\nStore only durable facts or preferences that materially improve future work. Scope each item to workspace, customer, project, campaign, or user. Avoid passwords, API keys, payment-card data, government IDs, authentication secrets, or other unnecessary sensitive credentials. Mark temporary facts with an expiry or require confirmation before reuse.`;
  return `${header}\n\nREQUEST\n${request}\n\nNEXT ACTION\nPreserve the request, identify the desired outcome, gather missing facts, execute the smallest safe step, verify it, and continue.`;
}

export async function recoverProfessionalGeneration(request,env,response){
  const url=new URL(request.url);
  if(request.method!=='POST'||url.pathname!=='/api/professional/generate'||!response||response.status<429)return response;
  const diagnostic=await response.clone().text().catch(()=>'');
  if(!recoverableExecutionFailure(diagnostic)||!env?.DB)return response;

  const body=await request.clone().json().catch(()=>({}));
  const module=clean(body.module,80);
  const input=clean(body.input||body.message,18000);
  if(!GENERATION_MODULES.has(module)||!input)return response;

  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return response;

  try{
    await ensureRecordTable(env);
    const id=crypto.randomUUID(),ts=now();
    const output=continuityOutput(module,input);
    const title=clean(body.title||input.slice(0,90),240)||'Professional work';
    const status=clean(body.status||'draft',40)||'draft';
    const priority=clean(body.priority||'normal',30)||'normal';
    const relatedContactId=Number(body.related_contact_id||0)||null;
    const dueAt=Number(body.due_at||0)||null;
    const savedInput={request:input,live_search_requested:RESEARCH_MODULES.has(module),continuity_mode:true};
    await env.DB.prepare(`INSERT INTO professional_records(id,tenant_id,user_id,module,title,status,priority,related_contact_id,due_at,input_json,output_text,sources_json,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,String(user.tenant_id),String(user.id),module,title,status,priority,relatedContactId,dueAt,JSON.stringify(savedInput),output,'[]',ts,ts).run();
    const row=await env.DB.prepare('SELECT * FROM professional_records WHERE id=? AND tenant_id=?').bind(id,String(user.tenant_id)).first();
    try{await env.DB.prepare('INSERT INTO professional_activity(tenant_id,user_id,module,action,record_id,detail_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(String(user.tenant_id),String(user.id),module,'continuity_created',id,JSON.stringify({title,reason:'execution_capacity'}),ts).run()}catch{}
    return json({ok:true,module,record:recordView(row),output,sources:[],model:'Magnanimous AI',continuity_mode:true,web_search_configured:Boolean(env.BRAVE_SEARCH_API_KEY),knowledge_used:false});
  }catch(error){
    console.error('professional continuity fallback failed',error);
    return response;
  }
}
