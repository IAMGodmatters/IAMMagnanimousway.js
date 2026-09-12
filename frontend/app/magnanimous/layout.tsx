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

const STANDALONE_VOICE_DOCK=`(()=>{
 try{
  if(window.__iamStandaloneVoiceDockInstalled)return;
  window.__iamStandaloneVoiceDockInstalled=true;
  const storageKey='iam_standalone_voice_hidden';
  const panel=()=>document.querySelector('.iam-voice-panel');
  const composer=()=>document.querySelector('.mag-compose');
  const hidden=()=>{try{return localStorage.getItem(storageKey)==='1'}catch{return false}};
  function syncHidden(){
   const off=hidden();
   document.documentElement.setAttribute('data-iam-voice-hidden',off?'true':'false');
   const toggle=document.querySelector('.iam-voice-dock-toggle');
   if(toggle){toggle.textContent=off?'🎙 Show voice':'✕ Hide voice';toggle.setAttribute('aria-pressed',off?'true':'false')}
  }
  function place(){
   const p=panel();if(!(p instanceof HTMLElement))return;
   if(hidden())return;
   const c=composer();
   if(c instanceof HTMLElement){
    const rect=c.getBoundingClientRect();
    if(rect.top<innerHeight&&rect.bottom>0){
     const gap=Math.max(14,Math.ceil(innerHeight-rect.top+12));
     p.style.setProperty('bottom','calc('+gap+'px + env(safe-area-inset-bottom))','important');
     p.style.setProperty('top','auto','important');
    }
   }
  }
  function ensureToggle(){
   if(document.querySelector('.iam-voice-dock-toggle'))return;
   const b=document.createElement('button');
   b.type='button';b.className='iam-voice-dock-toggle';b.setAttribute('aria-label','Show or hide Magnanimous voice controls');
   b.addEventListener('click',()=>{try{localStorage.setItem(storageKey,hidden()?'0':'1')}catch{}syncHidden();requestAnimationFrame(place)});
   document.body.appendChild(b);syncHidden();
  }
  function refresh(){ensureToggle();syncHidden();place()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  addEventListener('resize',refresh,{passive:true});addEventListener('orientationchange',refresh,{passive:true});addEventListener('focusin',refresh,true);
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(refresh,100);setTimeout(refresh,500);setTimeout(refresh,1500);
 }catch{}
})();`;

export default function MagnanimousStandaloneLayout({children}:{children:ReactNode}){
 return <>
  <script dangerouslySetInnerHTML={{__html:STANDALONE_DRAFT_BOOTSTRAP}}/>
  <script dangerouslySetInnerHTML={{__html:STANDALONE_VOICE_DOCK}}/>
  {children}
  <style>{`html[data-iam-standalone="true"] .iam-voice-panel{max-width:calc(100vw - 24px)!important}html[data-iam-standalone="true"][data-iam-voice-hidden="true"] .iam-voice-panel{display:none!important}.iam-voice-dock-toggle{position:fixed;right:14px;top:84px;z-index:2147483300;border:1px solid rgba(106,224,255,.38);border-radius:999px;background:rgba(4,12,22,.94);color:#dff9ff;padding:8px 10px;font:800 9px Inter,system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3);backdrop-filter:blur(10px)}@media(max-width:680px){.iam-voice-dock-toggle{right:10px;top:78px;padding:7px 9px}html[data-iam-standalone="true"] .iam-voice-panel{left:auto!important;right:10px!important;max-width:calc(100vw - 20px)!important}html[data-iam-standalone="true"] .iam-voice-panel .voice-copy{display:none!important}}`}</style>
 </>;
}
