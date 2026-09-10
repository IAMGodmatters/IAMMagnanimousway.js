import type {Metadata} from 'next';

export const metadata:Metadata={
  title:'Bible Study',
  description:'Study Scripture and organize biblical topics with Magnanimous AI.'
};

export default function BibleStudyPage(){
  return <main style={{minHeight:'100vh',background:'linear-gradient(180deg,#03132f,#020b1e)',color:'#eefaff',fontFamily:'Inter,system-ui,sans-serif',padding:'72px 24px'}}>
    <section style={{maxWidth:820,margin:'0 auto',border:'1px solid #1c6d9d',borderRadius:18,padding:'clamp(28px,5vw,54px)',background:'rgba(5,28,60,.72)',boxShadow:'0 24px 70px rgba(0,0,0,.28)'}}>
      <div style={{fontSize:42,marginBottom:12}}>▤</div>
      <small style={{letterSpacing:'.16em',color:'#66e5ff',fontWeight:900}}>MAGNANIMOUS AI • BIBLE STUDY</small>
      <h1 style={{fontSize:'clamp(38px,7vw,64px)',lineHeight:1,margin:'14px 0 18px'}}>Bible Study</h1>
      <p style={{fontSize:17,lineHeight:1.7,color:'#cbe3ef',maxWidth:680}}>Study Scripture, organize biblical topics, prepare lessons, and explore passages with the Bible Study helper inside Magnanimous AI.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:26}}>
        <a href="/ai-chat" style={{padding:'13px 18px',borderRadius:10,background:'#63e6ff',color:'#041322',fontWeight:900,textDecoration:'none'}}>Open Bible Study in Magnanimous AI →</a>
        <a href="/solutions" style={{padding:'13px 18px',borderRadius:10,border:'1px solid #47c9ff',color:'#eafaff',fontWeight:800,textDecoration:'none'}}>View All Tools</a>
      </div>
      <p style={{marginTop:36,paddingTop:18,borderTop:'1px solid rgba(99,230,255,.18)',color:'#91b9cc',fontSize:12}}>God Matters — Registered business name (DBA) • I AM MAGNANIMOUS WAY™ brand</p>
    </section>
  </main>
}
