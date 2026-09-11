'use client';

import {useEffect} from 'react';

const editableSelector='.formGrid input:not([type="hidden"]), .formGrid textarea, .formGrid select';

export default function BusinessPlanMobileInputFix(){
 useEffect(()=>{
  const focusEditable=(event:Event)=>{
   const target=event.target instanceof Element?event.target.closest<HTMLElement>(editableSelector):null;
   if(!target)return;
   try{target.focus({preventScroll:true})}catch{target.focus()}
  };
  const prepare=()=>{
   document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(editableSelector).forEach(el=>{
    if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){
     el.inputMode='text';
     el.autocapitalize='sentences';
     el.spellcheck=true;
    }
   });
  };
  prepare();
  const observer=new MutationObserver(prepare);
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('touchstart',focusEditable,{capture:true,passive:true});
  document.addEventListener('pointerdown',focusEditable,true);
  return()=>{
   observer.disconnect();
   document.removeEventListener('touchstart',focusEditable,true);
   document.removeEventListener('pointerdown',focusEditable,true);
  };
 },[]);

 return <style jsx global>{`
  @media(max-width:900px){
   .formGrid label{position:relative;z-index:2}
   .formGrid input,.formGrid textarea,.formGrid select{
    position:relative!important;
    z-index:3!important;
    pointer-events:auto!important;
    touch-action:manipulation;
    -webkit-user-select:text!important;
    user-select:text!important;
    -webkit-touch-callout:default;
    font-size:16px!important;
    line-height:1.35!important;
    min-height:50px;
   }
   .formGrid textarea{min-height:120px}
  }
 `}</style>;
}
