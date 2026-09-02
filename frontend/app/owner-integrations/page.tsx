'use client';

import { useEffect, useMemo, useState } from 'react';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Field = { key:string; label:string; secret:boolean; required:boolean; set:boolean; source:string; updated_at:number|null };
type Group = { id:string; name:string; providers:string[]; configured:boolean; fields:Field[] };
type Payload = { groups:Group[]; callbacks:Record<string,string> };

async function read(response:Response){const text=await response.text();try{return JSON.parse(text)}catch{return{error:text||`Request failed (${response.status})`}}}

const notes:Record<string,string> = {
  stripe:'Connect the account that receives Premium subscription payments. The webhook secret lets I AM verify Stripe events and activate or cancel Premium automatically.',
  twilio:'Connect the phone carrier for real mobile and landline calling. Keep the Auth Token private; customers never see it.',
  elevenlabs:'Optional conversational voice-agent layer for human-like automated calls and assistants.',
  heygen:'Optional video-avatar provider for human-like on-screen assistants.',
  meta:'Developer credentials for Facebook Pages, Instagram Business and WhatsApp Business connections.',
  google:'Developer credentials for Gmail and Google Calendar connections.',
  shopify:'Developer credentials for Shopify OAuth connections.',
  shopee:'Developer credentials for Shopee seller connections.',
  x:'Developer credentials for X connections.',
  snapchat:'Developer credentials for Snapchat Business connections.',
  microsoft:'Developer credentials for Outlook connections.',
  slack:'Developer credentials for Slack connections.',
  discord:'Developer credentials for Discord connections.'
};

export default function OwnerIntegrations(){
  const[data,setData]=useState<Payload>({groups:[],callbacks:{}}),[values,setValues]=useState<Record<string,string>>({}),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true);
  function token(){return localStorage.getItem('odin_admin_token')||localStorage.getItem('iam_account_token')||''}
  function headers(json=false){const h:any={Authorization:`Bearer ${token()}`};if(json)h['Content-Type']='application/json';return h}
  async function load(){setLoading(true);setError('');try{const r=await fetch(`${api}/api/integrations/platform-credentials`,{headers:headers(),cache:'no-store'}),d=await read(r);if(r.status===401){location.replace('/owner-login');return}if(r.status===403){location.replace('/');return}if(!r.ok)throw new Error(d.error||'Unable to load provider setup.');setData(d)}catch(e:any){setError(e?.message||'Unable to load provider setup.')}finally{setLoading(false)}}
  useEffect(()=>{if(!token()){location.replace('/owner-login');return}load()},[])
  const configured=useMemo(()=>data.groups.filter(g=>g.configured).length,[data.groups]);
  async function save(group:Group){const payload:Record<string,string>={};for(const field of group.fields){const value=String(values[field.key]||'').trim();if(value)payload[field.key]=value}if(!Object.keys(payload).length){setError(`Enter at least one ${group.name} value to save.`);return}setBusy(group.id);setError('');setNotice('');try{const r=await fetch(`${api}/api/integrations/platform-credentials`,{method:'POST',headers:headers(true),body:JSON.stringify({values:payload})}),d=await read(r);if(!r.ok)throw new Error(d.error||'Unable to save credentials.');setValues(v=>{const next={...v};for(const key of Object.keys(payload))next[key]='';return next});setData({groups:d.groups||[],callbacks:d.callbacks||{}});setNotice(`${group.name} settings saved in the encrypted owner vault.`)}catch(e:any){setError(e?.message||'Unable to save credentials.')}finally{setBusy('')}}
  async function remove(group:Group){setBusy(group.id);setError('');setNotice('');try{const keys=group.fields.filter(f=>f.source==='vault').map(f=>f.key);if(!keys.length)throw new Error('This group has no vault-saved values to remove. Cloudflare deployment secrets are not changed here.');const r=await fetch(`${api}/api/integrations/platform-credentials`,{method:'DELETE',headers:headers(true),body:JSON.stringify({keys})}),d=await read(r);if(!r.ok)throw new Error(d.error||'Unable to remove saved credentials.');setData({groups:d.groups||[],callbacks:d.callbacks||{}});setNotice(`${group.name} vault values removed.`)}catch(e:any){setError(e?.message||'Unable to remove saved credentials.')}finally{setBusy('')}}
  const webhook=typeof window!=='undefined'?`${location.origin}/api/billing/webhook`:'/api/billing/webhook';
  return <main className="setup">
    <header><a href="/owner-center">← Owner Center</a><span>OWNER • PROVIDER SETUP</span></header>
    <section className="hero"><div><small>ENCRYPTED OWNER VAULT</small><h1>Connect the services that power the platform.</h1><p>Enter developer keys here once. They stay server-side and are encrypted in the platform database. Customer passwords and payment-card details do not belong on this screen.</p></div><div className="score"><b>{configured}</b><span>of {data.groups.length} provider groups ready</span></div></section>
    {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
    {loading?<div className="loading">Loading owner provider setup…</div>:<section className="grid">{data.groups.map(group=><article key={group.id} className={group.configured?'ready':''}>
      <div className="head"><div><small>{group.id.toUpperCase()}</small><h2>{group.name}</h2></div><span>{group.configured?'● READY':'○ NEEDS SETUP'}</span></div>
      <p>{notes[group.id]||'Platform developer credentials for this service.'}</p>
      {group.id==='stripe'&&<div className="webhook"><b>STRIPE WEBHOOK URL</b><code>{webhook}</code><span>Subscribe to checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid and invoice.payment_failed.</span></div>}
      {group.providers.length>0&&<div className="callbacks">{group.providers.map(provider=><div key={provider}><b>{provider}</b><code>{data.callbacks?.[provider]||''}</code></div>)}</div>}
      <div className="fields">{group.fields.map(field=><label key={field.key}><span>{field.label}{field.required?' *':''}<i className={field.set?'set':''}>{field.set?`SET • ${field.source.toUpperCase()}`:'MISSING'}</i></span><input type={field.secret?'password':'text'} value={values[field.key]||''} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))} placeholder={field.set?'Leave blank to keep existing value':'Enter value'}/></label>)}</div>
      <div className="actions"><button onClick={()=>save(group)} disabled={!!busy}>{busy===group.id?'SAVING…':'SAVE / UPDATE'}</button><button className="remove" onClick={()=>remove(group)} disabled={!!busy||!group.fields.some(f=>f.source==='vault')}>REMOVE VAULT VALUES</button></div>
    </article>)}</section>}
    <section className="links"><a href="/owner-revenue">Revenue & Subscribers →</a><a href="/connections">Customer Connections →</a><a href="/billing">Plan & Billing →</a></section>
    <footer>Secrets saved here are encrypted and are only loaded into server-side runtime requests. Existing Cloudflare secrets remain higher priority.</footer>
    <style jsx>{`
      .setup{min-height:100vh;background:#05090f;color:#eaf7ff;padding:24px 34px 70px;font-family:Inter,system-ui,sans-serif;background-image:radial-gradient(circle at 75% 15%,rgba(0,190,255,.1),transparent 30%),radial-gradient(circle at 15% 75%,rgba(231,174,63,.07),transparent 28%)}
      header{max-width:1380px;margin:auto;display:flex;justify-content:space-between;color:#6c8799;font-size:9px;letter-spacing:.16em}header a{color:#9ce7ff;text-decoration:none}.hero{max-width:1380px;margin:26px auto 14px;padding:34px;border:1px solid #17364a;border-radius:22px;background:linear-gradient(125deg,#08141e,#05080d);display:flex;justify-content:space-between;gap:28px;align-items:center}.hero small{font-size:9px;color:#e6b555;letter-spacing:.2em;font-weight:900}.hero h1{font-size:clamp(36px,5vw,64px);line-height:.97;margin:8px 0}.hero p{max-width:830px;color:#829cad;line-height:1.6}.score{min-width:160px;border:1px solid #24465a;border-radius:18px;padding:20px;text-align:center;background:#061019}.score b{font-size:44px;color:#75e0ff}.score span{display:block;color:#718a9b;font-size:9px}
      .error,.notice{max-width:1380px;margin:10px auto;padding:12px 14px;border-radius:10px}.error{border:1px solid #70313a;background:#211014;color:#ffadb6}.notice{border:1px solid #24546d;background:#071923;color:#b9ebff}.loading{max-width:1380px;margin:auto;padding:50px;text-align:center;color:#718a9b}
      .grid{max-width:1380px;margin:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.grid article{border:1px solid #173447;border-radius:16px;background:#071019;padding:19px}.grid article.ready{border-color:#24513f;background:linear-gradient(145deg,#071019,#07150f)}.head{display:flex;justify-content:space-between;gap:12px}.head small{font-size:8px;color:#687f91;letter-spacing:.16em}.head h2{margin:4px 0;font-size:22px}.head>span{font-size:8px;color:#75d99c}.grid article>p{font-size:10px;color:#748e9f;line-height:1.55}.fields{display:grid;gap:8px;margin-top:12px}.fields label>span{display:flex;justify-content:space-between;gap:8px;color:#a8becb;font-size:9px;margin-bottom:4px}.fields i{font-style:normal;font-size:7px;color:#9b6f75}.fields i.set{color:#68d596}.fields input{width:100%;box-sizing:border-box;border:1px solid #1c4053;border-radius:8px;background:#03090e;color:#f0fbff;padding:10px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.actions button{border:0;border-radius:8px;padding:10px;background:linear-gradient(90deg,#168db7,#a87528);color:white;font-size:9px;font-weight:900;cursor:pointer}.actions button:disabled{opacity:.45;cursor:default}.actions .remove{background:transparent;border:1px solid #563039;color:#d9939b}.callbacks,.webhook{border:1px solid #19394d;border-radius:9px;background:#050c12;padding:9px;margin:9px 0}.callbacks div{margin:5px 0}.callbacks b,.webhook b{display:block;color:#d2a752;font-size:7px;letter-spacing:.12em}.callbacks code,.webhook code{display:block;overflow-wrap:anywhere;color:#84dfff;font-size:8px;margin-top:3px}.webhook span{display:block;color:#6c8798;font-size:8px;line-height:1.4;margin-top:6px}.links{max-width:1380px;margin:14px auto;display:flex;gap:8px;flex-wrap:wrap}.links a{border:1px solid #24485d;border-radius:999px;padding:9px 12px;color:#a6eaff;text-decoration:none;font-size:9px}footer{max-width:1380px;margin:18px auto;color:#5e7889;font-size:9px;border-top:1px solid #112b3b;padding-top:13px}
      @media(max-width:850px){.setup{padding:18px 14px 55px}.hero{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:1fr}.actions{grid-template-columns:1fr}}
    `}</style>
  </main>
}
