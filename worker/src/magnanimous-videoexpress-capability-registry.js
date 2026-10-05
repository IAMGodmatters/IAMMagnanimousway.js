const VERIFIED_AT='2026-10-05';

export const VIDEOEXPRESS_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'VideoExpress AI',
  source_kind:'official-public-product-tutorial-workflow-and-terms-documentation',
  sources:[
    'https://videoexpress.ai/go/',
    'https://videoexpress.ai/tutorials/',
    'https://videoexpress.ai/workflow/',
    'https://videoexpress.ai/talkingphotos/',
    'https://videoexpress.ai/access/bundle/',
    'https://videoexpress.ai/access/commercial/',
    'https://videoexpress.ai/l/elite/index.html',
    'https://videoexpress.ai/terms/terms.php'
  ],
  boundary:'VideoExpress public behavior is a clean-room capability benchmark only. Magnanimous does not copy VideoExpress source code, hidden prompts, proprietary models, private datasets, private workflow implementation, credentials, paid assets, branding, or other non-public internals.',
  observed_contracts:[
    'text-to-video and image-to-video generation',
    'consistent characters and multi-character continuity',
    'first-frame and last-frame guided transitions',
    'prompt-directed camera movement and angles',
    'video inpainting, outpainting, object removal and background editing',
    'motion brush and directed regional motion',
    'talking characters, lip sync, voice narration and sound effects',
    'timeline editing, captions, transitions and video extension',
    'story, shorts, documentary, animation, talking-head and automation workflows',
    'screen/voice recording, media management and render-progress workflows'
  ]
});

const OWNED=Object.freeze([
  'intent-understanding','creative-direction','story-planning','continuity-memory','prompt-compilation',
  'workflow-orchestration','provider-selection','cost-policy','rights-and-consent-policy','result-normalization',
  'verification','failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['text-to-video','Create video from a written prompt','cinema-engine','funded-media-provider-or-native-compute','prompt normalization; scene direction; model routing; render verification','low'],
  ['image-to-video','Animate a still image into video','cinema-engine','funded-media-provider-or-native-compute','reference-image intake; motion direction; camera guidance; temporal consistency','low'],
  ['reference-image-conditioning','Use owned reference images for visual identity and style continuity','creative-studio','authorized-user-media','reference validation; rights reminder; visual anchors; consistency cues','medium'],
  ['consistent-character','Keep one character visually consistent across scenes','avatar-studio','funded-media-provider-or-native-compute','character bible; appearance locks; wardrobe locks; face/identity anchors; scene continuity','medium'],
  ['multi-character-consistency','Maintain several distinct characters across a story','avatar-studio','funded-media-provider-or-native-compute','cast bible; per-character anchors; relationship continuity; scene roster; collision avoidance','medium'],
  ['first-last-frame-control','Plan or render transitions guided by explicit start and end frames','cinema-engine','funded-media-provider-or-native-compute','start-frame anchor; end-frame anchor; transition path; temporal interpolation; verification','low'],
  ['camera-direction-from-prompt','Translate natural-language camera instructions into shot direction','cinema-engine','none-or-replaceable-render-compute','shot size; pan; tilt; dolly; orbit; zoom; rack focus; camera speed','low'],
  ['camera-angle-planning','Choose and sequence camera angles for story emphasis','cinema-engine','none','establishing; wide; medium; close-up; POV; overhead; low-angle; continuity rules','low'],
  ['motion-brush','Direct motion to selected subjects or regions while preserving the rest of the frame','animation-studio','funded-media-provider-or-native-compute','region motion intent; static-region lock; motion vector cue; temporal mask; preview verification','low'],
  ['video-inpainting','Replace or repair a selected area through time','creative-studio','funded-media-provider-or-native-compute','temporal mask; replacement prompt; edge continuity; frame consistency; artifact review','low'],
  ['video-outpainting','Extend video beyond its original frame or aspect','creative-studio','funded-media-provider-or-native-compute','canvas expansion; aspect conversion; scene continuation; edge synthesis; temporal consistency','low'],
  ['object-removal','Remove an unwanted object across a video sequence','creative-studio','funded-media-provider-or-native-compute','object mask; track subject; fill background; temporal cleanup; artifact review','low'],
  ['object-add-replace','Add or replace a visual object while preserving scene continuity','creative-studio','funded-media-provider-or-native-compute','object grounding; placement; lighting match; occlusion; temporal consistency','low'],
  ['background-removal','Separate foreground subjects from the background','creative-studio','none-or-replaceable-render-compute','segmentation; edge cleanup; alpha/matte; temporal stability; export','low'],
  ['background-editor','Replace or transform a video background','creative-studio','funded-media-provider-or-native-compute','foreground matte; background prompt/media; lighting harmonization; perspective match; temporal stability','low'],
  ['video-fix-smart-edit','Repair common visual or timing defects through a guided edit pass','creative-studio','none-or-replaceable-render-compute','defect detection; bounded edit instruction; preserve-good-regions; compare before/after; rollback','low'],
  ['video-extension','Extend a clip while continuing motion, scene and style','cinema-engine','funded-media-provider-or-native-compute','continuation frame; temporal prompt; motion continuation; duration target; seam review','low'],
  ['clip-trim-split-reorder','Trim, split and reorder clips on a timeline','creative-studio','none','non-destructive timeline; in/out points; segment ordering; preview; export','low'],
  ['multi-clip-timeline','Assemble many clips into one ordered edit','creative-studio','none-or-replaceable-render-compute','timeline; clip normalization; transitions; audio alignment; finalization','low'],
  ['transitions-effects','Apply transitions and visual effects between clips','creative-studio','none-or-replaceable-render-compute','transition type; duration; easing; overlap; preview','low'],
  ['separate-audio-video','Detach or separately manage a video audio track','creative-studio','none','demux; audio asset; mute/replace; sync markers; remux','low'],
  ['audio-waveform','Visualize audio waveform for editing and timing','creative-studio','none','decode audio; amplitude samples; timeline scale; playhead sync; cue placement','low'],
  ['automatic-captions','Generate and edit subtitles/captions','voice-engine','none-or-replaceable-speech-compute','speech recognition; timestamping; punctuation cleanup; readable line breaks; caption export','low'],
  ['caption-repair','Correct subtitle timing, text and line breaks','voice-engine','none','caption parse; text correction; timing adjustment; readability checks; export','low'],
  ['text-to-speech-narration','Create narration from text','voice-engine','none-or-replaceable-voice-compute','text cleanup; voice selection; pacing; pronunciation; audio export','low'],
  ['voice-change','Transform a voice recording while preserving timing and intelligibility','voice-engine','authorized-user-media-and-consent','voice transform; pitch/timbre control; timing preservation; consent policy; artifact review','medium'],
  ['voice-clone','Create a reusable voice likeness only with verified authorization','voice-engine','authorized-persona-media-and-consent','consent record; sample quality; identity label; anti-impersonation policy; revocation','high'],
  ['ai-sound-effects','Generate sound effects from text descriptions','voice-engine','funded-media-provider-or-native-compute','sound prompt; duration; intensity; loop intent; mix-ready export','low'],
  ['lip-sync','Synchronize visible speech to authorized audio','avatar-studio','authorized-user-media-and-consent','phoneme timing; mouth motion; face tracking; expression preservation; sync verification','medium'],
  ['talking-character','Create a talking character from an owned or generated character image','avatar-studio','authorized-user-media-and-consent','character input; speech audio; lip sync; expression; camera framing','medium'],
  ['full-body-talking-character','Animate speech and body motion for a full-body character','animation-studio','authorized-user-media-and-consent','pose anchor; speech sync; gestures; body stability; scene framing','medium'],
  ['singing-character','Synchronize a character performance to authorized music/vocals','animation-studio','authorized-user-media-and-consent','audio rights; beat/phrase alignment; mouth sync; performance motion; verification','medium'],
  ['dancing-character','Generate dance/body movement for a character','animation-studio','authorized-user-media-and-consent','movement plan; beat alignment; pose continuity; collision checks; temporal stability','medium'],
  ['action-replication','Transfer broad movement/action from an authorized reference performance without copying identity','animation-studio','authorized-persona-media-and-consent','reference motion analysis; action abstraction; target-character retargeting; identity separation; consent proof','high'],
  ['face-swap','Swap a face only for authorized creative use with strong identity safeguards','avatar-studio','authorized-persona-media-and-consent','consent proof; source/target rights; identity labeling; anti-deception policy; audit','high'],
  ['avatar-swap','Replace a person/character with an authorized avatar while preserving action','avatar-studio','authorized-persona-media-and-consent','avatar rights; tracking; pose transfer; occlusion; temporal stability','high'],
  ['character-generator','Design original human, cartoon, animal or fantasy characters from prompts','design-studio','funded-media-provider-or-native-compute','character brief; silhouette; wardrobe; palette; expression sheet; reference pack','low'],
  ['character-stylization','Restyle an owned or generated character while preserving identity cues','design-studio','authorized-user-media','style prompt; identity anchor; palette/material rules; comparison; approval','medium'],
  ['creative-mode','Convert a loose idea into a structured video brief and production approach','operations-hub','none','intent expansion; genre; audience; hook; shots; audio; CTA; constraints','low'],
  ['ai-prompt-writer','Expand a short idea into production-ready image/video prompts','operations-hub','none','prompt structure; subject; setting; action; camera; lighting; continuity; negatives','low'],
  ['narrative-story-workflow','Build a narrated multi-scene story from an idea or script','cinema-engine','none-or-replaceable-render-compute','story beats; scene list; narration; shot prompts; continuity; edit plan','low'],
  ['consistent-character-long-form','Plan longer stories with persistent cast continuity','cinema-engine','none-or-replaceable-render-compute','cast bible; scene roster; wardrobe/state tracking; recurring locations; continuity QA','medium'],
  ['motion-graphics-explainer','Plan motion-graphics explainers with timed text and visual beats','explainer-studio','none-or-replaceable-render-compute','learning objective; script; beats; typography; icon/shape motion; narration; timing','low'],
  ['viral-shorts-workflow','Create short-form vertical video structure optimized for retention','creator-growth-engine','none-or-replaceable-render-compute','hook; fast beats; caption plan; pattern interrupts; payoff; CTA; 9:16 delivery','low'],
  ['documentary-workflow','Build documentary-style scenes, narration and evidence-aware visual direction','cinema-engine','none-or-replaceable-render-compute','research boundary; narrative spine; B-roll plan; maps/graphics; narration; source notes','low'],
  ['animated-short-workflow','Plan a 3D/animated short with emotional beats and shot-level prompts','animation-studio','none-or-replaceable-render-compute','character arcs; emotional beats; shot timing; image prompts; video prompts; lip-sync cues','low'],
  ['realistic-talking-head-workflow','Create a direct-to-camera talking presentation with natural pacing','avatar-studio','authorized-user-media-and-consent','script; delivery beats; eye line; framing; gestures; captions; audio','medium'],
  ['product-demo-workflow','Create product holding, demonstration and showcase video plans','creative-studio','authorized-user-media','product reference; handoff/holding intent; feature shots; close-ups; claims discipline; CTA','low'],
  ['video-automation-workflow','Turn a repeatable brief into a reusable video production recipe','operations-hub','none-or-replaceable-render-compute','template inputs; scene rules; prompt compilation; render stages; QA; export handoff','low'],
  ['screen-recorder','Capture an authorized browser/device screen for video content','creative-studio','owner-device-capability','screen permission; source selection; audio option; recording state; local file','medium'],
  ['voice-recorder','Capture microphone audio for narration or performance','voice-engine','owner-device-capability','microphone permission; recording state; local audio; retake; export','medium'],
  ['media-gallery-management','Select, move, download or remove multiple generated assets in a media workspace','media-library','authorized-user-library','multi-select; metadata; move; download; delete confirmation; audit','medium'],
  ['render-progress-tracking','Track asynchronous render status and preserve completed assets','media-library','replaceable-render-provider-or-native-compute','job id; status polling; retryability; completion asset; error reason','low'],
  ['external-creative-import','Import assets from authorized creative or voice tools through replaceable adapters','media-library','authorized-external-account-rail','connector authorization; file ingest; metadata; license note; provenance','medium'],
  ['social-format-export','Prepare outputs for common social ratios and delivery targets','social-operations','none-or-authorized-social-account','9:16; 16:9; 1:1; 4:5; resolution; compression; caption-safe area','low'],
  ['commercial-rights-tracking','Track whether user inputs and generated outputs have the rights needed for intended use','media-library','authorized-user-media-and-license-records','source provenance; license note; consent note; intended use; export record','medium']
]);

function initiative(risk,boundary){
  const external=/authorized|external|provider|compute|owner-device|consent|media/.test(String(boundary||''));
  return Object.freeze({
    suggestive:true,
    auto_initiate:risk==='low'&&!external,
    requires_confirmation:risk!=='low'||external,
    action_class:risk==='high'?'identity-sensitive-media-action':risk==='medium'?'bounded-media-or-consent-action':external?'authorized-media-or-compute-action':'safe-native-planning'
  });
}

export const VIDEOEXPRESS_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
  risk
})));

export function getVideoExpressCapabilityManifest(){
  return VIDEOEXPRESS_CAPABILITY_BENCHMARKS.map(row=>({
    id:'videoexpress-benchmark:'+row.id,
    connector_id:'videoexpress-benchmark',
    connector_name:'VideoExpress AI public capability benchmark',
    category:'video-creation-benchmark',
    capability:'videoexpress-'+row.id,
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
      'Magnanimous owns the video workflow contract, creative direction, continuity memory, cost policy and verification.',
      'No VideoExpress branding or runtime dependency is required for Magnanimous identity or orchestration.',
      'Provider-specific video/image/voice compute remains replaceable when native compute is not sufficient.',
      'Identity-sensitive media such as face swap, avatar swap, voice likeness and motion replication requires rights and consent safeguards.',
      'Native status is not claimed without runtime evidence for the exact operation.',
      'No proprietary VideoExpress source code, hidden prompts, private models, private workflow implementation, paid assets or non-public internals are copied.'
    ],
    recipe:[
      'Identify the observable video outcome represented by this public benchmark.',
      'Compile the request through Magnanimous Video Director using Magnanimous-owned story, continuity, camera, audio, rights and cost policy.',
      `Prefer the existing Magnanimous ${row.native_target} execution surface when it can satisfy the outcome.`,
      row.risk==='high'?'Require explicit authorization and identity/consent checks before any likeness-sensitive execution.':'Preserve user rights and media authorization boundaries.',
      'Use free/native/browser/local execution first; route to funded replaceable specialized media compute only when the requested result truly requires it.',
      'Verify the resulting asset, preserve provenance and record reusable success/failure lessons.',
      'Do not infer that a benchmark feature is live merely because the contract has been absorbed.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{...VIDEOEXPRESS_PUBLIC_RESEARCH,capability:row.id,public_purpose:row.name,techniques:row.techniques,proprietary_implementation_copied:false}
  }));
}

export function getVideoExpressAbsorptionSummary(){
  const rows=getVideoExpressCapabilityManifest();
  const high=rows.filter(x=>x.initiative.action_class==='identity-sensitive-media-action').length;
  return {
    verified_at:VERIFIED_AT,
    benchmark:'VideoExpress AI',
    capability_contracts:rows.length,
    native_targets:new Set(rows.map(x=>x.native_target)).size,
    provider_required_for_identity:false,
    provider_required_for_memory:false,
    provider_required_for_planning:false,
    provider_required_for_orchestration:false,
    provider_required_for_verification:false,
    videoexpress_runtime_required:false,
    clean_room:true,
    identity_sensitive_contracts:high,
    public_sources:VIDEOEXPRESS_PUBLIC_RESEARCH.sources.length,
    explicit_truth_gaps:[
      'A public benchmark contract is not proof that every exact edit or render operation is already native and production-ready.',
      'High-end generative video, temporal inpainting/outpainting and advanced likeness animation can still require replaceable specialized compute until equivalent native runtime evidence exists.',
      'Face/voice/avatar likeness operations remain consent- and rights-gated and may not be used for deceptive impersonation.',
      'Commercial-use rights depend on the user having rights to source media and on the terms of whichever execution rail actually creates an asset.'
    ],
    status:'provider-neutral-video-benchmark-absorbed'
  };
}
