import assert from 'node:assert/strict';
import { evaluateMainRulesets } from '../lib/main-ruleset-audit.mjs';

const repository='IAMGodmatters/IAMMagnanimousway.js';
const active=[{id:1,name:'Protect main',target:'branch',source:repository,source_type:'Repository',enforcement:'active'}];
const healthy={
  1:{
    rules:[
      {type:'pull_request',parameters:{required_approving_review_count:1}},
      {type:'required_status_checks',parameters:{required_status_checks:[{context:'Full Platform QA'},{context:'Magnanimous Command Lock'}]}}
    ],
    bypass_actors:[]
  }
};
const pass=evaluateMainRulesets(active,healthy,repository);
assert.equal(pass.status,'pass');
assert.equal(pass.requiredApprovals,1);
assert.equal(pass.requiredChecks,2);
assert.equal(pass.alwaysBypassActors,0);

const weak={
  1:{
    rules:[{type:'deletion'},{type:'non_fast_forward'}],
    bypass_actors:[
      {actor_type:'RepositoryRole',bypass_mode:'always'},
      {actor_type:'Integration',bypass_mode:'always'}
    ]
  }
};
const warning=evaluateMainRulesets(active,weak,repository);
assert.equal(warning.status,'warning');
assert.ok(warning.gaps.some(item=>item.includes('pull_request')));
assert.ok(warning.gaps.some(item=>item.includes('required_status_checks')));
assert.ok(warning.gaps.some(item=>item.includes('bypass_mode=always')));

const absent=evaluateMainRulesets([],{},repository);
assert.equal(absent.status,'warning');
const unreadable=evaluateMainRulesets(active,{},repository);
assert.equal(unreadable.status,'manual');

console.log('Main ruleset audit assessment: 4 cases passed.');
