import React from 'react';
import PlatformChrome from './platform-chrome';

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<PlatformChrome/>
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function guard(){
        var p=location.pathname;
        var publicPaths=['/login','/signup','/owner-login','/privacy','/terms'];
        if(publicPaths.indexOf(p)!==-1)return;
        var customer=localStorage.getItem('iam_account_token');
        var owner=localStorage.getItem('odin_admin_token');
        var active=sessionStorage.getItem('iam_session_active');
        if((!customer&&!owner)||!active)location.replace('/login');
      }
      window.addEventListener('load',guard);setTimeout(guard,120);
    })();`}} />
  </body></html>
}
