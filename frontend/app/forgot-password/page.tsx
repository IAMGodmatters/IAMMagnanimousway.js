'use client';
import {FormEvent,useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

async function readResponse(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return{detail:text.startsWith('<')?`The server returned an HTML page instead of the password recovery API. (${response.status})`:text||`Request failed (${response.status})`}}
}

export default function ForgotPasswordPage(){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[confirm,setConfirm]=useState('');
 const[token,setToken]=useState('');
 const[mode,setMode]=useState<'request'|'reset'|'complete'>('request');
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[error,setError]=useState('');
 const[loginPath,setLoginPath]=useState('/login');
 const[portal,setPortal]=useState<'customer'|'owner'>('customer');

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const nextPortal=params.get('portal')==='owner'?'owner':'customer';
  const reset=params.get('reset')||'';
  setPortal(nextPortal);
  setLoginPath(nextPortal==='owner'?'/owner-login':'/login');
  if(reset){setToken(reset);setMode('reset');params.delete('reset');window.history.replaceState(null,'',`${window.location.pathname}${params.toString()?`?${params.toString()}`:''}`);}
 },[]);

 async function requestReset(event:FormEvent){
  event.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   const response=await fetch(`${api}/api/auth/forgot-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
   const data=await readResponse(response);
   if(!response.ok)throw new Error(data.detail||'Password recovery is unavailable right now.');
   setMessage(data.detail||'If an account exists for that email, a password reset link will be sent shortly.');
  }catch(err:any){setError(err?.message||'Unable to request a password reset.');}
  finally{setBusy(false)}
 }

 async function resetPassword(event:FormEvent){
  event.preventDefault();setError('');setMessage('');
  if(password.length<10){setError('Choose a new password with at least 10 characters.');return;}
  if(password!==confirm){setError('The two passwords do not match.');return;}
  if(!token){setError('This reset link is missing or expired. Request a new one.');return;}
  setBusy(true);
  try{
   const response=await fetch(`${api}/api/auth/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});
   const data=await readResponse(response);
   if(!response.ok)throw new Error(data.detail||'Unable to reset your password.');
   setLoginPath(data.login_path||loginPath);setPassword('');setConfirm('');setToken('');setMode('complete');setMessage(data.detail||'Your password has been reset.');
  }catch(err:any){setError(err?.message||'Unable to reset your password.');}
  finally{setBusy(false)}
 }

 return <main className="portal">
  <section className="card">
   <div className="crest">M</div>
   <small>SECURE ACCOUNT RECOVERY</small>
   <h1>I AM MAGNANIMOUS WAY™</h1>
   {mode==='request'&&<>
    <h2>Forgot your password?</h2>
    <p>Enter the email address for your account. We will send a secure one-time reset link if the account exists.</p>
    <form onSubmit={requestReset}>
     <label><span>Email address</span><input autoFocus required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <button disabled={busy} type="submit">{busy?'SENDING SECURE LINK…':'SEND RESET LINK'}</button>
    </form>
    {message&&<div className="success" role="status">{message}</div>}
    {error&&<div className="error" role="alert">{error}</div>}
    <a className="back" href={portal==='owner'?'/owner-login':'/login'}>← Back to sign in</a>
   </>}
   {mode==='reset'&&<>
    <h2>Create a new password</h2>
    <p>This secure link can be used only once. Choose a new password with at least 10 characters.</p>
    <form onSubmit={resetPassword}>
     <label><span>New password</span><input autoFocus required minLength={10} type="password" autoComplete="new-password" placeholder="At least 10 characters" value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label><span>Confirm new password</span><input required minLength={10} type="password" autoComplete="new-password" placeholder="Type it again" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
     <button disabled={busy} type="submit">{busy?'SECURING ACCOUNT…':'RESET PASSWORD'}</button>
    </form>
    {error&&<div className="error" role="alert">{error}</div>}
   </>}
   {mode==='complete'&&<>
    <h2>Password reset complete</h2>
    <div className="success" role="status">{message||'Your password has been reset.'}</div>
    <a className="primaryLink" href={loginPath}>SIGN IN WITH NEW PASSWORD</a>
   </>}
  </section>
  <style jsx>{`
   .portal{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 18%,#18313f 0,#071018 34%,#020405 76%);color:#fff;font-family:Inter,system-ui,sans-serif}.card{width:min(520px,100%);box-sizing:border-box;padding:36px;border:1px solid rgba(255,190,75,.58);border-radius:24px;background:rgba(5,9,13,.96);box-shadow:0 20px 70px rgba(0,0,0,.5),0 0 50px rgba(255,170,25,.12);text-align:center}.crest{width:68px;height:68px;margin:auto;border:2px solid #ffc65c;border-radius:50%;display:grid;place-items:center;font:700 36px Georgia;color:#ffc65c;box-shadow:0 0 25px rgba(255,190,70,.25)}small{display:block;margin-top:18px;color:#64ddf4;letter-spacing:.18em;font-weight:900}h1{margin:10px 0 8px;color:#ffd47b;font:800 20px Georgia;letter-spacing:.08em}h2{font-size:30px;margin:12px 0}p{color:#aebdca;line-height:1.6;margin:0 auto 24px;max-width:420px}form{display:grid;gap:12px;text-align:left}label span{display:block;margin:0 0 6px;color:#d6c28f;font-size:11px;font-weight:800;letter-spacing:.06em}input{box-sizing:border-box;width:100%;padding:15px 16px;border-radius:10px;border:1px solid #314854;background:#07121a;color:#fff;font-size:15px;outline:none}input:focus{border-color:#5ad9f3;box-shadow:0 0 0 3px rgba(90,217,243,.1)}button,.primaryLink{display:block;box-sizing:border-box;width:100%;padding:15px;border:1px solid #ffe3a0;border-radius:10px;background:linear-gradient(180deg,#e59a18,#9c5a03);color:#fff6d9;font-weight:900;text-align:center;text-decoration:none;cursor:pointer}button:disabled{opacity:.65;cursor:wait}.success,.error{margin-top:14px;padding:12px;border-radius:9px;font-size:12px;line-height:1.5}.success{color:#baf7d3;border:1px solid #315c43;background:#0c2518}.error{color:#ffc1c9;border:1px solid #693440;background:#2c0d15}.back{display:inline-block;margin-top:18px;color:#ffc65c;text-decoration:none;font-weight:800;font-size:12px}.primaryLink{margin-top:18px}
  `}</style>
 </main>
}
