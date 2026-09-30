const VERIFIED_AT='2026-09-30';

export const GEMINI_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'Google Gemini / Google Workspace',
  source_kind:'official-public-product-api-and-workspace-documentation',
  sources:[
    'https://blog.google/products-and-platforms/products/workspace/gemini-workspace-updates-march-2026/',
    'https://blog.google/products-and-platforms/products/gemini/deep-research-workspace-app-integration/',
    'https://blog.google/innovation-and-ai/products/gemini-app/new-connected-apps-gemini/',
    'https://blog.google/innovation-and-ai/products/gemini-app/generate-files-in-gemini/',
    'https://support.google.com/drive/answer/16686008',
    'https://support.google.com/drive/answer/16685111',
    'https://support.google.com/docs/answer/14206696',
    'https://support.google.com/docs/answer/16813283',
    'https://support.google.com/gemini/answer/14959807',
    'https://ai.google.dev/gemini-api/docs/google-search',
    'https://ai.google.dev/gemini-api/docs/file-search',
    'https://ai.google.dev/gemini-api/docs/function-calling',
    'https://ai.google.dev/gemini-api/docs/tools',
    'https://ai.google.dev/gemini-api/docs/tool-combination',
    'https://developers.google.com/workspace/guides/enable-apis',
    'https://developers.google.com/workspace/drive/api/reference/rest/v3',
    'https://developers.google.com/workspace/sheets/api/guides/concepts'
  ],
  boundary:'Publicly documented Gemini and Google Workspace behavior is a benchmark only. Magnanimous does not copy Google source code, hidden prompts, model weights, private training data, internal ranking systems, credentials, or proprietary backend implementation.',
  availability_note:'Some Gemini product features vary by Google account type, plan, language, geography, rollout state, administrator policy, or Workspace permissions. Benchmark absorption does not imply that a particular Google feature is enabled for a Magnanimous user.'
});

const OWNED=Object.freeze([
  'intent-understanding','planning','reasoning-policy','memory-policy','workflow-orchestration',
  'source-selection','tool-selection','permission-policy','result-normalization','verification',
  'failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['multimodal-assistant','Multimodal assistant reasoning across text, images, audio, video and documents','model-router','replaceable-model-compute','multimodal input; cross-modal reasoning; structured response','medium'],
  ['web-deep-research','Long-horizon web research and evidence synthesis','research-orchestrator','external-fresh-public-web-data','research plan; iterative search; source comparison; synthesis; citations','low'],
  ['workspace-deep-research','Research that combines authorized Workspace sources with public web sources','research-orchestrator','authorized-google-workspace-and-fresh-web-data','Drive; Docs; Sheets; Slides; PDFs; Gmail; Chat; web; source synthesis','medium'],
  ['source-scoped-research','User-selected source grounding for focused answers','knowledge-workspace','none-or-authorized-external-source-adapter','source selection; constrained retrieval; grounded answer; source traceability','low'],
  ['source-citation-tracking','Citation and evidence tracking across research outputs','evidence-auditor','none','claim evidence; source traceability; citation preservation; verification','low'],
  ['natural-language-file-search','Natural-language file and knowledge retrieval','knowledge-workspace','none-or-authorized-google-drive-data','semantic search; file retrieval; natural-language query; permission awareness','low'],
  ['cross-file-synthesis','Compare and synthesize facts across multiple files','knowledge-workspace','none-or-authorized-external-source-adapter','multi-file retrieval; compare facts; summarize differences; evidence links','low'],
  ['file-ingestion-indexing','Import, chunk, index and retrieve source files for RAG','memory-ingestion','none-or-optional-external-embedding-compute','file ingestion; chunking; embeddings; metadata; retrieval','low'],
  ['file-search-rag','Grounded retrieval over indexed files with citation metadata','knowledge-workspace','none-or-optional-external-embedding-compute','RAG; file search; metadata; page/url/author context; citations','low'],
  ['research-project-workspace','Persistent research project / notebook workspace','knowledge-workspace','none','project sources; notes; research continuity; reusable context','low'],
  ['research-to-document','Turn research findings into an editable document artifact','business-operating-system','none-or-authorized-google-drive-export','research synthesis; outline; draft; source list; editable artifact','low'],
  ['document-first-draft','Generate a first draft from a prompt and relevant sources','business-operating-system','none-or-authorized-external-source-adapter','document planning; source grounding; drafting; sections','low'],
  ['document-rewrite-edit','Rewrite, refine and edit whole documents or selected sections','business-operating-system','none','rewrite; tone; structure; section editing; document revision','low'],
  ['writing-style-match','Match writing voice and style from a reference document','business-operating-system','none-or-authorized-external-source-adapter','reference style; tone normalization; voice consistency','low'],
  ['document-format-match','Match document organization and formatting patterns from a reference','business-operating-system','none-or-authorized-external-source-adapter','reference format; section structure; formatting plan; content population','low'],
  ['spreadsheet-generation','Create structured spreadsheets from a natural-language request','data-platform','none-or-authorized-google-sheets-write','sheet creation; tables; formulas; analysis-ready structure','medium'],
  ['spreadsheet-analysis','Analyze, summarize and transform spreadsheet data','data-platform','none-or-authorized-google-sheets-data','range analysis; formulas; comparisons; summaries; transformations','low'],
  ['presentation-generation','Create presentation content and slide structures from source material','business-operating-system','none-or-authorized-google-slides-write','deck outline; slide content; source-backed presentation; reusable artifact','medium'],
  ['multi-format-file-generation','Generate common business files including PDF, DOCX, XLSX, CSV, LaTeX, TXT, RTF and Markdown','workspace-files','none','artifact generation; format selection; export-ready output','low'],
  ['workspace-export','Export completed work to an authorized external workspace such as Google Drive','workspace-files','authorized-google-drive-write','artifact export; destination selection; permission check; link verification','medium'],
  ['drive-file-organization','Organize files and folders in a workspace using natural-language intent','workspace-files','none-or-authorized-google-drive-write','file search; folder planning; move; rename; organize; verify','medium'],
  ['gmail-context-retrieval','Use authorized Gmail context during research and drafting','communications-hub','authorized-google-mail-account','mail search; thread retrieval; source selection; drafting context','medium'],
  ['calendar-context-actions','Use calendar context and authorized scheduling actions','scheduling-engine','authorized-google-calendar-account','calendar search; availability; scheduling; event context','medium'],
  ['workspace-cross-app-context','Combine authorized mail, files, calendar, chat and work artifacts in one workflow','universal-tool-gateway','authorized-google-workspace-account','cross-app retrieval; normalization; context fusion; permission-aware routing','medium'],
  ['connected-app-orchestration','Route tasks through connected third-party apps from one assistant workflow','universal-tool-gateway','authorized-external-tool-rail','connected apps; discovery; task routing; normalized results; permissions','medium'],
  ['function-calling','Structured function calling with validated schemas and normalized results','universal-tool-gateway','none-or-authorized-tool-rail','tool schema; arguments; invocation; result normalization; tool loop','medium'],
  ['remote-mcp','Remote MCP interoperability for external tools and services','universal-tool-gateway','authorized-external-tool-rail','streamable HTTP MCP; discovery; authorization; invocation; normalization','medium'],
  ['search-grounding','Ground model answers in current web search with source citations','research-orchestrator','external-fresh-public-web-data','search query planning; retrieval; grounding; citations; freshness','low'],
  ['url-context','Use explicitly supplied public URLs as grounded context','research-orchestrator','external-public-url-data','URL retrieval; focused context; source traceability; synthesis','low'],
  ['code-execution-tool','Use sandboxed code execution for calculations, transformations and analysis','engineering-operator','owner-or-host-compute-capacity','code execution; calculations; data analysis; sandbox; result capture','medium'],
  ['tool-combination','Combine built-in research tools with custom function/tool calls in one workflow','universal-tool-gateway','none-or-authorized-tool-rail','search plus tools; context preservation; multi-step tool loop; validation','medium'],
  ['workspace-api-interoperability','Programmatic interoperability with Drive, Docs, Sheets, Slides and related Workspace APIs','universal-tool-gateway','authorized-google-workspace-api-rail','OAuth; Drive API; Docs API; Sheets API; Slides API; normalized adapter','medium'],
  ['agentic-task-orchestration','Longer-running goal-oriented work with resumable task state','operations-hub','none-or-authorized-external-rail','goal decomposition; task state; checkpoints; tool use; completion verification','medium'],
  ['personalized-context','Use explicitly authorized account context for more personalized task assistance','knowledge-workspace','authorized-external-account-data','preference context; account sources; scoped personalization; privacy controls','medium'],
  ['repository-context','Use an authorized source repository as context for code understanding and debugging','engineering-operator','authorized-external-repository-data','repository retrieval; code search; debugging context; source traceability','medium']
]);

function initiative(risk,boundary){
  const consequential=risk==='high';
  const bounded=risk==='medium';
  const external=/authorized|external|account|write|compute|repository|rail/.test(String(boundary||''));
  return Object.freeze({
    suggestive:true,
    auto_initiate:!consequential&&!bounded&&!external,
    requires_confirmation:consequential||bounded||external,
    action_class:consequential?'consequential':bounded?'bounded-action':external?'authorized-read-or-external-action':'safe-native-work'
  });
}

export const GEMINI_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  risk
})));

export function getGeminiCapabilityManifest(){
  return GEMINI_CAPABILITY_BENCHMARKS.map(row=>({
    id:'gemini-benchmark:'+row.id,
    connector_id:'gemini-benchmark',
    connector_name:'Google Gemini / Workspace public capability benchmark',
    category:'ai-provider-benchmark',
    capability:'gemini-'+row.id,
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
      'Magnanimous owns the workflow contract, memory, planning, policy, routing, normalization and verification.',
      'The capability can be selected without making Gemini or Google the public product identity.',
      'Google account data, Google Workspace permissions, live web data, repository access and model compute remain explicit replaceable boundaries when required.',
      'No proprietary Google source code, hidden prompt, model weight, training data or private backend implementation is copied.',
      'Feature availability in Google products is not treated as proof that the same capability is configured or live inside Magnanimous.',
      'Native or hybrid readiness requires Magnanimous execution-surface evidence rather than benchmark similarity.'
    ],
    recipe:[
      'Identify the observable user outcome represented by this public benchmark.',
      'Route to the Magnanimous-owned native target first and reuse Magnanimous memory, workspace, research and verification services.',
      'Use source-scoped retrieval and preserve evidence when the task depends on files, web pages or account context.',
      row.boundary==='none'?'Execute through Magnanimous-owned services when runtime evidence says they are ready.':'Keep the external boundary behind an authorized replaceable adapter and preserve permission, privacy and cost gates.',
      'Normalize tool/provider results into Magnanimous-owned contracts so provider replacement does not break the workflow.',
      'Verify the requested outcome with direct evidence before claiming completion.',
      'Record reusable lessons without importing Google branding or proprietary implementation into the Magnanimous identity.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{...GEMINI_PUBLIC_RESEARCH,capability:row.id,public_purpose:row.name,techniques:row.techniques,proprietary_implementation_copied:false}
  }));
}

export function getGeminiAbsorptionSummary(){
  const rows=getGeminiCapabilityManifest();
  return {
    verified_at:VERIFIED_AT,
    benchmark:'Google Gemini / Workspace',
    capability_contracts:rows.length,
    native_targets:new Set(rows.map(x=>x.native_target)).size,
    provider_required_for_identity:false,
    provider_required_for_memory:false,
    provider_required_for_planning:false,
    provider_required_for_orchestration:false,
    provider_required_for_verification:false,
    google_required_only_for_google_specific_account_data_or_services:true,
    external_boundaries:rows.filter(x=>x.boundary!=='none').length,
    status:'provider-neutral-benchmark-absorbed'
  };
}
