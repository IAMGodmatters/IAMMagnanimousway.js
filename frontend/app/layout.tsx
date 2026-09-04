import React from 'react';
import type {Metadata} from 'next';
import PlatformChrome from './platform-chrome';
import GlobalTools from './global-tools';
import InteractionClarity from './interaction-clarity';

const siteUrl='https://iammagnanimousway.com';
const googleVerification=process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||'';

export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{default:'I AM Magnanimous Way™ | AI Business Execution Platform',template:'%s | I AM Magnanimous Way™'},
  description:'I AM Magnanimous Way™ is a free-first AI business execution platform centered on Magnanimous AI: the official AI identity for planning and coordinating work across business tools, CRM, content, calling, video, connected accounts and specialized AI capabilities.',
  applicationName:'I AM Magnanimous Way™',
  keywords:['I AM Magnanimous Way','Magnanimous AI','AI business orchestrator','AI business execution platform','professional business plan','business launch','free AI tools','AI agents','AI assistant','CRM','AI video','business automation'],
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',url:siteUrl,siteName:'I AM Magnanimous Way™',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI plans, creates, connects and coordinates work across your business stack.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'I AM Magnanimous Way — Magnanimous AI'}]},
  twitter:{card:'summary_large_image',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI for business execution, CRM, content, calling, video and connected work.',images:['/iam-operator-share.svg']},
  verification:googleVerification?{google:googleVerification}:undefined
};

const monthly=(name:string,price:string)=>({'@type':'Offer',price,priceCurrency:'USD',name,priceSpecification:{'@type':'UnitPriceSpecification',price,priceCurrency:'USD',unitText:'MONTH'}});
const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'I AM Magnanimous Way™',url:siteUrl},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'I AM Magnanimous Way™',publisher:{'@id':`${siteUrl}/#organization`},inLanguage:'en'},
    {'@type':'SoftwareApplication','@id':`${siteUrl}/#software`,name:'I AM Magnanimous Way™',alternateName:'Magnanimous AI',url:siteUrl,applicationCategory:'BusinessApplication',operatingSystem:'Web',description:'A free-first AI business execution platform centered on Magnanimous AI with specialized AI capabilities, professional business planning, CRM, calling, video, connected actions and business workflows.',offers:[
      {'@type':'Offer',price:'0',priceCurrency:'USD',name:'Free'},
      monthly('Magnanimous Plus','19'),monthly('Full Business','49'),monthly('Professional Business Plan','79'),monthly('Magnanimous Pro','99'),monthly('Magnanimous Scale','199')
    ]}
  ]
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><a className="iam-skip-link" href="#iam-main">Skip to main content</a>{children}<PlatformChrome/><GlobalTools/><InteractionClarity/>
    <style>{`html{color-scheme:dark;scroll-behavior:smooth}body{margin:0}.iam-skip-link{position:fixed;left:16px;top:12px;z-index:2147483647;transform:translateY(-150%);padding:11px 14px;border-radius:9px;background:#eafaff;color:#051015;font:900 13px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 30px rgba(0,0,0,.4)}.iam-skip-link:focus{transform:translateY(0)}:where(a,button,input,textarea,select,[role="button"]):focus-visible{outline:3px solid #63e6ff!important;outline-offset:3px!important}::selection{background:#55d9f0;color:#041017}html[data-iam-public="true"] .iam-intelligence-art,html[data-iam-public="true"] .iam-command-button,html[data-iam-public="true"] .iam-command-menu,html[data-iam-public="true"] .iam-va-button,html[data-iam-public="true"] .iam-nudge,html[data-iam-public="true"] .iam-va-panel,html[data-iam-public="true"] .iam-global-tools{display:none!important}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function normalize(path){var clean=(path||'/').replace(/\\/+$/,'');return clean||'/';}
      var publicPaths=['/solutions','/business-plan','/guide','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security'];
      var currentPath=normalize(location.pathname);
      if(publicPaths.indexOf(currentPath)!==-1)document.documentElement.setAttribute('data-iam-public','true');
      var main=document.querySelector('main');if(main&&!main.id)main.id='iam-main';
      function migrateMagnanimousSession(){
        var official=localStorage.getItem('magnanimous_admin_token');
        var legacy=localStorage.getItem('odin_admin_token');
        if(!official&&legacy){localStorage.setItem('magnanimous_admin_token',legacy);official=legacy;}
        return official||legacy||'';
      }
      function guardProtectedRoute(){
        var p=currentPath;
        var customer=localStorage.getItem('iam_account_token');
        var owner=migrateMagnanimousSession();
        var active=sessionStorage.getItem('iam_session_active');
        if(p==='/'){if(!customer&&!owner)location.replace('/solutions');return;}
        if(publicPaths.indexOf(p)!==-1)return;
        var valid=(active==='user'&&!!customer)||(active==='owner'&&!!owner);
        if(!valid)location.replace('/login');
      }
      function polishCustomerUI(){
        var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p)return NodeFilter.FILTER_ACCEPT;var tag=p.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT'||tag==='TEXTAREA')return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
        var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(function(n){var before=n.nodeValue||'';var after=before.replace(/ODIN/g,'MAGNANIMOUS AI').replace(/Odin/g,'Magnanimous AI').replace(/I AM OPERATOR/g,'MAGNANIMOUS AI').replace(/I AM Operator/g,'Magnanimous AI').split('Owner / Admin').join('Workspace Admin');if(after!==before)n.nodeValue=after;});
        document.querySelectorAll('.metrics article').forEach(function(card){if((card.textContent||'').indexOf('READY PROVIDERS')!==-1){card.style.display='none';var parent=card.parentElement;if(parent)parent.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';}});
      }
      function loadAds(){fetch('/api/monetization/config',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(c){if(!c)return;var configured=!!(c.adsense_configured||c.auto_ads_ready||c.ads_enabled);var client=c.adsense_client_id||c.adsense_client||'';if(!configured||!client||document.getElementById('iam-adsense'))return;var s=document.createElement('script');s.id='iam-adsense';s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);document.head.appendChild(s);}).catch(function(){});}
      migrateMagnanimousSession();guardProtectedRoute();polishCustomerUI();new MutationObserver(function(){polishCustomerUI()}).observe(document.body,{subtree:true,childList:true});loadAds();
    })();`}} />
  </body></html>
}
