'use client';
import {FormEvent,useEffect,useRef,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const kids='https://harmonic-data-52yyzau.shipstatic.com/';

type Ad={id:number;title:string;url:string;label:string;placement:string;active:number};
type AdConfig={adsense_configured:boolean;adsense_client_id:string|null;adsense_home_slot:string|null;auto_ads_ready:boolean};
type Accent='blue'|'purple'|'teal'|'gold';
type Card={label:string;description:string;href:string;glyph:string;accent:Accent};

const cards:Card[]=[
 {label:'Video Studio',description:'Create Stunning Videos with AI',href:'/video-studio',glyph:'🎬',accent:'blue'},
 {label:'White Label',description:'Rebrand & Resell Your Own AI Platform',href:'/white-label',glyph:'🏷️',accent:'purple'},
 {label:'Creator Studio',description:'Content Creation Made Simple',href:'/studio',glyph:'📸',accent:'purple'},
 {label:'Growth',description:'Grow Your Audience & Increase Income',href:'/creator-growth',glyph:'📈',accent:'gold'},
 {label:'Opportunity Vault',description:'Find & Apply for Real Opportunities',href:'/opportunity-vault',glyph:'💎',accent:'teal'},
 {label:'Knowledge Center',description:'Learn, Train & Build Your Skills',href:'/knowledge',glyph:'📖',accent:'blue'},
 {label:'Routines',description:'Automate Your Day for Maximum Productivity',href:'/routine-studio',glyph:'📅',accent:'purple'},
 {label:'AI Receptionist',description:'24/7 AI Reception for Your Business',href:'/ai-receptionist',glyph:'🎧',accent:'gold'},
 {label:'Connected',description:'Integrations & Automation Hub',href:'/connections',glyph:'🔗',accent:'teal'},
 {label:'Professional Business',description:'Business Tools for Real Growth',href:'/professional',glyph:'💼',accent:'blue'},
 {label:'Launch Magnanimous',description:'Start & Scale Your Business',href:'/business-plan',glyph:'🚀',accent:'gold'},
 {label:'AI Business',description:'AI Tools to Run Your Business',href:'/business-ai',glyph:'🤖',accent:'teal'},
 {label:'Command',description:'Your AI Control Center — Everything in One Place',href:'/ai-chat',glyph:'👑',accent:'purple'},
 {label:'Social Studio',description:'Create, Schedule & Grow Across All Platforms',href:'/social-media',glyph:'📱',accent:'purple'},
 {label:'Virtual Assistant',description:'Your Personal AI Helper',href:'/virtual-assistant',glyph:'🤖',accent:'blue'},
 {label:'Reports',description:'Track Your Growth & Performance',href:'/activity',glyph:'📊',accent:'blue'}
];

const drawerLinks=[
 ['Home','/'],['AI Command','/ai-chat'],['Opportunity Vault','/opportunity-vault'],['CRM','/crm'],['Travel Agency','/travel-agency'],['Magnanimous Kids',kids],['AI Business','/business-ai'],['Launch Magnanimous','/business-plan'],['Video Studio','/video-studio'],['White Label','/white-label'],['Creator Studio','/studio'],['Growth','/creator-growth'],['Social Studio','/social-media'],['AI Receptionist','/ai-receptionist'],['Virtual Assistant','/virtual-assistant'],['Knowledge Center','/knowledge'],['Professional Business','/professional'],['Routines','/routine-studio'],['Connected','/connections'],['Reports','/activity'],['Movie Maker','/movie-maker'],['AI Tools & More','/ai-apps'],['Settings','/account']
] as const;

async function safeJson(url:string){
 try{
  return await fetch(url,{cache:'no-store'}).then(async response=>{
   const text=await response.text();
   try{return JSON.parse(text)}catch{return{}}
  });
 }catch{return{}}
}

export default function MobileHomeDashboard(){
 const[active,setActive]=useState(false);
 const[menuOpen,setMenuOpen]=useState(false);
 const[searchOpen,setSearchOpen]=useState(false);
 const[query,setQuery]=useState('');
 const[ready,setReady]=useState(false);
 const[online,setOnline]=useState(false);
 const[ads,setAds]=useState<Ad[]>([]);
 const[adConfig,setAdConfig]=useState<AdConfig>({adsense_configured:false,adsense_client_id:null,adsense_home_slot:null,auto_ads_ready:false});
 const menuButtonRef=useRef<HTMLButtonElement|null>(null);
 const closeButtonRef=useRef<HTMLButtonElement|null>(null);
 const wasOpen=useRef(false);

 useEffect(()=>{
  const media=window.matchMedia('(max-width:1024px)');
  const sync=()=>setActive(window.location.pathname==='/'&&media.matches);
  sync();
  media.addEventListener?.('change',sync);
  window.addEventListener('popstate',sync);
  return()=>{media.removeEventListener?.('change',sync);window.removeEventListener('popstate',sync)};
 },[]);

 useEffect(()=>{
  if(!active)return;
  const previous=document.body.style.overflow;
  document.documentElement.dataset.iamMobileHome='true';
  document.body.style.overflow='hidden';
  return()=>{delete document.documentElement.dataset.iamMobileHome;document.body.style.overflow=previous};
 },[active]);

 useEffect(()=>{
  if(!active)return;
  (async()=>{
   const[health,tools,a,mc]=await Promise.all([
    safeJson(`${api}/health`),safeJson(`${api}/api/tools`),safeJson(`${api}/api/ads?placement=home`),safeJson(`${api}/api/monetization/config`)
   ]);
   setOnline(health?.status==='ok'&&Array.isArray(tools?.tools));
   setAds(Array.isArray(a?.ads)?a.ads:[]);
   setAdConfig({adsense_configured:!!mc?.adsense_configured,adsense_client_id:mc?.adsense_client_id||null,adsense_home_slot:mc?.adsense_home_slot||null,auto_ads_ready:!!mc?.auto_ads_ready});
   setReady(true);
  })();
 },[active]);

 useEffect(()=>{
  if(!active)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenuOpen(false);setSearchOpen(false)}};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[active]);

 useEffect(()=>{
  if(!active)return;
  if(menuOpen){wasOpen.current=true;requestAnimationFrame(()=>closeButtonRef.current?.focus())}
  else if(wasOpen.current){wasOpen.current=false;requestAnimationFrame(()=>menuButtonRef.current?.focus())}
 },[active,menuOpen]);

 useEffect(()=>{
  if(!active||!adConfig.adsense_client_id)return;
  const client=adConfig.adsense_client_id;
  const requestAd=()=>{if(!adConfig.adsense_home_slot)return;try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}};
  const existing=document.querySelector('script[data-iam-adsense="true"]') as HTMLScriptElement|null;
  if(existing){requestAd();return}
  const script=document.createElement('script');
  script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;script.dataset.iamAdsense='true';script.onload=requestAd;document.head.appendChild(script);
 },[active,adConfig.adsense_client_id,adConfig.adsense_home_slot]);

 function submit(event:FormEvent){event.preventDefault();const text=query.trim();location.href=text?`/ai-chat?prompt=${encodeURIComponent(text)}`:'/ai-chat'}
 if(!active)return null;

 return <div className="iamMobileHomeShell">
  <header className="iamMobileTopbar">
   <button ref={menuButtonRef} className="iamMobileIconButton menu" type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="iam-mobile-drawer" onClick={()=>setMenuOpen(true)}><span>☰</span></button>
   <a className="iamMobileBrand" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span className="iamMobileMark">M</span><span className="iamMobileBrandWords"><b>I AM MAGNANIMOUS WAY™</b><small>AI ECOSYSTEM</small></span></a>
   <div className="iamMobileTopActions">
    <button className="iamMobileIconButton round" type="button" aria-label="Search Magnanimous AI" aria-expanded={searchOpen} aria-controls="iam-mobile-search" onClick={()=>setSearchOpen(value=>!value)}>⌕</button>
    <a className="iamMobileIconButton round bell" href="/activity" aria-label="Open notifications">●</a>
    <a className="iamMobileOwner" href="/owner-center" aria-label="Open owner account"><span>M</span></a>
   </div>
  </header>

  {searchOpen&&<form id="iam-mobile-search" className="iamMobileSearch" role="search" onSubmit={submit}><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit">Search</button></form>}

  <main className="iamMobileScroll" aria-label="I AM MAGNANIMOUS WAY mobile dashboard">
   <section className="iamMobileHero" aria-label="Magnanimous AI welcome">
    <div className="iamMobileCosmos" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="globe">🌐</span><span className="crown">♛</span></div>
    <div className="iamMobileHeroCopy"><span>Welcome to</span><h1>I AM MAGNANIMOUS WAY™</h1><p>Your AI Powered Platform for Faith, Family, Business, and Global Opportunity.</p></div>
    <aside className="iamMobileGuide"><span className="guideAvatar" aria-hidden="true">✦</span><div><b>Hi Jessie!</b><p>I’m your AI Guide. Let me show you all the amazing opportunities inside your platform.</p><a href="/guide"><span aria-hidden="true">▶</span> Watch Tutorial</a></div></aside>
   </section>

   <section className="iamMobileStatus" aria-label="Platform status">
    <div><span>✓</span><b>{ready?(online?'AI Online':'AI Checking'):'Checking'}</b></div>
    <div><span>✓</span><b>{ready?(online?'Systems Ready':'Checking'):'Checking'}</b></div>
    <div><span>✓</span><b>{ready?(online?'All Services Active':'Checking'):'Checking'}</b></div>
    <div><span>✓</span><b>Secure & Protected</b></div>
   </section>

   <section className="iamMobileCards" aria-label="Platform modules">
    {cards.map(card=><a key={card.label} className={`iamMobileCard accent-${card.accent}`} href={card.href} aria-label={`Open ${card.label}`}>
     <span className="iamMobileVisual" aria-hidden="true"><i>{card.glyph}</i><em/></span>
     <span className="iamMobileCardCopy"><b>{card.label}</b><small>{card.description}</small></span>
     <span className="iamMobileArrow" aria-hidden="true">→</span>
    </a>)}
   </section>

   {(ads.length>0||adConfig.adsense_configured)&&<section className="iamMobileRevenue" aria-label="Sponsored advertising"><div><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<nav>{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</nav>}{adConfig.adsense_configured&&<div className="iamMobileAdsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  </main>

  <nav className="iamMobileBottom" aria-label="Primary mobile navigation"><a className="active" href="/"><span>⌂</span><b>Home</b></a><a href="/ai-chat"><span>▣</span><b>AI Command</b></a><a href="/opportunity-vault"><span>◇</span><b>Opportunity</b></a><a href="/crm"><span>♟</span><b>CRM</b></a><button type="button" onClick={()=>setMenuOpen(true)} aria-label="Open more navigation"><span>⊞</span><b>More</b></button></nav>

  {menuOpen&&<button className="iamMobileBackdrop" type="button" aria-label="Close navigation menu" onClick={()=>setMenuOpen(false)}/>}
  <aside id="iam-mobile-drawer" className={menuOpen?'iamMobileDrawer open':'iamMobileDrawer'} aria-hidden={!menuOpen}><div className="iamMobileDrawerTop"><a href="/" onClick={()=>setMenuOpen(false)}>I AM MAGNANIMOUS WAY™</a><button ref={closeButtonRef} type="button" onClick={()=>setMenuOpen(false)} tabIndex={menuOpen?0:-1}>Close</button></div><nav>{drawerLinks.map(([label,href])=><a key={label} href={href} tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>{label}<span aria-hidden="true">›</span></a>)}</nav></aside>

  <style jsx global>{`
   @media(max-width:1024px){html[data-iam-mobile-home="true"] .iam-shell-content,html[data-iam-mobile-home="true"] .iam-shell-topbar,html[data-iam-mobile-home="true"] .iam-shell-sidebar,html[data-iam-mobile-home="true"] .iam-shop-link,html[data-iam-mobile-home="true"] .iam-business-identity,html[data-iam-mobile-home="true"] .iam-intelligence-art,html[data-iam-mobile-home="true"] .iam-command-button,html[data-iam-mobile-home="true"] .iam-command-menu,html[data-iam-mobile-home="true"] .iam-va-button,html[data-iam-mobile-home="true"] .iam-va-panel,html[data-iam-mobile-home="true"] .iam-global-tools{display:none!important}}
   .iamMobileHomeShell{--blue:#1db7ff;--purple:#d43cff;--teal:#11dfd1;--gold:#ffb728;position:fixed;inset:0;z-index:2147483500;background:#01050d;color:#f7fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}.iamMobileTopbar{position:absolute;inset:0 0 auto 0;z-index:20;min-height:62px;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:7px;align-items:center;padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) 6px max(8px,env(safe-area-inset-left));background:linear-gradient(180deg,rgba(3,11,30,.98),rgba(1,7,19,.96));border-bottom:1px solid rgba(68,173,255,.46);box-shadow:0 5px 28px rgba(0,99,255,.28);box-sizing:border-box}.iamMobileIconButton{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(60,175,255,.78);border-radius:11px;background:linear-gradient(145deg,#0c244b,#020914);color:#f7fdff;text-decoration:none;box-shadow:inset 0 0 13px rgba(0,115,255,.2),0 0 13px rgba(0,153,255,.16);padding:0;font:800 22px/1 inherit}.iamMobileIconButton.menu span{transform:translateY(-1px)}.iamMobileIconButton.round{border-radius:50%;font-size:20px}.iamMobileIconButton.bell{position:relative;font-size:8px}.iamMobileIconButton.bell:after{content:'';position:absolute;right:4px;top:3px;width:6px;height:6px;border-radius:50%;background:#ffae22;box-shadow:0 0 7px #ffae22}.iamMobileBrand{min-width:0;display:flex;align-items:center;gap:7px;color:#fff;text-decoration:none}.iamMobileMark{width:38px;height:38px;display:grid;place-items:center;clip-path:polygon(0 100%,13% 12%,40% 53%,50% 5%,60% 53%,87% 12%,100% 100%);background:linear-gradient(180deg,#fff2a2,#ffb61e 48%,#a85a00);color:#301300;font:1000 21px/1 Arial,sans-serif;text-shadow:0 1px #fff;filter:drop-shadow(0 0 7px rgba(255,184,45,.72))}.iamMobileBrandWords{min-width:0;display:grid;line-height:1}.iamMobileBrandWords b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(10px,2.8vw,14px);letter-spacing:.035em}.iamMobileBrandWords small{margin-top:4px;color:#eac76c;font-size:8px;letter-spacing:.28em}.iamMobileTopActions{display:flex;gap:4px;align-items:center}.iamMobileOwner{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(255,200,78,.72);border-radius:50%;background:radial-gradient(circle at 50% 32%,#33456f 0 18%,#141a31 19% 37%,#050a16 38% 100%);color:#ffe5a4;text-decoration:none;box-shadow:0 0 14px rgba(255,178,32,.22)}.iamMobileOwner span{font-weight:1000;font-size:13px}
   .iamMobileSearch{position:absolute;z-index:19;top:64px;left:8px;right:8px;display:flex;gap:6px;padding:6px;border:1px solid rgba(71,186,255,.6);border-radius:999px;background:rgba(2,14,34,.98);box-shadow:0 12px 34px rgba(0,0,0,.45)}.iamMobileSearch input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#fff;padding:8px 10px;font:700 14px inherit}.iamMobileSearch input::placeholder{color:#8ea9bd}.iamMobileSearch button{border:1px solid rgba(79,198,255,.7);border-radius:999px;padding:7px 13px;background:#072851;color:#eafaff;font-weight:900}.iamMobileScroll{position:absolute;inset:62px 0 calc(68px + env(safe-area-inset-bottom)) 0;overflow-y:auto;overscroll-behavior:contain;background:radial-gradient(circle at 50% -6%,rgba(15,64,126,.62),transparent 30%),radial-gradient(circle at 4% 55%,rgba(14,86,160,.15),transparent 32%),linear-gradient(180deg,#020815,#01050d 68%,#01030a 100%);padding:0 0 14px}.iamMobileSearch+.iamMobileScroll{top:116px}
   .iamMobileHero{position:relative;isolation:isolate;min-height:194px;margin:7px 8px 6px;overflow:hidden;border:1px solid rgba(67,173,255,.58);border-radius:14px;background:radial-gradient(circle at 25% 35%,rgba(8,98,210,.48),transparent 28%),radial-gradient(circle at 66% 20%,rgba(255,177,48,.24),transparent 22%),linear-gradient(135deg,#03112b,#041331 55%,#0b0820);box-shadow:0 0 24px rgba(0,112,255,.23)}.iamMobileHero:before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,#dff8ff 0 1px,transparent 1.4px);background-size:27px 31px;opacity:.17}.iamMobileCosmos{position:absolute;inset:0;overflow:hidden;pointer-events:none}.iamMobileCosmos .globe{position:absolute;left:3%;top:7%;font-size:102px;filter:saturate(1.4) drop-shadow(0 0 18px #169cff);opacity:.95}.iamMobileCosmos .crown{position:absolute;left:8%;top:13%;font-size:70px;color:#ffd95f;text-shadow:0 0 18px #ffb728;transform:rotate(-8deg)}.iamMobileCosmos .orbit{position:absolute;border:1px solid rgba(61,186,255,.45);border-radius:50%;transform:rotate(-18deg)}.iamMobileCosmos .orbit.one{left:-14%;top:6%;width:68%;aspect-ratio:1}.iamMobileCosmos .orbit.two{left:-2%;top:18%;width:50%;aspect-ratio:1}.iamMobileHeroCopy{position:absolute;left:5%;bottom:10%;width:53%;text-shadow:0 2px 13px #000}.iamMobileHeroCopy>span{font-size:12px}.iamMobileHeroCopy h1{margin:1px 0 4px;font-size:clamp(19px,5.3vw,27px);line-height:.98;color:#fff1c1;letter-spacing:-.02em}.iamMobileHeroCopy p{margin:0;color:#b8e8ff;font-size:clamp(9px,2.3vw,11px);line-height:1.25}.iamMobileGuide{position:absolute;right:2.8%;top:6%;width:39%;display:grid;grid-template-columns:34px 1fr;gap:7px;padding:9px 8px;border:1px solid rgba(255,197,73,.86);border-radius:13px;background:linear-gradient(160deg,rgba(24,23,48,.93),rgba(4,10,26,.96));box-shadow:0 0 19px rgba(255,174,38,.28),inset 0 0 18px rgba(255,183,54,.07)}.guideAvatar{width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle,#37c9ff,#0d315f 65%,#071326);border:1px solid #75ddff;box-shadow:0 0 13px #169cff;color:#fff}.iamMobileGuide b{font-size:14px}.iamMobileGuide p{margin:3px 0 7px;color:#e5efff;font-size:8.4px;line-height:1.25}.iamMobileGuide a{display:flex;align-items:center;gap:5px;color:#e8fbff;text-decoration:none;font-weight:900;font-size:9px}.iamMobileGuide a span{width:22px;height:22px;display:grid;place-items:center;border:1px solid #46c8ff;border-radius:50%;box-shadow:0 0 12px rgba(30,185,255,.5)}
   .iamMobileStatus{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:0 8px 7px}.iamMobileStatus div{min-width:0;min-height:31px;display:flex;align-items:center;justify-content:center;gap:3px;padding:3px;border:1px solid rgba(29,230,200,.7);border-radius:999px;background:linear-gradient(180deg,rgba(5,49,59,.98),rgba(1,21,31,.98));box-shadow:0 0 10px rgba(20,225,194,.13)}.iamMobileStatus span{width:16px;height:16px;flex:0 0 16px;display:grid;place-items:center;border-radius:50%;background:#10c986;font-weight:1000;font-size:9px}.iamMobileStatus b{font-size:clamp(6.5px,1.9vw,9px);white-space:normal;text-align:center;line-height:1.02}
   .iamMobileCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:2px 8px 11px}.iamMobileCard{--accent:var(--blue);--tint:rgba(15,128,255,.21);position:relative;min-height:78px;overflow:hidden;display:grid;grid-template-columns:39% 1fr;align-items:center;gap:6px;padding:6px 24px 6px 6px;border:1px solid var(--accent);border-radius:12px;background:radial-gradient(ellipse at 28% 45%,var(--tint),transparent 64%),linear-gradient(150deg,#0d2044,#030816 84%);color:#fff;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 -5px 17px var(--tint),0 5px 14px rgba(0,0,0,.48);isolation:isolate}.iamMobileCard:before{content:'';position:absolute;inset:-35% auto -35% -20%;width:58%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);transform:rotate(13deg);pointer-events:none}.iamMobileCard.accent-purple{--accent:var(--purple);--tint:rgba(150,20,255,.22)}.iamMobileCard.accent-teal{--accent:var(--teal);--tint:rgba(0,219,192,.19)}.iamMobileCard.accent-gold{--accent:var(--gold);--tint:rgba(255,161,12,.2)}.iamMobileVisual{position:relative;height:64px;display:grid;place-items:center;overflow:hidden;border-radius:10px;background:radial-gradient(circle at 50% 68%,var(--tint),transparent 58%)}.iamMobileVisual:after{content:'';position:absolute;left:13%;right:13%;bottom:5px;height:7px;border-radius:50%;background:var(--accent);filter:blur(5px);opacity:.48}.iamMobileVisual i{position:relative;z-index:2;font-style:normal;font-size:34px;line-height:1;filter:drop-shadow(0 0 8px var(--accent));transform:translateY(-1px)}.iamMobileVisual em{position:absolute;width:52px;height:52px;border:1px solid var(--accent);border-radius:50%;opacity:.24;box-shadow:0 0 14px var(--accent)}.iamMobileCardCopy{min-width:0;display:grid;gap:3px}.iamMobileCardCopy b{font-size:clamp(11px,3vw,14px);line-height:1.02;text-shadow:0 2px 7px #000}.iamMobileCardCopy small{color:#dceaff;font-size:clamp(7.5px,2vw,9.5px);line-height:1.14}.iamMobileArrow{position:absolute;right:5px;bottom:5px;width:20px;height:20px;display:grid;place-items:center;border:1px solid var(--accent);border-radius:50%;background:rgba(0,14,37,.8);box-shadow:0 0 9px var(--accent);font-weight:1000;font-size:11px}
   .iamMobileRevenue{margin:0 8px 8px;padding:10px;border:1px solid rgba(74,178,255,.25);border-radius:13px;background:rgba(5,18,38,.9)}.iamMobileRevenue>div:first-child{display:flex;justify-content:space-between;gap:8px;color:#83a8ba;font-size:7px;letter-spacing:.08em}.iamMobileRevenue nav{display:grid;gap:6px;margin-top:7px}.iamMobileRevenue nav a{display:grid;gap:3px;padding:8px;border:1px solid #254e6d;border-radius:9px;color:#dff9ff;text-decoration:none}.iamMobileRevenue nav small{color:#77a1b9}.iamMobileAdsense{margin-top:8px}.iamMobileAdsense p{margin:0;color:#9fc6d9;font-size:10px}
   .iamMobileBottom{position:absolute;z-index:25;left:max(7px,env(safe-area-inset-left));right:max(7px,env(safe-area-inset-right));bottom:max(7px,env(safe-area-inset-bottom));min-height:57px;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:4px;border:1px solid rgba(79,177,255,.64);border-radius:17px;background:rgba(2,12,30,.97);box-shadow:0 0 22px rgba(0,133,255,.3);backdrop-filter:blur(16px)}.iamMobileBottom a,.iamMobileBottom button{min-width:0;border:0;background:transparent;color:#d9e8f5;text-decoration:none;display:grid;place-items:center;gap:1px;padding:2px;font:inherit}.iamMobileBottom span{font-size:20px;line-height:1}.iamMobileBottom b{font-size:8px;white-space:nowrap}.iamMobileBottom .active{color:#63e6ff;text-shadow:0 0 9px #0fa9ff}
   .iamMobileBackdrop{position:absolute;z-index:40;inset:0;border:0;background:rgba(0,4,12,.74)}.iamMobileDrawer{position:absolute;z-index:41;left:0;top:0;bottom:0;width:min(84vw,330px);padding:max(8px,env(safe-area-inset-top)) 8px max(10px,env(safe-area-inset-bottom));background:#020713;border-right:1px solid rgba(67,210,255,.34);box-shadow:20px 0 60px rgba(0,0,0,.72);overflow-y:auto;transform:translateX(-105%);transition:transform .2s ease;box-sizing:border-box}.iamMobileDrawer.open{transform:translateX(0)}.iamMobileDrawerTop{position:sticky;top:-8px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;background:#020713}.iamMobileDrawerTop a{color:#fff1bf;font-weight:950;font-size:11px;text-decoration:none}.iamMobileDrawerTop button{min-width:44px;min-height:44px;border:1px solid rgba(67,210,255,.45);border-radius:10px;background:rgba(5,20,44,.98);color:#e9fbff;font-weight:900}.iamMobileDrawer nav{display:grid;gap:5px}.iamMobileDrawer nav a{min-height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 11px;border:1px solid rgba(48,187,255,.18);border-radius:9px;background:linear-gradient(145deg,rgba(8,29,60,.96),rgba(2,10,24,.96));color:#eafaff;text-decoration:none;font-weight:800;font-size:12px}.iamMobileDrawer nav a span{font-size:20px;color:#68dfff}
   .iamMobileIconButton:focus-visible,.iamMobileBottom a:focus-visible,.iamMobileBottom button:focus-visible,.iamMobileCard:focus-visible,.iamMobileDrawer a:focus-visible,.iamMobileDrawer button:focus-visible,.iamMobileGuide a:focus-visible{outline:2px solid #fff;outline-offset:2px}.iamMobileCard:active{transform:scale(.985)}
   @media(max-width:390px){.iamMobileTopbar{grid-template-columns:40px minmax(0,1fr) auto;gap:5px}.iamMobileIconButton,.iamMobileOwner{width:38px;height:38px}.iamMobileMark{width:34px;height:34px}.iamMobileBrandWords small{letter-spacing:.2em}.iamMobileHero{min-height:185px}.iamMobileGuide{width:40%;grid-template-columns:28px 1fr}.guideAvatar{width:26px;height:26px}.iamMobileGuide b{font-size:12px}.iamMobileGuide p{font-size:7.8px}.iamMobileCards{gap:5px}.iamMobileCard{min-height:75px}.iamMobileVisual{height:60px}.iamMobileVisual i{font-size:31px}}
   @media(min-width:700px) and (max-width:1024px){.iamMobileCards{grid-template-columns:repeat(3,minmax(0,1fr));}.iamMobileCard{min-height:96px}.iamMobileHero{min-height:260px}.iamMobileHeroCopy h1{font-size:36px}.iamMobileGuide{width:31%;}.iamMobileCosmos .globe{font-size:145px}}
   @media(prefers-reduced-motion:reduce){.iamMobileDrawer{transition:none}.iamMobileCard:active{transform:none}}
  `}</style>
 </div>;
}
