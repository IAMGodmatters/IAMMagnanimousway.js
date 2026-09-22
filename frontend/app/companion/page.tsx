'use client';

import {ChangeEvent,useEffect,useRef,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import styles from './page.module.css';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Annotation={label:string;kind:'box'|'point';x:number;y:number;w:number;h:number};
type Step={number?:number;title:string;detail:string};
type Analysis={answer:string;steps:Step[];annotations:Annotation[];mode:string};

async function read(response:Response){
  const text=await response.text();
  try{return JSON.parse(text)}catch{return{detail:text||('Request failed ('+response.status+')')}}
}

function stopStream(stream:MediaStream|null){
  stream?.getTracks().forEach(track=>track.stop());
}

function shrinkImage(source:HTMLVideoElement|HTMLImageElement,sourceWidth:number,sourceHeight:number){
  const max=1600;
  const scale=Math.min(1,max/Math.max(sourceWidth,sourceHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(sourceWidth*scale));
  canvas.height=Math.max(1,Math.round(sourceHeight*scale));
  const context=canvas.getContext('2d');
  if(!context)throw new Error('This browser could not capture the screen frame.');
  context.drawImage(source,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',0.72);
}

export default function MagnanimousCompanion(){
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const[token,setToken]=useState('');
  const[sharing,setSharing]=useState(false);
  const[image,setImage]=useState('');
  const[prompt,setPrompt]=useState('Explain what I am looking at and tell me the next useful step.');
  const[mode,setMode]=useState<'explain'|'guide'|'draft'>('guide');
  const[analysis,setAnalysis]=useState<Analysis|null>(null);
  const[busy,setBusy]=useState(false);
  const[listening,setListening]=useState(false);
  const[notice,setNotice]=useState('');
  const[error,setError]=useState('');

  useEffect(()=>{
    const active=getPlatformAuthToken();
    if(!active){location.replace('/login');return}
    setToken(active);
    return()=>stopStream(streamRef.current);
  },[]);

  async function startShare(){
    setError('');setNotice('');
    const media=(navigator.mediaDevices as any)?.getDisplayMedia;
    if(!media){setError('Screen sharing is not supported by this browser. Upload a screenshot instead.');return}
    try{
      stopStream(streamRef.current);
      const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
      stream.getVideoTracks()[0]?.addEventListener('ended',()=>setSharing(false));
      setSharing(true);
      setNotice('Screen sharing is active locally. Nothing is sent until you press Capture frame and Analyze.');
    }catch(err:any){
      setError(err?.message||'Screen sharing was not started.');
    }
  }

  function stopShare(){
    stopStream(streamRef.current);streamRef.current=null;setSharing(false);
    if(videoRef.current)videoRef.current.srcObject=null;
  }

  function capture(){
    const video=videoRef.current;
    if(!video||!video.videoWidth||!video.videoHeight){setError('Start screen sharing first, then capture a frame.');return}
    try{
      const frame=shrinkImage(video,video.videoWidth,video.videoHeight);
      setImage(frame);setAnalysis(null);setNotice('One screen frame captured. Sharing has been stopped for privacy.');
      stopShare();
    }catch(err:any){setError(err?.message||'The screen frame could not be captured.')}
  }

  function upload(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/i.test(file.type)){setError('Choose a PNG, JPEG, or WebP screenshot.');return}
    const object=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      try{setImage(shrinkImage(img,img.naturalWidth,img.naturalHeight));setAnalysis(null);setNotice('Screenshot loaded locally. Press Analyze when ready.')}
      catch(err:any){setError(err?.message||'Screenshot could not be loaded.')}
      finally{URL.revokeObjectURL(object)}
    };
    img.onerror=()=>{URL.revokeObjectURL(object);setError('Screenshot could not be loaded.')};
    img.src=object;
  }

  function listen(){
    const w:any=window,Recognition=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!Recognition){setError('Voice input is not available in this browser. You can still type.');return}
    const recognition=new Recognition();
    recognition.lang=navigator.language||'en-US';recognition.interimResults=false;recognition.continuous=false;
    recognition.onstart=()=>setListening(true);
    recognition.onend=()=>setListening(false);
    recognition.onerror=()=>setListening(false);
    recognition.onresult=(event:any)=>{
      const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();
      if(transcript)setPrompt(transcript);
    };
    recognition.start();
  }

  async function analyze(){
    if(!image){setError('Capture or upload a screenshot first.');return}
    setBusy(true);setError('');setNotice('Magnanimous AI is reading the captured frame…');
    try{
      const response=await fetch(api+'/api/magnanimous/companion/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({image,prompt,mode})
      });
      const data=await read(response);
      if(!response.ok)throw new Error(data.detail||'Screen analysis failed.');
      setAnalysis({answer:String(data.answer||''),steps:data.steps||[],annotations:data.annotations||[],mode:String(data.mode||mode)});
      setNotice(data.screenshot_persisted===false?'Analysis complete. The screenshot was not stored by Magnanimous Companion.':'Analysis complete.');
    }catch(err:any){setError(err?.message||'Screen analysis failed.')}
    finally{setBusy(false)}
  }

  async function saveSkill(){
    if(!analysis)return;
    setBusy(true);setError('');
    try{
      const instruction=[
        'Use this learned screen-assistance pattern when a similar task is requested.',
        'Original request: '+prompt,
        'Verified guidance from the captured screen:',
        analysis.answer,
        ...analysis.steps.map((step,index)=>(index+1)+'. '+step.title+': '+step.detail)
      ].join('\n');
      const response=await fetch(api+'/api/magnanimous/routine-studio/skills',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({
          name:'Companion skill - '+prompt.slice(0,70),
          description:'Reusable Magnanimous screen-assistance pattern saved from Magnanimous Companion.',
          steps:[{type:'ai.prompt',label:'Magnanimous Companion learned guidance',prompt:instruction}]
        })
      });
      const data=await read(response);
      if(!response.ok)throw new Error(data.detail||'The reusable skill could not be saved.');
      setNotice('Saved as a reusable Magnanimous skill. You can schedule it from Routine Studio.');
    }catch(err:any){setError(err?.message||'The reusable skill could not be saved.')}
    finally{setBusy(false)}
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <div>
        <a href="/">← Home</a>
        <small>I AM MAGNANIMOUS WAY™ · MAGNANIMOUS AI</small>
        <h1>Magnanimous Companion</h1>
        <p>Show Magnanimous one screen frame, ask by voice or text, and get clear visual guidance without continuous screen watching.</p>
      </div>
      <div className={styles.privacy}>
        <b>User-triggered only</b>
        <span>No background screen monitoring.</span>
        <span>No frame is transmitted until you choose Analyze.</span>
        <span>Computer-changing actions stay behind existing approval gates.</span>
      </div>
    </header>

    {error&&<div className={styles.error} role="alert">{error}</div>}
    {notice&&<div className={styles.notice} role="status">{notice}</div>}

    <section className={styles.grid}>
      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><small>1 · SHOW THE SCREEN</small><h2>Capture or upload</h2></div><span>{sharing?'Sharing locally':'Idle'}</span></div>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <div className={styles.actions}>
          {!sharing?<button onClick={startShare}>Share a screen or window</button>:<><button onClick={capture}>Capture frame</button><button className={styles.secondary} onClick={stopShare}>Stop sharing</button></>}
          <label className={styles.upload}>Upload screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label>
        </div>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelTitle}><div><small>2 · ASK MAGNANIMOUS</small><h2>What do you need?</h2></div><button className={styles.mic} onClick={listen}>{listening?'Listening…':'🎙 Voice'}</button></div>
        <div className={styles.modes}>
          {(['explain','guide','draft'] as const).map(value=><button key={value} className={mode===value?styles.activeMode:''} onClick={()=>setMode(value)}>{value==='explain'?'Explain screen':value==='guide'?'Guide me':'Draft from screen'}</button>)}
        </div>
        <textarea value={prompt} onChange={event=>setPrompt(event.target.value)} rows={8} />
        <button className={styles.analyze} disabled={busy||!image} onClick={analyze}>{busy?'Magnanimous is working…':'Analyze with Magnanimous AI'}</button>
      </article>
    </section>

    {image&&<section className={styles.resultGrid}>
      <article className={styles.screenPanel}>
        <div className={styles.panelTitle}><div><small>CAPTURED FRAME</small><h2>Visual guide</h2></div><span>{analysis?.annotations?.length||0} markers</span></div>
        <div className={styles.screen}>
          <img src={image} alt="User-selected screen frame for Magnanimous Companion analysis"/>
          {(analysis?.annotations||[]).map((item,index)=>item.kind==='point'
            ?<span key={index} className={styles.point} style={{left:(item.x*100)+'%',top:(item.y*100)+'%'}}>{item.label||String(index+1)}</span>
            :<span key={index} className={styles.box} style={{left:(item.x*100)+'%',top:(item.y*100)+'%',width:(item.w*100)+'%',height:(item.h*100)+'%'}}><b>{item.label||String(index+1)}</b></span>
          )}
        </div>
      </article>

      <article className={styles.answerPanel}>
        <small>MAGNANIMOUS ANSWER</small>
        <h2>{analysis?'Screen understood':'Ready to analyze'}</h2>
        {analysis?<><p className={styles.answer}>{analysis.answer}</p>
          {analysis.steps.length>0&&<ol>{analysis.steps.map((step,index)=><li key={index}><b>{step.title}</b><span>{step.detail}</span></li>)}</ol>}
          <div className={styles.actions}><button disabled={busy} onClick={saveSkill}>Save as reusable skill</button><a href="/routine-studio">Open Routine Studio →</a><a href="/agents">Specialist departments →</a></div>
        </>:<p className={styles.empty}>Choose Explain, Guide, or Draft, then press Analyze.</p>}
      </article>
    </section>}

    <section className={styles.capabilities}>
      <div><b>Screen-aware</b><span>Understands a captured UI or document frame.</span></div>
      <div><b>Voice + text</b><span>Ask naturally without learning a special command format.</span></div>
      <div><b>Visual guidance</b><span>Numbered markers can point to visible controls and areas.</span></div>
      <div><b>Skill growth</b><span>Useful guidance can become a reusable Magnanimous-owned skill.</span></div>
    </section>
  </main>
}
