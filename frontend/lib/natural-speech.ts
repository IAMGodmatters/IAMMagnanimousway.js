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
  const maxChunkChars=appleMobile?Math.min(options.maxChunkChars||260,140):(options.maxChunkChars||260);
  const interChunkDelayMs=appleMobile?Math.max(options.interChunkDelayMs??45,90):(options.interChunkDelayMs??45);
  const chunks=splitSpeechText(input,maxChunkChars);
  if(!chunks.length)return false;

  const synth=window.speechSynthesis;
  const generation=++speechGeneration;
  let index=0,started=false,finished=false,retryCount=0,safeMode=false;

  synth.cancel();
  const next=()=>{
    if(generation!==speechGeneration||finished)return;
    if(index>=chunks.length){
      finished=true;
      options.onEnd?.();
      return;
    }
    const utterance=new SpeechSynthesisUtterance(chunks[index++]);
    options.configure?.(utterance);
    if(appleMobile){
      utterance.rate=Math.max(.88,Math.min(1,Number(utterance.rate)||.94));
      utterance.pitch=Math.max(.95,Math.min(1.05,Number(utterance.pitch)||1));
    }
    if(safeMode){
      utterance.voice=null;
      utterance.rate=appleMobile?.90:.94;
      utterance.pitch=1;
      utterance.volume=1;
    }
    utterance.onstart=()=>{
      if(generation!==speechGeneration)return;
      if(!started){started=true;options.onStart?.()}
    };
    utterance.onend=()=>{
      if(generation!==speechGeneration)return;
      retryCount=0;
      safeMode=false;
      window.setTimeout(next,interChunkDelayMs);
    };
    utterance.onerror=(event:any)=>{
      if(generation!==speechGeneration)return;
      if(retryCount<1){
        retryCount++;
        safeMode=true;
        index=Math.max(0,index-1);
        synth.cancel();
        window.setTimeout(next,appleMobile?160:90);
        return;
      }
      finished=true;
      options.onError?.(event);
    };
    synth.resume?.();
    synth.speak(utterance);
  };
  next();
  return true;
}
