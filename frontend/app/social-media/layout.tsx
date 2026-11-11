import type {ReactNode} from 'react';

export default function SocialMediaLayout({children}:{children:ReactNode}){
 return <>
  <div style={{background:'#071b16',borderBottom:'1px solid #24513f',padding:'10px 14px',textAlign:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
   <a href="/social-hub" style={{color:'#9ff2cd',fontWeight:900,textDecoration:'none',letterSpacing:'.06em',fontSize:'12px'}}>CONNECT SOCIAL ACCOUNTS →</a>
   <span style={{color:'#6b8f82',padding:'0 10px'}}>•</span>
   <a href="/social-calendar" style={{color:'#f0cf88',fontWeight:900,textDecoration:'none',letterSpacing:'.06em',fontSize:'12px'}}>PUBLISHING CALENDAR →</a>
  </div>
  {children}
 </>
}
