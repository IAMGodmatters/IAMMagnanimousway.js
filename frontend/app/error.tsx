'use client';

import {useEffect} from 'react';

export default function PlatformError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error('I AM platform surface error',error)},[error]);
 return <main className="fault" id="iam-main">
  <section>
   <small>MAGNANIMOUS RELIABILITY • RECOVERY</small>
   <h1>This surface stopped before it could finish.</h1>
   <p>Your saved drafts, checkpoints and persistent Work Engine jobs are separate from this page error. Retry the surface first; if the action was interrupted, open Activity &amp; Restore to continue from its latest checkpoint instead of starting over.</p>
   {error?.message&&<div className="detail"><b>What happened</b><span>{String(error.message).slice(0,500)}</span>{error.digest&&<small>Reference: {error.digest}</small>}</div>}
   <div className="actions"><button onClick={reset}>Retry this surface</button><a href="/activity">Activity &amp; Restore</a><a href="/work-engine">Work Engine</a><a href="/">Dashboard</a></div>
  </section>
  <style jsx>{`.fault{min-height:100vh;display:grid;place-items:center;padding:26px;background:radial-gradient(circle at 80% 5%,rgba(64,213,255,.11),transparent 28%),#05090d;color:#edf8ff;font-family:Inter,system-ui,sans-serif}.fault section{width:min(760px,100%);border:1px solid #234553;border-radius:22px;background:#071017;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,.35)}small{font-size:9px;letter-spacing:.17em;color:#67dff5}h1{font-size:clamp(38px,6vw,62px);line-height:.98;margin:9px 0}p{color:#8ba0aa;line-height:1.65}.detail{margin:18px 0;border:1px solid #513641;border-radius:12px;background:#170d11;padding:13px;display:grid;gap:6px}.detail b{font-size:10px;color:#ffc3ca}.detail span{font-size:11px;color:#d7b4b8;overflow-wrap:anywhere}.detail small{color:#8e7478}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.actions button,.actions a{border:1px solid #326579;border-radius:9px;background:#0b2631;color:#dffaff;padding:10px 12px;text-decoration:none;font:800 10px Inter,system-ui,sans-serif;cursor:pointer}.actions button{background:#6eddf2;color:#051318;border-color:#6eddf2}`}</style>
 </main>
}
