import assert from 'node:assert/strict';
import {
  MAGNANIMOUS_JUDGMENT_POLICY,
  createMagnanimousCompletionContract,
  evaluateMagnanimousCompletionContract,
  planMagnanimousCouncil,
  judgeMagnanimousCouncil,
  wilsonScoreInterval,
  evaluateMagnanimousSkillReliability,
  createMagnanimousSkillCandidate,
  createMagnanimousJourneyEvent,
  transitionMagnanimousDurableTask,
  getMagnanimousJudgmentPrompt
} from '../../worker/src/magnanimous-judgment-core.js';

assert.equal(MAGNANIMOUS_JUDGMENT_POLICY.identity,'Magnanimous AI');
assert.equal(MAGNANIMOUS_JUDGMENT_POLICY.external_role,'replaceable-worker');
assert.match(MAGNANIMOUS_JUDGMENT_POLICY.reasoning_rule,/do not require or expose hidden chain-of-thought/i);
assert.match(MAGNANIMOUS_JUDGMENT_POLICY.learning_rule,/statistically sufficient observed reliability/i);

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
assert.ok(skill.promotion_requirements.includes('statistical-confidence-proven'));

const perfect20=wilsonScoreInterval(20,20);
assert.ok(perfect20.lower>0.8&&perfect20.upper===1,'Wilson interval should remain conservative even with perfect results');
const noEvidence=wilsonScoreInterval(0,0);
assert.deepEqual({lower:noEvidence.lower,upper:noEvidence.upper},{lower:0,upper:1});

const baseSkillGates={
 skillId:skill.id,
 schemaValid:true,
 permissionReviewed:true,
 regressionPassed:true,
 reversible:true,
 provenanceRecorded:true
};
const trusted=evaluateMagnanimousSkillReliability({
 ...baseSkillGates,
 shadowSuccesses:12,
 shadowFailures:0,
 observedSuccesses:25,
 observedFailures:0
});
assert.equal(trusted.recommendation,'trusted-ready');
assert.equal(trusted.auto_activate,false);
assert.equal(trusted.final_decision_owner,'Magnanimous AI');
assert.equal(trusted.remaining_requirements.length,0);

const supervised=evaluateMagnanimousSkillReliability({
 ...baseSkillGates,
 shadowSuccesses:12,
 shadowFailures:0,
 observedSuccesses:2,
 observedFailures:0
});
assert.equal(supervised.recommendation,'supervised');
assert.ok(supervised.remaining_requirements.some(x=>x.startsWith('observed-uses:')));

const unsafeCandidate=evaluateMagnanimousSkillReliability({
 skillId:skill.id,
 schemaValid:true,
 permissionReviewed:false,
 regressionPassed:true,
 reversible:true,
 provenanceRecorded:true,
 shadowSuccesses:20,
 observedSuccesses:50
});
assert.equal(unsafeCandidate.recommendation,'candidate','statistics must never bypass missing permission review');
assert.ok(unsafeCandidate.remaining_requirements.includes('permission-reviewed'));

const retireReview=evaluateMagnanimousSkillReliability({
 ...baseSkillGates,
 shadowSuccesses:12,
 shadowFailures:0,
 observedSuccesses:1,
 observedFailures:24
});
assert.equal(retireReview.recommendation,'retirement-review');
assert.equal(retireReview.auto_retire,false,'retirement stays a governed Magnanimous decision');

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
assert.match(getMagnanimousJudgmentPrompt(),/statistically sufficient observed reliability/i);

console.log('Magnanimous Judgment Core lock: PASS');
