'use client';
import React from 'react';

export type CinematicModuleMarkName=
 |'business-command'|'social-studio'|'magnanimous-ai'|'virtual-assistant'
 |'professional-business-launch'|'knowledge-center'|'connected-assistant'|'routine-studio'
 |'ai-receptionist'|'movie-maker'|'creator-growth'|'opportunity-vault'|'video-studio'
 |'contact-center'|'white-label-studio';

type Props={name:string;index?:number};

function Glyph({name}: {name:CinematicModuleMarkName}){
 switch(name){
  case 'business-command': return <><path d="M23 67 34 32 54 50 72 25 88 51 102 34 98 67Z"/><path d="M25 76h74v13H25z"/><circle cx="72" cy="25" r="5"/></>;
  case 'social-studio': return <><rect x="23" y="25" width="30" height="30" rx="8"/><rect x="66" y="25" width="30" height="30" rx="8"/><rect x="23" y="68" width="30" height="30" rx="8"/><rect x="66" y="68" width="30" height="30" rx="8"/><path d="M38 40h1m42 0h1M38 83h1m42 0h1" strokeWidth="10" strokeLinecap="round"/></>;
  case 'magnanimous-ai': return <><rect x="27" y="27" width="66" height="66" rx="16"/><path d="M44 75 52 47l8 19 8-19 9 28M49 80h23"/><path d="M20 43h7m-7 18h7m-7 18h7m66-36h7m-7 18h7m-7 18h7M43 20v7m18-7v7m18-7v7M43 93v7m18-7v7m18-7v7"/></>;
  case 'virtual-assistant': return <><rect x="28" y="35" width="64" height="53" rx="18"/><circle cx="48" cy="58" r="6"/><circle cx="72" cy="58" r="6"/><path d="M47 74q13 10 26 0M60 23v12M53 23h14"/><path d="M21 53h7m64 0h7"/></>;
  case 'professional-business-launch': return <><rect x="22" y="42" width="76" height="50" rx="10"/><path d="M42 42v-9h36v9M22 62h76M52 60h16v9H52z"/></>;
  case 'knowledge-center': return <><path d="M19 31q20-9 38 5v57q-18-14-38-5zM101 31q-20-9-38 5v57q18-14 38-5z"/><path d="M60 38v55"/></>;
  case 'connected-assistant': return <><path d="M50 43 41 34q-11-11-22 0t0 22l15 15q11 11 22 0l9-9M70 77l9 9q11 11 22 0t0-22L86 49q-11-11-22 0l-9 9"/><path d="m43 77 34-34"/></>;
  case 'routine-studio': return <><rect x="24" y="30" width="72" height="67" rx="12"/><path d="M39 22v17m42-17v17M24 48h72"/><path d="m43 73 11 11 24-25"/></>;
  case 'ai-receptionist': return <><path d="M28 65V54a32 32 0 0 1 64 0v11"/><rect x="20" y="58" width="18" height="28" rx="8"/><rect x="82" y="58" width="18" height="28" rx="8"/><path d="M91 86q0 13-19 13H60"/><circle cx="57" cy="99" r="4"/></>;
  case 'movie-maker': return <><rect x="22" y="43" width="76" height="51" rx="9"/><path d="M22 43 33 24h16L38 43m19 0 11-19h16L73 43"/><circle cx="47" cy="68" r="11"/><circle cx="73" cy="68" r="11"/><path d="m58 86 20-11v22z"/></>;
  case 'creator-growth': return <><path d="M24 91V66h15v25M50 91V51h15v40M76 91V36h15v55"/><path d="m24 51 23-18 16 9 30-24M81 18h12v12"/></>;
  case 'opportunity-vault': return <><path d="M22 50h76v45H22z"/><path d="M29 50q4-25 31-25t31 25M22 66h76"/><rect x="53" y="63" width="14" height="20" rx="5"/><path d="m60 31 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/></>;
  case 'video-studio': return <><rect x="23" y="34" width="61" height="52" rx="12"/><path d="m47 48 23 12-23 13z"/><path d="m84 49 17-10v42L84 70"/></>;
  case 'contact-center': return <><path d="M26 65V53a34 34 0 0 1 68 0v12"/><rect x="18" y="58" width="18" height="27" rx="7"/><rect x="84" y="58" width="18" height="27" rx="7"/><circle cx="47" cy="91" r="5"/><circle cx="61" cy="91" r="5"/><circle cx="75" cy="91" r="5"/><path d="M94 85q0 13-17 13"/></>;
  case 'white-label-studio': return <><path d="M23 29h52l23 23-46 46-29-29z"/><circle cx="45" cy="49" r="8"/><path d="m67 69 21-21M59 77l21-21"/></>;
 }
}

export default function CinematicModuleMark({name,index=0}:Props){
 const safe=(name in ({'business-command':1,'social-studio':1,'magnanimous-ai':1,'virtual-assistant':1,'professional-business-launch':1,'knowledge-center':1,'connected-assistant':1,'routine-studio':1,'ai-receptionist':1,'movie-maker':1,'creator-growth':1,'opportunity-vault':1,'video-studio':1,'contact-center':1,'white-label-studio':1} as const)?name:'magnanimous-ai') as CinematicModuleMarkName;
 const hue=['cyan','violet','gold','cyan','gold'][index%5];
 return <span className={`icon moduleMark moduleMark--${hue}`} style={{animationDelay:`-${(index%6)*.42}s`}} aria-hidden="true">
  <svg viewBox="0 0 120 120" role="img" focusable="false">
   <defs>
    <linearGradient id={`g-${safe}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f7ffff"/><stop offset=".22" stopColor="#7ff4ff"/><stop offset=".58" stopColor={hue==='gold'?'#ffd26f':hue==='violet'?'#b07cff':'#30cfff'}/><stop offset="1" stopColor={hue==='gold'?'#ff8a26':hue==='violet'?'#733dff':'#126dff'}/></linearGradient>
    <filter id={`f-${safe}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   </defs>
   <circle cx="60" cy="60" r="51" fill="rgba(2,13,32,.88)" stroke={hue==='gold'?'#ffba48':hue==='violet'?'#a85cff':'#39dfff'} strokeOpacity=".55" strokeWidth="2"/>
   <ellipse cx="60" cy="92" rx="39" ry="8" fill="none" stroke={hue==='gold'?'#ffb535':hue==='violet'?'#bd63ff':'#36dfff'} strokeOpacity=".55" strokeWidth="2"/>
   <g fill="none" stroke={`url(#g-${safe})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter={`url(#f-${safe})`}><Glyph name={safe}/></g>
  </svg>
 </span>;
}
