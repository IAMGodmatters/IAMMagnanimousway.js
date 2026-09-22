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
 const[code,setCode]=useState('');
 const[challengeToken,setChallengeToken]=useState('');
 const[mode,setMode]=useState<'email'|'code'|'password'>('email');
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const[success,setSuccess]=useState('');

 function resetBrowserAuth(){
  clearMagnanimousAdminToken();
  localStorage.removeItem('iam_account_token');
  sessionStorage.removeItem('iam_session_active');
 }
 async function finishOwnerSession(d:any){
  if(!d?.token)throw new Error(d?.detail||'Owner session could not be created.');
  const verify=await fetch(`${api}/api/auth/me`,{headers:{Authorization:`Bearer ${d.token}`},cache:'no-store'});
  const vd=await readResponse(verify);
  if(!verify.ok||vd?.user?.role!=='owner')throw new Error('Owner session could not be verified.');
  setMagnanimousAdminToken(d.token,d.session_expires_at);
  sessionStorage.setItem('iam_session_active','owner');
  setSuccess('Owner verified. Opening your command dashboard…');
  setTimeout(()=>location.replace('/?access=owner'),350);
 }

 async function requestCode(e:FormEvent){
  e.preventDefault();setError('');setSuccess('');setBusy(true);
  try{
   resetBrowserAuth();
   const r=await fetch(`${api}/api/admin/email-code/request`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
   const d=await readResponse(r);
   if(!r.ok||!d.challenge_token)throw new Error(d.detail||'Unable to send owner login code.');
   setChallengeToken(String(d.challenge_token));setCode('');setMode('code');
   setSuccess(d.detail||'Check your owner email for the 8-digit login code.');
  }catch(err:any){setError(err?.message||'Unable to send owner login code.')}
  finally{setBusy(false)}
 }
 async function verifyCode(e:FormEvent){
  e.preventDefault();setError('');setSuccess('');setBusy(true);
  try{
   const r=await fetch(`${api}/api/admin/email-code/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challenge_token:challengeToken,code})});
   const d=await readResponse(r);
   if(!r.ok||!d.token)throw new Error(d.detail||'Invalid or expired owner login code.');
   await finishOwnerSession(d);
  }catch(err:any){setError(err?.message||'Unable to verify owner login code.')}
  finally{setBusy(false)}
 }
 async function passwordLogin(e:FormEvent){
  e.preventDefault();setError('');setSuccess('');setBusy(true);
  try{
   resetBrowserAuth();
   const r=await fetch(`${api}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   const d=await readResponse(r);
   if(!r.ok||!d.token)throw new Error(d.detail||'Invalid owner email or password.');
   await finishOwnerSession(d);
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
   <p>{mode==='email'?'Enter only your owner email. Magnanimous will send a fresh 8-digit one-time login code.':mode==='code'?'Check your owner email, then enter the 8-digit code.':'Emergency password fallback for the platform owner.'}</p>

   {mode==='email'&&<form onSubmit={requestCode}>
    <input required type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={e=>setEmail(e.target.value)}/>
    <button disabled={busy}>{busy?'SENDING CODE…':'SEND MY LOGIN CODE'}</button>
    <div className="loginAssist"><span>Code expires in 10 minutes</span><button type="button" className="linkButton" onClick={()=>{setMode('password');setError('');setSuccess('')}}>Use password fallback</button></div>
    {success&&<div className="success">{success}</div>}
    {error&&<div className="error">{error}</div>}
   </form>}

   {mode==='code'&&<form onSubmit={verifyCode}>
    <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} placeholder="8-digit login code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,8))}/>
    <button disabled={busy||code.length!==8}>{busy?'VERIFYING…':'OPEN OWNER DASHBOARD'}</button>
    <div className="loginAssist"><button type="button" className="linkButton" onClick={()=>{setMode('email');setChallengeToken('');setCode('');setError('');setSuccess('')}}>Send a new code</button><button type="button" className="linkButton" onClick={()=>{setMode('password');setError('');setSuccess('')}}>Use password fallback</button></div>
    {success&&<div className="success">{success}</div>}
    {error&&<div className="error">{error}</div>}
   </form>}

   {mode==='password'&&<form onSubmit={passwordLogin}>
    <input required type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input required type="password" autoComplete="current-password" placeholder="Owner password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <button disabled={busy}>{busy?'VERIFYING…':'ACCESS WITH PASSWORD'}</button>
    <div className="loginAssist"><a href="/forgot-password?portal=owner">Forgot password?</a><button type="button" className="linkButton" onClick={()=>{setMode('email');setError('');setSuccess('')}}>Use email code</button></div>
    {success&&<div className="success">{success}</div>}
    {error&&<div className="error">{error}</div>}
   </form>}

   <footer>Customer access: <a href="/login">Sign in</a> · <a href="/signup">Create account</a></footer>
  </section>
  <style jsx>{`
   .portal{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 20%,#18313f 0,#071018 35%,#020405 75%);color:#fff;font-family:Inter,system-ui,sans-serif}.card{width:min(520px,100%);box-sizing:border-box;padding:36px;border:1px solid rgba(255,190,75,.55);border-radius:24px;background:rgba(5,9,13,.94);box-shadow:0 20px 70px rgba(0,0,0,.5),0 0 50px rgba(255,170,25,.12);text-align:center}.crest{width:68px;height:68px;margin:auto;border:2px solid #ffc65c;border-radius:50%;display:grid;place-items:center;font:700 36px Georgia;color:#ffc65c;box-shadow:0 0 25px rgba(255,190,70,.25)}small{display:block;margin-top:18px;color:#64ddf4;letter-spacing:.2em;font-weight:900}h1{margin:10px 0 5px;color:#ffd47b;font:800 20px Georgia;letter-spacing:.08em}h2{font-size:30px;margin:8px 0 12px}p{color:#aebdca;line-height:1.6;margin:0 auto 24px}form{display:grid;gap:12px}input{box-sizing:border-box;width:100%;padding:15px 16px;border-radius:10px;border:1px solid #314854;background:#07121a;color:#fff;font-size:15px;outline:none}input:focus{border-color:#5ad9f3;box-shadow:0 0 0 3px rgba(90,217,243,.1)}.loginAssist{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:11px}.loginAssist span{color:#7f929e}.loginAssist a,.linkButton{color:#ffc65c;font-weight:900}.loginAssist a:hover,.linkButton:hover{text-decoration:underline;text-underline-offset:3px}button{padding:15px;border:1px solid #ffe3a0;border-radius:10px;background:linear-gradient(180deg,#e59a18,#9c5a03);color:#fff6d9;font-weight:900;cursor:pointer}.linkButton{padding:0;border:0;background:transparent;border-radius:0;cursor:pointer;font-size:11px}.linkButton:disabled{opacity:.65}button:disabled{opacity:.65;cursor:wait}.success,.error{padding:11px;border-radius:9px;font-size:12px}.success{color:#9effbd;border:1px solid #315c43;background:#0c2518}.error{color:#ffc1c9;border:1px solid #693440;background:#2c0d15}footer{margin-top:22px;color:#7f929e;font-size:12px}a{color:#ffc65c;text-decoration:none}
  `}</style>
 </main>;
}
