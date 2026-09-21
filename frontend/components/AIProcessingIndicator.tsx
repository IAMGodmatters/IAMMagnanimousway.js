"use client";

import {useEffect,useMemo,useState} from "react";

type Props={
  mode?:string;
  request?:string;
  compact?:boolean;
};

function clock(total:number){
  const minutes=Math.floor(total/60);
  const seconds=total%60;
  return `${minutes}:${String(seconds).padStart(2,"0")}`;
}

export default function AIProcessingIndicator({mode="General",request="",compact=false}:Props){
  const[elapsed,setElapsed]=useState(0);

  useEffect(()=>{
    const started=Date.now();
    const tick=()=>setElapsed(Math.max(0,Math.floor((Date.now()-started)/1000)));
    tick();
    const timer=window.setInterval(tick,1000);
    return()=>window.clearInterval(timer);
  },[]);

  const activity=useMemo(()=>{
    if(elapsed<8)return"Request received — Magnanimous AI is starting the work.";
    if(elapsed<35)return"Magnanimous AI is actively processing your request.";
    if(elapsed<90)return"Still working — this request is taking a little longer.";
    return"Long-running request is still active. Complex work can take a few minutes.";
  },[elapsed]);

  return <section className={`ai-processing ${compact?"compact":""}`} role="status" aria-live="polite" aria-busy="true">
    <div className="ai-processing-core" aria-hidden="true">
      <span className="ring ring-one"/>
      <span className="ring ring-two"/>
      <b>M</b>
    </div>
    <div className="ai-processing-copy">
      <div className="ai-processing-topline">
        <strong>MAGNANIMOUS AI IS WORKING</strong>
        <span>{clock(elapsed)}</span>
      </div>
      <p>{activity}</p>
      <div className="ai-processing-track" aria-hidden="true"><i/></div>
      <div className="ai-processing-meta">
        <span>{mode} mode</span>
        <span>Keep this page open until the answer appears.</span>
      </div>
      {request&&<small title={request}>Working on: “{request.length>140?`${request.slice(0,137)}…`:request}”</small>}
    </div>
    <style jsx>{`
      .ai-processing{margin:14px 0;padding:15px 16px;display:grid;grid-template-columns:54px minmax(0,1fr);gap:14px;align-items:center;border:1px solid color-mix(in srgb,var(--mode-accent,#65d9ff) 46%,transparent);border-radius:14px;background:linear-gradient(135deg,rgba(6,15,24,.94),rgba(12,24,35,.9));box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 28px color-mix(in srgb,var(--mode-accent,#65d9ff) 10%,transparent);overflow:hidden}.ai-processing.compact{margin:0;padding:12px 13px;grid-template-columns:44px minmax(0,1fr);box-shadow:none}.ai-processing-core{width:50px;height:50px;position:relative;display:grid;place-items:center}.compact .ai-processing-core{width:40px;height:40px}.ai-processing-core b{position:relative;z-index:2;font:900 16px Georgia,serif;color:#ffe08a}.ring{position:absolute;border-radius:50%;border:1px solid color-mix(in srgb,var(--mode-accent,#65d9ff) 76%,transparent)}.ring-one{inset:4px;animation:aiSpin 2.8s linear infinite;border-top-color:transparent}.ring-two{inset:10px;animation:aiSpinReverse 1.8s linear infinite;border-left-color:transparent}.compact .ring-one{inset:3px}.compact .ring-two{inset:8px}.ai-processing-copy{min-width:0}.ai-processing-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.ai-processing-topline strong{font-size:10px;letter-spacing:.14em;color:color-mix(in srgb,var(--mode-accent,#65d9ff) 82%,white)}.ai-processing-topline span{font:800 12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#b9d9e7}.ai-processing p{margin:5px 0 9px;color:#c5d5dd;font-size:12px;line-height:1.45}.compact p{font-size:11px}.ai-processing-track{height:5px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;position:relative}.ai-processing-track i{position:absolute;inset:0 auto 0 -35%;width:35%;border-radius:999px;background:linear-gradient(90deg,transparent,var(--mode-accent,#65d9ff),transparent);animation:aiTravel 1.35s ease-in-out infinite}.ai-processing-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:8px;color:#8098a5;font-size:9px}.ai-processing small{display:block;margin-top:8px;color:#8299a7;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact small{display:none}@keyframes aiSpin{to{transform:rotate(360deg)}}@keyframes aiSpinReverse{to{transform:rotate(-360deg)}}@keyframes aiTravel{0%{left:-35%}100%{left:100%}}@media(prefers-reduced-motion:reduce){.ring,.ai-processing-track i{animation:none}.ring-one{border-top-color:color-mix(in srgb,var(--mode-accent,#65d9ff) 76%,transparent)}.ai-processing-track i{left:32%;}}@media(max-width:560px){.ai-processing{grid-template-columns:44px minmax(0,1fr);padding:12px}.ai-processing-core{width:40px;height:40px}.ai-processing-meta{display:grid}.ai-processing-topline strong{font-size:9px}}`
    }</style>
  </section>;
}
