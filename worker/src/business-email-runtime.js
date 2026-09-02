const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});

const providers=[
  {id:'cloudflare',name:'Cloudflare Email Routing',kind:'forwarding',ai_connection:'destination-mailbox'},
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

export async function handleBusinessEmail(request){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/business-email'))return null;
  if(request.method==='GET'&&url.pathname==='/api/business-email/providers')return json({providers,official_only:true});
  if(request.method==='GET'&&url.pathname==='/api/business-email/check'){
    const domain=cleanDomain(url.searchParams.get('domain'));
    if(!validDomain(domain))return json({error:'Enter a valid domain such as yourbusiness.com.'},400);
    try{
      const [mx,txt,dmarc]=await Promise.all([dns(domain,'MX'),dns(domain,'TXT'),dns(`_dmarc.${domain}`,'TXT')]);
      const detected=detect(mx),spf=txt.some(x=>x.toLowerCase().includes('v=spf1')),hasDmarc=dmarc.some(x=>x.toLowerCase().includes('v=dmarc1'));
      return json({domain,mx,has_mx:mx.length>0,detected_provider:detected,spf, dmarc:hasDmarc,deliverability:{mx:mx.length>0,spf,dmarc:hasDmarc},checked_by:'I AM Business Email Center'});
    }catch(e){return json({error:e?.message||'Unable to check domain email records.'},502)}
  }
  return json({error:'Business email endpoint not found.'},404);
}
