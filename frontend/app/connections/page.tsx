'use client';
import {useEffect,useState} from 'react';

type Connected={external_account_id:string;display_name:string;token_expires_at:number|null};
type Integration={id:string;name:string;category:string;auth:string;configured:boolean;connected:Connected[]};
type VaultField={key:string;label:string;secret:boolean;required:boolean;set:boolean;source:'cloudflare'|'vault'|'missing';updated_at:number|null};
type VaultGroup={id:string;name:string;providers:string[];configured:boolean;fields:VaultField[]};
type VaultPayload={groups:VaultGroup[];callbacks:Record<string,string>};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const icons:Record<string,string>={google:'✉',facebook:'f',instagram:'◎',whatsapp:'◉',shopify:'S',shopee:'◈',x:'𝕏',snapchat:'◌',outlook:'✦',slack:'#',discord:'☁',telegram:'➤','google-calendar':'▣'};
const cats:Record<string,string>={email:'EMAIL',social:'SOCIAL',messaging:'MESSAGING',commerce:'COMMERCE',work:'WORK',calendar:'CALENDAR'};
const providerNames:Record<string,string>={facebook:'Facebook',instagram:'Instagram',whatsapp:'WhatsApp',google:'Google / Gmail','google-calendar':'Google Calendar',shopify:'Shopify',shopee:'Shopee',x:'X',snapchat:'Snapchat',outlook:'Microsoft Outlook',slack:'Slack',discord:'Discord'};

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||`Request failed (${r.status})`}}}

export default function Connections(){
 const[items,setItems]=useState<Integration[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState('');
 const[busy,setBusy]=useState('');
 const[shop,setShop]=useState('');
 const[telegram,setTelegram]=useState('');
 const[vault,setVault]=useState<VaultPayload|null>(null);
 const[vaultValues,setVaultValues]=useState<Record<string,string>>({});
 const[vaultBusy,setVaultBusy]=useState('');
 const[vaultNotice,setVaultNotice]=useState('');
 const[vaultOpen,setVaultOpen]=useState(false);

 function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
 function headers(json=false){const h:any={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}

 async function load(){
  setLoading(true);setError('');
  try{
   const r=await fetch(`${api}/api/integrations`,{headers:headers(),cache:'no-store'}),d=await read(r);
   if(r.status===401){location.replace('/login');return}
   if(!r.ok)throw new Error(d.error||'Unable to load connections.');
   setItems(d.integrations||[]);
  }catch(e:any){setError(e?.message||'Unable to load connections.')}finally{setLoading(false)}
 }

 async function loadVault(){
  try{
   const r=await fetch(`${api}/api/integrations/platform-credentials`,{headers:headers(),cache:'no-store'}),d=await read(r);
   if(r.ok)setVault({groups:d.groups||[],callbacks:d.callbacks||{}});
   else if(r.status===401||r.status===403)setVault(null);
  }catch{setVault(null)}
 }

 useEffect(()=>{if(!token()){location.replace('/login');return}load();loadVault()},[]);

 async function connect(item:Integration){
  setBusy(item.id);setError('');
  try{
   const body=item.id==='shopify'?{shop_domain:shop}:{};
   const r=await fetch(`${api}/api/integrations/${item.id}/connect`,{method:'POST',headers:headers(true),body:JSON.stringify(body)}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to start connection.');
   if(d.authorization_url)location.href=d.authorization_url;
   else throw new Error('Provider did not return an authorization URL.');
  }catch(e:any){setError(e?.message||'Unable to connect.');setBusy('')}
 }

 async function connectTelegram(){
  setBusy('telegram');setError('');
  try{
   const r=await fetch(`${api}/api/integrations/telegram/manual`,{method:'POST',headers:headers(true),body:JSON.stringify({token:telegram})}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to connect Telegram.');
   setTelegram('');await load();
  }catch(e:any){setError(e?.message||'Unable to connect Telegram.')}finally{setBusy('')}
 }

 async function disconnect(id:string){
  setBusy(id);
  try{
   const r=await fetch(`${api}/api/integrations/${id}/disconnect`,{method:'DELETE',headers:headers()}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to disconnect.');
   await load();
  }catch(e:any){setError(e?.message||'Unable to disconnect.')}finally{setBusy('')}
 }

 async function saveVaultGroup(group:VaultGroup){
  const values:Record<string,string>={};
  for(const field of group.fields){const value=(vaultValues[field.key]||'').trim();if(value)values[field.key]=value}
  if(!Object.keys(values).length){setVaultNotice(`Enter at least one ${group.name} developer credential.`);return}
  setVaultBusy(group.id);setVaultNotice('');
  try{
   const r=await fetch(`${api}/api/integrations/platform-credentials`,{method:'POST',headers:headers(true),body:JSON.stringify({values})}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to save platform credentials.');
   setVault({groups:d.groups||[],callbacks:d.callbacks||{}});
   setVaultValues(prev=>{const next={...prev};group.fields.forEach(f=>delete next[f.key]);return next});
   setVaultNotice(`${group.name} platform credentials saved securely. Customer Connect buttons will use them automatically.`);
   await load();
  }catch(e:any){setVaultNotice(e?.message||'Unable to save platform credentials.')}finally{setVaultBusy('')}
 }

 async function removeVaultGroup(group:VaultGroup){
  const keys=group.fields.filter(f=>f.source==='vault').map(f=>f.key);
  if(!keys.length){setVaultNotice(`${group.name} has no vault-stored credentials to remove.`);return}
  setVaultBusy(group.id);setVaultNotice('');
  try{
   const r=await fetch(`${api}/api/integrations/platform-credentials`,{method:'DELETE',headers:headers(true),body:JSON.stringify({keys})}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to remove saved credentials.');
   setVault({groups:d.groups||[],callbacks:d.callbacks||{}});setVaultNotice(`${group.name} vault credentials removed.`);await load();
  }catch(e:any){setVaultNotice(e?.message||'Unable to remove saved credentials.')}finally{setVaultBusy('')}
 }

 return <main className="connect">
  <header><a href="/">← Dashboard</a><span>SECURE TENANT CONNECTION FABRIC</span></header>

  <section className="hero">
   <div><small>I AM CONNECTIONS</small><h1>Connect the accounts your AI can assist with.</h1><p>Customers never give I AM their Facebook, Instagram, X, Shopify, or other account passwords. They authorize through each provider's official login screen. Platform developer credentials are managed separately by the owner.</p><div className="heroLinks"><a href="/connected-assistant">Connected Assistant</a><a href="/mux">Mux Video</a><a href="/virtual-assistant">Virtual Assistant</a><a href="/social-media">Social Studio</a></div></div>
   <div className="network"><div className="core">M</div>{['AI','CRM','SOC','VID','MAIL','SHOP'].map((x,i)=><span key={x} className={`n n${i}`}>{x}</span>)}</div>
  </section>

  {vault&&<section className="ownerVault">
   <div className="vaultTop"><div><small>OWNER ONLY • PLATFORM SETUP</small><h2>Platform Credentials Vault</h2><p>This is the missing setup area. Enter developer <b>Client IDs / App IDs and Client Secrets</b> here—not your personal social-media passwords. Values are encrypted server-side and never shown to customers.</p></div><button className="vaultToggle" onClick={()=>setVaultOpen(v=>!v)}>{vaultOpen?'HIDE VAULT':'OPEN PLATFORM SETUP'}</button></div>
   <div className="vaultStats"><span><b>{vault.groups.filter(g=>g.configured).length}</b> provider families ready</span><span><b>{vault.groups.filter(g=>!g.configured).length}</b> still need setup</span></div>
   {vaultNotice&&<div className="vaultNotice">{vaultNotice}</div>}
   {vaultOpen&&<div className="vaultGrid">{vault.groups.map(group=><article className={group.configured?'vaultReady':''} key={group.id}>
    <div className="vaultHead"><div><small>{group.providers.map(p=>providerNames[p]||p).join(' • ')}</small><h3>{group.name}</h3></div><span>{group.configured?'● READY':'SETUP NEEDED'}</span></div>
    <div className="vaultFields">{group.fields.map(field=><label key={field.key}><span>{field.label}{field.required?' *':' (optional)'}</span><input type={field.secret?'password':'text'} value={vaultValues[field.key]||''} onChange={e=>setVaultValues(v=>({...v,[field.key]:e.target.value}))} placeholder={field.set?field.source==='cloudflare'?'Already configured in Cloudflare':'Saved securely — enter replacement to change':'Enter developer credential'}/><em className={field.set?'set':'missing'}>{field.set?`✓ ${field.source==='cloudflare'?'Cloudflare secret':'encrypted vault'}`:'not set'}</em></label>)}</div>
    <div className="callbacks"><b>REGISTER THESE REDIRECT / CALLBACK URLS</b>{group.providers.map(p=><code key={p}>{providerNames[p]||p}: {vault.callbacks[p]}</code>)}</div>
    <div className="vaultActions"><button disabled={vaultBusy===group.id} onClick={()=>saveVaultGroup(group)}>{vaultBusy===group.id?'SAVING…':group.configured?'UPDATE CREDENTIALS':'SAVE & ENABLE'}</button>{group.fields.some(f=>f.source==='vault')&&<button className="remove" disabled={vaultBusy===group.id} onClick={()=>removeVaultGroup(group)}>REMOVE VAULT VALUES</button>}</div>
   </article>)}</div>}
  </section>}

  {error&&<div className="error">{error}</div>}
  <section className="summary"><div><b>{items.reduce((n,x)=>n+x.connected.length,0)}</b><span>connected accounts</span></div><div><b>{items.filter(x=>x.configured).length}</b><span>providers ready</span></div><div><b>1:1</b><span>tenant isolation</span></div></section>

  <section className="grid">{loading?<div className="loading">Loading secure integrations…</div>:items.map(item=>{const connected=item.connected.length>0;const setup=!item.configured;return <article key={item.id} className={connected?'on':''}>
   <div className="cardHead"><div className="icon">{icons[item.id]||'◇'}</div><div><small>{cats[item.category]||'INTEGRATION'}</small><h2>{item.name}</h2></div><span>{connected?'● CONNECTED':setup?'SETUP NEEDED':'READY'}</span></div>
   {connected&&<div className="accounts">{item.connected.map(c=><div key={c.external_account_id}>✓ {c.display_name||'Connected account'}</div>)}</div>}
   {item.id==='shopify'&&<input value={shop} onChange={e=>setShop(e.target.value)} placeholder="your-store.myshopify.com"/>}
   {item.id==='telegram'?<><input type="password" value={telegram} onChange={e=>setTelegram(e.target.value)} placeholder="Telegram bot token"/><button disabled={!telegram||busy==='telegram'} onClick={connectTelegram}>{busy==='telegram'?'VERIFYING…':connected?'CONNECT ANOTHER BOT':'VERIFY & CONNECT TELEGRAM'}</button></>:<button disabled={setup||busy===item.id||(item.id==='shopify'&&!shop)} onClick={()=>connect(item)}>{busy===item.id?'OPENING PROVIDER…':connected?'CONNECT ANOTHER ACCOUNT':setup?vault?'OWNER SETUP REQUIRED ABOVE':'PLATFORM SETUP REQUIRED':`CONNECT ${item.name.toUpperCase()}`}</button>}
   {setup&&<p className="setupHelp">The platform's developer OAuth app must be configured first. {vault?'Use the Owner Platform Credentials Vault above.':'Ask the platform owner to finish provider setup.'}</p>}
   {connected&&<button className="disconnect" disabled={busy===item.id} onClick={()=>disconnect(item.id)}>Disconnect {item.name}</button>}
  </article>})}</section>

  <section className="mux"><div><small>VIDEO CONNECTION</small><h2>Mux gets its own secure media workspace.</h2><p>Connect a personal Mux Video API token pair, save the optional Mux Data environment key, create direct uploads, and manage that tenant's assets.</p></div><a href="/mux">OPEN MUX MEDIA HUB →</a></section>
  <footer><b>SECURITY MODEL</b><span>Official provider OAuth • owner-only encrypted developer credential vault • tenant-bound OAuth state • encrypted customer access tokens • no customer social passwords stored</span></footer>

  <style jsx>{`
.connect{min-height:100vh;background:#05090f;color:#e9f6ff;padding:24px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 75% 20%,rgba(0,193,255,.11),transparent 28%),radial-gradient(circle at 18% 72%,rgba(255,176,45,.07),transparent 28%)}header{max-width:1380px;margin:auto;display:flex;justify-content:space-between;color:#6f8799;font-size:9px;letter-spacing:.18em}header a{color:#9de8ff;text-decoration:none}.hero{max-width:1380px;margin:27px auto 14px;padding:35px;border:1px solid #16354a;border-radius:24px;background:linear-gradient(125deg,#08131d,#05080d);display:grid;grid-template-columns:1.4fr .7fr;align-items:center;overflow:hidden}.hero small,.mux small,.ownerVault small{font-size:9px;letter-spacing:.2em;color:#e5b85b;font-weight:900}.hero h1{font-size:clamp(38px,6vw,68px);line-height:.98;margin:10px 0}.hero p,.mux p,.ownerVault p{max-width:760px;color:#8aa3b5;line-height:1.6}.heroLinks{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.heroLinks a{border:1px solid #24485e;border-radius:999px;padding:8px 11px;color:#b6eaff;text-decoration:none;font-size:10px}.network{height:245px;position:relative}.core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:78px;height:78px;border-radius:50%;display:grid;place-items:center;border:1px solid #e0a53a;color:#ffd47a;font:900 32px Georgia;box-shadow:0 0 40px rgba(255,178,50,.15)}.network:before,.network:after{content:'';position:absolute;inset:30px;border:1px solid #174a63;border-radius:50%}.network:after{inset:65px;border-color:#5c4525}.network span{position:absolute;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;border:1px solid #1e536e;background:#06111a;color:#70dfff;font-size:8px}.n0{left:8%;top:20%}.n1{right:4%;top:30%}.n2{left:16%;bottom:7%}.n3{right:13%;bottom:5%}.n4{left:48%;top:0}.n5{left:46%;bottom:-2%}.ownerVault{max-width:1380px;margin:14px auto;padding:22px;border:1px solid #6a5124;border-radius:20px;background:linear-gradient(135deg,#110d07,#071019);box-shadow:0 0 35px rgba(219,166,64,.06)}.vaultTop{display:flex;align-items:center;justify-content:space-between;gap:24px}.vaultTop h2{font-size:30px;margin:5px 0}.vaultTop p{margin:5px 0}.vaultToggle{white-space:nowrap;padding:12px 16px;border-radius:10px;border:1px solid #9a732f;background:#33240d;color:#ffd681;font-weight:900;cursor:pointer}.vaultStats{display:flex;gap:10px;margin-top:14px}.vaultStats span{padding:9px 12px;border:1px solid #3f3420;border-radius:999px;color:#9f9a88;font-size:10px}.vaultStats b{color:#ffd279}.vaultNotice{margin-top:12px;padding:11px;border:1px solid #315f55;border-radius:10px;background:#09201c;color:#9ae6cc}.vaultGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}.vaultGrid article{padding:17px;border:1px solid #46391e;border-radius:15px;background:#080d12}.vaultGrid article.vaultReady{border-color:#285743}.vaultHead{display:flex;justify-content:space-between;align-items:start;gap:10px}.vaultHead h3{font-size:20px;margin:4px 0}.vaultHead>span{font-size:8px;color:#c59647}.vaultReady .vaultHead>span{color:#75e5a6}.vaultFields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.vaultFields label span{display:block;color:#a9bdc8;font-size:9px;margin-bottom:5px}.vaultFields input{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #2a4350;background:#03080c;color:#eaf8ff}.vaultFields em{display:block;margin-top:4px;font-size:8px;font-style:normal}.vaultFields em.set{color:#75e5a6}.vaultFields em.missing{color:#c48961}.callbacks{margin-top:12px;padding:10px;border:1px solid #263743;border-radius:9px;background:#04090d}.callbacks b{display:block;font-size:8px;color:#dbaf5b;margin-bottom:6px}.callbacks code{display:block;white-space:normal;overflow-wrap:anywhere;color:#76cbe6;font-size:8px;margin:4px 0}.vaultActions{display:flex;gap:8px;margin-top:11px}.vaultActions button{flex:1;padding:10px;border:1px solid #826128;border-radius:8px;background:#30230d;color:#ffd57c;font-size:9px;font-weight:900;cursor:pointer}.vaultActions .remove{border-color:#583038;background:#1b1012;color:#df929c}.error{max-width:1380px;margin:10px auto;padding:12px;border:1px solid #6b3037;background:#220d12;color:#ffb9c1;border-radius:10px}.summary{max-width:1380px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.summary div{padding:17px;border:1px solid #172c3b;border-radius:14px;background:#071019}.summary b{font-size:27px;color:#68ddff}.summary span{display:block;color:#607989;font-size:10px}.grid{max-width:1380px;margin:12px auto;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.loading{grid-column:1/-1;padding:24px;border:1px solid #172e3d;border-radius:16px;color:#728b9b}.grid article{border:1px solid #172e3d;border-radius:16px;background:#071018;padding:18px}.grid article.on{border-color:#275942}.cardHead{display:grid;grid-template-columns:48px 1fr auto;gap:11px;align-items:center}.icon{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:#0c1d29;border:1px solid #1f4a62;color:#6de0ff;font-size:20px}.cardHead small{font-size:8px;letter-spacing:.15em;color:#688295}.cardHead h2{font-size:18px;margin:3px 0}.cardHead>span{font-size:8px;color:#6e8a9b}.on .cardHead>span{color:#75e5a6}.accounts{padding:10px 0;color:#9fc9b2;font-size:10px}.grid input{width:100%;box-sizing:border-box;margin-top:11px;padding:11px;border-radius:9px;border:1px solid #1e4053;background:#040a0f;color:#eaf8ff}.grid button{width:100%;margin-top:10px;padding:11px;border:1px solid #285c76;border-radius:9px;background:#12384b;color:#d9f5ff;font-size:10px;font-weight:900;cursor:pointer}.grid button:disabled{opacity:.45;cursor:not-allowed}.setupHelp{color:#7f96a5;font-size:9px;line-height:1.5;margin:8px 2px 0}.grid .disconnect{background:#1b1012;border-color:#4f292f;color:#d8949c}.mux{max-width:1380px;margin:12px auto;border:1px solid #4c3b20;border-radius:18px;padding:22px;background:linear-gradient(90deg,#0b0e12,#161006);display:flex;justify-content:space-between;align-items:center;gap:20px}.mux h2{margin:5px 0}.mux a{white-space:nowrap;border:1px solid #87632a;border-radius:9px;padding:12px;color:#ffd481;text-decoration:none;font-size:10px;font-weight:900}footer{max-width:1380px;margin:16px auto;color:#607989;font-size:9px;letter-spacing:.08em}footer b{color:#9ab2c2;margin-right:10px}@media(max-width:800px){.connect{padding:18px 14px}.hero,.grid,.summary,.vaultGrid{grid-template-columns:1fr}.network{display:none}.mux,.vaultTop{display:block}.mux a,.vaultToggle{display:inline-block;margin-top:10px}.vaultFields{grid-template-columns:1fr}.vaultStats{flex-wrap:wrap}.cardHead{grid-template-columns:44px 1fr}.cardHead>span{grid-column:2}}
  `}</style>
 </main>
}
