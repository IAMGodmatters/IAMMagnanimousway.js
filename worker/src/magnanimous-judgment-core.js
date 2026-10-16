// Magnanimous Judgment Core
// Provider-neutral evidence contracts, council planning, durable delegation,
// skill synthesis candidates, and learning-journey events.
//
// Magnanimous AI remains the brain, memory, policy and final verification owner.
// External models and tools are replaceable workers and never become identity.

const clip=(value,max=4000)=>String(value??'').trim().slice(0,max);
const uniqueStrings=(items,max=64)=>[...new Set((Array.isArray(items)?items:[]).map(x=>clip(x,500)).filter(Boolean))].slice(0,max);
const finiteNumber=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export const MAGNANIMOUS_JUDGMENT_POLICY=Object.freeze({
 version:1,
 identity:'Magnanimous AI',
 orchestration_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 external_role:'replaceable-worker',
 completion_rule:'Important work is complete only when required criteria have passing evidence.',
 council_rule:'Use independent workers for difficult or high-uncertainty work, then let Magnanimous judge evidence and consensus.',
 reasoning_rule:'Store and expose concise conclusions, evidence, confidence and provenance; do not require or expose hidden chain-of-thought.',
 learning_rule:'Successful workflows may become candidate Magnanimous skills, but activation requires validation, regression checks, provenance and rollback readiness.',
 cost_rule:'Prefer native/free workers first and enforce explicit budgets before metered provider fan-out.',
 durability_rule:'Long-running delegated work must have explicit state, retry bounds, evidence and resumable checkpoints.'
});

function normalizeCriterion(item,index){
 if(typeof item==='string'){
  return {id:`criterion-${index+1}`,description:clip(item,1000),required:true};
 }
 const raw=item&&typeof item==='object'?item:{};
 return {
  id:clip(raw.id||`criterion-${index+1}`,120),
  description:clip(raw.description||raw.name||`Criterion ${index+1}`,1000),
  required:raw.required!==false,
  verification:clip(raw.verification||raw.check||'',500)
 };
}

export function createMagnanimousCompletionContract(input={}){
 const criteria=(Array.isArray(input.criteria)?input.criteria:[]).map(normalizeCriterion).filter(x=>x.description);
 if(!criteria.length)throw new Error('Completion contract requires at least one criterion.');
 return Object.freeze({
  id:clip(input.id||`goal-${Date.now()}`,160),
  objective:clip(input.objective||input.goal||'',2000),
  criteria,
  required_evidence:uniqueStrings(input.required_evidence||input.requiredEvidence,32),
  pre_verify_checks:uniqueStrings(input.pre_verify_checks||input.preVerifyChecks,32),
  minimum_pass_ratio:clamp(finiteNumber(input.minimum_pass_ratio??input.minimumPassRatio,1),0,1),
  require_all_required:input.require_all_required!==false&&input.requireAllRequired!==false,
  max_cost_usd:Math.max(0,finiteNumber(input.max_cost_usd??input.maxCostUsd,0)),
  created_at:clip(input.created_at||new Date().toISOString(),80)
 });
}

function normalizeEvidence(item,index){
 const raw=item&&typeof item==='object'?item:{};
 const status=['pass','fail','unknown'].includes(raw.status)?raw.status:'unknown';
 return {
  id:clip(raw.id||`evidence-${index+1}`,160),
  criterion_id:clip(raw.criterion_id||raw.criterionId||'',160),
  status,
  source:clip(raw.source||'',1000),
  detail:clip(raw.detail||raw.summary||'',2000),
  artifact:clip(raw.artifact||raw.artifact_ref||raw.artifactRef||'',1000),
  verified_at:clip(raw.verified_at||raw.verifiedAt||new Date().toISOString(),80)
 };
}

export function evaluateMagnanimousCompletionContract(contract,evidence=[]){
 if(!contract?.criteria?.length)throw new Error('Invalid completion contract.');
 const normalized=(Array.isArray(evidence)?evidence:[]).map(normalizeEvidence);
 const byCriterion=new Map();
 for(const item of normalized){
  if(!item.criterion_id)continue;
  const prior=byCriterion.get(item.criterion_id)||[];
  prior.push(item);
  byCriterion.set(item.criterion_id,prior);
 }
 const results=contract.criteria.map(criterion=>{
  const items=byCriterion.get(criterion.id)||[];
  const passed=items.some(x=>x.status==='pass');
  const failed=!passed&&items.some(x=>x.status==='fail');
  return {criterion,passed,failed,evidence:items};
 });
 const required=results.filter(x=>x.criterion.required);
 const passCount=results.filter(x=>x.passed).length;
 const passRatio=results.length?passCount/results.length:0;
 const missingRequired=required.filter(x=>!x.passed&&!x.failed).map(x=>x.criterion.id);
 const failedRequired=required.filter(x=>x.failed).map(x=>x.criterion.id);
 const requiredSatisfied=!contract.require_all_required||(!missingRequired.length&&!failedRequired.length);
 const complete=requiredSatisfied&&passRatio>=contract.minimum_pass_ratio;
 return Object.freeze({
  contract_id:contract.id,
  complete,
  status:complete?'verified-complete':failedRequired.length?'verification-failed':'verification-incomplete',
  pass_ratio:Number(passRatio.toFixed(4)),
  passed:results.filter(x=>x.passed).map(x=>x.criterion.id),
  missing_required:missingRequired,
  failed_required:failedRequired,
  evidence_count:normalized.length,
  evidence:normalized
 });
}

function normalizeWorker(worker,index){
 const raw=worker&&typeof worker==='object'?worker:{};
 return {
  id:clip(raw.id||`worker-${index+1}`,160),
  family:clip(raw.family||raw.capability_family||'general',160),
  enabled:raw.enabled!==false,
  native:Boolean(raw.native),
  priority:finiteNumber(raw.priority,index),
  estimated_cost_usd:Math.max(0,finiteNumber(raw.estimated_cost_usd??raw.estimatedCostUsd,0)),
  data_training_risk:Boolean(raw.data_training_risk??raw.dataTrainingRisk),
  capabilities:uniqueStrings(raw.capabilities,32)
 };
}

export function planMagnanimousCouncil(input={}){
 const maxMembers=clamp(Math.trunc(finiteNumber(input.max_members??input.maxMembers,3)),1,12);
 const budget=Math.max(0,finiteNumber(input.max_cost_usd??input.maxCostUsd,0));
 const allowTrainingRisk=Boolean(input.allow_data_training_risk??input.allowDataTrainingRisk);
 const workers=(Array.isArray(input.workers)?input.workers:[]).map(normalizeWorker)
  .filter(x=>x.enabled&&(allowTrainingRisk||!x.data_training_risk))
  .sort((a,b)=>Number(b.native)-Number(a.native)||a.estimated_cost_usd-b.estimated_cost_usd||a.priority-b.priority);
 const selected=[];
 let estimated=0;
 for(const worker of workers){
  if(selected.length>=maxMembers)break;
  if(budget===0&&worker.estimated_cost_usd>0)continue;
  if(budget>0&&estimated+worker.estimated_cost_usd>budget)continue;
  selected.push(worker);
  estimated+=worker.estimated_cost_usd;
 }
 return Object.freeze({
  task:clip(input.task||'',2000),
  selected_workers:selected,
  selected_count:selected.length,
  estimated_cost_usd:Number(estimated.toFixed(6)),
  budget_usd:budget,
  policy:'native-free-first-independent-workers',
  aggregator:'Magnanimous AI',
  raw_chain_of_thought_required:false
 });
}

export function judgeMagnanimousCouncil(results=[],options={}){
 const minimumMembers=clamp(Math.trunc(finiteNumber(options.minimum_members??options.minimumMembers,2)),1,12);
 const agreementThreshold=clamp(finiteNumber(options.agreement_threshold??options.agreementThreshold,0.67),0.5,1);
 const normalized=(Array.isArray(results)?results:[]).map((raw,index)=>({
  worker_id:clip(raw?.worker_id||raw?.workerId||`worker-${index+1}`,160),
  verdict:['support','oppose','abstain'].includes(raw?.verdict)?raw.verdict:'abstain',
  confidence:clamp(finiteNumber(raw?.confidence,0),0,1),
  conclusion:clip(raw?.conclusion||raw?.summary||'',2000),
  evidence_refs:uniqueStrings(raw?.evidence_refs||raw?.evidenceRefs,32)
 }));
 const voting=normalized.filter(x=>x.verdict!=='abstain');
 const support=voting.filter(x=>x.verdict==='support');
 const oppose=voting.filter(x=>x.verdict==='oppose');
 const agreement=voting.length?Math.max(support.length,oppose.length)/voting.length:0;
 const majority=support.length===oppose.length?'no-consensus':support.length>oppose.length?'support':'oppose';
 const sufficient=normalized.length>=minimumMembers&&voting.length>=minimumMembers&&agreement>=agreementThreshold;
 return Object.freeze({
  status:sufficient?'judged':'needs-review',
  majority:sufficient?majority:'no-consensus',
  agreement:Number(agreement.toFixed(4)),
  member_count:normalized.length,
  voting_count:voting.length,
  conclusions:normalized,
  raw_chain_of_thought_stored:false,
  final_decision_owner:'Magnanimous AI'
 });
}

export function createMagnanimousSkillCandidate(input={}){
 const steps=uniqueStrings(input.steps,64);
 if(!clip(input.name,160)||!steps.length)throw new Error('Skill candidate requires a name and at least one step.');
 return Object.freeze({
  id:clip(input.id||`skill-${Date.now()}`,160),
  name:clip(input.name,160),
  purpose:clip(input.purpose||'',1200),
  status:'candidate',
  steps,
  permissions:uniqueStrings(input.permissions,32),
  tests:uniqueStrings(input.tests,64),
  provenance:{
   source_type:clip(input.source_type||input.sourceType||'workflow',120),
   source_ref:clip(input.source_ref||input.sourceRef||'',1000),
   derived_by:'Magnanimous AI',
   created_at:clip(input.created_at||new Date().toISOString(),80)
  },
  promotion_requirements:['schema-valid','permission-reviewed','regression-pass','reversible','provenance-recorded'],
  auto_activate:false
 });
}

export function createMagnanimousJourneyEvent(input={}){
 return Object.freeze({
  id:clip(input.id||`journey-${Date.now()}`,160),
  type:clip(input.type||'learning',120),
  subject_id:clip(input.subject_id||input.subjectId||'',160),
  summary:clip(input.summary||'',2000),
  evidence_refs:uniqueStrings(input.evidence_refs||input.evidenceRefs,32),
  provenance:clip(input.provenance||'Magnanimous AI',300),
  created_at:clip(input.created_at||new Date().toISOString(),80),
  contains_raw_chain_of_thought:false
 });
}

const TASK_TRANSITIONS=Object.freeze({
 queued:['running','cancelled'],
 running:['waiting','verifying','failed','cancelled'],
 waiting:['running','failed','cancelled'],
 verifying:['complete','running','failed'],
 failed:['queued','cancelled'],
 complete:[],
 cancelled:[]
});

export function transitionMagnanimousDurableTask(task={},nextState,evidence={}){
 const current=clip(task.state||'queued',40);
 const next=clip(nextState,40);
 if(!(TASK_TRANSITIONS[current]||[]).includes(next))throw new Error(`Invalid durable task transition: ${current} -> ${next}`);
 const attempt=Math.max(0,Math.trunc(finiteNumber(task.attempt,0)))+(next==='running'?1:0);
 const maxAttempts=Math.max(1,Math.trunc(finiteNumber(task.max_attempts??task.maxAttempts,3)));
 if(next==='running'&&attempt>maxAttempts)throw new Error('Durable task retry budget exhausted.');
 return Object.freeze({
  ...task,
  id:clip(task.id||`task-${Date.now()}`,160),
  state:next,
  attempt,
  max_attempts:maxAttempts,
  checkpoint_ref:clip(evidence.checkpoint_ref||evidence.checkpointRef||task.checkpoint_ref||'',1000),
  evidence_refs:uniqueStrings([...(task.evidence_refs||[]),...(evidence.evidence_refs||evidence.evidenceRefs||[])],64),
  updated_at:new Date().toISOString()
 });
}

export function getMagnanimousJudgmentPrompt(){
 return `MAGNANIMOUS JUDGMENT CORE\nMagnanimous AI owns planning, memory, policy, aggregation and final verification. External models and tools are replaceable workers.\nFor important or long-running work, define a completion contract with explicit criteria and evidence before declaring success.\nUse independent specialist workers in parallel only when useful, budgeted and authorized. Prefer native/free workers first. Magnanimous judges concise conclusions, confidence and evidence; do not request, store or expose hidden chain-of-thought.\nTurn successful repeated workflows into candidate Magnanimous skills with provenance, permissions, tests and rollback requirements. Candidate skills are not active until validated.\nRecord visible learning-journey events without secrets or hidden reasoning.\nPersist long-running task state with bounded retries, checkpoints and verification evidence so work can resume safely.`;
}
