'use client';
import {CSSProperties,FormEvent,useEffect,useRef,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Ad={id:number;title:string;url:string;label:string;placement:string;active:number};
type AdConfig={adsense_configured:boolean;adsense_client_id:string|null;adsense_home_slot:string|null;auto_ads_ready:boolean};
type LinkItem={label:string;href:string};
type CropLinkProps={key?:string;label:string;href:string;left:number;top:number;width:number;height:number;className?:string;tabIndex?:number;onClick?:()=>void};

const kids='https://harmonic-data-52yyzau.shipstatic.com/';
const sideLinks:LinkItem[]=[
 {label:'Home',href:'/'},{label:'AI Command',href:'/ai-chat'},{label:'Opportunity Vault',href:'/opportunity-vault'},{label:'CRM',href:'/crm'},{label:'Travel Agency',href:'/travel-agency'},
 {label:'Magnanimous Kids',href:kids},{label:'AI Business',href:'/business-ai'},{label:'Launch Magnanimous',href:'/business-plan'},{label:'Video Studio',href:'/video-studio'},{label:'Social Studio',href:'/social-media'},
 {label:'AI Receptionist',href:'/ai-receptionist'},{label:'Virtual Assistant',href:'/virtual-assistant'},{label:'Knowledge Center',href:'/knowledge'},{label:'Professional Business',href:'/professional'},{label:'Routines',href:'/routine-studio'},
 {label:'Connected',href:'/connections'},{label:'Reports',href:'/activity'},{label:'Movie Maker',href:'/movie-maker'},{label:'AI Tools & More',href:'/ai-apps'},{label:'Creator Growth',href:'/creator-growth'},{label:'White Label',href:'/white-label'},{label:'Settings',href:'/account'}
];
const cardLinks=[...sideLinks.filter(item=>item.label!=='Creator Growth'&&item.label!=='White Label')];
const mobileReferenceCards:LinkItem[]=[
 {label:'Video Studio',href:'/video-studio'},{label:'White Label',href:'/white-label'},
 {label:'Creator Studio',href:'/studio'},{label:'Growth',href:'/creator-growth'},
 {label:'Opportunity Vault',href:'/opportunity-vault'},{label:'Knowledge Center',href:'/knowledge'},
 {label:'Routines',href:'/routine-studio'},{label:'AI Receptionist',href:'/ai-receptionist'},
 {label:'Connected',href:'/connections'},{label:'Professional Business',href:'/professional'},
 {label:'Launch Magnanimous',href:'/business-plan'},{label:'AI Business',href:'/business-ai'},
 {label:'Command',href:'/ai-chat'},{label:'Social Studio',href:'/social-media'},
 {label:'Virtual Assistant',href:'/virtual-assistant'},{label:'Reports',href:'/activity'}
];
const topLinks=[
 {label:'Faith',href:'/ai-chat?prompt=Open%20my%20faith%20and%20ministry%20resources',left:37.1,width:4.5},
 {label:'Family',href:'/ai-chat?prompt=Open%20my%20family%20resources',left:42.1,width:5.0},
 {label:'Business',href:'/business',left:47.6,width:5.8},
 {label:'Opportunity',href:'/opportunity-vault',left:53.9,width:7.4},
 {label:'Global Impact',href:'/ai-chat?prompt=Show%20my%20global%20impact%20and%20service%20tools',left:61.8,width:7.8}
];

function cropStyle(left:number,top:number,width:number,height:number):CSSProperties{
 return {
  aspectRatio:String((width*16)/(height*9)),
  ['--crop-image-width' as string]:`${10000/width}%`,
  ['--crop-image-height' as string]:`${10000/height}%`,
  ['--crop-image-left' as string]:`${-(left/width)*100}%`,
  ['--crop-image-top' as string]:`${-(top/height)*100}%`
 } as CSSProperties;
}

function ArtworkCrop({label,href,left,top,width,height,className='',tabIndex,onClick}:CropLinkProps){
 return <a className={`artCrop ${className}`} href={href} aria-label={label} style={cropStyle(left,top,width,height)} tabIndex={tabIndex} onClick={onClick}>
  <img src="/crm-upgrade.jpeg" alt="" aria-hidden="true" draggable={false}/><span>{label}</span>
 </a>;
}

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{}}}
async function safeJson(url:string){try{return await fetch(url).then(read)}catch{return{}}}

export default function Home(){
 const[query,setQuery]=useState('');
 const[ads,setAds]=useState<Ad[]>([]);
 const[adConfig,setAdConfig]=useState<AdConfig>({adsense_configured:false,adsense_client_id:null,adsense_home_slot:null,auto_ads_ready:false});
 const[ready,setReady]=useState(false),[online,setOnline]=useState(false),[menuOpen,setMenuOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false),[sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const mobileMenuButtonRef=useRef<HTMLButtonElement|null>(null),mobileDrawerCloseRef=useRef<HTMLButtonElement|null>(null),mobileSearchInputRef=useRef<HTMLInputElement|null>(null),menuWasOpenRef=useRef(false);
 useEffect(()=>{(async()=>{const[health,t,a,mc]=await Promise.all([safeJson(`${api}/health`),safeJson(`${api}/api/tools`),safeJson(`${api}/api/ads?placement=home`),safeJson(`${api}/api/monetization/config`)]);setOnline(health?.status==='ok'&&Array.isArray(t.tools));setAds(a.ads||[]);setAdConfig({adsense_configured:!!mc.adsense_configured,adsense_client_id:mc.adsense_client_id||null,adsense_home_slot:mc.adsense_home_slot||null,auto_ads_ready:!!mc.auto_ads_ready});setReady(true)})()},[]);
 useEffect(()=>{try{setSidebarCollapsed(localStorage.getItem('iam_home_sidebar_collapsed')==='1')}catch{}},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMenuOpen(false);setSearchOpen(false)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 useEffect(()=>{if(!menuOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[menuOpen]);
 useEffect(()=>{const background=[...document.querySelectorAll<HTMLElement>('.mobileExactStage,.revenue')];background.forEach(node=>menuOpen?node.setAttribute('inert',''):node.removeAttribute('inert'));if(menuOpen){menuWasOpenRef.current=true;requestAnimationFrame(()=>mobileDrawerCloseRef.current?.focus())}else if(menuWasOpenRef.current){menuWasOpenRef.current=false;requestAnimationFrame(()=>mobileMenuButtonRef.current?.focus())}return()=>background.forEach(node=>node.removeAttribute('inert'))},[menuOpen]);
 useEffect(()=>{if(searchOpen)requestAnimationFrame(()=>mobileSearchInputRef.current?.focus())},[searchOpen]);
 useEffect(()=>{const client=adConfig.adsense_client_id;if(!client)return;const existing=document.querySelector('script[data-iam-adsense="true"]') as HTMLScriptElement|null;const requestAd=()=>{if(!adConfig.adsense_home_slot)return;try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}};if(existing){requestAd();return}const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;script.dataset.iamAdsense='true';script.onload=requestAd;document.head.appendChild(script)},[adConfig.adsense_client_id,adConfig.adsense_home_slot]);
 function submit(e:FormEvent){e.preventDefault();const q=query.trim();location.href=q?`/ai-chat?prompt=${encodeURIComponent(q)}`:'/ai-chat'}
 function toggleDesktopSidebar(){setSidebarCollapsed(value=>{const next=!value;try{localStorage.setItem('iam_home_sidebar_collapsed',next?'1':'0')}catch{}return next})}
 return <main className="exactHome">
  <section className={sidebarCollapsed?'exactStage desktopStage sidebarCollapsed':'exactStage desktopStage'} aria-label="I AM MAGNANIMOUS WAY AI ecosystem dashboard">
   <img className="exactArtwork" src="/crm-upgrade.jpeg" alt="I AM MAGNANIMOUS WAY AI Ecosystem dashboard" draggable={false}/>
   <a className="hot brandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
   {topLinks.map(item=><a key={item.label} className="hot topHot" style={{left:`${item.left}%`,width:`${item.width}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   <form className="searchHot" onSubmit={submit} role="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit" aria-label="Search Magnanimous AI">Search</button></form>
   <a className="hot notifyHot" href="/activity" aria-label="Open reports and notifications"><span>Reports and notifications</span></a>
   <a className="hot accountHot" href="/owner-center" aria-label="Open owner account"><span>Owner account</span></a>
   <a className="hot tutorialHot" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
   <a className="hot platformGuideHot" href="/guide" aria-label="Open platform guide"><span>Platform guide</span></a>
   <a className="hot guidedTourHot" href="/guide" aria-label="Open guided tour"><span>Guided tour</span></a>
   <nav className="srOnlyNav" aria-label="Additional platform systems"><a href={'/creator-growth'}>Creator Growth</a><a href="/white-label">White Label</a></nav>
   {!sidebarCollapsed&&cardLinks.map((item,i)=><a key={`side-${item.label}`} className="hot sideHot" style={{top:`${10.72+i*3.93}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   {cardLinks.map((item,i)=>{const col=i%5,row=Math.floor(i/5);return <a key={`card-${item.label}`} className="hot cardHot" style={{left:`${14.25+col*16.78}%`,top:`${42.2+row*13.55}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>})}
   <button className={sidebarCollapsed?'desktopSidebarToggle collapsed':'desktopSidebarToggle'} type="button" onClick={toggleDesktopSidebar} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed?'Expand sidebar menu':'Collapse sidebar menu'}><span aria-hidden="true">{sidebarCollapsed?'›':'‹'}</span></button>
   {sidebarCollapsed&&<div className="desktopSidebarMask" aria-hidden="true"/>}
   <span className="srStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
  </section>

  <section className="mobileExactStage" aria-label="I AM MAGNANIMOUS WAY mobile dashboard">
   <img className="mobileReferenceArtwork" src="/mobile-dashboard-approved.webp" alt="I AM MAGNANIMOUS WAY AI Ecosystem mobile dashboard" draggable={false}/>
   <button ref={mobileMenuButtonRef} className="mobileHot mobileMenuToggle" type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen} aria-controls="mobile-side-menu" aria-label={menuOpen?'Close sidebar menu':'Open sidebar menu'}><span>Menu</span></button>
   <a className="mobileHot mobileBrandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
   <button className="mobileHot mobileSearchToggle" type="button" onClick={()=>setSearchOpen(value=>!value)} aria-expanded={searchOpen} aria-controls="mobile-search-panel" aria-label="Search Magnanimous AI"><span>Search</span></button>
   <a className="mobileHot mobileNotifyHot" href="/activity" aria-label="Open notifications and reports"><span>Notifications</span></a>
   <a className="mobileHot mobileOwnerHot" href="/owner-center" aria-label="Open owner profile"><span>Owner profile</span></a>
   <a className="mobileHot mobileGuideHot" href="/ai-chat" aria-label="Open Magnanimous AI Guide"><span>Open AI Guide</span></a>
   <a className="mobileHot mobileTutorialOverlay" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
   <span className="srStatus mobileLiveStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready. All services active and protected.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
   {ready&&!online&&<div className="mobileDegradedStatus" role="status">Some live services are unavailable</div>}
   {searchOpen&&<form id="mobile-search-panel" className="mobileSearch" onSubmit={submit} role="search"><input ref={mobileSearchInputRef} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit">Search</button><button type="button" onClick={()=>setSearchOpen(false)} aria-label="Close search">Close</button></form>}
   <div className="mobileCardGrid" aria-label="Platform apps">
    {mobileReferenceCards.map(item=><a key={`mobile-card-${item.label}`} className="mobileReferenceCardHot" href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>)}
   </div>
   <nav className="mobileBottomNav" aria-label="Mobile dashboard navigation">
    <a href="/" aria-label="Home"><span>Home</span></a>
    <a href="/ai-chat" aria-label="AI Command"><span>AI Command</span></a>
    <a href="/opportunity-vault" aria-label="Opportunity"><span>Opportunity</span></a>
    <a href="/crm" aria-label="CRM"><span>CRM</span></a>
    <button type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen} aria-controls="mobile-side-menu" aria-label="More"><span>More</span></button>
   </nav>
  </section>

  {menuOpen&&<button className="mobileDrawerBackdrop" type="button" tabIndex={-1} aria-label="Close sidebar menu" onClick={()=>setMenuOpen(false)}/>}
  <aside id="mobile-side-menu" className={menuOpen?'mobileDrawer open':'mobileDrawer'} aria-hidden={!menuOpen}>
   <div className="mobileDrawerTop">
    <ArtworkCrop label="I AM MAGNANIMOUS WAY home" href="/" left={.6} top={.6} width={20.2} height={8.6} className="drawerBrandCrop" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}/>
    <button ref={mobileDrawerCloseRef} type="button" onClick={()=>setMenuOpen(false)} aria-label="Close sidebar menu" tabIndex={menuOpen?0:-1}>Close</button>
   </div>
   <nav className="mobileDrawerLinks" aria-label="Sidebar navigation">
    {sideLinks.map(item=><a key={`drawer-${item.label}`} className="mobileDrawerLink" href={item.href} tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>{item.label}</a>)}
   </nav>
  </aside>

  {(ads.length>0||adConfig.adsense_configured)&&<section className="revenue" aria-label="Sponsored advertising"><div className="revenueHead"><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<div className="sponsors">{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</div>}{adConfig.adsense_configured&&<div className="adsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  <style jsx global>{`
   .exactHome{margin:0;width:100%;min-height:100vh;min-height:100dvh;overflow-x:clip;background:#020713;color:#eefaff;font-family:Inter,system-ui,sans-serif}.exactStage{position:relative;width:min(100%,1920px,calc(100dvh * 16 / 9));aspect-ratio:16/9;margin:0 auto;overflow:hidden;background:#020713}.exactArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain;user-select:none;-webkit-user-drag:none}.hot{position:absolute;z-index:4;display:block;background:transparent;text-decoration:none;cursor:pointer;border:0;border-radius:8px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.hot span,.mobileHot span,.mobileReferenceCardHot span,.mobileBottomNav span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.hot:focus-visible,.searchHot:focus-within,.desktopSidebarToggle:focus-visible,.mobileHot:focus-visible,.mobileReferenceCardHot:focus-visible,.mobileBottomNav a:focus-visible,.mobileBottomNav button:focus-visible,.mobileSearch:focus-within{outline:3px solid #f5c868;outline-offset:-3px;box-shadow:0 0 22px rgba(94,231,255,.42)}.brandHot{left:.7%;top:.8%;width:19.2%;height:8.7%}.topHot{top:2.25%;height:5.3%}.notifyHot{left:84.9%;top:1.45%;width:2.6%;height:6%}.accountHot{left:87.7%;top:.9%;width:11.4%;height:7.3%}.tutorialHot{left:84.6%;top:27.2%;width:11.2%;height:5.1%}.platformGuideHot{left:36.2%;top:84.1%;width:30.8%;height:6.6%}.guidedTourHot{left:70.8%;top:88.5%;width:27.4%;height:6.3%}.sideHot{left:.75%;width:12.2%;height:3.55%;border-radius:6px}.cardHot{width:15.55%;height:11.85%;border-radius:12px}.searchHot{position:absolute;z-index:6;left:69.8%;top:2.05%;width:14.55%;height:5.15%;margin:0;touch-action:manipulation}.searchHot input{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:1px solid rgba(61,214,255,.44);border-radius:999px;padding:0 clamp(10px,2vw,31px) 0 clamp(6px,1vw,14px);background:rgba(4,15,35,.93);color:#eafaff;font:600 clamp(8px,1.1vw,12px) Inter,system-ui,sans-serif;outline:none}.searchHot input::placeholder{color:#7f9daf;opacity:.85}.searchHot button{position:absolute;right:5%;top:17%;width:16%;height:66%;border:0;background:transparent;color:transparent;cursor:pointer}.srOnlyNav{position:absolute;left:0;top:0;z-index:8;transform:translateY(-140%);background:#020713;padding:6px 10px;border-radius:0 0 8px 0}.srOnlyNav:focus-within{transform:translateY(0)}.srOnlyNav a{color:#eefaff;font-weight:700;text-decoration:none;margin-right:10px}.srStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.desktopSidebarToggle{position:absolute;z-index:10;left:11.55%;top:9.95%;width:2.5%;aspect-ratio:1;border:1px solid rgba(82,222,255,.7);border-radius:999px;background:rgba(2,10,25,.82);color:#bdf6ff;font-size:clamp(13px,1.2vw,20px);line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}.desktopSidebarToggle.collapsed{left:.65%;top:10.2%}.desktopSidebarMask{position:absolute;z-index:3;left:0;top:8.9%;bottom:0;width:13.35%;background:linear-gradient(90deg,#020713 0%,#020713 82%,rgba(2,7,19,.94) 100%);border-right:1px solid rgba(45,190,255,.24);pointer-events:none}
   .mobileExactStage,.mobileDrawer,.mobileDrawerBackdrop{display:none}.artCrop{position:relative;overflow:hidden;display:block;background:#020713;text-decoration:none;border-radius:9px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.artCrop img{position:absolute;display:block;max-width:none;width:var(--crop-image-width);height:var(--crop-image-height);left:var(--crop-image-left);top:var(--crop-image-top);user-select:none;-webkit-user-drag:none;pointer-events:none}.artCrop span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.revenue{margin:18px auto 34px;width:min(1100px,calc(100% - 32px));padding:16px;border:1px solid rgba(79,204,255,.22);border-radius:18px;background:rgba(5,18,38,.9);box-shadow:0 18px 55px rgba(0,0,0,.3)}.revenueHead{display:flex;justify-content:space-between;gap:12px;color:#789bad;font-size:9px;letter-spacing:.12em}.sponsors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.sponsors a{border:1px solid #254e6d;padding:10px;border-radius:10px;color:#dff9ff;text-decoration:none;display:grid;gap:4px}.sponsors small{color:#77a1b9}.adsense{margin-top:12px}
   @media(max-width:1024px){
    .desktopStage{display:none!important}.mobileExactStage{display:block;position:relative;width:100%;max-width:720px;height:max(100dvh,calc(100vw * 1672 / 941));max-height:calc(720px * 1672 / 941);margin:0 auto;overflow:hidden;background:#020713;isolation:isolate}.mobileReferenceArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none;pointer-events:none}.mobileHot{position:absolute;z-index:5;border:0;background:transparent;padding:0;cursor:pointer;text-decoration:none;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.2)}.mobileMenuToggle{left:1.3%;top:.4%;width:8.7%;height:5.2%;border-radius:14px}.mobileBrandHot{left:10.5%;top:.2%;width:45%;height:5.3%;border-radius:8px}.mobileSearchToggle{left:62.7%;top:.5%;width:8.8%;height:4.8%;border-radius:999px}.mobileNotifyHot{left:72.2%;top:.4%;width:7.5%;height:5%;border-radius:999px}.mobileOwnerHot{left:80.2%;top:.3%;width:18.5%;height:5.2%;border-radius:999px}.mobileGuideHot{left:53%;top:6.1%;width:22%;height:19.2%;border-radius:18px}.mobileTutorialOverlay{position:absolute;z-index:7;left:76.4%;top:18.1%;width:20.4%;height:6.7%;border-radius:14px;cursor:pointer;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.mobileTutorialOverlay span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.mobileCardGrid{position:absolute;z-index:6;left:4.55%;right:4.55%;top:29.2%;height:62.65%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));column-gap:1.65%;row-gap:.62%;pointer-events:none}.mobileReferenceCardHot{position:relative;display:block;min-width:0;min-height:0;border-radius:12px;text-decoration:none;background:transparent;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.mobileBottomNav{position:absolute;z-index:8;left:2.45%;right:2.45%;bottom:.65%;height:6.45%;display:grid;grid-template-columns:repeat(5,1fr);align-items:stretch}.mobileBottomNav a,.mobileBottomNav button{position:relative;display:block;width:100%;height:100%;border:0;background:transparent;padding:0;text-decoration:none;cursor:pointer;border-radius:11px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.mobileSearch{position:absolute;z-index:30;left:8%;right:8%;top:5.8%;display:flex;gap:7px;padding:9px;border:1px solid rgba(78,215,255,.72);border-radius:16px;background:rgba(2,8,23,.98);box-shadow:0 16px 45px rgba(0,0,0,.65),0 0 24px rgba(39,165,255,.28)}.mobileSearch input{min-width:0;flex:1;border:1px solid rgba(82,210,255,.4);border-radius:10px;background:#06142b;color:#effcff;padding:10px 12px;font:700 16px Inter,system-ui,sans-serif;outline:none}.mobileSearch button{border:1px solid rgba(245,200,104,.55);border-radius:10px;background:#081b38;color:#fff3ca;padding:8px 11px;font-weight:800}.mobileDegradedStatus{position:absolute;z-index:9;left:23%;right:23%;top:25.1%;padding:4px 7px;border:1px solid rgba(255,190,75,.75);border-radius:999px;background:rgba(18,8,2,.92);color:#ffe2ad;text-align:center;font-size:clamp(9px,2.7vw,13px);font-weight:800}.mobileDrawerBackdrop{display:block;position:fixed;inset:0;z-index:48;border:0;background:rgba(0,4,12,.72);padding:0}.mobileDrawer{display:block;position:fixed;z-index:49;left:0;top:0;bottom:0;width:min(84vw,340px);padding:10px;background:linear-gradient(180deg,#020713,#05142a);border-right:1px solid rgba(67,210,255,.42);box-shadow:20px 0 60px rgba(0,0,0,.7),0 0 30px rgba(0,142,255,.16);overflow-y:auto;transform:translateX(-104%);transition:transform .2s ease}.mobileDrawer.open{transform:translateX(0)}.mobileDrawerTop{position:sticky;top:-10px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:9px;padding:10px 0;background:#020713}.drawerBrandCrop{width:220px;border-radius:7px}.mobileDrawerTop button{min-width:48px;min-height:48px;border:1px solid rgba(67,210,255,.5);border-radius:11px;background:rgba(5,20,44,.98);color:#e9fbff;font-size:12px;font-weight:900}.mobileDrawerLinks{display:grid;gap:7px;padding-bottom:max(24px,env(safe-area-inset-bottom))}.mobileDrawerLink{display:flex;align-items:center;min-height:46px;padding:0 14px;border:1px solid rgba(48,187,255,.24);border-radius:10px;background:linear-gradient(100deg,rgba(10,50,98,.9),rgba(4,13,32,.96));color:#ecfbff;text-decoration:none;font-weight:800;box-shadow:inset 0 0 18px rgba(0,125,255,.08)}.revenueHead{flex-direction:column}.sponsors{grid-template-columns:1fr}.exactHome:after{content:"";display:block;height:max(18px,env(safe-area-inset-bottom));background:#020713}
   }
   @media(max-width:420px){.mobileDrawer{width:min(88vw,340px)}.mobileSearch{left:4%;right:4%}.mobileReferenceCardHot{border-radius:9px}}
   @media(orientation:landscape) and (max-height:600px) and (max-width:1000px){.desktopStage{display:none!important}.mobileExactStage{display:block;height:max(100dvh,calc(100vw * 1672 / 941));max-height:none}}
   @media(prefers-reduced-motion:reduce){.mobileDrawer{transition:none}}
  `}</style>
  <style jsx global>{`
   html[data-iam-shell="true"],html[data-iam-shell="true"] body{margin:0!important;width:100%!important;min-width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:#020713!important}html[data-iam-shell="true"] .iam-shell-content{margin:0!important;margin-left:0!important;padding:0!important;padding-top:0!important;width:100vw!important;max-width:none!important;min-height:100vh!important;min-height:100dvh!important;overflow:visible!important;transition:none!important}html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
  `}</style>
 </main>
}
