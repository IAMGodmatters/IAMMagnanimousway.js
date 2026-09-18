const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const uid=()=>crypto.randomUUID();
const MODES=new Set(['song','instrumental','sound','remix','studio']);
const OPS=new Set(['generate','lyrics','extend','remix','replace-section','remaster','stems','sounds','midi','render']);

export function musicCapabilities(env){
 return {
  identity:'Magnanimous Music Studio',
  architecture:'provider-neutral',
  modes:[...MODES],
  operations:[...OPS],
  local:{projectPlanning:true,lyricsPlanning:true,rightsLedger:true,projectPersistence:true},
  engines:{audioGeneration:Boolean(env.MUSIC_ENGINE_URL&&env.MUSIC_ENGINE_TOKEN)},
  rules:{freeFirst:true,paidAdaptersOptional:true,voiceConsentRequired:true,sourceRightsRequired:true}
 };
}

async function project(env,tid,pid){
 return env.DB.prepare('SELECT * FROM music_projects WHERE id=? AND tenant_id=?').bind(pid,tid).first();
}

export async function handleMusic(request,env,user,path){
 if(!path.startsWith('/api/music')) return null;
 if(!user) return json({detail:'Sign in required'},401);
 const tid=user.tenant_id;
 if(path==='/api/music/capabilities'&&request.method==='GET') return json(musicCapabilities(env));
 if(path==='/api/music/projects'&&request.method==='GET'){
  const {results}=await env.DB.prepare('SELECT * FROM music_projects WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 100').bind(tid).all();
  return json({projects:results});
 }
 if(path==='/api/music/projects'&&request.method==='POST'){
  const b=await request.json(),mode=String(b.mode||'song').toLowerCase();
  if(!MODES.has(mode)) return json({detail:'Invalid music mode'},400);
  const id=uid(),t=now();
  await env.DB.prepare('INSERT INTO music_projects(id,tenant_id,owner_user_id,title,mode,creative_brief,lyrics,bpm,musical_key,time_signature,rights_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tid,user.id,String(b.title||'Untitled Music Project').slice(0,160),mode,String(b.creative_brief||''),String(b.lyrics||''),b.bpm?Number(b.bpm):null,b.musical_key?String(b.musical_key):null,String(b.time_signature||'4/4'),String(b.rights_status||'original'),t,t).run();
  return json({project:await project(env,tid,id)},201);
 }
 const pm=path.match(/^\/api\/music\/projects\/([^/]+)$/);
 if(pm&&request.method==='GET'){
  const p=await project(env,tid,pm[1]); return p?json({project:p}):json({detail:'Music project not found'},404);
 }
 const opm=path.match(/^\/api\/music\/(generate|lyrics|extend|remix|replace-section|remaster|stems|sounds|midi|render)$/);
 if(opm&&request.method==='POST'){
  const operation=opm[1],b=await request.json(),pid=String(b.project_id||'');
  const p=await project(env,tid,pid); if(!p)return json({detail:'Music project not found'},404);
  if(['remix','extend','replace-section','remaster','stems'].includes(operation)&&!['owned','licensed','original','authorized'].includes(String(b.source_rights||p.rights_status).toLowerCase())) return json({detail:'Confirm ownership, license, or authorization for source audio before this operation.'},400);
  if(b.voice_profile&&!b.voice_consent) return json({detail:'Verified voice consent is required.'},400);
  const gid=uid(),t=now(),configured=Boolean(env.MUSIC_ENGINE_URL&&env.MUSIC_ENGINE_TOKEN);
  await env.DB.prepare('INSERT INTO music_generations(id,tenant_id,project_id,operation,status,engine,input_json,output_json,cost_units,error,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(gid,tid,pid,operation,configured?'queued':'needs_engine',configured?'configured-adapter':'unconfigured',JSON.stringify(b),'{}',0,configured?'':'No audio generation engine configured.',t,t).run();
  if(!configured)return json({generation_id:gid,status:'needs_engine',detail:'Project and operation saved safely. No audio generation engine is configured, so no charge was made and no audio was falsely reported as generated.'},202);
  if(operation==='generate'||operation==='sounds'){
   try{
    const target=String(env.MUSIC_ENGINE_URL).replace(/\/$/,'')+'/v1/generate';
    const er=await fetch(target,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+env.MUSIC_ENGINE_TOKEN},body:JSON.stringify({prompt:String(b.prompt||p.creative_brief||''),lyrics:String(b.lyrics||p.lyrics||''),duration:Math.max(10,Math.min(600,Number(b.duration||30))),instrumental:Boolean(b.instrumental||p.mode==='instrumental'||p.mode==='sound')})});
    const out=await er.json().catch(()=>({}));
    if(!er.ok)throw new Error(out.detail||'Music engine failed');
    const audioUrl=String(env.MUSIC_ENGINE_URL).replace(/\/$/,'')+String(out.audio_url||'');
    await env.DB.prepare('UPDATE music_generations SET status=?,engine=?,output_json=?,updated_at=? WHERE id=? AND tenant_id=?').bind('completed','magnanimous-self-hosted',JSON.stringify({...out,audio_url:audioUrl}),now(),gid,tid).run();
    return json({generation_id:gid,status:'completed',audio_url:audioUrl,filename:out.filename},201);
   }catch(e){
    await env.DB.prepare('UPDATE music_generations SET status=?,error=?,updated_at=? WHERE id=? AND tenant_id=?').bind('failed',String(e?.message||e),now(),gid,tid).run();
    return json({generation_id:gid,status:'failed',detail:String(e?.message||e)},502);
   }
  }
  return json({generation_id:gid,status:'queued',detail:'Operation is recorded; this engine adapter does not implement that operation yet.'},202);
 }
 return json({detail:'Music route not found'},404);
}
