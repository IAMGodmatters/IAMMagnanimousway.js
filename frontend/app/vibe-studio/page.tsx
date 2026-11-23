import MagnanimousVibeStudio from './VibeStudioClient';

export default function OwnerVibeStudioPage(){
 return <>
  <div style={{maxWidth:1500,margin:'0 auto',padding:'10px 24px',background:'#0a2038',borderBottom:'1px solid #294969'}}>
   <a href="/vibe-studio/files" style={{color:'#f3d18b',fontWeight:700,textDecoration:'none'}}>Open multi-file workspace →</a>
  </div>
  <MagnanimousVibeStudio />
 </>;
}
