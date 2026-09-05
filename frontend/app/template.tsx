'use client';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';

const publicPaths=new Set(['/solutions','/business-plan','/guide','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security']);

export default function Template({children}:{children:ReactNode}){
 const path=usePathname()||'/';
 const isPublic=publicPaths.has(path);
 return <>
  {!isPublic&&path!=='/'&&<div className="iam-brand-watermark" aria-hidden="true"><img src="/magnanimous-family.png" alt=""/></div>}
  {children}
  <style jsx global>{`
   .iam-brand-watermark{position:fixed;right:-90px;top:90px;width:min(46vw,620px);z-index:0;pointer-events:none;opacity:.055;filter:saturate(1.2);mask-image:linear-gradient(90deg,transparent,#000 24%,#000 78%,transparent)}.iam-brand-watermark img{width:100%;display:block}body>div,body>main{position:relative;z-index:1}@media(max-width:850px){.iam-brand-watermark{width:90vw;right:-45vw;opacity:.04}}
  `}</style>
 </>
}
