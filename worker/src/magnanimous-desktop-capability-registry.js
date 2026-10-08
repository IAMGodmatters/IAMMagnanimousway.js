const VERIFIED_AT='2026-10-08';

export const MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  source_kind:'user-authorized-desktop-and-drive-inventory-plus-official-package-catalog',
  inventories:[
    'SING-STAR-PC-GAMES (user-authorized shared Drive inventory)',
    'SING STAR PC SOFTWARE (user-authorized shared Drive inventory)',
    'Mobile Software (user-authorized shared Drive inventory)',
    'DESKTOP-CK5F50S Downloads and approved D: tool staging area'
  ],
  official_tool_targets:Object.freeze([
    ['7zip.7zip','archive-engine'],
    ['Gyan.FFmpeg','media-engine'],
    ['OBSProject.OBSStudio','capture-engine'],
    ['BlenderFoundation.Blender','3d-engine'],
    ['ImageMagick.ImageMagick','image-engine'],
    ['Audacity.Audacity','audio-engine'],
    ['HandBrake.HandBrake','media-engine'],
    ['KDE.Krita','image-engine'],
    ['Genymobile.scrcpy','device-engine'],
    ['VideoLAN.VLC','media-engine'],
    ['GIMP.GIMP','image-engine']
  ]),
  boundary:'Shared game/software archives are an inventory and clean-room capability benchmark only. Magnanimous does not copy proprietary game or application source, copyrighted assets, cracked/modded packages, activation bypasses, license keys, hidden internals, or unknown executables. Execution must use first-party code, open standards, properly licensed/open-source tools, or an authorized replaceable provider.',
  blocked_binary_classes:Object.freeze([
    'KMS or activation-bypass tools',
    'cracks, repacks, keygens and patched premium applications',
    'premium-mod or CracksHash APKs',
    'unknown game archives and ISO images without verified redistribution rights',
    'adult-content mod packages',
    'unverified installers from shared archives'
  ])
});

const OWNED=Object.freeze([
  'intent-understanding','planning','policy','memory','workflow-orchestration','tool-selection',
  'rights-and-license-policy','result-normalization','verification','failure-recovery','outcome-learning'
]);

const CAPABILITIES=Object.freeze([
  ['archive-compress-extract','Create, inspect, compress and extract archives','archive-engine','approved-local-tool','7-Zip style archive workflow; format detection; bounded extraction; path traversal protection','low'],
  ['media-probe-transcode','Probe, transcode, remux and normalize media','media-engine','approved-local-tool','FFmpeg/HandBrake style codec probe; transcode; remux; resize; bitrate and container normalization','low'],
  ['screen-record-live-compose','Record screen/camera/audio and compose live scenes','capture-engine','owner-device-capability','OBS-style sources; scenes; audio mix; recording; streaming handoff','medium'],
  ['3d-scene-render-export','Build and render 3D scenes and export standard assets','3d-engine','approved-local-tool','Blender-style scene graph; geometry; materials; camera; render; standard export','low'],
  ['image-batch-transform','Resize, crop, convert, composite and batch-process images','image-engine','approved-local-tool','ImageMagick-style deterministic image pipeline; metadata-safe output; bounded batch','low'],
  ['image-edit-paint','Edit raster artwork and create layered visual assets','image-engine','approved-local-tool','GIMP/Krita style layers; masks; crop; paint; text; export','low'],
  ['audio-edit-cleanup','Trim, normalize, filter and export audio','audio-engine','approved-local-tool','Audacity-style waveform editing; normalization; noise cleanup; fade; export','low'],
  ['device-mirror-control','Mirror and control an owner-authorized Android device','device-engine','owner-device-capability','scrcpy-style local device discovery; mirror; input; recording; explicit device authorization','medium'],
  ['media-playback-validation','Play and validate common media formats','media-engine','approved-local-tool','VLC-style playback probe; track selection; subtitle verification; codec fallback','low'],
  ['storage-analysis','Measure disk usage and identify large/duplicate candidates','storage-engine','owner-device-capability','TreeSize-style inventory; size aggregation; duplicate candidate detection; no destructive action by default','medium'],
  ['file-manager-workflow','Copy, move, rename, compare and organize files','workspace-files','owner-device-capability','dual-pane/file-manager patterns; deterministic paths; verification before removal','medium'],
  ['virtual-machine-sandbox','Run risky or incompatible workloads in an isolated virtual machine','sandbox-engine','authorized-local-virtualization','VM lifecycle; snapshot; isolated network; rollback; no license bypass','medium'],
  ['sip-softphone-workflow','Place and receive authorized SIP/VoIP sessions through configured accounts','communications-hub','authorized-telecom-account','softphone registration; audio device selection; call state; fail-closed telecom policy','high'],
  ['video-timeline-editing','Assemble clips, transitions, captions and audio on a timeline','creative-studio','none-or-approved-local-tool','non-destructive timeline; trim; split; captions; transitions; audio sync; export','low'],
  ['video-enhancement-upscale','Enhance or upscale owned video with replaceable compute','creative-studio','approved-local-tool-or-compute','denoise; deinterlace; upscale; frame interpolation; before/after verification','medium'],
  ['background-removal-segmentation','Remove or replace image/video backgrounds','creative-studio','approved-local-tool-or-compute','segmentation; mask cleanup; alpha export; replacement background; quality verification','low'],
  ['noise-suppression','Suppress background noise for calls and recordings','voice-engine','approved-local-tool-or-compute','noise profile; speech preservation; gain control; latency and artifact check','low'],
  ['document-pdf-workflow','Create, inspect, transform and organize documents/PDFs','workspace-files','approved-local-tool','page/text/image operations; conversion; metadata; redaction boundary; export','low'],
  ['download-transfer-management','Resume, verify and organize authorized downloads','storage-engine','owner-device-capability','bounded download queue; resume; checksum; destination policy; provenance record','medium'],
  ['system-recovery-diagnostics','Inspect boot/storage/system health and prepare recovery actions','operations-hub','owner-device-capability','read-first diagnostics; recovery media planning; explicit approval before destructive repair','high'],
  ['game-state-machine','Model deterministic application/game states and transitions','experience-engine','none','finite-state machines; transitions; guards; rollback; persistence','low'],
  ['quest-workflow-engine','Represent goals as multi-step quests with prerequisites and completion checks','workflow-engine','none','objective graph; prerequisites; progress; completion; reward hook','low'],
  ['progression-achievements','Track progress, levels, streaks and achievements','engagement-engine','none','progress counters; milestones; badges; non-manipulative reward policy','low'],
  ['inventory-resource-system','Track bounded user/project resources and inventory items','data-platform','none','typed inventory; quantity; ownership; acquire/use/transfer; audit','low'],
  ['economy-budget-simulation','Simulate resource costs and constrained allocation without gambling','operations-hub','none','budget ledger; resource sinks/sources; scenario simulation; no wagering mechanics','low'],
  ['checkpoint-save-restore','Persist and restore resumable application state','memory-engine','none','checkpoint schema; versioning; atomic save; restore; rollback','low'],
  ['input-controller-mapping','Normalize keyboard, pointer, touch and controller inputs','experience-engine','owner-device-capability','input map; remapping; accessibility; device fallback','medium'],
  ['physics-collision-simulation','Model bounded movement, collisions and spatial constraints','simulation-engine','none','time step; collision bounds; deterministic simulation; performance budget','low'],
  ['pathfinding-navigation','Find routes through a bounded graph or spatial map','simulation-engine','none','graph search; costs; obstacles; route recalculation; explainable path result','low'],
  ['multiplayer-session-model','Coordinate multi-user sessions without copying a game network stack','realtime-engine','authorized-network-session','lobby; presence; state sync; conflict resolution; abuse controls','medium'],
  ['sandbox-simulation-loop','Run repeatable simulations with state, agents, events and outcomes','simulation-engine','none','tick loop; entities; event queue; rules; metrics; deterministic replay','low'],
  ['tutorial-onboarding-flow','Teach a workflow progressively with contextual guidance','experience-engine','none','guided steps; hints; checkpoints; skip/replay; accessibility','low'],
  ['plugin-mod-extension-contract','Expose stable extension points without loading untrusted code by default','universal-tool-gateway','authorized-extension','versioned contract; capability declaration; sandbox; permission gate; disable/rollback','medium'],
  ['performance-telemetry-loop','Measure runtime latency, errors, resource use and regressions','operations-hub','none','metrics; traces; thresholds; baseline; regression alert; privacy filtering','low']
]);

function initiative(risk,boundary){
  const external=/owner-device|authorized|compute|tool/.test(String(boundary||''));
  return Object.freeze({
    suggestive:true,
    auto_initiate:risk==='low'&&!external,
    requires_confirmation:risk!=='low'||external,
    action_class:risk==='high'?'sensitive-local-or-telecom-action':risk==='medium'?'bounded-local-action':external?'approved-tool-action':'safe-native-planning'
  });
}

export const MAGNANIMOUS_DESKTOP_CAPABILITY_BENCHMARKS=Object.freeze(CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
  id,name,native_target,boundary,risk,
  techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean)
})));

export function getDesktopCapabilityManifest(){
  return MAGNANIMOUS_DESKTOP_CAPABILITY_BENCHMARKS.map(row=>({
    id:'desktop-intake:'+row.id,
    connector_id:'desktop-intake',
    connector_name:'Magnanimous authorized desktop/software/game capability intake',
    category:'desktop-clean-room-capability-benchmark',
    capability:'desktop-'+row.id,
    native_target:row.native_target,
    priority:'owner-requested',
    source_kind:MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.source_kind,
    direct_connector:false,
    boundary:row.boundary,
    absorption_status:'brain-spec-absorbed',
    implementation_status:'specified-not-assumed-native',
    magnanimous_owned:[...OWNED],
    external_only:row.boundary==='none'?[]:[row.boundary],
    techniques:row.techniques,
    acceptance_tests:[
      'Magnanimous owns the normalized workflow, policy, orchestration, verification and learning contract.',
      'No proprietary game/application code or copyrighted asset is required by the capability contract.',
      'Cracked, modded, repacked, activation-bypass or unknown binaries are never used as a runtime dependency.',
      'Execution uses first-party code, open standards, properly licensed/open-source tools, or an authorized replaceable provider.',
      'Native status is granted only after runtime evidence and regression verification for the exact operation.'
    ],
    recipe:[
      'Identify the useful observable capability without extracting or copying proprietary implementation.',
      `Route the outcome toward the Magnanimous ${row.native_target} surface.`,
      'Prefer native and free/open-source execution when it is capable and authorized.',
      'Keep owner-device, telecom, external compute and local-tool actions behind explicit safety and authorization boundaries.',
      'Verify the result and record reusable outcome evidence without retaining restricted third-party internals.'
    ],
    search_text:row.name+' '+row.techniques.join(' '),
    authorization_state:'not-assumed',
    initiative:initiative(row.risk,row.boundary),
    research:{...MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH,capability:row.id,public_purpose:row.name,techniques:row.techniques,proprietary_implementation_copied:false,cracked_or_modded_binary_reused:false,license_bypass_allowed:false}
  }));
}

export function getDesktopCapabilityAbsorptionSummary(){
  const rows=getDesktopCapabilityManifest();
  return {
    verified_at:VERIFIED_AT,
    benchmark:'Authorized desktop, PC software, mobile software and PC game inventory',
    capability_contracts:rows.length,
    native_targets:new Set(rows.map(x=>x.native_target)).size,
    official_tool_targets:MAGNANIMOUS_DESKTOP_INTAKE_RESEARCH.official_tool_targets.length,
    shared_archive_runtime_required:false,
    cracked_or_modded_binary_reused:false,
    license_bypass_allowed:false,
    proprietary_implementation_copied:false,
    clean_room:true,
    free_and_open_source_first:true,
    explicit_truth_gaps:[
      'Inventorying a commercial application or game does not grant source, redistribution, modification or platform-integration rights.',
      'A normalized capability contract is not proof that the exact capability is already executable natively.',
      'Unknown archives remain quarantined from execution until provenance, license and malware safety are independently verified.',
      'Owner-device and telecom actions remain permission- and policy-gated even when a local tool is available.'
    ],
    status:'desktop-capability-intake-absorbed-clean-room'
  };
}
