'use client';

import {useEffect,useRef,useState} from 'react';

type DraftRecord={value:string;updatedAt:number;path:string;field:string;stage:string};
type CheckpointDetail={kind?:string;stage?:string;content?:string;scope?:string;session_key?:string;metadata?:Record<string,string|number|boolean>};

const SENSITIVE=/password|passwd|passcode|secret|token|authorization|api.?key|card|cvv|cvc|security.?code/i;
const STORAGE_PREFIX='iam_progress_draft:';
const SESSION_KEY='iam_progress_session_key';

function authToken(){
 if(typeof window==='undefined')return'';
 return localStorage.getItem('iam_account_token')||localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||'';
}
function sessionKey(){
 let key=sessionStorage.getItem(SESSION_KEY);
 if(!key){key=(globalThis.crypto?.randomUUID?.()||`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);sessionStorage.setItem(SESSION_KEY,key)}
 return key;
}
function eligible(el:Element):el is HTMLInputElement|HTMLTextAreaElement{
 if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
 if(el instanceof HTMLInputElement&&!['text','search','email','url','tel','number'].includes(el.type))return false;
 const marker=[el.name,el.id,el.getAttribute('aria-label'),el.placeholder,el.autocomplete].filter(Boolean).join(' ');
 if(SENSITIVE.test(marker)||el.closest('[data-no-autosave="true"]'))return false;
 return true;
}
function fieldKey(el:HTMLInputElement|HTMLTextAreaElement){
 const stable=el.name||el.id||el.getAttribute('aria-label')||el.placeholder;
 if(stable)return stable.slice(0,180);
 const list=Array.from(document.querySelectorAll('input,textarea')).filter(eligible);
 return `${el.tagName.toLowerCase()}-${Math.max(0,list.indexOf(el))}`;
}
function storageKey(path:string,field:string){return`${STORAGE_PREFIX}${path}:${field}`}
function nativeSet(el:HTMLInputElement|HTMLTextAreaElement,value:string){
 const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
 if(setter)setter.call(el,value);else el.value=value;
 el.dispatchEvent(new Event('input',{bubbles:true}));
 el.dispatchEvent(new Event('change',{bubbles:true}));
}
function safeText(value:string){
 return String(value||'').replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]').replace(/(password|passwd|passcode|secret|token|authorization|api.?key|cvv|cvc)\s*[:=]\s*\S+/gi,'$1=[REDACTED]').slice(0,30000);
}

export default function ProgressAutosave(){
 const[status,setStatus]=useState<'idle'|'saving'|'saved'>('idle');
 const timers=useRef<Map<string,ReturnType<typeof setTimeout>>>(new Map());
 const lastSaved=useRef<Map<string,string>>(new Map());

 useEffect(()=>{
  const path=location.pathname;
  const sid=sessionKey();

  async function remoteSave(detail:CheckpointDetail){
   const token=authToken();
   if(!token)return;
   const content=safeText(String(detail.content||''));
   try{
    setStatus('saving');
    await fetch('/api/progress/checkpoint',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({session_key:detail.session_key||sid,scope:detail.scope||'browser',kind:detail.kind||'draft',stage:detail.stage||'working',content,metadata:{path,...(detail.metadata||{})}}),keepalive:true});
    setStatus('saved');window.setTimeout(()=>setStatus('idle'),1400);
   }catch{setStatus('idle')}
  }

  function localSave(el:HTMLInputElement|HTMLTextAreaElement,stage='working'){
   const field=fieldKey(el),value=safeText(el.value),key=storageKey(path,field);
   const record:DraftRecord={value,updatedAt:Date.now(),path,field,stage};
   try{localStorage.setItem(key,JSON.stringify(record))}catch{}
   const signature=`${stage}:${value}`;
   if(lastSaved.current.get(key)===signature)return;
   const old=timers.current.get(key);if(old)clearTimeout(old);
   timers.current.set(key,setTimeout(()=>{lastSaved.current.set(key,signature);remoteSave({kind:'draft',stage,content:value,metadata:{field}})},stage==='working'?1100:0));
  }

  function restore(){
   const inputs=Array.from(document.querySelectorAll('input,textarea')).filter(eligible);
   for(const el of inputs){
    if(el.value.trim())continue;
    const field=fieldKey(el),key=storageKey(path,field);
    try{
     const raw=localStorage.getItem(key);if(!raw)continue;
     const record=JSON.parse(raw) as DraftRecord;
     if(!record?.value||record.stage==='submitted'||Date.now()-Number(record.updatedAt||0)>7*24*60*60*1000)continue;
     nativeSet(el,record.value);
    }catch{}
   }
  }

  const onInput=(event:Event)=>{const el=event.target;if(el instanceof Element&&eligible(el))localSave(el)};
  const onSubmit=(event:Event)=>{
   const form=event.target as HTMLFormElement|null;if(!form)return;
   const fields=Array.from(form.querySelectorAll('input,textarea')).filter(eligible);
   for(const el of fields)localSave(el,'submitted');
   remoteSave({kind:'action',stage:'submitted',content:'Form/action submitted',metadata:{form:form.getAttribute('aria-label')||form.id||form.className||'form'}});
  };
  const onCheckpoint=(event:Event)=>{const detail=(event as CustomEvent<CheckpointDetail>).detail||{};const content=safeText(String(detail.content||''));try{localStorage.setItem(`${STORAGE_PREFIX}event:${path}:${detail.kind||'progress'}`,JSON.stringify({value:content,updatedAt:Date.now(),path,field:detail.kind||'progress',stage:detail.stage||'working'}))}catch{};remoteSave({...detail,content})};
  const onPageHide=()=>{
   const fields=Array.from(document.querySelectorAll('input,textarea')).filter(eligible);
   for(const el of fields)localSave(el,'page-exit');
   remoteSave({kind:'navigation',stage:'page-exit',content:'Checkpoint before leaving page'});
  };

  document.addEventListener('input',onInput,true);document.addEventListener('change',onInput,true);document.addEventListener('submit',onSubmit,true);
  window.addEventListener('iam:progress-checkpoint',onCheckpoint as EventListener);window.addEventListener('pagehide',onPageHide);
  const observer=new MutationObserver(()=>restore());observer.observe(document.body,{childList:true,subtree:true});
  window.setTimeout(restore,120);
  return()=>{document.removeEventListener('input',onInput,true);document.removeEventListener('change',onInput,true);document.removeEventListener('submit',onSubmit,true);window.removeEventListener('iam:progress-checkpoint',onCheckpoint as EventListener);window.removeEventListener('pagehide',onPageHide);observer.disconnect();for(const timer of timers.current.values())clearTimeout(timer)};
 },[]);

 return <div className={`iam-progress-save ${status}`} aria-live="polite" title="Magnanimous continuously checkpoints work in progress">
  <i/>{status==='saving'?'Saving progress…':status==='saved'?'Progress saved':'Autosave on'}
  <style jsx>{`
   .iam-progress-save{position:fixed;left:14px;bottom:14px;z-index:2147483100;display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid rgba(111,210,239,.16);border-radius:999px;background:rgba(4,10,17,.78);backdrop-filter:blur(10px);color:#6f8d9b;font:700 8px/1 Inter,system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;opacity:.72}.iam-progress-save i{width:6px;height:6px;border-radius:50%;background:#5fd99d}.iam-progress-save.saving i{background:#ffd56e;animation:pulse 1s infinite}.iam-progress-save.saved{color:#9ce9bd;border-color:rgba(95,217,157,.28)}@keyframes pulse{50%{opacity:.35}}@media(max-width:680px){.iam-progress-save{left:10px;bottom:68px}}
  `}</style>
 </div>;
}
