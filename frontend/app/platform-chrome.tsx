'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';

const publicPaths=['/login','/signup','/owner-login','/privacy','/terms','/movie','/magnanimous','/telecom-standalone','/tv-remote'];
type NavItem={glyph:string;label:string;href:string};
// Reuse original Magnanimous illustrations: no third-party artwork or new downloads.
const sidebarArt=(href:string)=>{
 if(href==='/ai-chat')return '/magnanimous-ai-command-palace-mobile-v2.webp';
 if(href==='/opportunity-vault')return '/magnanimous-opportunity-palace-mobile-v2.webp';
 if(href==='/knowledge')return '/magnanimous-knowledge-palace-mobile-v2.webp';
 if(href==='/travel-agency')return '/magnanimous-travel-palace-mobile-v2.webp';
 if(href.includes('shipstatic.com'))return '/magnanimous-family-full.webp';
 if(/social|video|movie|studio|creator/.test(href))return '/mode-images/social-media.webp';
 if(/crm|business|b2b|shop|owner|professional/.test(href))return '/mode-images/business.webp';
 if(/opportunity|intelligence|activity|report/.test(href))return '/mode-images/research.webp';
 if(/assistant|receptionist|routine|connections/.test(href))return '/mode-images/virtual-assistant.webp';
 return '/mode-images/general.webp';
};
const nav:NavItem[]=[
 {glyph:'H',label:'Home',href:'/'},{glyph:'AI',label:'AI Command',href:'/ai-chat'},{glyph:'OV',label:'Opportunity Vault',href:'/opportunity-vault'},{glyph:'CRM',label:'CRM',href:'/crm'},{glyph:'B2B',label:'B2B',href:'/b2b'},{glyph:'CC',label:'Contact Center',href:'/contact-center'},{glyph:'TEL',label:'Telecom',href:'/telecom'},{glyph:'ID',label:'Intelligence Desk',href:'/intelligence-desk'},{glyph:'TR',label:'Travel Agency',href:'/travel-agency'},{glyph:'TV',label:'TV Browser Remote',href:'/tv-remote'},{glyph:'K',label:'Magnanimous Kids',href:'https://harmonic-data-52yyzau.shipstatic.com/'},{glyph:'AB',label:'AI Business',href:'/business-ai'},{glyph:'UP',label:'Launch Magnanimous',href:'/business-plan'},{glyph:'VS',label:'Video Studio',href:'/video-studio'},{glyph:'SS',label:'Social Studio',href:'/social-media'},{glyph:'AR',label:'AI Receptionist',href:'/ai-receptionist'},{glyph:'VA',label:'Virtual Assistant',href:'/virtual-assistant'},{glyph:'KN',label:'Knowledge Center',href:'/knowledge'},{glyph:'PB',label:'Professional Business',href:'/professional'},{glyph:'RT',label:'Routines',href:'/routine-studio'},{glyph:'CN',label:'Connected',href:'/connections'},{glyph:'RP',label:'Reports',href:'/activity'},{glyph:'SH',label:'Shop',href:'/shop'},{glyph:'SET',label:'Settings',href:'/account'}
];
const ownerNav:NavItem[]=[{glyph:'OWN',label:'Owner Center',href:'/owner-center'},{glyph:'OPS',label:'Owner Operations',href:'/owner-operations'}];

type Theme={title:string;subtitle:string;image:string;accent:string;gold?:boolean};
function themeFor(path:string):Theme{
 if(path.includes('business')||path.includes('crm')||path.includes('professional')||path.includes('operations'))return{title:'Business Command',subtitle:'Build | Manage | Grow',image:'/mode-images/business.webp',accent:'#60e7c1',gold:true};
 if(path.includes('social')||path.includes('video')||path.includes('movie')||path.includes('creator'))return{title:'Creative Command',subtitle:'Create | Publish | Grow',image:'/mode-images/social-media.webp',accent:'#ff67e7'};
 if(path.includes('knowledge')||path.includes('research')||path.includes('opportunity')||path.includes('intelligence'))return{title:'Knowledge & Opportunity',subtitle:'Research | Verify | Act',image:'/mode-images/research.webp',accent:'#6fcfff'};
 if(path.includes('assistant')||path.includes('routine')||path.includes('receptionist')||path.includes('connection'))return{title:'Assistant Operations',subtitle:'Automate | Connect | Follow Through',image:'/mode-images/virtual-assistant.webp',accent:'#58edcb'};
 if(path.includes('travel'))return{title:'Magnanimous Travel',subtitle:'Search | Compare | Grow',image:'/mode-images/general.webp',accent:'#68e9ff',gold:true};
 if(path.includes('kids'))return{title:'Magnanimous Kids',subtitle:'Learn | Create | Grow',image:'/magnanimous-family-full.webp',accent:'#ffd36e',gold:true};
 if(path==='/')return{title:'Magnanimous AI Command Center',subtitle:'Create | Automate | Grow | Serve | Go Further Together',image:'/mode-images/general.webp',accent:'#63e8ff',gold:true};
 return{title:'Magnanimous AI',subtitle:'One Platform | Infinite Possibilities',image:'/mode-images/general.webp',accent:'#63e8ff'};
}

export default function PlatformChrome(){
 const[path,setPath]=useState(''),[collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[query,setQuery]=useState(''),[owner,setOwner]=useState(false),[displayName,setDisplayName]=useState('Magnanimous User');
 useEffect(()=>{
  const p=location.pathname;setPath(p);const isOwner=!!(localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token'));setOwner(isOwner);
  const saved=localStorage.getItem('iam_sidebar_collapsed')==='1';setCollapsed(saved);
  if(publicPaths.includes(p)||p.startsWith('/movie/'))return;
  document.documentElement.dataset.iamShell='true';document.documentElement.dataset.iamSidebar=saved?'collapsed':'open';
  const token=localStorage.getItem('magnanimous_admin_token')||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'';
  if(token){fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL||''}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{const n=d?.user?.name||d?.user?.email;if(n)setDisplayName(String(n).split('@')[0])}).catch(()=>{})}
  return()=>{delete document.documentElement.dataset.iamShell;delete document.documentElement.dataset.iamSidebar}
 },[]);
 useEffect(()=>{if(!path||publicPaths.includes(path))return;document.documentElement.dataset.iamSidebar=collapsed?'collapsed':'open';localStorage.setItem('iam_sidebar_collapsed',collapsed?'1':'0')},[collapsed,path]);
 const theme=useMemo(()=>themeFor(path),[path]);
 const items=owner?[...nav,...ownerNav]:nav;
 function submit(e:FormEvent){e.preventDefault();const q=query.trim();if(q)location.href=`/ai-chat?prompt=${encodeURIComponent(q)}`}
 if(!path||publicPaths.includes(path)||path.startsWith('/movie/'))return null;
 return <>
  <div className="iam-shell-ambient" aria-hidden="true"><div className="iam-shell-art" style={{backgroundImage:`url('${theme.image}')`}}/><i/><i/><i/></div>
  <header className="iam-shell-topbar">
   <button className="iam-mobile-nav" onClick={()=>setMobileOpen(v=>!v)} aria-label="Toggle platform navigation">MENU</button>
   <div className="iam-shell-route"><span className="iam-route-orb" style={{borderColor:theme.accent,boxShadow:`0 0 24px ${theme.accent}44`}}/><div><b>{theme.title}</b><small>{theme.subtitle}</small></div></div>
   <form onSubmit={submit} className="iam-shell-search"><span>Q</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..." aria-label="Search Magnanimous AI"/><button type="submit" aria-label="Search with Magnanimous AI" disabled={!query.trim()}>Search</button></form>
   <div className="iam-shell-user"><a href="/guide" className="guide">GUIDE</a><a href={owner?'/owner-center':'/account'} className="user"><span>{owner?'O':'M'}</span><div><small>Welcome</small><b>{displayName}</b><em>{owner?'Owner':'Account'}</em></div></a></div>
  </header>
  {mobileOpen&&<button className="iam-sidebar-scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
  <aside className={`iam-shell-sidebar ${collapsed?'collapsed':''} ${mobileOpen?'mobileOpen':''}`}>
   <div className="iam-side-brand"><a href="/"><span>M</span><div><b>I AM</b><strong>MAGNANIMOUS WAY(TM)</strong><small>AI ECOSYSTEM</small></div></a><button type="button" onClick={()=>setCollapsed(v=>!v)} aria-controls="iam-platform-nav" aria-expanded={!collapsed} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?'›':'‹'}</button></div>
   <nav id="iam-platform-nav" aria-label="Platform navigation">{items.map(item=><a key={item.href} href={item.href} className={path===item.href?'active':''} title={collapsed?item.label:undefined}><i className="iam-nav-illustration" aria-hidden="true"><img src={sidebarArt(item.href)} alt="" loading="lazy"/><em>{item.glyph}</em></i><span>{item.label}</span><b aria-hidden="true">&gt;</b></a>)}</nav>
   <a href="/activity" className="iam-side-status" aria-label="Open reports to inspect platform health"><span/><div><small>Platform Health</small><b>Check status in reports</b></div></a>
  </aside>
  <style jsx global>{`
   :root{--iam-shell-side:246px;--iam-shell-top:72px}html[data-iam-sidebar="collapsed"]{--iam-shell-side:82px}html[data-iam-shell="true"] body{background:#020714!important}html[data-iam-shell="true"] .iam-shell-content{position:relative;z-index:2;margin-left:var(--iam-shell-side);padding-top:var(--iam-shell-top);min-height:100vh;transition:margin-left .28s cubic-bezier(.2,.8,.2,1);overflow:hidden}html[data-iam-shell="true"] .iam-business-identity{margin-left:var(--iam-shell-side);transition:margin-left .28s ease}html[data-iam-shell="true"] .iam-shop-link{display:none}html[data-iam-shell="true"] .cinematicHome>.topbar{display:none!important}
   .iam-shell-ambient{position:fixed;z-index:0;inset:0;overflow:hidden;background:radial-gradient(circle at 72% 10%,rgba(25,120,255,.2),transparent 31%),radial-gradient(circle at 40% 85%,rgba(130,65,255,.12),transparent 33%),linear-gradient(145deg,#020612,#061026 58%,#020713);pointer-events:none}.iam-shell-art{position:absolute;inset:0 0 0 var(--iam-shell-side);background-size:cover;background-position:center;opacity:.11;filter:saturate(1.2) contrast(1.05);mix-blend-mode:screen;mask-image:linear-gradient(180deg,#000 0,transparent 68%);animation:iamBackdropDrift 18s ease-in-out infinite alternate}.iam-shell-ambient:before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(79,204,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(79,204,255,.035) 1px,transparent 1px);background-size:55px 55px;mask-image:linear-gradient(180deg,#0006,transparent 76%);animation:iamGridDrift 18s linear infinite}.iam-shell-ambient>i{position:absolute;border-radius:50%;border:1px solid rgba(87,219,255,.11);box-shadow:0 0 80px rgba(75,190,255,.08)}.iam-shell-ambient>i:nth-child(2){width:560px;height:560px;right:-150px;top:80px;animation:iamOrbit 26s linear infinite}.iam-shell-ambient>i:nth-child(3){width:330px;height:330px;right:12%;top:30%;border-color:rgba(255,194,83,.1);animation:iamOrbit 18s linear infinite reverse}.iam-shell-ambient>i:nth-child(4){width:720px;height:720px;left:22%;bottom:-520px;border-color:rgba(156,104,255,.12);animation:iamOrbit 32s linear infinite}
   .iam-shell-topbar{position:fixed;z-index:2147482500;left:var(--iam-shell-side);right:0;top:0;height:72px;display:grid;grid-template-columns:minmax(240px,.8fr) minmax(280px,1.2fr) auto;align-items:center;gap:18px;padding:0 22px;border-bottom:1px solid rgba(83,215,255,.24);background:linear-gradient(180deg,rgba(4,12,29,.97),rgba(3,10,24,.93));box-shadow:0 12px 42px rgba(0,0,0,.38),inset 0 -1px 0 rgba(99,230,255,.06);backdrop-filter:blur(20px) saturate(1.25);transition:left .28s ease}.iam-shell-route{display:flex;gap:10px;align-items:center;min-width:0}.iam-route-orb{width:34px;height:34px;flex:0 0 auto;border:1px solid #63e8ff;border-radius:50%;background:radial-gradient(circle at 38% 32%,#ffffffaa,transparent 14%),linear-gradient(145deg,#123450,#070d1b);animation:iamOrbPulse 3.8s ease-in-out infinite}.iam-shell-route div{min-width:0;display:grid}.iam-shell-route b{font:900 13px Inter,system-ui,sans-serif;color:#f5fbff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iam-shell-route small{font:700 8px Inter,system-ui,sans-serif;letter-spacing:.07em;color:#7eb7ce;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iam-shell-search{height:42px;max-width:560px;width:100%;justify-self:center;position:relative}.iam-shell-search span{position:absolute;left:14px;top:12px;color:#73e5ff;font:900 12px Inter,system-ui,sans-serif}.iam-shell-search input{box-sizing:border-box;width:100%;height:100%;border:1px solid rgba(77,185,255,.48)!important;border-radius:999px!important;padding:0 102px 0 42px!important;background:rgba(3,14,32,.72)!important;color:#eefaff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 8px 25px rgba(0,0,0,.22)!important}.iam-shell-search button{position:absolute;right:5px;top:5px;height:32px;padding:0 12px;border:1px solid rgba(77,185,255,.45);border-radius:999px;background:rgba(8,49,82,.92);color:#e6faff;font:800 11px Inter,system-ui,sans-serif;cursor:pointer}.iam-shell-search button:disabled{opacity:.55;cursor:not-allowed}.iam-shell-user{display:flex;align-items:center;gap:8px}.iam-shell-user .guide{padding:8px 10px;border:1px solid rgba(255,201,94,.35);border-radius:999px;text-decoration:none;color:#ffe39d;font:900 8px Inter,system-ui,sans-serif;letter-spacing:.08em}.iam-shell-user .user{display:flex;align-items:center;gap:8px;color:#eefaff;text-decoration:none}.iam-shell-user .user>span{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#152d48,#080b12);border:1px solid rgba(255,200,86,.55);color:#ffd16b;font-weight:900}.iam-shell-user .user div{display:grid}.iam-shell-user small,.iam-shell-user em{font:600 8px Inter,system-ui,sans-serif;color:#91aabd;font-style:normal}.iam-shell-user b{font:900 10px Inter,system-ui,sans-serif}.iam-mobile-nav{display:none}
   .iam-shell-sidebar{position:fixed;z-index:2147482600;left:0;top:0;bottom:0;width:246px;padding:10px;border-right:1px solid rgba(73,202,255,.25);background:linear-gradient(180deg,rgba(4,13,31,.985),rgba(3,9,22,.985));box-shadow:16px 0 48px rgba(0,0,0,.4),inset -1px 0 0 rgba(255,255,255,.03);backdrop-filter:blur(20px);transition:width .28s cubic-bezier(.2,.8,.2,1),transform .28s ease;overflow:hidden}.iam-side-brand{height:70px;display:flex;align-items:center;gap:8px;padding:0 4px 10px;border-bottom:1px solid rgba(92,210,255,.16)}.iam-side-brand>a{min-width:0;flex:1;display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none}.iam-side-brand>a>span{width:43px;height:43px;display:grid;place-items:center;flex:0 0 auto;color:#ffd16b;font-size:22px;font-weight:900;text-shadow:0 0 18px rgba(255,189,64,.38)}.iam-side-brand>a>div{display:grid;min-width:0}.iam-side-brand b{color:#fff;font-size:12px}.iam-side-brand strong{font-size:10px;white-space:nowrap;color:#eafaff}.iam-side-brand small{font-size:6px;letter-spacing:.17em;color:#e3b75d}.iam-side-brand button{width:29px;height:29px;border:1px solid rgba(81,210,255,.35);border-radius:50%;background:#08162b;color:#8ceaff;font-size:11px;font-weight:900;cursor:pointer}.iam-shell-sidebar nav{height:calc(100vh - 160px);overflow:auto;padding:8px 0}.iam-shell-sidebar nav a{height:42px;display:grid;grid-template-columns:34px 1fr 14px;gap:7px;align-items:center;margin:2px 0;padding:0 9px;border:1px solid transparent;border-radius:12px;color:#bfd4e3;text-decoration:none;font:700 11px Inter,system-ui,sans-serif;white-space:nowrap}.iam-shell-sidebar nav a i{font-style:normal;font-size:10px;font-weight:900;color:#75ddff;text-align:center}.iam-shell-sidebar nav a>b{color:#63dfff;font-size:16px;opacity:.45}.iam-shell-sidebar nav a:hover,.iam-shell-sidebar nav a.active{color:#fff;border-color:rgba(80,218,255,.48);background:linear-gradient(90deg,rgba(10,122,207,.75),rgba(9,56,111,.5));box-shadow:0 0 26px rgba(27,164,255,.16),inset 0 1px 0 rgba(255,255,255,.08)}.iam-shell-sidebar nav a.active i{color:#fff;text-shadow:0 0 12px #58dfff}.iam-side-status{height:58px;margin-top:7px;padding:9px 10px;border:1px solid rgba(75,171,219,.22);border-radius:13px;background:rgba(11,27,49,.7);display:flex;align-items:center;gap:9px}.iam-side-status>span{width:12px;height:12px;border-radius:50%;background:#22e6ad;box-shadow:0 0 14px #22e6ad;flex:0 0 auto}.iam-side-status div{display:grid}.iam-side-status small{font:700 8px Inter,system-ui,sans-serif;color:#9bb6c8}.iam-side-status b{font:700 9px Inter,system-ui,sans-serif;color:#dbfff2}.iam-shell-sidebar.collapsed{width:82px}.iam-shell-sidebar.collapsed .iam-side-brand>a>div,.iam-shell-sidebar.collapsed nav a span,.iam-shell-sidebar.collapsed nav a>b,.iam-shell-sidebar.collapsed .iam-side-status div{display:none}.iam-shell-sidebar.collapsed .iam-side-brand button{position:absolute;right:7px;top:56px;width:22px;height:22px;background:#0c213a}.iam-shell-sidebar.collapsed nav{padding-top:14px}.iam-shell-sidebar.collapsed nav a{grid-template-columns:1fr;padding:0;justify-items:center}.iam-shell-sidebar.collapsed nav a i{font-size:10px}.iam-shell-sidebar.collapsed .iam-side-status{justify-content:center;padding:8px}.iam-sidebar-scrim{display:none}
   @keyframes iamBackdropDrift{to{transform:scale(1.035) translate3d(-10px,-7px,0)}}@keyframes iamGridDrift{to{background-position:55px 55px}}@keyframes iamOrbit{to{transform:rotate(360deg)}}@keyframes iamOrbPulse{50%{transform:scale(1.08);filter:brightness(1.25)}}
   @media(max-width:1050px){.iam-shell-topbar{grid-template-columns:minmax(190px,.7fr) minmax(220px,1fr) auto}.iam-shell-user .guide{display:none}.iam-shell-user .user div{display:none}}
   @media(max-width:820px){:root{--iam-shell-side:0px!important;--iam-shell-top:66px}html[data-iam-shell="true"] .iam-shell-content{margin-left:0!important;padding-top:66px}html[data-iam-shell="true"] .iam-business-identity{margin-left:0!important}.iam-shell-topbar{left:0!important;height:66px;grid-template-columns:48px 1fr auto;padding:0 10px;gap:8px}.iam-mobile-nav{display:grid;width:44px;height:38px;place-items:center;border:1px solid rgba(78,205,255,.4);border-radius:11px;background:#071830;color:#dffaff;font:900 8px Inter,system-ui,sans-serif}.iam-shell-route{display:none}.iam-shell-search{max-width:none;height:40px}.iam-shell-user .user>span{width:34px;height:34px}.iam-shell-user .user div{display:none}.iam-shell-sidebar{transform:translateX(-105%);width:min(286px,86vw);box-shadow:22px 0 70px rgba(0,0,0,.68)}.iam-shell-sidebar.mobileOpen{transform:translateX(0)}.iam-shell-sidebar.collapsed{width:min(286px,86vw)}.iam-shell-sidebar.collapsed .iam-side-brand>a>div,.iam-shell-sidebar.collapsed nav a span,.iam-shell-sidebar.collapsed nav a>b,.iam-shell-sidebar.collapsed .iam-side-status div{display:grid}.iam-shell-sidebar.collapsed .iam-side-brand button{position:static;width:29px;height:29px}.iam-shell-sidebar.collapsed nav a{grid-template-columns:34px 1fr 14px;padding:0 9px;justify-items:stretch}.iam-shell-sidebar.collapsed nav a i{font-size:10px}.iam-shell-sidebar.collapsed .iam-side-status{justify-content:flex-start;padding:9px 10px}.iam-sidebar-scrim{display:block;position:fixed;z-index:2147482550;inset:0;border:0;background:rgba(0,0,0,.58);backdrop-filter:blur(2px)}.iam-shell-art{inset:0;opacity:.08;background-position:center top}html[data-iam-shell="true"] .iam-tour-launch{top:auto!important;bottom:14px!important;right:12px!important}}
   /* A shared sapphire-and-gold frame for the real navigation controls on every internal page. */
   .iam-shell-topbar{isolation:isolate;border-bottom:2px solid rgba(242,189,92,.92);background:radial-gradient(ellipse at 83% -28%,rgba(76,212,255,.24),transparent 38%),radial-gradient(ellipse at 13% 125%,rgba(247,176,72,.2),transparent 43%),linear-gradient(115deg,rgba(2,9,29,.985),rgba(7,29,63,.985) 51%,rgba(2,9,29,.985));box-shadow:0 2px 0 rgba(102,223,255,.35),0 16px 43px rgba(0,0,0,.57),inset 0 1px rgba(255,225,155,.28),inset 0 -12px 20px rgba(4,15,41,.7)}
   .iam-shell-topbar:before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 37% 110%,rgba(254,207,98,.24),transparent 45%),radial-gradient(ellipse at 68% -40%,rgba(78,195,255,.27),transparent 48%);animation:iamCinematicChromeGlow 13s ease-in-out infinite alternate}
   .iam-shell-topbar:after{content:'';position:absolute;left:3%;right:3%;bottom:0;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,#7be5ff 20%,#fcd786 49%,#7be5ff 80%,transparent);box-shadow:0 0 16px rgba(255,206,100,.8)}
   .iam-shell-topbar>*{position:relative;z-index:1}
   .iam-route-orb{background:radial-gradient(circle at 34% 27%,#fcf6dd 0%,#84eaff 13%,#123c86 45%,#03091c 79%);border:2px solid #f0c56c!important;box-shadow:0 0 0 2px rgba(18,112,177,.48),0 0 21px rgba(84,221,255,.48),inset 0 0 8px rgba(255,236,161,.52)!important}
   .iam-shell-route b{color:#ffe2a2;text-shadow:0 1px #79501d,0 2px #312008,0 0 13px rgba(254,201,94,.26)}
   .iam-shell-route small{color:#a6e5ff}
   .iam-shell-search input{border:1px solid #c6a35d!important;background:linear-gradient(120deg,rgba(2,10,29,.97),rgba(9,36,73,.91))!important;box-shadow:0 7px 23px rgba(0,0,0,.44),inset 0 1px rgba(142,223,255,.18),0 0 0 1px rgba(86,199,255,.15)!important}
   .iam-shell-search button:not(:disabled){color:#fff0c8;background:linear-gradient(130deg,#103967,#94672c);border-color:#f2cb7d;box-shadow:inset 0 1px rgba(255,231,177,.3),0 0 11px rgba(243,179,70,.2)}
   .iam-shell-user .guide{border-color:#e4b967;background:linear-gradient(130deg,rgba(9,32,75,.95),rgba(66,47,24,.85));box-shadow:inset 0 1px rgba(255,230,183,.2)}
   .iam-shell-user .user>span{background:radial-gradient(circle at 30% 24%,#3679bf,#122a58 42%,#060e26 83%);border:2px solid #dcad59;color:#ffdf9b;box-shadow:0 0 15px rgba(71,188,255,.3),inset 0 1px rgba(255,225,158,.3)}
   .iam-shell-sidebar{border-right:2px solid rgba(222,172,84,.66);background:radial-gradient(ellipse at 75% 4%,rgba(54,170,255,.16),transparent 32%),radial-gradient(ellipse at -30% 76%,rgba(209,150,52,.1),transparent 45%),linear-gradient(175deg,#061730,#020a1e 70%,#050c22);box-shadow:0 0 0 1px rgba(64,183,245,.2),18px 0 48px rgba(0,0,0,.54),inset -3px 0 13px rgba(190,140,55,.1)}
   .iam-side-brand{border-bottom:1px solid rgba(237,190,107,.55)}
   .iam-side-brand>a>span{border:2px solid #e1b968;border-radius:13px;background:radial-gradient(circle at 35% 28%,#315da5,#0b214b 55%,#020a1b);box-shadow:0 0 18px rgba(73,190,249,.28),inset 0 2px rgba(255,232,165,.26),0 3px 11px #0009}
   .iam-side-brand strong{color:#ffe6b1;text-shadow:0 1px #82531f,0 0 10px rgba(242,186,88,.22)}
   .iam-side-brand button{border-color:#d9b66d;color:#ffdf9c;background:linear-gradient(140deg,#0a2a56,#07132c)}
   .iam-shell-sidebar nav a:hover,.iam-shell-sidebar nav a.active{border-color:rgba(249,196,94,.79);background:linear-gradient(105deg,rgba(22,81,141,.84),rgba(64,44,25,.53));box-shadow:0 0 18px rgba(49,171,255,.2),inset 0 1px rgba(255,223,154,.25)}
   .iam-shell-sidebar nav a.active i{color:#ffe4a0;text-shadow:0 0 11px rgba(255,196,92,.7)}
   .iam-side-status{border-color:rgba(225,177,91,.48);background:linear-gradient(100deg,rgba(7,31,60,.9),rgba(29,27,35,.8))}
   .iam-mobile-nav{border:1px solid #e3bb6f;background:linear-gradient(135deg,#16427d,#0b1b40);color:#ffe4ad;box-shadow:inset 0 1px rgba(255,234,171,.28),0 0 15px rgba(63,194,254,.17)}
   @keyframes iamCinematicChromeGlow{from{opacity:.46;filter:hue-rotate(0deg)}to{opacity:.9;filter:hue-rotate(11deg)}}
   @media(max-width:820px){
    .iam-shell-topbar{grid-template-columns:44px minmax(0,1fr) 34px;gap:7px;padding:0 10px;border-bottom-width:2px}
    .iam-mobile-nav{width:42px;height:37px}
    .iam-shell-search{min-width:0}
    .iam-shell-search span{left:11px}
    .iam-shell-search input{padding:0 70px 0 31px!important;font-size:12px!important;min-width:0}
    .iam-shell-search button{padding:0 8px;font-size:10px;right:4px}
    .iam-shell-user .user>span{width:32px;height:32px}
    .iam-shell-sidebar{border-right:2px solid #d6ab60}
   }
   @media(max-width:380px){.iam-shell-topbar{grid-template-columns:40px minmax(0,1fr) 32px;gap:5px;padding:0 7px}.iam-mobile-nav{width:40px;height:36px}.iam-shell-search input{padding-right:65px!important}.iam-shell-search button{padding:0 6px;font-size:9px}.iam-shell-user .user>span{width:30px;height:30px}}

   /* Royal illustrated navigation: shared by every routed workspace. */
   .iam-shell-sidebar nav a{min-height:60px;height:auto;grid-template-columns:58px minmax(0,1fr) 13px;gap:9px;padding:6px 7px;margin:4px 0;border:1px solid rgba(106,207,255,.19);border-radius:13px;background:linear-gradient(100deg,rgba(6,32,68,.91),rgba(2,13,31,.86));box-shadow:inset 0 1px rgba(135,216,255,.1),0 5px 14px rgba(0,0,0,.19);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;white-space:normal}
   .iam-shell-sidebar nav a>span{overflow-wrap:anywhere;font-size:11px;line-height:1.3;font-weight:850;color:#eef8ff}
   .iam-shell-sidebar nav a i.iam-nav-illustration{position:relative;display:block;overflow:hidden;width:54px;height:46px;border:1px solid rgba(239,193,97,.58);border-radius:10px;background:#071b38;box-shadow:0 0 13px rgba(62,188,255,.2),inset 0 0 0 1px rgba(255,234,169,.15)}
   .iam-nav-illustration img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(1.25) contrast(1.08);transform:scale(1.07);transition:transform .4s ease,filter .4s ease}
   .iam-nav-illustration:after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 27%,rgba(255,221,148,.26) 50%,transparent 70%);transform:translateX(-135%);pointer-events:none}
   .iam-nav-illustration em{position:absolute;left:3px;bottom:2px;padding:1px 3px;border-radius:3px;background:rgba(1,10,28,.78);font-style:normal;font-size:7px;letter-spacing:.03em;color:#fff0b8;text-shadow:0 0 4px #000}
   .iam-shell-sidebar nav a:hover,.iam-shell-sidebar nav a.active{transform:translateX(2px);border-color:#f4c977;box-shadow:0 0 20px rgba(50,165,255,.25),inset 0 1px rgba(255,222,143,.27)}
   .iam-shell-sidebar nav a:hover .iam-nav-illustration img,.iam-shell-sidebar nav a.active .iam-nav-illustration img{transform:scale(1.17);filter:saturate(1.5) brightness(1.14)}
   .iam-shell-sidebar nav a:hover .iam-nav-illustration:after,.iam-shell-sidebar nav a.active .iam-nav-illustration:after{animation:iamNavLight 2.9s ease-in-out infinite}
   .iam-shell-sidebar nav a:nth-child(4n + 1) .iam-nav-illustration{animation:iamNavBreath 7s ease-in-out infinite}
   @keyframes iamNavLight{50%{transform:translateX(135%)}100%{transform:translateX(135%)}}
   @keyframes iamNavBreath{50%{box-shadow:0 0 19px rgba(69,206,255,.48),inset 0 0 0 1px rgba(255,234,169,.28)}}
   .iam-side-brand>a>span{font-family:Georgia,serif}
   .iam-side-status{color:#d6e5f1;text-decoration:none;cursor:pointer}
   .iam-side-status>span{background:#9aadc2;box-shadow:0 0 9px rgba(153,178,207,.28)}
   .iam-side-status:hover{border-color:#f4c977;box-shadow:0 0 17px rgba(48,185,255,.22)}
   /* The desktop collapse frees the full content width, not merely the label text. */
   @media(min-width:821px){
    html[data-iam-sidebar="collapsed"]{--iam-shell-side:0px}
    .iam-shell-sidebar.collapsed{width:0;padding:0;border:0;background:transparent;box-shadow:none;overflow:visible;backdrop-filter:none}
    .iam-shell-sidebar.collapsed nav,.iam-shell-sidebar.collapsed .iam-side-status{display:none}
    .iam-shell-sidebar.collapsed .iam-side-brand{position:fixed;left:8px;top:82px;width:40px;height:40px;padding:0;border:0;background:transparent}
    .iam-shell-sidebar.collapsed .iam-side-brand>a{display:none}
    .iam-shell-sidebar.collapsed .iam-side-brand button{position:static;width:40px;height:40px;border:2px solid #f3c56d;background:linear-gradient(140deg,#074a81,#081832);font-size:24px;box-shadow:0 0 16px rgba(64,204,255,.4);cursor:pointer}
    html[data-iam-sidebar="collapsed"] .iam-shell-content{width:100%;max-width:none}
   }
   @media(max-width:820px){
    .iam-shell-sidebar nav a{min-height:56px;grid-template-columns:54px minmax(0,1fr) 12px}
    .iam-shell-sidebar.collapsed nav a{grid-template-columns:54px minmax(0,1fr) 12px;padding:6px 7px}
    .iam-shell-sidebar.collapsed nav a i.iam-nav-illustration{width:50px;height:43px}
   }
   @media(prefers-reduced-motion:reduce){
    .iam-shell-sidebar nav a,.iam-nav-illustration,.iam-nav-illustration img,.iam-nav-illustration:after{animation:none!important;transition:none!important;transform:none!important}
   }

   @media(prefers-reduced-motion:reduce){.iam-shell-art,.iam-shell-ambient:before,.iam-shell-ambient>i,.iam-route-orb,.iam-shell-topbar:before{animation:none!important}}
  `}</style>
 </>;
}
