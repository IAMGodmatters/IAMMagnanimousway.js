const INTEGRATIONS = [
  { id:'google', name:'Google / Gmail', category:'email', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'], capabilities:['read_mail','send_mail'] },
  { id:'facebook', name:'Facebook Pages', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['pages_show_list','pages_read_engagement','pages_manage_posts'], capabilities:['read_pages','read_engagement','publish_posts'] },
  { id:'instagram', name:'Instagram Business', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['instagram_basic','instagram_manage_comments','instagram_content_publish','pages_show_list'], capabilities:['read_profile','read_media','publish_media','moderate_comments'] },
  { id:'whatsapp', name:'WhatsApp Business', category:'messaging', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['whatsapp_business_management','whatsapp_business_messaging'], capabilities:['send_messages','customer_support'] },
  { id:'shopify', name:'Shopify', category:'commerce', auth:'shopify-oauth', env:['SHOPIFY_API_KEY','SHOPIFY_API_SECRET'], scopes:['read_products','write_products','read_orders','write_orders','read_customers','write_customers'], capabilities:['read_products','manage_products','read_orders','read_customers'] },
  { id:'shopee', name:'Shopee Seller', category:'commerce', auth:'shopee-oauth', env:['SHOPEE_PARTNER_ID','SHOPEE_PARTNER_KEY'], scopes:[], capabilities:['read_products','manage_products','read_orders'] },
  { id:'x', name:'X', category:'social', auth:'oauth2-pkce', env:['X_CLIENT_ID','X_CLIENT_SECRET'], scopes:['tweet.read','tweet.write','users.read','offline.access'], capabilities:['read_profile','read_posts','publish_posts'] },
  { id:'snapchat', name:'Snapchat Business', category:'social', auth:'snap-oauth', env:['SNAPCHAT_CLIENT_ID','SNAPCHAT_CLIENT_SECRET'], scopes:['snapchat-marketing-api'], capabilities:['read_ad_accounts','manage_campaigns','analytics'] },
  { id:'outlook', name:'Microsoft Outlook', category:'email', auth:'oauth2', env:['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'], scopes:['openid','email','offline_access','Mail.Read','Mail.Send'], capabilities:['read_mail','send_mail'] },
  { id:'slack', name:'Slack', category:'work', auth:'oauth2', env:['SLACK_CLIENT_ID','SLACK_CLIENT_SECRET'], scopes:['chat:write','channels:history','channels:read'], capabilities:['read_channels','send_messages'] },
  { id:'discord', name:'Discord', category:'messaging', auth:'oauth2', env:['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET'], scopes:['identify','guilds','bot'], capabilities:['read_guilds','send_messages'] },
  { id:'telegram', name:'Telegram', category:'messaging', auth:'bot-token', env:[], scopes:[], capabilities:['send_messages'] },
  { id:'google-calendar', name:'Google Calendar', category:'calendar', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/calendar'], capabilities:['read_calendar','manage_calendar'] }
];

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
function configured(env,integration){return integration.env.length===0||integration.env.every(k=>typeof env?.[k]==='string'&&env[k].trim())}
function redirectUri(request,id){return `${new URL(request.url).origin}/api/integrations/${id}/callback`}
function stateToken(){return crypto.randomUUID()}
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromB64(value){const s=atob(value);return Uint8Array.from(s,c=>c.charCodeAt(0))}
function safeOrigin(value,fallback=''){try{const u=new URL(String(value||''));return(u.protocol==='https:'||u.protocol==='http:')?u.origin:fallback}catch{return fallback}}
function cleanShop(value){return String(value||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'').replace(/[^a-z0-9.-]/g,'')}
function safeMetadata(token){const copy={...(token||{})};delete copy.access_token;delete copy.refresh_token;delete copy.id_token;delete copy.authed_user;if(copy.bot?.bot_access_token)copy.bot={...copy.bot,bot_access_token:'[encrypted]'};return copy}

async function sessionSecret(env){
  const configuredSecret=String(env.SESSION_SECRET||'').trim();
  if(configuredSecret)return configuredSecret;
  const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();
  return String(row?.value||'');
}
async function hmacHex(secret,value){
  const key=await crypto.subtle.importKey('raw',encoder.encode(String(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,encoder.encode(String(value)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function sha256b64url(value){return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(String(value)))))}
async function currentUser(request,env){
  const raw=request.headers.get('authorization')||'';if(!raw.startsWith('Bearer '))return null;
  const p=raw.slice(7).split('|');if(p.length!==5||Number(p[3])<now())return null;
  const [userId,tenantId,role,exp,sig]=p,secret=await sessionSecret(env);
  if(!secret||sig!==await hmacHex(secret,`${userId}|${tenantId}|${role}|${exp}`))return null;
  return env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first();
}
async function credentialKey(env){
  const source=String(env.INTEGRATION_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();
  if(!source)throw new Error('Integration credential encryption is not available.');
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`iam-integrations-v1:${source}`));
  return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(value,env){
  if(!value)return '';
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await credentialKey(env);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(String(value)));
  return `enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}
async function decrypt(value,env){
  if(!value)return '';
  const raw=String(value);if(!raw.startsWith('enc1.'))return raw;
  const [,ivPart,cipherPart]=raw.split('.');const key=await credentialKey(env);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(ivPart)},key,fromB64(cipherPart));
  return new TextDecoder().decode(plain);
}
async function ensureIntegrationTables(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integrations (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,external_account_id TEXT NOT NULL DEFAULT '',display_name TEXT NOT NULL DEFAULT '',access_token TEXT NOT NULL DEFAULT '',refresh_token TEXT NOT NULL DEFAULT '',token_expires_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,provider,external_account_id))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integration_states (state TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,metadata_json TEXT NOT NULL DEFAULT '{}')`).run();
  try{await env.DB.prepare("ALTER TABLE integration_states ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'").run()}catch(_){}
}
async function storeConnection(env,{tenantId,provider,external,displayName,accessToken,refreshToken='',expiresAt=null,metadata={}}){
  const ts=now();
  await env.DB.prepare(`INSERT INTO integrations(tenant_id,provider,external_account_id,display_name,access_token,refresh_token,token_expires_at,metadata_json,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider,external_account_id) DO UPDATE SET display_name=excluded.display_name,access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`)
    .bind(tenantId,provider,String(external||''),displayName||'Connected',await encrypt(accessToken,env),await encrypt(refreshToken,env),expiresAt,JSON.stringify(metadata||{}),ts,ts).run();
}
async function verifyShopifyCallback(url,secret){
  const received=url.searchParams.get('hmac');if(!received)return false;
  const pairs=[];for(const [k,v] of url.searchParams.entries())if(k!=='hmac'&&k!=='signature')pairs.push([k,v]);
  pairs.sort((a,b)=>a[0].localeCompare(b[0]));const message=pairs.map(([k,v])=>`${k}=${v}`).join('&');
  return (await hmacHex(secret,message))===received;
}
async function shopeeSign(env,path,timestamp,accessToken='',shopId=''){
  const partner=String(env.SHOPEE_PARTNER_ID||'');
  const base=accessToken&&shopId?`${partner}${path}${timestamp}${accessToken}${shopId}`:`${partner}${path}${timestamp}`;
  return hmacHex(env.SHOPEE_PARTNER_KEY,base);
}
async function oauthUrl(provider,env,request,state,metadata={}){
  const redirect=redirectUri(request,provider),encodedRedirect=encodeURIComponent(redirect),item=INTEGRATIONS.find(x=>x.id===provider);
  if(provider==='google'||provider==='google-calendar')return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodedRedirect}&response_type=code&access_type=offline&prompt=consent&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='facebook'||provider==='instagram')return `https://www.facebook.com/${env.META_GRAPH_VERSION||'v23.0'}/dialog/oauth?client_id=${encodeURIComponent(env.META_APP_ID)}&redirect_uri=${encodedRedirect}&response_type=code&scope=${encodeURIComponent(item.scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='whatsapp'){
    const config=String(env.WHATSAPP_CONFIG_ID||'').trim();
    if(config)return `https://www.facebook.com/${env.META_GRAPH_VERSION||'v23.0'}/dialog/oauth?client_id=${encodeURIComponent(env.META_APP_ID)}&redirect_uri=${encodedRedirect}&state=${encodeURIComponent(state)}&config_id=${encodeURIComponent(config)}&response_type=code&override_default_response_type=true`;
    return `https://www.facebook.com/${env.META_GRAPH_VERSION||'v23.0'}/dialog/oauth?client_id=${encodeURIComponent(env.META_APP_ID)}&redirect_uri=${encodedRedirect}&response_type=code&scope=${encodeURIComponent(item.scopes.join(','))}&state=${encodeURIComponent(state)}`;
  }
  if(provider==='outlook')return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(env.MICROSOFT_CLIENT_ID)}&redirect_uri=${encodedRedirect}&response_type=code&response_mode=query&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='slack')return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(env.SLACK_CLIENT_ID)}&redirect_uri=${encodedRedirect}&scope=${encodeURIComponent(item.scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='discord')return `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(env.DISCORD_CLIENT_ID)}&redirect_uri=${encodedRedirect}&response_type=code&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='shopify'){
    const shop=cleanShop(metadata.shop_domain);if(!shop)return null;
    return `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(env.SHOPIFY_API_KEY)}&scope=${encodeURIComponent(item.scopes.join(','))}&redirect_uri=${encodedRedirect}&state=${encodeURIComponent(state)}`;
  }
  if(provider==='x')return `https://x.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(env.X_CLIENT_ID)}&redirect_uri=${encodedRedirect}&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(metadata.code_challenge)}&code_challenge_method=S256`;
  if(provider==='snapchat')return `https://accounts.snapchat.com/login/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(env.SNAPCHAT_CLIENT_ID)}&redirect_uri=${encodedRedirect}&scope=${encodeURIComponent(item.scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='shopee'){
    const path='/api/v2/shop/auth_partner',timestamp=now(),sign=await shopeeSign(env,path,timestamp);
    return `https://partner.shopeemobile.com${path}?partner_id=${encodeURIComponent(env.SHOPEE_PARTNER_ID)}&timestamp=${timestamp}&sign=${sign}&redirect=${encodedRedirect}`;
  }
  return null;
}
async function tokenExchange(provider,env,request,code,metadata={},callbackUrl=null){
  const redirect=redirectUri(request,provider);let url,body,headers={'content-type':'application/x-www-form-urlencoded'};
  if(provider==='google'||provider==='google-calendar'){url='https://oauth2.googleapis.com/token';body=new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='facebook'||provider==='instagram'||provider==='whatsapp'){url=`https://graph.facebook.com/${env.META_GRAPH_VERSION||'v23.0'}/oauth/access_token`;body=new URLSearchParams({client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,redirect_uri:redirect,code});}
  else if(provider==='outlook'){url='https://login.microsoftonline.com/common/oauth2/v2.0/token';body=new URLSearchParams({code,client_id:env.MICROSOFT_CLIENT_ID,client_secret:env.MICROSOFT_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='slack'){url='https://slack.com/api/oauth.v2.access';body=new URLSearchParams({code,client_id:env.SLACK_CLIENT_ID,client_secret:env.SLACK_CLIENT_SECRET,redirect_uri:redirect});}
  else if(provider==='discord'){url='https://discord.com/api/oauth2/token';body=new URLSearchParams({code,client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});}
  else if(provider==='shopify'){
    const shop=cleanShop(metadata.shop_domain);if(!shop)throw new Error('Shopify store domain is missing.');
    if(callbackUrl&&!(await verifyShopifyCallback(callbackUrl,env.SHOPIFY_API_SECRET)))throw new Error('Shopify callback signature could not be verified.');
    url=`https://${shop}/admin/oauth/access_token`;headers={'content-type':'application/json'};body=JSON.stringify({client_id:env.SHOPIFY_API_KEY,client_secret:env.SHOPIFY_API_SECRET,code});
  }
  else if(provider==='x'){
    url='https://api.x.com/2/oauth2/token';body=new URLSearchParams({code,grant_type:'authorization_code',client_id:env.X_CLIENT_ID,redirect_uri:redirect,code_verifier:metadata.code_verifier});
    headers={...headers,Authorization:`Basic ${btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`)}`};
  }
  else if(provider==='snapchat'){
    url='https://accounts.snapchat.com/login/oauth2/access_token';body=new URLSearchParams({code,client_id:env.SNAPCHAT_CLIENT_ID,client_secret:env.SNAPCHAT_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'});
  }
  else if(provider==='shopee'){
    const shopId=String(callbackUrl?.searchParams.get('shop_id')||metadata.shop_id||'');if(!shopId)throw new Error('Shopee callback did not include a shop ID.');
    const path='/api/v2/auth/token/get',timestamp=now(),sign=await shopeeSign(env,path,timestamp);
    url=`https://partner.shopeemobile.com${path}?partner_id=${encodeURIComponent(env.SHOPEE_PARTNER_ID)}&timestamp=${timestamp}&sign=${sign}`;
    headers={'content-type':'application/json'};body=JSON.stringify({code,shop_id:Number(shopId),partner_id:Number(env.SHOPEE_PARTNER_ID)});
  }
  else throw new Error('Provider does not use OAuth');
  const r=await fetch(url,{method:'POST',headers,body});const d=await r.json();
  if(!r.ok||d.error||d.ok===false)throw new Error(d.error_description||d.message||d.error?.message||d.error||'OAuth exchange failed');
  return provider==='shopee'?(d.response||d):d;
}
async function metaAccounts(env,provider,access){
  const version=env.META_GRAPH_VERSION||'v23.0',fields=provider==='instagram'?'id,name,access_token,instagram_business_account{id,username}':'id,name,access_token';
  const r=await fetch(`https://graph.facebook.com/${version}/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(access)}`);if(!r.ok)return [];
  const d=await r.json();return d.data||[];
}
async function saveResolvedConnections(env,{provider,tenantId,token,metadata,callbackUrl}){
  const access=String(token.access_token||token.bot?.bot_access_token||''),refresh=String(token.refresh_token||'');if(!access)throw new Error('Provider did not return an access token.');
  const expiresAt=token.expires_in?now()+Number(token.expires_in):null;
  if(provider==='facebook'){
    const pages=await metaAccounts(env,provider,access);if(pages.length){for(const p of pages)await storeConnection(env,{tenantId,provider,external:p.id,displayName:p.name||'Facebook Page',accessToken:p.access_token||access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata,page_id:p.id}});return pages.length}
  }
  if(provider==='instagram'){
    const pages=await metaAccounts(env,provider,access);let count=0;for(const p of pages){const ig=p.instagram_business_account;if(!ig?.id)continue;await storeConnection(env,{tenantId,provider,external:ig.id,displayName:ig.username?`@${ig.username}`:(p.name||'Instagram Business'),accessToken:p.access_token||access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata,page_id:p.id,instagram_business_id:ig.id,username:ig.username}});count++}if(count)return count;
  }
  if(provider==='x'){
    const r=await fetch('https://api.x.com/2/users/me',{headers:{Authorization:`Bearer ${access}`}}),d=await r.json().catch(()=>({}));const u=d.data||{};
    await storeConnection(env,{tenantId,provider,external:u.id||access.slice(-12),displayName:u.username?`@${u.username}`:(u.name||'X Account'),accessToken:access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata,username:u.username}});return 1;
  }
  if(provider==='snapchat'){
    const r=await fetch('https://adsapi.snapchat.com/v1/me',{headers:{Authorization:`Bearer ${access}`}}),d=await r.json().catch(()=>({}));const me=d.me?.[0]?.me||d.me||d;
    await storeConnection(env,{tenantId,provider,external:String(me.id||access.slice(-12)),displayName:me.display_name||me.email||'Snapchat Business',accessToken:access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata}});return 1;
  }
  if(provider==='shopee'){
    const shopId=String(callbackUrl?.searchParams.get('shop_id')||metadata.shop_id||'');
    await storeConnection(env,{tenantId,provider,external:shopId||access.slice(-12),displayName:shopId?`Shopee Shop ${shopId}`:'Shopee Shop',accessToken:access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata,shop_id:shopId}});return 1;
  }
  const external=String(token.user_id||token.team?.id||token.bot_user_id||metadata.shop_domain||access.slice(-12)||crypto.randomUUID());
  const display=String(token.team?.name||metadata.shop_domain||({whatsapp:'WhatsApp Business'}[provider])||'Connected');
  await storeConnection(env,{tenantId,provider,external,displayName:display,accessToken:access,refreshToken:refresh,expiresAt,metadata:{...safeMetadata(token),...metadata}});return 1;
}

export async function handleIntegrations(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/integrations'))return null;
  try{
    if(!env?.DB)return json({error:'Integration database binding is not configured.'},503);await ensureIntegrationTables(env);
    if(request.method==='GET'&&url.pathname==='/api/integrations'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to view your connections.'},401);
      const {results}=await env.DB.prepare('SELECT provider,external_account_id,display_name,token_expires_at,created_at,updated_at FROM integrations WHERE tenant_id=? ORDER BY provider,updated_at DESC').bind(user.tenant_id).all();const rows=results||[];
      return json({integrations:INTEGRATIONS.map(i=>({id:i.id,name:i.name,category:i.category,auth:i.auth,configured:configured(env,i),capabilities:i.capabilities||[],connected:rows.filter(x=>x.provider===i.id).map(x=>({external_account_id:x.external_account_id,display_name:x.display_name,token_expires_at:x.token_expires_at}))})),connected_count:rows.length,tenant_id:user.tenant_id});
    }
    const manual=url.pathname.match(/^\/api\/integrations\/telegram\/manual$/);
    if(manual&&request.method==='POST'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to connect Telegram.'},401);const b=await request.json(),token=String(b.token||'').trim();if(!token)return json({error:'Telegram bot token is required.'},400);
      const r=await fetch(`https://api.telegram.org/bot${token}/getMe`),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.description||'Telegram token could not be verified.');const bot=d.result||{},external=String(bot.id||crypto.randomUUID()),display=bot.username?`@${bot.username}`:(bot.first_name||'Telegram Bot');
      await storeConnection(env,{tenantId:user.tenant_id,provider:'telegram',external,displayName:display,accessToken:token,metadata:{bot_id:bot.id,username:bot.username,first_name:bot.first_name}});return json({ok:true,connected:{external_account_id:external,display_name:display}},201);
    }
    const disconnect=url.pathname.match(/^\/api\/integrations\/([^/]+)\/disconnect$/);
    if(disconnect&&request.method==='DELETE'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to manage connections.'},401);await env.DB.prepare('DELETE FROM integrations WHERE tenant_id=? AND provider=?').bind(user.tenant_id,disconnect[1]).run();return json({ok:true});
    }
    const m=url.pathname.match(/^\/api\/integrations\/([^/]+)\/?(connect|callback)?$/);if(!m)return json({error:'Integration endpoint not found.'},404);
    const provider=m[1],action=m[2]||'',item=INTEGRATIONS.find(x=>x.id===provider);if(!item)return json({error:'Unknown integration'},404);
    if(action==='connect'&&request.method==='POST'){
      const user=await currentUser(request,env);if(!user)return json({error:'Sign in to connect an account.'},401);if(!configured(env,item))return json({error:`${item.name} is not configured yet. Add the required platform OAuth credentials as Cloudflare secrets.`},503);if(item.auth==='bot-token')return json({error:'Use the Telegram token connection form.'},400);
      const body=await request.json().catch(()=>({})),metadata={shop_domain:provider==='shopify'?cleanShop(body.shop_domain):'',return_origin:safeOrigin(request.headers.get('origin'),url.origin)};
      if(provider==='shopify'&&!metadata.shop_domain)return json({error:'Enter your Shopify store domain, for example your-store.myshopify.com.'},400);
      if(provider==='x'){const verifier=b64url(crypto.getRandomValues(new Uint8Array(48)));metadata.code_verifier=verifier;metadata.code_challenge=await sha256b64url(verifier)}
      const state=stateToken();await env.DB.prepare('INSERT INTO integration_states(state,tenant_id,provider,created_at,expires_at,metadata_json) VALUES(?,?,?,?,?,?)').bind(state,user.tenant_id,provider,now(),now()+600,JSON.stringify(metadata)).run();
      const target=await oauthUrl(provider,env,request,state,metadata);if(!target)return json({error:'Authorization URL could not be created.'},501);return json({authorization_url:target});
    }
    if(action==='callback'&&request.method==='GET'){
      const state=url.searchParams.get('state'),code=url.searchParams.get('code');if(!state||!code)return json({error:'OAuth callback missing state or code'},400);
      const row=await env.DB.prepare('SELECT tenant_id,provider,expires_at,metadata_json FROM integration_states WHERE state=?').bind(state).first();if(!row||row.provider!==provider||row.expires_at<now())return json({error:'OAuth state expired or invalid'},400);
      let metadata={};try{metadata=JSON.parse(row.metadata_json||'{}')}catch{}
      const token=await tokenExchange(provider,env,request,code,metadata,url);const count=await saveResolvedConnections(env,{provider,tenantId:row.tenant_id,token,metadata,callbackUrl:url});
      await env.DB.prepare('DELETE FROM integration_states WHERE state=?').bind(state).run();const returnOrigin=safeOrigin(metadata.return_origin,url.origin);
      return Response.redirect(new URL(`/connections?integration=${encodeURIComponent(provider)}&connected=${count}`,returnOrigin),302);
    }
    return json({error:'Unsupported integration operation'},400);
  }catch(e){console.error('integrations error',e);return json({error:e?.message||'Integration service error'},500)}
}

export {INTEGRATIONS,currentUser,decrypt,ensureIntegrationTables,shopeeSign};
