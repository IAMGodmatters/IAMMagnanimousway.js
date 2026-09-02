'use client';
import {useEffect,useMemo,useState} from 'react';

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
type Conn={external_account_id:string;display_name:string;token_expires_at:number|null};
type Perm={can_read:boolean;can_write:boolean;require_confirmation:boolean};
type Provider={id:string;name:string;category:string;capabilities:string[];permission:Perm;connections:Conn[]};
type Tier={id:string;name:string;owner_approval_required:boolean;features:string[]};
type ActionRow={id:string;provider:string;external_account_id:string;action:string;status:string;error_text:string;created_at:number};
const labels:Record<string,string>={read_profile:'Read profile',read_engagement:'Read engagement',publish_post:'Publish post',publish_media:'Publish media',send_message:'Send message',read_products:'Read products',read_orders:'Read orders',read_customers:'Read customers',read_ad_accounts:'Read ad accounts'};
const supported=new Set(Object.keys(labels));
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||`Request failed (${r.status})`}}}
function extractJson(text:string){const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a<0||b<a)throw new Error('AI could not interpret that command.');return JSON.parse(text.slice(a,b+1))}

export default function ConnectedAssistant(){
  const[providers,setProviders]=useState<Provider[]>([]),[actions,setActions]=useState<ActionRow[]>([]),[tier,setTier]=useState<Tier|null>(null),[provider,setProvider]=useState(''),[account,setAccount]=useState(''),[action,setAction]=useState(''),[text,setText]=useState(''),[imageUrl,setImageUrl]=useState(''),[caption,setCaption]=useState(''),[to,setTo]=useState(''),[phoneId,setPhoneId]=useState(''),[command,setCommand]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
  function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
  function headers(json=false){const h:any={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}

  async function load(){
    try{
      const[c,a]=await Promise.all([fetch(`${api}/api/assistant-integrations/context`,{headers:headers(),cache:'no-store'}),fetch(`${api}/api/assistant-integrations/actions`,{headers:headers(),cache:'no-store'})]);
      if(c.status===401){location.replace('/login');return}
      const cd=await read(c),ad=await read(a);if(!c.ok)throw new Error(cd.error||'Unable to load connected accounts.');
      setProviders(cd.providers||[]);setTier(cd.tier||null);setActions(ad.actions||[]);
      const first=(cd.providers||[]).find((p:Provider)=>p.connections?.length&&p.capabilities?.some(x=>supported.has(x)));
      if(first&&!provider){setProvider(first.id);setAccount(first.connections[0]?.external_account_id||'');setAction(first.capabilities.find((x:string)=>supported.has(x))||'')}
    }catch(e:any){setMessage(e?.message||'Unable to load assistant connections.')}
  }
  useEffect(()=>{if(!token()){location.replace('/login');return}load()},[]);

  const current=useMemo(()=>providers.find(p=>p.id===provider),[providers,provider]);
  const caps=(current?.capabilities||[]).filter(x=>supported.has(x));
  function chooseProvider(id:string){const p=providers.find(x=>x.id===id);setProvider(id);setAccount(p?.connections?.[0]?.external_account_id||'');setAction(p?.capabilities?.find(x=>supported.has(x))||'');setMessage('')}

  async function savePerm(id:string,patch:Partial<Perm>){
    const p=providers.find(x=>x.id===id);if(!p)return;setBusy(`perm-${id}`);
    try{
      const next={...p.permission,...patch,require_confirmation:false};
      const r=await fetch(`${api}/api/assistant-integrations/permissions/${id}`,{method:'PUT',headers:headers(true),body:JSON.stringify(next)}),d=await read(r);if(!r.ok)throw new Error(d.error||'Unable to update AI permissions.');
      setProviders(v=>v.map(x=>x.id===id?{...x,permission:{...d.permission,require_confirmation:false}}:x));
      setMessage('Your AI permission was updated. No platform-owner approval is required.');
    }catch(e:any){setMessage(e?.message||'Unable to update permission.')}finally{setBusy('')}
  }

  function payload(){if(action==='publish_post')return{text};if(action==='publish_media')return{image_url:imageUrl,caption};if(action==='send_message')return{to,text,phone_number_id:phoneId};return{}}
  async function executeAction(nextAction:string,nextPayload:any){
    if(!provider||!current)return;
    const r=await fetch(`${api}/api/assistant-integrations/actions`,{method:'POST',headers:headers(true),body:JSON.stringify({provider,external_account_id:account,action:nextAction,payload:nextPayload})}),d=await read(r);
    if(!r.ok)throw new Error(d.error||'Assistant action failed.');
    setMessage('AI action completed using the permissions you granted.');await load();
  }
  async function run(){if(!provider||!action)return;setBusy('run');setMessage('');try{await executeAction(action,payload())}catch(e:any){setMessage(e?.message||'Assistant action failed.')}finally{setBusy('')}}
  async function runCommand(){
    if(!current||!account||!command.trim())return;setBusy('command');setMessage('AI is interpreting your command…');
    try{
      const allowed=caps.join(', ');
      const prompt=`You are an action router for a business virtual assistant. The selected provider is ${current.name}. Allowed actions are only: ${allowed}. Interpret the user's explicit command and return ONLY valid JSON with this shape: {"action":"one_allowed_action","payload":{}}. For publish_post use payload.text. For publish_media use payload.image_url and payload.caption. For send_message use payload.to, payload.text and optional payload.phone_number_id. For read actions use an empty payload. Never invent an action outside the allowed list. User command: ${command}`;
      const r=await fetch(`${api}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:prompt})}),d=await read(r);if(!r.ok)throw new Error(d.detail||d.error||'AI could not interpret the command.');
      const parsed=extractJson(String(d.output||''));if(!supported.has(parsed.action)||!caps.includes(parsed.action))throw new Error(`That command is not available for ${current.name}.`);
      await executeAction(parsed.action,parsed.payload||{});
    }catch(e:any){setMessage(e?.message||'Unable to execute connected-account command.')}finally{setBusy('')}
  }

  const connected=providers.filter(p=>p.connections.length>0);
  return <main className="hub">
    <header><a href="/connections">← Connections</a><span>SELF-SERVICE CONNECTED ASSISTANT</span></header>

    <section className="hero"><div><small>YOUR ACCOUNT • YOUR AUTHORIZATION • AUTOMATIC ACCESS</small><h1>Your assistant acts inside the permissions you grant.</h1><p>There is no platform-owner approval queue. You authorize the provider once, choose whether AI may read or write, and then explicit commands can execute immediately. Your subscription tier is applied automatically.</p><div className="links"><a href="/connections">CONNECT ACCOUNTS</a><a href="/business-email">BUSINESS EMAIL</a><a href="/pricing">VIEW TIERS</a></div></div><div className="tier"><small>CURRENT TIER</small><b>{tier?.name||'Free'}</b><span>NO OWNER APPROVAL</span></div></section>

    {message&&<div className="notice">{message}</div>}

    <section className="command"><div><small>NATURAL-LANGUAGE COMMAND</small><h2>Tell your assistant what to do.</h2><p>Examples: “Post our sale announcement to Facebook,” “Send this customer a WhatsApp message,” or “Read my latest Shopify orders.” If the provider and your permission allow it, the action runs immediately.</p></div><textarea value={command} onChange={e=>setCommand(e.target.value)} placeholder="Tell your AI exactly what to do on the selected connected account…"/><button disabled={!current||!account||!command.trim()||busy==='command'} onClick={runCommand}>{busy==='command'?'AI IS WORKING…':'EXECUTE COMMAND →'}</button></section>

    <section className="layout">
      <aside className="providers"><small>CONNECTED CHANNELS</small>{connected.length===0?<p>No accounts connected yet. Open Connections first.</p>:connected.map(p=><button key={p.id} className={provider===p.id?'active':''} onClick={()=>chooseProvider(p.id)}><b>{p.name}</b><span>{p.connections.length} account{p.connections.length===1?'':'s'}</span></button>)}</aside>

      <section className="work"><div className="workHead"><div><small>SELECTED ACCOUNT</small><h2>{current?.name||'Choose a connected channel'}</h2></div><span>{current?.connections?.length?'● READY':'NOT CONNECTED'}</span></div>{current&&<><label>Connected account<select value={account} onChange={e=>setAccount(e.target.value)}>{current.connections.map(c=><option value={c.external_account_id} key={c.external_account_id}>{c.display_name||c.external_account_id}</option>)}</select></label><label>Manual action<select value={action} onChange={e=>setAction(e.target.value)}>{caps.map(c=><option value={c} key={c}>{labels[c]||c}</option>)}</select></label>{action==='publish_post'&&<label>Post text<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Post text…"/></label>}{action==='publish_media'&&<><label>Public media URL<input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://…"/></label><label>Caption<textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption…"/></label></>}{action==='send_message'&&<><div className="two"><label>Recipient<input value={to} onChange={e=>setTo(e.target.value)} placeholder="Country code + number"/></label><label>WhatsApp phone number ID<input value={phoneId} onChange={e=>setPhoneId(e.target.value)} placeholder="Optional if saved with connection"/></label></div><label>Message<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Message…"/></label></>}<button className="run" disabled={busy==='run'} onClick={run}>{busy==='run'?'WORKING…':action.startsWith('read_')?'RUN SECURE READ →':'EXECUTE NOW →'}</button></>}</section>

      <aside className="perm"><small>MY AI PERMISSIONS</small>{current?<><h3>{current.name}</h3><Toggle title="Allow AI to read connected data" on={current.permission.can_read} disabled={busy===`perm-${current.id}`} onClick={()=>savePerm(current.id,{can_read:!current.permission.can_read})}/><Toggle title="Allow AI to post / send / write" on={current.permission.can_write} disabled={busy===`perm-${current.id}`} onClick={()=>savePerm(current.id,{can_write:!current.permission.can_write})}/><div className="auto"><b>AUTOMATION ACTIVE</b><span>Explicit commands execute without owner approval.</span></div><p>You can disable read or write permission at any time. The provider’s own authorization and platform rules still apply.</p><div className="caps"><b>AVAILABLE</b>{caps.map(c=><span key={c}>{labels[c]}</span>)}</div></>:<p>Choose a provider.</p>}</aside>
    </section>

    <section className="tierbox"><div><small>AUTOMATIC TIER ACCESS</small><h2>{tier?.name||'Free'} access is applied by the system.</h2><p>Free users receive the features assigned to Free. Paid subscribers receive Full Business features automatically from the billing state. You do not need the platform owner to activate either tier manually.</p></div><a href="/pricing">COMPARE TIERS →</a></section>

    <section className="log"><div className="logHead"><div><small>AUDIT LOG</small><h2>Recent assistant actions</h2></div><button onClick={load}>Refresh</button></div>{actions.length===0?<div className="empty">No connected-account actions yet.</div>:actions.map(a=><article key={a.id}><div><b>{providers.find(p=>p.id===a.provider)?.name||a.provider}</b><span>{labels[a.action]||a.action}</span></div><div className={`status ${a.status}`}>{a.status.replaceAll('_',' ')}</div>{a.error_text&&<p>{a.error_text}</p>}</article>)}</section>

    <style jsx>{`
      .hub{min-height:100vh;background:#040910;color:#eaf8ff;padding:24px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 82% 12%,rgba(0,201,255,.14),transparent 28%),radial-gradient(circle at 14% 82%,rgba(255,177,48,.07),transparent 30%)}header{max-width:1400px;margin:auto;display:flex;justify-content:space-between;color:#648093;font-size:9px;letter-spacing:.18em}header a{color:#9be8ff;text-decoration:none}.hero{max-width:1400px;margin:25px auto 12px;padding:36px;border:1px solid #18394d;border-radius:24px;background:linear-gradient(120deg,#07131e,#05080d);display:grid;grid-template-columns:1.4fr .45fr;align-items:center;gap:20px}.hero small,.layout small,.log small,.command small,.tierbox small{font-size:9px;letter-spacing:.19em;color:#65dcff;font-weight:900}.hero h1{font-size:clamp(38px,6vw,67px);line-height:.98;margin:10px 0}.hero p,.tierbox p{max-width:850px;color:#8fa7b9;line-height:1.6}.links{display:flex;gap:8px;flex-wrap:wrap}.links a{border:1px solid #244a61;border-radius:999px;padding:8px 11px;color:#bcecff;text-decoration:none;font-size:9px}.tier{justify-self:center;width:190px;height:190px;border-radius:50%;border:1px solid #a9782c;display:grid;place-items:center;align-content:center;background:radial-gradient(circle,#2a2111,#050a0e 67%);text-align:center}.tier small{color:#d7a855}.tier b{font-size:28px;color:#ffd06c}.tier span{font-size:8px;color:#8ee6ae;letter-spacing:.12em}.notice{max-width:1400px;margin:0 auto 10px;padding:12px;border:1px solid #285267;border-radius:10px;background:#081721;color:#bdeaff}.command{max-width:1400px;margin:0 auto 10px;border:1px solid #5a4523;border-radius:17px;background:linear-gradient(120deg,#0d0d09,#071019);padding:20px}.command h2{font-size:28px;margin:5px 0}.command p{color:#7f98a9;line-height:1.5}.command textarea{width:100%;min-height:110px;box-sizing:border-box;border:1px solid #28485a;border-radius:11px;background:#03090e;color:#effbff;padding:13px;font:inherit}.command button{margin-top:9px;border:0;border-radius:9px;padding:12px 15px;background:linear-gradient(90deg,#1a91bc,#b37a28);color:white;font-weight:900;cursor:pointer}.layout{max-width:1400px;margin:auto;display:grid;grid-template-columns:240px 1fr 290px;gap:10px}.layout>aside,.work{border:1px solid #173244;border-radius:16px;background:#071019;padding:18px}.providers button{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#8aa0af;padding:11px;border-radius:9px;margin-top:6px;cursor:pointer}.providers button.active{background:#10283a;border-color:#24516a;color:#e4f8ff}.providers b,.providers span{display:block}.providers span{font-size:9px;color:#5e7889;margin-top:3px}.providers p,.perm p{color:#6d8494;font-size:11px;line-height:1.5}.workHead{display:flex;justify-content:space-between;align-items:center}.workHead h2{margin:4px 0 14px}.workHead span{font-size:9px;color:#7bdfa5}.work label{display:block;color:#819aaa;font-size:10px;margin:10px 0}.work select,.work input,.work textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;background:#03090e;border:1px solid #214356;border-radius:9px;color:#e9f8ff;padding:11px}.work textarea{min-height:90px}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.run{width:100%;border:0;border-radius:9px;padding:12px;background:linear-gradient(90deg,#178eb9,#ad7626);color:white;font-weight:900;cursor:pointer}.perm h3{font-size:20px}.auto{border:1px solid #4f4125;border-radius:10px;background:#151108;padding:12px;margin:10px 0}.auto b,.auto span{display:block}.auto b{color:#ffd16d;font-size:10px}.auto span{color:#9eb1bd;font-size:9px;margin-top:4px}.caps{border-top:1px solid #183246;margin-top:12px;padding-top:10px}.caps b,.caps span{display:block}.caps b{font-size:8px;color:#c39a52;margin-bottom:5px}.caps span{font-size:9px;color:#6e8797;padding:2px 0}.tierbox{max-width:1400px;margin:10px auto;border:1px solid #493c23;border-radius:16px;background:linear-gradient(120deg,#100f0a,#071019);padding:22px;display:flex;align-items:center;justify-content:space-between;gap:20px}.tierbox h2{margin:5px 0}.tierbox a{white-space:nowrap;color:#ffd27a;text-decoration:none;border:1px solid #665128;border-radius:9px;padding:11px 13px;font-size:9px}.log{max-width:1400px;margin:10px auto;border:1px solid #173244;border-radius:16px;background:#071019;padding:18px}.logHead{display:flex;justify-content:space-between;align-items:center}.logHead h2{margin:4px 0 12px}.logHead button{border:1px solid #21475c;background:transparent;color:#9de8ff;border-radius:8px;padding:8px 10px}.log article{display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #142d3e;padding:10px 0}.log article b,.log article span{display:block}.log article span{font-size:9px;color:#6f8797;margin-top:3px}.status{font-size:9px;text-transform:uppercase;color:#8ddfa9}.status.failed{color:#ff9da8}.empty{color:#6e8797;padding:20px 0}@media(max-width:1000px){.hub{padding:18px 14px}.hero{grid-template-columns:1fr}.tier{display:none}.layout{grid-template-columns:1fr}.tierbox{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.two{grid-template-columns:1fr}.tierbox a{white-space:normal}}
    `}</style>
  </main>
}

function Toggle({title,on,onClick,disabled}:{title:string;on:boolean;onClick:()=>void;disabled:boolean}){return <button className={`toggle ${on?'on':''}`} onClick={onClick} disabled={disabled}><span><b>{title}</b><em>{on?'ENABLED':'DISABLED'}</em></span><i>{on?'●':'○'}</i><style jsx>{`.toggle{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;background:#050c12;border:1px solid #193649;color:#8ba1b0;border-radius:9px;padding:11px;margin:7px 0;cursor:pointer}.toggle.on{border-color:#285844;color:#dfffee}.toggle span b,.toggle span em{display:block}.toggle span b{font-size:10px}.toggle span em{font-style:normal;font-size:8px;color:#607788;margin-top:3px}.toggle.on span em,.toggle.on i{color:#7ee2a3}.toggle i{font-style:normal}`}</style></button>}
