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
  description:'I AM Magnanimous Way™ is a free-first AI business execution platform operated under the registered business name God Matters, centered on Magnanimous AI for planning and coordinating work across business tools, CRM, content, calling, video, connected accounts and specialized AI capabilities.',
  applicationName:'I AM Magnanimous Way™',
  keywords:['God Matters','I AM Magnanimous Way','Magnanimous AI','AI business orchestrator','AI business execution platform','professional business plan','business launch','free AI tools','AI agents','AI assistant','CRM','AI video','business automation'],
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',url:siteUrl,siteName:'I AM Magnanimous Way™',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI plans, creates, connects and coordinates work across your business stack. Registered business name: God Matters.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'I AM Magnanimous Way — Magnanimous AI'}]},
  twitter:{card:'summary_large_image',title:'I AM Magnanimous Way™ | Magnanimous AI',description:'Magnanimous AI for business execution, CRM, content, calling, video and connected work. Registered business name: God Matters.',images:['/iam-operator-share.svg']},
  verification:googleVerification?{google:googleVerification}:undefined
};

const monthly=(name:string,price:string)=>({'@type':'Offer',price,priceCurrency:'USD',name,priceSpecification:{'@type':'UnitPriceSpecification',price,priceCurrency:'USD',unitText:'MONTH'}});
const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'God Matters',alternateName:['I AM Magnanimous Way™','God Matters All The Time'],url:siteUrl,brand:{'@type':'Brand',name:'I AM Magnanimous Way™'}},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'I AM Magnanimous Way™',alternateName:'God Matters',publisher:{'@id':`${siteUrl}/#organization`},inLanguage:'en'},
    {'@type':'SoftwareApplication','@id':`${siteUrl}/#software`,name:'I AM Magnanimous Way™',alternateName:'Magnanimous AI',url:siteUrl,applicationCategory:'BusinessApplication',operatingSystem:'Web',description:'A free-first AI business execution platform centered on Magnanimous AI with specialized AI capabilities, professional business planning, CRM, calling, video, connected actions and business workflows.',offers:[
      {'@type':'Offer',price:'0',priceCurrency:'USD',name:'Free'},
      monthly('Magnanimous Plus','19'),monthly('Full Business','49'),monthly('Professional Business Plan','79'),monthly('Magnanimous Pro','99'),monthly('Magnanimous Scale','199')
    ]}
  ]
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><a className="iam-skip-link" href="#iam-main">Skip to main content</a><a className="iam-shop-link" href="/shop" aria-label="Open God Matters Marketplace">🛍 Shop</a>{children}
    <aside className="iam-business-identity" aria-label="Business identity"><strong>God Matters</strong><span>Registered business name (DBA) • I AM MAGNANIMOUS WAY™ brand</span></aside>
    <PlatformChrome/><GlobalTools/><InteractionClarity/>
    <style>{`html{color-scheme:dark;scroll-behavior:smooth;max-width:100%;overflow-x:hidden}body{margin:0;max-width:100%;overflow-x:hidden}.iam-skip-link{position:fixed;left:16px;top:12px;z-index:2147483647;transform:translateY(-150%);padding:11px 14px;border-radius:9px;background:#eafaff;color:#051015;font:900 13px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 30px rgba(0,0,0,.4)}.iam-skip-link:focus{transform:translateY(0)}.iam-shop-link{position:fixed;right:16px;top:14px;z-index:2147483001;padding:10px 14px;border:1px solid rgba(255,211,110,.55);border-radius:999px;background:rgba(5,18,38,.94);color:#ffe39a;text-decoration:none;font:900 11px Inter,system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 10px 28px rgba(0,0,0,.35);backdrop-filter:blur(10px)}.iam-shop-link:hover{border-color:#63e6ff;color:#eaffff}.iam-business-identity{margin:0;padding:15px 20px;border-top:1px solid rgba(99,230,255,.28);background:#020b1e;color:#b9d5e4;display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;text-align:center;font:600 11px Inter,system-ui,sans-serif;letter-spacing:.02em}.iam-business-identity strong{color:#fff;font-size:13px}.iam-business-identity span{color:#9fc6d9}:where(a,button,input,textarea,select,[role="button"]):focus-visible{outline:3px solid #63e6ff!important;outline-offset:3px!important}::selection{background:#55d9f0;color:#041017}html[data-iam-public="true"] .iam-intelligence-art,html[data-iam-public="true"] .iam-command-button,html[data-iam-public="true"] .iam-command-menu,html[data-iam-public="true"] .iam-va-button,html[data-iam-public="true"] .iam-nudge,html[data-iam-public="true"] .iam-va-panel,html[data-iam-public="true"] .iam-global-tools{display:none!important}html[data-iam-standalone="true"] .iam-shop-link,html[data-iam-standalone="true"] .iam-business-identity,html[data-iam-standalone="true"] .iam-help-link,html[data-iam-standalone="true"] .iam-brand-watermark,html[data-iam-standalone="true"] .iam-intelligence-art,html[data-iam-standalone="true"] .iam-command-button,html[data-iam-standalone="true"] .iam-command-menu,html[data-iam-standalone="true"] .iam-va-button,html[data-iam-standalone="true"] .iam-nudge,html[data-iam-standalone="true"] .iam-va-panel,html[data-iam-standalone="true"] .iam-global-tools{display:none!important}@media(max-width:760px){.iam-shop-link{right:10px;top:10px;padding:9px 12px;font-size:10px}.iam-business-identity{padding:13px 12px;gap:6px;flex-direction:column}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function normalize(path){var clean=(path||'/').replace(/\\/+$/,'');return clean||'/';}
      var publicPaths=['/solutions','/business-plan','/guide','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security','/shop','/magnanimous'];
      var currentPath=normalize(location.pathname);
      var standalone=currentPath==='/magnanimous'||currentPath.indexOf('/magnanimous/')===0;
      if(publicPaths.indexOf(currentPath)!==-1||standalone)document.documentElement.setAttribute('data-iam-public','true');
      if(standalone)document.documentElement.setAttribute('data-iam-standalone','true');
      var main=document.querySelector('main');if(main&&!main.id)main.id='iam-main';
      function installRootAutosave(){
        if(window.__iamRootAutosaveInstalled)return;window.__iamRootAutosaveInstalled=true;
        var prefix='iam_progress_draft:';
        var sensitive=/password|passwd|passcode|secret|token|authorization|api.?key|card|cvv|cvc|security.?code/i;
        function eligible(el){
          if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
          if(el instanceof HTMLInputElement&&['text','search','email','url','tel','number'].indexOf(el.type)===-1)return false;
          var marker=[el.name,el.id,el.getAttribute('aria-label'),el.placeholder,el.autocomplete].filter(Boolean).join(' ');
          return !sensitive.test(marker)&&!el.closest('[data-no-autosave="true"]');
        }
        function field(el){return String(el.name||el.id||el.getAttribute('aria-label')||el.placeholder||el.tagName.toLowerCase()).slice(0,180);}
        function clean(value){return String(value||'').replace(/\\bBearer\\s+\\S+/gi,'Bearer [REDACTED]').replace(/(password|passwd|passcode|secret|token|authorization|api.?key|cvv|cvc)\\s*[:=]\\s*\\S+/gi,'$1=[REDACTED]').slice(0,30000);}
        function key(el){return prefix+location.pathname+':'+field(el);}
        function save(event){
          var el=event&&event.target;if(!eligible(el))return;
          var record={value:clean(el.value),updatedAt:Date.now(),path:location.pathname,field:field(el),stage:'working'};
          try{localStorage.setItem(key(el),JSON.stringify(record));}catch(e){}
        }
        function restore(){
          document.querySelectorAll('input,textarea').forEach(function(el){
            if(!eligible(el)||String(el.value||'').trim())return;
            try{
              var raw=localStorage.getItem(key(el));if(!raw)return;
              var record=JSON.parse(raw);if(!record||!record.value||record.stage==='submitted'||Date.now()-Number(record.updatedAt||0)>604800000)return;
              var proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
              var descriptor=Object.getOwnPropertyDescriptor(proto,'value');var setter=descriptor&&descriptor.set;
              if(setter)setter.call(el,record.value);else el.value=record.value;
              el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
            }catch(e){}
          });
        }
        document.addEventListener('input',save,true);document.addEventListener('change',save,true);
        restore();setTimeout(restore,100);setTimeout(restore,500);setTimeout(restore,1500);
      }
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
        if(standalone||publicPaths.indexOf(p)!==-1)return;
        var valid=(active==='user'&&!!customer)||(active==='owner'&&!!owner);
        if(!valid)location.replace('/login');
      }
      function polishCustomerUI(){
        if(publicPaths.indexOf(currentPath)!==-1||standalone)return;
        var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p)return NodeFilter.FILTER_ACCEPT;var tag=p.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT'||tag==='TEXTAREA')return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
        var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(function(n){var before=n.nodeValue||'';var after=before.replace(/ODIN/g,'MAGNANIMOUS AI').replace(/Odin/g,'Magnanimous AI').replace(/I AM OPERATOR/g,'MAGNANIMOUS AI').replace(/I AM Operator/g,'Magnanimous AI').split('Owner / Admin').join('Workspace Admin');if(after!==before)n.nodeValue=after;});
        document.querySelectorAll('.metrics article').forEach(function(card){if((card.textContent||'').indexOf('READY PROVIDERS')!==-1){card.style.display='none';var parent=card.parentElement;if(parent)parent.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';}});
      }
      function loadAds(){fetch('/api/monetization/config',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(c){if(!c)return;var configured=!!(c.adsense_configured||c.auto_ads_ready||c.ads_enabled);var client=c.adsense_client_id||c.adsense_client||'';if(!configured||!client||document.getElementById('iam-adsense'))return;var s=document.createElement('script');s.id='iam-adsense';s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);document.head.appendChild(s);}).catch(function(){});}
      installRootAutosave();migrateMagnanimousSession();guardProtectedRoute();polishCustomerUI();new MutationObserver(function(){polishCustomerUI()}).observe(document.body,{subtree:true,childList:true});if(!standalone)loadAds();
    })();`}} />
  </body></html>
}