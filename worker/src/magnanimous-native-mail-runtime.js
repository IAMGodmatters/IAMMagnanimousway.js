import { currentUser } from './integrations.js';
import { handleAssistantIntegrations } from './assistant-integrations-runtime.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback};

async function accountsFor(env,user){
  if(!env?.DB)return[];
  const {results=[]}=await env.DB.prepare(`SELECT provider,external_account_id,display_name,token_expires_at,updated_at
    FROM integrations
    WHERE tenant_id=? AND provider IN ('google','outlook')
    ORDER BY provider,updated_at DESC`).bind(user.tenant_id).all();
  return results||[];
}

function requestHeaders(request){
  const headers=new Headers({'content-type':'application/json'});
  const auth=request.headers.get('authorization');
  if(auth)headers.set('authorization',auth);
  return headers;
}

async function runMailAction(request,env,account,action,payload){
  const target=new URL('/api/assistant-integrations/actions',request.url).toString();
  const nested=new Request(target,{method:'POST',headers:requestHeaders(request),body:JSON.stringify({provider:account.provider,external_account_id:account.external_account_id,action,payload})});
  const response=await handleAssistantIntegrations(nested,env);
  if(!response)return{ok:false,status:500,error:'Email action router did not handle the request.'};
  const data=await response.clone().json().catch(()=>({}));
  if(!response.ok)return{ok:false,status:response.status,error:String(data.error||data.detail||'Email action failed.'),data};
  return{ok:true,status:response.status,data};
}

function accountMeta(account){
  return{provider:account.provider,external_account_id:account.external_account_id,display_name:account.display_name||account.external_account_id,token_expires_at:account.token_expires_at||null};
}

function normalizeTerms(value){
  if(Array.isArray(value))return value.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean).slice(0,12);
  return String(value||'').toLowerCase().split(/\s+/).map(x=>x.trim()).filter(x=>x&&!x.includes(':')&&x.length>1).slice(0,12);
}

function matchesTerms(message,terms){
  if(!terms.length)return true;
  const hay=[message?.from,message?.to,message?.subject,message?.snippet].flat().join(' ').toLowerCase();
  return terms.every(term=>hay.includes(term));
}

function messageTimestamp(message){
  const t=Date.parse(String(message?.date||''));
  return Number.isFinite(t)?t:0;
}

async function scanAccounts(request,env,accounts,{query='',terms=[],limitPerAccount=20,inboxOnly=false}={}){
  const jobs=accounts.map(async account=>{
    const payload={limit:limitPerAccount};
    if(account.provider==='google')payload.query=String(query||'').trim()||(inboxOnly?'in:inbox':'');
    const result=await runMailAction(request,env,account,'read_mail',payload);
    if(!result.ok)return{account:accountMeta(account),ok:false,status:result.status,error:result.error,messages:[]};
    let messages=Array.isArray(result.data?.result?.messages)?result.data.result.messages:[];
    if(account.provider==='outlook'&&terms.length)messages=messages.filter(m=>matchesTerms(m,terms));
    return{account:accountMeta(account),ok:true,status:result.status,messages:messages.map(message=>({...message,account_provider:account.provider,account_id:account.external_account_id,account_name:account.display_name||account.external_account_id}))};
  });
  const rows=await Promise.all(jobs);
  const messages=rows.flatMap(x=>x.messages||[]).sort((a,b)=>messageTimestamp(b)-messageTimestamp(a));
  return{rows,messages};
}

export async function handleMagnanimousNativeMail(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/api/magnanimous/mail'))return null;
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to use Magnanimous Mail.'},401);

  const accounts=await accountsFor(env,user);

  if(request.method==='GET'&&path==='/api/magnanimous/mail/accounts'){
    return json({operator:'Magnanimous AI',execution_mode:'native-direct-mail',superhuman_required:false,accounts:accounts.map(accountMeta),count:accounts.length,supported_providers:['google','outlook']});
  }

  if(request.method==='POST'&&path==='/api/magnanimous/mail/search'){
    const body=await request.json().catch(()=>({}));
    if(!accounts.length)return json({detail:'No Gmail or Outlook accounts are connected to Magnanimous yet.',code:'NO_MAIL_ACCOUNTS'},409);
    const query=String(body.query||'').trim();
    const terms=normalizeTerms(body.terms?.length?body.terms:query);
    if(!query&&!terms.length)return json({detail:'Enter a mail search query or search terms.'},400);
    const limitPerAccount=clamp(body.limit_per_account,1,20,20);
    const scanned=await scanAccounts(request,env,accounts,{query,terms,limitPerAccount,inboxOnly:false});
    return json({operator:'Magnanimous AI',execution_mode:'native-direct-mail',superhuman_used:false,accounts_scanned:accounts.length,accounts_succeeded:scanned.rows.filter(x=>x.ok).length,accounts_failed:scanned.rows.filter(x=>!x.ok).map(x=>({account:x.account,error:x.error,status:x.status})),query,terms,messages:scanned.messages,count:scanned.messages.length});
  }

  if(request.method==='POST'&&path==='/api/magnanimous/mail/inbox'){
    const body=await request.json().catch(()=>({}));
    if(!accounts.length)return json({detail:'No Gmail or Outlook accounts are connected to Magnanimous yet.',code:'NO_MAIL_ACCOUNTS'},409);
    const limitPerAccount=clamp(body.limit_per_account,1,20,10);
    const query=String(body.query||'').trim();
    const terms=normalizeTerms(query);
    const scanned=await scanAccounts(request,env,accounts,{query,terms,limitPerAccount,inboxOnly:true});
    return json({operator:'Magnanimous AI',execution_mode:'native-direct-mail',superhuman_used:false,accounts_scanned:accounts.length,messages:scanned.messages,count:scanned.messages.length,failures:scanned.rows.filter(x=>!x.ok).map(x=>({account:x.account,error:x.error,status:x.status}))});
  }

  if(request.method==='POST'&&path==='/api/magnanimous/mail/send'){
    const body=await request.json().catch(()=>({}));
    if(body.confirm!==true)return json({detail:'Explicit confirmation is required before sending email through Magnanimous Mail.',code:'CONFIRMATION_REQUIRED'},409);
    const provider=String(body.provider||'').trim();
    const accountId=String(body.external_account_id||'').trim();
    const account=accounts.find(x=>x.provider===provider&&String(x.external_account_id)===accountId);
    if(!account)return json({detail:'Choose one connected Gmail or Outlook account before sending.'},404);
    const payload={to:body.to,cc:body.cc,bcc:body.bcc,subject:body.subject,body:body.body||body.text};
    const result=await runMailAction(request,env,account,'send_mail',payload);
    if(!result.ok)return json({detail:result.error,status:result.status,account:accountMeta(account)},result.status||502);
    return json({ok:true,operator:'Magnanimous AI',execution_mode:'native-direct-mail',superhuman_used:false,account:accountMeta(account),result:result.data?.result||result.data});
  }

  return json({detail:'Magnanimous Mail endpoint not found.'},404);
}
