import React from 'react';
import type {Metadata} from 'next';
import PlatformChrome from './platform-chrome';
import GlobalTools from './global-tools';

const siteUrl='https://iammagnanimousway.com';
const googleVerification=process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||'';

export const metadata:Metadata={
  metadataBase:new URL(siteUrl),
  title:{default:'I AM Magnanimous Way™ | Free AI Business Platform',template:'%s | I AM Magnanimous Way™'},
  description:'I AM Magnanimous Way™ is a free-first AI business platform with Odin, specialized AI tools, talking agents, CRM, business workflows, support, calling, video tools and an optional Full Business plan.',
  applicationName:'I AM Magnanimous Way™',
  keywords:['I AM Magnanimous Way','free AI tools','AI business platform','AI agents','Odin AI','AI assistant','CRM','AI video agents','business automation'],
  alternates:{canonical:'/'},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  openGraph:{type:'website',url:siteUrl,siteName:'I AM Magnanimous Way™',title:'I AM Magnanimous Way™ | Free AI Business Platform',description:'Free-first AI tools, talking agents, business workflows, CRM, calling, video and an optional Full Business plan.'},
  twitter:{card:'summary_large_image',title:'I AM Magnanimous Way™',description:'Free-first AI business platform with Odin and specialized agents.'},
  verification:googleVerification?{google:googleVerification}:undefined
};

const structuredData={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':`${siteUrl}/#organization`,name:'I AM Magnanimous Way™',url:siteUrl},
    {'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:'I AM Magnanimous Way™',publisher:{'@id':`${siteUrl}/#organization`},inLanguage:'en'},
    {'@type':'SoftwareApplication','@id':`${siteUrl}/#software`,name:'I AM Magnanimous Way™',url:siteUrl,applicationCategory:'BusinessApplication',operatingSystem:'Web',description:'A free-first AI business platform with Odin, specialized AI agents, CRM, calling, video tools, support and business workflows.',offers:[{'@type':'Offer',price:'0',priceCurrency:'USD',name:'Free'},{'@type':'Offer',price:'49',priceCurrency:'USD',name:'Full Business',priceSpecification:{'@type':'UnitPriceSpecification',price:'49',priceCurrency:'USD',unitText:'MONTH'}}]}
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
        var publicPaths=['/solutions','/login','/signup','/owner-login','/privacy','/terms','/pricing','/reviews','/free-tools','/ai-apps'];
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
      loadAds();
    })();`}} />
  </body></html>
}
