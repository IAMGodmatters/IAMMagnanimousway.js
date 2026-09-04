import { currentUser } from './integrations.js';
import { handleVisual } from './visual-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const txt=(v,n=1800)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);

const MAGNANIMOUS_MOTION='Friendly white and silver humanoid Magnanimous AI robot, rounded futuristic shell, glossy dark digital face, expressive cyan eyes and smile, subtle cyan light strips, smooth natural arm and body movement, cinematic neon futuristic city at night, blue and magenta practical lighting, shallow depth of field, polished motion-picture look, warm helpful personality, consistent character design across scenes.';

const AGENTS=[
 {id:'magnanimous-motion',name:'Magnanimous Motion Picture AI',role:'Transcript to narrated cinematic AI motion picture',tier:'free-first',style:'cinematic',scenes:5,character:'magnanimous-ai'},
 {id:'social-short',name:'Social Short Agent',role:'Vertical 9:16 reels/shorts',tier:'free-first',style:'social',scenes:4},
 {id:'product-demo',name:'Product Demo Agent',role:'Product and feature walkthroughs',tier:'free-first',style:'business',scenes:4},
 {id:'enterprise-promo',name:'Enterprise Promo Agent',role:'B2B launch and capability videos',tier:'free-first',style:'business',scenes:4},
 {id:'training',name:'Training Agent',role:'SOP, onboarding and explainer videos',tier:'free-first',style:'realistic',scenes:5},
 {id:'faith-story',name:'Faith Story Agent',role:'Ministry, testimony and inspirational media',tier:'free-first',style:'faith',scenes:4},
 {id:'virtual-presenter',name:'Virtual Presenter Agent',role:'Avatar/presenter-led videos when provider is configured',tier:'premium-optional',style:'cinematic',scenes:3,providers:['HeyGen','Tavus']}
];

function providerState(env){return{
 free_cinematic:Boolean(env?.AI),
 narration:Boolean(env?.AI),
 heygen:Boolean(String(env?.HEYGEN_API_KEY||'').trim()),
 tavus:Boolean(String(env?.TAVUS_API_KEY||'').trim()),
 veo:Boolean(String(env?.GOOGLE_API_KEY||'').trim())&&String(env?.ENABLE_VEO_PROVIDER||'').toLowerCase()==='true'
}}
function splitStory(message,count){
 const base=txt(message,8000);const parts=base.split(/(?<=[.!?])\s+/).filter(Boolean);const out=[];
 if(!parts.length)return Array.from({length:count},()=>base||'Magnanimous AI at work.');
 const per=Math.max(1,Math.ceil(parts.length/count));
 for(let i=0;i<count;i++){const group=parts.slice(i*per,(i+1)*per).join(' ').trim();out.push(group||parts[Math.min(i,parts.length-1)]||base)}
 return out;
}

async function narration(request,env){
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to generate narration.'},401);
 if(!env?.AI)return json({detail:'Workers AI narration is not configured.',code:'NARRATION_PROVIDER_REQUIRED'},409);
 const b=await request.json().catch(()=>({}));const text=txt(b.text,12000);if(!text)return json({detail:'Transcript text is required.'},400);
 const language=String(b.language||'en').toLowerCase();
 const model=language.startsWith('es')?'@cf/deepgram/aura-2-es':'@cf/deepgram/aura-2-en';
 const allowedEn=new Set(['amalthea','andromeda','apollo','arcas','aries','asteria','athena','atlas','aurora','callista','cora','cordelia','delia','draco','electra','harmonia','helena','hera','hermes','hyperion','iris','janus','juno','jupiter','luna','mars','minerva','neptune','odysseus','ophelia','orion','orpheus','pandora','phoebe','pluto','saturn','thalia','theia','vesta','zeus']);
 const allowedEs=new Set(['sirio','nestor','carina','celeste','alvaro','diana','aquila','selena','estrella','javier']);
 const speakerRaw=String(b.speaker||'').toLowerCase();
 const speaker=language.startsWith('es')?(allowedEs.has(speakerRaw)?speakerRaw:'aquila'):(allowedEn.has(speakerRaw)?speakerRaw:'atlas');
 try{
  const audio=await env.AI.run(model,{text,speaker,encoding:'mp3'});
  return new Response(audio,{status:200,headers:{'content-type':'audio/mpeg','cache-control':'no-store','x-iam-voice':speaker,'x-iam-model':model}});
 }catch(error){return json({detail:error?.message||'Narration generation failed.',code:'NARRATION_FAILED'},502)}
}

export async function handleVideoAgents(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/video-agents'))return null;
 const providers=providerState(env);
 if(request.method==='GET'&&url.pathname==='/api/video-agents')return json({agents:AGENTS.map(a=>({...a,ready:a.tier==='free-first'?providers.free_cinematic:(providers.heygen||providers.tavus)})),providers,character_presets:[{id:'magnanimous-ai',name:'Magnanimous AI',visual_direction:MAGNANIMOUS_MOTION}],principle:'Free-first scene generation and narration with optional customer-funded premium presenter/video providers.'});
 if(request.method==='POST'&&url.pathname==='/api/video-agents/narration')return narration(request,env);
 if(request.method==='POST'&&url.pathname==='/api/video-agents/storyboard'){
  const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Video Agents.'},401);
  const b=await request.json().catch(()=>({}));const agent=AGENTS.find(a=>a.id===String(b.agent_id||''))||AGENTS[0];
  const title=txt(b.title,180),message=txt(b.message,8000);if(!title&&!message)return json({detail:'Add a title or transcript.'},400);
  if(agent.tier!=='free-first'&&!providers.heygen&&!providers.tavus)return json({detail:'The presenter agent needs an authorized HeyGen or Tavus provider. Use Magnanimous Motion Picture AI or another free-first agent instead.',code:'PRESENTER_PROVIDER_REQUIRED'},409);
  const beats=splitStory(message,Math.max(3,Math.min(8,Number(b.scenes||agent.scenes))));const scenes=[];
  const character=String(b.character||agent.character||'')==='magnanimous-ai'?MAGNANIMOUS_MOTION:'';
  for(let i=0;i<beats.length;i++){
   const sceneText=`Scene ${i+1} of ${beats.length}. Narration meaning: ${beats[i]}. ${character} ${txt(b.visual_direction,1200)} Camera: smooth cinematic motion, gentle push-in or tracking movement, coherent lighting and continuity with the previous scene.`;
   const visualReq=new Request(new URL('/api/visual/scene',request.url),{method:'POST',headers:request.headers,body:JSON.stringify({title:title||agent.name,text:sceneText,style:b.style||agent.style,director:b.director||'auto'})});
   const response=await handleVisual(visualReq,env);const data=await response.json().catch(()=>({}));
   scenes.push({index:i+1,narration:beats[i],image_data_uri:data.image_data_uri||null,prompt:data.prompt||sceneText,provider:data.provider||null,error:response.ok?null:(data.detail||'Scene failed'),motion:'slow cinematic push, parallax pan, subtle character movement'});
  }
  return json({ok:true,agent,format:b.format||'16:9',title,scenes,character:character?{id:'magnanimous-ai',name:'Magnanimous AI',visual_direction:MAGNANIMOUS_MOTION}:null,assembly:{mode:'all-in-one-browser-motion-picture',narration_endpoint:'/api/video-agents/narration',features:['AI scene generation','neural narration','captions','cinematic pan and zoom','cross-scene continuity','ambient soundtrack','single-file video export'],note:'The browser motion-picture renderer combines generated scenes with Workers AI narration and soundtrack into one video. Premium presenter providers remain optional.'},providers});
 }
 return json({detail:'Unsupported video-agent operation.'},405);
}
