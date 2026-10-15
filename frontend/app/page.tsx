'use client';
import {FormEvent,useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Ad={id:number;title:string;url:string;label:string;placement:string;active:number};
type AdConfig={adsense_configured:boolean;adsense_client_id:string|null;adsense_home_slot:string|null;auto_ads_ready:boolean};
type LinkItem={label:string;href:string};

const kids='https://harmonic-data-52yyzau.shipstatic.com/';
const sideLinks:LinkItem[]=[
 {label:'Home',href:'/'},{label:'AI Command',href:'/ai-chat'},{label:'Opportunity Vault',href:'/opportunity-vault'},{label:'CRM',href:'/crm'},{label:'Travel Agency',href:'/travel-agency'},
 {label:'Magnanimous Kids',href:kids},{label:'AI Business',href:'/business-ai'},{label:'Launch Magnanimous',href:'/business-plan'},{label:'Video Studio',href:'/video-studio'},{label:'Social Studio',href:'/social-media'},
 {label:'AI Receptionist',href:'/ai-receptionist'},{label:'Virtual Assistant',href:'/virtual-assistant'},{label:'Knowledge Center',href:'/knowledge'},{label:'Professional Business',href:'/professional'},{label:'Routines',href:'/routine-studio'},
 {label:'Connected',href:'/connections'},{label:'Reports',href:'/activity'},{label:'Movie Maker',href:'/movie-maker'},{label:'AI Tools & More',href:'/ai-apps'},{label:'Settings',href:'/account'}
];
const cardLinks=[...sideLinks];
const topLinks=[
 {label:'Faith',href:'/ai-chat?prompt=Open%20my%20faith%20and%20ministry%20resources',left:37.1,width:4.5},
 {label:'Family',href:'/ai-chat?prompt=Open%20my%20family%20resources',left:42.1,width:5.0},
 {label:'Business',href:'/business',left:47.6,width:5.8},
 {label:'Opportunity',href:'/opportunity-vault',left:53.9,width:7.4},
 {label:'Global Impact',href:'/ai-chat?prompt=Show%20my%20global%20impact%20and%20service%20tools',left:61.8,width:7.8}
];
const descriptions:Record<string,string>={
 Home:'Your central hub',
 'AI Command':'Create, automate and grow',
 'Opportunity Vault':'Find and apply for opportunities',
 CRM:'Manage leads, customers and ministry',
 'Travel Agency':'Book, resell and earn',
 'Magnanimous Kids':'Faith-based learning, videos and more',
 'AI Business':'AI tools to run your business',
 'Launch Magnanimous':'Start and scale your business',
 'Video Studio':'Create stunning videos with AI',
 'Social Studio':'Create, schedule and grow',
 'AI Receptionist':'24/7 AI calls and chat',
 'Virtual Assistant':'Your personal AI helper',
 'Knowledge Center':'Learn, train and build skills',
 'Professional Business':'Business tools for real growth',
 Routines:'Automate your day',
 Connected:'Integrations and automation hub',
 Reports:'Track progress and measure growth',
 'Movie Maker':'Turn ideas into movies',
 'AI Tools & More':'More tools powered by Magnanimous AI',
 Settings:'Account, preferences and controls'
};

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{}}}
async function safeJson(url:string){try{return await fetch(url).then(read)}catch{return{}}}

export default function Home(){
 const[query,setQuery]=useState('');
 const[ads,setAds]=useState<Ad[]>([]);
 const[adConfig,setAdConfig]=useState<AdConfig>({adsense_configured:false,adsense_client_id:null,adsense_home_slot:null,auto_ads_ready:false});
 const[ready,setReady]=useState(false),[online,setOnline]=useState(false),[menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{(async()=>{const[health,t,a,mc]=await Promise.all([safeJson(`${api}/health`),safeJson(`${api}/api/tools`),safeJson(`${api}/api/ads?placement=home`),safeJson(`${api}/api/monetization/config`)]);setOnline(health?.status==='ok'&&Array.isArray(t.tools));setAds(a.ads||[]);setAdConfig({adsense_configured:!!mc.adsense_configured,adsense_client_id:mc.adsense_client_id||null,adsense_home_slot:mc.adsense_home_slot||null,auto_ads_ready:!!mc.auto_ads_ready});setReady(true)})()},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 useEffect(()=>{const client=adConfig.adsense_client_id;if(!client)return;const existing=document.querySelector('script[data-iam-adsense="true"]') as HTMLScriptElement|null;const requestAd=()=>{if(!adConfig.adsense_home_slot)return;try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}};if(existing){requestAd();return}const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;script.dataset.iamAdsense='true';script.onload=requestAd;document.head.appendChild(script)},[adConfig.adsense_client_id,adConfig.adsense_home_slot]);
 function submit(e:FormEvent){e.preventDefault();const q=query.trim();location.href=q?`/ai-chat?prompt=${encodeURIComponent(q)}`:'/ai-chat'}
 return <main className="exactHome">
  <section className="exactStage desktopStage" aria-label="I AM MAGNANIMOUS WAY AI ecosystem dashboard">
   <img className="exactArtwork" src="/crm-upgrade.jpeg" alt="I AM MAGNANIMOUS WAY AI Ecosystem dashboard" draggable={false}/>
   <a className="hot brandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
   {topLinks.map(item=><a key={item.label} className="hot topHot" style={{left:`${item.left}%`,width:`${item.width}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   <form className="searchHot" onSubmit={submit} role="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit" aria-label="Search Magnanimous AI">Search</button></form>
   <a className="hot notifyHot" href="/activity" aria-label="Open reports and notifications"><span>Reports and notifications</span></a>
   <a className="hot accountHot" href="/owner-center" aria-label="Open owner account"><span>Owner account</span></a>
   <a className="hot tutorialHot" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
   <nav className="srOnlyNav" aria-label="Additional platform systems"><a href={'/creator-growth'}>Creator Growth</a></nav>
   {sideLinks.map((item,i)=><a key={`side-${item.label}`} className="hot sideHot" style={{top:`${10.72+i*3.93}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   {cardLinks.map((item,i)=>{const col=i%5,row=Math.floor(i/5);return <a key={`card-${item.label}`} className="hot cardHot" style={{left:`${14.25+col*16.78}%`,top:`${42.2+row*13.55}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>})}
   <span className="srStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
  </section>

  <section className="mobileStage" aria-label="I AM MAGNANIMOUS WAY mobile dashboard">
   <header className="mobileHeader">
    <a className="mobileBrand" href="/" aria-label="I AM MAGNANIMOUS WAY home"><b>I AM MAGNANIMOUS WAY™</b><small>AI ECOSYSTEM</small></a>
    <div className="mobileHeaderActions">
     <a className="mobileOwner" href="/owner-center" aria-label="Owner account">Owner</a>
     <button className="menuToggle" type="button" onClick={()=>setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Open navigation menu"><span aria-hidden="true">☰</span></button>
    </div>
   </header>

   <div className="mobileHero">
    <div className="mobileHeroGlow"/>
    <div className="mobileHeroContent">
     <small>WELCOME TO</small>
     <h1>I AM MAGNANIMOUS WAY™</h1>
     <p>Your AI Powered Platform for Faith, Family, Business, and Global Opportunity.</p>
     <form className="mobileSearch" onSubmit={submit} role="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Ask Magnanimous AI anything..."/><button type="submit">Ask</button></form>
     <div className="statusRow" aria-live="polite"><span className={online?'statusDot online':'statusDot'}/><b>{ready?(online?'AI Online':'Platform Ready'):'Checking systems'}</b><a href="/guide">Platform Guide</a></div>
    </div>
   </div>

   <nav className="mobileQuick" aria-label="Primary categories">
    {topLinks.map(item=><a key={`mobile-top-${item.label}`} href={item.href}>{item.label}</a>)}
   </nav>

   <div className="mobileCards" aria-label="Platform apps">
    {cardLinks.map((item,i)=><a className="mobileCard" href={item.href} key={`mobile-card-${item.label}`}>
     <span className="mobileCardIcon" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
     <span className="mobileCardText"><b>{item.label}</b><small>{descriptions[item.label]||`Open ${item.label}`}</small></span>
     <span className="mobileCardArrow" aria-hidden="true">›</span>
    </a>)}
    <a className="mobileCard" href="/creator-growth"><span className="mobileCardIcon" aria-hidden="true">21</span><span className="mobileCardText"><b>Creator Growth</b><small>Grow content, audience and reach</small></span><span className="mobileCardArrow" aria-hidden="true">›</span></a>
   </div>

   <div className={menuOpen?'drawerBackdrop open':'drawerBackdrop'} onClick={()=>setMenuOpen(false)} aria-hidden="true"/>
   <aside id="mobile-menu" className={menuOpen?'mobileDrawer open':'mobileDrawer'} aria-hidden={!menuOpen}>
    <div className="drawerHead"><div><b>I AM MAGNANIMOUS WAY™</b><small>Navigation</small></div><button type="button" onClick={()=>setMenuOpen(false)} aria-label="Close navigation menu">×</button></div>
    <nav className="drawerLinks" aria-label="Mobile side menu">
     {sideLinks.map(item=><a key={`drawer-${item.label}`} href={item.href} onClick={()=>setMenuOpen(false)}>{item.label}<span aria-hidden="true">›</span></a>)}
     <a href="/creator-growth" onClick={()=>setMenuOpen(false)}>Creator Growth<span aria-hidden="true">›</span></a>
    </nav>
   </aside>
   <span className="srStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
  </section>

  {(ads.length>0||adConfig.adsense_configured)&&<section className="revenue" aria-label="Sponsored advertising"><div className="revenueHead"><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<div className="sponsors">{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</div>}{adConfig.adsense_configured&&<div className="adsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  <style jsx>{`
   .exactHome{margin:0;width:100%;min-height:100vh;min-height:100dvh;overflow-x:hidden;background:#020713;color:#eefaff;font-family:Inter,system-ui,sans-serif}.exactStage{position:relative;width:100vw;height:100vh;height:100svh;height:100dvh;min-height:100vh;overflow:hidden;background:#020713}.exactArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none}.hot{position:absolute;z-index:4;display:block;background:transparent;text-decoration:none;cursor:pointer;border:0;border-radius:8px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.hot span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.hot:focus-visible,.searchHot:focus-within{outline:2px solid #5ee7ff;outline-offset:-2px;box-shadow:0 0 20px rgba(94,231,255,.38)}.brandHot{left:.7%;top:.8%;width:19.2%;height:8.7%}.topHot{top:2.25%;height:5.3%}.notifyHot{left:84.9%;top:1.45%;width:2.6%;height:6%}.accountHot{left:87.7%;top:.9%;width:11.4%;height:7.3%}.tutorialHot{left:84.6%;top:27.2%;width:11.2%;height:5.1%}.sideHot{left:.75%;width:12.2%;height:3.55%;border-radius:6px}.cardHot{width:15.55%;height:11.85%;border-radius:12px}.searchHot{position:absolute;z-index:6;left:69.8%;top:2.05%;width:14.55%;height:5.15%;margin:0;touch-action:manipulation}.searchHot input{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:1px solid rgba(61,214,255,.44);border-radius:999px;padding:0 clamp(10px,2vw,31px) 0 clamp(6px,1vw,14px);background:rgba(4,15,35,.93);color:#eafaff;font:600 clamp(8px,1.1vw,12px) Inter,system-ui,sans-serif;outline:none}.searchHot input::placeholder{color:#7f9daf;opacity:.85}.searchHot button{position:absolute;right:5%;top:17%;width:16%;height:66%;border:0;background:transparent;color:transparent;cursor:pointer}.srOnlyNav{position:absolute;left:0;top:0;z-index:8;transform:translateY(-140%);background:#020713;padding:6px 10px;border-radius:0 0 8px 0}.srOnlyNav:focus-within{transform:translateY(0)}.srOnlyNav a{color:#eefaff;font-weight:700;text-decoration:none}.srStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
   .mobileStage{display:none}.mobileHeader{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:rgba(2,7,19,.94);border-bottom:1px solid rgba(62,205,255,.25);backdrop-filter:blur(18px)}.mobileBrand{display:grid;gap:1px;color:#fff;text-decoration:none;line-height:1}.mobileBrand b{font-size:13px;letter-spacing:.035em}.mobileBrand small{font-size:9px;color:#ffb52d;letter-spacing:.18em}.mobileHeaderActions{display:flex;align-items:center;gap:8px}.mobileOwner{min-height:40px;display:flex;align-items:center;padding:0 12px;border:1px solid rgba(255,185,55,.5);border-radius:999px;color:#fff;text-decoration:none;font-size:12px;font-weight:800;background:rgba(84,46,0,.35)}.menuToggle{width:44px;height:44px;border-radius:13px;border:1px solid rgba(70,215,255,.55);background:linear-gradient(145deg,rgba(9,50,105,.9),rgba(7,19,47,.95));color:#fff;font-size:25px;line-height:1;box-shadow:0 0 24px rgba(36,178,255,.18)}.mobileHero{position:relative;min-height:390px;display:flex;align-items:flex-end;overflow:hidden;background-image:linear-gradient(180deg,rgba(2,7,19,.18) 0%,rgba(2,7,19,.58) 42%,#020713 100%),url('/crm-upgrade.jpeg');background-size:auto 100%;background-position:center top;background-repeat:no-repeat;border-bottom:1px solid rgba(63,205,255,.2)}.mobileHero:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 34%,rgba(31,166,255,.08),transparent 38%);pointer-events:none}.mobileHeroGlow{position:absolute;left:50%;bottom:18px;width:70%;height:130px;transform:translateX(-50%);background:radial-gradient(ellipse,rgba(255,158,0,.24),rgba(0,126,255,.12) 42%,transparent 72%);filter:blur(24px)}.mobileHeroContent{position:relative;z-index:2;width:100%;padding:28px 16px 22px;text-align:center}.mobileHeroContent>small{color:#8feeff;font-size:10px;letter-spacing:.22em;font-weight:800}.mobileHeroContent h1{margin:7px auto 8px;font-size:clamp(25px,8.2vw,38px);line-height:1.02;letter-spacing:-.035em;text-shadow:0 0 20px rgba(52,194,255,.55),0 2px 2px #000}.mobileHeroContent p{max-width:520px;margin:0 auto 18px;color:#d7eefe;font-size:13px;line-height:1.45}.mobileSearch{display:flex;gap:8px;max-width:560px;margin:0 auto}.mobileSearch input{min-width:0;flex:1;height:48px;border:1px solid rgba(73,218,255,.5);border-radius:15px;padding:0 14px;background:rgba(4,15,35,.92);color:#fff;font-size:16px;outline:none;box-shadow:inset 0 0 20px rgba(0,124,255,.08)}.mobileSearch input:focus{border-color:#77e9ff;box-shadow:0 0 0 3px rgba(77,220,255,.12)}.mobileSearch button{height:48px;min-width:72px;border:0;border-radius:15px;background:linear-gradient(135deg,#19bff1,#1c6fff);color:#fff;font-weight:900;font-size:14px;box-shadow:0 9px 26px rgba(10,126,255,.28)}.statusRow{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:13px;font-size:11px;color:#b8d7e9}.statusRow a{color:#fff;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.35)}.statusDot{width:8px;height:8px;border-radius:50%;background:#f0b03e;box-shadow:0 0 10px rgba(240,176,62,.55)}.statusDot.online{background:#31e589;box-shadow:0 0 12px rgba(49,229,137,.72)}.mobileQuick{display:flex;gap:8px;padding:13px 12px 4px;overflow-x:auto;scrollbar-width:none}.mobileQuick::-webkit-scrollbar{display:none}.mobileQuick a{flex:0 0 auto;min-height:42px;display:flex;align-items:center;padding:0 14px;border:1px solid rgba(55,200,255,.32);border-radius:999px;color:#dff9ff;text-decoration:none;font-size:12px;font-weight:800;background:rgba(7,26,57,.76)}.mobileCards{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 12px 28px}.mobileCard{position:relative;min-height:126px;display:flex;flex-direction:column;justify-content:space-between;gap:11px;padding:14px;border:1px solid rgba(53,198,255,.34);border-radius:18px;color:#fff;text-decoration:none;background:linear-gradient(155deg,rgba(8,43,88,.94),rgba(10,13,35,.97) 62%,rgba(66,17,92,.82));box-shadow:inset 0 0 24px rgba(18,133,255,.08),0 8px 22px rgba(0,0,0,.25);touch-action:manipulation}.mobileCard:nth-child(4n+2),.mobileCard:nth-child(4n+3){border-color:rgba(199,77,255,.42);background:linear-gradient(155deg,rgba(34,24,98,.92),rgba(12,13,37,.98) 58%,rgba(81,14,95,.84))}.mobileCard:nth-child(5n){border-color:rgba(255,177,48,.45);background:linear-gradient(155deg,rgba(74,43,8,.9),rgba(12,13,34,.98) 58%,rgba(25,56,105,.8))}.mobileCard:active{transform:scale(.985)}.mobileCardIcon{width:33px;height:33px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(84,220,255,.48);border-radius:11px;background:rgba(11,86,145,.38);font-size:10px;font-weight:900;color:#b9f4ff;box-shadow:0 0 16px rgba(0,159,255,.2)}.mobileCardText{display:grid;gap:5px}.mobileCardText b{font-size:14px;line-height:1.1}.mobileCardText small{font-size:10px;line-height:1.35;color:#a9c6d8}.mobileCardArrow{position:absolute;right:12px;top:12px;width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.18);font-size:22px;color:#b7efff;background:rgba(255,255,255,.05)}.drawerBackdrop{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.62);opacity:0;pointer-events:none;transition:opacity .22s ease}.drawerBackdrop.open{opacity:1;pointer-events:auto}.mobileDrawer{position:fixed;z-index:80;left:0;top:0;bottom:0;width:min(86vw,350px);display:flex;flex-direction:column;background:linear-gradient(180deg,#04152f,#020713 36%,#050b1b);border-right:1px solid rgba(64,215,255,.38);box-shadow:24px 0 70px rgba(0,0,0,.55);transform:translateX(-102%);transition:transform .24s ease;visibility:hidden}.mobileDrawer.open{transform:translateX(0);visibility:visible}.drawerHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 14px;border-bottom:1px solid rgba(67,203,255,.18)}.drawerHead>div{display:grid;gap:4px}.drawerHead b{font-size:13px}.drawerHead small{font-size:10px;color:#ffb737;letter-spacing:.13em;text-transform:uppercase}.drawerHead button{width:44px;height:44px;border:1px solid rgba(80,216,255,.32);border-radius:13px;background:rgba(12,47,91,.7);color:#fff;font-size:29px}.drawerLinks{overflow-y:auto;padding:8px}.drawerLinks a{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;border-radius:12px;color:#dff7ff;text-decoration:none;font-size:13px;font-weight:750;border:1px solid transparent}.drawerLinks a:hover,.drawerLinks a:focus-visible{border-color:rgba(67,204,255,.32);background:rgba(18,70,118,.44);outline:none}.drawerLinks span{font-size:22px;color:#6edcff}.revenue{margin:18px auto 34px;width:min(1100px,calc(100% - 32px));padding:16px;border:1px solid rgba(79,204,255,.22);border-radius:18px;background:rgba(5,18,38,.9);box-shadow:0 18px 55px rgba(0,0,0,.3)}.revenueHead{display:flex;justify-content:space-between;gap:12px;color:#789bad;font-size:9px;letter-spacing:.12em}.sponsors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.sponsors a{border:1px solid #254e6d;padding:10px;border-radius:10px;color:#dff9ff;text-decoration:none;display:grid;gap:4px}.sponsors small{color:#77a1b9}.adsense{margin-top:12px}
   @media(max-width:760px){.desktopStage{display:none}.mobileStage{display:block;min-height:100dvh}.revenue{width:calc(100% - 24px);box-sizing:border-box;margin:12px 12px 26px}.revenueHead{flex-direction:column}.sponsors{grid-template-columns:1fr}}
   @media(max-width:390px){.mobileCards{grid-template-columns:1fr}.mobileHero{min-height:360px}.mobileBrand b{font-size:11px}.mobileOwner{display:none}}
   @media(min-width:761px){.mobileStage{display:none!important}}
   @media(orientation:landscape) and (max-height:600px) and (min-width:761px){.exactStage{height:100svh;height:100dvh}.searchHot input{font-size:clamp(7px,1.6vh,11px)}}
  `}</style>
  <style jsx global>{`
   html[data-iam-shell="true"],html[data-iam-shell="true"] body{margin:0!important;width:100%!important;min-width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:#020713!important}html[data-iam-shell="true"] .iam-shell-content{margin:0!important;margin-left:0!important;padding:0!important;padding-top:0!important;width:100vw!important;max-width:none!important;min-height:100vh!important;min-height:100dvh!important;overflow:visible!important;transition:none!important}html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
   @media(max-width:760px){html[data-iam-shell="true"],html[data-iam-shell="true"] body{overflow-x:hidden!important}html[data-iam-shell="true"] .iam-shell-content{width:100%!important;min-height:100dvh!important}}
  `}</style>
 </main>
}
