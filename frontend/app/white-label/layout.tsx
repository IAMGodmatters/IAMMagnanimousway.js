import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import WhiteLabelBrainDock from './white-label-brain-dock';

export const metadata:Metadata={
 title:'White Label AI Business Platform | I AM Magnanimous Way™',
 description:'Preview a white-label AI business platform powered by the shared Magnanimous AI brain, with funnels, client apps, booking, CRM, automation, reputation, calling, video and usage rebilling. Pricing is shown only inside the White Label product area.',
 alternates:{canonical:'/white-label/'}
};

export default function WhiteLabelLayout({children}:{children:ReactNode}){
 return <>
  {children}
  <a href="/white-label/communications" aria-label="Open Magnanimous Communications Hub" style={{position:'fixed',left:14,bottom:14,zIndex:2147482500,textDecoration:'none',border:'1px solid #275e78',borderRadius:14,background:'linear-gradient(135deg,#071720,#102738)',color:'#eafaff',padding:'10px 12px',fontFamily:'Inter,system-ui,sans-serif',boxShadow:'0 12px 36px #0008',display:'grid',gap:2}}>
   <strong style={{fontSize:11}}>☎ Communications Hub</strong>
   <span style={{fontSize:8,color:'#78b7cc'}}>Chat • Voice • Video • AI</span>
  </a>
  <WhiteLabelBrainDock/>
 </>
}
