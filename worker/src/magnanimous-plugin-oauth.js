import { currentUser } from './integrations.js';

const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{'cache-control':'no-store',...extra}});
const now=()=>Math.floor(Date.now()/1000);
const encoder=new TextEncoder();
const OAUTH_SCOPES=Object.freeze([
 'capabilities.read','brain.ask','web.read','web.write','cloud.read','cloud.write',
 'mail.read','mail.write','communications.read','communications.write','offline_access'
]);
const PUBLIC_SCOPES=Object.freeze(['capabilities.read','brain.ask','web.read','offline_access']);
const DEFAULT_SCOPES=PUBLIC_SCOPES;
const PRIVILEGED_ROLES=Object.freeze(['owner','admin']);
const ACCESS_TTL=3600;
const REFRESH_TTL=60*60*24*30;
const CODE_TTL=300;

function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomToken(prefix){return prefix+b64url(crypto.getRandomValues(new Uint8Array(32)))}
async function digestBytes(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(String(value))))}
async function sha256Hex(value){return[...await digestBytes(value)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sha256B64(value){return b64url(await digestBytes(value))}
function clean(value,n=4000){return String(value??'').trim().slice(0,n)}
function origin(request){return new URL(request.url).origin}
function resource(request){return origin(request)+'/mcp'}
function parseJson(value,fallback=[]){try{return JSON.parse(value||'')}catch{return fallback}}
function parseScope(value){
 const raw=Array.isArray(value)?value:String(value||'').split(/\s+/);
 return[...new Set(raw.map(x=>String(x||'').trim()).filter(Boolean))];
}
function validatedScopes(value){
 const scopes=parseScope(value);
 const effective=scopes.length?scopes:[...DEFAULT_SCOPES];
 if(effective.some(scope=>!OAUTH_SCOPES.includes(scope)))return null;
 return effective;
}
function privilegedUser(user){return PRIVILEGED_ROLES.includes(String(user?.role||'').toLowerCase())}
function scopesForUser(user,requested=[]){
 const scopes=Array.isArray(requested)?requested:[];
 return privilegedUser(user)?scopes:scopes.filter(scope=>PUBLIC_SCOPES.includes(scope));
}
function oauthError(error,description,status=400,extra={}){
 return json({error,error_description:description},status,{'content-type':'application/json',...extra});
}
function openAiRedirect(value){
 try{
  const u=new URL(String(value||''));
  if(u.protocol!=='https:')return false;
  const h=u.hostname.toLowerCase();
  return h==='chatgpt.com'||h.endsWith('.chatgpt.com')||h==='openai.com'||h.endsWith('.openai.com');
 }catch{return false}
}
async function ensureSchema(env){
 if(!env?.DB)return;
 const sqls=[
  `CREATE TABLE IF NOT EXISTS magnanimous_oauth_clients(
    client_id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL DEFAULT 'ChatGPT',
    redirect_uris_json TEXT NOT NULL DEFAULT '[]',
    token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
    created_at INTEGER NOT NULL,
    last_used_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS magnanimous_oauth_codes(
    code_hash TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes_json TEXT NOT NULL DEFAULT '[]',
    code_challenge TEXT NOT NULL,
    resource TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS magnanimous_oauth_access_tokens(
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scopes_json TEXT NOT NULL DEFAULT '[]',
    resource TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS magnanimous_oauth_refresh_tokens(
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scopes_json TEXT NOT NULL DEFAULT '[]',
    resource TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,
    created_at INTEGER NOT NULL,
    rotated_at INTEGER
  )`,
  'CREATE INDEX IF NOT EXISTS idx_magnanimous_oauth_access_hash ON magnanimous_oauth_access_tokens(token_hash)',
  'CREATE INDEX IF NOT EXISTS idx_magnanimous_oauth_refresh_hash ON magnanimous_oauth_refresh_tokens(token_hash)',
  'CREATE INDEX IF NOT EXISTS idx_magnanimous_oauth_codes_client ON magnanimous_oauth_codes(client_id,expires_at)'
 ];
 for(const sql of sqls)await env.DB.prepare(sql).run();
}

async function client(env,clientId){
 return env.DB.prepare('SELECT client_id,client_name,redirect_uris_json,token_endpoint_auth_method FROM magnanimous_oauth_clients WHERE client_id=?').bind(clientId).first();
}
function redirectAllowed(row,redirectUri){
 const redirects=parseJson(row?.redirect_uris_json,[]);
 return Array.isArray(redirects)&&redirects.includes(redirectUri);
}
async function validateAuthorization(env,requestLike){
 const clientId=clean(requestLike.client_id,1000),redirectUri=clean(requestLike.redirect_uri,4000);
 const responseType=clean(requestLike.response_type,40),challenge=clean(requestLike.code_challenge,300),method=clean(requestLike.code_challenge_method,20);
 const requestedResource=clean(requestLike.resource,4000)||resource(requestLike.__request);
 const scopes=validatedScopes(requestLike.scope);
 if(responseType!=='code')return{error:'unsupported_response_type',detail:'Only response_type=code is supported.'};
 if(!clientId)return{error:'invalid_request',detail:'client_id is required.'};
 const row=await client(env,clientId);if(!row)return{error:'invalid_client',detail:'Unknown OAuth client.'};
 if(!redirectUri||!redirectAllowed(row,redirectUri))return{error:'invalid_request',detail:'redirect_uri is not registered for this client.'};
 if(method!=='S256'||!/^[A-Za-z0-9_-]{43,128}$/.test(challenge))return{error:'invalid_request',detail:'PKCE S256 code_challenge is required.'};
 if(requestedResource!==resource(requestLike.__request))return{error:'invalid_target',detail:'OAuth resource does not match the Magnanimous MCP resource.'};
 if(!scopes)return{error:'invalid_scope',detail:'One or more requested scopes are not supported.'};
 return{client:row,clientId,redirectUri,challenge,scopes,resource:requestedResource};
}
async function issueTokens(env,{clientId,tenantId,userId,scopes,resource:audience}){
 const access=randomToken('mgo_'),refresh=randomToken('mgr_'),ts=now(),accessId=crypto.randomUUID(),refreshId=crypto.randomUUID();
 await env.DB.prepare('INSERT INTO magnanimous_oauth_access_tokens(id,token_hash,client_id,tenant_id,user_id,scopes_json,resource,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
  .bind(accessId,await sha256Hex(access),clientId,tenantId,userId,JSON.stringify(scopes),audience,ts+ACCESS_TTL,ts).run();
 await env.DB.prepare('INSERT INTO magnanimous_oauth_refresh_tokens(id,token_hash,client_id,tenant_id,user_id,scopes_json,resource,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
  .bind(refreshId,await sha256Hex(refresh),clientId,tenantId,userId,JSON.stringify(scopes),audience,ts+REFRESH_TTL,ts).run();
 return{access_token:access,token_type:'Bearer',expires_in:ACCESS_TTL,refresh_token:refresh,scope:scopes.join(' '),resource:audience};
}

export function magnanimousOAuthChallenge(request,scope=''){
 const metadata=new URL('/.well-known/oauth-protected-resource',request.url).href;
 return 'Bearer resource_metadata="'+metadata+'"'+(scope?', scope="'+clean(scope,500)+'"':'');
}

export async function authorizeMagnanimousOAuthToken(request,env){
 const auth=clean(request.headers.get('authorization'),10000);
 if(!/^Bearer\s+/i.test(auth))return null;
 const token=auth.replace(/^Bearer\s+/i,'').trim();
 if(!token.startsWith('mgo_')||!env?.DB)return null;
 await ensureSchema(env);
 const hash=await sha256Hex(token),ts=now();
 const row=await env.DB.prepare('SELECT id,client_id,tenant_id,user_id,scopes_json,resource,expires_at,revoked_at FROM magnanimous_oauth_access_tokens WHERE token_hash=?').bind(hash).first();
 if(!row||row.revoked_at||Number(row.expires_at||0)<=ts||row.resource!==resource(request))return null;
 await env.DB.prepare('UPDATE magnanimous_oauth_access_tokens SET last_used_at=? WHERE id=?').bind(ts,row.id).run().catch(()=>{});
 return{
  id:'oauth:'+row.id,
  tenant_id:row.tenant_id,
  user_id:row.user_id,
  name:'ChatGPT OAuth',
  platform:'openai-chatgpt',
  scopes:new Set(parseJson(row.scopes_json,[])),
  oauth:true,
  client_id:row.client_id
 };
}

export async function handleMagnanimousPluginOAuth(request,env){
 const url=new URL(request.url),path=url.pathname;
 const handled=path==='/.well-known/openai-apps-challenge'||path==='/.well-known/oauth-protected-resource'||path==='/.well-known/oauth-authorization-server'||path==='/oauth/register'||path==='/oauth/token'||path==='/api/magnanimous/oauth/consent'||path==='/api/magnanimous/oauth/authorize';
 if(!handled)return null;
 if(!env?.DB)return json({detail:'OAuth database binding is unavailable.'},503);
 await ensureSchema(env);
 const base=url.origin,mcpResource=base+'/mcp';

 if(path==='/.well-known/openai-apps-challenge'&&request.method==='GET'){
  const token=clean(env?.OPENAI_APPS_CHALLENGE_TOKEN,1000);
  if(!token)return new Response('Not configured',{status:404,headers:{'cache-control':'no-store','content-type':'text/plain; charset=utf-8'}});
  return new Response(token,{status:200,headers:{'cache-control':'no-store','content-type':'text/plain; charset=utf-8'}});
 }

 if(path==='/.well-known/oauth-protected-resource'&&request.method==='GET'){
  return json({
   resource:mcpResource,
   authorization_servers:[base],
   scopes_supported:OAUTH_SCOPES,
   resource_documentation:base+'/ai-connectors',
   bearer_methods_supported:['header']
  });
 }
 if(path==='/.well-known/oauth-authorization-server'&&request.method==='GET'){
  return json({
   issuer:base,
   authorization_endpoint:base+'/oauth/authorize',
   token_endpoint:base+'/oauth/token',
   registration_endpoint:base+'/oauth/register',
   response_types_supported:['code'],
   grant_types_supported:['authorization_code','refresh_token'],
   token_endpoint_auth_methods_supported:['none'],
   code_challenge_methods_supported:['S256'],
   scopes_supported:OAUTH_SCOPES
  });
 }
 if(path==='/oauth/register'&&request.method==='POST'){
  const body=await request.json().catch(()=>({}));
  const redirects=Array.isArray(body.redirect_uris)?[...new Set(body.redirect_uris.map(x=>clean(x,4000)).filter(Boolean))]:[];
  if(!redirects.length||redirects.length>10||redirects.some(x=>!openAiRedirect(x)))return oauthError('invalid_redirect_uri','This OAuth endpoint accepts only HTTPS ChatGPT/OpenAI redirect URIs.');
  const authMethod=clean(body.token_endpoint_auth_method||'none',80);
  if(authMethod!=='none')return oauthError('invalid_client_metadata','Only public-client token_endpoint_auth_method=none is supported.');
  const clientId='mcp_'+b64url(crypto.getRandomValues(new Uint8Array(24)));
  const clientName=clean(body.client_name||body.software_id||'ChatGPT',160)||'ChatGPT';
  await env.DB.prepare('INSERT INTO magnanimous_oauth_clients(client_id,client_name,redirect_uris_json,token_endpoint_auth_method,created_at) VALUES(?,?,?,?,?)')
   .bind(clientId,clientName,JSON.stringify(redirects),'none',now()).run();
  return json({client_id:clientId,client_name:clientName,redirect_uris:redirects,grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none'},201);
 }
 if(path==='/api/magnanimous/oauth/consent'&&request.method==='GET'){
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return json({detail:'Sign in to I AM MAGNANIMOUS WAY™ before authorizing ChatGPT.',code:'AUTH_REQUIRED'},401);
  const params=Object.fromEntries(url.searchParams.entries());params.__request=request;
  const valid=await validateAuthorization(env,params);
  if(valid.error)return oauthError(valid.error,valid.detail,400);
  const scopes=scopesForUser(user,valid.scopes);
  if(!scopes.length)return oauthError('invalid_scope','This account is not allowed to grant any of the requested Magnanimous scopes.',403);
  const omitted_scopes=valid.scopes.filter(scope=>!scopes.includes(scope));
  return json({
   ok:true,
   client_name:valid.client.client_name,
   client_id:valid.clientId,
   redirect_uri:valid.redirectUri,
   resource:valid.resource,
   scopes,
   omitted_scopes,
   access_tier:privilegedUser(user)?'owner-admin':'customer-safe',
   publisher:'I AM MAGNANIMOUS WAY™',
   identity:'Magnanimous AI'
  });
 }
 if(path==='/api/magnanimous/oauth/authorize'&&request.method==='POST'){
  const user=await currentUser(request,env).catch(()=>null);
  if(!user)return json({detail:'Sign in required.',code:'AUTH_REQUIRED'},401);
  const body=await request.json().catch(()=>({}));body.__request=request;
  const valid=await validateAuthorization(env,body);
  if(valid.error)return oauthError(valid.error,valid.detail,400);
  const scopes=scopesForUser(user,valid.scopes);
  if(!scopes.length)return oauthError('invalid_scope','This account is not allowed to grant any of the requested Magnanimous scopes.',403);
  const rawCode=randomToken('mgac_'),ts=now();
  await env.DB.prepare('DELETE FROM magnanimous_oauth_codes WHERE expires_at<? OR used_at IS NOT NULL').bind(ts-60).run().catch(()=>{});
  await env.DB.prepare('INSERT INTO magnanimous_oauth_codes(code_hash,client_id,tenant_id,user_id,redirect_uri,scopes_json,code_challenge,resource,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
   .bind(await sha256Hex(rawCode),valid.clientId,String(user.tenant_id),String(user.id),valid.redirectUri,JSON.stringify(scopes),valid.challenge,valid.resource,ts+CODE_TTL,ts).run();
  const redirect=new URL(valid.redirectUri);redirect.searchParams.set('code',rawCode);
  if(body.state!=null)redirect.searchParams.set('state',clean(body.state,3000));
  return json({ok:true,redirect_url:redirect.toString(),expires_in:CODE_TTL,scope:scopes.join(' ')});
 }
 if(path==='/oauth/token'&&request.method==='POST'){
  const contentType=String(request.headers.get('content-type')||'');
  let body={};
  if(contentType.includes('application/x-www-form-urlencoded'))body=Object.fromEntries(new URLSearchParams(await request.text()).entries());
  else body=await request.json().catch(()=>({}));
  const grant=clean(body.grant_type,80),clientId=clean(body.client_id,1000),requestedResource=clean(body.resource,4000)||mcpResource;
  if(!clientId)return oauthError('invalid_client','client_id is required.',401);
  const clientRow=await client(env,clientId);if(!clientRow)return oauthError('invalid_client','Unknown OAuth client.',401);
  if(requestedResource!==mcpResource)return oauthError('invalid_target','OAuth resource does not match the Magnanimous MCP resource.');
  if(grant==='authorization_code'){
   const rawCode=clean(body.code,10000),redirectUri=clean(body.redirect_uri,4000),verifier=clean(body.code_verifier,1000);
   if(!rawCode||!redirectUri||!verifier)return oauthError('invalid_request','code, redirect_uri and code_verifier are required.');
   const codeHash=await sha256Hex(rawCode),row=await env.DB.prepare('SELECT * FROM magnanimous_oauth_codes WHERE code_hash=?').bind(codeHash).first();
   if(!row||row.used_at||Number(row.expires_at||0)<=now())return oauthError('invalid_grant','Authorization code is invalid, expired, or already used.');
   if(row.client_id!==clientId||row.redirect_uri!==redirectUri||row.resource!==requestedResource)return oauthError('invalid_grant','Authorization code binding does not match this request.');
   if(await sha256B64(verifier)!==row.code_challenge)return oauthError('invalid_grant','PKCE verification failed.');
   const claimed=await env.DB.prepare('UPDATE magnanimous_oauth_codes SET used_at=? WHERE code_hash=? AND used_at IS NULL').bind(now(),codeHash).run();
   if(Number(claimed?.meta?.changes||0)!==1)return oauthError('invalid_grant','Authorization code was already consumed.');
   await env.DB.prepare('UPDATE magnanimous_oauth_clients SET last_used_at=? WHERE client_id=?').bind(now(),clientId).run().catch(()=>{});
   return json(await issueTokens(env,{clientId,tenantId:row.tenant_id,userId:row.user_id,scopes:parseJson(row.scopes_json,[]),resource:row.resource}));
  }
  if(grant==='refresh_token'){
   const rawRefresh=clean(body.refresh_token,10000);if(!rawRefresh)return oauthError('invalid_request','refresh_token is required.');
   const hash=await sha256Hex(rawRefresh),row=await env.DB.prepare('SELECT * FROM magnanimous_oauth_refresh_tokens WHERE token_hash=?').bind(hash).first();
   if(!row||row.revoked_at||Number(row.expires_at||0)<=now()||row.client_id!==clientId||row.resource!==requestedResource)return oauthError('invalid_grant','Refresh token is invalid or expired.');
   const claimed=await env.DB.prepare('UPDATE magnanimous_oauth_refresh_tokens SET revoked_at=?,rotated_at=? WHERE id=? AND revoked_at IS NULL').bind(now(),now(),row.id).run();
   if(Number(claimed?.meta?.changes||0)!==1)return oauthError('invalid_grant','Refresh token was already rotated.');
   return json(await issueTokens(env,{clientId,tenantId:row.tenant_id,userId:row.user_id,scopes:parseJson(row.scopes_json,[]),resource:row.resource}));
  }
  return oauthError('unsupported_grant_type','Supported grant types are authorization_code and refresh_token.');
 }
 return json({detail:'OAuth route or method not found.'},405);
}
