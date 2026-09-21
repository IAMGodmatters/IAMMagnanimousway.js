import { CHATGPT_PLUGIN_CONTRACT_SNAPSHOT } from './magnanimous-chatgpt-plugin-capability-snapshot.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(v,n=8000)=>String(v??'').trim().slice(0,n);
const HEYGEN_BENCHMARK=CHATGPT_PLUGIN_CONTRACT_SNAPSHOT.find(x=>String(x.namespace||'').toLowerCase()==='heygen')||{tools:[]};

export const MAGNANIMOUS_NATIVE_MEDIA_POLICY=Object.freeze({
 identity:'Magnanimous Native Media Studio',
 brain:'Magnanimous AI',
 architecture:'first-party-media-orchestration-with-replaceable-local-renderers',
 external_app_required:false,
 heygen_required:false,
 proprietary_backend_copied:false,
 free_first:true,
 ownership:'Magnanimous owns planning, workflow state, policy, templates, brand rules, verification and routing. Heavy media models run on owner-controlled or replaceable compute.',
 truth_rule:'A media contract is not reported rendered until a native/self-hosted worker returns evidence of completion.'
});

export const MAGNANIMOUS_NATIVE_MEDIA_FAMILIES=Object.freeze([
 {id:'assets',capabilities:['asset.upload','asset.batch','asset.status','asset.library']},
 {id:'avatars',capabilities:['avatar.photo','avatar.digital_twin','avatar.prompt','avatar.looks','avatar.consent','avatar.render']},
 {id:'voices',capabilities:['voice.list','voice.design','voice.clone','voice.speech','voice.glossary']},
 {id:'video',capabilities:['video.avatar','video.image','video.studio','video.cinematic','video.batch','video.status','video.scenes']},
 {id:'post-production',capabilities:['video.lipsync','video.translate','video.clip','video.remove_fillers','video.captions']},
 {id:'brand',capabilities:['brand.kit','brand.glossary','brand.templates','brand.style']},
 {id:'audio',capabilities:['audio.music_search','audio.sfx_search']},
 {id:'jobs',capabilities:['job.list','job.status','job.cancel','job.batch_status']}
]);

export const MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES=Object.freeze(
 MAGNANIMOUS_NATIVE_MEDIA_FAMILIES.flatMap(f=>f.capabilities.map(id=>({id,family:f.id,native_contract:true})))
);

export const HEYGEN_VISIBLE_BENCHMARK_TOOLS=Object.freeze([...(HEYGEN_BENCHMARK.tools||[])].sort());

function rendererState(env){
 const url=clip(env?.FREE_AVATAR_RENDERER_URL,4000);
 return{
  browser_live_avatar:true,
  browser_speech:true,
  self_hosted_avatar_renderer_configured:Boolean(url),
  self_hosted_avatar_renderer_url_present:Boolean(url),
  heavy_gpu_features_require_compute:true,
  paid_media_provider_required:false
 };
}

export function getMagnanimousNativeMediaSummary(env){
 const execution=rendererState(env);
 return{
  ...MAGNANIMOUS_NATIVE_MEDIA_POLICY,
  status:execution.self_hosted_avatar_renderer_configured?'native-or-self-hosted-render-ready':'native-orchestration-ready-renderer-optional',
  family_count:MAGNANIMOUS_NATIVE_MEDIA_FAMILIES.length,
  capability_count:MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES.length,
  benchmark_tool_count:HEYGEN_VISIBLE_BENCHMARK_TOOLS.length,
  benchmark_tools:HEYGEN_VISIBLE_BENCHMARK_TOOLS,
  execution,
  open_interfaces:[
   'FFmpeg-compatible media composition',
   'LivePortrait/Wav2Lip-compatible avatar rendering',
   'Whisper-compatible transcription',
   'Piper/Coqui-compatible speech synthesis',
   'owner-controlled GPU worker adapters'
  ],
  note:'Observable product behaviors are normalized into Magnanimous contracts. No proprietary HeyGen implementation, prompts, weights, credentials, or private data are copied.'
 };
}

function workflowFor(goal){
 const q=String(goal||'').toLowerCase();
 const steps=[];
 if(/avatar|presenter|talking/.test(q))steps.push('avatar.select-or-create','voice.select-or-synthesize','video.avatar','video.captions');
 if(/translate|dub|language/.test(q))steps.push('transcribe','translate','voice.speech','video.lipsync','video.captions');
 if(/clip|short|reel|highlight/.test(q))steps.push('video.clip','video.captions','brand.style');
 if(/image.*video|animate.*image/.test(q))steps.push('video.image','voice.speech','video.captions');
 if(/template|brand/.test(q))steps.push('brand.kit','brand.glossary','brand.templates');
 if(/voice|speech|narrat/.test(q))steps.push('voice.design','voice.speech');
 if(!steps.length)steps.push('asset.upload','video.studio','voice.speech','video.captions','job.status');
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

async function renderAvatar(env,body){
 const text=clip(body.text,6000);
 if(!text)return json({detail:'text is required.'},400);
 const url=clip(env?.FREE_AVATAR_RENDERER_URL,4000);
 if(!url){
  return json({
   ok:true,
   rendered:false,
   mode:'browser-live-avatar',
   free:true,
   provider_dependency:false,
   note:'No server renderer is configured. Use the existing Magnanimous browser speech + animated avatar path, or attach an owner-controlled LivePortrait/Wav2Lip-compatible renderer.'
  });
 }
 const headers={'content-type':'application/json'};
 const token=clip(env?.FREE_AVATAR_RENDERER_TOKEN,8000);if(token)headers.authorization='Bearer '+token;
 const payload={
  agent_id:clip(body.agent_id,200)||'magnanimous',
  agent_name:clip(body.agent_name,200)||'Magnanimous AI',
  title:clip(body.title,300),
  text,
  avatar_id:clip(body.avatar_id,300)||'magnanimous',
  voice:clip(body.voice,300),
  callback_url:clip(body.callback_url,4000)
 };
 let response;
 try{
  response=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
 }catch(error){
  return json({ok:false,rendered:false,detail:'Native avatar renderer could not be reached.',error:clip(error?.message||error,1000)},502);
 }
 const data=await response.json().catch(()=>({}));
 if(!response.ok)return json({ok:false,rendered:false,detail:data?.detail||data?.error||('Avatar renderer failed ('+response.status+').')},502);
 return json({ok:true,rendered:true,provider_dependency:false,renderer:'owner-controlled-self-hosted',result:data});
}

export async function handleMagnanimousNativeMedia(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/magnanimous/native-media'))return null;

 if(request.method==='GET'&&path==='/api/magnanimous/native-media')return json(getMagnanimousNativeMediaSummary(env));
 if(request.method==='GET'&&path==='/api/magnanimous/native-media/catalog')return json({
  policy:MAGNANIMOUS_NATIVE_MEDIA_POLICY,
  families:MAGNANIMOUS_NATIVE_MEDIA_FAMILIES,
  capabilities:MAGNANIMOUS_NATIVE_MEDIA_CAPABILITIES,
  benchmark_tools:HEYGEN_VISIBLE_BENCHMARK_TOOLS
 });
 if(request.method==='POST'&&path==='/api/magnanimous/native-media/plan'){
  const body=await request.json().catch(()=>({})),goal=clip(body.goal||body.prompt,8000);
  if(!goal)return json({detail:'goal is required.'},400);
  const steps=workflowFor(goal);
  return json({ok:true,goal,steps,provider_dependency:false,brain:'Magnanimous AI',verification_required:true});
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
 return json({detail:'Magnanimous Native Media route not found.'},404);
}
