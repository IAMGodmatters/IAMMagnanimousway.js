import React from 'react';
import PlatformChrome from './platform-chrome';

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<PlatformChrome/>
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function normalize(path){
        var clean=(path||'/').replace(/\\/+$/,'');
        return clean||'/';
      }
      function guardProtectedRoute(){
        var p=normalize(location.pathname);
        var publicPaths=['/login','/signup','/owner-login','/privacy','/terms','/pricing'];
        if(p==='/'||publicPaths.indexOf(p)!==-1)return;

        var customer=localStorage.getItem('iam_account_token');
        var owner=localStorage.getItem('odin_admin_token');
        var active=sessionStorage.getItem('iam_session_active');
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
