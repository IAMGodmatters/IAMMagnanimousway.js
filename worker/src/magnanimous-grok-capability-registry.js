const VERIFIED_AT='2026-09-21';

export const GROK_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'xAI / Grok',
  source_kind:'official-public-product-and-api-documentation',
  sources:[
    'https://x.ai/news/introducing-grok-bot',
    'https://x.ai/news/designing-grok-bot',
    'https://x.ai/news/grok-bot-procurement',
    'https://x.ai/news/grok-bot-and-x',
    'https://x.ai/news/grok-skills',
    'https://x.ai/news/grok-build-memory',
    'https://x.ai/news/grok-4-6',
    'https://docs.x.ai/developers/grok-4-6',
    'https://docs.x.ai/developers/tools/x-search',
    'https://docs.x.ai/developers/tools/code-execution',
    'https://docs.x.ai/developers/tools/remote-mcp',
    'https://docs.x.ai/developers/tools/streaming-and-sync'
  ],
  boundary:'Publicly documented behavior is a benchmark only. Magnanimous does not copy xAI source code, private prompts, model weights, private training data, credentials, or backend implementation.'
});

const OWNED=Object.freeze([
  'intent-understanding','planning','reasoning-policy','memory-policy','workflow-orchestration',
  'tool-selection','permission-policy','result-normalization','verification','failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['persistent-agent-identity','Persistent role agents','agent-mesh','none','persistent identity; role continuity; durable agent roster','low'],
  ['role-scoped-memory','Role-scoped durable memory','knowledge-workspace','none','role memory; tenant isolation; durable context','low'],
  ['scheduled-event-routines','Scheduled and event-triggered routines','operations-hub','none-or-external-event-adapter','schedule triggers; webhook triggers; recurring responsibility','medium'],
  ['dedicated-computer-sessions','Dedicated computer/browser sessions','universal-tool-gateway','owner-or-host-compute-capacity','browser session; sandbox; resumable work','medium'],
  ['computer-preview-takeover','Computer preview and owner takeover','universal-tool-gateway','owner-device-or-host-compute-capacity','preview; takeover; handback; human intervention','medium'],
  ['multi-agent-group-chat','Multi-agent shared project conversations','agent-mesh','none','shared project context; specialized memories; team collaboration','low'],
  ['agent-to-agent-handoff','Agent-to-agent task handoff','agent-mesh','none','routing; delegation; handoff evidence','low'],
  ['agent-presence-state','Agent work-state presence','evidence-auditor','none','idle; thinking; working; waiting; blocked; done','low'],
  ['artifact-workspace','Durable artifact workspace','business-operating-system','none','documents; code; data; designs; durable outputs','low'],
  ['structured-inline-widgets','Structured inline response widgets','business-operating-system','none','cards; action objects; visualizations; heterogeneous transcript','low'],
  ['permission-lines','Explicit permission lines and approval stops','operations-hub','none','always-allowed; approval-required; prohibited boundaries','medium'],
  ['safe-next-step-initiative','Safe next-step initiative','operations-hub','none-or-authorized-external-rail','proactive evidence gathering; bounded autonomous progress','medium'],
  ['long-running-agent-state','Long-running resumable agent state','operations-hub','none','checkpointing; resumability; long-horizon task state','low'],
  ['project-memory-topics','Project and global memory topics','knowledge-workspace','none','topic memory; project scope; global preferences; retrieval','low'],
  ['memory-precedence','Current-instruction-over-memory precedence','knowledge-workspace','none','current instruction precedence; stale-memory protection','low'],
  ['skills-persistent-expertise','Persistent reusable skills','universal-tool-gateway','none','skill selection; reusable expertise; workflow persistence','low'],
  ['skill-creator','Conversational skill creation','universal-tool-gateway','none','skill authoring; validation; versioning; publication controls','medium'],
  ['document-skill','Document generation and editing','business-operating-system','none','document creation; editing; formatting','low'],
  ['presentation-skill','Presentation generation','business-operating-system','none','slides; deck creation; reusable artifacts','low'],
  ['spreadsheet-skill','Spreadsheet generation and analysis','data-platform','none','tables; formulas; analysis; formatted workbooks','low'],
  ['pdf-skill','PDF creation and transformation','business-operating-system','none','create; merge; split; extract; transform','medium'],
  ['web-search','Agentic web search','research-orchestrator','external-fresh-public-web-data','search; browse; source synthesis; citations','low'],
  ['x-search','Real-time X search and thread retrieval','social-operations','external-live-x-data-adapter','keyword; semantic; user; thread search','low'],
  ['x-account-workflows','X timeline, mentions, trends and bookmarks workflows','social-operations','authorized-x-account-rail','timeline; mentions; trends; bookmarks','medium'],
  ['code-execution','Sandboxed code execution','engineering-operator','owner-or-host-compute-capacity','code interpreter; calculations; simulations; data analysis','medium'],
  ['collections-search','Knowledge collection search','knowledge-workspace','none-or-authorized-external-source-adapter','RAG; collection search; citations','low'],
  ['attachment-search','Attachment and uploaded-file search','knowledge-workspace','none','file retrieval; attachment search; grounded extraction','low'],
  ['remote-mcp','Remote MCP tool interoperability','universal-tool-gateway','authorized-external-tool-rail','MCP discovery; invocation; normalization','medium'],
  ['function-calling','Structured function calling','universal-tool-gateway','none-or-authorized-tool-rail','tool schemas; argument validation; tool result normalization','medium'],
  ['deep-research','Multi-hop deep research','research-orchestrator','external-fresh-public-or-authorized-data','iterative search; source comparison; evidence synthesis','low'],
  ['vision-understanding','Image and visual input understanding','creative-studio','optional-model-compute','image input; visual analysis; grounded response','low'],
  ['voice-agent','Realtime speech-to-speech agent','voice-agent-runtime','device-audio-and-optional-compute','realtime conversation; interruptions; low-latency voice','medium'],
  ['speech-to-text','Speech transcription','voice-agent-runtime','device-audio-and-optional-compute','streaming transcription; batch transcription','low'],
  ['text-to-speech','Text-to-speech and voice styles','voice-agent-runtime','optional-voice-compute','speech synthesis; multilingual delivery; style controls','medium'],
  ['custom-voice','Custom voice profile support','voice-agent-runtime','consent-and-optional-voice-compute','voice profile; consent; reusable branded voice','high'],
  ['live-camera-vision','Live camera vision during voice','voice-agent-runtime','owner-device-camera-and-optional-compute','camera stream; visual grounding; voice response','medium'],
  ['image-generation-editing','Image generation and localized editing','creative-studio','optional-image-compute','generation; editing; segmentation; localized change','medium'],
  ['video-generation-editing','Video generation and editing','cinema-engine','optional-video-compute','generation; editing; references; resolution controls','medium'],
  ['app-build-mode','Interactive app/site/dashboard builder','engineering-operator','repository-or-hosting-rail-when-publishing','build; preview; iterate; publish through guarded deployment','medium'],
  ['evidence-backed-role-automation','Evidence-backed role automation','operations-hub','authorized-external-business-data-and-actions','role objective; dossiers; evidence gathering; next-step execution','medium'],
  ['human-final-decision-boundary','Human final-decision boundary for consequential work','operations-hub','none','approval checkpoints; binding-action stop; audit trail','high']
]);

function initiative(risk,boundary){
  const high=risk==='high';
  const medium=risk==='medium';
  return Object.freeze({
    suggestive:true,
    auto_initiate:!high&&!medium&&boundary==='none',
    requires_confirmation:high||medium||/authorized|account|publish|device|compute|rail/.test(boundary),
    action_class:high?'consequential':medium?'bounded-action':'safe-read-or-native-work'
  });
}

export const GROK_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  risk
})));

export function getGrokCapabilityManifest(){
  return GROK_CAPABILITY_BENCHMARKS.map(row=>({
    id:'grok-benchmark:'+row.id,
    connector_id:'grok-benchmark',
    connector_name:'Grok / xAI public capability benchmark',
    category:'ai-provider-benchmark',
    capability:'grok-'+row.id,
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
      'Magnanimous owns the workflow contract, memory, reasoning, policy and verification.',
      'The capability can be selected without making Grok or xAI the product identity.',
      'Any live X/account/model/device/compute boundary remains explicit and replaceable.',
      'No proprietary xAI implementation, hidden prompt, model weight or private backend is copied.',
      'Native status requires independent runtime evidence rather than benchmark similarity.'
    ],
    recipe:[
      'Identify the observable user outcome represented by this benchmark.',
      'Route to the Magnanimous-owned native target first.',
      'Reuse Magnanimous memory, policy, tool routing, verification and audit trails.',
      row.boundary==='none'?'Execute through the Magnanimous native surface when available.':'Keep the external boundary behind a replaceable adapter and preserve existing authorization gates.',
      'Verify the result with direct evidence before claiming completion.',
      'Record reusable lessons without importing provider identity or private implementation.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{...GROK_PUBLIC_RESEARCH,capability:row.id,public_purpose:row.name,techniques:row.techniques,proprietary_implementation_copied:false}
  }));
}

export function getGrokAbsorptionSummary(){
  const rows=getGrokCapabilityManifest();
  return {
    verified_at:VERIFIED_AT,
    benchmark:'Grok / xAI',
    capability_contracts:rows.length,
    native_targets:new Set(rows.map(x=>x.native_target)).size,
    provider_required_for_identity:false,
    provider_required_for_memory:false,
    provider_required_for_reasoning:false,
    provider_required_for_orchestration:false,
    provider_required_for_verification:false,
    external_boundaries:rows.filter(x=>x.boundary!=='none').length,
    status:'provider-neutral-benchmark-absorbed'
  };
}
