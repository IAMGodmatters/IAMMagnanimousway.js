'use client';

let speechGeneration=0;
let speechFailureCount=0;
let speechSafeModeUntil=0;

const SAFE_MODE_MS=15*60*1000;
const RETRYABLE_SPEECH_ERRORS=new Set(['audio-busy','network','synthesis-unavailable','synthesis-failed','language-unavailable','voice-unavailable','text-too-long','interrupted','synthesis-timeout']);

function speechErrorCode(event:any){
 return String(event?.error||event?.name||'synthesis-failed').toLowerCase();
}
function retryableSpeechError(event:any){
 return RETRYABLE_SPEECH_ERRORS.has(speechErrorCode(event));
}
function activateSpeechSafeMode(){
 speechFailureCount++;
 speechSafeModeUntil=Math.max(speechSafeModeUntil,Date.now()+SAFE_MODE_MS);
}
export function speechSelfHealStatus(){
 return{failureCount:speechFailureCount,safeMode:Date.now()<speechSafeModeUntil,safeModeUntil:speechSafeModeUntil};
}

function appleMobileSpeechRuntime(){
  if(typeof navigator==='undefined')return false;
  return /iP(?:hone|ad|od)/i.test(String(navigator.userAgent||''));
}

export function cleanTextForSpeech(input:string){
  return String(input||'')
    .replace(/\`\`\`[\s\S]*?\`\`\`/g,' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1')
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]+\)/g,'$1')
    .replace(/https?:\/\/\S+/gi,' ')
    .replace(/\`([^\`]+)\`/g,'$1')
    .replace(/^\s{0,3}#{1,6}\s*/gm,'')
    .replace(/^\s*>\s?/gm,'')
    .replace(/^\s*[-+*•◦▪►▶]\s+/gm,'')
    .replace(/\[(?:\d+|source|citation)\]/gi,'')
    .replace(/[\*_~#\`]/g,'')
    .replace(/[•◦▪◆◇■□►▶]/g,', ')
    .replace(/\|/g,', ')
    .replace(/\s*[–—]{2,}\s*/g,'. ')
    .replace(/&/g,' and ')
    .replace(/\s*\n+\s*/g,'. ')
    .replace(/([.!?])\1+/g,'$1')
    .replace(/\s+([,.;:!?])/g,'$1')
    .replace(/([,.;:!?])([^\s])/g,'$1 $2')
    .replace(/\s+/g,' ')
    .trim();
}

export function splitSpeechText(input:string,maxChars=260){
  const text=cleanTextForSpeech(input);
  if(!text)return[];
  const sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[text];
  const chunks:string[]=[];
  let current='';
  const push=()=>{if(current.trim())chunks.push(current.trim());current='';};

  for(const sentence of sentences){
    if(sentence.length<=maxChars){
      const next=[current,sentence].filter(Boolean).join(' ');
      if(next.length<=maxChars)current=next;
      else{push();current=sentence}
      continue;
    }
    push();
    const clauses=sentence.split(/(?<=[,;:])\s+/).map(x=>x.trim()).filter(Boolean);
    let clauseBuffer='';
    for(const clause of clauses){
      const next=[clauseBuffer,clause].filter(Boolean).join(' ');
      if(next.length<=maxChars){clauseBuffer=next;continue}
      if(clauseBuffer){chunks.push(clauseBuffer);clauseBuffer=''}
      if(clause.length<=maxChars){clauseBuffer=clause;continue}
      const words=clause.split(/\s+/);
      let wordBuffer='';
      for(const word of words){
        const wordNext=[wordBuffer,word].filter(Boolean).join(' ');
        if(wordNext.length<=maxChars)wordBuffer=wordNext;
        else{if(wordBuffer)chunks.push(wordBuffer);wordBuffer=word}
      }
      if(wordBuffer)chunks.push(wordBuffer);
    }
    if(clauseBuffer)chunks.push(clauseBuffer);
  }
  push();
  return chunks;
}

type NaturalSpeechOptions={
  configure?:(utterance:SpeechSynthesisUtterance)=>void;
  onStart?:()=>void;
  onEnd?:()=>void;
  onRetry?:(event:any)=>void;
  onError?:(event:any)=>void;
  maxChunkChars?:number;
  interChunkDelayMs?:number;
};

export function stopNaturalSpeech(){
  speechGeneration++;
  if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();
}

export function speakTextNaturally(input:string,options:NaturalSpeechOptions={}){
  if(typeof window==='undefined'||!('speechSynthesis'in window))return false;
  const appleMobile=appleMobileSpeechRuntime();
  let safeMode=appleMobile||Date.now()<speechSafeModeUntil;
  const maxChunkChars=safeMode?Math.min(options.maxChunkChars||260,140):(options.maxChunkChars||260);
  const queue=[...splitSpeechText(input,maxChunkChars)];
  if(!queue.length)return false;

  const synth=window.speechSynthesis;
  const generation=++speechGeneration;
  let started=false,finished=false,retryBudget=1;

  synth.cancel();
  const next=()=>{
    if(generation!==speechGeneration||finished)return;
    if(!queue.length){
      finished=true;
      speechFailureCount=0;
      options.onEnd?.();
      return;
    }
    const text=String(queue.shift()||'').trim();
    if(!text){window.setTimeout(next,safeMode?110:(options.interChunkDelayMs??45));return}
    const utterance=new SpeechSynthesisUtterance(text);
    options.configure?.(utterance);
    if(safeMode){
      try{utterance.voice=null}catch{}
      utterance.rate=Math.max(.90,Math.min(.98,Number(utterance.rate)||.94));
      utterance.pitch=Math.max(.98,Math.min(1.02,Number(utterance.pitch)||1));
    }
    utterance.onstart=()=>{
      if(generation!==speechGeneration)return;
      if(!started){started=true;options.onStart?.()}
    };
    utterance.onend=()=>{
      if(generation!==speechGeneration)return;
      window.setTimeout(next,safeMode?Math.max(options.interChunkDelayMs??55,110):(options.interChunkDelayMs??45));
    };
    utterance.onerror=(event:any)=>{
      if(generation!==speechGeneration)return;
      if(retryBudget>0&&retryableSpeechError(event)){
        retryBudget--;
        activateSpeechSafeMode();
        safeMode=true;
        const safeChunks=splitSpeechText(text,95);
        queue.unshift(...(safeChunks.length?safeChunks:[text]));
        try{synth.cancel()}catch{}
        options.onRetry?.(event);
        window.setTimeout(next,130);
        return;
      }
      finished=true;
      activateSpeechSafeMode();
      options.onError?.(event);
    };
    try{
      synth.resume?.();
      synth.speak(utterance);
    }catch(error){
      utterance.onerror?.({error:'synthesis-failed',cause:error} as any);
    }
  };
  next();
  return true;
}
