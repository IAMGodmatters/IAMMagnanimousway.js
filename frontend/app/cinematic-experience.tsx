'use client';
import {useEffect,useMemo,useState} from 'react';

type TourStep={title:string;eyebrow:string;copy:string;href:string;cta:string};

const steps:TourStep[]=[
 {eyebrow:'01 • COMMAND NEXUS',title:'Welcome to Magnanimous AI',copy:'This is your central command layer. Magnanimous AI connects planning, business, CRM, communications, creative work, travel and specialized tools while keeping consequential actions behind verification and approval gates.',href:'/',cta:'Open dashboard'},
 {eyebrow:'02 • OPPORTUNITY VAULT',title:'Find verified earning paths',copy:'The Opportunity Vault separates verified sources from hype. It highlights current eligibility, official application links and important limitations before you spend time or money.',href:'/opportunity-vault',cta:'Explore opportunities'},
 {eyebrow:'03 • CRM INTELLIGENCE',title:'Turn relationships into organized action',copy:'CRM brings contacts, follow-up, pipelines and customer operations into one premium workspace so you can move from information to the next useful action quickly.',href:'/crm',cta:'Open CRM'},
 {eyebrow:'04 • TRAVEL AGENCY',title:'Test travel workflows without accidental spend',copy:'Magnanimous Travel includes protected supplier onboarding and no-spend sandbox paths for hotel and flight development while live booking, ticketing and payments stay authority-gated.',href:'/travel-agency',cta:'Open Travel'},
 {eyebrow:'05 • BUSINESS + CREATIVE',title:'Build, communicate and grow',copy:'Use Business, Social, Video and the Virtual Assistant together. Magnanimous keeps one identity across specialized workspaces so your work can move forward without losing context.',href:'/business',cta:'Open Business'},
 {eyebrow:'06 • YOUR NEXT MOVE',title:'Use the guide whenever you need it',copy:'The platform tour stays available from any signed-in workspace. Choose a destination, let the guide narrate the step, then continue working with Magnanimous AI as the coordinating brain.',href:'/ai-chat',cta:'Open Magnanimous AI'}
];

const publicPaths=['/login','/signup','/owner-login','/forgot-password','/privacy','/terms'];

function selectVoice(){
 if(typeof window==='undefined'||!('speechSynthesis' in window))return null;
 const voices=window.speechSynthesis.getVoices();
 const preferred=[/Aria/i,/Jenny/i,/Samantha/i,/Daniel/i,/Natural/i,/Google UK English/i,/English.*United States/i];
 for(const pattern of preferred){const match=voices.find(v=>pattern.test(v.name)&&/^en/i.test(v.lang));if(match)return match}
 return voices.find(v=>/^en/i.test(v.lang))||voices[0]||null;
}

export default function CinematicExperience(){
 const[path,setPath]=useState(''),[open,setOpen]=useState(false),[step,setStep]=useState(0),[speaking,setSpeaking]=useState(false);
 useEffect(()=>{setPath(location.pathname);return()=>{try{window.speechSynthesis?.cancel()}catch{}}},[]);
 const hidden=useMemo(()=>publicPaths.some(p=>path===p||path.startsWith(p+'/')),[path]);
 const current=steps[step];
 function speak(copy=current.copy){
  if(typeof window==='undefined'||!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(copy);
  const voice=selectVoice();if(voice)u.voice=voice;
  u.rate=.96;u.pitch=.98;u.volume=.9;u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);
  window.speechSynthesis.speak(u);
 }
 function start(){setStep(0);setOpen(true);setTimeout(()=>speak(steps[0].copy),40)}
 function change(next:number){const index=(next+steps.length)%steps.length;setStep(index);setTimeout(()=>speak(steps[index].copy),30)}
 function close(){try{window.speechSynthesis?.cancel()}catch{}setSpeaking(false);setOpen(false)}
 if(!path||hidden)return null;
 return <>
  <button className="iam-tour-launch" onClick={start} aria-label="Start narrated platform tour"><span>◉</span><b>GUIDED TOUR</b></button>
  {open&&<section className="iam-tour-panel" aria-label="Magnanimous narrated platform tour">
   <div className="iam-tour-visual"><img src="/mode-images/virtual-assistant.webp" alt="Magnanimous virtual assistant guide"/><i/><b>MAGNANIMOUS GUIDE</b><span>{speaking?'NARRATING':'READY'}</span></div>
   <header><div><small>{current.eyebrow}</small><h2>{current.title}</h2></div><button onClick={close} aria-label="Close tour">×</button></header>
   <p>{current.copy}</p>
   <div className="iam-tour-progress" aria-label={`Tour step ${step+1} of ${steps.length}`}>{steps.map((_,i)=><button key={i} className={i===step?'on':''} onClick={()=>change(i)} aria-label={`Go to tour step ${i+1}`}/>)}</div>
   <div className="iam-tour-actions"><button onClick={()=>speak()}>{speaking?'↻ Restart voice':'▶ Narrate'}</button><a href={current.href}>{current.cta} →</a></div>
   <footer><button onClick={()=>change(step-1)}>← Previous</button><span>{step+1} / {steps.length}</span><button onClick={()=>change(step+1)}>Next →</button></footer>
  </section>}
  <style jsx global>{`
   .iam-tour-launch{position:fixed;z-index:2147482997;right:16px;top:146px;display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(105,224,255,.32);border-radius:999px;background:linear-gradient(135deg,rgba(8,26,44,.92),rgba(15,11,31,.92));color:#dffaff;box-shadow:0 16px 42px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(16px);cursor:pointer;font:900 9px Inter,system-ui,sans-serif;letter-spacing:.1em}.iam-tour-launch span{color:#76ecff;text-shadow:0 0 14px #36d7ff;animation:iamTourPulse 2.8s ease-in-out infinite}.iam-tour-launch:hover{transform:translateY(-2px);border-color:#76ecff;box-shadow:0 20px 52px rgba(0,0,0,.5),0 0 28px rgba(54,215,255,.13)}
   .iam-tour-panel{position:fixed;z-index:2147483002;right:18px;top:190px;width:min(430px,calc(100vw - 36px));max-height:calc(100vh - 210px);overflow:auto;padding:14px;border:1px solid rgba(102,219,255,.34);border-radius:24px;background:linear-gradient(155deg,rgba(5,17,31,.985),rgba(9,8,20,.985));color:#edfaff;box-shadow:0 38px 120px rgba(0,0,0,.72),0 0 60px rgba(79,194,255,.08),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(24px) saturate(1.25);font-family:Inter,system-ui,sans-serif;perspective:1200px}.iam-tour-panel header{display:flex;justify-content:space-between;gap:18px;padding:13px 4px 4px}.iam-tour-panel header small{color:#7de8ff;font-size:8px;font-weight:900;letter-spacing:.16em}.iam-tour-panel h2{font-size:24px;line-height:1.02;margin:5px 0}.iam-tour-panel header button{width:34px;height:34px;flex:0 0 auto;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:#ffffff08;color:#fff;font-size:20px;cursor:pointer}.iam-tour-panel>p{margin:8px 4px 13px;color:#9fb8c7;font-size:12px;line-height:1.62}
   .iam-tour-visual{height:175px;position:relative;overflow:hidden;border:1px solid rgba(96,221,255,.26);border-radius:17px;background:#06101b;box-shadow:inset 0 0 50px rgba(53,211,255,.08),0 16px 35px rgba(0,0,0,.28);transform:perspective(1000px) rotateX(.8deg)}.iam-tour-visual img{width:100%;height:100%;object-fit:cover;object-position:center 48%;filter:saturate(.85) contrast(1.08) brightness(.78)}.iam-tour-visual:after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,rgba(3,13,28,.1),transparent 44%,rgba(124,88,255,.14)),linear-gradient(0deg,rgba(2,8,20,.9),transparent 46%);pointer-events:none}.iam-tour-visual i{position:absolute;inset:-35%;background:conic-gradient(from 120deg,transparent,rgba(82,223,255,.13),transparent 24%);animation:iamTourScan 9s linear infinite;z-index:2}.iam-tour-visual b,.iam-tour-visual span{position:absolute;bottom:12px;z-index:3;font-size:8px;letter-spacing:.14em}.iam-tour-visual b{left:13px;color:#eefaff}.iam-tour-visual span{right:13px;color:#6ff0b3;text-shadow:0 0 12px #48e8a4}
   .iam-tour-progress{display:flex;gap:6px;padding:4px}.iam-tour-progress button{height:4px;flex:1;border:0;border-radius:999px;background:#ffffff18;cursor:pointer}.iam-tour-progress button.on{background:linear-gradient(90deg,#66e9ff,#9d7bff);box-shadow:0 0 12px rgba(102,233,255,.4)}.iam-tour-actions{display:grid;grid-template-columns:.9fr 1.1fr;gap:8px;margin:11px 4px}.iam-tour-actions button,.iam-tour-actions a{padding:11px 12px;border-radius:11px;text-align:center;text-decoration:none;font-size:10px;font-weight:900}.iam-tour-actions button{border:1px solid rgba(105,224,255,.28);background:#0a1c2a;color:#c9f5ff}.iam-tour-actions a{border:1px solid rgba(255,205,105,.4);background:linear-gradient(90deg,#352714,#122437);color:#ffe2a0}.iam-tour-panel footer{display:flex;justify-content:space-between;align-items:center;margin:0 4px 2px}.iam-tour-panel footer button{border:0;background:none;color:#8fdcf2;font-size:10px;cursor:pointer}.iam-tour-panel footer span{color:#657e8f;font-size:9px}
   @keyframes iamTourPulse{50%{transform:scale(1.2);filter:brightness(1.3)}}@keyframes iamTourScan{to{transform:rotate(360deg)}}
   @media(max-width:760px){.iam-tour-launch{right:10px;top:190px}.iam-tour-panel{right:10px;top:235px;width:calc(100vw - 20px);max-height:calc(100vh - 250px)}}
   @media(prefers-reduced-motion:reduce){.iam-tour-launch span,.iam-tour-visual i{animation:none!important}.iam-tour-visual{transform:none!important}}
  `}</style>
 </>;
}
