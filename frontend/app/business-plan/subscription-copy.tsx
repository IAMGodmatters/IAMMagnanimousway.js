'use client';

import {useEffect} from 'react';

const replacements:[string,string][]=[
 ['The complete professional plan can be unlocked once for $79, or is included with Full Business.','The complete professional plan is available with a $79/month recurring subscription, or is included with Full Business.'],
 ['Free on-screen draft preview. Professional finalization is included with Full Business or available as a one-time $79 plan unlock.','Free on-screen draft preview. Professional finalization is included with Full Business or available with a $79/month recurring subscription.'],
 ['one-time plan unlock','per month · recurring subscription'],
 ['UNLOCK PROFESSIONAL PLAN →','START $79/MONTH PLAN →'],
 ['Confirming your professional-plan unlock with Stripe…','Confirming your $79/month professional-plan subscription with Stripe…'],
 ['Checkout was cancelled. Your free draft remains saved, and you can unlock the final plan whenever you are ready.','Checkout was cancelled. Your free draft remains saved, and you can start the $79/month professional plan whenever you are ready.'],
 ['Professional finalization stays included with Full Business or available through the existing one-time $79 unlock.','Professional finalization stays included with Full Business or is available through the $79/month recurring professional-plan subscription.'],
 ['Professional Business Plan — One-Time Unlock','Professional Business Plan — $79/Month Subscription']
];

function rewriteText(root:ParentNode){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 let node:Node|null;
 while((node=walker.nextNode())){
  const current=node.nodeValue||'';
  let next=current;
  for(const[from,to]of replacements)next=next.split(from).join(to);
  if(next!==current)node.nodeValue=next;
 }
}

export default function BusinessPlanSubscriptionCopy(){
 useEffect(()=>{
  const apply=()=>rewriteText(document.body);
  apply();
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  return()=>observer.disconnect();
 },[]);
 return <div style={{maxWidth:1180,margin:'10px auto 0',padding:'0 22px',fontFamily:'Inter,system-ui,sans-serif'}}>
  <div style={{border:'1px solid #c9b16f',borderRadius:12,padding:'11px 14px',background:'#fff9e9',color:'#40351d',fontSize:11,lineHeight:1.55}}>
   <b>Professional Business Plan: $79/month recurring.</b> The free draft remains available first. Monthly billing continues until the subscription is canceled. Full Business customers and the platform owner keep included professional finalization.
  </div>
 </div>;
}
