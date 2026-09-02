import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

function googleReady(env){return Boolean(String(env?.GOOGLE_API_KEY||'').trim())}
function cloudflareReady(env){return env?.AI!=null}
function veoEnabled(env){return googleReady(env)&&String(env?.ENABLE_VEO_PROVIDER||'').toLowerCase()==='true'}

export function visualProviderSnapshot(env){
 const providers=[
  {
   id:'iam-cinematic-free',name:'I AM Cinematic Free',type:'video-effects',tier:'free-first',free:true,
   configured:cloudflareReady(env),enabled:cloudflareReady(env),
   note:'Free-first cinematic pipeline. Uses Gemini 2.5 Flash-Lite as an optional scene director when configured, Cloudflare FLUX for the scene image, and browser animation for motion.'
  },
  {
   id:'cloudflare-flux-free',name:'Cloudflare FLUX.1 Schnell',type:'image-generation',tier:'free-allocation',free:true,
   configured:cloudflareReady(env),enabled:cloudflareReady(env),model:'@cf/black-forest-labs/flux-1-schnell',
   note:'Text-to-image through the existing Workers AI binding and Cloudflare Workers AI daily free allocation.'
  },
  {
   id:'google-gemini-visual-director',name:'Google Gemini Visual Director',type:'visual-planning',tier:'free-tier',free:true,
   configured:googleReady(env),enabled:googleReady(env),model:'gemini-2.5-flash-lite',
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
 const model=String(env.GOOGLE_VISUAL_MODEL||'gemini-2.5-flash-lite').trim();
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

async function generateFlux(env,prompt){
 if(!cloudflareReady(env))throw new Error('Cloudflare Workers AI image generation is not configured.');
 const model='@cf/black-forest-labs/flux-1-schnell';
 const result=await env.AI.run(model,{prompt:String(prompt).slice(0,1800),seed:Math.floor(Math.random()*2_000_000_000)});
 const image=typeof result?.image==='string'?result.image:'';
 if(!image)throw new Error('The free visual provider returned no image.');
 return {image,model};
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
   const rendered=await generateFlux(env,direction.prompt);
   return json({
    ok:true,provider:'iam-cinematic-free',director:direction.director,director_model:direction.model||null,
    image_provider:'cloudflare-flux-free',image_model:rendered.model,prompt:direction.prompt,
    image_data_uri:`data:image/jpeg;base64,${rendered.image}`,free_first:true
   });
  }catch(error){
   return json({detail:error?.message||'Free visual generation failed.',code:'VISUAL_GENERATION_FAILED'},502);
  }
 }
 return json({detail:'Unsupported visual operation.'},405);
}
