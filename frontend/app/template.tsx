'use client';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';

const publicPaths=new Set(['/solutions','/business-plan','/guide','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security']);

export default function Template({children}:{children:ReactNode}){
 const path=usePathname()||'/';
 const isPublic=publicPaths.has(path);
 return <>
  {!isPublic&&path==='/'&&<section className="iam-brand-hero" aria-label="I AM Magnanimous Way AI family">
    <div className="iam-brand-copy"><small>THE MAGNANIMOUS AI FAMILY</small><h2>One platform. Specialized AI helpers. One Magnanimous identity.</h2><p>Research, Bible study, business, creative work, communication, coding, support, travel, calling and automation — built as one connected family of assistants.</p><div><a href="/ai-chat">Open Magnanimous AI</a><a href="/auto-dialer">Open Optional Auto Dialer</a><a href="/contact-center">Open Contact Center</a></div></div>
    <img src="/magnanimous-hero.svg" alt="Magnanimous AI robot family representing specialized platform helpers"/>
  </section>}
  {!isPublic&&path!=='/'&&<div className="iam-brand-watermark" aria-hidden="true"><img src="/magnanimous-hero.svg" alt=""/></div>}
  {children}
  <style jsx global>{`
   .iam-brand-hero{position:relative;z-index:2;margin:0;background:#061328;min-height:330px;display:grid;grid-template-columns:minmax(320px,.8fr) minmax(520px,1.2fr);align-items:center;overflow:hidden;border-bottom:1px solid rgba(65,220,255,.28);box-shadow:0 18px 70px rgba(0,0,0,.34);font-family:Inter,system-ui,sans-serif;color:#eefbff}.iam-brand-hero:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 72% 50%,rgba(51,226,255,.22),transparent 35%),linear-gradient(90deg,#061328 0%,rgba(6,19,40,.98) 38%,rgba(6,19,40,.36) 74%,rgba(6,19,40,.18));pointer-events:none;z-index:1}.iam-brand-copy{position:relative;z-index:3;padding:38px 30px 38px max(28px,4vw)}.iam-brand-copy small{color:#64e6ff;letter-spacing:.2em;font-weight:900;font-size:10px}.iam-brand-copy h2{font-size:clamp(30px,4vw,58px);line-height:1.02;margin:10px 0 14px;max-width:750px}.iam-brand-copy p{max-width:690px;color:#a7c5d3;line-height:1.6;margin:0 0 20px}.iam-brand-copy div{display:flex;gap:10px;flex-wrap:wrap}.iam-brand-copy a{padding:11px 14px;border-radius:10px;border:1px solid rgba(84,218,255,.34);background:rgba(8,26,48,.72);color:#e7fbff;text-decoration:none;font-size:12px;font-weight:900}.iam-brand-copy a:first-child{background:linear-gradient(90deg,#31d9ff,#a873ff);color:#04101b;border:0}.iam-brand-hero>img{position:absolute;right:0;top:0;width:min(64vw,900px);height:100%;object-fit:cover;object-position:center;z-index:0;opacity:.94}.iam-brand-watermark{position:fixed;right:-90px;top:90px;width:min(46vw,620px);z-index:0;pointer-events:none;opacity:.055;filter:saturate(1.2);mask-image:linear-gradient(90deg,transparent,#000 24%,#000 78%,transparent)}.iam-brand-watermark img{width:100%;display:block}body>div,body>main{position:relative;z-index:1}@media(max-width:850px){.iam-brand-hero{grid-template-columns:1fr;min-height:440px}.iam-brand-hero>img{width:100%;height:100%;opacity:.44}.iam-brand-hero:before{background:linear-gradient(180deg,rgba(6,19,40,.82),rgba(6,19,40,.92))}.iam-brand-copy{padding:32px 20px}.iam-brand-copy h2{font-size:36px}.iam-brand-watermark{width:90vw;right:-45vw;opacity:.04}}
  `}</style>
 </>
}
