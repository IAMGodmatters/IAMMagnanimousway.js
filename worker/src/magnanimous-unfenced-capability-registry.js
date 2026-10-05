const VERIFIED_AT='2026-10-05';

export const UNFENCED_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'Unfenced.ai',
  source_kind:'official-public-product-documentation-and-legal-contracts',
  sources:[
    'https://unfenced.ai/',
    'https://unfenced.ai/docs',
    'https://unfenced.ai/behind-login',
    'https://unfenced.ai/legal',
    'https://unfenced.ai/legal/terms-of-service',
    'https://unfenced.ai/legal/acceptable-use-policy',
    'https://unfenced.ai/legal/privacy-policy',
    'https://unfenced.ai/legal/data-processing-addendum',
    'https://unfenced.ai/legal/subprocessors'
  ],
  boundary:'Unfenced public behavior is a capability benchmark only. Magnanimous does not copy Unfenced source code, private browser infrastructure, hidden prompts, proprietary anti-bot implementation, credential material, private datasets, residential proxy supply chain, or other non-public internals.',
  availability_note:'Unfenced describes itself as a private-preview experimental service. Publicly documented behavior is not treated as proof of production SLA, universal site compatibility, or availability to every user.',
  observed_contracts:[
    'URL-to-clean-content reading through a real browser',
    'markdown, JSON, text and HTML output choices',
    'tiered fetch behavior',
    'live-page open/observe/act workflows for clicks and forms',
    'signed-in session workflows without exposing stored secret values to the model',
    'MCP plus HTTP/SDK access patterns',
    'API-key and OAuth authentication patterns',
    'site permission / delegated-authority constraints',
    'real-IP / residential-egress positioning',
    'signed hash-chained receipt positioning'
  ]
});

const OWNED=Object.freeze([
  'intent-understanding','planning','reasoning-policy','memory-policy','workflow-orchestration',
  'source-selection','tool-selection','permission-policy','result-normalization','verification',
  'failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['public-url-fetch','Fetch a public URL for agent use','native-web-browser','fresh-public-internet-data','URL validation; public fetch; redirects; bounded response; normalized result','low'],
  ['clean-readable-content','Convert fetched pages into clean agent-readable content','knowledge-workspace','fresh-public-internet-data','content extraction; boilerplate reduction; readable text; metadata preservation','low'],
  ['javascript-rendered-fetch','Read JavaScript-rendered pages through a real browser','native-web-browser','fresh-public-internet-data-and-browser-egress','Chromium rendering; wait for DOM; extract text; links; structured fields','low'],
  ['pdf-as-readable-source','Read public PDF content as a source for agent workflows','knowledge-workspace','fresh-public-document-data','document retrieval; text extraction; source metadata; evidence preservation','low'],
  ['tiered-fetch-routing','Escalate fetch effort according to page difficulty and required interaction','operations-hub','fresh-public-internet-data-and-optional-proxy-capacity','fast path; rendered path; interactive path; failure-aware escalation; cost control','low'],
  ['multi-format-fetch-output','Return fetched content in markdown, JSON, text or HTML-like normalized formats','knowledge-workspace','fresh-public-internet-data','format negotiation; normalized content; structured response; HTML preservation when explicitly requested','low'],
  ['mcp-read-and-act','Expose browser reading and bounded actions through MCP-compatible tool contracts','universal-tool-gateway','authorized-external-tool-rail-when-required','MCP discovery; schemas; read tools; action tools; normalized results; audit','medium'],
  ['http-sdk-access','Expose browser capability through provider-neutral HTTP/SDK contracts','universal-tool-gateway','authorized-external-network-rail-when-required','HTTP request contract; authentication; structured errors; stable response schema','medium'],
  ['api-key-and-oauth-auth','Support API-key and OAuth-style connector authentication patterns','universal-tool-gateway','authorized-external-account-rail','credential reference; OAuth state; scoped authorization; token isolation','medium'],
  ['live-page-open','Open a live page in a persistent browser session','native-web-browser','fresh-public-internet-data-and-owner-browser-capacity','session start; navigate; page state; profile selection; session lifecycle','medium'],
  ['page-observation','Observe controls and page state before acting','native-web-browser','fresh-public-internet-data-and-owner-browser-capacity','snapshot; elements; labels; roles; links; current URL; page title','low'],
  ['referenced-element-actions','Target page controls using bounded element references or stable locators','native-web-browser','authorized-external-site-action','element targeting; click; fill; select; press; stale-target handling; verification','high'],
  ['form-and-click-workflows','Perform bounded multi-step clicks and form actions after permission checks','native-web-browser','authorized-external-site-action','plan; confirm; click; fill; select; submit; read-back verification','high'],
  ['signed-in-session-reuse','Reuse an owner-authorized signed-in browser profile without exporting session secrets','native-web-browser','authorized-external-account-session','profile reuse; cookies local to browser boundary; session continuity; logout/revocation awareness','medium'],
  ['secret-isolated-credential-use','Use credential references without exposing raw secret values to model context','magnanimous-config-vault','authorized-external-account-secret','encrypted secret reference; no model-visible value; scoped use; audit; revocation','high'],
  ['site-permission-allowlist','Restrict browser actions to sites and scopes the owner has authorized','security-auditor','authorized-external-site-action','site allowlist; delegated authority; deny by default; scope checks; audit','medium'],
  ['action-confirmation-gates','Require explicit confirmation for consequential page actions','operations-hub','authorized-external-site-action','risk classification; confirmation token; exact action scope; deny on mismatch; result verification','high'],
  ['delegated-authority-policy','Represent and enforce that browser actions occur only under the user or business authority','security-auditor','authorized-external-site-action','authority assertion; policy check; prohibited targeting; misuse prevention; audit trail','medium'],
  ['session-vault-sealing','Persist authorized browser/session material behind a sealed credential boundary','magnanimous-config-vault','authorized-external-account-session','encrypted storage; scoped retrieval; no prompt exposure; rotation; deletion','high'],
  ['browser-session-audit','Record browser sessions and important actions for later inspection','evidence-auditor','none-or-authorized-external-site-action','session id; timestamps; target URL; action class; outcome; error; evidence','low'],
  ['signed-hash-chained-receipts','Create tamper-evident action receipts linked by cryptographic hashes','evidence-auditor','none','canonical receipt; prior hash; content hash; signature hook; verification; export','low'],
  ['failure-normalization','Return structured failures that distinguish denial, navigation, auth, site, timeout and extraction errors','operations-hub','none-or-fresh-public-internet-data','error class; retryability; human-action requirement; preserved context; recovery plan','low'],
  ['real-browser-execution','Use an actual browser execution surface instead of pretending raw HTTP equals rendered interaction','native-web-browser','owner-browser-capacity-or-replaceable-browser-compute','browser lifecycle; DOM; navigation; screenshot; page state; bounded automation','medium'],
  ['real-ip-egress','Route browser traffic through a real network egress path suitable for public websites','magnanimous-network-gateway','external-network-and-proxy-capacity','egress policy; proxy adapter; IP reputation boundary; network isolation; health check','medium'],
  ['residential-egress-option','Use residential egress only when lawfully sourced, configured and actually available','magnanimous-network-gateway','external-residential-proxy-capacity','optional proxy adapter; provider isolation; region policy; budget guard; truthful capability state','medium']
]);

function initiative(risk,boundary){
  const external=/authorized|external|account|site-action|secret|session|network|proxy/.test(String(boundary||''));
  const high=risk==='high';
  const medium=risk==='medium';
  return Object.freeze({
    suggestive:true,
    auto_initiate:!high&&!medium&&!external,
    requires_confirmation:high||medium||external,
    action_class:high?'consequential-browser-action':medium?'bounded-browser-or-auth-action':external?'authorized-read-or-network-action':'safe-native-read'
  });
}

export const UNFENCED_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  risk
})));

export function getUnfencedCapabilityManifest(){
  return UNFENCED_CAPABILITY_BENCHMARKS.map(row=>({
    id:'unfenced-benchmark:'+row.id,
    connector_id:'unfenced-benchmark',
    connector_name:'Unfenced.ai public capability benchmark',
    category:'browser-agent-benchmark',
    capability:'unfenced-'+row.id,
    native_target:row.native_target,
    priority:'benchmark',
    source_kind:'official-public-capability-benchmark',
    direct_connector:false,
    boundary:row.boundary,
    absorption_status:'brain-spec-absorbed',
    implementation_status:'specified-not-assumed-native',
    magnanimous_owned:[...OWNED],
    external_only:row.boundary==='none'?[]:[row.boundary],
    techniques:row.techniques,
    acceptance_tests:[
      'Magnanimous owns the browser workflow contract, planning, memory, policy, normalization and verification.',
      'No Unfenced branding or runtime dependency is required for Magnanimous identity or orchestration.',
      'Browser actions that can mutate external state remain confirmation and authorization gated.',
      'Credentials and session secrets are never assumed safe to expose to model context.',
      'Residential proxy capacity, public Internet access, third-party sites and external accounts remain explicit real-world boundaries.',
      'No proprietary Unfenced source code, hidden prompt, anti-bot implementation, credential material, private infrastructure or residential proxy supply chain is copied.',
      'Native or hybrid readiness requires a Magnanimous execution surface plus direct runtime evidence; benchmark similarity alone is not completion.'
    ],
    recipe:[
      'Identify the observable browser-agent outcome represented by this public benchmark.',
      'Prefer Magnanimous Native Web, Local Bridge, Knowledge Workspace, Tool Gateway, Config Vault and Evidence Auditor before any outside browser provider.',
      'Keep public-web retrieval read-only by default and block private/local network targets unless an explicitly separate authorized capability exists.',
      'For signed-in sites, reuse owner-authorized local browser profiles where possible so secrets do not cross the model boundary.',
      row.risk==='high'?'Stage the exact consequential browser action and require the existing confirmation/permission gate before execution.':'Execute only within the capability risk and authorization policy.',
      'Normalize results and failures into Magnanimous-owned contracts and preserve source/action evidence.',
      'Record reusable success/failure lessons without importing Unfenced private implementation details.',
      'Do not claim residential egress, secret injection, anti-bot bypass, or tamper-evident receipts as live unless direct runtime evidence proves that exact feature.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{...UNFENCED_PUBLIC_RESEARCH,capability:row.id,public_purpose:row.name,techniques:row.techniques,proprietary_implementation_copied:false}
  }));
}

export function getUnfencedAbsorptionSummary(){
  const rows=getUnfencedCapabilityManifest();
  return {
    verified_at:VERIFIED_AT,
    benchmark:'Unfenced.ai',
    capability_contracts:rows.length,
    native_targets:new Set(rows.map(x=>x.native_target)).size,
    provider_required_for_identity:false,
    provider_required_for_memory:false,
    provider_required_for_planning:false,
    provider_required_for_orchestration:false,
    provider_required_for_verification:false,
    unfenced_runtime_required:false,
    public_docs_private_preview:true,
    explicit_truth_gaps:[
      'Magnanimous does not claim an owned residential proxy fleet.',
      'Magnanimous Native Web currently keeps authenticated proxy credentials local and does not assume a managed residential-IP service.',
      'Magnanimous browser tasks must not claim model-invisible remote secret filling until a separately verified vault-to-browser injection path exists.',
      'Hash-chained signed receipts are a benchmark contract until wired into the live browser action-result path and verified end to end.'
    ],
    status:'provider-neutral-benchmark-absorbed'
  };
}
