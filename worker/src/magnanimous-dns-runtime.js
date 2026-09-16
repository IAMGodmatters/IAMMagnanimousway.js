import { currentUser } from './integrations.js';
import { handleMagnanimousCloudflare } from './magnanimous-cloudflare-runtime.js';
import { handleMagnanimousPorkbunDns } from './magnanimous-porkbun-dns-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clip=(value,n=8000)=>String(value??'').trim().slice(0,n);
const DNS_TYPES=new Set(['A','AAAA','CNAME','MX','NS','TXT','SOA','SRV','CAA','PTR','DS','DNSKEY','TLSA','SVCB','HTTPS','NAPTR']);
const RESOLVERS={
 cloudflare:{name:'Cloudflare 1.1.1.1',base:'https://cloudflare-dns.com/dns-query'},
 google:{name:'Google Public DNS',base:'https://dns.google/resolve'}
};
const RCODE={0:'NOERROR',1:'FORMERR',2:'SERVFAIL',3:'NXDOMAIN',4:'NOTIMP',5:'REFUSED'};

function normalizeName(value){
 let name=clip(value,253).toLowerCase().replace(/\.$/,'');
 if(!name||name.includes('://')||name.includes('/')||name.includes('\\')||name.includes('@')||name.includes(' '))return'';
 const labels=name.split('.');
 if(labels.some(label=>!label||label.length>63||!/^[a-z0-9_-]+$/.test(label)||label.startsWith('-')||label.endsWith('-')))return'';
 return name;
}
function baseDomain(value){const name=normalizeName(value);if(!name)return'';return name.startsWith('_dmarc.')?name.slice(7):name;}
function normalizeType(value){const type=String(value||'A').trim().toUpperCase();return DNS_TYPES.has(type)?type:'';}
function timeoutSignal(ms=10000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort('timeout'),ms);return{signal:controller.signal,done:()=>clearTimeout(timer)};}
async function fetchJson(url,options={}){const t=timeoutSignal(10000);try{const r=await fetch(url,{...options,signal:t.signal,redirect:'error'});const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{throw new Error(`Unparseable response from ${new URL(url).hostname}`)}if(!r.ok)throw new Error(`${new URL(url).hostname} returned HTTP ${r.status}`);return data;}finally{t.done();}}
function recordList(data){return Array.isArray(data?.Answer)?data.Answer.map(x=>({name:String(x.name||'').replace(/\.$/,''),type:Number(x.type||0),ttl:Number(x.TTL||0),data:String(x.data||'')})):[];}
function canonicalAnswers(data){return [...new Set(recordList(data).map(x=>x.data.trim()).filter(Boolean))].sort();}
async function queryResolver(resolverId,name,type){
 const resolver=RESOLVERS[resolverId];if(!resolver)throw new Error('Unknown DNS resolver.');
 const params=new URLSearchParams({name,type,do:'true',cd:'false'});
 const data=await fetchJson(`${resolver.base}?${params.toString()}`,{headers:{accept:'application/dns-json'}});
 return{resolver:resolverId,resolver_name:resolver.name,status:Number(data.Status??-1),status_text:RCODE[Number(data.Status??-1)]||`RCODE_${data.Status}`,authenticated_data:Boolean(data.AD),truncated:Boolean(data.TC),records:recordList(data),raw_flags:{RD:Boolean(data.RD),RA:Boolean(data.RA),AD:Boolean(data.AD),CD:Boolean(data.CD)}};
}
async function lookup(name,type,resolver='all'){
 const ids=resolver==='all'?Object.keys(RESOLVERS):[resolver];
 const settled=await Promise.allSettled(ids.map(id=>queryResolver(id,name,type)));
 return settled.map((result,i)=>result.status==='fulfilled'?result.value:{resolver:ids[i],resolver_name:RESOLVERS[ids[i]]?.name||ids[i],error:clip(result.reason?.message||result.reason,500)});
}
function compareResults(results){
 const usable=results.filter(x=>!x.error);if(!usable.length)return{consistent:false,reason:'No resolver returned a usable answer.'};
 const signatures=usable.map(x=>JSON.stringify([...new Set((x.records||[]).map(r=>String(r.data||'').trim()).filter(Boolean))].sort()));
 const consistent=new Set(signatures).size===1&&new Set(usable.map(x=>x.status)).size===1;
 return{consistent,resolvers_checked:usable.length,answer_sets:usable.map(x=>({resolver:x.resolver,status:x.status_text,answers:(x.records||[]).map(r=>r.data)}))};
}
function txtValues(results){return results.flatMap(x=>x.records||[]).map(r=>r.data.replace(/^"|"$/g,'').replace(/"\s+"/g,''));}
function hasPrefix(values,prefix){return values.some(v=>v.toLowerCase().startsWith(prefix.toLowerCase()));}
function finding(level,code,message){return{level,code,message};}

async function emailSecurity(domain,selectors=[]){
 const root=await lookup(domain,'TXT','cloudflare');
 const dmarc=await lookup(`_dmarc.${domain}`,'TXT','cloudflare');
 const mx=await lookup(domain,'MX','cloudflare');
 const rootTxt=txtValues(root),dmarcTxt=txtValues(dmarc),findings=[];
 const spf=rootTxt.filter(v=>v.toLowerCase().startsWith('v=spf1'));
 const dmarcRecords=dmarcTxt.filter(v=>v.toLowerCase().startsWith('v=dmarc1'));
 if(spf.length===0)findings.push(finding('warning','SPF_MISSING','No SPF record was found.'));
 if(spf.length>1)findings.push(finding('error','SPF_MULTIPLE','Multiple SPF records were found; SPF expects one policy record.'));
 if(spf.some(v=>/(^|\s)\+all(?:\s|$)/i.test(v)))findings.push(finding('error','SPF_ALLOW_ALL','SPF contains +all, which authorizes every sender.'));
 if(dmarcRecords.length===0)findings.push(finding('warning','DMARC_MISSING','No DMARC policy record was found.'));
 if(dmarcRecords.some(v=>/\bp\s*=\s*none\b/i.test(v)))findings.push(finding('info','DMARC_MONITOR_ONLY','DMARC is present in monitoring-only mode (p=none).'));
 if(!(mx[0]?.records||[]).length)findings.push(finding('warning','MX_MISSING','No MX records were found.'));
 const dkim=[];
 for(const raw of selectors.slice(0,10)){
  const selector=normalizeName(raw);if(!selector||selector.includes('.'))continue;
  const result=await lookup(`${selector}._domainkey.${domain}`,'TXT','cloudflare');
  const values=txtValues(result),present=hasPrefix(values,'v=dkim1')||values.some(v=>/\bp=/i.test(v));
  dkim.push({selector,present,records:values});
  if(!present)findings.push(finding('info','DKIM_SELECTOR_NOT_FOUND',`No DKIM key was found for selector ${selector}.`));
 }
 return{domain,spf:{present:spf.length===1,records:spf},dmarc:{present:dmarcRecords.length>0,records:dmarcRecords},mx:mx[0]?.records||[],dkim,findings};
}

function ipv4Ptr(ip){const parts=ip.split('.');if(parts.length!==4||parts.some(x=>!/^\d+$/.test(x)||Number(x)>255))return'';return`${parts.reverse().join('.')}.in-addr.arpa`;}
function expandIpv6(ip){
 let raw=String(ip||'').toLowerCase();if(!/^[0-9a-f:]+$/.test(raw)||!raw.includes(':'))return null;
 const halves=raw.split('::');if(halves.length>2)return null;
 const left=halves[0]?halves[0].split(':').filter(Boolean):[],right=halves[1]?halves[1].split(':').filter(Boolean):[];
 if(left.concat(right).some(x=>!/^[0-9a-f]{1,4}$/.test(x)))return null;
 const missing=8-left.length-right.length;if((halves.length===1&&missing!==0)||(halves.length===2&&missing<1))return null;
 return [...left,...Array(Math.max(0,missing)).fill('0'),...right].map(x=>x.padStart(4,'0'));
}
function ipv6Ptr(ip){const groups=expandIpv6(ip);if(!groups)return'';return`${groups.join('').split('').reverse().join('.')}.ip6.arpa`;}
function reverseName(ip){return ipv4Ptr(ip)||ipv6Ptr(ip);}

function sanitizeRdap(data){
 const registrar=(Array.isArray(data?.entities)?data.entities:[]).find(e=>Array.isArray(e?.roles)&&e.roles.includes('registrar'));
 const registrarName=Array.isArray(registrar?.vcardArray?.[1])?registrar.vcardArray[1].find(x=>x?.[0]==='fn')?.[3]||'':'';
 return{objectClassName:data?.objectClassName||'',handle:data?.handle||'',ldhName:data?.ldhName||'',unicodeName:data?.unicodeName||'',status:Array.isArray(data?.status)?data.status:[],nameservers:Array.isArray(data?.nameservers)?data.nameservers.map(x=>x.ldhName||x.unicodeName).filter(Boolean):[],events:Array.isArray(data?.events)?data.events.map(x=>({action:x.eventAction,date:x.eventDate})):[],secureDNS:data?.secureDNS||null,registrar:registrarName?{name:registrarName,handle:registrar?.handle||''}:null,notices:Array.isArray(data?.notices)?data.notices.map(n=>({title:n.title||'',description:n.description||[]})).slice(0,10):[]};
}
async function rdap(domain){const data=await fetchJson(`https://rdap.org/domain/${encodeURIComponent(domain)}`,{headers:{accept:'application/rdap+json, application/json'}});return sanitizeRdap(data);}

async function diagnose(domain,selectors=[]){
 const types=['A','AAAA','CNAME','MX','NS','TXT','SOA','CAA','DS','DNSKEY','HTTPS'];
 const entries={};
 await Promise.all(types.map(async type=>{entries[type]=await lookup(domain,type,'cloudflare');}));
 const email=await emailSecurity(domain,selectors),propagation={};
 for(const type of ['A','AAAA','MX','NS'])propagation[type]=compareResults(await lookup(domain,type,'all'));
 const ds=(entries.DS?.[0]?.records||[]),dnskey=(entries.DNSKEY?.[0]?.records||[]),findings=[...email.findings];
 if(!(entries.NS?.[0]?.records||[]).length)findings.push(finding('error','NS_MISSING','No authoritative NS records were found.'));
 if(!(entries.A?.[0]?.records||[]).length&&!(entries.AAAA?.[0]?.records||[]).length&&!(entries.CNAME?.[0]?.records||[]).length)findings.push(finding('warning','WEB_ADDRESS_MISSING','No A, AAAA, or CNAME answer was found for the domain apex.'));
 if(!ds.length&&!dnskey.length)findings.push(finding('info','DNSSEC_NOT_DETECTED','No DS or DNSKEY data was detected from the recursive resolver.'));
 for(const [type,result] of Object.entries(propagation))if(!result.consistent)findings.push(finding('warning','PROPAGATION_DIFFERENCE',`${type} answers differ between public resolvers or could not be compared.`));
 return{domain,checked_at:new Date().toISOString(),dns:{records:Object.fromEntries(Object.entries(entries).map(([type,r])=>[type,r?.[0]||null])),dnssec:{ds_present:ds.length>0,dnskey_present:dnskey.length>0,authenticated_data:Boolean(entries.A?.[0]?.authenticated_data||entries.NS?.[0]?.authenticated_data)}},email,propagation,findings};
}

function validZoneId(value){const v=clip(value,64);return/^[a-zA-Z0-9_-]{8,64}$/.test(v)?v:'';}
function validRecordId(value){const v=clip(value,64);return/^[a-zA-Z0-9_-]{8,64}$/.test(v)?v:'';}
function cloudflareRecordPayload(body){
 const type=normalizeType(body.type);if(!type)throw new Error('A supported DNS record type is required.');
 const name=normalizeName(body.name);if(!name)throw new Error('A valid DNS record name is required.');
 const content=clip(body.content,65000);if(!content)throw new Error('DNS record content is required.');
 const payload={type,name,content};
 if(body.ttl!==undefined){const ttl=Number(body.ttl);if(!Number.isInteger(ttl)||ttl<1||ttl>2147483647)throw new Error('TTL must be an integer from 1 to 2147483647.');payload.ttl=ttl;}
 if(body.proxied!==undefined)payload.proxied=Boolean(body.proxied);
 if(body.priority!==undefined){const priority=Number(body.priority);if(!Number.isInteger(priority)||priority<0||priority>65535)throw new Error('Priority must be from 0 to 65535.');payload.priority=priority;}
 if(body.comment!==undefined)payload.comment=clip(body.comment,500);
 return payload;
}
async function stageCloudflareRecord(request,env){
 const body=await request.json().catch(()=>({})),action=String(body.action||'').toLowerCase(),zone=validZoneId(body.zone_id||env.CLOUDFLARE_PLATFORM_ZONE_ID);
 if(!zone)return json({detail:'A Cloudflare zone_id is required.'},400);
 let method='',path='',payload={};
 try{
  if(action==='create'){method='POST';path=`/zones/${encodeURIComponent(zone)}/dns_records`;payload=cloudflareRecordPayload(body.record||{});}
  else if(action==='update'){const id=validRecordId(body.record_id);if(!id)return json({detail:'record_id is required for update.'},400);method='PATCH';path=`/zones/${encodeURIComponent(zone)}/dns_records/${encodeURIComponent(id)}`;payload=cloudflareRecordPayload(body.record||{});}
  else if(action==='delete'){const id=validRecordId(body.record_id);if(!id)return json({detail:'record_id is required for delete.'},400);method='DELETE';path=`/zones/${encodeURIComponent(zone)}/dns_records/${encodeURIComponent(id)}`;payload={};}
  else return json({detail:'action must be create, update, or delete.'},400);
 }catch(e){return json({detail:clip(e?.message||e,500)},400);}
 const target=new URL('/api/cloudflare/actions',request.url);
 const staged=new Request(target,{method:'POST',headers:request.headers,body:JSON.stringify({method,path,body:payload})});
 return handleMagnanimousCloudflare(staged,env);
}
async function cloudflareRecords(request,env){
 const url=new URL(request.url),zone=validZoneId(url.searchParams.get('zone_id')||env.CLOUDFLARE_PLATFORM_ZONE_ID);if(!zone)return json({detail:'A Cloudflare zone_id is required.'},400);
 const params=new URLSearchParams();const name=normalizeName(url.searchParams.get('name')||'');const type=normalizeType(url.searchParams.get('type')||'');if(name)params.set('name',name);if(type)params.set('type',type);params.set('per_page','100');
 const apiPath=`/zones/${encodeURIComponent(zone)}/dns_records?${params.toString()}`;
 const target=new URL('/api/cloudflare/read',request.url);
 const delegated=new Request(target,{method:'POST',headers:request.headers,body:JSON.stringify({path:apiPath})});
 return handleMagnanimousCloudflare(delegated,env);
}

export async function handleMagnanimousDns(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/magnanimous/dns'))return null;
 if(!env?.DB)return json({detail:'DNS intelligence requires D1-backed Magnanimous authentication.'},503);
 const user=await currentUser(request,env);if(!user)return json({detail:'Sign in required.'},401);
 const registrar=await handleMagnanimousPorkbunDns(request,env,user);if(registrar)return registrar;
 if(request.method==='GET'&&(path==='/api/magnanimous/dns'||path==='/api/magnanimous/dns/capabilities'))return json({identity:'Magnanimous AI',capability:'dns-domain-intelligence',read_tools:['dns lookup','multi-resolver propagation comparison','DNSSEC visibility','MX/SPF/DKIM/DMARC diagnostics','reverse DNS','RDAP registration context','domain diagnosis','domain pricing','registrar DNS portfolio','Cloudflare DNS record inventory'],record_types:[...DNS_TYPES],resolvers:Object.fromEntries(Object.entries(RESOLVERS).map(([id,r])=>[id,r.name])),write_path:{provider:'Cloudflare',mode:'owner-only staged mutation with separate confirmation',stage_endpoint:'/api/magnanimous/dns/cloudflare/stage',confirmation:'uses existing /api/cloudflare/actions/{id}/confirm safety gate'},provider_identity_public:false});
 if(request.method==='POST'&&path==='/api/magnanimous/dns/lookup'){
  const body=await request.json().catch(()=>({})),name=normalizeName(body.name),type=normalizeType(body.type),resolver=String(body.resolver||'all').toLowerCase();if(!name||!type)return json({detail:'Valid name and supported type are required.'},400);if(resolver!=='all'&&!RESOLVERS[resolver])return json({detail:'resolver must be all, cloudflare, or google.'},400);return json({name,type,results:await lookup(name,type,resolver)});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/propagation'){
  const body=await request.json().catch(()=>({})),name=normalizeName(body.name),type=normalizeType(body.type);if(!name||!type)return json({detail:'Valid name and supported type are required.'},400);const results=await lookup(name,type,'all');return json({name,type,comparison:compareResults(results),results});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/email-security'){
  const body=await request.json().catch(()=>({})),domain=baseDomain(body.domain);if(!domain)return json({detail:'A valid domain is required.'},400);const selectors=Array.isArray(body.dkim_selectors)?body.dkim_selectors:[];return json(await emailSecurity(domain,selectors));
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/reverse'){
  const body=await request.json().catch(()=>({})),ptr=reverseName(clip(body.ip,128));if(!ptr)return json({detail:'A valid IPv4 or IPv6 address is required.'},400);return json({ip:clip(body.ip,128),ptr_name:ptr,results:await lookup(ptr,'PTR','all')});
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/rdap'){
  const body=await request.json().catch(()=>({})),domain=baseDomain(body.domain);if(!domain)return json({detail:'A valid domain is required.'},400);try{return json({domain,rdap:await rdap(domain),privacy:'Registrant contact fields are intentionally not returned by Magnanimous.'});}catch(e){return json({detail:'RDAP lookup failed.',error:clip(e?.message||e,500)},502);}
 }
 if(request.method==='POST'&&path==='/api/magnanimous/dns/diagnose'){
  const body=await request.json().catch(()=>({})),domain=baseDomain(body.domain);if(!domain)return json({detail:'A valid domain is required.'},400);const selectors=Array.isArray(body.dkim_selectors)?body.dkim_selectors:[];try{return json(await diagnose(domain,selectors));}catch(e){return json({detail:'DNS diagnosis failed.',error:clip(e?.message||e,500)},502);}
 }
 if(request.method==='GET'&&path==='/api/magnanimous/dns/cloudflare/records')return cloudflareRecords(request,env);
 if(request.method==='POST'&&path==='/api/magnanimous/dns/cloudflare/stage')return stageCloudflareRecord(request,env);
 return json({detail:'Magnanimous DNS operation not found.'},404);
}
