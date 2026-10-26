import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateMagnanimousModelArena,handleMagnanimousModelArena,MAGNANIMOUS_MODEL_ARENA_POLICY} from '../../worker/src/magnanimous-model-arena.js';
import {MAGNANIMOUS_MODEL_ARENA_SKILLS,MAGNANIMOUS_MODEL_ARENA_AGENTS,MAGNANIMOUS_MODEL_ARENA_ABSORPTION} from '../../worker/src/magnanimous-model-arena-skills.js';

assert.equal(MAGNANIMOUS_MODEL_ARENA_POLICY.brain,'Magnanimous AI');
assert.equal(MAGNANIMOUS_MODEL_ARENA_POLICY.external_model_requests,0);
assert.equal(MAGNANIMOUS_MODEL_ARENA_POLICY.response_text_persisted,false);
assert.equal(MAGNANIMOUS_MODEL_ARENA_ABSORPTION.copied_upstream_code,false);
assert.equal(MAGNANIMOUS_MODEL_ARENA_SKILLS.length,10);
assert.equal(new Set(MAGNANIMOUS_MODEL_ARENA_SKILLS.map(x=>x.name)).size,10);
assert.equal(MAGNANIMOUS_MODEL_ARENA_AGENTS[0].id,'arbita');
assert.ok(MAGNANIMOUS_MODEL_ARENA_SKILLS.every(x=>x.metadata.owner==='Magnanimous AI'&&x.instructions.includes('Magnanimous AI')));
const registry=fs.readFileSync('worker/src/magnanimous-agent-skills.js','utf8');
const agentMesh=fs.readFileSync('worker/src/agent-mesh-runtime.js','utf8');
const router=fs.readFileSync('worker/src/router-entrypoint.js','utf8');
assert.ok(registry.includes('...MAGNANIMOUS_MODEL_ARENA_SKILLS'),'Native skills must be discoverable.');
assert.ok(agentMesh.includes('.concat(MAGNANIMOUS_ENGINEERING_AGENTS).concat(MAGNANIMOUS_MODEL_ARENA_AGENTS)'),'Model-evaluation specialist must be in the live agent registry without changing the existing specialist contract.');
assert.ok(router.includes('handleMagnanimousModelArena(request,providerEnv)'),'Authenticated model arena must be mounted on the Worker router.');

const demo={
 rubric:{required_phrases:['tenant isolation','audit log','cost ceiling'],excluded_phrases:['disable security']},
 estimated_budget_usd:0,
 candidates:[
  {id:'model_one',output:'Tenant isolation needs an audit log and a cost ceiling.',reported_latency_ms:900,estimated_cost_usd:0},
  {id:'model_two',output:'Only audit log; disable security.',reported_latency_ms:300,estimated_cost_usd:1}
 ]
};
const result=evaluateMagnanimousModelArena(demo);
assert.equal(result.candidate_count,2);
assert.equal(result.top_candidate_id,'model_one');
assert.equal(result.rankings[0].rubric_adherence_score,100);
assert.ok(result.rankings[1].rubric_adherence_score<40);
assert.deepEqual(result.rankings[1].required_missing,['tenant isolation','cost ceiling']);
assert.deepEqual(result.rankings[1].exclusions_detected,['disable security']);
assert.equal(result.funding.estimate_over_budget,true);
assert.equal(result.funding.actual_external_spend_usd,0);
assert.ok(!JSON.stringify(result).includes('Tenant isolation needs an audit log'),'Raw output must never be echoed.');
const exact=evaluateMagnanimousModelArena({rubric:{required_phrases:['auth']},candidates:[{id:'a',output:'authorization'},{id:'b',output:'auth is required'}]});
assert.equal(exact.rankings[0].id,'b','Phrase matching must respect word boundaries.');
assert.equal(exact.rankings[1].rubric_adherence_score,0);

for(const invalid of [
 {rubric:{required_phrases:[]},candidates:demo.candidates},
 {rubric:demo.rubric,candidates:[demo.candidates[0]]},
 {rubric:demo.rubric,candidates:[demo.candidates[0],demo.candidates[0]]},
 {rubric:demo.rubric,candidates:[{id:'x',output:'ok',estimated_cost_usd:-1},demo.candidates[0]]},
 {rubric:demo.rubric,candidates:[{id:'x',output:'x'.repeat(8001)},demo.candidates[0]]},
 {rubric:demo.rubric,candidates:[{id:'__proto__',output:'ok'},demo.candidates[0]]}
])assert.throws(()=>evaluateMagnanimousModelArena(invalid),TypeError);

const unauth=await handleMagnanimousModelArena(new Request('https://example.com/api/magnanimous/model-arena/evaluate',{method:'POST',body:JSON.stringify(demo)}),{});
assert.equal(unauth.status,503,'No DB binding must not bypass the owner guard.');
const missing=await handleMagnanimousModelArena(new Request('https://example.com/api/elsewhere'),{});
assert.equal(missing,null);
console.log('Magnanimous Model Arena lock: PASS (zero spend, scoped owner route, rubric scoring and no raw-output echo).');
