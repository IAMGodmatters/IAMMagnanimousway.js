import assert from 'node:assert/strict';
import {
  ADVANCED_CONTACT_CENTER_CAPABILITIES,
  evaluateHotdeskPolicy,
  evaluateOfficeHours,
  planPredictiveDialing,
  planScheduledCallback,
  summarizeContactCenterReport,
  validateCallFlow
} from '../../worker/src/magnanimous-contact-center-advanced.js';

assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.identity.brain==='Magnanimous AI','Magnanimous AI must remain the brain');
assert(/replaceable adapters/i.test(ADVANCED_CONTACT_CENTER_CAPABILITIES.identity.provider_policy),'outside providers must remain replaceable adapters');
assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.outbound.planning.includes('predictive'),'predictive planning capability must remain declared');
assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.devices.includes('hot_desking'),'hot-desking capability must remain declared');
assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.schedules.includes('department_office_hours'),'department office-hours capability must remain declared');
assert(ADVANCED_CONTACT_CENTER_CAPABILITIES.workflows.components.includes('webhook'),'declarative workflow webhook component must remain supported');

const predictive=planPredictiveDialing({
  optimization:'agents',
  available_agents:5,
  active_agent_calls:2,
  estimated_answer_rate:0.5,
  max_concurrent_outbound:10,
  per_minute_cap:10,
  max_overdial_ratio:1.25,
  campaign_enabled:true,
  consent_verified:true,
  dnc_clear:true,
  within_calling_window:true,
  holiday_blocked:false,
  spend_cap_ok:true,
  carrier_ready:true,
  spend_remaining_micro:1000000,
  estimated_setup_cost_micro:1000
});
assert.equal(predictive.planning_allowed,true,'predictive planning must be allowed only when all compliance gates pass');
assert.equal(predictive.execution_authorized,false,'predictive planning must never directly authorize execution');
assert(predictive.recommended_dials>0,'predictive planner should recommend bounded calls when agents are free and gates pass');

for(const [field,reason] of [
  ['consent_verified','CONSENT_NOT_VERIFIED'],
  ['dnc_clear','DNC_NOT_CLEARED'],
  ['within_calling_window','OUTSIDE_CALLING_WINDOW'],
  ['spend_cap_ok','SPEND_CAP_NOT_CONFIRMED'],
  ['carrier_ready','CARRIER_NOT_READY']
]){
  const input={
    optimization:'agents',available_agents:5,active_agent_calls:0,estimated_answer_rate:0.5,max_concurrent_outbound:10,per_minute_cap:10,
    campaign_enabled:true,consent_verified:true,dnc_clear:true,within_calling_window:true,holiday_blocked:false,spend_cap_ok:true,carrier_ready:true
  };
  input[field]=false;
  const blocked=planPredictiveDialing(input);
  assert.equal(blocked.recommended_dials,0,`predictive planner must fail closed when ${field} fails`);
  assert(blocked.blocked_by.includes(reason),`predictive planner must report ${reason}`);
}
const holidayBlocked=planPredictiveDialing({campaign_enabled:true,consent_verified:true,dnc_clear:true,within_calling_window:true,holiday_blocked:true,spend_cap_ok:true,carrier_ready:true,available_agents:3});
assert.equal(holidayBlocked.recommended_dials,0,'holiday block must stop predictive planning');
assert(holidayBlocked.blocked_by.includes('HOLIDAY_BLOCK'),'holiday block must be explicit');

const schedule={
  now:'2026-10-19T10:00:00Z',
  time_zone:'UTC',
  hours:{mon:[{start:'09:00',end:'17:00'}]},
  breaks:{mon:[{start:'12:00',end:'13:00'}]},
  holidays:[]
};
assert.equal(evaluateOfficeHours(schedule).mode,'open','office-hours planner must recognize an open destination window');
assert.equal(evaluateOfficeHours({...schedule,now:'2026-10-19T12:30:00Z'}).mode,'break','office-hours planner must recognize break windows');
assert.equal(evaluateOfficeHours({...schedule,holidays:['2026-10-19']}).mode,'holiday','holiday routing must override normal office hours');
assert.equal(evaluateOfficeHours({...schedule,override:{mode:'closed',until:'2026-10-19T11:00:00Z'}}).mode,'closed','temporary override must take priority while valid');
assert.equal(evaluateOfficeHours({...schedule,now:'2026-10-19T18:00:00Z'}).mode,'closed','outside-hours traffic must route closed');

assert.equal(evaluateHotdeskPolicy({emergency_call:true},{role:'member'}).allowed,true,'idle hot-desk devices must allow emergency planning');
assert.equal(evaluateHotdeskPolicy({requested_user_id:'u1',user_allowed:true,credential_verified:false},{id:'u1'}).allowed,false,'hot-desk login must require authentication');
assert.equal(evaluateHotdeskPolicy({requested_user_id:'u1',user_allowed:true,credential_verified:true},{id:'u1'}).allowed,true,'authorized authenticated hot-desk user should pass planning policy');
assert.equal(evaluateHotdeskPolicy({requested_user_id:'u2',current_user_id:'u1',user_allowed:true,credential_verified:true,explicit_takeover:false},{id:'u2'}).allowed,false,'occupied hot-desk takeover must be explicit');
const takeover=evaluateHotdeskPolicy({requested_user_id:'u2',current_user_id:'u1',user_allowed:true,credential_verified:true,explicit_takeover:true},{id:'u2'});
assert.equal(takeover.allowed,true,'explicit authenticated hot-desk takeover should pass policy');
assert.equal(takeover.force_logout_previous,true,'explicit takeover must identify previous-session logout');

const goodFlow=validateCallFlow({
  nodes:[
    {id:'start',type:'start',config:{}},
    {id:'menu',type:'menu',config:{}},
    {id:'hook',type:'webhook',config:{url:'https://example.invalid/hook',binding_ref:'vault:contact-center-webhook'}},
    {id:'end',type:'hangup',config:{}}
  ],
  edges:[{from:'start',to:'menu'},{from:'menu',to:'hook'},{from:'hook',to:'end'}]
});
assert.equal(goodFlow.valid,true,'declarative call flow with a generic vault binding reference should validate');
assert.equal(goodFlow.execution_authorized,false,'call-flow validation must not authorize execution');

const rawCodeFlow=validateCallFlow({nodes:[{id:'start',type:'start',config:{}},{id:'code',type:'execute_code',config:{}}],edges:[{from:'start',to:'code'}]});
assert.equal(rawCodeFlow.valid,false,'raw executable code must be rejected from call flows');
assert(rawCodeFlow.errors.some(error=>error.startsWith('UNSUPPORTED_NODE_TYPE')),'raw-code flow must report unsupported node type');

const rawSecretFlow=validateCallFlow({nodes:[{id:'start',type:'start',config:{}},{id:'hook',type:'webhook',config:{url:'https://example.invalid/hook',password:'secret'}}],edges:[{from:'start',to:'hook'}]});
assert.equal(rawSecretFlow.valid,false,'embedded credentials must be rejected from call flows');
assert(rawSecretFlow.errors.some(error=>error.startsWith('RAW_SECRET_NOT_ALLOWED')),'embedded flow secret must be rejected');

const insecureUrlFlow=validateCallFlow({nodes:[{id:'start',type:'start',config:{}},{id:'hook',type:'webhook',config:{url:'http://example.invalid/hook'}}],edges:[{from:'start',to:'hook'}]});
assert.equal(insecureUrlFlow.valid,false,'non-HTTPS external workflow requests must be rejected');
assert(insecureUrlFlow.errors.some(error=>error.startsWith('HTTPS_REQUIRED')),'insecure webhook URL must be reported');

const callback=planScheduledCallback({requested_at:'2026-10-20T10:00:00Z',now:'2026-10-19T10:00:00Z',consent_verified:true,dnc_clear:true,carrier_ready:true,spend_cap_ok:true});
assert.equal(callback.scheduled,true,'future compliant callback should be eligible for scheduling');
assert.equal(callback.execution_authorized,false,'callback planner must not directly authorize dialing');
assert.equal(planScheduledCallback({requested_at:'2026-10-18T10:00:00Z',now:'2026-10-19T10:00:00Z',consent_verified:true,dnc_clear:true,carrier_ready:true,spend_cap_ok:true}).scheduled,false,'past callbacks must be rejected');
assert.equal(planScheduledCallback({requested_at:'2026-10-20T10:00:00Z',now:'2026-10-19T10:00:00Z',consent_verified:false,dnc_clear:true,carrier_ready:true,spend_cap_ok:true}).scheduled,false,'callbacks without verified consent must fail closed');

const report=summarizeContactCenterReport({sla_target_ms:20000,calls:[
  {status:'answered',wait_ms:10000,handle_ms:60000,wrap_ms:5000},
  {status:'completed',wait_ms:25000,handle_ms:120000,wrap_ms:10000},
  {status:'abandoned',wait_ms:40000,handle_ms:0,wrap_ms:0}
]});
assert.equal(report.offered,3,'report must count offered calls');
assert.equal(report.answered,2,'report must count answered/completed calls');
assert.equal(report.abandoned,1,'report must count abandoned calls');
assert.equal(report.sla_pct,50,'report must calculate answered-call SLA percent');
assert.equal(report.avg_wait_ms,25000,'report must calculate average wait time');

console.log('Contact-center operations depth lock PASS');
