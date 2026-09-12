const now=()=>Math.floor(Date.now()/1000);
export const GLOBAL_BRANCH_TENANT='__global__';

const GROUP_CURRICULA={
 everyday:{principles:['reduce friction','turn requests into realistic next actions','organize information clearly','prefer simple checklists and routines'],methods:['clarify the immediate goal','identify constraints','produce a practical sequence','call out anything that requires a real external action']},
 career:{principles:['improve employability without inventing credentials','tailor output to the target role','teach repeatable workplace skills','keep professional communication clear'],methods:['identify the target role or task','compare current material to the goal','improve the highest-impact gaps','give a reusable pattern or practice step']},
 business:{principles:['connect advice to revenue, cost, customer value and execution','separate assumptions from known facts','prefer measurable experiments','protect customer trust and legal boundaries'],methods:['define objective and customer','diagnose the business constraint','build an actionable plan','define metrics and next review point']},
 'call-center':{principles:['protect consent and disclosure requirements','optimize for customer resolution and quality','coach observable behaviors','separate staffing, QA, sales and escalation concerns'],methods:['classify the interaction','choose the correct script or playbook','define quality checkpoints','identify escalation or follow-up']},
 creator:{principles:['create for a specific audience and platform','lead with a strong hook without deception','preserve brand voice','repurpose ideas efficiently'],methods:['define audience and platform','choose the content objective','draft the asset','tighten hook, structure and call to action']},
 learning:{principles:['teach understanding rather than fake completion','adapt difficulty to the learner','use examples and retrieval practice','organize research and evidence'],methods:['find the learner starting point','explain the concept','test understanding','give the next practice step']}
};

const SKILL_RULES=[
 [/virtual assistant|workplace assistant/i,['task triage','follow-up planning','calendar and checklist thinking','professional communication']],
 [/planner|organizer|event/i,['prioritization','sequencing','constraint planning','checklist design']],
 [/budget/i,['budget categories','cash-flow organization','goal tracking','plain-language money organization']],
 [/travel/i,['itinerary design','packing and logistics','schedule planning','travel research framing']],
 [/tech/i,['step-by-step troubleshooting','device and app guidance','error isolation','safe setup practices']],
 [/resume|cv/i,['resume structure','achievement writing','keyword alignment','cover letters']],
 [/interview/i,['behavioral interview practice','answer structure','feedback','role-specific preparation']],
 [/job search/i,['role targeting','application pipeline','follow-up strategy','job-search organization']],
 [/excel|spreadsheet/i,['formulas','data cleanup','analysis','dashboard planning']],
 [/english|grammar|tutor|study/i,['clear explanation','practice design','feedback','skill progression']],
 [/business strategist|market strategist/i,['market analysis','positioning','offers','execution planning']],
 [/client onboarding/i,['intake','kickoff design','SOPs','handoffs']],
 [/customer service|support/i,['de-escalation','troubleshooting flows','policy communication','escalation design']],
 [/ad optimizer/i,['ad copy','offer framing','calls to action','conversion testing']],
 [/blog/i,['SEO briefs','article structure','drafting','editorial improvement']],
 [/cold email/i,['prospect relevance','personalization','sequence design','follow-up']],
 [/digital marketing|social strategist/i,['channel strategy','campaign planning','measurement','optimization']],
 [/product development/i,['problem validation','product definition','positioning','launch planning']],
 [/persona/i,['audience research','segmentation','pain points','message-market fit']],
 [/seo/i,['keyword intent','on-page SEO','content architecture','search-content planning']],
 [/sales/i,['discovery','objection handling','value framing','closing practice']],
 [/call center supervisor/i,['queue priorities','coaching','escalations','floor operations']],
 [/qa coach/i,['quality rubrics','call scoring','coaching evidence','root-cause analysis']],
 [/script builder/i,['inbound scripts','outbound scripts','disclosures','conversation branching']],
 [/workforce|queue/i,['staffing','break planning','service levels','coverage']],
 [/training coach/i,['onboarding','roleplay','scorecards','coaching plans']],
 [/facebook|instagram|linkedin|x growth|youtube/i,['platform-native content','hooks','publishing cadence','audience growth']],
 [/content creator|content repurposer/i,['format adaptation','content systems','content atomization','cross-platform reuse','message consistency']],
 [/viral hooks/i,['attention openings','curiosity structure','short-form pacing','ethical hook writing']],
 [/copywriter|digital content|story creator/i,['brand voice','persuasive structure','editing','storytelling']],
 [/research organizer/i,['research questions','source comparison','evidence notes','synthesis']]
];

function unique(items){return [...new Set(items.filter(Boolean))]}

export function branchProfile(agent){
 const group=GROUP_CURRICULA[agent.group]||GROUP_CURRICULA.everyday;
 const matched=SKILL_RULES.filter(([re])=>re.test(`${agent.title} ${agent.description}`)).flatMap(([,skills])=>skills);
 return {
  id:agent.id,
  name:agent.name,
  title:agent.title,
  group:agent.group,
  relationship:'specialized branch of Magnanimous AI',
  identity:`${agent.name} is the ${agent.title} branch of Magnanimous AI. ${agent.name} shares the Magnanimous core brain and platform memory architecture, but owns this specialty and should answer from that role rather than pretending to be a renamed general assistant.`,
  mission:agent.description,
  core_skills:unique([...matched,...group.principles]).slice(0,10),
  operating_method:group.methods,
  learning_policy:['keep branch-specific lessons attached to this agent','use owner-approved global lessons across all workspaces','use shared team memory only when relevant','do not overwrite another branch specialty','promote reusable role knowledge into this branch knowledge store','accept QA challenges as proposals, but never treat unapproved proposals as learned truth','ask another branch for conceptual handoff when work falls outside this specialty'],
  voice_policy:`Recognize the spoken name ${agent.name} as this branch identity and respond as ${agent.name}.`
 };
}

export async function ensureBranchSchema(env){
 if(!env?.DB)return;
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS agent_branch_knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'developer-teaching',
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agent_branch_knowledge_lookup ON agent_branch_knowledge(tenant_id,agent_id,updated_at DESC)').run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS agent_branch_training_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'qa-contributor',
  challenge_prompt TEXT NOT NULL DEFAULT '',
  expected_outcome TEXT NOT NULL DEFAULT '',
  submitted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id TEXT NOT NULL DEFAULT '',
  reviewer_note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL DEFAULT 0
 )`).run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agent_branch_training_review ON agent_branch_training_submissions(status,created_at DESC)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_agent_branch_training_submitter ON agent_branch_training_submissions(submitted_by,created_at DESC)').run();
}

export async function isPlatformOwnerUser(env,user){
 if(!env?.DB||!user||String(user.role||'')!=='owner')return false;
 try{const row=await env.DB.prepare('SELECT slug FROM tenants WHERE id=? LIMIT 1').bind(String(user.tenant_id||'')).first();return String(row?.slug||'')==='owner'}catch{return false}
}

export async function branchKnowledge(env,tenantId,agentId,limit=16){
 if(!env?.DB)return[];
 try{
  await ensureBranchSchema(env);
  const {results=[]}=await env.DB.prepare('SELECT id,tenant_id,title,content,tags,source,updated_at FROM agent_branch_knowledge WHERE agent_id=? AND (tenant_id=? OR tenant_id=?) ORDER BY CASE WHEN tenant_id=? THEN 0 ELSE 1 END,updated_at DESC,id DESC LIMIT ?').bind(String(agentId),GLOBAL_BRANCH_TENANT,String(tenantId),GLOBAL_BRANCH_TENANT,Math.max(1,Math.min(60,Number(limit)||16))).all();
  return results.map(x=>({id:x.id,scope:String(x.tenant_id)===GLOBAL_BRANCH_TENANT?'global':'workspace',title:String(x.title||''),content:String(x.content||''),tags:String(x.tags||''),source:String(x.source||''),updated_at:Number(x.updated_at||0)}));
 }catch{return[]}
}

export function branchKnowledgeContext(profile,knowledge){
 const learned=(knowledge||[]).map((x,i)=>`${i+1}. [${x.scope||'workspace'}] ${x.title?`${x.title}: `:''}${String(x.content||'').slice(0,2600)}`).join('\n');
 return `BRANCH IDENTITY\n${profile.identity}\n\nMISSION\n${profile.mission}\n\nCORE SKILLS\n- ${profile.core_skills.join('\n- ')}\n\nOPERATING METHOD\n- ${profile.operating_method.join('\n- ')}\n\nBRANCH LEARNING RULES\n- ${profile.learning_policy.join('\n- ')}\n\nOWNER-APPROVED / WORKSPACE TEACHING FOR THIS BRANCH\n${learned||'(no extra branch teaching has been added yet)'}`;
}

async function insertBranchKnowledge(env,{tenantId,agent,title,content,tags='',source='developer-teaching',createdBy=''}){
 const ts=now();
 const result=await env.DB.prepare('INSERT INTO agent_branch_knowledge(tenant_id,agent_id,title,content,tags,source,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(String(tenantId),agent.id,String(title||`${agent.name} branch lesson`).trim().slice(0,180),String(content||'').trim().slice(0,30000),String(tags||'').slice(0,500),String(source||'developer-teaching').slice(0,120),String(createdBy||''),ts,ts).run();
 return result?.meta?.last_row_id||null;
}

export async function teachBranch(env,user,agent,body={}){
 await ensureBranchSchema(env);
 if(!user||!['owner','admin'].includes(String(user.role||'').toLowerCase()))return{ok:false,status:403,detail:'Direct branch teaching requires owner or administrator access. QA contributors can submit lessons for owner approval.'};
 const content=String(body.content||'').trim();
 if(!content)return{ok:false,status:400,detail:'Teaching content is required.'};
 const platformOwner=await isPlatformOwnerUser(env,user);
 const global=body.global===true||platformOwner;
 if(body.global===true&&!platformOwner)return{ok:false,status:403,detail:'Only the platform owner can publish global specialist knowledge.'};
 const title=String(body.title||`${agent.name} branch lesson`).trim().slice(0,180);
 const tags=Array.isArray(body.tags)?body.tags.map(x=>String(x).trim()).filter(Boolean).slice(0,20).join(', '):String(body.tags||'').slice(0,500);
 const source=String(body.source||'developer-teaching').trim().slice(0,120);
 const id=await insertBranchKnowledge(env,{tenantId:global?GLOBAL_BRANCH_TENANT:String(user.tenant_id),agent,title,content,tags,source,createdBy:user.id});
 return{ok:true,id,agent_id:agent.id,title,tags,source,scope:global?'global':'workspace'};
}

export async function submitBranchTraining(env,user,agent,body={}){
 await ensureBranchSchema(env);
 if(!user)return{ok:false,status:401,detail:'Sign in to submit a QA training challenge.'};
 const content=String(body.content||'').trim();
 const challenge=String(body.challenge_prompt||'').trim();
 const expected=String(body.expected_outcome||'').trim();
 if(!content&&!challenge)return{ok:false,status:400,detail:'Add a proposed lesson or a QA challenge before submitting.'};
 const title=String(body.title||`${agent.name} QA training proposal`).trim().slice(0,180);
 const tags=Array.isArray(body.tags)?body.tags.map(x=>String(x).trim()).filter(Boolean).slice(0,20).join(', '):String(body.tags||'').slice(0,500);
 const source=String(body.source||'qa-contributor').trim().slice(0,120);
 const ts=now();
 const result=await env.DB.prepare('INSERT INTO agent_branch_training_submissions(tenant_id,agent_id,title,content,tags,source,challenge_prompt,expected_outcome,submitted_by,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(String(user.tenant_id),agent.id,title,content.slice(0,30000),tags,source,challenge.slice(0,10000),expected.slice(0,10000),String(user.id), 'pending',ts).run();
 return{ok:true,id:result?.meta?.last_row_id||null,agent_id:agent.id,title,status:'pending',requires_owner_approval:true};
}

export async function branchTrainingSubmissions(env,user,{agentId='',status=''}={}){
 await ensureBranchSchema(env);
 if(!user)return[];
 const platformOwner=await isPlatformOwnerUser(env,user);
 const clauses=[],bind=[];
 if(!platformOwner){clauses.push('s.submitted_by=?');bind.push(String(user.id))}
 if(agentId){clauses.push('s.agent_id=?');bind.push(String(agentId))}
 if(status){clauses.push('s.status=?');bind.push(String(status))}
 const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
 const {results=[]}=await env.DB.prepare(`SELECT s.id,s.tenant_id,s.agent_id,s.title,s.content,s.tags,s.source,s.challenge_prompt,s.expected_outcome,s.submitted_by,s.status,s.reviewer_id,s.reviewer_note,s.created_at,s.reviewed_at,u.name submitter_name,u.email submitter_email FROM agent_branch_training_submissions s LEFT JOIN users u ON u.id=s.submitted_by ${where} ORDER BY CASE WHEN s.status='pending' THEN 0 ELSE 1 END,s.created_at DESC LIMIT 120`).bind(...bind).all();
 return results.map(x=>({...x,id:Number(x.id),created_at:Number(x.created_at||0),reviewed_at:Number(x.reviewed_at||0)}));
}

export async function reviewBranchTrainingSubmission(env,user,agents,id,body={}){
 await ensureBranchSchema(env);
 if(!await isPlatformOwnerUser(env,user))return{ok:false,status:403,detail:'Only the platform owner can approve or reject global QA training.'};
 const row=await env.DB.prepare('SELECT * FROM agent_branch_training_submissions WHERE id=? LIMIT 1').bind(Number(id)).first();
 if(!row)return{ok:false,status:404,detail:'Training submission not found.'};
 if(String(row.status)!=='pending')return{ok:false,status:409,detail:`This submission is already ${row.status}.`};
 const action=String(body.action||'').toLowerCase();
 if(!['approve','reject'].includes(action))return{ok:false,status:400,detail:'Choose approve or reject.'};
 const note=String(body.reviewer_note||'').trim().slice(0,2000),reviewed=now();
 if(action==='reject'){
  await env.DB.prepare("UPDATE agent_branch_training_submissions SET status='rejected',reviewer_id=?,reviewer_note=?,reviewed_at=? WHERE id=? AND status='pending'").bind(String(user.id),note,reviewed,Number(id)).run();
  return{ok:true,id:Number(id),status:'rejected'};
 }
 const agent=agents.find(a=>String(a.id)===String(row.agent_id));
 if(!agent)return{ok:false,status:400,detail:'The target specialist branch no longer exists.'};
 const challenge=String(row.challenge_prompt||'').trim(),expected=String(row.expected_outcome||'').trim();
 const approvedContent=[String(row.content||'').trim(),challenge?`QA CHALLENGE\n${challenge}`:'',expected?`EXPECTED STRONG OUTCOME\n${expected}`:''].filter(Boolean).join('\n\n');
 if(!approvedContent)return{ok:false,status:400,detail:'Approved training has no usable content.'};
 const knowledgeId=await insertBranchKnowledge(env,{tenantId:GLOBAL_BRANCH_TENANT,agent,title:String(row.title||`${agent.name} approved QA lesson`),content:approvedContent,tags:String(row.tags||''),source:`approved:${String(row.source||'qa-contributor')}`,createdBy:user.id});
 await env.DB.prepare("UPDATE agent_branch_training_submissions SET status='approved',reviewer_id=?,reviewer_note=?,reviewed_at=? WHERE id=? AND status='pending'").bind(String(user.id),note,reviewed,Number(id)).run();
 return{ok:true,id:Number(id),status:'approved',knowledge_id:knowledgeId,agent_id:agent.id,scope:'global'};
}
