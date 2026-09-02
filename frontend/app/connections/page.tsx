'use client';
import {useEffect,useMemo,useState} from 'react';

type Connected={external_account_id:string;display_name:string;token_expires_at:number|null};
type Integration={id:string;name:string;category:string;auth:string;configured:boolean;connected:Connected[]};

const api=process.env.NEXT_PUBLIC_API_BASE_URL||'';
const icons:Record<string,string>={google:'✉',facebook:'f',instagram:'◎',whatsapp:'◉',shopify:'S',shopee:'◈',x:'𝕏',snapchat:'◌',outlook:'✦',slack:'#',discord:'☁',telegram:'➤','google-calendar':'▣'};
const help:Record<string,string>={
  facebook:'Sign in with Facebook and choose the Pages you want your assistant to use.',
  instagram:'Authorize the Instagram professional account connected to your Meta business.',
  whatsapp:'Authorize your WhatsApp Business account for approved business messaging.',
  shopify:'Enter your store domain, then authorize I AM inside Shopify.',
  shopee:'Authorize your shop through Shopee Seller.',
  x:'Sign in to X and grant the permissions you want your assistant to use.',
  snapchat:'Authorize your Snapchat Business resources.',
  google:'Connect Gmail through Google’s official authorization screen.',
  'google-calendar':'Connect Google Calendar through Google’s official authorization screen.',
  outlook:'Connect Outlook through Microsoft’s official authorization screen.',
  slack:'Choose the Slack workspace you want to connect.',
  discord:'Authorize the Discord workspace permissions you want to grant.',
  telegram:'Telegram uses a bot token instead of browser OAuth.'
};
async function read(r:Response){const t=await r.text();try{return JSON.parse(t)}catch{return{error:t||`Request failed (${r.status})`}}}

export default function Connections(){
  const[items,setItems]=useState<Integration[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(''),[shop,setShop]=useState(''),[telegram,setTelegram]=useState('');
  function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
  function headers(json=false){const h:any={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}
  async function load(){setLoading(true);setError('');try{const r=await fetch(`${api}/api/integrations`,{headers:headers(),cache:'no-store'}),d=await read(r);if(r.status===401){location.replace('/login');return}if(!r.ok)throw new Error(d.error||'Unable to load connections.');setItems(d.integrations||[])}catch(e:any){setError(e?.message||'Unable to load connections.')}finally{setLoading(false)}}
  useEffect(()=>{if(!token()){location.replace('/login');return}load()},[]);
  const total=useMemo(()=>items.reduce((n,x)=>n+x.connected.length,0),[items]);

  async function connect(item:Integration){
    setBusy(item.id);setError('');setNotice('');
    try{
      const body=item.id==='shopify'?{shop_domain:shop}:{};
      const r=await fetch(`${api}/api/integrations/${item.id}/connect`,{method:'POST',headers:headers(true),body:JSON.stringify(body)}),d=await read(r);
      if(!r.ok){if(String(d.error||'').toLowerCase().includes('credential'))throw new Error(`${item.name} connection is not activated on I AM yet. You never need to give I AM your ${item.name} password.`);throw new Error(d.error||'Unable to start connection.')}
      if(!d.authorization_url)throw new Error('The provider did not return a secure authorization link.');
      setNotice(`Opening ${item.name}. Authorize your own account there. No platform-owner approval is required.`);
      location.href=d.authorization_url;
    }catch(e:any){setError(e?.message||'Unable to connect.');setBusy('')}
  }

  async function connectTelegram(){setBusy('telegram');setError('');setNotice('');try{const r=await fetch(`${api}/api/integrations/telegram/manual`,{method:'POST',headers:headers(true),body:JSON.stringify({token:telegram})}),d=await read(r);if(!r.ok)throw new Error(d.error||'Unable to connect Telegram.');setTelegram('');setNotice('Telegram connected. Your assistant can use it according to your own permissions.');await load()}catch(e:any){setError(e?.message||'Unable to connect Telegram.')}finally{setBusy('')}}
  async function disconnect(id:string){setBusy(id);setError('');try{const r=await fetch(`${api}/api/integrations/${id}/disconnect`,{method:'DELETE',headers:headers()}),d=await read(r);if(!r.ok)throw new Error(d.error||'Unable to disconnect.');setNotice('Connection removed.');await load()}catch(e:any){setError(e?.message||'Unable to disconnect.')}finally{setBusy('')}}

  return <main className="page">
    <header><a href="/">← Dashboard</a><span>SELF-SERVICE CONNECTIONS</span></header>

    <section className="hero">
      <small>YOUR ACCOUNTS • YOUR PERMISSION • NO OWNER APPROVAL</small>
      <h1>Connect your accounts directly to your personal assistant.</h1>
      <p>Every user connects their own social, email, commerce and work accounts through the provider’s official authorization flow. The platform owner does not approve individual connections or actions. I AM automatically applies the user’s Free or Full Business tier.</p>
      <div className="links"><a href="/assistant-actions">OPEN CONNECTED ASSISTANT →</a><a href="/business-email">GET A LEGIT BUSINESS EMAIL</a><a href="/pricing">FREE / $49 BUSINESS</a></div>
    </section>

    <section className="rules">
      <div><b>1</b><span>User chooses Connect</span></div><div><b>2</b><span>Provider handles sign-in</span></div><div><b>3</b><span>User grants permission</span></div><div><b>4</b><span>Assistant can act automatically within that permission</span></div>
    </section>

    {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
    <section className="summary"><div><b>{total}</b><span>connected accounts</span></div><div><b>{items.filter(x=>x.connected.length).length}</b><span>active providers</span></div><div><b>AUTO</b><span>owner approval not required</span></div></section>

    <section className="emailCard"><div><small>BUSINESS EMAIL</small><h2>Need a professional address first?</h2><p>Open the Business Email Center for official options including Cloudflare Email Routing, Zoho Mail, Google Workspace, Microsoft 365 and Proton for Business.</p></div><a href="/business-email">BUSINESS EMAIL CENTER →</a></section>

    <section className="grid">
      {loading?<div className="loading">Loading secure connection options…</div>:items.map(item=>{const connected=item.connected.length>0;return <article key={item.id} className={connected?'on':''}>
        <div className="head"><div className="icon">{icons[item.id]||'◇'}</div><div><small>{item.category.toUpperCase()}</small><h2>{item.name}</h2></div><span>{connected?'● CONNECTED':item.configured?'READY':'SERVICE SETUP'}</span></div>
        <p>{help[item.id]||'Authorize this service through its official connection flow.'}</p>
        {connected&&<div className="accounts">{item.connected.map(c=><div key={c.external_account_id}>✓ {c.display_name||'Connected account'}</div>)}</div>}
        {item.id==='shopify'&&<input value={shop} onChange={e=>setShop(e.target.value)} placeholder="your-store.myshopify.com"/>}
        {item.id==='telegram'?<><input type="password" value={telegram} onChange={e=>setTelegram(e.target.value)} placeholder="Telegram bot token"/><button disabled={!telegram||busy==='telegram'} onClick={connectTelegram}>{busy==='telegram'?'VERIFYING…':connected?'CONNECT ANOTHER BOT':'CONNECT TELEGRAM'}</button></>:<button disabled={busy===item.id||(item.id==='shopify'&&!shop)} onClick={()=>connect(item)}>{busy===item.id?'OPENING SECURE LOGIN…':connected?'CONNECT ANOTHER ACCOUNT':`CONNECT ${item.name.toUpperCase()}`}</button>}
        {!item.configured&&item.id!=='telegram'&&<p className="setup">This provider still needs platform OAuth activation. Users never need to provide developer keys or their account password here.</p>}
        {connected&&<><a className="assistant" href="/assistant-actions">USE WITH MY ASSISTANT →</a><button className="disconnect" disabled={busy===item.id} onClick={()=>disconnect(item.id)}>Disconnect {item.name}</button></>}
      </article>})}
    </section>

    <section className="promise"><small>AUTOMATED BY DESIGN</small><h2>No approval queue for the platform owner.</h2><p>The user’s provider authorization and their own AI read/write switches control access. Once those are granted, explicit connected-account commands execute without a separate owner approval step. Users can revoke a provider connection or disable AI read/write access themselves at any time.</p><a href="/assistant-actions">MANAGE MY ASSISTANT →</a></section>

    <footer>Official OAuth/provider authorization • encrypted access tokens • tenant-isolated connections • no social passwords stored • self-service Free and Business access</footer>

    <style jsx>{`
      .page{min-height:100vh;background:#050a10;color:#edf9ff;padding:24px 32px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 80% 12%,rgba(0,196,255,.12),transparent 28%),radial-gradient(circle at 14% 82%,rgba(255,183,54,.07),transparent 30%)}header{max-width:1380px;margin:auto;display:flex;justify-content:space-between;color:#6f8798;font-size:9px;letter-spacing:.18em}header a{color:#9be9ff;text-decoration:none}.hero{max-width:1380px;margin:26px auto 10px;padding:36px;border:1px solid #18384b;border-radius:24px;background:linear-gradient(125deg,#081621,#05090e)}.hero small,.emailCard small,.promise small{font-size:9px;letter-spacing:.18em;color:#e5b65a;font-weight:900}.hero h1{font-size:clamp(40px,6vw,70px);line-height:.98;margin:10px 0}.hero p,.promise p,.emailCard p{max-width:900px;color:#8aa3b4;line-height:1.6}.links{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.links a,.emailCard a,.promise a{border:1px solid #265168;border-radius:9px;padding:10px 12px;color:#b9ecff;text-decoration:none;font-size:9px;font-weight:900}.rules{max-width:1380px;margin:10px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.rules div,.summary div{border:1px solid #153448;border-radius:12px;background:#071019;padding:13px;display:flex;align-items:center;gap:9px}.rules b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#0f2b3b;color:#69ddff}.rules span,.summary span{font-size:9px;color:#7f98a8}.error,.notice{max-width:1380px;margin:10px auto;padding:12px;border-radius:10px}.error{background:#211014;border:1px solid #68313a;color:#ffadb7}.notice{background:#081923;border:1px solid #25536a;color:#baeaff}.summary{max-width:1380px;margin:10px auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.summary div{display:block}.summary b{display:block;font-size:24px;color:#6edfff}.emailCard,.promise{max-width:1380px;margin:10px auto;border:1px solid #4a3d25;border-radius:16px;background:linear-gradient(120deg,#100f0a,#071019);padding:22px;display:flex;justify-content:space-between;align-items:center;gap:24px}.emailCard h2,.promise h2{margin:5px 0;font-size:28px}.emailCard a,.promise a{white-space:nowrap}.grid{max-width:1380px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.grid article{border:1px solid #173547;border-radius:16px;background:#071019;padding:18px}.grid article.on{border-color:#265b4a;background:linear-gradient(145deg,#071019,#071711)}.head{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center}.icon{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;border:1px solid #265268;color:#79e3ff;font-size:22px}.head small{font-size:8px;color:#6c8595;letter-spacing:.13em}.head h2{margin:3px 0;font-size:19px}.head>span{font-size:8px;color:#79dca1}.grid article>p{color:#728b9c;line-height:1.5;font-size:10px}.accounts{margin:10px 0;padding:9px;border:1px solid #194b3d;border-radius:9px;background:#071510;color:#8ee9b1;font-size:10px}.grid input{width:100%;box-sizing:border-box;margin:8px 0;border:1px solid #1d4357;border-radius:9px;background:#03090e;color:#ecfaff;padding:11px}.grid article>button{width:100%;border:0;border-radius:9px;padding:11px;background:linear-gradient(90deg,#188db7,#a97427);color:#fff;font-weight:900;cursor:pointer}.grid article>button:disabled{opacity:.55;cursor:default}.assistant{display:block;margin-top:10px;color:#75ddff;text-decoration:none;font-size:9px}.grid .disconnect{margin-top:8px;background:transparent;border:1px solid #5c3037;color:#e99aa2}.setup{color:#c5a66d!important}.promise{display:block}.promise a{display:inline-block;margin-top:10px}footer{max-width:1380px;margin:22px auto 0;border-top:1px solid #132b3b;padding-top:14px;color:#60798a;font-size:9px}.loading{grid-column:1/-1;padding:50px;text-align:center;color:#6e8797}@media(max-width:980px){.page{padding:18px 14px}.grid{grid-template-columns:1fr 1fr}.rules{grid-template-columns:1fr 1fr}.emailCard{align-items:flex-start;flex-direction:column}}@media(max-width:620px){.grid,.summary,.rules{grid-template-columns:1fr}.head{grid-template-columns:48px 1fr}.head>span{grid-column:2}.hero{padding:25px}.emailCard a{white-space:normal}}
    `}</style>
  </main>
}
