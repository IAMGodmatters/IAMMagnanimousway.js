'use client';

let speechGeneration=0;

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
    .replace(/\.{3,}/g,'…')
    .replace(/\s*[–—]{2,}\s*/g,'. ')
    .replace(/&/g,' and ')
    .replace(/\s*\n+\s*/g,'. ')
    .replace(/([!?])\1+/g,'$1')
    .replace(/\s+([,.;:!?…])/g,'$1')
    .replace(/([,.;:!?…])([^\s])/g,'$1 $2')
    .replace(/\s+/g,' ')
    .trim();
}

export function splitSpeechText(input:string,maxChars=220){
  const text=cleanTextForSpeech(input);
  if(!text)return[];
  const sentences=text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)?.map(x=>x.trim()).filter(Boolean)||[text];
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
  maxChunkChars?:number;
  interChunkDelayMs?:number;
  onBoundary?:(event:any,chunk:string)=>void;
};

function humanPauseForChunk(chunk:string,base:number,appleMobile:boolean){
  const minimum=appleMobile?95:45;
  const scaled=Math.max(minimum,base);
  if(/[!?]\s*$/.test(chunk))return Math.max(scaled,appleMobile?170:145);
  if(/[.…]\s*$/.test(chunk))return Math.max(scaled,appleMobile?150:120);
  if(/[:;]\s*$/.test(chunk))return Math.max(scaled,appleMobile?125:90);
  if(/,\s*$/.test(chunk))return Math.max(scaled,appleMobile?110:72);
  return scaled;
}

function applyHumanProsody(utterance:SpeechSynthesisUtterance,chunk:string,index:number,total:number){
  let rate=Number(utterance.rate)||1,pitch=Number(utterance.pitch)||1;
  const words=chunk.trim().split(/\s+/).filter(Boolean).length;
  if(/\?\s*$/.test(chunk)){rate-=.012;pitch+=.018}
  else if(/!\s*$/.test(chunk)){rate+=.012;pitch+=.012}
  else if(/[:;]\s*$/.test(chunk)){rate-=.010}
  if(words>24)rate-=.010;
  if(words<7)rate-=.006;
  rate+=((index%3)-1)*.004;
  if(total>1&&index===total-1)rate-=.006;
  utterance.rate=Math.max(.87,Math.min(1.06,rate));
  utterance.pitch=Math.max(.86,Math.min(1.10,pitch));
}

export function stopNaturalSpeech(){
  speechGeneration++;
  if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();
}

export function speakTextNaturally(input:string,options:NaturalSpeechOptions={}){
  if(typeof window==='undefined'||!('speechSynthesis'in window))return false;
  const appleMobile=appleMobileSpeechRuntime();
  const maxChunkChars=appleMobile?Math.min(options.maxChunkChars||220,125):(options.maxChunkChars||220);
  const interChunkDelayMs=appleMobile?Math.max(options.interChunkDelayMs??55,95):(options.interChunkDelayMs??55);
  const chunks=splitSpeechText(input,maxChunkChars);
  if(!chunks.length)return false;

  const synth=window.speechSynthesis;
  const generation=++speechGeneration;
  let index=0,started=false,finished=false;

  synth.cancel();
  const next=()=>{
    if(generation!==speechGeneration||finished)return;
    if(index>=chunks.length){
      finished=true;
      options.onEnd?.();
      return;
    }
    const chunk=chunks[index++];
    const utterance=new SpeechSynthesisUtterance(chunk);
    options.configure?.(utterance);
    applyHumanProsody(utterance,chunk,index-1,chunks.length);
    utterance.onboundary=(event:any)=>{if(generation===speechGeneration)options.onBoundary?.(event,chunk)};
    if(appleMobile){
      utterance.rate=Math.max(.89,Math.min(1.01,Number(utterance.rate)||.94));
      utterance.pitch=Math.max(.92,Math.min(1.07,Number(utterance.pitch)||1));
    }
    utterance.onstart=()=>{
      if(generation!==speechGeneration)return;
      if(!started){started=true;options.onStart?.()}
    };
    utterance.onend=()=>{
      if(generation!==speechGeneration)return;
      window.setTimeout(next,humanPauseForChunk(chunk,interChunkDelayMs,appleMobile));
    };
    utterance.onerror=(event:any)=>{
      if(generation!==speechGeneration)return;
      finished=true;
      options.onError?.(event);
    };
    if((synth as any).paused)synth.resume?.();
    synth.speak(utterance);
  };
  if(appleMobile)window.setTimeout(next,70);else next();
  return true;
}
