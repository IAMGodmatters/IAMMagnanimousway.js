import type {ReactNode} from 'react';

export default function SocialMediaLayout({children}:{children:ReactNode}){
 return <>
  <div style={{background:'#071b16',borderBottom:'1px solid #24513f',padding:'10px 14px',textAlign:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
   <a href="/social-hub" style={{color:'#9ff2cd',fontWeight:900,textDecoration:'none',letterSpacing:'.06em',fontSize:'12px'}}>CONNECT FACEBOOK • INSTAGRAM • WHATSAPP • YOUTUBE • LINKEDIN • TIKTOK • X • SNAPCHAT • MORE →</a>
  </div>
  {children}
 </>
}
