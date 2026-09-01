const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Math.floor(Date.now()/1000);

function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}

async function sessionSecret(env){
  const configured=String(env.SESSION_SECRET||'').trim();
  if(configured)return configured;
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
  return await env.DB.prepare('SELECT id,tenant_id,name,email,role,active FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId,tenantId).first();
}
async function ensureTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS mux_connections (
    tenant_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_id_enc TEXT NOT NULL,
    token_secret_enc TEXT NOT NULL,
    env_key TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT 'Mux',
    verified_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
}
async function encryptionKey(env){
  const source=String(env.MUX_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();
  if(!source)throw new Error('Credential encryption is not available.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`iam-mux-v1:${source}`));
  return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(value,env){
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await encryptionKey(env);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(value));
  return `${b64(iv)}.${b64(new Uint8Array(cipher))}`;
}
async function decrypt(value,env){
  const [iv64,data64]=String(value||'').split('.');
  if(!iv64||!data64)throw new Error('Stored Mux credentials are invalid.');
  const key=await encryptionKey(env),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv64)},key,unb64(data64));
  return new TextDecoder().decode(plain);
}
function basic(tokenId,tokenSecret){return `Basic ${btoa(`${tokenId}:${tokenSecret}`)}`}
async function muxRequest(path,tokenId,tokenSecret,init={}){
  const r=await fetch(`https://api.mux.com${path}`,{...init,headers:{'content-type':'application/json','authorization':basic(tokenId,tokenSecret),...(init.headers||{})}});
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={error:{message:text||'Invalid Mux response'}}}
  if(!r.ok)throw new Error(data?.error?.message||data?.errors?.[0]||`Mux API request failed (${r.status})`);
  return data;
}
async function connection(env,tenantId){
  await ensureTable(env);
  return env.DB.prepare('SELECT * FROM mux_connections WHERE tenant_id=?').bind(tenantId).first();
}
async function credentials(env,tenantId){
  const row=await connection(env,tenantId);if(!row)return null;
  return {row,tokenId:await decrypt(row.token_id_enc,env),tokenSecret:await decrypt(row.token_secret_enc,env)};
}

export async function handleMux(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/mux'))return null;
  if(!env?.DB)return json({detail:'Database binding is not configured.'},503);
  const user=await currentUser(request,env);
  if(!user)return json({detail:'Sign in to connect Mux.'},401);
  await ensureTable(env);

  if(url.pathname==='/api/mux/status'&&request.method==='GET'){
    const row=await connection(env,user.tenant_id);
    return json({connected:!!row,env_key:row?.env_key||'',label:row?.label||'',verified_at:row?.verified_at||null,token_hint:row?'••••'+String(await decrypt(row.token_id_enc,env)).slice(-4):''});
  }

  if(url.pathname==='/api/mux/connect'&&request.method==='POST'){
    const body=await request.json(),tokenId=String(body.token_id||'').trim(),tokenSecret=String(body.token_secret||'').trim(),envKey=String(body.env_key||'').trim(),label=String(body.label||'Mux').trim()||'Mux';
    if(!tokenId||!tokenSecret)return json({detail:'Mux Access Token ID and Secret are required.'},400);
    await muxRequest('/video/v1/assets?limit=1',tokenId,tokenSecret,{method:'GET'});
    const ts=now();
    await env.DB.prepare(`INSERT INTO mux_connections(tenant_id,user_id,token_id_enc,token_secret_enc,env_key,label,verified_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(tenant_id) DO UPDATE SET user_id=excluded.user_id,token_id_enc=excluded.token_id_enc,token_secret_enc=excluded.token_secret_enc,env_key=excluded.env_key,label=excluded.label,verified_at=excluded.verified_at,updated_at=excluded.updated_at`)
      .bind(user.tenant_id,user.id,await encrypt(tokenId,env),await encrypt(tokenSecret,env),envKey,label,ts,ts,ts).run();
    return json({ok:true,connected:true,verified_at:ts,env_key:envKey});
  }

  if(url.pathname==='/api/mux/disconnect'&&request.method==='DELETE'){
    await env.DB.prepare('DELETE FROM mux_connections WHERE tenant_id=?').bind(user.tenant_id).run();
    return json({ok:true});
  }

  const creds=await credentials(env,user.tenant_id);
  if(!creds)return json({detail:'Connect a Mux account first.'},409);

  if(url.pathname==='/api/mux/assets'&&request.method==='GET'){
    const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||25),1),100),cursor=url.searchParams.get('cursor');
    const qs=new URLSearchParams({limit:String(limit)});if(cursor)qs.set('cursor',cursor);
    const d=await muxRequest(`/video/v1/assets?${qs}`,creds.tokenId,creds.tokenSecret,{method:'GET'});
    return json({assets:d.data||[],next_cursor:d.next_cursor||null,env_key:creds.row.env_key||''});
  }

  if(url.pathname==='/api/mux/assets'&&request.method==='POST'){
    const body=await request.json(),inputUrl=String(body.input_url||'').trim();
    if(!inputUrl)return json({detail:'A publicly accessible video URL is required.'},400);
    const d=await muxRequest('/video/v1/assets',creds.tokenId,creds.tokenSecret,{method:'POST',body:JSON.stringify({inputs:[{url:inputUrl}],playback_policies:['public'],video_quality:'basic'})});
    return json({asset:d.data||d},201);
  }

  if(url.pathname==='/api/mux/uploads'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    const corsOrigin=String(body.cors_origin||request.headers.get('origin')||url.origin).trim();
    const d=await muxRequest('/video/v1/uploads',creds.tokenId,creds.tokenSecret,{method:'POST',body:JSON.stringify({cors_origin:corsOrigin,new_asset_settings:{playback_policies:['public'],video_quality:'basic'}})});
    return json({upload:d.data||d},201);
  }

  return json({detail:'Mux endpoint not found.'},404);
}
