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

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{}}}
async function safeJson(url:string){try{return await fetch(url).then(read)}catch{return{}}}

export default function Home(){
 const[query,setQuery]=useState('');
 const[ads,setAds]=useState<Ad[]>([]);
 const[adConfig,setAdConfig]=useState<AdConfig>({adsense_configured:false,adsense_client_id:null,adsense_home_slot:null,auto_ads_ready:false});
 const[ready,setReady]=useState(false),[online,setOnline]=useState(false);
 useEffect(()=>{(async()=>{const[health,t,a,mc]=await Promise.all([safeJson(`${api}/health`),safeJson(`${api}/api/tools`),safeJson(`${api}/api/ads?placement=home`),safeJson(`${api}/api/monetization/config`)]);setOnline(health?.status==='ok'&&Array.isArray(t.tools));setAds(a.ads||[]);setAdConfig({adsense_configured:!!mc.adsense_configured,adsense_client_id:mc.adsense_client_id||null,adsense_home_slot:mc.adsense_home_slot||null,auto_ads_ready:!!mc.auto_ads_ready});setReady(true)})()},[]);
 useEffect(()=>{const client=adConfig.adsense_client_id;if(!client)return;const existing=document.querySelector('script[data-iam-adsense="true"]') as HTMLScriptElement|null;const requestAd=()=>{if(!adConfig.adsense_home_slot)return;try{((window as any).adsbygoogle=(window as any).adsbygoogle||[]).push({})}catch{}};if(existing){requestAd();return}const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;script.dataset.iamAdsense='true';script.onload=requestAd;document.head.appendChild(script)},[adConfig.adsense_client_id,adConfig.adsense_home_slot]);
 function submit(e:FormEvent){e.preventDefault();const q=query.trim();location.href=q?`/ai-chat?prompt=${encodeURIComponent(q)}`:'/ai-chat'}
 return <main className="exactHome">
  <section className="exactStage" aria-label="I AM MAGNANIMOUS WAY AI ecosystem dashboard">
   <img className="exactArtwork" src="/crm-upgrade.jpeg" alt="I AM MAGNANIMOUS WAY AI Ecosystem dashboard" draggable={false}/>
   <a className="hot brandHot" href="/" aria-label="I AM MAGNANIMOUS WAY home"><span>Home</span></a>
   {topLinks.map(item=><a key={item.label} className="hot topHot" style={{left:`${item.left}%`,width:`${item.width}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   <form className="searchHot" onSubmit={submit} role="search"><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search anything" placeholder="Search anything..."/><button type="submit" aria-label="Search Magnanimous AI">Search</button></form>
   <a className="hot notifyHot" href="/activity" aria-label="Open reports and notifications"><span>Reports and notifications</span></a>
   <a className="hot accountHot" href="/owner-center" aria-label="Open owner account"><span>Owner account</span></a>
   <a className="hot tutorialHot" href="/guide" aria-label="Watch platform tutorial"><span>Watch Tutorial</span></a>
   {sideLinks.map((item,i)=><a key={`side-${item.label}`} className="hot sideHot" style={{top:`${10.72+i*3.93}%`}} href={item.href} aria-label={item.label}><span>{item.label}</span></a>)}
   {cardLinks.map((item,i)=>{const col=i%5,row=Math.floor(i/5);return <a key={`card-${item.label}`} className="hot cardHot" style={{left:`${14.25+col*16.78}%`,top:`${42.2+row*13.55}%`}} href={item.href} aria-label={`Open ${item.label}`}><span>{item.label}</span></a>})}
   <span className="srStatus" aria-live="polite">{ready?(online?'Magnanimous AI online. Systems ready.':'Platform loaded. Some live services are unavailable.'):'Checking Magnanimous AI status.'}</span>
  </section>
  {(ads.length>0||adConfig.adsense_configured)&&<section className="revenue" aria-label="Sponsored advertising"><div className="revenueHead"><small>SPONSORED / ADVERTISING</small><span>Advertising stays separate from AI answers</span></div>{ads.length>0&&<div className="sponsors">{ads.map(ad=><a key={ad.id} href={ad.url} target="_blank" rel="sponsored noopener noreferrer"><small>{ad.label||'Sponsored'}</small><b>{ad.title}</b></a>)}</div>}{adConfig.adsense_configured&&<div className="adsense">{adConfig.adsense_home_slot&&adConfig.adsense_client_id?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={adConfig.adsense_client_id} data-ad-slot={adConfig.adsense_home_slot} data-ad-format="auto" data-full-width-responsive="true"/>:<p>Approved AdSense Auto Ads are enabled.</p>}</div>}</section>}
  <style jsx>{`
   .exactHome{margin:0;min-height:100vh;background:#020713;color:#eefaff;font-family:Inter,system-ui,sans-serif}.exactStage{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#020713}.exactArtwork{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;user-select:none;-webkit-user-drag:none}.hot{position:absolute;z-index:4;display:block;background:transparent;text-decoration:none;cursor:pointer;border:0;border-radius:8px}.hot span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.hot:focus-visible,.searchHot:focus-within{outline:2px solid #5ee7ff;outline-offset:-2px;box-shadow:0 0 20px rgba(94,231,255,.38)}.brandHot{left:.7%;top:.8%;width:19.2%;height:8.7%}.topHot{top:2.25%;height:5.3%}.notifyHot{left:84.9%;top:1.45%;width:2.6%;height:6%}.accountHot{left:87.7%;top:.9%;width:11.4%;height:7.3%}.tutorialHot{left:84.6%;top:27.2%;width:11.2%;height:5.1%}.sideHot{left:.75%;width:12.2%;height:3.55%;border-radius:6px}.cardHot{width:15.55%;height:11.85%;border-radius:12px}.searchHot{position:absolute;z-index:6;left:69.8%;top:2.05%;width:14.55%;height:5.15%;margin:0}.searchHot input{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:1px solid rgba(61,214,255,.44);border-radius:999px;padding:0 31px 0 14px;background:rgba(4,15,35,.93);color:#eafaff;font:600 clamp(7px,.72vw,12px) Inter,system-ui,sans-serif;outline:none}.searchHot input::placeholder{color:#7f9daf;opacity:.85}.searchHot button{position:absolute;right:5%;top:17%;width:16%;height:66%;border:0;background:transparent;color:transparent;cursor:pointer}.srStatus{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.revenue{margin:18px auto 34px;width:min(1100px,calc(100% - 32px));padding:16px;border:1px solid rgba(79,204,255,.22);border-radius:18px;background:rgba(5,18,38,.9);box-shadow:0 18px 55px rgba(0,0,0,.3)}.revenueHead{display:flex;justify-content:space-between;gap:12px;color:#789bad;font-size:9px;letter-spacing:.12em}.sponsors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.sponsors a{border:1px solid #254e6d;padding:10px;border-radius:10px;color:#dff9ff;text-decoration:none;display:grid;gap:4px}.sponsors small{color:#77a1b9}.adsense{margin-top:12px}
   @media(max-width:760px){.searchHot input{padding-left:7px;padding-right:14px}.revenueHead{flex-direction:column}.sponsors{grid-template-columns:1fr}}
  `}</style>
  <style jsx global>{`
   html[data-iam-shell="true"] body{background:#020713!important}html[data-iam-shell="true"] .iam-shell-content{margin-left:0!important;padding-top:0!important;overflow:visible!important;transition:none!important}html[data-iam-shell="true"] .iam-shell-topbar,html[data-iam-shell="true"] .iam-shell-sidebar,html[data-iam-shell="true"] .iam-shell-ambient,html[data-iam-shell="true"] .iam-business-identity,html[data-iam-shell="true"] .iam-shop-link,html[data-iam-shell="true"] .iam-intelligence-art,html[data-iam-shell="true"] .iam-command-button,html[data-iam-shell="true"] .iam-command-menu,html[data-iam-shell="true"] .iam-va-button,html[data-iam-shell="true"] .iam-nudge,html[data-iam-shell="true"] .iam-va-panel,html[data-iam-shell="true"] .iam-global-tools{display:none!important}
  `}</style>
 </main>
}
