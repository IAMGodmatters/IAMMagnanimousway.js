'use client';

import { useEffect, useMemo, useState } from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Consent={
 ok:boolean;
 client_name:string;
 client_id:string;
 redirect_uri:string;
 resource:string;
 scopes:string[];
 publisher:string;
 identity:string;
 omitted_scopes?:string[];
 access_tier?:'owner-admin'|'customer-safe';
};

async function read(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return{detail:text||`Request failed (${response.status})`}}
}

function authToken(){
 return localStorage.getItem('iam_account_token')||localStorage.getItem('odin_admin_token')||'';
}

export default function OAuthAuthorizePage(){
 const[consent,setConsent]=useState<Consent|null>(null);
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const query=useMemo(()=>typeof window==='undefined'?'':window.location.search.replace(/^\?/,''),[]);

 useEffect(()=>{
  const token=authToken();
  if(!token){
   const returnTo=window.location.pathname+window.location.search;
   window.location.replace('/login?returnTo='+encodeURIComponent(returnTo));
   return;
  }
  (async()=>{
   try{
    const response=await fetch(`${api}/api/magnanimous/oauth/consent?${query}`,{
     headers:{Authorization:`Bearer ${token}`},
     cache:'no-store'
    });
    const data=await read(response);
    if(response.status===401){
     const returnTo=window.location.pathname+window.location.search;
     window.location.replace('/login?returnTo='+encodeURIComponent(returnTo));
     return;
    }
    if(!response.ok)throw new Error(data.error_description||data.detail||'Unable to validate this connector request.');
    setConsent(data);
   }catch(caught:any){
    setError(caught?.message||'Unable to validate this connector request.');
   }
  })();
 },[query]);

 function params(){
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
 }

 async function approve(){
  if(!consent||busy)return;
  setBusy(true);setError('');
  try{
   const token=authToken();
   if(!token)throw new Error('Your Magnanimous session expired. Sign in again.');
   const response=await fetch(`${api}/api/magnanimous/oauth/authorize`,{
    method:'POST',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(params())
   });
   const data=await read(response);
   if(!response.ok||!data.redirect_url)throw new Error(data.error_description||data.detail||'Authorization could not be completed.');
   window.location.replace(data.redirect_url);
  }catch(caught:any){
   setError(caught?.message||'Authorization could not be completed.');
   setBusy(false);
  }
 }

 function deny(){
  if(!consent)return;
  const p=params(),u=new URL(consent.redirect_uri);
  u.searchParams.set('error','access_denied');
  u.searchParams.set('error_description','The I AM MAGNANIMOUS WAY™ user denied this connection.');
  if(p.state)u.searchParams.set('state',String(p.state));
  window.location.replace(u.toString());
 }

 return <main>
  <section className="card">
   <div className="mark">M</div>
   <small>I AM MAGNANIMOUS WAY™</small>
   <h1>Connect Magnanimous AI to ChatGPT</h1>
   <p className="lead">This connection lets ChatGPT call the Magnanimous tools you approve. Magnanimous remains the policy, routing, memory and verification layer.</p>

   {!consent&&!error&&<div className="status">VERIFYING SECURE CONNECTION…</div>}
   {error&&<div className="error">{error}</div>}

   {consent&&<>
    <div className="client">
     <span>REQUESTING CLIENT</span>
     <b>{consent.client_name}</b>
     <em>{new URL(consent.redirect_uri).hostname}</em>
    </div>

    <div className="permissions">
     <h2>{consent.access_tier==='customer-safe'?'Approved customer-safe permissions':'Requested permissions'}</h2>
     {consent.scopes.map(scope=><div key={scope}>
      <b>{scope}</b>
      <span>{
       scope==='openid'?'Identify your Magnanimous account securely to ChatGPT':
       scope==='email'?'Share your verified Magnanimous sign-in email for workspace-domain protection':
       scope==='web.read'?'Search, fetch, research and read browser state':
       scope==='web.write'?'Run confirmation-gated browser actions and manage native browser state':
       scope==='cloud.read'?'Read native Magnanimous Cloud projects/resources, deployment and edge/runtime compatibility':
       scope==='cloud.write'?'Create native desired state and stage confirmation-gated infrastructure actions; no provider purchase is automatic':
       scope==='mail.read'?'Read/search mail already connected to Magnanimous':
       scope==='mail.write'?'Send mail only through Magnanimous confirmation rules':
       scope==='communications.read'?'Read communications readiness and catalog':
       scope==='communications.write'?'Run communications actions through Magnanimous safety gates':
       scope==='brain.ask'?'Delegate reasoning and planning to Magnanimous AI':
       scope==='offline_access'?'Keep the ChatGPT connection active using rotating refresh tokens':
       'Read Magnanimous capability information'
      }</span>
     </div>)}
    </div>

    {!!consent.omitted_scopes?.length&&<div className="notice privilege">
     <b>Owner controls stay private</b>
     <span>Magnanimous removed owner/admin-only permissions from this connection: {consent.omitted_scopes.join(', ')}. Ordinary accounts can use the customer-safe capabilities without gaining infrastructure, mailbox-send, communications-write, or browser-control authority.</span>
    </div>}
    <div className="notice">
     <b>One native operations connection</b>
     <span>Search/browser work uses Magnanimous Native Web; deployment/cloud and edge/runtime work uses Magnanimous Cloud. TinyFish, Railway and Cloudflare plugins are not required for the native control-plane paths.</span>
    </div>
    <div className="notice safe">
     <b>Credentials stay protected</b>
     <span>Passwords and browser-session secrets are not sent through the MCP tool arguments. Authenticated sites use your paired local browser profile.</span>
    </div>

    <div className="actions">
     <button className="deny" disabled={busy} onClick={deny}>DENY</button>
     <button className="allow" disabled={busy} onClick={()=>void approve()}>{busy?'CONNECTING…':'ALLOW CONNECTION'}</button>
    </div>
   </>}
  </section>
  <footer>Magnanimous AI • OAuth 2.1 • PKCE S256 • scoped access • revocable tokens</footer>
  <style jsx>{`
   main{min-height:100vh;background:radial-gradient(circle at 50% 10%,#123043 0,#071018 36%,#030507 72%);color:#edf8ff;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif}
   .card{width:min(680px,calc(100vw - 42px));border:1px solid #31546a;border-radius:22px;background:linear-gradient(145deg,#07121b,#05080d);padding:32px;box-shadow:0 22px 70px rgba(0,0,0,.45)}
   .mark{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;border:1px solid #d9aa52;color:#ffd276;font:700 31px Georgia;margin-bottom:12px}
   small{color:#d7ad62;letter-spacing:.16em;font-size:9px;font-weight:900}
   h1{font-size:clamp(32px,6vw,54px);line-height:1;margin:8px 0 12px}
   .lead{color:#91a8b8;line-height:1.6}
   .status,.error,.client,.permissions,.notice{margin-top:16px;border:1px solid #19394d;border-radius:13px;padding:15px;background:#061019}
   .error{border-color:#6d3540;color:#ffbac4;background:#1f0d12}
   .client span,.client b,.client em{display:block}.client span{font-size:8px;color:#738d9f;letter-spacing:.15em}.client b{margin-top:5px;font-size:18px}.client em{font-style:normal;color:#77ddff;font-size:11px;margin-top:4px}
   .permissions h2{font-size:16px;margin:0 0 7px}.permissions>div{border-top:1px solid #153245;padding:10px 0}.permissions b,.permissions span{display:block}.permissions b{font-size:11px;color:#bceeff}.permissions span{font-size:10px;color:#7892a4;margin-top:3px;line-height:1.45}
   .notice b,.notice span{display:block}.notice b{color:#8be8ff}.notice span{font-size:11px;color:#89a1b1;line-height:1.55;margin-top:4px}.notice.safe b{color:#8de7ad}.notice.privilege{border-color:#654f2d;background:#181207}.notice.privilege b{color:#f2cb77}
   .actions{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:20px}.actions button{border-radius:10px;padding:14px;font-weight:900;cursor:pointer}.deny{background:#12090c;color:#d9959f;border:1px solid #5d3038}.allow{background:linear-gradient(90deg,#128aaa,#aa7a32);color:white;border:0}.actions button:disabled{opacity:.65}
   footer{position:fixed;bottom:14px;color:#526d7d;font-size:9px}
   @media(max-width:560px){.card{padding:22px}.actions{grid-template-columns:1fr}footer{position:static;margin-top:12px}}
  `}</style>
 </main>
}
