'use client';

let speechGeneration=0;
const SPEECH_SAFE_MODE_KEY='iam_magnanimous_speech_safe_until';
const SPEECH_SAFE_MODE_MS=24*60*60*1000;

function speechSafeModeActive(){
  if(typeof window==='undefined')return false;
  try{return Number(window.localStorage.getItem(SPEECH_SAFE_MODE_KEY)||0)>Date.now()}catch{return false}
}
function enableSpeechSafeMode(){
  if(typeof window==='undefined')return;
  try{window.localStorage.setItem(SPEECH_SAFE_MODE_KEY,String(Date.now()+SPEECH_SAFE_MODE_MS))}catch{}
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
  onError?:(event:any)=>void;
  onRepair?:(detail:{attempt:number;reason:string;safeMode:boolean})=>void;
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
  let safeMode=speechSafeModeActive();
  const requestedChunk=options.maxChunkChars||260;
  const maxChunkChars=safeMode?Math.min(requestedChunk,96):appleMobile?Math.min(requestedChunk,140):requestedChunk;
  let interChunkDelayMs=safeMode?Math.max(options.interChunkDelayMs??45,130):appleMobile?Math.max(options.interChunkDelayMs??45,90):(options.interChunkDelayMs??45);
  let chunks=splitSpeechText(input,maxChunkChars);
  if(!chunks.length)return false;

  const synth=window.speechSynthesis;
  const generation=++speechGeneration;
  let index=0,started=false,finished=false,repairAttempts=0;

  synth.cancel();
  const next=()=>{
    if(generation!==speechGeneration||finished)return;
    if(index>=chunks.length){
      finished=true;
      options.onEnd?.();
      return;
    }
    const chunkIndex=index,chunkText=chunks[index++];
    const utterance=new SpeechSynthesisUtterance(chunkText);
    if(!safeMode)options.configure?.(utterance);
    if(safeMode){
      utterance.voice=null;
      utterance.rate=.92;
      utterance.pitch=1;
      utterance.volume=1;
    }else if(appleMobile){
      utterance.rate=Math.max(.88,Math.min(1,Number(utterance.rate)||.94));
      utterance.pitch=Math.max(.95,Math.min(1.05,Number(utterance.pitch)||1));
    }
    utterance.onstart=()=>{
      if(generation!==speechGeneration)return;
      if(!started){started=true;options.onStart?.()}
    };
    utterance.onend=()=>{
      if(generation!==speechGeneration)return;
      window.setTimeout(next,interChunkDelayMs);
    };
    utterance.onerror=(event:any)=>{
      if(generation!==speechGeneration)return;
      const reason=String(event?.error||event?.name||'speech-playback-error');
      if(repairAttempts<2){
        repairAttempts++;
        safeMode=true;
        enableSpeechSafeMode();
        interChunkDelayMs=Math.max(interChunkDelayMs,130+repairAttempts*40);
        const smaller=splitSpeechText(chunkText,repairAttempts===1?84:56);
        if(smaller.length>1)chunks.splice(index,0,...smaller);
        else index=chunkIndex;
        options.onRepair?.({attempt:repairAttempts,reason,safeMode:true});
        synth.cancel();
        window.setTimeout(next,160+repairAttempts*80);
        return;
      }
      finished=true;
      options.onError?.(event);
    };
    try{
      synth.resume?.();
      synth.speak(utterance);
    }catch(error){
      utterance.onerror?.(error as any);
    }
  };
  next();
  return true;
}
