'use client';
import {useEffect,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';
import RecoveryContacts from './recovery-contacts';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type AccountUser={id?:string;tenant_id?:string;name?:string;email?:string;role?:string};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t}}}

export default function Account(){
 const[user,setUser]=useState<AccountUser>({}),[ready,setReady]=useState(false),[error,setError]=useState('');
 const[recoveryCodes,setRecoveryCodes]=useState<string[]>([]),[recoveryBusy,setRecoveryBusy]=useState(false),[recoveryMessage,setRecoveryMessage]=useState('');
 const[totpEnabled,setTotpEnabled]=useState(false),[totpAvailable,setTotpAvailable]=useState(true),[totpBusy,setTotpBusy]=useState(false);
 const[totpSecret,setTotpSecret]=useState(''),[totpCode,setTotpCode]=useState(''),[totpMessage,setTotpMessage]=useState('');
 const[recoveryReady,setRecoveryReady]=useState(false),[durableMethodCount,setDurableMethodCount]=useState(0);
 const[recoveryMethods,setRecoveryMethods]=useState<Record<string,boolean>>({});
 const[readinessRecommendation,setReadinessRecommendation]=useState('');
 const[platformOwner,setPlatformOwner]=useState(false),[developer,setDeveloper]=useState(false);

 async function loadReadiness(){
  const token=getPlatformAuthToken();if(!token)return;
  try{
   const r=await fetch(`${api}/api/auth/recovery-readiness`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   const d=await read(r);
   if(r.ok){
    setRecoveryReady(Boolean(d.ready));setDurableMethodCount(Number(d.durable_method_count||0));
    setRecoveryMethods(d.methods||{});setReadinessRecommendation(String(d.recommendation||''));
   }
  }catch{}
 }
 useEffect(()=>{(async()=>{
  const token=getPlatformAuthToken();
  if(!token){location.replace('/login?returnTo=/account');return}
  try{
   const r=await fetch(`${api}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}),d=await read(r);
   if(!r.ok||!d.user){localStorage.removeItem('iam_account_token');localStorage.removeItem('iam_account_session_expires_at');sessionStorage.removeItem('iam_session_active');location.replace('/login?returnTo=/account');return}
   setUser(d.user);setPlatformOwner(Boolean(d.platform_owner));setDeveloper(Boolean(d.developer));
   try{
    const stored=sessionStorage.getItem('iam_initial_recovery_codes');
    if(stored){
      const parsed=JSON.parse(stored);
      if(Array.isArray(parsed)&&parsed.length){
        setRecoveryCodes(parsed.map(String));
        setRecoveryMessage('These are your one-time backup recovery codes. Save them somewhere private before leaving this page.');
      }
    }
   }catch{}
   try{
    const statusResponse=await fetch(`${api}/api/auth/totp/status`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
    const status=await read(statusResponse);
    if(statusResponse.ok){setTotpAvailable(status.available!==false);setTotpEnabled(Boolean(status.enabled))}
   }catch{}
   await loadReadiness();
   setReady(true);
  }catch{setError('Your account could not be loaded. Check your connection and try again.');setReady(true)}
 })()},[]);
 async function logout(){
  const token=getPlatformAuthToken();
  try{if(token)await fetch(`${api}/api/auth/logout`,{method:'POST',headers:{Authorization:`Bearer ${token}`}})}catch{}
  localStorage.removeItem('iam_account_token');localStorage.removeItem('iam_account_session_expires_at');sessionStorage.removeItem('iam_session_active');location.replace('/login');
 }
 async function createRecoveryCodes(){
  const token=getPlatformAuthToken();if(!token){location.replace('/login?returnTo=/account');return}
  setRecoveryBusy(true);setRecoveryMessage('');setError('');
  try{
   const r=await fetch(`${api}/api/auth/recovery-codes`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
   const d=await read(r);if(!r.ok||!Array.isArray(d.codes))throw new Error(d.detail||'Unable to create recovery codes.');
   setRecoveryCodes(d.codes);sessionStorage.setItem('iam_initial_recovery_codes',JSON.stringify(d.codes));setRecoveryMessage('New one-time recovery codes created. Save them somewhere private before leaving this page.');await loadReadiness();
  }catch(err:any){setError(err?.message||'Unable to create recovery codes.')}
  finally{setRecoveryBusy(false)}
 }
 async function copyRecoveryCodes(){
  if(!recoveryCodes.length)return;
  try{await navigator.clipboard.writeText(recoveryCodes.join('\n'));setRecoveryMessage('Recovery codes copied. Store them somewhere private.')}catch{setRecoveryMessage('Copy was blocked by this browser. Select and save the codes manually.')}
 }
 async function startTotp(){
  const token=getPlatformAuthToken();if(!token){location.replace('/login?returnTo=/account');return}
  setTotpBusy(true);setTotpMessage('');setError('');
  try{
   const r=await fetch(`${api}/api/auth/totp/enroll`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
   const d=await read(r);if(!r.ok||!d.manual_key)throw new Error(d.detail||'Unable to start authenticator setup.');
   setTotpSecret(String(d.manual_key));setTotpCode('');
   setTotpMessage('In Google Authenticator, choose Add code → Enter a setup key. Use your account email and the setup key shown below, then enter the 6-digit code to confirm.');
  }catch(err:any){setError(err?.message||'Unable to start authenticator setup.')}
  finally{setTotpBusy(false)}
 }
 async function confirmTotp(){
  const token=getPlatformAuthToken();if(!token){location.replace('/login?returnTo=/account');return}
  if(totpCode.length!==6){setError('Enter the current 6-digit code from Google Authenticator.');return}
  setTotpBusy(true);setTotpMessage('');setError('');
  try{
   const r=await fetch(`${api}/api/auth/totp/confirm`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({code:totpCode})});
   const d=await read(r);if(!r.ok||!d.enabled)throw new Error(d.detail||'Authenticator verification failed.');
   setTotpEnabled(true);setTotpSecret('');setTotpCode('');
   if(Array.isArray(d.backup_recovery_codes)&&d.backup_recovery_codes.length){
    const codes=d.backup_recovery_codes.map(String);setRecoveryCodes(codes);sessionStorage.setItem('iam_initial_recovery_codes',JSON.stringify(codes));
    setRecoveryMessage('Backup recovery codes were created with Authenticator. Save them somewhere private before leaving this page.');
   }
   setTotpMessage(d.detail||'Google Authenticator protection is enabled. Future sign-ins will require your password and current 6-digit authenticator code.');
   await loadReadiness();
  }catch(err:any){setError(err?.message||'Authenticator verification failed.')}
  finally{setTotpBusy(false)}
 }
 function acknowledgeRecoveryCodes(){
  sessionStorage.removeItem('iam_initial_recovery_codes');
  setRecoveryCodes([]);
  setRecoveryMessage('Recovery codes acknowledged. Keep your saved copy somewhere private and separate from this device.');
 }
 async function copyTotpKey(){
  if(!totpSecret)return;
  try{await navigator.clipboard.writeText(totpSecret);setTotpMessage('Setup key copied. Keep it private.')}catch{setTotpMessage('Copy was blocked by this browser. Select the key manually.')}
 }
 if(!ready)return <main className="loading">Loading your Magnanimous account…<style jsx>{`.loading{min-height:100vh;display:grid;place-items:center;background:#031129;color:#c9efff;font:14px Inter,system-ui}`}</style></main>;
 return <main className="page"><header><a href="/">← Platform</a><span>MY MAGNANIMOUS ACCOUNT</span></header><section className="hero"><small>I AM MAGNANIMOUS WAY™</small><h1>Your Account</h1><p>One account for your Magnanimous AI workspace, tools, connections and services.</p></section>{error&&<div className="error" role="alert">{error}</div>}<section className="grid"><article><div className="head"><b>PROFILE</b><span>SECURE SESSION</span></div><dl><div><dt>Name</dt><dd>{user.name||'—'}</dd></div><div><dt>Email</dt><dd>{user.email||'—'}</dd></div><div><dt>Workspace role</dt><dd>{platformOwner&&developer?'PLATFORM OWNER • DEVELOPER':user.role||'member'}</dd></div></dl><button className="logout" onClick={logout}>Log out securely</button></article><article><div className="head"><b>ACCOUNT & SERVICES</b><span>QUICK ACCESS</span></div><nav><a href="/start"><strong>Start / Workspace</strong><small>Return to your main Magnanimous workspace.</small></a><a href="/pricing"><strong>Plans & Pricing</strong><small>Review current plan options.</small></a><a href="/billing-support"><strong>Billing Support</strong><small>Manage billing questions and cancellation requests.</small></a><a href="/connections"><strong>Connections</strong><small>Review supported platform connections.</small></a><a href="/security"><strong>Security & Privacy</strong><small>Read the platform security model and protections.</small></a><a href="/support"><strong>Support</strong><small>Get help using the platform.</small></a></nav></article></section><section className={`readiness ${recoveryReady?'ready':'needs'}`}><div className="head"><b>ACCOUNT RECOVERY READINESS</b><span>{recoveryReady?'RECOVERY READY':'NEEDS ONE MORE METHOD'}</span></div><div className="readinessGrid"><div><strong>{durableMethodCount}</strong><small>DURABLE RECOVERY METHODS</small></div><div className="methodList"><span className={recoveryMethods.recovery_codes?'on':''}>Recovery codes</span><span className={recoveryMethods.authenticator?'on':''}>Google Authenticator</span><span className={recoveryMethods.recovery_email?'on':''}>Verified recovery email</span><span className={recoveryMethods.recovery_phone?'on':''}>Verified recovery phone</span></div></div><p>{readinessRecommendation||'Magnanimous recommends at least two independent recovery methods so one lost device or inbox cannot lock you out.'}</p></section>{totpAvailable&&<section className="totp"><div className="head"><b>GOOGLE AUTHENTICATOR</b><span>{totpEnabled?'ENABLED':'OPTIONAL 2-STEP VERIFICATION'}</span></div><p>Protect this Magnanimous account with a standard 6-digit authenticator code. Magnanimous generates and stores the secret itself; Google Authenticator only calculates the rotating code on your device.</p>{!totpEnabled&&!totpSecret&&<button className="totpPrimary" disabled={totpBusy} onClick={startTotp}>{totpBusy?'PREPARING…':'SET UP GOOGLE AUTHENTICATOR'}</button>}{!totpEnabled&&totpSecret&&<div className="totpSetup"><small>MANUAL SETUP KEY</small><code>{totpSecret}</code><div className="totpActions"><button onClick={copyTotpKey}>COPY SETUP KEY</button></div><label><span>Current 6-digit code</span><input inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,'').slice(0,6))}/></label><button className="totpPrimary" disabled={totpBusy||totpCode.length!==6} onClick={confirmTotp}>{totpBusy?'VERIFYING…':'VERIFY & ENABLE'}</button></div>}{totpEnabled&&<div className="totpEnabled">Authenticator protection is active for this account. Future customer sign-ins require the current 6-digit code after the password is verified.</div>}{totpMessage&&<div className="totpMessage">{totpMessage}</div>}</section>}<RecoveryContacts onChanged={loadReadiness}/><section className="recovery"><div className="head"><b>NATIVE ACCOUNT RECOVERY</b><span>NO EMAIL PROVIDER REQUIRED</span></div><p>Magnanimous recovery codes let you regain access without Inkbox, Gmail, or another mail service. Each code works once. Creating a new set disables any unused older set.</p><div className="recoveryActions"><button disabled={recoveryBusy} onClick={createRecoveryCodes}>{recoveryBusy?'CREATING…':recoveryCodes.length?'CREATE A NEW SET':'CREATE RECOVERY CODES'}</button>{recoveryCodes.length>0&&<button className="copy" onClick={copyRecoveryCodes}>COPY CODES</button>}{recoveryCodes.length>0&&<button className="saved" onClick={acknowledgeRecoveryCodes}>I SAVED THESE CODES</button>}</div>{recoveryMessage&&<div className="recoveryMessage">{recoveryMessage}</div>}{recoveryCodes.length>0&&<div className="codes" aria-label="Magnanimous recovery codes">{recoveryCodes.map(code=><code key={code}>{code}</code>)}</div>}</section><section className="note"><b>Privacy boundary</b><p>Your customer account is separate from global owner controls, infrastructure credentials and provider administration.</p></section><style jsx>{`
.page{min-height:100vh;background:#031129;color:#effaff;padding:24px 32px 60px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 8%,rgba(36,173,255,.17),transparent 30%)}header,.hero,.grid,.readiness,.totp,.recovery,.note,.error{max-width:1100px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.14em;color:#75a5bd}header a{color:#70ddff;text-decoration:none}.hero{margin-top:28px;border:1px solid #21688f;border-radius:18px;background:linear-gradient(135deg,#071d39,#041024);padding:30px}.hero small{font-size:9px;letter-spacing:.18em;color:#5ce5ff}.hero h1{font:700 clamp(40px,7vw,68px) Georgia,serif;margin:5px 0 8px;color:#d7f5ff}.hero p{color:#a6c5d3;line-height:1.55}.error{margin-top:12px;border:1px solid #70343b;background:#251116;color:#ffc1c6;padding:12px;border-radius:9px}.grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px;margin-top:14px}.grid article,.readiness,.totp,.recovery,.note{border:1px solid #1f506c;background:#071625;border-radius:15px;padding:20px}.head{display:flex;justify-content:space-between;color:#8edcff;font-size:10px;letter-spacing:.1em;margin-bottom:14px}.head span{color:#618da3}dl{margin:0}dl div{padding:12px 0;border-bottom:1px solid #18394d}dt{color:#7899aa;font-size:9px;text-transform:uppercase;letter-spacing:.12em}dd{margin:5px 0 0;color:#e8f7ff;overflow-wrap:anywhere}nav{display:grid;grid-template-columns:1fr 1fr;gap:9px}nav a{display:grid;gap:5px;border:1px solid #245d7c;border-radius:10px;padding:13px;text-decoration:none;background:#071c30;color:#e8f8ff}nav a:hover{border-color:#5adfff}nav small{color:#7fa3b5;line-height:1.4}.logout{margin-top:18px;border:1px solid #8b4750;background:#34151b;color:#ffd6d9;border-radius:9px;padding:11px 14px;font-weight:800;cursor:pointer}.readiness{margin-top:14px}.readiness.ready{border-color:#315c43;background:#071b13}.readiness.needs{border-color:#765f3e;background:#211907}.readinessGrid{display:grid;grid-template-columns:180px 1fr;gap:14px;align-items:center}.readinessGrid>div:first-child{display:grid;gap:3px}.readinessGrid strong{font-size:38px;color:#dff8ff}.readinessGrid small{font-size:9px;color:#83a4b5;letter-spacing:.1em}.methodList{display:flex;gap:7px;flex-wrap:wrap}.methodList span{border:1px solid #3c4b54;border-radius:999px;padding:7px 9px;color:#718894;font-size:10px}.methodList span.on{border-color:#3f8a61;background:#0b2a19;color:#baf7d3}.readiness>p{color:#9ab4c1;line-height:1.55;margin:12px 0 0}.totp{margin-top:14px}.totp>p{color:#8daab7;line-height:1.6;margin:0 0 14px}.totpPrimary,.totpActions button{border:1px solid #4cbde8;background:#0b3047;color:#dff8ff;border-radius:9px;padding:11px 14px;font-weight:900;cursor:pointer}.totpPrimary:disabled{opacity:.6}.totpSetup{display:grid;gap:10px}.totpSetup small{color:#6fdfff;font-size:9px;letter-spacing:.12em}.totpSetup code{display:block;padding:12px;border:1px solid #2a627e;background:#03101a;border-radius:8px;color:#ffe8a8;overflow-wrap:anywhere}.totpSetup label span{display:block;margin-bottom:5px;color:#8daab7;font-size:10px}.totpSetup input{box-sizing:border-box;width:100%;max-width:260px;padding:12px;border:1px solid #2a627e;background:#03101a;color:#fff;border-radius:8px;font-size:18px;letter-spacing:.15em}.totpEnabled,.totpMessage{margin-top:12px;padding:10px;border-radius:8px;font-size:12px}.totpEnabled{border:1px solid #315c43;background:#0c2518;color:#baf7d3}.totpMessage{border:1px solid #315b71;background:#092033;color:#ccefff}.recovery{margin-top:14px}.recovery>p{color:#8daab7;line-height:1.6;margin:0 0 14px}.recoveryActions{display:flex;gap:9px;flex-wrap:wrap}.recoveryActions button{border:1px solid #4cbde8;background:#0b3047;color:#dff8ff;border-radius:9px;padding:11px 14px;font-weight:900;cursor:pointer}.recoveryActions button:disabled{opacity:.6}.recoveryActions .copy{border-color:#b58a39;background:#3a2b0d;color:#ffe6a4}.recoveryActions .saved{border-color:#43875d;background:#0c2b18;color:#c9f8d8}.recoveryMessage{margin-top:12px;padding:10px;border:1px solid #315c43;background:#0c2518;color:#baf7d3;border-radius:8px;font-size:12px}.codes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.codes code{display:block;padding:10px;border:1px solid #274f64;background:#03101a;border-radius:8px;color:#dff8ff;font-size:12px;overflow-wrap:anywhere}.note{margin-top:14px}.note b{color:#91e4ff}.note p{color:#8daab7;margin-bottom:0;line-height:1.5}@media(max-width:760px){.page{padding:18px 13px 40px}.grid,.readinessGrid{grid-template-columns:1fr}.codes{grid-template-columns:1fr}nav{grid-template-columns:1fr}header span{display:none}}
`}</style></main>
}