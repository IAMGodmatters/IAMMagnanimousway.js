import React from 'react';
import type {Metadata} from 'next';
import PlatformChrome from './platform-chrome';
import GlobalTools from './global-tools';

const siteUrl='https://iammagnanimousway.com';
const googleVerification=process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||'';

export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{default:'I AM Magnanimous Way™ | AI Business Execution Platform',template:'%s | I AM Magnanimous Way™'},
  description:'I AM Magnanimous Way™ is a free-first AI business execution platform centered on I AM Operator: one primary AI interface for planning work across business tools, CRM, content, calling, video, connected accounts and specialized AI capabilities.',
  applicationName:'I AM Magnanimous Way™',
  keywords:['I AM Magnanimous Way','I AM Operator','AI business operator','AI business execution platform','free AI tools','AI agents','AI assistant','CRM','AI video','business automation'],
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',url:siteUrl,siteName:'I AM Magnanimous Way™',title:'I AM Magnanimous Way™ | Your AI Business Operator',description:'One AI operator for planning, creating, connecting and executing work across your business stack.',images:[{url:'/iam-operator-share.svg',width:1200,height:630,alt:'I AM Magnanimous Way — I AM Operator'}]},
  twitter:{card:'summary_large_image',title:'I AM Magnanimous Way™ | I AM Operator',description:'One AI operator for business execution, CRM, content, calling, video and connected work.',images:['/iam-operator-share.svg']},
  verification:googleVerification?{google:googleVerification}:undefined
};

const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'I AM Magnanimous Way™',url:siteUrl},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'I AM Magnanimous Way™',publisher:{'@id':`${siteUrl}/#organization`},inLanguage:'en'},
    {'@type':'SoftwareApplication','@id':`${siteUrl}/#software`,name:'I AM Magnanimous Way™',alternateName:'I AM Operator',url:siteUrl,applicationCategory:'BusinessApplication',operatingSystem:'Web',description:'A free-first AI business execution platform centered on one operator interface with specialized AI capabilities, CRM, calling, video, connected actions and business workflows.',offers:[{'@type':'Offer',price:'0',priceCurrency:'USD',name:'Free'},{'@type':'Offer',price:'49',priceCurrency:'USD',name:'Full Business',priceSpecification:{'@type':'UnitPriceSpecification',price:'49',priceCurrency:'USD',unitText:'MONTH'}}]}
  ]
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<PlatformChrome/><GlobalTools/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function normalize(path){
        var clean=(path||'/').replace(/\\/+$/,'');
        return clean||'/';
      }
      function guardProtectedRoute(){
        var p=normalize(location.pathname);
        var publicPaths=['/solutions','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps','/advertise','/security'];
        var customer=localStorage.getItem('iam_account_token');
        var owner=localStorage.getItem('odin_admin_token');
        var active=sessionStorage.getItem('iam_session_active');

        if(p==='/'){
          if(!customer&&!owner)location.replace('/solutions');
          return;
        }
        if(publicPaths.indexOf(p)!==-1)return;

        var valid=(active==='user'&&!!customer)||(active==='owner'&&!!owner);
        if(!valid)location.replace('/login');
      }
      function polishCustomerUI(){
        var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
          var p=n.parentElement;if(!p)return NodeFilter.FILTER_ACCEPT;
          var tag=p.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT'||tag==='TEXTAREA')return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }});
        var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
        nodes.forEach(function(n){
          var before=n.nodeValue||'';
          var after=before.replace(/ODIN/g,'I AM OPERATOR').replace(/Odin/g,'I AM Operator').replace(/Owner \/ Admin/g,'Workspace Admin');
          if(after!==before)n.nodeValue=after;
        });
        document.querySelectorAll('.metrics article').forEach(function(card){
          if((card.textContent||'').indexOf('READY PROVIDERS')!==-1){
            card.style.display='none';
            var parent=card.parentElement;if(parent)parent.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
          }
        });
      }
      function loadAds(){
        fetch('/api/monetization/config',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(c){
          if(!c)return;
          var configured=!!(c.adsense_configured||c.auto_ads_ready||c.ads_enabled);
          var client=c.adsense_client_id||c.adsense_client||'';
          if(!configured||!client||document.getElementById('iam-adsense'))return;
          var s=document.createElement('script');s.id='iam-adsense';s.async=true;s.crossOrigin='anonymous';
          s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);
          document.head.appendChild(s);
        }).catch(function(){});
      }
      guardProtectedRoute();
      polishCustomerUI();
      new MutationObserver(function(){polishCustomerUI()}).observe(document.body,{subtree:true,childList:true});
      loadAds();
    })();`}} />
  </body></html>
}
