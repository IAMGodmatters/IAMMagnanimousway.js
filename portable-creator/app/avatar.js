'use strict';
const host=document.getElementById('host');
const mouth=document.getElementById('mouth');
const caption=document.getElementById('caption');
function setSpeaking(active){host.classList.toggle('is-speaking',Boolean(active));if(!active)mouth.setAttribute('ry','4');}
if(typeof BroadcastChannel==='function'){
 const channel=new BroadcastChannel('magnanimous-host-v1');
 channel.addEventListener('message',event=>{
  const data=event.data;
  if(!data||typeof data!=='object')return;
  if(data.type==='line'){
   caption.textContent=String(data.text||'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,240)||'Magnanimous AI Host';
  }else if(data.type==='speaking'){
   setSpeaking(true);
  }else if(data.type==='stopped'){
   setSpeaking(false);
  }
 });
}else{
 caption.textContent='This browser does not support the local avatar channel. Use a supported Chromium-based browser source.';
}
