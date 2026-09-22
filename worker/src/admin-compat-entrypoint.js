import providerApp from './provider-entrypoint.js';
import {createPasswordRecord,verifyPassword,upgradePasswordIfNeeded} from './password-security.js';
import {decryptTotpSecret,encryptTotpSecret,generateTotpSecret,totpAuthUri,verifyTotpCode} from './totp-auth.js';
import {unhandledRequestFailure} from './request-observability.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const now = () => Math.floor(Date.now() / 1000);
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const normEmail = (e) => String(e || '').trim().toLowerCase();
const makeId = () => crypto.randomUUID();
async function hmac(secret, value) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const b = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(value)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function safeTextEqual(left,right){
  const encoder=new TextEncoder(),a=encoder.encode(String(left||'')),b=encoder.encode(String(right||''));
  const [ad,bd]=await Promise.all([crypto.subtle.digest('SHA-256',a),crypto.subtle.digest('SHA-256',b)]);
  const av=new Uint8Array(ad),bv=new Uint8Array(bd);
  if(typeof crypto.subtle.timingSafeEqual==='function'){try{return crypto.subtle.timingSafeEqual(av,bv)}catch(_){}}
  let diff=0;for(let i=0;i<av.length;i+=1)diff|=av[i]^bv[i];return diff===0;
}

function b64url(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function randomChallenge(){return 'mfa1_'+b64url(crypto.getRandomValues(new Uint8Array(32)))}
async function sha256Hex(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function maskEmail(value){const [name,domain]=normEmail(value).split('@');if(!name||!domain)return'';return (name.slice(0,2)||'*')+'***@'+domain}
async function globalPlatformOwner(env,user){
  if(!env?.DB||!user)return false;
  try{
    const row=await env.DB.prepare("SELECT id FROM tenants WHERE id=? AND slug='owner' AND owner_user_id=? LIMIT 1").bind(user.tenant_id,user.id).first();
    return Boolean(row?.id);
  }catch{return false}
}
async function activeTotp(env,user){
  if(!env?.DB||!user)return null;
  try{return await env.DB.prepare('SELECT secret_ciphertext,enabled,verified_at,last_counter FROM user_totp WHERE user_id=? AND tenant_id=? LIMIT 1').bind(user.id,user.tenant_id).first()}
  catch{return null}
}
async function cleanupMfaChallenges(env,t=now()){
  try{await env.DB.prepare('DELETE FROM auth_mfa_challenges WHERE expires_at<=? OR (consumed_at IS NOT NULL AND consumed_at<=?)').bind(t,t-86400).run()}catch{}
}
async function issueMfaChallenge(env,user){
  const token=randomChallenge(),hash=await sha256Hex(token),t=now(),expires=t+300;
  await cleanupMfaChallenges(env,t);
  try{await env.DB.prepare('UPDATE auth_mfa_challenges SET consumed_at=? WHERE user_id=? AND consumed_at IS NULL').bind(t,user.id).run()}catch{}
  await env.DB.prepare('INSERT INTO auth_mfa_challenges(token_hash,user_id,tenant_id,created_at,expires_at,attempts,consumed_at) VALUES(?,?,?,?,?,0,NULL)').bind(hash,user.id,user.tenant_id,t,expires).run();
  return{token,expires};
}

// SESSION_SECRET is preferred, but authentication must not silently fail when the
// optional Worker secret was never configured. A random secret is generated once
// and persisted in D1, so credentials and sessions remain server-side and stable.
async function authSecret(env) {
  const configured = String(env.SESSION_SECRET || '').trim();
  if (configured) return configured;
  const existing = await env.DB.prepare('SELECT value FROM auth_config WHERE key=?').bind('session_secret').first();
  if (existing?.value) return String(existing.value);
  const generated = `${makeId()}${makeId()}${makeId()}`;
  try { await env.DB.prepare('INSERT INTO auth_config(key,value) VALUES(?,?)').bind('session_secret', generated).run(); } catch (error) {
    // A one-time fallback secret may be persisted when capacity is available.
    // Quota/schema failures are surfaced by the outer request handler instead of hidden.
    const retry = await env.DB.prepare('SELECT value FROM auth_config WHERE key=?').bind('session_secret').first().catch(()=>null);
    if (retry?.value) return String(retry.value);
    throw error;
  }
  const saved = await env.DB.prepare('SELECT value FROM auth_config WHERE key=?').bind('session_secret').first();
  if (!saved?.value) throw new Error('Authentication secret persistence failed.');
  return String(saved.value);
}
async function makeSession(user, env) { const secret = await authSecret(env); const exp = now() + SESSION_TTL_SECONDS; const payload = `${user.id}|${user.tenant_id}|${user.role}|${exp}`; return `${payload}|${await hmac(secret, payload)}`; }
async function auth(request, env) {
  const raw = request.headers.get('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  const p = raw.slice(7).split('|'); if (p.length !== 5 || Number(p[3]) < now()) return null;
  const [userId, tenantId, role, exp, sig] = p;
  const secret = await authSecret(env);
  if (!(await safeTextEqual(sig,await hmac(secret, `${userId}|${tenantId}|${role}|${exp}`)))) return null;
  return await env.DB.prepare('SELECT id,tenant_id,name,email,role,active,created_at FROM users WHERE id=? AND tenant_id=? AND active=1').bind(userId, tenantId).first();
}
async function ensureTables(env) {
  // Runtime schema is migration-owned. These read probes validate the contract
  // without consuming D1 row-write quota on every request.
  await env.DB.prepare('SELECT id,name,slug,owner_user_id,created_at FROM tenants LIMIT 1').first();
  await env.DB.prepare('SELECT id,tenant_id,name,email,role,password_hash,password_salt,active,created_at FROM users LIMIT 1').first();
  await env.DB.prepare('SELECT id,user_id,tenant_id,email,event,success,created_at FROM auth_events LIMIT 1').first();
  await env.DB.prepare('SELECT key,value FROM settings LIMIT 1').first();
  await env.DB.prepare('SELECT id,title,url,label,placement,active,created_at FROM ads LIMIT 1').first();
  // auth_config is only the fallback secret store. If SESSION_SECRET is configured,
  // authentication does not depend on that optional table while migration 0081 is deferred.
  await authSecret(env);
}
async function ensureLegacyCompatibility(env) {
  // Legacy shape repair is migration-owned (0008/0009). Validate required columns only.
  await env.DB.prepare('SELECT id,tenant_id,name,email,role,password_hash,password_salt,active,created_at FROM users LIMIT 1').first();
  await env.DB.prepare('SELECT id,name,slug,owner_user_id,created_at FROM tenants LIMIT 1').first();
}
async function logAuth(env, user, event, success = 1, email = '') { try { await env.DB.prepare('INSERT INTO auth_events(user_id,tenant_id,email,event,success,created_at) VALUES(?,?,?,?,?,?)').bind(user?.id || null, user?.tenant_id || null, email || user?.email || '', event, success ? 1 : 0, now()).run(); } catch (_) {} }
async function signup(request, env) {
  const b = await request.json();
  const email = normEmail(b.email), name = String(b.name || '').trim(), password = String(b.password || '');
  if (!name || !email || password.length < 10) return json({ detail: 'Name, email, and a password of at least 10 characters are required.' }, 400);
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email=? AND active=1 LIMIT 1').bind(email).first();
  if (existing) return json({ detail: 'An account with that email already exists. Please sign in instead.' }, 409);
  let passwordRecord;try{passwordRecord=await createPasswordRecord(password,env)}catch(error){return json({detail:error?.message||'Choose a different password.'},400)}
  const tid = makeId(), uid = makeId(), created = now();
  const baseSlug = String(b.workspace || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'workspace';
  const slug = `${baseSlug}-${tid.replace(/-/g, '').slice(0, 10)}`;
  await env.DB.prepare('INSERT INTO tenants(id,name,slug,owner_user_id,created_at) VALUES(?,?,?,?,?)').bind(tid, String(b.workspace || name), slug, uid, created).run();
  await env.DB.prepare('INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(uid, tid, name, email, 'owner', passwordRecord.password_hash, passwordRecord.password_salt, 1, created).run();
  await logAuth(env, { id: uid, tenant_id: tid, email }, 'signup', 1, email);
  const user = { id: uid, tenant_id: tid, name, email, role: 'owner', active: 1, created_at: created };
  return json({ token: await makeSession(user, env), user }, 201);
}
async function login(request, env) {
  const b = await request.json(), email = normEmail(b.email), password = String(b.password || '');
  if (!email || !password) return json({ detail: 'Email and password are required.' }, 400);
  let user = await env.DB.prepare('SELECT * FROM users WHERE email=? AND active=1 ORDER BY created_at ASC LIMIT 1').bind(email).first();
  if (!user) { await logAuth(env, null, 'login', 0, email); return json({ detail: 'Invalid email or password.' }, 401); }
  try{
    const tenant=await env.DB.prepare('SELECT owner_user_id FROM tenants WHERE id=? LIMIT 1').bind(user.tenant_id).first();
    if(String(tenant?.owner_user_id||'')===String(user.id)&&String(user.role||'')!=='owner'){
      await env.DB.prepare("UPDATE users SET role='owner' WHERE id=? AND tenant_id=?").bind(user.id,user.tenant_id).run();
      user={...user,role:'owner'};
    }
  }catch(_){} 
  let verification;try{verification=await verifyPassword(password,user.password_hash,user.password_salt,env)}catch(_){verification={valid:false,needs_upgrade:false}}
  if (!verification.valid) { await logAuth(env, user, 'login', 0, email); return json({ detail: 'Invalid email or password.' }, 401); }
  try{await upgradePasswordIfNeeded(env,user,password,verification)}catch(error){console.error('password hash upgrade failed',error)}
  const totp=await activeTotp(env,user);
  if(Number(totp?.enabled||0)===1){
    const challenge=await issueMfaChallenge(env,user);
    await logAuth(env,user,'login_password_verified_mfa_required',1,email);
    return json({
      ok:true,
      mfa_required:true,
      mfa_method:'totp',
      mfa_token:challenge.token,
      expires_in_seconds:Math.max(1,challenge.expires-now()),
      email_hint:maskEmail(user.email),
      detail:'Enter the 6-digit code from your authenticator app.'
    });
  }
  await logAuth(env, user, 'login', 1, email);
  return json({ token: await makeSession(user, env), user: { id: user.id, tenant_id: user.tenant_id, name: user.name, email: user.email, role: user.role, active: user.active } });
}

async function totpStatus(request,env){
  const user=await auth(request,env);if(!user)return json({detail:'Not authenticated.'},401);
  if(await globalPlatformOwner(env,user))return json({ok:true,available:false,enabled:false,detail:'Platform owner authentication is managed separately.'});
  const row=await activeTotp(env,user);
  return json({ok:true,available:true,enabled:Number(row?.enabled||0)===1,verified_at:Number(row?.verified_at||0)});
}
async function totpEnroll(request,env){
  const user=await auth(request,env);if(!user)return json({detail:'Not authenticated.'},401);
  if(await globalPlatformOwner(env,user))return json({detail:'Platform owner authentication is managed separately.',code:'OWNER_AUTH_SEPARATE'},403);
  const secret=generateTotpSecret(),ciphertext=await encryptTotpSecret(secret,env),t=now();
  await env.DB.prepare(`INSERT INTO user_totp(user_id,tenant_id,secret_ciphertext,enabled,created_at,verified_at,last_counter)
    VALUES(?,?,?,0,?,0,-1)
    ON CONFLICT(user_id) DO UPDATE SET tenant_id=excluded.tenant_id,secret_ciphertext=excluded.secret_ciphertext,enabled=0,created_at=excluded.created_at,verified_at=0,last_counter=-1`)
    .bind(user.id,user.tenant_id,ciphertext,t).run();
  await logAuth(env,user,'totp_enrollment_started',1,user.email);
  return json({
    ok:true,
    manual_key:secret,
    otpauth_uri:totpAuthUri({secret,email:user.email}),
    issuer:'I AM MAGNANIMOUS WAY',
    account_name:user.email,
    detail:'Add this account to Google Authenticator or another TOTP app, then enter the 6-digit code to confirm.'
  });
}
async function totpConfirm(request,env){
  const user=await auth(request,env);if(!user)return json({detail:'Not authenticated.'},401);
  if(await globalPlatformOwner(env,user))return json({detail:'Platform owner authentication is managed separately.',code:'OWNER_AUTH_SEPARATE'},403);
  const body=await request.json().catch(()=>({})),code=String(body.code||'');
  const row=await env.DB.prepare('SELECT secret_ciphertext,enabled,last_counter FROM user_totp WHERE user_id=? AND tenant_id=? LIMIT 1').bind(user.id,user.tenant_id).first();
  if(!row?.secret_ciphertext)return json({detail:'Start authenticator setup first.',code:'TOTP_ENROLLMENT_REQUIRED'},400);
  const secret=await decryptTotpSecret(row.secret_ciphertext,env);
  const verified=await verifyTotpCode(secret,code,{lastCounter:Number(row.last_counter??-1)});
  if(!verified.ok){await logAuth(env,user,'totp_enrollment_failed',0,user.email);return json({detail:'That authenticator code is invalid. Wait for a new code and try again.',code:'TOTP_INVALID'},400)}
  const t=now();
  await env.DB.prepare('UPDATE user_totp SET enabled=1,verified_at=?,last_counter=? WHERE user_id=? AND tenant_id=?').bind(t,verified.counter,user.id,user.tenant_id).run();
  await logAuth(env,user,'totp_enabled',1,user.email);
  return json({ok:true,enabled:true,detail:'Authenticator protection is now enabled for this account.'});
}
async function totpDisable(request,env){
  const user=await auth(request,env);if(!user)return json({detail:'Not authenticated.'},401);
  if(await globalPlatformOwner(env,user))return json({detail:'Platform owner authentication is managed separately.',code:'OWNER_AUTH_SEPARATE'},403);
  const body=await request.json().catch(()=>({})),password=String(body.password||''),code=String(body.code||'');
  if(!password||!code)return json({detail:'Your current password and authenticator code are required to disable 2FA.'},400);
  const full=await env.DB.prepare('SELECT * FROM users WHERE id=? AND tenant_id=? AND active=1 LIMIT 1').bind(user.id,user.tenant_id).first();
  let verification;try{verification=await verifyPassword(password,full?.password_hash,full?.password_salt,env)}catch{verification={valid:false}}
  if(!verification.valid)return json({detail:'Current password is incorrect.',code:'PASSWORD_INVALID'},401);
  const row=await activeTotp(env,user);if(Number(row?.enabled||0)!==1)return json({ok:true,enabled:false});
  const secret=await decryptTotpSecret(row.secret_ciphertext,env);
  const verified=await verifyTotpCode(secret,code,{lastCounter:Number(row.last_counter??-1)});
  if(!verified.ok)return json({detail:'Authenticator code is invalid.',code:'TOTP_INVALID'},400);
  await env.DB.prepare('DELETE FROM user_totp WHERE user_id=? AND tenant_id=?').bind(user.id,user.tenant_id).run();
  await logAuth(env,user,'totp_disabled',1,user.email);
  return json({ok:true,enabled:false,detail:'Authenticator protection has been disabled.'});
}
async function totpLogin(request,env){
  const body=await request.json().catch(()=>({})),token=String(body.mfa_token||''),code=String(body.code||'');
  if(!/^mfa1_[A-Za-z0-9_-]{40,128}$/.test(token)||!/^[0-9\s-]{6,12}$/.test(code))return json({detail:'The authenticator challenge is invalid or expired.',code:'MFA_CHALLENGE_INVALID'},400);
  const hash=await sha256Hex(token),t=now();
  const row=await env.DB.prepare(`SELECT c.token_hash,c.user_id,c.tenant_id,c.expires_at,c.attempts,c.consumed_at,
      u.name,u.email,u.role,u.active,totp.secret_ciphertext,totp.enabled,totp.last_counter
    FROM auth_mfa_challenges c
    JOIN users u ON u.id=c.user_id AND u.tenant_id=c.tenant_id
    JOIN user_totp totp ON totp.user_id=u.id AND totp.tenant_id=u.tenant_id
    WHERE c.token_hash=? LIMIT 1`).bind(hash).first();
  if(!row||Number(row.active||0)!==1||Number(row.enabled||0)!==1||row.consumed_at!=null||Number(row.expires_at||0)<=t||Number(row.attempts||0)>=5){
    return json({detail:'The authenticator challenge is invalid or expired. Sign in again.',code:'MFA_CHALLENGE_INVALID'},401);
  }
  const secret=await decryptTotpSecret(row.secret_ciphertext,env);
  const verified=await verifyTotpCode(secret,code,{lastCounter:Number(row.last_counter??-1)});
  if(!verified.ok){
    const attempts=Number(row.attempts||0)+1;
    await env.DB.prepare('UPDATE auth_mfa_challenges SET attempts=?,consumed_at=CASE WHEN ?>=5 THEN ? ELSE consumed_at END WHERE token_hash=? AND consumed_at IS NULL').bind(attempts,attempts,t,hash).run();
    await logAuth(env,{id:row.user_id,tenant_id:row.tenant_id,email:row.email},'totp_login_failed',0,row.email);
    return json({detail:attempts>=5?'Too many invalid codes. Sign in again.':'Authenticator code is invalid. Wait for a new code and try again.',code:'TOTP_INVALID'},401);
  }
  const claimed=await env.DB.prepare('UPDATE auth_mfa_challenges SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?').bind(t,hash,t).run();
  if(Number(claimed?.meta?.changes||0)!==1)return json({detail:'This authenticator challenge is no longer active. Sign in again.',code:'MFA_CHALLENGE_INVALID'},401);
  await env.DB.prepare('UPDATE user_totp SET last_counter=? WHERE user_id=? AND tenant_id=? AND enabled=1').bind(verified.counter,row.user_id,row.tenant_id).run();
  const user={id:row.user_id,tenant_id:row.tenant_id,name:row.name,email:row.email,role:row.role,active:row.active};
  await logAuth(env,user,'login_mfa_verified',1,row.email);
  return json({token:await makeSession(user,env),user});
}

async function adminLogin(request, env) {
  const b = await request.json(), email = normEmail(b.email), password = String(b.password || '');
  if (!email || !password) return json({ detail: 'Owner email and password are required.' }, 400);
  const existing = await env.DB.prepare("SELECT * FROM users WHERE email=? AND active=1 ORDER BY created_at ASC LIMIT 1").bind(email).first();
  if (existing && existing.role === 'owner') {
    let verification;try{verification=await verifyPassword(password,existing.password_hash,existing.password_salt,env)}catch(_){verification={valid:false,needs_upgrade:false}}
    if (!verification.valid) {
      await logAuth(env, existing, 'owner_login', 0, email);
      return json({ detail: 'Invalid owner email or password.' }, 401);
    }
    try{await upgradePasswordIfNeeded(env,existing,password,verification)}catch(error){console.error('owner password hash upgrade failed',error)}
    await logAuth(env, existing, 'owner_login', 1, email);
    return json({ token: await makeSession(existing, env), user: { id: existing.id, tenant_id: existing.tenant_id, name: existing.name, email: existing.email, role: 'owner', active: existing.active } });
  }

  const configuredEmail = normEmail(env.ADMIN_EMAIL);
  const configuredPassword = String(env.ADMIN_PASSWORD || '');
  if (!configuredEmail || !configuredPassword || !(await safeTextEqual(email,configuredEmail)) || !(await safeTextEqual(password,configuredPassword))) {
    await logAuth(env, existing, 'owner_login', 0, email);
    return json({ detail: 'Invalid owner email or password.' }, 401);
  }

  let tenant = await env.DB.prepare("SELECT * FROM tenants WHERE slug='owner' LIMIT 1").first();
  const created = now();
  if (!tenant) {
    const tid = makeId();
    await env.DB.prepare('INSERT INTO tenants(id,name,slug,owner_user_id,created_at) VALUES(?,?,?,?,?)').bind(tid, 'I AM Magnanimous Way Owner', 'owner', null, created).run();
    tenant = await env.DB.prepare("SELECT * FROM tenants WHERE slug='owner' LIMIT 1").first();
  }
  let owner = await env.DB.prepare('SELECT * FROM users WHERE email=? LIMIT 1').bind(configuredEmail).first();
  if (!owner) {
    const uid = makeId(), record = await createPasswordRecord(configuredPassword,env);
    await env.DB.prepare('INSERT INTO users(id,tenant_id,name,email,role,password_hash,password_salt,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(uid, tenant.id, 'I AM Magnanimous Way Owner', configuredEmail, 'owner', record.password_hash, record.password_salt, 1, created).run();
    await env.DB.prepare("UPDATE tenants SET owner_user_id=? WHERE id=?").bind(uid, tenant.id).run();
    owner = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(uid).first();
  } else if (owner.role !== 'owner' || owner.tenant_id !== tenant.id) {
    await env.DB.prepare("UPDATE users SET role='owner',tenant_id=?,active=1 WHERE id=?").bind(tenant.id, owner.id).run();
    owner = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(owner.id).first();
  }
  await logAuth(env, owner, 'owner_login', 1, configuredEmail);
  return json({ token: await makeSession(owner, env), user: { id: owner.id, tenant_id: owner.tenant_id, name: owner.name, email: owner.email, role: 'owner', active: owner.active } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      await ensureTables(env);
      await ensureLegacyCompatibility(env);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type, Authorization' } });
      if (url.pathname === '/api/auth/signup' && request.method === 'POST') return await signup(request, env);
      if (url.pathname === '/api/auth/login' && request.method === 'POST') return await login(request, env);
      if (url.pathname === '/api/auth/totp/login' && request.method === 'POST') return await totpLogin(request, env);
      if (url.pathname === '/api/auth/totp/status' && request.method === 'GET') return await totpStatus(request, env);
      if (url.pathname === '/api/auth/totp/enroll' && request.method === 'POST') return await totpEnroll(request, env);
      if (url.pathname === '/api/auth/totp/confirm' && request.method === 'POST') return await totpConfirm(request, env);
      if (url.pathname === '/api/auth/totp/disable' && request.method === 'POST') return await totpDisable(request, env);
      if (url.pathname === '/api/auth/me' && request.method === 'GET') { const user = await auth(request, env); return user ? json({ user }) : json({ detail: 'Not authenticated.' }, 401); }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') return json({ ok: true });
      if (url.pathname === '/api/auth/audit' && request.method === 'GET') { const owner = await auth(request, env); if (!owner || owner.role !== 'owner') return json({ detail: 'Owner access required.' }, 401); const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 500); const { results } = await env.DB.prepare('SELECT id,user_id,tenant_id,email,event,success,created_at FROM auth_events ORDER BY id DESC LIMIT ?').bind(limit).all(); return json({ events: results || [] }); }
      if (url.pathname.startsWith('/api/admin/')) {
        if (url.pathname === '/api/admin/login' && request.method === 'POST') return await adminLogin(request, env);
        const user = await auth(request, env); if (!user || user.role !== 'owner') return json({ detail: 'Owner access required' }, 401);
        if (url.pathname === '/api/admin/settings' && request.method === 'GET') { const { results } = await env.DB.prepare('SELECT key,value FROM settings').all(); const data = Object.fromEntries(results.map(r => [r.key, r.value])); return json({ site_name: data.site_name || 'I AM Magnanimous AI Platform', tagline: data.tagline || 'Free AI tools, Magnanimous AI orchestration, and creator tools in one place.', canva_url: data.canva_url || '' }); }
        if (url.pathname === '/api/admin/settings' && request.method === 'PUT') { const b = await request.json(); const entries = [['site_name', b.site_name || 'I AM Magnanimous AI Platform'], ['tagline', b.tagline || ''], ['canva_url', b.canva_url || '']]; for (const [k,v] of entries) await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,String(v)).run(); return json({ ok: true }); }
        if (url.pathname === '/api/admin/ads' && request.method === 'GET') { const { results } = await env.DB.prepare('SELECT id,title,url,label,placement,active FROM ads ORDER BY id DESC').all(); return json({ ads: results }); }
        if (url.pathname === '/api/admin/ads' && request.method === 'POST') { const b = await request.json(); const r = await env.DB.prepare('INSERT INTO ads(title,url,label,placement,active,created_at) VALUES(?,?,?,?,?,?)').bind(String(b.title||''),String(b.url||''),String(b.label||'Sponsored'),String(b.placement||'home'),b.active?1:0,now()).run(); return json({ id:r.meta.last_row_id },201); }
        const m=url.pathname.match(/^\/api\/admin\/ads\/(\d+)$/); if(m&&request.method==='DELETE'){await env.DB.prepare('DELETE FROM ads WHERE id=?').bind(Number(m[1])).run();return json({ok:true});}
      }
      return providerApp.fetch(request, env, ctx);
    } catch (e) {
      return unhandledRequestFailure(request,e);
    }
  }
};