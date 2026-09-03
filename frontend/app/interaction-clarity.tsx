'use client';

import {useEffect,useState} from 'react';
import {guideHref,topicFor} from './interaction-catalog';

type ActiveInfo={label:string;summary:string;target:string;guide:string};

function labelFor(el:HTMLElement){
 const aria=el.getAttribute('aria-label')||el.getAttribute('title')||'';
 const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
 return (aria||text||el.tagName).slice(0,180);
}
function targetFor(el:HTMLElement){
 if(el instanceof HTMLAnchorElement)return el.getAttribute('href')||'Link destination';
 if(el.tagName==='BUTTON')return 'Runs this action on the current page';
 return 'Opens an explanation and next-step guide';
}
function isUsefulCard(el:HTMLElement){
 if(el.matches('a,button,input,select,textarea,label,form,details,summary,[role="button"],[role="link"]'))return false;
 if(el.closest('a,button'))return false;
 if(el.querySelector('a,button,input,select,textarea,details,summary,[contenteditable="true"]'))return false;
 if(el.getAttribute('aria-hidden')==='true')return false;
 if(el.classList.contains('iam-context-card'))return false;
 const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
 return text.length>=3&&text.length<=700;
}

export default function InteractionClarity(){
 const[active,setActive]=useState<ActiveInfo|null>(null),[path,setPath]=useState('/');
 useEffect(()=>{
  const current=location.pathname||'/';setPath(current);
  const describe=(el:HTMLElement)=>{
   const label=labelFor(el),topic=topicFor(current,`${label} ${el.className||''}`),target=targetFor(el),guide=guideHref(topic.key,current,label);
   el.dataset.iamActionTopic=topic.key;el.dataset.iamActionLabel=label;el.dataset.iamGuide=guide;
   if(!el.getAttribute('title'))el.setAttribute('title',`${label} — ${topic.summary} ${target}.`);
   if(!el.getAttribute('aria-label')&&el.tagName==='BUTTON'&&label)el.setAttribute('aria-label',label);
   el.classList.add('iam-action-ready');
   return{label,summary:topic.summary,target,guide};
  };
  const scan=()=>{
   document.querySelectorAll<HTMLElement>('a[href],button,[role="button"],[role="link"]').forEach(describe);
   document.querySelectorAll<HTMLElement>('article,[class*="card"],[class*="Card"],[class*="tile"],[class*="Tile"],[class*="feature"],[class*="Feature"],[class*="module"],[class*="Module"]').forEach(el=>{
    if(!isUsefulCard(el))return;
    const info=describe(el);el.classList.add('iam-context-card');el.setAttribute('role','link');el.tabIndex=0;el.setAttribute('aria-label',`Learn more: ${info.label}`);
   });
  };
  const infoFrom=(target:EventTarget|null)=>{
   const el=target instanceof Element?target.closest<HTMLElement>('.iam-action-ready'):null;if(!el)return null;
   const label=el.dataset.iamActionLabel||labelFor(el),topic=topicFor(current,`${label} ${el.className||''}`),guide=el.dataset.iamGuide||guideHref(topic.key,current,label);
   return{label,summary:topic.summary,target:targetFor(el),guide};
  };
  const click=(event:MouseEvent)=>{
   const card=event.target instanceof Element?event.target.closest<HTMLElement>('.iam-context-card'):null;
   if(!card)return;
   const selection=window.getSelection()?.toString().trim();if(selection)return;
   event.preventDefault();location.href=card.dataset.iamGuide||'/guide';
  };
  const key=(event:KeyboardEvent)=>{
   if(event.key!=='Enter'&&event.key!==' ')return;
   const card=event.target instanceof Element?event.target.closest<HTMLElement>('.iam-context-card'):null;if(!card)return;
   event.preventDefault();location.href=card.dataset.iamGuide||'/guide';
  };
  const focus=(event:FocusEvent)=>{const info=infoFrom(event.target);if(info)setActive(info)};
  const hover=(event:MouseEvent)=>{const info=infoFrom(event.target);if(info)setActive(info)};
  scan();
  const observer=new MutationObserver(()=>scan());observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);document.addEventListener('focusin',focus,true);document.addEventListener('mouseover',hover,true);
  return()=>{observer.disconnect();document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focus,true);document.removeEventListener('mouseover',hover,true)};
 },[]);
 const pageTopic=topicFor(path);
 return <>
  <aside className={`iam-clarity ${active?'open':''}`} aria-live="polite">
   {active?<><div><small>WHAT THIS DOES</small><b>{active.label}</b><span>{active.summary}</span><em>{active.target}</em></div><a href={active.guide}>Explanation & resources →</a><button onClick={()=>setActive(null)} aria-label="Close action explanation">×</button></>:<a className="iam-clarity-idle" href={guideHref(pageTopic.key,path)}>ⓘ What can I click here?</a>}
  </aside>
  <style jsx global>{`
   .iam-action-ready:not(:disabled){cursor:pointer}.iam-action-ready:focus-visible{outline:2px solid #54d9ef!important;outline-offset:3px!important}.iam-context-card{position:relative;cursor:help!important;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}.iam-context-card:hover,.iam-context-card:focus-visible{transform:translateY(-1px);border-color:#4a9bb0!important;box-shadow:0 10px 30px rgba(0,0,0,.12)}.iam-context-card:after{content:'LEARN →';position:absolute;right:10px;bottom:8px;font:800 7px Inter,system-ui,sans-serif;letter-spacing:.12em;opacity:.52;pointer-events:none}.iam-clarity{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147482997;font-family:Inter,system-ui,sans-serif;max-width:min(760px,calc(100vw - 150px))}.iam-clarity-idle{display:block;border:1px solid rgba(84,217,239,.45);border-radius:999px;background:rgba(5,12,18,.94);color:#bceefa;text-decoration:none;padding:9px 13px;font-size:10px;font-weight:900;box-shadow:0 12px 40px rgba(0,0,0,.35);backdrop-filter:blur(12px)}.iam-clarity.open{width:min(760px,calc(100vw - 150px));display:grid;grid-template-columns:1fr auto 28px;gap:10px;align-items:center;border:1px solid rgba(84,217,239,.38);border-radius:14px;background:rgba(5,12,18,.96);color:#eafaff;padding:10px 11px;box-shadow:0 18px 55px rgba(0,0,0,.48);backdrop-filter:blur(14px)}.iam-clarity.open small,.iam-clarity.open b,.iam-clarity.open span,.iam-clarity.open em{display:block}.iam-clarity.open small{font-size:7px;letter-spacing:.15em;color:#67d9ed}.iam-clarity.open b{font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iam-clarity.open span{font-size:9px;color:#91aab5;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iam-clarity.open em{font-size:8px;color:#637f8b;font-style:normal;margin-top:2px}.iam-clarity.open>a{color:#c7f7ff;text-decoration:none;font-size:9px;font-weight:900;white-space:nowrap}.iam-clarity.open>button{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}@media(max-width:700px){.iam-clarity{bottom:74px;max-width:calc(100vw - 24px)}.iam-clarity.open{width:calc(100vw - 24px);grid-template-columns:1fr 24px}.iam-clarity.open>a{grid-column:1/-1}.iam-clarity.open span,.iam-clarity.open em{white-space:normal}}
  `}</style>
 </>;
}
