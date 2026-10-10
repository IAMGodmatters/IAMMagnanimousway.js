import type {ReactNode} from 'react';

const AGENT_IDENTITY_BOOTSTRAP=`(()=>{
 try{
  if(window.__iamAgentIdentityInstalled)return;
  window.__iamAgentIdentityInstalled=true;
  const palettes=[
   {accent:'#64e6ff',rgb:'100,230,255',accent2:'#ffe08a',deep:'#071c28'},
   {accent:'#ff9bd2',rgb:'255,155,210',accent2:'#ffd86b',deep:'#241020'},
   {accent:'#a8ff9b',rgb:'168,255,155',accent2:'#7ee8ff',deep:'#102417'},
   {accent:'#c6a5ff',rgb:'198,165,255',accent2:'#8ff8de',deep:'#171126'},
   {accent:'#ffb46b',rgb:'255,180,107',accent2:'#8fe8ff',deep:'#24170d'},
   {accent:'#7fa7ff',rgb:'127,167,255',accent2:'#ffb5dd',deep:'#0d1730'},
   {accent:'#62f0bf',rgb:'98,240,191',accent2:'#ffe18c',deep:'#09231b'},
   {accent:'#ff7f87',rgb:'255,127,135',accent2:'#ffd678',deep:'#2a1013'},
   {accent:'#e5f06f',rgb:'229,240,111',accent2:'#83d9ff',deep:'#20220d'},
   {accent:'#9ad5ff',rgb:'154,213,255',accent2:'#d7a1ff',deep:'#0c1d2a'}
  ];
  const hash=value=>{let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  const initials=value=>String(value||'AI').trim().split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'AI';
  function apply(){
   const root=document.querySelector('main.mesh');
   const active=document.querySelector('.agentList button.active');
   if(!(root instanceof HTMLElement)||!(active instanceof HTMLElement))return;
   const name=String(active.querySelector('b')?.textContent||'Magnanimous Agent').trim();
   const title=String(active.querySelector('small')?.textContent||'Specialist').trim();
   const palette=palettes[hash(name.toLowerCase())%palettes.length];
   root.style.setProperty('--agent-accent',palette.accent);
   root.style.setProperty('--agent-rgb',palette.rgb);
   root.style.setProperty('--agent-accent-2',palette.accent2);
   root.style.setProperty('--agent-deep',palette.deep);
   root.setAttribute('data-active-agent',name);
   const avatar=document.querySelector('.avatar');
   if(avatar instanceof HTMLElement){
    avatar.setAttribute('data-agent-initials',initials(name));
    avatar.setAttribute('data-agent-label',name+' • '+title);
    avatar.setAttribute('aria-label','Active specialist: '+name+', '+title);
   }
  }
  document.addEventListener('click',event=>{
   const target=event.target;
   if(target instanceof Element&&target.closest('.agentList button')){setTimeout(apply,0);setTimeout(apply,90)}
  },true);
  const start=()=>{
   apply();
   const observer=new MutationObserver(()=>requestAnimationFrame(apply));
   observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
   setTimeout(apply,100);setTimeout(apply,500);setTimeout(apply,1200);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }catch{}
})();`;

export default function AgentsLayout({children}:{children:ReactNode}){
 return <>
  <script dangerouslySetInnerHTML={{__html:AGENT_IDENTITY_BOOTSTRAP}}/>
  {children}
  <style>{`
   .mesh{--agent-accent:#64e6ff;--agent-rgb:100,230,255;--agent-accent-2:#ffe08a;--agent-deep:#071c28}
   .mesh,.mesh .hero,.mesh .chat,.mesh aside,.mesh .providerBar>div,.mesh .groups button,.mesh .agentList button,.mesh .agentPortrait,.mesh .avatar,.mesh .chatHead,.mesh .send{transition:background .28s ease,border-color .28s ease,color .28s ease,box-shadow .28s ease,transform .18s ease}
   .mesh .hero{border-color:rgba(var(--agent-rgb),.48)!important;background:radial-gradient(circle at 82% 18%,rgba(var(--agent-rgb),.18),transparent 32%),linear-gradient(145deg,var(--agent-deep),#080b10)!important;box-shadow:inset 0 1px 0 rgba(var(--agent-rgb),.08)}
   .mesh .hero small,.mesh .chatHead small,.mesh .asideHead small,.mesh header a,.mesh .avatar>span{color:var(--agent-accent)!important}
   .mesh .avatar{background:radial-gradient(circle at 50% 43%,rgba(var(--agent-rgb),.22),transparent 44%)!important}
   .mesh .halo{border-color:rgba(var(--agent-rgb),.68)!important;box-shadow:0 0 54px rgba(var(--agent-rgb),.2)!important}
   .mesh .agentPortrait{border-color:rgba(var(--agent-rgb),.62)!important;box-shadow:0 18px 55px rgba(0,0,0,.42),0 0 32px rgba(var(--agent-rgb),.16)!important}
   .mesh .avatar::before{content:attr(data-agent-initials);position:absolute;right:2px;top:4px;z-index:4;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,var(--agent-deep),#070b10);border:1px solid rgba(var(--agent-rgb),.7);box-shadow:0 8px 22px rgba(0,0,0,.38),0 0 22px rgba(var(--agent-rgb),.16);color:var(--agent-accent-2);font:900 12px Georgia,serif;letter-spacing:.06em}
   .mesh .avatar::after{content:attr(data-agent-label);position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:3;max-width:205px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:5px 8px;border-radius:999px;background:rgba(3,8,13,.82);border:1px solid rgba(var(--agent-rgb),.3);color:var(--agent-accent);font:800 8px/1 Inter,system-ui,sans-serif;letter-spacing:.05em;backdrop-filter:blur(8px)}
   .mesh .agentList button.active{background:linear-gradient(90deg,rgba(var(--agent-rgb),.18),rgba(var(--agent-rgb),.05))!important;box-shadow:inset 3px 0 0 var(--agent-accent);color:#fff!important}
   .mesh .agentList button.active>span,.mesh .agentList button.active small{color:var(--agent-accent)!important}
   .mesh .groups button.active{background:rgba(var(--agent-rgb),.14)!important;border-color:rgba(var(--agent-rgb),.5)!important;box-shadow:inset 0 0 18px rgba(var(--agent-rgb),.05)}
   .mesh .groups button.active b{color:var(--agent-accent-2)!important}
   .mesh aside,.mesh .chat{border-color:rgba(var(--agent-rgb),.22)!important}
   .mesh .chatHead{border-bottom-color:rgba(var(--agent-rgb),.22)!important;background:linear-gradient(90deg,rgba(var(--agent-rgb),.07),transparent 40%)}
   .mesh .chatHead h2{color:#fff}.mesh .chatHead h2 span{color:var(--agent-accent)!important}
   .mesh .send{background:linear-gradient(135deg,var(--agent-deep),rgba(var(--agent-rgb),.18))!important;border-color:rgba(var(--agent-rgb),.55)!important;color:#fff!important;box-shadow:0 8px 22px rgba(var(--agent-rgb),.08)}
   .mesh .send:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(var(--agent-rgb),.14)}
   .mesh article.assistant{border-left:2px solid rgba(var(--agent-rgb),.46)}
   .mesh article.assistant small{color:var(--agent-accent)!important}
   @media(max-width:760px){.mesh .avatar::after{top:2px;max-width:160px}.mesh .avatar::before{right:8px;top:6px;width:38px;height:38px}}
  `}</style>
 </>;
}
