'use client';

import {useEffect,useRef,useState} from 'react';
import {cleanTextForSpeech,speakTextNaturally,stopNaturalSpeech} from '../lib/natural-speech';

type RecognitionLike={
 lang:string;interimResults:boolean;continuous:boolean;maxAlternatives:number;
 onstart:null|(()=>void);onend:null|(()=>void);onerror:null|((event:any)=>void);onresult:null|((event:any)=>void);
 start:()=>void;stop?:()=>void;
};

let primed=false;
function primeSpeech(){
 if(primed||typeof window==='undefined'||!('speechSynthesis'in window))return;
 try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;u.rate=2;window.speechSynthesis.speak(u);window.speechSynthesis.resume?.();primed=true}catch{}
}
function setTextareaValue(el:HTMLTextAreaElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
 if(setter)setter.call(el,value);else el.value=value;
 el.dispatchEvent(new Event('input',{bubbles:true}));
 el.dispatchEvent(new Event('change',{bubbles:true}));
}
function activePersona(path:string){
 if(path.startsWith('/agent-video'))return(document.querySelector('.agentList button.active b')?.textContent||'Magnanimous Agent').trim();
 if(path.startsWith('/agents'))return(document.querySelector('.agentList button.active b')?.textContent||'Magnanimous Agent').trim();
 if(path.startsWith('/virtual-assistant'))return'Virtual Assistant';
 return'Magnanimous AI';
}
function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function applyVoice(utterance:SpeechSynthesisUtterance,label:string){
 const voices=window.speechSynthesis.getVoices();
 const english=voices.filter(v=>/^en(?:-|$)/i.test(v.lang));
 const natural=english.filter(v=>/natural|enhanced|premium|neural|siri|google|microsoft/i.test(v.name));
 const pool=natural.length?natural:english.length?english:voices;
 const h=hash(label.toLowerCase());
 if(pool.length)utterance.voice=pool[h%pool.length];
 utterance.rate=label==='Magnanimous AI'?.96:Math.min(1.08,.90+((h>>>4)%7)*.025);
 utterance.pitch=label==='Magnanimous AI'?.9:Math.min(1.18,.82+((h>>>9)%9)*.045);
 utterance.volume=1;
}

export default function VoiceSurfaceHardener(){
 const[path,setPath]=useState(''),[listening,setListening]=useState(false),[notice,setNotice]=useState('');
 const recognition=useRef<RecognitionLike|null>(null),voiceTurn=useRef(false),lastVAResult=useRef('');

 useEffect(()=>{
  const p=location.pathname;setPath(p);
  const target=p.startsWith('/agents')||p.startsWith('/agent-video')||p.startsWith('/virtual-assistant');
  if(!target||!('speechSynthesis'in window))return;
  const synth:any=window.speechSynthesis,original=synth.speak?.bind(synth);
  if(!original)return;
  const wrapped=(u:SpeechSynthesisUtterance)=>{
   let target=u;
   try{
    const cleaned=cleanTextForSpeech(u.text);
    if(cleaned&&cleaned!==u.text){
     target=new SpeechSynthesisUtterance(cleaned);
     target.rate=u.rate;target.pitch=u.pitch;target.volume=u.volume;target.voice=u.voice;target.lang=u.lang;
     target.onstart=u.onstart;target.onend=u.onend;target.onpause=u.onpause;target.onresume=u.onresume;target.onboundary=u.onboundary;target.onmark=u.onmark;
    }
    applyVoice(target,activePersona(location.pathname));synth.resume?.();
   }catch{}
   const priorError=target.onerror||u.onerror;
   target.onerror=(event:any)=>{setNotice('I generated the reply, but your browser could not play the voice smoothly. Check device volume, tap the speaker once, and try again.');priorError?.call(target,event)};
   original(target);
  };
  try{synth.speak=wrapped}catch{}

  const primeOnGesture=(event:Event)=>{
   const el=event.target as Element|null;if(!el)return;
   if(el.closest('button'))primeSpeech();
  };
  document.addEventListener('pointerdown',primeOnGesture,true);
  document.addEventListener('click',primeOnGesture,true);

  const observer=new MutationObserver(()=>{
   if(!location.pathname.startsWith('/virtual-assistant')||!voiceTurn.current)return;
   const text=(document.querySelector('.work .result')?.textContent||'').trim();
   if(!text||text===lastVAResult.current)return;
   lastVAResult.current=text;voiceTurn.current=false;
   try{speakTextNaturally(text,{configure:(u)=>applyVoice(u,'Virtual Assistant'),maxChunkChars:240,interChunkDelayMs:55,onError:()=>setNotice('The reply is ready, but spoken playback could not start smoothly on this device.')})}catch{setNotice('The reply is ready, but spoken playback could not start on this device.')}
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});

  return()=>{document.removeEventListener('pointerdown',primeOnGesture,true);document.removeEventListener('click',primeOnGesture,true);observer.disconnect();recognition.current?.stop?.();try{if(synth.speak===wrapped)synth.speak=original}catch{}};
 },[]);

 function submitTranscript(text:string){
  const p=location.pathname;
  let area:HTMLTextAreaElement|null=null,button:HTMLButtonElement|null=null;
  if(p.startsWith('/agent-video')){area=document.querySelector('.stage form textarea');button=document.querySelector('.stage form button.send')}
  else if(p.startsWith('/agents')){area=document.querySelector('.chat form textarea');button=document.querySelector('.chat form button[type="submit"]')}
  else if(p.startsWith('/virtual-assistant')){area=document.querySelector('.work textarea');button=document.querySelector('.work .actions button.assign');voiceTurn.current=true}
  if(!area){setNotice('Voice was heard, but the active request box is not available yet.');return}
  const next=[area.value.trim(),text.trim()].filter(Boolean).join(' ');setTextareaValue(area,next);area.focus();
  const send=(attempt=0)=>{if(button&&!button.disabled){button.click();return}if(attempt<6)window.setTimeout(()=>{if(p.startsWith('/agent-video'))button=document.querySelector('.stage form button.send');else if(p.startsWith('/agents'))button=document.querySelector('.chat form button[type="submit"]');else button=document.querySelector('.work .actions button.assign');send(attempt+1)},140);else setNotice('I heard you, but the request could not be sent yet. Try once more.')};
  window.setTimeout(()=>send(),80);
 }

 function listen(){
  const w:any=window,SR=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!SR){setNotice('Microphone speech recognition is not supported in this browser. You can still type and use spoken replies.');return}
  stopNaturalSpeech();setNotice('');primeSpeech();
  const r:RecognitionLike=new SR();recognition.current=r;r.lang=navigator.language||'en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  let receivedFinal=false;
  r.onstart=()=>setListening(true);r.onend=()=>setListening(false);
  r.onerror=(e:any)=>{setListening(false);const code=String(e?.error||'');if(receivedFinal||code==='aborted'){setNotice('');return}setNotice(code==='not-allowed'?'Microphone permission is blocked. Allow microphone access for this site and try again.':'I could not hear that clearly. Tap the microphone and try again.')};
  r.onresult=(e:any)=>{let final='';for(let i=e.resultIndex||0;i<e.results.length;i++)if(e.results[i].isFinal)final+=e.results[i][0]?.transcript||'';if(final.trim()){receivedFinal=true;setNotice('');submitTranscript(final.trim())}};
  try{r.start()}catch{setNotice('The microphone is already starting. Try again in a moment.')}
 }

 if(!(path.startsWith('/agents')||path.startsWith('/agent-video')||path.startsWith('/virtual-assistant')))return null;
 return <div className="voice-hardener" aria-label="Voice conversation backup controls">
  <button type="button" onClick={listen} className={listening?'live':''} aria-label={`Talk to ${activePersona(path)}`}>{listening?'●':'🎙'}</button>
  {notice&&<div role="status">{notice}</div>}
  <style jsx>{`.voice-hardener{position:fixed;right:18px;bottom:76px;z-index:2147483190}.voice-hardener>button{width:42px;height:42px;border:1px solid rgba(106,224,255,.42);border-radius:12px;background:#081724;color:#eafdff;font-size:17px;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.35)}.voice-hardener>button.live{color:#ff837b;border-color:#ff837b}.voice-hardener>div{position:absolute;right:0;bottom:50px;width:min(330px,82vw);padding:9px 11px;border:1px solid #445a68;border-radius:10px;background:#08131d;color:#cfe3eb;font-size:9px;line-height:1.45}@media(max-width:680px){.voice-hardener{right:12px;bottom:70px}}`}</style>
 </div>;
}
