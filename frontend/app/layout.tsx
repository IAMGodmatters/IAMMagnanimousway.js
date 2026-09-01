import React from 'react';

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function guard(){
        var p=location.pathname;
        var publicPaths=['/login','/signup','/owner-login','/privacy','/terms'];
        if(publicPaths.indexOf(p)!==-1)return;
        var customer=localStorage.getItem('iam_account_token');
        var owner=localStorage.getItem('odin_admin_token');
        if(!customer&&!owner)location.replace('/login');
      }
      window.addEventListener('load',guard);setTimeout(guard,150);
    })();`}} />
    <script dangerouslySetInnerHTML={{__html:`(function(){
      var routes={'AI Chat':'/ai-chat','AI Apps':'/ai-apps','Video Studio':'/video-studio','Free Tools':'/free-tools','CRM':'/crm'};
      document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('button'):null;if(!el)return;var label=(el.textContent||'').trim();if(routes[label]){e.preventDefault();e.stopImmediatePropagation();location.href=routes[label]}},true)
    })();`}} />
    <script dangerouslySetInnerHTML={{__html:`(function(){
      function add(){
        if(!localStorage.getItem('odin_admin_token')||['/owner-login','/login','/signup','/privacy','/terms','/owner-leads'].indexOf(location.pathname)!==-1||document.getElementById('iam-owner-leads-shortcut'))return;
        var a=document.createElement('a');a.id='iam-owner-leads-shortcut';a.href='/owner-leads';a.textContent='👥 REGISTERED USERS / LEADS';a.style.cssText='position:fixed;right:18px;bottom:18px;z-index:999999;padding:12px 16px;border:1px solid rgba(117,226,255,.55);border-radius:12px;background:rgba(6,15,25,.94);color:#8de8ff;text-decoration:none;font:800 11px Inter,system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 8px 30px rgba(0,190,255,.18)';document.body.appendChild(a)
      }
      window.addEventListener('load',add);setTimeout(add,400)
    })();`}} />
  </body></html>
}
