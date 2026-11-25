'use strict';
const host=document.getElementById('host');
const mouth=document.getElementById('mouth');
const caption=document.getElementById('caption');
function setSpeaking(active){host.classList.toggle('is-speaking',Boolean(active));if(!active)mouth.setAttribute('ry','4');}
const events=new EventSource('/api/avatar/events');
events.addEventListener('message',event=>{
 let data;
 try{data=JSON.parse(event.data);}catch{return;}
 if(!data||typeof data!=='object')return;
 if(data.type==='line'){
  caption.textContent=String(data.text||'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,240)||'Magnanimous AI Host';
 }else if(data.type==='speaking'){
  setSpeaking(true);
 }else if(data.type==='stopped'){
  setSpeaking(false);
 }else if(data.type==='locked'){
  setSpeaking(false);
  caption.textContent='Workspace locked';
 }else if(data.type==='ready'){
  caption.textContent='Magnanimous AI Host';
 }
});
events.addEventListener('error',()=>setSpeaking(false));
