import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_JUDGMENT_POLICY,
  createMagnanimousCompletionContract,
  evaluateMagnanimousCompletionContract,
  planMagnanimousCouncil,
  judgeMagnanimousCouncil,
  createMagnanimousSkillCandidate,
  createMagnanimousJourneyEvent,
  transitionMagnanimousDurableTask,
  getMagnanimousJudgmentPrompt
} from '../../worker/src/magnanimous-judgment-core.js';

assert.equal(MAGNANIMOUS_JUDGMENT_POLICY.identity,'Magnanimous AI');
assert.equal(MAGNANIMOUS_JUDGMENT_POLICY.external_role,'replaceable-worker');
assert.match(MAGNANIMOUS_JUDGMENT_POLICY.reasoning_rule,/do not require or expose hidden chain-of-thought/i);

const contract=createMagnanimousCompletionContract({
 id:'qa-goal',
 objective:'Prove completion from evidence',
 criteria:[
  {id:'tests',description:'Regression tests pass'},
  {id:'evidence',description:'Evidence is recorded'}
 ]
});
let evaluation=evaluateMagnanimousCompletionContract(contract,[
 {criterionId:'tests',status:'pass',source:'qa'}
]);
assert.equal(evaluation.complete,false);
assert.deepEqual(evaluation.missing_required,['evidence']);
evaluation=evaluateMagnanimousCompletionContract(contract,[
 {criterionId:'tests',status:'pass',source:'qa'},
 {criterionId:'evidence',status:'pass',source:'qa'}
]);
assert.equal(evaluation.complete,true);
assert.equal(evaluation.status,'verified-complete');

const council=planMagnanimousCouncil({
 task:'Cross-check a difficult result',
 maxMembers:3,
 maxCostUsd:0,
 workers:[
  {id:'native-a',native:true,estimatedCostUsd:0},
  {id:'free-b',native:false,estimatedCostUsd:0},
  {id:'paid-c',estimatedCostUsd:0.5}
 ]
});
assert.equal(council.selected_count,2);
assert.equal(council.selected_workers.some(x=>x.id==='paid-c'),false);
assert.equal(council.aggregator,'Magnanimous AI');
assert.equal(council.raw_chain_of_thought_required,false);

const judgment=judgeMagnanimousCouncil([
 {workerId:'native-a',verdict:'support',confidence:0.9,conclusion:'Checks passed',evidenceRefs:['qa:1']},
 {workerId:'free-b',verdict:'support',confidence:0.8,conclusion:'Independent check passed',evidenceRefs:['qa:2']}
]);
assert.equal(judgment.status,'judged');
assert.equal(judgment.majority,'support');
assert.equal(judgment.final_decision_owner,'Magnanimous AI');
assert.equal(judgment.raw_chain_of_thought_stored,false);

const skill=createMagnanimousSkillCandidate({
 name:'qa-workflow',
 purpose:'Prove candidates do not auto-activate',
 steps:['inspect','verify'],
 tests:['node qa/scripts/magnanimous-judgment-core-lock.mjs']
});
assert.equal(skill.status,'candidate');
assert.equal(skill.auto_activate,false);
assert.ok(skill.promotion_requirements.includes('regression-pass'));

const journey=createMagnanimousJourneyEvent({type:'skill-candidate',subjectId:skill.id,summary:'QA candidate created'});
assert.equal(journey.contains_raw_chain_of_thought,false);

let task=transitionMagnanimousDurableTask({id:'qa-task',state:'queued',attempt:0,max_attempts:2},'running');
assert.equal(task.state,'running');
task=transitionMagnanimousDurableTask(task,'verifying',{evidenceRefs:['qa:test']});
assert.equal(task.state,'verifying');
task=transitionMagnanimousDurableTask(task,'complete',{evidenceRefs:['qa:proof']});
assert.equal(task.state,'complete');
assert.deepEqual(task.evidence_refs,['qa:test','qa:proof']);

assert.match(getMagnanimousJudgmentPrompt(),/Magnanimous AI owns planning, memory, policy, aggregation and final verification/i);
assert.match(getMagnanimousJudgmentPrompt(),/Prefer native\/free workers first/i);

console.log('Magnanimous Judgment Core lock: PASS');
