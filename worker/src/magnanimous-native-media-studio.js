import { CHATGPT_PLUGIN_CONTRACT_SNAPSHOT } from './magnanimous-chatgpt-plugin-capability-snapshot.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(v,n=8000)=>String(v??'').trim().slice(0,n);
const HEYGEN_BENCHMARK=CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.find(x=>String(x.namespace||'').toLowerCase()==='heygen')||{tools:[]};

export const MAGNANIMOUS_NATIVE_MEDIA_POLICY=Object.freeze({
 identity:'Magnanimous Native Media Studio',
 brain:'Magnanimous AI',
 architecture:'first-party-media-control-plane-with-owner-controlled-replaceable-workers',
 external_app_required:false,
 heygen_required:false,
 proprietary_backend_copied:false,
 free_first:true,
 owner_controls_compute:true,
 benchmark_only:'HeyGen visible tool contracts are parity references only, never runtime dependencies.',
 ownership:'Magnanimous owns planning, workflow state, policy, templates, brand rules, verification and routing. Heavy media models run on owner-controlled or replaceable compute.',
 truth_rule:'A media contract is not reported rendered or completed until a Magnanimous-native/self-hosted worker returns evidence of completion.'
});

export const MAGNANIMOUS_NATIVE_MEDIA_FAMILIES=Object.freeze([
 {id:'assets',capabilities:['asset.upload.prepare','asset.upload.complete','asset.batch.create','asset.batch.complete','asset.batch.get','asset.status.bulk','asset.list','asset.get','asset.delete']},
 {id:'avatars',capabilities:['avatar.group.list','avatar.group.get','avatar.group.update','avatar.group.delete','avatar.photo.create','avatar.digital_twin.create','avatar.prompt.create','avatar.consent.create','avatar.look.list','avatar.look.template.list','avatar.look.get','avatar.look.update','avatar.look.delete','avatar.render']},
 {id:'voices',capabilities:['voice.list','voice.model.list','voice.model.get','voice.model.delete','voice.design','voice.clone','voice.get','voice.delete','voice.speech','voice.glossary']},
 {id:'video',capabilities:['video.list','video.get','video.delete','video.status.bulk','video.scenes','video.avatar','video.image','video.studio','video.cinematic','video.batch.create','video.batch.get','video.player']},
 {id:'video-agent',capabilities:['video.agent.generate','video.agent.session.list','video.agent.session.get','video.agent.resource.get','video.agent.session.videos','video.agent.session.stop','video.agent.style.list']},
 {id:'post-production',capabilities:['video.clip.create','video.clip.list','video.clip.get','video.clip.delete','video.filler.remove','video.filler.get','video.lipsync.create','video.lipsync.list','video.lipsync.get','video.lipsync.update','video.lipsync.delete','video.lipsync.batch.create','video.lipsync.batch.get','video.lipsync.status.bulk','video.translate.create','video.translate.list','video.translate.get','video.translate.update','video.translate.delete','video.translate.languages','video.translate.batch.create','video.translate.batch.get','video.translate.status.bulk','video.captions']},
 {id:'brand',capabilities:['brand.glossary.list','brand.glossary.create','brand.glossary.get','brand.glossary.update','brand.glossary.delete','brand.kit.list','brand.kit.create','brand.kit.get','brand.kit.update','brand.kit.delete','brand.template.list','brand.template.get','brand.template.generate','brand.style']},
 {id:'audio',capabilities:['audio.search','audio.music.search','audio.sfx.search']},
 {id:'runtime',capabilities:['media.runtime.summary','media.operation.spec','media.operation.execute','job.status','job.cancel']}
]);

export const MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES=Object.freeze(
 MAGNANIMOUS_NATIVE_MEDIA_FAMILIES.flatMap(f=>f.capabilities.map(id=>({id,family:f.id,native_contract:true})))
);

export const HEYGEN_VISIBLE_BENCHMARK_TOOLS=Object.freeze([...(HEYGEN_BENCHMARK.tools||[])].sort());

function normalizedTool(tool){return String(tool||'').trim().replace(/^_+/,'').toLowerCase()}

export function nativeTargetForHeyGenTool(tool){
 const t=normalizedTool(tool);
 const exact={
  bulk_asset_statuses:'asset.status.bulk',
  create_asset_upload:'asset.upload.prepare',
  complete_asset_upload:'asset.upload.complete',
  create_asset_upload_batch:'asset.batch.create',
  complete_asset_batch:'asset.batch.complete',
  get_asset_batch:'asset.batch.get',
  list_assets:'asset.list',
  get_asset:'asset.get',
  delete_asset:'asset.delete',
  search_audio_sounds:'audio.search',
  list_avatar_groups:'avatar.group.list',
  get_avatar_group:'avatar.group.get',
  update_avatar_group:'avatar.group.update',
  delete_avatar_group:'avatar.group.delete',
  create_digital_twin:'avatar.digital_twin.create',
  create_photo_avatar:'avatar.photo.create',
  create_prompt_avatar:'avatar.prompt.create',
  create_avatar_consent:'avatar.consent.create',
  list_avatar_looks:'avatar.look.list',
  list_look_templates:'avatar.look.template.list',
  get_avatar_look:'avatar.look.get',
  update_avatar_look:'avatar.look.update',
  delete_avatar_look:'avatar.look.delete',
  create_video_batch:'video.batch.create',
  get_video_batch:'video.batch.get',
  bulk_video_statuses:'video.status.bulk',
  list_brand_glossaries:'brand.glossary.list',
  create_brand_glossary:'brand.glossary.create',
  get_brand_glossary:'brand.glossary.get',
  update_brand_glossary:'brand.glossary.update',
  delete_brand_glossary:'brand.glossary.delete',
  list_brand_kits:'brand.kit.list',
  create_brand_kit:'brand.kit.create',
  get_brand_kit:'brand.kit.get',
  update_brand_kit:'brand.kit.update',
  delete_brand_kit:'brand.kit.delete',
  create_filler_word_removal:'video.filler.remove',
  get_filler_word_removal:'video.filler.get',
  create_lipsync_batch:'video.lipsync.batch.create',
  get_lipsync_batch:'video.lipsync.batch.get',
  bulk_lipsync_statuses:'video.lipsync.status.bulk',
  list_lipsyncs:'video.lipsync.list',
  create_lipsync:'video.lipsync.create',
  get_lipsync:'video.lipsync.get',
  update_lipsync:'video.lipsync.update',
  delete_lipsync:'video.lipsync.delete',
  list_model_audio_voices:'voice.model.list',
  get_model_audio_voice:'voice.model.get',
  delete_model_audio_voice:'voice.model.delete',
  list_templates:'brand.template.list',
  get_template:'brand.template.get',
  generate_from_template:'brand.template.generate',
  get_current_user:'media.runtime.summary',
  list_video_agent_sessions:'video.agent.session.list',
  list_video_agent_styles:'video.agent.style.list',
  get_video_agent_session:'video.agent.session.get',
  get_video_agent_resource:'video.agent.resource.get',
  list_video_agent_session_videos:'video.agent.session.videos',
  stop_video_agent_session:'video.agent.session.stop',
  video_agent_generate:'video.agent.generate',
  list_video_translations:'video.translate.list',
  create_video_translation:'video.translate.create',
  get_video_translation:'video.translate.get',
  update_video_translation:'video.translate.update',
  delete_video_translation:'video.translate.delete',
  list_video_translation_languages:'video.translate.languages',
  create_video_translation_batch:'video.translate.batch.create',
  get_video_translation_batch:'video.translate.batch.get',
  bulk_video_translation_statuses:'video.translate.status.bulk',
  list_videos:'video.list',
  create_video_from_avatar:'video.avatar',
  create_video_from_cinematic_avatar:'video.cinematic',
  create_video_from_image:'video.image',
  create_video_from_studio:'video.studio',
  delete_video:'video.delete',
  get_video_scenes:'video.scenes',
  create_speech:'voice.speech',
  list_voices:'voice.list',
  design_voice:'voice.design',
  clone_voice:'voice.clone',
  get_voice:'voice.get',
  delete_voice:'voice.delete',
  get_video:'video.get',
  show_video:'video.player',
  get_ai_clipping:'video.clip.get',
  delete_ai_clipping:'video.clip.delete',
  list_ai_clipping:'video.clip.list',
  create_ai_clipping:'video.clip.create'
 };
 if(exact[t])return exact[t];
 if(t.includes('asset'))return'asset.'+t.replaceAll('_','.');
 if(t.includes('avatar'))return'avatar.'+t.replaceAll('_','.');
 if(t.includes('voice')||t.includes('speech'))return'voice.'+t.replaceAll('_','.');
 if(t.includes('translation'))return'video.translate.'+t.replaceAll('_','.');
 if(t.includes('lipsync'))return'video.lipsync.'+t.replaceAll('_','.');
 if(t.includes('video'))return'video.'+t.replaceAll('_','.');
 if(t.includes('brand'))return'brand.'+t.replaceAll('_','.');
 if(t.includes('template'))return'brand.template.'+t.replaceAll('_','.');
 if(t.includes('audio'))return'audio.'+t.replaceAll('_','.');
 return'media.operation.'+t.replaceAll('_','.');
}

function executionClass(tool,target){
 const t=normalizedTool(tool);
 if(t==='get_current_user'||t==='list_video_agent_styles')return'native-control-plane';
 if(target==='media.runtime.summary')return'native-control-plane';
 if(['brand.glossary.apply','brand.template.render'].includes(target))return'native-worker';
 if(t==='show_video')return'native-ui-contract';
 return'owner-controlled-media-worker';
}

export const MAGNANIMOUS_HEYGEN_PARITY_MAP=Object.freeze(
 HEYGEN_VISIBLE_BENCHMARK_TOOLS.map(tool=>{
  const native_target=nativeTargetForHeyGenTool(tool);
  return Object.freeze({benchmark_tool:tool,native_target,execution_class:executionClass(tool,native_target),external_provider_required:false});
 })
);

export const MAGNANIMOUS_NATIVE_MEDIA_STYLES=Object.freeze([
 {id:'cinematic-suspense',name:'Cinematic Suspense',tags:['cinematic'],aspect_ratios:['16:9','9:16']},
 {id:'documentary-nature',name:'Documentary Nature',tags:['cinematic','documentary'],aspect_ratios:['16:9','9:16']},
 {id:'monochrome-noir',name:'Monochrome Noir',tags:['cinematic','monochrome'],aspect_ratios:['16:9','9:16']},
 {id:'paper-craft',name:'Paper Craft',tags:['handmade'],aspect_ratios:['16:9','9:16']},
 {id:'retro-interface',name:'Retro Interface',tags:['retro-tech'],aspect_ratios:['16:9','9:16']},
 {id:'technical-blueprint',name:'Technical Blueprint',tags:['technical','handmade'],aspect_ratios:['16:9']},
 {id:'editorial-contact-sheet',name:'Editorial Contact Sheet',tags:['editorial'],aspect_ratios:['16:9','9:16']},
 {id:'bright-infomercial',name:'Bright Infomercial',tags:['commercial'],aspect_ratios:['16:9','9:16']}
]);

export const MAGNANIMOUS_MEDIA_PRIORITY_LANGUAGES=Object.freeze([
 'English','English (Philippines)','Filipino','Filipino (Philippines)','Filipino (Cebuano)','Spanish','French','German','Italian','Portuguese','Japanese','Korean','Chinese (Mandarin, Simplified)','Arabic','Hindi'
]);

function rendererState(env){
 const avatarUrl=clip(env?.FREE_AVATAR_RENDERER_URL,4000);
 const workerUrl=clip(env?.MAGNANIMOUS_MEDIA_WORKER_URL,4000);
 return{
  browser_live_avatar:true,
  browser_speech:true,
  self_hosted_avatar_renderer_configured:Boolean(avatarUrl),
  magnanimous_media_worker_configured:Boolean(workerUrl),
  heavy_gpu_features_require_compute:true,
  paid_media_provider_required:false,
  heygen_required:false
 };
}

export function getMagnanimousNativeMediaSummary(env){
 const execution=rendererState(env);
 const mapped=MAGNANIMOUS_HEYGEN_PARITY_MAP.length;
 return{
  ...MAGNANIMOUS_NATIVE_MEDIA_POLICY,
  status:execution.magnanimous_media_worker_configured?'native-control-plane-worker-ready':execution.self_hosted_avatar_renderer_configured?'native-control-plane-avatar-render-ready':'native-control-plane-ready-worker-optional',
  family_count:MAGNANIMOUS_NATIVE_MEDIA_FAMILIES.length,
  capability_count:MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES.length,
  benchmark_tool_count:HEYGEN_VISIBLE_BENCHMARK_TOOLS.length,
  parity_mapped_count:mapped,
  parity_complete:mapped===HEYGEN_VISIBLE_BENCHMARK_TOOLS.length,
  benchmark_tools:HEYGEN_VISIBLE_BENCHMARK_TOOLS,
  execution,
  styles:MAGNANIMOUS_NATIVE_MEDIA_STYLES,
  priority_languages:MAGNANIMOUS_MEDIA_PRIORITY_LANGUAGES,
  open_interfaces:[
   'FFmpeg-compatible media composition',
   'LivePortrait/Wav2Lip-compatible avatar rendering',
   'Whisper-compatible transcription',
   'Piper/Coqui-compatible speech synthesis',
   'owner-controlled GPU worker adapters',
   'Magnanimous Media Worker /v1/operations contract'
  ],
  note:'Observable product behaviors are normalized into Magnanimous contracts. No proprietary HeyGen implementation, prompts, weights, credentials, private data, or branded style assets are copied.'
 };
}

function workflowFor(goal){
 const q=String(goal||'').toLowerCase();
 const steps=[];
 if(/avatar|presenter|talking/.test(q))steps.push('avatar.select-or-create','voice.select-or-synthesize','video.avatar','video.captions');
 if(/translate|dub|language/.test(q))steps.push('transcribe','translate','voice.speech','video.lipsync','video.captions');
 if(/clip|short|reel|highlight/.test(q))steps.push('video.clip.create','video.captions','brand.style');
 if(/image.*video|animate.*image/.test(q))steps.push('video.image','voice.speech','video.captions');
 if(/template|brand/.test(q))steps.push('brand.kit.create','brand.glossary.create','brand.template.generate');
 if(/voice|speech|narrat/.test(q))steps.push('voice.design','voice.speech');
 if(/filler|um|uh|silence/.test(q))steps.push('video.filler.remove');
 if(!steps.length)steps.push('asset.upload.prepare','video.studio','voice.speech','video.captions','job.status');
 return [...new Set(steps)];
}

function escapeRegex(value){return String(value).replace(/[.*+?^$()|[\]\\{}]/g,'\\$&')}

function applyGlossary(text,terms){
 let out=String(text||'');
 for(const row of Array.isArray(terms)?terms:[]){
  const term=clip(row?.term,200),pronunciation=clip(row?.pronunciation,300);
  if(!term||!pronunciation)continue;
  out=out.replace(new RegExp(escapeRegex(term),'gi'),pronunciation);
 }
 return out;
}

function renderTemplate(template,variables){
 const vars=variables&&typeof variables==='object'&&!Array.isArray(variables)?variables:{};
 return String(template||'').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,(all,key)=>{
  const value=Object.prototype.hasOwnProperty.call(vars,key)?vars[key]:all;
  return value==null?'':String(value);
 });
}

function parityEntry(tool){
 const normalized=normalizedTool(tool);
 return MAGNANIMOUS_HEYGEN_PARITY_MAP.find(x=>normalizedTool(x.benchmark_tool)===normalized)||null;
}

async function dispatchMediaWorker(env,operation,input,benchmarkTool=''){
 const url=clip(env?.MAGNANIMOUS_MEDIA_WORKER_URL,4000);
 if(!url)return{ok:false,status:503,data:{detail:'Owner-controlled Magnanimous Media Worker is not configured.',operation,benchmark_tool:benchmarkTool,provider_dependency:false,heygen_required:false,activation_required:'Configure MAGNANIMOUS_MEDIA_WORKER_URL in Owner Provider Vault.'}};
 let parsed;try{parsed=new URL(url)}catch{}
 if(!parsed||parsed.protocol!=='https:')return{ok:false,status:503,data:{detail:'Magnanimous Media Worker URL must use HTTPS.',provider_dependency:false}};
 const headers={'content-type':'application/json','x-magnanimous-operation':operation};
 const token=clip(env?.MAGNANIMOUS_MEDIA_WORKER_TOKEN,8000);if(token)headers.authorization='Bearer '+token;
 const jobId='mmj_'+crypto.randomUUID();
 let response;
 try{
  response=await fetch(url.replace(/\/$/,'')+'/v1/operations',{method:'POST',headers,body:JSON.stringify({job_id:jobId,operation,input:input&&typeof input==='object'?input:{},benchmark_tool:benchmarkTool||null,brain:'Magnanimous AI'}),signal:AbortSignal.timeout(60000)});
 }catch(error){
  return{ok:false,status:502,data:{detail:'Magnanimous Media Worker could not be reached.',operation,job_id:jobId,error:clip(error?.message||error,1000),provider_dependency:false}};
 }
 const data=await response.json().catch(()=>({detail:'Magnanimous Media Worker returned a non-JSON response.'}));
 return{ok:response.ok,status:response.status,data:{...data,job_id:data?.job_id||jobId,operation,provider_dependency:false,worker:'owner-controlled-magnanimous-media-worker'}};
}

async function renderAvatar(env,body){
 const text=clip(body.text,6000);
 if(!text)return json({detail:'text is required.'},400);
 const url=clip(env?.FREE_AVATAR_RENDERER_URL,4000);
 if(!url){
  const worker=await dispatchMediaWorker(env,'video.avatar',body,'create_video_from_avatar');
  if(worker.ok||worker.status!==503)return json(worker.data,worker.status);
  return json({
   ok:true,
   rendered:false,
   mode:'browser-live-avatar',
   free:true,
   provider_dependency:false,
   heygen_required:false,
   note:'No server renderer is configured. The free Magnanimous browser speech + animated avatar path remains available. Configure the owner-controlled Magnanimous Media Worker for photorealistic rendering.'
  });
 }
 const headers={'content-type':'application/json'};
 const token=clip(env?.FREE_AVATAR_RENDERER_TOKEN,8000);if(token)headers.authorization='Bearer '+token;
 const payload={agent_id:clip(body.agent_id,200)||'magnanimous',agent_name:clip(body.agent_name,200)||'Magnanimous AI',title:clip(body.title,300),text,avatar_id:clip(body.avatar_id,300)||'magnanimous',voice:clip(body.voice,300),callback_url:clip(body.callback_url,4000)};
 let response;
 try{
  response=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
 }catch(error){
  return json({ok:false,rendered:false,detail:'Native avatar renderer could not be reached.',error:clip(error?.message||error,1000)},502);
 }
 const data=await response.json().catch(()=>({}));
 if(!response.ok)return json({ok:false,rendered:false,detail:data?.detail||data?.error||('Avatar renderer failed ('+response.status+').')},502);
 return json({ok:true,rendered:true,provider_dependency:false,heygen_required:false,renderer:'owner-controlled-self-hosted',result:data});
}

export async function handleMagnanimousNativeMedia(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-media'))return null;

 if(request.method==='GET'&&path==='/api/magnanimous/native-media')return json(getMagnanimousNativeMediaSummary(env));
 if(request.method==='GET'&&path==='/api/magnanimous/native-media/catalog')return json({policy:MAGNANIMOUS_NATIVE_MEDIA_POLICY,families:MAGNANIMOUS_NATIVE_MEDIA_FAMILIES,capabilities:MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES,benchmark_tools:HEYGEN_VISIBLE_BENCHMARK_TOOLS,parity_map:MAGNANIMOUS_HEYGEN_PARITY_MAP,styles:MAGNANIMOUS_NATIVE_MEDIA_STYLES,priority_languages:MAGNANIMOUS_MEDIA_PRIORITY_LANGUAGES});
 if(request.method==='GET'&&path==='/api/magnanimous/native-media/parity')return json({benchmark:'HeyGen observable tool surface',provider_required:false,mapped_count:MAGNANIMOUS_HEYGEN_PARITY_MAP.length,benchmark_count:HEYGEN_VISIBLE_BENCHMARK_TOOLS.length,complete:MAGNANIMOUS_HEYGEN_PARITY_MAP.length===HEYGEN_VISIBLE_BENCHMARK_TOOLS.length,map:MAGNANIMOUS_HEYGEN_PARITY_MAP});
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/plan'){
  const body=await request.json().catch(()=>({})),goal=clip(body.goal||body.prompt,8000);
  if(!goal)return json({detail:'goal is required.'},400);
  return json({ok:true,goal,steps:workflowFor(goal),provider_dependency:false,heygen_required:false,brain:'Magnanimous AI',verification_required:true});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/render-avatar'){
  const body=await request.json().catch(()=>({}));
  return renderAvatar(env,body);
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/glossary/apply'){
  const body=await request.json().catch(()=>({})),text=clip(body.text,20000);
  return json({ok:true,original_text:text,synthesis_text:applyGlossary(text,body.terms),caption_text:text,provider_dependency:false});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/template/render'){
  const body=await request.json().catch(()=>({}));
  const template=clip(body.template,50000);
  if(!template)return json({detail:'template is required.'},400);
  return json({ok:true,output:renderTemplate(template,body.variables),provider_dependency:false});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/operation/spec'){
  const body=await request.json().catch(()=>({})),benchmarkTool=clip(body.benchmark_tool||body.tool,200);
  const entry=parityEntry(benchmarkTool);
  if(!entry)return json({detail:'Unknown HeyGen benchmark tool.',benchmark_tool:benchmarkTool,available:HEYGEN_VISIBLE_BENCHMARK_TOOLS},404);
  return json({ok:true,...entry,worker_configured:rendererState(env).magnanimous_media_worker_configured,provider_dependency:false,truth_rule:MAGNANIMOUS_NATIVE_MEDIA_POLICY.truth_rule});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/operation/execute'){
  const body=await request.json().catch(()=>({})),benchmarkTool=clip(body.benchmark_tool||body.tool,200);
  const entry=parityEntry(benchmarkTool);
  if(!entry)return json({detail:'Unknown HeyGen benchmark tool.',benchmark_tool:benchmarkTool},404);
  if(normalizedTool(benchmarkTool)==='get_current_user')return json({ok:true,runtime:getMagnanimousNativeMediaSummary(env),provider_dependency:false});
  if(normalizedTool(benchmarkTool)==='list_video_agent_styles')return json({ok:true,items:MAGNANIMOUS_NATIVE_MEDIA_STYLES,provider_dependency:false});
  const dispatched=await dispatchMediaWorker(env,entry.native_target,body.input||{},benchmarkTool);
  return json({...dispatched.data,parity:entry},dispatched.status);
 }
 return json({detail:'Magnanimous Native Media route not found.'},404);
}
