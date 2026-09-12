'use client';

import {useEffect,useRef,useState} from 'react';

type SpeechRecognitionLike={
 lang:string;
 interimResults:boolean;
 continuous:boolean;
 maxAlternatives:number;
 onstart:null|(()=>void);
 onend:null|(()=>void);
 onerror:null|((event:any)=>void);
 onresult:null|((event:any)=>void);
 start:()=>void;
 stop?:()=>void;
};

const HELPER_PROMPTS:Array<[string,string]>=[
 ['Help me write or improve:','Writing Helper'],
 ['Research this topic and organize the findings:','Research Helper'],
 ['Help me study this Bible topic carefully:','Bible Study'],
 ['Build a practical marketing strategy for:','Marketing Helper'],
 ['Help me plan or improve this business:','Business Helper'],
 ['Help me troubleshoot or build:','Coding Helper'],
 ['Create a social media campaign for:','Social Media Helper'],
 ['Write a strong video script about:','Video Script Helper'],
 ['Research and plan:','Travel Helper'],
 ['Help me respond to this customer situation:','Customer Service Helper'],
 ['Help me with:','AI Chat'],
 ['Help me plan this request:','Magnanimous AI']
];

const MODE_PERSONAS:Record<string,string>={
 General:'Magnanimous AI',
 Business:'Business Helper',
 'Social Media':'Social Media Helper',
 'Virtual Assistant':'Virtual Assistant',
 Research:'Research Helper',
 Writing:'Writing Helper'
};

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function latestMagnanimousPersona(){
 const labels=Array.from(document.querySelectorAll('.mag-message.assistant .mag-bubble>small'));
 const label=(labels[labels.length-1]?.textContent||'').trim();
 const name=label.split('•')[0]?.trim();
 return name||'Magnanimous AI';
}
function currentPersona(){
 if(typeof window==='undefined')return'Magnanimous AI';
 const path=location.pathname;
 if(path==='/magnanimous'||path.startsWith('/magnanimous/'))return latestMagnanimousPersona();
 if(path==='/agents'||path.startsWith('/agents/')){
  const heading=document.querySelector('.chatHead h2');
  const first=heading?.childNodes?.[0]?.textContent?.trim();
  if(first)return first;
  const avatar=document.querySelector('.avatar span')?.textContent||'';
  const name=avatar.split('•')[0]?.trim();
  return name||'Magnanimous Agent';
 }
 if(path==='/ai-chat'||path.startsWith('/ai-chat/')){
  const q=new URLSearchParams(location.search),prompt=q.get('prompt')||'';
  for(const[prefix,name]of HELPER_PROMPTS)if(prompt.startsWith(prefix))return name;
  const mode=q.get('mode')||'General';
  return MODE_PERSONAS[mode]||'Magnanimous AI';
 }
 return'Magnanimous AI';
}

function chooseVoice(label:string){
 const synth=window.speechSynthesis,all=synth.getVoices();
 const english=all.filter(v=>/^en(?:-|$)/i.test(v.lang));
 const natural=english.filter(v=>/natural|enhanced|premium|neural|siri|google|microsoft/i.test(v.name));
 const pool=natural.length?natural:english.length?english:all;
 const h=hash(label.toLowerCase());
 const voice=pool.length?pool[h%pool.length]:undefined;
 if(label==='Magnanimous AI')return{voice,rate:.96,pitch:.9};
 const rate=.90+((h>>>4)%7)*.025;
 const pitch=.82+((h>>>9)%9)*.045;
 return{voice,rate:Math.min(1.08,rate),pitch:Math.min(1.18,pitch)};
}

function applyVoiceProfile(utterance:SpeechSynthesisUtterance,label:string){
 const profile=chooseVoice(label);
 if(profile.voice)utterance.voice=profile.voice;
 utterance.rate=profile.rate;
 utterance.pitch=profile.pitch;
 utterance.volume=1;
}

function latestReply(path:string){
 let nodes:NodeListOf<Element>;
 if(path==='/magnanimous'||path.startsWith('/magnanimous/'))nodes=document.querySelectorAll('.mag-message.assistant .mag-bubble p');
 else if(path==='/ai-chat'||path.startsWith('/ai-chat/'))nodes=document.querySelectorAll('.history article .answer p');
 else return'';
 return nodes.length?(nodes[nodes.length-1].textContent||'').trim():'';
}

function setNativeTextareaValue(el:HTMLTextAreaElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
 if(setter)setter.call(el,value);else el.value=value;
 el.dispatchEvent(new Event('input',{bubbles:true}));
 el.dispatchEvent(new Event('change',{bubbles:true}));
}

function escapeRe(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function routeNamedAgent(transcript:string){
 const buttons=Array.from(document.querySelectorAll('.agentList button')) as HTMLButtonElement[];
 const normalized=transcript.trim();
 for(const button of buttons){
  const name=(button.querySelector('div b')?.textContent||'').trim();
  if(!name)continue;
  const wake=new RegExp(`^(?:(?:hey|hi|hello|okay|ok)\\s+)?${escapeRe(name)}(?:\\s*[,.:;-]?\\s+|$)`,'i');
  if(!wake.test(normalized))continue;
  const cleaned=normalized.replace(wake,'').trim();
  return{button,name,cleaned:cleaned||normalized};
 }
 return null;
}

function writeAndSend(transcript:string){
 const path=location.pathname;
 const standalone=path==='/magnanimous'||path.startsWith('/magnanimous/');
 const workspace=path==='/ai-chat'||path.startsWith('/ai-chat/');
 const agents=path==='/agents'||path.startsWith('/agents/');
 if(!standalone&&!workspace&&!agents)return false;

 const perform=(text:string)=>{
  const selector=standalone?'.mag-compose textarea':workspace?'.console textarea':'.chat form textarea';
  const area=document.querySelector(selector) as HTMLTextAreaElement|null;
  if(!area)return false;
  const next=[area.value.trim(),text.trim()].filter(Boolean).join(' ');
  setNativeTextareaValue(area,next);area.focus();
  window.setTimeout(()=>{
   if(standalone){
    const buttons=Array.from(document.querySelectorAll('.mag-compose button')) as HTMLButtonElement[];
    const send=buttons.find(b=>b.type==='submit');if(send&&!send.disabled)send.click();return;
   }
   if(workspace){
    const buttons=Array.from(document.querySelectorAll('.console .actions button')) as HTMLButtonElement[];
    const send=buttons.find(b=>/SEND/i.test(b.textContent||''));if(send&&!send.disabled)send.click();return;
   }
   const form=area.closest('form');const send=form?.querySelector('button[type="submit"]') as HTMLButtonElement|null;
   if(send&&!send.disabled)send.click();
  },320);
  return true;
 };

 if(agents){
  const routed=routeNamedAgent(transcript);
  if(routed){
   routed.button.click();
   window.setTimeout(()=>perform(routed.cleaned),360);
   return true;
  }
 }
 return perform(transcript);
}

export default function VoiceOrchestrator(){
 const[path,setPath]=useState(''),[persona,setPersona]=useState('Magnanimous AI'),[listening,setListening]=useState(false),[speaking,setSpeaking]=useState(false),[autoSpeak,setAutoSpeak]=useState(true),[micReady,setMicReady]=useState(false),[voiceReady,setVoiceReady]=useState(false),[notice,setNotice]=useState('');
 const recognitionRef=useRef<SpeechRecognitionLike|null>(null),lastSpoken=useRef(''),autoSpeakRef=useRef(true);
 useEffect(()=>{autoSpeakRef.current=autoSpeak},[autoSpeak]);
 useEffect(()=>{
  const w:any=window,p=location.pathname;
  setPath(p);setPersona(currentPersona());setVoiceReady('speechSynthesis'in w);setMicReady(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));
  lastSpoken.current=latestReply(p);
  const synth=window.speechSynthesis;
  const refreshVoices=()=>setVoiceReady('speechSynthesis'in window);
  synth?.addEventListener?.('voiceschanged',refreshVoices);
  const observer=new MutationObserver(()=>{
   const nextPersona=currentPersona();setPersona(v=>v===nextPersona?v:nextPersona);
   const text=latestReply(location.pathname);
   if(text&&text!==lastSpoken.current){
    lastSpoken.current=text;
    if(autoSpeakRef.current&&'speechSynthesis'in window){
     window.speechSynthesis.cancel();
     const u=new SpeechSynthesisUtterance(text.slice(0,7000));applyVoiceProfile(u,nextPersona);
     u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);
     window.speechSynthesis.speak(u);
    }
   }
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});

  let restore:(()=>void)|undefined;
  if((p==='/agents'||p.startsWith('/agents/'))&&'speechSynthesis'in window){
   const anySynth:any=window.speechSynthesis,original=anySynth.speak?.bind(anySynth);
   if(original){
    const wrapped=(utterance:SpeechSynthesisUtterance)=>{applyVoiceProfile(utterance,currentPersona());original(utterance)};
    try{anySynth.speak=wrapped;restore=()=>{try{if(anySynth.speak===wrapped)anySynth.speak=original}catch{}}}catch{}
   }
  }
  return()=>{observer.disconnect();synth?.removeEventListener?.('voiceschanged',refreshVoices);recognitionRef.current?.stop?.();restore?.()};
 },[]);

 function speakSample(){
  if(!voiceReady)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(`This is ${persona}. I recognize my name and my specialist role.`);applyVoiceProfile(u,persona);
  u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);window.speechSynthesis.speak(u);
 }
 function listen(){
  const w:any=window,SR=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!SR){setNotice('Microphone speech recognition is not supported in this browser. You can still type and use spoken replies.');return}
  window.speechSynthesis?.cancel();setSpeaking(false);setNotice('');
  const r:SpeechRecognitionLike=new SR();recognitionRef.current=r;r.lang=navigator.language||'en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onerror=(e:any)=>{setListening(false);setNotice(e?.error==='not-allowed'?'Microphone permission is blocked. Allow microphone access for this site and try again.':'I could not hear that clearly. Tap the microphone and try again.')};
  r.onresult=(e:any)=>{
   let final='';for(let i=e.resultIndex||0;i<e.results.length;i++)if(e.results[i].isFinal)final+=e.results[i][0]?.transcript||'';
   if(final.trim()){if(!writeAndSend(final.trim()))setNotice('Voice was heard, but the active chat box was not available yet.');}
  };
  try{r.start()}catch{setNotice('The microphone is already starting. Try again in a moment.')}
 }

 const voicePage=path==='/magnanimous'||path.startsWith('/magnanimous/')||path==='/ai-chat'||path.startsWith('/ai-chat/')||path==='/agents'||path.startsWith('/agents/');
 if(!voicePage)return null;
 return <div className={`iam-voice-panel ${listening?'listening':''} ${speaking?'speaking':''}`} aria-label={`${persona} voice controls`}>
  <div className="voice-copy"><b>{persona}</b><span>{listening?'Listening for name + request…':speaking?'Speaking…':'Voice conversation'}</span></div>
  <button type="button" className="voice-mic" onClick={listen} disabled={!micReady} aria-label={`Talk to ${persona}`} title={micReady?`Talk to ${persona}`:'Speech recognition unavailable'}>{listening?'●':'🎙'}</button>
  <button type="button" className="voice-sound" onClick={()=>{setAutoSpeak(v=>!v);if(autoSpeak)window.speechSynthesis?.cancel()}} disabled={!voiceReady} aria-pressed={autoSpeak} title={autoSpeak?'Turn spoken replies off':'Turn spoken replies on'}>{autoSpeak?'🔊':'🔇'}</button>
  <button type="button" className="voice-sample" onClick={speakSample} disabled={!voiceReady} title="Hear this AI voice">VOICE</button>
  {notice&&<div className="voice-notice" role="status">{notice}</div>}
  <style jsx>{`
   .iam-voice-panel{position:fixed;right:18px;bottom:18px;z-index:2147483200;display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid rgba(106,224,255,.42);border-radius:16px;background:rgba(4,12,22,.96);box-shadow:0 16px 46px rgba(0,0,0,.48),0 0 28px rgba(68,203,245,.09);backdrop-filter:blur(14px);font-family:Inter,system-ui,sans-serif;color:#eafdff}.voice-copy{display:grid;min-width:112px;max-width:190px}.voice-copy b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.voice-copy span{font-size:8px;color:#75a9ba;margin-top:2px}.iam-voice-panel button{height:38px;border:1px solid rgba(108,220,250,.28);border-radius:11px;background:#0a1b29;color:#eafdff;cursor:pointer;font-weight:900}.voice-mic,.voice-sound{width:42px;font-size:16px}.voice-sample{padding:0 10px;font-size:8px;letter-spacing:.12em}.iam-voice-panel.listening .voice-mic{color:#ff837b;border-color:#ff837b;box-shadow:0 0 22px rgba(255,92,83,.22)}.iam-voice-panel.speaking{border-color:rgba(120,239,180,.52)}.iam-voice-panel button:disabled{opacity:.38;cursor:not-allowed}.voice-notice{position:absolute;right:0;bottom:52px;width:min(330px,82vw);padding:9px 11px;border:1px solid #445a68;border-radius:10px;background:#08131d;color:#cfe3eb;font-size:9px;line-height:1.45}@media(max-width:680px){.iam-voice-panel{left:12px;right:12px;bottom:12px;justify-content:flex-end}.voice-copy{margin-right:auto;min-width:0;max-width:48vw}.voice-sample{display:none}}
  `}</style>
 </div>;
}
