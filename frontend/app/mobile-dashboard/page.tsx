'use client';
import {FormEvent,useEffect,useRef,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type MobileCard={label:string;description:string;href:string;glyph:string;accent:string};
type DrawerLink={label:string;href:string};

const cards:MobileCard[]=[
 {label:'Video Studio',description:'Create Stunning Videos with AI',href:'/video-studio',glyph:'▶',accent:'blue'},
 {label:'White Label',description:'Rebrand & Resell Your Own AI Platform',href:'/white-label',glyph:'◇',accent:'purple'},
 {label:'Creator Studio',description:'Content Creation Made Simple',href:'/studio',glyph:'◉',accent:'purple'},
 {label:'Growth',description:'Grow Your Audience & Increase Income',href:'/creator-growth',glyph:'↗',accent:'gold'},
 {label:'Opportunity Vault',description:'Find & Apply for Real Opportunities',href:'/opportunity-vault',glyph:'✦',accent:'teal'},
 {label:'Knowledge Center',description:'Learn, Train & Build Your Skills',href:'/knowledge',glyph:'▤',accent:'blue'},
 {label:'Routines',description:'Automate Your Day for Maximum Productivity',href:'/routine-studio',glyph:'✓',accent:'purple'},
 {label:'AI Receptionist',description:'24/7 AI Reception for Your Business',href:'/ai-receptionist',glyph:'◖',accent:'gold'},
 {label:'Connected',description:'Integrations & Automation Hub',href:'/connections',glyph:'∞',accent:'teal'},
 {label:'Professional Business',description:'Business Tools for Real Growth',href:'/professional',glyph:'▣',accent:'blue'},
 {label:'Launch Magnanimous',description:'Start & Scale Your Business',href:'/business-plan',glyph:'➤',accent:'gold'},
 {label:'AI Business',description:'AI Tools to Run Your Business',href:'/business-ai',glyph:'AI',accent:'teal'},
 {label:'Command',description:'Your AI Control Center Everything in One Place',href:'/ai-chat',glyph:'♛',accent:'purple'},
 {label:'Social Studio',description:'Create, Schedule & Grow Across All Platforms',href:'/social-media',glyph:'◎',accent:'purple'},
 {label:'Virtual Assistant',description:'Your Personal AI Helper',href:'/virtual-assistant',glyph:'●',accent:'blue'},
 {label:'Reports',description:'Track Your Growth & Performance',href:'/activity',glyph:'▥',accent:'blue'}
];

const drawerLinks:DrawerLink[]=[
 {label:'Home',href:'/'},{label:'AI Command',href:'/ai-chat'},{label:'Opportunity Vault',href:'/opportunity-vault'},{label:'CRM',href:'/crm'},{label:'Travel Agency',href:'/travel-agency'},
 {label:'Magnanimous Kids',href:'https://harmonic-data-52yyzau.shipstatic.com/'},{label:'AI Business',href:'/business-ai'},{label:'Launch Magnanimous',href:'/business-plan'},{label:'Video Studio',href:'/video-studio'},{label:'White Label',href:'/white-label'},
 {label:'Creator Studio',href:'/studio'},{label:'Social Studio',href:'/social-media'},{label:'AI Receptionist',href:'/ai-receptionist'},{label:'Virtual Assistant',href:'/virtual-assistant'},{label:'Knowledge Center',href:'/knowledge'},
 {label:'Professional Business',href:'/professional'},{label:'Routines',href:'/routine-studio'},{label:'Connected',href:'/connections'},{label:'Reports',href:'/activity'},{label:'Settings',href:'/account'}
];

async function safeJson(url:string){try{return await fetch(url,{cache:'no-store'}).then(async response=>{const text=await response.text();try{return JSON.parse(text)}catch{return{}}})}catch{return{}}}

export default function MobileDashboard(){
 const[menuOpen,setMenuOpen]=useState(false);
 const[searchOpen,setSearchOpen]=useState(false);
 const[query,setQuery]=useState('');
 const[ready,setReady]=useState(false);
 const[online,setOnline]=useState(false);
 const menuButtonRef=useRef<HTMLButtonElement|null>(null);
 const closeButtonRef=useRef<HTMLButtonElement|null>(null);
 const menuWasOpen=useRef(false);

 useEffect(()=>{(async()=>{const[health,tools]=await Promise.all([safeJson(`${api}/health`),safeJson(`${api}/api/tools`)]);setOnline(health?.status==='ok'&&Array.isArray(tools?.tools));setReady(true)})()},[]);
 useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenuOpen(false);setSearchOpen(false)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 useEffect(()=>{if(menuOpen){menuWasOpen.current=true;const previous=document.body.style.overflow;document.body.style.overflow='hidden';requestAnimationFrame(()=>closeButtonRef.current?.focus());return()=>{document.body.style.overflow=previous}}if(menuWasOpen.current){menuWasOpen.current=false;requestAnimationFrame(()=>menuButtonRef.current?.focus())}},[menuOpen]);

 function submit(event:FormEvent){event.preventDefault();const text=query.trim();location.href=text?`/ai-chat?prompt=${encodeURIComponent(text)}`:'/ai-chat'}

 return <main className="mobileReferencePage">
  <header className="referenceTopbar">
   <button ref={menuButtonRef} className="topIcon menuIcon" type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-reference-drawer" onClick={()=>setMenuOpen(true)}><span aria-hidden="true">☰</span></button>
   <a className="referenceBrand" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span className="brandCrown" aria-hidden="true">♛</span><span><b>I AM MAGNANIMOUS WAY™</b><small>AI ECOSYSTEM</small></span></a>
   <div className="topActions">
    <button className="topIcon searchIcon" type="button" aria-label="Search Magnanimous AI" aria-expanded={searchOpen} aria-controls="mobile-reference-search" onClick={()=>setSearchOpen(value=>!value)}><span aria-hidden="true">⌕</span></button>
    <a className="topIcon bellIcon" href="/activity" aria-label="Open notifications"><span aria-hidden="true">●</span></a>
    <a className="ownerBubble" href="/owner-center" aria-label="Open owner account"><span aria-hidden="true">J</span></a>
   </div>
  </header>

  {searchOpen&&<form id="mobile-reference-search" className="referenceSearch" role="search" onSubmit={submit}><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit">Search</button></form>}

  <section className="referenceHero" aria-label="Magnanimous AI welcome">
   <img src="/crm-upgrade.jpeg" alt="" aria-hidden="true" draggable={false}/>
   <div className="heroShade" aria-hidden="true"/>
   <div className="heroCopy"><span>Welcome to</span><h1>I AM MAGNANIMOUS WAY™</h1><p>Your AI Powered Platform for Faith, Family, Business, and Global Opportunity.</p></div>
   <aside className="guideCard"><b>Hi Jessie!</b><p>I’m your AI Guide. Let me show you the amazing opportunities inside your platform.</p><a href="/guide"><span aria-hidden="true">▶</span>Watch Tutorial</a></aside>
  </section>

  <section className="statusGrid" aria-label="Platform status">
   <div className={ready&&online?'ok':'checking'}><span>✓</span><b>{ready?(online?'AI Online':'AI Checking'):'Checking'}</b></div>
   <div className={ready&&online?'ok':'checking'}><span>✓</span><b>{ready?(online?'Systems Ready':'Systems Checking'):'Checking'}</b></div>
   <div className={ready&&online?'ok':'checking'}><span>✓</span><b>{ready?(online?'All Services Active':'Services Checking'):'Checking'}</b></div>
   <div className="ok"><span>✓</span><b>Secure &amp; Protected</b></div>
  </section>

  <section className="referenceCards" aria-label="Platform modules">
   {cards.map(card=><a key={card.label} className={`referenceCard accent-${card.accent}`} href={card.href} aria-label={`Open ${card.label}`}><span className="glyphStage" aria-hidden="true"><i>{card.glyph}</i></span><span className="cardCopy"><b>{card.label}</b><small>{card.description}</small></span><span className="cardArrow" aria-hidden="true">→</span></a>)}
  </section>

  <nav className="referenceBottomNav" aria-label="Primary mobile navigation">
   <a className="active" href="/"><span aria-hidden="true">⌂</span><b>Home</b></a>
   <a href="/ai-chat"><span aria-hidden="true">▣</span><b>AI Command</b></a>
   <a href="/opportunity-vault"><span aria-hidden="true">◇</span><b>Opportunity</b></a>
   <a href="/crm"><span aria-hidden="true">♟</span><b>CRM</b></a>
   <button type="button" onClick={()=>setMenuOpen(true)} aria-label="Open more navigation"><span aria-hidden="true">⊞</span><b>More</b></button>
  </nav>

  {menuOpen&&<button className="drawerBackdrop" type="button" aria-label="Close navigation menu" onClick={()=>setMenuOpen(false)}/>}
  <aside id="mobile-reference-drawer" className={menuOpen?'referenceDrawer open':'referenceDrawer'} aria-hidden={!menuOpen}>
   <div className="drawerTop"><a href="/" onClick={()=>setMenuOpen(false)}><span aria-hidden="true">♛</span><b>I AM MAGNANIMOUS WAY™</b></a><button ref={closeButtonRef} type="button" onClick={()=>setMenuOpen(false)} tabIndex={menuOpen?0:-1}>Close</button></div>
   <nav aria-label="All platform navigation">{drawerLinks.map(link=><a key={link.label} href={link.href} tabIndex={menuOpen?0:-1} onClick={()=>setMenuOpen(false)}>{link.label}<span aria-hidden="true">›</span></a>)}</nav>
  </aside>

  <style jsx global>{`
   html[data-iam-shell="true"],html[data-iam-shell="true"] body{margin:0!important;width:100%!important;min-width:100%!important;min-height:100%!important;overflow-x:hidden!important;background:#01050d!important}
   html[data-iam-shell="true"] .iam-shell-content{margin:0!important;margin-left:0!important;padding:0!important;padding-top:0!important;width:100vw!important;max-width:none!important;min-height:100vh!important;min-height:100dvh!important;overflow:visible!important;transition:none!important}
   html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
   .mobileReferencePage{--blue:#24baff;--purple:#d13cff;--teal:#16e6df;--gold:#ffbd43;min-height:100dvh;padding:0 0 calc(78px + env(safe-area-inset-bottom));overflow-x:hidden;background:radial-gradient(circle at 50% -5%,rgba(18,74,135,.62),transparent 30%),radial-gradient(circle at 0 55%,rgba(13,93,164,.19),transparent 32%),linear-gradient(180deg,#020916 0%,#020611 64%,#01040a 100%);color:#f4fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
   .referenceTopbar{position:sticky;top:0;z-index:40;min-height:70px;display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:9px;align-items:center;padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) 8px max(10px,env(safe-area-inset-left));background:rgba(2,8,20,.93);border-bottom:1px solid rgba(74,178,255,.45);backdrop-filter:blur(18px);box-shadow:0 4px 24px rgba(0,131,255,.2)}
   .topIcon{width:46px;height:46px;display:grid;place-items:center;border:1px solid rgba(83,186,255,.72);border-radius:14px;background:linear-gradient(145deg,rgba(8,34,72,.98),rgba(2,10,25,.98));color:#f7fdff;text-decoration:none;box-shadow:inset 0 0 16px rgba(0,115,255,.16),0 0 15px rgba(0,153,255,.18);padding:0}.menuIcon{font-size:27px}.searchIcon{border-radius:50%;font-size:27px}.bellIcon{position:relative;border-radius:50%;font-size:12px}.bellIcon:after{content:'';position:absolute;right:5px;top:4px;width:7px;height:7px;border-radius:50%;background:#ff9d1d;box-shadow:0 0 8px #ff9d1d}
   .referenceBrand{min-width:0;display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none}.brandCrown{font-size:37px;line-height:1;color:#ffc451;text-shadow:0 0 16px rgba(255,179,39,.55)}.referenceBrand>span:last-child{min-width:0;display:flex;flex-direction:column}.referenceBrand b{font-size:clamp(11px,3.1vw,19px);letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.referenceBrand small{font-size:clamp(7px,1.9vw,11px);letter-spacing:.3em;color:#e0a847;text-align:center}
   .topActions{display:flex;align-items:center;gap:6px}.ownerBubble{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(255,199,83,.7);background:radial-gradient(circle at 35% 30%,#ffe4c7,#9b5b3d 42%,#071225 44%);color:#fff;font-weight:900;text-decoration:none;box-shadow:0 0 16px rgba(0,133,255,.28)}
   .referenceSearch{position:sticky;top:70px;z-index:35;display:flex;gap:8px;margin:8px 10px;padding:7px;border:1px solid rgba(71,186,255,.6);border-radius:999px;background:rgba(2,14,34,.96);box-shadow:0 12px 34px rgba(0,0,0,.45)}.referenceSearch input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#fff;padding:8px 10px;font:700 14px inherit}.referenceSearch input::placeholder{color:#8ea9bd}.referenceSearch button{border:1px solid rgba(79,198,255,.7);border-radius:999px;padding:7px 14px;background:#072851;color:#eafaff;font-weight:900}
   .referenceHero{position:relative;isolation:isolate;min-height:290px;margin:9px 10px 7px;overflow:hidden;border:1px solid rgba(83,182,255,.43);border-radius:18px;background:#07172d;box-shadow:0 0 28px rgba(0,113,255,.24)}.referenceHero>img{position:absolute;z-index:-3;max-width:none;width:230%;height:auto;left:-105%;top:-7%;filter:saturate(1.12) contrast(1.04)}.heroShade{position:absolute;z-index:-2;inset:0;background:linear-gradient(90deg,rgba(1,7,18,.78) 0%,rgba(1,7,18,.26) 50%,rgba(1,7,18,.2) 100%),linear-gradient(0deg,rgba(1,7,18,.82),transparent 48%)}.heroCopy{position:absolute;left:7%;bottom:12%;width:58%;text-shadow:0 3px 15px #000}.heroCopy span{font-size:clamp(15px,4vw,24px)}.heroCopy h1{margin:2px 0 4px;font-size:clamp(20px,5.7vw,34px);line-height:.98;color:#fff}.heroCopy p{margin:0;font-size:clamp(10px,2.7vw,15px);line-height:1.32;color:#b9ecff}.guideCard{position:absolute;right:3%;top:8%;width:30%;padding:10px;border:1px solid rgba(255,196,80,.72);border-radius:15px;background:linear-gradient(160deg,rgba(19,31,61,.92),rgba(4,10,25,.95));box-shadow:0 0 20px rgba(255,174,48,.24);text-shadow:0 2px 10px #000}.guideCard b{font-size:clamp(12px,3.1vw,17px)}.guideCard p{margin:4px 0 8px;font-size:clamp(8px,2.1vw,11px);line-height:1.3;color:#e6edff}.guideCard a{display:flex;align-items:center;gap:6px;color:#fff;font-size:clamp(8px,2vw,11px);font-weight:900;text-decoration:none}.guideCard a span{display:grid;place-items:center;width:26px;height:26px;border:1px solid #3bc8ff;border-radius:50%;color:#fff;background:#0869d4;box-shadow:0 0 13px rgba(35,169,255,.65)}
   .statusGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:0 10px 9px}.statusGrid div{min-width:0;min-height:35px;display:flex;align-items:center;justify-content:center;gap:5px;padding:4px 5px;border-radius:999px;border:1px solid rgba(32,235,211,.72);background:linear-gradient(180deg,rgba(6,61,72,.94),rgba(2,22,35,.98));box-shadow:0 0 13px rgba(0,220,196,.14)}.statusGrid div.checking{border-color:rgba(255,191,79,.65)}.statusGrid span{flex:0 0 18px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:#00d9a8;color:#fff;font-size:12px;font-weight:900}.statusGrid .checking span{background:#a06f17}.statusGrid b{min-width:0;font-size:clamp(7px,1.9vw,11px);line-height:1.1;text-align:center}
   .referenceCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 10px 12px}.referenceCard{--accent:var(--blue);--glow:rgba(36,186,255,.36);--tint:rgba(12,102,199,.25);position:relative;min-width:0;aspect-ratio:3.1/1;display:grid;grid-template-columns:39% minmax(0,1fr) 28px;align-items:center;gap:6px;padding:7px 7px 7px 9px;overflow:hidden;border:1px solid var(--accent);border-radius:14px;background:radial-gradient(ellipse at 22% 62%,var(--tint),transparent 58%),linear-gradient(135deg,rgba(8,27,59,.99),rgba(2,7,18,.99));color:#fff;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -8px 22px var(--tint),0 7px 20px rgba(0,0,0,.48),0 0 14px var(--glow);transition:transform .18s ease,box-shadow .18s ease}.referenceCard:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.14) 47%,transparent 58%);transform:translateX(-125%);animation:cardShimmer 8s linear infinite}.referenceCard:active{transform:scale(.975)}.accent-purple{--accent:var(--purple);--glow:rgba(209,60,255,.35);--tint:rgba(147,21,221,.27)}.accent-teal{--accent:var(--teal);--glow:rgba(22,230,223,.32);--tint:rgba(0,183,173,.23)}.accent-gold{--accent:var(--gold);--glow:rgba(255,189,67,.35);--tint:rgba(255,159,23,.24)}
   .glyphStage{position:relative;z-index:1;height:100%;display:grid;place-items:center;border-radius:12px;background:radial-gradient(ellipse at 50% 78%,var(--glow),transparent 58%)}.glyphStage:after{content:'';position:absolute;left:8%;right:8%;bottom:8%;height:12%;border-radius:50%;background:var(--accent);filter:blur(7px);opacity:.55}.glyphStage i{position:relative;z-index:1;font-style:normal;font-size:clamp(25px,6.8vw,44px);font-weight:950;letter-spacing:-.08em;text-shadow:0 0 15px var(--accent),0 4px 12px rgba(0,0,0,.75)}.cardCopy{position:relative;z-index:1;min-width:0;display:flex;flex-direction:column;gap:2px;text-shadow:0 2px 9px #000}.cardCopy b{font-size:clamp(10px,2.65vw,15px);line-height:1.08}.cardCopy small{font-size:clamp(7px,1.8vw,10px);line-height:1.18;color:#e5efff}.cardArrow{position:relative;z-index:1;width:25px;height:25px;display:grid;place-items:center;justify-self:end;border:1px solid var(--accent);border-radius:50%;background:rgba(1,14,34,.78);box-shadow:0 0 10px var(--glow);font-size:15px}
   .referenceBottomNav{position:fixed;z-index:38;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,540px);display:grid;grid-template-columns:repeat(5,1fr);padding:7px 7px max(7px,env(safe-area-inset-bottom));border:1px solid rgba(71,180,255,.62);border-bottom:0;border-radius:20px 20px 0 0;background:rgba(3,14,34,.95);backdrop-filter:blur(18px);box-shadow:0 -8px 30px rgba(0,116,255,.23),inset 0 1px 0 rgba(255,255,255,.12)}.referenceBottomNav a,.referenceBottomNav button{min-width:0;min-height:53px;border:0;background:transparent;color:#e8f8ff;text-decoration:none;display:grid;place-items:center;align-content:center;gap:2px;padding:1px;font:inherit}.referenceBottomNav span{font-size:22px;line-height:1}.referenceBottomNav b{font-size:10px;line-height:1.05;white-space:nowrap}.referenceBottomNav .active{color:#fff;text-shadow:0 0 10px #20baff}.referenceBottomNav .active span{color:#49cdff}
   .drawerBackdrop{position:fixed;inset:0;z-index:70;border:0;background:rgba(0,4,12,.76)}.referenceDrawer{position:fixed;z-index:71;left:0;top:0;bottom:0;width:min(84vw,340px);padding:max(10px,env(safe-area-inset-top)) 10px max(20px,env(safe-area-inset-bottom));overflow-y:auto;transform:translateX(-104%);transition:transform .22s ease;background:linear-gradient(180deg,#031126,#010711);border-right:1px solid rgba(64,188,255,.42);box-shadow:24px 0 65px rgba(0,0,0,.7)}.referenceDrawer.open{transform:translateX(0)}.drawerTop{position:sticky;top:-10px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;background:#031126}.drawerTop>a{min-width:0;display:flex;align-items:center;gap:7px;color:#fff;text-decoration:none}.drawerTop>a span{font-size:28px;color:#ffc14c}.drawerTop>a b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.drawerTop button{min-width:48px;min-height:44px;border:1px solid rgba(77,190,255,.58);border-radius:10px;background:#092249;color:#fff;font-weight:900}.referenceDrawer nav{display:grid;gap:6px}.referenceDrawer nav>a{min-height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 13px;border:1px solid rgba(56,191,255,.2);border-radius:10px;background:linear-gradient(90deg,rgba(7,30,63,.97),rgba(2,10,23,.97));color:#e9fbff;text-decoration:none;font-weight:800}.referenceDrawer nav>a span{font-size:22px;color:#6ad8ff}
   .topIcon:focus-visible,.referenceBrand:focus-visible,.ownerBubble:focus-visible,.referenceSearch input:focus-visible,.referenceSearch button:focus-visible,.referenceCard:focus-visible,.referenceBottomNav a:focus-visible,.referenceBottomNav button:focus-visible,.referenceDrawer a:focus-visible,.referenceDrawer button:focus-visible,.guideCard a:focus-visible{outline:3px solid #ffd36e;outline-offset:3px}
   @keyframes cardShimmer{0%,63%,100%{transform:translateX(-125%)}78%{transform:translateX(125%)}}
   @media(max-width:430px){.referenceTopbar{grid-template-columns:48px minmax(0,1fr) auto;gap:6px}.topIcon{width:42px;height:42px}.topActions{gap:4px}.ownerBubble{width:42px;height:42px}.brandCrown{font-size:32px}.referenceHero{min-height:250px}.guideCard{width:31%;padding:8px}.referenceCards{gap:7px;padding-left:7px;padding-right:7px}.referenceCard{grid-template-columns:37% minmax(0,1fr) 25px;padding:6px;border-radius:12px}.cardArrow{width:23px;height:23px}.statusGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding-left:8px;padding-right:8px}.statusGrid div{min-height:32px}}
   @media(max-width:350px){.topActions .bellIcon{display:none}.referenceBrand b{font-size:10px}.referenceBrand small{font-size:6px}.referenceHero{min-height:230px}.guideCard p{display:none}.referenceCards{grid-template-columns:1fr}.referenceCard{aspect-ratio:3.4/1;min-height:88px}.cardCopy b{font-size:13px}.cardCopy small{font-size:9px}}
   @media(orientation:landscape) and (max-height:620px){.referenceHero{min-height:210px}.referenceCards{grid-template-columns:repeat(3,minmax(0,1fr))}.referenceCard{aspect-ratio:2.8/1}}
   @media(prefers-reduced-motion:reduce){.referenceCard,.referenceDrawer{transition:none}.referenceCard:before{display:none}}
  `}</style>
 </main>
}
