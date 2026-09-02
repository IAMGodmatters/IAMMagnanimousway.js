'use client';

import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';

type AudiencePreset={label:string;audience:string;goal:string};

const presets:AudiencePreset[]=[
 {label:'Bank / lender',audience:'Bank / lender',goal:'Apply for a bank / lender loan'},
 {label:'Investor',audience:'Investor',goal:'Raise investment'},
 {label:'Grant',audience:'Grant reviewer',goal:'Prepare a grant application'},
 {label:'Startup',audience:'Startup / founder',goal:'Start a business'},
 {label:'Expansion',audience:'Expansion team',goal:'Expand an existing business'},
 {label:'Partnership',audience:'Potential partner',goal:'Form a partnership'},
 {label:'Internal plan',audience:'Internal management',goal:'Internal operating plan'},
 {label:'Immigration / business application',audience:'Immigration / business application',goal:'Immigration / business application support'},
];

function savedIntake(){
 try{return JSON.parse(localStorage.getItem('iam_business_plan_intake')||'{}')||{}}catch{return{}}
}

export default function AudienceActions(){
 const[target,setTarget]=useState<HTMLElement|null>(null);
 const[selected,setSelected]=useState('');

 useEffect(()=>{
  const find=()=>{
   const section=document.querySelector<HTMLElement>('.audiences');
   if(section)setTarget(section);
  };
  find();
  const timer=window.setInterval(()=>{if(!document.querySelector('.audiences'))return;find();window.clearInterval(timer)},150);
  return()=>window.clearInterval(timer);
 },[]);

 useEffect(()=>{
  const intake=savedIntake();
  const match=presets.find(p=>p.audience===intake.audience);
  if(match)setSelected(match.label);

  const q=new URLSearchParams(location.search);
  if(q.get('audience_selected')==='1'){
   window.setTimeout(()=>{
    const begin=document.querySelector<HTMLButtonElement>('.heroActions button');
    if(!document.getElementById('intake'))begin?.click();
    window.setTimeout(()=>{
     const tabs=document.querySelectorAll<HTMLButtonElement>('.stepTabs button');
     tabs[2]?.click();
     window.setTimeout(()=>document.getElementById('intake')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
    },60);
   },60);
  }
 },[]);

 function choose(p:AudiencePreset){
  const next={...savedIntake(),audience:p.audience,goal:p.goal};
  localStorage.setItem('iam_business_plan_intake',JSON.stringify(next));
  setSelected(p.label);
  const url=new URL(location.href);
  url.searchParams.set('audience_selected','1');
  url.searchParams.set('audience',p.audience);
  location.href=`${url.pathname}${url.search}#intake`;
 }

 if(!target)return null;
 return createPortal(<>
  <div className="iamAudienceActions" aria-label="Choose business plan audience">
   {presets.map(p=><button key={p.label} type="button" className={selected===p.label?'active':''} aria-pressed={selected===p.label} onClick={()=>choose(p)}>{p.label}</button>)}
  </div>
  {selected&&<p className="iamAudienceSelected"><b>Selected:</b> {selected}. The business-plan goal and intended audience will be adapted to this use case.</p>}
  <style jsx global>{`
   .audiences>div:not(.iamAudienceActions){display:none!important}
   .audiences .iamAudienceActions{display:flex!important;justify-content:center;gap:8px;flex-wrap:wrap;margin:20px 0}
   .iamAudienceActions button{border:1px solid #cfc9bb;border-radius:999px;padding:11px 15px;font-size:10px;font-weight:800;background:#fff;color:#252b26;cursor:pointer;transition:.15s ease}
   .iamAudienceActions button:hover,.iamAudienceActions button:focus-visible{border-color:#8c7135;box-shadow:0 0 0 3px rgba(194,154,64,.14);outline:none}
   .iamAudienceActions button.active{background:#172019;color:#fff;border-color:#172019}
   .audiences .iamAudienceSelected{margin:10px auto 18px;max-width:850px;color:#465048;font-size:11px}
  `}</style>
 </>,target);
}
