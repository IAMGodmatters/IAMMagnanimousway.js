'use client';

const PAYMENT_LINK='https://buy.stripe.com/3cI9ATeZkeY62rCgId6kg01';

export default function AdvertisePage(){
  return <main style={{minHeight:'100vh',background:'#090b10',color:'#edf2f8',fontFamily:'Inter,system-ui,sans-serif',padding:'40px 20px'}}>
    <section style={{maxWidth:880,margin:'0 auto'}}>
      <a href="/" style={{color:'#9db4c8',textDecoration:'none'}}>← Back to I AM Magnanimous Way</a>
      <div style={{marginTop:28,padding:'34px',border:'1px solid #263140',borderRadius:20,background:'linear-gradient(135deg,#111722,#0e1218)'}}>
        <small style={{letterSpacing:'.16em',fontWeight:900,color:'#7f8da0'}}>SELF-SERVE SPONSORED ADVERTISING</small>
        <h1 style={{fontSize:'clamp(34px,6vw,60px)',lineHeight:1.02,margin:'12px 0'}}>Advertise on the free I AM platform</h1>
        <p style={{fontSize:18,lineHeight:1.6,color:'#a9b4c2'}}>Place a sponsored link in the free I AM Magnanimous Way experience. Stripe handles the recurring payment and the platform automatically activates the sponsored placement after a successful checkout.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'24px 0'}}>
          <article style={{padding:18,border:'1px solid #27313d',borderRadius:14,background:'#0c1118'}}><small>PRICE</small><strong style={{display:'block',fontSize:34,marginTop:6}}>$49</strong><span style={{color:'#8190a1'}}>per month</span></article>
          <article style={{padding:18,border:'1px solid #27313d',borderRadius:14,background:'#0c1118'}}><small>PLACEMENT</small><strong style={{display:'block',fontSize:22,marginTop:10}}>Free Tier</strong><span style={{color:'#8190a1'}}>Sponsored section</span></article>
          <article style={{padding:18,border:'1px solid #27313d',borderRadius:14,background:'#0c1118'}}><small>ACTIVATION</small><strong style={{display:'block',fontSize:22,marginTop:10}}>Automatic</strong><span style={{color:'#8190a1'}}>after Stripe confirms payment</span></article>
        </div>
        <h2>What the advertiser provides</h2>
        <p style={{color:'#9da9b8',lineHeight:1.6}}>Checkout collects the ad headline or business name, destination website URL, and a short sponsored message. The recurring subscription keeps the placement active; cancellation or an inactive subscription turns the ad off automatically.</p>
        <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:12,padding:'15px 22px',borderRadius:12,background:'#f4f7fb',color:'#091018',fontWeight:900,textDecoration:'none'}}>Start Sponsored Ad — $49/month →</a>
        <p style={{fontSize:12,color:'#6f7d8e',marginTop:18}}>Sponsored advertising is separate from AI answers. Advertisers are responsible for the accuracy and legality of their destination, claims, products, and services.</p>
      </div>
    </section>
  </main>;
}
