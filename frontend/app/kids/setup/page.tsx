'use client';
import {useEffect,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const token=()=>typeof window==='undefined'?'':(localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||'');
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{detail:t||`Request failed (${r.status})`}}}

export default function KidsDriveSetup(){
 const[ready,setReady]=useState(false),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('Checking owner Drive connection…');
 const ownerLogin='/owner-login?returnTo=%2Fkids%2Fsetup';
 async function status(){
  const t=token();if(!t){location.replace(ownerLogin);return}
  const r=await fetch(`${api}/api/kids-drive/owner-status`,{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await read(r);
  if(r.status===401||r.status===403){localStorage.removeItem('iam_account_token');localStorage.removeItem('odin_admin_token');location.replace(ownerLogin);return}
  if(!r.ok){setMessage(d.detail||'Could not read Kids Drive status.');return}
  setReady(Boolean(d.ready));setEmail(String(d.google_email||''));setMessage(d.ready?'Owner Google Drive is connected. Audience playback can use the private server-side stream.':'Connect the approved owner Google account once. Audience viewers will not see or receive the Google login or token.');
 }
 useEffect(()=>{status()},[]);
 async function connect(){
  const t=token();if(!t){location.replace(ownerLogin);return}
  setBusy(true);setMessage('Opening Google authorization…');
  try{
   const r=await fetch(`${api}/api/kids-drive/connect`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:'{}'}),d=await read(r);
   if(r.status===401||r.status===403){localStorage.removeItem('iam_account_token');localStorage.removeItem('odin_admin_token');location.replace(ownerLogin);return}
   if(!r.ok)throw new Error(d.detail||'Could not start Google Drive authorization.');
   location.href=d.authorization_url;
  }catch(e:any){setMessage(e?.message||'Could not start Google Drive authorization.');setBusy(false)}
 }
 return <main className="page"><section className="card"><div className="badge">I AM MAGNANIMOUS WAY™</div><h1>Magnanimous Kids — Owner Drive Setup</h1><p>{message}</p>{ready&&<div className="ok">Connected{email?` as ${email}`:''}</div>}<div className="actions"><button onClick={connect} disabled={busy}>{busy?'OPENING GOOGLE…':ready?'RECONNECT APPROVED GOOGLE DRIVE':'CONNECT APPROVED GOOGLE DRIVE'}</button><a href="https://visceral-mind-8h47qvf.shipstatic.com/">OPEN KIDS APP</a></div><small>Security: the Google refresh token stays encrypted on the Magnanimous backend. Audience users receive only approved media bytes; they never receive the owner password, Drive token, or Drive session.</small></section><style jsx>{`
  .page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f7fb;color:#101828;font-family:Inter,system-ui,sans-serif}.card{width:min(760px,100%);background:white;border:1px solid #e5e7eb;border-radius:24px;padding:30px;box-shadow:0 18px 50px #10182814}.badge{font-size:12px;font-weight:900;letter-spacing:.12em;color:#7c3aed}.card h1{font-size:clamp(30px,6vw,54px);line-height:1.05;margin:10px 0 16px}.card p{color:#475467;line-height:1.65}.ok{background:#ecfdf3;color:#047857;padding:12px 14px;border-radius:12px;font-weight:800;margin:16px 0}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.actions button,.actions a{border:0;border-radius:12px;padding:12px 16px;background:#111827;color:white;text-decoration:none;font-weight:900}.actions a{background:#7c3aed}.actions button:disabled{opacity:.6}.card small{display:block;color:#667085;line-height:1.5}
 `}</style></main>
}
