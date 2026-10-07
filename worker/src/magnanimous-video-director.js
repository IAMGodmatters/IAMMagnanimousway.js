const clip=(v,n=4000)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};

export const MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS=Object.freeze([
  {id:'creative',name:'Creative video',target:'cinema-engine',default_seconds:30,notes:'General purpose idea-to-video direction with scene, camera, audio and edit planning.'},
  {id:'narrative',name:'Narrative story',target:'cinema-engine',default_seconds:60,notes:'Narrated multi-scene story with continuity memory.'},
  {id:'consistent-character',name:'Consistent character story',target:'avatar-studio',default_seconds:45,notes:'Locks a character bible across scenes and references.'},
  {id:'viral-short',name:'Viral short',target:'creator-growth-engine',default_seconds:30,notes:'Vertical hook-first pacing, captions, pattern interrupts and payoff.'},
  {id:'motion-graphics',name:'Motion graphics explainer',target:'explainer-studio',default_seconds:45,notes:'Timed narration, text, icon/shape motion and visual teaching beats.'},
  {id:'documentary',name:'Documentary',target:'cinema-engine',default_seconds:90,notes:'Narrative spine, B-roll, maps/graphics and evidence-aware direction.'},
  {id:'animated-short',name:'Animated short',target:'animation-studio',default_seconds:60,notes:'Character/emotional beats with shot-level animation prompts.'},
  {id:'talking-head',name:'Realistic talking head',target:'avatar-studio',default_seconds:45,notes:'Direct-to-camera pacing, eye line, gestures, lip sync and captions.'},
  {id:'product-demo',name:'Product demo',target:'creative-studio',default_seconds:30,notes:'Product reference, feature shots, closeups, claims discipline and CTA.'},
  {id:'first-last-transition',name:'First/last frame transition',target:'cinema-engine',default_seconds:8,notes:'Explicit start/end visual anchors and transition-path planning.'},
  {id:'music-performance',name:'Music/performance video',target:'animation-studio',default_seconds:30,notes:'Beat-aware shots and authorized performance motion.'}
]);

const WORKFLOW_BY_ID=new Map(MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS.map(x=>[x.id,x]));

function sentences(text){
  const parts=clip(text,12000).split(/(?<=[.!?])\s+|\n+/).map(x=>clip(x,700)).filter(Boolean);
  return parts.length?parts:[clip(text,700)||'Create a clear visual opening, development, and ending.'];
}
function cameraFor(index,workflow){
  const general=['wide establishing shot','medium tracking shot','close-up with shallow depth of field','over-the-shoulder or contextual detail','slow push-in for emphasis','wide resolving shot'];
  const short=['tight hook shot','fast medium push-in','detail insert','dynamic tracking shot','close-up payoff','clean CTA frame'];
  const documentary=['wide location establishing shot','measured medium shot','detail/B-roll close-up','map or graphic insert','slow documentary push-in','wide resolving shot'];
  const list=workflow==='viral-short'?short:workflow==='documentary'?documentary:general;
  return list[index%list.length];
}
function scenePurpose(index,total,workflow){
  if(total===1)return'complete beat';
  if(index===0)return workflow==='viral-short'?'hook':'opening / establish';
  if(index===total-1)return workflow==='viral-short'?'payoff + CTA':'resolution / ending';
  return index<Math.ceil(total/2)?'build / reveal':'development / payoff';
}
function rightsPolicy(input){
  const sensitive=Boolean(input.face_swap||input.voice_clone||input.avatar_swap||input.action_replication||input.likeness_media);
  return {
    consent_required:sensitive,
    source_rights_required:true,
    deceptive_impersonation:false,
    likeness_sensitive:sensitive,
    licensed_assets_training_allowed:false,
    note:sensitive?'Use only people/voices/performances the user has the right and consent to use; do not misrepresent identity or endorsement.':'Use only source media, music, logos and copyrighted material the user has permission to use.'
  };
}
function buildCharacterBible(input){
  const character=clip(input.character,900);
  if(!character)return null;
  return {
    identity_anchor:character,
    preserve:['face/identity cues','hair','age range','body proportions','wardrobe unless intentionally changed','signature colors/accessories'],
    continuity_rule:'Repeat the same identity anchors in every scene prompt and explicitly describe any intentional state/wardrobe change.'
  };
}
function creativeMode(input){
  const requested=String(input.creation_mode||input.mode||'agent').trim().toLowerCase();
  return requested==='standard'||requested==='precision'?'standard':'agent';
}
function generationPreferences(input,workflow){
  const speed=clip(input.generation_priority||input.priority,40).toLowerCase();
  const priority=['quality','speed','cost'].includes(speed)?speed:'cost';
  const maxExternal=clamp(input.max_external_cost_usd,0,10000,0);
  return {
    mode:creativeMode(input),
    media_type:'video',
    workflow:workflow.id,
    priority,
    provider_neutral:true,
    capability_based_selection:true,
    user_selected_model:clip(input.model||input.model_id,120)||null,
    requested_features:[
      input.first_frame_description||input.last_frame_description?'start-end-frame':null,
      input.character?'character-continuity':null,
      input.likeness_media?'likeness-media':null,
      input.voice_clone?'voice-clone':null,
      input.reference_media?'multi-reference':null
    ].filter(Boolean),
    budget:{
      native_free_first:true,
      max_external_cost_usd:maxExternal,
      allow_unfunded_variable_cost:false,
      funded_provider_required:maxExternal>0,
      preflight_required:true
    }
  };
}

export function buildMagnanimousVideoDirectorPlan(input={}){
  const workflow=WORKFLOW_BY_ID.get(String(input.workflow||'creative'))||WORKFLOW_BY_ID.get('creative');
  const idea=clip(input.idea||input.prompt||input.script,12000);
  const title=clip(input.title,180)||'Magnanimous Video';
  const aspect=clip(input.aspect_ratio||input.aspect,20)|| (workflow.id==='viral-short'?'9:16':'16:9');
  const totalSeconds=clamp(input.seconds,3,180,workflow.default_seconds);
  const maxScenes=Math.round(clamp(input.max_scenes,1,18,workflow.id==='viral-short'?6:Math.min(12,Math.max(3,Math.ceil(totalSeconds/7)))));
  const raw=sentences(idea);
  const count=Math.min(maxScenes,Math.max(1,raw.length===1?Math.min(maxScenes,Math.max(3,Math.ceil(totalSeconds/8))):raw.length));
  const per=Math.max(2,Math.round(totalSeconds/count));
  const characterBible=buildCharacterBible(input);
  const style=clip(input.style,200)||'cinematic, natural, coherent, professional';
  const camera=clip(input.camera,300);
  const startFrame=clip(input.first_frame_description,700);
  const endFrame=clip(input.last_frame_description,700);
  const product=clip(input.product,700);
  const voice=clip(input.voice,300)||'natural, human-paced narration; do not read punctuation aloud';
  const soundtrack=clip(input.soundtrack,300)||'supportive music and sound effects that never overpower speech';
  const preferences=generationPreferences(input,workflow);
  const sceneList=[];
  for(let i=0;i<count;i++){
    const beat=raw[i%raw.length];
    const shot=camera||cameraFor(i,workflow.id);
    const continuity=[];
    if(characterBible)continuity.push('Preserve the character bible exactly.');
    if(product)continuity.push('Preserve product shape, labeling and color unless the script intentionally changes it.');
    if(i===0&&startFrame)continuity.push('Start-frame anchor: '+startFrame);
    if(i===count-1&&endFrame)continuity.push('End-frame anchor: '+endFrame);
    const visual=[beat,`Purpose: ${scenePurpose(i,count,workflow.id)}.`,`Visual style: ${style}.`,`Camera: ${shot}.`,...continuity].join(' ');
    sceneList.push({
      scene:i+1,
      seconds:i===count-1?Math.max(2,totalSeconds-per*(count-1)):per,
      purpose:scenePurpose(i,count,workflow.id),
      narration:beat,
      camera:shot,
      visual_prompt:visual,
      caption_strategy:workflow.id==='viral-short'?'large readable phrase captions, safe from UI edges':'readable captions with natural phrase breaks',
      audio:`Voice: ${voice}. Sound: ${soundtrack}.`
    });
  }
  const compiledPrompt=[
    `TITLE: ${title}`,
    `WORKFLOW: ${workflow.name}`,
    `CREATION MODE: ${preferences.mode==='agent'?'Magnanimous creative agent - automatic capability matching with user control preserved':'Magnanimous precision mode - preserve explicit user settings'}`,
    `FORMAT: ${aspect}; approximately ${totalSeconds} seconds`,
    `CORE IDEA: ${idea||'Create a coherent video from the supplied references and direction.'}`,
    characterBible?`CHARACTER BIBLE: ${characterBible.identity_anchor}. ${characterBible.continuity_rule}`:'',
    product?`PRODUCT ANCHOR: ${product}`:'',
    startFrame?`FIRST FRAME: ${startFrame}`:'',
    endFrame?`LAST FRAME: ${endFrame}`:'',
    `STYLE: ${style}`,
    `AUDIO: ${voice}. ${soundtrack}.`,
    'CONTINUITY: preserve identity, wardrobe, props, geography, lighting logic and screen direction unless a scene explicitly changes them.',
    'EDIT: use purposeful transitions, remove dead time, preserve speech intelligibility, keep captions readable, and end cleanly.',
    ...sceneList.map(s=>`SCENE ${s.scene} (${s.seconds}s): ${s.visual_prompt} Narration: ${s.narration}`)
  ].filter(Boolean).join('\n');
  return {
    identity:'Magnanimous AI',
    product:'Magnanimous Video Director',
    workflow:{...workflow},
    creation_mode:preferences.mode,
    title,
    aspect_ratio:aspect,
    total_seconds:totalSeconds,
    character_bible:characterBible,
    rights:rightsPolicy(input),
    first_last_frame:{first:startFrame||null,last:endFrame||null,enabled:Boolean(startFrame||endFrame)},
    scenes:sceneList,
    compiled_prompt:compiledPrompt,
    generation_preferences:preferences,
    session_context:{
      project_id:clip(input.project_id,160)||null,
      session_id:clip(input.session_id,160)||null,
      resumable:true,
      reuse_prior_assets:true,
      tenant_scoped:true
    },
    provenance_policy:{
      record_input_sources:true,
      record_prompt_and_settings:true,
      record_provider_and_model_privately:true,
      record_license_and_consent:true,
      licensed_stock_training_allowed:false,
      content_credentials:{
        standard:'C2PA',
        ai_disclosure_version:'2.4+',
        emit_when_supported:true,
        verified_claim_requires_signing_rail:true,
        unsupported_format_behavior:'retain-sidecar-provenance-without-claiming-verified-credentials'
      }
    },
    execution_policy:{native_first:true,free_first:true,provider_neutral:true,funded_specialized_compute_only:true,unfunded_variable_cost:false,proprietary_prompt_copied:false,capability_based_model_matching:true},
    next_surfaces:[
      {purpose:'generate',route:'/movie-maker'},
      {purpose:'record-upload-edit-live',route:'/video-stack'},
      {purpose:'assets',route:'/media-library'},
      {purpose:'avatar-video',route:'/video-agents'},
      {purpose:'social-publish',route:'/social-connect'}
    ]
  };
}

export function getMagnanimousVideoDirectorSummary(){
  return {
    identity:'Magnanimous AI',
    product:'Magnanimous Video Director',
    route:'/video-director',
    workflows:MAGNANIMOUS_VIDEO_DIRECTOR_WORKFLOWS.map(x=>({id:x.id,name:x.name,target:x.target})),
    planning_native:true,
    rendering_provider_neutral:true,
    free_first:true,
    likeness_actions_consent_gated:true,
    creative_agent_mode:true,
    precision_mode:true,
    capability_based_model_matching:true,
    generation_budget_preflight:true,
    resumable_project_context:true,
    media_provenance_tracking:true,
    c2pa_content_credentials_policy:true,
    licensed_assets_excluded_from_training:true
  };
}
