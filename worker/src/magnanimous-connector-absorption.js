import { INTEGRATIONS } from './integrations.js';
import { getIntegrationCatalog } from './magnanimous-integration-catalog.js';

// Research ledger for the account connectors that I AM Magnanimous Way can authorize directly.
// These sources describe public API contracts only. They are not copied implementations.
export const DIRECT_CONNECTOR_RESEARCH=Object.freeze({
 google:{docs:['https://developers.google.com/workspace/gmail/api/guides','https://developers.google.com/workspace/gmail/api/guides/sending'],verified_at:'2026-09-19',notes:'Gmail read/send connector. Keep Google account authorization and mailbox data external.'},
 facebook:{docs:['https://developers.facebook.com/docs/pages-api/'],verified_at:'2026-09-19',notes:'Facebook Pages account/data/publishing rail. Magnanimous owns planning, content workflow, verification and learning.'},
 instagram:{docs:['https://developers.facebook.com/docs/instagram-platform/'],verified_at:'2026-09-19',notes:'Instagram professional-account media/profile/comment rail. Account authorization remains external.'},
 whatsapp:{docs:['https://developers.facebook.com/docs/whatsapp/cloud-api/'],verified_at:'2026-09-19',notes:'WhatsApp Business messaging rail. Templates, business account state and message delivery remain provider-side.'},
 shopify:{docs:['https://shopify.dev/docs/api/admin-graphql/latest'],verified_at:'2026-09-19',notes:'Shopify store data/action rail. Product, order and customer workflows are normalized behind Magnanimous contracts.'},
 shopee:{docs:['https://open.shopee.com/'],verified_at:'2026-09-19',notes:'Shopee seller account rail. Native Magnanimous commerce logic must not impersonate Shopee or bypass seller authorization.'},
 x:{docs:['https://docs.x.com/x-api'],verified_at:'2026-09-19',notes:'X public/account API rail for profile/post operations. Current API usage may be metered, so free-first and budget gates remain authoritative.'},
 snapchat:{docs:['https://developers.snap.com/api/marketing-api/'],verified_at:'2026-09-19',notes:'Snapchat Business marketing-account rail. Campaign mutation remains permission and budget controlled.'},
 outlook:{docs:['https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview','https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0'],verified_at:'2026-09-19',notes:'Microsoft Graph mailbox rail. Magnanimous owns message planning, normalization, memory and verification.'},
 slack:{docs:['https://docs.slack.dev/apis/web-api/'],verified_at:'2026-09-19',notes:'Slack workspace read/write rail. Workspace membership, channels and message delivery remain external.'},
 discord:{docs:['https://docs.discord.com/developers/intro'],verified_at:'2026-09-19',notes:'Discord guild/message rail. Guild membership and Discord delivery remain external.'},
 telegram:{docs:['https://core.telegram.org/bots/api'],verified_at:'2026-09-19',notes:'Telegram Bot API rail. Telegram documents a self-hostable local Bot API server, but Telegram network delivery and bot authorization remain external.'},
 'google-calendar':{docs:['https://developers.google.com/workspace/calendar/api/guides/overview','https://developers.google.com/workspace/calendar/api/auth'],verified_at:'2026-09-19',notes:'Google Calendar event/availability rail. Calendar account authorization remains external.'}
});

export const ABSORPTION_POLICY=Object.freeze({
 identity_owner:'Magnanimous AI',
 memory_owner:'Magnanimous AI',
 reasoning_owner:'Magnanimous AI',
 orchestration_owner:'Magnanimous AI',
 learning_owner:'Magnanimous AI',
 verification_owner:'Magnanimous AI',
 proprietary_copying:false,
 allowed_learning:'Observable capability classes, public API contracts, open standards, licensed/open-source components, user-authorized workflows and measured outcomes.',
 forbidden_learning:'Proprietary source code, hidden prompts, private model weights, stolen credentials, restricted datasets, provider secrets or private internals.',
 truth_rule:'A learned capability specification is not the same as a proven native implementation. Native status requires runtime evidence and regression verification.',
 external_rule:'Keep third-party accounts, live provider data, payment/network rails and specialized proprietary compute behind replaceable adapters.'
});

const DIRECT_IDS=new Set(INTEGRATIONS.map(x=>x.id));
const DIRECT_BY_ID=new Map(INTEGRATIONS.map(x=>[x.id,x]));

function words(value){return String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function boundaryFor(item){
 if(DIRECT_IDS.has(item.id))return'authorized-external-account-rail';
 if(['payments','finance-data','local'].includes(item.category))return'external-world-data-or-rail';
 if(['productivity','sales','crm','marketing','commerce','operations','email','calendar','social','messaging','work'].includes(item.category))return'external-account-action-when-live';
 if(item.category==='ai-provider')return'replaceable-compute-engine';
 if(item.category==='deployment'||item.category==='engineering')return'external-repository-or-deployment-target-when-live';
 if(['research','analytics','security'].includes(item.category))return'live-data-adapter-when-current-data-required';
 if(['media','design'].includes(item.category))return'optional-specialized-compute';
 return'none-or-optional-adapter';
}
function ownedParts(){
 return['intent-understanding','input-normalization','planning','policy','memory','workflow','tool-selection','result-normalization','verification','failure-recovery','outcome-learning'];
}
function externalParts(boundary){
 if(boundary==='authorized-external-account-rail'||boundary==='external-account-action-when-live')return['account-authorization','live-account-data','provider-side-write-or-delivery'];
 if(boundary==='external-world-data-or-rail')return['regulated-or-live-external-rail'];
 if(boundary==='replaceable-compute-engine')return['model-compute'];
 if(boundary==='external-repository-or-deployment-target-when-live')return['repository-or-hosting-account'];
 if(boundary==='live-data-adapter-when-current-data-required')return['fresh-external-data'];
 if(boundary==='optional-specialized-compute')return['specialized-generation-compute-when-needed'];
 return[];
}
function capabilityRecipe(item,capability,boundary){
 return{
  id:`${item.id}:${capability}`,
  connector_id:item.id,
  connector_name:item.name,
  category:item.category,
  capability,
  native_target:item.native_target||null,
  priority:item.priority,
  source_kind:DIRECT_IDS.has(item.id)?'live-platform-connector-contract':'plugin-or-provider-benchmark-contract',
  direct_connector:DIRECT_IDS.has(item.id),
  boundary,
  absorption_status:'brain-spec-absorbed',
  implementation_status:'specified-not-assumed-native',
  magnanimous_owned:ownedParts(),
  external_only:externalParts(boundary),
  acceptance_tests:[
   'Provider-independent input and output contract exists.',
   'Magnanimous planning, policy, memory, normalization and verification do not depend on provider branding.',
   'External authorization or live rails remain isolated behind a replaceable adapter when required.',
   'No external action is claimed without a real authorized result.',
   'Native status is granted only after runtime and regression evidence.'
  ],
  recipe:[
   `Understand the user outcome for ${capability} without depending on ${item.name} internals.`,
   'Retrieve Magnanimous memory, approved knowledge and existing native recipes first.',
   'Plan the workflow using Magnanimous-owned reasoning, policy and data contracts.',
   `Prefer the Magnanimous native target ${item.native_target||'for this capability'} when runtime evidence says it is ready.`,
   'If a live account, fresh provider data, network rail or specialized compute is still required, call only the authorized replaceable adapter.',
   'Normalize the result into a stable Magnanimous-owned shape and verify the requested outcome.',
   'Record success, failure, latency, cost and reusable lessons so the native path can improve.'
  ]
 };
}

export function getConnectorAbsorptionCatalog(){
 return getIntegrationCatalog().map(item=>{
  const direct=DIRECT_BY_ID.get(item.id)||null,boundary=boundaryFor(item),research=DIRECT_CONNECTOR_RESEARCH[item.id]||{docs:[],verified_at:'',notes:'Capability benchmark captured from the current connector/plugin contract; provider-specific implementation remains replaceable.'};
  const capabilities=[...new Set([...(item.capabilities||[]),...(direct?.capabilities||[])])];
  return{
   ...item,
   capabilities,
   direct_connector:Boolean(direct),
   direct_contract:direct?{auth:direct.auth,scopes:[...(direct.scopes||[])],capabilities:[...(direct.capabilities||[])],secret_names:[...(direct.env||[])]}:null,
   research,
   absorption:{status:'brain-spec-absorbed',boundary,implementation_status:'specified-not-assumed-native',magnanimous_owned:ownedParts(),external_only:externalParts(boundary)}
  };
 });
}

export function getCapabilityAbsorptionManifest(){
 return getConnectorAbsorptionCatalog().flatMap(item=>(item.capabilities||[]).map(cap=>capabilityRecipe(item,cap,item.absorption.boundary)));
}

export function getConnectorAbsorptionSummary(){
 const catalog=getConnectorAbsorptionCatalog(),manifest=getCapabilityAbsorptionManifest(),directCatalogued=new Set(catalog.filter(x=>x.direct_connector).map(x=>x.id));
 const missingDirect=INTEGRATIONS.filter(x=>!directCatalogued.has(x.id)).map(x=>x.id);
 return{
  identity:'Magnanimous AI',
  connector_benchmarks:catalog.length,
  direct_platform_connectors:INTEGRATIONS.length,
  capability_specs:manifest.length,
  native_targets:[...new Set(catalog.map(x=>x.native_target).filter(Boolean))].sort(),
  direct_connector_coverage:{covered:INTEGRATIONS.length-missingDirect.length,total:INTEGRATIONS.length,missing:missingDirect},
  absorption_policy:ABSORPTION_POLICY,
  status:missingDirect.length?'coverage-gap':'catalog-complete'
 };
}

export function rankAbsorbedCapabilities(goal='',limit=12){
 const terms=words(goal),rows=getCapabilityAbsorptionManifest();
 return rows.map(row=>{
  const hay=words([row.connector_id,row.connector_name,row.category,row.capability,row.native_target].join(' '));
  const score=terms.reduce((n,t)=>n+(hay.some(x=>x.includes(t)||t.includes(x))?1:0),0)+(row.direct_connector?0.2:0);
  return{...row,score};
 }).sort((a,b)=>b.score-a.score||String(a.connector_name).localeCompare(String(b.connector_name))).slice(0,Math.max(1,Math.min(30,Number(limit)||12)));
}

export function getConnectorAbsorptionPrompt(goal=''){
 const ranked=rankAbsorbedCapabilities(goal,10);
 if(!ranked.length)return'';
 const lines=['MAGNANIMOUS ABSORBED CONNECTOR CAPABILITY SPECS:'];
 for(const x of ranked)lines.push(`- ${x.capability} → native target ${x.native_target||'Magnanimous core'}; boundary=${x.boundary}; benchmark=${x.connector_name}.`);
 lines.push('Treat these as Magnanimous-owned workflow/skill specifications, not proof that an external account is connected or that every capability is already fully native. Keep provider-specific accounts and rails replaceable; never copy proprietary internals.');
 return lines.join('\n');
}
