import EmailCenterClient from './email-center-client';

export const metadata = {
  title: 'Business Email & Professional Identity | I AM Magnanimous Way',
  description: 'Move from a validated business plan into a legitimate professional email identity, domain verification, CRM outreach and meeting preparation inside I AM.'
};

export default function BusinessEmailPage(){
  return <>
    <section style={{maxWidth:1380,margin:'0 auto',padding:'26px 32px 0',fontFamily:'Inter,system-ui,sans-serif',background:'#05090e',color:'#edfaff'}}>
      <div style={{border:'1px solid #5a4825',borderRadius:20,padding:26,background:'linear-gradient(120deg,#17150f,#071019)'}}>
        <div style={{fontSize:9,letterSpacing:'.18em',fontWeight:900,color:'#69ddff',marginBottom:8}}>BUSINESS EMAIL CENTER • PROFESSIONAL IDENTITY</div>
        <div style={{fontSize:9,letterSpacing:'.18em',fontWeight:900,color:'#e7b756'}}>FROM BUSINESS IDEA TO THE MEETING</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(30px,4vw,48px)',margin:'8px 0 10px'}}>A professional email should be part of the business launch—not an isolated setup task.</h1>
        <p style={{maxWidth:1000,color:'#9aabb5',lineHeight:1.65}}>Start with a researched and challenged business case, establish a professional domain and mailbox, connect it to I AM with your permission, then use the CRM and assistant for organized outreach and follow-up.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,marginTop:20}}>
          <a href="/business-plan" style={{textDecoration:'none',color:'#eefaff',border:'1px solid #384638',borderRadius:13,padding:16,background:'#0c1410'}}><b style={{display:'block',fontFamily:'Georgia,serif',fontSize:28,color:'#e7b756'}}>1</b><strong>Build & validate the business</strong><span style={{display:'block',fontSize:10,color:'#82968a',marginTop:6}}>Research, financial review, hostile critique and professional plan →</span></a>
          <a href="#email-center" style={{textDecoration:'none',color:'#eefaff',border:'1px solid #284e63',borderRadius:13,padding:16,background:'#07151e'}}><b style={{display:'block',fontFamily:'Georgia,serif',fontSize:28,color:'#69ddff'}}>2</b><strong>Professionalize the identity</strong><span style={{display:'block',fontSize:10,color:'#8099a9',marginTop:6}}>Domain, mailbox, DNS health and secure connection ↓</span></a>
          <a href="/crm" style={{textDecoration:'none',color:'#eefaff',border:'1px solid #384638',borderRadius:13,padding:16,background:'#0c1410'}}><b style={{display:'block',fontFamily:'Georgia,serif',fontSize:28,color:'#e7b756'}}>3</b><strong>Build the contact pipeline</strong><span style={{display:'block',fontSize:10,color:'#82968a',marginTop:6}}>Lenders, investors, grant contacts, customers and partners →</span></a>
          <a href="/assistant-actions?focus=email" style={{textDecoration:'none',color:'#eefaff',border:'1px solid #284e63',borderRadius:13,padding:16,background:'#07151e'}}><b style={{display:'block',fontFamily:'Georgia,serif',fontSize:28,color:'#69ddff'}}>4</b><strong>Prepare outreach & follow-up</strong><span style={{display:'block',fontSize:10,color:'#8099a9',marginTop:6}}>Draft, send with authorization, organize replies and prepare meetings →</span></a>
        </div>
      </div>
    </section>
    <div id="email-center"><EmailCenterClient/></div>
  </>;
}
