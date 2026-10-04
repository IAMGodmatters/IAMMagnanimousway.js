(()=>{
'use strict';
let policy={coin_sales_enabled:false,weekly_pass_sales_enabled:false,paid_ready:0,complete_series_ready:0,total:600,ready:0};
const all=(s)=>[...document.querySelectorAll(s)];
const allowed=(kind)=>kind==='weekly'?Boolean(policy.weekly_pass_sales_enabled):Boolean(policy.coin_sales_enabled);
function ensureNotice(){
 let e=document.querySelector('#premiumInventoryPolicy');
 if(e)return e;
 const pricing=document.querySelector('#pricing .wrap');
 if(!pricing)return null;
 e=document.createElement('div');e.id='premiumInventoryPolicy';e.className='status';e.style.marginTop='12px';e.setAttribute('role','status');pricing.appendChild(e);return e;
}
function apply(){
 all('[data-buy]').forEach(button=>{
   const ok=allowed(button.dataset.buy);
   button.disabled=!ok;
   button.setAttribute('aria-disabled',String(!ok));
   button.title=ok?'Checkout is available.':'Checkout is closed until matching finished cinematic inventory is live.';
 });
 all('[data-buy="weekly"]').forEach(b=>{if(!allowed('weekly'))b.textContent='Weekly pass · opens with complete season'});
 all('[data-buy="coins150"]').forEach(b=>{if(!allowed('coins150'))b.textContent='150 coins · opens with paid episodes'});
 all('[data-buy="coins500"]').forEach(b=>{if(!allowed('coins500'))b.textContent='500 coins · opens with paid episodes'});
 all('[data-buy="coins1400"]').forEach(b=>{if(!allowed('coins1400'))b.textContent='1,400 coins · opens with paid episodes'});
 const e=ensureNotice();
 if(e)e.textContent=`Premium inventory: ${Number(policy.ready||0)}/${Number(policy.total||600)} cinematic episodes rendered · ${Number(policy.paid_ready||0)} paid episodes ready · ${Number(policy.complete_series_ready||0)} complete cinematic seasons ready. Coin packs require a playable paid episode; weekly all-access requires a complete playable season.`;
}
function toast(text){
 let e=document.querySelector('#premiumGateToast');
 if(!e){e=document.createElement('div');e.id='premiumGateToast';e.setAttribute('role','status');e.style.cssText='position:fixed;z-index:9999;left:50%;bottom:22px;transform:translateX(-50%);max-width:min(92vw,620px);padding:11px 15px;border-radius:12px;background:#101725;border:1px solid #45536f;color:white;text-align:center;box-shadow:0 14px 50px #000';document.body.appendChild(e)}
 e.textContent=text;e.hidden=false;clearTimeout(e._timer);e._timer=setTimeout(()=>{e.hidden=true},3200);
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-buy]');
 if(!button||allowed(button.dataset.buy))return;
 event.preventDefault();event.stopImmediatePropagation();
 toast(button.dataset.buy==='weekly'?'Weekly all-access is paused until a complete cinematic season is live. No charge was started.':'Coin purchases are paused until a finished paid cinematic episode is live. No charge was started.');
},true);
async function refresh(){
 try{const response=await fetch('/api/series',{cache:'no-store'});if(!response.ok)throw new Error('series readiness unavailable');const data=await response.json();policy={...policy,...(data.render||{})};}catch{}finally{apply();setTimeout(apply,700);setTimeout(apply,1800)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
window.addEventListener('focus',refresh);
})();
