'use client';
import {FormEvent,useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Portal='customer'|'owner';
type Mode='closed'|'forgot'|'reset'|'complete';

async function readResponse(response:Response){
 const text=await response.text();
 try{return JSON.parse(text)}catch{return{detail:text.startsWith('<')?`The server returned an HTML page instead of the password recovery API. (${response.status})`:text||`Request failed (${response.status})`}}
}

export default function PasswordRecoveryOverlay({portal}:{portal:Portal}){
 const[email,setEmail]=useState('');
 const[password,setPassword]=useState('');
 const[confirm,setConfirm]=useState('');
 const[token,setToken]=useState('');
 const[mode,setMode]=useState<Mode>('closed');
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[error,setError]=useState('');
 const[loginPath,setLoginPath]=useState(portal==='owner'?'/owner-login':'/login');

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search),reset=params.get('reset')||'';
  if(!reset)return;
  setToken(reset);setMode('reset');setMessage('');setError('');
  params.delete('reset');
  const query=params.toString();
  window.history.replaceState(null,'',`${window.location.pathname}${query?`?${query}`:''}${window.location.hash||''}`);
 },[]);

 function openForgot(){setMode('forgot');setMessage('');setError('');}
 function close(){if(busy)return;setMode('closed');setPassword('');setConfirm('');setMessage('');setError('');}

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
   setLoginPath(data.login_path||'/login');setPassword('');setConfirm('');setToken('');setMode('complete');setMessage(data.detail||'Your password has been reset.');
  }catch(err:any){setError(err?.message||'Unable to reset your password.');}
  finally{setBusy(false)}
 }

 return <>
  {mode==='closed'&&<button className="iamForgotTrigger" type="button" onClick={openForgot}>Forgot password?</button>}
  {mode!=='closed'&&<div className="iamRecoveryBackdrop" role="presentation">
   <section className="iamRecoveryCard" role="dialog" aria-modal="true" aria-labelledby="iam-recovery-title">
    {mode!=='complete'&&<button className="iamRecoveryClose" type="button" aria-label="Close password recovery" onClick={close} disabled={busy}>×</button>}
    <div className="iamRecoveryMark">M</div>
    <div className="iamRecoveryBrand">I AM MAGNANIMOUS WAY™</div>
    {mode==='forgot'&&<>
     <h2 id="iam-recovery-title">Forgot your password?</h2>
     <p>Enter the email address you use for this platform. If an account exists, we will send a secure one-time reset link.</p>
     <form onSubmit={requestReset}>
      <label><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <button className="iamRecoveryPrimary" type="submit" disabled={busy}>{busy?'SENDING SECURE LINK…':'SEND RESET LINK'}</button>
     </form>
     {message&&<div className="iamRecoverySuccess" role="status">{message}</div>}
     {error&&<div className="iamRecoveryError" role="alert">{error}</div>}
     <button className="iamRecoveryText" type="button" onClick={close} disabled={busy}>Back to sign in</button>
    </>}
    {mode==='reset'&&<>
     <h2 id="iam-recovery-title">Create a new password</h2>
     <p>Choose a new password with at least 10 characters. Your reset link can only be used once.</p>
     <form onSubmit={resetPassword}>
      <label><span>New password</span><input type="password" autoComplete="new-password" minLength={10} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 10 characters"/></label>
      <label><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={10} required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Type it again"/></label>
      <button className="iamRecoveryPrimary" type="submit" disabled={busy}>{busy?'SECURING ACCOUNT…':'RESET PASSWORD'}</button>
     </form>
     {error&&<div className="iamRecoveryError" role="alert">{error}</div>}
     <button className="iamRecoveryText" type="button" onClick={()=>{setMode('forgot');setToken('');setPassword('');setConfirm('');setError('')}} disabled={busy}>Request a new reset link</button>
    </>}
    {mode==='complete'&&<>
     <h2 id="iam-recovery-title">Password reset complete</h2>
     <div className="iamRecoverySuccess" role="status">{message||'Your password has been reset.'}</div>
     <a className="iamRecoveryPrimary iamRecoveryLink" href={loginPath}>SIGN IN WITH NEW PASSWORD</a>
    </>}
   </section>
  </div>}
  <style jsx>{`
   .iamForgotTrigger{position:fixed;right:22px;bottom:22px;z-index:70;border:1px solid rgba(255,195,75,.7);border-radius:999px;background:rgba(4,8,12,.88);color:#ffd572;padding:11px 16px;font:800 12px/1.2 Inter,system-ui,sans-serif;letter-spacing:.03em;cursor:pointer;box-shadow:0 0 24px rgba(255,174,29,.2);backdrop-filter:blur(8px)}.iamForgotTrigger:hover{border-color:#ffd572;box-shadow:0 0 30px rgba(255,174,29,.35)}
   .iamRecoveryBackdrop{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.76);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,sans-serif;color:#fff}.iamRecoveryCard{position:relative;width:min(480px,calc(100vw - 34px));box-sizing:border-box;padding:30px;border:1px solid rgba(255,191,65,.72);border-radius:18px;background:linear-gradient(180deg,rgba(8,13,19,.98),rgba(3,6,9,.99));box-shadow:0 0 50px rgba(255,159,20,.23),inset 0 0 40px rgba(255,174,29,.035);text-align:center}.iamRecoveryClose{position:absolute;right:14px;top:10px;border:0;background:transparent;color:#dbc58d;font-size:28px;cursor:pointer}.iamRecoveryClose:disabled{opacity:.5}.iamRecoveryMark{width:58px;height:58px;margin:0 auto 8px;border:2px solid #f2b43c;border-radius:50%;display:grid;place-items:center;font:700 30px Georgia;color:#ffcf64;box-shadow:0 0 22px rgba(255,180,44,.3)}.iamRecoveryBrand{color:#ffd26b;font-size:11px;font-weight:900;letter-spacing:.14em}.iamRecoveryCard h2{margin:13px 0 7px;font-size:25px;color:#ffe0a0}.iamRecoveryCard p{margin:0 auto 18px;max-width:390px;color:#cfd3d8;font-size:13px;line-height:1.55}.iamRecoveryCard form{display:grid;gap:11px;text-align:left}.iamRecoveryCard label span{display:block;margin-bottom:5px;color:#d6c28f;font-size:10px;font-weight:800;letter-spacing:.07em}.iamRecoveryCard input{box-sizing:border-box;width:100%;padding:13px 14px;border:1px solid rgba(255,192,72,.34);border-radius:8px;background:#050a0e;color:#fff;font-size:15px;outline:none}.iamRecoveryCard input:focus{border-color:#ffc54f;box-shadow:0 0 0 2px rgba(255,184,45,.11)}.iamRecoveryPrimary{display:block;box-sizing:border-box;width:100%;margin-top:2px;padding:13px 15px;border:1px solid #ffe39a;border-radius:8px;background:linear-gradient(180deg,#d98a08,#965200);color:#fff4d0;font-weight:900;font-size:13px;letter-spacing:.035em;text-align:center;text-decoration:none;cursor:pointer}.iamRecoveryPrimary:disabled{opacity:.65;cursor:wait}.iamRecoveryLink{margin-top:18px}.iamRecoverySuccess,.iamRecoveryError{margin-top:12px;padding:11px;border-radius:8px;font-size:12px;line-height:1.45}.iamRecoverySuccess{border:1px solid rgba(83,220,160,.35);background:rgba(26,112,76,.2);color:#bbf6dc}.iamRecoveryError{border:1px solid rgba(255,90,110,.35);background:rgba(120,20,35,.2);color:#ffc0c8}.iamRecoveryText{margin-top:13px;border:0;background:transparent;color:#e9c76e;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.iamRecoveryText:disabled{opacity:.55}@media(max-width:600px){.iamForgotTrigger{right:14px;bottom:14px}.iamRecoveryCard{padding:27px 20px 22px}}
  `}</style>
 </>
}
