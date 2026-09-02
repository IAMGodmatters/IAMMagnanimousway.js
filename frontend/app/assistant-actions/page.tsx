'use client';
import {useEffect,useMemo,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Conn={external_account_id:string;display_name:string;token_expires_at:number|null};
type Perm={can_read:boolean;can_write:boolean;require_confirmation:boolean};
type Provider={id:string;name:string;category:string;capabilities:string[];permission:Perm;connections:Conn[]};
type Tier={id:string;name:string;owner_approval_required:boolean;features:string[]};
type ActionRow={id:string;provider:string;external_account_id:string;action:string;status:string;error_text:string;created_at:number};
type MailMessage={id?:string;from?:string;to?:string|string[];subject?:string;date?:string;snippet?:string;is_read?:boolean;web_link?:string};

const labels:Record<string,string>={
 read_profile:'Read profile',read_engagement:'Read engagement',publish_post:'Publish post',publish_media:'Publish media',send_message:'Send message',
 read_products:'Read products',read_orders:'Read orders',read_customers:'Read customers',read_ad_accounts:'Read ad accounts',
 read_mail:'Read recent email',send_mail:'Send email'
};
const supported=new Set(Object.keys(labels));

async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||`Request failed (${r.status})`}}}
function extractJson(text:string){const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a<0||b<a)throw new Error('AI could not interpret that command.');return JSON.parse(text.slice(a,b+1))}

export default function ConnectedAssistant(){
 const[providers,setProviders]=useState<Provider[]>([]),[actions,setActions]=useState<ActionRow[]>([]),[tier,setTier]=useState<Tier|null>(null);
 const[provider,setProvider]=useState(''),[account,setAccount]=useState(''),[action,setAction]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const[text,setText]=useState(''),[imageUrl,setImageUrl]=useState(''),[caption,setCaption]=useState(''),[to,setTo]=useState(''),[phoneId,setPhoneId]=useState('');
 const[emailTo,setEmailTo]=useState(''),[emailCc,setEmailCc]=useState(''),[emailSubject,setEmailSubject]=useState(''),[emailBody,setEmailBody]=useState(''),[mailQuery,setMailQuery]=useState('in:inbox');
 const[command,setCommand]=useState(''),[result,setResult]=useState<any>(null),[focus,setFocus]=useState('');

 function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
 function headers(json=false){const h:any={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}

 async function load(preferredFocus=focus){
  try{
   const[c,a]=await Promise.all([
    fetch(`${api}/api/assistant-integrations/context`,{headers:headers(),cache:'no-store'}),
    fetch(`${api}/api/assistant-integrations/actions`,{headers:headers(),cache:'no-store'})
   ]);
   if(c.status===401){location.replace('/login');return}
   const cd=await read(c),ad=await read(a);if(!c.ok)throw new Error(cd.error||'Unable to load connected accounts.');
   const nextProviders:Provider[]=cd.providers||[];setProviders(nextProviders);setTier(cd.tier||null);setActions(ad.actions||[]);
   const usable=(p:Provider)=>p.connections?.length&&p.capabilities?.some(x=>supported.has(x));
   const first=(preferredFocus==='email'?nextProviders.find(p=>p.category==='email'&&usable(p)):null)||nextProviders.find(usable);
   if(first&&!provider){setProvider(first.id);setAccount(first.connections[0]?.external_account_id||'');setAction(first.capabilities.find(x=>supported.has(x))||'')}
  }catch(e:any){setMessage(e?.message||'Unable to load assistant connections.')}
 }

 useEffect(()=>{
  if(!token()){location.replace('/login');return}
  const q=new URLSearchParams(location.search),f=q.get('focus')||'';setFocus(f);load(f);
 },[]);

 const current=useMemo(()=>providers.find(p=>p.id===provider),[providers,provider]);
 const caps=(current?.capabilities||[]).filter(x=>supported.has(x));
 const connected=providers.filter(p=>p.connections.length>0&&p.capabilities.some(x=>supported.has(x)));
 const emailConnected=providers.filter(p=>p.category==='email'&&p.connections.length>0);

 function chooseProvider(id:string){
  const p=providers.find(x=>x.id===id);setProvider(id);setAccount(p?.connections?.[0]?.external_account_id||'');
  setAction(p?.capabilities?.find(x=>supported.has(x))||'');setMessage('');setResult(null);
 }

 async function savePerm(id:string,patch:Partial<Perm>){
  const p=providers.find(x=>x.id===id);if(!p)return;setBusy(`perm-${id}`);
  try{
   const next={...p.permission,...patch,require_confirmation:false};
   const r=await fetch(`${api}/api/assistant-integrations/permissions/${id}`,{method:'PUT',headers:headers(true),body:JSON.stringify(next)}),d=await read(r);
   if(!r.ok)throw new Error(d.error||'Unable to update AI permissions.');
   setProviders(v=>v.map(x=>x.id===id?{...x,permission:{...d.permission,require_confirmation:false}}:x));
   setMessage('Your AI permission was updated. No platform-owner approval is required.');
  }catch(e:any){setMessage(e?.message||'Unable to update permission.')}finally{setBusy('')}
 }

 function actionPayload(){
  if(action==='publish_post')return{text};
  if(action==='publish_media')return{image_url:imageUrl,caption};
  if(action==='send_message')return{to,text,phone_number_id:phoneId};
  if(action==='read_mail')return{query:mailQuery||'in:inbox',limit:10};
  if(action==='send_mail')return{to:emailTo,cc:emailCc,subject:emailSubject,body:emailBody};
  return{};
 }

 async function executeAction(nextAction:string,nextPayload:any){
  if(!provider||!current)throw new Error('Choose a connected account first.');
  const r=await fetch(`${api}/api/assistant-integrations/actions`,{method:'POST',headers:headers(true),body:JSON.stringify({provider,external_account_id:account,action:nextAction,payload:nextPayload})}),d=await read(r);
  if(!r.ok)throw new Error(d.error||'Assistant action failed.');
  setResult(d.result||null);
  setMessage(nextAction==='send_mail'?'Email sent through your connected mailbox.':nextAction==='read_mail'?'Mailbox read completed securely.':'AI action completed using the permissions you granted.');
  await load();
  return d;
 }

 async function run(){
  if(!provider||!action)return;setBusy('run');setMessage('');setResult(null);
  try{await executeAction(action,actionPayload())}catch(e:any){setMessage(e?.message||'Assistant action failed.')}finally{setBusy('')}
 }

 async function runCommand(){
  if(!current||!account||!command.trim())return;setBusy('command');setMessage('AI is interpreting your command…');setResult(null);
  try{
   const allowed=caps.join(', ');
   const prompt=`You are an action router for a business virtual assistant. The selected provider is ${current.name}. Allowed actions are only: ${allowed}. Return ONLY valid JSON shaped {"action":"one_allowed_action","payload":{}}. For publish_post use payload.text. For publish_media use payload.image_url and payload.caption. For send_message use payload.to, payload.text and optional payload.phone_number_id. For read_mail use optional payload.query and payload.limit. For send_mail use payload.to, optional payload.cc, payload.subject and payload.body. For other read actions use an empty payload. Never invent an action outside the allowed list. User command: ${command}`;
   const r=await fetch(`${api}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:prompt})}),d=await read(r);
   if(!r.ok)throw new Error(d.detail||d.error||'AI could not interpret the command.');
   const parsed=extractJson(String(d.output||''));if(!supported.has(parsed.action)||!caps.includes(parsed.action))throw new Error(`That command is not available for ${current.name}.`);
   await executeAction(parsed.action,parsed.payload||{});
  }catch(e:any){setMessage(e?.message||'Unable to execute connected-account command.')}finally{setBusy('')}
 }

 return <main className="hub">
  <header><a href="/connections">← Connections</a><span>{focus==='email'?'EMAIL AI ASSISTANT':'SELF-SERVICE CONNECTED ASSISTANT'}</span></header>

  <section className="hero"><div><small>YOUR ACCOUNT • YOUR AUTHORIZATION • AUTOMATIC ACCESS</small><h1>{focus==='email'?'Read and send business email with your I AM assistant.':'Your assistant acts inside the permissions you grant.'}</h1><p>Connect an account through its official provider authorization, then decide whether AI may read or write. Explicit commands execute inside those permissions without a platform-owner approval queue.</p><div className="links"><a href="/connections">CONNECT ACCOUNTS</a><a href="/business-email">BUSINESS EMAIL</a><a href="/pricing">VIEW TIERS</a></div></div><div className="tier"><small>CURRENT TIER</small><b>{tier?.name||'Free'}</b><span>NO OWNER APPROVAL</span></div></section>

  {focus==='email'&&emailConnected.length===0&&<section className="emailStart"><div><small>EMAIL CONNECTION REQUIRED</small><h2>Connect Gmail or Outlook first.</h2><p>I AM uses the provider’s official OAuth screen. Your password is never entered into I AM.</p></div><a href="/connections?category=email&source=assistant">CONNECT EMAIL →</a></section>}
  {message&&<div className="notice">{message}</div>}

  <section className="command"><div><small>NATURAL-LANGUAGE COMMAND</small><h2>Tell your assistant what to do.</h2><p>Examples: “Read my latest Gmail messages,” “Send an email to customer@example.com with the subject Follow-up,” “Post our sale announcement to Facebook,” or “Read my latest Shopify orders.”</p></div><textarea value={command} onChange={e=>setCommand(e.target.value)} placeholder="Tell your AI exactly what to do on the selected connected account…"/><button disabled={!current||!account||!command.trim()||busy==='command'} onClick={runCommand}>{busy==='command'?'AI IS WORKING…':'EXECUTE COMMAND →'}</button></section>

  <section className="layout">
   <aside className="providers"><small>CONNECTED CHANNELS</small>{connected.length===0?<p>No supported accounts connected yet. Open Connections first.</p>:connected.map(p=><button key={p.id} className={provider===p.id?'active':''} onClick={()=>chooseProvider(p.id)}><b>{p.name}</b><span>{p.connections.length} account{p.connections.length===1?'':'s'}</span></button>)}</aside>

   <section className="work"><div className="workHead"><div><small>SELECTED ACCOUNT</small><h2>{current?.name||'Choose a connected channel'}</h2></div><span>{current?.connections?.length?'● READY':'NOT CONNECTED'}</span></div>
    {current&&<>
     <label>Connected account<select value={account} onChange={e=>setAccount(e.target.value)}>{current.connections.map(c=><option value={c.external_account_id} key={c.external_account_id}>{c.display_name||c.external_account_id}</option>)}</select></label>
     <label>Manual action<select value={action} onChange={e=>{setAction(e.target.value);setResult(null)}}>{caps.map(c=><option value={c} key={c}>{labels[c]||c}</option>)}</select></label>
     {action==='publish_post'&&<label>Post text<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Post text…"/></label>}
     {action==='publish_media'&&<><label>Public media URL<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://…"/></label><label>Caption<textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption…"/></label></>}
     {action==='send_message'&&<><div className="two"><label>Recipient<input value={to} onChange={e=>setTo(e.target.value)} placeholder="Country code + number"/></label><label>WhatsApp phone number ID<input value={phoneId} onChange={e=>setPhoneId(e.target.value)} placeholder="Optional if saved with connection"/></label></div><label>Message<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Message…"/></label></>}
     {action==='read_mail'&&<label>Mailbox search<input value={mailQuery} onChange={e=>setMailQuery(e.target.value)} placeholder="in:inbox or from:customer@example.com"/><span className="hint">Gmail supports Gmail search syntax. Outlook returns the most recent messages.</span></label>}
     {action==='send_mail'&&<><div className="two"><label>To<input type="email" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="customer@example.com"/></label><label>Cc (optional)<input value={emailCc} onChange={e=>setEmailCc(e.target.value)} placeholder="team@example.com"/></label></div><label>Subject<input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} placeholder="Follow-up"/></label><label>Email message<textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)} placeholder="Write the email you want sent…"/></label></>}
     <button className="run" disabled={busy==='run'} onClick={run}>{busy==='run'?'WORKING…':action.startsWith('read_')?'RUN SECURE READ →':'EXECUTE NOW →'}</button>
     {result&&<ResultView result={result}/>} 
    </>}
   </section>

   <aside className="perm"><small>MY AI PERMISSIONS</small>{current?<><h3>{current.name}</h3><Toggle title="Allow AI to read connected data" on={current.permission.can_read} disabled={busy===`perm-${current.id}`} onClick={()=>savePerm(current.id,{can_read:!current.permission.can_read})}/><Toggle title="Allow AI to post / send / write" on={current.permission.can_write} disabled={busy===`perm-${current.id}`} onClick={()=>savePerm(current.id,{can_write:!current.permission.can_write})}/><div className="auto"><b>AUTOMATION ACTIVE</b><span>Explicit commands execute without owner approval.</span></div><p>You can disable read or write permission at any time. The provider’s own authorization and platform rules still apply.</p><div className="caps"><b>AVAILABLE</b>{caps.map(c=><span key={c}>{labels[c]}</span>)}</div></>:<p>Choose a provider.</p>}</aside>
  </section>

  <section className="tierbox"><div><small>AUTOMATIC TIER ACCESS</small><h2>{tier?.name||'Free'} access is applied by the system.</h2><p>Free users receive the features assigned to Free. Paid subscribers receive Full Business features automatically from the billing state. The platform owner does not manually activate each account.</p></div><a href="/pricing">COMPARE TIERS →</a></section>

  <section className="log"><div className="logHead"><div><small>AUDIT LOG</small><h2>Recent assistant actions</h2></div><button onClick={()=>load()}>Refresh</button></div>{actions.length===0?<div className="empty">No connected-account actions yet.</div>:actions.map(a=><article key={a.id}><div><b>{providers.find(p=>p.id===a.provider)?.name||a.provider}</b><span>{labels[a.action]||a.action}</span></div><div className={`status ${a.status}`}>{a.status.replaceAll('_',' ')}</div>{a.error_text&&<p>{a.error_text}</p>}</article>)}</section>

  <footer>Official OAuth • encrypted provider tokens • automatic token refresh for connected Gmail/Outlook • tenant isolation • user-controlled read/write access</footer>

  <style jsx>{`
   *{box-sizing:border-box}.hub{min-height:100vh;background:#040910;color:#eaf8ff;padding:24px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 12%,rgba(0,201,255,.14),transparent 28%),radial-gradient(circle at 14% 82%,rgba(255,177,48,.07),transparent 30%)}header{max-width:1400px;margin:auto;display:flex;justify-content:space-between;color:#648093;font-size:9px;letter-spacing:.18em}header a{color:#9be8ff;text-decoration:none}.hero{max-width:1400px;margin:25px auto 12px;padding:36px;border:1px solid #18394d;border-radius:24px;background:linear-gradient(120deg,#07131e,#05080d);display:grid;grid-template-columns:1.4fr .45fr;align-items:center;gap:20px}.hero small,.layout small,.log small,.command small,.tierbox small,.emailStart small{font-size:9px;letter-spacing:.19em;color:#65dcff;font-weight:900}.hero h1{font-size:clamp(38px,6vw,67px);line-height:.98;margin:10px 0}.hero p,.tierbox p,.emailStart p{max-width:850px;color:#8fa7b9;line-height:1.6}.links{display:flex;gap:8px;flex-wrap:wrap}.links a,.emailStart a,.tierbox a{border:1px solid #244a61;border-radius:999px;padding:9px 12px;color:#bcecff;text-decoration:none;font-size:9px;font-weight:900}.tier{justify-self:center;width:190px;height:190px;border-radius:50%;border:1px solid #a9782c;display:grid;place-items:center;align-content:center;background:radial-gradient(circle,#2a2111,#050a0e 67%);text-align:center}.tier small{color:#d7a855}.tier b{font-size:28px;color:#ffd06c}.tier span{font-size:8px;color:#8ee6ae;letter-spacing:.12em}.notice,.emailStart{max-width:1400px;margin:0 auto 10px;padding:16px;border:1px solid #285267;border-radius:14px;background:#081721;color:#bdeaff}.emailStart{display:flex;justify-content:space-between;align-items:center;gap:20px;border-color:#5a4523;background:linear-gradient(120deg,#100f09,#071019)}.emailStart h2{margin:5px 0}.command{max-width:1400px;margin:0 auto 10px;border:1px solid #5a4523;border-radius:17px;background:linear-gradient(120deg,#0d0d09,#071019);padding:20px}.command h2{font-size:28px;margin:5px 0}.command p{color:#7f98a9;line-height:1.5}.command textarea{width:100%;min-height:110px;border:1px solid #28485a;border-radius:11px;background:#03090e;color:#effbff;padding:13px;font:inherit}.command button,.run{margin-top:9px;border:0;border-radius:9px;padding:12px 15px;background:linear-gradient(90deg,#1a91bc,#b37a28);color:white;font-weight:900;cursor:pointer}.command button:disabled,.run:disabled{opacity:.55;cursor:default}.layout{max-width:1400px;margin:auto;display:grid;grid-template-columns:240px 1fr 290px;gap:10px}.layout>aside,.work{border:1px solid #173244;border-radius:16px;background:#071019;padding:18px}.providers button{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#8aa0af;padding:11px;border-radius:9px;margin-top:6px;cursor:pointer}.providers button.active{background:#10283a;border-color:#24516a;color:#e4f8ff}.providers b,.providers span{display:block}.providers span{font-size:9px;color:#5e7889;margin-top:3px}.providers p,.perm p{color:#6d8494;font-size:11px;line-height:1.5}.workHead{display:flex;justify-content:space-between;align-items:center}.workHead h2{margin:4px 0 14px}.workHead span{font-size:9px;color:#7bdfa5}.work label{display:block;color:#819aaa;font-size:10px;margin:10px 0}.work select,.work input,.work textarea{display:block;width:100%;margin-top:5px;background:#03090e;border:1px solid #27495c;border-radius:9px;color:#effbff;padding:11px;font:inherit}.work textarea{min-height:110px;resize:vertical}.hint{display:block;margin-top:5px;color:#657e8f;font-size:9px}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.run{width:100%}.perm h3{font-size:20px}.auto{margin:14px 0;border:1px solid #28543d;background:#07150f;border-radius:10px;padding:11px}.auto b,.auto span{display:block}.auto b{color:#75e09d;font-size:10px}.auto span{font-size:9px;color:#719384;margin-top:4px}.caps{border-top:1px solid #183244;padding-top:10px}.caps b,.caps span{display:block}.caps b{font-size:8px;color:#6f8797;margin-bottom:5px}.caps span{font-size:9px;color:#9dc9da;padding:3px 0}.tierbox{max-width:1400px;margin:10px auto;border:1px solid #4c3b22;border-radius:16px;background:#0d0d09;padding:20px;display:flex;justify-content:space-between;gap:20px;align-items:center}.tierbox h2{margin:5px 0}.log{max-width:1400px;margin:10px auto;border:1px solid #173244;border-radius:16px;background:#071019;padding:18px}.logHead{display:flex;justify-content:space-between;align-items:center}.logHead h2{margin:4px 0}.logHead button{background:transparent;border:1px solid #24495d;color:#a9dff0;border-radius:8px;padding:8px 10px;cursor:pointer}.log article{display:grid;grid-template-columns:1fr auto;gap:10px;border-top:1px solid #122a39;padding:10px 0}.log article b,.log article span{display:block}.log article span{font-size:9px;color:#778f9f}.log article p{grid-column:1/-1;color:#e39aa2;font-size:10px}.status{font-size:8px;text-transform:uppercase;color:#79dda2}.status.failed{color:#ed929b}.empty{padding:20px;color:#6f8798}.result{margin-top:12px;border:1px solid #20506a;border-radius:12px;background:#041018;padding:13px}.resultHead{display:flex;justify-content:space-between;align-items:center}.resultHead b{font-size:11px;color:#9deaff}.mailList{display:grid;gap:7px;margin-top:9px}.mail{border:1px solid #16384b;border-radius:9px;background:#050b10;padding:10px}.mail strong{display:block;font-size:11px}.mail small{display:block;margin-top:3px;color:#809baa;letter-spacing:0;font-size:9px}.mail p{margin:7px 0 0;color:#a8bac6;font-size:10px;line-height:1.45}.mail a{color:#77ddff;font-size:9px}.rawResult{max-height:320px;overflow:auto;white-space:pre-wrap;color:#a8c2d0;font-size:10px}footer{max-width:1400px;margin:18px auto 0;border-top:1px solid #132b3b;padding-top:13px;color:#5f7889;font-size:9px}@media(max-width:1050px){.layout{grid-template-columns:1fr}.providers{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}.providers>small,.providers>p{grid-column:1/-1}.hero{grid-template-columns:1fr}.tier{display:none}}@media(max-width:650px){.hub{padding:18px 13px 60px}.hero{padding:24px 18px}.hero h1{font-size:39px}.two{grid-template-columns:1fr}.emailStart,.tierbox{display:block}.emailStart a,.tierbox a{display:inline-block;margin-top:8px}.providers{grid-template-columns:1fr}}
  `}</style>
 </main>
}

function Toggle({title,on,disabled,onClick}:{title:string;on:boolean;disabled:boolean;onClick:()=>void}){
 return <button disabled={disabled} onClick={onClick} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,border:'1px solid #1d3d50',borderRadius:10,background:'#050c12',color:'#cbeeff',padding:'11px',margin:'7px 0',cursor:'pointer'}}><span style={{fontSize:10,textAlign:'left'}}>{title}</span><b style={{color:on?'#72e49b':'#7c8890',fontSize:9}}>{on?'ON':'OFF'}</b></button>
}

function ResultView({result}:{result:any}){
 const messages:MailMessage[]=Array.isArray(result?.messages)?result.messages:[];
 return <section className="result"><div className="resultHead"><b>{messages.length?`${messages.length} EMAIL${messages.length===1?'':'S'}`:result?.sent?'EMAIL SENT':'ACTION RESULT'}</b><span>{result?.provider?String(result.provider).toUpperCase():''}</span></div>{messages.length?<div className="mailList">{messages.map((m,i)=><article className="mail" key={m.id||i}><strong>{m.subject||'(no subject)'}</strong><small>From: {m.from||'Unknown'} • {m.date||''}</small><p>{m.snippet||''}</p>{m.web_link&&<a href={m.web_link} target="_blank" rel="noreferrer">Open in provider ↗</a>}</article>)}</div>:<pre className="rawResult">{JSON.stringify(result,null,2)}</pre>}<style jsx>{`.result{margin-top:12px;border:1px solid #20506a;border-radius:12px;background:#041018;padding:13px}.resultHead{display:flex;justify-content:space-between;align-items:center}.resultHead b{font-size:11px;color:#9deaff}.resultHead span{font-size:8px;color:#668596}.mailList{display:grid;gap:7px;margin-top:9px}.mail{border:1px solid #16384b;border-radius:9px;background:#050b10;padding:10px}.mail strong{display:block;font-size:11px}.mail small{display:block;margin-top:3px;color:#809baa;font-size:9px}.mail p{margin:7px 0 0;color:#a8bac6;font-size:10px;line-height:1.45}.mail a{color:#77ddff;font-size:9px}.rawResult{max-height:320px;overflow:auto;white-space:pre-wrap;color:#a8c2d0;font-size:10px}`}</style></section>
}
