// Magnanimous-owned, deterministic specialist planning. This module does not
// start agents, grant tool permissions, spend funds, or make external calls.
const SPECIALISTS=Object.freeze([
 {id:'prototype-builder',label:'Prototype Builder',group:'engineering',triggers:/\b(prototyp\w*|mvp|build|feature|app|website|ship|launch)\b/i,deliverable:'Smallest independently testable implementation slice.'},
 {id:'systems-architect',label:'Systems Architect',group:'engineering',triggers:/\b(backend|api|database|auth\w*|tenant|worker|cloud|deploy\w*|infrastructure|architecture|telecom|scal\w*)\b/i,deliverable:'Interface, data-boundary and backward-compatibility review.'},
 {id:'ai-engineer',label:'AI Engineer',group:'engineering',triggers:/\b(ai|llm|model\w*|agent\w*|inference|chatbot|voice|transcri\w*|orchestrat\w*)\b/i,deliverable:'Provider-neutral AI contract with evaluation and fallback cases.'},
 {id:'experience-designer',label:'Experience Designer',group:'design',triggers:/\b(ui|ux|design|visual|mobile|accessib\w*|responsiv\w*|creative|layout|screen)\b/i,deliverable:'Accessible interaction and mobile/desktop acceptance criteria.'},
 {id:'growth-strategist',label:'Growth Strategist',group:'business',triggers:/\b(growth|marketing|sales|audience|conversion|seo|acquisition|campaign|ads?)\b/i,deliverable:'Measurable, consent-aware acquisition hypothesis.'},
 {id:'content-producer',label:'Content Producer',group:'creator',triggers:/\b(content|video|post\w*|copywrit\w*|script|blog|newsletter|social|article)\b/i,deliverable:'Source-grounded, brand-safe draft for review.'},
 {id:'evidence-verifier',label:'Evidence Verifier',group:'quality',triggers:null,deliverable:'Independent test and evidence report; rejects unsupported completion claims.'}
]);

const CONSEQUENTIAL_ACTIONS=/\b(pay\w*|billing|stripe|refund|purchase|charge|transfer|delete|erase|remove account|production|deploy\w*|publish\w*|send|email|sms|call|telecom|permission|credential|secret|security policy|firewall|medical|legal|customer data|tenant data)\b/i;

export function planMagnanimousSpecialists(goal){
 if(typeof goal!=='string'||!goal.trim())throw new TypeError('A non-empty goal is required.');
 if(goal.length>4000)throw new RangeError('Goal exceeds the 4000-character planning limit.');
 const objective=goal.replace(/\s+/g,' ').trim();
 const selected=SPECIALISTS.filter(role=>role.triggers?.test(objective));
 if(!selected.length)selected.push(SPECIALISTS[0]);
 selected.push(SPECIALISTS[SPECIALISTS.length-1]);
 const approvalRequired=CONSEQUENTIAL_ACTIONS.test(objective);
 const assignments=selected.map(role=>({
  id:role.id,label:role.label,group:role.group,
  authority:'advisory-only',
  assignment:role.id==='evidence-verifier'?'Challenge assumptions and independently verify every stated outcome.':`Design and review the ${role.group} part of the owner goal.`,
  deliverable:role.deliverable,
  status:'not-started',evidence:[]
 }));
 return{
  identity:'Magnanimous AI',mode:'native-specialist-squad-plan',goal:objective,
  orchestration_owner:'Magnanimous AI',memory_owner:'Magnanimous AI',
  selection:'minimum-relevant-specialists-plus-independent-verifier',
  execution_state:'plan-only',third_party_agent_calls_in_planner:0,paid_operations_started:0,
  specialists:assignments,
  workflow:[
   {stage:'scope',owner:'magnanimous-brain',output:'Specific acceptance criteria, impacted surfaces, permission and cost boundary.'},
   ...assignments.filter(x=>x.id!=='evidence-verifier').map(x=>({stage:'specialist-review',owner:x.id,output:x.deliverable})),
   {stage:'independent-verification',owner:'evidence-verifier',output:'Observed tests, failures, coverage gaps and reproducible evidence.'},
   {stage:'owner-release-gate',owner:'magnanimous-brain',output:'Only verified, authorized results can be considered for promotion.'}
  ],
  risk:{consequential_action_possible:approvalRequired,requires_existing_authorization_gates:true,
   external_write_allowed:false,production_change_allowed:false,spending_allowed:false,
   reason:approvalRequired?'Potentially consequential action mentioned; existing owner, tenant, payment and deployment controls remain binding.':'Read-only planning does not grant any future execution authority.'},
  verification:{decision:'NEEDS_EVIDENCE',production_verified:false,approved_for_release:false,
   required:['Relevant tests with observed results','Permission and tenant-boundary review','Regression review of existing behavior','Exact deployed revision and environment evidence before a live claim']},
  provenance:{design:'Original Magnanimous implementation inspired by the public specialist-team concept; no third-party prompts installed.',source:'https://github.com/msitarzewski/agency-agents',license_of_reference:'MIT'}
 };
}

export function listMagnanimousSquadRoles(){return SPECIALISTS.map(({triggers,...role})=>({...role,authority:'advisory-only'}));}
