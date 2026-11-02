import type {ReactNode} from 'react';

export default function SocialMediaLayout({children}:{children:ReactNode}){
 return <>
  <div style={{background:'linear-gradient(100deg,#061a38,#0b2d56)',borderBottom:'1px solid #d7ad65',padding:'10px 14px',textAlign:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
   <a href="/social-hub" style={{color:'#f8dca5',fontWeight:900,textDecoration:'none',letterSpacing:'.06em',fontSize:'12px'}}>CONNECT FACEBOOK • INSTAGRAM • WHATSAPP • YOUTUBE • LINKEDIN • TIKTOK • X • SNAPCHAT • MORE →</a>
  </div>
  {children}
 </>
}
