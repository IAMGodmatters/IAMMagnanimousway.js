import { currentUser } from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

function googleReady(env){return Boolean(String(env?.GOOGLE_API_KEY||'').trim())}
function cloudflareReady(env){return env?.AI!=null&&String(env?.MAGNANIMOUS_RUNTIME||'')!=='standalone-node'}
function magnanimousImageReady(env){return env?.MAGNANIMOUS_IMAGE_GENERATOR?.configured===true}
function nativeCanvasReady(){return true}
function imageReady(env){return nativeCanvasReady()||magnanimousImageReady(env)||cloudflareReady(env)}
function veoEnabled(env){return googleReady(env)&&String(env?.ENABLE_VEO_PROVIDER||'').toLowerCase()==='true'}

export function visualProviderSnapshot(env){
 const providers=[
  {
   id:'iam-cinematic-free',name:'I AM Cinematic Free',type:'video-effects',tier:'free-first',free:true,
   configured:imageReady(env),enabled:imageReady(env),
   note:'Free-first cinematic pipeline. Uses Magnanimous Native Canvas when no image model is configured, upgrades to a Magnanimous/local image rail when available, keeps the legacy edge image rail only as rollback, and uses browser animation for motion.'
  },
  {
   id:'magnanimous-native-canvas',name:'Magnanimous Native Canvas',type:'procedural-visual-generation',tier:'first-party-native',free:true,
   configured:nativeCanvasReady(),enabled:nativeCanvasReady(),model:'magnanimous-svg-canvas-v1',
   note:'Always-available first-party procedural cinematic scene fallback. It creates an original abstract SVG visual locally and does not claim photorealistic AI image generation.'
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

async function generateFlux(env,prompt){
 if(!cloudflareReady(env))throw new Error('Cloudflare Workers AI image generation is not configured.');
 const model='@cf/black-forest-labs/flux-1-schnell';
 const result=await env.AI.run(model,{prompt:String(prompt).slice(0,1800),seed:Math.floor(Math.random()*2_000_000_000)});
 const image=typeof result?.image==='string'?result.image:'';
 if(!image)throw new Error('The free visual provider returned no image.');
 return {image,model,provider:'legacy-edge-image-fallback',content_type:'image/jpeg'};
}

function canvasSeed(value){
 let h=2166136261;
 for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
}

function svgBase64(svg){
 const bytes=new TextEncoder().encode(svg);
 let binary='';
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary);
}

function generateNativeCanvas(prompt){
 const seed=canvasSeed(prompt);
 const hueA=seed%360,hueB=(hueA+70+(seed%90))%360,hueC=(hueB+80)%360;
 const x1=20+(seed%55),y1=20+((seed>>>5)%55),x2=25+((seed>>>11)%50),y2=30+((seed>>>17)%45);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Magnanimous native cinematic canvas">
 <defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0%" stop-color="hsl(${hueA} 66% 12%)"/>
   <stop offset="52%" stop-color="hsl(${hueB} 58% 20%)"/>
   <stop offset="100%" stop-color="hsl(${hueC} 72% 10%)"/>
  </linearGradient>
  <radialGradient id="glow" cx="${x1}%" cy="${y1}%" r="60%">
   <stop offset="0%" stop-color="hsl(${hueB} 90% 72% / .72)"/>
   <stop offset="100%" stop-color="hsl(${hueB} 80% 42% / 0)"/>
  </radialGradient>
  <radialGradient id="glow2" cx="${x2}%" cy="${y2}%" r="58%">
   <stop offset="0%" stop-color="hsl(${hueC} 92% 68% / .55)"/>
   <stop offset="100%" stop-color="hsl(${hueC} 80% 38% / 0)"/>
  </radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
 </defs>
 <rect width="1024" height="1024" fill="url(#bg)"/>
 <rect width="1024" height="1024" fill="url(#glow)"/>
 <rect width="1024" height="1024" fill="url(#glow2)"/>
 <ellipse cx="512" cy="790" rx="430" ry="120" fill="hsl(${hueA} 80% 4% / .5)" filter="url(#blur)"/>
 <path d="M0 760 C180 650 320 710 470 620 C650 510 770 600 1024 470 L1024 1024 L0 1024 Z" fill="hsl(${hueB} 42% 8% / .78)"/>
 <path d="M0 850 C220 730 390 810 570 705 C770 590 870 670 1024 610 L1024 1024 L0 1024 Z" fill="hsl(${hueC} 48% 6% / .72)"/>
 <circle cx="760" cy="225" r="78" fill="hsl(${hueB} 95% 82% / .75)" filter="url(#blur)"/>
 <circle cx="760" cy="225" r="34" fill="hsl(${hueB} 100% 90% / .96)"/>
</svg>`;
 return{image:svgBase64(svg),content_type:'image/svg+xml',provider:'magnanimous-native-canvas',model:'magnanimous-svg-canvas-v1'};
}

async function generateImage(env,prompt){
 if(magnanimousImageReady(env)){
  const rendered=await env.MAGNANIMOUS_IMAGE_GENERATOR.generate(String(prompt).slice(0,1800),{seed:Math.floor(Math.random()*2_000_000_000)});
  return {...rendered,provider:rendered.provider||'magnanimous-native-image'};
 }
 if(cloudflareReady(env))return generateFlux(env,prompt);
 return generateNativeCanvas(prompt);
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
