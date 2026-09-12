const now=()=>Math.floor(Date.now()/1000);

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
 [/content repurposer/i,['format adaptation','content atomization','cross-platform reuse','message consistency']],
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
  learning_policy:['keep branch-specific lessons attached to this agent','use shared team memory only when relevant','do not overwrite another branch specialty','promote reusable role knowledge into this branch knowledge store','ask another branch for conceptual handoff when work falls outside this specialty'],
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
}

export async function branchKnowledge(env,tenantId,agentId,limit=16){
 if(!env?.DB)return[];
 try{
  await ensureBranchSchema(env);
  const {results=[]}=await env.DB.prepare('SELECT id,title,content,tags,source,updated_at FROM agent_branch_knowledge WHERE tenant_id=? AND agent_id=? ORDER BY updated_at DESC,id DESC LIMIT ?').bind(String(tenantId),String(agentId),Math.max(1,Math.min(40,Number(limit)||16))).all();
  return results.map(x=>({id:x.id,title:String(x.title||''),content:String(x.content||''),tags:String(x.tags||''),source:String(x.source||''),updated_at:Number(x.updated_at||0)}));
 }catch{return[]}
}

export function branchKnowledgeContext(profile,knowledge){
 const learned=(knowledge||[]).map((x,i)=>`${i+1}. ${x.title?`${x.title}: `:''}${String(x.content||'').slice(0,2200)}`).join('\n');
 return `BRANCH IDENTITY\n${profile.identity}\n\nMISSION\n${profile.mission}\n\nCORE SKILLS\n- ${profile.core_skills.join('\n- ')}\n\nOPERATING METHOD\n- ${profile.operating_method.join('\n- ')}\n\nBRANCH LEARNING RULES\n- ${profile.learning_policy.join('\n- ')}\n\nDEVELOPER / WORKSPACE TEACHING FOR THIS BRANCH\n${learned||'(no extra branch teaching has been added yet)'}`;
}

export async function teachBranch(env,user,agent,body={}){
 await ensureBranchSchema(env);
 if(!user||!['owner','admin'].includes(String(user.role||'').toLowerCase()))return{ok:false,status:403,detail:'Only a workspace owner or administrator can teach a specialist branch.'};
 const content=String(body.content||'').trim();
 if(!content)return{ok:false,status:400,detail:'Teaching content is required.'};
 const ts=now();
 const title=String(body.title||`${agent.name} branch lesson`).trim().slice(0,180);
 const tags=Array.isArray(body.tags)?body.tags.map(x=>String(x).trim()).filter(Boolean).slice(0,20).join(', '):String(body.tags||'').slice(0,500);
 const source=String(body.source||'developer-teaching').trim().slice(0,120);
 const result=await env.DB.prepare('INSERT INTO agent_branch_knowledge(tenant_id,agent_id,title,content,tags,source,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(String(user.tenant_id),agent.id,title,content.slice(0,30000),tags,source,String(user.id||''),ts,ts).run();
 return{ok:true,id:result?.meta?.last_row_id||null,agent_id:agent.id,title,tags,source};
}
