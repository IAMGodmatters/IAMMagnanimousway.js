'use client';

import {useState} from 'react';

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

export default function VideoStudio(){
  const [text,setText]=useState('Faith can move mountains. Keep believing, keep praying, and keep moving forward.');
  const [title,setTitle]=useState('I AM Magnanimous Way™');
  const [caption,setCaption]=useState('Faith can move mountains. Keep believing, keep praying, and keep moving forward.');
  const [preset,setPreset]=useState<PresetKey>('vertical');
  const [duration,setDuration]=useState(15);
  const [destination,setDestination]=useState<Destination>('apps');
  const [url,setUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [sharing,setSharing]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function render(){
    setBusy(true);
    setUrl('');
    setError('');
    setNotice('');
    const size=presets[preset];
    try{
      const r=await fetch(`${videoApi}/api/video/render`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text,title,width:size.width,height:size.height,duration}),
      });
      const d=await r.json();
      if(d.download_url){
        setUrl(`${videoApi}${d.download_url}`);
        setNotice('Video ready. Download it, copy the post text, or send it to your social apps.');
      }else setError(d.detail||'Video renderer is not available.');
    }catch{
      setError('Unable to reach the video renderer.');
    }finally{
      setBusy(false);
    }
  }

  async function copyValue(value:string,label:string){
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(value);
      }else{
        const el=document.createElement('textarea');
        el.value=value;
        el.style.position='fixed';
        el.style.opacity='0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        el.remove();
      }
      setNotice(`${label} copied.`);
    }catch{
      setError(`Could not copy ${label.toLowerCase()} in this browser.`);
    }
  }

  async function downloadVideo(){
    if(!url){setNotice('Create the video first, then download it.');return;}
    setError('');
    try{
      const r=await fetch(url);
      if(!r.ok)throw new Error('download failed');
      const blob=await r.blob();
      const local=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=local;
      a.download=`${safeName(title)}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(local);
      setNotice('Video download started.');
    }catch{
      window.open(url,'_blank','noopener,noreferrer');
      setNotice('Opened the video so you can save it from your browser.');
    }
  }

  async function shareVideo(){
    if(!url){setNotice('Create the video first, then use Post / Share.');return;}
    setSharing(true);
    setError('');
    const postText=caption.trim()||text.trim();
    try{
      const r=await fetch(url);
      if(!r.ok)throw new Error('video unavailable');
      const blob=await r.blob();
      const file=new File([blob],`${safeName(title)}.mp4`,{type:blob.type||'video/mp4'});
      const nav:any=navigator;
      const payload:any={title,text:postText,files:[file]};
      if(nav.share&&(!nav.canShare||nav.canShare(payload))){
        await nav.share(payload);
        setNotice('Video sent to your device share menu. Choose the social account you want to post to.');
        return;
      }
      const direct=directShareUrl(destination,postText,url);
      if(direct){
        window.open(direct,'_blank','noopener,noreferrer');
        setNotice('Opened the selected social posting page.');
        return;
      }
      await copyValue(postText,'Post text');
      await downloadVideo();
      setNotice('Your video was prepared for posting: the caption was copied and the video download was started.');
    }catch(err:any){
      if(err?.name==='AbortError'){
        setNotice('Sharing canceled. Your video is still ready.');
      }else{
        const direct=directShareUrl(destination,postText,url);
        if(direct){
          window.open(direct,'_blank','noopener,noreferrer');
          setNotice('Opened the selected social posting page.');
        }else{
          setError('This browser could not send the video directly. Use Download Video and Copy Post Text instead.');
        }
      }
    }finally{
      setSharing(false);
    }
  }

  const fieldStyle={width:'100%',padding:'11px 12px',borderRadius:10,border:'1px solid rgba(120,150,255,.28)',background:'rgba(8,12,28,.55)',color:'inherit'} as const;
  const softButton={padding:'10px 13px',borderRadius:10,border:'1px solid rgba(120,150,255,.3)',background:'rgba(120,150,255,.08)',color:'inherit',fontWeight:700,cursor:'pointer'} as const;

  return <main className="module-page">
    <header className="module-header"><a href="/">← Back to I AM Magnanimous</a><span className="module-status">● VIDEO ENGINE</span></header>

    <section className="module-hero">
      <div className="module-icon">▶</div>
      <div>
        <span className="eyebrow">CREATOR STUDIO</span>
        <h1>Video Studio</h1>
        <p>Create a social-ready video from your message, then download it, copy the AI text, or send the finished video directly to your device’s social sharing menu.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}>
          <a href="/mux" style={{display:'inline-block',padding:'11px 15px',borderRadius:10,textDecoration:'none',background:'linear-gradient(90deg,#00b9e8,#6b62ff)',color:'#fff',fontWeight:800}}>Open Mux Video →</a>
          <a href="/connections" style={{display:'inline-block',padding:'11px 15px',borderRadius:10,textDecoration:'none',border:'1px solid rgba(120,150,255,.35)',color:'inherit'}}>Connections</a>
        </div>
      </div>
    </section>

    <section className="video-studio-grid">
      <div className="module-panel">
        <div className="panel-title"><span>VIDEO INPUT</span><b>SOCIAL READY</b></div>

        <label style={{display:'grid',gap:6,marginBottom:12}}>
          <span style={{fontSize:13,fontWeight:800}}>Video title</span>
          <input style={fieldStyle} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Video title"/>
        </label>

        <label style={{display:'grid',gap:6,marginBottom:12}}>
          <span style={{fontSize:13,fontWeight:800}}>AI video text</span>
          <textarea style={{...fieldStyle,minHeight:145,resize:'vertical'}} value={text} onChange={e=>setText(e.target.value)}/>
        </label>

        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          <button type="button" style={softButton} onClick={()=>copyValue(text,'AI text')}>Copy AI Text</button>
          <button type="button" style={softButton} onClick={()=>{setCaption(text);setNotice('AI video text copied into the social post caption.')}}>Use as Post Caption</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:14}}>
          <label style={{display:'grid',gap:6}}>
            <span style={{fontSize:13,fontWeight:800}}>Social format</span>
            <select style={fieldStyle} value={preset} onChange={e=>setPreset(e.target.value as PresetKey)}>
              {Object.entries(presets).map(([key,value])=><option key={key} value={key}>{value.label} — {value.help}</option>)}
            </select>
          </label>
          <label style={{display:'grid',gap:6}}>
            <span style={{fontSize:13,fontWeight:800}}>Video length</span>
            <select style={fieldStyle} value={duration} onChange={e=>setDuration(Number(e.target.value))}>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </label>
        </div>

        <button onClick={render} disabled={busy}>{busy?'Rendering…':`Create ${presets[preset].label} Video →`}</button>
        {error&&<div className="error">{error}</div>}
        {notice&&<div style={{marginTop:12,padding:'10px 12px',border:'1px solid rgba(120,150,255,.25)',borderRadius:10,fontSize:14}}>{notice}</div>}
      </div>

      <div className="video-preview">
        <div className="scanlines"/>
        <div className="preview-orb">✦</div>
        <span>LIVE PREVIEW · {presets[preset].help}</span>
        {url?<video controls src={url}/>:<p>Your rendered video will appear here.</p>}
      </div>
    </section>

    <section className="module-panel" style={{marginTop:18}}>
      <div className="panel-title"><span>DOWNLOAD & POST</span><b>ONE-TAP TOOLS</b></div>
      <p style={{marginTop:0}}>Prepare the post once, then copy it, download the MP4, or send the video to Facebook, Instagram, TikTok, YouTube, X, LinkedIn, WhatsApp, and other installed apps through your device share menu.</p>

      <label style={{display:'grid',gap:6,marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:800}}>AI caption / post text</span>
        <textarea style={{...fieldStyle,minHeight:110,resize:'vertical'}} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write or paste the caption that should go with the video."/>
      </label>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:14}}>
        <label style={{display:'grid',gap:6}}>
          <span style={{fontSize:13,fontWeight:800}}>Post destination</span>
          <select style={fieldStyle} value={destination} onChange={e=>setDestination(e.target.value as Destination)}>
            <option value="apps">Phone / Device Share Menu</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube / Shorts</option>
            <option value="x">X / Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
      </div>

      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button type="button" style={softButton} onClick={()=>copyValue(caption||text,'Post text')}>Copy Post Text</button>
        <button type="button" style={softButton} onClick={downloadVideo} disabled={!url}>Download MP4</button>
        <button type="button" onClick={shareVideo} disabled={!url||sharing}>{sharing?'Preparing Share…':'Post / Share Video →'}</button>
      </div>

      <p style={{fontSize:12,opacity:.72,marginBottom:0,marginTop:12}}>On phones and compatible browsers, Post / Share sends the actual MP4 file and caption to the system share menu so the user can choose an installed social app. Where file sharing is unavailable, supported networks open their posting page; download and copy remain available as a fallback.</p>
    </section>
  </main>;
}
