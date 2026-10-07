const VERIFIED_AT='2026-10-07';

export const ARTLIST_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'Artlist',
  source_kind:'official-public-pricing-help-product-blog-and-license-documentation',
  sources:[
    'https://artlist.io/page/pricing/max',
    'https://help.artlist.io/hc/en-us/articles/29559277294237-Artlist-Max-plan-explained',
    'https://artlist.io/blog/new-ai-toolkit/',
    'https://artlist.io/blog/how-to-use-artlist-ai-toolkit/',
    'https://artlist.io/blog/new-artlist-ai-agent/',
    'https://artlist.io/blog/new-artlist-ai-studio-launch/',
    'https://artlist.io/blog/how-to-use-artlist-ai-studio/',
    'https://artlist.io/blog/new-ai-music-generator/',
    'https://artlist.io/blog/the-best-mcp-connectors-for-ai-image-and-video-generation-in-2026/',
    'https://artlist.io/blog/artlist-ai-premiere-pro-plugin/',
    'https://artlist.io/tools',
    'https://artlist.io/plugins',
    'https://artlist.io/help-center/privacy-terms/artlist-license'
  ],
  boundary:'Artlist public behavior is used only as a clean-room product and workflow benchmark. Magnanimous does not copy Artlist source code, hidden prompts, proprietary models, private datasets, paid stock assets, licensed catalog files, credentials, branding, unpublished internals, or model weights. Artlist assets are not ingested into training datasets or used outside their license.',
  public_model_examples:[
    'Veo 3.1','Kling 3.0','Seedance 2.5','Nano Banana 2','Nano Banana Pro','Grok Imagine',
    'Wan','LTX','GPT Image','Ideogram','ImagineArt','Hunyuan Image','Z-Image Turbo',
    'HeyGen Avatar 4','OmniHuman Avatar','Lyria 3','MiniMax Voice','Cartesia Sonic','ElevenLabs'
  ],
  observed_contracts:[
    'conversational creative agent with contextual iteration and model recommendation',
    'standard precision mode with model-specific controls',
    'unified image, video, voiceover, music and avatar generation',
    'end-to-end studio for character, location, framing and shot direction',
    'reusable character and reference continuity across generations',
    'prompt enhancement, negative prompts, start/end frames and multimodal references',
    'targeted image/video edits, motion control, reframe, upscale, lipsync and localization',
    'single media library with generation history and editor integration',
    'credit-aware routing, fast generation allowances, parallel generation and queue limits',
    'MCP access to many replaceable models through one account/credit surface',
    'stock music, stems, SFX, footage, templates, LUTs, plugins and editing extensions',
    'commercial-rights and provenance rules for stock and AI output'
  ]
});

const OWNED=Object.freeze([
  'identity','conversation-context','creative-intent','planning','prompt-compilation','model-capability-matching',
  'provider-routing','budget-policy','rights-policy','consent-policy','asset-provenance','media-library-metadata',
  'workflow-orchestration','result-normalization','verification','failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['creative-agent-mode','Turn natural language into an iterative creative production workflow','creative-studio','none','context memory; intent expansion; prompt enhancement; model recommendation; iterative refinement','low'],
  ['precision-standard-mode','Expose precise model and generation controls when a creator wants manual control','creative-studio','none-or-replaceable-model-rail','model picker; control schema; deterministic settings record; reproducible generation brief','low'],
  ['creative-session-memory','Remember assets, prompts, decisions and prior generations within a production session','media-library','authorized-user-library','session graph; asset references; decision history; resumable context; tenant isolation','low'],
  ['prompt-enhancement','Expand a short idea into a production-ready generation prompt','creative-studio','none','subject; action; environment; camera; lighting; style; constraints; negatives','low'],
  ['automatic-model-recommendation','Match a requested outcome to the best currently available authorized model capability','model-router','replaceable-model-catalog','capability matrix; quality/cost/speed scoring; reliability history; funded-only routing; fallback','low'],
  ['model-picker','Let advanced users choose among compatible image, video, voice, music or avatar rails','model-router','replaceable-model-catalog','brand/provider filter; feature filter; quality/speed/cost filter; specs; availability','low'],
  ['text-to-image','Generate an original image from text','creative-studio','native-or-replaceable-image-compute','prompt; aspect ratio; resolution; seed/reference options; verification','low'],
  ['image-to-image','Transform an authorized input image while preserving requested structure or identity cues','creative-studio','authorized-user-media-and-compute','input rights; transform brief; preservation mask; reference strength; comparison','medium'],
  ['targeted-image-edit','Apply a localized instruction to one region or object without unnecessarily changing the rest','creative-studio','authorized-user-media-and-compute','mask/selection; edit instruction; preserve lock; edge cleanup; before-after verification','medium'],
  ['text-to-video','Generate video from text','cinema-engine','native-or-funded-replaceable-video-compute','scene prompt; duration; aspect; camera; motion; audio intent; render verification','low'],
  ['image-to-video','Animate an owned or generated still image','cinema-engine','authorized-user-media-and-compute','reference frame; motion plan; camera path; subject lock; temporal consistency','medium'],
  ['video-to-video-edit','Transform or restyle an authorized video while preserving requested motion/content','cinema-engine','authorized-user-media-and-compute','source rights; edit plan; temporal masks; style controls; continuity QA','medium'],
  ['start-end-frame-control','Guide a generated clip using explicit first and last frame anchors','cinema-engine','authorized-user-media-and-compute','first-frame anchor; last-frame anchor; transition path; duration; seam verification','medium'],
  ['negative-prompt-control','Describe unwanted visual/audio traits and enforce them during generation when supported','creative-studio','replaceable-model-capability','negative constraints; conflict detection; provider mapping; result check','low'],
  ['multi-reference-conditioning','Use multiple authorized references for subject, style, location, motion or sound guidance','creative-studio','authorized-user-media-and-compute','reference roles; rights; weighting; conflict resolution; provenance','medium'],
  ['motion-control','Direct subject/camera movement using explicit motion instructions or authorized references','animation-studio','authorized-user-media-and-compute','motion vector; subject lock; camera cue; temporal mask; verification','medium'],
  ['reference-style-application','Analyze an authorized reference style and reproduce broad visual characteristics without copying protected assets','design-studio','authorized-user-media-and-compute','style abstraction; palette; lighting; lens; composition; non-copying check','medium'],
  ['reusable-character-library','Save a generated or authorized character identity and reuse it across scenes','avatar-studio','authorized-user-library-and-media','character bible; appearance anchors; wardrobe; voice association; revocation','medium'],
  ['character-casting','Generate and compare candidate characters from a role description','avatar-studio','native-or-replaceable-image-compute','role brief; appearance; mood; variations; selection; character bible','low'],
  ['location-library','Create and reuse consistent locations across a production','cinema-engine','authorized-user-library-and-compute','location bible; geometry; lighting/time; props; camera anchors; continuity','low'],
  ['scene-framing','Compose a still frame using selected characters, locations and shot intent','cinema-engine','native-or-replaceable-image-compute','cast; location; shot size; camera angle; lighting; composition; preview','low'],
  ['shot-direction','Turn a framed scene into a directed shot with camera, action and performance instructions','cinema-engine','native-or-funded-replaceable-video-compute','camera move; actor action; timing; dialogue/audio; continuity; render QA','low'],
  ['scene-continuation','Continue a sequence from a chosen prior frame while preserving continuity','cinema-engine','authorized-user-library-and-compute','continuation frame; state carryover; cast/location locks; camera continuity; seam check','medium'],
  ['avatar-generation','Create a talking presenter/avatar for authorized use','avatar-studio','authorized-user-media-and-compute','avatar rights; script; framing; gestures; voice; disclosure policy','medium'],
  ['lip-sync','Synchronize authorized speech/audio to a visible speaker','avatar-studio','authorized-user-media-and-consent','audio rights; phonemes; face tracking; mouth motion; timing verification','medium'],
  ['voiceover-generation','Generate narration in multiple languages/styles','voice-engine','native-or-replaceable-voice-compute','script cleanup; language; voice; pacing; pronunciation; export','low'],
  ['voice-cloning','Create a reusable voice likeness only with explicit authorization and revocation controls','voice-engine','authorized-persona-media-and-consent','consent record; sample quality; identity label; anti-impersonation; revocation','high'],
  ['voice-changing','Transform an authorized recording while preserving timing and intelligibility','voice-engine','authorized-user-media-and-consent','voice transform; timing preservation; consent; disclosure; verification','medium'],
  ['ai-music-generation','Generate original music from a text or visual brief','music-engine','native-or-funded-replaceable-music-compute','genre; mood; instrumentation; vocals/lyrics constraints; duration; rights record','low'],
  ['music-from-image-brief','Use an authorized image as creative direction for original music','music-engine','authorized-user-media-and-compute','visual analysis; mood extraction; music brief; rights; provenance','medium'],
  ['stock-asset-discovery','Search licensed music, stems, SFX, footage, templates, LUTs and plugins without copying provider catalogs into Magnanimous','media-library','authorized-external-catalog','search; preview metadata; license status; provider link; no bulk scraping','medium'],
  ['unified-media-library','Keep generated and authorized external assets together with searchable metadata','media-library','authorized-user-library','asset id; type; prompt; source; rights; project; versions; download/export','low'],
  ['generation-history-reuse','Reuse prior generated assets as references or starting points','media-library','authorized-user-library-and-compute','history; lineage; start frame; style/character reference; provenance','low'],
  ['credit-budget-router','Route creative work by user budget, plan allowance and expected cost before generation','cost-control','funded-provider-account-or-native-compute','cost estimate; free/native preference; monthly budget; hard cap; user-visible funded action gate','low'],
  ['parallel-generation-controller','Limit simultaneous expensive generations and queue excess work safely','operations-hub','native-queue','per-tenant concurrency; queue; cancellation; timeout; retry; fairness','low'],
  ['render-job-tracking','Track asynchronous media jobs and preserve completed outputs or clear errors','media-library','replaceable-render-provider-or-native-compute','job id; progress; status; retryability; result asset; error reason','low'],
  ['mcp-creative-bridge','Expose Magnanimous-owned creative tools through an MCP-compatible surface while keeping providers replaceable','connector-hub','authorized-mcp-client-and-provider-rails','tool contracts; auth scopes; cost gate; media return; provenance; audit','medium'],
  ['editor-panel-workflow','Bring generation/search actions into supported editor integrations without making the editor the brain','creative-studio','authorized-editor-extension','timeline context; generate/search; asset insert; sync library; auth; rollback','medium'],
  ['auto-reframe','Create alternate aspect-ratio versions while protecting subjects, captions and safe areas','creative-studio','native-or-replaceable-render-compute','target ratio; subject tracking; crop/recompose; caption safe area; preview','low'],
  ['upscale','Increase image/video resolution with artifact-aware validation','creative-studio','native-or-replaceable-render-compute','target resolution; detail recovery; face/text protection; artifact check; export','low'],
  ['creative-localization','Translate/localize narration and onscreen language while preserving timing and meaning','voice-engine','authorized-user-media-and-language-compute','transcription; translation; timing; voice; captions; cultural review','medium'],
  ['commercial-rights-ledger','Track license/provenance/consent for every input and output used commercially','media-library','authorized-license-and-consent-records','source; license; consent; model/provider; generated-at; intended use; export record','medium'],
  ['asset-ai-use-policy','Prevent licensed stock assets from being used for model training/fine-tuning or unsafe shared AI workflows','rights-policy','license-metadata','license rule; training prohibition; provider-output-ownership check; sharing check; audit','medium']
]);

function initiative(risk,boundary){
  const external=/authorized|external|provider|compute|catalog|mcp|editor|consent|media/.test(String(boundary||''));
  return Object.freeze({
    suggestive:true,
    auto_initiate:risk==='low'&&!external,
    requires_confirmation:risk!=='low'||external,
    action_class:risk==='high'?'identity-sensitive-media-action':risk==='medium'?'bounded-media-rights-or-connector-action':external?'funded-or-authorized-creative-action':'safe-native-creative-planning'
  });
}

export const ARTLIST_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  risk
})));

export function getArtlistCapabilityManifest(){
  return ARTLIST_CAPABILITY_BENCHMARKS.map(row=>({
    id:'artlist-benchmark:'+row.id,
    connector_id:'artlist-benchmark',
    connector_name:'Artlist public capability benchmark',
    category:'creative-production-benchmark',
    capability:'artlist-'+row.id,
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
      'Magnanimous AI owns identity, conversation context, planning, provider routing, memory, cost policy, rights policy, verification and learning.',
      'External creative models and catalogs remain replaceable infrastructure and never become Magnanimous identity or memory.',
      'Free/native/browser/local execution is preferred before funded external generation.',
      'No Artlist stock assets, hidden prompts, private datasets, proprietary code, model weights, credentials or paid files are copied.',
      'Licensed third-party assets are never silently added to AI training/fine-tuning datasets.',
      'Likeness-sensitive voice/avatar operations require authorization and consent safeguards.',
      'Runtime readiness is not claimed without evidence for the exact execution rail.'
    ],
    recipe:[
      'Interpret the creator goal and preserve the current project/session context.',
      'Select a Magnanimous-owned workflow and capability contract before selecting any external model or provider.',
      'Prefer native/free execution; estimate cost and require funded-provider eligibility before any variable-cost generation.',
      'Validate rights, provenance and consent for user media, references, stock and likeness-sensitive requests.',
      'Route privately to the best currently available authorized execution rail, with fallback based on reliability, quality, speed and cost.',
      'Store resulting asset metadata, lineage, prompt/settings and rights notes in the Magnanimous media library.',
      'Verify the result and learn reusable success/failure patterns without copying proprietary provider internals.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{
      ...ARTLIST_PUBLIC_RESEARCH,
      capability:row.id,
      public_purpose:row.name,
      techniques:row.techniques,
      proprietary_implementation_copied:false,
      paid_assets_copied:false,
      model_weights_copied:false
    }
  }));
}

export function getArtlistAbsorptionSummary(){
  const rows=getArtlistCapabilityManifest();
  return {
    verified_at:VERIFIED_AT,
    provider:'Artlist public benchmark',
    clean_room:true,
    capabilities:rows.length,
    official_sources:ARTLIST_PUBLIC_RESEARCH.sources.length,
    native_targets:[...new Set(rows.map(x=>x.native_target))].sort(),
    identity_sensitive_contracts:rows.filter(x=>x.initiative.action_class==='identity-sensitive-media-action').length,
    authorization_gated_contracts:rows.filter(x=>x.initiative.requires_confirmation).length,
    artlist_runtime_required:false,
    artlist_subscription_required:false,
    provider_required_for_identity:false,
    provider_required_for_memory:false,
    provider_required_for_planning:false,
    provider_required_for_orchestration:false,
    provider_required_for_verification:false,
    external_models_replaceable:true,
    free_native_first:true,
    paid_assets_copied:false,
    proprietary_implementation_copied:false,
    explicit_truth_gaps:[
      'Public feature documentation does not reveal Artlist hidden prompts, model routing logic, private datasets, internal code, security architecture or proprietary model weights.',
      'A public claim that Artlist offers a model or tool is not proof that Magnanimous has an authorized runtime connection to it.',
      'Model availability, prices, credit costs, unlimited-generation eligibility and provider terms can change and must be checked at execution time.',
      'Artlist stock licenses do not permit copying the catalog into Magnanimous or using licensed assets for AI training/fine-tuning.',
      'Any future direct Artlist or Artlist-MCP use requires an authorized account, compatible plan and current license review.'
    ]
  };
}
