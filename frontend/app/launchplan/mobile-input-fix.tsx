'use client';

import {useEffect} from 'react';

const editableSelector='.lp .grid input:not([type="hidden"]), .lp .grid textarea, .lp .grid select';

export default function LaunchPlanMobileInputFix(){
 useEffect(()=>{
  const prepare=()=>{
   document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(editableSelector).forEach(el=>{
    if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){
     el.inputMode='text';
     el.setAttribute('autocapitalize','sentences');
     el.spellcheck=true;
     el.removeAttribute('readonly');
     el.removeAttribute('disabled');
    }
   });
  };
  prepare();
  const observer=new MutationObserver(prepare);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);

 return <>
  <span data-launchplan-mobile-input="native-focus-v1" hidden aria-hidden="true"/>
  <style jsx global>{`
   @media(max-width:900px){
    .lp .grid,.lp .grid label{position:relative}
    .lp .grid label{z-index:2}
    .lp .grid input,.lp .grid textarea,.lp .grid select{
     position:relative!important;
     z-index:4!important;
     pointer-events:auto!important;
     touch-action:auto!important;
     -webkit-user-select:text!important;
     user-select:text!important;
     -webkit-touch-callout:default!important;
     font-size:16px!important;
     line-height:1.35!important;
     min-height:52px;
     opacity:1!important;
    }
    .lp .grid textarea{min-height:128px}
   }
  `}</style>
 </>;
}
