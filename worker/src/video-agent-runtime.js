import { createNativeRenderSession, nativeRenderStatus } from './magnanimous-render-engine.js';
import { currentUser } from './integrations.js';
import { renderVisualScene, visualProviderSnapshot } from './visual-runtime.js';
const J=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'no-store'}}),N=()=>Math.floor(Date.now()/1000),ID=()=>crypto.randomUUID(),S=(v,n=12000)=>String(v??'').trim().slice(0,n);
const adapterReady=(env)=>Boolean(env?.MAGNANIMOUS_RENDER_NODE_URL||env?.VIDEO_AVATAR_SESSION_URL);
const SPECIALIST_VIDEO_AGENTS=[
 {id:'social-short',name:'Social Short Agent',role:'Short-form social video',premium:false},
 {id:'product-demo',name:'Product Demo Agent',role:'Product and feature walkthroughs',premium:false},
 {id:'enterprise-promo',name:'Enterprise Promo Agent',role:'B2B launch and capability videos',premium:false},
 {id:'training',name:'Training Agent',role:'Onboarding, SOP and explainer media',premium:false},
 {id:'faith-story',name:'Faith Story Agent',role:'Ministry, testimony and inspirational media',premium:false},
 {id:'virtual-presenter',name:'Virtual Presenter Agent',role:'Optional presenter-led output',premium:true},
 {id:'magnanimous-motion',name:'Magnanimous Motion Director',role:'Transcript-to-motion-picture scenes',premium:false}
];
function premiumPresenterReady(env){return Boolean(env?.HEYGEN_API_KEY||env?.TAVUS_API_KEY||adapterReady(env))}
function splitStoryboardText(value,count){
 const text=S(value,16000).replace(/\s+/g,' ').trim();
 const sentences=text.match(/[^.!?]+[.!?]?/g)?.map(x=>x.trim()).filter(Boolean)||[];
 if(!sentences.length)return Array.from({length:count},()=>text||'Magnanimous AI video scene.');
 const buckets=Array.from({length:count},()=>[]);
 sentences.forEach((sentence,index)=>buckets[Math.min(count-1,Math.floor(index*count/sentences.length))].push(sentence));
 return buckets.map((parts,index)=>parts.join(' ').trim()||sentences[Math.min(index,sentences.length-1)]||text);
}

async function createAdapterSession(env,payload){const native=await createNativeRenderSession(env,payload).catch(()=>null);if(native)return {...native,renderer:'magnanimous-native'};if(!adapterReady(env)||!env?.VIDEO_AVATAR_SESSION_URL)return null;const r=await fetch(env.VIDEO_AVATAR_SESSION_URL,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+env.VIDEO_AVATAR_API_KEY},body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.message||'Realtime avatar renderer failed.');return d}
export const VIDEO_AGENT_CAPABILITIES=['realtime-avatar','voice-turns','lip-sync','interruptions','visual-presence','provider-adapters','session-audit','consented-custom-avatar'];
async function schema(env){for(const q of[
"CREATE TABLE IF NOT EXISTS video_agent_profiles(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,name TEXT NOT NULL,assistant_mode TEXT NOT NULL DEFAULT 'General',avatar_ref TEXT NOT NULL DEFAULT '',voice_ref TEXT NOT NULL DEFAULT '',provider_key TEXT NOT NULL DEFAULT 'auto',appearance_json TEXT NOT NULL DEFAULT '{}',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)",
"CREATE TABLE IF NOT EXISTS video_agent_sessions(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,profile_id TEXT,provider_key TEXT NOT NULL DEFAULT 'auto',provider_session_ref TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'created',started_at INTEGER NOT NULL,ended_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}')"
])await env.DB.prepare(q).run()}
export async function handleVideoAgents(request,env){const u=new URL(request.url);if(!u.pathname.startsWith('/api/video-agents'))return null;const user=await currentUser(request,env).catch(()=>null);if(!user)return J({detail:'Sign in required.'},401);await schema(env);const t=String(user.tenant_id||''),body=['POST','PUT','PATCH'].includes(request.method)?await request.clone().json().catch(()=>({})):{};
if(u.pathname==='/api/video-agents'&&request.method==='GET'){
 const visuals=visualProviderSnapshot(env),presenter=premiumPresenterReady(env);
 return J({
  identity:'Magnanimous Video Agents',
  agents:SPECIALIST_VIDEO_AGENTS.map(agent=>({...agent,ready:agent.premium?presenter:true,provider:agent.premium?(presenter?'connected-presenter-adapter':'setup-required'):'iam-cinematic-free'})),
  providers:{
   free_cinematic:Boolean(visuals.free_configured_count>0),
   magnanimous_render:Boolean(env?.MAGNANIMOUS_RENDER_NODE_URL),
   browser_assembly:true,
   heygen:Boolean(env?.HEYGEN_API_KEY),
   tavus:Boolean(env?.TAVUS_API_KEY)
  },
  provider_catalog:visuals.providers,
  provider_policy:'Free-first video agents always have a Magnanimous-native visual provider. Premium presenter adapters are optional and are only reported connected when configured.'
 });
}
if(u.pathname==='/api/video-agents/storyboard'&&request.method==='POST'){
 const title=S(body.title||'Magnanimous Video',200),message=S(body.message||body.transcript,16000);
 if(!message)return J({detail:'Add the message or transcript for the video.'},400);
 const count=Math.max(3,Math.min(8,Number(body.scenes)||4)),agentId=S(body.agent_id||'social-short',80);
 const agent=SPECIALIST_VIDEO_AGENTS.find(x=>x.id===agentId)||SPECIALIST_VIDEO_AGENTS[0];
 if(agent.premium&&!premiumPresenterReady(env))return J({detail:'This presenter agent needs an authorized presenter provider. Use a free-first Magnanimous video agent or connect a presenter adapter.',code:'PRESENTER_PROVIDER_REQUIRED'},503);
 const format=S(body.format||'9:16',12),style=S(body.style||'cinematic',40),direction=S(body.visual_direction,2000);
 const narrations=splitStoryboardText(message,count),scenes=[];
 for(let index=0;index<narrations.length;index++){
  const narration=narrations[index],visual=await renderVisualScene(env,{title,text:direction?direction+' Scene message: '+narration:narration,style,director:'auto'});
  scenes.push({index:index+1,narration,image_data_uri:visual.image_data_uri,prompt:visual.prompt,provider:visual.provider,image_provider:visual.image_provider,image_model:visual.image_model,motion:'slow cinematic pan and zoom'});
 }
 return J({ok:true,title,format,agent,scenes,providers:{free_cinematic:true,browser_assembly:true,heygen:Boolean(env?.HEYGEN_API_KEY),tavus:Boolean(env?.TAVUS_API_KEY)},assembly:{mode:'browser-media-recorder',provider:'magnanimous-browser-assembly'},free_first:true},201);
}

if(u.pathname==='/api/video-agents/capabilities'&&request.method==='GET')return J({identity:'Magnanimous Video Agents',capabilities:VIDEO_AGENT_CAPABILITIES,live_renderer_configured:adapterReady(env),native_render_engine:nativeRenderStatus(env),architecture:'Magnanimous AI owns conversation, memory, tools and policy. Realtime rendering and media transports are replaceable adapters.'});
if(u.pathname==='/api/video-agents/profiles'){if(request.method==='GET'){const r=await env.DB.prepare('SELECT * FROM video_agent_profiles WHERE tenant_id=? AND active=1 ORDER BY updated_at DESC').bind(t).all();return J({profiles:r.results||[]})}if(request.method==='POST'){const name=S(body.name,120);if(!name)return J({detail:'Agent name required.'},400);const id=ID(),ts=N();await env.DB.prepare("INSERT INTO video_agent_profiles(id,tenant_id,name,assistant_mode,avatar_ref,voice_ref,provider_key,appearance_json,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,1,?,?)").bind(id,t,name,S(body.assistant_mode||'General',60),S(body.avatar_ref,300),S(body.voice_ref,300),S(body.provider_key||'auto',40),JSON.stringify(body.appearance||{}),ts,ts).run();return J({id,name},201)}}
if(u.pathname==='/api/video-agents/session'&&request.method==='POST'){const id=ID(),ts=N(),provider=S(body.provider_key||'auto',40),profileId=S(body.profile_id,80)||null;const profile=profileId?await env.DB.prepare('SELECT * FROM video_agent_profiles WHERE id=? AND tenant_id=? AND active=1').bind(profileId,t).first():null;let live=null;try{live=await createAdapterSession(env,{session_id:id,agent_name:profile?.name||'Magnanimous',avatar_ref:profile?.avatar_ref||'',voice_ref:profile?.voice_ref||'',mode:S(body.mode||profile?.assistant_mode||'General',60),callback_url:S(body.callback_url,500)})}catch(e){return J({detail:e.message||'Realtime renderer unavailable.'},502)}const status=live?'live_ready':'setup_required',ref=S(live?.session_id||live?.id,300);await env.DB.prepare("INSERT INTO video_agent_sessions(id,tenant_id,user_id,profile_id,provider_key,provider_session_ref,status,started_at,metadata_json) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,t,String(user.id||''),profileId,provider,ref,status,ts,JSON.stringify({mode:S(body.mode||'General',60)})).run();return J({id,status,rendering_ready:Boolean(live),realtime:live||null,detail:live?'Live face-to-face renderer session created.':'Connect VIDEO_AVATAR_SESSION_URL and VIDEO_AVATAR_API_KEY in the server environment to activate lifelike streaming.'},live?201:503)}
return J({detail:'Video-agent route not found.'},404)}
