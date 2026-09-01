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
        var publicPaths=['/login','/signup','/owner-login','/privacy','/terms'];
        if(p==='/'||publicPaths.indexOf(p)!==-1)return;

        var customer=localStorage.getItem('iam_account_token');
        var owner=localStorage.getItem('odin_admin_token');
        var active=sessionStorage.getItem('iam_session_active');
        var valid=(active==='user'&&!!customer)||(active==='owner'&&!!owner);

        if(!valid)location.replace('/login');
      }
      guardProtectedRoute();
    })();`}} />
  </body></html>
}
