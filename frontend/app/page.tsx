'use client';
import {FormEvent,useEffect,useRef,useState} from 'react';
import {coreHomeServicesHealthy,fetchHomeJson} from '../lib/home-health';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Ad={id:number;title:string;url:string;label:string;placement:string;active:number};
type AdConfig={adsense_configured:boolean;adsense_client_id:string|null;adsense_home_slot:string|null;auto_ads_ready:boolean};
type LinkItem={label:string;href:string};
type MobileReferenceCard={label:string;href:string;left:number;top:number;width:number;height:number};
// The approved desktop artwork stays byte-for-byte unchanged; this remaps click areas when the painted side strip is cropped away.
const expandedArtworkX=(x:number)=>(x-13.35)/.8665;
const expandedArtworkWidth=(w:number)=>w/.8665;
const navIllustration=(href:string)=>{
 if(href==='/ai-chat')return '/magnanimous-ai-command-palace-mobile-v2.webp';
 if(href==='/opportunity-vault')return '/magnanimous-opportunity-palace-mobile-v2.webp';
 if(href==='/knowledge')return '/magnanimous-knowledge-palace-mobile-v2.webp';
 if(href==='/travel-agency')return '/magnanimous-travel-palace-mobile-v2.webp';
 if(href.includes('shipstatic'))return '/magnanimous-family-full.webp';
 if(/social|video|movie|studio|creator/.test(href))return '/mode-images/social-media.webp';
 if(/crm|business|b2b|shop|owner|professional/.test(href))return '/mode-images/business.webp';
 if(/opportunity|intelligence|activity|report/.test(href))return '/mode-images/research.webp';
 if(/assistant|receptionist|routine|connections/.test(href))return '/mode-images/virtual-assistant.webp';
 return '/mode-images/general.webp';
};

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
const mobileReferenceCards:MobileReferenceCard[]=[
 {label:'Video Studio',href:'/video-studio',left:4.7,top:29.2,width:44.0,height:7.9},
 {label:'White Label',href:'/white-label',left:50.3,top:29.2,width:44.1,height:7.9},
 {label:'Creator Studio',href:'/studio',left:4.7,top:37.6,width:44.0,height:7.5},
 {label:'Growth',href:'/creator-growth',left:50.3,top:37.6,width:44.1,height:7.5},
 {label:'Opportunity Vault',href:'/opportunity-vault',left:4.7,top:45.8,width:44.0,height:7.6},
 {label:'Knowledge Center',href:'/knowledge',left:50.3,top:45.8,width:44.1,height:7.6},
 {label:'Routines',href:'/routine-studio',left:4.7,top:54.1,width:44.0,height:7.6},
 {label:'AI Receptionist',href:'/ai-receptionist',left:50.3,top:54.1,width:44.1,height:7.6},
 {label:'Connected',href:'/connections',left:4.7,top:62.3,width:44.0,height:7.6},
 {label:'Professional Business',href:'/professional',left:50.3,top:62.3,width:44.1,height:7.6},
 {label:'Launch Magnanimous',href:'/business-plan',left:4.7,top:70.6,width:44.0,height:7.6},
 {label:'AI Business',href:'/business-ai',left:50.3,top:70.6,width:44.1,height:7.6},
 {label:'Command',href:'/ai-chat',left:4.7,top:78.8,width:44.0,height:7.5},
 {label:'Social Studio',href:'/social-media',left:50.3,top:78.8,width:44.1,height:7.5},
 {label:'Virtual Assistant',href:'/virtual-assistant',left:4.7,top:87.0,width:44.0,height:6.6},
 {label:'Reports',href:'/activity',left:50.3,top:87.0,width:44.1,height:6.6}
];

export default function Home(){
 const[query,setQuery]=useState('');
 const[ads,setAds]=useState<Ad[]>([]);
 const[adConfig,setAdConfig]=useState<AdConfig>({adsense_configured:false,adsense_client_id:null,adsense_home_slot:null,auto_ads_ready:false});
 const[ready,setReady]=useState(false),[online,setOnline]=useState(false),[menuOpen,setMenuOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false),[sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const mobileMenuButtonRef=useRef<HTMLButtonElement|null>(null),mobileDrawerCloseRef=useRef<HTMLButtonElement|null>(null),mobileSearchRef=useRef<HTMLInputElement|null>(null),menuWasOpenRef=useRef(false);
 useEffect(()=>{const controller=new AbortController();let mounted=true;const timeout=setTimeout(()=>controller.abort(),10000);(async()=>{const[health,t,a,mc]=await Promise.all([fetchHomeJson(`${api}/health`,controller.signal),fetchHomeJson(`${api}/api/tools`,controller.signal),fetchHomeJson(`${api}/api/ads?placement=home`,controller.signal),fetchHomeJson(`${api}/api/monetization/config`,controller.signal)]);if(!mounted)return;setOnline(coreHomeServicesHealthy(health,t));setAds(Array.isArray(a.ads)?a.ads:[]);setAdConfig({adsense_configured:!!mc.adsense_configured,adsense_client_id:mc.adsense_client_id||null,adsense_home_slot:mc.adsense_home_slot||null,auto_ads_ready:!!mc.auto_ads_ready});setReady(true)})().finally(()=>clearTimeout(timeout));return()=>{mounted=false;clearTimeout(timeout);controller.abort()}},[]);
 useEffect(()=>{try{setSidebarCollapsed(localStorage.getItem('iam_home_sidebar_collapsed')==='1')}catch{}},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMenuOpen(false);setSearchOpen(false)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 useEffect(()=>{if(!menuOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[menuOpen]);
 useEffect(()=>{const background=[...document.querySelectorAll<HTMLElement>('.mobileExactStage,.revenue')];background.forEach(node=>menuOpen?node.setAttribute('inert',''):node.removeAttribute('inert'));if(menuOpen){menuWasOpenRef.current=true;requestAnimationFrame(()=>mobileDrawerCloseRef.current?.focus())}else if(menuWasOpenRef.current){menuWasOpenRef.current=false;requestAnimationFrame(()=>mobileMenuButtonRef.current?.focus())}return()=>background.forEach(node=>node.removeAttribute('inert'))},[menuOpen]);
 useEffect(()=>{if(searchOpen)requestAnimationFrame(()=>mobileSearchRef.current?.focus())},[searchOpen]);
 useEffect(()=>{const client=adConfig.adsense_client_id;if(!client)return;const existing=document.querySelector('script[data-iam-adsense="true"]') as HTMLScriptElement|null;const requestAd=()=>{if(!adConfig.adsense_home_slot)return;try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}};if(existing){requestAd();return}const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;script.dataset.iamAdsense='true';script.onload=requestAd;document.head.appendChild(script)},[adConfig.adsense_client_id,adConfig.adsense_home_slot]);
 function submit(e:FormEvent){e.preventDefault();const q=query.trim();location.href=q?`/ai-chat?prompt=${encodeURIComponent(q)}`:'/ai-chat'}
 function toggleDesktopSidebar(){setSidebarCollapsed(value=>{const next=!value;try{localStorage.setItem('iam_home_sidebar_collapsed',next?'1':'0')}catch{}return next})}
 return <main className="exactHome">
  <section className={sidebarCollapsed?'exactStage desktopStage sidebarCollapsed':'exactStage desktopStage'} aria-label="I AM MAGNANIMOUS WAY AI ecosystem dashboard">
   <img className="exactArtwork" src="/crm-upgrade.jpeg" alt="I AM MAGNANIMOUS WAY AI Ecosystem dashboard" draggable={false}/>
   <a className="hot brandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
   {topLinks.map(item=><a key={item.label} className="hot topHot" style={{left:`${sidebarCollapsed?expandedArtworkX(item.left):item.left}%`,width:`${sidebarCollapsed?expandedArtworkWidth(item.width):item.width}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   <form className="searchHot" onSubmit={submit} role="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit" aria-label="Search Magnanimous AI">Search</button></form>
   <a className="hot notifyHot" href="/activity" aria-label="Open reports and notifications"><span>Reports and notifications</span></a>
   <a className="hot accountHot" href="/owner-center" aria-label="Open owner account"><span>Owner account</span></a>
   <a className="hot tutorialHot" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
   <a className="hot platformGuideHot" href="/guide" aria-label="Open platform guide"><span>Platform guide</span></a>
   <a className="hot guidedTourHot" href="/guide" aria-label="Open guided tour"><span>Guided tour</span></a>
   <nav className="srOnlyNav" aria-label="Additional platform systems"><a href={'/creator-growth'}>Creator Growth</a></nav>
   {!sidebarCollapsed&&sideLinks.map((item,i)=><a key={`side-${item.label}`} className="hot sideHot" style={{top:`${10.72+i*3.93}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   {cardLinks.map((item,i)=>{const col=i%5,row=Math.floor(i/5);return <a key={`card-${item.label}`} className="hot cardHot" style={{left:`${sidebarCollapsed?expandedArtworkX(14.25+col*16.78):14.25+col*16.78}%`,top:`${42.2+row*13.55}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>})}
   <button className={sidebarCollapsed?'desktopSidebarToggle collapsed':'desktopSidebarToggle'} type="button" onClick={toggleDesktopSidebar} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed?'Expand sidebar menu':'Collapse sidebar menu'}><span aria-hidden="true">{sidebarCollapsed?'›':'‹'}</span></button>
   {sidebarCollapsed&&<div className="desktopSidebarMask" aria-hidden="true"/>}
   <span className="srStatus" aria-live="polite">{ready?(online?'Core health and tool catalog responding. Other services have not been checked.':'Platform loaded. Core health or tool catalog unavailable.'):'Checking core Magnanimous AI services.'}</span>
  </section>

  <section className="mobileExactStage" aria-label="I AM MAGNANIMOUS WAY mobile dashboard">
   <div className="mobileReferenceFrame">
    <img className="mobileReferenceArtwork" src="/mobile-dashboard-approved.webp" alt="I AM MAGNANIMOUS WAY mobile AI ecosystem dashboard" draggable={false}/>
     <img className="mobileReferenceClearArtwork" src="/mobile-dashboard-approved-clear.jpeg" alt="" aria-hidden="true" draggable={false}/>
    <button ref={mobileMenuButtonRef} className="mobileReferenceHot mobileMenuHot" type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen} aria-controls="mobile-side-menu" aria-label={menuOpen?'Close sidebar menu':'Open sidebar menu'}><span>Menu</span></button>
    <a className="mobileReferenceHot mobileBrandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
    <button className="mobileReferenceHot mobileSearchHot" type="button" onClick={()=>setSearchOpen(value=>!value)} aria-expanded={searchOpen} aria-controls="mobile-reference-search" aria-label="Search Magnanimous AI"><span>Search</span></button>
    <a className="mobileReferenceHot mobileNotifyHot" href="/activity" aria-label="Open reports and notifications"><span>Notifications</span></a>
    <a className="mobileReferenceHot mobileOwnerHot" href="/owner-center" aria-label="Open owner account"><span>Owner account</span></a>
    <a className="mobileReferenceHot mobileTutorialHot" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
    {mobileReferenceCards.map(item=><a key={item.label} className="mobileReferenceHot mobileCardHot" style={{left:`${item.left}%`,top:`${item.top}%`,width:`${item.width}%`,height:`${item.height}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>)}
    <a className="mobileReferenceHot mobileBottomHome" href="/" aria-label="Home"><span>Home</span></a>
    <a className="mobileReferenceHot mobileBottomCommand" href="/ai-chat" aria-label="AI Command"><span>AI Command</span></a>
    <a className="mobileReferenceHot mobileBottomOpportunity" href="/opportunity-vault" aria-label="Opportunity"><span>Opportunity</span></a>
    <a className="mobileReferenceHot mobileBottomCrm" href="/crm" aria-label="CRM"><span>CRM</span></a>
    <button className="mobileReferenceHot mobileBottomMore" type="button" onClick={()=>setMenuOpen(true)} aria-label="Open more navigation"><span>More</span></button>
    {!ready&&<div className="mobileServiceAlert checking" role="status" aria-live="polite">Checking live services…</div>}
    {ready&&!online&&<div className="mobileServiceAlert degraded" role="status" aria-live="polite">Some live services unavailable</div>}
    {ready&&online&&<span className="srStatus" aria-live="polite">Core health and tool catalog responding. Other services have not been checked.</span>}
   </div>
   {searchOpen&&<form id="mobile-reference-search" className="mobileSearchPanel" onSubmit={submit} role="search"><input ref={mobileSearchRef} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit">Search</button><button type="button" onClick={()=>setSearchOpen(false)} aria-label="Close search">Close</button></form>}
  </section>

  {menuOpen&&<button className="mobileDrawerBackdrop" type="button" tabIndex={-1} aria-label="Close sidebar menu" onClick={()=>setMenuOpen(false)}/>}
  <aside id="mobile-side-menu" className={menuOpen?'mobileDrawer open':'mobileDrawer'} aria-hidden={!menuOpen} aria-label="Mobile navigation">
   <div className="mobileDrawerTop">
    <a className="mobileDrawerBrand" href="/" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>I AM MAGNANIMOUS WAY™</a>
    <button ref={mobileDrawerCloseRef} type="button" onClick={()=>setMenuOpen(false)} aria-label="Close sidebar menu" tabIndex={menuOpen?0:-1}>Close</button>
   </div>
   <nav className="mobileDrawerLinks" aria-label="Sidebar navigation">
    {sideLinks.map(item=><a key={`drawer-${item.label}`} href={item.href} tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}><span className="mobileDrawerIcon" aria-hidden="true"><img src={navIllustration(item.href)} alt="" loading="lazy"/></span><span className="mobileDrawerTitle">{item.label}</span><span className="mobileDrawerChevron" aria-hidden="true">›</span></a>)}
    <a href="/white-label" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}><span className="mobileDrawerIcon" aria-hidden="true"><img src="/mode-images/business.webp" alt="" loading="lazy"/></span><span className="mobileDrawerTitle">White Label</span><span className="mobileDrawerChevron" aria-hidden="true">›</span></a>
    <a href="/studio" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}><span className="mobileDrawerIcon" aria-hidden="true"><img src="/mode-images/social-media.webp" alt="" loading="lazy"/></span><span className="mobileDrawerTitle">Creator Studio</span><span className="mobileDrawerChevron" aria-hidden="true">›</span></a>
    <a href="/creator-growth" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}><span className="mobileDrawerIcon" aria-hidden="true"><img src="/mode-images/business.webp" alt="" loading="lazy"/></span><span className="mobileDrawerTitle">Growth</span><span className="mobileDrawerChevron" aria-hidden="true">›</span></a>
   </nav>
  </aside>

  {(ads.length>0||adConfig.adsense_configured)&&<section className="revenue" aria-label="Sponsored advertising"><div className="revenueHead"><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<div className="sponsors">{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</div>}{adConfig.adsense_configured&&<div className="adsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  <style jsx global>{`
   .exactHome{margin:0;width:100%;min-height:100vh;min-height:100dvh;overflow-x:clip;background:#020713;color:#eefaff;font-family:Inter,system-ui,sans-serif}.exactStage{position:relative;width:min(100%,1920px,calc(100dvh * 16 / 9));aspect-ratio:16/9;margin:0 auto;overflow:hidden;background:#020713}.exactArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain;user-select:none;-webkit-user-drag:none}.hot{position:absolute;z-index:4;display:block;background:transparent;text-decoration:none;cursor:pointer;border:0;border-radius:8px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.hot span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.hot:focus-visible,.searchHot:focus-within,.desktopSidebarToggle:focus-visible,.mobileReferenceHot:focus-visible,.mobileSearchPanel:focus-within{outline:2px solid #5ee7ff;outline-offset:-2px;box-shadow:0 0 20px rgba(94,231,255,.38)}.brandHot{left:.7%;top:.8%;width:19.2%;height:8.7%}.topHot{top:2.25%;height:5.3%}.notifyHot{left:84.9%;top:1.45%;width:2.6%;height:6%}.accountHot{left:87.7%;top:.9%;width:11.4%;height:7.3%}.tutorialHot{left:84.6%;top:27.2%;width:11.2%;height:5.1%}.platformGuideHot{left:36.2%;top:84.1%;width:30.8%;height:6.6%}.guidedTourHot{left:70.8%;top:88.5%;width:27.4%;height:6.3%}.sideHot{left:.75%;width:12.2%;height:3.55%;border-radius:6px}.cardHot{width:15.55%;height:11.85%;border-radius:12px}.searchHot{position:absolute;z-index:6;left:69.8%;top:2.05%;width:14.55%;height:5.15%;margin:0;touch-action:manipulation}.searchHot input{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:1px solid rgba(61,214,255,.44);border-radius:999px;padding:0 clamp(10px,2vw,31px) 0 clamp(6px,1vw,14px);background:rgba(4,15,35,.93);color:#eafaff;font:600 clamp(8px,1.1vw,12px) Inter,system-ui,sans-serif;outline:none}.searchHot input::placeholder{color:#7f9daf;opacity:.85}.searchHot button{position:absolute;right:5%;top:17%;width:16%;height:66%;border:0;background:transparent;color:transparent;cursor:pointer}.srOnlyNav{position:absolute;left:0;top:0;z-index:8;transform:translateY(-140%);background:#020713;padding:6px 10px;border-radius:0 0 8px 0}.srOnlyNav:focus-within{transform:translateY(0)}.srOnlyNav a{color:#eefaff;font-weight:700;text-decoration:none}.srStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.desktopSidebarToggle{position:absolute;z-index:10;left:11.55%;top:9.95%;width:2.5%;aspect-ratio:1;border:1px solid rgba(82,222,255,.7);border-radius:999px;background:rgba(2,10,25,.82);color:#bdf6ff;font-size:clamp(13px,1.2vw,20px);line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}.desktopSidebarToggle.collapsed{left:.65%;top:10.2%}.desktopSidebarMask{position:absolute;z-index:3;left:0;top:8.9%;bottom:0;width:13.35%;background:linear-gradient(90deg,#020713 0%,#020713 82%,rgba(2,7,19,.94) 100%);border-right:1px solid rgba(45,190,255,.24);pointer-events:none}
   .mobileExactStage,.mobileDrawer,.mobileDrawerBackdrop{display:none}.revenue{margin:18px auto 34px;width:min(1100px,calc(100% - 32px));padding:16px;border:1px solid rgba(79,204,255,.22);border-radius:18px;background:rgba(5,18,38,.9);box-shadow:0 18px 55px rgba(0,0,0,.3)}.revenueHead{display:flex;justify-content:space-between;gap:12px;color:#789bad;font-size:9px;letter-spacing:.12em}.sponsors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.sponsors a{border:1px solid #254e6d;padding:10px;border-radius:10px;color:#dff9ff;text-decoration:none;display:grid;gap:4px}.sponsors small{color:#77a1b9}.adsense{margin-top:12px}
   @media(max-width:1024px){
    .desktopStage{display:none!important}.mobileExactStage{display:block;width:100%;max-width:560px;min-height:100dvh;margin:0 auto;box-sizing:border-box;background:#01050d;padding:0 0 max(18px,env(safe-area-inset-bottom));overflow:visible}.mobileReferenceFrame{position:relative;width:100%;aspect-ratio:941/1672;overflow:hidden;background:#01050d}.mobileReferenceArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none;pointer-events:none}.mobileReferenceClearArtwork{position:absolute;inset:0;z-index:2;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none;pointer-events:none}.mobileReferenceHot{position:absolute;z-index:5;display:block;margin:0;padding:0;border:0;border-radius:9px;background:transparent;color:transparent;text-decoration:none;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.22)}.mobileReferenceHot span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.mobileMenuHot{left:1.2%;top:.45%;width:8.7%;height:4.8%}.mobileBrandHot{left:9.8%;top:.25%;width:48.5%;height:5.0%}.mobileSearchHot{left:61.7%;top:.35%;width:8.7%;height:4.9%}.mobileNotifyHot{left:70.4%;top:.35%;width:8.0%;height:4.9%}.mobileOwnerHot{left:78.4%;top:.25%;width:18.8%;height:5.0%}.mobileTutorialHot{left:75.7%;top:5.6%;width:22.0%;height:18.9%}.mobileCardHot{border-radius:12px}.mobileBottomHome{left:2.0%;top:93.7%;width:18.0%;height:5.6%}.mobileBottomCommand{left:20.0%;top:93.7%;width:20.0%;height:5.6%}.mobileBottomOpportunity{left:40.0%;top:93.7%;width:20.0%;height:5.6%}.mobileBottomCrm{left:60.0%;top:93.7%;width:20.0%;height:5.6%}.mobileBottomMore{left:80.0%;top:93.7%;width:18.0%;height:5.6%}.mobileServiceAlert{position:absolute;z-index:7;left:6%;top:25.2%;width:88%;min-height:2.8%;display:grid;place-items:center;box-sizing:border-box;padding:3px 8px;border-radius:999px;text-align:center;font-size:clamp(9px,2.6vw,12px);font-weight:900;letter-spacing:.01em;backdrop-filter:blur(8px)}.mobileServiceAlert.checking{border:1px solid rgba(94,231,255,.72);background:rgba(2,18,40,.86);color:#e8fbff}.mobileServiceAlert.degraded{border:1px solid rgba(255,190,70,.88);background:rgba(45,24,2,.9);color:#ffe3a5}.mobileSearchPanel{position:fixed;z-index:47;left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));top:max(68px,calc(env(safe-area-inset-top) + 54px));display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;padding:8px;border:1px solid rgba(72,192,255,.66);border-radius:999px;background:rgba(2,13,32,.98);box-shadow:0 14px 40px rgba(0,0,0,.55),0 0 24px rgba(0,134,255,.2)}.mobileSearchPanel input{min-width:0;border:0;outline:0;background:transparent;color:#fff;padding:7px 9px;font:700 14px Inter,system-ui,sans-serif}.mobileSearchPanel input::placeholder{color:#8ea9bd}.mobileSearchPanel button{min-height:36px;border:1px solid rgba(79,198,255,.62);border-radius:999px;padding:0 12px;background:#082852;color:#eaffff;font-weight:900}.mobileDrawerBackdrop{display:block;position:fixed;inset:0;z-index:48;border:0;background:rgba(0,4,12,.72);padding:0}.mobileDrawer{display:block;position:fixed;z-index:49;left:0;top:0;bottom:0;width:min(84vw,330px);padding:max(9px,env(safe-area-inset-top)) 9px max(12px,env(safe-area-inset-bottom));box-sizing:border-box;background:#020713;border-right:1px solid rgba(67,210,255,.34);box-shadow:20px 0 60px rgba(0,0,0,.68);overflow-y:auto;transform:translateX(-104%);transition:transform .2s ease}.mobileDrawer.open{transform:translateX(0)}.mobileDrawerTop{position:sticky;top:calc(-1 * max(9px,env(safe-area-inset-top)));z-index:2;display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 0;background:#020713}.mobileDrawerBrand{color:#fff1bd;font-size:12px;font-weight:950;text-decoration:none;letter-spacing:.02em}.mobileDrawerTop button{min-width:48px;min-height:44px;border:1px solid rgba(67,210,255,.45);border-radius:11px;background:rgba(5,20,44,.98);color:#e9fbff;font-size:12px;font-weight:900}.mobileDrawerLinks{display:grid;gap:7px;padding-bottom:max(20px,env(safe-area-inset-bottom))}.mobileDrawerLinks a{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;border:1px solid rgba(48,187,255,.2);border-radius:9px;background:linear-gradient(145deg,rgba(8,29,60,.97),rgba(2,10,24,.97));color:#eafaff;text-decoration:none;font-weight:800;font-size:12px}.mobileDrawerLinks a span{color:#68dfff;font-size:20px}.revenue{width:min(520px,calc(100% - 20px));box-sizing:border-box;margin:12px auto 26px;padding:12px}.revenueHead{flex-direction:column}.sponsors{grid-template-columns:1fr}
   }
   @media(max-width:420px){.mobileSearchPanel{grid-template-columns:minmax(0,1fr) auto;border-radius:18px}.mobileSearchPanel button:last-child{grid-column:1/-1}.mobileOwnerHot{left:78%;width:19.5%}}

   /* Crop the fixed illustrated desktop sidebar; remapped hotspots stay clickable and aligned. */
   .sidebarCollapsed.exactStage{aspect-ratio:1.540444}
   .sidebarCollapsed .exactArtwork{left:-15.4068%;width:115.4068%;height:100%;max-width:none;object-fit:contain}
   .sidebarCollapsed .desktopSidebarMask{display:none}
   .sidebarCollapsed .cardHot{width:17.946%}
   .sidebarCollapsed .notifyHot{left:82.574%;width:3%}
   .sidebarCollapsed .accountHot{left:85.804%;width:13.16%}
   .sidebarCollapsed .tutorialHot{left:82.228%;width:12.93%}
   .sidebarCollapsed .platformGuideHot{left:26.37%;width:35.55%}
   .sidebarCollapsed .guidedTourHot{left:66.30%;width:31.62%}
   .sidebarCollapsed .searchHot{left:65.15%;width:16.79%}
   .sidebarCollapsed .brandHot{left:1%;width:10%}
   .desktopSidebarToggle{box-shadow:0 0 14px rgba(61,214,255,.42),inset 0 1px rgba(255,241,192,.45);transition:left .25s ease,background .25s ease}
   .desktopSidebarToggle.collapsed{background:linear-gradient(140deg,#074b83,#07122b);border:2px solid #e9c16e;color:#fff2bc;box-shadow:0 0 20px rgba(70,211,255,.46)}
   /* Illustrated mobile drawer using the same scene artwork as each linked page. */
   @media(max-width:1024px){
    .mobileDrawer{background:radial-gradient(ellipse at 85% 0%,rgba(52,165,255,.25),transparent 48%),linear-gradient(170deg,#061b40,#010916 78%);border-right:2px solid #e6c16e}
    .mobileDrawerLinks a{min-height:60px;display:grid;grid-template-columns:53px minmax(0,1fr) 18px;gap:9px;padding:6px 9px;border-color:rgba(230,187,100,.55);border-radius:12px;background:linear-gradient(115deg,rgba(9,46,91,.93),rgba(4,15,38,.96));box-shadow:inset 0 1px rgba(255,241,191,.18),0 4px 14px rgba(0,0,0,.18);transition:transform .2s ease,border-color .2s ease}
    .mobileDrawerLinks a:hover,.mobileDrawerLinks a:focus-visible{transform:translateX(2px);border-color:#77e9ff}
    .mobileDrawerIcon{display:block;width:49px;height:44px;position:relative;overflow:hidden;border:1px solid #efc46d;border-radius:9px;background:#05152d;box-shadow:0 0 12px rgba(78,200,255,.28)}
    .mobileDrawerIcon img{width:100%;height:100%;display:block;object-fit:cover;filter:saturate(1.25);transition:transform .3s ease}
    .mobileDrawerLinks a:hover .mobileDrawerIcon img{transform:scale(1.1)}
    .mobileDrawerLinks a .mobileDrawerTitle{min-width:0;color:#f8f3e5;font-weight:850;font-size:12px;line-height:1.3;overflow-wrap:anywhere}
    .mobileDrawerLinks a .mobileDrawerChevron{color:#80eaff;font-size:22px}
    .mobileDrawerBrand{color:#ffdda0}
   }
   @media(prefers-reduced-motion:reduce){.desktopSidebarToggle,.mobileDrawerLinks a,.mobileDrawerIcon img{transition:none!important;animation:none!important;transform:none!important}}
   @media(prefers-reduced-motion:reduce){.mobileDrawer{transition:none}}
  `}</style>
  <style jsx global>{`
   html[data-iam-shell="true"],html[data-iam-shell="true"] body{margin:0!important;width:100%!important;min-width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:#020713!important}html[data-iam-shell="true"] .iam-shell-content{margin:0!important;margin-left:0!important;padding:0!important;padding-top:0!important;width:100vw!important;max-width:none!important;min-height:100vh!important;min-height:100dvh!important;overflow:visible!important;transition:none!important}html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
  `}</style>
 </main>
}
