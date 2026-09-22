'use client';

import {useEffect,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t}}}

export default function RecoveryContacts(){
 const[recoveryEmail,setRecoveryEmail]=useState('');
 const[emailHint,setEmailHint]=useState('');
 const[emailVerified,setEmailVerified]=useState(false);
 const[emailChallenge,setEmailChallenge]=useState('');
 const[emailCode,setEmailCode]=useState('');
 const[phone,setPhone]=useState('');
 const[phoneHint,setPhoneHint]=useState('');
 const[emailAvailable,setEmailAvailable]=useState(false);
 const[smsAvailable,setSmsAvailable]=useState(false);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState('');
 const[error,setError]=useState('');

 async function load(){
  const token=getPlatformAuthToken();if(!token)return;
  try{
   const r=await fetch(`${api}/api/auth/recovery-contact`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   const d=await read(r);
   if(r.ok){setEmailHint(String(d.recovery_email||''));setEmailVerified(Boolean(d.recovery_email_verified));setPhoneHint(String(d.phone||''));setEmailAvailable(Boolean(d.email_verification_available));setSmsAvailable(Boolean(d.sms_recovery_available))}
  }catch{}
 }
 useEffect(()=>{void load()},[]);

 async function requestEmail(){
  const token=getPlatformAuthToken();if(!token)return;
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch(`${api}/api/auth/recovery-contact/email/request`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({email:recoveryEmail})});
   const d=await read(r);if(!r.ok||!d.challenge_token)throw new Error(d.detail||'Unable to send verification code.');
   setEmailChallenge(String(d.challenge_token));setEmailHint(String(d.email_hint||''));setEmailCode('');
   setMessage(d.detail||'Enter the 8-digit code sent to your recovery email.');
  }catch(err:any){setError(err?.message||'Unable to send verification code.')}
  finally{setBusy(false)}
 }
 async function confirmEmail(){
  const token=getPlatformAuthToken();if(!token)return;
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch(`${api}/api/auth/recovery-contact/email/confirm`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({challenge_token:emailChallenge,code:emailCode})});
   const d=await read(r);if(!r.ok||!d.verified)throw new Error(d.detail||'Unable to verify recovery email.');
   setEmailVerified(true);setEmailChallenge('');setRecoveryEmail('');setEmailCode('');setEmailHint(String(d.recovery_email||emailHint));
   setMessage(d.detail||'Recovery email verified.');
  }catch(err:any){setError(err?.message||'Unable to verify recovery email.')}
  finally{setBusy(false)}
 }
 async function clearEmail(){
  const token=getPlatformAuthToken();if(!token)return;
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch(`${api}/api/auth/recovery-contact/email`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
   const d=await read(r);if(!r.ok)throw new Error(d.detail||'Unable to remove recovery email.');
   setEmailHint('');setEmailVerified(false);setEmailChallenge('');setMessage(d.detail||'Recovery email removed.');
  }catch(err:any){setError(err?.message||'Unable to remove recovery email.')}
  finally{setBusy(false)}
 }
 async function savePhone(){
  const token=getPlatformAuthToken();if(!token)return;
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch(`${api}/api/auth/recovery-contact/phone`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({phone})});
   const d=await read(r);if(!r.ok)throw new Error(d.detail||'Unable to save recovery phone.');
   setPhoneHint(String(d.phone||''));setPhone('');setMessage(d.detail||'Optional recovery phone saved.');
  }catch(err:any){setError(err?.message||'Unable to save recovery phone.')}
  finally{setBusy(false)}
 }

 return <section className="contacts">
  <div className="head"><b>RECOVERY CONTACTS</b><span>EMAIL VERIFIED · PHONE OPTIONAL</span></div>
  <p>Add a different recovery email so you can request a password reset even if you lose access to your primary inbox. Your optional phone number is stored for future native recovery, but SMS recovery stays off until Magnanimous has a verified first-party SMS delivery path.</p>

  <div className="contactGrid">
   <div className="contactCard">
    <b>Recovery email</b>
    {emailHint&&<small>{emailHint} · {emailVerified?'VERIFIED':'NOT VERIFIED'}</small>}
    {!emailChallenge&&<div className="row"><input type="email" autoComplete="email" placeholder="alternate@example.com" value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)}/><button disabled={busy||!recoveryEmail||!emailAvailable} onClick={requestEmail}>{emailAvailable?'SEND 8-DIGIT CODE':'EMAIL DELIVERY UNAVAILABLE'}</button></div>}
    {emailChallenge&&<div className="row"><input inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="8-digit code" value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\D/g,'').slice(0,8))}/><button disabled={busy||emailCode.length!==8} onClick={confirmEmail}>VERIFY EMAIL</button></div>}
    {!emailAvailable&&<small className="transportNotice">No verification email will be sent on the current host. Use Google Authenticator or Magnanimous recovery codes for recovery right now.</small>}
    {emailHint&&<button className="secondary" disabled={busy} onClick={clearEmail}>REMOVE RECOVERY EMAIL</button>}
   </div>

   <div className="contactCard">
    <b>Optional phone</b>
    {phoneHint&&<small>{phoneHint} · SAVED, NOT SMS-VERIFIED</small>}
    <div className="row"><input type="tel" autoComplete="tel" placeholder="+639171234567" value={phone} onChange={e=>setPhone(e.target.value)}/><button disabled={busy||!phone} onClick={savePhone}>SAVE PHONE</button></div>
    <small>Use international format beginning with + and country code.</small>
    <small className="transportNotice">{smsAvailable?'SMS transport is available, but phone verification is not enabled until the native verification flow is completed.':'No SMS verification message will be sent on the current setup because no native SMS carrier is configured.'}</small>
   </div>
  </div>

  {message&&<div className="message">{message}</div>}
  {error&&<div className="error">{error}</div>}
  <style jsx>{`
   .contacts{max-width:1100px;margin:14px auto 0;border:1px solid #1f506c;background:#071625;border-radius:15px;padding:20px}.head{display:flex;justify-content:space-between;color:#8edcff;font-size:10px;letter-spacing:.1em;margin-bottom:14px}.head span{color:#618da3}.contacts>p{color:#8daab7;line-height:1.6;margin:0 0 14px}.contactGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.contactCard{display:grid;gap:9px;padding:14px;border:1px solid #234e66;background:#06131f;border-radius:10px}.contactCard>b{color:#dff7ff}.contactCard small{color:#7fa3b5;font-size:10px}.transportNotice{color:#ffc96a!important;line-height:1.5}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.row input{box-sizing:border-box;width:100%;padding:11px;border:1px solid #2b617d;background:#03101a;color:#fff;border-radius:8px}.row button,.secondary{border:1px solid #4cbde8;background:#0b3047;color:#dff8ff;border-radius:8px;padding:10px 12px;font-weight:900;cursor:pointer}.secondary{justify-self:start;border-color:#765f3e;background:#2d240f;color:#ffe4a5}.row button:disabled,.secondary:disabled{opacity:.55}.message,.error{margin-top:12px;padding:10px;border-radius:8px;font-size:12px}.message{border:1px solid #315c43;background:#0c2518;color:#baf7d3}.error{border:1px solid #70343b;background:#251116;color:#ffc1c6}@media(max-width:760px){.contactGrid{grid-template-columns:1fr}.row{grid-template-columns:1fr}.head span{display:none}}
  `}</style>
 </section>;
}
