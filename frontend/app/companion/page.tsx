'use client';

import {ChangeEvent,useEffect,useRef,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import styles from './page.module.css';
import {VisualStage,type GraphicScene} from './visual-stage';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Annotation={label:string;kind:'box'|'point';x:number;y:number;w:number;h:number};
type Step={number?:number;title:string;detail:string};
type Analysis={answer:string;steps:Step[];annotations:Annotation[];mode:string;graphics:GraphicScene|null};
type BridgeDevice={id:string;name:string;hostname:string;online:boolean;status:string;capabilities:string[];last_seen_at:number};
type BridgeOverview={ready:boolean;paired:boolean;devices:BridgeDevice[];pending_tasks:number;actions:Record<string,{risk:string;confirmation:boolean;auto:boolean}>};
type BridgeTask={id:string;action:string;status:string;result?:any;error?:string;risk_class?:string;requires_confirmation?:boolean};

async function read(response:Response){
  const text=await response.text();
  try{return JSON.parse(text)}catch{return{detail:text||('Request failed ('+response.status+')')}}
}

function stopStream(stream:MediaStream|null){
  stream?.getTracks().forEach(track=>track.stop());
}

function shrinkImage(source:HTMLVideoElement|HTMLImageElement,sourceWidth:number,sourceHeight:number){
  const max=1400;
  const scale=Math.min(1,max/Math.max(sourceWidth,sourceHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(sourceWidth*scale));
  canvas.height=Math.max(1,Math.round(sourceHeight*scale));
  const context=canvas.getContext('2d');
  if(!context)throw new Error('This browser could not capture the screen frame.');
  context.drawImage(source,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',0.64);
}

function wait(ms:number){return new Promise(resolve=>setTimeout(resolve,ms))}

export default function MagnanimousCompanion(){
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const[token,setToken]=useState('');
  const[sharing,setSharing]=useState(false);
  const[image,setImage]=useState('');
  const[prompt,setPrompt]=useState('Explain what I am looking at and tell me the next useful step.');
  const[mode,setMode]=useState<'explain'|'guide'|'draft'|'visualize'>('guide');
  const[analysis,setAnalysis]=useState<Analysis|null>(null);
  const[busy,setBusy]=useState(false);
  const[listening,setListening]=useState(false);
  const[readingAloud,setReadingAloud]=useState(false);
  const[notice,setNotice]=useState('');
  const[error,setError]=useState('');
  const[bridge,setBridge]=useState<BridgeOverview|null>(null);
  const[selectedDevice,setSelectedDevice]=useState('');
  const[bridgeUrl,setBridgeUrl]=useState('https://example.com');
  const[bridgeTarget,setBridgeTarget]=useState('');
  const[bridgeBusy,setBridgeBusy]=useState(false);
  const[bridgeTask,setBridgeTask]=useState<BridgeTask|null>(null);
  const[bridgeOutput,setBridgeOutput]=useState('');

  useEffect(()=>{
    const active=getPlatformAuthToken();
    if(!active){location.replace('/login');return}
    setToken(active);
    return()=>{
      stopStream(streamRef.current);
      if(typeof window!=='undefined'&&window.speechSynthesis)window.speechSynthesis.cancel();
    };
  },[]);

  useEffect(()=>{
    if(token)refreshBridge();
  },[token]);

  async function apiRequest(path:string,init:RequestInit={}){
    const headers=new Headers(init.headers||{});
    headers.set('Authorization','Bearer '+token);
    if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    const response=await fetch(api+path,{...init,headers,cache:'no-store'});
    const data=await read(response);
    if(!response.ok)throw new Error(data.detail||('Request failed ('+response.status+').'));
    return data;
  }

  async function refreshBridge(){
    try{
      const data=await apiRequest('/api/magnanimous/local-bridge');
      setBridge(data);
      const devices=(data.devices||[]) as BridgeDevice[];
      const active=devices.find(device=>device.online&&device.status==='active');
      if(active)setSelectedDevice(current=>current||active.id);
    }catch(err:any){
      setBridge(null);
      setError(err?.message||'The local computer connection could not be checked.');
    }
  }

  async function startBridgeTask(action:string,payload:Record<string,any>){
    if(!selectedDevice)throw new Error('Choose an online paired computer first.');
    setBridgeBusy(true);setBridgeOutput('');setError('');
    try{
      const queued=await apiRequest('/api/magnanimous/local-bridge/tasks',{
        method:'POST',
        body:JSON.stringify({device_id:selectedDevice,action,payload})
      });
      const task:BridgeTask={id:String(queued.id),action,status:String(queued.status||'queued'),risk_class:queued.risk_class,requires_confirmation:Boolean(queued.requires_confirmation)};
      setBridgeTask(task);
      setNotice(task.requires_confirmation?'The exact computer action is staged. Review it and press Confirm before it runs.':'The read-only computer task was queued.');
      if(!task.requires_confirmation)await pollBridgeTask(task.id);
    }catch(err:any){setError(err?.message||'The local computer task could not be started.')}
    finally{setBridgeBusy(false)}
  }

  async function pollBridgeTask(id:string){
    setBridgeBusy(true);
    try{
      for(let attempt=0;attempt<40;attempt++){
        const task=await apiRequest('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(id));
        const current:BridgeTask={id,action:String(task.action||''),status:String(task.status||''),result:task.result,error:task.error,risk_class:task.risk_class};
        setBridgeTask(current);
        if(current.status==='completed'){
          setBridgeOutput(JSON.stringify(current.result||{},null,2));
          setNotice('The local computer returned a verified task result.');
          await refreshBridge();
          return;
        }
        if(['failed','cancelled','expired'].includes(current.status)){
          setError(current.error||('The local computer task ended with status '+current.status+'.'));
          setBridgeOutput(JSON.stringify(current.result||{},null,2));
          await refreshBridge();
          return;
        }
        await wait(1500);
      }
      setNotice('The task is still running. Refresh task status to check its latest result.');
    }catch(err:any){setError(err?.message||'Could not retrieve the computer task result.')}
    finally{setBridgeBusy(false)}
  }

  async function confirmBridgeTask(){
    if(!bridgeTask?.id)return;
    setBridgeBusy(true);setError('');
    try{
      await apiRequest('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(bridgeTask.id)+'/confirm',{method:'POST',body:JSON.stringify({})});
      setBridgeTask({...bridgeTask,status:'queued',requires_confirmation:false});
      setNotice('Your confirmation was recorded. The paired computer can now execute this exact task.');
      await pollBridgeTask(bridgeTask.id);
    }catch(err:any){setError(err?.message||'The task could not be confirmed.')}
    finally{setBridgeBusy(false)}
  }

  async function cancelBridgeTask(){
    if(!bridgeTask?.id)return;
    setBridgeBusy(true);setError('');
    try{
      await apiRequest('/api/magnanimous/local-bridge/tasks/'+encodeURIComponent(bridgeTask.id)+'/cancel',{method:'POST',body:JSON.stringify({})});
      setBridgeTask({...bridgeTask,status:'cancelled'});
      setNotice('The queued computer task was cancelled.');
      await refreshBridge();
    }catch(err:any){setError(err?.message||'The task could not be cancelled.')}
    finally{setBridgeBusy(false)}
  }

  function normalizedUrl(value:string){
    let url:URL;
    try{url=new URL(value.trim())}catch{throw new Error('Enter a complete website address beginning with https:// or http://.')}
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Use a public HTTP or HTTPS address without embedded credentials.');
    const host=url.hostname.toLowerCase();
    if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||/^127\.|^0\.|^169\.254\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host))throw new Error('Local/private network targets are blocked in this browser workflow.');
    return url.toString();
  }

  async function openLocalSignIn(){
    try{
      const url=normalizedUrl(bridgeUrl);
      await startBridgeTask('browser_profile_setup',{url,profile:'companion',seconds:300});
    }catch(err:any){setError(err?.message||'Could not prepare the local sign-in browser.')}
  }

  async function inspectLocalPage(){
    try{
      const url=normalizedUrl(bridgeUrl);
      await startBridgeTask('browser_read_flow',{
        profile:'companion',
        steps:[{op:'goto',url},{op:'wait_ms',ms:700},{op:'snapshot',max_chars:16000}]
      });
    }catch(err:any){setError(err?.message||'Could not inspect the local browser page.')}
  }

  async function clickLocalControl(){
    const target=bridgeTarget.trim();
    if(!target||target.length>180){setError('Enter the exact visible button or link text (1-180 characters).');return}
    try{
      const url=normalizedUrl(bridgeUrl);
      await startBridgeTask('browser_action_flow',{
        profile:'companion',
        steps:[{op:'goto',url},{op:'wait_ms',ms:600},{op:'click',text:target,exact:true,timeout_ms:10000}]
      });
    }catch(err:any){setError(err?.message||'Could not stage the browser action.')}
  }

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
    }catch(err:any){setError(err?.message||'Screen sharing was not started.')}
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

  function readAnswerAloud(){
    if(!analysis?.answer||!('speechSynthesis' in window)){setError('Speech playback is not available in this browser.');return}
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(analysis.answer);
    utterance.lang=navigator.language||'en-US';
    utterance.onend=()=>setReadingAloud(false);
    utterance.onerror=()=>setReadingAloud(false);
    setReadingAloud(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopReadingAloud(){
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
    setReadingAloud(false);
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
      setAnalysis({answer:String(data.answer||''),steps:data.steps||[],annotations:data.annotations||[],mode:String(data.mode||mode),graphics:data.graphics&&['diagram','3d_scene'].includes(data.graphics.kind)?data.graphics:null});
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

  const onlineDevices=(bridge?.devices||[]).filter(device=>device.online&&device.status==='active');
  const selectedCapabilities=onlineDevices.find(device=>device.id===selectedDevice)?.capabilities||[];
  const canInspect=selectedCapabilities.includes('browser_read_flow');
  const canAct=selectedCapabilities.includes('browser_action_flow');
  const canSetup=selectedCapabilities.includes('browser_profile_setup');

  return <main className={styles.page}>
    <header className={styles.header}>
      <div>
        <a href="/">← Home</a>
        <small>I AM MAGNANIMOUS WAY™ · MAGNANIMOUS AI</small>
        <h1>Magnanimous Companion</h1>
        <p>Show Magnanimous one screen frame, ask by voice or text, and receive screen guidance, generated diagrams, or an interactive 3D explanation. Your paired computer can also open and inspect websites through its protected local browser.</p>
      </div>
      <div className={styles.privacy}>
        <b>User-triggered only</b>
        <span>No background screen monitoring.</span>
        <span>No frame is transmitted until you choose Analyze.</span>
        <span>Computer-changing browser actions require a separate confirmation.</span>
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
          {(['explain','guide','draft','visualize'] as const).map(value=><button key={value} className={mode===value?styles.activeMode:''} onClick={()=>setMode(value)}>{value==='explain'?'Explain screen':value==='guide'?'Guide me':value==='draft'?'Draft from screen':'Visualize'}</button>)}
        </div>
        <textarea value={prompt} onChange={event=>setPrompt(event.target.value)} rows={8} />
        <button className={styles.analyze} disabled={busy||!image} onClick={analyze}>{busy?'Magnanimous is working…':'Analyze with Magnanimous AI'}</button>
      </article>
    </section>

    <section className={styles.bridgePanel}>
      <div className={styles.panelTitle}>
        <div><small>3 · USE YOUR COMPUTER</small><h2>Protected local browser</h2></div>
        <span>{bridge?.ready?'Computer verified':bridge?.paired?'Computer paired':'Not connected'}</span>
      </div>
      <p className={styles.bridgeIntro}>Magnanimous uses the paired computer’s local browser. Browser profiles and sign-in cookies stay on that computer. The platform receives only the task result you request.</p>
      <div className={styles.bridgeControls}>
        <button className={styles.secondary} onClick={refreshBridge} disabled={bridgeBusy}>Refresh connection</button>
        <select value={selectedDevice} onChange={event=>setSelectedDevice(event.target.value)} aria-label="Paired computer">
          <option value="">Choose paired computer</option>
          {(bridge?.devices||[]).map(device=><option key={device.id} value={device.id}>{device.name} · {device.online?'online':'offline'}</option>)}
        </select>
      </div>
      {selectedDevice&&<div className={styles.capabilityText}>
        <b>{selectedCapabilities.length} local capabilities advertised</b>
        <span>{canInspect?'Page inspection ready':'Page inspection unavailable'} · {canSetup?'Sign-in window ready':'Sign-in window unavailable'} · {canAct?'Confirmed browser actions ready':'Confirmed browser actions unavailable'}</span>
      </div>}
      <label className={styles.fieldLabel}>Website address
        <input value={bridgeUrl} onChange={event=>setBridgeUrl(event.target.value)} placeholder="https://example.com" inputMode="url"/>
      </label>
      <div className={styles.actions}>
        <button disabled={bridgeBusy||!selectedDevice||!canSetup} onClick={openLocalSignIn}>Open local sign-in window</button>
        <button disabled={bridgeBusy||!selectedDevice||!canInspect} onClick={inspectLocalPage}>Read page with Magnanimous</button>
      </div>
      <div className={styles.actionRow}>
        <label className={styles.fieldLabel}>Exact visible link or button text
          <input value={bridgeTarget} onChange={event=>setBridgeTarget(event.target.value)} placeholder="Example: Continue"/>
        </label>
        <button disabled={bridgeBusy||!selectedDevice||!canAct||!bridgeTarget.trim()} onClick={clickLocalControl}>Stage browser click</button>
      </div>
      {bridgeTask&&<div className={styles.taskBox}>
        <div><b>Computer task: {bridgeTask.action.replaceAll('_',' ')}</b><span>Status: {bridgeTask.status} · {bridgeTask.id}</span></div>
        {bridgeTask.requires_confirmation&&<p>Review the website and exact browser action. Nothing has run yet.</p>}
        <div className={styles.actions}>
          {bridgeTask.requires_confirmation&&<button disabled={bridgeBusy} onClick={confirmBridgeTask}>Confirm this action</button>}
          {['queued','needs_confirmation'].includes(bridgeTask.status)&&<button className={styles.secondary} disabled={bridgeBusy} onClick={cancelBridgeTask}>Cancel task</button>}
          {!['completed','failed','cancelled','expired','needs_confirmation'].includes(bridgeTask.status)&&<button className={styles.secondary} disabled={bridgeBusy} onClick={()=>pollBridgeTask(bridgeTask.id)}>Refresh task</button>}
        </div>
        {bridgeOutput&&<pre className={styles.bridgeOutput}>{bridgeOutput}</pre>}
        {bridgeTask.error&&<p className={styles.bridgeError}>{bridgeTask.error}</p>}
      </div>}
      <p className={styles.bridgeNote}>No remote shell or unrestricted mouse/keyboard control is exposed. Passwords and secret fields cannot be filled by remote tasks. Opening a sign-in window lets you sign in locally yourself.</p>
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

      {analysis?.graphics&&<div className={styles.visualArea}><VisualStage scene={analysis.graphics}/></div>}
      <article className={styles.answerPanel}>
        <small>MAGNANIMOUS ANSWER</small>
        <h2>{analysis?'Screen understood':'Ready to analyze'}</h2>
        {analysis?<><p className={styles.answer}>{analysis.answer}</p>
          {analysis.steps.length>0&&<ol>{analysis.steps.map((step,index)=><li key={index}><b>{step.title}</b><span>{step.detail}</span></li>)}</ol>}
          <div className={styles.actions}><button disabled={busy} onClick={saveSkill}>Save as reusable skill</button><button className={styles.secondary} onClick={readingAloud?stopReadingAloud:readAnswerAloud}>{readingAloud?'Stop speaking':'Read answer aloud'}</button><a href="/routine-studio">Open Routine Studio →</a><a href="/agents">Specialist departments →</a></div>
        </>:<p className={styles.empty}>Choose Explain, Guide, Draft, or Visualize, then press Analyze.</p>}
      </article>
    </section>}

    <section className={styles.capabilities}>
      <div><b>Screen-aware</b><span>Understands a captured UI or document frame.</span></div>
      <div><b>Voice + speech</b><span>Ask naturally and hear answers using your browser’s built-in speech.</span></div>
      <div><b>Visual guidance</b><span>Numbered markers can point to visible controls and areas.</span></div>
      <div><b>Real-time graphics</b><span>Safe structured diagrams and interactive 3D scenes are drawn locally by Magnanimous.</span></div>
      <div><b>Skill growth</b><span>Useful guidance can become a reusable Magnanimous-owned skill.</span></div>
      <div><b>Desktop handoff</b><span>Uses the paired Local Bridge and confirmation-gated browser actions.</span></div>
    </section>
  </main>
}
