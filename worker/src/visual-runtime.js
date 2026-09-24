import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

function googleReady(env){return Boolean(String(env?.GOOGLE_API_KEY||'').trim())}
function cloudflareReady(env){return env?.AI!=null&&String(env?.MAGNANIMOUS_RUNTIME||'')!=='standalone-node'}
function magnanimousImageReady(env){return env?.MAGNANIMOUS_IMAGE_GENERATOR?.configured===true}
function proceduralImageReady(){return true}
function imageReady(env){return magnanimousImageReady(env)||cloudflareReady(env)||proceduralImageReady()}
function veoEnabled(env){return googleReady(env)&&String(env?.ENABLE_VEO_PROVIDER||'').toLowerCase()==='true'}

export function visualProviderSnapshot(env){
 const providers=[
  {
   id:'iam-cinematic-free',name:'I AM Cinematic Free',type:'video-effects',tier:'free-first',free:true,
   configured:imageReady(env),enabled:imageReady(env),
   note:'Free-first cinematic pipeline. Uses the Magnanimous/local image rail when configured, otherwise falls back to Magnanimous-owned procedural scene rendering with no external image provider required.'
  },
  {
   id:'magnanimous-native-procedural-scene',name:'Magnanimous Native Procedural Scene',type:'image-generation',tier:'first-party-zero-cost',free:true,
   configured:true,enabled:true,model:'magnanimous-procedural-v1',
   note:'First-party deterministic SVG scene renderer. It preserves free visual output when no external or self-hosted generative image model is configured.'
  },
  {
   id:'magnanimous-native-image',name:'Magnanimous Native Image',type:'image-generation',tier:'self-hosted-or-compatible',free:true,
   configured:magnanimousImageReady(env),enabled:magnanimousImageReady(env),model:String(env?.MAGNANIMOUS_IMAGE_MODEL||'local-stable-diffusion'),
   note:'Magnanimous-owned image-generation contract using a local Automatic1111/Stable Diffusion server or an OpenAI-compatible image endpoint. No Cloudflare runtime dependency.'
  },
  {
   id:'cloudflare-flux-free',name:'Legacy Edge FLUX Fallback',type:'image-generation',tier:'rollback-only',free:true,
   configured:cloudflareReady(env),enabled:cloudflareReady(env),model:'@cf/black-forest-labs/flux-1-schnell',
   note:'Legacy production rollback path only while the old edge runtime remains active. Standalone Magnanimous does not depend on it.'
  },
  {
   id:'google-gemini-visual-director',name:'Google Gemini Visual Director',type:'visual-planning',tier:'free-tier',free:true,
   configured:googleReady(env),enabled:googleReady(env),model:'gemini-3.1-flash-lite',
   note:'Uses Gemini free-tier text/multimodal reasoning to turn a message into a stronger cinematic scene prompt. It does not claim free Google image/video generation.'
  },
  {
   id:'google-veo-3.1-lite',name:'Google Veo 3.1 Lite',type:'video-generation',tier:'paid-api',free:false,
   configured:googleReady(env),enabled:veoEnabled(env),model:'veo-3.1-lite-generate-preview',
   note:'Official Veo provider entry. Google currently does not offer Veo 3.1 on the Gemini API free tier, so it stays opt-in instead of silently creating charges.'
  }
 ];
 const ready=providers.filter(p=>p.configured&&p.enabled);
 return {providers,configured_count:ready.length,free_configured_count:ready.filter(p=>p.free).length,free_first:true};
}

function baseScenePrompt(title,text,style){
 const subject=String(text||title||'inspiring cinematic scene').replace(/\s+/g,' ').trim().slice(0,900);
 const styles={
  cinematic:'cinematic photorealistic film still, dramatic natural lighting, rich depth, professional composition, subtle atmosphere',
  realistic:'photorealistic editorial photography, natural light, realistic textures, believable environment, professional composition',
  faith:'hopeful cinematic scene, warm sunrise light, peaceful atmosphere, reverent visual symbolism, realistic photography, no written words',
  business:'premium modern business campaign photography, clean professional environment, confident mood, cinematic lighting, realistic people and details',
  social:'high-impact social media campaign visual, strong focal subject, cinematic lighting, crisp modern composition, energetic but realistic',
  nature:'cinematic nature photography, dramatic landscape light, atmospheric depth, highly detailed realistic environment'
 };
 return `${styles[style]||styles.cinematic}. Visualize this message: ${subject}. No captions, logos, watermarks, letters, typography, interface elements, or written text in the image.`;
}

async function geminiDirect(env,title,text,style){
 const fallback=baseScenePrompt(title,text,style);
 if(!googleReady(env))return {prompt:fallback,director:'built-in'};
 const model=String(env.GOOGLE_VISUAL_MODEL||'gemini-3.1-flash-lite').trim();
 const instruction=`You are a cinematic visual director. Rewrite the following idea into ONE concise text-to-image prompt for a realistic, professional social-video background. Return only the prompt. Do not include quotation marks, headings, captions, logos, watermarks, or text that should appear inside the image. Preserve the meaning and make the scene visually specific.\n\nSTYLE: ${style||'cinematic'}\nTITLE: ${String(title||'').slice(0,200)}\nMESSAGE: ${String(text||'').slice(0,1200)}`;
 try{
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(String(env.GOOGLE_API_KEY))}`,{
   method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:instruction}]}],generationConfig:{temperature:.65,maxOutputTokens:260}})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||`Gemini returned ${response.status}`);
  const prompt=(data?.candidates?.[0]?.content?.parts||[]).map(p=>p?.text||'').join(' ').replace(/\s+/g,' ').trim();
  return {prompt:prompt||fallback,director:prompt?'google-gemini-visual-director':'built-in',model};
 }catch(error){
  console.error('Gemini visual director fallback',error);
  return {prompt:fallback,director:'built-in'};
 }
}

function proceduralHash(value){
 let h=2166136261;
 for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
}
export function generateProceduralScene(prompt){
 const seed=proceduralHash(prompt);
 const palettes=[
  ['#101828','#344054','#98A2B3','#F2F4F7'],
  ['#0B1F33','#164E63','#67E8F9','#ECFEFF'],
  ['#1F1534','#53389E','#B692F6','#F4EBFF'],
  ['#172B1A','#2F6B3B','#86CB92','#EFF8F0'],
  ['#321B14','#854A2F','#F3B27A','#FFF3E8']
 ];
 const p=palettes[seed%palettes.length];
 const x1=140+(seed%420),y1=100+((seed>>>4)%260),x2=720+((seed>>>9)%380),y2=180+((seed>>>13)%300);
 const ridge1=380+((seed>>>3)%120),ridge2=430+((seed>>>7)%100);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="0.58" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient><radialGradient id="g1"><stop offset="0" stop-color="${p[2]}" stop-opacity=".78"/><stop offset="1" stop-color="${p[2]}" stop-opacity="0"/></radialGradient><radialGradient id="g2"><stop offset="0" stop-color="${p[3]}" stop-opacity=".48"/><stop offset="1" stop-color="${p[3]}" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#bg)"/><circle cx="${x1}" cy="${y1}" r="330" fill="url(#g1)"/><circle cx="${x2}" cy="${y2}" r="420" fill="url(#g2)"/><path d="M0 ${ridge1} C180 ${ridge1-110} 320 ${ridge1+70} 520 ${ridge1-20} S880 ${ridge1+90} 1280 ${ridge1-40} V720 H0Z" fill="${p[0]}" opacity=".48"/><path d="M0 ${ridge2} C220 ${ridge2-80} 420 ${ridge2+50} 650 ${ridge2-35} S1010 ${ridge2+65} 1280 ${ridge2-15} V720 H0Z" fill="${p[1]}" opacity=".64"/><ellipse cx="640" cy="685" rx="520" ry="90" fill="${p[3]}" opacity=".08"/></svg>`;
 return{image:btoa(svg),model:'magnanimous-procedural-v1',provider:'magnanimous-native-procedural-scene',content_type:'image/svg+xml',procedural:true};
}

async function generateFlux(env,prompt){
 if(!cloudflareReady(env))throw new Error('Cloudflare Workers AI image generation is not configured.');
 const model='@cf/black-forest-labs/flux-1-schnell';
 const result=await env.AI.run(model,{prompt:String(prompt).slice(0,1800),seed:Math.floor(Math.random()*2_000_000_000)});
 const image=typeof result?.image==='string'?result.image:'';
 if(!image)throw new Error('The free visual provider returned no image.');
 return {image,model,provider:'legacy-edge-image-fallback',content_type:'image/jpeg'};
}

async function generateImage(env,prompt){
 const safePrompt=String(prompt).slice(0,1800);
 if(magnanimousImageReady(env)){
  try{
   const rendered=await env.MAGNANIMOUS_IMAGE_GENERATOR.generate(safePrompt,{seed:Math.floor(Math.random()*2_000_000_000)});
   if(rendered?.image)return {...rendered,provider:rendered.provider||'magnanimous-native-image'};
   console.error('Magnanimous image provider returned no usable image; falling back to first-party procedural rendering.');
  }catch(error){
   console.error('Magnanimous image provider unavailable; falling back to first-party procedural rendering.',String(error?.message||error));
  }
 }
 if(cloudflareReady(env)){
  try{return await generateFlux(env,safePrompt)}
  catch(error){console.error('Legacy edge image provider unavailable; falling back to first-party procedural rendering.',String(error?.message||error))}
 }
 return generateProceduralScene(safePrompt);
}

export async function renderVisualScene(env,{title='',text='',style='cinematic',director='auto'}={}){
 const direction=director==='built-in'?{prompt:baseScenePrompt(title,text,style),director:'built-in'}:await geminiDirect(env,title,text,style);
 const rendered=await generateImage(env,direction.prompt);
 return{
  provider:'iam-cinematic-free',director:direction.director,director_model:direction.model||null,
  image_provider:rendered.provider,image_model:rendered.model,prompt:direction.prompt,
  image_data_uri:`data:${rendered.content_type||'image/jpeg'};base64,${rendered.image}`,free_first:true
 };
}

export async function handleVisual(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/visual'))return null;
 if(request.method==='GET'&&url.pathname==='/api/visual/providers')return json(visualProviderSnapshot(env));
 if(request.method==='POST'&&url.pathname==='/api/visual/scene'){
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to create visual scenes.'},401);
  const body=await request.json().catch(()=>({}));
  const title=String(body.title||'').trim(),text=String(body.text||'').trim();
  if(!title&&!text)return json({detail:'Add a video title or message first.'},400);
  const style=String(body.style||'cinematic').toLowerCase();
  const useGemini=body.director!=='built-in';
  const direction=useGemini?await geminiDirect(env,title,text,style):{prompt:baseScenePrompt(title,text,style),director:'built-in'};
  try{
   const rendered=await generateImage(env,direction.prompt);
   return json({
    ok:true,provider:'iam-cinematic-free',director:direction.director,director_model:direction.model||null,
    image_provider:rendered.provider,image_model:rendered.model,prompt:direction.prompt,
    image_data_uri:`data:${rendered.content_type||'image/jpeg'};base64,${rendered.image}`,free_first:true
   });
  }catch(error){
   return json({detail:error?.message||'Free visual generation failed.',code:'VISUAL_GENERATION_FAILED'},502);
  }
 }
 return json({detail:'Unsupported visual operation.'},405);
}
