// Platform-wide preferred software directive for I AM MAGNANIMOUS WAY.
// Records the owner's free/open-source/free-tier substitutions without copying proprietary internals.

export const MAGNANIMOUS_SOFTWARE_DIRECTIVE=Object.freeze({
  captured_at:'2026-10-14',
  identity_owner:'Magnanimous AI',
  policy:'free-native-open-source-first',
  selection_rule:'Prefer the named substitute whenever it can satisfy the requested workflow. Keep proprietary free-tier/free-edition tools explicitly labeled and never auto-upgrade to a paid tier.',
  installation_rule:'Tool selection and workflow guidance may be automatic; installation, account connection, paid upgrade, destructive migration, or external publishing still uses the existing permission/confirmation gates.',
  proprietary_copying:false
});

export const MAGNANIMOUS_PREFERRED_SOFTWARE=Object.freeze([
  Object.freeze({id:'gimp',name:'GIMP',replaces:['Adobe Photoshop'],purpose:'Raster image editing, retouching and composition.',license_class:'free-open-source-gpl-3-plus',cost_policy:'free',official_url:'https://www.gimp.org/',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'inkscape',name:'Inkscape',replaces:['Adobe Illustrator'],purpose:'Vector illustration, SVG authoring and export.',license_class:'free-open-source-gpl-2',cost_policy:'free',official_url:'https://inkscape.org/',native_target:'design-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'natron',name:'Natron',replaces:['Adobe After Effects'],purpose:'Node-based compositing, VFX and motion-compositing workflows.',license_class:'free-open-source-gpl-2',cost_policy:'free',official_url:'https://natrongithub.github.io/',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'davinci-resolve',name:'DaVinci Resolve',replaces:['Adobe Premiere Pro'],purpose:'Full video editing, color, VFX and audio post when the free edition covers the job.',license_class:'free-edition-proprietary',cost_policy:'free-edition-first-no-studio-upgrade-without-explicit-approval',official_url:'https://www.blackmagicdesign.com/products/davinciresolve',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'kdenlive',name:'Kdenlive',replaces:['Adobe Premiere quick cuts'],purpose:'Fast cuts, assembly, timeline editing, subtitles and lightweight NLE workflows.',license_class:'free-open-source-gpl',cost_policy:'free',official_url:'https://kdenlive.org/',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'figma',name:'Figma',replaces:['Adobe XD'],purpose:'UI/UX design, wireframes, prototypes and handoff using the free Starter tier where sufficient.',license_class:'free-tier-proprietary',cost_policy:'free-starter-first-no-paid-seat-without-explicit-approval',official_url:'https://www.figma.com/',native_target:'product-design-agent',boundary:'optional-external-account-tool',status:'preferred'}),
  Object.freeze({id:'blender',name:'Blender',replaces:['Cinema 4D','Autodesk 3ds Max'],purpose:'3D modeling, animation, rendering, compositing and scene creation.',license_class:'free-open-source-gpl',cost_policy:'free',official_url:'https://www.blender.org/',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'libreoffice',name:'LibreOffice',replaces:['Microsoft Office / Microsoft 365 desktop productivity'],purpose:'Documents, spreadsheets, presentations and office-file workflows.',license_class:'free-open-source-mpl-2',cost_policy:'free',official_url:'https://www.libreoffice.org/',native_target:'business-operating-system',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'bitwarden',name:'Bitwarden',replaces:['paid password-manager subscription'],purpose:'Password-vault workflow and credential hygiene using the free/open core first.',license_class:'open-source-core-plus-source-available-modules',cost_policy:'free-core-first-no-paid-organization-feature-without-explicit-approval',official_url:'https://bitwarden.com/',native_target:'universal-tool-gateway',boundary:'optional-external-security-tool',status:'preferred'}),
  Object.freeze({id:'audacity',name:'Audacity',replaces:['paid audio editor'],purpose:'Audio recording, cleanup, editing and export.',license_class:'free-open-source-gpl-2',cost_policy:'free',official_url:'https://www.audacityteam.org/',native_target:'creative-studio',boundary:'optional-local-external-tool',status:'preferred'}),
  Object.freeze({id:'libphonenumber-js',name:'libphonenumber-js',replaces:['metered basic phone-number formatting/validation APIs'],purpose:'Native server-side phone parsing, E.164 formatting and numbering-plan validation for B2B, CRM, contact center and telecom intake.',license_class:'free-open-source-mit',cost_policy:'free-native-runtime',official_url:'https://github.com/catamphetamine/libphonenumber-js',native_target:'contact-validation',boundary:'none',status:'native-runtime'})
]);

export function getSoftwareDirectiveCapabilityManifest(){
  return MAGNANIMOUS_PREFERRED_SOFTWARE.map(row=>Object.freeze({
    id:`software-directive:${row.id}`,connector_id:'magnanimous-software-directive',connector_name:'Magnanimous Free-First Software Directive',category:'software-directive',capability:`preferred-tool-${row.id}`,
    native_target:row.native_target,priority:'owner-directive',source_kind:'user-directed-independently-verified-public-tool-policy',direct_connector:false,boundary:row.boundary,absorption_status:'brain-spec-absorbed',
    implementation_status:row.status==='native-runtime'?'native-runtime-proven':'workflow-preference-proven-tool-installation-not-assumed',magnanimous_owned:['tool-selection-policy','cost-policy','workflow-planning','verification','fallback-selection'],
    external_only:row.boundary==='none'?[]:['local application installation or external account/runtime when actually used'],techniques:[`Prefer ${row.name} for ${row.purpose}`,`Replace ${row.replaces.join(' / ')} for this workflow when capability fit is sufficient`,'Keep free-first cost policy explicit','Verify output before declaring workflow complete'],
    search_text:`${row.name} ${row.replaces.join(' ')} ${row.purpose}`,authorization_state:row.boundary==='none'?'magnanimous-first-party-runtime':'installation-or-account-not-assumed',initiative:Object.freeze({suggestive:true,auto_initiate:true,requires_confirmation:false,action_class:'tool-selection-guidance'}),
    research:{captured_at:'2026-10-14',official_url:row.official_url,license_class:row.license_class,cost_policy:row.cost_policy,proprietary_implementation_copied:false,installation_not_assumed:true}
  }));
}

export function getSoftwareDirectiveSummary(){
  const manifest=getSoftwareDirectiveCapabilityManifest();
  return {identity:'Magnanimous AI',preferred_tools:MAGNANIMOUS_PREFERRED_SOFTWARE.length,capability_contracts:manifest.length,free_first:true,open_source_first:true,proprietary_free_tier_explicit:true,paid_upgrade_requires_explicit_approval:true,proprietary_implementation_copied:false};
}
