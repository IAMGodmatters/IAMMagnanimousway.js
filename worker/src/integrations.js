const INTEGRATIONS = [
  { id:'google', name:'Google / Gmail', category:'email', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'] },
  { id:'facebook', name:'Facebook Pages', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['pages_show_list','pages_read_engagement','pages_manage_posts'] },
  { id:'instagram', name:'Instagram', category:'social', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['instagram_basic','instagram_manage_comments','instagram_content_publish'] },
  { id:'whatsapp', name:'WhatsApp Business', category:'messaging', auth:'meta-oauth', env:['META_APP_ID','META_APP_SECRET'], scopes:['whatsapp_business_management','whatsapp_business_messaging'] },
  { id:'shopify', name:'Shopify', category:'commerce', auth:'shopify-oauth', env:['SHOPIFY_API_KEY','SHOPIFY_API_SECRET'], scopes:['read_products','write_products','read_orders','write_orders','read_customers','write_customers'] },
  { id:'outlook', name:'Microsoft Outlook', category:'email', auth:'oauth2', env:['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'], scopes:['openid','email','offline_access','Mail.Read','Mail.Send'] },
  { id:'slack', name:'Slack', category:'work', auth:'oauth2', env:['SLACK_CLIENT_ID','SLACK_CLIENT_SECRET'], scopes:['chat:write','channels:history','channels:read'] },
  { id:'discord', name:'Discord', category:'messaging', auth:'oauth2', env:['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET'], scopes:['identify','guilds','bot'] },
  { id:'telegram', name:'Telegram', category:'messaging', auth:'bot-token', env:['TELEGRAM_BOT_TOKEN'], scopes:[] },
  { id:'google-calendar', name:'Google Calendar', category:'calendar', auth:'oauth2', env:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], scopes:['openid','email','https://www.googleapis.com/auth/calendar'] }
];

function configured(env, integration) { return integration.env.every(k => typeof env?.[k] === 'string' && env[k].trim()); }
function now(){ return Math.floor(Date.now()/1000); }
function redirectUri(request, id){ return `${new URL(request.url).origin}/api/integrations/${id}/callback`; }
function stateToken(){ return crypto.randomUUID(); }

async function ensureTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integrations (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,external_account_id TEXT NOT NULL DEFAULT '',display_name TEXT NOT NULL DEFAULT '',access_token TEXT NOT NULL DEFAULT '',refresh_token TEXT NOT NULL DEFAULT '',token_expires_at INTEGER,metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(tenant_id,provider,external_account_id))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS integration_states (state TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,provider TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL)`).run();
}
async function tenantForRequest(env, request){
  // Owner fallback keeps the connector framework usable before multi-user session
  // middleware is wired into every route. Production sessions should supply tenant_id.
  const owner = await env.DB.prepare("SELECT id FROM tenants WHERE slug='owner' LIMIT 1").first();
  return owner?.id || 'owner';
}
function oauthUrl(provider, env, request, state){
  const redirect = encodeURIComponent(redirectUri(request,provider));
  if(provider==='google'||provider==='google-calendar') return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&access_type=offline&prompt=consent&scope=${encodeURIComponent(INTEGRATIONS.find(x=>x.id===provider).scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='facebook'||provider==='instagram'||provider==='whatsapp') return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(env.META_APP_ID)}&redirect_uri=${redirect}&response_type=code&scope=${encodeURIComponent(INTEGRATIONS.find(x=>x.id===provider).scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='outlook') return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(env.MICROSOFT_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&response_mode=query&scope=${encodeURIComponent(INTEGRATIONS.find(x=>x.id===provider).scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  if(provider==='slack') return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(env.SLACK_CLIENT_ID)}&redirect_uri=${redirect}&scope=${encodeURIComponent(INTEGRATIONS.find(x=>x.id===provider).scopes.join(','))}&state=${encodeURIComponent(state)}`;
  if(provider==='discord') return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(env.DISCORD_CLIENT_ID)}&redirect_uri=${redirect}&response_type=code&scope=${encodeURIComponent(INTEGRATIONS.find(x=>x.id===provider).scopes.join(' '))}&state=${encodeURIComponent(state)}`;
  return null;
}
async function tokenExchange(provider, env, request, code){
  const redirect = redirectUri(request,provider);
  let url, body, headers={'content-type':'application/x-www-form-urlencoded'};
  if(provider==='google'||provider==='google-calendar'){ url='https://oauth2.googleapis.com/token'; body=new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'}); }
  else if(provider==='facebook'||provider==='instagram'||provider==='whatsapp'){ url='https://graph.facebook.com/v23.0/oauth/access_token'; body=new URLSearchParams({client_id:env.META_APP_ID,client_secret:env.META_APP_SECRET,redirect_uri:redirect,code}); }
  else if(provider==='outlook'){ url='https://login.microsoftonline.com/common/oauth2/v2.0/token'; body=new URLSearchParams({code,client_id:env.MICROSOFT_CLIENT_ID,client_secret:env.MICROSOFT_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'}); }
  else if(provider==='slack'){ url='https://slack.com/api/oauth.v2.access'; body=new URLSearchParams({code,client_id:env.SLACK_CLIENT_ID,client_secret:env.SLACK_CLIENT_SECRET,redirect_uri:redirect}); }
  else if(provider==='discord'){ url='https://discord.com/api/oauth2/token'; body=new URLSearchParams({code,client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,redirect_uri:redirect,grant_type:'authorization_code'}); }
  else throw new Error('Provider does not use OAuth');
  const r=await fetch(url,{method:'POST',headers,body}); const d=await r.json(); if(!r.ok||d.error) throw new Error(d.error_description||d.error?.message||d.error||'OAuth exchange failed'); return d;
}

export async function handleIntegrations(request, env){
  if(!env?.DB) return null;
  const url=new URL(request.url); if(!url.pathname.startsWith('/api/integrations')) return null;
  await ensureTable(env);
  if(request.method==='GET' && url.pathname==='/api/integrations'){
    const tenant=await tenantForRequest(env,request); const {results}=await env.DB.prepare('SELECT provider,external_account_id,display_name,token_expires_at,created_at,updated_at FROM integrations WHERE tenant_id=? ORDER BY provider,updated_at DESC').bind(tenant).all();
    return Response.json({ integrations: INTEGRATIONS.map(i=>({id:i.id,name:i.name,category:i.category,auth:i.auth,configured:configured(env,i),connected:(results||[]).filter(x=>x.provider===i.id).map(x=>({external_account_id:x.external_account_id,display_name:x.display_name,token_expires_at:x.token_expires_at}))})), connected_count:(results||[]).length });
  }
  const m=url.pathname.match(/^\/api\/integrations\/([^/]+)\/?(connect|callback)?$/); if(!m) return Response.json({error:'Not found'},404);
  const provider=m[1]; const action=m[2]||''; const item=INTEGRATIONS.find(x=>x.id===provider); if(!item) return Response.json({error:'Unknown integration'},404);
  if(action==='connect' && request.method==='GET'){
    if(!configured(env,item)) return Response.json({error:`${item.name} is not configured yet. Add the required OAuth credentials as Cloudflare secrets.`},503);
    if(item.auth==='bot-token') return Response.json({error:'This connector uses a bot token rather than OAuth.'},400);
    const state=stateToken(), tenant=await tenantForRequest(env,request); await env.DB.prepare('INSERT INTO integration_states(state,tenant_id,provider,created_at,expires_at) VALUES(?,?,?,?,?)').bind(state,tenant,provider,now(),now()+600).run();
    const target=oauthUrl(provider,env,request,state); return Response.redirect(target,302);
  }
  if(action==='callback' && request.method==='GET'){
    const state=url.searchParams.get('state'), code=url.searchParams.get('code'); if(!state||!code) return Response.json({error:'OAuth callback missing state or code'},400);
    const row=await env.DB.prepare('SELECT tenant_id,provider,expires_at FROM integration_states WHERE state=?').bind(state).first(); if(!row||row.provider!==provider||row.expires_at<now()) return Response.json({error:'OAuth state expired or invalid'},400);
    const token=await tokenExchange(provider,env,request,code); const external=String(token.user_id||token.team?.id||token.bot_user_id||token.access_token?.slice(-12)||crypto.randomUUID());
    await env.DB.prepare('INSERT INTO integrations(tenant_id,provider,external_account_id,display_name,access_token,refresh_token,token_expires_at,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id,provider,external_account_id) DO UPDATE SET access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at').bind(row.tenant_id,provider,external,'Connected',token.access_token||'',token.refresh_token||'',token.expires_in?now()+Number(token.expires_in):null,JSON.stringify(token),now(),now()).run();
    await env.DB.prepare('DELETE FROM integration_states WHERE state=?').bind(state).run();
    return Response.redirect(new URL('/?integration='+encodeURIComponent(provider)+'&connected=1',request.url),302);
  }
  return Response.json({error:'Unsupported integration operation'},400);
}

export { INTEGRATIONS };