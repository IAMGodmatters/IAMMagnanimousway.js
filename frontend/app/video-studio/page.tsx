'use client';

import {useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const videoApi=process.env.NEXT_PUBLIC_VIDEO_API_BASE_URL||api;

const presets={
  vertical:{label:'TikTok / Reels / Shorts',width:720,height:1280,help:'9:16 vertical'},
  feed:{label:'Instagram / Facebook Feed',width:720,height:900,help:'4:5 portrait'},
  square:{label:'Square Social Post',width:720,height:720,help:'1:1 square'},
  landscape:{label:'YouTube / Facebook Landscape',width:1280,height:720,help:'16:9 landscape'},
} as const;

type PresetKey=keyof typeof presets;
type Destination='apps'|'facebook'|'x'|'linkedin'|'whatsapp'|'instagram'|'tiktok'|'youtube';
type VisualMode='auto-free'|'flux-free'|'classic';
type VisualStyle='cinematic'|'realistic'|'faith'|'business'|'social'|'nature';
type VisualProvider={id:string;name:string;type:string;tier:string;free:boolean;configured:boolean;enabled:boolean;model?:string;note?:string};
type SceneResult={image_data_uri?:string;provider?:string;director?:string;image_provider?:string;prompt?:string;detail?:string};

function safeName(value:string){
  return (value||'iam-video').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'iam-video';
}

function directShareUrl(destination:Destination,caption:string,videoUrl:string){
  const text=encodeURIComponent(caption);
  const link=encodeURIComponent(videoUrl);
  if(destination==='facebook')return `https://www.facebook.com/sharer/sharer.php?u=${link}`;
  if(destination==='x')return `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
  if(destination==='linkedin')return `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
  if(destination==='whatsapp')return `https://wa.me/?text=${encodeURIComponent(`${caption}\n${videoUrl}`)}`;
  return '';
}

function wrappedLines(ctx:CanvasRenderingContext2D,value:string,maxWidth:number,maxLines:number){
  const words=value.trim().split(/\s+/).filter(Boolean);
  const lines:string[]=[];
  let line='';
  for(const word of words){
    const candidate=line?`${line} ${word}`:word;
    if(ctx.measureText(candidate).width<=maxWidth||!line)line=candidate;
    else{
      lines.push(line);line=word;
      if(lines.length>=maxLines-1)break;
    }
  }
  if(line&&lines.length<maxLines)lines.push(line);
  if(lines.length===maxLines&&lines[maxLines-1]?.length>3)lines[maxLines-1]=`${lines[maxLines-1].slice(0,-1)}…`;
  return lines;
}

function loadImage(src:string){
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('The generated visual could not be loaded.'));
    image.src=src;
  });
}

async function createBrowserVideo(title:string,text:string,width:number,height:number,duration:number,backgroundDataUri?:string){
  if(typeof window==='undefined'||typeof MediaRecorder==='undefined')throw new Error('Local video creation is not supported by this browser.');
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  if(!ctx||!canvas.captureStream)throw new Error('Local video creation is not supported by this browser.');
  const background=backgroundDataUri?await loadImage(backgroundDataUri):null;

  const candidates=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  const mime=candidates.find(value=>MediaRecorder.isTypeSupported(value))||'';
  const stream=canvas.captureStream(30);
  const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6_000_000}:{videoBitsPerSecond:6_000_000});
  const chunks:BlobPart[]=[];
  const finished=new Promise<Blob>((resolve,reject)=>{
    recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};
    recorder.onerror=()=>reject(new Error('Local video recording failed.'));
    recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||mime||'video/webm'}));
  });

  const drawBackground=(progress:number)=>{
    if(background){
      const cover=Math.max(width/background.width,height/background.height);
      const zoom=cover*(1.04+progress*.08);
      const dw=background.width*zoom,dh=background.height*zoom;
      const panX=Math.sin(progress*Math.PI*1.2)*width*.025;
      const panY=Math.cos(progress*Math.PI)*height*.018;
      ctx.drawImage(background,(width-dw)/2+panX,(height-dh)/2+panY,dw,dh);
      const shade=ctx.createLinearGradient(0,0,0,height);
      shade.addColorStop(0,'rgba(3,6,14,.22)');
      shade.addColorStop(.48,'rgba(3,6,14,.38)');
      shade.addColorStop(1,'rgba(3,6,14,.76)');
      ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
      const vignette=ctx.createRadialGradient(width/2,height*.45,Math.min(width,height)*.18,width/2,height*.45,Math.max(width,height)*.72);
      vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.48)');
      ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
      const sweepX=(progress*1.6-.3)*width;
      const sweep=ctx.createLinearGradient(sweepX-width*.3,0,sweepX+width*.3,height);
      sweep.addColorStop(0,'rgba(255,255,255,0)');sweep.addColorStop(.5,'rgba(255,255,255,.055)');sweep.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=sweep;ctx.fillRect(0,0,width,height);
      return;
    }
    const gradient=ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,'#17112b');gradient.addColorStop(.55,'#13203f');gradient.addColorStop(1,'#231533');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    const pulse=.88+.12*Math.sin(progress*Math.PI*4);
    const radius=Math.max(54,Math.min(width,height)*.09)*pulse;
    const orb=ctx.createRadialGradient(width/2,height*.18,8,width/2,height*.18,radius);
    orb.addColorStop(0,'rgba(255,255,255,.95)');orb.addColorStop(.25,'rgba(118,184,255,.78)');orb.addColorStop(1,'rgba(83,65,180,0)');
    ctx.fillStyle=orb;ctx.beginPath();ctx.arc(width/2,height*.18,radius,0,Math.PI*2);ctx.fill();
  };

  const draw=(progress:number)=>{
    drawBackground(progress);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=Math.max(8,width*.018);ctx.shadowOffsetY=Math.max(2,width*.004);
    ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(30,Math.floor(width/17))}px Arial, sans-serif`;
    const titleLines=wrappedLines(ctx,title||'I AM Magnanimous Way™',width*.82,3);
    const titleLineHeight=Math.max(38,Math.floor(width/14));
    let titleY=height*.33-(titleLines.length-1)*titleLineHeight/2;
    for(const line of titleLines){ctx.fillText(line,width/2,titleY,width*.84);titleY+=titleLineHeight;}
    ctx.font=`600 ${Math.max(24,Math.floor(width/25))}px Arial, sans-serif`;
    const bodyLines=wrappedLines(ctx,text,width*.78,height>width?9:6);
    const bodyLineHeight=Math.max(34,Math.floor(width/18));
    let bodyY=height*.59-(bodyLines.length-1)*bodyLineHeight/2;
    for(const line of bodyLines){ctx.fillStyle='rgba(255,255,255,.97)';ctx.fillText(line,width/2,bodyY,width*.8);bodyY+=bodyLineHeight;}
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.font=`700 ${Math.max(18,Math.floor(width/38))}px Arial, sans-serif`;ctx.fillStyle='rgba(255,255,255,.78)';
    ctx.fillText('I AM Magnanimous Way™',width/2,height*.91,width*.8);
    const barWidth=width*.64,barX=(width-barWidth)/2,barY=height*.95,barH=Math.max(4,height*.004);
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(barX,barY,barWidth,barH);
    ctx.fillStyle='rgba(255,255,255,.84)';ctx.fillRect(barX,barY,barWidth*Math.min(1,Math.max(0,progress)),barH);
  };

  draw(0);recorder.start(250);
  const started=performance.now();
  await new Promise<void>(resolve=>{
    const frame=(now:number)=>{
      const progress=Math.min(1,((now-started)/1000)/duration);draw(progress);
      if(progress>=1){resolve();return;}requestAnimationFrame(frame);
    };requestAnimationFrame(frame);
  });
  recorder.stop();
  const blob=await finished;stream.getTracks().forEach(track=>track.stop());
  if(!blob.size)throw new Error('Local video creation produced an empty file.');
  return blob;
}

export default function VideoStudio(){
  const [text,setText]=useState('Faith can move mountains. Keep believing, keep praying, and keep moving forward.');
  const [title,setTitle]=useState('I AM Magnanimous Way™');
  const [caption,setCaption]=useState('Faith can move mountains. Keep believing, keep praying, and keep moving forward.');
  const [preset,setPreset]=useState<PresetKey>('vertical');
  const [duration,setDuration]=useState(15);
  const [destination,setDestination]=useState<Destination>('apps');
  const [visualMode,setVisualMode]=useState<VisualMode>('auto-free');
  const [visualStyle,setVisualStyle]=useState<VisualStyle>('cinematic');
  const [visualProviders,setVisualProviders]=useState<VisualProvider[]>([]);
  const [scenePrompt,setScenePrompt]=useState('');
  const [url,setUrl]=useState('');
  const [mime,setMime]=useState('video/mp4');
  const [busy,setBusy]=useState(false);
  const [sharing,setSharing]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  useEffect(()=>{fetch(`${api}/api/visual/providers`).then(r=>r.json()).then(d=>setVisualProviders(d.providers||[])).catch(()=>setVisualProviders([]))},[]);

  function replaceVideoUrl(next:string){setUrl(previous=>{if(previous.startsWith('blob:'))URL.revokeObjectURL(previous);return next;});}

  async function getFreeScene(){
    if(visualMode==='classic')return null;
    const token=localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
    if(!token)throw new Error('Sign in to use the MAGNANIMOUS cinematic engine.');
    const response=await fetch(`${api}/api/visual/scene`,{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body:JSON.stringify({title,text,style:visualStyle,director:visualMode==='flux-free'?'built-in':'auto'})
    });
    const data:SceneResult=await response.json().catch(()=>({}));
    if(!response.ok||!data.image_data_uri)throw new Error(data.detail||`MAGNANIMOUS visual engine returned ${response.status}`);
    setScenePrompt(data.prompt||'');
    return data;
  }

  async function render(){
    setBusy(true);replaceVideoUrl('');setError('');setScenePrompt('');
    const size=presets[preset];
    if(visualMode!=='classic'){
      try{
        setNotice(visualMode==='auto-free'?'MAGNANIMOUS is directing your cinematic scene…':'MAGNANIMOUS is creating your cinematic scene…');
        const scene=await getFreeScene();
        setNotice('MAGNANIMOUS visual ready. Animating it into your social video on this device…');
        const blob=await createBrowserVideo(title,text,size.width,size.height,duration,scene?.image_data_uri);
        replaceVideoUrl(URL.createObjectURL(blob));setMime(blob.type||'video/webm');
        setNotice('MAGNANIMOUS cinematic video ready. Your branded visual engine completed the scene and device rendering.');
        setBusy(false);return;
      }catch(visualError:any){
        setNotice(`MAGNANIMOUS cinematic mode was temporarily unavailable (${visualError?.message||'visual engine error'}). Trying the alternate video engine…`);
      }
    }else setNotice('MAGNANIMOUS is creating your video…');

    try{
      const r=await fetch(`${videoApi}/api/video/render`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,title,width:size.width,height:size.height,duration})});
      if(!r.ok)throw new Error(`remote renderer returned ${r.status}`);
      const d=await r.json();if(!d.download_url)throw new Error('remote renderer did not return a video');
      replaceVideoUrl(`${videoApi}${d.download_url}`);setMime('video/mp4');setNotice('MAGNANIMOUS MP4 video ready.');
    }catch{
      try{
        setNotice('MAGNANIMOUS cloud rendering is unavailable, so the local engine is creating your video on this device…');
        const blob=await createBrowserVideo(title,text,size.width,size.height,duration);
        replaceVideoUrl(URL.createObjectURL(blob));setMime(blob.type||'video/webm');setNotice('MAGNANIMOUS local video ready with no required paid video-generation service.');
      }catch(localError:any){setError(localError?.message||'Video creation is not supported by this browser.');setNotice('');}
    }finally{setBusy(false);}
  }

  async function copyValue(value:string,label:string){
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
      else{const el=document.createElement('textarea');el.value=value;el.style.position='fixed';el.style.opacity='0';document.body.appendChild(el);el.select();document.execCommand('copy');el.remove();}
      setNotice(`${label} copied.`);
    }catch{setError(`Could not copy ${label.toLowerCase()} in this browser.`);}
  }

  async function currentBlob(){if(!url)throw new Error('Create the video first.');const r=await fetch(url);if(!r.ok)throw new Error('Video is unavailable.');return r.blob();}

  async function downloadVideo(){
    if(!url){setNotice('Create the video first, then download it.');return;}setError('');
    try{const blob=await currentBlob(),local=URL.createObjectURL(blob),ext=(blob.type||mime).includes('mp4')?'mp4':'webm';const a=document.createElement('a');a.href=local;a.download=`${safeName(title)}.${ext}`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(local);setNotice('Video download started.');}
    catch{if(!url.startsWith('blob:'))window.open(url,'_blank','noopener,noreferrer');setNotice('Opened or prepared the video so you can save it from your browser.');}
  }

  async function shareVideo(){
    if(!url){setNotice('Create the video first, then use Post / Share.');return;}setSharing(true);setError('');const postText=caption.trim()||text.trim();
    try{
      const blob=await currentBlob(),ext=(blob.type||mime).includes('mp4')?'mp4':'webm',file=new File([blob],`${safeName(title)}.${ext}`,{type:blob.type||mime||'video/webm'});const nav:any=navigator;const payload:any={title,text:postText,files:[file]};
      if(nav.share&&(!nav.canShare||nav.canShare(payload))){await nav.share(payload);setNotice('Video sent to your device share menu. Choose the social account you want to post to.');return;}
      if(!url.startsWith('blob:')){const direct=directShareUrl(destination,postText,url);if(direct){window.open(direct,'_blank','noopener,noreferrer');setNotice('Opened the selected social posting page.');return;}}
      await copyValue(postText,'Post text');await downloadVideo();setNotice('Your caption was copied and the video download was started so you can post it immediately.');
    }catch(err:any){if(err?.name==='AbortError')setNotice('Sharing canceled. Your video is still ready.');else setError('This browser could not send the video directly. Use Download Video and Copy Post Text instead.');}
    finally{setSharing(false);}
  }

  const fieldStyle={width:'100%',padding:'11px 12px',borderRadius:10,border:'1px solid rgba(120,150,255,.28)',background:'rgba(8,12,28,.55)',color:'inherit'} as const;
  const softButton={padding:'10px 13px',borderRadius:10,border:'1px solid rgba(120,150,255,.3)',background:'rgba(120,150,255,.08)',color:'inherit',fontWeight:700,cursor:'pointer'} as const;
  const readyVisuals=visualProviders.filter(p=>p.configured&&p.enabled);

  return <main className="module-page">
    <header className="module-header"><a href="/">← Back to I AM Magnanimous</a><span className="module-status">● MAGNANIMOUS CINEMATIC ENGINE</span></header>
    <section className="module-hero"><div className="module-icon">▶</div><div><span className="eyebrow">MAGNANIMOUS CREATOR STUDIO</span><h1>Video Studio</h1><p>Create cinematic social videos inside the MAGNANIMOUS branded engine. MAGNANIMOUS directs the scene, creates the visual, animates it into video, and keeps alternate rendering paths available automatically when needed. Third-party infrastructure stays behind the platform instead of competing with your brand for attention.</p><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}><a href="/owner-integrations" style={{display:'inline-block',padding:'11px 15px',borderRadius:10,textDecoration:'none',border:'1px solid rgba(120,150,255,.35)',color:'inherit'}}>Engine Settings</a></div></div></section>

    <section className="module-panel" style={{marginBottom:18}}><div className="panel-title"><span>MAGNANIMOUS VIDEO ENGINE</span><b>{readyVisuals.length?'READY':'CORE READY'}</b></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10}}><div style={{padding:12,border:'1px solid rgba(120,150,255,.2)',borderRadius:10,background:'rgba(8,12,28,.35)'}}><b style={{display:'block'}}>MAGNANIMOUS Cinematic</b><span style={{display:'block',fontSize:11,margin:'5px 0',opacity:.78}}>FREE-FIRST · READY</span><small style={{opacity:.7,lineHeight:1.4}}>Branded cinematic scene creation, direction, motion, and fallback rendering managed automatically inside I AM Magnanimous Way™.</small></div><div style={{padding:12,border:'1px solid rgba(120,150,255,.2)',borderRadius:10,background:'rgba(8,12,28,.35)'}}><b style={{display:'block'}}>MAGNANIMOUS Classic</b><span style={{display:'block',fontSize:11,margin:'5px 0',opacity:.78}}>LOCAL MODE · READY</span><small style={{opacity:.7,lineHeight:1.4}}>Device-based video creation remains available as a branded fallback with no required paid video-generation service.</small></div></div></section>

    <section className="video-studio-grid"><div className="module-panel"><div className="panel-title"><span>VIDEO INPUT</span><b>FREE-FIRST · SOCIAL READY</b></div>
      <label style={{display:'grid',gap:6,marginBottom:12}}><span style={{fontSize:13,fontWeight:800}}>Video title</span><input style={fieldStyle} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Video title"/></label>
      <label style={{display:'grid',gap:6,marginBottom:12}}><span style={{fontSize:13,fontWeight:800}}>AI video text</span><textarea style={{...fieldStyle,minHeight:145,resize:'vertical'}} value={text} onChange={e=>setText(e.target.value)}/></label>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}><button type="button" style={softButton} onClick={()=>copyValue(text,'AI text')}>Copy AI Text</button><button type="button" style={softButton} onClick={()=>{setCaption(text);setNotice('AI video text copied into the social post caption.')}}>Use as Post Caption</button></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:14}}>
        <label style={{display:'grid',gap:6}}><span style={{fontSize:13,fontWeight:800}}>MAGNANIMOUS video engine</span><select style={fieldStyle} value={visualMode} onChange={e=>setVisualMode(e.target.value as VisualMode)}><option value="auto-free">MAGNANIMOUS Cinematic — Recommended</option><option value="flux-free">MAGNANIMOUS Cinematic — Direct mode</option><option value="classic">MAGNANIMOUS Classic — Local mode</option></select></label>
        <label style={{display:'grid',gap:6}}><span style={{fontSize:13,fontWeight:800}}>Visual style</span><select style={fieldStyle} value={visualStyle} onChange={e=>setVisualStyle(e.target.value as VisualStyle)}><option value="cinematic">Cinematic</option><option value="realistic">Photorealistic</option><option value="faith">Faith / Hope</option><option value="business">Business</option><option value="social">Social Campaign</option><option value="nature">Nature</option></select></label>
        <label style={{display:'grid',gap:6}}><span style={{fontSize:13,fontWeight:800}}>Social format</span><select style={fieldStyle} value={preset} onChange={e=>setPreset(e.target.value as PresetKey)}>{Object.entries(presets).map(([key,value])=><option key={key} value={key}>{value.label} — {value.help}</option>)}</select></label>
        <label style={{display:'grid',gap:6}}><span style={{fontSize:13,fontWeight:800}}>Video length</span><select style={fieldStyle} value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={10}>10 seconds</option><option value={15}>15 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></label>
      </div>
      <button onClick={render} disabled={busy}>{busy?'Creating Video…':`Create ${presets[preset].label} Video →`}</button>{error&&<div className="error">{error}</div>}{notice&&<div style={{marginTop:12,padding:'10px 12px',border:'1px solid rgba(120,150,255,.25)',borderRadius:10,fontSize:14}}>{notice}</div>}{scenePrompt&&<details style={{marginTop:10,fontSize:12,opacity:.8}}><summary>MAGNANIMOUS cinematic scene prompt</summary><p>{scenePrompt}</p></details>}
    </div>
    <div className="video-preview"><div className="scanlines"/><div className="preview-orb">✦</div><span>LIVE PREVIEW · {presets[preset].help}</span>{url?<video controls src={url}/>:<p>Your cinematic video will appear here.</p>}</div></section>

    <section className="module-panel" style={{marginTop:18}}><div className="panel-title"><span>DOWNLOAD & POST</span><b>ONE-TAP TOOLS</b></div><p style={{marginTop:0}}>Prepare the post once, then copy it, download the finished video, or send it to Facebook, Instagram, TikTok, YouTube, X, LinkedIn, WhatsApp, and other installed apps through your device share menu.</p>
      <label style={{display:'grid',gap:6,marginBottom:12}}><span style={{fontSize:13,fontWeight:800}}>AI caption / post text</span><textarea style={{...fieldStyle,minHeight:110,resize:'vertical'}} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write or paste the caption that should go with the video."/></label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:14}}><label style={{display:'grid',gap:6}}><span style={{fontSize:13,fontWeight:800}}>Post destination</span><select style={fieldStyle} value={destination} onChange={e=>setDestination(e.target.value as Destination)}><option value="apps">Phone / Device Share Menu</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube / Shorts</option><option value="x">X / Twitter</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option></select></label></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button type="button" style={softButton} onClick={()=>copyValue(caption||text,'Post text')}>Copy Post Text</button><button type="button" style={softButton} onClick={downloadVideo} disabled={!url}>Download Video</button><button type="button" onClick={shareVideo} disabled={!url||sharing}>{sharing?'Preparing Share…':'Post / Share Video →'}</button></div>
      <p style={{fontSize:12,opacity:.72,marginBottom:0,marginTop:12}}>MAGNANIMOUS automatically uses the best available free-first visual and rendering path behind the scenes. Third-party infrastructure is not promoted here unless it is intentionally displayed as a revenue-producing sponsored placement.</p>
    </section>
  </main>;
}