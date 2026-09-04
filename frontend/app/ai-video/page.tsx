'use client';

import {useEffect,useRef,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Scene={index:number;narration:string;image_data_uri?:string|null;prompt?:string;provider?:string|null;motion?:string};
type Storyboard={scenes?:Scene[];providers?:Record<string,boolean>;assembly?:Record<string,any>};

type Ratio='16:9'|'9:16';
const voices=['atlas','orion','apollo','athena','luna','aurora','zeus','hera'];

function token(){return localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
async function read(r:Response){const text=await r.text();try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${r.status})`}}}
function lines(ctx:CanvasRenderingContext2D,text:string,max:number){const words=text.split(/\s+/).filter(Boolean),out:string[]=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width<=max||!line)line=next;else{out.push(line);line=word}}if(line)out.push(line);return out.slice(0,4)}
function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}

export default function AIVideo(){
 const [title,setTitle]=useState('Magnanimous AI');
 const [transcript,setTranscript]=useState('Welcome to I AM Magnanimous Way. I am Magnanimous AI, here to help you learn, create, work, serve, grow, and make a difference.');
 const [ratio,setRatio]=useState<Ratio>('16:9');
 const [voice,setVoice]=useState('atlas');
 const [scenes,setScenes]=useState(5);
 const [captions,setCaptions]=useState(true);
 const [soundtrack,setSoundtrack]=useState(true);
 const [direction,setDirection]=useState('Cinematic neon city, warm helpful energy, smooth camera motion, coherent character continuity.');
 const [busy,setBusy]=useState(false);
 const [stage,setStage]=useState('Ready');
 const [error,setError]=useState('');
 const [videoUrl,setVideoUrl]=useState('');
 const [videoExt,setVideoExt]=useState<'mp4'|'webm'>('webm');
 const [storyboard,setStoryboard]=useState<Storyboard>({});
 const preview=useRef<HTMLVideoElement|null>(null);

 useEffect(()=>()=>{if(videoUrl.startsWith('blob:'))URL.revokeObjectURL(videoUrl)},[videoUrl]);

 async function authed(path:string,init:RequestInit={}){const h=new Headers(init.headers||{});h.set('Authorization',`Bearer ${token()}`);if(init.body)h.set('Content-Type','application/json');return fetch(`${api}${path}`,{...init,headers:h})}

 async function generate(){
  if(!transcript.trim())return setError('Add a transcript first.');
  const auth=token();if(!auth){location.replace('/login');return}
  setBusy(true);setError('');setVideoUrl('');
  try{
   setStage('Directing AI scenes…');
   const sbResponse=await authed('/api/video-agents/storyboard',{method:'POST',body:JSON.stringify({agent_id:'magnanimous-motion',title,message:transcript,format:ratio,scenes,character:'magnanimous-ai',style:'cinematic',visual_direction:direction})});
   const sb=await read(sbResponse);if(!sbResponse.ok)throw new Error(sb.detail||'Storyboard generation failed.');setStoryboard(sb);

   setStage('Creating neural narration…');
   const narration=await authed('/api/video-agents/narration',{method:'POST',body:JSON.stringify({text:transcript,speaker:voice,language:'en'})});
   if(!narration.ok){const data=await read(narration);throw new Error(data.detail||'Narration generation failed.')}
   const audioBlob=await narration.blob();

   setStage('Mixing voice, sound, captions and motion…');
   const result=await assemble(sb.scenes||[],audioBlob);
   if(videoUrl.startsWith('blob:'))URL.revokeObjectURL(videoUrl);
   setVideoExt(result.type.toLowerCase().includes('mp4')?'mp4':'webm');
   const next=URL.createObjectURL(result);setVideoUrl(next);setStage('Motion picture ready');
   setTimeout(()=>preview.current?.play().catch(()=>{}),80);
  }catch(e:any){setError(e?.message||'Video generation failed.');setStage('Stopped')}finally{setBusy(false)}
 }

 async function assemble(inputScenes:Scene[],audioBlob:Blob){
  const width=ratio==='9:16'?720:1280,height=ratio==='9:16'?1280:720;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx||!canvas.captureStream)throw new Error('This browser cannot assemble video.');
  const visualScenes=inputScenes.length?inputScenes:[{index:1,narration:transcript,image_data_uri:'/magnanimous-motion.svg'}];
  const images=await Promise.all(visualScenes.map(async s=>{try{return await loadImage(s.image_data_uri||'/magnanimous-motion.svg')}catch{return loadImage('/magnanimous-motion.svg')}}));

  const audioContext=new AudioContext();const audioBuffer=await audioContext.decodeAudioData(await audioBlob.arrayBuffer());const total=Math.max(2,audioBuffer.duration);
  const destination=audioContext.createMediaStreamDestination();
  const master=audioContext.createGain();master.gain.value=.96;master.connect(destination);
  const narrationSource=audioContext.createBufferSource();narrationSource.buffer=audioBuffer;narrationSource.connect(master);
  const ambientNodes:OscillatorNode[]=[];
  if(soundtrack){
   const pad=audioContext.createGain();pad.gain.value=.025;pad.connect(master);
   for(const frequency of [110,164.81,220]){const o=audioContext.createOscillator();o.type='sine';o.frequency.value=frequency;o.connect(pad);ambientNodes.push(o)}
  }

  const videoStream=canvas.captureStream(30);const mixed=new MediaStream([...videoStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
  const candidates=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mime=candidates.find(x=>MediaRecorder.isTypeSupported(x))||'';
  const recorder=new MediaRecorder(mixed,mime?{mimeType:mime,videoBitsPerSecond:6_000_000}:{videoBitsPerSecond:6_000_000});
  const chunks:BlobPart[]=[];const done=new Promise<Blob>((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onerror=()=>reject(new Error('Video recording failed.'));recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||mime||'video/webm'}))});

  const draw=(elapsed:number)=>{
   const p=Math.min(1,elapsed/total);const sceneFloat=p*visualScenes.length;const index=Math.min(visualScenes.length-1,Math.floor(sceneFloat));const local=sceneFloat-index;const image=images[index];
   ctx.fillStyle='#07101f';ctx.fillRect(0,0,width,height);
   const cover=Math.max(width/image.width,height/image.height);const zoom=cover*(1.04+local*.1);const dw=image.width*zoom,dh=image.height*zoom;
   const panX=Math.sin(local*Math.PI)*width*.025,panY=Math.cos(local*Math.PI)*height*.018;
   ctx.globalAlpha=1;ctx.drawImage(image,(width-dw)/2+panX,(height-dh)/2+panY,dw,dh);
   const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'rgba(2,7,18,.08)');g.addColorStop(.65,'rgba(2,7,18,.18)');g.addColorStop(1,'rgba(2,7,18,.76)');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
   ctx.textAlign='center';ctx.fillStyle='#f4fdff';ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=14;ctx.font=`800 ${Math.max(28,Math.floor(width/24))}px Arial`;ctx.fillText(title,width/2,height*.1,width*.82);
   if(captions){ctx.font=`700 ${Math.max(24,Math.floor(width/32))}px Arial`;const caption=visualScenes[index]?.narration||transcript;const wrapped=lines(ctx,caption,width*.82);const lh=Math.max(35,Math.floor(width/23));let y=height*.78-(wrapped.length-1)*lh/2;ctx.fillStyle='rgba(255,255,255,.98)';for(const line of wrapped){ctx.fillText(line,width/2,y,width*.84);y+=lh}}
   ctx.shadowBlur=0;ctx.font=`700 ${Math.max(16,Math.floor(width/58))}px Arial`;ctx.fillStyle='rgba(100,242,255,.92)';ctx.fillText('I AM MAGNANIMOUS WAY™',width/2,height*.94);
   ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(width*.18,height*.97,width*.64,5);ctx.fillStyle='#52edff';ctx.fillRect(width*.18,height*.97,width*.64*p,5);
  };

  draw(0);recorder.start(250);await audioContext.resume();narrationSource.start();ambientNodes.forEach(o=>o.start());const start=performance.now();
  await new Promise<void>(resolve=>{const frame=(now:number)=>{const elapsed=(now-start)/1000;draw(elapsed);if(elapsed>=total+.15)return resolve();requestAnimationFrame(frame)};requestAnimationFrame(frame)});
  recorder.stop();ambientNodes.forEach(o=>{try{o.stop()}catch{}});try{narrationSource.stop()}catch{};
  const blob=await done;mixed.getTracks().forEach(t=>t.stop());await audioContext.close();if(!blob.size)throw new Error('The finished video was empty.');return blob;
 }

 return <main className="studio">
  <header><div><a href="/video-studio">← Video Studio</a><small>I AM MAGNANIMOUS WAY™ · ALL-IN-ONE AI VIDEO</small><h1>Transcript → Motion Picture</h1><p>Write or paste one transcript. Magnanimous AI turns it into cinematic scenes, spoken narration, captions, motion and soundtrack, then combines everything into one video.</p></div><img src="/magnanimous-motion.svg" alt="Magnanimous AI motion character"/></header>
  {error&&<div className="error">{error}</div>}
  <section className="grid"><div className="panel">
   <label>Video title<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label>Transcript<textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste the exact words you want Magnanimous AI to speak…"/></label>
   <label>Visual direction<textarea className="small" value={direction} onChange={e=>setDirection(e.target.value)}/></label>
   <div className="row"><label>Format<select value={ratio} onChange={e=>setRatio(e.target.value as Ratio)}><option value="16:9">16:9 landscape</option><option value="9:16">9:16 vertical</option></select></label><label>Voice<select value={voice} onChange={e=>setVoice(e.target.value)}>{voices.map(v=><option key={v} value={v}>{v}</option>)}</select></label><label>Scenes<select value={scenes} onChange={e=>setScenes(Number(e.target.value))}>{[3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label></div>
   <div className="toggles"><label><input type="checkbox" checked={captions} onChange={e=>setCaptions(e.target.checked)}/> Burn captions into video</label><label><input type="checkbox" checked={soundtrack} onChange={e=>setSoundtrack(e.target.checked)}/> Add ambient cinematic soundtrack</label></div>
   <button className="primary" disabled={busy} onClick={generate}>{busy?'GENERATING…':'CREATE COMPLETE AI VIDEO'}</button><p className="stage">{stage}</p>
  </div><div className="panel preview"><h2>Magnanimous AI</h2><p>The character direction follows your uploaded example: friendly white/silver robot, cyan digital expressions and a cinematic neon-city world.</p>{videoUrl?<><video ref={preview} src={videoUrl} controls playsInline/><a className="download" href={videoUrl} download={`magnanimous-ai-${Date.now()}.${videoExt}`}>Download finished video</a></>:<img src="/magnanimous-motion.svg" alt="Magnanimous AI preview"/>}<div className="badges"><span>AI scenes</span><span>Neural voice</span><span>Motion</span><span>Captions</span><span>Soundtrack</span><span>One-file export</span></div></div></section>
  {!!storyboard.scenes?.length&&<section className="story"><h2>Generated scene plan</h2><div>{storyboard.scenes.map(s=><article key={s.index}><b>Scene {s.index}</b><p>{s.narration}</p><small>{s.provider||'Magnanimous visual engine'} · {s.motion||'cinematic motion'}</small></article>)}</div></section>}
  <style jsx>{`*{box-sizing:border-box}.studio{min-height:100vh;background:radial-gradient(circle at 75% 10%,#132d65 0,transparent 30%),#070b13;color:#effbff;padding:28px;font-family:Inter,system-ui,sans-serif}header{max-width:1280px;margin:auto;display:grid;grid-template-columns:1.35fr .65fr;gap:24px;align-items:center}header a{color:#67e8ff;text-decoration:none}header small{display:block;margin-top:22px;letter-spacing:.18em;color:#778ba5;font-weight:800}h1{font-size:clamp(38px,6vw,78px);line-height:.98;margin:10px 0;background:linear-gradient(90deg,#fff,#65efff,#ef68ff);-webkit-background-clip:text;color:transparent}header p{max-width:760px;color:#a9bad0;line-height:1.65}header img{width:100%;border-radius:24px;border:1px solid #24496d;box-shadow:0 0 60px rgba(45,224,255,.12)}.grid{max-width:1280px;margin:26px auto;display:grid;grid-template-columns:1.05fr .95fr;gap:16px}.panel,.story{background:rgba(10,17,30,.9);border:1px solid #203953;border-radius:20px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.26)}label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#8ca3bd;margin-bottom:14px}input,textarea,select{width:100%;margin-top:7px;background:#0c1624;border:1px solid #29415b;border-radius:10px;color:#fff;padding:12px;font:inherit;text-transform:none;letter-spacing:normal}textarea{min-height:210px;resize:vertical;line-height:1.55}.small{min-height:90px}.row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.toggles{display:flex;gap:20px;flex-wrap:wrap;margin:4px 0 18px}.toggles label{display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:normal}.toggles input{width:auto;margin:0}.primary{width:100%;padding:15px;border:0;border-radius:11px;background:linear-gradient(90deg,#25dff6,#7459ff,#ed5eff);color:white;font-weight:900;letter-spacing:.08em;cursor:pointer}.primary:disabled{opacity:.55}.stage{text-align:center;color:#70e9f9;font-size:12px}.preview h2,.story h2{margin-top:0}.preview>p{color:#95a9c0;line-height:1.55}.preview video,.preview>img{width:100%;max-height:540px;object-fit:contain;border-radius:14px;background:#03070d}.download{display:block;margin-top:10px;padding:12px;text-align:center;border:1px solid #2bdff4;border-radius:10px;color:#71efff;text-decoration:none;font-weight:800}.badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.badges span{background:#102338;border:1px solid #274b69;padding:7px 9px;border-radius:999px;font-size:10px;color:#9befff}.story{max-width:1280px;margin:0 auto}.story>div{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.story article{background:#0b1522;border:1px solid #1d3248;border-radius:12px;padding:14px}.story p{color:#a3b4c9;line-height:1.45}.story small{color:#5fe9ff}.error{max-width:1280px;margin:18px auto;background:#3a1520;border:1px solid #7d3547;padding:12px 15px;border-radius:10px}@media(max-width:850px){.studio{padding:16px}header,.grid{grid-template-columns:1fr}header img{max-height:360px;object-fit:cover}.row{grid-template-columns:1fr}.story>div{grid-template-columns:1fr}h1{font-size:48px}}`}</style>
 </main>
}
