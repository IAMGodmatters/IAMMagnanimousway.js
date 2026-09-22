'use client';
import {FormEvent,useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const brandLogo='data:image/webp;base64,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';

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
 const[requested,setRequested]=useState(false);
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
   setMessage(data.detail||'If an account exists for that email, a password reset link will be sent shortly.');setRequested(true);
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
   <img className="brandLogo" src={brandLogo} alt="I AM MAGNANIMOUS WAY™"/>
   <small>SECURE ACCOUNT RECOVERY</small>
   <h1>I AM MAGNANIMOUS WAY™</h1>
   <div className="firstParty">iammagnanimousway.com • Secure password reset</div>
   {mode==='request'&&<>
    <h2>Forgot your password?</h2>
    <p>Enter the email address for your account. We will send a secure one-time reset link if the account exists. If it does not arrive, you can request another link.</p>
    <form onSubmit={requestReset}>
     <label><span>Email address</span><input autoFocus required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <button disabled={busy} type="submit">{busy?'SENDING SECURE LINK…':requested?'SEND ANOTHER RESET LINK':'SEND RESET LINK'}</button>
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
   .portal{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 18%,#18313f 0,#071018 34%,#020405 76%);color:#fff;font-family:Inter,system-ui,sans-serif}.card{width:min(520px,100%);box-sizing:border-box;padding:36px;border:1px solid rgba(255,190,75,.58);border-radius:24px;background:rgba(5,9,13,.96);box-shadow:0 20px 70px rgba(0,0,0,.5),0 0 50px rgba(255,170,25,.12);text-align:center}.brandLogo{display:block;width:118px;height:118px;object-fit:cover;margin:auto;border:1px solid rgba(255,210,120,.65);border-radius:22px;box-shadow:0 0 28px rgba(255,190,70,.22)}small{display:block;margin-top:18px;color:#64ddf4;letter-spacing:.18em;font-weight:900}.firstParty{margin:0 auto 18px;color:#9fdce8;font-size:11px;font-weight:800;letter-spacing:.04em}h1{margin:10px 0 8px;color:#ffd47b;font:800 20px Georgia;letter-spacing:.08em}h2{font-size:30px;margin:12px 0}p{color:#aebdca;line-height:1.6;margin:0 auto 24px;max-width:420px}form{display:grid;gap:12px;text-align:left}label span{display:block;margin:0 0 6px;color:#d6c28f;font-size:11px;font-weight:800;letter-spacing:.06em}input{box-sizing:border-box;width:100%;padding:15px 16px;border-radius:10px;border:1px solid #314854;background:#07121a;color:#fff;font-size:15px;outline:none}input:focus{border-color:#5ad9f3;box-shadow:0 0 0 3px rgba(90,217,243,.1)}button,.primaryLink{display:block;box-sizing:border-box;width:100%;padding:15px;border:1px solid #ffe3a0;border-radius:10px;background:linear-gradient(180deg,#e59a18,#9c5a03);color:#fff6d9;font-weight:900;text-align:center;text-decoration:none;cursor:pointer}button:disabled{opacity:.65;cursor:wait}.success,.error{margin-top:14px;padding:12px;border-radius:9px;font-size:12px;line-height:1.5}.success{color:#baf7d3;border:1px solid #315c43;background:#0c2518}.error{color:#ffc1c9;border:1px solid #693440;background:#2c0d15}.back{display:inline-block;margin-top:18px;color:#ffc65c;text-decoration:none;font-weight:800;font-size:12px}.primaryLink{margin-top:18px}
  `}</style>
 </main>
}
