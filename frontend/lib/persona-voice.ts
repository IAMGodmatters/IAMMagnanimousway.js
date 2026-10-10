'use client';

type VoiceProfile={
 voice?:SpeechSynthesisVoice;
 rate:number;
 pitch:number;
 lang:string;
};

const naturalName=/natural|enhanced|premium|neural|siri|google|microsoft|ava|aria|jenny|guy|samantha|daniel|karen|moira|tessa|serena|sonia|ryan|libby|maisie|oliver|thomas|zoe/i;
const noveltyName=/whisper|boing|bells|bubbles|bad news|good news|cellos|organ|zarvox|trinoids/i;

function hash(value:string){
 let h=2166136261;
 for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}

function appleMobile(){
 return typeof navigator!=='undefined'&&/iP(?:hone|ad|od)/i.test(String(navigator.userAgent||''));
}

function qualityScore(voice:SpeechSynthesisVoice){
 let score=0;
 const name=String(voice.name||'');
 if(/^en(?:-|$)/i.test(voice.lang))score+=30;
 if(naturalName.test(name))score+=45;
 if(voice.localService)score+=8;
 if(/compact/i.test(name))score-=10;
 if(noveltyName.test(name))score-=80;
 return score;
}

function preferredVoices(){
 if(typeof window==='undefined'||!('speechSynthesis'in window))return[] as SpeechSynthesisVoice[];
 const all=window.speechSynthesis.getVoices().slice();
 const english=all.filter(v=>/^en(?:-|$)/i.test(v.lang)&&!noveltyName.test(v.name));
 const base=english.length?english:all.filter(v=>!noveltyName.test(v.name));
 const usable=appleMobile()?base.filter(v=>v.localService!==false):base;
 const pool=usable.length?usable:base;
 return pool.sort((a,b)=>qualityScore(b)-qualityScore(a)||a.name.localeCompare(b.name));
}

function roleTuning(label:string){
 const value=label.toLowerCase();
 if(value==='magnanimous ai')return{rate:.94,pitch:.92};
 if(/bible|pastor|ministry|faith|scripture/.test(value))return{rate:.91,pitch:.96};
 if(/business|executive|finance|sales|operations|manager|ceo|legal/.test(value))return{rate:.94,pitch:.91};
 if(/research|analyst|science|data|study/.test(value))return{rate:.95,pitch:.98};
 if(/coding|developer|engineer|technical|security|architect/.test(value))return{rate:.98,pitch:.90};
 if(/customer|reception|assistant|support|concierge/.test(value))return{rate:.96,pitch:1.02};
 if(/social|marketing|creator|video|script|media/.test(value))return{rate:.99,pitch:1.04};
 if(/writing|editor|author|story/.test(value))return{rate:.96,pitch:1.03};
 if(/travel|coach|teacher|tutor|learning/.test(value))return{rate:.97,pitch:1.01};
 return{rate:.96,pitch:1};
}

const personaSignatures=[
 {rate:-.052,pitch:-.070},
 {rate:-.034,pitch:.052},
 {rate:.028,pitch:-.048},
 {rate:.050,pitch:.034},
 {rate:-.046,pitch:.072},
 {rate:.018,pitch:.066},
 {rate:.042,pitch:-.064},
 {rate:-.014,pitch:-.026},
] as const;

export function personaVoiceProfile(label='Magnanimous AI'):VoiceProfile{
 const name=String(label||'Magnanimous AI').trim()||'Magnanimous AI';
 const h=hash(name.toLowerCase());
 const voices=preferredVoices();
 const natural=voices.filter(v=>naturalName.test(v.name));
 const pool=natural.length>=2?natural:voices;
 const voice=pool.length?pool[h%pool.length]:undefined;
 const base=roleTuning(name);
 // Keep each named specialist audibly recognizable even on devices that expose only one usable voice.
 const signature=personaSignatures[(h>>>3)%personaSignatures.length];
 const rateSignature=signature.rate+((((h>>>15)%5)-2)*.004);
 const pitchSignature=signature.pitch+((((h>>>20)%5)-2)*.006);
 const rate=Math.max(.89,Math.min(1.04,base.rate+rateSignature));
 const pitch=Math.max(.88,Math.min(1.08,base.pitch+pitchSignature));
 return{voice,rate,pitch,lang:voice?.lang||'en-US'};
}

export function configurePersonaVoice(utterance:SpeechSynthesisUtterance,label='Magnanimous AI'){
 const profile=personaVoiceProfile(label);
 if(profile.voice)utterance.voice=profile.voice;
 utterance.lang=profile.lang;
 utterance.rate=profile.rate;
 utterance.pitch=profile.pitch;
 utterance.volume=1;
 return profile;
}
