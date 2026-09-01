const INTEGRATIONS = [
  { id:'google', name:'Google / Gmail', category:'email', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'] },
  { id:'facebook', name:'Facebook Pages', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['pages_show_list','pages_read_engagement','pages_manage_posts'] },
  { id:'instagram', name:'Instagram', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['instagram_basic','instagram_manage_comments','instagram_content_publish'] },
  { id:'whatsapp', name:'WhatsApp Business', category:'messaging', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['whatsapp_business_management','whatsapp_business_messaging'] },
  { id:'shopify', name:'Shopify', category:'commerce', auth:'shopify-oauth', env:['SHOPIFY_API_KEY','SHOPIFY_API_SECRET'], scopes:['read_products','write_products','read_orders','write_orders','read_customers','write_customers'] },
  { id:'outlook', name:'Microsoft Outlook', category:'email', auth:'oauth2', env:['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'], scopes:['openid','email','offline_access','Mail.Read','Mail.Send'] },
  { id:'slack', name:'Slack', category:'work', auth:'oauth2', env:['SLACK_CLIENT_ID','SLACK_CLIENT_SECRET'], scopes:['chat:write','channels:history','channels:read'] },
  { id:'discord', name:'Discord', category:'messaging', auth:'oauth2', env:['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET'], scopes:['identify','guilds','bot'] },
  { id:'telegram', name:'Telegram', category:'messaging', auth:'bot-token', env:[], scopes:[] },
  { id:'google-calendar', name:'Google Calendar', category:'calendar', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/calendar'] }
];

const json = (data, status=200) => Response.json(data, { status, headers: { 'cache-control':'no-store' } });
const now=()=>Math.floor(Date.now()/1000);
function configured(env, integration) { return integration.env.length===0 || integration.env.every(k => typeof env?.[k] === 'string' && env[k].trim()); }
function redirectUri(request, id){ return `${new URL(request.url).origin}/api/integrations/${id}/callback`; }
function stateToken(){ return crypto.randomUUID(); }
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}

async function sessionSecret(env){
  const configuredSecret=String(env.SESSION_SECRET||'').trim();
  if(configuredSecret)return configuredSecret;
  const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
  return String(row?.value||'');
}
async function hmac(secret,value){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function currentUser(request,env){
  const raw=request.headers.get('authorization')||'';
  if(!raw.startsWith('Bearer '))return null;
  const p=raw.slice(7).split('|');
  if(p.length!==5||Number(p[3])<now())return null;
  const [userId,tenantId,role,exp,sig]=p,secret=await sessionSecret(env);
  if(!secret||sig!==await hmac(secret,`${userId}|${tenantId}|${role}|${exp}`))return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first();
}
async function credentialKey(env){
  const source=String(env.INTEGRATION_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();
  if(!source)throw new Error('Integration credential encryption is not available.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`iam-integrations-v1:${source}`));
  return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(value,env){
  if(!value)return '';
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await credentialKey(env);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(String(value)));
  return `enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}
function safeMetadata(token){
  const copy={...(token||{})};
  delete copy.access_token;delete copy.refresh_token;delete copy.id_token;delete copy.authed_user;
  if(copy.bot?.bot_access_token)copy.bot={...copy.bot,bot_access_token:'[encrypted]'};
  return copy;
}
async function ensureTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integrations (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,external_account_id TEXT NOT NULL DEFAULT '',display_name TEXT NOT NULL DEFAULT '',access_token TEXT NOT NULL DEFAULT '',refresh_token TEXT NOT NULL DEFAULT '',token_expires_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,provider,external_account_id))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integration_states (state TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}')`).run();
  try{await env.DB.prepare("ALTER TABLE integration_states ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'").run()}catch(_){}
}
async function storeConnection(env,{tenantId,provider,external,displayName,accessToken,refreshToken='',expiresAt=null,metadata={}}){
  const ts=now();
  await env.DB.prepare(`INSERT INTO integrations(tenant_id,provider,external_account_id,display_name,access_token,refresh_token,token_expires_at,metadata_json,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider,external_account_id) DO UPDATE SET display_name=excluded.display_name,access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
    .bind(tenantId,provider,external,displayName||'Connected',await encrypt(accessToken,env),await encrypt(refreshToken,env),expiresAt,JSON.stringify(metadata||{}),ts,ts).run();
}
function cleanShop(value){return String(value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'').replace(/[^a-z0-9.-]/g,'')}
function oauthUrl(provider, env, request, state, metadata={}){
  const redirect = encodeURIComponent(redirectUri(request,provider));
  const item=INTEGRATIONS.find(x=>x.id===provider);
  if(provider==='google'||provider==='google-calendar') return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&access_type=offline&prompt=consent&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='facebook'||provider==='instagram'||provider==='whatsapp') return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(env.META_APP_ID)}&redirect_uri=${redirect}&response_type=code&scope=${encodeURIComponent(item.scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='outlook') return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(env.MICROSOFT_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&response_mode=query&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='slack') return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(env.SLACK_CLIENT_ID)}&redirect_uri=${redirect}&scope=${encodeURIComponent(item.scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='discord') return `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(env.DISCORD_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='shopify'){
    const shop=cleanShop(metadata.shop_domain);if(!shop)return null;
    return `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(env.SHOPIFY_API_KEY)}&scope=${encodeURIComponent(item.scopes.join(','))}&redirect_uri=${redirect}&state=${encodeURIComponent(state)}`;
  }
  return null;
}
async function tokenExchange(provider, env, request, code, metadata={}){
  const redirect=redirectUri(request,provider);let url,body,headers={'content-type':'application/x-www-form-urlencoded'};
  if(provider==='google'||provider==='google-calendar'){url='https://oauth2.googleapis.com/token';body=new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='facebook'||provider==='instagram'||provider==='whatsapp'){url='https://graph.facebook.com/v23.0/oauth/access_token';body=new URLSearchParams({client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,redirect_uri:redirect,code});}
  else if(provider==='outlook'){url='https://login.microsoftonline.com/common/oauth2/v2.0/token';body=new URLSearchParams({code,client_id:env.MICROSOFT_CLIENT_ID,client_secret:env.MICROSOFT_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='slack'){url='https://slack.com/api/oauth.v2.access';body=new URLSearchParams({code,client_id:env.SLACK_CLIENT_ID,client_secret:env.SLACK_CLIENT_SECRET,redirect_uri:redirect});}
  else if(provider==='discord'){url='https://discord.com/api/oauth2/token';body=new URLSearchParams({code,client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='shopify'){
    const shop=cleanShop(metadata.shop_domain);if(!shop)throw new Error('Shopify store domain is missing.');
    url=`https://${shop}/admin/oauth/access_token`;headers={'content-type':'application/json'};body=JSON.stringify({client_id:env.SHOPIFY_API_KEY,client_secret:env.SHOPIFY_API_SECRET,code});
  } else throw new Error('Provider does not use OAuth');
  const r=await fetch(url,{method:'POST',headers,body});const d=await r.json();if(!r.ok||d.error||d.ok===false)throw new Error(d.error_description||d.error?.message||d.error||'OAuth exchange failed');return d;
}

export async function handleIntegrations(request, env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/integrations'))return null;
  try{
    if(!env?.DB)return json({error:'Integration database binding is not configured.'},503);
    await ensureTable(env);

    if(request.method==='GET'&&url.pathname==='/api/integrations'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to view your connections.'},401);
      const {results}=await env.DB.prepare('SELECT provider,external_account_id,display_name,token_expires_at,created_at,updated_at FROM integrations WHERE tenant_id=? ORDER BY provider,updated_at DESC').bind(user.tenant_id).all();
      const rows=results||[];
      return json({integrations:INTEGRATIONS.map(i=>({id:i.id,name:i.name,category:i.category,auth:i.auth,configured:configured(env,i),connected:rows.filter(x=>x.provider===i.id).map(x=>({external_account_id:x.external_account_id,display_name:x.display_name,token_expires_at:x.token_expires_at}))})),connected_count:rows.length,tenant_id:user.tenant_id});
    }

    const manual=url.pathname.match(/^\/api\/integrations\/telegram\/manual$/);
    if(manual&&request.method==='POST'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to connect Telegram.'},401);
      const b=await request.json(),token=String(b.token||'').trim();if(!token)return json({error:'Telegram bot token is required.'},400);
      const r=await fetch(`https://api.telegram.org/bot${token}/getMe`),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.description||'Telegram token could not be verified.');
      const bot=d.result||{},external=String(bot.id||crypto.randomUUID()),display=bot.username?`@${bot.username}`:(bot.first_name||'Telegram Bot');
      await storeConnection(env,{tenantId:user.tenant_id,provider:'telegram',external,displayName:display,accessToken:token,metadata:{bot_id:bot.id,username:bot.username,first_name:bot.first_name}});
      return json({ok:true,connected:{external_account_id:external,display_name:display}},201);
    }

    const disconnect=url.pathname.match(/^\/api\/integrations\/([^/]+)\/disconnect$/);
    if(disconnect&&request.method==='DELETE'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to manage connections.'},401);
      await env.DB.prepare('DELETE FROM integrations WHERE tenant_id=? AND provider=?').bind(user.tenant_id,disconnect[1]).run();
      return json({ok:true});
    }

    const m=url.pathname.match(/^\/api\/integrations\/([^/]+)\/?(connect|callback)?$/);
    if(!m)return json({error:'Integration endpoint not found.'},404);
    const provider=m[1],action=m[2]||'',item=INTEGRATIONS.find(x=>x.id===provider);
    if(!item)return json({error:'Unknown integration'},404);

    if(action==='connect'&&request.method==='POST'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to connect an account.'},401);
      if(!configured(env,item))return json({error:`${item.name} is not configured yet. Add the required platform OAuth credentials as Cloudflare secrets.`},503);
      if(item.auth==='bot-token')return json({error:'Use the Telegram token connection form.'},400);
      const body=await request.json().catch(()=>({})),metadata={shop_domain:provider==='shopify'?cleanShop(body.shop_domain):''};
      if(provider==='shopify'&&!metadata.shop_domain)return json({error:'Enter your Shopify store domain, for example your-store.myshopify.com.'},400);
      const state=stateToken();
      await env.DB.prepare('INSERT INTO integration_states(state,tenant_id,provider,created_at,expires_at,metadata_json) VALUES(?,?,?,?,?,?)').bind(state,user.tenant_id,provider,now(),now()+600,JSON.stringify(metadata)).run();
      const target=oauthUrl(provider,env,request,state,metadata);if(!target)return json({error:'Authorization URL could not be created.'},501);
      return json({authorization_url:target});
    }

    if(action==='callback'&&request.method==='GET'){
      const state=url.searchParams.get('state'),code=url.searchParams.get('code');if(!state||!code)return json({error:'OAuth callback missing state or code'},400);
      const row=await env.DB.prepare('SELECT tenant_id,provider,expires_at,metadata_json FROM integration_states WHERE state=?').bind(state).first();
      if(!row||row.provider!==provider||row.expires_at<now())return json({error:'OAuth state expired or invalid'},400);
      let metadata={};try{metadata=JSON.parse(row.metadata_json||'{}')}catch{}
      const token=await tokenExchange(provider,env,request,code,metadata);
      const access=String(token.access_token||token.bot?.bot_access_token||''),refresh=String(token.refresh_token||'');if(!access)throw new Error('Provider did not return an access token.');
      const external=String(token.user_id||token.team?.id||token.bot_user_id||metadata.shop_domain||access.slice(-12)||crypto.randomUUID());
      const display=String(token.team?.name||metadata.shop_domain||'Connected');
      await storeConnection(env,{tenantId:row.tenant_id,provider,external,displayName:display,accessToken:access,refreshToken:refresh,expiresAt:token.expires_in?now()+Number(token.expires_in):null,metadata:{...safeMetadata(token),...metadata}});
      await env.DB.prepare('DELETE FROM integration_states WHERE state=?').bind(state).run();
      return Response.redirect(new URL('/connections?integration='+encodeURIComponent(provider)+'&connected=1',request.url),302);
    }

    return json({error:'Unsupported integration operation'},400);
  }catch(e){console.error('integrations error',e);return json({error:e?.message||'Integration service error'},500);}
}

export { INTEGRATIONS };
