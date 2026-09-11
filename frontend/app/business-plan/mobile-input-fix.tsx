'use client';

import {useEffect} from 'react';

const editableSelector='.formGrid input:not([type="hidden"]), .formGrid textarea, .formGrid select';

export default function BusinessPlanMobileInputFix(){
 useEffect(()=>{
  // iOS must receive the native tap/click on the editable control in order to
  // present the software keyboard reliably. Do not programmatically focus from
  // touchstart/pointerdown: doing so before the native click can leave the field
  // focused without opening the keyboard.
  const prepare=()=>{
   document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(editableSelector).forEach(el=>{
    if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){
     el.inputMode='text';
     el.setAttribute('autocapitalize','sentences');
     el.setAttribute('enterkeyhint','next');
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
  <span data-business-plan-mobile-input="native-focus-v2" hidden aria-hidden="true"/>
  <style jsx global>{`
   @media(max-width:900px){
    .formGrid,.formGrid label{position:relative}
    .formGrid label{z-index:2}
    .formGrid input,.formGrid textarea,.formGrid select{
     position:relative!important;
     z-index:4!important;
     pointer-events:auto!important;
     touch-action:auto!important;
     -webkit-user-select:text!important;
     user-select:text!important;
     -webkit-touch-callout:default!important;
     -webkit-tap-highlight-color:rgba(63,211,255,.12);
     font-size:16px!important;
     line-height:1.35!important;
     min-height:52px;
     opacity:1!important;
    }
    .formGrid textarea{min-height:128px}
    .formGrid input:focus,.formGrid textarea:focus,.formGrid select:focus{
     outline:2px solid rgba(63,211,255,.72)!important;
     outline-offset:2px;
    }
   }
  `}</style>
 </>;
}
