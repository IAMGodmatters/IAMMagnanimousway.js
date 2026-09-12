import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
 title:'Magnanimous AI™ — Standalone',
 description:'Direct access to the Magnanimous AI central brain for reasoning, research, planning, writing, coding, knowledge and tool orchestration without the full website interface.',
 alternates:{canonical:'/magnanimous'},
 openGraph:{type:'website',url:'/magnanimous',title:'Magnanimous AI™ — Standalone',description:'One Magnanimous brain. Direct standalone access.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'Magnanimous AI'}]},
 twitter:{card:'summary_large_image',title:'Magnanimous AI™ — Standalone',description:'One Magnanimous brain. Direct standalone access.',images:['/iam-operator-share.svg']},
 robots:{index:true,follow:true}
};

const STANDALONE_DRAFT_BOOTSTRAP=`(()=>{
 try{
  if(window.__iamStandaloneDraftGuardInstalled)return;
  window.__iamStandaloneDraftGuardInstalled=true;
  const key='iam_progress_draft:/magnanimous:magnanimous-standalone-composer';
  const field='magnanimous-standalone-composer';
  const maxAge=7*24*60*60*1000;
  const clean=(value)=>String(value||'')
   .replace(/\\bBearer\\s+\\S+/gi,'Bearer [REDACTED]')
   .replace(/(password|passwd|passcode|secret|token|authorization|api.?key|cvv|cvc)\\s*[:=]\\s*\\S+/gi,'$1=[REDACTED]')
   .slice(0,30000);
  const composer=()=>document.querySelector('.mag-compose textarea');
  const save=(value,stage='working')=>{
   const safe=clean(value);
   try{
    if(!safe){localStorage.removeItem(key);return;}
    localStorage.setItem(key,JSON.stringify({value:safe,updatedAt:Date.now(),path:'/magnanimous',field,stage}));
   }catch{}
  };
  const clear=()=>{try{localStorage.removeItem(key)}catch{}};
  const restore=()=>{
   const el=composer();
   if(!(el instanceof HTMLTextAreaElement)||String(el.value||'').trim())return;
   try{
    const raw=localStorage.getItem(key);if(!raw)return;
    const record=JSON.parse(raw);
    if(!record||!record.value||record.stage==='submitted'||Date.now()-Number(record.updatedAt||0)>maxAge)return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
    const setter=descriptor&&descriptor.set;
    if(setter)setter.call(el,String(record.value));else el.value=String(record.value);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
   }catch{}
  };
  const onInput=(event)=>{const el=event.target;if(el instanceof HTMLTextAreaElement&&el.matches('.mag-compose textarea'))save(el.value)};
  const onKeyDown=(event)=>{const el=event.target;if(el instanceof HTMLTextAreaElement&&el.matches('.mag-compose textarea')&&event.key==='Enter'&&!event.shiftKey)clear()};
  const onSubmit=(event)=>{const form=event.target;if(form instanceof HTMLFormElement&&form.matches('.mag-compose'))clear()};
  const onClick=(event)=>{const target=event.target;if(target instanceof Element&&target.closest('.mag-head-actions button')?.textContent?.trim()==='New chat')clear()};
  document.addEventListener('input',onInput,true);
  document.addEventListener('change',onInput,true);
  document.addEventListener('keydown',onKeyDown,true);
  document.addEventListener('submit',onSubmit,true);
  document.addEventListener('click',onClick,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
  const observer=new MutationObserver(()=>restore());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(restore,0);setTimeout(restore,100);setTimeout(restore,500);setTimeout(restore,1500);setTimeout(()=>observer.disconnect(),5000);
 }catch{}
})();`;

export default function MagnanimousStandaloneLayout({children}:{children:ReactNode}){
 return <><script dangerouslySetInnerHTML={{__html:STANDALONE_DRAFT_BOOTSTRAP}}/>{children}</>;
}
