import { currentUser } from './integrations.js';
import { handleMagnanimousDevAgent } from './magnanimous-dev-agent.js';
import { githubRepositoryAuthConfigured } from './magnanimous-github-app-auth.js';
import { hasReadyLocalBridge, findReadyLocalBridgeDevice, handleMagnanimousLocalBridge } from './magnanimous-local-bridge-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(v,n=4000)=>String(v??'').trim().slice(0,n);

export const OGENIC_SKILL_SNAPSHOT=Object.freeze({
  source:'installed @OGENIC GOD TOOLKIT skill contracts',
  captured_at:'2026-09-19',
  identity_owner:'Magnanimous AI',
  implementation_owner:'Magnanimous',
  proprietary_implementation_copied:false,
  skills:[
    {id:'god-mode',capabilities:['cloud-local-hybrid-classification','tool-discovery','surface-selection','sequencing','read-before-write','scoped-change','verification','secret-routing','git-safety','auto-network-direction']},
    {id:'ogenic-god-toolkit',capabilities:['auto-route-code-skill','auto-route-code-system','auto-route-code-delivery','auto-route-code-website','minimum-group-selection','cross-group-chaining']},
    {id:'netwalk',capabilities:['authorized-network-survey','iterative-frontier-crawl','coverage-accounting','read-only-diagnostics','topology-map','full-and-public-report']},
    {id:'netwalk-login',capabilities:['local-credential-form','secret-non-disclosure','reachability-question-batching','credential-probe-without-secret-readback']},
    {id:'netwalk-scan',capabilities:['lldp-cdp-mndp-arp-dhcp-routing-mac-discovery','authorized-subnet-sweep','unidentified-host-accounting','topology-derivation','evidence-log']},
    {id:'netwalk-diag',capabilities:['config-export-to-private-file','health-telemetry','evidence-first-findings','counter-normalization-by-uptime','hardening-catalog','severity-confidence-recommendations']},
    {id:'netwalk-map',capabilities:['deterministic-topology-svg','wan-separation','port-labeling','inference-marking','ap-grouping','health-chips']},
    {id:'netwalk-fullreport',capabilities:['self-contained-html-report','full-vs-public-output','secret-sweep','coverage-disclosure','evidence-and-recommendations','sensitive-artifact-closeout']}
  ]
});

export const OGENIC_CAPABILITY_GROUPS=Object.freeze([
 {id:'code-skill',name:'Code Skill',capabilities:['request-classification','tool-discovery','orchestration','sequencing','verification']},
 {id:'code-system',name:'Code System',capabilities:['workspace-inspection','files','patching','git','dev','test','lint','typecheck','build','processes','shell','delegated-coding','health']},
 {id:'code-delivery',name:'Code Delivery',capabilities:['github-ci-cd','deployment','scheduler','authenticated-webhooks','outbound-http','connectors','deployment-verification']},
 {id:'code-website',name:'Code Website',capabilities:['browser-dom','accessibility','input','vision','window-control','website-operation','cloudflare','web-deployment']}
]);

export const GOD_MODE_TOOL_FAMILIES=Object.freeze([
 {id:'workspace',tools:['workspace_*'],cloud:'GitHub/Drive/Notion/hosted workspace',local:'approved local workspace bridge',fallback:'CONNECTOR_REQUIRED_OR_LOCAL_BRIDGE_REQUIRED'},
 {id:'files',tools:['read_file','search_text','apply_patch'],cloud:'repository/workspace file API',local:'sandboxed local filesystem bridge',fallback:'READ_ONLY_GUIDANCE'},
 {id:'git',tools:['git_status','git_diff','git_log'],cloud:'GitHub state/commits/PRs',local:'local Git bridge',fallback:'CLOUD_STATE_ONLY'},
 {id:'project-lifecycle',tools:['project_dev','test','lint','typecheck','build'],cloud:'CI/hosted runner',local:'local process bridge',fallback:'EXECUTION_SURFACE_REQUIRED'},
 {id:'process',tools:['process_*','shell','codex_run'],cloud:'hosted runner/authorized automation',local:'local process bridge',fallback:'EXECUTION_SURFACE_REQUIRED'},
 {id:'browser-ui',tools:['dom_cdp','accessibility','input_event','vision','window'],cloud:'connected cloud browser',local:'local browser/UI bridge',fallback:'LOCAL_BRIDGE_REQUIRED_OR_PUBLIC_READ_ONLY'},
 {id:'documents-device',tools:['office','clipboard','file_dialog','screen_record','audio'],cloud:'connected document/media tools',local:'local device bridge',fallback:'ATTACHMENT_OR_LOCAL_BRIDGE_REQUIRED'},
 {id:'automation',tools:['notification','scheduler','web_fetch'],cloud:'automations/webhooks/outbound HTTP',local:'local notifier/scheduler/http client',fallback:'CONFIGURATION_REQUIRED'},
 {id:'system',tools:['system_info','health'],cloud:'connected service health',local:'local machine health bridge',fallback:'LOCAL_BRIDGE_REQUIRED_FOR_LOCAL_HEALTH'}
]);

export const OGENIC_STATUS=Object.freeze([
 'READY_CLOUD','READY_LOCAL','READY_HYBRID','CONNECTOR_REQUIRED','LOCAL_BRIDGE_REQUIRED',
 'EXECUTION_SURFACE_REQUIRED','CONFIGURATION_REQUIRED','REVERSIBLE_ALTERNATIVE_REQUIRED'
]);

export const OGENIC_INITIATIVE_POLICY=Object.freeze({
 default:'suggest-and-initiate-safe-actions',
 auto_initiate:['read','inspect','search','status','health-check','plan','diff-review','non-mutating-verification'],
 execution_if_surface_ready:['test','lint','typecheck','build','read-only-http','deployment-status'],
 stage_not_execute:['patch','edit','refactor','create-branch','create-pr','configuration-change'],
 approval_gated:['merge','deploy-production','publish','send-message','external-call','payment','delete','credential-change','security-policy-change'],
 never_inline_secrets:true,
 read_before_write:true,
 preserve_unrelated_work:true,
 verify_after_write:true,
 default_branch_protected:true,
 stop_after_verified_result:true
});

export const NETWALK_NATIVE_CONTRACT=Object.freeze({
 mode:'read-only-network-survey',
 status_without_local_bridge:'LOCAL_BRIDGE_REQUIRED',
 guarantees:[
  'Every device command must pass a read-only vendor allowlist before execution.',
  'Credentials must never enter Magnanimous chat or model context; collect them only through a local credential UI/secret manager.',
  'Address-range sweeps require recorded owner authorization and exact scope.',
  'Unreachable, unidentified, skipped and out-of-scope devices remain explicit coverage results.',
  'Configuration exports stay on the local survey machine and are never copied into chat or reports.',
  'Every finding requires evidence, confidence, severity and an actionable recommendation.',
  'Topology and reports render from one structured record; do not hand-edit generated artifacts.',
  'Public reports hide sensitive operational detail and never imply completeness beyond measured coverage.'
 ],
 stages:['scope','credential-ui','scan-loop','diagnose','map','full-report','closeout'],
 vendors:['MikroTik','Cisco','Aruba','HP','Fortinet','Juniper','Ubiquiti','Linux','Windows','UniFi','Omada']
});

function has(text,re){return re.test(String(text||'').toLowerCase())}
function requestGroups(goal){
 const g=String(goal||'').toLowerCase(),groups=new Set(['code-skill']);
 if(/code|repo|repository|file|patch|edit|fix|bug|test|lint|typecheck|build|shell|process|git|commit|branch|refactor|workspace/.test(g))groups.add('code-system');
 if(/deploy|release|ci|cd|github|workflow|webhook|schedule|cron|connector|domain|dns|publish/.test(g))groups.add('code-delivery');
 if(/website|browser|page|dom|click|form|ui|ux|screen|cloudflare|frontend|web app/.test(g))groups.add('code-website');
 if(groups.size===1&&/document|spreadsheet|pdf|office|clipboard|audio|record/.test(g))groups.add('code-system');
 return[...groups];
}
function classifyMode(goal){
 const g=String(goal||'').toLowerCase();
 const local=/local computer|my computer|desktop|windows app|native app|clipboard|microphone|screen record|local network|lan|router|switch|wifi|wi-fi|netwalk/.test(g);
 const cloud=/github|cloud|website|browser|api|webhook|deploy|drive|notion|email|calendar|slack|shopify|server|ci|cd/.test(g);
 return local&&cloud?'HYBRID':local?'LOCAL':'CLOUD';
}
function consequence(goal){
 const g=String(goal||'').toLowerCase();
 if(/password|secret|api key|token|credential/.test(g))return'credential-ui-required';
 if(/delete|remove permanently|destroy|wipe|revoke|rotate/.test(g))return'approval-gated';
 if(/payment|charge|refund|purchase|buy|subscribe/.test(g))return'approval-gated';
 if(/publish|send|message|email|call|dial|merge|deploy production|release production/.test(g))return'approval-gated';
 if(/edit|patch|fix|refactor|write|create|update|commit|branch|pull request|pr\b/.test(g))return'stage-not-execute';
 if(/test|lint|typecheck|build|health|status/.test(g))return'execution-if-surface-ready';
 return'auto-initiate';
}
function surfaceStatus(goal,env={}){
 const mode=classifyMode(goal),localReady=Boolean(env?.MAGNANIMOUS_LOCAL_BRIDGE_READY||env?.MAGNANIMOUS_LOCAL_BRIDGE_URL),repoReady=githubRepositoryAuthConfigured(env);
 if(mode==='LOCAL'&&!localReady)return'LOCAL_BRIDGE_REQUIRED';
 if(mode==='HYBRID'&&!localReady)return repoReady?'LOCAL_BRIDGE_REQUIRED':'CONNECTOR_REQUIRED';
 if(mode==='LOCAL'&&localReady)return'READY_LOCAL';
 if(mode==='HYBRID'&&localReady&&repoReady)return'READY_HYBRID';
 if(repoReady||/web|http|browser|website/.test(String(goal||'').toLowerCase()))return'READY_CLOUD';
 return'CONFIGURATION_REQUIRED';
}
function isNetwalk(goal){return /netwalk|network survey|network audit|scan (?:my |the )?(?:lan|network|site)|router health|switch health|topology map/.test(String(goal||'').toLowerCase())}

export function buildMagnanimousOgenicPlan(goal,env={}){
 const text=clip(goal,4000),mode=classifyMode(text),groups=requestGroups(text),initiative=consequence(text),localReady=Boolean(env?.MAGNANIMOUS_LOCAL_BRIDGE_READY||env?.MAGNANIMOUS_LOCAL_BRIDGE_URL),status=isNetwalk(text)&&!localReady?'LOCAL_BRIDGE_REQUIRED':surfaceStatus(text,env);
 const selected=OGENIC_CAPABILITY_GROUPS.filter(x=>groups.includes(x.id));
 const actions=[
  {step:'inspect',initiative:'auto-initiate',instruction:'Resolve the exact target and inspect the minimum current state before proposing a change.'},
  {step:'plan',initiative:'auto-initiate',instruction:'Select the minimum capability groups and execution surfaces needed; reuse existing state and tools.'},
  {step:'execute',initiative,status,instruction:initiative==='auto-initiate'?'Initiate the safe available action now and capture evidence.':initiative==='execution-if-surface-ready'?'Run the verification/build action when an execution surface is connected; otherwise return the exact missing surface.':initiative==='stage-not-execute'?'Prepare or stage the smallest reversible change through the existing approval/write boundary.':initiative==='credential-ui-required'?'Route secret entry to an approved credential UI/secret manager; never accept or echo secret values in chat.':'Use the existing confirmation/approval boundary before the consequential action.'},
  {step:'verify',initiative:'auto-initiate',instruction:'Verify the result using diffs, tests, status re-fetch, receipts or other direct evidence; never claim success from intent alone.'}
 ];
 return{
  identity:'Magnanimous AI',
  source_pattern:'OGENIC GOD TOOLKIT absorbed as original Magnanimous orchestration contracts',
  goal:text,
  classification:mode,
  groups:selected,
  status,
  initiative,
  actions,
  netwalk:isNetwalk(text)?NETWALK_NATIVE_CONTRACT:null,
  network_direction:/webhook|event|callback/.test(text.toLowerCase())?'INBOUND_OR_HYBRID':'OUTBOUND_BY_DEFAULT',
  inbound_controls:['HTTPS','authentication-or-signature','replay-protection','rate-limit','audit-log','disable-switch'],
  truth_boundary:'The plan may initiate only through an actually connected Magnanimous execution surface. Missing local/browser/account capability is reported explicitly and is never simulated.'
 };
}

export function getMagnanimousOgenicPrompt(goal=''){
 const plan=buildMagnanimousOgenicPlan(goal,{});
 return `MAGNANIMOUS GOD TOOLKIT MODE
Magnanimous AI owns the identity, memory, policy, orchestration, learning and verification.
Classify work as CLOUD, LOCAL or HYBRID. Use the minimum required groups: Code Skill, Code System, Code Delivery, Code Website.
Be suggestive and initiative-driven: do not stop at advice when a safe connected action can be performed. Auto-initiate reads, inspection, planning and non-mutating verification. Run tests/lint/typecheck/build when an execution surface is actually available. Stage scoped code/config changes; keep merges, production deploys, publishing, messages/calls, payments, destructive actions, credentials and security-policy changes behind their existing confirmation/approval gates.
Read before write, preserve unrelated work, prefer append/versioned changes, protect the default branch, verify after writes, and stop after verification.
If cloud access is missing say CONNECTOR_REQUIRED. If native-computer control or network surveying needs a local bridge say LOCAL_BRIDGE_REQUIRED. If execution cannot run say EXECUTION_SURFACE_REQUIRED. Never simulate success.
For inbound webhooks require HTTPS, auth/signature validation, replay protection, rate limiting, audit logging and a disable switch.
Netwalk-style network work is read-only: no credentials in chat, no unauthorized range sweep, no config changes, evidence for every finding, honest coverage, deterministic map/report from one record.
Current route suggestion: classification=${plan.classification}; groups=${plan.groups.map(x=>x.name).join(', ')}; initiative=${plan.initiative}.`;
}

async function authUser(request,env){
 const user=await currentUser(request,env).catch(()=>null);
 return user||null;
}
async function initiateDeveloperPlan(request,env,goal,body){
 const url=new URL('/api/magnanimous/dev-agent/plan',request.url);
 const headers=new Headers(request.headers);headers.set('content-type','application/json');
 const nested=new Request(url.toString(),{method:'POST',headers,body:JSON.stringify({repo:clip(body.repo,300)||'IAMGodmatters/IAMMagnanimousway.js',ref:clip(body.ref,120)||'main',goal})});
 return handleMagnanimousDevAgent(nested,env);
}

function localActionForGoal(goal,body={}){
 const g=String(goal||'').toLowerCase();
 if(/system info|computer info|machine info/.test(g))return'system_info';
 if(/health|disk space|computer status|machine status/.test(g))return'health';
 if(/git status/.test(g))return'git_status';
 if(/git diff|show diff/.test(g))return'git_diff';
 if(/git log|commit history/.test(g))return'git_log';
 if(/\btypecheck\b|type check/.test(g))return'project_typecheck';
 if(/\blint\b/.test(g))return'project_lint';
 if(/\btest(?:s|ing)?\b/.test(g))return'project_test';
 if(/\bbuild\b/.test(g))return'project_build';
 if(/netwalk.*probe|probe.*(?:router|switch|device)/.test(g))return'netwalk_probe';
 if(/netwalk.*(?:survey|scan)|(?:survey|scan).*(?:lan|network)/.test(g))return'netwalk_scan';
 if(/netwalk.*diag|diagnos.*(?:router|switch|network)/.test(g))return'netwalk_diag';
 if(/topology map|netwalk.*map/.test(g))return'netwalk_map';
 if(/netwalk.*report|network report/.test(g))return'netwalk_report';
 if(/apply patch|patch (?:the )?(?:file|code)/.test(g)&&body?.local_payload?.patch)return'apply_patch';
 if(/create (?:a )?(?:git )?branch/.test(g)&&body?.local_payload?.branch)return'git_create_branch';
 if(/git commit|commit (?:the )?(?:changes|files)/.test(g)&&body?.local_payload?.message)return'git_commit';
 if(/fetch (?:the )?(?:url|page)|web fetch/.test(g)&&body?.local_payload?.url)return'web_fetch';
 return'';
}
async function initiateLocalBridgeAction(request,env,user,goal,body={}){
 const action=localActionForGoal(goal,body);if(!action)return null;
 const device=await findReadyLocalBridgeDevice(env,user.tenant_id,action);
 if(!device)return json({ok:false,initiated:false,code:'LOCAL_CAPABILITY_NOT_READY',action,detail:'A local bridge is online, but no paired device currently advertises this exact capability.'},409);
 const payload={...(body.local_payload||{})};
 if(body.workspace&&!payload.workspace)payload.workspace=body.workspace;
 const headers=new Headers(request.headers);headers.set('content-type','application/json');
 const nested=new Request(new URL('/api/magnanimous/local-bridge/tasks',request.url),{method:'POST',headers,body:JSON.stringify({device_id:device.id,action,payload})});
 const response=await handleMagnanimousLocalBridge(nested,env),data=await response.clone().json().catch(()=>({}));
 return json({ok:response.ok,initiated:response.ok&&!data.requires_confirmation,initiative:'local-bridge-task',device:{id:device.id,name:device.name,platform:device.platform},action,task:data,truth_boundary:data.requires_confirmation?'The exact local mutation is staged and still requires separate owner confirmation.':'The action is queued only because a paired device explicitly advertises this capability.'},response.status);
}

export async function handleMagnanimousOgenic(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/ogenic'))return null;
 const user=await authUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 const anyLocalBridgeReady=await hasReadyLocalBridge(env,user.tenant_id);
 if(request.method==='GET'&&path==='/api/magnanimous/ogenic')return json({
  identity:'Magnanimous AI',mode:'native-ogenic-god-toolkit',skills:OGENIC_SKILL_SNAPSHOT,groups:OGENIC_CAPABILITY_GROUPS,tool_families:GOD_MODE_TOOL_FAMILIES,status_vocabulary:OGENIC_STATUS,initiative_policy:OGENIC_INITIATIVE_POLICY,netwalk:NETWALK_NATIVE_CONTRACT,local_bridge:{ready:anyLocalBridgeReady,transport:'outbound-only'},
  note:'OGENIC observable capability patterns are absorbed into Magnanimous. Proprietary implementation is not copied; real external/local execution still requires the corresponding authorized surface.'
 });
 if(request.method==='POST'&&path==='/api/magnanimous/ogenic/plan'){
  const body=await request.json().catch(()=>({})),goal=clip(body.goal,4000);
  if(!goal)return json({detail:'Goal is required.'},400);
  const requiredAction=localActionForGoal(goal,body),capableDevice=requiredAction?await findReadyLocalBridgeDevice(env,user.tenant_id,requiredAction):null;
  const localBridgeReady=requiredAction?Boolean(capableDevice):anyLocalBridgeReady,runtimeEnv=localBridgeReady?{...env,MAGNANIMOUS_LOCAL_BRIDGE_READY:true}:env;
  return json({ok:true,plan:buildMagnanimousOgenicPlan(goal,runtimeEnv),local_bridge:{ready:localBridgeReady,required_action:requiredAction||null,device:capableDevice?{id:capableDevice.id,name:capableDevice.name}:null}});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/ogenic/initiate'){
  const body=await request.json().catch(()=>({})),goal=clip(body.goal,4000);
  if(!goal)return json({detail:'Goal is required.'},400);
  const requiredAction=localActionForGoal(goal,body),capableDevice=requiredAction?await findReadyLocalBridgeDevice(env,user.tenant_id,requiredAction):null;
  const localBridgeReady=requiredAction?Boolean(capableDevice):anyLocalBridgeReady,runtimeEnv=localBridgeReady?{...env,MAGNANIMOUS_LOCAL_BRIDGE_READY:true}:env;
  const plan=buildMagnanimousOgenicPlan(goal,runtimeEnv);
  if((plan.classification==='LOCAL'||plan.classification==='HYBRID')&&localBridgeReady){
   const local=await initiateLocalBridgeAction(request,env,user,goal,body);if(local)return local;
  }
  if(plan.netwalk&&!localBridgeReady)return json({ok:false,initiated:false,plan,code:'LOCAL_BRIDGE_REQUIRED',detail:'Netwalk requires a paired online bridge that explicitly advertises the required Netwalk capability. No scan was simulated.'},409);
  if(plan.groups.some(x=>x.id==='code-system')&&githubRepositoryAuthConfigured(env)){
   const response=await initiateDeveloperPlan(request,env,goal,body);
   const data=await response.clone().json().catch(()=>({}));
   return json({ok:response.ok,initiated:response.ok,initiative:'developer-plan',plan,result:data,truth_boundary:'Repository planning/inspection may begin immediately; writes remain staged/approval-gated by Magnanimous Dev Agent.'},response.status);
  }
  return json({ok:false,initiated:false,plan,code:plan.status,detail:plan.status==='READY_CLOUD'?'A cloud capability was identified, but this generic initiator does not guess an account/action payload. Route the exact task through the corresponding connected Magnanimous tool.':`Action not initiated: ${plan.status}.`},409);
 }
 return json({detail:'Magnanimous OGENIC route not found.'},404);
}
