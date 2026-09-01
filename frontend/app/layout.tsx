import React from 'react';

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<script dangerouslySetInnerHTML={{__html:`(function(){var done=false;function go(){if(done)return;try{if(!localStorage.getItem('odin_admin_token'))return;var buttons=Array.from(document.querySelectorAll('button'));var b=buttons.find(function(x){return (x.textContent||'').trim()==='Admin & Revenue';});if(b){done=true;b.click();}}catch(e){}}window.addEventListener('load',go);setInterval(go,300);})()`}} /></body></html>
}