import assert from 'node:assert/strict';
import { evaluateMainRulesets, REQUIRED_MAIN_CHECK_CONTEXTS } from '../lib/main-ruleset-audit.mjs';

const repository='IAMGodmatters/IAMMagnanimousway.js';
const active=[{id:1,name:'Protect main',target:'branch',source:repository,source_type:'Repository',enforcement:'active'}];
const healthy={
  1:{
    conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
    rules:[
      {type:'pull_request',parameters:{required_approving_review_count:1}},
      {type:'required_status_checks',parameters:{
        required_status_checks:REQUIRED_MAIN_CHECK_CONTEXTS.map(context=>({context})),
        strict_required_status_checks_policy:true
      }}
    ],
    bypass_actors:[]
  }
};
const pass=evaluateMainRulesets(active,healthy,repository);
assert.equal(pass.status,'pass');
assert.equal(pass.requiredApprovals,1);
assert.equal(pass.requiredChecks,2);
assert.deepEqual(pass.requiredCheckContexts,[...REQUIRED_MAIN_CHECK_CONTEXTS].sort());
assert.deepEqual(pass.missingRequiredChecks,[]);
assert.equal(pass.strictRequiredStatusChecksPolicy,true);
assert.equal(pass.unrestrictedBypassActors,0);

const weak={
  1:{
    conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
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
assert.ok(warning.gaps.some(item=>item.includes('mode other than pull_request')));

const misleadingNames={
  1:{
    conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
    rules:[
      {type:'pull_request',parameters:{required_approving_review_count:1}},
      {type:'required_status_checks',parameters:{
        required_status_checks:[{context:'Full Platform QA'},{context:'Magnanimous Command Lock'}],
        strict_required_status_checks_policy:true
      }}
    ],
    bypass_actors:[]
  }
};
const misleading=evaluateMainRulesets(active,misleadingNames,repository);
assert.equal(misleading.status,'warning');
assert.deepEqual(misleading.missingRequiredChecks,[...REQUIRED_MAIN_CHECK_CONTEXTS].sort());
assert.ok(misleading.gaps.some(item=>item.includes('Code health and builds')));
assert.ok(misleading.gaps.some(item=>item.includes('verify-command-architecture')));

const missingOne={
  1:{
    conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
    rules:[
      {type:'pull_request',parameters:{required_approving_review_count:1}},
      {type:'required_status_checks',parameters:{
        required_status_checks:[{context:'Code health and builds'}],
        strict_required_status_checks_policy:true
      }}
    ],
    bypass_actors:[]
  }
};
const incomplete=evaluateMainRulesets(active,missingOne,repository);
assert.equal(incomplete.status,'warning');
assert.deepEqual(incomplete.missingRequiredChecks,['verify-command-architecture']);

const notStrict={
  1:{
    ...healthy[1],
    rules:healthy[1].rules.map(rule=>rule.type==='required_status_checks'
      ? {...rule,parameters:{...rule.parameters,strict_required_status_checks_policy:false}}
      : rule)
  }
};
const staleHead=evaluateMainRulesets(active,notStrict,repository);
assert.equal(staleHead.status,'warning');
assert.equal(staleHead.strictRequiredStatusChecksPolicy,false);
assert.ok(staleHead.gaps.some(item=>item.includes('up to date')));

const exemptBypass={
  1:{
    ...healthy[1],
    bypass_actors:[{actor_type:'RepositoryRole',bypass_mode:'exempt'}]
  }
};
const exempt=evaluateMainRulesets(active,exemptBypass,repository);
assert.equal(exempt.status,'warning');
assert.equal(exempt.unrestrictedBypassActors,1);
assert.ok(exempt.gaps.some(item=>item.includes('pull_request')));

const splitRulesets=[
  {...active[0],id:1},
  {...active[0],id:2,name:'Main required checks'}
];
const splitDetails={
  1:{
    conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
    rules:[{type:'pull_request',parameters:{required_approving_review_count:1}}],
    bypass_actors:[]
  },
  2:{
    conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},
    rules:[{type:'required_status_checks',parameters:{
      required_status_checks:REQUIRED_MAIN_CHECK_CONTEXTS.map(context=>({context})),
      strict_required_status_checks_policy:true
    }}],
    bypass_actors:[]
  }
};
const combined=evaluateMainRulesets(splitRulesets,splitDetails,repository);
assert.equal(combined.status,'pass');
assert.equal(combined.activeRulesets,2);
assert.equal(combined.requiredApprovals,1);
assert.equal(combined.requiredChecks,2);

const absent=evaluateMainRulesets([],{},repository);
assert.equal(absent.status,'warning');
const unreadable=evaluateMainRulesets(active,{},repository);
assert.equal(unreadable.status,'manual');

const missingBypassActors={1:{...healthy[1]}};
delete missingBypassActors[1].bypass_actors;
const hiddenBypass=evaluateMainRulesets(active,missingBypassActors,repository);
assert.equal(hiddenBypass.status,'manual');
assert.ok(hiddenBypass.gaps.some(item=>item.includes('bypass-actor list')));

const releaseOnly=[{id:2,name:'Protect releases',target:'branch',source:repository,source_type:'Repository',enforcement:'active'}];
const releaseDetails={2:{conditions:{ref_name:{include:['refs/heads/release/*'],exclude:[]}},rules:[{type:'pull_request'}],bypass_actors:[]}};
const releaseAssessment=evaluateMainRulesets(releaseOnly,releaseDetails,repository);
assert.equal(releaseAssessment.status,'warning');
assert.equal(releaseAssessment.activeRulesets,0);

const excludesMain={2:{conditions:{ref_name:{include:['~ALL'],exclude:['main']}},rules:[{type:'pull_request'}],bypass_actors:[]}};
const excluded=evaluateMainRulesets([{...releaseOnly[0],id:2}],excludesMain,repository);
assert.equal(excluded.status,'warning');
assert.equal(excluded.activeRulesets,0);

console.log('Main ruleset audit assessment: 12 cases passed.');
