'use client';
import {useEffect,useState} from 'react';
import {getMagnanimousAdminToken} from './lib/magnanimous-session';

const hiddenPaths=['/login','/signup','/owner-login','/privacy','/terms','/solutions','/pricing','/security','/reviews','/advertise'];

export default function GlobalTools(){
 const[path,setPath]=useState(''),[owner,setOwner]=useState(false),[open,setOpen]=useState(false);
 useEffect(()=>{setPath(location.pathname);setOwner(!!getMagnanimousAdminToken())},[]);
 if(!path||hiddenPaths.includes(path))return null;
 return <>
  <div className={`iam-global-tools ${open?'open':'closed'}`}>
   <button className="iam-tools-toggle" onClick={()=>setOpen(v=>!v)} aria-label={open?'Hide platform tools':'Open platform tools'} title={open?'Hide platform tools':'Open platform tools'}>{open?'›':'‹'}</button>
   <div className="iam-tools-panel" aria-hidden={!open}>
    <div className="iam-tools-head"><b>PLATFORM TOOLS</b><small>Enterprise & operations</small></div>
    <a className="enterprise" href="/enterprise" title="Enterprise commercialization, contracts and usage funding"><b>◆</b><span>Enterprise</span></a>
    <a className="video" href="/video-agents" title="Multi-agent social and enterprise video creation"><b>▶</b><span>Video Agents</span></a>
    <a className="cx" href="/contact-center" title="Professional Magnanimous contact center"><b>☏</b><span>CX Command</span></a>
    <a className="bpo" href="/bpo-operations" title="Multi-client BPO and outsourced operations"><b>⌘</b><span>BPO Ops</span></a>
    <a className="finance" href="/finance-people" title="Finance, global tax and HR"><b>◈</b><span>Finance + HR</span></a>
    <a className="ops" href="/call-center-health" title="Call center quality, workforce and performance health"><b>☎</b><span>QA + WFM</span></a>
    <a className="feedback" href={owner?'/owner-feedback':'/support'} title={owner?'Review user feedback':'Send feedback or report a problem'}><b>♥</b><span>{owner?'User Voice':'Feedback'}</span></a>
   </div>
  </div>
  <style jsx>{`
   .iam-global-tools{position:fixed;right:0;top:92px;z-index:2147482900;font-family:Inter,system-ui,sans-serif;display:flex;align-items:flex-start;transition:.22s ease}.iam-tools-toggle{width:28px;height:58px;border:1px solid rgba(92,219,255,.45);border-right:0;border-radius:12px 0 0 12px;background:rgba(5,14,22,.96);color:#9feeff;font-size:22px;font-weight:900;cursor:pointer;box-shadow:0 12px 34px rgba(0,0,0,.4);backdrop-filter:blur(12px)}.iam-tools-panel{width:178px;padding:10px;display:grid;gap:7px;border:1px solid #28465b;border-right:0;border-radius:14px 0 0 14px;background:rgba(4,10,17,.97);box-shadow:0 18px 48px rgba(0,0,0,.48);transform-origin:right top;transition:.22s ease}.closed .iam-tools-panel{width:0;padding:0;border-width:0;opacity:0;overflow:hidden;pointer-events:none;transform:translateX(12px)}.iam-tools-head{padding:3px 3px 7px;display:grid;gap:2px}.iam-tools-head b{width:auto;height:auto;display:block;background:none;color:#cfefff;font-size:9px;letter-spacing:.14em}.iam-tools-head small{color:#698599;font-size:8px}.iam-tools-panel a{display:flex;align-items:center;gap:8px;border:1px solid rgba(126,224,190,.32);border-radius:11px;background:rgba(6,14,13,.92);padding:8px 9px;text-decoration:none;color:#dff8ef;font-size:9px;font-weight:900;letter-spacing:.04em;white-space:nowrap}.iam-tools-panel a>b{width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#10241d;color:#79e6bd;font-size:12px;flex:0 0 auto}.enterprise{border-color:rgba(255,198,92,.48)!important;background:rgba(35,24,7,.96)!important;color:#fff1cd!important}.enterprise>b{background:#4a3311!important;color:#ffd16e!important}.video{border-color:rgba(110,213,255,.48)!important;background:rgba(6,18,31,.95)!important;color:#e4f8ff!important}.video>b{background:#102b3a!important;color:#74ddff!important}.cx{border-color:rgba(89,239,169,.48)!important;background:rgba(5,27,20,.94)!important;color:#e4fff3!important}.cx>b{background:#103425!important;color:#62f0ae!important}.bpo{border-color:rgba(245,193,99,.42)!important;background:rgba(28,20,8,.94)!important;color:#fff2d8!important}.bpo>b{background:#3b2b10!important;color:#ffd581!important}.ops{border-color:rgba(86,207,255,.34)!important;background:rgba(6,16,24,.92)!important;color:#dcf6ff!important}.ops>b{background:#102634!important;color:#6edcff!important}.feedback{border-color:rgba(158,149,255,.34)!important;background:rgba(12,12,24,.92)!important;color:#ebe8ff!important}.feedback>b{background:#1d1a37!important;color:#b7afff!important}@media(max-width:680px){.iam-global-tools{top:76px}.iam-tools-panel{width:min(180px,70vw)}}
  `}</style>
  <style jsx global>{`
   .iam-nudge{left:calc(50% + 92px)!important;right:auto!important;bottom:14px!important;max-width:min(310px,36vw)!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dash .hero .mascot{min-height:300px;background:none!important;overflow:hidden;padding:12px;display:flex;align-items:center;justify-content:center}.dash .hero .mascot img{display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:430px!important;object-fit:contain!important;object-position:center!important}@media(max-width:700px){.iam-nudge{left:16px!important;right:16px!important;bottom:124px!important;max-width:none!important;white-space:normal}.dash .hero .mascot{min-height:240px;padding:8px}.dash .hero .mascot img{max-height:320px!important}}
  `}</style>
 </>;
}
