'use client';

import {FormEvent,useState} from 'react';
import {clearMagnanimousAdminToken,setMagnanimousAdminToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
async function readResponse(r:Response){
 const text=await r.text();
 try{return JSON.parse(text)}catch{return{detail:text.startsWith('<')?`The server returned an HTML page instead of the owner authentication API. (${r.status})`:text||`Request failed (${r.status})`}}
}

export default function OwnerLoginPage(){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const[success,setSuccess]=useState('');

 async function submit(e:FormEvent){
  e.preventDefault();setError('');setSuccess('');setBusy(true);
  try{
   clearMagnanimousAdminToken();
   localStorage.removeItem('iam_account_token');
   sessionStorage.removeItem('iam_session_active');
   const r=await fetch(`${api}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   const d=await readResponse(r);
   if(!r.ok||!d.token)throw new Error(d.detail||'Invalid owner email or password.');
   const verify=await fetch(`${api}/api/auth/me`,{headers:{Authorization:`Bearer ${d.token}`}});
   const vd=await readResponse(verify);
   if(!verify.ok||vd?.user?.role!=='owner')throw new Error('Owner session could not be verified.');
   setMagnanimousAdminToken(d.token);
   sessionStorage.setItem('iam_session_active','owner');
   setSuccess('Owner verified. Opening your command dashboard…');
   setTimeout(()=>location.replace('/?access=owner'),350);
  }catch(err:any){
   clearMagnanimousAdminToken();
   sessionStorage.removeItem('iam_session_active');
   setError(err?.message||'Unable to sign in as owner.');
  }finally{setBusy(false)}
 }

 return <main className="portal">
  <section className="card">
   <div className="crest">M</div>
   <small>PRIVATE OWNER ACCESS</small>
   <h1>I AM MAGNANIMOUS WAY™</h1>
   <h2>Owner Command Portal</h2>
   <p>Secure access to Magnanimous AI, CRM, integrations, revenue, billing and platform controls.</p>
   <form onSubmit={submit}>
    <input required type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input required type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <button disabled={busy}>{busy?'VERIFYING…':'ACCESS OWNER DASHBOARD'}</button>
    {success&&<div className="success">{success}</div>}
    {error&&<div className="error">{error}</div>}
   </form>
   <footer>Customer access: <a href="/login">Sign in</a> · <a href="/signup">Create account</a></footer>
  </section>
  <style jsx>{`
   .portal{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 20%,#18313f 0,#071018 35%,#020405 75%);color:#fff;font-family:Inter,system-ui,sans-serif}.card{width:min(520px,100%);box-sizing:border-box;padding:36px;border:1px solid rgba(255,190,75,.55);border-radius:24px;background:rgba(5,9,13,.94);box-shadow:0 20px 70px rgba(0,0,0,.5),0 0 50px rgba(255,170,25,.12);text-align:center}.crest{width:68px;height:68px;margin:auto;border:2px solid #ffc65c;border-radius:50%;display:grid;place-items:center;font:700 36px Georgia;color:#ffc65c;box-shadow:0 0 25px rgba(255,190,70,.25)}small{display:block;margin-top:18px;color:#64ddf4;letter-spacing:.2em;font-weight:900}h1{margin:10px 0 5px;color:#ffd47b;font:800 20px Georgia;letter-spacing:.08em}h2{font-size:30px;margin:8px 0 12px}p{color:#aebdca;line-height:1.6;margin:0 auto 24px}form{display:grid;gap:12px}input{box-sizing:border-box;width:100%;padding:15px 16px;border-radius:10px;border:1px solid #314854;background:#07121a;color:#fff;font-size:15px;outline:none}input:focus{border-color:#5ad9f3;box-shadow:0 0 0 3px rgba(90,217,243,.1)}button{padding:15px;border:1px solid #ffe3a0;border-radius:10px;background:linear-gradient(180deg,#e59a18,#9c5a03);color:#fff6d9;font-weight:900;cursor:pointer}button:disabled{opacity:.65;cursor:wait}.success,.error{padding:11px;border-radius:9px;font-size:12px}.success{color:#9effbd;border:1px solid #315c43;background:#0c2518}.error{color:#ffc1c9;border:1px solid #693440;background:#2c0d15}footer{margin-top:22px;color:#7f929e;font-size:12px}a{color:#ffc65c;text-decoration:none}
  `}</style>
 </main>;
}
