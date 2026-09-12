'use client';

import {useEffect,useMemo,useState} from 'react';

const MOVED_ROUTES:Record<string,string>={
 '/persistent':'/work-engine',
 '/restore':'/activity',
 '/research':'/research-notebook',
 '/agency':'/agency-command',
 '/funnels':'/growth-funnel',
 '/funnel':'/growth-funnel',
 '/growth':'/growth-funnel',
 '/email':'/business-email',
 '/business-emails':'/business-email',
 '/automations':'/agency-automations',
 '/white-label':'/agency-command',
 '/booking':'/agency-command',
 '/dashboard':'/'
};

const PROTECTED_DESTINATIONS=new Set([
 '/',
 '/work-engine',
 '/activity',
 '/research-notebook',
 '/agency-command',
 '/growth-funnel',
 '/agency-automations'
]);

function normalize(path:string){
 const clean=String(path||'/').split('?')[0].split('#')[0].replace(/\/+$/,'')||'/';
 return clean.toLowerCase();
}

function hasPlatformSession(){
 try{return Boolean(localStorage.getItem('iam_account_token')||localStorage.getItem('odin_admin_token'))}catch{return false}
}

function resolveRecovery(path:string){
 const mapped=MOVED_ROUTES[path];
 if(!mapped)return '/solutions';
 if(PROTECTED_DESTINATIONS.has(mapped)&&!hasPlatformSession())return `/login?returnTo=${encodeURIComponent(mapped)}`;
 return mapped;
}

export default function NotFoundRecovery(){
 const[target,setTarget]=useState('/solutions');
 const[count,setCount]=useState(1);
 const current=useMemo(()=>typeof window==='undefined'?'':window.location.pathname,[]);

 useEffect(()=>{
  const path=normalize(window.location.pathname);
  const destination=resolveRecovery(path);
  setTarget(destination);
  const interval=window.setInterval(()=>setCount(v=>Math.max(0,v-1)),500);
  const timer=window.setTimeout(()=>window.location.replace(destination),450);
  return()=>{window.clearInterval(interval);window.clearTimeout(timer)};
 },[]);

 return <main className="recover" id="iam-main">
  <section>
   <small>MAGNANIMOUS ROUTE RECOVERY</small>
   <h1>Recovering your workspace…</h1>
   <p>This link moved or is no longer active. Magnanimous is taking you to a working page automatically so you are not left at a dead end.</p>
   {current&&<div className="path"><b>Requested</b><span>{current}</span><b>Recovering to</b><span>{target}</span></div>}
   <div className="status" role="status">Redirecting{count>0?'…':' now…'}</div>
   <nav aria-label="Recovery choices">
    <a href="/solutions">Platform overview</a>
    <a href="/magnanimous">Magnanimous AI</a>
    <a href="/login?returnTo=%2Fgrowth-funnel">Growth Funnel</a>
    <a href="/login?returnTo=%2Fagency-command">Agency Command</a>
   </nav>
  </section>
  <style jsx>{`
   .recover{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 80% 5%,rgba(80,217,255,.12),transparent 28%),#05090d;color:#eef9ff;font-family:Inter,system-ui,sans-serif}
   section{width:min(760px,100%);border:1px solid #234a5c;border-radius:22px;background:#071017;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
   small{font-size:9px;letter-spacing:.17em;color:#68def4;font-weight:900}
   h1{font-size:clamp(38px,6vw,64px);line-height:.98;margin:10px 0 14px}
   p{color:#8da2ad;line-height:1.65;max-width:650px}
   .path{display:grid;grid-template-columns:auto 1fr;gap:7px 12px;margin:18px 0;border:1px solid #1c3947;border-radius:12px;padding:13px;background:#050c11;font-size:10px}
   .path b{color:#68def4}.path span{color:#b7cad3;overflow-wrap:anywhere}
   .status{margin:16px 0;color:#8cf0bd;font-size:11px;font-weight:900;letter-spacing:.08em}
   nav{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
   a{border:1px solid #315a6b;border-radius:9px;padding:10px 12px;color:#dff9ff;text-decoration:none;font-size:10px;font-weight:800;background:#091822}
  `}</style>
 </main>;
}
