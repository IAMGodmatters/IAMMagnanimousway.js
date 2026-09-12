import {currentUser} from './integrations.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);

const providers=[
  {id:'cloudflare',name:'Cloudflare Email Routing',kind:'forwarding',ai_connection:'destination-mailbox',free_inbound:true,free_outbound:false},
  {id:'zoho',name:'Zoho Mail',kind:'mailbox',ai_connection:'not-direct'},
  {id:'google',name:'Google Workspace',kind:'mailbox',ai_connection:'google'},
  {id:'microsoft',name:'Microsoft 365',kind:'mailbox',ai_connection:'outlook'},
  {id:'proton',name:'Proton for Business',kind:'mailbox',ai_connection:'not-direct'}
];

function cleanDomain(value){
  return String(value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].replace(/\.$/,'');
}
function validDomain(domain){
  return /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain);
}
function cleanLocal(value){
  return String(value||'').trim().toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9._-]/g,'').slice(0,63);
}
function validLocal(value){return /^[a-z0-9](?:[a-z0-9._-]{0,61}[a-z0-9])?$/i.test(value)||/^[a-z0-9]$/i.test(value)}
function cleanEmail(value){return String(value||'').trim().toLowerCase().slice(0,254)}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)}
async function dns(name,type){
  const url=`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const r=await fetch(url,{headers:{accept:'application/dns-json'}});
  if(!r.ok)throw new Error(`DNS lookup failed (${r.status}).`);
  const d=await r.json().catch(()=>({}));
  return (d.Answer||[]).map(x=>String(x.data||'')).filter(Boolean);
}
function detect(mx){
  const hay=mx.join(' ').toLowerCase();
  if(hay.includes('google.com'))return{id:'google',name:'Google Workspace'};
  if(hay.includes('mail.protection.outlook.com')||hay.includes('outlook.com'))return{id:'microsoft',name:'Microsoft 365'};
  if(hay.includes('zoho.'))return{id:'zoho',name:'Zoho Mail'};
  if(hay.includes('protonmail'))return{id:'proton',name:'Proton Mail'};
  if(hay.includes('mx.cloudflare.net'))return{id:'cloudflare',name:'Cloudflare Email Routing'};
  return mx.length?{id:'other',name:'Other email provider'}:null;
}
async function ensureLiteTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_email_lite_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    local_part TEXT NOT NULL,
    destination TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'cloudflare',
    status TEXT NOT NULL DEFAULT 'planned',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(tenant_id,domain,local_part)
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_business_email_lite_tenant ON business_email_lite_aliases(tenant_id,updated_at DESC)').run();
}
function setupGuide(row){
  const address=`${row.local_part}@${row.domain}`;
  return {
    address,
    destination:row.destination,
    provider:'Cloudflare Email Routing',
    free_receiving_and_forwarding:true,
    outbound_sending_included:false,
    provider_action_required:true,
    steps:[
      `Put ${row.domain} on Cloudflare DNS.`,
      'Open Cloudflare → Compute → Email Service → Email Routing.',
      'Choose Onboard Domain and let Cloudflare add the mail records.',
      `Add ${row.destination} as the destination and click the verification email it sends you.`,
      `Create the address ${address} and forward it to ${row.destination}.`,
      `Send a test message to ${address}. If it arrives at ${row.destination}, you are done.`
    ]
  };
}
async function requireLiteUser(request,env){
  if(!env?.DB)return{error:json({error:'Business Email Lite storage is not configured.'},503)};
  const user=await currentUser(request,env);
  if(!user)return{error:json({error:'Sign in to save and manage your free business email setup.'},401)};
  await ensureLiteTable(env);
  return{user};
}

export async function handleBusinessEmail(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/business-email'))return null;
  if(request.method==='GET'&&url.pathname==='/api/business-email/providers')return json({providers,official_only:true,free_lite:{provider:'cloudflare',receive_and_forward:true,send_as_address:false}});
  if(request.method==='GET'&&url.pathname==='/api/business-email/check'){
    const domain=cleanDomain(url.searchParams.get('domain'));
    if(!validDomain(domain))return json({error:'Enter a valid domain such as yourbusiness.com.'},400);
    try{
      const [mx,txt,dmarc]=await Promise.all([dns(domain,'MX'),dns(domain,'TXT'),dns(`_dmarc.${domain}`,'TXT')]);
      const detected=detect(mx),spf=txt.some(x=>x.toLowerCase().includes('v=spf1')),hasDmarc=dmarc.some(x=>x.toLowerCase().includes('v=dmarc1'));
      return json({domain,mx,has_mx:mx.length>0,detected_provider:detected,spf,dmarc:hasDmarc,deliverability:{mx:mx.length>0,spf,dmarc:hasDmarc},email_routing_ready:detected?.id==='cloudflare',checked_by:'I AM Business Email Center'});
    }catch(e){return json({error:e?.message||'Unable to check domain email records.'},502)}
  }

  if(url.pathname==='/api/business-email/lite'){
    const access=await requireLiteUser(request,env);if(access.error)return access.error;const user=access.user;
    if(request.method==='GET'){
      const {results=[]}=await env.DB.prepare('SELECT id,domain,local_part,destination,provider,status,created_at,updated_at FROM business_email_lite_aliases WHERE tenant_id=? ORDER BY updated_at DESC LIMIT 100').bind(user.tenant_id).all();
      return json({aliases:results.map(r=>({...r,...setupGuide(r)})),plan:'free-business-email-lite'});
    }
    if(request.method==='POST'){
      const body=await request.json().catch(()=>({}));
      const domain=cleanDomain(body.domain),localPart=cleanLocal(body.local_part),destination=cleanEmail(body.destination);
      if(!validDomain(domain))return json({error:'Type your domain like myshop.com.'},400);
      if(!validLocal(localPart))return json({error:'Choose a simple name like hello, sales, support, or your first name.'},400);
      if(!validEmail(destination))return json({error:'Type the real inbox where you want the mail to arrive, like myname@gmail.com.'},400);
      const ts=now();
      await env.DB.prepare(`INSERT INTO business_email_lite_aliases(tenant_id,user_id,domain,local_part,destination,provider,status,created_at,updated_at)
        VALUES(?,?,?,?,?,'cloudflare','planned',?,?)
        ON CONFLICT(tenant_id,domain,local_part) DO UPDATE SET destination=excluded.destination,provider='cloudflare',status='planned',updated_at=excluded.updated_at`)
        .bind(user.tenant_id,user.id,domain,localPart,destination,ts,ts).run();
      const row=await env.DB.prepare('SELECT id,domain,local_part,destination,provider,status,created_at,updated_at FROM business_email_lite_aliases WHERE tenant_id=? AND domain=? AND local_part=?').bind(user.tenant_id,domain,localPart).first();
      return json({ok:true,alias:{...row,...setupGuide(row)},message:`Your free receiving address plan ${localPart}@${domain} is saved. Finish the Cloudflare routing steps to make it live.`},201);
    }
    return json({error:'Use GET to view saved addresses or POST to create one.'},405);
  }

  const match=url.pathname.match(/^\/api\/business-email\/lite\/(\d+)$/);
  if(match){
    const access=await requireLiteUser(request,env);if(access.error)return access.error;const user=access.user,id=Number(match[1]);
    const existing=await env.DB.prepare('SELECT id,domain,local_part,destination,provider,status,created_at,updated_at FROM business_email_lite_aliases WHERE id=? AND tenant_id=?').bind(id,user.tenant_id).first();
    if(!existing)return json({error:'That saved business email was not found.'},404);
    if(request.method==='PATCH'){
      const body=await request.json().catch(()=>({})),status=String(body.status||'').trim();
      if(!['planned','domain-ready','tested'].includes(status))return json({error:'Status must be planned, domain-ready, or tested.'},400);
      await env.DB.prepare('UPDATE business_email_lite_aliases SET status=?,updated_at=? WHERE id=? AND tenant_id=?').bind(status,now(),id,user.tenant_id).run();
      const row={...existing,status,updated_at:now()};return json({ok:true,alias:{...row,...setupGuide(row)}});
    }
    if(request.method==='DELETE'){
      await env.DB.prepare('DELETE FROM business_email_lite_aliases WHERE id=? AND tenant_id=?').bind(id,user.tenant_id).run();
      return json({ok:true,deleted:id});
    }
    return json({error:'Use PATCH to update or DELETE to remove this saved address.'},405);
  }

  return json({error:'Business email endpoint not found.'},404);
}
