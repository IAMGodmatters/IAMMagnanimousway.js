const VERIFIED_AT='2026-10-07';

export const ARTLIST_EDITING_TOOLS_PUBLIC_RESEARCH=Object.freeze({
  verified_at:VERIFIED_AT,
  provider:'Artlist',
  source_kind:'official-public-tools-help-and-developer-documentation',
  sources:[
    'https://artlist.io/tools',
    'https://help.artlist.io/hc/en-us/articles/29671103091613-Using-the-Artlist-Hub',
    'https://help.artlist.io/hc/en-us/articles/29671537279901-Using-the-Artlist-Library-extension',
    'https://help.artlist.io/hc/en-us/articles/29664281032605-Using-Artlist-s-video-editing-plugins',
    'https://developer.artlist.io/welcome',
    'https://developer.artlist.io/authentication',
    'https://developer.artlist.io/general-terms',
    'https://developer.artlist.io/search/song/song-controller-get-songs',
    'https://developer.artlist.io/download/downloadable/downloadable-controller-get-downloadable-url'
  ],
  boundary:'Only publicly documented behavior and public tool names are used as a clean-room benchmark. Magnanimous does not copy Artlist binaries, extension source, plugin code, API credentials, private schemas, stock catalog data, paid assets, hidden prompts or proprietary implementation. Any direct API use requires a separately authorized compatible account and terms-compliant credentials.',
  documented_effect_names:Object.freeze([
    'Zoom Blur','Channel Mixer','Channel Swapper','Chromatic Aberration','Exposure Pro','Tone Coloring',
    'Cine Style','Classic Cine Style','Hue Colorize','Hue Shift','Derez','Energy Distortion','Fluid Distortion','Heat Distortion','Smoke Distortion','Witness Protection',
    'Audio Spectrum','Audio Waveform','Auto Volumetrics','Clouds','Cosmos','Drop Shadow','Electro','Grid','Picture-in-Picture','Split Screen Masking','Timecode',
    'Fill Color','Color Gradient','Film Damage','Film Grain','Flicker','Scan Lines','Stutter','TV Damage','Color Difference Key','Luminance Key','Remove Stock Background',
    'Auto Light Flares','Gleam','Inner Glow','Light Flares','Outer Glow','Super Glow','Invert Alpha','Fire','Rain on Glass','Shatter',
    'Sharpen','Unsharpen','Highpass Sharpen','Cartoon','Emboss','Find Edges','Threshold','Quad Warp','Page Curl'
  ])
});

const CAPABILITIES=Object.freeze([
  ['semantic-asset-search','Search creative assets by natural-language meaning rather than exact keywords','media-library','authorized-user-library-or-external-catalog','semantic query; typo tolerance; intent expansion; ranked results; rights-aware filtering','low'],
  ['project-artboards','Collect and organize candidate assets into reusable project boards','media-library','authorized-user-library','project board; asset membership; ordering; notes; add/remove; tenant isolation','low'],
  ['timeline-preview-sync','Preview music or media against an editor playhead before insertion','creative-studio','authorized-editor-extension','playhead context; preview start; beat/timing alignment; reversible audition; no destructive write','medium'],
  ['timeline-drag-drop-handoff','Hand an authorized library asset to an editor timeline with provenance intact','creative-studio','authorized-editor-extension','asset transfer; target timeline; source metadata; license note; rollback','medium'],
  ['download-format-preferences','Remember per-user preferred download/render formats without changing source rights','media-library','authorized-user-library','format preference; codec/container; quality; per-media defaults; reversible settings','low'],
  ['silence-removal','Detect and non-destructively remove or shorten unwanted silent regions','creative-studio','native-or-authorized-editor-runtime','voice activity detection; silence threshold; padding; preview; reversible edit','low'],
  ['auto-zoom','Generate subject-aware punch-ins and zooms for spoken or short-form video','creative-studio','native-or-authorized-editor-runtime','subject tracking; emphasis timing; scale limits; safe framing; preview; reversible edit','low'],
  ['creative-extension-manager','Install, update, enable and report status for approved creative extensions without making them part of Magnanimous identity','connector-hub','authorized-device-or-editor-runtime','catalog metadata; version; compatibility; install/update state; rollback; audit','medium'],
  ['effect-catalog-normalization','Map documented editor effect families into provider-neutral Magnanimous effect intents','creative-studio','native-or-authorized-editor-runtime','effect intent; parameters; host compatibility; preview; fallback; no binary copying','low'],
  ['music-catalog-api-search','Search an authorized music catalog with text, category, vocal, duration and BPM filters','media-library','authorized-enterprise-catalog-api','query; categories; vocal type; duration; bpm; pagination; rights metadata','medium'],
  ['music-catalog-stream-preview','Stream or preview authorized catalog music inside a Magnanimous-owned workflow','media-library','authorized-enterprise-catalog-api','authorized playback url; session scope; player controls; attribution/license metadata','medium'],
  ['music-catalog-download-handoff','Request a terms-compliant downloadable URL and hand the result to an authorized project','media-library','authorized-enterprise-catalog-api','downloadable id; short-lived url; intended project; provenance; audit','medium'],
  ['oauth-client-credentials-rail','Use server-side OAuth client credentials for authorized machine-to-machine creative APIs','connector-hub','authorized-enterprise-api-credentials','secret isolation; token exchange; expiry; scoped use; rotation; no client exposure','high'],
  ['creative-api-rate-limit-control','Respect provider rate limits and retry safely without duplicate paid actions','operations-hub','authorized-external-api','rate headers; per-endpoint limits; exponential backoff; idempotency; retry budget','low']
]);

const OWNED=Object.freeze([
  'intent','project-context','search-normalization','editor-workflow','format-preferences','effect-intent','provider-routing',
  'credential-boundary','rate-limit-policy','rights-policy','provenance','verification','failure-recovery','learning'
]);

function initiative(risk,boundary){
  const external=/authorized|external|editor|api|credential|device|catalog/.test(String(boundary||''));
  return Object.freeze({
    suggestive:true,
    auto_initiate:risk==='low'&&!external,
    requires_confirmation:risk!=='low'||external,
    action_class:risk==='high'?'credential-sensitive-connector-action':risk==='medium'?'authorized-editor-or-catalog-action':external?'authorized-external-creative-action':'safe-native-editing-planning'
  });
}

export function getArtlistEditingToolManifest(){
  return CAPABILITIES.map(([id,name,native_target,boundary,techniques,risk])=>Object.freeze({
    id:'artlist-editing-benchmark:'+id,
    connector_id:'artlist-editing-benchmark',
    connector_name:'Artlist public editing/API capability benchmark',
    category:'creative-editing-and-api-benchmark',
    capability:'artlist-editing-'+id,
    name,native_target,boundary,risk,
    techniques:techniques.split(';').map(x=>x.trim()).filter(Boolean),
    source_kind:'official-public-capability-benchmark',
    direct_connector:false,
    absorption_status:'brain-spec-absorbed',
    implementation_status:'specified-not-assumed-native',
    authorization_state:'not-assumed',
    magnanimous_owned:[...OWNED],
    initiative:initiative(risk,boundary),
    acceptance_tests:[
      'Magnanimous AI owns orchestration, project context, rights policy, verification and learning.',
      'Artlist binaries, plugin code, private API internals, credentials and catalog data are not copied.',
      'External editor/catalog/API access is used only when separately authorized and terms-compliant.',
      'Paid or variable-cost actions remain funding-gated and idempotent where applicable.',
      'Runtime readiness is not claimed from the benchmark alone.'
    ],
    research:{...ARTLIST_EDITING_TOOLS_PUBLIC_RESEARCH,capability:id,proprietary_implementation_copied:false}
  }));
}

export function getArtlistEditingToolSummary(){
  const rows=getArtlistEditingToolManifest();
  return {
    verified_at:VERIFIED_AT,
    clean_room:true,
    capabilities:rows.length,
    documented_effect_names:ARTLIST_EDITING_TOOLS_PUBLIC_RESEARCH.documented_effect_names.length,
    official_sources:ARTLIST_EDITING_TOOLS_PUBLIC_RESEARCH.sources.length,
    native_targets:[...new Set(rows.map(x=>x.native_target))].sort(),
    direct_artlist_runtime_required:false,
    external_editor_or_api_authorization_required:true,
    provider_specific_binaries_copied:false,
    provider_catalog_copied:false,
    free_native_first:true
  };
}
