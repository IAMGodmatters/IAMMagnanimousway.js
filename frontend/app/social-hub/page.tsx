'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPlatformAuthToken} from '../lib/magnanimous-session';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';

type Connected={external_account_id:string;display_name:string;token_expires_at:number|null};
type Integration={id:string;name:string;category:string;auth:string;configured:boolean;connected:Connected[]};
type Publisher={id:string;name:string;configured:boolean;connected:boolean;display_name?:string;approval?:string};

const icon:Record<string,string>={facebook:'f',instagram:'◎',whatsapp:'◉',youtube:'▶',linkedin:'in',tiktok:'♪',x:'𝕏',snapchat:'◌',discord:'◈',telegram:'➤'};
const help:Record<string,string>={
 facebook:'Authorize Facebook Pages for the page access and publishing permissions you approve.',
 instagram:'Authorize an eligible Instagram professional account connected through Meta.',
 whatsapp:'Authorize WhatsApp Business for approved business messaging and account operations.',
 youtube:'Authorize your Google/YouTube channel for the YouTube scopes approved on the provider screen.',
 linkedin:'Authorize your LinkedIn member account for approved profile and posting access.',
 tiktok:'Authorize TikTok Login Kit and approved Content Posting permissions.',
 x:'Authorize X for the read/write scopes enabled for the platform app.',
 snapchat:'Authorize eligible Snapchat Business resources and approved marketing access.',
 discord:'Authorize the Discord account/workspace permissions offered by the configured app.',
 telegram:'Telegram uses its secure bot-token connection rather than browser OAuth.'
};

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||`Request failed (${r.status})`}}}

export default function SocialHub(){
 const[items,setItems]=useState<Integration[]>([]),[publishers,setPublishers]=useState<Publisher[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const[privacy,setPrivacy]=useState(false),[terms,setTerms]=useState(false),[aiAccess,setAiAccess]=useState(false);
 const consentReady=privacy&&terms&&aiAccess;
 function token(){return getPlatformAuthToken()||localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
 function headers(json=false){const h:Record<string,string>={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}

 async function load(){
  setLoading(true);setError('');
  try{
   const [ir,pr]=await Promise.all([
    fetch(`${api}/api/integrations`,{headers:headers(),cache:'no-store'}),
    fetch(`${api}/api/social-connect/connections`,{headers:headers(),cache:'no-store'})
   ]);
   if(ir.status===401||pr.status===401){location.replace('/login?returnTo=%2Fsocial-hub');return}
   const id=await read(ir),pd=await read(pr);
   if(!ir.ok)throw new Error(id.error||'Unable to load connected-account providers.');
   if(!pr.ok)throw new Error(pd.detail||pd.error||'Unable to load social publishing providers.');
   setItems((id.integrations||[]).filter((x:Integration)=>x.category==='social'||x.category==='messaging'));
   setPublishers(pd.connections||[]);
  }catch(e:any){setError(e?.message||'Unable to load social connections.')}finally{setLoading(false)}
 }

 useEffect(()=>{
  if(!token()){location.replace('/login?returnTo=%2Fsocial-hub');return}
  if(sessionStorage.getItem('iam-social-consent-v2')==='accepted'){setPrivacy(true);setTerms(true);setAiAccess(true)}
  const q=new URLSearchParams(location.search),connected=q.get('connected')||q.get('integration');
  if(connected)setNotice(`${connected} connected securely. Magnanimous can now use only the permissions that account granted.`);
  void load();
 },[]);

 function setConsent(kind:'privacy'|'terms'|'ai',value:boolean){
  if(kind==='privacy')setPrivacy(value);if(kind==='terms')setTerms(value);if(kind==='ai')setAiAccess(value);
  if(!value)sessionStorage.removeItem('iam-social-consent-v2');
  setError('');
 }
 function rememberConsent(){if(consentReady)sessionStorage.setItem('iam-social-consent-v2','accepted')}
 function requireConsent(){if(consentReady){rememberConsent();return true}setError('Complete all three consent checkmarks before opening a social provider sign-in.');return false}

 async function connectIntegration(item:Integration){
  if(!requireConsent())return;
  if(item.id==='telegram'){location.assign('/connections?provider=telegram');return}
  if(!item.configured){location.assign(`/owner-integrations?provider=${encodeURIComponent(item.id)}`);return}
  setBusy(item.id);setError('');setNotice('');
  try{
   const r=await fetch(`${api}/api/integrations/${item.id}/connect`,{method:'POST',headers:headers(true),body:JSON.stringify({return_path:'/social-hub'})}),d=await read(r);
   if(!r.ok)throw new Error(d.error||d.detail||`${item.name} authorization could not start.`);
   if(!d.authorization_url)throw new Error(`${item.name} did not return an official authorization URL.`);
   location.assign(String(d.authorization_url));
  }catch(e:any){setError(e?.message||'Authorization could not start.');setBusy('')}
 }

 async function connectPublisher(item:Publisher){
  if(!requireConsent())return;
  if(!item.configured){location.assign(`/social-connect?provider=${encodeURIComponent(item.id)}`);return}
  setBusy(item.id);setError('');setNotice('');
  try{
   sessionStorage.setItem('iam-social-hub-return','1');
   const r=await fetch(`${api}/api/social-connect/${item.id}/start`,{method:'POST',headers:headers()}),d=await read(r);
   if(!r.ok)throw new Error(d.detail||d.error||`${item.name} authorization could not start.`);
   if(!d.url)throw new Error(`${item.name} did not return an official authorization URL.`);
   location.assign(String(d.url));
  }catch(e:any){sessionStorage.removeItem('iam-social-hub-return');setError(e?.message||'Authorization could not start.');setBusy('')}
 }

 const connectedTotal=useMemo(()=>items.reduce((n,x)=>n+x.connected.length,0)+publishers.filter(x=>x.connected).length,[items,publishers]);
 const allProviders=useMemo(()=>{
  const publishing=publishers.map(x=>({...x,kind:'publisher' as const,category:'social'}));
  const direct=items.map(x=>({...x,kind:'integration' as const}));
  const rank=['facebook','instagram','whatsapp','youtube','linkedin','tiktok','x','snapchat','discord','telegram'];
  return [...publishing,...direct].sort((a,b)=>{const ai=rank.indexOf(a.id),bi=rank.indexOf(b.id);return(ai<0?99:ai)-(bi<0?99:bi)||a.name.localeCompare(b.name)});
 },[items,publishers]);

 return <main className="page">
  <header><a href="/social-media">← Social Studio</a><span>UNIVERSAL SOCIAL AUTHORIZATION</span><a href="/assistant-actions">Magnanimous AI →</a></header>
  <section className="hero"><small>I AM MAGNANIMOUS WAY™ • OFFICIAL PROVIDER AUTHORIZATION</small><h1>One social hub. Every supported network. Your permission first.</h1><p>Connect every social or messaging provider currently supported by the platform from one place. The button opens the provider’s official sign-in/authorization flow; passwords are never collected by I AM.</p></section>

  <section className="consent" aria-label="Social account consent">
   <div><small>REQUIRED BEFORE ANY SOCIAL LOGIN</small><h2>Three checkmarks unlock provider sign-in</h2><p>These checks authorize the connection workflow only. The social network still shows its own permission screen and controls the exact scopes, account eligibility, quotas and app-review requirements.</p></div>
   <label><input type="checkbox" checked={privacy} onChange={e=>setConsent('privacy',e.target.checked)}/><span><b>Privacy ✓</b> I have read and agree to the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
   <label><input type="checkbox" checked={terms} onChange={e=>setConsent('terms',e.target.checked)}/><span><b>Terms ✓</b> I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a>.</span></label>
   <label><input type="checkbox" checked={aiAccess} onChange={e=>setConsent('ai',e.target.checked)}/><span><b>Connected AI access ✓</b> I authorize Magnanimous AI to assist with this connected account using only the permissions I approve on the provider screen. Posting and other consequential actions remain subject to the platform’s confirmation gates.</span></label>
   <div className={consentReady?'status ready':'status'} aria-live="polite">{consentReady?'✓ Consent complete — social sign-in buttons are enabled.':'Complete all three checkmarks to enable social sign-in.'}</div>
  </section>

  {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
  <section className="summary"><div><b>{connectedTotal}</b><span>connected accounts</span></div><div><b>{allProviders.length}</b><span>supported social/messaging providers detected</span></div><div><b>{consentReady?'READY':'LOCKED'}</b><span>official login gate</span></div></section>

  <section className="grid">
   {loading?<div className="loading">Loading live social provider registry…</div>:allProviders.map((entry:any)=>{
    const connected=entry.kind==='publisher'?Boolean(entry.connected):entry.connected?.length>0;
    const configured=Boolean(entry.configured);
    const manual=entry.id==='telegram';
    const action=()=>entry.kind==='publisher'?connectPublisher(entry):connectIntegration(entry);
    return <article key={`${entry.kind}-${entry.id}`} className={connected?'on':''}>
     <div className="head"><div className="icon">{icon[entry.id]||'◇'}</div><div><small>{entry.kind==='publisher'?'FIRST-PARTY PUBLISHING':String(entry.category||'social').toUpperCase()}</small><h2>{entry.name}</h2></div><span>{connected?'● CONNECTED':configured||manual?'READY':'SETUP REQUIRED'}</span></div>
     <p>{help[entry.id]||entry.approval||'Authorize this account using the provider’s official connection flow.'}</p>
     {entry.approval&&<p className="approval">{entry.approval}</p>}
     {connected&&<div className="connected">✓ {entry.kind==='publisher'?(entry.display_name||'Connected account'):(entry.connected?.map((x:Connected)=>x.display_name||'Connected account').join(', ')||'Connected account')}</div>}
     <button disabled={!consentReady||busy===entry.id} onClick={action}>{busy===entry.id?'OPENING OFFICIAL SIGN-IN…':connected?'AUTHORIZE ANOTHER / REFRESH ACCESS':manual?'OPEN SECURE TELEGRAM CONNECTION':configured?`SIGN IN WITH ${entry.name.toUpperCase()}`:`SET UP & CONNECT ${entry.name.toUpperCase()}`}</button>
     {connected&&<div className="actions"><a href="/assistant-actions">USE WITH MAGNANIMOUS AI →</a>{entry.kind==='publisher'&&<a href="/social-connect">OPEN PUBLISHING CONTROLS →</a>}</div>}
    </article>
   })}
  </section>

  <section className="truth"><b>Access is real, not simulated.</b><p>Once a provider authorizes the account, I AM can use the granted read/write capabilities for AI assistance and supported publishing workflows. No code can legitimately bypass provider approval, unsupported scopes, business-account requirements, quotas, or a user’s own authorization choices.</p></section>
  <footer>Facebook • Instagram • WhatsApp • YouTube • LinkedIn • TikTok • X • Snapchat • Discord • Telegram • plus future social/messaging integrations added to the platform registry</footer>

  <style jsx>{`.page{min-height:100vh;background:#050b10;color:#effbff;padding:24px 30px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 12% 10%,rgba(48,215,255,.12),transparent 24%),radial-gradient(circle at 86% 72%,rgba(95,255,177,.08),transparent 28%)}header,.hero,.consent,.summary,.grid,.truth,footer,.error,.notice{max-width:1400px;margin-left:auto;margin-right:auto}header{display:flex;justify-content:space-between;gap:14px;font-size:9px;letter-spacing:.14em;color:#7491a0}header a{color:#b8efff;text-decoration:none}.hero{padding:52px 0 30px}.hero small,.consent small{color:#5fe7b0;font-weight:900;letter-spacing:.18em}.hero h1{font-size:clamp(42px,6.5vw,78px);line-height:.96;max-width:1100px;margin:10px 0}.hero p,.consent p,.truth p,article p{color:#89a4b2;line-height:1.6}.consent{border:1px solid #25576d;border-radius:20px;background:rgba(7,21,29,.88);padding:22px;display:grid;gap:11px}.consent h2{margin:5px 0}.consent label{display:flex;gap:11px;align-items:flex-start;border:1px solid #173b4d;border-radius:12px;padding:13px;background:#06131b}.consent input{width:21px;height:21px;flex:none;accent-color:#55e9ae}.consent a{color:#b8efff}.status{border:1px solid #674e2b;border-radius:10px;padding:11px;color:#e0bc7f;background:#21190c}.status.ready{border-color:#286445;color:#9ff3c1;background:#082018}.error,.notice{margin-top:12px;padding:12px;border-radius:10px}.error{border:1px solid #703642;background:#260d14;color:#ffc0ca}.notice{border:1px solid #2c654c;background:#092219;color:#aaf2c7}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.summary div{border:1px solid #173849;border-radius:13px;background:#071119;padding:15px}.summary b{display:block;font-size:25px;color:#6ee1ff}.summary span{font-size:9px;color:#7993a1}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:12px}.grid article{border:1px solid #18394b;border-radius:17px;background:#071119;padding:18px}.grid article.on{border-color:#286044;background:linear-gradient(145deg,#071119,#071a12)}.head{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center}.icon{width:46px;height:46px;border:1px solid #2c6075;border-radius:12px;display:grid;place-items:center;font-size:20px;color:#7ce6ff}.head small{font-size:8px;letter-spacing:.12em;color:#6f8997}.head h2{font-size:20px;margin:3px 0}.head>span{font-size:8px;color:#78dda0}.approval{font-size:9px!important}.connected{margin:10px 0;border:1px solid #23583f;border-radius:9px;padding:9px;color:#91edb3;background:#071b12;font-size:10px}.grid button{width:100%;border:0;border-radius:10px;background:linear-gradient(90deg,#1d9cc8,#52e6a7);color:#041a15;padding:12px;font-weight:900;cursor:pointer}.grid button:disabled{opacity:.42;cursor:not-allowed}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.actions a{color:#8fe9ff;text-decoration:none;font-size:9px}.truth{margin-top:14px;border:1px solid #3f4e2e;border-radius:14px;background:#121508;padding:17px}.truth b{color:#f0ca79}.truth p{margin-bottom:0}footer{margin-top:18px;border-top:1px solid #173141;padding-top:14px;color:#647e8c;font-size:9px}.loading{grid-column:1/-1;padding:48px;text-align:center;color:#748f9e}@media(max-width:950px){.grid{grid-template-columns:1fr 1fr}.page{padding:18px 14px}.head{grid-template-columns:48px 1fr}.head>span{grid-column:2}}@media(max-width:620px){.grid,.summary{grid-template-columns:1fr}header{flex-wrap:wrap}.hero{padding:34px 0 22px}.consent{padding:16px}}`}</style>
 </main>
}
