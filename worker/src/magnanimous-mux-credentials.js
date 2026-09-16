import { getProviderRuntimeEnv } from './provider-runtime-env.js';

const encoder=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
export const MUX_CREDENTIAL_FIELDS=Object.freeze([
  {key:'MUX_TOKEN_ID',label:'Mux Access Token ID',secret:false},
  {key:'MUX_TOKEN_SECRET',label:'Mux Access Token Secret',secret:true},
  {key:'MUX_DATA_ENV_KEY',label:'Mux Data Environment Key',secret:false},
  {key:'MUX_WEBHOOK_SECRET',label:'Mux Webhook Signing Secret',secret:true}
]);
const ALLOWED=new Set(MUX_CREDENTIAL_FIELDS.map(item=>item.key));
function b64(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
function fromB64(value){const raw=atob(value);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function sessionSecret(env){const direct=String(env?.SESSION_SECRET||'').trim();if(direct)return direct;if(!env?.DB)return'';const row=await env.DB.prepare("SELECT value FROM auth_config WHERE key='session_secret'").first();return String(row?.value||'')}
async function vaultKey(env){const source=String(env?.INTEGRATION_CREDENTIALS_KEY||await sessionSecret(env)||'').trim();if(!source)throw new Error('Platform credential encryption is not available.');const digest=await crypto.subtle.digest('SHA-256',encoder.encode(`iam-platform-credentials-v1:${source}`));return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function encrypt(value,env){const iv=crypto.getRandomValues(new Uint8Array(12)),key=await vaultKey(env),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(String(value)));return`enc1.${b64(iv)}.${b64(new Uint8Array(cipher))}`}
async function decrypt(value,env){const raw=String(value||'');if(!raw.startsWith('enc1.'))return raw;const[,ivPart,cipherPart]=raw.split('.'),key=await vaultKey(env),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(ivPart)},key,fromB64(cipherPart));return new TextDecoder().decode(plain)}
async function ensureTables(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credentials (credential_key TEXT PRIMARY KEY,encrypted_value TEXT NOT NULL,updated_at INTEGER NOT NULL,updated_by TEXT NOT NULL DEFAULT '')`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS platform_credential_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,actor_user_id TEXT NOT NULL,credential_key TEXT NOT NULL,action TEXT NOT NULL,created_at INTEGER NOT NULL)`).run();
}

export async function getMuxRuntimeEnv(env){
  const merged=await getProviderRuntimeEnv(env);
  if(!env?.DB)return merged;
  try{
    await ensureTables(env);
    const placeholders=[...ALLOWED].map(()=>'?').join(',');
    const {results=[]}=await env.DB.prepare(`SELECT credential_key,encrypted_value FROM platform_credentials WHERE credential_key IN (${placeholders})`).bind(...ALLOWED).all();
    for(const row of results){
      if(typeof merged[row.credential_key]==='string'&&merged[row.credential_key].trim())continue;
      merged[row.credential_key]=await decrypt(row.encrypted_value,env);
    }
  }catch(error){console.error('Mux credential runtime load failed',error)}
  return merged;
}

export async function muxCredentialStatus(env){
  const runtime=await getMuxRuntimeEnv(env);
  return MUX_CREDENTIAL_FIELDS.map(field=>({key:field.key,label:field.label,secret:field.secret,configured:Boolean(String(runtime[field.key]||'').trim())}));
}

export async function setMuxCredential(env,user,key,value){
  if(!ALLOWED.has(key))throw new Error('Credential key is not allowed.');
  if(!String(value||'').trim())throw new Error('Credential value is required.');
  await ensureTables(env);
  const encrypted=await encrypt(String(value).trim(),env),ts=now(),actor=String(user?.id||'owner');
  await env.DB.prepare('INSERT INTO platform_credentials (credential_key,encrypted_value,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(credential_key) DO UPDATE SET encrypted_value=excluded.encrypted_value,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(key,encrypted,ts,actor).run();
  await env.DB.prepare('INSERT INTO platform_credential_audit (actor_user_id,credential_key,action,created_at) VALUES (?,?,?,?)').bind(actor,key,'set',ts).run();
}

export async function deleteMuxCredential(env,user,key){
  if(!ALLOWED.has(key))throw new Error('Credential key is not allowed.');
  await ensureTables(env);const ts=now(),actor=String(user?.id||'owner');
  await env.DB.prepare('DELETE FROM platform_credentials WHERE credential_key=?').bind(key).run();
  await env.DB.prepare('INSERT INTO platform_credential_audit (actor_user_id,credential_key,action,created_at) VALUES (?,?,?,?)').bind(actor,key,'delete',ts).run();
}
