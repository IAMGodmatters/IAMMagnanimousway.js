import { decrypt } from './integrations.js';

const now=()=>Math.floor(Date.now()/1000);
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback};

function cleanSearch(value){
  return String(value||'').replace(/[\r\n\t]+/g,' ').replace(/"+/g,' ').replace(/\s+/g,' ').trim().slice(0,500);
}

async function connection(env,tenantId,externalAccountId){
  const row=await env.DB.prepare(`SELECT id,tenant_id,provider,external_account_id,display_name,access_token,token_expires_at
    FROM integrations WHERE tenant_id=? AND provider='outlook' AND external_account_id=? LIMIT 1`)
    .bind(tenantId,externalAccountId).first();
  if(!row)throw new Error('Outlook mailbox is no longer connected.');
  const accessToken=await decrypt(row.access_token,env);
  if(!accessToken||accessToken.startsWith('managed:'))throw new Error('DIRECT_OUTLOOK_TOKEN_UNAVAILABLE');
  return{...row,access_token:accessToken};
}

async function graph(url,token){
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`,'ConsistencyLevel':'eventual'}});
  const text=await response.text();
  let data={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
  if(!response.ok||data?.error)throw new Error(data?.error?.message||`Outlook mailbox request failed (${response.status}).`);
  return data;
}

function normalize(message){
  return{
    id:message.id,
    from:message.from?.emailAddress?.address||message.from?.emailAddress?.name||'',
    to:(message.toRecipients||[]).map(x=>x?.emailAddress?.address||'').filter(Boolean),
    subject:message.subject||'(no subject)',
    date:message.receivedDateTime||'',
    is_read:!!message.isRead,
    snippet:String(message.bodyPreview||''),
    web_link:message.webLink||''
  };
}

export async function readOutlookMailbox(env,{tenantId,externalAccountId,query='',limit=20,inboxOnly=false}={}){
  if(!env?.DB)throw new Error('Integration database binding is not configured.');
  const conn=await connection(env,tenantId,externalAccountId);
  if(Number(conn.token_expires_at||0)>0&&Number(conn.token_expires_at)<=now()+60)throw new Error('OUTLOOK_TOKEN_REFRESH_REQUIRED');

  const top=clamp(limit,1,50,20);
  const search=cleanSearch(query);
  const base=inboxOnly
    ?'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'
    :'https://graph.microsoft.com/v1.0/me/messages';
  const url=new URL(base);
  url.searchParams.set('$top',String(top));
  url.searchParams.set('$select','id,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,webLink');
  if(search){
    url.searchParams.set('$search',`\"${search}\"`);
  }else{
    url.searchParams.set('$orderby','receivedDateTime desc');
  }
  const data=await graph(url.toString(),conn.access_token);
  const messages=(data.value||[]).map(normalize);
  return{provider:'outlook',mailbox:conn.display_name||conn.external_account_id,count:messages.length,query:search,inbox_only:!!inboxOnly,messages};
}
