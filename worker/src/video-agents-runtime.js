import { currentUser } from './integrations.js';
import { handleVisual } from './visual-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const txt=(v,n=1800)=>String(v||'').replace(/\s+/g,' ').trim().slice(0,n);

const AGENTS=[
 {id:'social-short',name:'Social Short Agent',role:'Vertical 9:16 reels/shorts',tier:'free-first',style:'social',scenes:4},
 {id:'product-demo',name:'Product Demo Agent',role:'Product and feature walkthroughs',tier:'free-first',style:'business',scenes:4},
 {id:'enterprise-promo',name:'Enterprise Promo Agent',role:'B2B launch and capability videos',tier:'free-first',style:'business',scenes:4},
 {id:'training',name:'Training Agent',role:'SOP, onboarding and explainer videos',tier:'free-first',style:'realistic',scenes:5},
 {id:'faith-story',name:'Faith Story Agent',role:'Ministry, testimony and inspirational media',tier:'free-first',style:'faith',scenes:4},
 {id:'virtual-presenter',name:'Virtual Presenter Agent',role:'Avatar/presenter-led videos when provider is configured',tier:'premium-optional',style:'cinematic',scenes:3,providers:['HeyGen','Tavus']}
];

function providerState(env){return{
 free_cinematic:Boolean(env?.AI),
 heygen:Boolean(String(env?.HEYGEN_API_KEY||'').trim()),
 tavus:Boolean(String(env?.TAVUS_API_KEY||'').trim()),
 veo:Boolean(String(env?.GOOGLE_API_KEY||'').trim())&&String(env?.ENABLE_VEO_PROVIDER||'').toLowerCase()==='true'
}}
function splitStory(message,count){
 const base=txt(message,4000);const parts=base.split(/(?<=[.!?])\s+/).filter(Boolean);const out=[];
 for(let i=0;i<count;i++)out.push(parts[i]||parts[parts.length-1]||base||'Magnanimous AI at work.');
 return out;
}

export async function handleVideoAgents(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/video-agents'))return null;
 const providers=providerState(env);
 if(request.method==='GET'&&url.pathname==='/api/video-agents')return json({agents:AGENTS.map(a=>({...a,ready:a.tier==='free-first'?providers.free_cinematic:(providers.heygen||providers.tavus)})),providers,principle:'Free-first scene generation with optional customer-funded presenter/video providers.'});
 if(request.method==='POST'&&url.pathname==='/api/video-agents/storyboard'){
  const user=await currentUser(request,env);if(!user)return json({detail:'Sign in to use Video Agents.'},401);
  const b=await request.json().catch(()=>({}));const agent=AGENTS.find(a=>a.id===String(b.agent_id||''))||AGENTS[0];
  const title=txt(b.title,180),message=txt(b.message,4000);if(!title&&!message)return json({detail:'Add a title or message.'},400);
  if(agent.tier!=='free-first'&&!providers.heygen&&!providers.tavus)return json({detail:'The presenter agent needs an authorized HeyGen or Tavus provider. Use a free-first video agent instead.',code:'PRESENTER_PROVIDER_REQUIRED'},409);
  const beats=splitStory(message,Math.max(3,Math.min(6,Number(b.scenes||agent.scenes))));const scenes=[];
  for(let i=0;i<beats.length;i++){
   const sceneText=`Scene ${i+1} of ${beats.length}. ${beats[i]} ${txt(b.visual_direction,500)}`;
   const visualReq=new Request(new URL('/api/visual/scene',request.url),{method:'POST',headers:request.headers,body:JSON.stringify({title:title||agent.name,text:sceneText,style:b.style||agent.style,director:b.director||'auto'})});
   const response=await handleVisual(visualReq,env);const data=await response.json().catch(()=>({}));
   scenes.push({index:i+1,narration:beats[i],image_data_uri:data.image_data_uri||null,prompt:data.prompt||'',provider:data.provider||null,error:response.ok?null:(data.detail||'Scene failed')});
  }
  return json({ok:true,agent,format:b.format||'9:16',title,scenes,assembly:{mode:'browser-animation',note:'Scenes are ready for the existing browser video renderer. Premium presenter providers remain optional and customer-funded.'},providers});
 }
 return json({detail:'Unsupported video-agent operation.'},405);
}
