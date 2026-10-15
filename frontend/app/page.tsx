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

const mobileCards=[
 {label:'Video Studio',href:'/video-studio',sourceIndex:8,tone:0},
 {label:'White Label',href:'/white-label',sourceIndex:18,tone:1},
 {label:'Creator Studio',href:'/creator-growth',sourceIndex:17,tone:1},
 {label:'Growth',href:'/creator-growth',sourceIndex:16,tone:3},
 {label:'Opportunity Vault',href:'/opportunity-vault',sourceIndex:2,tone:2},
 {label:'Knowledge Center',href:'/knowledge',sourceIndex:12,tone:0},
 {label:'Routines',href:'/routine-studio',sourceIndex:14,tone:1},
 {label:'AI Receptionist',href:'/ai-receptionist',sourceIndex:10,tone:3},
 {label:'Connected',href:'/connections',sourceIndex:15,tone:2},
 {label:'Professional Business',href:'/professional',sourceIndex:13,tone:0},
 {label:'Launch Magnanimous',href:'/business-plan',sourceIndex:7,tone:3},
 {label:'AI Business',href:'/business-ai',sourceIndex:6,tone:2},
 {label:'Command',href:'/ai-chat',sourceIndex:1,tone:1},
 {label:'Social Studio',href:'/social-media',sourceIndex:9,tone:1},
 {label:'Virtual Assistant',href:'/virtual-assistant',sourceIndex:11,tone:0},
 {label:'Reports',href:'/activity',sourceIndex:16,tone:0}
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
 const mobileMenuButtonRef=useRef<HTMLButtonElement|null>(null),mobileDrawerCloseRef=useRef<HTMLButtonElement|null>(null),menuWasOpenRef=useRef(false);
 useEffect(()=>{(async()=>{const[health,t,a,mc]=await Promise.all([safeJson(`${api}/health`),safeJson(`${api}/api/tools`),safeJson(`${api}/api/ads?placement=home`),safeJson(`${api}/api/monetization/config`)]);setOnline(health?.status==='ok'&&Array.isArray(t.tools));setAds(a.ads||[]);setAdConfig({adsense_configured:!!mc.adsense_configured,adsense_client_id:mc.adsense_client_id||null,adsense_home_slot:mc.adsense_home_slot||null,auto_ads_ready:!!mc.auto_ads_ready});setReady(true)})()},[]);
 useEffect(()=>{try{setSidebarCollapsed(localStorage.getItem('iam_home_sidebar_collapsed')==='1')}catch{}},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 useEffect(()=>{if(!menuOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[menuOpen]);
 useEffect(()=>{const background=[...document.querySelectorAll<HTMLElement>('.mobileExactStage,.revenue')];background.forEach(node=>menuOpen?node.setAttribute('inert',''):node.removeAttribute('inert'));if(menuOpen){menuWasOpenRef.current=true;requestAnimationFrame(()=>mobileDrawerCloseRef.current?.focus())}else if(menuWasOpenRef.current){menuWasOpenRef.current=false;requestAnimationFrame(()=>mobileMenuButtonRef.current?.focus())}return()=>background.forEach(node=>node.removeAttribute('inert'))},[menuOpen]);
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
   <nav className="srOnlyNav" aria-label="Additional platform systems"><a href={'/creator-growth'}>Creator Growth</a></nav>
   {!sidebarCollapsed&&sideLinks.map((item,i)=><a key={`side-${item.label}`} className="hot sideHot" style={{top:`${10.72+i*3.93}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   {cardLinks.map((item,i)=>{const col=i%5,row=Math.floor(i/5);return <a key={`card-${item.label}`} className="hot cardHot" style={{left:`${14.25+col*16.78}%`,top:`${42.2+row*13.55}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>})}
   <button className={sidebarCollapsed?'desktopSidebarToggle collapsed':'desktopSidebarToggle'} type="button" onClick={toggleDesktopSidebar} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed?'Expand sidebar menu':'Collapse sidebar menu'}><span aria-hidden="true">{sidebarCollapsed?'›':'‹'}</span></button>
   {sidebarCollapsed&&<div className="desktopSidebarMask" aria-hidden="true"/>}
   <span className="srStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
  </section>

  <section className="mobileExactStage" aria-label="I AM MAGNANIMOUS WAY mobile dashboard">
   <header className="mobileTopbar">
    <button ref={mobileMenuButtonRef} className="mobileMenuToggle" type="button" onClick={()=>setMenuOpen(value=>!value)} aria-expanded={menuOpen} aria-controls="mobile-side-menu" aria-label={menuOpen?'Close sidebar menu':'Open sidebar menu'}><span className="hamburgerIcon" aria-hidden="true"><i/><i/><i/></span></button>
    <ArtworkCrop label="I AM MAGNANIMOUS WAY home" href="/" left={.6} top={.6} width={20.2} height={8.6} className="mobileBrandCrop"/>
    <div className="mobileTopActions">
     <button className="mobileHeaderSearchToggle" type="button" onClick={()=>setSearchOpen(value=>!value)} aria-expanded={searchOpen} aria-controls="mobile-search-panel" aria-label={searchOpen?'Close search':'Open search'}><span aria-hidden="true">⌕</span></button>
     <a className="mobileNotifications" href="/activity" aria-label="Open reports and notifications"><span aria-hidden="true">●</span></a>
     <ArtworkCrop label="Open owner account" href="/owner-center" left={86.9} top={.4} width={3.7} height={6.2} className="mobileOwnerCrop"/>
    </div>
   </header>
   {searchOpen&&<form id="mobile-search-panel" className="mobileSearch mobileSearchPanel" onSubmit={submit} role="search"><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit" aria-label="Search Magnanimous AI">Search</button></form>}
   <div className="mobileHeroFrame">
    <img className="mobileHeroArtwork" src="/crm-upgrade.jpeg" alt="I AM MAGNANIMOUS WAY AI ecosystem" draggable={false}/>
    <div className="mobileHeroShade" aria-hidden="true"/>
    <div className="mobileGuidePanel"><b>Hi!</b><span>I’m your AI Guide.</span><small>Explore everything inside your platform.</small><a href="/guide">▶ Tutorial</a></div>
   </div>
   <div className="mobileStatusStrip" role="status" aria-live="polite">
    <span className={ready&&online?'ok':'checking'}>✓ AI Online</span>
    <span className={ready&&online?'ok':'checking'}>✓ Systems Ready</span>
    <span className={ready&&online?'ok':'checking'}>✓ Services Active</span>
    <span>◇ Protected Access</span>
   </div>
   <div className="mobileCardGrid" aria-label="Platform apps">
    {mobileCards.map(item=>{const i=item.sourceIndex,col=i%5,row=Math.floor(i/5);return <a key={`mobile-card-${item.label}`} className={`mobilePremiumCard mobileAccent${item.tone}`} href={item.href} aria-label={`Open ${item.label}`}><div className="mobileCardArt" style={cropStyle(14.25+col*16.78,42.2+row*13.55,15.55,11.85)} aria-hidden="true"><img src="/crm-upgrade.jpeg" alt="" draggable={false}/></div><span className="mobileCardTitle">{item.label}</span><span className="mobileCardArrow" aria-hidden="true">›</span></a>})}
   </div>
   <nav className="mobileBottomNav" aria-label="Mobile quick navigation">
    <a href="/" aria-current="page"><span aria-hidden="true">⌂</span><b>Home</b></a>
    <a href="/ai-chat"><span aria-hidden="true">▣</span><b>AI Command</b></a>
    <a href="/opportunity-vault"><span aria-hidden="true">◇</span><b>Opportunity</b></a>
    <a href="/crm"><span aria-hidden="true">♙</span><b>CRM</b></a>
    <button type="button" onClick={()=>setMenuOpen(true)} aria-label="Open more navigation"><span aria-hidden="true">▦</span><b>More</b></button>
   </nav>
  </section>

  {menuOpen&&<button className="mobileDrawerBackdrop" type="button" tabIndex={-1} aria-label="Close sidebar menu" onClick={()=>setMenuOpen(false)}/>}
  <aside id="mobile-side-menu" className={menuOpen?'mobileDrawer open':'mobileDrawer'} aria-hidden={!menuOpen}>
   <div className="mobileDrawerTop">
    <ArtworkCrop label="I AM MAGNANIMOUS WAY home" href="/" left={.6} top={.6} width={20.2} height={8.6} className="drawerBrandCrop" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}/>
    <button ref={mobileDrawerCloseRef} type="button" onClick={()=>setMenuOpen(false)} aria-label="Close sidebar menu" tabIndex={menuOpen?0:-1}>Close</button>
   </div>
   <nav className="mobileDrawerLinks" aria-label="Sidebar navigation">
    {sideLinks.map(item=><a key={`drawer-${item.label}`} className="mobileDrawerLink" href={item.href} tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>{item.label}</a>) }
    <a className="mobileDrawerExtra" href="/creator-growth" tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>Creator Growth</a>
   </nav>
  </aside>

  {(ads.length>0||adConfig.adsense_configured)&&<section className="revenue" aria-label="Sponsored advertising"><div className="revenueHead"><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<div className="sponsors">{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</div>}{adConfig.adsense_configured&&<div className="adsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  <style jsx global>{`
   .exactHome{margin:0;width:100%;min-height:100vh;min-height:100dvh;overflow-x:clip;background:#020713;color:#eefaff;font-family:Inter,system-ui,sans-serif}.exactStage{position:relative;width:min(100%,1920px,calc(100dvh * 16 / 9));aspect-ratio:16/9;margin:0 auto;overflow:hidden;background:#020713}.exactArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain;user-select:none;-webkit-user-drag:none}.hot{position:absolute;z-index:4;display:block;background:transparent;text-decoration:none;cursor:pointer;border:0;border-radius:8px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.hot span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.hot:focus-visible,.searchHot:focus-within,.desktopSidebarToggle:focus-visible,.mobileMenuToggle:focus-visible,.artCrop:focus-visible,.mobileSearch:focus-within{outline:2px solid #5ee7ff;outline-offset:-2px;box-shadow:0 0 20px rgba(94,231,255,.38)}.brandHot{left:.7%;top:.8%;width:19.2%;height:8.7%}.topHot{top:2.25%;height:5.3%}.notifyHot{left:84.9%;top:1.45%;width:2.6%;height:6%}.accountHot{left:87.7%;top:.9%;width:11.4%;height:7.3%}.tutorialHot{left:84.6%;top:27.2%;width:11.2%;height:5.1%}.platformGuideHot{left:36.2%;top:84.1%;width:30.8%;height:6.6%}.guidedTourHot{left:70.8%;top:88.5%;width:27.4%;height:6.3%}.sideHot{left:.75%;width:12.2%;height:3.55%;border-radius:6px}.cardHot{width:15.55%;height:11.85%;border-radius:12px}.searchHot{position:absolute;z-index:6;left:69.8%;top:2.05%;width:14.55%;height:5.15%;margin:0;touch-action:manipulation}.searchHot input{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:1px solid rgba(61,214,255,.44);border-radius:999px;padding:0 clamp(10px,2vw,31px) 0 clamp(6px,1vw,14px);background:rgba(4,15,35,.93);color:#eafaff;font:600 clamp(8px,1.1vw,12px) Inter,system-ui,sans-serif;outline:none}.searchHot input::placeholder{color:#7f9daf;opacity:.85}.searchHot button{position:absolute;right:5%;top:17%;width:16%;height:66%;border:0;background:transparent;color:transparent;cursor:pointer}.srOnlyNav{position:absolute;left:0;top:0;z-index:8;transform:translateY(-140%);background:#020713;padding:6px 10px;border-radius:0 0 8px 0}.srOnlyNav:focus-within{transform:translateY(0)}.srOnlyNav a{color:#eefaff;font-weight:700;text-decoration:none}.srStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.desktopSidebarToggle{position:absolute;z-index:10;left:11.55%;top:9.95%;width:2.5%;aspect-ratio:1;border:1px solid rgba(82,222,255,.7);border-radius:999px;background:rgba(2,10,25,.82);color:#bdf6ff;font-size:clamp(13px,1.2vw,20px);line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}.desktopSidebarToggle.collapsed{left:.65%;top:10.2%}.desktopSidebarMask{position:absolute;z-index:3;left:0;top:8.9%;bottom:0;width:13.35%;background:linear-gradient(90deg,#020713 0%,#020713 82%,rgba(2,7,19,.94) 100%);border-right:1px solid rgba(45,190,255,.24);pointer-events:none}
   .mobileExactStage,.mobileDrawer,.mobileDrawerBackdrop{display:none}.artCrop{position:relative;overflow:hidden;display:block;background:#020713;text-decoration:none;border-radius:9px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(94,231,255,.18)}.artCrop img{position:absolute;display:block;max-width:none;width:var(--crop-image-width);height:var(--crop-image-height);left:var(--crop-image-left);top:var(--crop-image-top);user-select:none;-webkit-user-drag:none;pointer-events:none}.artCrop span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.mobileSearch{display:flex;gap:8px;margin:0 12px 12px;padding:7px;border:1px solid rgba(61,214,255,.42);border-radius:999px;background:rgba(4,15,35,.95)}.mobileSearch input{min-width:0;flex:1;border:0;background:transparent;color:#eafaff;padding:5px 9px;font:600 14px Inter,system-ui,sans-serif;outline:none}.mobileSearch input::placeholder{color:#87a5b8}.mobileSearch button{border:1px solid rgba(90,221,255,.5);border-radius:999px;background:rgba(5,31,62,.96);color:#dffaff;padding:5px 13px;font-weight:800}.revenue{margin:18px auto 34px;width:min(1100px,calc(100% - 32px));padding:16px;border:1px solid rgba(79,204,255,.22);border-radius:18px;background:rgba(5,18,38,.9);box-shadow:0 18px 55px rgba(0,0,0,.3)}.revenueHead{display:flex;justify-content:space-between;gap:12px;color:#789bad;font-size:9px;letter-spacing:.12em}.sponsors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.sponsors a{border:1px solid #254e6d;padding:10px;border-radius:10px;color:#dff9ff;text-decoration:none;display:grid;gap:4px}.sponsors small{color:#77a1b9}.adsense{margin-top:12px}
   @media(max-width:1024px){
    .desktopStage{display:none!important}
    .mobileExactStage{display:block;width:min(100vw,720px);max-width:100vw;min-height:100dvh;margin:0 auto;box-sizing:border-box;position:relative;isolation:isolate;padding:0 0 calc(78px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 0%,rgba(19,86,171,.36),transparent 42%),linear-gradient(180deg,#020914,#02050e 72%,#01040a);overflow-x:clip}
    .mobileExactStage:before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:repeating-linear-gradient(105deg,transparent 0 85px,rgba(42,151,255,.05) 86px 87px,transparent 88px 180px);animation:mobileAmbient 22s ease-in-out infinite alternate}
    .mobileTopbar{position:sticky;top:0;z-index:24;height:58px;box-sizing:border-box;display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px max(9px,env(safe-area-inset-right)) 8px max(9px,env(safe-area-inset-left));background:rgba(2,7,19,.97);border-bottom:1px solid rgba(67,210,255,.42);box-shadow:0 3px 18px rgba(0,157,255,.22);backdrop-filter:blur(14px)}
    .mobileMenuToggle,.mobileHeaderSearchToggle,.mobileNotifications{min-width:44px;min-height:44px;border:1px solid rgba(69,215,255,.55);border-radius:13px;background:linear-gradient(180deg,rgba(8,37,77,.98),rgba(2,13,32,.98));color:#e7fbff;display:grid;place-items:center;padding:0;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 14px rgba(0,145,255,.16);cursor:pointer}
    .hamburgerIcon{width:22px;display:grid;gap:4px}.hamburgerIcon i{height:2px;border-radius:2px;background:#e9fbff;box-shadow:0 0 6px #36bfff}
    .mobileBrandCrop{min-width:0;width:100%;max-width:190px;height:42px;border-radius:7px;justify-self:start}
    .mobileTopActions{display:flex;align-items:center;gap:6px}.mobileHeaderSearchToggle span{font-size:29px;line-height:1;transform:rotate(-20deg)}.mobileNotifications{position:relative;font-size:10px}.mobileNotifications:after{content:"";position:absolute;right:8px;top:7px;width:7px;height:7px;border-radius:50%;background:#ff8b20;box-shadow:0 0 8px #ff9c36}.mobileOwnerCrop{width:42px;height:42px;border-radius:50%;border:1px solid rgba(103,214,255,.45)}
    .mobileSearchPanel{position:sticky;top:58px;z-index:23;margin:0;padding:8px 10px;border-radius:0;background:rgba(2,8,20,.98);border:0;border-bottom:1px solid rgba(61,214,255,.35)}
    .mobileHeroFrame{position:relative;height:168px;margin:7px 8px 5px;overflow:hidden;border:1px solid rgba(71,195,255,.42);border-radius:17px;background:#030a18;box-shadow:inset 0 0 30px rgba(0,128,255,.12),0 0 24px rgba(0,117,255,.22)}
    .mobileHeroArtwork{position:absolute;left:-14%;top:-10%;width:120%;height:120%;object-fit:cover;object-position:66% 18%;filter:saturate(1.16) contrast(1.05);user-select:none;-webkit-user-drag:none}.mobileHeroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,5,16,.18) 0%,transparent 48%,rgba(0,5,16,.16) 100%);pointer-events:none}
    .mobileGuidePanel{position:absolute;right:7px;top:10px;width:35%;min-height:126px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;padding:9px 8px;border:1px solid rgba(255,196,80,.88);border-radius:15px;background:linear-gradient(160deg,rgba(10,25,56,.94),rgba(3,11,29,.92));color:#f5fbff;text-shadow:0 1px 8px #000;box-shadow:0 0 18px rgba(255,168,42,.28),inset 0 0 18px rgba(27,105,255,.15)}.mobileGuidePanel b{font-size:16px}.mobileGuidePanel span{font-size:11px;font-weight:800}.mobileGuidePanel small{font-size:9px;line-height:1.22;opacity:.92}.mobileGuidePanel a{margin-top:auto;display:grid;place-items:center;min-height:34px;border:1px solid #2bd6ff;border-radius:999px;background:rgba(0,83,175,.8);color:#fff;text-decoration:none;font-size:10px;font-weight:900;box-shadow:0 0 13px rgba(0,179,255,.45)}
    .mobileStatusStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:0 8px 7px}.mobileStatusStrip span{min-width:0;min-height:30px;display:flex;align-items:center;justify-content:center;padding:3px 4px;border:1px solid rgba(41,209,255,.42);border-radius:999px;background:rgba(4,23,48,.94);color:#dffaff;font-size:clamp(8px,2.15vw,10px);font-weight:800;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 0 10px rgba(0,186,255,.16)}.mobileStatusStrip span.ok{border-color:rgba(0,229,189,.75);color:#d8fff4}.mobileStatusStrip span.checking{opacity:.75}
    .mobileCardGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:2px 8px 10px;align-items:stretch}.mobilePremiumCard{--accent:#14baff;--tint:rgba(0,132,255,.26);--glow:rgba(0,152,255,.32);position:relative;min-width:0;height:62px;overflow:hidden;display:flex;align-items:flex-end;isolation:isolate;border:1px solid var(--accent);border-radius:14px;text-decoration:none;color:#f5fbff;background:radial-gradient(ellipse at 45% 25%,var(--tint),transparent 75%),linear-gradient(160deg,#10264a 0%,#03091b 80%);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -8px 22px var(--tint),0 5px 16px rgba(0,0,0,.46),0 0 10px var(--glow);transition:transform .16s ease,box-shadow .16s ease;touch-action:manipulation}.mobilePremiumCard:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.12) 48%,transparent 59%);transform:translateX(-130%);animation:mobileShimmer 9s linear infinite}.mobilePremiumCard:after{content:"";position:absolute;inset:44% 0 0;z-index:1;background:linear-gradient(transparent,rgba(1,5,15,.82));pointer-events:none}.mobilePremiumCard:active{transform:scale(.975)}.mobilePremiumCard:focus-visible{outline:3px solid #fff;outline-offset:3px}.mobileAccent0{--accent:#14baff;--tint:rgba(0,132,255,.28);--glow:rgba(0,152,255,.32)}.mobileAccent1{--accent:#c63aff;--tint:rgba(147,15,255,.28);--glow:rgba(172,47,255,.32)}.mobileAccent2{--accent:#00dfd4;--tint:rgba(0,220,195,.22);--glow:rgba(0,220,195,.27)}.mobileAccent3{--accent:#ffbf49;--tint:rgba(255,161,12,.23);--glow:rgba(255,179,36,.30)}
    .mobileCardArt{position:absolute;inset:0;overflow:hidden;filter:saturate(1.25) contrast(1.08)}.mobileCardArt img{position:absolute;max-width:none;width:var(--crop-image-width);height:var(--crop-image-height);left:var(--crop-image-left);top:var(--crop-image-top);pointer-events:none;user-select:none;-webkit-user-drag:none}.mobileCardTitle{position:relative;z-index:3;max-width:calc(100% - 34px);padding:0 0 6px 8px;font-weight:900;font-size:clamp(11px,3vw,14px);line-height:1.1;text-shadow:0 2px 8px #000,0 0 8px #000}.mobileCardArrow{position:absolute;right:6px;bottom:6px;z-index:3;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--accent);border-radius:50%;font-size:21px;line-height:1;color:#fff;background:rgba(0,14,37,.78);box-shadow:0 0 12px var(--glow)}
    .mobileGuideGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 8px 10px}.mobileGuideButton{display:grid;place-items:center;min-height:44px;border:1px solid rgba(54,198,255,.36);border-radius:11px;background:rgba(5,24,52,.95);color:#dffaff;font-weight:800;text-decoration:none;box-shadow:0 0 14px rgba(0,161,255,.15)}
    .mobileBottomNav{position:fixed;z-index:40;left:50%;bottom:0;transform:translateX(-50%);width:min(720px,100vw);box-sizing:border-box;display:grid;grid-template-columns:repeat(5,1fr);gap:1px;padding:7px max(7px,env(safe-area-inset-right)) max(7px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));border-top:1px solid rgba(62,204,255,.55);background:linear-gradient(180deg,rgba(5,21,48,.97),rgba(1,8,22,.99));box-shadow:0 -6px 25px rgba(0,134,255,.24);backdrop-filter:blur(15px)}.mobileBottomNav a,.mobileBottomNav button{min-width:0;min-height:48px;border:0;border-radius:10px;background:transparent;color:#dbeeff;text-decoration:none;display:grid;place-items:center;align-content:center;gap:2px;padding:2px;font:inherit;cursor:pointer}.mobileBottomNav a[aria-current="page"]{color:#fff;background:linear-gradient(180deg,rgba(0,144,255,.34),rgba(0,70,150,.18));box-shadow:inset 0 0 16px rgba(0,186,255,.22)}.mobileBottomNav span{font-size:20px;line-height:1}.mobileBottomNav b{font-size:9px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .mobileDrawerBackdrop{display:block;position:fixed;inset:0;z-index:48;border:0;background:rgba(0,4,12,.74);padding:0}.mobileDrawer{display:block;position:fixed;z-index:49;left:0;top:0;bottom:0;width:min(84vw,330px);padding:9px max(9px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(9px,env(safe-area-inset-left));background:linear-gradient(180deg,#031025,#020713);border-right:1px solid rgba(67,210,255,.35);box-shadow:20px 0 60px rgba(0,0,0,.65);overflow-y:auto;transform:translateX(-104%);transition:transform .2s ease}.mobileDrawer.open{transform:translateX(0)}.mobileDrawerTop{position:sticky;top:-9px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:9px;padding:9px 0;background:#020713}.drawerBrandCrop{width:210px;height:48px;border-radius:7px}.mobileDrawerTop button{min-width:44px;min-height:44px;border:1px solid rgba(67,210,255,.45);border-radius:11px;background:rgba(5,20,44,.98);color:#e9fbff;font-size:12px;font-weight:900}.mobileDrawerLinks{display:grid;grid-template-columns:1fr 1fr;gap:7px}.mobileDrawerLink,.mobileDrawerExtra{min-height:46px;display:flex;align-items:center;padding:0 10px;border:1px solid rgba(54,198,255,.25);border-radius:10px;background:linear-gradient(145deg,rgba(9,41,84,.96),rgba(3,15,35,.96));color:#e7faff;font-size:12px;font-weight:800;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}.mobileDrawerExtra{grid-column:1/-1;justify-content:center;border-color:rgba(255,190,72,.38)}
    .iam-help-link,.iam-tour-launch,.iam-progress-save{display:none!important}.revenueHead{flex-direction:column}.sponsors{grid-template-columns:1fr}
   }
   @keyframes mobileShimmer{0%,64%,100%{transform:translateX(-130%)}82%{transform:translateX(130%)}}
   @keyframes mobileAmbient{from{opacity:.45;transform:translateY(0)}to{opacity:.9;transform:translateY(25px)}}
   @media(max-width:420px){.mobileTopbar{grid-template-columns:42px minmax(0,1fr) auto;gap:4px;padding-left:6px;padding-right:6px}.mobileBrandCrop{min-width:0;max-width:165px;height:40px}.mobileTopActions{min-width:0;gap:3px}.mobileHeaderSearchToggle,.mobileNotifications{min-width:38px;min-height:38px;width:38px;height:38px}.mobileOwnerCrop{width:38px;height:38px}.mobileHeroFrame{height:150px;margin-left:7px;margin-right:7px}.mobileGuidePanel{width:37%;right:6px}.mobileCardGrid{gap:5px;padding-left:7px;padding-right:7px}.mobilePremiumCard{height:55px}.mobileCardTitle{font-size:10.5px}.mobileStatusStrip{padding-left:7px;padding-right:7px;gap:4px}.mobileStatusStrip span{font-size:8px}.mobileBottomNav b{font-size:8px}}
   @media(max-width:359px){.mobileTopbar{grid-template-columns:40px minmax(0,1fr) auto;gap:3px}.mobileBrandCrop{max-width:130px}.mobileHeaderSearchToggle,.mobileNotifications{min-width:34px;min-height:34px;width:34px;height:34px}.mobileOwnerCrop{width:34px;height:34px}.mobileHeroFrame{height:150px}.mobileGuidePanel{width:39%;min-height:118px;padding:7px 6px}.mobileGuidePanel b{font-size:14px}.mobileGuidePanel small{font-size:8px}.mobilePremiumCard{height:54px}.mobileCardTitle{font-size:10px}.mobileStatusStrip{grid-template-columns:1fr 1fr}.mobileDrawerLinks{grid-template-columns:1fr}}
   @media(orientation:landscape) and (max-height:600px) and (max-width:1000px){.desktopStage{display:none}.mobileExactStage{display:block}.mobileCardGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.mobileHeroFrame{height:150px}}
   @media(prefers-reduced-motion:reduce){.mobileDrawer,.mobilePremiumCard{transition:none}.mobilePremiumCard:before,.mobileExactStage:before{animation:none}}

  `}</style>
  <style jsx global>{`
   html[data-iam-shell="true"],html[data-iam-shell="true"] body{margin:0!important;width:100%!important;min-width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:#020713!important}html[data-iam-shell="true"] .iam-shell-content{margin:0!important;margin-left:0!important;padding:0!important;padding-top:0!important;width:100vw!important;max-width:none!important;min-height:100vh!important;min-height:100dvh!important;overflow:visible!important;transition:none!important}html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
  `}</style>
 </main>
}
